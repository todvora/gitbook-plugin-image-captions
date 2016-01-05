var fs = require('fs');
var path = require('path');
var tester = require('gitbook-tester');
var assert = require('assert');

// process.env.DEBUG = true;

var thisModulePath = path.join(__dirname, '..');

function basicBuild(content) {
  return tester.builder()
    .withContent(content)
    .withLocalPlugin(thisModulePath)
    .create();
}

function readFile(filename) {
  return fs.readFileSync(path.join(__dirname, 'resources', filename), 'utf-8').trim();
}

describe('gitbook-plugin-image-captions', function() {
  it('should not change content without images', function() {
    return basicBuild('#heading\n\nparagraph')
      .then(function(results){
        assert.equal(results[0].content, '<h1 id="heading">heading</h1>\n<p>paragraph</p>');
      });
  });

  it('should create caption from alt attribute', function() {
   return basicBuild('![bar](foo.jpg)')
    .then(function(results){
      assert.equal(results[0].content, '<figure id="fig0.1"><img src="foo.jpg" alt="bar"><figcaption>Figure: bar</figcaption></figure>');
    });
  });

  it('should read caption format from option', function() {

    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {'caption': 'Image - _CAPTION_'}
      }
    };

   return tester.builder()
    .withContent('![bar](foo.jpg)')
    .withBookJson(config)
    .withLocalPlugin(thisModulePath)
    .create()
    .then(function(results){
       assert.equal(results[0].content, '<figure id="fig0.1"><img src="foo.jpg" alt="bar"><figcaption>Image - bar</figcaption></figure>');
    });
  });

  it('should align caption to the left', function() {

    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {'align': 'left'}
      }
    };

    return tester.builder()
     .withContent('![bar](foo.jpg)')
     .withBookJson(config)
     .withLocalPlugin(thisModulePath)
     .create()
     .then(function(results){
       assert.equal(results[0].content, '<figure id="fig0.1"><img src="foo.jpg" alt="bar"><figcaption class="left">Figure: bar</figcaption></figure>');
     });
  });


  it('should prefer title attribute if available', function() {
    return basicBuild('![alt text](img.jpg "title text")')
     .then(function(results){
       assert.equal(results[0].content, '<figure id="fig0.1"><img src="img.jpg" alt="alt text" title="title text"><figcaption>Figure: title text</figcaption></figure>');
     });
  });

  it('should ignore images with empty alt', function() {
    return basicBuild('![](img.jpg)')
     .then(function(results){
       assert.equal(results[0].content, '<p><img src="img.jpg" alt=""></p>');
     });
  });

  it('should ignore images with empty title and fallback to alt', function() {
    return basicBuild('![bar](img.jpg "")')
     .then(function(results){
       assert.equal(results[0].content, '<figure id="fig0.1"><img src="img.jpg" alt="bar"><figcaption>Figure: bar</figcaption></figure>');
     });
  });

  it('should ignore inline images (pre)', function() {
    return basicBuild('foo ![bar](img.jpg)')
     .then(function(results){
       assert.equal(results[0].content, '<p>foo <img src="img.jpg" alt="bar"></p>');
     });
  });

  it('should ignore inline images (post)', function() {
    return basicBuild('![bar](img.jpg) bar')
     .then(function(results){
       assert.equal(results[0].content, '<p><img src="img.jpg" alt="bar"> bar</p>');
     });
  });

  it('should ignore inline images', function() {
    return basicBuild('foo ![bar](img.jpg) bar')
     .then(function(results){
       assert.equal(results[0].content, '<p>foo <img src="img.jpg" alt="bar"> bar</p>');
     });
  });

  it('should ignore multiple images in paragraph', function() {
    return basicBuild('![bar1](foo1.jpg)![bar2](foo2.jpg)')
     .then(function(results){
       assert.equal(results[0].content, '<p><img src="foo1.jpg" alt="bar1"><img src="foo2.jpg" alt="bar2"></p>');
     });
  });


  it('should handle page numbers', function() {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {
          caption: 'Image _PAGE_LEVEL_._PAGE_IMAGE_NUMBER_ - _CAPTION_'
        }
      }
    };

    return tester.builder()
     .withContent('![bar](foo.jpg)')
     .withBookJson(config)
     .withLocalPlugin(thisModulePath)
     .create()
     .then(function(results){
       assert.equal(results[0].content, '<figure id="fig0.1"><img src="foo.jpg" alt="bar"><figcaption>Image 0.1 - bar</figcaption></figure>');
     });
  });


  it('should render registry of figures', function() {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {
          variable_name: 'pictures'
        }
      }
    };

    var pageContent = readFile('image_registry_provided.md');
    var expected = readFile('image_registry_expected.html');

    return tester.builder()
     .withContent(pageContent)
     .withBookJson(config)
     .withLocalPlugin(thisModulePath)
     .create()
     .then(function(results){
       assert.equal(results[0].content, expected);
     });
  });

  it('should render image global index', function() {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {
          variable_name: 'pictures',
          caption: 'Image _BOOK_IMAGE_NUMBER_. - _CAPTION_'
        }
      }
    };

    var pageContent = readFile('image_bookwide_caption_provided.md');
    var expected = readFile('image_bookwide_caption_expected.html');

    return tester.builder()
     .withContent(pageContent)
     .withBookJson(config)
     .withLocalPlugin(thisModulePath)
     .create()
     .then(function(results){
       assert.equal(results[0].content, expected);
     });

  });

  it('should use image specific caption', function() {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {
          'images': {
            '0.1': {
              'caption': "Special image _PAGE_LEVEL_._PAGE_IMAGE_NUMBER_: _CAPTION_"
            }
          }
        }
      }
    };

    return tester.builder()
     .withContent('![bar](foo.jpg)')
     .withBookJson(config)
     .withLocalPlugin(thisModulePath)
     .create()
     .then(function(results){
       assert.equal(results[0].content, '<figure id="fig0.1"><img src="foo.jpg" alt="bar"><figcaption>Special image 0.1: bar</figcaption></figure>');
     });
  });

  it('should use different caption for figure and for list', function() {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {
          'variable_name': 'pictures',
          'list_caption': 'List image _BOOK_IMAGE_NUMBER_: _CAPTION_'
        }
      }
    };

    var pageContent = readFile('image_registry_provided.md');
    var expected = readFile('image_list_captions_expected.html');

    return tester.builder()
     .withContent(pageContent)
     .withBookJson(config)
     .withLocalPlugin(thisModulePath)
     .create()
     .then(function(results){
       assert.equal(results[0].content, expected);
     });

  });

  it('should pass default and specific image attributes', function() {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {
          'attributes': { 'width': '300' },
          'images': {
            '0.2': {
              'attributes': {
                'width': '400'
              }
            }
          }
        }
      }
    };

    var pageContent = readFile('image_attributes_provided.md');
    var expected = readFile('image_attributes_expected.html');

    return tester.builder()
     .withContent(pageContent)
     .withBookJson(config)
     .withLocalPlugin(thisModulePath)
     .create()
     .then(function(results){
       assert.equal(results[0].content, expected);
     });

  });

  it('should handle image inside link', function() {
    return basicBuild('[![SPE Remoting Module](http://img.youtube.com/vi/fGvT8eDdWrg/0.jpg)](http://www.youtube.com/watch?v=fGvT8eDdWrg "Click for a quick demo")')
     .then(function(results){
       assert.equal(results[0].content, '<a href="http://www.youtube.com/watch?v=fGvT8eDdWrg" title="Click for a quick demo" target="_blank"><figure id="fig0.1"><img src="http://img.youtube.com/vi/fGvT8eDdWrg/0.jpg" alt="SPE Remoting Module"><figcaption>Figure: SPE Remoting Module</figcaption></figure></a>');
     });
  });


});
