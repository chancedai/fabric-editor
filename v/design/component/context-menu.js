import lib from "../lib.js";
import { delegator, render, showInfo, emitter, throttle } from "../../__common__/utils.js";
import { canvas, exportCanvasConfig, debouncedCommitChange } from "../canvas.js";
import elements from "../elements";
import Mousetrap from "mousetrap";
import ImageTracer from "imagetracerjs";


import tippy from "tippy.js";
import "tippy.js/themes/light.css";

const fabricContainer = document.querySelector("#canvasContainer");

// function extractCustomPathsFromFabricObject(fabricObject) {
//   let paths = [];

//   if (fabricObject.type === "path") {
//     // 直接使用 path，做归一化
//     const normalizedPath = fabricObject.path.map(cmd => {
//       const [command, ...args] = cmd;
//       return [command, ...args.map(v => parseFloat(v) / fabricObject.width)];
//     });
//     paths.push({
//       path: normalizedPath
//     });

//   } else if (fabricObject.type === "polygon" || fabricObject.type === "polyline") {
//     // 将 points 转为 "M" + "L" + "Z" 命令
//     const points = fabricObject.points;
//     const normalizedPoints = points.map(p => [p.x / fabricObject.width, p.y / fabricObject.height]);
//     const path = [["M", ...normalizedPoints[0]]];
//     for (let i = 1; i < normalizedPoints.length; i++) {
//       path.push(["L", ...normalizedPoints[i]]);
//     }
//     path.push(["Z"]);
//     paths.push({ path });

//   } else if (fabricObject.type === "group") {
//     // 递归处理组内对象
//     fabricObject._objects.forEach(obj => {
//       const subPaths = extractCustomPathsFromFabricObject(obj);
//       paths.push(...subPaths);
//     });
//   }

//   return paths;
// }

/**
 * 提取各种 FabricJS 对象的路径，归一化到 [0, 1] 范围。
 * 兼容 FabricJS 内置对象 + 你的自定义对象。
 */
/**
 * 提取 FabricObject 的轮廓路径
 * 包括：
 * 1) 基本形状（几何体 / Path）
 * 2) 特殊自定义对象
 * 3) 文字类和图片类 Image / shapeimage / borderimage / rulerimage：使用像素不透明区域提取轮廓
 */
function extractCustomPathsFromFabricObject(fabricObject) {
  const paths = [];
  const w = fabricObject.width || 1;
  const h = fabricObject.height || 1;
  // const w = fabricObject.getScaledWidth() || 1;
  // const h = fabricObject.getScaledHeight() || 1;

  // 工具：规范化 path 命令（归一化坐标）
  const normalizePath = (path) => {
    return path.map(cmd => {
      const [c, ...args] = cmd;
      return [c, ...args.map((v, i) => (i % 2 === 0 ? v / w : v / h))];
    });
  };

  // 提取像素不透明区域轮廓
  // const extractAlphaContourFromFabricObject = (obj) => {
  //   const canvasElement = obj.toCanvasElement();
  //   const ctx = canvasElement.getContext("2d");
  //   const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
  
  //   // ⚠️ 直接拿返回值
  //   const svgstr = ImageTracer.imagedataToSVG(imageData, {
  //     ltres: 0.01,
  //     qtres: 1,
  //     pathomit: 0,
  //     rightangleenhance: false,
  //     scale: 1
  //   });
  
  //   // ⚠️ 这里再解析 svgstr 提取路径
  //   const parser = new DOMParser();
  //   const svgDoc = parser.parseFromString(svgstr, "image/svg+xml");
  //   const pathElements = svgDoc.querySelectorAll("path");
  //   const paths = [];
  
  //   pathElements.forEach((pathEl) => {
  //     const d = pathEl.getAttribute("d");
  //     if (!d) return;
  
  //     const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g);
  //     if (!commands) return;
  
  //     const path = [];
  //     for (const cmd of commands) {
  //       const c = cmd[0];
  //       const args = cmd
  //         .slice(1)
  //         .trim()
  //         .split(/[\s,]+/)
  //         .map(Number);
  
  //       // 如果你需要归一化:
  //       // const normArgs = args.map((v, i) =>
  //       //   i % 2 === 0 ? v / canvasElement.width : v / canvasElement.height
  //       // );
  //       // path.push([c.toUpperCase(), ...normArgs]);
  
  //       // 或者像素坐标:
  //       path.push([c.toUpperCase(), ...args]);
  //     }
  
  //     paths.push({ path });
  //   });
  
  //   return paths;
  // };

  function extractAlphaContourFromFabricObject(obj) {
    const canvasElement = obj.toCanvasElement();
    const ctx = canvasElement.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
  
    // 生成 alpha 通道蒙版
    const alphaCanvas = document.createElement("canvas");
    alphaCanvas.width = canvasElement.width;
    alphaCanvas.height = canvasElement.height;
    const alphaCtx = alphaCanvas.getContext("2d");
    const alphaImageData = alphaCtx.createImageData(canvasElement.width, canvasElement.height);
  
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      // 二值化：如果 alpha > 0, 就算作不透明
      const value = alpha > 0 ? 255 : 0;
      alphaImageData.data[i] = value;
      alphaImageData.data[i + 1] = value;
      alphaImageData.data[i + 2] = value;
      alphaImageData.data[i + 3] = 255; // 全不透明，避免透明度干扰
    }
    alphaCtx.putImageData(alphaImageData, 0, 0);
  
    // 用 ImageTracer 提取路径
    const svgStr = ImageTracer.imagedataToSVG(
      alphaCtx.getImageData(0, 0, alphaCanvas.width, alphaCanvas.height),
      {
        ltres: 1,
        qtres: 1,
        pathomit: 0,
        rightangleenhance: true,
        numberofcolors: 2,
        colorquantcycles: 1,
        // blurradius:5, 
        // blurdelta: 64
      }
    );
  
    // 提取 path 元素
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgStr, "image/svg+xml");
    const pathElements = svgDoc.querySelectorAll("path");
    const paths = [];
    pathElements.forEach((pathEl) => {
      const d = pathEl.getAttribute("d");
      if (!d) return;
      const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g);
      if (!commands) return;
      const path = [];
      for (const cmd of commands) {
        const c = cmd[0];
        const args = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
        const normArgs = args.map((v, i) =>
          i % 2 === 0 ? v / canvasElement.width : v / canvasElement.height
        );
        path.push([c.toUpperCase(), ...normArgs]);
      }
      paths.push({ path });
    });
  
    return paths;
  }
  
  
  

  // 基础形状
  const extractBasicShapePaths = (obj) => {
    const list = [];
    switch (obj.type) {
      case "rect":
        list.push({
          path: [["M", 0, 0], ["L", 1, 0], ["L", 1, 1], ["L", 0, 1], ["Z"]]
        });
        break;
      case "circle":
      case "ellipse": {
        const rx = (obj.rx || obj.radius || w / 2) / w;
        const ry = (obj.ry || obj.radius || h / 2) / h;
        const cx = 0.5, cy = 0.5, KAPPA = 0.552284749831;
        const ox = rx * KAPPA, oy = ry * KAPPA;
        list.push({
          path: [
            ["M", cx, cy - ry],
            ["C", cx + ox, cy - ry, cx + rx, cy - oy, cx + rx, cy],
            ["C", cx + rx, cy + oy, cx + ox, cy + ry, cx, cy + ry],
            ["C", cx - ox, cy + ry, cx - rx, cy + oy, cx - rx, cy],
            ["C", cx - rx, cy - oy, cx - ox, cy - ry, cx, cy - ry],
            ["Z"]
          ]
        });
        break;
      }
      case "line":
        list.push({
          path: [
            ["M", (obj.x1 || 0) / w, (obj.y1 || 0) / h],
            ["L", (obj.x2 || w) / w, (obj.y2 || h) / h]
          ]
        });
        break;
      case "polygon":
      case "polyline":
      case "star": {
        const points = obj.points.map(p => [
          (p.x + w / 2) / w,
          (p.y + h / 2) / h
        ]);
        const path = [["M", ...points[0]]];
        for (let i = 1; i < points.length; i++) {
          path.push(["L", ...points[i]]);
        }
        if (obj.type !== "polyline") path.push(["Z"]);
        list.push({ path });
        break;
      }
      case "triangle":
        list.push({
          path: [["M", 0.5, 0], ["L", 1, 1], ["L", 0, 1], ["Z"]]
        });
        break;
      case "textbox":
      case "i-text":
      case "text":
        list.push({
          path: [["M", 0, 0], ["L", 1, 0], ["L", 1, 1], ["L", 0, 1], ["Z"]]
        });
        break;
      case "path":
        list.push({
          path: normalizePath(obj.path)
        });
        break;
    }
    return list;
  };

  // 主处理逻辑
  switch (fabricObject.type) {
    // FabricJS 内置基本图形
    case "rect":
    case "circle":
    case "ellipse":
    case "line":
    case "polygon":
    case "polyline":
    case "triangle":
    // case "textbox":
    // case "i-text":
    // case "text":
    case "path":
    case "star":
      paths.push(...extractBasicShapePaths(fabricObject));
      break;

    // 自定义心形
    case "heart":
    case "roughHeart":
      paths.push({
        path: [
          ["M", 0, 0.25],
          ["Q", 0, 0, 0.25, 0],
          ["Q", 0.5, 0, 0.5, 0.1667],
          ["Q", 0.5, 0, 0.75, 0],
          ["Q", 1, 0, 1, 0.25],
          ["Q", 1, 0.5, 0.75, 0.75],
          ["L", 0.5, 1],
          ["L", 0.25, 0.75],
          ["Q", 0, 0.5, 0, 0.25],
          ["Z"]
        ]
      });
      break;

    // 其他自定义
    case "roughRect":
    case "roughEllipse":
    case "roughTriangle":
    case "roughStar":
    case "roughPolygon":
    case "linearrow":
      if (fabricObject.path) {
        paths.push({
          path: normalizePath(fabricObject.path)
        });
      }
      break;

    // 文字相关自定义
    // case "textasset":
    // case "textcurved":
    // case "textwarped":
    //   paths.push({
    //     path: [["M", 0, 0], ["L", 1, 0], ["L", 1, 1], ["L", 0, 1], ["Z"]]
    //   });
    //   break;

    // 组对象递归
    case "group":
      for (const obj of fabricObject._objects) {
        const childPaths = extractCustomPathsFromFabricObject(obj);
        paths.push(...childPaths);
      }
      break;

    // 图像对象 / shapeimage / borderimage / rulerimage：使用像素轮廓，文字类也使用这个方法
    case "textbox":
    case "i-text":
    case "text":
    case "textasset":
    case "textcurved":
    case "textwarped":
    case "image":
    case "shapeimage":
    case "borderimage":
    case "rulerimage": {
      const alphaPaths = extractAlphaContourFromFabricObject(fabricObject);
      paths.push(...alphaPaths);
      break;
    }

    // 其他未处理类型
    default:
      console.warn("未处理的对象类型:", fabricObject.type);
      break;
  }

  return paths;
}







// 使用 tippy 做一个透明度设置



const opacityTooltip = (function(){
  // 在显示的时候，如果没有实例才初始化
  let tooltip = null;
  let opacitySlider = null;
  let refs = null;
  let update = function(){};
  const setOpacity = throttle((value)=>{
    const object = canvas.getActiveObject();
    object.set("opacity", value / 100);
    refs.delete.disabled = (value == 100);
    canvas.requestRenderAll();
  }, 200);

  function init(button){
    const object = canvas.getActiveObject();
    const content = document.createElement("div");
    content.className = "flex flex-col gap-1 w-68 p-4";
    // 最后加一个重置(删除)按钮，设置为 100 
    refs = render({}, () => `
        <span class="text-sm">不透明度</span>
        <div data-id="opacitySlider"></div>
        <button data-id="delete" class="mt-2 w-full btn-primary btn-sm">重置</button>
    `, content);
    opacitySlider = elements.getGui(refs.opacitySlider, "slider", {
    // opacitySlider = createSlider(refs.opacity, {
      range: [0, 100],
      step: 1,
      value: object.opacity * 100,
      onchange: (value) => {
        setOpacity(value);
      }
    });
    refs.delete.addEventListener("click", () => {
      setOpacity(100);
      opacitySlider.update(100);
    });
    refs.delete.disabled = (object.opacity * 100 == 100);
    
    tooltip = tippy(button, {
      content: content,
      interactive: true,
      trigger: 'manual',
      placement: 'bottom',
      theme: "light",
      arrow: false,
      offset: [0, 14],
    });

    update = function(){
      const object = canvas.getActiveObject();
      if(!object){
        return;
      }
      opacitySlider.update(object.opacity * 100);
      refs.delete.disabled = (object.opacity * 100 == 100);
    }
    // tooltip.show();
  }

  function show(button){
    if(!tooltip){
      init(button);
    }else{
      update();
    }
    
    // button 可能修改了，修改button
    tooltip.setProps({
      triggerTarget: button,
    
    });
    tooltip.show();

  }
  return {
    show,
    hide: function(){
      if(tooltip){
        tooltip.hide();
      }
    },
  }
})();

/**
 * 处理上下文菜单点击事件，执行具体任务
 * @param {string} type - 要执行的任务
 * @param {Object} object - 当前操作的对象
 */
function handleType(
  type,
  object,
  target,
  event
) {
  if(!type){
    return;
  }
  const functions = {
    // 选择字体
    font: () => {
      emitter.emit("operation:font:edit", object);
    },
    // 显示图层
    showLayer: () => {
      emitter.emit("component:layer");
    },
    more: () => {
      rightMenu.show(event);
    },
    path: () => {
      emitter.emit("operation:svg:edit", object);
    },
    opacity: () => {
      // emitter.emit("operation:opacity:init", object);
      opacityTooltip.show(target);
    },
    shadow: () => {
      emitter.emit("operation:shadow:init", object);
    },
    position: () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        emitter.emit("operation:position:edit", activeObject);
      }
    },
    objLock: () => {
      object.set("selectable", false);
      canvas.discardActiveObject().requestRenderAll();
      canvas.fire("object:locked");
    },
    objSave: () => {
      object.exportPNG();
    },
    objSaveJson: async () => {
      let json = object.toJSON();
      json = JSON.stringify(json, null, 2);
      const blob = new Blob([json], { type: "application/json" });
    
      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: "object.json",
            types: [
              {
                description: "JSON File",
                accept: { "application/json": [".json"] },
              },
            ],
          });
    
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (error) {
          console.error("Save cancelled or failed:", error);
        }
      } else {
        // Fallback for browsers that do not support showSaveFilePicker
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "object.json";
        a.click();
        URL.revokeObjectURL(url); // Clean up the object URL after the download
      }
    },    
    objRemove: () => {
      canvas.remove(object);
    },
    objClone: () => {
      canvas.cloneObject(object);
    },
    setMask: async() => {
      const customPaths = extractCustomPathsFromFabricObject(object);
      if(!customPaths || customPaths.length === 0 ){
        showInfo('该对象无法设置为蒙版');
        return;
      }
    
      const image = new Image();
      image.crossOrigin = "Anonymous";
      image.onload = () => {
        // 1️⃣ 目标显示尺寸（你 Shapeimage 的宽高）
        // const targetWidth = object.width;
        // const targetHeight = object.height;
        const targetWidth = object.getScaledWidth();
        const targetHeight = object.getScaledHeight();
    
        // 2️⃣ 原图尺寸
        const imgWidth = image.width;
        const imgHeight = image.height;
    
        // 3️⃣ 计算 cover 裁剪
        const targetRatio = targetWidth / targetHeight;
        const imgRatio = imgWidth / imgHeight;
    
        let cx, cy, cw, ch;
        if (imgRatio > targetRatio) {
          // 图片比目标更宽 -> 左右裁剪
          ch = imgHeight;
          cw = imgHeight * targetRatio;
          cx = (imgWidth - cw) / 2;
          cy = 0;
        } else {
          // 图片比目标更高 -> 上下裁剪
          cw = imgWidth;
          ch = imgWidth / targetRatio;
          cx = 0;
          cy = (imgHeight - ch) / 2;
        }
    
        // 4️⃣ 创建 Shapeimage
        const shapeImage = new fabric.Shapeimage(image, {
          width: targetWidth,
          height: targetHeight,
          // scaleX: object.scaleX,
          // scaleY: object.scaleY,
          left: object.left,
          top: object.top,
          angle: object.angle,
          flipX: object.flipX,
          flipY: object.flipY,
          skewX: object.skewX,
          skewY: object.skewY,
    
          shape: "custom",   // 使用自定义路径
          customPaths: customPaths,
    
          // 关键点：裁剪源图的区域，确保 cover 不变形
          cx: cx,
          cy: cy,
          cw: cw,
          ch: ch,
    
          // 原始宽高（也在内部用作比例判断）
          orgWidth: imgWidth,
          orgHeight: imgHeight
        });
    
        // 5️⃣ 放到画布中
        canvas.add(shapeImage);
        canvas.setActiveObject(shapeImage);
        shapeImage.setCenter();  // 让内容也以 cover 居中
        canvas.remove(object);
        canvas.requestRenderAll();
      };
    
      // 触发加载
      let src = object.getSrc ? object.getSrc() : object.src;
      if(!src){
        src ="data:image/jpg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA8AAD/4QMuaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA2LjAtYzAwMiA3OS4xNjQ0ODgsIDIwMjAvMDcvMTAtMjI6MDY6NTMgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCAyMi4wIChNYWNpbnRvc2gpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjdFNEFENjc5NTc0MDExRUM4NzUzRTZGM0ZGRDhFNTlEIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjdFNEFENjdBNTc0MDExRUM4NzUzRTZGM0ZGRDhFNTlEIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6N0U0QUQ2Nzc1NzQwMTFFQzg3NTNFNkYzRkZEOEU1OUQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6N0U0QUQ2Nzg1NzQwMTFFQzg3NTNFNkYzRkZEOEU1OUQiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAGBAQEBQQGBQUGCQYFBgkLCAYGCAsMCgoLCgoMEAwMDAwMDBAMDg8QDw4MExMUFBMTHBsbGxwfHx8fHx8fHx8fAQcHBw0MDRgQEBgaFREVGh8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//wAARCAIAAgADAREAAhEBAxEB/8QAlAABAAIDAQEAAAAAAAAAAAAAAAIEAQMFBgcBAQADAQEAAAAAAAAAAAAAAAABAgMEBRABAAIBAgIFBgwEBQUAAAAAAAECAxEEMQUhQVESBmFxgaGxMpHB0SJCUnKyEzMUB6IjRBbhgpLSRcJDc1QVEQEBAAIBBAIDAQADAQAAAAAAAQIDEUFREgQxEyFhFAVxIjJC/9oADAMBAAIRAxEAPwD769B4oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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";
      }
      image.src = src;
    }, 
    objFlipX: () => {
      canvas.modifyObject("flipX");
    },
    objFlipY: () => {
      canvas.modifyObject("flipY");
    },
    objRotateLeft: () => {
      canvas.modifyObject("angleBy", -90);
    },
    objRotateRight: () => {
      canvas.modifyObject("angleBy", 90);
    },
    objBringForward: () => {
      canvas.bringForward(object);
      debouncedCommitChange();
    },
    objSendBackwards: () => {
      canvas.sendBackwards(object);
      debouncedCommitChange();
    },
    objBringTop: () => {
      canvas.bringToFront(object);
      debouncedCommitChange();
    },
    objSendBottom: () => {
      canvas.sendToBack(object);
      debouncedCommitChange();
    },
    objRecenter: () => {
      object.set({
          left: (exportCanvasConfig.width - object.getScaledWidth()) / 2,
          top: (exportCanvasConfig.height - object.getScaledHeight()) / 2
      }).setCoords();
      debouncedCommitChange();
      canvas.requestRenderAll();
    },
    copyStyle: () => {
      emitter.emit("operation:style:copy", target);
    },
    editText: () => {
      emitter.emit("operation:text:edit", object);
    },
    editTextCurved: () => {
      emitter.emit("operation:textCurved:edit", object);
    },
    editTextWarped: () => {
      emitter.emit("operation:textWarped:edit", object);
    },
    imgFilters: () => {
      emitter.emit("operation:filter:edit", object);
    },
    editShapeImage: () => {
      emitter.emit("operation:shapeImage:edit", object);
    },
    replaceShapeImage: () => {
      emitter.emit("operation:upload-image:init");
    },
    editSvg: () => {
      emitter.emit("operation:svg:edit", object);
    },
    editBorder: () => {
      emitter.emit("operation:border:edit", object);
    },
    editRuler: () => {
      emitter.emit("operation:ruler:edit", object);
    },
    drawSymbol: () => {
      emitter.emit("operation:symbol:edit", object);
    },
    drawPolygon: () => {
      emitter.emit("operation:polygon:edit", object);
    },
    drawShape: () => {
      emitter.emit("operation:shape:edit", object);
    },
    ungroupObjects: () => {
      ungroupObjects();
    },
    groupObjects: () => {
      groupObjects();
    }
  };
  if(type.startsWith("page-")){
    const pageType = type.split("-")[1];
    emitter.emit("operation:position:align", {
      object,
      type: pageType,
    });
  }else if (type in functions) {
    functions[type]();
  }
}

/**
 * 为一个按钮生成 HTML 内容
 * @param {string} type - 按钮任务的标识符
 * @param {string} title - 按钮的提示文字
 * @param {string} iconClass - 按钮的图标类名
 * @returns {string} - 返回按钮的 HTML 字符串
 */
function createButton({type, title, iconClass,hidden = false}) {
  // 如果没有 iconClass,则使用 title 做为图标
  
  let content = '';
  if(iconClass){
    content = `<i class="${iconClass} text-xl"></i>`;
    title = ` title="${title}" `;
  }else{
    content = `<span class="text-slate-700 text-sm whitespace-nowrap">${title}</span>`;
    title = '';
  }
  return `
  <button class="action-btn p-1 flex items-center m-0.5 text-slate-700 hover:bg-slate-100 rounded-lg focus:outline-hidden transition-colors hover:text-slate-900 ${hidden ? 'hidden' : ''}" data-id="${type}" ${title} >${content}</button>
  `;
}

// 右键菜单
const rightMenu = (function getRightMenu() {
  let tooltip = null;
  const subMenuHtml = {};
  const subTooltips = {};
  const info = [
    {
      title: '设置为蒙版',
      iconClass: 'vicon-overlay',
      type: 'setMask'
    },
    {
      title: "复制样式",
      iconClass: "vicon-format-painter",
      type: "copyStyle",
      shortcut: "Ctrl Shift C"
    },
    {
      title: "克隆",
      iconClass: "vicon-duplicate",
      type: "objClone",
      shortcut: "Ctrl D"
    },
    {
      title: "删除",
      iconClass: "vicon-delete text-red-500",
      type: "objRemove",
      shortcut: "Delete"
    },
    {
      type: 'hr',
    },
    {
      title: "翻转",
      iconClass: "vicon-flip rotate-90",
      type: "menuFlipRotate",
      more: [
        {
          title: "水平翻转",
          iconClass: "vicon-flip",
          type: "objFlipX"
        },
        {
          title: "垂直翻转",
          iconClass: "vicon-flip rotate-90",
          type: "objFlipY"
        },
        {
          type: 'hr',
        },
        {
          title: "左转90°",
          iconClass: "vicon-rotate scale-x-[-1]",
          type: "objRotateLeft"
        },
        {
          title: "右转90°",
          iconClass: "vicon-rotate rotate",
          type: "objRotateRight"
        },
      ]
    },
    {
      title: "图层",
      iconClass: "vicon-stacks",
      type: "menuLayer",
      more: [
        {
          title: "上移一层",
          iconClass: "vicon-move-up rotate-180",
          type: "objBringForward"
        },
        {
          title: "下移一层",
          iconClass: "vicon-move-up",
          type: "objSendBackwards"
        },
        {
          type: 'hr',
        },
        {
          title: "移至顶层",
          iconClass: "vicon-move-top",
          type: "objBringTop"
        },
        {
          title: "移至底层",
          iconClass: "vicon-move-top rotate-180",
          type: "objSendBottom"
        },
        {
          type: 'hr',
        },
        {
          title: "显示图层",
          iconClass: "vicon-stacks",
          type: "showLayer"
        },
      ]
    },

    // switch (type) {
    //   case "center":
    //       activeObject.set({
    //           left: (exportCanvasConfig.width - activeObject.getScaledWidth()) / 2,
    //           top: (exportCanvasConfig.height - activeObject.getScaledHeight()) / 2
    //       }).setCoords();
    //       break;
    //   case "centerH":
    //       activeObject.set({ left: (exportCanvasConfig.width - activeObject.getScaledWidth()) / 2 }).setCoords();
    //       break;
    //   case "centerV":
    //       activeObject.set({ top: (exportCanvasConfig.height - activeObject.getScaledHeight()) / 2 }).setCoords();
    //       break;
    //   case "left":
    //       activeObject.set({ left: 0 });
    //       break;
    //   case "right":
    //       activeObject.set({ left: exportCanvasConfig.width - activeObject.getScaledWidth() });
    //       break;
    //   case "top":
    //       activeObject.set({ top: 0 });
    //       break;
    //   case "bottom":
    //       activeObject.set({ top: exportCanvasConfig.height - activeObject.getScaledHeight() });
    //       break;
    {
      title: "对齐",
      iconClass: "vicon-layout-left",
      type: "menuAlign",
      more: [
        {
          title: "水平居中",
          iconClass: "vicon-layout-centerH",
          type: "page-centerH"
        },
        {
          title: "垂直居中",
          iconClass: "vicon-layout-centerH rotate-90",
          type: "page-centerV"
        },
        {
          type: 'hr',
        },
        {
          title: "左对齐",
          iconClass: "vicon-layout-left",
          type: "page-left"
        },
        {
          title: "右对齐",
          iconClass: "vicon-layout-left rotate-180",
          type: "page-right"
        },
        {
          type: 'hr',
        },
        {
          title: "顶部对齐",
          iconClass: "vicon-layout-bottom rotate-180",
          type: "page-top"
        },
        {
          title: "底部对齐",
          iconClass: "vicon-layout-bottom",
          type: "page-bottom"
        },
        {
          type: 'hr',
        },
        {
          title: "中心对齐",
          iconClass: "vicon-layout-center",
          type: "page-center"
        },
      ]
    },
    {
      type: 'hr',
    },
    {
      title: "保存为图片",
      iconClass: "vicon-save",
      type: "objSave"
    },
    {
      title: "保存为 JSON",
      iconClass: "vicon-json",
      type: "objSaveJson"
    },
    {
      type: 'hr',
    },
    {
      title: "解组",
      iconClass: "vicon-object-ungroup",
      type: "ungroupObjects"
    },
  ];

  function getRowHtml(item) {
    if (item.type === 'hr') {
      return '<hr class="my-1 border-slate-300" />';
    }
    let shortcut = '';
    // 兼容各系统
    if (item.shortcut) {
      if (navigator.platform.toLowerCase().indexOf('mac') > -1) {
        shortcut = item.shortcut.replace(/Ctrl/g, '⌘');
      } else {
        shortcut = item.shortcut.replace(/⌘/g, 'Ctrl');
      }
    }
    // 有快捷键显示快捷键，有 more 显示箭头
    return `<div class="flex items-center p-2 rounded hover:bg-slate-100 cursor-pointer" data-id="${item.type}">
      <i class="${item.iconClass} text-xl"></i>
      <span class="mx-2">${item.title}</span>
      ${shortcut ? `<span class="ml-auto text-slate-500 bg-slate-200 rounded px-2 py-1 text-xs">${shortcut}</span>` : ''}
      ${item.more ? `<i class="vicon-small-arrow ml-auto -rotate-90"></i>` : ''}
    </div>`;
  }

  function initMenu() {
    const menu = document.createElement('div');
    const html = info.map(item => {
      
      if (item.more) {
        const moreHtml = item.more.map(getRowHtml).join('');
        subMenuHtml[item.type] = moreHtml;
        return getRowHtml(item);

      }
      return getRowHtml(item); 
    }).join('');

    menu.innerHTML = html;
    // 初始化 tippy.js（默认隐藏）
    tooltip = tippy(document.body, {
        content: menu,
        trigger: 'manual',
        interactive: true,
        placement: 'right-start',
        theme: "light", // 主题，可选：'light'、'dark' 或自定义
        arrow: false,
    });

    // 监听菜单项点击事件
  delegator.on(menu, 'click', '[data-id]', function (event, target) {
    const type = target.dataset.id;
    const object = canvas.getActiveObject();
    if (type.startsWith('menu')) {
      let subTooltip = getSubMenu(type);
      const rect = target.getBoundingClientRect();
      subTooltip.setProps({
        offset: [-36, 8],
        getReferenceClientRect: () => ({
          width: 0, height: 0,
          top: rect.top + rect.height,
          left: rect.left + rect.width,
          right: rect.left + rect.width,
          bottom: rect.top + rect.height
        })
      });
      subTooltip.show();
      subTooltip.popperInstance.update();
    } else {
      handleType(type, object);
      hide();
    }
});
  }

  function getSubMenu(type) {
    if (!subTooltips[type]) {
      const subMenu = document.createElement('div');
      subMenu.innerHTML = subMenuHtml[type];
      // 初始化 tippy.js（默认隐藏）
      subTooltips[type] = tippy(document.body, {
          content: subMenu,
          trigger: 'manual',
          interactive: true,
          placement: 'right-start',
          theme: "light",
          arrow: false,
      });
    }
    // 监听子菜单项点击事件
    delegator.on(subTooltips[type].popper, 'click', '[data-id]', function (event, target) {
      const object = canvas.getActiveObject();
      const subType = target.dataset.id;
      handleType(subType, object);
      hide();
    });

    return subTooltips[type];
  }

  function show(e){
    e.preventDefault();
    if(!tooltip){
      initMenu();
    }
    tooltip.setProps({
      getReferenceClientRect: () => ({
        width: 0, height: 0,
        top: e.clientY,
        left: e.clientX,
        right: e.clientX,
        bottom: e.clientY
      })
    });
    tooltip.show();
    emitter.emit("right-context-menu:show", tooltip);
  }
  function hide(e){
    if(!tooltip){
      return;
    }
    tooltip.hide();
    emitter.emit("right-context-menu:hide", tooltip);
  }
  function isVisible() {
    if(!tooltip) {
      return false;
    }
    return tooltip && tooltip.state.isVisible;
  }

  console.log('绑定右键点击事件');
  canvas.on('mouse:down', function (event) {
    console.log('触发mouse:down事件', event);
      if (event.e.button === 2) { // 右键
          const target = canvas.findTarget(event.e);
          if (target) {
            // 同时选中对象
              canvas.setActiveObject(target);
              // 显示菜单
             show(event.e);
             event.e.preventDefault();
          } else {
              // 隐藏菜单
              hide();
          }
      }
  });


 

  return {
    show,
    hide,
    isVisible
  };
})();

const topMenu = (function getTopMenu() {
  // 所有需要根据条件控制显示隐藏的按钮
  const toggleButtons = [ "drawSymbol", "editText", "editShapeImage", "replaceShapeImage", "imgFilters", "editSvg", "path", "editBorder", "editRuler", "drawPolygon", "drawShape", "ungroupObjects", "shadow", "copyStyle", "groupObjects"];
  // 一定显示的按钮
  const alwaysShowButtons = ["opacity", "position", "more"];
  const buttonsInfo = {
    drawSymbol: {
      title: '修改颜色',
      iconClass: "vicon-edit",
    },
    editText: {
      title: '文字效果',
      iconClass: '',
    },
    editShapeImage: {
      title: lib.word(1107),
      iconClass: "vicon-image-edit font-slate-800",
    },
    replaceShapeImage: {
      title: '替换图片',
      iconClass: "vicon-image-replace font-slate-800",
    },
    imgFilters: {
      title: lib.word(1132),
      iconClass: "vicon-settings-panel",
    },
    editSvg: {
      title: '修改颜色',
      iconClass: "vicon-palette",
    },
    path: {
      title: '修改颜色',
      iconClass: "vicon-palette",
    },
    editBorder: {
      title: '修改边框',
      iconClass: "vicon-edit",
    },
    editRuler: {
      title: '修改颜色',
      iconClass: "vicon-edit",
    },
    drawPolygon: {
      title: '修改',
      iconClass: "vicon-edit",
    },
    drawShape: {
      title: '修改',
      iconClass: "vicon-edit",
    },
    ungroupObjects: {
      title: '解组',
      iconClass: "vicon-object-ungroup",
    },
    shadow: {
      title: "阴影",
      iconClass: "vicon-shadow",
    },
    copyStyle: {
      title: '复制样式',
      iconClass: "vicon-format-painter",
    },
    groupObjects: {
      title: '组合',
      iconClass: "vicon-object-group",
    },
    opacity: {
      title: lib.word(1287),
      iconClass: "vicon-opacity",
    },
    position: {
      title: "位置",
      iconClass: '',
    },
    more: {
      title: '更多',
      iconClass: "vicon-more",
    },
  };
  // 遍历按钮信息，加上 hidden 属性, 如果是 toggleButtons 则设置为 true，其它的设置为 false
  for (const key in buttonsInfo) {
    if (buttonsInfo.hasOwnProperty(key)) {
      buttonsInfo[key].hidden = toggleButtons.includes(key);
    }
  }


  const menu = document.createElement("div");
  // 宽度变化有动画
  menu.style = "width: max-content; position: absolute; top: 8px; left: 50%; padding:0 8px; transform: translateX(-50%); max-width: 100%; display: none;";
  const refs = render({}, () => [`
    <div class="min-w-fit flex flex-wrap items-center p-1 shadow-a rounded-lg bg-white transition-all">
      <div data-id="placeholder"></div>`,
        toggleButtons.map((item) => {
          const { title, iconClass, hidden } = buttonsInfo[item];
          return createButton({type: item, title, iconClass, hidden});
        }
      ).join(''),
      alwaysShowButtons.map((item) => {
        const { title, iconClass } = buttonsInfo[item];
        return createButton({type: item, title, iconClass});
      }).join(''),
      `
    </div>`]
    , menu);

  fabricContainer.parentNode.parentNode.appendChild(menu);

  delegator.on(menu, "click", "[data-id]", (e, target) => {
    const type = target.dataset.id;
    const object = canvas.getActiveObject();
    handleType(type, object, target, e);
  });


  const update = throttle((type, object) => {
    if(!object){
      return;
    }
    menu.style.display = "";
   

    // 需要显示的按钮
    const showButtons = [];
    // 需要隐藏的按钮
    const hideButtons = [];
    const buttons = [];

    // currentOperationType可能是以下这些值 border filters font iconFont ornament polygon position ruler shadow text colorpicker brush polygon resize-canvas shape shapeImage symbol upload-image
      // 对象类型与操作类型映射对象
      const objectTypeAndOperationTypeMap = [
        {
          types: ['textasset', 'textcurved', 'textwarped'],
          operationTypes: ['text', 'font'],
          buttons: ['editText'],
          menu: ['text']
        },
        {
          types: ['shapeimage', 'image'],
          operationTypes: ['shapeImage', 'filters'],
          buttons: ['editShapeImage', 'replaceShapeImage', 'imgFilters'],
        },
        {
          types: ['image'],
          operationTypes: ['filters'],
          buttons: ['imgFilters'],
        },
        {
          // 特别注意要加判断
          types: ['group'],
          operationTypes: ['svg'],
          buttons: ['ungroupObjects', 'editSvg'],
        },
        {
          types: ['path'],
          operationTypes: ['svg'],
          buttons: ['editSvg'],
        },
        {
          types: ['borderimage'],
          operationTypes: ['border'],
          buttons: ['editBorder'],
        },
        {
          types: ['rulerimage'],
          operationTypes: ['ruler'],
          buttons: ['editRuler'],
        },
        {
          types: [ 'polygon', 'roughPolygon'],
          operationTypes: ['polygon'],
          buttons: ['drawPolygon'],
        },
        {
          types: ['line', 'linearrow', 'rect', 'roughRect', 'ellipse', 'roughEllipse', 'triangle', 'roughTriangle', 'star', 'roughStar', 'heart', 'roughHeart'],
          operationTypes: ['shape'],
          buttons: ['drawShape'],
        },
      ];

      // 遍历对象类型与操作类型映射对象: 1. 判断要显示哪些按钮， 2. 判断当前的操作面板（currentOperationType）要不要继续显示，即如果当前 type 对应的 operationTypes 里有 currentOperationType，则继续显示(handleType)，并且后面的按钮不需要判断了
      
      // 用于判断不用再判断 currentOperationType 的变量
      let isContinue = true;
      const operationMap = {
        text: 'editText',
        font: 'font',
        shapeImage: 'editShapeImage',
        filters: 'imgFilters',
        svg: 'editSvg',
        border: 'editBorder',
        ruler: 'editRuler',
        polygon: 'drawPolygon',
        shape: 'drawShape',
        position: 'position',
        opacity: 'opacity',
        // shadow: 'shadow',
        // symbol: 'drawSymbol',
        // group: 'groupObjects',
        // ungroup: 'ungroupObjects',
        
      };
      function countinueShow(operationTypes, button){
        if (isContinue && operationTypes.includes(currentOperationType)) {
          // 继续显示
          handleType(operationMap[currentOperationType], object, refs[button], null);
          isContinue = false;
        }
      }

      // 不管多选单选都有 position 和 opacity
      countinueShow(['position'], 'position');
      countinueShow(['opacity'], 'opacity');

      // if(currentOperationType === "position"){
      //   handleType("position", object);
      // }else if(currentOperationType === "opacity"){
      //   handleType("opacity", object);
      // }
  
    // 单选对象
    if(canvas.getActiveObjects().length === 1){
  
      let isActivePath = false;
    
      const objectData = object.toJSON();
  
      if (!("objects" in objectData) && "path" in objectData && objectData.path) {
        isActivePath = true;
      }
  
      if ("objects" in objectData) {
        isActivePath = true;
      }

      // 每个单选对象都可以设置 shadow
      showButtons.push('shadow');
      countinueShow(['shadow'], 'shadow');

      if ("customType" in object) {
        if(object.customType === "symbol"){
          showButtons.push("drawSymbol");
          countinueShow(['symbol'], 'drawSymbol');
        }
      }else{

        for (const item of objectTypeAndOperationTypeMap) {
          if (item.types.includes(type)) {
  
            if(type === 'group'){
              if(object._objects.length > 1){
                showButtons.push('ungroupObjects');
              }
              if (isActivePath) {
                showButtons.push('editSvg');
                countinueShow(item.operationTypes, 'editSvg');
              }
            }else{
              // 显示按钮， 加入到 showButtons
              showButtons.push(...item.buttons);
              // 判断当前操作类型是否在 operationTypes 中
              countinueShow(item.operationTypes, item.buttons[0]);
            }
          }
        }
  
        // 如果是文本对象，显示文本操作面板
        if(['textasset', 'textcurved', 'textwarped'].includes(type)){
          emitter.emit("menu-operation:text:show", {
            type,
            object,
            menu: {
              placeholder: refs.placeholder,
              showPlaceholder
            }
          });
        }else{
          showPlaceholder(null);
        }

        
      
          // if (['textasset', 'textcurved', 'textwarped'].includes(type)) {
          //   buttons.push(createButton("editText", '特效'));
          //   if(currentOperationType === "text"){
          //     handleType("editText", object);
          //   }
          //   if(currentOperationType === "font"){
          //     handleType("font", object);
          //   }

          //   emitter.emit("menu-operation:text:show", {
          //     type,
          //     object, 
          //     menu: {
          //       placeholder: refs.placeholder,
          //       showPlaceholder
          //     }
          //   });

          // } else {
          //   if (type === "shapeimage") {
          //     buttons.push(createButton("editShapeImage", lib.word(1107), "vicon-image-edit font-slate-800"));
          //     buttons.push(createButton("imgFilters", lib.word(1132), "vicon-settings-panel"));
          //     if(currentOperationType === "shapeImage"){
          //       handleType("editShapeImage", object);
          //     }else if(currentOperationType === "filters"){
          //       handleType("imgFilters", object);
          //     }
          //   } else if (type === "image") {
          //     buttons.push(createButton("imgFilters", lib.word(1132), "vicon-settings-panel"));
          //     if(currentOperationType === "filters"){
          //       handleType("imgFilters", object);
          //     }
          //   } else if (type === "group") {
          //     if(object._objects.length > 1){
          //       buttons.push(createButton("ungroupObjects", '解组', "vicon-object-ungroup"));
          //     }
          //     if (isActivePath) {
          //       buttons.push(createButton("editSvg", '修改颜色', "vicon-palette"));
          //       if(currentOperationType === "ornament"){
          //         handleType("editSvg", object);
          //       }
          //     }
          //   } else if (type === "path") {
          //     buttons.push(createButton("path", '修改颜色', "vicon-palette"));
          //     if(currentOperationType === "ornament"){
          //       handleType("path", object);
          //     }
          //   } else if (type === "borderimage") {
          //     buttons.push(createButton("editBorder", '修改边框', "vicon-edit"));
          //     if(currentOperationType === "border"){
          //       handleType("editBorder", object);
          //     }
          //   } else if (type === "rulerimage") {
          //     buttons.push(createButton("editRuler", '修改颜色', "vicon-edit"));
          //     if(currentOperationType === "ruler"){
          //       handleType("editRuler", object);
          //     }
          //   }else if(['polygon','roughPolygon'].includes(type)){
          //     buttons.push(createButton("drawPolygon", '修改', "vicon-edit"));
          //     if(currentOperationType === "polygon"){
          //       handleType("drawPolygon", object);
          //     }
          //   }else if(['line','linearrow','rect','roughRect','ellipse','roughEllipse','triangle','roughTriangle','star','roughStar','heart','roughHeart'].includes(type)){
          //     buttons.push(createButton("drawShape", '修改', "vicon-edit"));
          //     if(currentOperationType === "shape"){
          //       handleType("drawShape", object);
          //     }
          //   }
            // showPlaceholder(null);
          // }
      }
    }else { // 多选对象
      showButtons.push("groupObjects");
      // buttons.push(createButton("groupObjects", '组合', "vicon-object-group"));
    }

    // 遍历toggleButtons，在 showButtons 里的显示，否则隐藏
    // 遍历 toggleButtons，根据 showButtons 决定是否隐藏
    toggleButtons.forEach(button => {
      const node = refs[button];
      if(node){
        if (showButtons.includes(button)) {
          node.classList.remove('hidden');
        }else{
          node.classList.add('hidden');
        }
      }
    });

    if(isContinue){
      // sidebar:operation:close
      emitter.emit("sidebar:operation:close");
    }

  
    
  }, 200);
  function showPlaceholder(node){
    // 找到 [data-id=wrapper] 所有node，只显示 node
    const wrappers = refs.placeholder.querySelectorAll("[data-id=wrapper]");
    wrappers.forEach(wrapper => {
      if(wrapper !== node){
        wrapper.style.display = "none";
      }
    });
    // 如果 node 不是 placeholder 的子元素，则添加
    if(node){
      if(!refs.placeholder.contains(node)){
        refs.placeholder.appendChild(node);
      }
      node.style.display = "";
    }
  }
  function show(){
    menu.style.display = "";
  }
  function hide(){
    menu.style.display = "none";
  }
  return {
    update,
    show,
    hide
  };

})();

// 对象菜单
const objectMenu = (function getObjectMenu() {
  let menu = document.createElement("div");
  menu.className = "absolute top-0 left-0 z-0";
  let menuContent = document.createElement("div");
  menuContent.className = "flex rounded-lg bg-white transition-all p-1 shadow-a";
  menu.appendChild(menuContent);
  menu.style.display = "none";
  fabricContainer.appendChild(menu);

  // 添加 Shift 键状态变量
  let isShiftPressed = false;

  // 正在旋转中，移动中，缩放中，隐藏
  let isMoving = false;

  // 监听 Shift 键
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') {
      isShiftPressed = true;
      hide();
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') {
      isShiftPressed = false;
      const object = canvas.getActiveObject();
      if (object) {
        update(object.type, object);
        position(object);
      }
    }
  });

  function setMoving(){
    if(!isMoving){
      hide();
    }
    isMoving = true;
  }

  canvas.on("object:moving", () => {
    setMoving();
  });
  
  canvas.on("object:scaling", () => {
    setMoving();
  });
  
  canvas.on("object:rotating", () => {
    setMoving();
  });
  canvas.on('mouse:up', function (event) {
    if(!isShiftPressed){
      isMoving = false;
      const object = canvas.getActiveObject();
      if (object) {
        update(object.type, object);
        position(object);
      }
    }
    
});

  const update = throttle((type, object) => {
    if(!object || isShiftPressed || isMoving){
      return;
    }
    menu.style.display = "";
  
    const buttons = [];

  
    // Add default action buttons
    buttons.push(
      createButton({ type: "objRemove", title: lib.word(1091), iconClass: "vicon-delete text-red-500" }),
      createButton({ type: "objClone", title: lib.word(1092), iconClass: "vicon-duplicate" }),
      createButton({ type: "objLock", title: lib.word(1047), iconClass: "vicon-lock" }),
      createButton({ type: "more", title: "更多", iconClass: "vicon-more" })
    );
    
  
    if(currentOperationType === "position"){
      handleType("position", object);
    }else if(currentOperationType === "opacity"){
      handleType("opacity", object);
    }else if(currentOperationType === "shadow"){
      handleType("shadow", object);
    }
  
    menuContent.innerHTML = buttons.join("");
    menuContent.parentNode.style.display = "";
    menuContent._currentObject = object; // 动态替换 object
    menuContent._canvas = canvas; // 传入 canvas

    
  
    if (!menuContent._hasBindClick) {
      menuContent._hasBindClick = true;
    
      // 只绑定一次事件
      menuContent.addEventListener("click", (e) => {
        const target = e.target.closest("[data-id]");
        if (target && menuContent._currentObject) {
          const type = target.dataset.id;
          handleType(type, menuContent._currentObject, target,e);
        }
      });
    }
    
  
    // 更新对象的坐标和样式
    // objectMenu.position(object, canvas, container);
    
  }, 16);
  // 更新菜单位置
  const position = throttle((object, action) => {
    if (!object || isShiftPressed || isMoving) {
      return;
    }
  
    if(rightMenu.isVisible()){
      menu.style.display = "none";
      return;
    }else{
      menu.style.display = "";
    }
  
      if (!object || !canvas || !menu) {
        return;
      }

    
      menu.classList.remove("fixed");
      
      // 更新对象坐标（包含控制点信息）
      object.setCoords();
      
      const canvasElement = canvas.getElement();
      const canvasScaleRatio = canvasElement.clientWidth / canvas.getWidth();
      
      const menuWidth = menu.offsetWidth;
      const menuHeight = menu.offsetHeight;
      
      const coords = object.oCoords;
      // 计算水平中心（使用四个角坐标）
      const xValues = [coords.tl.x, coords.tr.x, coords.bl.x, coords.br.x];
      const centerX = (Math.min(...xValues) + Math.max(...xValues)) / 2;
      
      // 为了确保按钮不遮挡旋转控制点，
      // 将对象的有效高度扩展为包括旋转控制点（mtr）的区域
      // effectiveTop：取对象四角与 mtr 的最小 y 值
      // effectiveBottom：取对象四角与 mtr 的最大 y 值
      const yValues = [coords.tl.y, coords.tr.y, coords.bl.y, coords.br.y, coords.mtr.y];
      const effectiveTop = Math.min(...yValues);
      const effectiveBottom = Math.max(...yValues);
      // 计算垂直中心（这里近似取有效高度的中点）
      const centerY = (effectiveTop + effectiveBottom) / 2;
      
      const margin = 10; // 保留的安全距离（旋转控制点距离对象的距离）
      
      // 根据安全间隙计算两个候选位置：
      // 如果按钮放在上方，其底边距离有效上边缘应至少保留 margin；
      // 如果放在下方，其顶边距离有效下边缘应至少保留 margin。
      const candidateTopAbove = effectiveTop * canvasScaleRatio - menuHeight - margin;
      const candidateTopBelow = effectiveBottom * canvasScaleRatio + margin;
      
      let top;
      // 判断旋转控制点位于对象的哪一侧
      // 如果 mtr 在有效区域的上半部，则认为旋转控制点在上方，
      // 因此应尽量将按钮放在下方；反之，则放在上方。
      if (coords.mtr.y < centerY) {
        // 旋转控制点在上方，优先考虑下方位置
        if (candidateTopBelow + menuHeight <= canvasElement.clientHeight) {
          top = candidateTopBelow;
        } else if (candidateTopAbove >= 0) {
          top = candidateTopAbove;
        } else {
          // 若两个候选位置都超出边界，则按边界取值
          top = Math.max(0, Math.min(candidateTopBelow, canvasElement.clientHeight - menuHeight));
        }
      } else {
        // 旋转控制点在下方，优先考虑上方位置
        if (candidateTopAbove >= 0) {
          top = candidateTopAbove;
        } else if (candidateTopBelow + menuHeight <= canvasElement.clientHeight) {
          top = candidateTopBelow;
        } else {
          top = Math.max(0, Math.min(candidateTopAbove, canvasElement.clientHeight - menuHeight));
        }
      }
      
      // 水平位置按对象中心对齐，然后限制左右不超出画布
      let left = centerX * canvasScaleRatio - menuWidth / 2;
      if (left < 0) {
        left = 0;
      }
      if (left + menuWidth > canvasElement.clientWidth) {
        left = canvasElement.clientWidth - menuWidth;
      }
      
      menu.style = `left: ${left}px; top: ${top}px; transform-origin: ${menuWidth / 2}px 0;`;
    
  }, 16);

  function show(){
    if(!isShiftPressed){
      menu.style.display = "";
    }
  }
  function hide(){
    menu.style.display = "none";
  }

  return {
    update,
    position,
    show,
    hide
  };
})();




emitter.on("canvas:resize", () => {
  objectMenu.position(canvas.getActiveObject());
});

// emitter.emit('operation:init', operationType);
let currentOperationType = null;
emitter.on('operation-type-change', (operationType) => {
  currentOperationType = operationType;
});



emitter.on("canvas:zoom", () => {
  const activeObject = canvas.getActiveObject();
  if (activeObject) {
    objectMenu.position(activeObject);
  }
});

// 在其它地方修改了坐标、尺寸、旋转角度等属性后，需要更新对象的信息
emitter.on("canvas:position:edited", (targetObject) => {
  objectMenu.position(targetObject);
});


canvas.on("object:drawn", ({ target: object }) => {
  objectMenu.update(object.type, object);
  topMenu.update(object.type, object);
  objectMenu.position(object);
});

canvas.on("selection:created", (event) => {
  const { canvas } = event.selected[0];
  if (!canvas.isDrawingShapes) {
    const object = canvas.getActiveObject();
    objectMenu.update(object.type, object);
    topMenu.update(object.type, object);
    objectMenu.position(object);
  }
});

canvas.on("selection:cleared", () => {
  topMenu.hide();
  objectMenu.hide();
  rightMenu.hide();
});

canvas.on("selection:updated", () => {
  if(!canvas){
    return;
  }
  const object = canvas.getActiveObject();
  objectMenu.update(object.type, object);
  topMenu.update(object.type, object);
  objectMenu.position(object);
});
emitter.on("context-menu:toggle", () => {
  
  const object = canvas.getActiveObject();
  if(!object){
    return;
  }
  objectMenu.update(object.type, object);
  topMenu.update(object.type, object);
  objectMenu.position(object);
});


canvas.on("object:modified", ({ target }) => {
  const object = canvas.getActiveObject();
  if(target && (target === object)){
    objectMenu.update(object.type, object);
    topMenu.update(object.type, object);
    objectMenu.position(object);
  }
});

canvas.on("object:removed", ({target}) => {
  const object = canvas.getActiveObject();
  if(target === object){
    menu.style.display = "none";
  }
  
});

// canvas 大小变化时，更新对象的信息
canvas.on("after:render", () => {
  if (!canvas) {
    return;
  }
  const object = canvas.getActiveObject();
  if (object) {
    objectMenu.position(object);
  }
});

// group/ungroup
canvas.on("selection:group", () => {
  const object = canvas.getActiveObject();
  objectMenu.update(object.type, object);
  topMenu.update(object.type, object);
  objectMenu.position(object);
});

canvas.on("selection:ungroup", () => {
  const object = canvas.getActiveObject();
  objectMenu.update(object.type, object);
  topMenu.update(object.type, object);
  objectMenu.position(object);
});



function groupObjects() {
  const activeObject = canvas.getActiveObject();
  if (activeObject && activeObject.type === "activeSelection") {
    activeObject.toGroup();
    canvas.fire("selection:group");
    canvas.requestRenderAll();
  }
}

function ungroupObjects() {
  const activeObject = canvas.getActiveObject();
  if (activeObject && activeObject.type === "group") {
    activeObject.toActiveSelection();
    canvas.fire("selection:ungroup");
    canvas.requestRenderAll();
  }
}

emitter.on('context-menu:rightMenu:show',function(e){
  rightMenu.show(e);
});




 // 绑定快捷键
 function bindKeyboardShortcuts() {
  
  // function w(object) {
  //   object.setCoords();
  //   // 更新菜单
  // }
  // function objectMenu.position(object) {
  //   object.setCoords();
  //   // 更新菜单
  // }
  Mousetrap.bind("esc", () => {
      canvas.discardActiveObject().requestRenderAll();
  })
    .bind("f", () => {
      const object = canvas.getActiveObject();
      object && (canvas.bringForward(object), debouncedCommitChange());
    })
    .bind("shift+f", () => {
      const object = canvas.getActiveObject();
      object && (canvas.bringToFront(object), debouncedCommitChange());
    })
    .bind("b", () => {
      const object = canvas.getActiveObject();
      object && (canvas.sendBackwards(object), debouncedCommitChange());
    })
    .bind("shift+b", () => {
      const object = canvas.getActiveObject();
      object && (canvas.sendToBack(object), debouncedCommitChange());
    })
    .bind("mod+a", (a) => {
      canvas.discardActiveObject()
        .setActiveObject(
          new fabric.ActiveSelection(canvas.getObjects(), { canvas: canvas })
        )
        .requestRenderAll();
      return false;
    })
    .bind("mod+c", () => {
      canvas.cloneObject();
    })
    .bind(["del", "backspace"], (e) => {
      const object = canvas.getActiveObject();
      object && canvas.removeObject(object);
      e.preventDefault();
    })
    .bind("left", () => {
      const object = canvas.modifyObject("left", -1);
      object && object.setCoords();
      return false;
    })
    .bind("right", () => {
      const object = canvas.modifyObject("left", 1);
      object && object.setCoords();
      return false;
    })
    .bind("up", () => {
      const object = canvas.modifyObject("top", -1);
      object && object.setCoords();
      return false;
    })
    .bind("down", () => {
      const object = canvas.modifyObject("top", 1);
      object && object.setCoords();
      return false;
    })
    .bind("mod+right", () => {
      const object = canvas.modifyObject("angleBy", 1);
      object && object.setCoords();
      return false;
    })
    .bind("mod+left", () => {
      const object = canvas.modifyObject("angleBy", -1);
      object && object.setCoords();
      return false;
    })
    .bind("mod+g", () => {
      groupObjects();
      return false;
    })
    .bind("mod+shift+g", () => {
      ungroupObjects();
      return false;
    })
    .bind("mod+y", () => {
      canvas.redo();
      return false;
    })
    .bind("mod+z", () => {
      canvas.undo();
      return false;
    })
    .bind("mod+s", () => {
      emitter.emit('component:file:saveJson');
      return false;
    })
    .bind("mod+p", () => {
      emitter.emit("component:file:print");
      return false;
    })
    .bind("h", () => {
      const object = canvas.getActiveObject();
      object && (object.centerH().setCoords(), debouncedCommitChange(), object.setCoords());
    })
    .bind("v", () => {
      const object = canvas.getActiveObject();
      object && (object.centerV().setCoords(), debouncedCommitChange(), object.setCoords());
    })
    .bind("s", () => {
      const object = canvas.getActiveObject();
      object && object.exportPNG();
    })
    .bind("-", () => {
      canvas.modifyObject("zoomBy-z", -4);
      return false;
    })
    .bind("+", () => {
      canvas.modifyObject("zoomBy-z", 4);
      return false;
    })
    .bind("alt+right", () => {
      canvas.modifyObject("zoomBy-x", -5);
      return false;
    })
    .bind("alt+left", () => {
      canvas.modifyObject("zoomBy-x", 5);
      return false;
    })
    .bind("alt+down", () => {
      canvas.modifyObject("zoomBy-y", -5);
      return false;
    })
    .bind("alt+up", () => {
      canvas.modifyObject("zoomBy-y", 5);
      return false;
    });
    
}

bindKeyboardShortcuts();




