'use strict';

var Widget = require('nd-widget'),
  Template = require('nd-template');

module.exports = Widget.extend({

  // 使用 handlebars
  Implements: Template,

  attrs: {
    classPrefix: 'file-picker',
    // 模板
    template: require('./file-picker.handlebars'),
    model: {
      placeholder: '选择文件'
    }
  }

});
