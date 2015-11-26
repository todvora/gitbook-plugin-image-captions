var fs = require('fs');
var path = require('path');
var tester = require('gitbook-tester');

var thisModulePath = path.join(__dirname, '..');

function basicBuild(content) {
  return tester.builder()
    .withContent(content)
    .withBookJson({"plugins": ["image-captions"]})
    .withLocalPlugin(thisModulePath, 'gitbook-plugin-image-captions')
    .create();
}

function readFile(filename) {
  return fs.readFileSync(path.join(__dirname, 'resources', filename), 'utf-8').trim();
}

describe(__filename, function() {
  it('should not change content without images', function(testDone) {
    basicBuild('#heading\n\nparagraph')
      .then(function(results){
        expect(results[0].content).toEqual('<h1 id="heading">heading</h1>\n<p>paragraph</p>');
      })
      .fin(testDone)
      .done();
  });

  it('should create caption from alt attribute', function(testDone) {
   basicBuild('![bar](foo.jpg)')
    .then(function(results){
    expect(results[0].content).toEqual('<figure><img src="foo.jpg" alt="bar"><figcaption>Figure: bar</figcaption></figure>');
    })
    .fin(testDone)
    .done();
  });

  it('should read caption format from option', function(testDone) {

    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {'caption': 'Image - _CAPTION_'}
      }
    };

   tester.builder()
    .withContent('![bar](foo.jpg)')
    .withBookJson(config)
    .withLocalPlugin(thisModulePath, 'gitbook-plugin-image-captions')
    .create()
    .then(function(results){
      expect(results[0].content).toEqual('<figure><img src="foo.jpg" alt="bar"><figcaption>Image - bar</figcaption></figure>');
    })
    .fin(testDone)
    .done();
  });

  it('should align caption to the left', function(testDone) {

    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {'align': 'left'}
      }
    };

    tester.builder()
     .withContent('![bar](foo.jpg)')
     .withBookJson(config)
     .withLocalPlugin(thisModulePath, 'gitbook-plugin-image-captions')
     .create()
     .then(function(results){
       expect(results[0].content).toEqual('<figure><img src="foo.jpg" alt="bar"><figcaption class="left">Figure: bar</figcaption></figure>');
     })
     .fin(testDone)
    .done();
  });


  it('should prefer title attribute if available', function(testDone) {
    basicBuild('![alt text](img.jpg "title text")')
     .then(function(results){
       expect(results[0].content).toEqual('<figure><img src="img.jpg" alt="alt text" title="title text"><figcaption>Figure: title text</figcaption></figure>');
     })
     .fin(testDone)
    .done();
  });

  it('should ignore images with empty alt', function(testDone) {
    basicBuild('![](img.jpg)')
     .then(function(results){
       expect(results[0].content).toEqual('<p><img src="img.jpg" alt=""></p>');
     })
     .fin(testDone)
    .done();
  });

  it('should ignore images with empty title and fallback to alt', function(testDone) {
    basicBuild('![bar](img.jpg "")')
     .then(function(results){
       expect(results[0].content).toEqual('<figure><img src="img.jpg" alt="bar"><figcaption>Figure: bar</figcaption></figure>');
     })
     .fin(testDone)
    .done();
  });

  it('should ignore inline images (pre)', function(testDone) {
    basicBuild('foo ![bar](img.jpg)')
     .then(function(results){
       expect(results[0].content).toEqual('<p>foo <img src="img.jpg" alt="bar"></p>');
     })
     .fin(testDone)
    .done();
  });

  it('should ignore inline images (post)', function(testDone) {
    basicBuild('![bar](img.jpg) bar')
     .then(function(results){
       expect(results[0].content).toEqual('<p><img src="img.jpg" alt="bar"> bar</p>');
     })
     .fin(testDone)
    .done();
  });

  it('should ignore inline images', function(testDone) {
    basicBuild('foo ![bar](img.jpg) bar')
     .then(function(results){
       expect(results[0].content).toEqual('<p>foo <img src="img.jpg" alt="bar"> bar</p>');
     })
     .fin(testDone)
    .done();
  });

  it('should ignore multiple images in paragraph', function(testDone) {
    basicBuild('![bar1](foo1.jpg)![bar2](foo2.jpg)')
     .then(function(results){
       expect(results[0].content).toEqual('<p><img src="foo1.jpg" alt="bar1"><img src="foo2.jpg" alt="bar2"></p>');
     })
     .fin(testDone)
    .done();
  });


  it('should handle page numbers', function(testDone) {
    var config = {
      plugins: ['image-captions'],
      pluginsConfig: {
        'image-captions': {
          caption: 'Image _PAGE_LEVEL_._PAGE_IMAGE_NUMBER_ - _CAPTION_'
        }
      }
    };

    tester.builder()
     .withContent('![bar](foo.jpg)')
     .withBookJson(config)
     .withLocalPlugin(thisModulePath, 'gitbook-plugin-image-captions')
     .create()
     .then(function(results){
       expect(results[0].content).toEqual('<figure><img src="foo.jpg" alt="bar"><figcaption>Image 0.1 - bar</figcaption></figure>');
     })
     .fin(testDone)
    .done();
  });


  it('should render registry of figures', function(testDone) {
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

    tester.builder()
     .withContent(pageContent)
     .withBookJson(config)
     .withLocalPlugin(thisModulePath, 'gitbook-plugin-image-captions')
     .create()
     .then(function(results){
       expect(results[0].content).toEqual(expected);
     })
     .fin(testDone)
    .done();
  });

  it('should render image global index', function(testDone) {
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

    tester.builder()
     .withContent(pageContent)
     .withBookJson(config)
     .withLocalPlugin(thisModulePath, 'gitbook-plugin-image-captions')
     .create()
     .then(function(results){
       expect(results[0].content).toEqual(expected);
     })
     .fin(testDone)
    .done();

  });
});
