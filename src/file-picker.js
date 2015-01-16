'use strict';

var Widget = require('nd-widget'),
  Template = require('nd-template'),
  template = require('./file-picker.handlebars');

module.exports = Widget.extend({

  // 使用 handlebars
  Implements: Template,

  attrs: {
    // 模板
    template: template
  }

});
