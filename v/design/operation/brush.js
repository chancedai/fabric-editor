// 外部依赖（请确保在使用前引入）：
// - canvas: fabric.Canvas 实例（原变量 d）
// - containerElement: 用于显示 GUI 控件的容器 DOM 元素（原变量 E）
// - GUIelements.getGui(): 根据类型创建控件的方法
// - GUIelements.destroy(): 销毁控件的方法
// - lib.word(): 国际化文案方法
// - fabric: Fabric.js 库

import { emitter, render } from "../../__common__/utils";
import fabric from "../fabric";
import { canvas, debouncedCommitChange } from "../canvas";
import lib from "../lib";
import { panel } from "../component/sidebar";
import elements from "../elements";


    // 当前画笔类型、配置、绘制对象及模式画笔实例
    let currentBrushType = "pencil";
    let brushSettings = null;
    let currentDrawingObject = null;
    let patternBrush = null;
  
    // 各种画笔类型的默认配置
    const brushConfigs = {
      eraser: { width: 30 },
      crayon: { width: 30, color: "rgb(0,0,0)", opacity: 0.6 },
      fur: { width: 1, color: "rgb(0,0,0)", opacity: 1 },
      ink: { width: 30, color: "rgb(0,0,0)", opacity: 0.5 },
      longfur: { width: 1, color: "rgb(0,0,0)", opacity: 1 },
      marker: { width: 10, color: "rgb(0,0,0)", opacity: 1 },
      ribbon: { width: 1, color: "rgb(0,0,0)", opacity: 1 },
      shaded: { width: 1, color: "rgb(0,0,0)", shadeDistance: 1000, opacity: 0.1 },
      sketchy: { width: 1, color: "rgb(0,0,0)", opacity: 1 },
      spraypaint: { width: 30, color: "rgb(0,0,0)", opacity: 1 },
      squares: { width: 1, color: "#000", bgColor: "rgb(255,255,255)", opacity: 1 },
      web: { width: 1, color: "rgb(0,0,0)", opacity: 1 },
      pencil: { width: 5, color: "rgb(0,0,0)", opacity: 1 },
      circle: { width: 5, color: "rgb(0,0,0)", opacity: 1 },
      pattern: { width: 25, color: "rgb(0,0,0)", pattern: "circle", opacity: 1 }
    };
  
    // 字符串首字母大写
    function capitalize(str) {
      if (typeof str !== "string") return "";
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  
    // 根据当前配置更新 fabric 的自由绘画画笔
    function updateBrush() {       
      canvas.isDrawingShape = false;
      canvas.isDrawingMode = true;
      switch (currentBrushType) {
        case "eraser":
          canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
          canvas.freeDrawingBrush.width = brushSettings.width;
          break;
        case "pencil":
        case "circle":
          canvas.freeDrawingBrush = new fabric[capitalize(currentBrushType) + "Brush"](canvas);
          canvas.freeDrawingBrush.width = brushSettings.width;
          canvas.freeDrawingBrush.color = brushSettings.color;
          break;
        case "pattern":
          let patternBrushInstance;
          switch (brushSettings.pattern) {
            case "hLine":
              patternBrushInstance = new fabric.PatternBrush(canvas);
              patternBrushInstance.getPatternSrc = () => {
                const patternCanvas = document.createElement("canvas");
                patternCanvas.width = 10;
                patternCanvas.height = 10;
                const ctx = patternCanvas.getContext("2d");
                ctx.globalAlpha = brushSettings.opacity;
                ctx.strokeStyle = brushSettings.color;
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(0, 5);
                ctx.lineTo(10, 5);
                ctx.closePath();
                ctx.stroke();
                return patternCanvas;
              };
              break;
            case "vLine":
              patternBrushInstance = new fabric.PatternBrush(canvas);


              patternBrushInstance.getPatternSrc = () => {
                const patternCanvas = document.createElement("canvas");
                patternCanvas.width = 10;
                patternCanvas.height = 10;
                const ctx = patternCanvas.getContext("2d");
                ctx.globalAlpha = brushSettings.opacity;
                ctx.strokeStyle = brushSettings.color;
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(5, 0);
                ctx.lineTo(5, 10);
                ctx.closePath();
                ctx.stroke();
                return patternCanvas;
              };
              break;
            case "square":
              patternBrushInstance = new fabric.PatternBrush(canvas);
              patternBrushInstance.getPatternSrc = () => {
                const patternCanvas = document.createElement("canvas");
                patternCanvas.width = 12;
                patternCanvas.height = 12;
                const ctx = patternCanvas.getContext("2d");
                ctx.globalAlpha = brushSettings.opacity;
                ctx.fillStyle = brushSettings.color;
                ctx.fillRect(0, 0, 10, 10);
                return patternCanvas;
              };
              break;
            case "circle":
            default:
              patternBrushInstance = new fabric.PatternBrush(canvas);
              patternBrushInstance.getPatternSrc = () => {
                const patternCanvas = document.createElement("canvas");
                patternCanvas.width = 25;
                patternCanvas.height = 25;
                const ctx = patternCanvas.getContext("2d");
                ctx.globalAlpha = brushSettings.opacity;
                ctx.fillStyle = brushSettings.color;
                ctx.beginPath();
                ctx.arc(10, 10, 10, 0, 2 * Math.PI, false);
                ctx.closePath();
                ctx.fill();
                return patternCanvas;
              };
          }
          patternBrush = canvas.freeDrawingBrush = patternBrushInstance;
          if (patternBrush.getPatternSrc) {
            patternBrush.source = patternBrush.getPatternSrc.call(patternBrush);
          }
          canvas.freeDrawingBrush.width = brushSettings.width;
          canvas.freeDrawingBrush.color = brushSettings.color;
          break;
        default:
          // 下面的是自定义画笔
          canvas.freeDrawingBrush = new fabric[capitalize(currentBrushType) + "Brush"](canvas, brushSettings);
      }
    }
  
    // 构建 GUI 控件（使用原生 DOM 和 TailwindCSS 样式，宽度固定 250px）
    async function buildGui() {

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
            currentBrushType !== "eraser"?render.row('颜色', 'brushColor', 'flex-grow-0'):'',
            render.row('粗细', 'brushWidth'),
            currentBrushType === "squares"?render.row('背景色', 'bgColor'):'',
            currentBrushType === "shaded"?render.row('阴影距离', 'shadeDistance'):'',
            currentBrushType === "pattern"?render.row('图案', 'pattern'):'',
            !/eraser|pencil|circle/.test(currentBrushType)?render.row('透明度', 'opacity'):'',
          ]),
          `</div>`
        ];
    
      }, panel.content);

      const { brushWidth, brushColor, bgColor, shadeDistance, pattern, opacity } = refs;
  
      // 画笔粗细控制行
      
      elements.getGui( brushWidth, "slider", {
        value: brushSettings.width,
        min: 1,
        max: 100,
        onchange: (value) => {
          brushSettings.width = value;
          if (currentBrushType === "pencil" && currentDrawingObject) {
            currentDrawingObject.set("strokeWidth", value);
            debouncedCommitChange();
            canvas.requestRenderAll();
          } else {
            updateBrush();
          }
        }
      });
  
      // 非橡皮擦模式下的颜色选择
      if (currentBrushType !== "eraser") {
        
        elements.getGui( brushColor, "colorButton", {
          color: brushSettings.color,
          
          onchange: (info) => {
            let newColor = info.fabricColor;
            brushSettings.color = newColor;
            if (currentBrushType === "pencil" && currentDrawingObject) {
              currentDrawingObject.set("stroke", newColor);
              debouncedCommitChange();
              canvas.requestRenderAll();
            } else {
              updateBrush();
            }
          }
        });
      }
  
      // squares 画笔下的背景色选择
      if (currentBrushType === "squares") {
        
        elements.getGui( bgColor, "colorButton", {
          color: brushSettings.bgColor,
          onchange: (info) => {
            let newColor = info.fabricColor;
            brushSettings.bgColor = newColor;
            updateBrush();
          }
        });
      }
  
      // shaded 画笔下的阴影距离控制
      if (currentBrushType === "shaded") {
        elements.getGui( shadeDistance, "slider", {
          value: brushSettings.shadeDistance / 1000,
          min: 1,
          max: 10,
          onchange: (value) => {
            brushSettings.shadeDistance = 1000 * value;
            updateBrush();
          }
        });
      }
  
      // pattern 画笔下的图案选择
      if (currentBrushType === "pattern") {
        
        elements.getGui( pattern, "select", {
          default: brushSettings.pattern,
          choices: {
            circle: lib.word(1302),
            square: lib.word(1303),
            vLine: lib.word(1304),
            hLine: lib.word(1305)
          },
          onchange: (value) => {
            brushSettings.pattern = value;
            updateBrush();
          }
        });
      }
  
      // 非 eraser/pencil/circle 画笔下的透明度控制
      if (!/eraser|pencil|circle/.test(currentBrushType)) {
        
        elements.getGui( opacity, "slider", {
          value: 100 * brushSettings.opacity,
          min: 10,
          max: 100,
          onchange: (value) => {
            brushSettings.opacity = value / 100;
            updateBrush();
          }
        });
        // opacityRow.appendChild(opacityControl);
        // guiContainer.appendChild(opacityRow);
      }

      panel.show('brush', refs.wrapper, '画笔设置');

    }
  

      function init(brushType) {
        currentBrushType = brushType;
        brushSettings = brushConfigs[brushType];
        currentDrawingObject = null;
        updateBrush();
        buildGui();
      };
      function edit (drawingObject)  {
        currentDrawingObject = drawingObject;
        currentBrushType = "pencil";
        brushSettings = brushConfigs["pencil"];
        brushSettings.color = drawingObject.get("stroke");
        brushSettings.width = drawingObject.get("strokeWidth");
        buildGui();
      };

    emitter.on("operation:brush:init", async (type) => {
      init(type);
    });
    emitter.on("operation:brush:edit", (object) => {
      edit(object);
    });
 
