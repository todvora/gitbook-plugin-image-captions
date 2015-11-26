/*jslint node: true */
"use strict";

var cheerio = require('cheerio');

// temporary image data bucket
var images = {};

var insertCaptions = function(section) {
  var options = this.options.pluginsConfig['image-captions'] || {};
  // process section content with jquery lib
  var $ = cheerio.load(section.content);
  // get all images from section content
  $('img').each(function(i, elem) {
    var img = $(elem);
    if (img.parent().children().length > 1 || img.parent().text() !== '') {
        return;
    }
    var key = section.page_level + '.' + (i+1);
    // set image attributes
    var setAttributes = function(attributes) {
      for (var attr in attributes) {
        img.attr(attr, attributes[attr]);
      }
    }
    if (options.images && options.images[key] && options.images[key].attributes) {
      setAttributes(options.images[key].attributes);
    } else if(options.attributes) {
      setAttributes(options.attributes);
    }
    // set image caption
    var wrapImage = function(caption) {
      var nro = 0;
      if (images[key] && images[key]['nro']) nro = images[key]['nro'];
      var result = createCaption(key, caption, options, 'caption', section.page_level, i, nro);
      img.parent().replaceWith('<figure id="fig'+key+'">' + $.html(img) + '<figcaption>'+result+'</figcaption></figure>');
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

var collectImages = function(section) {
  var $ = cheerio.load(section.content);
  $('img').each(function(i, elem) {
    var img = $(elem);
    if (img.parent().children().length > 1 || img.parent().text() !== '') {
        return;
    }
    var caption = img.attr('title') || img.attr('alt');
    if (caption) {
      var key = section.page_level+'.'+(i+1);
      images[key] = {
        // page image order
        index: i, 
        // image src
        src: img.src, 
        // key concatenated from page_level.index
        key: key, 
        // link to the image page with anchor
        backlink: section.href + '#fig' + key, 
        // page level
        page_level: section.page_level, 
        // caption from image title / alt
        caption: caption, 
        // book wide image number
        nro: 0, 
        // caption from image title / alt
        list_caption: null
      };
    }
  });
};

var createCaption = function(key, caption, options, caption_key, page_level, page_image_number, book_image_number) {
  var template = 'Figure: _CAPTION_';
  // try to get image specific template from plugin configuration options
  if (options.images && options.images[key] && options.images[key][caption_key])
    template = options.images[key][caption_key]
  // or try to get book specific template from plugin configuration options
  else if (options[caption_key])
    template = options[caption_key]
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
}

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
        var options = that.options.pluginsConfig['image-captions'] || {};
        // collect images only if options variable_name is set
        if (options.variable_name) {
          var files = Object.keys(that.navigation);
          var files_len = files.length-1;
          that.config.book.options.variables[options.variable_name] = that.config.book.options.variables[options.variable_name] || [];
          // iterate each files found from navigation instance
          files.forEach(function (file, ind) {
            that.parsePage(file).then(function(page) {
              page.sections.filter(function(section) {
                section.page_level = page.progress.current.level;
                section.href = page.path;
                // get only normal sections?
                return section.type == 'normal';
              })
              .forEach(collectImages, that);
            }).finally(function() {
              // process images when last page is rendered
              if (files_len == ind) {
                // set book wide order number of the images
                var keys = Object.keys(images);
                keys.sort();
                for (var i=0; i<keys.length; i++) {
                  var key = keys[i];
                  // image number is accessible from each figure caption part also.
                  images[key]['nro'] = i+1;
                  images[key]['list_caption'] = createCaption(key, images[key]['caption'], options, 'list_caption', images[key]['page_level'], images[key]['index'], images[key]['nro']);
                  // add image captions to book variables so they can be used on any page template,
                  // for example pictures.md
                  that.config.book.options.variables[options.variable_name].push(images[key]);
                }
              }
            });
          });
        }
      },
      'page': function(page) { // after page has been converted to html
        page.sections.filter(function(section) {
          section.page_level = page.progress.current.level;
          return section.type == 'normal';
        })
        .forEach(insertCaptions, this);
        return page;
      }
    }
};
