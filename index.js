/**
 * Description: index.js
 * Author: LinNing <565153851@qq.com>
 * Date: 2015-01-16 14:52:39
 */

'use strict';

var $ = require('jquery'),
  Widget = require('nd-widget'),
  // Template = require('nd-template'),
  Webuploader = require('./vendor/webuploader'),
  ImageList = require('./src/image-list-widget'),
  FileList = require('./src/file-list-widget'),
  FilePicker = require('./src/file-picker');

var fileUploaderIndex = 0;

var Uploader;

var removeFile = function(file) { // 删除选定的图片
  var $li = $('.index-' + file.id);
  $li.off().find('.file-panel').off().end().remove();
};

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
 *     dupLicate(): 文件重复选择
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
    removeFile(file);
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
        outUpload.trigger('dupLicate');
        break;
      default:
        outUpload.trigger('error', type);
    }
  });

  uploader.on('uploadFinished', function() {
    outUpload.trigger('finished');

    outUpload.uploadedProgress = {};
    outUpload.uploadingFileSize = 0;
    outUpload.uploadedFileSize = 0;

  });

  return uploader;
}

Uploader = Widget.extend({

  // 使用 handlebars
  // Implements: Template,

  attrs: {
    // 模板
    classPrefix: 'ui-uploader',
    swf: '',
    server: '',
    previewImg: false,
    previewFile: false,
    pickerInList: false,
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
    var self = this,
      List, parentNode, pickerClassName, ListClassName,
      classPrefix = this.get('classPrefix'),
      title = this.get('accept') ? this.get('accept').title : '',
      isImg = $.inArray(title, ['img', 'Img', 'image', 'Image', 'images', 'Images']) !== -1;

    fileUploaderIndex++;
    this.uploadedProgress = {};
    this.flag = true;
    this.uploadingFileSize = 0;
    this.uploadedFileSize = 0;

    if (isImg) {
      self.set('id', 'image-upload' + fileUploaderIndex);
      parentNode = '#image-upload' + fileUploaderIndex;
      pickerClassName = 'image-picker';
      List = ImageList;
      ListClassName = 'image-list';
    } else {
      self.set('id', 'file-upload' + fileUploaderIndex);
      parentNode = '#file-upload' + fileUploaderIndex;
      pickerClassName = 'file-picker';
      List = FileList;
      ListClassName = 'file-list';
    }

    self.set('className', classPrefix);

    self.render();

    self.fileList = new List({
      classPrefix: classPrefix + '-' + ListClassName,
      id: ListClassName + '-' + fileUploaderIndex,
      picker: '#' + pickerClassName + '-' + fileUploaderIndex,
      parentNode: parentNode
    }).render().on('del', function(index) {
      self.uploader.removeFile(index, true);
    });

    if (self.get('pickerInList')) {
      parentNode = self.fileList.element;
    }

    self.filePicker = new FilePicker({
      classPrefix: classPrefix + '-' + pickerClassName,
      id: pickerClassName + '-' + fileUploaderIndex,
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
  stop: function(flag) {
    flag ? this.uploader.stop(flag) : this.uploader.stop();
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

    this.uploadedProgress = {};
    this.uploadingFileSize = 0;
    this.uploadedFileSize = 0;

    this.uploader.reset();
  }

});

module.exports = Uploader;
