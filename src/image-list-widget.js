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
    classPrefix: 'image-list',
    template: template,
    picker: ''
  },

  add: function(img) {

    var self = this,
      imageWidget = new ImageWidget({
        // classPrefix: self.get('classPrefix') + '-image',
        model: img,
        parentNode: self.element,
        picker: this.get('picker')
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
