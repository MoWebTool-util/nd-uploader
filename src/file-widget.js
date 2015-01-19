'use strict';

var Widget = require('nd-widget'),
  Template = require('nd-template'),
  template = require('./file.handlebars');

module.exports = Widget.extend({

  // 使用 handlebars
  Implements: Template,

  attrs: {
    // 模板
    template: template
  },

  events: {
    'click [data-role=delete-file]': 'del',
    'mouseover': 'show',
    'mouseout': 'hide'
  },

  del: function() {
    var fileIndex = this.get('model').index;
    this.trigger('deleteFile', fileIndex);
  },

  show: function() {
    this.element.find('.handle').height(20);
  },

  hide: function() {
    this.element.find('.handle').height(0);
  }


});
