import { getRefs, delegator } from "./utils";
import { getParameters } from "codesandbox/lib/api/define";
import {
  showError,
  showSuccess,
  showInfo,
  showWarning,
  getDocSrc,
} from "./utils";
import interact from "interactjs";
import Split from "split.js";
import { setEditorContent, undoEditor, redoEditor } from "./codemirror";

// 获取 body 里面所有 node-type 属性的元素
const refs = getRefs("#editorWrapper", "node-type");

const urlParams = new URLSearchParams(window.location.search);
  let currentChartId = urlParams.get('id'); // 获取图表 ID

const editorType = urlParams.get("type") || "chart"; // 默认是 chart
if(['chart', 'infog'].indexOf(editorType) === -1){
  editorType = 'chart';
}
if(!currentChartId){
  showSuccess({
    chart:'图表',
    infog: '图文'
  }[editorType]+'模式')
}

refs.adjustInput.setAttribute('placeholder', {
  chart: '请输入图表描述...',
  infog: '请输入图文描述...'
}[editorType]);

// 要分享或下载的 HTML
let shareHTML = "";

// 接口返回的代码

let chartCode = "";
let chartType = editorType==='infog'? editorType: '';
let chartSubType = "";

const debug = true; // 是否开启调试模式
const host = debug
  ? "http://localhost:3103/"
  : "https://xmy-api-35366-7-1317185243.sh.run.tcloudbase.com/";
const host2 = "http://localhost:3100/";

function cleanJSStr(str) {
  if (!str) {
    return "";
  }

  
  // 去掉最前面和最后面的换行符
  let jsStr = str.replace(/^\n+/, "").replace(/\n+$/, "");

  if(editorType === 'infog'){
    const reg = /```(html|HTML)[\s\S]*?```/;
    const match = jsStr.match(reg);
    if (match) {
      // 提取第一个匹配的 html 代码段
      jsStr = match[0].replace(/^```(html|js)/, "").replace(/```$/, "");
    } else {
      // 如果没有匹配到代码块，返回空字符串
      jsStr = "";
    }
    // 去掉前后的空格
    jsStr = jsStr.trim();

    jsStr = jsStr.replace(/^\"/, "").replace(/\"$/, "");
    jsStr = jsStr.replace(/^```html/, "").replace(/```$/, "");
    jsStr = jsStr.replace(/^```js/, "").replace(/```$/, "");
    jsStr = jsStr.replace(/\\n/g, "\n").replace(/\\\"/g, '"');
    jsStr = jsStr.replace(/`;$/, "");
    jsStr = jsStr.replace(/^\n+/, "").replace(/\n+$/, "");
    // 去掉最后的```
    jsStr = jsStr.replace(/```$/, "");
    jsStr = jsStr.replace(/`;$/, "");
    return jsStr;
  }else{
    // 匹配```javascript 或 ```js 和其之间的内容
    const reg = /```(javascript|js)[\s\S]*?```/;
    const match = jsStr.match(reg);
    if (match) {
      // 提取第一个匹配的 JavaScript 代码段
      jsStr = match[0].replace(/^```(javascript|js)/, "").replace(/```$/, "");
    } else {
      // 如果没有匹配到代码块，返回空字符串
      jsStr = "";
    }
    // 去掉前后的空格
    jsStr = jsStr.trim();

    jsStr = jsStr.replace(/^\"/, "").replace(/\"$/, "");
    jsStr = jsStr.replace(/^```javascript/, "").replace(/```$/, "");
    jsStr = jsStr.replace(/^```js/, "").replace(/```$/, "");
    jsStr = jsStr.replace(/\\n/g, "\n").replace(/\\\"/g, '"');
    jsStr = jsStr.replace(/`;$/, "");
    jsStr = jsStr.replace(/^\n+/, "").replace(/\n+$/, "");
    // 去掉最后的```
    jsStr = jsStr.replace(/```$/, "");
    jsStr = jsStr.replace(/`;$/, "");
  }

  
  return jsStr;
}

// chart/adjust-js
const getAdjustJS = async (prompt) => {
  try {
    // const response = await fetch(host + "chart/adjust-js", {
    const response = await fetch(host2 + "api/v/charts/generate-chart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, code: chartCode,type: editorType==='infog'?'infog':'' }),
    });

    const data = await response.json();

    if (response.ok) {
      const { code, generatedCode,type,subType, messageZh } = data;
      
      if(code === 200 && generatedCode){
        let jsStr = cleanJSStr(generatedCode);
        return {
          type,
          subType,
          code: jsStr,
        }
      }else{
        showError((messageZh||'出错了。')+'请稍候再试。')
        return null;
      }
      
    }
    console.error("Error:", data.messageZh);
    return null;
  } catch (error) {
    console.error("Network Error:", error);
    showError('网络错误，请稍候再试。')
    return null;
  }
};

(function () {
  // 初始化 Split.js
  const splitInstance = Split([refs.editor, refs.preview], {
    sizes: [50, 50], // 初始宽度比例 50% / 50%
    minSize: [0, 0], // 最小宽度
    gutterSize: 8, // 拖拽条大小
    cursor: "col-resize",
    gutter: (index, direction) => {
      const iframe = refs.iframe;
      const gutter = refs.dragBar;

      // 监听拖拽事件，修改 iframe pointer-events
      gutter.addEventListener("mousedown", (e) => {
        iframe.style.pointerEvents = "none"; // 禁用 iframe 的 pointer-events
      });

      // 拖拽结束后恢复 iframe pointer-events
      document.addEventListener("mouseup", () => {
        iframe.style.pointerEvents = "auto"; // 恢复 iframe 的 pointer-events
      });
      // 创建拖拽条
      return gutter;
    },
  });

  // 获取控件元素
  const toggleMaxCode = refs.toggleMaxCode;
  const toggleSplit = refs.toggleSplit;
  const toggleMaxPreview = refs.toggleMaxPreview;

  // 当前模式状态
  let currentMode = "split";

  // 更新按钮高亮样式
  const updateActiveButton = () => {
    [toggleMaxCode, toggleSplit, toggleMaxPreview].forEach((btn) => {
      btn.classList.remove("bg-blue-500");
      btn.classList.add("bg-slate-300"); // 保证未选中的按钮恢复默认背景色
    });
  
    const activeButton = {
      code: toggleMaxCode,
      split: toggleSplit,
      preview: toggleMaxPreview,
    }[currentMode];
  
    if (activeButton) {
      activeButton.classList.remove("bg-slate-300"); // 选中按钮去掉默认灰色
      activeButton.classList.add("bg-blue-500");
    }
  };
  

  // 点击切换到代码最大化
  toggleMaxCode.addEventListener("click", () => {
    splitInstance.setSizes([100, 0]);
    currentMode = "code";
    updateActiveButton();
  });

  // 点击切换到平分模式
  toggleSplit.addEventListener("click", () => {
    splitInstance.setSizes([50, 50]);
    currentMode = "split";
    updateActiveButton();
  });

  // 点击切换到预览最大化
  toggleMaxPreview.addEventListener("click", () => {
    splitInstance.setSizes([0, 100]);
    currentMode = "preview";
    updateActiveButton();
  });

  // 初始化高亮
  updateActiveButton();
})();

interact(refs.iframeWrapper).resizable({
  edges: { left: true, right: true, bottom: true, top: false }, // 只允许右侧 & 底部拖拽
  modifiers: [
    interact.modifiers.restrictSize({
      min: { width: 30, height: 20 }, // 限制最小大小，防止太小
      // max: { width: 1200, height: 800 } // 限制最大大小
    }),
    interact.modifiers.snapSize({
      // 让拖拽吸附到某些大小，减少抖动
      targets: [
        interact.snappers.grid({ width: 10, height: 10 }), // 以 10px 为步长吸附
      ],
    }),
    // keep the edges inside the parent
    interact.modifiers.restrictEdges({
      outer: "parent",
    }),
  ],
  inertia: true, // 添加惯性，让拖拽更自然
  listeners: {
    start(event) {
      // **拖拽开始时，禁用 iframe 的鼠标事件**
      const iframe = refs.iframe;
      if (iframe) iframe.style.pointerEvents = "none";
      event.target.classList.add("border-red-400"); // 拖拽时高亮
    },
    move(event) {
      // 让拖拽更平滑
      requestAnimationFrame(() => {
        let { width, height } = event.rect;
        event.target.style.width = `${width}px`;
        // event.target.style.width= '100%';
        event.target.style.height = `${height}px`;
      });
    },
    end(event) {
      // **拖拽结束后，恢复 iframe 的鼠标事件**
      const iframe = refs.iframe;
      if (iframe) iframe.style.pointerEvents = "auto";
      event.target.classList.remove("border-red-400"); // 拖拽结束取消高亮
    },
  },
});

// 显示 refs.preview 并给 refs.iframe 注入页面代码
// 监听 子窗口的高度变化，然后调整 iframe 的高度
window.addEventListener(
  "message",
  function (e) {
    // if (e.data.height) {
    //   refs.iframe.style.height = e.data.height + 'px';
    // }
    if (e.data.error) {
      console.log("iframe error:", e.data.error);
      showError(e.data.error, 3600e3);
    }
    if (e.data.render) {
      console.log("iframe render success");
      
    }

    if (e.data.error || e.data.render) {
      // 按钮可用
      enableAdjustSubmit();
    }

    if (e.data.base64) {
      const base64 = e.data.base64;
      const name = e.data.name;
      const a = document.createElement("a");
      a.href = base64;
      a.download = name;
      a.click();
    }
  },
  false
);

let currentChartData = null;
export function setCurrentChartData(data) {
  currentChartData = data;
}

export function showIframeLoading() {
  // 去掉 hidden 类
  refs.wrap.classList.remove("hidden");

  // 禁用按钮
  refs.adjustSubmit.classList.add("disabled");
  refs.adjustSubmit.disabled = true;

  const doc = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ECharts Renderer</title>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: "Microsoft YaHei",sans-serif; }
    body { background-color: #fff; }
    #chart { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
    .loading{display:flex;flex-direction:column;justify-content:center;align-items:center;height:100%;color:#64748b;}
    .loading p{margin-top:20px;font-size:14px;font-family:Arial,Helvetica,sans-serif;}
    /* 旋转动画 */
    .loading svg{animation:spin 1s linear infinite;width: 32px;height: 32px;}
    @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
  </style>
</head>
<body>
  <div id="chart">
    <div node-type="loading" class="loading"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader-circle size-8 animate-spin text-muted-foreground"> <path d="M21 12a9 9 0 1 1-6.219-8.56"></path> </svg> <p class="text-sm text-muted-foreground">正在分析...</p> </div>
  </div>
</body>
</html>
    `;
  refs.iframe.srcdoc = doc;
}

export function showIframe(jsStr, type, subType) {
  chartCode = jsStr;
  chartType = type;
  chartSubType = subType;
  refs.iframe.style.display = "";
  const doc = getDocSrc(jsStr, type);

  shareHTML = doc;

  setEditorContent(jsStr);
}

document.addEventListener("editor-save", (event) => {
  let doc = event.detail.doc; // 获取 doc 数据
  console.log("为什么是数组", doc);
  chartCode = doc;
  doc = getDocSrc(doc, chartType);
  shareHTML = doc;
  refs.iframe.srcdoc = doc;
});

function checkAdjustInput() {
  let value = refs.adjustInput.value;
  value = value.trim();
  if (value) {
    enableAdjustSubmit();
  } else {
    disableAdjustSubmit();
  }
}

function enableAdjustSubmit() {
  refs.adjustSubmit.classList.remove("disabled");
  refs.adjustSubmit.disabled = false;
}

function disableAdjustSubmit() {
  refs.adjustSubmit.classList.add("disabled");
  refs.adjustSubmit.disabled = true;
}

refs.adjustInput.addEventListener(
  "input",
  function (e) {
    checkAdjustInput();
  },
  false
);

refs.adjustInput.addEventListener(
  "change",
  function (e) {
    checkAdjustInput();
  },
  false
);

refs.adjustInput.addEventListener(
  "focus",
  function (e) {
    refs.adjustInput.classList.add("focus");
  },
  false
);

// 微调输入框 refs.adjustInput, 微调按钮 refs.adjustSubmit
// 返回的代码展示图表后，用户觉得需要细调一下，可以通过 refs.adjustInput 输入微调需求，然后点击 refs.adjustSubmit 按钮，将接口返回的微调的代码注入到 iframe 中，重新渲染图表
refs.adjustSubmit.addEventListener(
  "click",
  function (e) {
    showIframeLoading();
    const content = refs.adjustInput.value;
    getAdjustJS(content).then((res) => {
      if (res) {
        if (res.code) {
          showIframe(res.code, res.type, res.subType);
        } else {
          console.error("getAdjustJS error", res);
          showError("生成代码失败");
          // 恢复按钮
          enableAdjustSubmit();
          hideIframe();
        }
      } else {
        console.error("getAdjustJS error");
        showError("生成代码失败");
        // 恢复按钮
        enableAdjustSubmit();
        hideIframe();
      }
    });
    

  },
  false
);

// refs.buttonWrapper 下有以下几个按钮，node-type 分别为，给它们委派事件
// shareToCodePen
// shareToCodeSandbox
// downloadCode
// captureScreenshot

// 为按钮添加事件委派
delegator.on(
  refs.buttonWrapper,
  "click",
  "[node-type]",
  function (e, target) {
    const nodeType = target.getAttribute("node-type");
    switch (nodeType) {
      case "shareToCodePen":
        shareToCodePen(shareHTML);
        break;
      case "shareToCodeSandbox":
        shareToCodeSandbox(shareHTML);
        break;
      case "downloadCode":
        downloadCode(shareHTML);
        break;
      case "captureScreenshot":
        captureScreenshot();
        break;
      case "fullscreen":
        toggleFullScreen();
        break;
      case "fullscreenIcon":
        toggleFullScreen();
        break;
      case "exitFullscreenIcon":
        toggleFullScreen();
        break;
      case "fullscreen":
        // 让 iframe 节点 全屏
        // refs.iframe.requestFullscreen();
        refs.iframeWrapper.style.width = "100%";
        refs.iframeWrapper.style.height = "100%";
        showSuccess("图表已经最大化");

        break;
      case "undo":
        undoEditor();
        break;
      case "redo":
        redoEditor();
        break;
      case "save":

      default:
        console.warn("未处理的按钮事件:", nodeType);
    }
  }
);

function toggleFullScreen() {
  const { iframeWrapper, fullscreenIcon, exitFullscreenIcon } = refs;
  if (!fullscreenIcon.classList.contains("hidden")) {
    document.querySelector("header").classList.add("hidden");
    fullscreenIcon.classList.add("hidden");
    exitFullscreenIcon.classList.remove("hidden");
  } else {
    document.querySelector("header").classList.remove("hidden");
    fullscreenIcon.classList.remove("hidden");
    exitFullscreenIcon.classList.add("hidden");
  }
  iframeWrapper.style.width = "100%";
  iframeWrapper.style.height = "100%";
}

// 将代码分享到 CodePen
function shareToCodePen(html) {
  const data = {
    title: "智绘 示例",
    html: html,
    editors: "1",
  };
  const form = document.createElement("form");
  form.action = "https://codepen.io/pen/define";
  form.method = "POST";
  form.target = "_blank";
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "data";
  input.value = JSON.stringify(data);
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

/**
 * 将 HTML 内容分享至 CodeSandbox
 * @param {string} html - 要分享的 HTML 内容
 */
function shareToCodeSandbox(html) {
  // Create parameters for CodeSandbox API
  const parameters = getParameters({
    files: {
      "index.html": {
        content: html,
      },
    },
  });

  // Create a dynamic form to send the data to CodeSandbox
  const form = document.createElement("form");
  form.action = "https://codesandbox.io/api/v1/sandboxes/define";
  form.method = "POST";
  form.target = "_blank";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "parameters";
  input.value = parameters;

  form.appendChild(input);
  document.body.appendChild(form);

  // Submit the form and clean up
  form.submit();
  document.body.removeChild(form);
}

// 下载代码为文件
function downloadCode(html) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = ".html";
  a.click();
  URL.revokeObjectURL(url);
}

// 捕获当前图表的截图
function captureScreenshot() {
  refs.iframe.contentWindow.postMessage("download", "*");
}

(function () {
  // 缓存缩放比例
  let cachedScale = 1; // 默认缩放比例为 1
  const zoomSelect = refs.zoomSelect;
  const zoomDisplay = refs.zoomDisplay;
  updateZoomDisplay();

  // 设置比例显示
  function updateZoomDisplay() {
    zoomDisplay.textContent = (cachedScale*100).toFixed(0) + '%';
  }

  // 更新输入框的值
function updateInputValues(rect) {
  let {width, height} = rect;
  if(!width || !height){
    return;
  }
  width = width / cachedScale;
  height = height / cachedScale;

  refs.widthInput.value = width.toFixed(0); // 保留两位小数
  refs.heightInput.value = height.toFixed(0); // 保留两位小数
}

updateInputValues(refs.iframeWrapper.getBoundingClientRect());

// 当输入框失去焦点时，更新 iframeWrapper 尺寸
function handleInputBlur(event) {
  const input = event.target;
  let value = parseInt(input.value, 10);
  
  if (isNaN(value) || value < 100) {
    input.value = 100;
    showInfo("输入值过小，已自动调整");
} else if (value > 9999) {
    input.value = 9999;
    showInfo("输入值过大，已自动调整");
}
  const parentRect = refs.preview.getBoundingClientRect(); // 获取 preview 容器的大小
  let inputWidth = parseFloat(refs.widthInput.value); // 获取宽度输入框的值
  let inputHeight = parseFloat(refs.heightInput.value); // 获取高度输入框的值

  if (isNaN(inputWidth) || isNaN(inputHeight) || inputWidth <= 0 || inputHeight <= 0) {
    return; // 如果输入无效，则不处理
  }
  let scale;
  if(event.target.getAttribute('node-type') === 'widthInput'){
    scale = parentRect.width / inputWidth;
  }else{
    scale = parentRect.height / inputHeight;
  }
  let adjustedWidth = inputWidth * scale;


  // 更新缩放比例
  zoom(adjustedWidth/inputWidth); // 调用缩放函数，传入计算的比例
}




// 监听输入框失去焦点事件
refs.widthInput.addEventListener("blur", function(event){

  handleInputBlur(event);
});
refs.heightInput.addEventListener("blur", function(event){

  handleInputBlur(event);
});
// 监听回车键按下事件
refs.widthInput.addEventListener("keydown", handleKeydown);
refs.heightInput.addEventListener("keydown", handleKeydown);

function handleKeydown(event) {
  // 判断是否按下的是回车键
  if (event.key === "Enter") {
    handleInputBlur(event); // 回车时手动触发 blur 事件处理
  }
}
  // // 监听 iframeWrapper 大小变化，并同步调整 iframeContainer
  // const resizeObserver = new ResizeObserver((entries) => {
  //   for (let entry of entries) {
  //     resizeContainer(entry.contentRect);
  //     updateInputValues(entry.contentRect);
  //   }
  // });

  // function resizeContainer(rect){
  //   const { width, height } = rect;
  //   // 使用缓存的缩放比例，减少重复计算
  //   refs.iframeContainer.style.width = `${width / cachedScale}px`;
  //   refs.iframeContainer.style.height = `${height / cachedScale}px`;

  // }

  // // 监听 iframeWrapper
  // resizeObserver.observe(refs.iframeWrapper);

  // zoomSelect.addEventListener("change", function () {
  //   updateScale(); // 更新缓存的缩放比例
  //   let zoomValue = cachedScale;
  //   refs.iframeContainer.style.transform = `scale(${zoomValue})`;
  //   // iframeContainer 在 resizeObserver 里同步修改了
  //   // refs.iframeContainer.style.width = `${100/zoomValue}%`;
  //   // refs.iframeContainer.style.height = `${100/zoomValue}%`;
  //   refs.iframeWrapper.style.width = `${Math.min(zoomValue*100, 100)}%`;
  //   refs.iframeWrapper.style.height = `${Math.min(zoomValue*100, 100)}%`;

  //   // 可能 iframeWrapper 宽高无变化，所以要手动触发一下
  //   resizeContainer(refs.iframeWrapper.getBoundingClientRect());

  // });

  // 缩放时保持 iframeWrapper 宽高比例，避免超出父容器大小
const resizeObserver = new ResizeObserver((entries) => {
  for (let entry of entries) {
    resizeContainer(entry.contentRect);
    updateInputValues(entry.contentRect);
  }
});

function resizeContainer(rect) {

  const { width, height } = rect;
  if(!width || !height){
    return;
  }
  
  // 使用缓存的缩放比例，减少重复计算
  refs.iframeContainer.style.width = `${width / cachedScale}px`;
  refs.iframeContainer.style.height = `${height / cachedScale}px`;
}

// 更新缩放比例
function resizeWrapper() {
  // 获取当前缩放比例
  let scale = cachedScale;

  // 获取 preview 容器的宽高
  const parentRect = refs.preview.getBoundingClientRect();
  const previewWidth = parentRect.width;
  const previewHeight = parentRect.height;

  // 获取输入框的宽高比例
  let inputWidth = parseFloat(refs.widthInput.value) || 1;  // 避免除 0
  let inputHeight = parseFloat(refs.heightInput.value) || 1;
  let ratio = inputWidth / inputHeight;

  let previewRatio = previewWidth / previewHeight;
  let newWidth, newHeight;

  if (ratio > previewRatio) {
    // **如果输入的宽高比 大于 preview 的宽高比**
    // 说明输入的 "相对宽度" 更大，优先让宽度充满 preview
    newWidth = previewWidth;
    newHeight = newWidth / ratio; // 计算高度
  } else {
    // **如果输入的宽高比 小于或等于 preview 的宽高比**
    // 说明输入的 "相对高度" 更大，优先让高度充满 preview
    newHeight = previewHeight;
    newWidth = newHeight * ratio; // 计算宽度
  }

  // 更新 iframeWrapper 尺寸
  refs.iframeWrapper.style.width = `${newWidth}px`;
  refs.iframeWrapper.style.height = `${newHeight}px`;

  // 手动触发 resizeContainer 以同步更新 iframeContainer 尺寸
  resizeContainer(refs.iframeWrapper.getBoundingClientRect());
}


// 监听 zoomSelect 变化
zoomSelect.addEventListener("change", function () {
  zoom(parseFloat(zoomSelect.value) / 100);
});

function zoom(scale){
  scale = parseFloat(scale,10);
  cachedScale = scale;  // 更新缓存的缩放比例
  refs.iframeContainer.style.transform = `scale(${cachedScale})`;
  updateZoomDisplay(cachedScale); // 更新缓存的缩放比例
  resizeWrapper();
}

// 监听 iframeWrapper 大小变化并同步调整 iframeContainer
document.addEventListener('DOMContentLoaded',function(){
  resizeObserver.observe(refs.iframeWrapper);
});

})();

(function () {
  const {
    coverPreviewContainer,
    coverPreview,
    save,
    chartModal,
    cancelBtn,
    createBtn,
    updateBtn,
    deleteBtn,
    uploadCoverInput,
    uploadMessage,
    titleInput,
    titleZhInput,
    typeInput,
    subTypeInput,
    coverInput,
    tagsInput,
    isFreeInput,
    adjustInput,
  } = refs;

  


  // 打开弹框（清空或填充数据）
  save.addEventListener("click", () => {
    const chartData = getCurrentChartData();
    updatePreview(chartData.cover);
    if (chartData && chartData.id) {
      // currentChartId = chartData.id;
      titleInput.value = chartData.title || "";
      titleZhInput.value = chartData.titleZh || "";
      typeInput.value = chartData.type || "";
      subTypeInput.value = chartData.subType || "";
      coverInput.value = chartData.cover || "";
      tagsInput.value = chartData.tags || "";

      // createBtn.classList.add("hidden");
      updateBtn.classList.remove("hidden");
      deleteBtn.classList.remove("hidden");
    } else {
      currentChartId = null;
      titleInput.value = "";
      titleZhInput.value = "";
      typeInput.value = "";
      subTypeInput.value = "";
      coverInput.value = "";
      tagsInput.value = "";

      // createBtn.classList.remove("hidden");
      updateBtn.classList.add("hidden");
      deleteBtn.classList.add("hidden");
    }

    chartModal.classList.remove("hidden");
  });

  // 关闭弹框
  cancelBtn.addEventListener("click", () => {
    chartModal.classList.add("hidden");
  });

  function updatePreview(src) {
    if (src) {
      coverPreview.src = src;
      coverPreviewContainer.classList.remove("hidden");
    } else {
      coverPreviewContainer.classList.add("hidden");
    }
  }

  // 监听文本输入框（URL）
  coverInput.addEventListener("input", function () {
    const url = coverInput.value.trim();
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      updatePreview(url);
    } else {
      updatePreview(null);
    }
  });

  // 上传封面
  uploadCoverInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      updatePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      updatePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("file", file);

    uploadMessage.textContent = "正在上传...";

    try {
      const response = await fetch(host2 + "api/v/charts/upload-cover", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.code === 0) {
        coverInput.value = data.imageUrl;
        uploadMessage.textContent = "上传成功！";
      } else {
        uploadMessage.textContent = "上传失败：" + data.messageZh;
      }
    } catch (error) {
      console.error(error);
      uploadMessage.textContent = "上传失败，请重试！";
    }
  });

  deleteBtn.addEventListener("click", async () => {
    const chartId = currentChartId; // 获取当前编辑的图表 ID
    if (!chartId) {
      showError("没有可删除的图表！");
      return;
    }

    const confirmDelete = confirm("确定要删除该图表吗？删除后无法恢复！");
    if (!confirmDelete) return;

    const response = await fetch(host2 + `api/v/charts/${chartId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (data.code === 0) {
      showSuccess("图表删除成功，5 秒后将跳转到列表页！", 10e3);
      chartModal.classList.add("hidden");
      setTimeout(function () {
        location.href = "/v/list/";
      }, 5e3);
    } else {
      showError("删除失败：" + data.messageZh);
    }
  });

  // 发送新建请求
  createBtn.addEventListener("click", async () => {
    if (!validateForm()) return;

    const payload = {
      title: titleInput.value.trim(),
      titleZh: titleZhInput.value.trim(),
      type: typeInput.value,
      subType: subTypeInput.value.trim(),
      cover: coverInput.value.trim(),
      tags: tagsInput.value.trim(),
      creatorId: "system",
      code: chartCode,
      isFree: isFreeInput.checked, // 获取是否免费的布尔值
    };

    const response = await fetch(host2 + "api/v/charts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.code === 0) {
      showSuccess("图表创建成功！");
      chartModal.classList.add("hidden");
      window.open("/v/editor/?id=" + data.chart.id);
    } else {
      showError("创建失败：" + data.messageZh);
    }
  });

  // 发送修改请求
  updateBtn.addEventListener("click", async () => {
    if (!currentChartId || !validateForm()) return;

    const payload = {
      title: titleInput.value.trim(),
      titleZh: titleZhInput.value.trim(),
      type: typeInput.value,
      subType: subTypeInput.value.trim(),
      cover: coverInput.value.trim(),
      tags: tagsInput.value.trim(),
      creatorId: "system",
      code: chartCode,
      isFree: isFreeInput.checked, // 获取是否免费的布尔值
    };

    const response = await fetch(
      host2 + `api/v/charts/${currentChartId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    if (data.code === 0) {
      showSuccess("图表更新成功！");
      chartModal.classList.add("hidden");
      // 刷新页面
      location.reload();
    } else {
      showError("更新失败：" + data.messageZh);
    }
  });

  // 数据校验
  function validateForm() {
    if (!typeInput.value) {
      showInfo("请选择图表类型！");
      return false;
    }

    if (subTypeInput.value && !/^[a-zA-Z]+$/.test(subTypeInput.value)) {
      showInfo("子类型只能包含英文字符！");
      return false;
    }

    if (tagsInput.value.includes("，")) {
      showInfo("标签请使用英文逗号分隔！");
      return false;
    }

    if (coverInput.value && !/^https?:\/\//.test(coverInput.value)) {
      showInfo("封面图片地址无效！");
      return false;
    }

    return true;
  }

  function getCurrentChartData() {
    const data = currentChartData || {};
    return data;
  }
})();
