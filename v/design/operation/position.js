import {
  delegator,
  emitter,
  showInfo,
  throttle,
  debounce,
  render
} from "../../__common__/utils";
import fabric from "../fabric";
import { canvas, exportCanvasConfig, debouncedCommitChange } from "../canvas";
import lib from "../lib";
import { panel } from "../component/sidebar";
import elements from "../elements";


let refs = null;
let updates = {};
let aspectRatio = 1;

let activeObject = null;
let isAspectRatioLocked = true; // 是否锁定比例
window.objectTransformFromEditPanel = false;
window.activeObject = activeObject;

function createQuickValuesFromDimension(totalSize, type = "width") {
  const isHorizontal = type === "width" || type === "left";
  const isPosition = type === "left" || type === "top";

  const ratios = [
    [1, 12], [1, 6], [1, 4], [1, 3], [1, 2],
    [2, 3], [3, 4], [5, 6], [11, 12], [1, 1],
  ];

  // 如果是 left 或 top，还需要加一个 0 的比例
  if (isPosition) {
    ratios.unshift([0, 12]);
  }

  return ratios.map(([numerator, denominator]) => {
    const ratio = numerator / denominator;
    const value = Math.round(totalSize * ratio);
    const percent = Math.round(ratio * 100);
    const fractionLabel = `${numerator}/${denominator}`;
    const labelText = isPosition
      ? `偏移 ${fractionLabel} (${value}px / ${percent}%)`
      : `${fractionLabel} (${value}px / ${percent}%)`;

    const isImportant = ["1/2", "1/3", "2/3"].includes(fractionLabel);
    const svgSize = 24;
    const barLength = Math.round(ratio * svgSize);
    const barRemainder = svgSize - barLength;

    const svg = isHorizontal
      ? `<svg class="w-6 h-4 mr-1" viewBox="0 0 24 10" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="2" width="${barLength}" height="6" fill="currentColor"/>
          <rect x="${barLength}" y="2" width="${barRemainder}" height="6" fill="#e5e7eb"/>
        </svg>`
      : `<svg class="w-3 h-5 mr-1" viewBox="0 0 10 24" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="${svgSize - barLength}" width="6" height="${barLength}" fill="currentColor"/>
          <rect x="2" y="0" width="6" height="${svgSize - barLength}" fill="#e5e7eb"/>
        </svg>`;

    return {
      value: value,
      label: `
        <span class="flex items-center">
          ${svg}
          <span class="text-xs ${isImportant ? 'font-bold text-slate-900' : 'text-slate-700'}">
            ${labelText}
          </span>
        </span>
      `
    };
  });
}

  

  function createAngleQuickValues(angles = [0, 30, 45, 60, 90, 120, 135, 180, 225, 270, 315, 360], options = {}) {
    const {
      highlightAngles = [0, 45, 90, 135, 180, 270, 360],
      angleNames = {
        0: "水平（右）",
        30: "斜上（右）",
        45: "右上对角",
        60: "斜上（中）",
        90: "垂直（上）",
        120: "斜上（左）",
        135: "左上对角",
        180: "水平（左）",
        225: "左下对角",
        270: "垂直（下）",
        315: "右下对角",
        360: "水平（右）"
      }
    } = options;
  
    const importantAngles = new Set(highlightAngles);

  return angles.map((angle) => {
    const radians = angle * Math.PI / 180;
    const x2 = 12 + 8 * Math.cos(radians);
    const y2 = 12 + 8 * Math.sin(radians);
    const labelText = `${angleNames[angle] || ""} ${angle}°`;
    const isImportant = importantAngles.has(angle);

    return {
      value: angle,
      label: `
        <span class="flex items-center">
          <svg class="w-5 h-5 mr-1 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="12" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"></line>
          </svg>
          <span class="text-xs ${isImportant ? 'font-bold text-slate-900' : 'text-slate-700'}">
            ${labelText}
          </span>
        </span>
      `
    };
  });
}
  


function renderUI(hasGroupSelection) {
  if(refs){
    refs.wrapper.style.display = '';
    return;
  }
  // 点击按钮，实现对象为画布的固定比例宽，分成 12 段
  // const buttonsWidth = [
  //   ["1/12", 1],
  //   ["2/12", 2],
  //   ["3/12", 3],
  //   ["4/12", 4],
  //   ["5/12", 5],
  //   ["6/12", 6],
  //   ["7/12", 7],
  //   ["8/12", 8],
  //   ["9/12", 9],
  //   ["10/12", 10],
  //   ["11/12", 11],
  //   ["12/12", 12]
  // ];

  const alignButtonGroups = {
    page: [
      ["水平居中", "centerH", "vicon-layout-centerH"],
      ["垂直居中", "centerV", "vicon-layout-centerH rotate-90"],
      ["左对齐", "left", "vicon-layout-left"],
      ["右对齐", "right", "vicon-layout-left rotate-180"],
      ["顶部对齐", "top", "vicon-layout-bottom rotate-90"],
      ["底部对齐", "bottom", "vicon-layout-bottom"],
      ["中心对齐", "center", "vicon-layout-center"],
    ],
    elements: [
      ["等宽", "equalWidth", "vicon-layout-equalWidth"],
      ["等高", "equalHeight", "vicon-layout-equalWidth rotate-90"],
      ["水平对齐", "alignH", "vicon-layout-centerH rotate-90"],
      ["垂直对齐", "alignV", "vicon-layout-centerH"],
      ["左对齐", "left", "vicon-layout-left"],
      ["右对齐", "right", "vicon-layout-left rotate-180"],
      ["顶部对齐", "top", "vicon-layout-bottom rotate-90"],
      ["底部对齐", "bottom", "vicon-layout-bottom"],
      ["水平分布", "distributeH", "vicon-layout-distributeV rotate-90"],
      ["垂直分布", "distributeV", "vicon-layout-distributeV"],
      ["中心对齐", "center", "vicon-layout-center"],
    ]
  };
  
  const buttonClass = "btn-secondary";
  
  // 补全文字到 4 字，使用中文全角空格确保对齐效果
  function padLabel(text, targetLength = 4) {
    return text.padEnd(targetLength, "\u3000");
  }
  
  // 统一按钮 HTML 生成器
  function createButtonHtml(group, hasGroupSelection = "") {
    return alignButtonGroups[group]
      .map(([label, action, icon]) => {
        const paddedText = padLabel(label);
        return `<button data-action="${group}-${action}" class="${buttonClass}" ${group === "elements" ? hasGroupSelection : ""}>
          <i class="text-lg mr-1 ${icon}"></i>
          ${paddedText}
        </button>`;
      })
      .join("");
  }
  
  const pageAlignButtonsHtml = createButtonHtml("page");
  const elementsAlignButtonsHtml = createButtonHtml("elements", hasGroupSelection);
  
  
  // {
  //   title: "翻转",
  //   iconClass: "vicon-flip rotate-90",
  //   type: "menuFlipRotate",
  //   more: [
  //     {
  //       title: "水平翻转",
  //       iconClass: "vicon-flip",
  //       type: "objFlipX"
  //     },
  //     {
  //       title: "垂直翻转",
  //       iconClass: "vicon-flip rotate-90",
  //       type: "objFlipY"
  //     },
  //     {
  //       type: 'hr',
  //     },
  //     {
  //       title: "左转90°",
  //       iconClass: "vicon-rotate scale-x-[-1]",
  //       type: "objRotateLeft"
  //     },
  //     {
  //       title: "右转90°",
  //       iconClass: "vicon-rotate rotate",
  //       type: "objRotateRight"
  //     },
  //   ]
  // },
  // objFlipX: () => {
  //   canvas.modifyObject("flipX");
  // },
  // objFlipY: () => {
  //   canvas.modifyObject("flipY");
  // },
  // objRotateLeft: () => {
  //   canvas.modifyObject("angleBy", -90);
  // },
  // objRotateRight: () => {
  //   canvas.modifyObject("angleBy", 90);
  // },
  
  // UI 渲染
  refs = render("", (d, e, f, _if) => {
    const elementsSection = `
      <div data-id="elementsWrapper" style="${hasGroupSelection ? '' : 'display:none'}">
        ${render.section("", [
          render.titleRow("元素对齐", ""),
          `<div data-id="elements" class="pt-2 grid grid-cols-2 gap-2">${elementsAlignButtonsHtml}</div>`
        ])}
      </div>
    `;
  
    return `
      <div data-id="wrapper" class="text-sm h-full overflow-auto">
        ${render.section("", [
          render.titleRow("位置", ""),
          render.row("水平", "leftSlider"),
          render.row("垂直", "topSlider"),
        ])}
        ${render.section("", [
          render.titleRow("页面对齐", ""),
          `<div data-id="page" class="grid grid-cols-2 gap-2">${pageAlignButtonsHtml}</div>`,
        ])}
        ${elementsSection}
        ${render.section("", [
          render.titleRow("宽高", "ratio"),
          render.row("宽度", "widthSlider"),
          render.row("高度", "heightSlider"),
        ])}
        <! -- 翻转 -->
        ${render.section("", [
          render.titleRow("翻转", "menuFlipRotate"),
          render.row("角度", "angleSlider"),
          `<div data-id="flipRotate" class="grid grid-cols-2 gap-2">
            <button data-action="rotate-rotateLeft" class="${buttonClass}">
              <i class="text-lg mr-1 vicon-rotate scale-x-[-1]"></i>
              左转90°
            </button>
            <button data-action="rotate-rotateRight" class="${buttonClass}">
              <i class="text-lg mr-1 vicon-rotate rotate"></i>
              右转90°
            </button>
            <button data-action="rotate-flipX" class="${buttonClass}">
              <i class="text-lg mr-1 vicon-flip"></i>
              水平翻转
            </button>
            <button data-action="rotate-flipY" class="${buttonClass}">
              <i class="text-lg mr-1 vicon-flip rotate-90"></i>
              垂直翻转
            </button>
          </div>`,
          
        ])}

      </div>
    `;
  }, panel.content);

  // 事件处理
  delegator.on(refs.wrapper, "click", "[data-action]", (e, target) => {
    if (target.disabled) return;
  
    const [group, action] = target.dataset.action.split("-");
  
    if (group === "page") {
      alignToPage(action);
    } else if (group === "elements") {
      alignElements(action);
    } else if (group === "rotate") {
      switch (action) {
        case "rotateLeft":
          canvas.modifyObject("angleBy", -90);
          break;
        case "rotateRight":
          canvas.modifyObject("angleBy", 90);
          break;
        case "flipX":
          canvas.modifyObject("flipX");
          break;
        case "flipY":
          canvas.modifyObject("flipY");
          break;
        default:
          break;
      }
    }

  });
  

  
  elements.getGui(refs.ratio, "iosCheckbox", {
    checked: isAspectRatioLocked,
    label: "锁定比例",
    labelPosition: 'after',
    onchange: (checked) => {
      isAspectRatioLocked = checked;
    },
  });

  // 更新对象大小并触发渲染
  const updateSize = (dimension, value) => {
    if (dimension === "width") {
      activeObject.set("scaleX", value / activeObject.width);
      if (isAspectRatioLocked) {
        const newHeight = value / aspectRatio;
        activeObject.set("scaleY", newHeight / activeObject.height);
        updateHeightSlider(newHeight);
      }
    } else {
      activeObject.set("scaleY", value / activeObject.height);
      if (isAspectRatioLocked) {
        const newWidth = value * aspectRatio;
        activeObject.set("scaleX", newWidth / activeObject.width);
        updateWidthSlider(newWidth);
      }
    }
    canvas.requestRenderAll();
    debouncedCommitChange
  };


  const widthQuickValues = createQuickValuesFromDimension(exportCanvasConfig.width, "width");
  const heightQuickValues = createQuickValuesFromDimension(exportCanvasConfig.height, "height");
  const leftQuickValues = createQuickValuesFromDimension(exportCanvasConfig.width, "left");
  const topQuickValues = createQuickValuesFromDimension(exportCanvasConfig.height, "top");

  const { update: updateWidthSlider } = elements.getGui(refs.widthSlider, "slider", {
    value: activeObject.getScaledWidth(),
    min: 1,
    max: exportCanvasConfig.width,
    inputMax: 2 * exportCanvasConfig.width,
    quickValues: widthQuickValues,
    step: 1,
    onchange: function(value){
      value = Math.round(value);
      updateSize("width", value);
    },
  });

  updates.width = updateWidthSlider;

  const { update: updateHeightSlider} = elements.getGui(refs.heightSlider, "slider", {
    value: activeObject.getScaledHeight(),
    min: 1,
    max: exportCanvasConfig.height,
    inputMax: 2*exportCanvasConfig.height,
    quickValues: heightQuickValues,
    step: 1,
    onchange: function(value){
      value = Math.round(value);
      updateSize("height", value);
    },
  });

  updates.height = updateHeightSlider;

  const { update: updateLeftSlider } = elements.getGui(refs.leftSlider, "slider", {
    value: activeObject.left,
    min: -exportCanvasConfig.width,
    max: exportCanvasConfig.width,
    quickValues: leftQuickValues,
    step: 1,
    onchange: function(value){
      value = Math.round(value);
      activeObject.set("left", value);
      canvas.requestRenderAll();
      // emitter.emit("canvas:position:edited", activeObject);
    },
  });

  updates.left = updateLeftSlider;
  const { update: updateTopSlider } = elements.getGui(refs.topSlider, "slider", {
    value: activeObject.top,
    min: -exportCanvasConfig.height,
    max: exportCanvasConfig.height,
    quickValues: topQuickValues,
    step: 1,
    onchange: function(value){
      value = Math.round(value);
      activeObject.set("top", value);
      canvas.requestRenderAll();
      // emitter.emit("canvas:position:edited", activeObject);
    },
  });

  updates.top = updateTopSlider;

  const updateAngle = (value) => {
      value = normalizeAngle(value);
      
      canvas.modifyObject("angle", value);
      emitter.emit("canvas:position:edited", activeObject);
  }

  

  const { update: angleSliderUpdate } = elements.getGui(refs.angleSlider, "slider", {
    value: activeObject.angle,
    min: 0,
    max: 360,
    quickValues: createAngleQuickValues(),
    // 防止滑块滑动时频繁触发事件: true,
    onchange: function(value){
      updateAngle(value)
    },
  });

  updates.angle = function(value){
    value = normalizeAngle(value);
    angleSliderUpdate(value);
  }

  // 把值转换成 fabric object 接受的角度值方法，并且取整数
  function normalizeAngle(value) {
    // return (value + 360) % 360;
    value = (value + 360) % 360;
    return Math.round(value);
  }

}

function openResizePanel() {
  if (!activeObject) {
    return;
  }

  const hasGroupSelection = canvas.getActiveObjects().length > 1;

  renderUI(hasGroupSelection);

  // 显示操作面板
  refs.elementsWrapper.style.display = hasGroupSelection ? '' : 'none';

  // 宽高比
  aspectRatio = activeObject.getScaledWidth() / activeObject.getScaledHeight();

  
  const values = {
    left: Math.round(activeObject.left),
    top: Math.round(activeObject.top),
    width: Math.round(activeObject.getScaledWidth()),
    height: Math.round(activeObject.getScaledHeight()),
    angle: Math.round(activeObject.angle),
  };
  // 更新滑块的值
  for (const key in values) {
    
    if (updates[key]) {
      updates[key](values[key]);
    }
  }

  panel.show("position", refs.wrapper, '编辑位置');

}

function alignToPage(type) {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;
  
  switch (type) {
      case "center":
          activeObject.set({
              left: (exportCanvasConfig.width - activeObject.getScaledWidth()) / 2,
              top: (exportCanvasConfig.height - activeObject.getScaledHeight()) / 2
          }).setCoords();
          break;
      case "centerH":
          activeObject.set({ left: (exportCanvasConfig.width - activeObject.getScaledWidth()) / 2 }).setCoords();
          break;
      case "centerV":
          activeObject.set({ top: (exportCanvasConfig.height - activeObject.getScaledHeight()) / 2 }).setCoords();
          break;
      case "left":
          activeObject.set({ left: 0 });
          break;
      case "right":
          activeObject.set({ left: exportCanvasConfig.width - activeObject.getScaledWidth() });
          break;
      case "top":
          activeObject.set({ top: 0 });
          break;
      case "bottom":
          activeObject.set({ top: exportCanvasConfig.height - activeObject.getScaledHeight() });
          break;
  }
  
  debouncedCommitChange
  canvas.requestRenderAll();
}

function alignElements(type) {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length < 2) return;
  // let base = activeObjects[0];
  // if (base.type === "group") return;
  
  // 取消当前选中状态
  canvas.discardActiveObject();
  
  // const baseWidth = base.getScaledWidth(),
  //       baseHeight = base.getScaledHeight(),
  //       baseLeft = base.left,
  //       baseTop = base.top,
  //       baseCenterX = baseLeft + baseWidth / 2,
  //       baseCenterY = baseTop + baseHeight / 2;
  // top 以 top 小的为基准
  // left 只 left 小的为基准
  // right 以 right 大的为基准
  // bottom 以 bottom 大的为基准
  // alignH 以宽大的为基准
  // alignV 以高大的为基准
  // center 先以宽大的为基准 alignV，再以高大的为基准 alignH
  // 等宽以第一个为基准，等高以第一个为基准

  let base = activeObjects[0];
  if(type === "alignH" || type === "center" || type === "right"){
    base = activeObjects.reduce((a,b)=>a.getScaledWidth() > b.getScaledWidth() ? a : b);
  }else if(type === "alignV" || type === "bottom"){
    base = activeObjects.reduce((a,b)=>a.getScaledHeight() > b.getScaledHeight() ? a : b);
  }else if(type === "top"){
    base = activeObjects.reduce((a,b)=>a.top < b.top ? a : b);
  }else if(type === "left"){
    base = activeObjects.reduce((a,b)=>a.left < b.left ? a : b);
  }

  if (base.type === "group") return;

  const baseWidth = base.getScaledWidth(),
        baseHeight = base.getScaledHeight(),
        baseLeft = base.left,
        baseTop = base.top,
        baseCenterX = baseLeft + baseWidth / 2,
        baseCenterY = baseTop + baseHeight / 2;

  activeObjects.forEach(obj => {
      if (obj === base) return;
      switch (type) {
          case "equalWidth": {
              const oldTop = obj.top;
              const oldHeight = obj.getScaledHeight();
              obj.scaleToWidth(baseWidth).set({
                  left: baseLeft,
                  top: oldTop - (obj.getScaledHeight() - oldHeight) / 2
              });
              break;
          }
          case "equalHeight": {
              const oldLeft = obj.left;
              const oldWidth = obj.getScaledWidth();
              obj.scaleToHeight(baseHeight).set({
                  top: baseTop,
                  left: oldLeft - (obj.getScaledWidth() - oldWidth) / 2
              });
              break;
          }
          case "alignH": // 同 top 对齐
          case "top":
              obj.set({ top: baseTop });
              break;
          case "alignV": // 同 left 对齐
          case "left":
              obj.set({ left: baseLeft });
              break;
          case "right":
              obj.set({ left: baseLeft + baseWidth - obj.getScaledWidth() });
              break;
          case "bottom":
              obj.set({ top: baseTop + baseHeight - obj.getScaledHeight() });
              break;
          case "center":
              // 同时调整水平和垂直
              obj.set({
                  left: baseCenterX - obj.getScaledWidth() / 2,
                  top: baseCenterY - obj.getScaledHeight() / 2
              });
              break;
          case "distributeH":
              distributeObjects(activeObjects, "horizontal");
              break;
          case "distributeV":
              distributeObjects(activeObjects, "vertical");
              break;
      }
  });
  
  canvas.setActiveObject(new fabric.ActiveSelection(activeObjects, { canvas: canvas }));
  debouncedCommitChange();
  canvas.requestRenderAll();
}

function distributeObjects(objects, direction) {
  if (objects.length < 3) return;
  
  // 按照指定方向排序
  const sorted = [...objects].sort((a, b) => 
      direction === "horizontal" ? a.left - b.left : a.top - b.top
  );
  
  // 计算所有对象之间的总间隙空间
  const totalSpace = (direction === "horizontal" 
      ? sorted[sorted.length - 1].left - sorted[0].left 
      : sorted[sorted.length - 1].top - sorted[0].top)
      - sorted.reduce((sum, obj) => 
          sum + (direction === "horizontal" ? obj.getScaledWidth() : obj.getScaledHeight()), 0
      , 0);
  
  const spacing = totalSpace / (sorted.length - 1);
  let position = direction === "horizontal" ? sorted[0].left : sorted[0].top;
  
  sorted.forEach((obj, index) => {
      // 第一个和最后一个不动
      if (index === 0 || index === sorted.length - 1) return;
      position += direction === "horizontal" 
          ? sorted[index - 1].getScaledWidth() + spacing 
          : sorted[index - 1].getScaledHeight() + spacing;
      if (direction === "horizontal") {
          obj.set({ left: position });
      } else {
          obj.set({ top: position });
      }
  });
}




emitter.on("operation:position:edit", (object) => {
  activeObject = object;
  openResizePanel(object);
});

emitter.on("operation:position:align", ({ object, type }) => {
  activeObject = object;
  // openResizePanel(object);
  alignToPage(type);
});
