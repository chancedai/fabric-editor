import { delegator, emitter, showInfo, render } from "../../__common__/utils";
import fabric from "../fabric";
import { handleTextStyleChange } from '../textStyleUtils.js';
import { canvas, exportCanvasConfig, debouncedCommitChange } from "../canvas";
import lib from "../lib";
import {
  panel,
} from "../component/sidebar";
import elements from "../elements";
import loadFonts from "../loadFonts";

let refs = null;
let textObject = null;
let updates = {};



/**
 * 通用处理文本样式变化的入口函数
 * @param {string} prop - 样式属性名
 * @param {*} value - 样式属性值
 */
const _handleTextStyleChange = (prop, value) => {
  if (!textObject) return; // 防止空指针
  handleTextStyleChange(
    textObject,
    prop,
    value,
    { debouncedCommitChange, canvas }
  );
};



// 处理字体家族变化
const handleFontFamilyChange = (value) =>
  _handleTextStyleChange("fontFamily", value);

// 处理描边颜色变化
const handleStrokeColorChange = (color) =>
  _handleTextStyleChange("stroke", color);

// 处理描边宽度变化
const handleStrokeWidthChange = (value) =>
  _handleTextStyleChange("strokeWidth", value);

// 字体背景颜色变化
const handleTextBackgroundColorChange = (color) =>
  _handleTextStyleChange("textBackgroundColor", color);



// 更新和渲染UI的逻辑
const renderUI = (settings) => {
  if (refs) {
    return;
  }

  refs = render(
    "",
    () => {
      return `
        <div data-id="wrapper" class="text-sm h-full overflow-auto">
  
          ${render.section("color", [
            `<div class="flex items-center space-x-4">
              <h4 class="font-medium whitespace-nowrap">颜色</h4>
              ${render.row("文字背景", "textBackgroundColor")}
              ${render.row("整体背景", "backgroundColor")}
            </div>`,
          ])}
  
          ${render.section("stroke", [
            render.titleRow("描边", "strokeColor"),
            render.row("宽度", "sliderStroke"),
          ])}
  
          ${render.section("shadow", [
            render.titleRow("文字投影", "bottomFill"),
            render.row("水平偏移", "sliderBottomOffsetX"),
            render.row("垂直偏移", "sliderBottomOffsetY"),
          ])}
  
          ${render.section("warped", [
            render.titleRow("变形", "warpTypeContainer"),
            render.row("上部调整", "sizeTopContainer"),
            render.row("下部调整", "sizeBottomContainer"),
          ])}
  
          ${render.section("curved", [
            render.titleRow("弯曲", "flippedContainer"),
            render.row("强度", "radiusContainer"),
          ])}
  
        </div>
      `;
    },
    panel.content
  );
  

  // 遍历配置数组生成各个设置项
  settings.forEach((setting) => {
    const { update } = elements.getGui(
      refs[setting.id],
      setting.type,
      setting.guiProps
    );
    updates[setting.id] = update;
  });
};

const updateUI = async () => {
  if (!textObject) return;
  
  // 定义所有 13 个设置的配置数组
  const settings = [
    
    {
      // 4. 边框颜色设置
      id: "strokeColor",
      type: "colorButton",
      label: lib.word(1321),
      guiProps: {
        name: "strokeColor",
        color: textObject.stroke,
        
        onchange: (info) => handleStrokeColorChange(info.fabricColor),
      },
      val: {
        color: textObject.stroke,
        
      },
    },
    {
      // 5. 边框宽度设置
      id: "sliderStroke",
      type: "slider",
      guiProps: {
        value: textObject.strokeWidth,
        min: 0,
        max: 100,
        onchange: (value) => handleStrokeWidthChange(value),
      },
      val: textObject.strokeWidth,
    },
    
    
    {
      // 8. 背景颜色设置
      id: "backgroundColor",
      type: "colorButton",
      label: lib.word(1331),
      guiProps: {
        showTabs: ["solid"],
        color: textObject.backgroundColor,
        showClear: true,
        position: "top left",
        onchange: (info) => {
          let color = info.fabricColor;
          textObject.set("backgroundColor", color);
          canvas.requestRenderAll();
        },
      },
      val: {
        color: textObject.backgroundColor,
      },
    },
    
    {
      id: "textBackgroundColor",
      type: "colorButton",
      label: lib.word(1330),
      guiProps: {
        showTabs: ["solid"],
        color: textObject.textBackgroundColor,
        onchange: (info) => handleTextBackgroundColorChange(info.fabricColor),
      },
      val: {
        color: textObject.textBackgroundColor,
      },
    },
    {
      // 11. 边框底部填充颜色设置
      id: "bottomFill",
      type: "colorButton",
      label: lib.word(1333),
      guiProps: {
        color: textObject.bottomFill,
        position: "top left",
        onchange: (info) => {
          textObject.set("bottomFill", info.fabricColor);
          canvas.requestRenderAll();
        },
      },
      val: {
        color: textObject.bottomFill,
        
      },
    },
    {
      // 12. 边框偏移X设置
      id: "sliderBottomOffsetX",
      type: "slider",
      label: lib.word(1334) + " X",
      guiProps: {
        value: textObject.bottomOffsetX,
        min: -100,
        max: 100,
        onchange: (value) => {
          textObject.set("bottomOffsetX", value);
          canvas.requestRenderAll();
        },
      },
      val: textObject.bottomOffsetX,
    },
    {
      // 13. 边框偏移Y设置
      id: "sliderBottomOffsetY",
      type: "slider",
      label: lib.word(1334) + " Y",
      guiProps: {
        value: textObject.bottomOffsetY,
        min: -100,
        max: 100,
        onchange: (value) => {
          textObject.set("bottomOffsetY", value);
          canvas.requestRenderAll();
        },
      },
      val: textObject.bottomOffsetY,
    },

    {
      id: "warpTypeContainer",
      type: "radio",
      label: "文字变形类型",
      val: textObject.warpType,
      guiProps: {
        default: textObject.warpType,
        choices: {
          // 不换行 nowrap
          round: `<span class="whitespace-nowrap px-2">${lib.word(1377)}</span>`,
          straight: `<span class="whitespace-nowrap px-2">${lib.word(1378)}</span>`,
          skewed: `<span class="whitespace-nowrap px-2">${lib.word(1379)}</span>`,
        },
        onchange: (value) => {
          textObject.set("warpType", value);
          canvas.requestRenderAll();
        },
      },
    },
    {
      id: "sizeTopContainer",
      type: "slider",
      label: "上部大小调整",
      val: 100 * textObject.sizeTop,
      guiProps: {
        value: 100 * textObject.sizeTop,
        min: -100,
        max: 100,
        onchange: (value) => {
          textObject.set("sizeTop", value / 100);
          canvas.requestRenderAll();
        },
      },
    },
    {
      id: "sizeBottomContainer",
      type: "slider",
      label: "下部大小调整",
      val: 100 * textObject.sizeBottom,
      guiProps: {
        value: 100 * textObject.sizeBottom,
        min: -100,
        max: 100,
        onchange: (value) => {
          textObject.set("sizeBottom", value / 100);
          canvas.requestRenderAll();
        },
      },
    },

      {
        id: "flippedContainer",
        type: "checkbox",
        label: "字体样式",
        guiProps: {
          choices: {
            flipped: {
              label:
                '<i class="vicon-flip -rotate-90 block text-lg" title="上下翻转"></i>',
              checked: textObject.flipped,
            },
          },
          onchange: (key, value) => {
            if (key === "flipped") textObject.set("flipped", value);
            canvas.requestRenderAll();
          },
        },
        val: {
          flipped: textObject.flipped,
        },
      },
      {
        id: "radiusContainer",
        type: "slider",
        label: "圆角",
        guiProps: {
          value: textObject.radius,
          min: 50,
          max: 1250,
          onchange: (radius) => {
            textObject.set("radius", radius);
            canvas.requestRenderAll();
          },
        },
        val: textObject.radius,
      },
  ];

  if (refs) {
    settings.forEach((setting) => {
      const update = updates[setting.id];
      update(setting.val);
    });
  } else {
    // 渲染UI
    renderUI(settings);
  }

  const type = textObject.type;
  // textcurved/textwarped 没有阴影相关设置
  if (['textcurved', 'textwarped'].includes(type)) {
    refs["shadow"].style.display = "none";
  }else{
    refs["shadow"].style.display = "";
  }

  if (type === "textwarped") {
    refs["warped"].style.display = "";
  }else{
    refs["warped"].style.display = "none";
  }

  if (type === "textcurved") {
    refs["curved"].style.display = "";
  }else{
    refs["curved"].style.display = "none";
  }

  panel.show("text", refs.wrapper, '文字特效');
};

// 处理字体颜色变化
const handleTextColorChange_bak = (color) => {
  
  if (
    textObject.selectionStart !== undefined &&
    textObject.selectionEnd > textObject.selectionStart
  ) {
    // 记录选中区域的起始和结束位置
    let startIndex = textObject.selectionStart;
    let endIndex = textObject.selectionEnd;
    // 获取 textObject 中的所有文本内容
    let text = textObject.text;
    // 行号和当前行中字符的位置初始化
    let lineIndex = 0,
      charIndex = 0;

    // 遍历文本中每一个字符
    for (let i = 0; i < text.length; i++) {
      // 遇到换行符时，行号加一，并重置字符索引
      if (text.charAt(i) === "\n") {
        lineIndex++;
        charIndex = 0;
      }

      // 如果当前字符位置在选中的范围内
      if (i >= startIndex && i < endIndex) {
        // 如果当前行的样式数组还不存在，则先初始化
        if (!textObject.styles[lineIndex]) {
          textObject.styles[lineIndex] = [];
        }
        // 设置当前行、当前位置的样式（填充颜色）
        textObject.styles[lineIndex][charIndex] = { fill: color };
      }

      // 如果当前字符不是换行符，则字符索引加一
      if (text.charAt(i) !== "\n") {
        charIndex++;
      }
    }
  } else {
    // 如果没有选中文本，则直接设置默认的填充颜色
    textObject.set("fill", color);
  }

  // 请求重新渲染所有内容
  canvas.requestRenderAll();
};

// 处理字体样式变化
function handleFontStyleChange_bak(style, value) {
  if (!textObject) return; // 如果没有选中的对象，直接返回

  switch (style) {
    case "bold":
      textObject.set("fontWeight", value ? 700 : "normal");
      break;
    case "italic":
      textObject.set("fontStyle", value ? "italic" : "normal");
      break;
    case "underline":
      textObject.set("underline", value); // 确保设置了 underline 属性
      break;
  }

  textObject.setCoords(); // 更新坐标
  canvas.renderAll(); // 重新渲染 canvas
}


// https://xiaomingyan.com/static/v/design/assets/highlights/b
window.strokeWidth = window.strokeWidth || 1;
// 记住上一次添加文字的 bottom,作为下一次文字的 top，如果这次文字的 top超出了画布的 bottom,则重新计算，或者超过 100 秒后，重新计算;lastBottom 是文字居中后的 bottom
let lastBottom = 0;
let lastAddTime = 0;
const lastAddTimeLimit = 100 * 1000; // 100秒

// type: "body" | "title" | "subtitle" = "body"; // 默认是正文


const init = (type = "body", text = "") => {
  // 宽度为 exportCanvasConfig.width的 1/3,但不要小于 200px，也不能大于 600px
  const width = Math.min(Math.max(200, exportCanvasConfig.width / 3), 600);

  
  // textObject = new fabric.Textasset(
  //   // lib.word(1335),
  //   "那些杀不死我的，终将使我更强大",
  //   {
  //     width: width,
  //     // 中文没空格也换行
  //     splitByGrapheme: true,
  //     fontFamily: "Helvetica",
  //     fontWeight: 400,
  //     fontSize: 24,
  //     fill: "rgba(0,0,0,1)",
  //     left: 0,
  //     top: 0,
  //     texts: [
  //       { text: "那些" },
  //       {
  //         text: "杀不死",
  //         highlight: {
  //           type: "svg",
  //           url: "https://xiaomingyan.com/static/v/design/assets/highlights/l/3.svg",
  //           svgInfo: { colors: ["#afe7ff"], strokeWidth: window.strokeWidth },
  //         },
  //       },
  //       { text: "我的，终将使我" },
  //       {
  //         text: "更强大",
  //         highlight: {
  //           type: "svg",
  //           url: "https://xiaomingyan.com/static/v/design/assets/highlights/l/4.svg",
  //           svgInfo: { colors: ["#ffc300"], strokeWidth: window.strokeWidth },
  //         },
  //       },
  //     ],
  //   }
  // );

  // canvas.add(textObject).setActiveObject(textObject);
  // // textObject.centerH().centerV();
  // textObject
  //   .set({
  //     left: (exportCanvasConfig.width - textObject.getScaledWidth()) / 2,
  //     top: (exportCanvasConfig.height - textObject.getScaledHeight()) / 2,
  //   })
  //   .setCoords();

  // type 可能是标题 100 大小，也可能是副标题 60 大小，也可能是正文 40大小 
  const texts = {
    title: {
      text: '点击编辑标题',
      fontSize: 100,
    },
    subtitle: {
      text: '点击编辑副标题',
      fontSize: 60,
    },
    body: {
      text: '点击编辑正文',
      fontSize: 40,
    },
  }

  let fontColor = "rgba(0,0,0,1)";
  let fontFamily = "705509"; // 默认字体Roboto
  const textObjects = canvas.getObjects("textasset");
  if (textObjects.length > 0) {
    fontFamily = textObjects[0].fontFamily;
    fontColor = textObjects[0].fill;
  }

  if(type === 'curved'){
    textObject = new fabric.Textcurved(text|| lib.word(1335), {
      fontFamily,
      fontWeight: 400,
      fontStyle: "normal",
      fontSize: 32,
      fill: fontColor,
      diameter: 250,
      kerning: 0,
      flipped: false,
      left: 0,
      top: 0,
    });
  }else if(type === 'warped'){
    textObject = new fabric.Textwarped(text|| lib.word(1335), {
      fontFamily,
      fontWeight: 400,
      fontStyle: "normal",
      fontSize: 32,
      fill: fontColor,
      sizeTop: -0.20,
      sizeBottom: 0.20,
      warpType: "round",
      left: 0,
      top: 0,
    });
  }else{
    const textInfo = texts[type] || texts.body;
    // 看现在画布中的 Textasset，fontSize 最接近的，使用和它一样的字体和颜色，没有就用黑色
    const fontSize = textInfo.fontSize;
    
    let minDiff = Number.MAX_VALUE;
    textObjects.forEach((t) => {
      const diff = Math.abs(t.fontSize - fontSize);
      if (diff < minDiff) {
        minDiff = diff;
        fontFamily = t.fontFamily;
        fontColor = t.fill;
      }
    });

    textObject = new fabric.Textasset(text || textInfo.text, {
      width: width,
      fontFamily,
      splitByGrapheme: true,
      fontWeight: 400,
      fontSize: fontSize,
      fill: fontColor,
      left: 0,
      top: 0,
    });
  }
  
  let now = new Date().getTime();
  let centerTop = (exportCanvasConfig.height - textObject.getScaledHeight()) / 2;
  let left = (exportCanvasConfig.width - textObject.getScaledWidth()) / 2;
  let top = centerTop;
  let textHeight = textObject.getScaledHeight();

  // 如果上次添加的文字的 bottom不为0,则本次添加的文字的 top为上次添加的文字的 bottom + 10
  if(lastBottom !== 0){
    top = lastBottom + 10;
  }

  // 如果本次添加的文字的 top + textObject.getScaledHeight() > exportCanvasConfig.height,则本次添加的文字的 top为画布的中心
  if(top + textHeight > exportCanvasConfig.height){
    top = centerTop;
  }

  // 如果上次添加的文字的时间不为0,并且本次添加的文字的时间 - 上次添加的文字的时间 > 100秒,则本次添加的文字的 top为画布的中心
  if(lastAddTime !== 0 && now - lastAddTime > lastAddTimeLimit){
    top = centerTop;
  }

  lastAddTime = now;
  lastBottom = top + textHeight;
  textObject
    .set({
      left: left,
      top: top,
    })
    .setCoords();
    // loadFonts(fontIds, {
    //   onSuccess(id) {
    //     console.log(`[字体] ${id} 加载成功`);
    //     restoreFontForFamily(canvas, id);
    //   },
    //   onError(id, err) {
    //     console.warn(`[字体] ${id} 加载失败:`, err);
    //     showInfo(`字体 "${id}" 加载失败，将使用默认字体`, 3000);
    //   },
    //   onComplete({ loaded, failed }) {
    //     console.log(`[字体] 加载完成，总计: 成功 ${loaded.length} 个，失败 ${failed.length} 个`);
    //     toggleLoading(false);
    //     onComplete();
    //   }
  loadFonts([fontFamily], {
    onSuccess(id) {
      textObject.isDirty = true;
      
      canvas.requestRenderAll();
    },
    onError(id, err) {
      console.warn(`[字体] ${id} 加载失败:`, err);
    },
    onComplete() {
      // canvas.requestRenderAll();
    }
  });
  canvas.add(textObject).setActiveObject(textObject);
  debouncedCommitChange();
  canvas.requestRenderAll();
  requestAnimationFrame(updateUI);
};

const edit = async (object, isInline) => {
  textObject = object;
  updateUI();
};

const destroy = () => {};

emitter.on("operation:text:init", ({type, text}) => {
  init(type, text);
});
emitter.on("operation:text:edit", async (object) => {
  await edit(object);
});
emitter.on("operation:destroy", (operationType) => {
  if (operationType === "text") {
    destroy();
  }
});
