// canvasLoader.js
import fabric from "../fabric.js";
import lib from "../lib.js";
import { showInfo, emitter } from "../../__common__/utils.js";
// import { decompressJSON } from "/v/__common__/json-compress.js";
import loadFonts from "../loadFonts.js"; 

const systemFonts = [
  "ARIAL", "COMIC SANS MS", "COURIER NEW", "HELVETICA",
  "IMPACT", "TIMES NEW ROMAN", "TREBUCHET MS", "VERDANA"
];

const injectedFonts = new Set();
const DEFAULT_CANVAS_SIZE = "1080x1920";

let loadingMessage = null;

function toggleLoading(show = true) {
  if (show) {
    loadingMessage ? loadingMessage.showToast() : loadingMessage = showInfo("正在加载画布数据...", 0);
  } else {
    loadingMessage?.hideToast();
  }
}

function injectFontFaceStyles(fontNames, fontPath = "/fonts") {
  const css = fontNames
    .filter(name => !injectedFonts.has(name))
    .map(name => {
      injectedFonts.add(name);
      return `
        @font-face {
          font-family: '${name}';
          src: url('${fontPath}/${name}.woff2') format('woff2'),
               url('${fontPath}/${name}.woff') format('woff');
          font-display: swap;
        }
      `;
    })
    .join("");

  if (css) {
    const styleEl = document.createElement("style");
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }
}

function resetCanvas(canvas) {
  canvas.clear();
  canvas.backgroundImage = null;
  canvas.backgroundColor = null;
}

function normalizeCanvasJson(json) {
  let raw = json;
  if(typeof json !== 'string'){
    raw = JSON.stringify(json);
  }
  
    raw.replace(/"type":"border\-image"/g, '"type":"borderimage"')
    .replace(/"type":"ruler\-image"/g, '"type":"rulerimage"')
    .replace(/"type":"text\-asset"/g, '"type":"textasset"')
    .replace(/"type":"text\-curved"/g, '"type":"textcurved"');
  return JSON.parse(raw);
}

function patchCurvedText(objects) {
  let hasCurvedText = false;
  objects.forEach(obj => {
    if (obj.type === "textcurved" && "kerning" in obj) {
      hasCurvedText = true;
      obj.textAlign = "center";
      obj.radius = 0.38 * obj.diameter;
      obj.charSpacing = obj.kerning + 100;
      obj.stroke = obj.strokeStyle;
      delete obj.strokeStyle;
      delete obj.diameter;
      delete obj.kerning;
    }
  });
  return hasCurvedText;
}

function extractFontObjects(objects) {
  const fontObjects = [];
  objects.forEach(obj => {
    if (obj.type === "group") {
      fontObjects.push(...extractFontObjects(obj.objects || []));
    } else if (obj.fontFamily) {
      fontObjects.push(obj);
    }
  });
  return fontObjects;
}

function collectFontIdsFromObjects(fontObjects) {
  const fontIds = [];
  fontObjects.forEach(({ fontFamily }) => {
    const id = fontFamily.trim();
    if (id && !systemFonts.includes(id.toUpperCase()) && !fontIds.includes(id)) {
      fontIds.push(id);
    }
  });
  return fontIds;
}

function preloadWithFallbackFont(objects, fallback = "Arial") {
  objects.forEach(obj => {
    if (obj.type === "group" && obj.objects) {
      preloadWithFallbackFont(obj.objects, fallback);
    } else if (obj.fontFamily && !systemFonts.includes(obj.fontFamily.toUpperCase())) {
      obj._originalFontFamily = obj.fontFamily;
      obj.fontFamily = fallback;
    }
  });
}

function restoreFontForFamily(canvas, fontFamily) {
  let changedObjects = [];

  canvas.getObjects().forEach(obj => {
    if (obj._originalFontFamily === fontFamily) {
      obj.fontFamily = obj._originalFontFamily;
      delete obj._originalFontFamily;
      changedObjects.push(obj);
    }
    if (obj.type === "group" && obj.objects) {
      obj.objects.forEach(child => {
        if (child._originalFontFamily === fontFamily) {
          child.fontFamily = child._originalFontFamily;
          delete child._originalFontFamily;
          changedObjects.push(child);
        }
      });
    }
  });

  if (changedObjects.length) {
    changedObjects.forEach(obj => obj.dirty = true);
    canvas.requestRenderAll();
  }
}

function importFonts(fontIds, canvas, onComplete) {
  if (!fontIds.length) {
    toggleLoading(false);
    onComplete();
    return;
  }
  loadFonts(fontIds, {
    onSuccess(id) {
      restoreFontForFamily(canvas, id);
    },
    onError(id, err) {
      console.warn(`[字体] ${id} 加载失败:`, err);
      showInfo(`字体 "${id}" 加载失败，将使用默认字体`, 3000);
    },
    onComplete({ loaded, failed }) {
      toggleLoading(false);
      onComplete();
    }
  });
}

function loadCanvas(canvas, json) {
  // try {
  //   json = decompressJSON(json);
  // } catch {
  //   alert("无效的 JSON 数据！");
  //   return;
  // }

  const parsed = normalizeCanvasJson(json);
  const hasCurved = patchCurvedText(parsed.objects || []);
  const fontObjects = extractFontObjects(parsed.objects || []);
  const fontIds = collectFontIdsFromObjects(fontObjects);
  const canvasSize = parsed.canvasSize || DEFAULT_CANVAS_SIZE;

  const fallbackJson = JSON.parse(JSON.stringify(parsed));
  preloadWithFallbackFont(fallbackJson.objects || [], "Arial");

  resetCanvas(canvas);
  if (hasCurved) showInfo(lib.word(1250) + ":<br/>" + lib.word(1251));

  toggleLoading(true);

  let phySize = parsed.phySize || canvasSize;
  
  emitter.emit("load:canvas:before", { canvasSize, phySize });

  canvas.loadFromJSON(JSON.stringify(fallbackJson), () => {
    canvas.renderAll();
    

    importFonts(fontIds, canvas, () => {
      if (canvas._historySaveAction) {
        canvas._historySaveAction();
      }
      emitter.emit("font:load:complete");
      canvas.clearHistory?.();
      emitter.emit("load:canvas:complete", { canvasSize });
    });
  });
}

function loadObject(canvas, json) {
  // try {
  //   json = decompressJSON(json);
  // } catch {
  //   alert("无效的 JSON 数据！");
  //   return;
  // }

  const parsed = normalizeCanvasJson(json);
  const hasCurved = parsed.type === "activeSelection"
    ? patchCurvedText(parsed.objects)
    : patchCurvedText([parsed]);

  const fontObjects = parsed.type === "activeSelection"
    ? extractFontObjects(parsed.objects)
    : extractFontObjects([parsed]);

  const fontIds = collectFontIdsFromObjects(fontObjects);
  toggleLoading(true);

  function onComplete(obj) {
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.renderAll();
    if (hasCurved) showInfo(lib.word(1250) + ":<br/>" + lib.word(1251));
    toggleLoading(false);
    emitter.emit("load:object:complete", canvas);
  }

  importFonts(fontIds, canvas, () => {
    if (parsed.type === "activeSelection") {
      fabric.ActiveSelection.fromObject(parsed, onComplete);
    } else {
      fabric.util.enlivenObjects([parsed], ([obj]) => onComplete(obj));
    }
  });
}

export function importCanvasData(canvas, data, type = "canvas") {
  if (type === "object") {
    loadObject(canvas, data);
  } else {
    loadCanvas(canvas, data);
    canvas.clearHistory();
  }
}

export function initCanvasFromTemplate(canvas, id, callback) {
  let url = "";
  let baseName = "";

  if (id) {
    if (id.startsWith("http")) {
      url = id;
      baseName = id.split("/").pop();
    } else {
      baseName = id.replaceAll("/", "-");
      url = `https://xiaomingyan.com/static/v/design/templates/jsons/${baseName}.json`;
    }

    fetch(url)
      .then(res => res.json())
      .then(json => {
        importCanvasData(canvas, json, "canvas");
        callback({baseName,json,id});
      });
  } else {
    baseName = "design";
    const json = {
      objects: [],
      background: "rgba(255, 255, 255, 1)",
      canvasSize: DEFAULT_CANVAS_SIZE
    }
    importCanvasData(canvas, json, "canvas");
    callback({baseName,json,id:''});
  }
}

// 接收 json 数据，处理
emitter.on('canvas:import:json',function({data,type}){
  if(type === 'canvas'){
    loadCanvas(canvas, data);
  }else{
    loadObject(canvas, data);
  }
})
