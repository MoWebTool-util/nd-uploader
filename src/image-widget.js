'use strict';

var Widget = require('nd-widget'),
  Template = require('nd-template');
var pickerId;
var image = module.exports = Widget.extend({

  // 使用 handlebars
  Implements: Template,

  attrs: {
    classPrefix: 'image',
    // 模板
    template: require('./image.handlebars'),
    picker: '',
    insertInto: function(element, parentNode) {
      var picker = parentNode.find(pickerId);

      if (picker.length) {
        picker.before(element);
      } else {
        element.appendTo(parentNode);
      }
    }
  },
  setup: function() {
    image.superclass.setup.call(this);
    pickerId = this.get('picker');
  },
  events: {
    'click [data-role=delete-pic]': 'del'
  },

  del: function() {
    this.trigger('deleteImg', this.get('model').index);
  }

});
