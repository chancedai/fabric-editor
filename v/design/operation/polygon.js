

import { delegator, emitter, showInfo,render } from "../../__common__/utils";
import fabric from "../fabric";
import { canvas, debouncedCommitChange } from "../canvas";
import lib from "../lib";
import { panel } from "../component/sidebar";
import elements from "../elements";
import generateRoughOptionsPanel from "./rough-options";

import Mousetrap from "mousetrap";

let currentPolygon = null;
let isRoughMode = false;
let isDrawingPolygon = false;
let polygonRegistry = {};
let vertexMarkers = [];
let edgeLines = [];
let currentEdgeLine = null;
let draftPolygon = null;
let polygonStrokeWidth = 5;
let fillEnabled = true;
let polygonStrokeColor = "rgb(0,0,0)";
let polygonFillColor = "rgb(255,0,0)";

// 更新当前多边形设置，并重建侧边 GUI 控件
const updatePolygonSettings = (polygonObj) => {
  elements.destroy();
  
  polygonStrokeColor = polygonObj.stroke;
  polygonStrokeWidth = polygonObj.strokeWidth;
  if ("fill" in polygonObj) {
    polygonFillColor = polygonObj.fill;
    fillEnabled = polygonFillColor !== "transparent";
  }
  isRoughMode = /^rough/.test(polygonObj.type);
  buildPolygonGui();
};

// 重置绘制过程中的所有临时元素
const resetDrawingElements = () => {
  vertexMarkers.forEach((marker) => canvas.remove(marker));
  edgeLines.forEach((line) => canvas.remove(line));
  if (draftPolygon) {
    canvas.remove(draftPolygon);
    draftPolygon = null;
  }
  if (currentEdgeLine) {
    canvas.remove(currentEdgeLine);
    currentEdgeLine = null;
  }
  Object.values(polygonRegistry).forEach((poly) => poly.set({ selectable: true }));
  isDrawingPolygon = false;
  vertexMarkers = [];
  edgeLines = [];
};

// 根据顶点标记生成最终多边形对象
const createFinalPolygonFromMarkers = (markers) => {
  const points = markers.map((marker) => ({ x: marker.left, y: marker.top }));
  markers.forEach((marker) => canvas.remove(marker));
  edgeLines.forEach((line) => canvas.remove(line));
  if (draftPolygon) canvas.remove(draftPolygon);
  if (currentEdgeLine) canvas.remove(currentEdgeLine);
  const finalPolygon = new fabric.Polygon(points, {
    stroke: polygonStrokeColor,
    strokeWidth: polygonStrokeWidth,
    fill: polygonFillColor,
  });
  canvas.add(finalPolygon);
  canvas.setActiveObject(finalPolygon);
  return finalPolygon;
};

// 完成多边形绘制，转换草稿为最终对象
const finalizePolygon = () => {
  currentPolygon = createFinalPolygonFromMarkers(vertexMarkers);
  resetDrawingElements();
  polygonRegistry[currentPolygon.uid] = currentPolygon;
  canvas.fire("object:drawn", { target: currentPolygon });

    debouncedCommitChange();
    canvas.requestRenderAll();
};

// 鼠标按下事件处理函数
const handleMouseDown = (eventData) => {
  // 若未处于绘制状态且点击到已有多边形，则进入编辑模式
  if (
    !isDrawingPolygon &&
    eventData.target &&
    (eventData.target.type === "polygon" || eventData.target.type === "roughPolygon")
  ) {
    currentPolygon = eventData.target;
    updatePolygonSettings(currentPolygon);
    return false;
  }
  // 若点击到起始顶点，则完成绘制
  if (draftPolygon && eventData.target && eventData.target.uid === vertexMarkers[0].uid) {
    finalizePolygon();
    return;
  } else {
    if (!draftPolygon) {
      Object.values(polygonRegistry).forEach((poly) => poly.set({ selectable: false }));
      isDrawingPolygon = true;
    }
    const pointer = canvas.getPointer(eventData.e);
    const { x: pointerX, y: pointerY } = pointer;
    // 创建顶点标记：首个顶点用大红色，其它顶点用白色
    const vertexMarker = new fabric.Circle({
      radius: vertexMarkers.length === 0 ? 8 : 5,
      fill: vertexMarkers.length === 0 ? "#f00" : "#fff",
      stroke: "#333",
      strokeWidth: 0.5,
      left: pointerX,
      top: pointerY,
      selectable: false,
      hasBorders: false,
      hasControls: false,
      originX: "center",
      originY: "center",
    });
    // 创建边线（初始为一个点）
    const edgeLine = new fabric.Line([pointerX, pointerY, pointerX, pointerY], {
      strokeWidth: 2,
      fill: "#999",
      stroke: "#999",
      originX: "center",
      originY: "center",
      selectable: false,
      hasBorders: false,
      hasControls: false,
      evented: false,
      class: "line",
    });
    if (draftPolygon) {
      // 已有草稿时增加新顶点
      const newPointer = canvas.getPointer(eventData.e);
      const pointsArray = draftPolygon.get("points");
      pointsArray.push({ x: newPointer.x, y: newPointer.y });
      const updatedDraft = new fabric.Polygon(pointsArray, {
        stroke: "#333",
        strokeWidth: 1,
        fill: "#ccc",
        opacity: 0.3,
        selectable: false,
        hasBorders: false,
        hasControls: false,
        evented: false,
      });
      canvas.remove(draftPolygon);
      canvas.add(updatedDraft);
      draftPolygon = updatedDraft;
      canvas.requestRenderAll();
    } else {
      // 第一次点击创建草稿多边形
      draftPolygon = new fabric.Polygon([{ x: pointerX, y: pointerY }], {
        stroke: "#333",
        strokeWidth: 1,
        fill: "#ccc",
        opacity: 0.3,
        selectable: false,
        hasBorders: false,
        hasControls: false,
        evented: false,
      });
      canvas.add(draftPolygon);
    }
    currentEdgeLine = edgeLine;
    vertexMarkers.push(vertexMarker);
    edgeLines.push(edgeLine);
    canvas.add(edgeLine, vertexMarker);
  }
};

// 鼠标移动事件处理函数
const handleMouseMove = (eventData) => {
  if (!isDrawingPolygon) return;
  if (currentEdgeLine && currentEdgeLine.class === "line") {
    const pointer = canvas.getPointer(eventData.e);
    currentEdgeLine.set({ x2: pointer.x, y2: pointer.y });
    const pointsArray = draftPolygon.get("points");
    pointsArray[vertexMarkers.length] = { x: pointer.x, y: pointer.y };
    draftPolygon.set({ points: pointsArray });
    canvas.requestRenderAll();
  }
};

// 启用多边形绘制的鼠标事件，并禁用已有多边形选择
const enableDrawingEvents = () => {
  canvas.selection = false;
  canvas.isDrawingShapes = true;
  canvas.defaultCursor = "crosshair";
  polygonRegistry = {};
  vertexMarkers = [];
  edgeLines = [];
  canvas.discardActiveObject();
  canvas.off("mouse:down").off("mouse:move");
  canvas.forEachObject((obj) =>
    obj.set({ evented: false, hasBorders: false, hasControls: false })
  );
  canvas.on({
    "mouse:down": handleMouseDown,
    "mouse:move": handleMouseMove,
  }).requestRenderAll();
  Mousetrap.bind("enter", (evt) => {
    evt.preventDefault();
    finalizePolygon();
  });
};

// 禁用多边形绘制事件，并恢复画布状态
const disableDrawingEvents = () => {
  resetDrawingElements();
  canvas.selection = true;
  canvas.isDrawingShapes = false;
  canvas.off("mouse:down", handleMouseDown);
  canvas.off("mouse:move", handleMouseMove);
  canvas.forEachObject((obj) =>
    obj.set({ evented: true, hasBorders: true, hasControls: true })
  );
  debouncedCommitChange();
  canvas.requestRenderAll();
  Mousetrap.unbind("enter");
};

// 构建多边形的侧边 GUI 控件
const buildPolygonGui = async () => {

  const refs = render('', (d, e, f, _if) => {
    function t(title, id) {
      let dataId = id ? `data-id="${id}"` : '';
      return `<h5 class="text-slate-700 text-sm py-2" ${dataId}>${title}</h5>`;
    }
    function c(id, className) {
      let dataId = id ? `data-id="${id}"` : '';
      return `<div ${dataId} class="${className}"></div>`;
    }
    return [
      `<div data-id="wrapper"  class="text-sm">`,
      render.section('', [
        render.titleRow('描边', 'strokeColorPicker','flex-grow-0'),
        render.row('宽度', 'strokeSliderContainer'),
      ]),
      render.section('', [
        render.titleRow('填充', 'fillSwitchContainer','flex-grow-0'),
        render.row('颜色', 'fillColorPicker','flex-grow-0'),
      ]),
      render.section('', [
        render.titleRow('草图', 'roughSwitchContainer','flex-grow-0'),
        render.row('', 'roughOptionsContainer'),
      ]),
      `</div>`

    ];

  }, panel.content);

  const { strokeSliderContainer, strokeColorPicker, fillSwitchContainer, fillColorPicker, roughSwitchContainer, roughOptionsContainer } = refs;

 
  // 描边宽度控制
  elements.getGui(strokeSliderContainer, "slider", {
    value: polygonStrokeWidth,
    min: 0,
    max: 100,
    onchange: (value) => {
      polygonStrokeWidth = value;
      if (currentPolygon) {
        currentPolygon.set("strokeWidth", polygonStrokeWidth);
        debouncedCommitChange();
        canvas.requestRenderAll();
      }
    },
  });

  // 描边颜色控制
  elements.getGui(strokeColorPicker, "colorButton", {
    color: polygonStrokeColor,
    
    onchange: (info) => {
      let newColor = info.fabricColor;
      polygonStrokeColor = newColor;
      if (currentPolygon) {
        currentPolygon.set("stroke", polygonStrokeColor);
        debouncedCommitChange();
        canvas.requestRenderAll();
      }
    },
  });



  function toggleFillColorPicker() {
    if (fillEnabled) {
      fillColorPicker.parentNode.style.display = "";
    } else {
      fillColorPicker.parentNode.style.display = "none";
    }
  }
  toggleFillColorPicker();
  elements.getGui(fillSwitchContainer, "iosCheckbox", {
    checked: fillEnabled,
    label: '',
    labelPosition: 'after',
    onchange: (checked) => {
      fillEnabled = checked;
      fillEnabled = checked;
      if (currentPolygon) {
        currentPolygon.set("fill", fillEnabled ? polygonFillColor : "transparent");
        debouncedCommitChange();
        canvas.requestRenderAll();
      }
      toggleFillColorPicker();
    },
  });
  // 填充颜色
  elements.getGui(fillColorPicker, "colorButton", {
    color: polygonFillColor,
    
    onchange: (info) => {
      let newColor = info.fabricColor;
        polygonFillColor = newColor;
        if(fillEnabled){
        // fillEnabled = true;
        // fillCheckbox.checked = true;
        if (currentPolygon) {
          currentPolygon.set("fill", polygonFillColor);
          debouncedCommitChange();
          canvas.requestRenderAll();
        }
      }
    },
  });

  function toggleRoughOptionsPanel() {
    if (isRoughMode) {
      roughOptionsContainer.style.display = "";
      generateRoughOptionsPanel(currentPolygon, roughOptionsContainer);
    } else {
      roughOptionsContainer.style.display = "none";
    }
  }
  toggleRoughOptionsPanel();
  elements.getGui(roughSwitchContainer, "iosCheckbox", {
    checked: isRoughMode,
    label: '',
    labelPosition: 'after',
    onchange: (checked) => {
      isRoughMode = checked;
      if (currentPolygon) {
        const polygonIndex = canvas.getObjects().indexOf(currentPolygon);
        let polygonOptions = {};
        for (let prop in currentPolygon.toObject()) {
          if (prop !== "type" && prop !== "points" && currentPolygon[prop] != null) {
            polygonOptions[prop] = currentPolygon[prop];
          }
        }
        const newTypeName = isRoughMode ?"RoughPolygon": "Polygon";
        const NewPolygonClass = fabric[newTypeName];
        polygonOptions = new NewPolygonClass(currentPolygon.points, polygonOptions);
        canvas.remove(currentPolygon);
        currentPolygon = polygonOptions;
        canvas.add(currentPolygon).setActiveObject(currentPolygon);
        polygonRegistry[currentPolygon.uid] = currentPolygon;
        currentPolygon.moveTo(polygonIndex);
        debouncedCommitChange();
        canvas.requestRenderAll();
      }
      toggleRoughOptionsPanel();
    },
  });

  panel.show("polygon", refs.wrapper, "多边形设置");

  
  
};

// 初始化多边形绘制：显示提示、构建 GUI，并启用鼠标事件
const init = () => {
  currentPolygon = null;
  if (polygonStrokeWidth <= 0) polygonStrokeWidth = 5;
  showInfo(lib.word(1391), 5000);
  buildPolygonGui();
  enableDrawingEvents();
};

// 编辑模式：更新状态并重建 GUI
const edit = (poly) => {
  isRoughMode = /rough/.test(poly.type);
  currentPolygon = poly;
  updatePolygonSettings(currentPolygon);
};

// 清除绘制模式和 GUI
const destroy = () => {
  currentPolygon = null;
  disableDrawingEvents();
};



    emitter.on("operation:polygon:init", () => {
      panel.show('polygon');  
      init();
    });
    emitter.on("operation:polygon:edit", (object) => {
      panel.show('polygon');  
      edit(object);
    });
    emitter.on('operation:destroy', (operationType) => {
        if (operationType === 'polygon') {
            destroy();
        }
    });

  
