# obsstudio.js  

Normalizes [OBS Studio BrowserSource](https://github.com/kc5nra/obs-browser)'s JS interface . Note that it drastically modifies the behaviors of the default obsstudio object so do **not** mix scripts where some make use of obsstudio.js and others make use of the default obsstudio behavior.

## Using

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

## Interface

### Properties

> **`.pluginVersion`** as String  
> The BrowserSource Version

> **`.extensionVersion`** as String  
> The obsstudio.js version

### Methods

> **`.getCurrentScene()`** as String  
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
