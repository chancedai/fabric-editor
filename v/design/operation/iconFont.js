import { delegator, emitter, showInfo, throttle,render } from "../../__common__/utils";
import fabric from "../fabric";
import { canvas, exportCanvasConfig } from "../canvas";
import lib from "../lib";
import { panel } from "../component/sidebar";
import elements from "../elements";


// 假定全局变量 SHAPES 与 ZMprops 已存在
// 同时 panel.content 为你提供的容器 DOM 元素
// 例如：const panel.content = document.getElementById("yourContainer");

let currentColor = "rgba(0,0,0,1)";
let currentSize = 1000;


// 根据图标标识和填充颜色生成图标的 canvas 元素
// const createFontIconCanvas = (shapeStr, fillColor = "#000", size) => {
//   let [type, code] = shapeStr.split(":");
//   const iconCanvas = document.createElement("canvas");
//   const ctx = iconCanvas.getContext("2d");
//   iconCanvas.width = size;
//   iconCanvas.height = size;
//   ctx.textBaseline = "top";
//   ctx.fillStyle = fillColor;
//   switch (type) {
//     case "fa": {
//       let [prefix, iconCode] = code.split(",");
//       const iconDef = {
//         fas: { font: "Font Awesome 6 Free", weight: 900 },
//         fab: { font: "Font Awesome 6 Brands", weight: 400 },
//         far: { font: "Font Awesome 6 Free", weight: 400 },
//       }[prefix];
//       const char = String.fromCharCode(parseInt(iconCode, 16));
//       ctx.font = `${iconDef.weight} ${size}px '${iconDef.font}'`;
//       ctx.fillText(char, 0, 0);
//       break;
//     }
//     case "ma": {
//       const char = String.fromCharCode(parseInt(code, 16));
//       ctx.font = `400 ${size}px 'Material Icons'`;
//       ctx.fillText(char, 0, 0);
//       break;
//     }
//     case "ico": {
//       const char = String.fromCharCode(parseInt(code, 16));
//       ctx.font = `400 ${size}px 'IcoFont'`;
//       ctx.fillText(char, 0, 0);
//       break;
//     }
//   }
//   fabric.util.trimCanvas(iconCanvas);
//   return iconCanvas;
// };

const createFontIconCanvas = (shapeStr, fillColor = "#000", size) => {
  let [type, code] = shapeStr.split(":");
  const iconCanvas = document.createElement("canvas");
  const ctx = iconCanvas.getContext("2d");

  let fontWeight = "400";
  let fontFamily = "";
  switch (type) {
    case "fa": {
      let [prefix, iconCode] = code.split(",");
      const iconDef = {
        fas: { font: "Font Awesome 6 Free", weight: 900 },
        fab: { font: "Font Awesome 6 Brands", weight: 400 },
        far: { font: "Font Awesome 6 Free", weight: 400 },
      }[prefix];
      fontWeight = iconDef.weight;
      fontFamily = iconDef.font;
      code = iconCode;
      break;
    }
    case "ma": {
      fontFamily = "Material Icons";
      break;
    }
    case "ico": {
      fontFamily = "IcoFont";
      break;
    }
  }

  const char = String.fromCharCode(parseInt(code, 16));
  ctx.font = `${fontWeight} ${size}px '${fontFamily}'`;
  const metrics = ctx.measureText(char);
  const textWidth = metrics.width;

  // canvas 宽度动态适配文字
  iconCanvas.width = Math.ceil(textWidth);
  iconCanvas.height = Math.ceil(size);

  ctx.font = `${fontWeight} ${size}px '${fontFamily}'`;
  ctx.fillStyle = fillColor;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  // 绘制文字在中心
  ctx.fillText(char, textWidth / 2, size / 2);

  return iconCanvas;
};





// 在给定的容器 panel.content 内生成图标选择界面
const init = async (shapeStr) => {

  const refs = render('',(d,e,f,_if)=>{
    return [
        `<div data-id="wrapper"  class="text-sm">`,
          render.section("", [
            `<div class="flex items-center space-x-4">
              ${render.row("颜色", "colorPicker")}
              ${render.row("大小", "iconSize")}
            </div>`,
          ]),
          render.section('', [
            `<div data-id="preview" class="bg-checkerboard border-2 border-slate-200 rounded-lg overflow-hidden flex justify-center h-48 items-center"></div>`,
          ]),
          render.buttons([
            { id: 'cancelBtn', text: lib.word(1032), className: 'btn-secondary' },
            { id: 'applyBtn', text: lib.word(1033), className: 'btn-primary' }
          ]),
        `</div>`

    ];
  
  }, panel.content);

  const input2 = elements.getGui(refs.iconSize, "number", {
    value: currentSize,
    min: 100,
    max: 10000,
    quickValues: [{
      label: "100",
      value: 100,
    },
    {
      label: "200",
      value: 200,
    },
    {
      label: "500",
      value: 500,
    },
    {
      label: "1000",
      value: 1000,
    },
    {
      label: "1500",
      value: 1500,
    },
    {
      label: "2000",
      value: 2000,
    },
    {
      label: "5000",
      value: 5000,
    },
  ],
    onchange: (value) => {
      currentSize = parseInt(value);
      updatePreview(currentSize,currentColor);
    },
  }).input;

  // 通过 elements.getGui 创建颜色选择器控件
  elements.getGui(refs.colorPicker, "colorButton", {
    color: currentColor,
    onchange: (info) => {
      let newColor = info.fabricColor;
      currentColor = newColor;
      updatePreview(currentSize, currentColor);
    },
  });
  

  // 预览区域
  const previewContainer = refs.preview;

  // 底部操作区
  refs.applyBtn.addEventListener("click", () => {
 
    // 按照原逻辑：根据 canvas 尺寸计算缩放比例，创建 fabric.Image 对象并添加到画布上
    const scale = 0.75 * Math.min(exportCanvasConfig.width / 1500, exportCanvasConfig.height / 1500);
    const previewCanvas = previewContainer.querySelector("canvas");
    if (!previewCanvas) return;
    const img = new fabric.Shapeimage(previewCanvas, {
      scaleX: scale,
      scaleY: scale,
    });
    canvas.add(img).setActiveObject(img);
    img.set({
      left: (exportCanvasConfig.width - img.width * scale) / 2,
      top: (exportCanvasConfig.height - img.height * scale) / 2,
    }).setCoords();
    canvas.calcOffset();
    canvas.requestRenderAll();
  });

  refs.cancelBtn.addEventListener("click", () => {
    // 关闭操作面板
    panel.hide();
  } );

  // 更新预览函数
  const updatePreview = (size = 1000, color = "#000", ) => {
    previewContainer.innerHTML = "";
    const iconCanvas = createFontIconCanvas(shapeStr, color, size);
    iconCanvas.className = "max-w-full max-h-full object-contain p-2";
    previewContainer.appendChild(iconCanvas);
  };
  updatePreview(currentSize,currentColor);

  panel.show("iconFont", refs.wrapper, '添加图标');
};



emitter.on("operation:iconFont:init", async (shape) => {
  panel.show("iconFont");
  init(shape);
});
emitter.on("operation:iconFont:edit", async (object) => {
  panel.show("iconFont");
  edit(object, true);
});

