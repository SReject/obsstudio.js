(function (obs, isCallable) {

    // if the obs instance exists, there's no need to make an abstraction
    if (obs) return

    // Attempt to reference an unaltered hasOwnProperty
    const owns = Object.prototype.hasOwnProperty;

    // Current scene defaults; updated with hash changes
    const scene  = {
        name: "default",
        width: 1024,
        height: 720
    };

    function parseHash() {
        let hash = location.hash.substring(1),
            regex = /(?:^|&)([^&=]+)(?:=([^&]*))?(?=&|$)/g,
            match,
            name,
            value,
            params = {};

        // no hash check
        if (!hash) {
            console.warn("[obsabstraction - hash] Ignoring hash: empty");
            return;
        }

        // grab key=value pairs from the hash
        while (!!(match = regex.exec(hash))) {
            name = decodeURIComponent(match[1]).toLowerCase();
            value = decodeURIComponent(match[2]);
            if (owns.call(params, name)) {
                console.warn("[obsabstraction - hash] Ignoring hash: duplicate keys");
                return
            }

            // store the key-value pair
            params[name] = value;
        }

        // Insure the obsevent parameter is valid
        if (!owns.call(params, 'obsevent') || typeof params.obsevent !== 'string' || params.obsevent == "") {
            console.warn("[obsabstraction - hash] Ignoring hash: missing obsevent parameter");
            return;
        }

        return params;
    }

    /**
     * @desc Processes the url hashtag
     * @access private
     * @readonly
     */
    const processHash = () => {
        let params = parseHash(),
            evt,
            evtDetails;

        if (params === undefined) {
            return;
        }

        // Raise the specified event
        switch (params.obsevent.toLowerCase()) {
            case 'obsexit':
                window.dispatchEvent(new Event('obsExit'));
                break;
            case 'obsstreamingstarting':
                window.dispatchEvent(new Event('obsStreamingStarting'));
                break;
            case 'obsstreamingstarted':
                window.dispatchEvent(new Event('obsStreamingStarted'));
                break;
            case 'obsstreamingstopping':
                window.dispatchEvent(new Event('obsStreamingStopping'));
                break;
            case 'obsstreamingstopped':
                window.dispatchEvent(new Event('obsStreamingStopped'));
                break;
            case 'obsrecordingstarting':
                window.dispatchEvent(new Event('obsRecordingStarting'));
                break;
            case 'obsrecordingstarted':
                window.dispatchEvent(new Event('obsRecordingStarted'));
                break;
            case 'obsrecordingstopping':
                window.dispatchEvent(new Event('obsRecordingStopping'));
                break;
            case 'obsrecordingstopped':
                window.dispatchEvent(new Event('obsRecordingStopped'));
                break;
            case 'onvisibilitychange':

                // validate visibility change parameters
                if (!owns.call(params, 'value') || !/^(?:1|0|true|false)$/i.test(params.value)) {
                    console.warn("[obsabstraction - onVisibilityChange] Missing or invalid parameters");
                    console.warn("[obsabstraction - onVisibilityChange] Format: &obsevent=onVisibilityChange&value=[0|1|true|false]");

                // call the onVisibilityChange stored function if it exists
                } else if (isCallable(obstudio.onVisibilityChange)) {
                    obstudio.onVisibilityChange(JSON.parse(params.value.toLowerCase()) ? true : false);
                }
                break;

            case 'onactivechange':
                // validate active change parameters
                if (!owns.call(params, 'value') || !/^(?:1|0|true|false)$/i.test(params.value)) {
                    console.warn("[obsabstraction - onActiveChange] Missing or invalid parameters");
                    console.warn("[obsabstraction - onActiveChange] Format: &obsevent=onActiveChange&value=[0|1|true|false]");

                // call the onActiveChange stored function if it exists
                } else if (isCallable(obstudio.onActiveChange)) {
                    obstudio.onActiveChange(JSON.parse(params.value.toLowerCase()) ? true : false);
                }
                break;

            case 'obsscenechanged':
            case 'onscenechanged':
                // validata parameters
                if (
                    !owns.call(params, 'name')   || params.name === "" ||
                    !owns.call(params, 'width')  || !/^\d+$/.test(params.width) ||
                    !owns.call(params, 'height') || !/^\d+$/.test(params.height)
                ) {
                    console.warn("[obsabstraction - obsSceneChanged] Missing or invalid parameters");
                    console.warn("[obsabstraction - obsSceneChanged] Format: &obsevent=obsSceneChanged&name=[scenename]&width=[width]&height=height");

                } else {

                    // retrieve scene info
                    scene.name = params.name;
                    scene.width = parseInt(params.width, 10);
                    scene.height = parseInt(params.height, 10);

                    // if there's a onSceneChange callback stored, call it
                    if (isCallable(obsstudio.onSceneChanged)) {
                        obsstudio.onSceneChanged({name: scene.name, width: scene.width, height: scene.height});
                    }

                    // dispatch the obsSceneChanged event
                    let rEvent = new Event('obsSceneChanged');
                    rEvent.detail =  {name: scene.name, width: scene.width, height: scene.height};
                    window.dispatchEvent(rEvent);
                }
                break;
        }
    };

    // create an obsstudio object in the window
    window.obsstudio = obs = {
        abstracted: true,
        pluginVersion: '1.30.0',
        obsstudioabstraction: true,
        getCurrentScene: (fnc) => {
            if (isCallable(fnc)) {
                fnc({
                    name: scene.name,
                    width: scene.width,
                    height: scene.height
                });
            }
        }
    };
    window.addEventListener('hashchange', processHash);

    (function() {
        let params = parseHash();
        if (params === undefined) {
            return;
        }
        if (params.obsevent.toLowerCase() == 'obsscenechanged' || params.obsevent.toLowerCase() === 'onscenechanged') {
            // validata parameters
            if (
                !owns.call(params, 'name')   || params.name === "" ||
                !owns.call(params, 'width')  || !/^\d+$/.test(params.width) ||
                !owns.call(params, 'height') || !/^\d+$/.test(params.height)
            ) {
                console.warn("[obsabstraction - obsSceneChanged] Missing or invalid parameters");
                console.warn("[obsabstraction - obsSceneChanged] Format: &obsevent=obsSceneChanged&name=[scenename]&width=[width]&height=height");

            } else {

                // retrieve scene info and store
                scene.name = params.name;
                scene.width = parseInt(params.width, 10);
                scene.height = parseInt(params.height, 10);
            }
        } else {
            setTimeout(processHash, 0);
        }
    }());
}(
    // original obsstudio instance
    window.obsstudio,

    // isCallable function
    function () {
        /* is-callable
           https://raw.githubusercontent.com/ljharb/is-callable/a7ca20d7d1be6afd00f136603c4aaa0dfbc6db2d/index.js
           License: MIT - Copyright (c) 2015 Jordan Harband - Edits by SReject
               https://raw.githubusercontent.com/ljharb/is-callable/0dc214493bf4aee63fc0b825a9823e0702d6d610/LICENSE
        */
        'use strict';
        var toStr = Object.prototype.toString,
            fnToStr = Function.prototype.toString,
            fnClass = '[object Function]',
            genClass = '[object GeneratorFunction]',
            constructorRegex = /^\s*class /,
            isES6ClassFn = function (value) {
                try {
                    var fnStr = fnToStr.call(value);
                    return constructorRegex.test(fnStr.replace(/\/\/.*\n/g, '').replace(/\/\*[.\s\S]*\*\//g, '').replace(/\n/mg, ' ').replace(/ {2}/g, ' '));
                } catch (e) {
                    return false;
                }
            },
            tryFunctionObject = function (value) {
                try {
                    fnToStr.call(value);
                    return true;
                } catch (e) {
                    return false;
                }
            },
            hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
        return function isCallable(value) {
            if (!value || typeof value !== 'function' && typeof value !== 'object' || isES6ClassFn(value)) { return false; }
            if (hasToStringTag) { return tryFunctionObject(value); }
            var strClass = toStr.call(value);
            return strClass === fnClass || strClass === genClass;
        };
    }()
));
