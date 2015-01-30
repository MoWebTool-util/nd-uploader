/**
 * Description: index.js
 * Author: LinNing <565153851@qq.com>
 * Date: 2015-01-16 14:52:39
 */

'use strict';

var $ = require('jquery'),
  Widget = require('nd-widget'),
  Template = require('nd-template'),
  Webuploader = require('./vendor/webuploader'),
  ImageList = require('./src/image-list-widget'),
  FileList = require('./src/file-list-widget'),
  FilePicker = require('./src/file-picker');

/*
 * 上传流程触发事件：
 *     progress(per, filesSize): 进度  per总进度，单位：小数;filesSize:文件总大小
 *     finished(): 队列中没有待上传的文件，此次上传完成
 *     uploadSuccess(file, response): 成功上传一个文件 response服务端信息
 *     uploadError(file, response): 失败上传一个文件 response服务端信息
 *     uploadComplete(file): 上传一个文件完成（成功或失败）
 *     initFileNumChange(num): 待上传文件数量变化
 *
 * 错误信息事件：
 *     exceedNumLimit(): 超过文件数量限制
 *     exceedSizeLimit(): 超过总文件大小
 *     exceedSingleSizeLimit(): 单文件超过大小限制
 *     typeDenied(): 文件类型不满足
 *     error(type): 其他错误 type：错误类型 字符串
 *
 * @param params
 * @return {*}
 **/
function getUploader(options, outUpload) {

  var uploader = new Webuploader.create($.extend(true, {
    server: '',
    chunked: false, // 禁止分段上传
    disableGlobalDnd: true, // 禁掉全局的拖拽功能
    pick: '#filePicker',
    formData: {}
  }, options));

  uploader.on('fileQueued', function(file) {

    var fileLength = this.getFiles('inited').length; //队列中的文件数量
    outUpload.trigger('initFileNumChange', fileLength);

    outUpload.uploadingFileSize += file.size;

    if (outUpload.get('previewImg')) {
      var $imgTpl = outUpload.fileList.add({
          index: file.id,
          fileName: file.name
        }),
        $img = $imgTpl.find('.pic');

      // 创建缩略图
      uploader.makeThumb(file, function(error, src) {
        if (error) {
          $img.replaceWith('<span>不能预览</span>');
          return;
        }
        $img.attr('src', src);
      });
    } else if (outUpload.get('previewFile')) {
      outUpload.fileList.add({
        index: file.id,
        fileName: file.name
      });
    }
  });

  uploader.on('fileDequeued', function(file) {
    var fileLength = this.getFiles('inited').length; //队列中的文件数量
    outUpload.trigger('initFileNumChange', fileLength);

    outUpload.uploadingFileSize -= file.size;
    outUpload.removeFile(file);
  });

  uploader.on('uploadProgress', function(file, percentage) {
    if (outUpload.flag) {
      outUpload.flag = false;
      var per = 0;
      outUpload.uploadedProgress[file.id] = file.size * percentage;
      outUpload.uploadedFileSize = 0;

      $.each(outUpload.uploadedProgress, function(k, size) {
        outUpload.uploadedFileSize += size;
      });

      per = outUpload.uploadedFileSize / outUpload.uploadingFileSize;
      outUpload.trigger('progress', per, outUpload.uploadingFileSize);
      outUpload.flag = true;
    }
  });

  uploader.on('uploadSuccess', function(file, response) {
    outUpload.trigger('uploadSuccess', file, response);
  });

  uploader.on('uploadError', function(file, response) {
    outUpload.trigger('uploadError', file, response);
  });

  uploader.on('uploadComplete', function(file) {
    outUpload.trigger('uploadComplete', file);
  });

  //错误信息
  uploader.on('error', function(type) {
    switch (type) {
      case 'Q_EXCEED_NUM_LIMIT': //超过文件数量限制
        outUpload.trigger('exceedNumLimit');
        break;
      case 'Q_EXCEED_SIZE_LIMIT': //超过总文件大小
        outUpload.trigger('exceedSizeLimit');
        break;
      case 'F_EXCEED_SIZE': //单文件超过大小限制
        outUpload.trigger('exceedSingleSizeLimit');
        break;
      case 'Q_TYPE_DENIED': //文件类型不满足
        outUpload.trigger('typeDenied');
        break;
      case 'F_DUPLICATE': //文件重复选择
        outUpload.trigger('duplicate');
        break;
      default:
        outUpload.trigger('error', type);
    }
  });

  uploader.on('uploadFinished', function() {
    outUpload.trigger('finished');

    outUpload.initProps();
  });

  return uploader;
}

module.exports = Widget.extend({

  // 使用 handlebars
  Implements: Template,

  attrs: {
    // 模板
    classPrefix: 'ui-uploader',
    template: require('./src/uploader.handlebars'),
    swf: './vendor/uploader.swf',
    server: '',
    previewImg: false,
    previewFile: false,
    pickerInList: false,
    thumb: {
      width: 120,
      height: 120,
      quality: 100
    },
    resize: false,
    auto: false,
    formData: {},
    accept: null,
    fileSizeLimit: 200 * 1024 * 1024,
    fileSingleSizeLimit: 50 * 1024 * 1024,
    fileNumLimit: 9
  },

  initProps: function() {
    this.uploadedProgress = {};
    this.uploadingFileSize = 0;
    this.uploadedFileSize = 0;
  },

  setup: function() {
    var accept = this.get('accept'),
      title = accept ? accept.title : '';

    this.isImg = title && $.inArray(title, ['img', 'Img', 'image', 'Image', 'images', 'Images']) !== -1;

    this.flag = true;

    this.render();

    this.initFileList();
    this.initFilePicker();
    this.initUploader();
  },

  /**
   * 创建文件队列
   */
  initFileList: function() {
    var self = this,
      List = (this.isImg ? ImageList : FileList);

    this.fileList = new List({
      classPrefix: this.get('classPrefix') + '-' + (this.isImg ? 'image' : 'file') + '-list',
      parentNode: this.element
    }).render().on('del', function(index) {
      self.uploader.removeFile(index, true);
    });
  },

  /**
   * 创建文件选择器
   */
  initFilePicker: function() {
    this.filePicker = new FilePicker({
      classPrefix: this.get('classPrefix') + '-' + (this.isImg ? 'image' : 'file') + '-picker',
      parentNode: this.get('pickerInList') ? this.fileList.element : this.element
    }).render();
  },

  /**
   * 创建 webuploader
   */
  initUploader: function() {
    this.uploader = getUploader({
      swf: this.get('swf'),
      server: this.get('server'),
      pick: this.filePicker.element,
      thumb: this.get('thumb'),
      resize: this.get('resize'),
      auto: this.get('auto'),
      formData: this.get('formData'),
      accept: this.get('accept'),
      fileSizeLimit: this.get('fileSizeLimit'),
      fileSingleSizeLimit: this.get('fileSingleSizeLimit'),
      fileNumLimit: this.get('fileNumLimit')
    }, this);
  },

  /**
   * 创建缩略图
   */
  makeThumb: function(width, height) {
    var self = this,
      uploader = this.uploader,
      fileList = uploader.getFiles('inited'),
      files = fileList.length,
      imgList = [],
      count = 0;

    $.each(fileList, function(k, file) {
      uploader.makeThumb(file, function(error, src) {
        imgList.push(src);
        count++;

        if (count === files) {
          self.trigger('thumbMade', imgList);
        }

      }, width, height);
    });
  },

  /**
   * 上传
   */
  upload: function() {
    this.uploader.upload();
  },

  /**
   * 重传
   */
  retry: function(file) {
    if (!!file) {
      this.uploader.retry(file);
    } else {
      this.uploader.retry();
    }
  },

  /**
   * 取消上传
   */
  cancel: function() {
    var uploader = this.uploader,
      fileList = uploader.getFiles();

    $.each(fileList, function(k, file) {
      uploader.cancelFile(file);
    });
  },

  /**
   * 暂停上传
   */
  stop: function() {
    this.uploader.stop();
  },

  /**
   * 获取上传队列文件数量
   * @return fileNum 文件数量
   */
  getInitFileNum: function() {
    return this.uploader.getFiles('inited').length;
  },

  reset: function() {
    var self = this,
      uploader = this.uploader,
      fileList = uploader.getFiles();

    $.each(fileList, function(k, file) {
      self.removeFile(file);
    });

    this.initProps();

    this.uploader.reset();
  },

  // 删除选定的图片
  removeFile: function(file) {
    this.$('[data-index=' + file.id + ']').off().remove();
  }

});
