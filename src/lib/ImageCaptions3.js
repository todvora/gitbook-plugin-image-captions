var Q = require('q');
var ImageCaptions = require('./ImageCaptions');

// Compatibility for Gitbook 3
function ImageCaptions3 () {
  ImageCaptions.call(this);
}

ImageCaptions3.prototype = Object.create(ImageCaptions.prototype);

ImageCaptions3.prototype.getPageLevel = function (page) {
  return page.level;
};

// gitbook v3 has content stored inside page.content
ImageCaptions3.prototype.getPageParts = function (page) {
  return [page];
};

ImageCaptions3.prototype.getConfigValue = function (gitbook, expression, def) {
  return gitbook.config.get(expression) || def;
}

ImageCaptions3.prototype.persistImagesInConfig = function (gitbook, config, images) {
    gitbook.config.set(["variables", config.variable_name], images);
};

ImageCaptions3.prototype.readImagesFromConfig = function (gitbook) {
  var pluginConfig = this.readConfig(gitbook);

  return gitbook.config.get(["variables", pluginConfig.variable_name]);
};

ImageCaptions3.prototype.readAllImages = function (book) {
  var promises = [];

  var pageIndex = 0;

  book.summary.walk(function (page) {
    var currentPageIndex = pageIndex++;
    var pageText = book.readFileAsString(page.ref);

    promises.push(pageText.then(function (pageContent) {
      var pageImages = [];

      var reg = new RegExp(/!\[(.*?)\]\((.*?)(?:\s+"(.*)")?\)/gmi);
      var result;

      var index = 1;

      while ((result = reg.exec(pageContent)) !== null) {
        var image = {alt: result[1], url: result[2]};
        if (result[3]) {
          image.title = result[3];
        }

        image.label = image.title || image.alt;
        image.index = index;
        image.level = page.level;
        image.page_level = page.level;
        image.key = image.level + '.' + image.index;
        image.backlink = page.ref + '#fig' + image.key; // TODO

        pageImages.push(image);
        index++;
      }

      return {
        data: pageImages.reduce(function (acc, val) { return acc.concat(val); }, []),
        order: currentPageIndex
      };
    }));
  });
  return Q.all(promises);
};

module.exports = ImageCaptions3;
