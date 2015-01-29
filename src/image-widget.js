'use strict';

var Widget = require('nd-widget'),
  Template = require('nd-template');
var filePicker;

var image = module.exports = Widget.extend({

  // 使用 handlebars
  Implements: Template,

  attrs: {
    classPrefix: 'image',
    // 模板
    template: require('./image.handlebars'),
    picker: '',

    insertInto: function(element, parentNode) {
      var picker = parentNode.find(filePicker);
      if (picker.length) {
        picker.before(element);
      } else {
        element.appendTo(parentNode);
      }
    }
  },

  setup: function() {
    filePicker = this.get('picker');
    image.superclass.setup.call(this);

  },

  events: {
    'click [data-role=delete-pic]': 'del'
  },

  del: function() {
    this.trigger('deleteImg', this.get('model').index);
  }

});
