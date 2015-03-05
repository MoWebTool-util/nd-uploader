'use strict';

var Widget = require('nd-widget'),
  Template = require('nd-template');

module.exports = Widget.extend({
  Implements: Template,
  templatePartials: {
    swf: require('./partial/swf.handlebars')
  },
  attrs: {
    url: '',
    classPrefix: 'screen-shot',
    template: require('./screen-shot.handlebars'),
    model: {
      placeholder: '截图上传'
    },
    captureCallback:function(){}
  },
  events: {
    'click [data-role="screen-shot"]': function () {
      var url = this.get('url');
      var auth = this.get('auth');
      var para = "RRT";
      try {
        //webkit
        var plugin = document.getElementById("pluginId");
        plugin.JsCallbackFun = this.get('captureCallback');
        var callback = 'captureCallback';
        plugin.ScreenCapture(url, auth, para, callback);
      } catch (e) {
        //activex
        var plugin1 = document.getElementById("plugin");
        plugin1.CaptureScreen(url, auth, para,window.captureCallback);
      }
    }
  }
});


