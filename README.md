# obsstudio.js  
Normalizes [OBS Studio BrowserSource](https://github.com/kc5nra/obs-browser)'s JS interface . Note that it drastically modifies the behaviors of the default obsstudio object so do **not** mix scripts where some make use of obsstudio.js and others make use of the default obsstudio behavior.

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

### Properties

> **`.pluginVersion`** as String  
> The BrowserSource Version

> **`.extensionVersion`** as String  
> The obsstudio.js version

### Methods

> **`.getCurrentScene()`** as SceneObject  (see SceneObject below)
> Returns the current scene
> Only available after the `ready` event has triggered

> **`.isVisible()`** as Boolean
> Returns the current visibility state  
> Only available after the `ready` event has triggered and the first onVisibilityChange event occurs from obs

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

> **`streamStarting`**  
> Emitted when streaming is starting

> **`streamStarted`**  
> Emitted when streaming is started

> **`streamStopping`**  
> Emitted when streaming is being stopped

> **`streamStopped`**  
> Emitted when streaming has stopped

> **`recordStarting`**  
> Emitted when recording is starting

> **`recordStarted`**  
> Emitted when recording is started

> **`recordStopping`**  
> Emitted when recording is being stopped

> **`recordStopped`**  
> Emitted when recording has stopped

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
