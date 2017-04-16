# obsstudio.js  
Normalizes [OBS Studio BrowserSource](https://github.com/kc5nra/obs-browser)'s JS interface.  

# Deviations  
obsstudio.js alters the default members of `window.obsstudio` in the following ways:

* `.pluginVersion` is made read only.
* `.getCurrentScene()` is made read only.
* `.onVisibilityChange` is replaced with a read-only function. If a callback was defined before obsstudio.js is loaded, it is removed and added as an event handler instead. Attempts to set the `onVisbilityChange` callback after obsstudio.js is loaded are added as an event handler instead. The drawback is these callbacks cannot be removed and this behavior is open for discussion.  

# Using  
Include obsstudio.js in your html file prior to scripts that make use of it:

```
<html>
    <head>
        <!-- Other head stuff ->

        <script src="./obsstudio.js"></script>
        <!-- Other scripts that make use of the modified obsstudio object -->
    </head>
    <body>
        ...
    </body>
</html>
```

# Interface  
All interface members listed below are added to the `window.obsstudio` object.  
Properties and methods are read-only.  

### Properties

> **`.extensionVersion`** as String  
> The obsstudio.js version

> **`.STATE`** as Object  
> State constants used to indicate the state of streaming and recording  
>  
> > `.INACTIVE` as Number(0)  
> > Indicates streaming/recording is inactive or stopped  
>  
> > `.STARTING` as Number(1)  
> > Indicates streaming/recording is starting.  
>  
> > `.STARTED` as Number(2)  
> > Indicates streaming/recording has started.    
>  
> > `.STOPPING` as Number(3)  
> > Indicates streaming/recording is stopping.

> **`.STATEBYINDEX`** as Object  
> Reversed aliasing of `.STATE`  
> Input the STATE value and get the value's `.STATE` name

### Methods

> **`.currentScene()`** as SceneObject  (see SceneObject below)  
> Returns the current scene  
> Only available after the `ready` event has triggered

> **`.streamState()`** as STATE (see `.STATE` above)  
> Returns the current streaming state  
> Only available after the `ready` event has triggered.  
> Only filled in after an initial streaming-state event is emitted from the default obsstudio object

> **`.recordState()`** as STATE (see `.STATE` above)   
> Returns the current recording state  
> Only available after the `ready` event has triggered.  
> Only filled in after an initial recording-state event is emitted from the default obsstudio object

> **`.isVisible()`** as Boolean
> Returns the current visibility state  
> Only available after the `ready` event has triggered.  
> Only filled in after an initial visibility change event occurs from the default obsstudio object

> **`.isReady()`** as Boolean  
> Returns the current ready state

> **`.on(@eventName, @handler, @once)`**  
> > `@eventName` as String - Required  
> > The event to listen for  
>  
> > `@handler` as Function - Required  
> > The function to be called when the event is emitted  
>  
> > `@once` as Boolean - Optional  
> > If true the event handler will be removed after the event is next triggered  
>  
> Listens for the specified event and when it occurs call the handler function.  
> Returns the obsstudio object instance so method-chaining can occur.

> **`.off(@eventName, @handler, @once)`**  
> > `@eventName` as String - Required  
> > The event to remove the handler from  
>  
> > `@handler` as Function - Required  
> > The exact handler function that was used to create the event listener.  
>  
> > `@once` as Boolean - Optional  
> > The value given when the listener was created.  
>  
> Removes the first matching handler.  
> Returns the obsstudio object instance so method-chaining can occur.

> **`.once(@eventName, @handler)`**  
> Alias for `.on(@eventName, @handler, true)`  
> Returns the obsstudio object instance so method-chaining can occur.

> **`.onceOff(@eventName, @handler)`**  
> Alias for `.off(@eventName, @handler, true)`  
> Returns the obsstudio object instance so method-chaining can occur.

### Events  
Event handlers are called against the `obsstudio` object so as in typical cases `this` is bound to the obsstudio instance.  
Handlers for the same event are called in the other they were added; first-added: first-called.  

> **`ready`**  
> Emitted when obsstudio.js has finished initializing  
>  
> Handlers added to this event are added as a one-time firing handler   
> Handlers added after this event triggers will be immediately called.

> **`sceneChange`** with `@SceneObject`  
> > `@SceneObject` - See SceneObject below  
> > Contains data related to the scene that was switched to.  
>  
> Emitted when the scene changes

> **`visibilityChange`** with `@visibilityState`  
> > `@visibilityState` as Boolean  
> > `true` if the BrowserSource is visibile, `false` otherwise  
>  
> Emitted when the BrowserSource visibility changes.

> **`streamState`**  with `@STATE`  
> > `@STATE` - See `.STATE` above  
> > Indicates the state of streaming  
>  
> Emitted when streaming state changes

> **`recordState`**  with `@STATE`  
> > `@STATE` - See `.STATE` above  
> > Indicates the state of recording  
>  
> Emitted when the recording state changes

### `SceneObject`
Contains information related to a scene.

> `.name` as String  
> The name of the scene

> `.width` as Number  
> The width, in pixels, of the scene

> `.height` as Number  
> The height, in pixels, of the scene

> `.previousScene` as SceneObject  
> The previous scene  
> Only included in the `sceneChange` event


# Non OBS-Studio Abstraction  
Included with the script is a non obs-studio abstraction so the script can be used outside of an OBS-Studio BrowserSource.  
The abstraction makes use of web browers' `location.hash` to retrieve events.  

### Issuing events
Events are issued via changes to `location.hash`.  
Events are formatted as a urlencoded queryString and must always contain an `event` parameter.  

### Events

> `init`  
> Format: `event=init&scene=@name&width=@width&height=@height`  
> > `@name`  
> > The name of the scene  
>  
> > `@width`  
> > The width of the scene  
>  
> > `@height`  
> > The height of the scene  
>
> Indicates the obs abstraction should be initialized.   
> **Must** be called with the page load.

> `sceneChange`  
> Format: `event=sceneChange&scene=@name&width=@width&height=@height`  
> > `@name`  
> > The name of the scene  
>  
> > `@width`  
> > The width of the scene  
>  
> > `@height`  
> > The height of the scene  
>  
> Imitates a scene change event

> `visibilityChange`  
> Format: `event=visibilityChange&state=@State`  
> > `@State`
> > true|false indicating the new visibility state  
>  
> Imitates a visibility change event

> `streamState`  
> Format: `event=streamState&state=@State`  
> > `@State`  
> > A `.STATE` value indicating the stream state (see `.STATE` above)  
>  
> Imitates a streaming state change event

> `recordState`  
> Format: `event=recordState&state=@State`  
> > `@State`  
> > A `.STATE` value indicating the stream state (see `.STATE` above)  
>  
> Imitates a recording state change event
