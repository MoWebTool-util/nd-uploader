'use strict';

var Widget = require('nd-widget'),
  Template = require('nd-template'),
  FileWidget = require('./file-widget');

module.exports = Widget.extend({

  // 使用 handlebars
  Implements: Template,

  attrs: {
    // 模板
    classPrefix: 'file-list',
    template: require('./file-list.handlebars')
  },

  add: function(file) {
    var self = this,
      fileWidget = new FileWidget({
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
