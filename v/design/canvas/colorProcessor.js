// colorProcessor.js

import { Vibrant } from "node-vibrant/browser";
import { debounce, emitter } from '/v/__common__/utils';
import { fabric } from 'fabric'; // 假设已引入

const imageColorCache = new Map();
let swatchesChanged = true;
let swatchesCache = [];

// ------------------ 颜色工具 ------------------
function normalizeHex(color) {
  if (typeof color !== 'string') return null;
  if (/^#([0-9a-fA-F]{3}){1,2}$/.test(color)) {
    try {
      return '#' + fabric.Color.fromHex(color).toHex().toLowerCase();
    } catch {
      return null;
    }
  }
  try {
    return '#' + new fabric.Color(color).toHex().toLowerCase();
  } catch {
    return null;
  }
}

function getColorFromFill(fill) {
  if (typeof fill === 'string') return [normalizeHex(fill)].filter(Boolean);
  if (fill instanceof fabric.Color) return [normalizeHex(fill.toHex())].filter(Boolean);
  if (fill instanceof fabric.Gradient)
    return fill.colorStops.map(c => normalizeHex(c.color)).filter(Boolean);
  if (fill?.color) return [normalizeHex(fill.color)].filter(Boolean);
  return [];
}

// stroke  所有对象 有这个属性
function getColorFromStroke(stroke) {
  if (typeof stroke === 'string') return [normalizeHex(stroke)].filter(Boolean);
  if (stroke instanceof fabric.Color) return [normalizeHex(stroke.toHex())].filter(Boolean);
  if (stroke instanceof fabric.Gradient)
    return stroke.colorStops.map(c => normalizeHex(c.color)).filter(Boolean);
  return [];
}

// ppColor type 为 shapeimage 有这个属性
function getColorFromPpColor(ppColor) {
  if (typeof ppColor === 'string') return [normalizeHex(ppColor)].filter(Boolean);
  if (ppColor instanceof fabric.Color) return [normalizeHex(ppColor.toHex())].filter(Boolean);
  if (ppColor instanceof fabric.Gradient)
    return ppColor.colorStops.map(c => normalizeHex(c.color)).filter(Boolean);
  return [];
}

// textBackground type 为 text 开头 有这个属性
function getColorFromTextBackgroundColor(textBackground) {
  if (typeof textBackground === 'string') return [normalizeHex(textBackground)].filter(Boolean);
  return [];
}

// backgroundColor  所有对象 有这个属性
function getColorFromBackgroundColor(backgroundColor) {
  if (typeof backgroundColor === 'string') return [normalizeHex(backgroundColor)].filter(Boolean);
  return [];
}

// bottomFill  只有 type为 	textasset 有这个属性
function getColorFromBottomFill(bottomFill) {
  if (typeof bottomFill === 'string') return [normalizeHex(bottomFill)].filter(Boolean);
  if (bottomFill instanceof fabric.Color) return [normalizeHex(bottomFill.toHex())].filter(Boolean);
  if (bottomFill instanceof fabric.Gradient)
    return bottomFill.colorStops.map(c => normalizeHex(c.color)).filter(Boolean);
  return [];
}

// shadow 所有对象 有这个属性
function getColorFromShadow(shadow) {
  if (typeof shadow === 'string') return [normalizeHex(shadow)].filter(Boolean);
  return [];
}



function getHashForImage(obj) {
    if(obj._hash){
        return obj._hash;
    }
    // src 和 dataurl 很长，可以缩短 
    let hash = obj.uid;
    if(obj.type === 'image' || obj.type === 'shapeimage'){
        hash = `${obj.getSrc?.()}`;
    }
    if(obj.fill instanceof fabric.Pattern && obj.fill.source?.toDataURL){
        hash = `${obj.fill.source.toDataURL()}`;
    }
    if(hash.length > 100){
        hash = hash.substring(0, 100);
    }
    if(!hash){
        hash = `${obj.type}_${obj.left}_${obj.top}_${obj.width}_${obj.height}_${obj.angle}`;
    }
    obj._hash = hash;
    return hash;
}

// ------------------ 提取图片颜色 ------------------
async function extractImageColors(obj) {
  const hash = getHashForImage(obj);
  if (imageColorCache.has(hash)) return imageColorCache.get(hash);

  let dataUrl = null;
  if ((obj.type === 'image' || obj.type === 'shapeimage') && obj.toDataURL) {
    dataUrl = obj.toDataURL({ multiplier: 0.2, format: 'png' });
  } else if (obj.fill instanceof fabric.Pattern && obj.fill.source?.toDataURL) {
    dataUrl = obj.fill.source.toDataURL();
  }

  if (!dataUrl) return [];

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = dataUrl;
  await img.decode();

  const palette = await new Vibrant(img).getPalette();
  const hexes = Object.values(palette).filter(Boolean).map(s => normalizeHex(s.hex)).filter(Boolean);
  imageColorCache.set(hash, hexes);
  return hexes;
}

// ------------------ 获取所有 Swatches ------------------
export const getSwatches = (() => {
  async function computeSwatches() {
    const colors = new Set();
    const imageObjs = [];

    getColorFromFill(canvas.backgroundColor).forEach(c => colors.add(c));
    if (canvas.backgroundImage) imageObjs.push(canvas.backgroundImage);

    getColorFromFill(canvas.overlayColor).forEach(c => colors.add(c));
    if (canvas.overlayImage) imageObjs.push(canvas.overlayImage);

    canvas.getObjects().forEach(obj => {
      if (
        obj.type === 'image' ||
        obj.type === 'shapeimage' ||
        obj.fill instanceof fabric.Pattern
      ) {
        imageObjs.push(obj);
      } else {
        getColorFromFill(obj.fill).forEach(c => colors.add(c));
        getColorFromStroke(obj.stroke).forEach(c => colors.add(c));
        getColorFromBackgroundColor(obj.backgroundColor).forEach(c => colors.add(c));
        if(obj.shadow && obj.shadow.color){
          getColorFromShadow(obj.shadow.color).forEach(c => colors.add(c));
        }
        if(obj.type === 'textasset'){
          getColorFromBottomFill(obj.bottomFill).forEach(c => colors.add(c));
        }
        if(obj.type === 'shapeimage'){
          getColorFromPpColor(obj.ppColor).forEach(c => colors.add(c));
        }
        if(obj.type.startsWith('text')){
          getColorFromTextBackgroundColor(obj.textBackgroundColor).forEach(c => colors.add(c));
        }
        
      }
    });

    for (const obj of imageObjs) {
      const extracted = await extractImageColors(obj);
      extracted.forEach(c => colors.add(c));
    }

    return Array.from(colors);
  }

  const markSwatchesChanged = debounce(() => {
    swatchesChanged = true;
    emitter.emit('canvas:swatches:changed');
  }, 100);

  canvas.on({
    'object:modified': markSwatchesChanged,
    'object:added': markSwatchesChanged,
    'object:removed': markSwatchesChanged,
    'path:created': markSwatchesChanged,
    'canvas:cleared': markSwatchesChanged,
  });

  return async function () {
    if (!swatchesChanged) return swatchesCache;
    swatchesCache = await computeSwatches();
    swatchesChanged = false;
    return swatchesCache;
  };
})();

