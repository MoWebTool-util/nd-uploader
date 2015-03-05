/**
 * Description: index.js
 * Author: LinNing <565153851@qq.com>
 * Date: 2015-01-16 14:52:39
 */

'use strict';

var $ = require('jquery'),
  Widget = require('nd-widget'),
  Template = require('nd-template'),
  NDImage = require('nd-image'),
  Webuploader = require('./vendor/webuploader'),
  ImageList = require('./src/image-list-widget'),
  FileList = require('./src/file-list-widget'),
  FilePicker = require('./src/file-picker'),
  ScreenShot = require('./src/screen-shot/screen-shot');

/*
 * 上传流程触发事件：
 *     progress(per, filesSize): 进度  per总进度，单位：小数;filesSize:文件总大小
 *     finished(): 队列中没有待上传的文件，此次上传完成
 *     uploadSuccess(file, response): 成功上传一个文件 response服务端信息
 *     uploadError(file, response): 失败上传一个文件 response服务端信息
 *     uploadComplete(file): 上传一个文件完成（成功或失败）
 *     initFileNumChange(num): 待上传文件数量变化
 *     fileQueued(file): 文件加入队列
 *
 * 错误信息事件：
 *     exceedNumLimit(): 超过文件数量限制
 *     exceedSizeLimit(): 超过总文件大小
 *     exceedSingleSizeLimit(): 单文件超过大小限制
 *     typeDenied(): 文件类型不满足
 *     error(type): 其他错误 type：错误类型 字符串
 *
 * @param params
 *
 * @param swf                  swf地址
 * @param server               接收文件地址
 * @param accept               接收文件格式 下面为图片格式的实例
 * @param previewImg           是否预览图片  (上传图片时使用，默认false)
 * @param previewFile          是否显示文件信息 (上传文件时使用，默认false)
 * @param formData             表单附加消息
 * @param fileSizeLimit        总文件最大限制，默认200M
 * @param fileSingleSizeLimit  单文件最大限制，默认50M
 * @param fileNumLimit         文件数量限制，默认9个
 * @param multiple             是否开启文件多选功能
 * @param screenShot            是否开启截图上传功能
 *
 * accept参数示例
 * accept: {title: 'Images', extensions: 'gif,jpg,jpeg,bmp,png', mimeTypes: 'image/*'}
 *
 * @function
 *
 * upload() {文件上传}
 * retry(file) {文件重传,(有参数，则重传选定文件，没有参数则重传上传状态为error及未上传的文件)}
 * cancel() {取消文件上传}
 * stop() {暂停文件上传}
 * getInitFileNum() {获取上传队列文件数量,返回值为文件数量}
 * reset() {重置上传队列}
 * removeFile(file) {将选定文件从队列中移除}
 * makeThumb(width, height) {创建缩略图,参数为缩略图宽高，返回base64}
 *
 * @return {*}
 **/

var renderPic = function (img) {
  var width = $(img).parent().width();
  var height = $(img).parent().height();
  NDImage.load({
    url: img.src,

    ready: function () {

      var self = this;

      NDImage.zoom({
        node: img,
        width: self.width,
        height: self.height,
        maxWidth: width,
        maxHeight: height,
        overflow: true,
        stretch: true,
        callback: function (w, h) {
          img.width = w;
          img.height = h;
        }
      });

      NDImage.center({
        node: img,
        width: width,
        height: height,
        callback: function (t, l) {
          $(img).css({
            top: t,
            left: l
          });
        }
      });

    }

  });
};

function getUploader(options, outUpload) {
  if (!Webuploader.Uploader.support()) {
    alert('您的浏览器不支持该上传功能！请升级浏览器或者下载flash播放器！');
    throw new Error('WebUploader is not supported by the browser you are using.');
  }
  var uploader = new Webuploader.Uploader($.extend(true, {
    server: '',
    chunked: false, // 禁止分段上传
    compress: false, //禁止压缩
    disableGlobalDnd: true, // 禁掉全局的拖拽功能
    pick: '#filePicker',
    formData: {}
  }, options));

  uploader.on('fileQueued', function (file) {
    var completeLength = this.getFiles('complete').length;
    var fileLength = this.getFiles('inited').length + completeLength; //队列中的文件数量
    outUpload.trigger('fileQueued', file);
    outUpload.trigger('initFileNumChange', fileLength, completeLength);

    outUpload.uploadingFileSize += file.size;
    outUpload._inited++;
    if (outUpload._inited > options.fileNumLimit) {
      uploader.removeFile(file);
      return;
    }
    if (outUpload.get('previewImg')) {
      var $imgTpl = outUpload.fileList.add({
          index: file.id,
          fileName: file.name
        }),
        $img = $imgTpl.find('.pic');

      // 创建缩略图
      if (file.src) {
        $img.attr('src', file.src);
        $img.attr('data-id', file.img);
        renderPic($img[0]);
      } else {
        uploader.makeThumb(file, function (error, src) {
          if (error) {
            $img.replaceWith('<span>不能预览</span>');
            return;
          }
          $img.attr('src', src);
        });
      }
    } else if (outUpload.get('previewFile')) {
      outUpload.fileList.add({
        index: file.id,
        fileName: file.name,
        fileSize: file.size
      });
    }
  });

  uploader.on('fileDequeued', function (file) {
    var completeLength = this.getFiles('complete').length;
    var fileLength = this.getFiles('inited').length + completeLength; //队列中的文件数量
    outUpload.trigger('initFileNumChange', fileLength, completeLength);
    outUpload._inited--;

    outUpload.uploadingFileSize -= file.size;
    outUpload.removeFile(file);
  });

  uploader.on('uploadProgress', function (file, percentage) {
    outUpload.uploadedProgress[file.id] = file.size * percentage;
    if (outUpload.flag) {
      outUpload.flag = false;
      outUpload.uploadedFileSize = 0;
      $.each(outUpload.uploadedProgress, function (k, size) {
        outUpload.uploadedFileSize += size;
      });

      var per = outUpload.uploadedFileSize / outUpload.uploadingFileSize;
      outUpload.trigger('progress', per, outUpload.uploadingFileSize);
      outUpload.flag = true;
    }
  });

  uploader.on('uploadSuccess', function (file, response) {
    outUpload.uploadedProgress[file.id] = file.size;
    outUpload.trigger('uploadSuccess', file, response);
  });

  uploader.on('uploadError', function (file, response) {
    outUpload.trigger('uploadError', file, response);
  });

  uploader.on('uploadComplete', function (file) {
    outUpload.trigger('uploadComplete', file);
  });

  //错误信息
  uploader.on('error', function (type) {
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

  uploader.on('uploadFinished', function () {
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
    screenShot: false,
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
    fileNumLimit: 9,
    multiple: true,
    url:'',//给截图使用的（服务端api接口地址）
    auth:'',//给截图使用的(上传接口需要的一些登录的cookie信息)
    captureCallback:null//必须是全局函数
  },

  initProps: function () {
    this.uploadedProgress = {};
    this.uploadingFileSize = 0;
    this.uploadedFileSize = 0;
    this._inited = 0;
  },

  setup: function () {
    var accept = this.get('accept'),
      title = accept ? accept.title : '';

    this.isImg = title && $.inArray(title, ['img', 'Img', 'image', 'Image', 'images', 'Images']) !== -1;

    this.flag = true;

    this.render();

    this.initFileList();
    this.initFilePicker();
    if (this.get('screenShot')) {
      this.initScreenShot();
    }
    this.initUploader();
  },

  /**
   * 创建文件队列
   */
  initFileList: function () {
    var self = this,
      List = (this.isImg ? ImageList : FileList);

    this.fileList = new List({
      classPrefix: this.get('classPrefix') + '-' + (this.isImg ? 'image' : 'file') + '-list',
      parentNode: this.element
    }).render().on('del', function (index) {
        self.uploader.removeFile(index, true);
      });
  },

  /**
   * 创建文件选择器
   */
  initFilePicker: function () {
    this.filePicker = new FilePicker({
      classPrefix: this.get('classPrefix') + '-' + (this.isImg ? 'image' : 'file') + '-picker',
      parentNode: this.get('pickerInList') ? this.fileList.element : this.element
    }).render();
  },

  /**
   * 截图上传
   */
  initScreenShot: function () {
    this.screenShot = new ScreenShot({
      classPrefix: this.get('classPrefix') + '-' + 'screen-shot',
      parentNode: this.get('pickerInList') ? this.fileList.element : this.element,
      url:this.get('url'),
      auth:this.get('auth'),
      captureCallback:this.get('captureCallback')
    }).render();
  },

  /**
   * 创建 webuploader
   */
  initUploader: function () {
    this.uploader = getUploader({
      swf: this.get('swf'),
      server: this.get('server'),
      pick: {
        id: this.filePicker.element,
        multiple: this.get('multiple')
      },
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
   * @param width 缩略图宽度 没有传参数默认为图片原始宽度
   * @param height 缩略图高度 没有传参数默认为图片原始高度
   */
  makeThumb: function (width, height) {
    var self = this,
      uploader = this.uploader,
      fileList = uploader.getFiles('inited'),
      files = fileList.length,
      imgList = [],
      count = 0,
      thumbWidth = 0,
      thumbHeight = 0;

    $.each(fileList, function (k, file) {
      thumbWidth = width ? width : file['_info'].width;
      thumbHeight = height ? height : file['_info'].height;
      uploader.makeThumb(file, function (error, src) {
        imgList.push(src);
        count++;

        if (count === files) {
          self.trigger('thumbMade', imgList);
        }

      }, thumbWidth, thumbHeight);
    });
  },

  /**
   * 上传
   */
  upload: function (arg) {
    this.uploader.upload(arg);
  },

  /**
   * 重传
   */
  retry: function (arg) {
    this.uploader.retry(arg);
  },

  /**
   * 取消上传
   */
  cancel: function () {
    var uploader = this.uploader,
      fileList = uploader.getFiles();

    $.each(fileList, function (k, file) {
      uploader.cancelFile(file);
    });
  },

  /**
   * 暂停上传
   */
  stop: function (arg) {
    this.uploader.stop(arg);
  },


  createFile: function (source) {
    return new Webuploader.File(source);
  },

  addFile: function (file) {
    this.uploader.addFile(file);
  },

  /**
   * 获取上传队列文件数量
   * @return fileNum 文件数量
   */
  getInitFileNum: function () {
    return this.uploader.getFiles('inited').length;
  },

  reset: function () {
    var self = this,
      uploader = this.uploader,
      fileList = uploader.getFiles();

    $.each(fileList, function (k, file) {
      self.removeFile(file);
    });

    this.initProps();

    this.uploader.reset();
  },

  // 删除选定的图片
  removeFile: function (file) {
    this.trigger('deleteFile', file);
    this.$('[data-index=' + file.id + ']').off().remove();
  }

});
