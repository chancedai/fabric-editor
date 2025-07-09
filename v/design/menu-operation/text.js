import { emitter, render } from "../../__common__/utils";
import { canvas, debouncedCommitChange } from "../canvas";
import lib from "../lib";
import elements from "../elements";
import { handleTextStyleChange } from '../textStyleUtils.js';

let refs = null;
let textObject = null;
let topMenu = null;
let objectType = null;
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


// 处理字体样式变化（包括 bold, italic, underline, linethrough, overline）
const handleFontStyleChange = (style, value) => {
  const styleMap = {
    bold: { prop: "fontWeight", newValue: value ? 700 : "normal" },
    italic: { prop: "fontStyle", newValue: value ? "italic" : "normal" },
    underline: { prop: "underline", newValue: value },
    linethrough: { prop: "linethrough", newValue: value },
    // overline: { prop: "overline", newValue: value },
  };

  if (styleMap[style]) {
    _handleTextStyleChange(styleMap[style].prop, styleMap[style].newValue);
  }
};

// 处理字体大小变化
const handleFontSizeChange = (value) =>
  _handleTextStyleChange("fontSize", value);


// 更新和渲染UI的逻辑
const renderUI = (settings, menu) => {
  if (refs) {
    return;
  }

  refs = render(
    "",
    () => {
      function t(title) {
        return `<h5 class="text-slate-700 text-sm py-2">${title}</h5>`;
      }
      function c(id) {
        return `<div data-id="${id}"></div>`;
      }
      return `
      <div data-id="wrapper" class="flex flex-wrap gap-1 items-center">
        ${c("fontFamily")}
        ${c("fontSize")}
        ${c("checkboxStyle")}
        ${c("radioAlignment")}
        ${c("fontColor")}
        ${c("letterSpacing")}
      </div>
      `;
    },
    topMenu.placeholder
  );

  // 遍历配置数组生成各个设置项
  settings.forEach((setting) => {
    // 添加控件，保持原有逻辑不变
    if (setting.type === "fontPicker") {
      // updateFontPicker(refs[setting.id]);
    } else {
      const { update } = elements.getGui(
        refs[setting.id],
        setting.type,
        setting.guiProps
      );
      updates[setting.id] = update;
    }
  });

  // 监听 canvas 上的对象修改事件，如果是当前选中的对象，
  canvas.on("object:modified", () => {
    if (canvas.getActiveObject() === textObject) {
      // 其实这里只有字体是在外部修改的
      // 其他的都是在内部修改的
      updates["fontFamily"]({
        name: lib.getFontName(textObject.fontFamily),
        font: textObject.fontFamily,
        object: textObject,
      });
    }
  });

};

const updateUI = async () => {
  if (!textObject) return;
  const fontName = lib.getFontName(textObject.fontFamily);
  // 定义所有 13 个设置的配置数组
  const settings = [
    
    {
      id: "fontSize",
      type: "valueAdjuster",
      guiProps: {
        defaultValue: textObject.fontSize,
        min: 1,
        max: 800,
        onChange: (value) => handleFontSizeChange(value),
      },
      val: textObject.fontSize,
    },
    {
      id: "fontColor",
      type: "colorButton",
      label: lib.word(1320),
      guiProps: {
        color: textObject.fill,
        
        panelType: "colorpicker",
        panelTitle: "字体颜色",
        opacity: false,
        onchange: (info) => {
          let newColor = info.fabricColor;
          _handleTextStyleChange("fill", newColor);;
        }
      },
      val: {
        color: textObject.fill,
        
      }
    },
    {
      // 字体选择器设置
      id: "fontFamily",
      type: "fontButton",
      label: lib.word(1319),
      guiProps: {
        name: fontName,
        font: textObject.fontFamily,
        object: textObject,
      },
      val: {
        name: fontName,
        font: textObject.fontFamily,
        object: textObject,
      },
    },
    {
      // 6. 字体样式设置
      id: "checkboxStyle",
      type: "checkbox",
      label: lib.word(1327),
      guiProps: {
        choices: {
          bold: {
            label: '<i class="vicon-bold text-lg"></i>',
            checked: textObject.fontWeight === 700,
          },
          italic: {
            label: '<i class="vicon-italic text-lg"></i>',
            checked: textObject.fontStyle === "italic",
          },
          underline: {
            label: '<i class="vicon-underline text-lg"></i>',
            checked: textObject.underline === true,
          },
          linethrough: {
            label: '<i class="vicon-strikethrough text-lg"></i>',
            checked: textObject.linethrough === true,
          },
          // overline: {
          //   label: '<i class="vicon-overline"></i>',
          //   checked: textObject.overline === true,
          // },
        },

        onchange: (style, value) => handleFontStyleChange(style, value),
      },
      val: {
        bold: textObject.fontWeight === 700,
        italic: textObject.fontStyle === "italic",
        underline: textObject.underline === true,
      },
    },
    {
      // 7. 对齐方式设置
      id: "radioAlignment",
      type: "radio",
      label: lib.word(1323),
      guiProps: {
        default: textObject.textAlign,
        choices: {
          left: '<i class="vicon-paragraph-left text-lg"></i>',
          center: '<i class="vicon-paragraph-center text-lg"></i>',
          right: '<i class="vicon-paragraph-right text-lg"></i>',
        },
        onchange: (alignment) => {
          textObject.textAlign = alignment;
          debouncedCommitChange();
          canvas.requestRenderAll();
        },
      },
      val: textObject.textAlign,
    },
    {
      // 9. 字符间距设置
      id: "letterSpacing",
      type: "letterSpacingButton",
      label: lib.word(1332),
      guiProps: {
        letterSpacing: textObject.charSpacing,
        lineHeight: textObject.lineHeight,
        onchange: (type,value) => {
          if(type === "letterSpacing") {
          textObject.set("charSpacing", value);
          } else if(type === "lineHeight") {
            textObject.set("lineHeight", value);
          }
          debouncedCommitChange();
          canvas.requestRenderAll();
        },
      },
      val: {
        letterSpacing: textObject.charSpacing,
        lineHeight: textObject.lineHeight,
      }
    },
    
  ];

  if (refs) {
    settings.forEach((setting) => {
      const update = updates[setting.id];
      if (update) {
        update(setting.val);
      }
    });
  } else {
    // 渲染UI
    renderUI(settings);
  }

  // type 为 textasset 时，才显示 radioalignment
  if(objectType === "textasset") {
    refs.radioAlignment.style.display = "";
  } else {
    refs.radioAlignment.style.display = "none";
  }

  // type 为 textwarped 时，没有划线功能
  const underlineCheckbox = refs.checkboxStyle.querySelector(
    '[name="underline"]'
  ).parentElement;
  if(objectType === "textwarped") {
    underlineCheckbox.style.display = " none";
  } else {
    underlineCheckbox.style.display = "";
  }



  topMenu.showPlaceholder(refs.wrapper);
};


const show = async () => {
  
  updateUI();
};

emitter.on("menu-operation:text:show", async ({type,object,menu}) => {
  textObject = object;
  topMenu = menu;
  objectType = type;
  show();
});
