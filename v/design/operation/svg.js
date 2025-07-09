import { emitter, render, scaleSvgToTarget } from "../../__common__/utils";
import fabric from "../fabric";
import { canvas, debouncedCommitChange, exportCanvasConfig } from "../canvas";
import lib from "../lib";
import { panel } from "../component/sidebar";
import elements from "../elements";
import Colorpicker from '../colorpicker';

let svgProperties = [];
// svg填充颜色，默认 "rgba(0,0,0,1)"
let fillColor = "rgba(0,0,0,1)";
// 当前编辑的svg对象（fabric 对象）
let currentSvg = null;

// 替换 SVG 元素中黑色填充或描边颜色的函数
// 参数：
//   svgContainer: HTML 元素，包含需要修改的 SVG 元素
//   newColor: 要替换的颜色字符串（如："#ff0000"）
// 返回：
//   被修改的属性数组
const replaceBlackColors = (svgContainer, newColor) => {
  let modifiedAttributes = [];

  // 查找 SVG 元素中的路径、多边形、矩形、圆、椭圆和线条元素
  const elements = svgContainer.querySelectorAll(
    "path, polygon, rect, circle, ellipse, line"
  );

  elements.forEach((element) => {
    // 遍历元素的所有属性
    Array.from(element.attributes).forEach((attribute) => {
      const attributeValue = attribute.value.toLowerCase();

      // 检查属性名是否为 fill 或 stroke，且颜色值为黑色（#000 或 #000000）
      if (
        (attribute.name === "fill" || attribute.name === "stroke") &&
        (attributeValue === "#000" || attributeValue === "#000000")
      ) {
        // 将属性加入修改记录数组
        modifiedAttributes.push(attribute);
        // 替换属性值为指定的新颜色
        attribute.value = newColor;
      }
    });
  });

  // 返回所有被修改的属性数组
  return modifiedAttributes;
};

const init = async (url) => {

  const refs = render('',()=>{
    return [
        `<div data-id="wrapper"  class="text-sm">`,
            render.section('color', [
              render.titleRow('颜色','colorPicker')
            ]),
            render.section('', [
              // 加载中。。。
              `<div data-id="preview" class="p-2 overflow-hidden flex justify-center items-center max-w-88 max-h-88">
                <div data-id="loading" class="text-sm text-slate-800 py-10">加载中...</div>
              </div>`,
            ]),
            render.buttons([
              { id: 'cancelBtn', text: '取消', className: 'btn-secondary hidden' },
              { id: 'applyBtn', text: '应用', className: 'btn-primary hidden' }
            ]),
          
        `</div>`
    ];
  
  }, panel.content);
  // 标题



  elements.getGui(refs.colorPicker, "colorButton", {
    color: fillColor,
    
    onchange: (info) => {
      let newColor = info.fabricColor;
      fillColor = newColor;
      if (svgProperties) {
        for (let i = 0; i < svgProperties.length; i++) {
          svgProperties[i].value = newColor;
        }
      }
    },
  });

  // 添加预览区
  const previewPanel = refs.preview;
  // previewPanel.style.minHeight = "100px";
  

  // 添加底部操作按钮
  refs.applyBtn.addEventListener("click", () => {
    const previewHTML = previewPanel.innerHTML;
  
    fabric.loadSVGFromString(previewHTML, (objects, options) => {
      let svgGroup = fabric.util.groupSVGElements(objects, options);
  
      const canvasWidth = exportCanvasConfig.width;
      const canvasHeight = exportCanvasConfig.height;
  
      // 🟢 直接让 SVG 占满画布（最大可见尺寸）
      const svgWidth = svgGroup.width;
      const svgHeight = svgGroup.height;
  
      // 计算放大倍数
      const maxScaleX = canvasWidth / svgWidth;
      const maxScaleY = canvasHeight / svgHeight;
      const maxScale = Math.min(maxScaleX, maxScaleY);
  
      // 这里不要再额外除以 2（除非你想要额外留白）
      const finalScale = maxScale/2;
  
      svgGroup.set({
        scaleX: finalScale,
        scaleY: finalScale
      }).setCoords();
  
      // 计算放大后的边界
      const bound = svgGroup.getBoundingRect(true, true);
  
      // 居中
      svgGroup.set({
        left: (canvasWidth - bound.width) / 2 - bound.left,
        top: (canvasHeight - bound.height) / 2 - bound.top
      }).setCoords();
  
      // 放到画布
      canvas.add(svgGroup);
      canvas.setActiveObject(svgGroup)
        .calcOffset()
        .requestRenderAll();
    });
  });
  
  
  

  refs.cancelBtn.addEventListener("click", () => {
    panel.hide();
  });

  // png 替换为 svg
  if (url.endsWith(".png")) {
    url = url.replace(".png", ".svg");
  }


  // 👇 fetch 并放入预览面板
fetch(url)
.then((response) => response.text())
.then((svgText) => {
  const designWidth = exportCanvasConfig.width;
  const designHeight = exportCanvasConfig.height;

  // 使用优化后的 scaleSvgToTarget
  const scaledSvgString = scaleSvgToTarget(svgText, designWidth, designHeight);

  // 重新解析缩放后的 SVG
  const parser = new DOMParser();
  const doc = parser.parseFromString(scaledSvgString, "image/svg+xml");
  const scaledSVG = doc.documentElement;
  scaledSVG.classList.add("max-w-86", "max-h-86");

  // 替换颜色
  svgProperties = replaceBlackColors(scaledSVG, fillColor);
  for (let i = 0; i < svgProperties.length; i++) {
    svgProperties[i].value = fillColor;
  }

  // 放到预览面板
  previewPanel.innerHTML = "";
  previewPanel.classList.add("bg-checkerboard", "border-2", "border-slate-200", "rounded-lg");
  previewPanel.appendChild(scaledSVG);
  refs.cancelBtn.classList.remove("hidden");
  refs.applyBtn.classList.remove("hidden");
});


  
  panel.show("svg", refs.wrapper, "svg编辑");
};


const {edit} = (() => {
  let refs = null;
  let colorPickerUpdate = null;

  async function renderUI(){
    if(refs){
      return;
    }
    refs = render('',(d,e,f,_if)=>{
      function t(title) {
        return `<h5 class="text-slate-700 text-sm py-2">${title}</h5>`;
      }
      function c(id, className) {
        if (className) {
          return `<div data-id="${id}" class="${className}"></div>`;
        }else{
          return `<div data-id="${id}"></div>`;
        }
      }
      return [
          `<div data-id="wrapper"  class="text-sm">`,
          render.section('color', [
            render.titleRow('颜色','colorPicker', 'flex-grow-0'),
          ]),
          `</div>`
      ];
    
    }
    , panel.content);

    const {update} = elements.getGui(refs.colorPicker, "colorButton", {
      color: fillColor,
      onchange: (info) => {
        let newColor = info.fabricColor;
        currentSvg.set("fill", newColor);
        if (currentSvg._objects) {
          for (let i = 0; i < currentSvg._objects.length; i++) {
            // if (currentSvg._objects[i].fill == fillColor) {
              currentSvg._objects[i].fill = newColor;
            // }
          }
        }
        fillColor = newColor;
        debouncedCommitChange();
        canvas.requestRenderAll();
      },
    });
    colorPickerUpdate = update;
  }

  async function edit(svgObj) {
    currentSvg = svgObj;
    fillColor = currentSvg.get("fill");
    // 构建编辑界面（仅包含颜色编辑部分）


    Colorpicker.toggle({
      color: fillColor,
      panelType: 'svg',
      panelTitle: 'svg编辑',
      onchange: function(info) {
        let newColor = info.fabricColor;
        currentSvg.set("fill", newColor);
        if (currentSvg._objects) {
          for (let i = 0; i < currentSvg._objects.length; i++) {
            // if (currentSvg._objects[i].fill == fillColor) {
              currentSvg._objects[i].fill = newColor;
            // }
          }
        }
        // dirty svg 有缓存
        currentSvg.set("dirty", true);
        fillColor = newColor;
        debouncedCommitChange();
        canvas.requestRenderAll();
      }
    });
  }

  return {
    edit
  }
})();



emitter.on("operation:svg:init", async (url) => {
  panel.show("svg");
  init(url);
});
emitter.on("operation:svg:edit", async (object) => {
  edit(object);
});
