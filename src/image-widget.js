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
      var picker = parentNode.find('.image-picker');

      if (picker.length) {
        picker.before(element);
      } else {
        element.appendTo(parentNode);
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
