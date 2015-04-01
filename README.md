# GitBook Image Captions Plugin
Add nice generated captions to your book. This plugin converts ```alt``` or ```title``` of your images to captions.
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

If you want to configure the caption style, you can provide your own text template in form:
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
The keyword ```_CAPTION_``` will be automatically replaced by title or alt of your image. 

## CSS Styles
The plugin generates simple ```figure``` around your images:
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