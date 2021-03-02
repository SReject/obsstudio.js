# obsstudio.js  
Normalizes and extends [OBS Browser](https://github.com/obsproject/obs-browser)'s JS interface.  

# Requirements
[OBS Browser](https://github.com/obsproject/obs-browser/releases) 1.31 or later.  
This comes packaged with OBS Studio Full install.

# Deviations  
obsstudio.js alters behaviors of the OBS interface in the following ways:

* `obsstudio.pluginVersion` is made read only.
* `obsstudio.getCurrentScene()` is made read only and now returns a promise
* `obsstudio.getStatus()` is made read only and now returns a promise
* OBS related events are emitted against `window.obsstudio` instead of `window`

# Using  
Include obsstudio.js in your html file prior to scripts that make use of it:

```html
<html>
    <head>
        <!-- Other head stuff -->

        <script src="./obsstudio.js"></script>
        <!-- Other scripts that make use of the modified obsstudio object -->
    </head>
    <body>
        ...
    </body>
</html>
```

# Documentation
For API documentation and examples refer to [https://github.com/SReject/obsstudio.js/wiki](the wiki)
