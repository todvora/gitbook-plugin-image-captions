/* jslint node: true */
'use strict';
var semver = require('semver');

var plugin;

function getPluginClass (gitbook) {
  var version = null;
  if (gitbook.gitbook) {
    version = gitbook.gitbook.version;
  } else {
    version = gitbook.config.options.gitbook;
  }
  if (semver.major(version) === 3) {
    return require('./lib/ImageCaptions3');
  } else {
    return require('./lib/ImageCaptions');
  }
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
    init: function () { // before book pages has been converted to html
      var ImageCaptions = getPluginClass(this);
      plugin = new ImageCaptions();
      return plugin.onInit(this);
    },
    page: function (page) { // after page has been converted to html
      return plugin.onPage(this, page);
    }
  }
};
