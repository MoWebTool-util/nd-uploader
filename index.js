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
  ImagePicker = require('./src/image-picker'),
  FileList = require('./src/file-list-widget'),
  FilePicker = require('./src/file-picker');

var uploadedProgress = [],
  uploadingFileSize = 0,
  uploadedFileSize = 0;

var Uploader;

var removeFile = function(file) { // 删除选定的图片
  var $li = $('.index-' + file.id);
  $li.off().find('.file-panel').off().end().remove();
};

/*
 * 上传流程触发事件：
 *     progress(per, filesSize): 进度  per总进度，单位：小数;filesSize:文件总大小
 *     finished(): 队列中没有待上传的文件，此次上传完成
 *     uploadError(file, response): 失败上传一个文件 response服务端信息
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

  var uploader = new Webuploader.create($.extend({
    swf: options.swf,
    server: options.server || '',
    chunked: false, // 禁止分段上传
    disableGlobalDnd: true, // 禁掉全局的拖拽功能
    pick: options.pick || '#filePicker',
    thumb: options.thumb,
    resize: options.resize,
    auto: options.auto,
    formData: options.formData || {},
    accept: options.accept,
    fileSizeLimit: options.fileSizeLimit, // 文件总大小上限 200M
    fileSingleSizeLimit: options.fileSingleSizeLimit, // 单文件大小上限 50M
    fileNumLimit: options.fileNumLimit // 文件数量
  }, options));


  uploader.on('fileQueued', function(file) {

    var fileLength = this.getFiles('inited').length; //队列中的文件数量
    outUpload.trigger('initFileNumChange', fileLength);

    uploadingFileSize += file.size;

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

    uploadingFileSize -= file.size;
    removeFile(file);

  });


  uploader.on('uploadProgress', function(file, percentage) {

    var per = 0;
    uploadedProgress[file.id] = file.size * percentage;
    uploadedFileSize = 0;

    $.each(uploadedProgress, function(k, size) {
      uploadedFileSize += size;
    });

    per = uploadedFileSize / uploadingFileSize;

    outUpload.trigger('progress', per, uploadingFileSize);

  });


  uploader.on('uploadSuccess', function( /*file, response*/ ) {

  });


  uploader.on('uploadError', function(file, response) {
    outUpload.trigger('uploadError', file, response);
  });


  uploader.on('uploadComplete', function( /*file*/ ) {
    //outUpload.trigger('complete', file);
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
      default:
        outUpload.trigger('error', type);
    }
  });


  uploader.on('uploadFinished', function() {
    outUpload.trigger('finished');
    var fileList = uploader.getFiles();
    $.each(fileList, function(k, file) {
      removeFile(file);
    });
    this.reset();
  });

  return uploader;
}



Uploader = Widget.extend({

  // 使用 handlebars
  Implements: Template,

  attrs: {
    // 模板
    className: 'upload',
    swf: '',
    server: '',
    previewImg: false,
    previewFile: false,
    thumb: {
      width: 120,
      height: 120
    },
    resize: false,
    auto: false,
    formData: {},
    accept: null,
    fileSizeLimit: 200 * 1024 * 1024,
    fileSingleSizeLimit: 50 * 1024 * 1024,
    fileNumLimit: 9
  },

  setup: function() {

    var Picker, List, parentNode, pickBtn, self = this;

    if (this.get('accept') && this.get('accept').title === 'Images') {
      self.set('className', self.get('className') + ' image-upload');
      parentNode = '.image-upload';
      pickBtn = '#imagePicker';
      Picker = ImagePicker;
      List = ImageList;
    } else {
      self.set('className', self.get('className') + ' file-upload');
      parentNode = '.file-upload';
      pickBtn = '#filePicker',
        Picker = FilePicker;
      List = FileList;
    }
    self.render();

    self.fileList = new List({
      parentNode: parentNode
    }).render().on('del', function(index) {
      self.uploader.removeFile(index, true);
    });
    self.filePicker = new Picker({
      parentNode: parentNode
    }).render();


    self.uploader = getUploader({
      swf: self.get('swf'),
      server: self.get('server'),
      pick: '#' + self.filePicker.element.attr('id'),
      thumb: self.get('thumb'),
      resize: self.get('resize'),
      auto: self.get('auto'),
      formData: self.get('auto'),
      accept: self.get('accept'),
      fileSizeLimit: self.get('fileSizeLimit'),
      fileSingleSizeLimit: self.get('fileSingleSizeLimit'),
      fileNumLimit: self.get('fileNumLimit')
    }, self);

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
  retry: function() {
    this.uploader.retry();
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

    var uploader = this.uploader,
      fileList = uploader.getFiles();

    $.each(fileList, function(k, file) {
      removeFile(file);
    });
    this.uploader.reset();

  }

});

module.exports = Uploader;
