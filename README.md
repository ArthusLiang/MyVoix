# MyVoix JS

A JavaScript library to use voice command in Chrome.
This Library is not only wrap google's API, but also supply a smart learning feature which enables the browser to learn user's pronounce

### Standalone
You can use the standalone version:
```html
<script src="myvoix.js"></script>
```

## How-to
Create a new instance of Voix.
```js
var _myVoix = new MyVoix(undefined,undefined,true);
```

## API
### Voix(lang)
Create a new instance of `Voix`.

***Args***

- `pConfig`: refer to webkitSpeechRecognition's config.

- `pCommands`: A serious of commands which have been stored before.

- `pIsLoop`: whether to keep detecting.

***eg:***

```
var MyVoix=function(pConfig,pCommands,pIsLoop);
```


### bind(pCommand, pListener)

***Args***

- `pCommand`: a string or an array of string

- `pListener`: the function which will be triggered

***eg:***

bind a string

```_myVoix.bind('go',function(){});```

bind an array

```_myVoix.bind(['go','start'],function(){});```

### unbind(pCommand, pListener)

***Args***

- `pCommand`: a string or an array of string

- `pListener`: the function need to be unbund

***eg:***

refer to **bind**


## Maintained by
- E-mail: 531151995@qq.com

## License
Licensed under the MIT license.

Copyright (c) 2014 yulianghuang