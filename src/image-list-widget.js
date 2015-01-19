'use strict';

var Widget = require('nd-widget'),
  Template = require('nd-template'),
  ImageWidget = require('./image-widget'),
  template = require('./image-list.handlebars');

module.exports = Widget.extend({

  // 使用 handlebars
  Implements: Template,

  attrs: {
    // 模板
    className: 'image-list',
    template: template
  },

  add: function(img) {

    var self = this,
      imageWidget = new ImageWidget({
        model: img,
        parentNode: self.element
      }).render();

    imageWidget.on('deleteImg', function(imgIndex) {
      self.delImg(imgIndex);
    });
    return imageWidget.element;
  },

  delImg: function(imgIndex) {
    this.trigger('del', imgIndex);
  }

});
