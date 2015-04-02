# GitBook Image Captions Plugin

[![Build Status](https://travis-ci.org/todvora/gitbook-plugin-image-captions.svg?branch=master)](https://travis-ci.org/todvora/gitbook-plugin-image-captions)
[![Coverage Status](https://coveralls.io/repos/todvora/gitbook-plugin-image-captions/badge.svg)](https://coveralls.io/r/todvora/gitbook-plugin-image-captions)
[![Dependencies Status](https://david-dm.org/todvora/gitbook-plugin-image-captions/status.svg)](https://david-dm.org/todvora/gitbook-plugin-image-captions/)
[![DevDependencies Status](https://david-dm.org/todvora/gitbook-plugin-image-captions/dev-status.svg)](https://david-dm.org/todvora/gitbook-plugin-image-captions/#info=devDependencies)

Add nice generated captions to your book images. This plugin converts ```alt``` or ```title``` of your images to captions.
Works both in GitBook website and generated book (pdf, mobi).
 
![rendered page](https://raw.github.com/todvora/gitbook-plugin-image-captions/master/preview.jpg)

## Instalation
In your book.json add plugin like this:
```
{
    "plugins": [
        "image-captions"
    ]
}
```

If you're building your book locally, download an prepare plugins simply by running: ```gitbook install```. 

## Configuration
The plugin provides reasonable defaults and you don't need to config anything. 

If you want to configure the caption text, you can provide your own template in the form:
```
{
    "plugins": [
        "image-captions"
    ],
    "pluginsConfig": {
        "image-captions": {
            "caption": "Image - _CAPTION_"
        }
    }
}
```
The keyword ```_CAPTION_``` will be automatically replaced by title or alt of your image 
(the plugin uses first ```title```, if not found, then ```alt```). 

## CSS Styles
This plugin generates simple ```figure``` around your images:
```
<figure>
    <img src="../images/phetchaburi.jpg" alt="Phra Nakhon Khiri, Phetchaburi">
    <figcaption>Image - Phra Nakhon Khiri, Phetchaburi</figcaption>
</figure>
```

You can then customize CSS styles of the ```figure``` and ```figcaption```. By default, this definition is included in the plugin:

```
figure {
    margin: 1.5em 0px;
    padding:10px 0;
}

figcaption {
    clear: left;
    margin: 0.75em 0px;
    text-align: center;
    font-style: italic;
    line-height: 1.5em;
}
```
How to attach your own styles can you read on [help.gitbook.com](http://help.gitbook.com/format/configuration.html). 
Then simply add your style definitions for ```figure``` and ```figcaption```. Note: different styles can be attached for
web and books, so you can style the captions differently for every medium.

## Under the hood

Are you interested, how the plugin works? Do you want to fork it and start hacking on your own plugin?

### How is it done
This plugin attaches itself to the "page" event of GitBook generate task. It receives rendered HTML page of the chapter.
Then the plugin goes through the code of page, searching for images. If there is any image detected, containing also 
```alt``` or ```title``` atribute, the plugin replaces image occurences with the ```figure``` tag, including original 
image and additional ```figcaption``` tag with the text read from image attributes.

### Tests
Important part of this plugin is the test suite. You can run the test with command:
```
npm test
```

The test suite includes [JSHint](https://www.npmjs.com/package/jshint) validation of the plugin and test suite itself. Then the [Jasmine](https://www.npmjs.com/package/jasmine-node) tests are executed, 
validating expected plugin bahavior. To be sure, that all of the code is covered, [Istanbul](https://github.com/gotwarlost/istanbul) generates coverage reports
and sends them to [Coveralls.io](https://coveralls.io/r/todvora/gitbook-plugin-image-captions) service. 
 
The tests are executed with every pushed commit on the [Travis-CI server](https://travis-ci.org/todvora/gitbook-plugin-image-captions).

### Based on
This plugin is based on example plugin from [GitbookIO/plugin](https://github.com/GitbookIO/plugin). 