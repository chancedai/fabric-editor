/**
 * textStyleUtils.js
 * 
 * Fabric.js 文本对象样式操作工具
 * 支持选中区域/全量更新文字样式
 */

// 更新选中区域内的字符样式
export function updateSelectedTextStyle(textObject, prop, value) {
    if (
      textObject.selectionStart !== undefined &&
      textObject.selectionEnd > textObject.selectionStart
    ) {
      const startIndex = textObject.selectionStart;
      const endIndex = textObject.selectionEnd;
      const text = textObject.text;
  
      let lineIndex = 0, charIndex = 0;
  
      for (let i = 0; i < text.length; i++) {
        const char = text.charAt(i);
  
        if (char === "\n") {
          lineIndex++;
          charIndex = 0;
          continue;
        }
  
        if (i >= startIndex && i < endIndex) {
          if (!textObject.styles[lineIndex]) {
            textObject.styles[lineIndex] = {};
          }
          textObject.styles[lineIndex][charIndex] = Object.assign(
            {},
            textObject.styles[lineIndex][charIndex] || {},
            { [prop]: value }
          );
        }
  
        charIndex++;
      }
  
      return true;
    }
    return false;
  }
  
  // 无选中时，更新整个文本及其所有样式
  export function updateAllTextStyle(textObject, prop, value) {
    textObject.set(prop, value);
  
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
  }
  
  // 通用入口方法，自动判断是选区更新还是全量更新
  export function handleTextStyleChange(textObject, prop, value, options = {}) {
    const { debouncedCommitChange, canvas } = options;
    if (!textObject) return;
  
    const updated = updateSelectedTextStyle(textObject, prop, value);
  
    if (!updated) {
      updateAllTextStyle(textObject, prop, value);
    }
  
    textObject.setCoords();
    debouncedCommitChange && debouncedCommitChange(); // 防止保存太频繁
    canvas && canvas.requestRenderAll(); // 如果传了 canvas，自动请求刷新
  }
  