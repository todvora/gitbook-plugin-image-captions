var plugin = require("../index.js");

describe(__filename, function () {
  beforeEach(function() {
    // configure default options (to pretend options from gitbook)
    plugin.options = {
      'pluginsConfig' : {}
    };
  });

  var onPageHook = plugin.hooks.page;  // reference to the hook method

  it('should ignore all sections except \'normal\'', function (done) {
    var page = {'sections':[{'type':'exercise', 'content': '<p><img src="foo.jpg" alt="bar"></p>'},{'type':'unknown', 'content': 'aaa'}]};
    onPageHook.call(plugin, page); // call the hook, preserving plugin scope
    expect(page.sections[0].content).toEqual('<p><img src="foo.jpg" alt="bar"></p>');
    done();
  });

  it('should not change content without images', function (done) {
    var page = {'sections':[{'type':'normal', 'content': '<h1>test</h1><p>lorem ipsum</p>'}]};
    onPageHook.call(plugin, page); // call the hook, preserving plugin scope
    expect(page.sections[0].content).toEqual('<h1>test</h1><p>lorem ipsum</p>');
    done();
  });

  it('should create caption from alt attribute', function (done) {
    var page = {'sections':[{'type':'normal', 'content': '<p><img src="foo.jpg" alt="bar"></p>'}]};
    onPageHook.call(plugin, page); // call the hook, preserving plugin scope
    expect(page.sections[0].content).toEqual('<figure><img src="foo.jpg" alt="bar"><figcaption>Figure: bar</figcaption></figure>');
    done();
  });

  it('should read caption format from options', function (done) {
     plugin.options = {
       'pluginsConfig' : {
         'image-captions': {
           'caption': 'Image - _CAPTION_'
         }
       }
     };
     var page = {'sections':[{'type':'normal', 'content': '<p><img src="foo.jpg" alt="bar"></p>'}]};
     onPageHook.call(plugin, page); // call the hook, preserving plugin scope
     expect(page.sections[0].content).toEqual('<figure><img src="foo.jpg" alt="bar"><figcaption>Image - bar</figcaption></figure>');
     done();
  });

  it('should align caption to the left', function (done) {
     plugin.options = {
       'pluginsConfig' : {
         'image-captions': {
           'align': 'left'
         }
       }
     };
     var page = {'sections':[{'type':'normal', 'content': '<p><img src="foo.jpg" alt="bar"></p>'}]};
     onPageHook.call(plugin, page); // call the hook, preserving plugin scope
     expect(page.sections[0].content).toEqual('<figure><img src="foo.jpg" alt="bar"><figcaption class="left">Figure: bar</figcaption></figure>');
     done();
    });

  it('should prefer title attribute if available', function (done) {
    var page = {'sections':[{'type':'normal', 'content': '<p><img src="foo.jpg" alt="bar" title="loremipsum"></p>'}]};
    onPageHook.call(plugin, page); // call the hook, preserving plugin scope
    expect(page.sections[0].content).toEqual('<figure><img src="foo.jpg" alt="bar" title="loremipsum"><figcaption>Figure: loremipsum</figcaption></figure>');
    done();
  });

  it('should should ignore image without alt and title', function (done) {
    var page = {'sections':[{'type':'normal', 'content': '<p><img src="foo.jpg"></p>'}]};
    onPageHook.call(plugin, page); // call the hook, preserving plugin scope
    expect(page.sections[0].content).toEqual('<p><img src="foo.jpg"></p>');
    done();
  });

  it('should ignore images with empty alt', function (done) {
    var page = {'sections':[{'type':'normal', 'content': '<p><img src="foo.jpg" alt=""></p>'}]};
    onPageHook.call(plugin, page); // call the hook, preserving plugin scope
    expect(page.sections[0].content).toEqual('<p><img src="foo.jpg" alt=""></p>');
    done();
  });

  it('should ignore images with empty title and fallback to alt', function (done) {
    var page = {'sections':[{'type':'normal', 'content': '<p><img src="foo.jpg" alt="bar" title=""></p>'}]};
    onPageHook.call(plugin, page); // call the hook, preserving plugin scope
    expect(page.sections[0].content).toEqual('<figure><img src="foo.jpg" alt="bar" title=""><figcaption>Figure: bar</figcaption></figure>');
    done();
  });

  it('should ignore inline images (pre)', function (done) {
    var page = {'sections':[{'type':'normal', 'content': '<p>foo <img src="foo.jpg" alt="bar"></p>'}]};
    onPageHook.call(plugin, page); // call the hook, preserving plugin scope
    expect(page.sections[0].content).toEqual('<p>foo <img src="foo.jpg" alt="bar"></p>');
    done();
  });

  it('should ignore inline images (post)', function (done) {
    var page = {'sections':[{'type':'normal', 'content': '<p><img src="foo.jpg" alt="bar"> bar</p>'}]};
    onPageHook.call(plugin, page); // call the hook, preserving plugin scope
    expect(page.sections[0].content).toEqual('<p><img src="foo.jpg" alt="bar"> bar</p>');
    done();
  });

  it('should ignore inline images', function (done) {
    var page = {'sections':[{'type':'normal', 'content': '<p>foo <img src="foo.jpg" alt="bar"> bar</p>'}]};
    onPageHook.call(plugin, page); // call the hook, preserving plugin scope
    expect(page.sections[0].content).toEqual('<p>foo <img src="foo.jpg" alt="bar"> bar</p>');
    done();
  });

  it('should ignore multiple images in paragraph', function (done) {
    var page = {'sections':[{'type':'normal', 'content': '<p><img src="foo1.jpg" alt="bar1"><img src="foo2.jpg" alt="bar2"></p>'}]};
    onPageHook.call(plugin, page); // call the hook, preserving plugin scope
    expect(page.sections[0].content).toEqual('<p><img src="foo1.jpg" alt="bar1"><img src="foo2.jpg" alt="bar2"></p>');
    done();
  });
});
