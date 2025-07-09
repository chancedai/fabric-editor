
import { emitter, showInfo } from "../../__common__/utils";
import fabric from "../fabric";
import { canvas,debouncedCommitChange } from "../canvas";


// 完整的属性映射表
const styleMapping = {
  common: [
    'fill',
    'stroke',
    'strokeWidth',
    'opacity',
    'shadow',
    'strokeUniform',
    'skewX',
    'skewY'
  ],
  rough: [
    'fillStyle',
    'roughness',
    'fillWeight',
    'hachureAngle',
    'hachureGap'
  ],
  textasset: [
    
    'fontSize',
    'fontFamily',
    'fontWeight',
    'textAlign',
    'lineHeight',
    'fontStyle',
    'underline',
    'overline',
    'linethrough',
    'charSpacing'
  ],
  textcurved: [
    
    'fontSize',
    'fontFamily',
    'fontWeight',
    'textAlign',
    'lineHeight',
    'fontStyle',
    'overline',
    'charSpacing',
    'radius',
    'spacing',
    'flipped'
  ],
  textwarped: [
    
    'fontSize',
    'fontFamily',
    'fontWeight',
    'textAlign',
    'lineHeight',
    'fontStyle',
    'overline',
    'charSpacing',
    'spacing',
    'warpType',
    'sizeTop',
    'sizeBottom',
  ],
  path: [
    
  ],
  borderimage:[

  ],
  rulerimage:[

  ],

  rect: [
    
    'rx',
    'ry',
  ],
  ellipse: [
    
  ],
  triangle: [
    
  ],
  star: [
    'innerRadius',
    'outerRadius',
    'numPoints',
  ],
  heart: [
    
  ],


  image: [
    'filters'
  ]
};

// 全局保存复制的样式对象
let styleBuffer = null;

// 状态标记：是否处于样式刷（复制）状态
canvas.isPasteMode = false;

// 假设页面已有一个复制按钮，并用 tailwindcss 类进行样式控制
// 例如默认状态：class="px-4 py-2 bg-purple-600 text-white rounded"
// 激活状态：可以加上 bg-green-500 或 ring-2 ring-green-300 等效果
let copyBtn = null;


// 复制样式函数：根据对象类型复制对应的属性
function copyStyle(target) {
  let style = {};
  // 复制 common 属性
  styleMapping.common.forEach(prop => {
    if (target[prop] !== undefined) {
      style[prop] = target[prop];
    }
  });
  // 针对图片复制滤镜
  if (target.type === 'image') {
    styleMapping.image.forEach(prop => {
      if (target[prop] !== undefined && target[prop].length > 0) {
        // 使用 slice() 简单复制数组
        style[prop] = target[prop].slice();
      }
    });
  }else{
    // 针对其他对象类型复制特定属性
    let type = target.type;
    if (styleMapping[type]) {
      styleMapping[type].forEach(prop => {
        if (target[prop] !== undefined) {
          style[prop] = target[prop];
        }
      });
    }
    // type 为 rough 开头的对象，例如 roughRect、roughEllipse 的
    if (type.startsWith('rough')) {
      styleMapping.rough.forEach(prop => {
        if (target[prop] !== undefined) {
          style[prop] = target[prop];
        }
      });
    }
  }
  return style;
}

// 粘贴样式函数：将 styleBuffer 中保存的样式应用到目标对象
function pasteStyle(target, style) {
  const type = target.type;

  const roughOptions = {};

  // 遍历 styleBuffer 中的所有属性
  for (let prop in style) {
    // 特殊处理滤镜：需要调用 applyFilters 方法
    if (prop === 'filters') {
      target.filters = style.filters.slice();
      target.applyFilters();
      continue;
    }
    // 如果 rough 相关属性，在这里暂时不处理
    if (styleMapping.rough.includes(prop)) {
      roughOptions[prop] = style[prop];
      continue;
    }
    // 判断目标是否支持该属性
    if (target[prop] !== undefined) {
      target.set(prop, style[prop]);
      // 如果是 path 对象，综的_objects 也需要设置 fill 属性
      if(type === 'path' && prop === 'fill'){
        if(target._objects){
          target._objects.forEach(obj=>{
            obj.set('fill', style[prop]);
          });
        }
      }
    } else {
      // 如果目标不支持某些属性，可以考虑做映射
      // 例如：文本对象的 fill 属性可以映射给非文本对象
      if (prop === 'fill') {
        target.set('fill', style[prop]);
      }
    }
  }
  target.setCoords();

  // 可以使用 roughOptions 的类型
  const roughTypes = ['line','linearrow','rect','roughRect','ellipse','roughEllipse','triangle','roughTriangle','star','roughStar','heart','roughHeart']
  roughTypes.push('polygon','roughPolygon');

  if(roughTypes.includes(type) && Object.keys(roughOptions).length > 0){
    const shapeIndex = target.canvas.getObjects().indexOf(target);
    let newType = type.tolowerCase().replace(/^rough/, "");
    newType = newType.charAt(0).toUpperCase() + newType.slice(1);
    let newTypeName = `Rough${newType}`;
    const NewShapeClass = fabric[newTypeName];
    const newShape = new NewShapeClass(roughOptions);
    canvas.remove(target);
    canvas.add(newShape);
    canvas.setActiveObject(newShape);
    newShape.moveTo(shapeIndex);
    debouncedCommitChange({
      target: newShape
    });
  }else{
    debouncedCommitChange({
      target: target
    });
  }
  canvas.requestRenderAll();

  showInfo('样式粘贴成功');
}

function copy(btn){
  copyBtn = btn;
  // 如果当前已经处于复制状态，则取消复制状态
  if (canvas.isPasteMode) {
    canvas.isPasteMode = false;
    styleBuffer = null;
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'default';
    // 更新按钮样式（使用 tailwindcss 类）
    if(copyBtn){
      copyBtn.classList.remove('bg-green-500', 'ring-2', 'ring-green-300');
      copyBtn.classList.add('bg-purple-600');
    }
    showInfo('样式复制已取消');
    return;
  }
  
  // 如果没有选中对象则提示
  let activeObj = canvas.getActiveObject();
  if (!activeObj) {
    showInfo('请先选中一个对象');
    return;
  }
  
  // 如果选中的是组，可以选择复制组内第一个对象的样式
  if (activeObj.type === 'group') {
    if (activeObj._objects && activeObj._objects.length > 0) {
      styleBuffer = copyStyle(activeObj._objects[0]);
    } else {
      showInfo('选中的组没有可复制的对象');
      return;
    }
  } else {
    styleBuffer = copyStyle(activeObj);
  }
  
  // 进入“样式刷”状态，更新光标和按钮样式
  canvas.isPasteMode = true;
  canvas.defaultCursor = 'copy'; // 可替换为自定义刷子图标，例如 url('brush.png'), 'pointer'
  canvas.hoverCursor = 'copy';
  
  // 更新按钮样式：激活状态显示绿色
  if(copyBtn){
    copyBtn.classList.add('bg-purple-200', 'text-purple-800');
  }
  
  showInfo('样式已复制，请点击目标对象进行粘贴');
}

// canvas 事件：在样式刷状态下点击目标对象进行样式粘贴
canvas.on('mouse:down', function(event) {
  if (!canvas.isPasteMode || !styleBuffer) return;
  let target = event.target;
  if (!target) return;
  // 粘贴后退出“样式刷”状态，并恢复按钮及光标状态
  canvas.isPasteMode = false;
  
  pasteStyle(target, styleBuffer);
  
  styleBuffer = null;
  canvas.defaultCursor = 'default';
  canvas.hoverCursor = 'default';
  if(copyBtn){
    copyBtn.classList.remove('bg-purple-200', 'text-purple-800');
  }
});


emitter.on("operation:style:copy", (btn) => {
  copy(btn);
});

  