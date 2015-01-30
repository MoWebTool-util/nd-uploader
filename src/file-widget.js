'use strict';

var Widget = require('nd-widget'),
  Template = require('nd-template');

module.exports = Widget.extend({

  // 使用 handlebars
  Implements: Template,

  attrs: {
    classPrefix: 'file',
    // 模板
    template: require('./file.handlebars')
  },

  events: {
    'click [data-role=delete-file]': 'del'
  },

  del: function() {
    this.trigger('deleteFile', this.get('model').index);
  }


});
