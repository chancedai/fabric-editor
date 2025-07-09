//   
import { delegator, showSuccess,showError, emitter } from "../../__common__/utils.js";
import MicroModal from "micromodal";
import {canvas, importJSONData, exportCanvasConfig, debouncedCommitChange} from "../canvas.js";


import tippy from "tippy.js";
import 'tippy.js/themes/light.css';

const fileMenuHtml = `
<div class="min-w-max">
${
  [
    {text: '下载', icon: 'vicon-download', type: 'saveImageAs'},
    {text: '打印', icon: 'vicon-print', type: 'printCanvas'},
    {text: '打开 (.json)', icon: 'vicon-file-open', type: 'openDesign'},
    {text: '保存 (.json)', icon: 'vicon-save', type: 'saveDesign'},
    // 导入对象 json
    {text: '导入对象', icon: 'vicon-import', type: 'openObject'},
    {text: '新建海报', icon: 'vicon-new', type: 'newCanvas'},
].map(({text, icon, type, size}) => {
    return `<div class="flex items-center text-slate-700 text-sm hover:text-slate-900 hover:bg-slate-100 py-2 px-4 cursor-pointer" data-id="${type}"><i class="${icon} text-xl mr-2"></i>${text}</div>`;
}).join('')
}
</div>
`;



  // 调用函数插入模态框 HTML
  insertModals();
  // 使用 Micromodal.js 初始化模态框
    MicroModal.init({
    target: "save-json-modal",
    disableFocus: true,
    disableScroll: true,
  });
  
  MicroModal.init({
    target: "progress-modal",
    disableFocus: true,
    disableScroll: true,
  });
  
  MicroModal.init({
    target: "error-modal",
    disableFocus: true,
    disableScroll: true,
  });


  let tippyInstance = null;




  emitter.on('component:file:toggle', ({target}) => {
    if(!tippyInstance) {
      tippyInstance = tippy(target||document.body, {
        content: fileMenuHtml,
        allowHTML: true,
        interactive: true,
        placement: "bottom-end",
        trigger: "manual",
        theme: "light",
        arrow: false,
        offset: [0, 5],
      });
      // 在 body 上委派点击事件 data-id="openDesign"
      delegator.on(tippyInstance.popper, "click", "[data-id]", (event,target) => {
        let type = target.dataset.id;
        
        switch (type) {
            case "openDesign":
                openDesign();
                break;
            case "saveDesign":
                showSaveJsonModal();
                break;
            case "openObject":
                openObject();
                break;
            case "setCanvasSize":
                setCanvasSize();
                break;
            case "newCanvas":
                newCanvas();
                break;
            case "saveImageAs":
                saveImageAs(target);
                break;
            case "printCanvas":
                printCanvas();
                break;
            default:
                break;
        }
        // tippyInstance.hide();
      });
    }
    // toggle
    if (tippyInstance.state.isVisible) {
      tippyInstance.hide();
    } else {
      tippyInstance.show();
    }
  });


  function generateImage(sizeMultiplier = 1) {
    
    const zoom = canvas.getZoom();
    const vpt = canvas.viewportTransform;
    const dataUrl = canvas.toDataURL({
      // ...exportCanvasConfig,
      left: vpt[4],
      top: vpt[5],
      width: exportCanvasConfig.width * zoom,
      height: exportCanvasConfig.height * zoom,
      format: 'jpeg',
      multiplier: sizeMultiplier, 
      quality: 0.95,
     });
    return dataUrl;
  }

function printCanvas() {
  const zoom = canvas.getZoom();
  const vpt = canvas.viewportTransform;
  const canvasElement = canvas.toCanvasElement(); // 假设 'c' 是一个已经定义的 canvas 对象
  const isLandscape = exportCanvasConfig.width > exportCanvasConfig.height; // 判断是否为横屏

  // 创建一个新的 canvas 元素用于打印预览
  const previewCanvas = document.createElement("canvas");
  const previewContext = previewCanvas.getContext("2d");

  // 根据原始 canvas 的长宽比设置新 canvas 的尺寸
  previewCanvas.width = isLandscape ? exportCanvasConfig.height*zoom : exportCanvasConfig.width*zoom;
  previewCanvas.height = isLandscape ? exportCanvasConfig.width*zoom : exportCanvasConfig.height*zoom;

  if (isLandscape) {
    // 如果是横屏，旋转图像以适应新的 canvas
    previewContext.translate(previewCanvas.width / 2, previewCanvas.height / 2);
    previewContext.rotate((90 * Math.PI) / 180);
    previewContext.drawImage(canvasElement, -canvasElement.width / 2, -canvasElement.height / 2);
  } else {
    // 如果是竖屏，直接绘制图像不做旋转
    previewContext.drawImage(canvasElement, -vpt[4], -vpt[5]);
  }

  // 创建一个 iframe 来显示打印预览，并触发打印操作
  const printFrame = document.createElement("iframe");
  printFrame.style.border = "0"; // 去除边框
  printFrame.style.width = "0";  // 设置为 0 宽度
  printFrame.style.height = "0"; // 设置为 0 高度

  printFrame.name = exportCanvasConfig.baseName;
    printFrame.onload = function(event) {
      const iframe = event.currentTarget;
      const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
      
      // 设置页面样式并插入 canvas 元素
      const styles = `
        <title>${exportCanvasConfig.baseName}</title>
        <style>
          body { margin: 0; display: flex; position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; justify-content: center; align-items: center; }
          canvas { object-fit: contain; width: 100%; height: auto; max-width: 100%; max-height: 100%; }
        </style>
      `;
      iframeDocument.head.innerHTML = styles; // 插入样式
      iframeDocument.body.appendChild(previewCanvas); // 插入 canvas
      
      // 触发打印操作
      iframe.contentWindow.print();
    };
  
    // 将 iframe 添加到文档的 body 中
    document.body.appendChild(printFrame);
  
  // 当 iframe 加载完成后，注入 canvas 并触发打印
  
}


function saveImageAs(target){
  emitter.emit('component:export-image', {
    target,
    placement: 'right-start',
  });
}

function openDesign() {

    // 创建一个文件输入框
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";

    // 为 fileInput 绑定 change 事件监听器
    fileInput.addEventListener("change", (event) => {
      if (event.target.files[0]) {
        handleFileUpload(event.target.files[0], 'canvas');
      }
      // 销毁 fileInput
      fileInput.remove();
    });

    //   如果 canvas 有内容，提示用户保存，会替换
    if (canvas && canvas.getObjects().length) {
      confirm("当前操作将会替换当前内容，是否继续？") && fileInput.click();
    } else {
      // 延迟触发文件选择框，以避免触发文件框弹出错误
      setTimeout(() => {
        fileInput.click(); // 在用户点击后执行
      }, 0);
    }
  }

  function openObject() {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";

    fileInput.addEventListener("change", (event) => {
      if (event.target.files[0]) {
        handleFileUpload(event.target.files[0], 'object');
      }
      fileInput.remove();
    });

    setTimeout(() => {
      fileInput.click();
    }, 0);

  }

  function setCanvasSize(){
    emitter.emit("operation:resize-canvas:init");
  }

  function newCanvas(){
    location.href = location.href.split('?')[0];
  }


// 将模态框的 HTML 代码作为字符串插入到页面中
function createModal({ id, title, content = '', footerButtons = '', showProgressBar = false, footerAlign = 'right' }) {
  const footerClass = footerButtons
    ? `modal__footer mt-4 flex justify-${footerAlign === 'center' ? 'center' : 'end'} gap-4`
    : 'hidden';

  return `
    <div id="${id}" class="modal micromodal-slide" aria-hidden="true">
      <div class="modal__overlay fixed inset-0 bg-white/10 backdrop-blur-sm flex justify-center items-center z-50" tabindex="-1">
        <div class="modal__container bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
          <header class="modal__header flex justify-between items-center">
            <h2 class="modal__title text-sm font-semibold">${title}</h2>
            <button class="modal__close vicon-close btn-icon" aria-label="Close modal" data-micromodal-close></button>
          </header>
          <div class="modal__content mt-4 ${showProgressBar ? 'text-center' : ''}">
            ${content}
          </div>
          <footer class="${footerClass}">
            ${footerButtons}
          </footer>
        </div>
      </div>
    </div>
  `;
}

function insertModals() {
  const modals = [
    createModal({
      id: 'save-json-modal',
      title: '保存 JSON 文件',
      content: `<input type="text" class="form-control input w-full" id="fileNameInput" placeholder="请输入文件名">`,
      footerButtons: `
        <button class="modal__btn btn-secondary" data-micromodal-close>取消</button>
        <button class="modal__btn btn-primary" id="applyBtn">保存</button>
      `,
      footerAlign: 'right'
    }),

    createModal({
      id: 'progress-modal',
      title: '处理中...',
      content: `
        <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div class="progress-bar bg-purple-600 h-full rounded-full" style="width: 0%"></div>
        </div>
        <button id="applyBtn" class="mt-4 btn-primary" disabled>下载</button>
      `,
      showProgressBar: true,
      footerAlign: 'center'
    }),

    createModal({
      id: 'error-modal',
      title: '错误',
      content: `<p id="error-message" class="text-red-500"></p>`,
      footerButtons: `<button class="modal__btn btn-secondary" data-micromodal-close>关闭</button>`,
      footerAlign: 'center'
    }),
  ];

  document.body.insertAdjacentHTML("beforeend", modals.join(''));
}


// 处理文件上传
function handleFileUpload(file,type) {
  // 处理 JSON 文件
  if (/\.(json)$/i.test(file.name)) {
    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      try {
        const baseName = file.name.replace(/\.json$/, "");

        const jsonData = fileReader.result;

        importJSONData(jsonData, baseName, type);
      } catch (error) {
        // 显示错误模态框
        showError("文件损坏: 这个文件无法被加载。");
        console.error(error);
      }
    };
    fileReader.readAsText(file);
  }
  // 处理图片文件
  else if (/\.(gif|jpe?g|png|webp|avif)$/i.test(file.name)) {
    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      let img = new Image();
      img.crossOrigin = "anonymous";
      img.onerror = () => {
        showError(`警告: ${file.name} 是一个损坏的图片文件。`);
      };
      img.onload = () => {
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        let canvasElement = fabricanvas.util.createCanvasElement();
        canvasElement.width = canvasWidth;
        canvasElement.height = canvasHeight;

        drawImageToCanvas(
          canvasElement.getContext("2d"),
          img,
          0,
          0,
          canvasWidth,
          canvasHeight
        );
        canvas.setBackgroundImage(
          canvasElement.toDataURL("image/jpeg", 0.92),
          () => {
            canvas.requestRenderAll();
            debouncedCommitChange();
          },
          {
            width: canvasWidth,
            height: canvasHeight,
            originX: "left",
            originY: "top",
          }
        );
      };
      img.src = fileReader.result;
    };
    fileReader.readAsDataURL(file);
  }
}

// 显示保存 JSON 文件模态框
function showSaveJsonModal() {
  MicroModal.show("save-json-modal");

  const fileNameInput = document.getElementById("fileNameInput");
  const saveButton = document.getElementById("applyBtn");

  fileNameInput.value = exportCanvasConfig.baseName;

  // 清除旧事件，避免多次绑定
  const newSaveButton = saveButton.cloneNode(true);
  saveButton.parentNode.replaceChild(newSaveButton, saveButton);

  newSaveButton.addEventListener("click", async () => {
    const fileName = fileNameInput.value.replace(/\.json$/, "");
    const fileData = canvas.toJSON(["selectable", "customType"]);
    delete fileData.clipPath;
    fileData.canvasSize = `${exportCanvasConfig.width}x${exportCanvasConfig.height}`;
    fileData.phySize = exportCanvasConfig.phySize || fileData.canvasSize+'px';


    // const jsonString = compressJSON(fileData);
      const jsonString = JSON.stringify(fileData);

    try {
      if (window.showSaveFilePicker) {
        const options = {
          suggestedName: `${fileName}.json`,
          types: [{
            description: "JSON 文件",
            accept: { "application/json": [".json"] }
          }]
        };
        const handle = await window.showSaveFilePicker(options);
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
      } else {
        // fallback 下载方式
        const fileBlob = new Blob([jsonString], { type: "application/json" });
        const fileUrl = URL.createObjectURL(fileBlob);

        const downloadLink = document.createElement("a");
        downloadLink.href = fileUrl;
        downloadLink.download = `${fileName}.json`;
        downloadLink.click();
        URL.revokeObjectURL(fileUrl); // 清理资源
      }

      MicroModal.close("save-json-modal");
      showSuccess("文件已保存。");

    } catch (err) {
      console.error("保存失败:", err);
      showError("保存失败或操作已取消。");
    }
  });
}

emitter.on('component:file:saveJson', () => {
  // 触发保存 JSON 文件的模态框
  showSaveJsonModal();
  
});

emitter.on('component:file:print', () => {
  printCanvas();
});




