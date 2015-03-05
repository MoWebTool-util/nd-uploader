'use strict';

var Widget = require('nd-widget'),
  Template = require('nd-template'),
  checkPlugin = require('nd-checkplugin'),
  confirm = require('nd-confirm');


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
    captureCallback: function () {
    },
    installUrl: ''
  },
  events: {
    'click [data-role="screen-shot"]': function () {
      var self = this;
      if (!checkPlugin('ND99U Plugin')) {
        confirm.show('现在安装截屏插件?', function () {
          location.href = self.get('installUrl');
        });
        return;
      }
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
        plugin1.CaptureScreen(url, auth, para, window.captureCallback);
      }
    }
  }
});


