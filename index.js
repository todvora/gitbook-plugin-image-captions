/*jslint node: true */
"use strict";

var cheerio = require('cheerio');
var Q = require('q');

var onlyNormalSections = function(section) {
  return section.type == 'normal';
};

var getCaptionTemplate = function(imageKey, options, captionVarName) {
  // try to get image specific template from plugin configuration options
  if (options.images && options.images[imageKey] && options.images[imageKey][captionVarName]) {
    return options.images[imageKey][captionVarName];
  } else if (options[captionVarName]) {
    return options[captionVarName];
  } else {
    return 'Figure: _CAPTION_';
  }
};

var createCaption = function(image, key, options, caption_key) {
  // replace supported template placeholders
  return getCaptionTemplate(key, options, caption_key)
    .replace('_CAPTION_', image.caption) // img title or alt attribute
    .replace('_PAGE_LEVEL_', image.page_level) // book page level
    .replace('_PAGE_IMAGE_NUMBER_', image.index + 1) // order of the image on the page
    .replace('_BOOK_IMAGE_NUMBER_', image.nro); // order of the image on the book
};

var shouldBeWrapped = function(img) {
  return img.parent().children().length === 1 &&
         img.parent().text() === '' &&
         (img.attr('title') || img.attr('alt'));
};

var setImageAttributes = function(img, key, options) {
  var attributes = {};
  if (options.images && options.images[key] && options.images[key].attributes) {
    attributes = options.images[key].attributes;
  } else if(options.attributes) {
    attributes = options.attributes;
  }
  for (var attr in attributes) {
    img.attr(attr, attributes[attr]);
  }
};

var setImageCaption = function($, img, images, key, options) {
  // set image caption
  var image = images.filter(function(item){return item.key === key;})[0];
  var result = createCaption(image, key, options, 'caption');
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

var setImageAlignment = function($, options, key) {
  if (options.images && options.images[key] && options.images[key].align) {
    $('figcaption').addClass(options.images[key].align);
  } else if(options.align) {
    $('figcaption').addClass(options.align);
  }
};

var insertCaptions = function(page, section) {
  var options = this.options.pluginsConfig['image-captions'];
  var page_level = page.progress.current.level;
  var images = this.config.book.options.variables[options.variable_name];

  // process section content with jquery lib
  var $ = cheerio.load(section.content);
  // get all images from section content
  $('img').filter(function(){
    return shouldBeWrapped($(this));
  })
  .each(function(i) {
    var img = $(this);
    var key = page_level + '.' + (i+1);
    setImageAttributes(img, key, options);
    setImageCaption($, img, images, key, options);
    setImageAlignment($, options, key);
  });
  // reassign section content
  section.content = $.html();
};

var collectImages = function(page, section) {
  var $ = cheerio.load(section.content);
  return $('img')
  .filter(function() {
    return shouldBeWrapped($(this));
  })
  .map(function(i) {
    var img = $(this);
    var level = page.progress.current.level;
    var key = level + '.' +(i+1);
    return {
      index: i, // page image order
      key: key, // key concatenated from page_level.index
      backlink: page.path + '#fig' + key, // link to the image page with anchor
      page_level: level,
      caption: img.attr('title') || img.attr('alt')
    };
  })
  .get(); // convert to array
};

var readAllImages = function() {
  // iterate each files found from navigation instance
  var promises = Object.keys(this.navigation)
  .map(function(file) {
    return this.parsePage(file)
      .then(function(page) {
        var images = page.sections.filter(onlyNormalSections)
        .map(collectImages.bind(this, page))
        .reduce(function(acc, val) {return acc.concat(val);}, []); // flatten sections images
        return {
          order: parseInt(this.navigation[file].index),
          data: images
        };
    }.bind(this));
  }, this);
  return Q.all(promises);
};

var preprocessImages = function(results) {
  var totalCounter = 1;
  results.sort(function(a, b) {
    return a.order - b.order;
  })
  .reduce(function(acc, val) {return acc.concat(val.data);}, []) // flatten sections images
  .forEach(function(image) {
    image.nro = totalCounter++;
    image.list_caption = createCaption(image, image.key, this.options.pluginsConfig['image-captions'], 'list_caption');
    this.config.book.options.variables[this.options.pluginsConfig['image-captions'].variable_name].push(image);
  }, this);
};

var initPluginOptions = function() {
  // root node of plugin configuration
  if(typeof this.options.pluginsConfig['image-captions'] === 'undefined') {
    this.options.pluginsConfig['image-captions'] = {};
  }
  var options = this.options.pluginsConfig['image-captions'];
  // set name of variable with images (available later for images list)
  options.variable_name = options.variable_name || '_pictures';
  // initialize images variable to empty list
  this.config.book.options.variables[options.variable_name] = [];
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
        initPluginOptions.call(this);
        return readAllImages.call(this)
          .then(preprocessImages.bind(this));
      },
      'page': function(page) { // after page has been converted to html
        page.sections.filter(onlyNormalSections)
        .forEach(insertCaptions.bind(this, page));
        return page;
      }
    }
};
