/*jslint node: true */
"use strict";

var cheerio = require('cheerio');

var insertCaptions = function(section) {
  var options = this.options.pluginsConfig['image-captions'] || {};
  var $ = cheerio.load(section.content);
  $('img').each(function(i, elem) {
    var img = $(elem);
    var wrapImage = function(caption) {
      var template = options.caption || 'Figure: _CAPTION_';
      var result = template.replace('_CAPTION_', caption);
      img.replaceWith('<figure>' + $.html(img) + '<figcaption>'+result+'</figcaption></figure>');
    };
    var title = img.attr('title');
    var alt = img.attr('alt');
    if (title) {
      wrapImage(title);
    } else if (alt) {
      wrapImage(alt);
    }
  });
  section.content = $.html();
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
        ],
    },
    ebook: {
      assets: './assets',
      css: [
         'image-captions.css'
      ]
    },
    hooks: {
      'page': function(page) {  // after page has been converted to html
        page.sections.filter(function(section) {
          return section.type == 'normal';
        })
        .forEach(insertCaptions, this);
        return page;
      }
    }
};
