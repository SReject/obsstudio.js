(function () {

    // Ease-of-use function for determining if an object has the specified
    // property
    function hasKey(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
    }

    var obs                   = window.obsstudio || {},
        obsOnVisibilityChange = obs.onVisibilityChange,
        obsGetCurrentScene    = obs.getCurrentScene,
        eventHandlers         = {},
        currentScene          = {},
        visible               = null,
        ready                 = false;

    obs.extensionVersion = '0.0.1';

    /** @description Adds an event listener
     ** @access public
     ** @param evt as String   : Required : Event name to listen for
     ** @param fnc as Function : Required : Function to call when the event is emitted
     ** @param once as Boolean : Optional : If true, the handler will be removed after the event is next triggered
     ** @returns <Object:obs>
     */
    obs.on = function (evt, fnc, once) {

        // validate arguments
        if (typeof evt !== 'string' || !evt) {
            throw new Error('Invalid event name');
        }
        if (typeof fnc !== 'function' || !fnc) {
            throw new Error('Invalid event handling function');
        }
        if (once !== undefined && typeof once !== 'boolean') {
            throw new Error('Invalid once parameter');
        }

        // if the specified event is 'ready'
        if (evt === 'ready') {

            // if the ready event has already fired, call the handler function
            if (ready) {
                setTimeout(fnc, 0);
                return obs;
            }

            // otherwise set the once property to true, so the handler is removed
            // once the ready event has fired
            once = true;
        }

        // if there's not a list of handlers for the specified event
        // create one
        if (!hasKey(eventHandlers, evt)) {
            eventHandlers[evt] = [];
        }

        // add the handler to the event's list
        eventHandlers[evt].push({
            callback: fnc,
            once: once
        });

        // return the obs instance for call-chaining
        return obs;
    };

    /** @description Removes the first matching event handler
     ** @access public
     ** @param evt as String   : Required : Event name to remove the handler from
     ** @param fnc as Function : Required : The exact function used to as the handler's callback
     ** @param once as Boolean : Optional : Must match the value given when the handler was created
     ** @returns <Object:obs>
     */
    obs.off = function (evt, fnc, once) {

        // validate arguments
        if (typeof evt !== 'string' || !evt) {
            throw new Error('Invalid event name');
        }
        if (typeof fnc !== 'function' || !fnc) {
            throw new Error('Invalid event handling function');
        }
        if (once !== undefined && typeof once !== 'boolean') {
            throw new Error('Invalid once parameter');
        }

        // Check to make sure the specified event has atleast one event handler
        if (hasKey(eventHandlers, evt) && Array.isArray(eventHandlers[evt]) && eventHandlers[evt].length) {
            var i = 0, handlers = eventHandlers[evt];

            // loop over the list of handlers for the specified event. If
            // the handler in the list matches the one specified via
            // arguments, remove it from the list then exit looping
            while (i < handlers.length) {
                if (handlers[i].callback === fnc && handlers[i].once === once) {
                    handlers.splice(i, 1);
                    break;
                }
                i += 1;
            }

            // if the event's handler list is empty, delete the list
            if (handlers.length === 0) {
                delete eventHandlers[evt];
            }

        // if the event doesn't have any handlers, the handler list isn't an
        // array, or the array is empty delete the event list
        } else {
            delete eventHandlers[evt];
        }

        // return the obs instance for call chaining
        return obs;
    };

    /** @description alias for obs.on(..., ..., true)
     ** @access public
     ** @param evt as String   : Required : Event name to listen for
     ** @param fnc as Function : Required : Function to call when the event is emitted
     ** @returns <Object:obs>
     */
    obs.once = function (evt, fnc) {
        return obs.on(evt, fnc, true);
    };

    /** @description Alias for obs.off(..., ..., true)
     ** @access public
     ** @param evt as String   : Required : Event name to remove the handler from
     ** @param fnc as Function : Required : The exact function used to as the handler's callback
     ** @returns <Object:obs>
     */
    obs.onceOff = function (evt, fnc) {
        return obs.off(evt, fnc, true);
    };

    /** @description Calls event emitters for the specified event
     ** @access public
     ** @param evt as String : Required : Event name to call event handlers for
     ** @param data          : Optional : data to be passed to the event handler
     ** @returns <Object:obs>
     */
    obs.emit = function (evt, data) {
        // validate arguments; since the data argument can be anything
        // theres no reason to validate it
        if (typeof evt !== 'string' || !evt) {
            throw new Error('Invalid event name');
        }

        // Make sure the event has handlers
        if (hasKey(eventHandlers, evt) && Array.isArray(eventHandlers[evt]) && eventHandlers[evt].length) {

            var handlers  = eventHandlers[evt],
                i         = 0,
                callbacks = [],
                stop      = false;

            // loop over all handlers for the event
            while (i < handlers.length) {

                // add the handler to callbacks to be called
                callbacks.push(handlers[i].callback);

                // if the handler is only to be called once, remove it from
                // the event's handler list
                if (handlers[i].once) {
                    handlers.splice(i, 1);

                // otherwise increase the index to move to the next item
                } else {
                    i += 1;
                }
            }

            // if all handlers were removed from the event's handler list
            // delete the handler list
            if (!handlers.length) {
                delete eventHandlers[evt];
            }

            // check to make sure there are handler functions to call
            if (callbacks.length) {

                // start a timeout so each event executes outside the main
                // processing loop so thrown errors do not halt this execution
                // or the execution of other handlers
                setTimeout(function callNextHandler() {


                    // if the stop variable, declared above, is still false
                    // process the next handler
                    if (!stop) {

                        var handler = callbacks.shift(),
                            evtData = {

                                // command passed to the event handler that
                                // when called from the callback will stop
                                // further callback processing for the
                                //current triggering of the event
                                stop: function () { stop = true; }
                            };

                        // If there's data to be passed to the event, clone
                        // it and add it to the event data
                        if (data !== undefined) {
                            evtData.data = JSON.parse(JSON.stringify(data));
                        }

                        // if there's still more handlers, start a timeout
                        // to handle them
                        if (callbacks.length) {
                            setTimeout(callNextHandler, 0);
                        }

                        // call the current handler function
                        handler.call(obs, evtData);
                    }
                }, 0);
            }
        } else {
            delete eventHandlers[evt];
        }

        // return obs instance
        return obs;
    };

    /** @description Retrieves the current scene
     ** @access public
     ** @returns <Object:scene>
     */
    // This overwrites the obsstudio's getCurrentScene function
    obs.getCurrentScene = function () {
        if (ready) {
            return JSON.parse(JSON.stringify(currentScene || '{}'));
        }
        throw new Error('OBS-Studio BrowerSource Extension not ready');
    };

    /** @description Returns the state of visibility for the BrowserSource
     ** @access public
     ** @returns Boolean
     */
    obs.isVisible = function () {
        if (ready) {
            return visible;
        }
        throw new Error('OBS-Studio BrowerSource Extension not ready');
    };

    /** @description Returns the state of readiness of the obs exension
     ** @access public
     ** @returns Boolean
     */
    obs.isReady = function () {
        return ready;
    };

    // if running through OBS BrowserSource
    if (window.obsstudio) {

        // wrap handling in a function so as not to leak variables and such
        // needlessly
        (function () {

            // Register obs specific event hooks that occur on the window, so they
            // are emitted through the extended obsstudio instance
            [
                {name: 'obsStreamingStarting', custom: 'streamStarting'},
                {name: 'obsStreamingStarted',  custom: 'streamStarted'},
                {name: 'obsStreamingStopping', custom: 'streamStopping'},
                {name: 'obsStreamingStopped',  custom: 'streamStopped'},
                {name: 'obsRecordingStarting', custom: 'recordStarting'},
                {name: 'obsRecordingStarted',  custom: 'recordStarting'},
                {name: 'obsRecordingStopping', custom: 'recordStopping'},
                {name: 'obsRecordingStopped',  custom: 'recordStopped'}
            ].forEach(function (evtName) {

                // register the event on the window object
                window.addEventListener(evtName.name, function (evt) {
                    // stop propagation; scripts should be using window.obsstudio.on()
                    // to capture obs events
                    evt.stopPropagation();

                    // Emit the event on the obsstudio instance
                    obs.emit(evtName.custom, evt.detail);
                });
            });

            // Register onVisibilityChange handler
            obs.onVisibilityChange = function (state) {
                visible = state;
                obs.emit('visibilityChange', state);
            };

            // catch scene state changes
            window.addEventListener('obsSceneChanged', function (evt) {

                // stop propagation; scripts should be using window.obsstudio.on()
                // to capture obs events
                evt.stopPropagation();

                // store the previous scene in the event details
                evt.detail.previousScene = currentScene;

                // update the current scene
                currentScene = evt.detail;

                // if obs has already triggered the ready event
                // emit the sceneChange event
                if (ready) {
                    obs.emit('sceneChange', evt.detail);

                // otherwise emit the ready event
                } else {
                    obs.emit('ready');
                }
            });
            // register the scene change callback handler
            obsGetCurrentScene(function (scene) {
                // BrowserSource bug fix: scene is a JSON string that needs to be parsed
                scene = JSON.parse(scene);

                // if the ready event has not yet been emitted: emit it
                if (!ready) {
                    ready = true;
                    currentScene = scene;
                    obs.emit('ready');
                }
            });
        }());

    // if running in a normal browser; polyfill various functionality
    } else {

        // wrap in a function so as not to leak variables needlessly
        (function () {

            // function to make handling location.hash easier
            function getParamsFromHash() {
                var hash = location.hash.substring(1),
                    regex = /(?:^|&)([^&=]+)(?:=([^&]*))?(?=&|$)/g,
                    match, name, value, params = {};

                if (hash) {
                    while (!!(match = regex.exec(hash))) {
                        name = decodeURIComponent(match[1]);
                        value = decodeURIComponent(match[2]);
                        if (!hasKey(params, name)) {
                            params[name] = value;
                        } else if (Array.isArray(params[name])) {
                            params[name].push(value);
                        } else {
                            params.name = [params[name], value];
                        }
                    }
                }
                return params;
            }

            function processHash() {
                var params = getParamsFromHash(), evt, evtDetails;

                // check to make sure the hash has an event. If not, throw an error
                if (!hasKey(params, 'event') || typeof params.event !== 'string' || !params.event) {
                    throw new Error('location.hash missing or has invalid event parameter');
                }

                if (params.event !== 'init' && !ready) {
                    throw new Error('init event not called');
                }

                switch (params.event) {
                    case 'init':
                        // if already initialized
                        if (ready) {
                            throw new Error('init event already raised');
                        }

                        // validate scene parameter
                        if (!hasKey(params, 'scene') || typeof params.scene !== 'string' || !params.scene.length) {
                            throw new Error('init event missing scene');
                        }

                        // validate width parameter
                        if (!hasKey(params, 'width') || typeof params.width !== 'string' || !params.width.length || isNaN(params.width)) {
                            throw new Error('init event missing scene');
                        }

                        // validate height parameter
                        if (!hasKey(params, 'height') || typeof params.height !== 'string' || !params.height.length || isNaN(params.height)) {
                            throw new Error('init event missing scene');
                        }

                        // update state variables
                        currentScene = {name: params.scene, width: Number(params.width), height: Number(params.height)};
                        ready = true;

                        // emit event
                        obs.emit('ready');
                        break;

                    case 'sceneChange':
                        // validate scene parameter
                        if (!hasKey(params, 'scene') || typeof params.scene !== 'string' || !params.scene.length) {
                            throw new Error('init event missing scene');
                        }

                        // validate width parameter
                        if (!hasKey(params, 'width') || typeof params.width !== 'string' || !params.width.length || isNaN(params.width)) {
                            throw new Error('init event missing scene');
                        }

                        // validate height parameter
                        if (!hasKey(params, 'height') || typeof params.height !== 'string' || !params.height.length || isNaN(params.height)) {
                            throw new Error('init event missing scene');
                        }
                        // compile event details
                        evtDetails = {name: params.scene, width: Number(params.width), height: Number(params.height), previousScene: currentScene};

                        // update state
                        currentScene = {name: params.scene, width: Number(params.width), height: Number(params.height)};

                        // emit event
                        obs.emit('sceneChange', evtDetails);
                        break;

                    case 'visibilityChange':
                        if (!hasKey(params, 'state') || typeof params.state !== 'string') {
                            throw new Error('visibilityChange event missing state parameter');
                        }
                        params.state = params.state.toLowerCase();

                        // convert boolean and number values
                        if (params.state === 'true') {
                            params.state = true;
                        } else if (params.state === 'false') {
                            params.state = false;
                        } else if (!isNaN(params.state)) {
                            params.state = Number(params.state);
                        }

                        if (visible === !(params.state)) {
                            visible = !!(params.state);
                            obs.emit(visibilityChange);
                        }
                        break;

                    case 'streamingStarting':
                        obs.emit('streamStarting');
                        break;

                    case 'streamingStarted':
                        obs.emit('streamStarted');
                        break;

                    case 'streamingStopping':
                        obs.emit('streamStopping');
                        break;

                    case 'streamingStopped':
                        obs.emit('streamStopped');
                        break;

                    case 'recordingStarting':
                        obs.emit('recordStarting');
                        break;

                    case 'recordingStarted':
                        obs.emit('recordStarted');
                        break;

                    case 'recordingStopping':
                        obs.emit('recordStopping');
                        break;

                    case 'recordingStopped':
                        obs.emit('recordStopped');
                        break;

                    default:
                        throw new Error('unknown event');

                }
            }
            // call processHash then pass the function as the event handler
            window.addEventListener('hashchange', processHash() || processHash);
        }());
    }

    // freeze the updated obs object and overwrite the pre-existing obsstudio
    window.obsstudio = Object.freeze(obs);
}());
