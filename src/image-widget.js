'use strict';

var Widget = require('nd-widget'),
  Template = require('nd-template');
<<<<<<< HEAD
var filePicker;
=======
>>>>>>> eb19aad8de147607465f3771dbeba2eb49f665bf

var image = module.exports = Widget.extend({

  // 使用 handlebars
  Implements: Template,

  attrs: {
    classPrefix: 'image',
    // 模板
    template: require('./image.handlebars'),
<<<<<<< HEAD
    picker: '',

    insertInto: function(element, parentNode) {
      var picker = parentNode.find(filePicker);
=======
    insertInto: function(element, parentNode) {
      var picker = parentNode.find('.image-picker');

>>>>>>> eb19aad8de147607465f3771dbeba2eb49f665bf
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
