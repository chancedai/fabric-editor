

import { delegator, emitter, showInfo, render } from "../../__common__/utils";
import fabric from "../fabric";
import { canvas, debouncedCommitChange } from "../canvas";
import lib from "../lib";
import { panel } from "../component/sidebar";
import elements from "../elements";
import generateRoughOptionsPanel from "./rough-options";

// 外部依赖（请确保在使用前引入）：
// - canvas: fabric.Canvas 实例（原变量 d）
// - panel.content: 用于展示 GUI 控件的容器 DOM 元素（原变量 E）
// - elements.getGui(): 根据类型创建控件的方法
// - elements.destroy(): 销毁控件的方法
// - lib.word(): 国际化文案方法
// - showInfo(): 显示提示信息的方法
// - Q(): 用于展示 rough 选项的函数
// - fabric: Fabric.js 库

let refs = null;

// 当前形状类型（line、rect、triangle、ellipse、heart、star、linearrow 等）
let shapeType = "line";
// 是否为 rough 模式（即使用 rough 版本绘制）
let isRoughMode = false;
// 笔触宽度
let strokeWidth = 5;
// 描边颜色
let strokeColor = "rgb(0,0,0)";
// 填充颜色
let fillColor = "rgb(255,0,0)";
// 当前正在绘制或编辑的图形对象
let activeShape = null;
// 矩形圆角百分比（仅对 rect 有效）
let cornerRadiusPercent = 0;
// 是否启用填充（仅对支持填充的图形有效）
let hasFill = true;
// 星形的点数（仅对 star 有效）
let starNumPoints = 6;
// 星形内半径比（内半径 = 外半径 * starInnerRatio）
let starInnerRatio = 0.5;
// 是否处于绘制过程
let isDrawing = false;
// 起始点 x 坐标
let startX = 0;
// 起始点 y 坐标
let startY = 0;

// 根据已有图形对象更新各项参数，并重构 GUI 控件
const updateShapePropertiesFromObject = (shapeObj) => {
  elements.destroy();
  strokeColor = shapeObj.stroke;
  strokeWidth = shapeObj.strokeWidth;
  if ("fill" in shapeObj) {
    fillColor = shapeObj.fill;
    hasFill = (fillColor !== "transparent");
  }
  if (shapeType === "rect") {
    const halfMinDimension = Math.min(shapeObj.get("width"), shapeObj.get("height")) / 2;
    cornerRadiusPercent = Math.round((shapeObj.get("rx") / halfMinDimension) * 100);
  }
  if (shapeType === "star") {
    starInnerRatio = shapeObj.get("innerRadius") / shapeObj.get("outerRadius");
    starNumPoints = shapeObj.get("numPoints");
  }
  isRoughMode = /^rough/.test(shapeObj.type);
  buildShapeGui();
  panel.show('shape', refs.wrapper, '图形编辑');
};

// 鼠标按下事件：如果点击已有图形则进入编辑，否则开始绘制新图形
const handleMouseDown = (evt) => {
  if (
    evt.target &&
    (evt.target.type === shapeType ||
      evt.target.type.toLowerCase() === "rough" + shapeType)
  ) {
    activeShape = evt.target;
    updateShapePropertiesFromObject(activeShape);
    return false;
  }
  activeShape = null;
  const pointer = canvas.getPointer(evt.e);
  startX = pointer.x;
  startY = pointer.y;
  const shapeOptions = {
    left: startX,
    top: startY,
    fill: hasFill ? fillColor : "transparent",
    stroke: strokeColor,
    strokeWidth: strokeWidth,
    hasBorders: false,
    hasControls: false,
    selectable: false,
    strokeUniform: true,
  };
  switch (shapeType) {
    case "line":
      activeShape = new fabric.Line([startX, startY, startX + 1, startY + 1], shapeOptions);
      break;
    case "linearrow":
      activeShape = new fabric.Linearrow([startX, startY, startX + 1, startY + 1], shapeOptions);
      break;
    case "rect":
      shapeOptions.width = shapeOptions.height = 1;
      activeShape = new fabric.Rect(shapeOptions);
      break;
    case "triangle":
      shapeOptions.width = shapeOptions.height = 1;
      activeShape = new fabric.Triangle(shapeOptions);
      break;
    case "ellipse":
      shapeOptions.rx = shapeOptions.ry = 1;
      activeShape = new fabric.Ellipse(shapeOptions);
      break;
    case "heart":
      shapeOptions.size = 10;
      activeShape = new fabric.Heart(shapeOptions);
      break;
    case "star":
      shapeOptions.numPoints = starNumPoints;
      shapeOptions.outerRadius = 2;
      shapeOptions.innerRadius = shapeOptions.outerRadius * starInnerRatio;
      activeShape = new fabric.Star(shapeOptions);
      break;
    default:
      break;
  }
  canvas.add(activeShape).setActiveObject(activeShape);
  canvas.requestRenderAll();
  isDrawing = true;
};

// 鼠标移动事件：根据当前指针位置更新图形尺寸或其它属性
const handleMouseMove = (evt) => {
  if (!isDrawing) return false;
  const pointer = canvas.getPointer(evt.e);
  // 保证 left/top 为起始点与当前指针的较小值
  const newOptions = {
    left: Math.min(pointer.x, startX),
    top: Math.min(pointer.y, startY),
  };
  switch (shapeType) {
    case "line":
    case "linearrow":
      newOptions.x2 = pointer.x;
      newOptions.y2 = pointer.y;
      break;
    case "rect":
    case "triangle":
      newOptions.width = Math.abs(pointer.x - startX);
      newOptions.height = evt.e.shiftKey ? newOptions.width : Math.abs(pointer.y - startY);
      if (shapeType === "rect" && cornerRadiusPercent > 0) {
        const radius = ((Math.min(newOptions.width, newOptions.height) / 2) * cornerRadiusPercent) / 100;
        newOptions.rx = radius;
        newOptions.ry = radius;
      }
      break;
    case "ellipse":
      newOptions.rx = Math.abs(pointer.x - startX) / 2;
      newOptions.ry = evt.e.shiftKey ? newOptions.rx : Math.abs(pointer.y - startY) / 2;
      newOptions.width = 2 * newOptions.rx;
      newOptions.height = evt.e.shiftKey ? newOptions.width : 2 * newOptions.ry;
      break;
    case "heart":
      activeShape.set("size", Math.abs(pointer.x - startX));
      break;
    case "star":
      const newOuterRadius = Math.abs(pointer.x - startX) / 2;
      activeShape.set("outerRadius", newOuterRadius);
      activeShape.set("innerRadius", newOuterRadius * starInnerRatio);
      break;
    default:
      break;
  }
  activeShape.set(newOptions);
  canvas.requestRenderAll();
  // updateObjectInfo(activeShape);
};

// 鼠标抬起事件：结束绘制，激活图形的编辑模式
const handleMouseUp = (evt) => {
  if (!isDrawing) return false;
  activeShape.setCoords();
  activeShape.set({
    selectable: true,
    hasBorders: true,
    hasControls: true,
  });
  canvas.requestRenderAll();
  isDrawing = false;
  canvas.fire("object:drawn", { target: activeShape });
  debouncedCommitChange();
  canvas.requestRenderAll();
};

// 开启绘制图形的事件监听
const enableDrawingEvents = () => {
  canvas.selection = false;
  canvas.isDrawingMode = false;
  canvas.isDrawingShapes = true;
  canvas.defaultCursor = "crosshair";
  // canvas.setCursor('crosshair');
  canvas
    .discardActiveObject()
    .off("mouse:down", handleMouseDown)
    .off("mouse:up", handleMouseUp)
    .off("mouse:move", handleMouseMove)
    .forEachObject((obj) => {
      obj.set({ evented: false, hasBorders: false, hasControls: false });
    })
    .on({ "mouse:down": handleMouseDown, "mouse:move": handleMouseMove, "mouse:up": handleMouseUp })
    .requestRenderAll();
};

// 关闭绘制图形的事件监听，还原各图形对象的事件属性
const disableDrawingEvents = () => {
  canvas.selection = true;
  canvas.isDrawingMode = false;
  canvas.isDrawingShapes = false;
  canvas.defaultCursor = "default";
  canvas
    .off("mouse:down", handleMouseDown)
    .off("mouse:up", handleMouseUp)
    .off("mouse:move", handleMouseMove)
    .forEachObject((obj) => {
      obj.set({ evented: true, hasBorders: true, hasControls: true });
    });
    debouncedCommitChange();
    canvas.requestRenderAll();
};

// 构建图形绘制的 GUI 控件（使用原生 DOM 与 TailwindCSS，宽度固定 250px，不使用表格布局）
const buildShapeGui = async () => {

  refs = render('', () => {

    return [
      `<div data-id="wrapper"  class="text-sm text-sm h-full overflow-auto">`,
      render.section('', [
        render.titleRow('描边', 'strokeColorPicker','flex-grow-0'),
        render.row('宽度', 'strokeSliderContainer'),
      ]),
      
      shapeType === 'rect'?
        render.section('', [
        render.titleRow('圆角', 'cornerRadiusSliderContainer','flex-1'),
      ]):'',

      shapeType === 'star'?
        render.section('', [
        render.titleRow('星形'),
        render.row('点数', 'starPointsSliderContainer'),
        render.row('内半径比例', 'starInnerRatioSliderContainer'),
      ]):'',
      /rect|ellipse|triangle|star|heart/.test(shapeType)?
        render.section('', [
        render.titleRow('填充', 'fillSwitchContainer','flex-grow-0'),
        render.row('颜色', 'fillColorPicker','flex-grow-0'),
      ]):'',
      /rect|ellipse|triangle|star|heart/i.test(shapeType)?
        render.section('', [
        render.titleRow('草图', 'roughSwitchContainer','flex-grow-0'),
        render.row('', 'roughOptionsContainer'),
      ]):'',
      // _if(/rect|ellipse|triangle|star|heart/i.test(shapeType), `
      //       <div data-id="roughSwitchContainer" class="py-2"></div>
      //     <div data-id="roughOptionsContainer" class="pt-2 pb-4 px-4 border border-slate-200 rounded-lg" style="display:none;"></div>
      //   `, ''),
      `</div>`

    ];

  }, panel.content);

  const { strokeSliderContainer, strokeColorPicker, fillSwitchContainer, fillColorPicker, cornerRadiusSliderContainer, starPointsSliderContainer, starInnerRatioSliderContainer, roughSwitchContainer, roughOptionsContainer } = refs;


  // 描边宽度
  elements.getGui(strokeSliderContainer, "slider", {
    value: strokeWidth,
    min: (shapeType === "line" ? 1 : 0),
    max: 100,
    onchange: (value) => {
      strokeWidth = value;
      if (activeShape) {
        activeShape.set("strokeWidth", strokeWidth);
        debouncedCommitChange();
        canvas.requestRenderAll();
      }
    },
  });

  elements.getGui(strokeColorPicker, "colorButton", {
    color: strokeColor,
    onchange: (info) => {
      let newColor = info.fabricColor;
      strokeColor = newColor;
      if (activeShape) {
        activeShape.set("stroke", strokeColor);
        debouncedCommitChange();
        canvas.requestRenderAll();
      }
    },
  });

  // 填充颜色控制（适用于 rect、ellipse、triangle、star、heart）
  if (/rect|ellipse|triangle|star|heart/.test(shapeType)) {
    // createCheckboxGroup 使用示例
    // const checkboxGroup = createCheckboxGroup(document.body, {
    //   choices: {
    //       'apple': { label: 'Apple', checked: true },
    //       'banana': { label: 'Banana', checked: false },
    //       'cherry': { label: 'Cherry', checked: false },
    //       'divider2': '_divider_',
    //       'date': { label: 'Date', checked: true },
    //       'time': { label: 'Time', checked: false },
    //   },
    //   onchange: (key, checked) => {
    //       console.log('Changed:', key, checked);
    //   },
    // });
    // elements.getGui(fillSwitchContainer, "checkbox", {
    //   choices: {
    //     'fill': { label: '<i class="vicon-check"></i>', checked: hasFill },
    //   },
    //   onchange: (key, checked) => {
    //     hasFill = checked;
    //     if (activeShape) {
    //       activeShape.set("fill", hasFill ? fillColor : "transparent");
    //       canvas.requestRenderAll();
    //     }
    //   },
    // });
    function toggleFillColorPicker() {
      if (hasFill) {
        fillColorPicker.parentNode.style.display = "";
      } else {
        fillColorPicker.parentNode.style.display = "none";
      }
    }
    toggleFillColorPicker();
    elements.getGui(fillSwitchContainer, "iosCheckbox", {
      checked: hasFill,
      label: '',
      labelPosition: 'after',
      onchange: (checked) => {
        hasFill = checked;
        if (activeShape) {
          activeShape.set("fill", hasFill ? fillColor : "transparent");
          debouncedCommitChange();
          canvas.requestRenderAll();
        }
        toggleFillColorPicker();
      },
    });
    elements.getGui(fillColorPicker, "colorButton", {
      color: fillColor,
      onchange: (info) => {
        let newColor = info.fabricColor;
        fillColor = newColor;
        hasFill = true;
        // fillCheckbox.checked = true;
        if (activeShape) {
          activeShape.set("fill", fillColor);
          debouncedCommitChange();
          canvas.requestRenderAll();
        }
      },
    });
  }

  // 矩形圆角控制
  if (shapeType === "rect") {

    elements.getGui(cornerRadiusSliderContainer, "slider", {
      value: cornerRadiusPercent,
      onchange: (value) => {
        cornerRadiusPercent = value;
        if (activeShape) {
          const minDimension = Math.round(Math.min(activeShape.get("width"), activeShape.get("height")) / 2);
          const radius = (minDimension * cornerRadiusPercent) / 100;
          activeShape.set("rx", radius).set("ry", radius);
          debouncedCommitChange();
          canvas.requestRenderAll();
        }
      },
    });
  }

  // 星形参数控制（点数和内半径比例）
  if (shapeType === "star") {

    elements.getGui(starPointsSliderContainer, "slider", {
      value: starNumPoints,
      min: 5,
      max: 50,
      onchange: (value) => {
        starNumPoints = value;
        if (activeShape) {
          activeShape.set("numPoints", starNumPoints);
          debouncedCommitChange();
          canvas.requestRenderAll();
        }
      },
    });

    elements.getGui(starInnerRatioSliderContainer, "slider", {
      value: 100 * starInnerRatio,
      min: 10,
      max: 100,
      onchange: (value) => {
        starInnerRatio = value / 100;
        if (activeShape) {
          activeShape.set("innerRadius", activeShape.outerRadius * starInnerRatio);
          debouncedCommitChange();
          canvas.requestRenderAll();
        }
      },
    });
  }

  // 支持 rough 模式的图形（rect、ellipse、triangle、heart、star）增加 rough 模式切换按钮
  if (/rect|ellipse|triangle|heart|star/i.test(shapeType)) {

    // createCheckboxGroup 使用示例
    // const checkboxGroup = createCheckboxGroup(document.body, {
    //   choices: {
    //       'apple': { label: 'Apple', checked: true },
    //       'banana': { label: 'Banana', checked: false },
    //       'cherry': { label: 'Cherry', checked: false },
    //       'divider2': '_divider_',
    //       'date': { label: 'Date', checked: true },
    //       'time': { label: 'Time', checked: false },
    //   },
    //   onchange: (key, checked) => {
    //       console.log('Changed:', key, checked);
    //   },
    // });

    function toggleRoughOptionsPanel() {
      if (isRoughMode) {
        roughOptionsContainer.style.display = "";
        generateRoughOptionsPanel(activeShape||{}, roughOptionsContainer);
      } else {
        roughOptionsContainer.style.display = "none";
      }
    }
    toggleRoughOptionsPanel();

    

    // elements.getGui(roughSwitchContainer, "checkbox", {
    //   choices: {
    //     'rough': { label: '<i class="vicon-check"></i>', checked: isRoughMode },
    //   },
    //   onchange: (key, checked) => {
    //     isRoughMode = checked;
    //     if (activeShape) {

    //       const shapeIndex = canvas.getObjects().indexOf(activeShape);
    //       const shapeOptions = {};
    //       for (let prop in activeShape.toObject()) {
    //         if (prop !== "type" && activeShape[prop] !== null && activeShape[prop] !== undefined) {
    //           shapeOptions[prop] = activeShape[prop];
    //         }
    //       }
    //       let currentType = activeShape.type.toLowerCase().replace(/^rough/, "");
    //       currentType = currentType.charAt(0).toUpperCase() + currentType.slice(1);
    //       let newTypeName = currentType;
    //       // isRoughMode 为 true 时，表示切换到 rough 模式，newTypeName 为 加 rough 前缀的图形类型
    //       // 否则，表示切换到普通模式，newTypeName 为去掉 rough 前缀的图形类型
    //       if (isRoughMode) {
    //         newTypeName = 'Rough' + newTypeName;
    //       }
          
    //       const NewShapeClass = fabric[newTypeName];
    //       const newShape = new NewShapeClass(shapeOptions);
    //       canvas.remove(activeShape);
    //       activeShape = newShape;
    //       canvas.add(activeShape).setActiveObject(activeShape);
    //       activeShape.moveTo(shapeIndex);
    //       debouncedCommitChange();
    // canvas;
          
    //     }
    //     toggleRoughOptionsPanel();
    //   },
    // });
    elements.getGui(roughSwitchContainer, "iosCheckbox", {
      checked: isRoughMode,
      label: '',
      labelPosition: 'after',
      onchange: (checked) => {
        isRoughMode = checked;
        if (activeShape) {

          const shapeIndex = canvas.getObjects().indexOf(activeShape);
          const shapeOptions = {};
          for (let prop in activeShape.toObject()) {
            if (prop !== "type" && activeShape[prop] !== null && activeShape[prop] !== undefined) {
              shapeOptions[prop] = activeShape[prop];
            }
          }
          let currentType = activeShape.type.toLowerCase().replace(/^rough/, "");
          currentType = currentType.charAt(0).toUpperCase() + currentType.slice(1);
          let newTypeName = currentType;
          // isRoughMode 为 true 时，表示切换到 rough 模式，newTypeName 为 加 rough 前缀的图形类型
          // 否则，表示切换到普通模式，newTypeName 为去掉 rough 前缀的图形类型
          if (isRoughMode) {
            newTypeName = 'Rough' + newTypeName;
          }
          
          const NewShapeClass = fabric[newTypeName];
          const newShape = new NewShapeClass(shapeOptions);
          canvas.remove(activeShape);
          activeShape = newShape;
          canvas.add(activeShape).setActiveObject(activeShape);
          activeShape.moveTo(shapeIndex);
          debouncedCommitChange();
          canvas.requestRenderAll();
          
        }
        toggleRoughOptionsPanel();
      },
    });


    // roughToggleCheckbox.addEventListener("click", () => {
    //   const shapeIndex = canvas.getObjects().indexOf(activeShape);
    //   // 切换按钮状态（模拟禁用按钮效果）
    //   const roughOptionsBtn = roughSection.querySelector("button");
    //   if (roughOptionsBtn) {
    //     roughOptionsBtn.disabled = isRoughMode;
    //   }
    //   // 构建新的图形参数（排除 type 属性）
    //   const shapeOptions = {};
    //   for (let prop in activeShape.toObject()) {
    //     if (prop !== "type" && activeShape[prop] !== null && activeShape[prop] !== undefined) {
    //       shapeOptions[prop] = activeShape[prop];
    //     }
    //   }
    //   const currentType = activeShape.type;
    //   let newTypeName = "";
    //   if (isRoughMode) {
    //     newTypeName = currentType.replace(/^rough/, "");
    //   } else {
    //     newTypeName = "Rough" + currentType.charAt(0).toUpperCase() + currentType.slice(1);
    //   }
    //   isRoughMode = !isRoughMode;
    //   const NewShapeClass = fabric[newTypeName];
    //   const newShape = new NewShapeClass(shapeOptions);
    //   canvas.remove(activeShape);
    //   activeShape = newShape;
    //   canvas.add(activeShape).setActiveObject(activeShape);
    //   activeShape.moveTo(shapeIndex);
    //   debouncedCommitChange();
    // canvas;
    // });
    // roughSection.appendChild(roughToggleCheckbox);
    // const roughOptionsButton = document.createElement("button");
    // roughOptionsButton.className = "btn btn-primary";
    // roughOptionsButton.disabled = !isRoughMode;
    // roughOptionsButton.innerHTML = lib.word(1360) + "&hellip;";
    // roughOptionsButton.addEventListener("click", () => {
    //   generateRoughOptionsPanel(activeShape);
    // });
    // roughSection.appendChild(roughOptionsButton);
    // guiContainer.appendChild(roughSection, roughSection);
  }

  panel.show('shape', refs.wrapper, '图形绘制');
};


function destroy() {
  activeShape = null;
  disableDrawingEvents();
};
function init(shape) {
  shapeType = shape;
  isRoughMode = false;
  activeShape = null;
  if (strokeWidth <= 0) strokeWidth = 5;
  // 显示提示信息（例如：请选择图形后拖动绘制）
  showInfo(lib.word(1390));
  buildShapeGui();
  enableDrawingEvents();
};
function edit(shape) {
  shapeType = shape.type;
  if (/rough/.test(shapeType)) {
    isRoughMode = true;
    shapeType = shapeType.replace(/^rough/, "").toLowerCase();
  } else {
    isRoughMode = false;
  }
  activeShape = shape;
  updateShapePropertiesFromObject(activeShape);
};



emitter.on("operation:shape:init", (type) => {
  init(type);
});
emitter.on("operation:shape:edit", (object) => {
  edit(object);
});
emitter.on('operation:shape:hide', ()=>{
  panel.hide();
})
emitter.on('operation:destroy', (operationType) => {
  if (operationType === 'shape') {
    destroy();
  }
});


