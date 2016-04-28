var cheerio = require('cheerio');
var Q = require('q');

var PLUGIN_NAME = 'image-captions';

function ImageCaptions () {
}

ImageCaptions.prototype.onInit = function (gitbook) {
  var config = this.readConfig(gitbook);
  return this.readAllImages(gitbook)
    .then(function (images) {
      return preprocessImages(images, config);
    })
    .then(function (images) {
      this.persistImagesInConfig(gitbook, config, images);
    }.bind(this));
};

// gitbook v1 and v2 has content stored inside section.content
ImageCaptions.prototype.getPageParts = function (page) {
  return page.sections.filter(onlyNormalSections);
};

ImageCaptions.prototype.onPage = function (gitbook, page) {
  var images = this.readImagesFromConfig(gitbook);

  this.getPageParts(page)
    .forEach(function (section) {
      var html = this.insertCaptions(images, page, section.content);
      section.content = html; // side effect!
    }.bind(this));
  return page;
};

ImageCaptions.prototype.getPageLevel = function (page) {
  return page.progress.current.level;
};

ImageCaptions.prototype.getConfigValue = function (gitbook, expression, def) {
  return gitbook.options[expression] || def;
};

ImageCaptions.prototype.readConfig = function (gitbook) {
  var config = this.getConfigValue(gitbook, 'pluginsConfig', {})[PLUGIN_NAME] || {};
  // set name of variable with images (available later for images list)
  config.variable_name = config.variable_name || '_pictures';
  return config;
};

ImageCaptions.prototype.persistImagesInConfig = function (gitbook, config, images) {
  this.getConfigValue(gitbook, 'variables', {})[config.variable_name] = images; // side effect!
};

ImageCaptions.prototype.readImagesFromConfig = function (gitbook) {
  var pluginConfig = this.readConfig(gitbook);
  return this.getConfigValue(gitbook, 'variables', {})[pluginConfig.variable_name];
};

function getCaptionTemplate (imageKey, options, captionVarName) {
  // try to get image specific template from plugin configuration options
  if (options.images && options.images[imageKey] && options.images[imageKey][captionVarName]) {
    return options.images[imageKey][captionVarName];
  } else if (options[captionVarName]) {
    return options[captionVarName];
  } else {
    return 'Figure: _CAPTION_';
  }
}

function createCaption (image, key, options, captionKey) {
  // replace supported template placeholders
  return getCaptionTemplate(key, options, captionKey)
    .replace('_CAPTION_', image.label) // img title or alt attribute
    .replace('_PAGE_LEVEL_', image.page_level) // book page level
    .replace('_PAGE_IMAGE_NUMBER_', image.index) // order of the image on the page
    .replace('_BOOK_IMAGE_NUMBER_', image.nro); // order of the image on the book
}

function setImageAttributes (img, data) {
  for (var attr in data.attributes) {
    img.attr(attr, data.attributes[attr]);
  }
}

function setImageCaption ($, img, data) {
  var imageParent = img.parent();
  var figure = '<figure id="fig' + data.key + '">' + $.html(img) + '<figcaption>' + data.caption + '</figcaption></figure>';
  if (imageParent[0].tagName === 'p') {
    // the image is wrapped only by a paragraph
    imageParent.replaceWith(figure);
  } else {
    // the image is wrapped by a link and this link is then wrapped by a paragraph
    img.replaceWith(figure);
    imageParent.parent().replaceWith(imageParent);
  }
}

function setImageAlignment ($, img, data) {
  if (data.align) {
    $('figcaption').addClass(data.align); // TODO: this is wrong, it sets align to all!
  }
}

ImageCaptions.prototype.insertCaptions = function (images, page, htmlContent) {
  var pageLevel = this.getPageLevel(page);

  // process section content with jquery lib
  var $ = cheerio.load(htmlContent);
  // get all images from section content
  $('img').filter(function () {
    return shouldBeWrapped($(this));
  })
  .each(function (i) {
    var img = $(this);
    var key = pageLevel + '.' + (i + 1);

    var data = images.filter(function (item) { return item.key === key; })[0];

    setImageAttributes(img, data);
    setImageCaption($, img, data);
    setImageAlignment($, img, data);
  });
  return $.html();
};

function readImageAttributesFromConfig (config, imageKey) {
  if (config.images && config.images[imageKey] && config.images[imageKey].attributes) {
    return config.images[imageKey].attributes;
  } else if (config.attributes) {
    return config.attributes;
  }
  return {};
}

function readAlignFromConfig (config, imageKey) {
  if (config.images && config.images[imageKey] && config.images[imageKey].align) {
    return config.images[imageKey].align;
  } else if (config.align) {
    return config.align;
  }
  return null;
}

function shouldBeWrapped (img) {
  return img.parent().children().length === 1 &&
         img.parent().text() === '' &&
         (img.attr('title') || img.attr('alt'));
};

function onlyNormalSections (section) {
  return section.type === 'normal';
};

function preprocessImages (results, config) {
  var totalCounter = 1;
  return results.sort(function (a, b) {
    return a.order - b.order;
  })
  .reduce(function (acc, val) { return acc.concat(val.data); }, []) // flatten sections images
  .map(function (image) {
    image.nro = totalCounter++;
    image.attributes = readImageAttributesFromConfig(config, image.key);

    var align = readAlignFromConfig(config, image.key);
    if (align) {
      image.align = align;
    }
    image.list_caption = createCaption(image, image.key, config, 'list_caption');
    image.caption = createCaption(image, image.key, config, 'caption');
    return image;
  }, this);
}

ImageCaptions.prototype.collectImages = function (page, section) {
  var level = this.getPageLevel(page);
  var $ = cheerio.load(section.content);
  return $('img')
  .filter(function () {
    return shouldBeWrapped($(this));
  })
  .map(function (i) {
    var img = $(this);
    var index = i + 1;
    var key = level + '.' + index;
    return {
      index: index, // page image order
      key: key, // key concatenated from page_level.index
      backlink: page.path + '#fig' + key, // link to the image page with anchor
      page_level: level,
      label: img.attr('title') || img.attr('alt')
    };
  })
  .get(); // convert to array
};

ImageCaptions.prototype.readAllImages = function (gitbook) {
  // iterate each files found from navigation instance
  var promises = Object.keys(gitbook.navigation)
  .map(function (file) {
    return gitbook.parsePage(file)
      .then(function (page) {
        var images = page.sections.filter(onlyNormalSections)
        .map(this.collectImages.bind(this, page))
        .reduce(function (acc, val) { return acc.concat(val); }, []); // flatten sections images
        return {
          order: parseInt(gitbook.navigation[file].index),
          data: images
        };
      }.bind(this));
  }, this);
  return Q.all(promises);
};

module.exports = ImageCaptions;
