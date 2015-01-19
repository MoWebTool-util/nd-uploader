'use strict';

var Widget = require('nd-widget'),
  Template = require('nd-template'),
  FileWidget = require('./file-widget'),
  template = require('./file-list.handlebars');


module.exports = Widget.extend({

  // 使用 handlebars
  Implements: Template,

  attrs: {
    // 模板
    className: 'file-list',
    template: template
  },

  add: function(file) {
    var self = this,
      fileWidget = new FileWidget({
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
