

import { delegator, emitter, showInfo, render } from "../../__common__/utils";
import fabric from "../fabric";
import { canvas, debouncedCommitChange } from "../canvas";
import lib from "../lib";
import { panel } from "../component/sidebar";
import elements from "../elements";

// 请确保在使用前导入以下外部变量/方法：
// import lib from "../lib";                   // 国际化文案方法，如 lib.word(id)
// import elements from "../elements";         // GUI 控件生成方法，如 elements.getGui(container, type, options) 与 elements.destroy()
// import SYMBOLS from "../symbolsData";          // 符号数据对象，例如 SYMBOLS["basic"]["heart"] 为路径数据字符串
// import { canvas } from "../canvas";             // fabric.Canvas 实例
// import fabric from "../fabric";                // Fabric.js 库
// panel.content: 外部提供的 DOM 容器（宽度 250px）用于展示编辑界面

// ---------- 内部状态变量 ----------
let refs = null;
let symbolCategory = "basic";
let symbolName = "heart";
let strokeWidth = 5;
let strokeColor = "rgb(0,0,0)";
let fillColor = "rgb(255,0,0)";
let fillEnabled = true;
let currentSymbolPath = null; // 当前符号路径数据（字符串）
let drawingSymbol = null;     // 正在绘制的 fabric.Path 对象
let isDrawing = false;
let startX = 0;
let startY = 0;

// ---------- 工具函数 ----------




/**
 * 更新符号设置（编辑模式下调用）
 * @param {object} symbolObj - fabric 对象
 */
const updateSymbolSettings = (symbolObj) => {
  elements.destroy();
  
  strokeColor = symbolObj.stroke;
  strokeWidth = symbolObj.strokeWidth;
  if ("fill" in symbolObj) {
    fillColor = symbolObj.fill;
    fillEnabled = symbolObj.fill !== "transparent";
  }
  buildSymbolGUI();
};

// ---------- 鼠标事件处理 ----------

/**
 * 鼠标按下：开始绘制符号
 * @param {object} event - fabric 鼠标事件
 */
const onMouseDown = (event) => {
  drawingSymbol = null;
  const pointer = canvas.getPointer(event.e);
  startX = pointer.x;
  startY = pointer.y;
  drawingSymbol = new fabric.Path(currentSymbolPath, {
    customType: "symbol",
    left: startX,
    top: startY,
    hasBorders: false,
    hasControls: false,
    selectable: false,
    scaleX: 0.01,
    scaleY: 0.01,
    evented: false,
    strokeWidth: strokeWidth,
    fill: fillEnabled ? fillColor : "transparent",
    stroke: strokeColor,
    opacity: 0.5,
  });
  canvas.add(drawingSymbol).setActiveObject(drawingSymbol).requestRenderAll();
  isDrawing = true;
};

/**
 * 鼠标移动：动态更新符号绘制
 * @param {object} event 
 */
const onMouseMove = (event) => {
  if (!isDrawing) return;
  const pointer = canvas.getPointer(event.e);
  const dx = pointer.x - startX;
  const dy = pointer.y - startY;
  let scaleXVal = Math.abs(dx) / drawingSymbol.width;
  let scaleYVal = Math.abs(dy) / drawingSymbol.height;
  if (event.e.shiftKey) {
    scaleXVal = scaleYVal = Math.min(scaleXVal, scaleYVal);
  }
  drawingSymbol.set({
    left: dx < 0 ? pointer.x : startX,
    top: dy < 0 ? pointer.y : startY,
    flipX: dx < 0,
    flipY: dy < 0,
    scaleX: scaleXVal,
    scaleY: scaleYVal,
  });
  canvas.requestRenderAll();
};

/**
 * 鼠标抬起：结束绘制符号
 * @param {object} event 
 */
const onMouseUp = (event) => {
  if (!isDrawing) return;
  const pointer = canvas.getPointer(event.e);
  if ((pointer.x - startX) * (pointer.y - startY) < 10) {
    canvas.remove(drawingSymbol);
  } else {
    drawingSymbol.setCoords();
    drawingSymbol.set({
      opacity: 1,
      hasBorders: true,
      hasControls: true,
      selectable: true,
    });
  }
  isDrawing = false;
  canvas.requestRenderAll();
};

/**
 * 启用绘制事件（符号绘制模式）
 */
const enableDrawingEvents = () => {
  canvas.isDrawingShapes = true;
  canvas.selection = false;
  canvas.defaultCursor = "crosshair";
  canvas.discardActiveObject();
  canvas.off("mouse:down", onMouseDown);
  canvas.off("mouse:move", onMouseMove);
  canvas.off("mouse:up", onMouseUp);
  canvas.forEachObject((obj) => {
    obj.set({ evented: false, hasBorders: false, hasControls: false });
  });
  canvas.on({
    "mouse:down": onMouseDown,
    "mouse:move": onMouseMove,
    "mouse:up": onMouseUp,
  });
  canvas.requestRenderAll();
};

/**
 * 禁用绘制事件，恢复画布状态
 */
const disableDrawingEvents = () => {
  canvas.selection = true;
  canvas.isDrawingShapes = false;
  canvas.defaultCursor = "default";
  canvas.off("mouse:down", onMouseDown);
  canvas.off("mouse:move", onMouseMove);
  canvas.off("mouse:up", onMouseUp);
  canvas.forEachObject((obj) => {
    obj.set({ evented: true, hasBorders: true, hasControls: true });
  });
  debouncedCommitChange();
  canvas.requestRenderAll();
};

// ---------- 构建符号 GUI ----------

/**
 * 构建符号设置面板（下拉选择、滑块、颜色控件）
 * @param {Function} callback - 构建完成后调用的回调
 */
const buildSymbolGUI = async (path, callback) => {
  // 当前符号路径数据
  currentSymbolPath = path;

  if(!currentSymbolPath) {
    showInfo(lib.word(1390));
  }

  if(refs){
    return;
  }

  refs = render('', () => {
    return [
      `<div data-id="wrapper"  class="text-sm">`,
      render.section("stroke", [
        render.titleRow("描边", "strokeColorPicker"),
        render.row("宽度", "strokeSliderContainer"),
      ]),
      render.section("fill", [
        render.titleRow("填充", "fillSwitchContainer"),
        render.row("颜色", "fillColorPicker",'flex-grow-0'),
      ]),
      `</div>`

    ];

  }, panel.content);


  // 使用 elements.getGui 创建滑块控件（作为下拉式控件）
  elements.getGui(refs.strokeSliderContainer, "slider", {
    value: strokeWidth,
    min: 0,
    max: 50,
    inputMax: 500,
    onchange: (val) => {
      strokeWidth = val;
      if (drawingSymbol) {
        drawingSymbol.set("strokeWidth", strokeWidth);
        debouncedCommitChange();
        canvas.requestRenderAll();
      }
    },
  });

  elements.getGui(refs.strokeColorPicker, "colorButton", {
    color: strokeColor,
    
    onchange: (info) => {
      let newColor = info.fabricColor;
      if (drawingSymbol) {
        drawingSymbol.set("stroke", newColor);
        debouncedCommitChange();
        canvas.requestRenderAll();
      }
    },
  });

  function fill() {
    if (drawingSymbol) {
      drawingSymbol.set("fill", fillEnabled ? fillColor : "transparent");
      debouncedCommitChange();
      canvas.requestRenderAll();
    }
  }

  function toggleFill() {
    if (fillEnabled) {
      refs.fillColorPicker.parentNode.style.display = "";
    }else {
      refs.fillColorPicker.parentNode.style.display = "none";
    }
  }

  toggleFill();

  elements.getGui(refs.fillSwitchContainer, "iosCheckbox", {
    checked: fillEnabled,
    label: '',
    labelPosition: 'after',
    onchange: (checked) => {
      fillEnabled = checked;
      toggleFill();
      fill();
    },
  });

  elements.getGui(refs.fillColorPicker, "colorButton", {
    color: fillColor,
    
    onchange: (info) => {
      let newColor = info.fabricColor;
      fillColor = newColor;
      fill();
    },
  });
  if (callback) callback();

  
};

function destroy() {
  drawingSymbol = null;
  disableDrawingEvents();
}
function init(path) {
  // 若 SYMBOLS 未定义，则先加载脚本
  buildSymbolGUI(path);
  enableDrawingEvents();
  panel.show('symbol', refs.wrapper, '符号');
}
function edit(symbolObj) {
  drawingSymbol = symbolObj;
  updateSymbolSettings(drawingSymbol);
  panel.show('symbol', refs.wrapper, '符号');
}


emitter.on("operation:symbol:init", (path) => {
  init(path);
});
emitter.on("operation:symbol:edit", (object) => {
  edit(object);
});
emitter.on('operation:destroy', (operationType) => {
  if (operationType === 'symbol') {
    destroy();
  }
});


