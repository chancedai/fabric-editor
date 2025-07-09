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

// 获取 body 里面所有 node-type 属性的元素
const refs = getRefs("#detailPreview", "node-type");

// 要分享或下载的 HTML
let shareHTML = "";

// 接口返回的代码

let chatCode = "";
let chartType = "";
let chartSubType = "";

interact(refs.iframeWrapper).resizable({
  edges: { left: true, right: true, bottom: true, top: false }, // 只允许右侧 & 底部拖拽
  modifiers: [
    interact.modifiers.restrictSize({
      min: { width: 300, height: 200 }, // 限制最小大小，防止太小
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
      // hidden 类
      refs.buttonWrapper.classList.remove("hidden");
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

export function showIframeLoading() {
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
  chatCode = jsStr;
  chartType = type;
  chartSubType = subType;
  refs.iframe.style.display = "";

  const doc = getDocSrc(jsStr, type);
  refs.iframe.srcdoc = doc;

  shareHTML = doc;
}

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
      default:
        console.warn("未处理的按钮事件:", nodeType);
    }
  }
);

// 全屏 fixed inset-0 bg-black mt-0 flex flex-col，子元素 node.preview grow h-auto
// 退出全屏，恢复原来的样式
const FULLSCREEN_CLASSES = [
  "flex",
  "flex-col",
  "fixed",
  "inset-0",
  "bg-black",
  "z-50",
  "mt-0",
];
const NORMAL_CLASSES = ["relative"];

function toggleFullScreen() {
  const { wrap, preview, iframeWrapper, fullscreenIcon, exitFullscreenIcon } =
    refs;
  if (!fullscreenIcon.classList.contains('hidden')){
    // 设置为全屏模式
    document.body.style.overflowY = "hidden";
    wrap.classList.add(...FULLSCREEN_CLASSES);
    wrap.classList.remove(...NORMAL_CLASSES);
    preview.classList.add("grow");
    preview.style.height = "auto";
    fullscreenIcon.classList.add("hidden");
    exitFullscreenIcon.classList.remove("hidden");
  } else {
    // 设置为退出全屏模式
    document.body.style.overflowY = "auto";
    wrap.classList.remove(...FULLSCREEN_CLASSES);
    wrap.classList.add(...NORMAL_CLASSES);
    preview.classList.remove("grow");
    preview.style.height = "600px";
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
