# obsstudio.js  
Normalizes and extends [OBS Studio BrowserSource](https://github.com/kc5nra/obs-browser)'s JS interface.  

# Requirements
[OBS-Browser](https://github.com/kc5nra/obs-browser/releases) (BrowserSource) 1.29.0 or later.  
This comes packaged with OBS Studio Full install.

# Deviations  
obsstudio.js alters the default behaviors of `window.obsstudio` in the following ways:

* Events are emitted against the `obsstudio` object instead of the `window` object; obsstudio.js attempts to stop the propagation of the events emitted on the window.  
* `obsstudio` and its members are made read-only.
* `getCurrentScene()` is replaced with a function to better handle calls; Its recommended to use `obsstudio.currentScene` instead as it allows direct access to scene information.  
* `onVisibilityChange` is replaced with a read-only function. If a callback was defined before obsstudio.js is loaded, it is removed and added as an event handler instead. Attempts to set the `onVisbilityChange` callback after obsstudio.js is loaded are added as an event handler instead. The drawback is these callbacks cannot be removed; this behavior is open for discussion.
* `onActiveChange` is replaced with a read-only function. If a callback was defined before obsstudio.js is loaded, it is removed and added as an event handler instead. Attempts to set the `onActiveChange` callback after obsstudio.js is loaded are added as an event handler instead. The drawback is these callbacks cannot be removed; this behavior is open for discussion.
* `onSceneChange` is replaced with a read-only function. If a callback was defined before obsstudio.js is loaded, it is removed and added as an event handler instead. Attempts to set the `onSceneChange` callback after obsstudio.js is loaded are added as an event handler instead. The drawback is these callbacks cannot be removed; this behavior is open for discussion.  




# Using  
Include obsabstraction.js (if desired) and obsstudio.js in your html file prior to scripts that make use of it:

```html
<html>
    <head>
        <!-- Other head stuff -->

        <!-- include obsabstraction if you want to test in the browser; See abstraction below -->
        <script src="./obsabstraction.js"></script>

        <script src="./obsstudio.js"></script>
        <!-- Other scripts that make use of the modified obsstudio object -->
    </head>
    <body>
        ...
    </body>
</html>
```

# Interface  
`obsstudio` members after obsstudio.js is loaded.  
Properties and methods are read-only.

### Properties

#### `plugin` as String  
The BrowserSource plugin version


#### `obsstudiojsVersion` as String  
The obsstudio.js version  


#### `extensionVersion` as String _(depreciated)_  
The obsstudio.js version  
Use `obsstudiojsVersion` instead  


#### `isActive` as Boolean  
Returns `true` if the browser source is active  


#### `isVisible` as Boolean  
Is `true` if the scene is visible  


#### `currentScene` as Object  
Provides information for the current scene  

`currentScene.name` as String - The current scene's name  
`currentScene.width` as integer - The current scene's width  
`currentScene.width` as integer - The current scene's height  


#### `streamState` as Number
Returns the streaming state as a `state` enumerate.  


#### `recordState` as Number
Returns the recording state as a `state` enumerate.  


#### `state` as Enum\<number\>
Indicates the streaming|recording state  

`state.UNKNOWN`(-1): Indicates the state is unknown  
`state.INACTIVE`(0): Indicates an inactive/stopped state  
`state.STARTING`(1): Indicates the stream|recording is being started  
`state.STARTED`(2): Indicates the stream|recording is running  
`state.STOPPING`(3): Indicates the stream|recording is being stopped  


#### `STATE` as Enum\<number\> _(depreciated)_
Indicates the streaming|recording state.  
See/Use `obsstudio.state`  




### Methods

#### `addEventListener(@eventName, @handle, @once)`  
Registers an event handler for the specified event  

`@eventName` as String - Required - The event of which to registered the handle.  
`@handle` as Function - Required - A function to call when the event is emitted.  
`@once` As Boolean - Optional - If `true`, the handler will be unregistered have the event is triggered again.  


#### `on(@eventName, @handle, @once)`  
Ease-of-use alias of `addEventListener`  


#### `once(@eventName, @handle)`  
Ease-of-use alias for `addEventListener(@eventName, @handle, true)`  


#### `removeEventListener(@eventName, @handle, @once)`  
Unregisters an event handler for the specified event.  
Inputs must match those used when the handler was registered.  

`@eventName` as String - Required - The event of which to registered the handle.  
`@handle` as Function - Required - A function to call when the event is emitted.  
`@once` As Boolean - Optional - If `true`, the handler will be unregistered have the event is triggered again.  


#### `off(@eventName, @handle, @once)`  
Ease-of-use alias of `removeEventListener`  


#### `offonce(@eventName, @handle)`  
Ease-of-use alias for `removeEventListener(@eventName, @handle, true)`




### Events  
Event handlers are called against the `obsstudio` object so as in typical cases `this` is bound to the obsstudio instance.  
Handlers for the same event are called in the other they were added; first-added: first-called.  

#### `ready`  
Emitted when obsstudio.js has finished initializing  


#### `sceneChange`  
Emitted when the scene changes.  
Use `obsstudio.currentScene` to get the new scene's information.  

`event.data` is an object with the following members:  
`name` as String - Name of the previous scene  
`width` as Number - Width of the previous scene  
`height` as Number - Height of previous scene  


#### `activeChange`
Emitted when the BrowserSource's activity state changes.  

`event.data` is a boolean value of which `true` indicates the BrowserSource is active.


#### `visibilityChange`
Emitted when the scene's visibility state changes.  

`event.data` is a boolean value of which `true` indicates the scene is visible.


#### `streamState`  
Emitted when the streaming state changes  

`event.data` is a `obsstudio.state` enumerate


#### `recordState`  
Emitted when the recording state changes  


# Abstraction  
`obsabstraction.js` is a non-obsstudio abstraction so `obsstudio.js` can be used within a browser outside of an OBS-Studio BrowserSource.  
The abstraction makes use of web browers' `location.hash` to retrieve events.  

## Issuing events
Events are issued via changes to `location.hash`.  
Events are formatted as a urlencoded queryString and must always contain an `event` parameter.  

## Events

#### `onActiveChange`
Imitates an `onActiveChange` event

Format: `obsevent=onActiveChange&value=@state`  
`@state` - The visibility state; must be a boolean value of `true` or `false`


#### `onVisibilityChange`
Imitates an `onVisibilityChange` event

Format: `obsevent=onVisibilityChange&value=@state`  
`@state` - The visibility state; must be a boolean value of `true` or `false`


#### `obsSceneChange`
Imitates a `obsSceneChange` event.  

Format: `obsevent=obsSceneChange&scene=@name&width=@width&height=@height`  
`@name` - The name of the scene  
`@width` - The width of the scene; must be an unsigned integer  
`@height` - The height of the scene; must be an unsigned integer  


#### `obsStreamingStarting`
Imitates a `obsStreamingStarting` event.  

Format: `obsevent=obsStreamingStarting`  


#### `obsStreamingStarted`
Imitates a `obsStreamingStarted` event.  

Format: `obsevent=obsStreamingStarted`  


#### `obsStreamingStopping`
Imitates a `obsStreamingStopping` event.  

Format: `obsevent=obsStreamingStopping`  


#### `obsStreamingStopped`
Imitates a `obsStreamingStopped` event.  

Format: `obsevent=obsStreamingStopped`  


Format: `obsevent=obsStreamingStarting`  


#### `obsRecordingingStarting`
Imitates a `obsRecordingingStarting` event.  

Format: `obsevent=obsRecordingingStarting`  


#### `obsRecordingingStarted`
Imitates a `obsRecordingingStarted` event.  

Format: `obsevent=obsRecordingingStarted`   


#### `obsRecordingingStopping`
Imitates a `obsRecordingingStopping` event.  

Format: `obsevent=obsRecordingingStopping`   


#### `obsRecordingingStopped`
Imitates a `obsRecordingingStopped` event.  

Format: `obsevent=obsRecordingingStarting`
