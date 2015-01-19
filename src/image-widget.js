'use strict';

var Widget = require('nd-widget'),
  Template = require('nd-template'),
  template = require('./image.handlebars');

module.exports = Widget.extend({

  // 使用 handlebars
  Implements: Template,

  attrs: {
    // 模板
    template: template
  },

  events: {
    'click [data-role=delete-pic]': 'del'
  },

  del: function() {
    var imgIndex = this.get('model').index;
    this.trigger('deleteImg', imgIndex);
  }


});
