import { fabric } from 'fabric';
import { emitter } from "../../__common__/utils";
// 导入图片占位符工具
// const PlaceholderUtil = require("./241.js");

/**
 * // 1. 基本使用 - 创建一个图片容器
const imageContainer = new fabric.ImageContainer('path/to/clip.svg', {
  width: 300,
  height: 200,
  left: 100,
  top: 100
});
canvas.add(imageContainer);

// 2. 带选项的创建
const imageContainer = new fabric.ImageContainer('path/to/clip.svg', {
  width: 300,
  height: 200
}, {
  fill: "#f0f0f0",
  imageFlipX: false,
  imageFlipY: false
}, function(obj) {
  console.log("图片容器创建完成", obj);
});
canvas.add(imageContainer);

// 3. 设置图片源
// 参数 1 为图片源，参数 2 为图片源类型，参数 3 为回调函数，参数 4 为可选配置项
// 图片源类型：
// - 'imageUrl'：图片 URL
// - 'svgUrl'：SVG URL
// - 'base64'：Base64 编码的图片数据
// - 'blob'：Blob 对象
// - 'file'：File 对象
// - 'canvas'：Canvas 对象
imageContainer.setSource('path/to/image.jpg', 'imageUrl', function() {
  console.log("图片加载完成");
}, {
  width: 300,
  height: 200
});

// 4. 修改裁剪形状
imageContainer.setClipSvgUrl('path/to/new-clip.svg', function() {
  canvas.renderAll();
});

// 5. 设置圆角
imageContainer.setRoundRadius(10); // 10px圆角
canvas.renderAll();

// 6. 调整图片旋转角度
imageContainer.updateClipAngle({
  clipAngle: 45
});
canvas.renderAll();

// 7. 从普通图片创建容器
const image = canvas.getActiveObject(); // 假设是一个fabric.Image对象
if (image && image.type === 'image') {
  const imageContainer = new fabric.ImageContainer('path/to/clip.svg', {
    width: image.width,
    height: image.height,
    left: image.left,
    top: image.top
  });
  
  imageContainer.addImageObject(image, function() {
    canvas.remove(image);
    canvas.add(imageContainer);
    canvas.renderAll();
  });
}

// 8. 分离图片，从容器中提取图片
imageContainer.detachImage(function(imageData, imageProps) {
  const img = new fabric.Image.fromObject(imageData.options, function(img) {
    img.set({
      angle: imageProps.angle,
      left: imageContainer.left,
      top: imageContainer.top
    });
    canvas.remove(imageContainer);
    canvas.add(img);
    canvas.renderAll();
  });
});

// 9. 清除图片内容
imageContainer.clearContent();
canvas.renderAll();

// 10. 响应尺寸变化
imageContainer.on('scaling', function() {
  // 重新计算裁剪大小
  imageContainer._updateClipSize();
  imageContainer.imageCanvasScale = imageContainer._caculateCanvasScale();
});

// 11. 转换为数据URL
const dataUrl = imageContainer.toDataURL({
  format: 'png',
  quality: 0.8
});

// 12. 导出到JSON
const json = canvas.toJSON(['clipSvgUrl', 'imageFlipX', 'imageFlipY']);
 
**/

let debug = false;
/**
 * 清洗并规范化 SVG 资源 URL（处理双协议、结尾多余字符、CDN地址映射等）。
 *
 * @param {string} rawUrl - 原始 URL
 * @returns {string} - 处理后的 URL
 */
function cleanResourceUrl(rawUrl) {
  if (!rawUrl || rawUrl.length === 0) {
    return rawUrl;
  }

  let cleanedUrl = rawUrl;

  // 如果是 Node 环境且是协议相对地址（以 // 开头），加上 https:
  if (fabric.isLikelyNode && cleanedUrl.startsWith("//")) {
    cleanedUrl = "https:" + cleanedUrl;
  }

  // 清除尾部的 "?" 或 "&"
  cleanedUrl = cleanedUrl.replace(/\?$/, "").replace(/&$/, "");

  // 修复错误的协议拼接
  cleanedUrl = cleanedUrl
    .replace("http:http:", "http:")
    .replace("https:https:", "https:")
    .replace("https:http:", "https:");

  // 根据 debug 切换 http/https
  if (debug) {
    cleanedUrl = cleanedUrl.replace("https://", "http://");
  } else if (cleanedUrl.startsWith("http://")) {
    cleanedUrl = cleanedUrl.replace("http://", "https://");
  }

  // Node 环境资源 URL 替换（针对中国与国际部署环境）
  if (fabric.isLikelyNode && !fabric.isSpecialNode) {
    if (fabric.IS_CN) {
      cleanedUrl = cleanedUrl
        .replace("https://u-static.fotor.com.cn", "https://fotor-pri.oss-cn-beijing-internal.aliyuncs.com")
        .replace("https://static.fotor.com.cn", "https://fotor-pub.oss-cn-beijing-internal.aliyuncs.com");
    } else {
      cleanedUrl = cleanedUrl
        .replace("https://pub-static.haozhaopian.net", "https://img-pub-fotor.s3.us-west-2.amazonaws.com")
        .replace("https://u-static.haozhaopian.net", "https://img-fotor.s3.us-west-2.amazonaws.com")
        .replace("https://test-pub-static.haozhaopian.net", "https://fotor-pub-test.s3.us-west-2.amazonaws.com")
        .replace("https://test-u-static.haozhaopian.net", "https://fotor-pri-test.s3.us-west-2.amazonaws.com");
    }
  }

  // 对 depositphotos 图片追加强制 JPEG 参数
  if (cleanedUrl.includes("depositphotos.com")) {
    cleanedUrl += cleanedUrl.includes("?") ? "&forcejpeg=true" : "?forcejpeg=true";
  }

  return cleanedUrl;
}


/**
 * 加载远程 SVG 并清理其样式（空 fill 填黑，none 透明），适用于 Fabric.js。
 *
 * @param {string} url - SVG 文件 URL
 * @param {function} onLoad - 加载成功后的回调 (objects, metadata)
 * @param {function} onError - 加载失败的回调
 * @param {object} options - 可选配置项（会自动添加 parentType: "svg"）
 */
function loadAndPrepareSvg(url, onLoad, onError, options = {}) {
  options.parentType = "svg"; // 明确指定类型供内部识别

  const cleanedUrl = cleanResourceUrl(url);

  fabric.loadSVGFromURL(
    cleanedUrl,
    function (svgObjects, metadata, originalDomElements) {
      if (originalDomElements) {
        originalDomElements.forEach((domElement, index) => {
          const fillValue = domElement.getAttribute("fill");

          // 空 fill：设为黑色并去掉 ID
          if (fillValue === "") {
            svgObjects[index].fill = "#000000";
            delete svgObjects[index].id;
          }

          // fill 为 none：设为透明黑色
          if (fillValue === "none") {
            svgObjects[index].fill = "#000000";
            svgObjects[index].opacity = 0;
          }
        });
      }

      onLoad(svgObjects, metadata);
    },
    onError,
    Object.assign({ crossOrigin: "anonymous" }, options)
  );
}


function getPlaceholder(e) {
  if (e.group && e.group.type === 'imageContainerGroup' || e.isFromContainerGroup) {
    return "";
  } else {
    return "data:image/jpg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA8AAD/4QMuaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA2LjAtYzAwMiA3OS4xNjQ0ODgsIDIwMjAvMDcvMTAtMjI6MDY6NTMgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCAyMi4wIChNYWNpbnRvc2gpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjdFNEFENjc5NTc0MDExRUM4NzUzRTZGM0ZGRDhFNTlEIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjdFNEFENjdBNTc0MDExRUM4NzUzRTZGM0ZGRDhFNTlEIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6N0U0QUQ2Nzc1NzQwMTFFQzg3NTNFNkYzRkZEOEU1OUQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6N0U0QUQ2Nzg1NzQwMTFFQzg3NTNFNkYzRkZEOEU1OUQiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAGBAQEBQQGBQUGCQYFBgkLCAYGCAsMCgoLCgoMEAwMDAwMDBAMDg8QDw4MExMUFBMTHBsbGxwfHx8fHx8fHx8fAQcHBw0MDRgQEBgaFREVGh8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//wAARCAIAAgADAREAAhEBAxEB/8QAlAABAAIDAQEAAAAAAAAAAAAAAAIEAQMFBgcBAQADAQEAAAAAAAAAAAAAAAABAgMEBRABAAIBAgIFBgwEBQUAAAAAAAECAxEEMQUhQVESBmFxgaGxMpHB0SJCUnKyEzMUB6IjRBbhgpLSRcJDc1QVEQEBAAIBBAIDAQADAQAAAAAAAQIDEUFREgQxEyFhFAVxIjJC/9oADAMBAAIRAxEAPwD769B4oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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";
  }
}

// 辅助函数：合并对象属性
function mergeObjectProperties(target, ...sources) {
  sources.forEach((source, index) => {
    if (index % 2 === 0 && source) {
      Object.keys(source).forEach(key => {
        target[key] = source[key];
      });
    }
  });
  return target;
}

/**
 * 计算将原始尺寸等比缩放以覆盖目标区域所需的最大缩放比例（Cover 模式）。
 *
 * @param {number} originalWidth - 原始宽度
 * @param {number} originalHeight - 原始高度
 * @param {number} targetWidth - 目标区域宽度
 * @param {number} targetHeight - 目标区域高度
 * @returns {number} - 缩放比例（>=1 表示放大，<1 表示缩小）
 */
function calculateCoverScale(originalWidth, originalHeight, targetWidth, targetHeight) {
  const scaleX = targetWidth / originalWidth;
  const scaleY = targetHeight / originalHeight;
  return Math.max(scaleX, scaleY);
}

var EventType = {
  UPDATE_SOURCE: "update_source",
  END_DRAG_BEDETECTED: "end_drag_beDetected"
};
/**
 * ImageContainer 类
 * 实现可裁剪的图片容器，支持SVG裁剪路径和交互功能
 */
class ImageContainer extends fabric.EnhancedImage {
  /**
   * 构造函数
   * @param {string} clipSvgPath - SVG裁剪路径
   * @param {Object} elementProps - 元素属性
   * @param {Object} options - 配置选项
   * @param {Function} callback - 完成回调
   */
  constructor(clipSvgPath, elementProps, options, callback) {
    super(elementProps, options);
    
    // 初始化属性
    this.clipSvgUrl = undefined;
    this.clipShape = undefined;
    this.placeHolderImage = undefined;
    this.roundRadius = undefined;
    this.isLandscape = undefined;
    this.imageFlipX = undefined;
    this.imageFlipY = undefined;
    this.fill = "#fff";
    this.imageVip = undefined;
    this.noScaleCache = false;
    this.beDetected = undefined;
    this.placeHolderBase64String = undefined;
    this._cacheStrokeCanvas = undefined;
    this.isDownBtn = undefined;
    this.isMoveInBtn = undefined;
    this.oCoordsClickArea = undefined;

    // 注册拖拽结束事件
    if (!fabric.isLikelyNode) {
      emitter.on(EventType.END_DRAG_BEDETECTED, () => {
        this.beDetected = false;
      });
    }

    // 设置初始属性值
    this.imageFlipX = options && options.imageFlipX;
    this.imageFlipY = options && options.imageFlipY;
    this.fill = options && options.fill;
    this.imageVip = options && options.imageVip;
    this.type = 'imageContainer';
    
    // 设置占位符图片
    this._setPlaceholder(getPlaceholder(this), options, callback);
    
    // 注册鼠标事件
    this.on("mousedown", this._onObjectMousedown);
    this.on("mouseup", this._onObjectMouseUp);
    this.on("mousemove", this._onObjectMouseMove);

    // 处理裁剪形状
    if (options && options.clipShape) {
      this.clipShape = options.clipShape;
      this.setClipTo();
      this.clipSvgUrl = clipSvgPath;
    } else if (clipSvgPath) {
      this.readyToRender = false;
      this.clipSvgUrl = clipSvgPath;
      this.setClipSvgUrl(clipSvgPath, () => {
        if (callback) {
          callback.bind(this)();
        }
      });
    }
  }

  /**
   * 鼠标按下事件处理
   * @param {Object} event - 鼠标事件对象
   */
  _onObjectMousedown(event) {
    if ((!this.placeHolderImage || (this.clipSvgUrl && !this.clipPath)) && 
        event.button === 1 && this.isRectArea(event)) {
      this.isDownBtn = true;
    }
  }

  /**
   * 鼠标释放事件处理
   * @param {Object} event - 鼠标事件对象
   */
  _onObjectMouseUp(event) {
    if (!this.placeHolderImage || (this.clipSvgUrl && !this.clipPath)) {
      if (event.button === 1 && this.isDownBtn) {
        this._computePointsInRect(event);
      }
      this.isDownBtn = false;
    }
  }

  /**
   * 鼠标移动事件处理
   * @param {Object} event - 鼠标事件对象
   */
  _onObjectMouseMove(event) {
    if (!this.placeHolderImage || (this.clipSvgUrl && !this.clipPath)) {
      if (this.isRectArea(event) && !this.isMoveInBtn) {
        if (this.canvas) {
          this.canvas.hoverCursor = "pointer";
        }
        this.isMoveInBtn = true;
        this.requestRenderCanvas();
      }
      if (!this.isRectArea(event) && this.isMoveInBtn) {
        if (this.canvas) {
          this.canvas.hoverCursor = "move";
        }
        this.isMoveInBtn = false;
        this.requestRenderCanvas();
      }
    }
  }
  

  /**
   * 判断点是否在中心矩形区域内
   * @param {Object} event - 鼠标事件对象
   * @returns {boolean} 是否在中心区域内
   */
  isRectArea(event) {
    const width = this.width;
    const height = this.height;
    
    if (width && height) {
      const leftBound = width / 2 - 80;
      const rightBound = width / 2 + 80;
      const topBound = height / 2 - 80;
      const bottomBound = height / 2 + 80;
      
      const localPoint = this.toLocalPoint(event.absolutePointer, "left", "top");
      
      if (localPoint.x >= leftBound && localPoint.x <= rightBound && 
          localPoint.y >= topBound && localPoint.y <= bottomBound && 
          !this.hasSource()) {
        return true;
      }
    }
    return false;
  }

  /**
   * 处理矩形区域内的点击
   * @param {Object} event - 鼠标事件对象
   */
  _computePointsInRect(event) {
    if (this.isRectArea(event)) {
      emitter.emit('upload_image_container', this);
    }
  }

  /**
   * 设置占位符图片
   * @param {string} base64String - Base64编码的图片
   * @param {Object} options - 配置选项
   * @param {Function} callback - 完成回调
   */
  _setPlaceholder(base64String, options, callback) {
    this.placeHolderBase64String = base64String;
    
    fabric.util.loadImage(base64String, (img) => {
      if (this.placeHolderBase64String === base64String) {
        this.placeHolderImage = img;
      }
      this.dirty = true;
      this.requestRenderCanvas();
      
      if (callback) {
        callback(this);
      }
    }, this, options && options.crossOrigin);
  }

  /**
   * 设置裁剪路径
   */
  setClipTo() {
    this.clipPath = this.clipShape;
    this.clipPath.originX = "center";
    this.clipPath.originY = "center";
    this.clipPath.left = 0;
    this.clipPath.top = 0;
    this._updateClipSize();
  }

  /**
   * 更新裁剪形状尺寸
   */
  _updateClipSize() {
    const clipPath = this.clipPath;
    if (clipPath) {
      if (clipPath.type === 'rect') {
        clipPath.width = this.width;
        clipPath.height = this.height;
      } else {
        clipPath.scaleX = this.width / clipPath.width;
        clipPath.scaleY = this.height / clipPath.height;
      }
      clipPath.dirty = true;
    }
  }

  /**
   * 裁剪更改时的回调
   * @param {boolean} isRemoved - 裁剪是否被移除
   * @param {Object} options - 选项
   */
  onClipChanged(isRemoved, options) {
    super.onClipChanged(isRemoved, options);
    if (isRemoved) {
      this.clipPath = undefined;
    } else if (this.clipShape) {
      this.setClipTo();
    }
  }

  /**
   * 获取额外的裁剪数据
   * @returns {Object|undefined} 裁剪形状或undefined
   */
  _clipExtraData() {
    return this.clipShape || undefined;
  }

  /**
   * 获取绘制图像的视口
   * @returns {Object} 视口对象
   */
  getDrawImageViewport() {
    const viewport = {...this.imageViewport};
    if (this.imageFlipX === true) {
      viewport.x = 1 - viewport.x - viewport.width;
    }
    if (this.imageFlipY === true) {
      viewport.y = 1 - viewport.y - viewport.height;
    }
    return viewport;
  }

  /**
   * 渲染填充
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  _renderFill(ctx) {
    if (!this.isImageReady() && !this.loadError && (!this.clipSvgUrl || this.clipPath)) {
      if (this.placeHolderImage) {
        const width = this.width;
        const height = this.height;
        const imgWidth = this.placeHolderImage.naturalWidth || this.placeHolderImage.width;
        const imgHeight = this.placeHolderImage.naturalHeight || this.placeHolderImage.height;
        
        const scale = calculateCoverScale(width, height, imgWidth, imgHeight);
        let scaledWidth = imgWidth * scale;
        let scaledHeight = imgHeight * scale;
        
        const offsetX = (imgWidth - (scaledWidth = width / scaledWidth * imgWidth)) / 2;
        const offsetY = (imgHeight - (scaledHeight = height / scaledHeight * imgHeight)) / (this.isLandscape ? 1 : 2);
        
        ctx.drawImage(
          this.placeHolderImage, 
          offsetX, offsetY, scaledWidth, scaledHeight, 
          -width / 2, -height / 2, width, height
        );
      } else if (!this._shouldRenderLoadingMask()) {
        this._renderPlaceholder(ctx);
      }
    }

    ctx.save();
    if (this.imageAngle && !this.isEditing) {
      ctx.rotate(fabric.util.degreesToRadians(this.imageAngle));
      ctx.scale(this.imageCanvasScale, this.imageCanvasScale);
    }
    
    if (this.imageFlipX === true || this.imageFlipY === true) {
      ctx.scale(
        this.imageFlipX === true ? -1 : 1, 
        this.imageFlipY === true ? -1 : 1
      );
    }
    
    super._renderFill(ctx);
    ctx.restore();
  }

  /**
   * 渲染占位符
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  _renderPlaceholder(ctx) {
    const width = this.width;
    const height = this.height;
    const zoom = this.canvas && this.canvas.getZoom() || 1;
    const rootScale = this.getRootScale();
    
    const circleRadius = 12 / rootScale / zoom;
    const plusSize = circleRadius;
    const lineWidth = circleRadius / 7;
    const circleOffset = plusSize / 2 + 8 / rootScale / zoom;
    
    ctx.save();
    
    // 绘制背景
    ctx.fillStyle = this.beDetected ? "#E4ECFF" : "#ffffff";
    ctx.fillRect(-width / 2, -height / 2, width, height);
    
    // 绘制圆形按钮
    ctx.moveTo(0, 0);
    ctx.beginPath();
    ctx.arc(0, 0, circleOffset, 0, Math.PI * 2);
    ctx.fillStyle = this.isMoveInBtn ? "#418AFA" : "#BEC0C8";
    ctx.fill();
    
    // 绘制加号
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = this.isMoveInBtn ? "#418AFA" : "#BEC0C8";
    ctx.fillRect(-plusSize / 2, -lineWidth / 2, plusSize, lineWidth);
    ctx.fillRect(-lineWidth / 2, -plusSize / 2, lineWidth, plusSize);
    ctx.stroke();
    
    // 绘制裁剪形状轮廓
    const clipShape = this.clipShape;
    if (this.group && this.group.drawChildrenBorders && clipShape) {
      const rxRatio = clipShape.rx / clipShape.width;
      const ryRatio = clipShape.ry / clipShape.height;
      const scaleFactor = rootScale * zoom;
      
      this._setLineDash(ctx, [3 / scaleFactor, 3 / scaleFactor], null);
      ctx.strokeStyle = "#BEC0C8";
      ctx.lineWidth = 3 / scaleFactor;
      
      fabric.RoundedRectangle.prototype._render.apply({
      // B.prototype._render.apply({
        width: width,
        height: height,
        rx: rxRatio * width,
        ry: ryRatio * height
      }, [ctx, false, true]);
      
      ctx.stroke();
    }
    
    ctx.restore();
  }

  /**
   * 绘制裁剪路径
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  _drawClipPath(ctx) {
    const clipPath = this.clipPath;
    if (clipPath) {
      const originalScaleX = clipPath.scaleX;
      const originalScaleY = clipPath.scaleY;
      
      if (this.scaleX > 1 || this.scaleY > 1) {
        clipPath.scaleX *= this.scaleX;
        clipPath.scaleY *= this.scaleY;
      }
      
      clipPath.canvas = this.canvas;
      clipPath.shouldCache();
      clipPath._transformDone = true;
      clipPath.renderCache({
        forClipping: true
      });
      
      clipPath.scaleX = originalScaleX;
      clipPath.scaleY = originalScaleY;
      
      this.drawClipPathOnCache(ctx);
    }
  }

  /**
   * 在缓存上绘制裁剪路径
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
  drawClipPathOnCache(ctx) {
    const clipPath = this.clipPath;
    super.drawClipPathOnCache(ctx, clipPath);
    this.renderLoadErrorIcon(ctx);
    
    
    if (clipPath._cacheStrokeCanvas) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      clipPath.transform(ctx);
      ctx.scale(1 / clipPath.zoomX, 1 / clipPath.zoomY);
      ctx.drawImage(clipPath._cacheStrokeCanvas, -clipPath.cacheTranslationX, -clipPath.cacheTranslationY);
      ctx.restore();
    }
  }

  /**
   * 绘制对象
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {boolean} noTransform - 是否不应用变换
   * @param {boolean} isDirty - 是否脏标记
   */
  drawObject(ctx, noTransform, isDirty) {
    super.drawObject(ctx, noTransform);
    this._renderImgStrokeByClipCache(ctx, isDirty);
  }

  /**
   * 通过裁剪缓存渲染图像描边
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {boolean} isDirty - 是否脏标记
   */
  _renderImgStrokeByClipCache(ctx, isDirty) {
    if (this.clipPath) {
      ctx.save();
      
      const canvas = ctx.canvas;
      const width = canvas.width;
      const height = canvas.height;
      
      if (isDirty) {
        this.setImageStrokeDirty();
      }
      
      ctx.globalCompositeOperation = "destination-over";
      this._renderImageStroke(ctx, canvas, {
        hasRenderedCache: true,
        targetW: width / (this.zoomX || 1),
        targetH: height / (this.zoomY || 1),
        imgW: width,
        imgH: height,
        isRevert: true
      });
      
      ctx.restore();
    }
  }

  /**
   * 渲染图像描边
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {HTMLCanvasElement} canvas - 画布元素
   * @param {Object} options - 渲染选项
   */
  _renderImageStroke(ctx, canvas, options = {}) {
    if (options.hasRenderedCache) {
      super._renderImageStroke(ctx, canvas, options);
    }
  }

  /**
   * 设置圆角半径
   * @param {number} radius - 圆角半径
   */
  setRoundRadius(radius) {
    this.roundRadius = radius;
    
    if (this.roundRadius >= 0) {
      this.clipTo = (ctx) => {
        const width = this.width;
        const height = this.height;
        O(ctx, -width / 2, -height / 2, width, height, radius);
      };
    } else {
      delete this.clipTo;
    }
  }

  /**
   * 转换为对象表示
   * @param {Array} additionalProps - 额外属性
   * @param {Object} options - 选项
   * @returns {Object} 对象表示
   */
  toObject(additionalProps, options) {
    const props = ["fill", "clipSvgUrl", "imageFlipX", "imageFlipY"].concat(additionalProps || []);
    const obj = super.toObject(props);
    
    delete obj.clipShape;
    
    if (!this.group || this.group.type !== 'imageContainerGroup') {
      delete obj.clipPath;
    }
    
    if (this.imageVip) {
      obj.imageVip = {...this.imageVip};
    }
    
    if (options && options.clearContent) {
      obj = this.clearImage(obj).target;
    }
    
    return obj;
  }

  /**
   * 设置SVG裁剪URL
   * @param {string} url - SVG URL
   * @param {Function} callback - 完成回调
   */
  setClipSvgUrl(url, callback) {
    loadAndPrepareSvg(url, (elements, options) => {
      this.readyToRender = true;
      
      if (elements && elements.length > 0) {
        this.clipShape = fabric.util.groupSVGElements(elements, options);
        this.isLandscape = this.clipShape.width / this.clipShape.height > 2;
        this.clipShape.objectCaching = false;
        
        if (this.group) {
          this.group.dirty = true;
        }
        
        this.dirty = true;
        this.setClipTo();
        this.requestRenderCanvas();
      }
      
      if (callback) {
        callback();
      }
    });
  }

  /**
   * 设置图像源
   * @param {string} src - 图像源
   * @param {string} sourceType - 源类型
   * @param {Function} callback - 完成回调
   * @param {Object} options - 选项
   */
  setSource(src, sourceType, callback, options) {
    if (this.isEditing) {
      this.exitEditing();
    }
    
    this.fromVipTemp = undefined;
    
    if (options && options.imageVip) {
      this.imageVip = options.imageVip;
    }
    
    super.setSource(src, sourceType, callback, options);
  }

  /**
   * 重新加载图像和裁剪
   * @returns {Promise} 完成的Promise
   */
  async reload() {
    const width = this.width;
    const height = this.height;
    const imageUrl = this.imageUrl;
    const clipSvgUrl = this.clipSvgUrl;
    
    return new Promise((resolve) => {
      this.setSource(imageUrl, "imageUrl", () => {}, {
        width: width,
        height: height
      });
      
      this.setClipSvgUrl(clipSvgUrl, resolve);
    });
  }

  /**
   * 更新裁剪角度
   * @param {Object} options - 更新选项
   */
  updateClipAngle(options) {
    const angle = options.clipAngle - (this.editingAngle || 0);
    this.imageAngle = angle;
    
    if (options.hasOwnProperty("flip")) {
      if (options.flip === "flipX") {
        this.imageFlipX = !this.imageFlipX;
      } else if (options.flip === "flipY") {
        this.imageFlipY = !this.imageFlipY;
      }
    }
    
    if (this.isEditing) {
      this._adjustRotatePosition();
    }
    
    this.imageCanvasScale = this._caculateCanvasScale(this.getOriginalRect());
  }

  /**
   * 计算画布缩放因子
   * @param {Object} rect - 原始矩形
   * @returns {number} 缩放因子
   */
  _caculateCanvasScale(rect) {
    if (!this.imageAngle || !this.imageViewport) {
      return 1;
    }
    
    let width = this.width;
    let height = this.height;
    
    if (rect) {
      width = rect.width;
      height = rect.height;
    }
    
    const rotatedRect = new fabric.Rect({
      width: width,
      height: height,
      left: 0,
      top: 0,
      originX: "center",
      originY: "center"
    });
    
    rotatedRect.rotate(this.imageAngle);
    rotatedRect.setCoords();
    
    const boundingRect = rotatedRect.getBoundingRect();
    const scaleRatio = Math.max(
      boundingRect.width / width, 
      boundingRect.height / height
    );
    
    return scaleRatio > 1 ? scaleRatio : 1;
  }

  /**
   * 添加图像对象
   * @param {Object} imageObject - 图像对象
   * @param {Function} callback - 完成回调
   */
  addImageObject(imageObject, callback) {
    const styles = imageObject.cloneStyles(true);
    const props = imageObject.clonePropsFromSource();
    
    this.extendStyles({...styles, ...props});
    this.initialImageSize = imageObject.initialImageSize;
    this.originalImageSize = imageObject.originalImageSize;
    this.hdImageSize = imageObject.hdImageSize;
    this.imageViewport = imageObject.imageViewport;
    this.sourceType = imageObject.sourceType;
    
    const imageWidth = imageObject.getScaledWidth();
    const imageHeight = imageObject.getScaledHeight();
    const containerWidth = this.getScaledWidth();
    const containerHeight = this.getScaledHeight();
    
    const scale = calculateCoverScale(containerWidth, containerHeight, imageWidth, imageHeight);
    const scaledWidth = imageWidth * scale;
    const scaledHeight = imageHeight * scale;
    
    this.imageAngle = imageObject.angle;
    this.imageCanvasScale = this._caculateCanvasScale();
    
    const scaleFactorX = containerWidth / scaledWidth;
    const scaleFactorY = containerHeight / scaledHeight;
    
    const newViewportWidth = this.imageViewport.width * scaleFactorX;
    const newViewportHeight = this.imageViewport.height * scaleFactorY;
    
    const offsetX = (this.imageViewport.width - newViewportWidth) / 2;
    const offsetY = (this.imageViewport.height - newViewportHeight) / 2;
    
    const src = imageObject.getSrc();
    
    this.imageViewport.x += offsetX;
    this.imageViewport.y += offsetY;
    this.imageViewport.width = newViewportWidth;
    this.imageViewport.height = newViewportHeight;
    
    this.imageUrl = src;
    this.src = src;
    
    if (!imageObject.stockPhotoInfo && imageObject.vip && imageObject.elementId) {
      this.imageVip = {
        vip: true,
        elementId: imageObject.elementId
      };
    }
    
    fabric.util.loadImage(src, (img) => {
      t.getInstance().dispatchEvent(g.MONITOR_GUIDE, {
        type: _f.f.GUIDE_CLIP,
        target: this
      });
      
      t.getInstance().dispatchEvent(g.MONITOR_GUIDE, {
        type: _f.g.GUIDE_CLIP_COLLAGE,
        target: this
      });
      
      this.setElement(img, {
        width: this.width,
        height: this.height
      });
      
      this.applyStyles(this);
      this.requestRenderCanvas();
      
      if (callback) {
        callback();
      }
    }, undefined, imageObject.crossOrigin);
  }

  /**
   * 设置选项
   * @param {Object} options - 选项
   */
  setOptions(options) {
    super.setOptions(options);
    this._updateClipSize();
  }

  /**
   * 尺寸变化处理
   * @param {Object} options - 选项
   */
  _onSizeChanged(options) {
    if (!this.group || !this.group.canModifyChildren) {
      super._onSizeChanged(options);
      this._updateClipSize();
      this.imageCanvasScale = this._caculateCanvasScale();
    }
  }

  /**
   * 更新尺寸
   * @param {Object} options - 选项
   */
  updateSize(options) {
    super.updateSize(options);
    this._updateClipSize();
    this.imageCanvasScale = this._caculateCanvasScale();
  }

  /**
   * 内部清除内容
   */
  internalCleanContent() {
    delete this.imageVip;
    super.internalCleanContent();
  }

  /**
   * 清除内容
   * @param {Object} options - 选项
   */
  clearContent(options) {
    super.clearContent(options);
    this.imageCanvasScale = 1;
    this.imageAngle = 0;
    this.imageFlipX = false;
    this.imageFlipY = false;
    this.cutoutKey = undefined;
    this.dirty = true;
    this.imageVip = undefined;
  }

  /**
   * 判断是否为VIP内容
   * @returns {boolean} 是否为VIP
   */
  isVip() {
    return this.vip || (this.imageVip && this.imageVip.vip) || super.isVip();
  }

  /**
   * 清除图像
   * @param {Object} target - 目标对象
   * @returns {Object} 清除结果
   */
  clearImage(target) {
    const obj = target || this;
    const sourceType = obj.sourceType;
    
    const originalProps = {
      sourceType: sourceType,
      imgUrl: obj.imgUrl,
      imageVip: obj.imageVip,
      stockPhotoInfo: obj.stockPhotoInfo
    };
    
    if (sourceType === _f.d.SOURCE_TYPE_IMAGE) {
      obj.sourceType = undefined;
    } else if (sourceType) {
      obj.sourceType = _f.d.SOURCE_TYPE_COLOR;
    }
    
    obj.imgUrl = "";
    obj.imageVip = undefined;
    obj.stockPhotoInfo = undefined;
    
    return {
      target: obj,
      originProps: originalProps
    };
  }

  /**
   * 获取元素颜色
   * @returns {Array} 颜色数组
   */
  getElementColors() {
    const colors = super.getElementColors();
    if (!this.hasSource()) {
      colors.push(this.fill);
    }
    return colors;
  }

  /**
   * 转换为数据URL
   * @param {Object} options - 选项
   * @returns {string} 数据URL
   */
  toDataURL(options) {
    let result;
    let originalProps;
    
    if (options && options.clearContent) {
      originalProps = this.clearImage().originProps;
    }
    
    result = super.toDataURL(options);
    
    if (options && options.clearContent) {
      for (const key in originalProps) {
        this[key] = originalProps[key];
      }
    }
  }

  /**
   * 获取原始元素ID
   * @returns {string} 元素ID
   */
  getOrignElementId() {
    if (this.imageVip) {
      return this.imageVip.elementId;
    } else {
      return this.elementId;
    }
  }

  /**
   * 分离图像
   * @param {Function} callback - 完成回调
   */
  detachImage(callback) {
    if (this.isImageReady() && this.originalImageSize) {
      const originalWidth = this.originalImageSize.width;
      const originalHeight = this.originalImageSize.height;
      
      const imageData = {
        type: _f.i.IMAGE,
        needInitSize: true,
        options: {
          imageWidth: originalWidth,
          imageHeight: originalHeight,
          url: this.getSrc(),
          stockPhotoInfo: this.stockPhotoInfo ? {...this.stockPhotoInfo} : undefined,
          vip: this.vip,
          elementId: this.getOrignElementId(),
          hdImageSize: {...this.hdImageSize},
          cutoutKey: this.cutoutKey
        }
      };
      
      const imageProps = {
        angle: this.imageAngle || 0
      };
      
      if (callback) {
        callback(imageData, imageProps);
      }
    }
  }

  /**
   * 判断控制点是否可见
   * @param {string} controlName - 控制点名称
   * @returns {boolean} 是否可见
   */
  isControlVisible(controlName) {
    if (this.group && this.group.getNearbyCorner) {
      return this.group.getNearbyCorner(this)[controlName];
    } else {
      return super.isControlVisible(controlName);
    }
  }

  /**
   * 获取矩形控制点尺寸
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {string} controlName - 控制点名称
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @returns {Object} 控制点尺寸信息
   */
  _getRectConrolSize(ctx, controlName, x, y) {
    if (this.group && this.group.getNearbyCorner) {
      let width, height, offsetX, offsetY;
      
      switch (controlName) {
        case "mt":
        case "mb":
          height = 6;
          width = 24;
          offsetY = y + 3;
          offsetX = x - 8;
          break;
        case "ml":
        case "mr":
          height = 24;
          width = 6;
          offsetY = y - 8;
          offsetX = x + 3;
      }
      
      ctx.strokeStyle = "#4BD3FB";
      ctx.lineWidth = 4;
      
      return {
        width: width,
        height: height,
        offsetX: offsetX,
        offsetY: offsetY
      };
    }
    
    return super._getRectConrolSize(ctx, controlName, x, y);
  }

  /**
   * 扩展样式
   * @param {Object} styles - 样式对象
   */
  extendStyles(styles) {
    const { imgStyles, imgStylesKey, imgStylesVip, ...otherStyles } = styles;
    
    if (this.group && this.group.type === 'imageContainerGroup') {
      super.extendStyles(otherStyles);
    } else {
      super.extendStyles(styles);
    }
  }

  /**
   * 调整图像视口
   */
  trimImageViewport() {
    // 实现为空方法，可能在子类中覆盖
  }
}


fabric.ImageContainer = ImageContainer;
