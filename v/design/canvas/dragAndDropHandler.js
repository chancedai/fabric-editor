import { showError, showInfo } from "../../__common__/utils";

export function setupDragAndDrop(canvasContainer, canvas, emitter) {
  if (!canvasContainer) return;

  setupDragStyleHandlers(canvasContainer);
  setupDropHandler(canvasContainer, emitter);
  setupGlobalPasteHandler(emitter, canvas);
}

/**
 * 拖拽进入/离开：添加或移除 CSS class（用于改变光标等）
 */
function setupDragStyleHandlers(container) {
  container.addEventListener('dragover', e => {
    e.preventDefault();
    container.classList.add('dragging');
  });

  container.addEventListener('dragleave', e => {
    if (e.relatedTarget === null) {
      container.classList.remove('dragging');
    }
  });
}

/**
 * 拖拽释放：处理图片、JSON 文件、网页图像链接
 */
function setupDropHandler(container, emitter) {
  container.addEventListener('drop', e => {
    e.preventDefault();
    container.classList.remove('dragging');

    const dt = e.dataTransfer;
    const files = Array.from(dt.files);
    const imageFiles = [];
    const jsonFiles = [];
    let imageUrlEmitted = false;

    // 处理来自网页的拖拽（<img> 或链接）
    if (dt.items && dt.items.length > 0) {
      // 暂时不支持拖拽图片
      showInfo("暂不支持拖拽，可点击添加图片");
      return;
      // for (const item of dt.items) {
      //   if (imageUrlEmitted) break;

      //   if (item.kind === 'string' && item.type === 'text/html') {
      //     item.getAsString(html => {
      //       if (imageUrlEmitted) return;
      //       const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      //       if (match && match[1]) {
      //         imageUrlEmitted = true;
      //         emitter.emit("operation:image:init", match[1]);
      //       }
      //     });
      //   } else if (item.kind === 'string' && item.type === 'text/uri-list') {
      //     item.getAsString(uri => {
      //       if (imageUrlEmitted) return;
      //       if (/\.(png|jpe?g|gif|webp|svg)/i.test(uri)) {
      //         imageUrlEmitted = true;
      //         emitter.emit("operation:image:init", uri);
      //       }
      //     });
      //   }
      // }
    }

    // 本地文件拖拽处理
    files.forEach(file => {
      if (isImageFile(file)) {
        imageFiles.push(file);
      } else if (isJsonFile(file)) {
        jsonFiles.push(file);
      }
    });

    if (imageFiles.length > 0) {
      emitter.emit("operation:upload-image:drop", imageFiles);
    }

    if (jsonFiles.length > 0) {
      handleJsonFiles(jsonFiles, emitter);
    }
  });
}

/**
 * 粘贴事件：支持图片、JSON、纯文本
 */

// 常见拖拽 <img> 时的 DataTransfer.items 内容：
// text/html —— 包含完整 HTML，比如 <img src="xxx.jpg">

// text/uri-list —— 纯粹的图片链接（URI）


export function setupGlobalPasteHandler(emitter, canvas) {
  window.addEventListener("paste", e => {
    const active = document.activeElement;

    // ⛔️ 忽略原生输入区域（input, textarea, contenteditable）
    if (
      active.tagName === 'INPUT' ||
      active.tagName === 'TEXTAREA' ||
      active.isContentEditable
    ) {
      return;
    }

    // ⛔️ 忽略 Fabric.js 正在编辑的文本对象
    const fabricObject = canvas.getActiveObject();
    if (fabricObject && /^text/i.test(fabricObject.type)) {
      return;
    }

    const clipboard = e.clipboardData;

    // ✅ 图片粘贴（截图）
    for (const item of clipboard.items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          emitter.emit("operation:upload-image:drop", [file]);
          return;
        }
      }
    }

    // ✅ 文本/JSON 粘贴
    const text = clipboard.getData("text/plain");
    if (text && text.trim()) {
      try {
        const json = JSON.parse(text);
        const type = isCanvasJson(json) ? "canvas" : "object";
        emitter.emit("canvas:import:json", { type, data: json });
      } catch {
        // 普通文本（例如 Markdown、代码、段落）
        emitter.emit("operation:text:init", { type: "body", text });
      }
    }
  });
}


/**
 * 判断文件是否为图片
 */
function isImageFile(file) {
  return /\.(svg|gif|png|webp|avif|jpe?g)$/i.test(file.name);
}

/**
 * 判断文件是否为 JSON
 */
function isJsonFile(file) {
  return file.type === "application/json" || file.name.endsWith(".json");
}

/**
 * 判断 JSON 是否为画布数据
 */
function isCanvasJson(json) {
  return json && typeof json === 'object' && json.canvasSize;
}

/**
 * 异步读取并分类处理 JSON 文件
 */
function handleJsonFiles(files, emitter) {
  let pending = files.length;
  let lastCanvasJson = null;
  const objectJsons = [];

  files.forEach(file => {
    const reader = new FileReader();

    reader.onload = event => {
      try {
        const json = JSON.parse(event.target.result);
        if (isCanvasJson(json)) {
          lastCanvasJson = json;
        } else {
          objectJsons.push(json);
        }
      } catch (err) {
        console.error("解析 JSON 失败:", file.name, err);
        // emitter.emit("operation:json:parse-error", file);
        showError("解析 JSON 失败:", file.name, err);
      } finally {
        if (--pending === 0) {
          if (lastCanvasJson) {
            emitter.emit("canvas:import:json", {
              type: "canvas",
              data: lastCanvasJson,
            });
          }

          objectJsons.forEach(obj => {
            emitter.emit("canvas:import:json", {
              type: "object",
              data: obj,
            });
          });
        }
      }
    };

    reader.readAsText(file);
  });
}
