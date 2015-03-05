'use strict';

var Widget = require('nd-widget'),
  Template = require('nd-template'),
  FileWidget = require('./file-widget');

var getFileType = function(fileName) {
  var fileNameArr = /\.[^\.]+/.exec(fileName);
  var fileType = fileNameArr ? fileNameArr[0] : '';

  return 'icon-' + (fileType ? fileType.toLowerCase().replace(/[.]/g, '') : 'noType');
};

var getFileSize = function(fileSize) {
  var ENUM = ['B', 'KB', 'MB', 'GB', 'TB'];
  var i = 0;
  for (; i < 5; i++) {
    if (fileSize / 1024 > 1) {
      fileSize /= 1024;
    } else {
      break;
    }
  }
  return Math.round(fileSize * 10) / 10 + ENUM[i];
};

module.exports = Widget.extend({

  // 使用 handlebars
  Implements: Template,

  attrs: {
    // 模板
    classPrefix: 'file-list',
    template: require('./file-list.handlebars')
  },

  add: function(file) {
    var self = this;
    file.fileType = getFileType(file.fileName);
    file.fileSize = getFileSize(file.fileSize);
    var fileWidget = new FileWidget({
      // classPrefix: self.get('classPrefix') + '-file',
      model: file,
      parentNode: self.element
    }).render();

    fileWidget.on('deleteFile', function(fileIndex) {
      self.delFile(fileIndex);
    });

    return fileWidget.element;
  },

  delFile: function(fileIndex) {
    this.trigger('del', fileIndex);
  }

});
