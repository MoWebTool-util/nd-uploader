'use strict';

var Widget = require('nd-widget'),
  Template = require('nd-template');

module.exports = Widget.extend({

  // 使用 handlebars
  Implements: Template,

  attrs: {
    classPrefix: 'image',
    // 模板
    template: require('./image.handlebars'),
    insertInto: function(element, parentNode) {
      var images = parentNode.find('.' + this.get('classPrefix'));

      if (images.length) {
        images.eq(images.length - 1).after(element);
      } else {
        element.prependTo(parentNode);
      }
    }
  },

  events: {
    'click [data-role=delete-pic]': 'del'
  },

  del: function() {
    this.trigger('deleteImg', this.get('model').index);
  }

});
