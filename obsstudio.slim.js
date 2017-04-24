/*@license: The MIT License (MIT)

Copyright (c) 2017-, SReject

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
(function () {

    // Ease-of-use function for determining if an object has the specified
    // property
    function hasKey(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
    }

    var obs                   = window.obsstudio || {},
        eventHandlers         = {},
        currentScene          = {}, // scene tracking variable
        visible               = null, // visibility tracking variable
        streamState           = null, // stream-state tracking variable
        recordState           = null, // record-state tracking variable
        ready                 = false; // ready-state tracking variable

    // Add: extension version
    Object.defineProperty(obs, 'extensionVersion', {
        writable: false,
        enumerable: true,
        value: '0.0.7'
    });

    // Add: STATE contants
    Object.defineProperty(obs, 'STATE', {
        writable: false,
        enumerable: true,
        value: Object.freeze({
            INACTIVE: 0,
            STARTING: 1,
            STARTED:  2,
            STOPPING: 3
        })
    });

    // Add: STATEBYINDEX constants
    Object.defineProperty(obs, 'STATEBYINDEX', {
        writable: false,
        enumerable: true,
        value: Object.freeze({
            '0': 'INACTIVE',
            '1': 'STARTING',
            '2': 'STARTED',
            '3': 'STOPPING'
        })
    });

    /** @description Adds an event listener
     ** @access public
     ** @param evt as String   : Required : Event name to listen for
     ** @param fnc as Function : Required : Function to call when the event is emitted
     ** @param once as Boolean : Optional : If true, the handler will be removed after the event is next triggered
     ** @returns <Object:obs>
     */
    Object.defineProperty(obs, 'on', {
        writable: false,
        enumerable: true,
        value: function (evt, fnc, once) {

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
        }
    });

    /** @description Removes the first matching event handler
     ** @access public
     ** @param evt as String   : Required : Event name to remove the handler from
     ** @param fnc as Function : Required : The exact function used to as the handler's callback
     ** @param once as Boolean : Optional : Must match the value given when the handler was created
     ** @returns <Object:obs>
     */
    Object.defineProperty(obs, 'off', {
        writable: false,
        enumerable: true,
        value: function (evt, fnc, once) {

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
        }
    });

    /** @description alias for obs.on(..., ..., true)
     ** @access public
     ** @param evt as String   : Required : Event name to listen for
     ** @param fnc as Function : Required : Function to call when the event is emitted
     ** @returns <Object:obs>
     */
    Object.defineProperty(obs, 'once', {
        writable: false,
        enumerable: true,
        value: function (evt, fnc) {
            return obs.on(evt, fnc, true);
        }
    });

    /** @description Alias for obs.off(..., ..., true)
     ** @access public
     ** @param evt as String   : Required : Event name to remove the handler from
     ** @param fnc as Function : Required : The exact function used to as the handler's callback
     ** @returns <Object:obs>
     */
    Object.defineProperty(obs, 'onceOff', {
        writable: false,
        enumerable: true,
        value: function (evt, fnc) {
            return obs.off(evt, fnc, true);
        }
    });

    /** @description Calls event emitters for the specified event
     ** @access public
     ** @param evt as String : Required : Event name to call event handlers for
     ** @param data          : Optional : data to be passed to the event handler
     ** @returns <Object:obs>
     */
    Object.defineProperty(obs, 'emit', {
        writable: false,
        enumerable: true,
        value: function (evt, data) {
            // validate arguments; since the data argument can be anything
            // theres no reason to validate it
            if (typeof evt !== 'string' || !evt) {
                throw new Error('Invalid event name');
            }

            // Make sure the event has handlers
            if (hasKey(eventHandlers, evt) && Array.isArray(eventHandlers[evt]) && eventHandlers[evt].length) {

                var handlers  = eventHandlers[evt],
                    i         = 0,
                    callbacks = [];

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
                        var handler = callbacks.shift();

                        // if there's still more handlers, start a timeout
                        // to handle them
                        if (callbacks.length) {
                            setTimeout(callNextHandler, 0);
                        }

                        // call the current handler function
                        // clone the data via JSON so the handler function's
                        // interactions with the data won't alter it for subsequent
                        // handlers
                        handler.call(obs, data !== undefined ? JSON.parse(JSON.stringify(data)) : undefined);
                    }, 0);

                }
            } else {
                delete eventHandlers[evt];
            }

            // return obs instance
            return obs;
        }
    });

    /** @description Retrieves the current scene
     ** @access public
     ** @returns <Object:scene>
     */
    // This overwrites the obsstudio's getCurrentScene function
    Object.defineProperty(obs, 'currentScene', {
        writable: false,
        enumerable: true,
        value: function () {
            if (ready) {
                return JSON.parse(JSON.stringify(currentScene || '{}'));
            }
            throw new Error('OBS-Studio BrowerSource Extension not ready');
        }
    });

    /** @description Returns the state of visibility for the BrowserSource
     ** @access public
     ** @returns Boolean
     */
    Object.defineProperty(obs, 'isVisible', {
        writable: false,
        enumerable: true,
        value: function () {
            if (ready) {
                return visible;
            }
            throw new Error('OBS-Studio BrowerSource Extension not ready');
        }
    });

    /** @description returns the current stream state
     ** @access public
     ** @returns obs.STATE.<state>
     */
    Object.defineProperty(obs, 'streamState', {
        writable: false,
        enumerable: true,
        value: function () {
            if (ready) {
                return streamState;
            }
            throw new Error('OBS-Studio BrowerSource Extension not ready');
        }
    });

    /** @description returns the current record state
     ** @access public
     ** @returns obs.STATE.<state>
     */
    Object.defineProperty(obs, 'recordState', {
        writable: false,
        enumerable: true,
        value: function () {
            if (ready) {
                return recordState;
            }
            throw new Error('OBS-Studio BrowerSource Extension not ready');
        }
    });

    /** @description Returns the state of readiness of the obs exension
     ** @access public
     ** @returns Boolean
     */
    Object.defineProperty(obs, 'isReady', {
        writable: false,
        enumerable: true,
        value: function () {
            return ready;
        }
    });

    // Make .pluginVersion property read only
    Object.defineProperty(obs, 'pluginVersion', {
        writable: false,
        enumerable: true,
        value: obs.pluginVersion
    });

    // Make .getCurrentScene function read only
    Object.defineProperty(obs, 'getCurrentScene', {
        writable: false,
        enumerable: true,
        value: obs.getCurrentScene
    });

    // if a visbility change handler has already been defined register
    // it as an event listener.
    if (typeof obs.onVisibilityChange === 'function') {
        obs.on('visbilityChange', obs.onVisibilityChange);
    }

    // Register the custom onVisibilityChange callback
    Object.defineProperty(obs, 'onVisibilityChange', {
        enumerable: true,

        // If another script attempts to define an onVisibilityChange
        // callback, register it as an event listener instead.
        // The drawback of doing it like this is callback cannot be
        // unregistered; if this results in issues its open to be changed.
        set: function (callback) {
            if (typeof callback === 'function') {
                obs.on('visibilityChange', callback);
            }
        },
        get: function () {
            return function (state) {
                visible = state;
                obs.emit('visibilityChange', visible);
            };
        }
    });

    // Register obs specific event hooks that occur on the window, so they
    // are emitted through the altered obsstudio instance
    window.addEventListener('obsStreamingStarting', function (evt) {
        streamState = obs.STATE.STARTING;
        obs.emit('streamState', streamState);
    });
    window.addEventListener('obsStreamingStarted', function (evt) {
        streamState = obs.STATE.STARTED;
        obs.emit('streamState', streamState);
    });
    window.addEventListener('obsStreamingStopping', function (evt) {
        streamState = obs.STATE.STOPPING;
        obs.emit('streamState', streamState);
    });
    window.addEventListener('obsStreamingStopped', function (evt) {
        streamState = obs.STATE.INACTIVE;
        obs.emit('streamState', streamState);
    });
    window.addEventListener('obsRecordingStarting', function (evt) {
        recordState = obs.STATE.STARTING;
        obs.emit('recordState', streamState);
    });
    window.addEventListener('obsRecordingStarted', function (evt) {
        recordState = obs.STATE.STARTED;
        obs.emit('recordState', streamState);
    });
    window.addEventListener('obsRecordingStopping', function (evt) {
        recordState = obs.STATE.STOPPING;
        obs.emit('recordState', streamState);
    });
    window.addEventListener('obsRecordingStopped', function (evt) {
        recordState = obs.STATE.INACTIVE;
        obs.emit('recordState', streamState);
    });
    window.addEventListener('obsSceneChanged', function (evt) {
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

    obs.getCurrentScene(function (scene) {

        // Bug Fix: https://github.com/kc5nra/obs-browser/issues/72 - #1
        scene = JSON.parse(scene);

        // if the ready event has not yet been emitted: emit it
        if (!ready) {
            ready = true;
            currentScene = scene;
            obs.emit('ready');
        }
    });

    // Replace the obsstudio object with the altered one
    window.obsstudio = obs;
}());