/*@license: The MIT License (MIT)

Copyright (c) 2017-2021, SReject

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
    const obs                   = window.obsstudio,
        originalGetCurrentScene = obs.getCurrentScene,
        originalGetStatus       = obs.getStatus,
        eventListeners          = {};

        let readyState           = false,
            streamingState       = 0,
            recordingState       = 0,
            recordingPausedState = false,
            replayState          = 0,
            virtualCamState      = 0,
            activeState          = true;
        
        let sceneState = {
            name: '',
            width: 0,
            height: 0
        };

    // calls event handlers against the obsstudio object
    const emit = (evt, ...args) => {
        evt = evt.toLowerCase();
        if (eventListeners[evt] != null && eventListeners[evt].length > 0) {
            let listeners = eventListeners[evt],
                idx = 0;
            while (idx < listeners.length) {
                let {handler, once} = listeners[idx];
                if (once) {
                    listeners.splice(idx, 1);
                } else {
                    idx += 1;
                }
                handler = handler.bind(obs, ...args);
                setTimeout(handler, 0);
            }
        }
    };

    // Transform: pluginVersion to read only
    Object.defineProperty(obs, 'pluginVersion', {
        writable: false,
        enumerable: true,
        value: obs.pluginVersion
    });

    // Add: libraryVersion
    Object.defineProperty(obs, 'libraryVersion', {
        writable: false,
        enumerable: true,
        value: '1.0.0'
    });

    // Transform: .getCurrentScene() into a promise
    Object.defineProperty(obs, 'getCurrentScene', {
        writable: false,
        enumerable: true,
        value: function getCurrentScene() {
            return new Promise(resolve => originalGetCurrentScene(function (currentScene) {
                sceneState = {...currentScene};
                resolve(currentScene);
            }));
        }
    });

    // Transform: .getStatus() into a promise
    Object.defineProperty(obs, 'getStatus', {
        writable: false,
        enumerable: true,
        value: function getStatus() {
            return new Promise(resolve => originalGetStatus(state => {
                recordingPausedState = state.recordingPaused;

                // Assume started if the status is truthy as obs currently only returns boolean values
                // can't do more until the following issues are addressed
                // https://github.com/obsproject/obs-browser/issues/255
                // https://github.com/obsproject/obs-browser/issues/268

                if (state.streaming && !streamingState) {
                    streamingState = obs.STATE.STARTED;
                }
                if (state.recording && !recordingState) {
                    recordingState = obs.STATE.STARTED;
                }
                if (state.replaybuffer && !replayState) {
                    replayState = obs.STATE.STARTED;
                }
                if (state.virtualcam && !virtualCamState) {
                    virtualCamState = obs.STATE.STARTED;
                }
                resolve(obs.state);
            }));
        }
    });

    // Transform: saveReplayBuffer() to read only
    Object.defineProperty(obs, 'saveReplayBuffer', {
        writable: false,
        enumerable: true,
        value: obs.saveReplayBuffer
    });

    // Add: .state
    Object.defineProperty(obs, 'state', {
        enumerable: true,
        get: () => {
            let state = Object.create(null, {
                ready: { enumerable: true, get: () => readyState },
                streaming: { enumerable: true, get: () => streamingState },
                recording: { enumerable: true, get: () => recordingState },
                recordingPaused: { enumerable: true, get: () => recordingPausedState },
                replay: { enumerable: true, get: () => replayState },
                virtualCam: { enumerable: true, get: () => virtualCamState },
                visible: { enumerable: true, get: () => document.visibility === 'visible' },
                active: { enumerable: true, get: () => activeState },
                scene: { enumerable: true, get: () => ({ ...sceneState }) }
            });
            Object.freeze(state);
            return state;
        }
    });

    // Add: on()
    Object.defineProperty(obs, 'on', {
        writable: false,
        enumerable: true,
        value: function on(eventName, handler, once = false) {
            if (typeof eventName !== 'string' || eventName === '') {
                throw new Error('invalid event name');
            } else {
                eventName = eventName.toLowerCase();
            }
            if (typeof handler !== 'function') {
                throw new Error('invalid handler');
            }
            if (once == null) {
                once = false;
            } else if (typeof once !== 'boolean') {
                throw new Error('invalid once option');
            }
            eventName = eventName.toLowerCase();
            if (eventListeners[eventName] == null) {
                eventListeners[eventName] = [{handler, once}]
            } else {
                eventListeners[eventName].push({handler, once});
            }
        }
    });

    // Add: once() - alias for .on(..., ..., true)
    Object.defineProperty(obs, 'once', {
        writable: false,
        enumerable: true,
        value: function once(eventName, handler) {
            return obs.on(eventName, handler, true);
        }
    });

    // Add: off()
    Object.defineProperty(obs, 'off', {
        writable: false,
        enumerable: true,
        value: function off(eventName, handler, once = false) {
            if (typeof eventName === 'string' && eventName !== '') {
                eventName = (eventName + "").toLowerCase();
                if (once == null) {
                    once = false;
                }
                if (eventListeners[eventName] != null) {
                    let idx = eventListeners[eventName].findIndex(listener => listener.handler === handler && listener.once === once);
                    if (idx > -1) {
                        eventListeners[eventName].splice(idx, 1);
                    }
                }
            }
        }
    });

    // Add: onceOff() - alias for .off(..., ..., true)
    Object.defineProperty(obs, 'onceOff', {
        writable: false,
        enumerable: true,
        value: function onceOff(eventName, handler) {
            return obs.off(eventName, handler, true);
        }
    });

    // add: STATE constants
    Object.defineProperty(obs, 'STATE', {
        writable: false,
        enumerable: true,
        value: Object.freeze({
            STOPPED:  0,
            STARTING: 1,
            STARTED:  2,
            STOPPING: 3
        })
    });

    // Add: isReady() - resolves when obsstudio.js is ready
    Object.defineProperty(obs, 'isReady', {
        enumerable: true,
        writable: false,
        value: Promise.all([
            window.obsstudio.getCurrentScene().then(scene => sceneState = {...scene}),
            window.obsstudio.getStatus().then(status => {
                if (status.streaming) {
                    streamingState = obs.STATE.STARTED;
                }
                if (status.recording) {
                    recordingState = obs.STATE.STARTED;
                }
                if (status.recordingPaused) {
                    recordingPaused = true;
                }
                if (status.replaybuffer) {
                    replayState = obs.STATE.STARTED;
                }
                if (status.virtualcam) {
                    virtualCamState = obs.STATE.STARTED;
                }
            })
        ]).then(() => {
            readyState = true;
        })
    });

    // Add: getEventEmitterFunction() so 3rd party scripts can directly access emitting function
    // Note: this should only be used by addons to this library and not end-user content
    Object.defineProperty(obs, 'getEventEmittingFunction', {
        enumerable: false,
        writable: false,
        value: () => emit
    });

    // Reroute state events
    window.addEventListener('obsSceneChanged', function (evt) {
        let previousScene = sceneState;
        sceneState = Object.freeze({ ...(evt.details) });
        emit('sceneChange', previousScene, sceneState);
    }, true);
    window.addEventListener('obsSourceVisibleChanged', function (evt) {
        evt.stopPropagation();
        emit('sourceVisiblity', document.visibility === 'visible');
    }, true);
    window.addEventListener('obsSourceActiveChanged', function (evt) {
        evt.stopPropagation();
        activeState = evt.details.active;
        emit('sourceActive', activeState);
    }, true);

    // Reroute streaming events
    window.addEventListener('obsStreamingStarting', function (evt) {
        evt.stopPropagation();
        streamingState = obs.STATE.STARTING;
        emit('streamingState', streamingState)
    }, true);
    window.addEventListener('obsStreamingStarted', function (evt) {
        evt.stopPropagation();
        streamingState = obs.STATE.STARTED;
        emit('streamingState', streamingState)
    }, true);
    window.addEventListener('obsStreamingStopping', function (evt) {
        evt.stopPropagation();
        streamingState = obs.STATE.STOPPING;
        emit('streamingState', streamingState)
    }, true);
    window.addEventListener('obsStreamingStopped', function (evt) {
        evt.stopPropagation();
        streamingState = obs.STATE.STOPPED;
        emit('streamingState', streamingState)
    }, true);

    // Reroute recording events
    window.addEventListener('obsRecordingingStarting', function (evt) {
        evt.stopPropagation();
        recordingState = obs.STATE.STARTING;
        emit('recordingState', recordingState)
    }, true);
    window.addEventListener('obsRecordingingStarted', function (evt) {
        evt.stopPropagation();
        recordingState = obs.STATE.STARTED;
        emit('recordingState', recordingState)
    }, true);
    window.addEventListener('obsRecordingingStopping', function (evt) {
        evt.stopPropagation();
        recordingState = obs.STATE.STOPPING;
        emit('recordingState', recordingState);
    }, true);
    window.addEventListener('obsRecordingingStopped', function (evt) {
        evt.stopPropagation();
        recordingState = obs.STATE.STOPPED;
        emit('recordingState', recordingState)
    }, true);
    window.addEventListener('obsRecordingPaused', function (evt) {
        evt.stopPropagation();
        recordingPausedState = true;
        emit('recordingPause', recordingPausedState);
    }, true);
    window.addEventListener('obsRecordingUnpaused', function (evt) {
        evt.stopPropagation();
        recordingPaused = false;
        emit('recordingPause', recordingPausedState);
    }, true);

    // Reroute replaybuffer events
    window.addEventListener('obsReplaybufferStarting', function (evt) {
        evt.stopPropagation();
        replayState = obs.STATE.STARTING;
        emit('replaybuffer', replayState);
    }, true);
    window.addEventListener('obsReplaybufferStarted', function (evt) {
        evt.stopPropagation();
        replayState = obs.STATE.STARTED;
        emit('replaybuffer', replayState);
    }, true);
    window.addEventListener('obsReplaybufferStopping', function (evt) {
        evt.stopPropagation();
        replayState = obs.STATE.STOPPING;
        emit('replaybuffer', replayState);
    }, true);
    window.addEventListener('obsReplaybufferStopped', function (evt) {
        evt.stopPropagation();
        replayState = obs.STATE.STOPPED;
        emit('replaybuffer', replayState);
    }, true);
    window.addEventListener('obsReplaybufferSaved', function (evt) {
        evt.stopPropagation();
        emit('replaybufferSaved');
    }, true);
    
    // Reroute virtualcam events
    window.addEventListener('obsVirtualcamStarted', function (evt) {
        evt.stopPropagation();
        virtualCamState = obs.STATE.STARTED;
        emit('virtualCam', virtualCamState);
    }, true);
    window.addEventListener('obsVirtualcamStopped', function (evt) {
        evt.stopPropagation();
        virtualCamState = obs.STATE.STOPPED;
        emit('virtualCam', virtualCamState);
    }, true);

    // Reroute exit event
    window.addEventListener('obsExit', function (evt) {
        evt.stopPropagation();
        emit('exit');
    }, true);

    // Transform: Make window.obsstudio read-only
    Object.freeze(obs);
    Object.defineProperty(window, 'obsstudio', {
        writable: false,
        configurable: false,
        enumerable: true,
        value: obs
    });
}());