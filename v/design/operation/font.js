import { emitter, render } from "../../__common__/utils";
import { canvas, debouncedCommitChange } from "../canvas";
import lib from "../lib";
// import fontData from "../font-data";
import { FontPicker } from "../FontPicker";
const fonts = lib.fonts;

import {
  panel
} from "../component/sidebar";

const { localFonts } = lib;

let refs = null;
let textObject = null;
let update = function(){}
let picker = null;


/**
 * 更新选中区域内每个字符的样式
 * @param {string} prop - 样式属性名（如 fontFamily、fontWeight 等）
 * @param {*} value - 样式属性值
 * @returns {boolean} - 如果有选区并成功更新，返回 true；否则 false
 */
const updateSelectedTextStyle = (prop, value) => {
  if (
    textObject.selectionStart !== undefined &&
    textObject.selectionEnd > textObject.selectionStart
  ) {
    const startIndex = textObject.selectionStart;
    const endIndex = textObject.selectionEnd;
    const text = textObject.text;

    let lineIndex = 0,   // 当前字符所在行
        charIndex = 0;   // 当前字符在该行内的位置（不跨行）
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);

      if (char === "\n") {
        // 遇到换行，换到下一行，列归零
        lineIndex++;
        charIndex = 0;
        continue;
      }

      if (i >= startIndex && i < endIndex) {
        // 在选中范围内，给当前字符应用新样式
        if (!textObject.styles[lineIndex]) {
          textObject.styles[lineIndex] = {}; // 确保当前行样式对象存在
        }
        textObject.styles[lineIndex][charIndex] = Object.assign(
          {},
          textObject.styles[lineIndex][charIndex] || {},
          { [prop]: value } // 合并新样式
        );
      }

      charIndex++; // 下一个字符
    }

    return true; // 成功更新选中区域
  }
  return false; // 没有选区，返回 false
};

/**
 * 无选中时：批量更新整个文本（包含 textObject 和 styles 里的所有字符）
 * @param {string} prop - 样式属性名
 * @param {*} value - 样式属性值
 */
const updateAllTextStyle = (prop, value) => {
  // 1. 直接更新 textObject 本身的属性
  textObject.set(prop, value);

  // 2. 遍历 styles，把已有的单字符样式也一并改掉
  if (textObject.styles) {
    for (const lineIndex in textObject.styles) {
      const line = textObject.styles[lineIndex];
      for (const charIndex in line) {
        if (line[charIndex]) {
          line[charIndex][prop] = value;
        }
      }
    }
  }
};

/**
 * 通用处理文本样式变化的入口函数
 * @param {string} prop - 样式属性名
 * @param {*} value - 样式属性值
 */
const handleTextStyleChange = (prop, value) => {
  if (!textObject) return; // 防止空指针

  const updated = updateSelectedTextStyle(prop, value);

  if (!updated) {
    // 如果没有选区，则更新整个文本对象
    updateAllTextStyle(prop, value);
  }

  textObject.setCoords(); // 更新坐标（避免某些位置因字体变更导致问题）
  debouncedCommitChange(); // 你自己的防抖保存操作，保持
  canvas.requestRenderAll(); // 重绘 canvas
};


// 更新和渲染UI的逻辑
const renderUI = () => {
  if (refs) {
    return;
  }

  refs = render(
    "",
    () => {
      return `
            <div data-id="wrapper" class="py-4 flex flex-col h-full overflow-hidden">
              
            </div>
          `;
    },
    panel.content
  );

  const fontGroups = [
    { title: "常用字体", list: ["e56e0f"] },
    { title: "收藏字体", list: [] },
    { title: "文档字体", list: ["a23f1b"] }
  ];
  

  picker = new FontPicker({
    container: refs.wrapper,        // 容器元素
    fonts: fonts,                   // 字体列表
    groups: fontGroups,                // 组信息
    baseUrl: 'https://xiaomingyan.com/static/v/design/fonts',                 // 字体文件和图片地址前缀
    onchange(font) {
      console.log('字体切换了！选中了:', font);
    },
    onload(font) {
      handleTextStyleChange('fontFamily', font.id);
      
    },
    onerror(font,e) {
      console.error('字体加载失败:', font, e);
    }
  });
  update = () => {
    picker.update(textObject.fontFamily);
  }
};

const updateUI = () => {
  // 定义所有 13 个设置的配置数组

  if (refs) {
    update();
  } else {
    // 渲染UI
    renderUI();
  }

  panel.show("font", refs.wrapper, '字体设置');
};

const edit = (object) => {
  textObject = object;
  updateUI();
};

emitter.on("operation:font:edit", (object) => {
  edit(object);
});
emitter.on("operation:font:update", (object) => {
  textObject = object;
});

