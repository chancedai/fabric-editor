import { delegator, emitter, showInfo, render } from "../../__common__/utils";
import fabric from "../fabric";
import { canvas, exportCanvasConfig,debouncedCommitChange } from "../canvas";
import lib from "../lib";
import { panel } from "../component/sidebar";
import elements from "../elements";


const { init } = (() => {


// 替换 SVG 元素中黑色填充或描边颜色的函数
// 参数：
//   svgContainer: HTML 元素，包含需要修改的 SVG 元素
//   newColor: 要替换的颜色字符串（如："#ff0000"）
// 返回：
//   被修改的属性数组
const processSvgColors = (svgContainer, newColor) => {
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


let refs;
let currentUrl = "";
let colorPickerUpdate = function(){};
/// 全局变量，用于在本模块内部传递状态
let rulerFillColor = "rgba(0,0,0,1)";
let currentRulerObject = null;

let svgElementReference = null;
let svgColorProps = null;


function updateRulerPreview() {
  if (!svgElementReference) return;
  // 更新所有颜色属性
  svgColorProps.forEach(prop => prop.value = rulerFillColor);
  const svgBase64 = btoa(new XMLSerializer().serializeToString(svgElementReference));
  
  refs.rulerPreview.src = `data:image/svg+xml;base64,${svgBase64}`;
  refs.rulerPreview.style.height = "100px";
}

async function renderUI() {
  if(refs){
    return;
  }
  refs = render('', () => {
    return [
      `<div data-id="wrapper" class="text-sm h-full overflow-auto">`,
      render.section("color", [
        render.titleRow("颜色", "colorPickerContainer"),
      ]),
      render.section("preview", [
        `<div data-id="previewContainer" class="bg-checkerboard border border-slate-200 rounded flex justify-center items-center">
            <img data-id="rulerPreview" class="w-full"></img>
        </div>`
      ]),
      render.buttons([
        { id: 'cancelButton', text: '取消', className: 'btn-secondary' },
        { id: 'applyButton', text: '应用', className: 'btn-primary' }
      ]),
      `</div>`

    ];

  }, panel.content);

  const { previewContainer, rulerPreview, applyButton, cancelButton, colorPickerContainer } = refs;


  // 调用外部 elements.getGui 创建颜色选择控件
  const {update} = elements.getGui(colorPickerContainer, "colorButton", {
    color: rulerFillColor,
    onchange: (info) => {
      const newColor = info.fabricColor;
      rulerFillColor = newColor;
      // 更新所有 SVG 属性中的颜色
      if (svgColorProps && svgColorProps.length) {
        svgColorProps.forEach(prop => prop.value = rulerFillColor);
      }
      // 更新预览
      if (svgElementReference) {
        updateRulerPreview();
      }
    },
  });
  colorPickerUpdate = update;

  applyButton.addEventListener("click", () => {
    // 应用时根据选中的标尺生成新对象
    const imgObj = new Image();
    imgObj.crossOrigin = "anonymous";
    imgObj.onload = () => {
      // 使用 fabric.Rulerimage 构造标尺对象（假定该构造函数存在）
      const rulerParams = {
        left: 50,
        top: exportCanvasConfig.height / 2,
        width: exportCanvasConfig.width - 100,
        height: 32,
        fill: rulerFillColor,
        scale: 1, // 此处可扩展其他参数
      };
      const newRuler = new fabric.Rulerimage(imgObj, rulerParams);
      canvas.add(newRuler);
      // 将新对象置于画布底层
      // canvas.sendToBack(newRuler);
    };
    imgObj.src = currentUrl;
  });

  cancelButton.addEventListener("click", () => {
    panel.hide();
  }
  );
}
/**
 * 构建标尺编辑界面并插入到外部容器 panel.content 中
 */
async function init(url) {
  currentUrl = url;

  svgElementReference = null;
  svgColorProps = null;

  if(refs){
    colorPickerUpdate({
      color: rulerFillColor,
    });
  }else{
    renderUI();
  }

  panel.show("ruler",refs.wrapper, lib.word(1273));


  try {
    // 使用 fetch 加载标尺文件内容（假定返回 SVG 文件内容）
    const response = await fetch(url);
    const text = await response.text();
    // 解析返回的文本为 HTML，提取 svg 元素
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "image/svg+xml");
    svgElementReference = doc.querySelector("svg");
    // 调用外部函数 processSvgColors 处理 SVG（返回一个数组，每个元素包含可修改的颜色属性）
    svgColorProps = processSvgColors(svgElementReference, rulerFillColor);

    updateRulerPreview();
  } catch (err) {
    console.error("加载标尺文件失败", err);
    showInfo("加载标尺文件失败");
  }
}

return {
  init,
};
})();



// ---------------------- 对外接口 ---------------------- //


const { edit } = (() => {

  let refs = null;
  let colorPickerUpdate = function(){};
  let rulerFillColor = "rgba(0,0,0,1)";
  let currentRulerObject = null;
async function renderUI() {
  if(refs){
    return;
  }
  refs = render('', () => {
    return `
          <div data-id="wrapper" class="text-sm h-full overflow-auto">
          ${render.section("color", [
            render.titleRow("颜色", "colorPickerContainer"),
          ])}
          </div>
        `;
  }
    , panel.content);
  const { colorPickerContainer } = refs;
  const { update } = elements.getGui(colorPickerContainer, "colorButton", {
    color: rulerFillColor,
    onchange: (info) => {
      let newColor = info.fabricColor;
      rulerFillColor = newColor;
      currentRulerObject.set("fill", rulerFillColor);
      debouncedCommitChange();
      canvas.requestRenderAll();
    },
  });
  colorPickerUpdate = update;

}


async function edit(rulerObj) {
  currentRulerObject = rulerObj;
  rulerFillColor = rulerObj.get("fill");
  if(refs){
    colorPickerUpdate({
      color: rulerFillColor,
      
    });
  }else{
    renderUI();
  }

  panel.show("ruler",refs.wrapper, '标尺编辑');
  
}
return {
  edit,
};
})();


emitter.on("operation:ruler:init", (url) => {
  
  init(url);
});

emitter.on("operation:ruler:edit", async (object) => {
  
  edit(object);

});
// canvas.on('selection:cleared', destroy);
