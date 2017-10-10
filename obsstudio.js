/* obsstudio.js
** License: MIT - Copyright (c) 2017 SReject
*/
(function (isCallable) {
    'use strict';

    // Reflections
    const owns = Object.prototype.hasOwnProperty;
    const obs  = window.obsstudio;

    // State variables
    const eventHandlers = {};
    const getCurrentScene = obs.getCurrentScene;
    let isReady = false;
    let isActive = null;
    let isVisible = -1;
    let streamingState = -1;
    let recordingState = -1;
    let scene = {
        width: -1,
        height: -1,
        name: null
    };

    // Custom obs-raised event class
    function OBSEvent(type, data) {
        Object.defineProperties(this, {
            cancelable: {
                enumerable: true,
                value: true
            },
            canceled: {
                writable: true,
                value: false
            },
            data: {
                enumerable: true,
                value: data
            },
            eventPhase: {
                enumerable: true,
                value: 2
            },
            isTrusted: {
                enumerable: true,
                value: false
            },
            type: {
                enumerable: true,
                value: type
            }
        });
    }
    Object.defineProperty(OBSEvent.prototype, "stopPropagation", {
        value: function stopPropagation() {
            var desc = Object.getOwnPropertyDescriptor(this, 'canceled') || {};
            if (desc.writable == true) {
                Object.defineProperty(this, 'canceled', {
                    writable: false,
                    value: true
                });
            }
        }
    });
    Object.defineProperty(OBSEvent.prototype, "stopImmediatePropagation", {
        value: function stopImmediatePropagation() {
            this.stopPropagation();
        }
    });
    function emit(type, data) {
        if (owns.call(eventHandlers, type)) {
            let event = new OBSEvent(type, data);
            let handlers = eventHandlers[type];
            let idx = 0;

            while (idx < handlers.length) {
                let handler = handlers[idx];
                handler.callback(event);
                if (event.canceled)
                    break;

                if (handler.once)
                    handlers.splice(idx, 1);

                else
                    idx += 1;
            }
        }
    }
    function handleObsEvent(evt) {
        let name = "";
        let data = null;
        switch (evt.type) {
            case 'obsExit':
                name = 'exit';
                data = undefined;
                break;
            case 'obsStreamingStarting':
                name = 'streamingState';
                data = streamingState = obs.state.STARTING;
                break;
            case 'obsStreamingStarted':
                name = 'streamingState';
                data = streamingState = obs.state.STARTED;
                break;
            case 'obsStreamingStopping':
                name = 'streamingState';
                data = streamingState = obs.state.STOPPING;
                break;
            case 'obsStreamingStopping':
                name = 'streamingState';
                data = streamingState = obs.state.INACTIVE;
                break;
            case 'obsRecordingStarting':
                name = 'recordingState';
                data = recordingState = obs.state.STARTING;
                break;
            case 'obsRecordingStarted':
                name = 'recordingState';
                data = recordingState = obs.state.STARTED;
                break;
            case 'obsRecordingStopping':
                name = 'recordingState';
                data = recordingState = obs.state.STOPPING;
                break;
            case 'obsRecordingStopping':
                name = 'recordingState';
                data = recordingState = obs.state.INACTIVE;
                break;
            case 'obsSceneChanged':
                let currentScene = {};
                let previousScene = Object.freeze({
                    name: scene.name,
                    width: scene.width,
                    height: scene.height
                });
                scene.name   = evt.detail.name;
                scene.width  = evt.detail.width;
                scene.height = evt.detail.height;
                if (isReady) {
                    name = 'sceneChange';
                    data = previousScene;
                    break;
                }
                isReady = true;
                name = 'ready';
        }
        emit(name, data);

        if (evt.stopImmediatePropagation) evt.stopImmediatePropagation();
        if (evt.stopPropagation) evt.stopPropagation();
    }

    // capture obs-specific events emitted on the window instance and redirect
    // them to the obsstudio object instance
    window.addEventListener('obsStreamingStarting', handleObsEvent);
    window.addEventListener('obsStreamingStarted',  handleObsEvent);
    window.addEventListener('obsStreamingStopping', handleObsEvent);
    window.addEventListener('obsStreamingStopped',  handleObsEvent);
    window.addEventListener('obsRecordingStarting', handleObsEvent);
    window.addEventListener('obsRecordingStarted',  handleObsEvent);
    window.addEventListener('obsRecordingStopping', handleObsEvent);
    window.addEventListener('obsRecordingStopped',  handleObsEvent);
    window.addEventListener('obsSceneChanged',      handleObsEvent);
    window.addEventListener('obsExit',              handleObsEvent);


    /** @desc Make obsstudio.pluginVersion readonly
     ** @readonly
     ** @static
     ** @access public
     ** @var {String} obsstudio.pluginVersion
     */
    Object.defineProperty(obs, 'pluginVersion', {
        configurable: false,
        writable: false,
        enumerable: true,
        value : obs.pluginVersion
    });

    /** @desc Current version of obsstudio.js
     ** @readonly
     ** @static
     ** @access public
     ** @var {String} obsstudio.obsstudiojsVersion
     */
    Object.defineProperty(obs, 'obsstudiojsVersion', {
        enumerable: true,
        value : '0.0.8'
    });

    /** @desc Current version of obsstudio.js
     ** @readonly
     ** @static
     ** @access public
     ** @deprecated as of 0.0.8
     ** @var {String} obsstudio.extensionsVersion
     */
     Object.defineProperty(obs, 'extensionsVersion', { enumerable: true, get: () => obs.obsstudiojsVersion });

     /** @desc true|false dependant on if obsstudio.js is ready
      ** @readonly
      ** @static
      ** @access public
      ** @var {Boolean} obsstudio.isReady
      */
     Object.defineProperty(obs, 'isReady', { enumerable: true, get: () => isReady });

    /** @desc true|false if the BrowserSource is active; null if the state is unknown
     ** @readonly
     ** @static
     ** @access public
     ** @var {Boolean|Null} obsstudio.isActive
     */
    Object.defineProperty(obs, 'isActive', { enumerable: true, get: () => isActive });

    /** @desc true|false if the BrowserSource is visible; null if the state is unknown
     ** @readonly
     ** @static
     ** @access public
     ** @var {Boolean|Null} obsstudio.isVisible
     */
    Object.defineProperty(obs, 'isVisible', { enumerable: true, get: () => isVisible });

    /** @desc Current state of streaming
     ** @readonly
     ** @static
     ** @var {obsstudio.state} obsstudio.streamingState
     ** @access public
     */
    Object.defineProperty(obs, 'streamingState', { enumerable: true, get: () => streamingState });

    /** @desc Current state of recording
     ** @readonly
     ** @static
     ** @access public
     ** @var {obsstudio.state} obsstudio.streamingState
     */
    Object.defineProperty(obs, 'recordingState', { enumerable: true, get: () => recordingState });

    /** @desc Current scene name
     ** @readonly
     ** @static
     ** @access public
     ** @var {String} obstudio.sceneName
     */
    Object.defineProperty(obs, 'sceneName', { enumerable: true, get: () => scene.name });

    /** @desc Current scene width
     ** @readonly
     ** @static
     ** @access public
     ** @var {Number} obstudio.sceneWidth
     */
    Object.defineProperty(obs, 'sceneWidth', { enumerable: true, get: () => scene.width });

    /** @desc Current scene height
     ** @readonly
     ** @static
     ** @access public
     ** @var {Number} obstudio.sceneHeight
     */
    Object.defineProperty(obs, 'sceneHeight', { enumerable: true, get: () => scene.height });

    /** @desc Current scene information
     ** @readonly
     ** @static
     ** @access public
     ** @var {Object} obstudio.currentScene
     */
    Object.defineProperty(obs, 'currentScene', {
        enumerable: true,
        get: () => { return {name: scene.name, width: scene.width, height: scene.height} }
    });

    /** @desc Override the obsstudio object's getCurrentScene function and make the replacement readonly
     ** @desc This is done to be more homogeneous with modern practices
     ** @readonly
     ** @static
     ** @override
     ** @access public
     ** @var {Function} obstudio.state
     ** @param {Undefined|Function} callbackFN - The callback function to call with the current scene
     */
    Object.defineProperty(obs, 'getCurrentScene', {
        value: callbackFn => {
            if (!callbackFn)
                return obs.currentScene;

            if (isCallable(callbackFn))
                callbackFn(obs.currentScene);

            else
                throw new TypeError('callbackFn is not a function');
        }
    });

    /** @desc Recording|Streaming state enum
     ** @readonly
     ** @static
     ** @enum
     ** @access public
     ** @var {Object.Number} obstudio.state
     */
    Object.defineProperty(obs, 'state', {
        value: Object.freeze({
            "UNKNOWN": -1,
            "INACTIVE": 0,
            "STARTING": 1,
            "STARTED":  2,
            "STOPPING": 3
        })
    });

    /** @desc Recording|Streaming state enum
     ** @readonly
     ** @static
     ** @enum
     ** @deprecated as of 0.0.8; use obsstudio.state
     ** @access public
     ** @var {Object.Number} obstudio.state
     */
    Object.defineProperty(obs, 'STATE', { get: () => obsstudio.state });

    /** @desc Provide own onActiveChange callback
     ** @desc Overrides the obsstudio object's default behavior; this is done to be more homogeneous with modern practices
     ** @readonly
     ** @static
     ** @override
     ** @access public
     ** @fires activeChange
     ** @var {Function} obsstudio.onActiveChange
     ** @param {Function} handler - Adds the handler as an activeChange event handler
     */
    Object.defineProperty(obs, 'onActiveChange', {
        enumerable: false,
        get: (active) => {
            isActive = active;
            emit('activeChange', active);
        },
        set: (handler) => obs.on('activeChange', handler)
    });

    /** @desc Provide own onVisibilityChange callback
     ** @desc Overrides the obsstudio object's default behavior; this is done to be more homogeneous with modern practices
     ** @readonly
     ** @static
     ** @override
     ** @access public
     ** @fires visibilityChange
     ** @var {Function} obstudio.onVisibilityChange
     ** @param {Function} handler - Adds the handler as an visibility event handler
     */
    Object.defineProperty(obs, 'onVisibilityChange', {
        enumerable: false,
        get: (visible) => {
            isVisible = visible;
            emit('visibilityChange', visible);
        },
        set: (handler) => obs.addEventListener('visibilityChange', handler)
    });

    /** @desc Provide own onSceneChange callback
     ** @desc Overrides the obsstudio object's default behavior; this is done to be more homogeneous with modern practices
     ** @readonly
     ** @static
     ** @override
     ** @access public
     ** @fires visibilityChange
     ** @var {Function} obstudio.onSceneChanged
     ** @param {Function} handler - Adds the handler as a sceneChange event handler
     */
    Object.defineProperty(obs, 'onSceneChange', {
        enumerable: false,
        set: (handler) => obs.addEventListener('sceneChange', handler)
    });

    /** @desc Registers an event handler
     ** @readonly
     ** @static
     ** @access public
     ** @var {Function} obstudio.addEventListener
     ** @param {String} name - the event name of which to listen
     ** @param {Function} handler - The function to call when the event is emitted
     ** @param {Boolean|Object} options - if true or options.once is true, the handler will be added as a one-type event listener
     */
    Object.defineProperty(obs, 'addEventListener', {
        value: (type, listener, options) => {
            if (typeof type !== "string")
                throw new TypeError("event type not a string");

            if (typeof listener !== "function" || !isCallable(listener))
                throw new TypeError("listener not a function");

            if (!owns.call(eventHandlers, type))
                eventHandlers[type] = [];

            eventHandlers[type].push({
                callback: listener,
                once: typeof options === 'boolean' ? options : options ? options.once : undefined
            });
        }
    });

    /** @desc Reflection of obsstudio.addEventListener
     ** @readonly
     ** @static
     ** @access public
     ** @var {Function} obstudio.on
     ** @param {String} name - the event name of which to listen
     ** @param {Function} handler - The function to call when the event is emitted
     ** @param {Boolean|Object} options - if true or options.once is true, the handler will be added as a one-type event listener
     */
    Object.defineProperty(obs, 'on', {
        value: function () { return obs.addEventListener.apply(null, arguments) }
    });

    /** @desc Registers a one-time event handler
     ** @readonly
     ** @static
     ** @access public
     ** @var {Function} obstudio.once
     ** @param {String} name - the event name of which to listen
     ** @param {Function} handler - The function to call when the event is emitted
     */
    Object.defineProperty(obs, 'once', {
        value: (type, listener) => obs.addEventListener(type, listener, true)
    });

    /** @desc Removes a registered event handler. All parameters must match those used to register the event handler
     ** @readonly
     ** @static
     ** @access public
     ** @var {Function} obstudio.removeEventListener
     ** @param {String} name
     ** @param {Function} handler
     ** @param {Boolean|Object} options
     */
    Object.defineProperty(obs, 'removeEventListener', {
        value: function removeEventListener(type, listener, options) {
            if (typeof type !== "string" || !(type instanceof String))
                throw new TypeError("event type not a string");

            if (typeof listener !== "function" || !isCallable(listener))
                throw new TypeError("listener not a function");

            if (owns.call(eventHandlers, type)) {
                let once = typeof options === 'boolean' ? options : options ? options.once : undefined;
                let idx = eventHandlers[type].find(handler => (handler.callback === listener && handler.once === once));
                if (idx)
                    eventHandlers[type].splice(idx, 1);
            }
        }
    });

    /** @desc Reflection of obsstudio.removeEventListener
     ** @readonly
     ** @static
     ** @access public
     ** @var {Function} obstudio.off
     ** @param {String} name
     ** @param {Function} handler
     ** @param {Boolean|Object} options
     */
    Object.defineProperty(obs, 'off', {
        value: function () { return obs.removeEventListener.apply(null, arguments) }
    });

    /** @desc Removes a registered one-time event handler. All parameters must match those used to register the event handler
     ** @readonly
     ** @static
     ** @access public
     ** @var {Function} obstudio.offonce
     ** @param {String} name
     ** @param {Function} handler
     */
    Object.defineProperty(obs, 'offonce', {
        value: (type, listener) => obs.removeEventListener(type, listener, true)
    });



    Object.freeze(obs);

    getCurrentScene((currentScene) => {
        // Bug Fix: https://github.com/kc5nra/obs-browser/issues/72 #1
        if (typeof currentScene === 'string') {
            currentScene = JSON.parse(currentScene);
        }
        scene.name   = currentScene.name;
        scene.width  = currentScene.width;
        scene.height = currentScene.height;
        isReady      = true;
        emit('ready');
    });

}(function () {
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
}()));
