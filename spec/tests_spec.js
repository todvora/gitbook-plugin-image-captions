var plugin = require("../index.js");

describe(__filename, function () {
  beforeEach(function() {
    // configure default options (to pretend options from gitbook)
    plugin.options = {
      'pluginsConfig' : {}
    };
  });

  var onPageHook = plugin.hooks.page;

  it("should ignore all sections except 'normal'", function (done) {
  console.log(plugin);
    var page = {'sections':[{'type':'exercise', 'content': '<img src="foo.jpg" alt="bar">'},{'type':'unknown', 'content': 'aaa'}]};
    onPageHook.call(plugin, page)
    expect(page.sections[0].content).toEqual('<img src="foo.jpg" alt="bar">');
    done();
  });

  it("should not change content without images", function (done) {
    var page = {'sections':[{'type':'normal', 'content': '<h1>test</h1><p>lorem ipsum</p>'}]};
    onPageHook.call(plugin, page);
    expect(page.sections[0].content).toEqual('<h1>test</h1><p>lorem ipsum</p>');
    done();
  });

  it("should create caption from alt attribute", function (done) {
    var page = {'sections':[{'type':'normal', 'content': '<img src="foo.jpg" alt="bar">'}]}
    onPageHook.call(plugin, page);
    expect(page.sections[0].content).toEqual('<figure><img src="foo.jpg" alt="bar"><figcaption>Figure: bar</figcaption></figure>');
    done();
  });

  it("should read caption format from options", function (done) {
     plugin.options = {
       'pluginsConfig' : {
         'image-captions': {
           'caption': 'Image - _CAPTION_'
         }
       }
     };
     var page = {'sections':[{'type':'normal', 'content': '<img src="foo.jpg" alt="bar">'}]};
     onPageHook.call(plugin, page);
     expect(page.sections[0].content).toEqual('<figure><img src="foo.jpg" alt="bar"><figcaption>Image - bar</figcaption></figure>');
     done();
  });

  it("should use title attribute if available", function (done) {
    var page = {'sections':[{'type':'normal', 'content': '<img src="foo.jpg" alt="bar" title="loremipsum">'}]};
    onPageHook.call(plugin, page);
    expect(page.sections[0].content).toEqual('<figure><img src="foo.jpg" alt="bar" title="loremipsum"><figcaption>Figure: loremipsum</figcaption></figure>');
    done();
  });

  it("should should ignore image without alt and title", function (done) {
    var page = {'sections':[{'type':'normal', 'content': '<img src="foo.jpg">'}]};
    onPageHook.call(plugin, page);
    expect(page.sections[0].content).toEqual('<img src="foo.jpg">');
    done();
  });

  it("should ignore images with empty alt", function (done) {
    var page = {'sections':[{'type':'normal', 'content': '<img src="foo.jpg" alt="">'}]};
    onPageHook.call(plugin, page);
    expect(page.sections[0].content).toEqual('<img src="foo.jpg" alt="">');
    done();
  });

  it("should ignore images with empty title and fallback to alt", function (done) {
    var page = {'sections':[{'type':'normal', 'content': '<img src="foo.jpg" alt="bar" title="">'}]};
    onPageHook.call(plugin, page);
    expect(page.sections[0].content).toEqual('<figure><img src="foo.jpg" alt="bar" title=""><figcaption>Figure: bar</figcaption></figure>');
    done();
  });
});