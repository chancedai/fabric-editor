
import { delegator, showInfo, emitter, throttle, debounce } from "../__common__/utils.js";

// Browser
// import { Vibrant } from "node-vibrant/browser";

import AlignGuideLines from './canvas/alignCuideLines.js';
import { setupHighlighting } from './canvas/highlight.js';
// import { checkIfCanvasIsEmpty } from './canvas/emptyChecker.js';
import { setupDragAndDrop } from './canvas/dragAndDropHandler.js';
import { setupObjectInfoDisplay } from './canvas/objectInfoHandler.js';
import { setupUndoRedo } from './canvas/undoRedoHandler.js';
import { bindFabricEvents } from './canvas/bindFabricEvents.js';
import { importCanvasData, initCanvasFromTemplate} from './canvas/canvasLoader.js';
import { addUndoRedoToFabric } from './canvas/undoRedo.js';
import controls from './canvas/controls.js';
import { initNavigator } from './canvas/navigator.js';
import crop from './canvas/crop.js';

import fabric from "./fabric.js";
import mitt from "mitt";
addUndoRedoToFabric(fabric);

// canvas 周边空白宽度
export const viewMargin = 60;

export const exportCanvasConfig = {
  left: 0,
  top: 0,
  width: 800,
  height: 600,
  strokeWidth: 0,
  baseName: "design",
  fileName: "design.jpg",
  fileType: "jpg",
  absolutePositioned: true, // 绝对定位
};
window.exportCanvasConfig = exportCanvasConfig;

const canvasContainer = document.getElementById("canvasContainer");
const scrollContainer = canvasContainer.parentNode; // 获取父容器




export const zoomCanvas = throttle((zoom) => {
  let center = canvas.getCenter();  // 获取画布中心点
  let point = new fabric.Point(center.left, center.top);  // 转换为 Fabric 点
  canvas.zoomToPoint(point, zoom);
  canvas.requestRenderAll();
  emitter.emit("canvas:zoom", { zoom });
}); 



export function importJSONData(jsonData, type) {
  importCanvasData(canvas, jsonData, type);
}


// 初始化
export let canvas = new fabric.Canvas("canvas", {
  fireRightClick: true, // 启用右键，button的数字为3
  stopContextMenu: true, // 禁止默认右键菜单
  controlsAboveOverlay: true, // 超出clipPath后仍然展示控制条
  imageSmoothingEnabled: true, 
  enableRetinaScaling: true,
  preserveObjectStacking: true, // 当选择画布中的对象时，让对象不在顶层。
});


controls.init(fabric, canvas);

crop(canvas);

bindFabricEvents(canvas, emitter);

// checkIfCanvasIsEmpty(canvas, canvasContainer);

setupHighlighting(canvas);

setupDragAndDrop(canvasContainer, canvas,emitter);

setupObjectInfoDisplay(canvas, emitter);

setupUndoRedo(canvas, delegator);

function initCallback({baseName,json,id}) {
  exportCanvasConfig.baseName = baseName;
  if(!id) {
    setTimeout(()=>{
      emitter.emit('operation:resize-canvas:init');
    }, 100);
  }
}

initCanvasFromTemplate(canvas, new URL(location).searchParams.get("id"), initCallback);
// canvas:loadTemplate
emitter.on('canvas:loadTemplate',(url)=>{
  
  // 同步修改 url 为类似 ?id=misc/tmpl22 ，但不刷新页面
  const newUrl = new URL(location);
  newUrl.searchParams.set("id", url);
  history.replaceState({}, "", newUrl);
  initCanvasFromTemplate(canvas, url, initCallback);
});

AlignGuideLines.init(canvas, exportCanvasConfig).enable();

emitter.on('canvas:guideLines:enable',function(){
  AlignGuideLines.enable();
});

emitter.on('canvas:guideLines:disable',function(){
  AlignGuideLines.disable();
});

emitter.on("load:canvas:before", function({
  canvasSize,
  phySize
}){
  updateDesignSize(canvasSize, phySize, false);
  // checkIfCanvasIsEmpty(canvas, canvasContainer);
  initNavigator({
    canvas, canvasContainer, exportCanvasConfig
  });
});

/**
 * 创建并初始化一个监听器，当 scrollContainer 的尺寸变化时自动更新 canvas 尺寸。
 * @param {HTMLElement} scrollContainer - 容器元素，用于监听尺寸变化。
 * @param {fabric.Canvas} canvas - fabric.js 的 Canvas 实例。
 * @returns {Function} 一个停止监听的函数。
 */
function createCanvasResizer(scrollContainer, canvas) {
  // 使用闭包变量存储上一次的宽高，用于比较是否变化
  let lastWidth = 0;
  let lastHeight = 0;

  /**
   * 更新 canvas 的尺寸为容器当前的尺寸，如果发生了变化
   */
  function updateCanvasSize() {
    const { clientWidth: width, clientHeight: height } = scrollContainer;

    // 只有在尺寸发生变化时才执行更新操作
    if (width !== lastWidth || height !== lastHeight) {
      lastWidth = width;
      lastHeight = height;

      // 设置 canvas 的新尺寸
      canvas.setDimensions({
        width: width,
        height: height
      });
    }
  }

  // 创建 ResizeObserver，在尺寸变化时执行更新函数
  const resizeObserver = new ResizeObserver(debounce(updateCanvasSize, 100));
  resizeObserver.observe(scrollContainer);

  // 初始化时默认执行一次，以确保首次渲染正确
  updateCanvasSize();

  // 返回一个函数，可用于外部取消监听
  return () => resizeObserver.disconnect();
}
const stopResizing = createCanvasResizer(scrollContainer, canvas);
// 若不再需要监听时调用：stopResizing();











export function getFabricGradient(gradient) {
  if (!gradient) {
    return null;
  }
  return new fabric.Gradient(gradient);
}

// /**
//  * 该函数用于提取画布中的颜色样本，主要是通过 Vibrant.js 库来实现的。
//  * @returns {string[]} - 返回提取的颜色数组
//  */

// // swatches 如果 canvas 没变化 swatches 也不会变化，需要缓存

// export const getSwatches = (() => {
//   let swatchesChanged = true;
//   let swatchesCache = [];
//   function logColorChange() {
//     swatchesChanged = true;
//     emitter.emit("canvas:swatches:changed");
//   }

//   // 监听 fill 变化   fill 变化时，swatches 会变化 ，所以需要监听 fill 变化
//   canvas.on({
//     "object:modified": logColorChange,
//     "object:added": logColorChange,
//     "object:removed": logColorChange,
//     "path:created": logColorChange,
//     "canvas:cleared": logColorChange,
//     "after:render": logColorChange,
    
//   });

//   return async () => {
//     if (!swatchesChanged) {
//       return swatchesCache;
//     }
//     // 定义基础颜色数组，包含黑色和白色，这些颜色默认始终存在。
//     // const baseColors = ['#000', '#fff'];
//     const baseColors = [];
//     const image = new Image();

//     // 计算缩放比例，将画布缩放至最长边不超过512像素，保持宽高比。
//     const scale = Math.min(512 / canvas.getWidth(), 512 / canvas.getHeight());
//     image.src = canvas.toDataURL({ multiplier: scale, format: "png" });

//     // 等待图片解码完成，确保图片在提取颜色之前已经准备就绪。
//     await image.decode();

//     // 创建 Vibrant 实例，用于从图片中提取主色调。
//     const vibrant = new Vibrant(image);
//     const palette = await vibrant.getPalette();
//     // const colorList = Object.values(palette).map((swatch) => swatch.getHex());

//     const colorList = [];
//     for (const swatchName in palette) {
//       if (palette.hasOwnProperty(swatchName) && palette[swatchName]) {
//         const hex = palette[swatchName].hex;
//         baseColors.push(hex);
//         colorList.push(hex);
//       }
//     }

//     swatchesCache = [...baseColors, ...colorList];
//     // 排重
//     swatchesCache = Array.from(new Set(swatchesCache));
//     swatchesChanged = false;
//     return swatchesCache;
//   };
// })();
// getSwatches.js
// 用于从 fabric.js canvas 中提取主色调，自动监听颜色变动并缓存颜色结果
// 适用于包含 shapeImage、image、pattern、普通图形对象等情况
// 包含颜色缓存、图像提色、变化侦测、Web Worker 兼容、性能优化等特性

// getSwatches.js
// 用于从 fabric.js canvas 中提取主色调，自动监听颜色变动并缓存颜色结果
// 适用于包含 shapeImage、image、pattern、普通图形对象等情况
// 包含颜色缓存、图像提色、变化侦测、性能优化等特性



// export const getSwatches = (() => {
//   let swatchesChanged = true; // 是否需要重新提色
//   let swatchesCache = []; // 缓存 swatch 颜色数组
//   const imageColorCache = new Map(); // image/pattern 对象颜色缓存

//   function normalizeHex(color) {
//     if (typeof color !== 'string') {
//       console.warn('normalizeHex received non-string:', color);
//       return null;
//     }
  
//     // 已经是合法 hex，直接处理
//     if (/^#([0-9a-fA-F]{3}){1,2}$/.test(color)) {
//       try {
//         return '#' + fabric.Color.fromHex(color).toHex().toLowerCase();
//       } catch (e) {
//         console.warn('fabric.Color.fromHex failed for:', color, e);
//         return null;
//       }
//     }
  
//     try {
//       const fabricColor = new fabric.Color(color);
//       return '#' + fabricColor.toHex().toLowerCase();
//     } catch (e) {
//       console.warn('normalizeHex failed to parse:', color, e);
//       return null;
//     }
//   }
  

//   function getColorFromFill(fill) {
//     if (typeof fill === 'string') {
//       const c = normalizeHex(fill);
//       return c ? [c] : [];
//     }
//     if (fill instanceof fabric.Color) {
//       const c = normalizeHex(fill.toHex());
//       return c ? [c] : [];
//     }
//     if (fill instanceof fabric.Gradient) {
//       return fill.colorStops.map(c => normalizeHex(c.color)).filter(Boolean);
//     }
//     if (fill?.color) {
//       const c = normalizeHex(fill.color);
//       return c ? [c] : [];
//     }
//     return [];
//   }

//   function getHashForImage(obj) {
//     if (obj.type === 'image' || obj.type === 'shapeimage') {
//       return `${obj.getSrc?.()}_${obj.scaleX}_${obj.scaleY}`;
//     }
//     if (obj.fill instanceof fabric.Pattern && obj.fill.source?.toDataURL) {
//       return `${obj.fill.source.toDataURL()}_${obj.scaleX}_${obj.scaleY}`;
//     }
//     return `${obj.type}_${obj.left}_${obj.top}_${obj.angle}`;
//   }

//   async function extractImageColors(obj) {
//     const hash = getHashForImage(obj);
//     if (imageColorCache.has(hash)) {
//       return imageColorCache.get(hash);
//     }

//     let dataUrl = null;
//     if ((obj.type === 'image' || obj.type === 'shapeimage') && obj.toDataURL) {
//       dataUrl = obj.toDataURL({ multiplier: 0.2, format: 'png' });
//     } else if (obj.fill instanceof fabric.Pattern && obj.fill.source?.toDataURL) {
//       dataUrl = obj.fill.source.toDataURL();
//     }

//     if (!dataUrl) return [];

//     const img = new Image();
//     img.src = dataUrl;
//     await img.decode();

//     const palette = await new Vibrant(img).getPalette();
//     const hexes = Object.values(palette)
//       .filter(Boolean)
//       .map(s => normalizeHex(s.hex))
//       .filter(Boolean);

//     imageColorCache.set(hash, hexes);
//     return hexes;
//   }

//   async function computeSwatches() {
//     const colors = new Set();
//     const imageObjs = [];

//     // 背景颜色
//     getColorFromFill(canvas.backgroundColor).forEach(color => colors.add(color));
//     if (canvas.backgroundImage) imageObjs.push(canvas.backgroundImage);

//     // 覆盖层颜色
//     getColorFromFill(canvas.overlayColor).forEach(color => colors.add(color));
//     if (canvas.overlayImage) imageObjs.push(canvas.overlayImage);

//     // 普通对象
//     canvas.getObjects().forEach(obj => {
//       if (
//         obj.type === 'image' ||
//         obj.type === 'shapeimage' ||
//         obj.fill instanceof fabric.Pattern
//       ) {
//         imageObjs.push(obj);
//       } else {
//         getColorFromFill(obj.fill).forEach(color => colors.add(color));
//       }
//     });

//     for (const obj of imageObjs) {
//       const extracted = await extractImageColors(obj);
//       extracted.forEach(color => colors.add(color));
//     }

//     return Array.from(colors);
//   }

//   const markSwatchesChanged = debounce(() => {
//     swatchesChanged = true;
//     emitter.emit('canvas:swatches:changed');
//   }, 100);

//   canvas.on({
//     'object:modified': markSwatchesChanged,
//     'object:added': markSwatchesChanged,
//     'object:removed': markSwatchesChanged,
//     'path:created': markSwatchesChanged,
//     'canvas:cleared': markSwatchesChanged,
//   });

//   return async function getSwatches() {
//     if (!swatchesChanged) return swatchesCache;
//     const newSwatches = await computeSwatches();
//     swatchesCache = [...new Set(newSwatches)];
//     swatchesChanged = false;
//     return swatchesCache;
//   };
// })();







export const debouncedCommitChange = debounce((data) => {
  canvas.fire('object:modified',data);
}, 1000);


/**
 * 更新设计尺寸（注意：非实际展示画布尺寸）
 * 支持如 "800x600", "21x29.7cm", "8x11inch" 格式
 * 
 * @param {string} sizeStr - 尺寸字符串
 * @param {boolean} isScaleEnabled - 是否缩放现有对象以适配新尺寸
 */
export function updateDesignSize(sizeStr, phySize,isScaleEnabled = true) {
  const image = getCanvasBackgroundImageElement();
  const { width: currentWidth, height: currentHeight } = exportCanvasConfig;
  const { targetWidth, targetHeight } = parseSizeString(sizeStr);
  exportCanvasConfig.phySize = phySize || sizeStr;

  if (!targetWidth || !targetHeight) {
    console.warn("[updateDesignSize] 无法解析尺寸字符串:", sizeStr);
    return;
  }

  if (currentWidth === targetWidth && currentHeight === targetHeight && canvas.clipPath) return;

  canvas.backgroundImage = null;

  if (isScaleEnabled) {
    zoomToFitAllContent(canvas, targetWidth, targetHeight);
    // scaleCanvasToFit(currentWidth, currentHeight, targetWidth, targetHeight);
  }

  if (image?.src) {
    setCanvasBackgroundImageCover(image, targetWidth, targetHeight);
  }

  applyCanvasSize(targetWidth, targetHeight);
  updateSizeDisplay(targetWidth, targetHeight);
}

/** 
 * 解析尺寸字符串，支持 cm/mm/inch/px/无单位格式，并转换为像素
 * @param {string} sizeStr - 例如 "8x8cm", "300x400px"
 * @param {number} dpi - 每英寸像素点数，默认 96
 * @param {number} defaultSize - 当尺寸无效时的默认值，默认 200
 * @returns {{ targetWidth: number, targetHeight: number }}
 */
function parseSizeString(sizeStr, dpi = 96, defaultSize = 1000) {
  // 移除所有空格,这样就能同时处理有空格和无空格的情况
  const cleanStr = sizeStr.replace(/\s+/g, '');
  const match = /([\d.]+)x([\d.]+)(cm|mm|inch|in|px)?/.exec(cleanStr);
  let width, height;

  if (match) {
    let [_, w, h, unit] = match;
    width = parseFloat(w);
    height = parseFloat(h);
    unit = unit || 'px';

    // 先转换成像素
    switch (unit) {
      case "inch":
      case "in":
        // 1英寸 = 96像素
        width = width * dpi; // 3.5 * 96 = 336
        height = height * dpi; // 2.0 * 96 = 192
        break;
      case "cm":
        // 1厘米 = 37.8像素
        width *= dpi / 2.54;
        height *= dpi / 2.54;
        break;
      case "mm":
        // 1毫米 = 3.78像素
        width *= dpi / 25.4;
        height *= dpi / 25.4;
        break;
      case "px":
        // 保持不变
        break;
    }

    return {
      targetWidth: Math.round(width),
      targetHeight: Math.round(height)
    };
  }

  // fallback 情况下使用 defaultSize
  const [w, h] = cleanStr.split(/[x*]/).map(Number);
  return {
    targetWidth: isNaN(w) ? defaultSize : w,
    targetHeight: isNaN(h) ? defaultSize : h,
  };
}


/** 缩放画布内容以适配新画布大小（等比缩放 + 居中） */
function scaleCanvasToFit(oldW, oldH, newW, newH) {
  const scaleRatio = Math.min(newW / oldW, newH / oldH); // 等比缩放因子

  // 缩放并重新定位所有对象
  canvas.forEachObject((obj) => {
    if (!obj) return;
    obj.set({
      left: obj.left * scaleRatio,
      top: obj.top * scaleRatio,
      scaleX: obj.scaleX * scaleRatio,
      scaleY: obj.scaleY * scaleRatio,
    }).setCoords();
  });

  // 缩放之后进行居中偏移（可选）
  const offsetX = (newW - oldW * scaleRatio) / 2;
  const offsetY = (newH - oldH * scaleRatio) / 2;

  canvas.forEachObject((obj) => {
    obj.set({
      left: obj.left + offsetX,
      top: obj.top + offsetY,
    }).setCoords();
  });

  canvas.renderAll();
}

/**
 * 自动缩放画布视图，使所有内容完整显示，等比缩放，内容不会被裁剪。
 * 
 * @param {fabric.Canvas} canvas - Fabric.js 画布实例
 * @param {number} canvasWidth - 可见画布区域宽度
 * @param {number} canvasHeight - 可见画布区域高度
 */
function zoomToFitAllContent(canvas, canvasWidth, canvasHeight) {
  const objects = canvas.getObjects();
  if (objects.length === 0) return;

  // 计算所有对象的包围盒（包含变换）
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  objects.forEach((obj) => {
    const bound = obj.getBoundingRect(true); // true = include transforms
    minX = Math.min(minX, bound.left);
    minY = Math.min(minY, bound.top);
    maxX = Math.max(maxX, bound.left + bound.width);
    maxY = Math.max(maxY, bound.top + bound.height);
  });

  // 内容原始宽高
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  // ✅ 等比缩放因子（确保内容整体不超出画布）
  const scale = Math.min(
    canvasWidth / contentWidth,
    canvasHeight / contentHeight
  );

  // ✅ 计算偏移（使内容居中显示）
  const offsetX = (canvasWidth - contentWidth * scale) / 2 - minX * scale;
  const offsetY = (canvasHeight - contentHeight * scale) / 2 - minY * scale;

  objects.forEach((obj) => {
    obj.set({
      left: obj.left * scale + offsetX,
      top: obj.top * scale + offsetY,
      scaleX: obj.scaleX * scale,
      scaleY: obj.scaleY * scale
    }).setCoords();
  });

  // 更新画布视图
  canvas.renderAll();
}






/** 设置画布背景图 */
// function setCanvasBackgroundImage(image, width, height) {
//   if (!image?.src) return;

//   canvas.setBackgroundImage(
//     image.src,
//     () => canvas.requestRenderAll(),
//     {
//       scaleX: width / image.width,
//       scaleY: height / image.height,
//       originX: "left",
//       originY: "top",
//     }
//   );
// }

/**
 * 设置画布背景图，保持宽高比，并实现“cover”效果（铺满画布，可能裁剪）
 * 
 * @param {HTMLImageElement} image - 传入的图片对象，必须包含 width 和 height 属性
 * @param {number} canvasWidth - 画布宽度
 * @param {number} canvasHeight - 画布高度
 */
function setCanvasBackgroundImageCover(image, canvasWidth, canvasHeight) {
  if (!image?.src) return;

  // 计算宽高比例，选择较大缩放比例实现“cover”效果
  // cover 要保证画布被完全覆盖，图像至少覆盖宽或高其中之一
  const scale = Math.max(canvasWidth / image.width, canvasHeight / image.height);

  // 计算缩放后图像实际尺寸
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;

  // 计算偏移量，让图片居中显示（超出部分自动裁剪）
  // originX/Y 设为 left/top，偏移用 left/top 属性调整
  const offsetX = (canvasWidth - scaledWidth) / 2;  // 负数表示图片左边部分被裁剪
  const offsetY = (canvasHeight - scaledHeight) / 2;

  // 设置背景图
  canvas.setBackgroundImage(
    image.src,
    () => canvas.requestRenderAll(),
    {
      scaleX: scale,
      scaleY: scale,
      originX: "left",
      originY: "top",
      left: offsetX,
      top: offsetY,
    }
  );
}


/** 更新 canvas 尺寸、裁剪区域，并触发 resize 事件 */
function applyCanvasSize(width, height) {
  if (!fabric) {
    console.warn("[applyCanvasSize] fabric 未定义");
    return;
  }

  canvas.clipPath = new fabric.Rect({
    width,
    height,
    absolutePositioned: true,
  });

  exportCanvasConfig.width = width;
  exportCanvasConfig.height = height;

  canvas.requestRenderAll();
  emitter?.emit("canvas:resize", { width, height });
}

/** 更新页面中显示的尺寸文本 */
function updateSizeDisplay(width, height) {
  const node = document.querySelector("[data-id='resize']");
  if (node) {
    node.textContent = `${width}x${height}`;
  }
}

/** 获取背景图的 HTML 元素 */
function getCanvasBackgroundImageElement() {
  return canvas?.backgroundImage?._element || null;
}

window.canvas = canvas;




