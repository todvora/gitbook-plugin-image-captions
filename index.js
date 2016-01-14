/*jslint node: true */
"use strict";

var cheerio = require('cheerio');
var Q = require('q');

// temporary image data bucket
var images = {};

var createCaption = function(key, caption, options, caption_key, page_level, page_image_number, book_image_number) {
  var template = 'Figure: _CAPTION_';
  // try to get image specific template from plugin configuration options
  if (options.images && options.images[key] && options.images[key][caption_key]) {
    template = options.images[key][caption_key];
  } else if (options[caption_key]) {
    // or try to get book specific template from plugin configuration options
    template = options[caption_key];
  }
  // replace supported template placeholders:
  // _CAPTION_ = img title or alt attribute
  // _PAGE_LEVEL_ = book page level
  // _PAGE_IMAGE_NUMBER_ = order of the image on the page
  // _BOOK_IMAGE_NUMBER_ = order of the image on the book
  var result = template.replace('_CAPTION_', caption);
  result = result.replace('_PAGE_LEVEL_', page_level);
  result = result.replace('_PAGE_IMAGE_NUMBER_', page_image_number+1);
  result = result.replace('_BOOK_IMAGE_NUMBER_', book_image_number);
  return result;
};

var insertCaptions = function(page, section) {
  var options = this.options.pluginsConfig['image-captions'] || {};
  var page_level = page.progress.current.level;
  // process section content with jquery lib
  var $ = cheerio.load(section.content);
  // get all images from section content
  $('img').each(function(i, elem) {
    var img = $(elem);
    if (img.parent().children().length > 1 || img.parent().text() !== '') {
        return;
    }
    var key = page_level + '.' + (i+1);
    // set image attributes
    var setAttributes = function(attributes) {
      for (var attr in attributes) {
        img.attr(attr, attributes[attr]);
      }
    };
    if (options.images && options.images[key] && options.images[key].attributes) {
      setAttributes(options.images[key].attributes);
    } else if(options.attributes) {
      setAttributes(options.attributes);
    }
    // set image caption
    var wrapImage = function(caption) {
      var nro = 0;
      if (images[key] && images[key].nro) {
        nro = images[key].nro;
      }
      var result = createCaption(key, caption, options, 'caption', page_level, i, nro);
      var imageParent = img.parent();
      var figure = '<figure id="fig'+key+'">' + $.html(img) + '<figcaption>'+result+'</figcaption></figure>';
      if(imageParent[0].tagName === 'p') {
          // the image is wrapped only by a paragraph
          imageParent.replaceWith(figure);
      } else {
        // the image is wrapped by a link and this link is then wrapped by a paragraph
        img.replaceWith(figure);
        imageParent.parent().replaceWith(imageParent);
      }
    };
    var caption = img.attr('title') || img.attr('alt');
    if (caption) {
      wrapImage(caption);
      // set figure caption alignment
      if (options.images && options.images[key] && options.images[key].align) {
        $('figcaption').addClass(options.images[key].align);
      } else if(options.align) {
        $('figcaption').addClass(options.align);
      }
    }
  });
  // reassign section content
  section.content = $.html();
};

var collectImages = function(page, section) {
  var that = this;
  var $ = cheerio.load(section.content);
  $('img').each(function(i, elem) {
    var img = $(elem);
    if (img.parent().children().length > 1 || img.parent().text() !== '') {
        return;
    }
    var caption = img.attr('title') || img.attr('alt');
    if (caption) {
      var level = page.progress.current.level;
      var key = level + '.' +(i+1);
      images[key] = {
        // page image order
        index: i,
        // image src
        src: img.src,
        // key concatenated from page_level.index
        key: key,
        // link to the image page with anchor
        backlink: page.path + '#fig' + key,
        // page level
        page_level: level,
        // caption from image title / alt
        caption: caption,
        // book wide image number
        nro: 0,
        // caption from image title / alt
        list_caption: null
      };
      images[key].nro = that.config.book.options.variables[that.options.pluginsConfig['image-captions'].variable_name].length+1;
      images[key].list_caption = createCaption(key, caption, that.options.pluginsConfig['image-captions'], 'list_caption', level, i, images[key].nro);
      that.config.book.options.variables[that.options.pluginsConfig['image-captions'].variable_name].push(images[key]);
    }
  });
};

module.exports = {
    book: { // compatibility with the gitbook version 1.x
        assets: './assets',
        css: [
            'image-captions.css'
        ]
    },
    website: {
        assets: './assets',
        css: [
            'image-captions.css'
        ]
    },
    ebook: {
      assets: './assets',
      css: [
         'image-captions.css'
      ]
    },
    hooks: {
      'init': function() { // before book pages has been converted to html
        var that = this;
        if(!that.options.pluginsConfig['image-captions']) {
          that.options.pluginsConfig['image-captions'] = {};
        }
        var options = that.options.pluginsConfig['image-captions'];
        options.variable_name = options.variable_name || '_pictures';
        that.config.book.options.variables[options.variable_name] = [];
        // iterate each files found from navigation instance
        var promises = Object.keys(that.navigation).map(function(key) {
          return {key: key, order: parseInt(that.navigation[key].index)};
        })
        .sort(function(a, b) {
          return a.order - b.order;
        })
        .reduce(function(previous, file) {
          return previous.then(function () {
            return that.parsePage(file.key)
              .then(function(page) {
                return page.sections.filter(function(section) {
                  // get only normal sections?
                  return section.type == 'normal';
                })
              .map(collectImages.bind(that, page));
            });
          });
         }, new Q());
        return Q.all(promises);
      },
      'page': function(page) { // after page has been converted to html
        page.sections.filter(function(section) {
          return section.type == 'normal';
        })
        .forEach(insertCaptions.bind(this, page));
        return page;
      }
    }
};