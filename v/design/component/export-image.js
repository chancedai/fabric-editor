import lib from "../lib.js";
import { delegator, showInfo, emitter, throttle, debounce,render } from "../../__common__/utils.js";
import { canvas, exportCanvasConfig } from "../canvas.js";
import tippy from "tippy.js";
import "tippy.js/themes/light.css";
import elements from "../elements.js";
/*
外部变量和方法（需手动引入）：

- saveFile(options): 处理文件保存逻辑。
*/

// function oa(a) {
//   a = a.getContext("2d").getImageData(0, 0, a.width, a.height).data;
//   for (let b = 0; b < a.length; b += 4) if (254 > a[b + 3]) return !0;
//   return !1;
// }
let currentButton = null;
let updates = {};
let tippyInstance = null;
let alertTippyInstance = null;
let refs = null;
let alertRefs = null;
let fileType = "png";
// size 倍数
let sizeMultiplier = 1;
let quality = 0.95;
let fileName = "";
let hasTransparentLayer = false;
// 2. 格式化文件大小（MB 或 KB）
function formatSize(sizeMB) {
  if (sizeMB < 1) {
    return `${(sizeMB * 1024).toFixed(1)} KB`;
  }
  return `${sizeMB.toFixed(2)} MB`;
}

// 1. 估算画布复杂度 (考虑色彩差异、透明度)
function estimateCanvasComplexity(canvas, sampleSize = 500) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;

  // 抽样宽高（避免全图太大）
  const sampleW = Math.min(sampleSize, width);
  const sampleH = Math.min(sampleSize, height);
  const imageData = ctx.getImageData(0, 0, sampleW, sampleH).data;

  let diffSum = 0;
  let total = 0;
  let transparencyCount = 0;

  for (let i = 4; i < imageData.length; i += 4) {
    const dr = Math.abs(imageData[i] - imageData[i - 4]);
    const dg = Math.abs(imageData[i + 1] - imageData[i - 3]);
    const db = Math.abs(imageData[i + 2] - imageData[i - 2]);
    const diff = (dr + dg + db) / 3;
    diffSum += diff;
    total++;

    // 判断透明度
    if (imageData[i + 3] < 255) {
      transparencyCount++;
    }
  }

  const avgDiff = diffSum / total; // 0~255
  const complexity = Math.min(2.0, Math.max(0.5, avgDiff / 50)); // 经验映射

  // 判断透明度比例，增加透明度带来的复杂度
  const transparencyFactor = Math.min(1, transparencyCount / total);

  return { complexity, transparencyFactor };
}

// 2. 根据画布内容、尺寸、质量等预测图片大小
function estimateImageSizeMB({
  width,
  height,
  multiplier = 1,
  format = "jpg",
  quality = 0.95,
  complexity = 1,
  transparencyFactor = 0,
}) {
  const baseResolution = 1000 * 1000; // 基准为 1MP
  const area = width * height * Math.pow(multiplier, 2);
  const areaFactor = area / baseResolution;

  // JPEG 更小，PNG 大很多
  let formatFactor = format === "png" ? 1.8 : 1; // PNG 文件通常更大
  let qualityFactor = 1; // 默认不影响

  if (format !== "png") {
    qualityFactor = 0.1 + 0.9 * quality; // 线性插值
  }

  if (format === "webp") {
    formatFactor = 0.5; // WebP 文件通常更小
    qualityFactor = 0.1 + 0.9 * quality; // 线性插值
  }

  // 复杂度越高，文件越大
  complexity = Math.max(0.5, Math.min(2.0, complexity)); // 限制范围


  // 基础估算（原始模型，容易偏小）
  let rawEstimateMB =
    0.1 /*基础MB*/ *
    areaFactor *
    complexity *
    (1 + transparencyFactor * 0.5) *
    formatFactor *
    qualityFactor;

  // ✳️ 偏差修正：现实通常比估计大好几倍，我们 ×8 或动态调整
  const correctionFactor = 1;

  const adjustedSizeMB = rawEstimateMB * correctionFactor;

  return adjustedSizeMB;
}


// 3. 使用例子：
function predictExportSize(canvas, exportCanvasConfig, format = 'jpeg', multiplier = 1, quality = 0.95) {
  const { complexity, transparencyFactor } = estimateCanvasComplexity(canvas); // 获取画布复杂度
  const { width, height } = exportCanvasConfig;
  
  // 估算图片大小
  const estimatedSize = estimateImageSizeMB({
    width,
    height,
    multiplier,  // 如果有缩放倍率，调整此值
    format,  // 格式类型（'jpeg' 或 'png' 等）
    quality,    // 图像质量（0 - 1之间）
    complexity,      // 画布复杂度影响
    transparencyFactor, // 透明度的影响
  });

  return estimatedSize;
}

function checkForTransparency(element) {
  if (!element) return false;
  const ctx = canvas.getContext("2d");
  const elementData = ctx.getImageData(0, 9, element.width, element.height).data;
  for (let i = 0; i < elementData.length; i += 4) {
    if (elementData[i + 3] < 254) return true;
  }
  return false;
}

function openExportModal(target, placement) {
  hasTransparentLayer = checkForTransparency(canvas.getElement());
  
  refs["file-name-input"].value = exportCanvasConfig.baseName || "";
  
  refs["file-extension"].textContent = `.${fileType}`;
  refs["canvas-size"].textContent = `${exportCanvasConfig.width} x ${exportCanvasConfig.height} px`;

  tippyInstance.setProps({
    placement: placement || "bottom",
    reference: target,
  });
  // 显示模态框
  tippyInstance.show();
}

  

function handleExport(fileType, sizeMultiplier, hasTransparentLayer) {
  fileName = refs["file-name-input"].value.trim();

  tippyInstance.hide();

  const exportOptions = { baseName: fileName, sizeMultiplier, fileType };

  // 如果是 jpg 文件且有透明图层，显示警告
  if (fileType === "jpg" && hasTransparentLayer) {
    showAlert(`
        <p class="text-sm text-slate-600">
          检测到半透明图层，JPG 不支持透明背景。请选择 PNG 以保留透明度，或继续使用 JPG。
        </p>
    `);
  } else {
    saveFile({ fileName: `${fileName}.${fileType}`, ...exportOptions });
  }
}


function updateFileSelectionUI(selectedType) {
  refs["file-extension"].textContent = `.${selectedType}`;

  refs.wrapper.querySelectorAll(".fileTypes button").forEach((btn) => {
    btn.classList.remove("btn-primary");
    btn.classList.add("btn-secondary");
  });

  const currentBtn = refs.wrapper.querySelector(`[data-filetype='${selectedType}']`);
  currentBtn.classList.remove("btn-secondary");
  currentBtn.classList.add("btn-primary");

  // 更新文件大小预测
  updates.predictSize();

  // png 是无损的，jpg 是有损的 png 隐藏 quality
  if (selectedType === "png") {
    refs["quality"].parentNode.style.display = "none";
  } else {
    refs["quality"].parentNode.style.display = "";
  }

}


// ------

// 生成并保存文件
async function saveFile(options) {

  const fileType = options.fileType || "jpg";
  const baseName = options.baseName || exportCanvasConfig.baseName;


  emitter.emit('canvas:guideLines:enable');

  switch (fileType) {
    case "pdf":
      await savePdfCmyk(baseName);
        break;
    // case "svg":
    //   saveSVG(baseName);
    //   break;
    case "jpg":
    case "png":
        saveImage(fileType, baseName, options.sizeMultiplier);
        break;
    default:
        console.error("Unsupported file type:", fileType);
  }


  emitter.emit('canvas:guideLines:disable');
}

// 处理 CMYK PDF 生成
async function savePdfCmyk(baseName) {

  // 暂不支持直接导出 CMYK PDF，建议使用 Photopea 在线工具。
  // 1.打开 PNG；
  // 2.菜单栏 File > Export as > PDF (CMYK)；
  // 3.下载即可。
  // 提示

  showAlert(`
    <p class="text-sm text-slate-600">
      暂不支持直接导出 CMYK PDF，建议使用 Photopea 在线工具。
      <br>
      1.打开 PNG；
      <br>
      2.菜单栏 File > Export as > PDF (CMYK)；
      <br>
      3.下载即可。
    </p>
    <p class="text-sm text-slate-600">
      <a href="https://www.photopea.com/" target="_blank" class="text-blue-500">点击这里访问 Photopea</a>
    </p>
  `);

  // let pdfUrl = "";

  // if (window.confirm("导出 CMYK PDF 可能需要一些时间，确定继续吗？")) {
  //   const image = generateImage("jpg", 4);

  //   const response = await fetch("/ajax/", {
  //     method: "POST",
  //     body: createFormData({
  //       task: "savePDF-CMYK",
  //       uid: userConfig.uid,
  //       img: image,
  //     }),
  //   });

  //   const result = await response.json();
  //   if (!result.success) {
  //     showAlert(result.response);
  //     return;
  //   }

  //   pdfUrl = result.data.url;
  //   triggerDownload(pdfUrl, `${baseName}.pdf`);
  // } else {
  //   tippyInstance.hide();
  // }
}

// 处理标准 PDF 生成
// function savePdf(baseName, paperSize, orientation) {
//   const createPdf = () => {
//       const pdf = new jsPDF({
//           orientation: orientation,
//           unit: paperSize === "exact" ? "px" : "mm",
//           format: paperSize === "exact" ? [exportCanvasConfig.width, exportCanvasConfig.height] : paperSize,
//       });

//       const imgData = generateImage("png");

//       if (paperSize === "exact") {
//           pdf.addImage(imgData, "PNG", 0, 0, exportCanvasConfig.width, exportCanvasConfig.height);
//       } else {
//           const pageWidth = pdf.internal.pageSize.getWidth();
//           const pageHeight = pdf.internal.pageSize.getHeight();
//           if (orientation === "landscape") {
//               pdf.addImage(imgData, "PNG", (pageWidth - (pageHeight / exportCanvasConfig.height) * exportCanvasConfig.width) / 2, 0, 
//                            (exportCanvasConfig.width / exportCanvasConfig.height) * pageHeight, pageHeight);
//           } else {
//               pdf.addImage(imgData, "PNG", 0, (pageHeight - (pageWidth / exportCanvasConfig.width) * exportCanvasConfig.height) / 2, 
//                            pageWidth, (exportCanvasConfig.height / exportCanvasConfig.width) * pageWidth);
//           }
//       }

//       pdf.save(`${baseName}.pdf`);
//       tippyInstance.hide();
//   };

//   if (!jsPDF) {
//       loadScript("/v/design/js/jspdf.umd.min.js", () => {
//           jsPDF = window.jspdf.jsPDF;
//           createPdf();
//       });
//   } else {
//       createPdf();
//   }
// }

// 处理图像格式（JPG / PNG / WebP）
function saveImage(fileType, baseName, sizeMultiplier) {
  const imageData = generateImage(fileType, sizeMultiplier);
  triggerDownload(imageData, `${baseName}.${fileType}`);
  tippyInstance.hide();
}
 


// 生成图片数据
function generateImage(format = 'png', sizeMultiplier = 1) {
  if (format === "jpg") format = "jpeg";

  // 暂存当前 VPT
  const originalVPT = canvas.viewportTransform;

  // 设置一个无缩放的 VPT（重置 zoom）
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

  // 生成图像（按原始逻辑尺寸导出）
  const dataUrl = canvas.toDataURL({
    format,
    multiplier: sizeMultiplier, // 控制导出像素密度
    left: 0,
    top: 0,
    width: exportCanvasConfig.width,
    height: exportCanvasConfig.height,
    quality: 0.95,
  });

  // 还原原来的 VPT（用户视图不受影响）
  canvas.setViewportTransform(originalVPT);

  return dataUrl;
}


// function saveSVG(baseName = "design") {
//   const { width, height, left = 0, top = 0 } = exportCanvasConfig;

//   // 💡 保存原位置
//   const originalViewportTransform = canvas.viewportTransform;

//   // 💥 平移 canvas，使导出区域对齐到 0,0
//   canvas.setViewportTransform([1, 0, 0, 1, -left, -top]);

//   // 🖨️ 导出 SVG
//   const svgData = canvas.toSVG({
//     width,
//     height,
//     viewBox: {
//       x: 0,
//       y: 0,
//       width,
//       height,
//     },
//   });

//   // 🔙 恢复原始位置
//   canvas.setViewportTransform(originalViewportTransform);

//   // 下载
//   triggerDownload(
//     "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData),
//     `${baseName}.svg`
//   );

//   tippyInstance.hide();
// }



// 触发文件下载
async function triggerDownload(dataOrBlob, fileName, mimeType = "application/octet-stream") {
  const isDataUrl = typeof dataOrBlob === "string" && dataOrBlob.startsWith("data:");
  // 使用 link 触发下载
  function downloadUsingLink() {
    let url = "";
    if (isDataUrl) {
      url = dataOrBlob;
    } else if (dataOrBlob instanceof Blob) {
      url = URL.createObjectURL(dataOrBlob);
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (!isDataUrl) {
      URL.revokeObjectURL(url);
    }
  }

  try {
    if (window.showSaveFilePicker) {
      const extension = fileName.split(".").pop();
      const options = {
        suggestedName: fileName,
        types: [{
          description: `${extension.toUpperCase()} 文件`,
          accept: { [mimeType]: [`.${extension}`] }
        }]
      };

      const handle = await window.showSaveFilePicker(options);
      const writable = await handle.createWritable();

      if (isDataUrl) {
        // 将 dataURL 转为 Blob
        const blob = await (await fetch(dataOrBlob)).blob();
        await writable.write(blob);
      } else if (dataOrBlob instanceof Blob) {
        await writable.write(dataOrBlob);
      } else {
        const blob = new Blob([dataOrBlob], { type: mimeType });
        await writable.write(blob);
      }

      await writable.close();
    } else {
      // Fallback for unsupported browsers
      downloadUsingLink();
    }
  } catch (error) {
    console.error("下载失败:", error);
    showError("下载失败或用户取消了操作。");
  }
}



// 显示警告框
function showAlert(message) {
  alertRefs["content"].innerHTML = message;
  alertTippyInstance.show();
}

// 动态加载 JS 脚本
// function loadScript(src, callback) {
//   const script = document.createElement("script");
//   script.src = src;
//   script.onload = callback;
//   document.body.appendChild(script);
// }

// 创建 FormData
function createFormData(data) {
  const formData = new FormData();
  Object.keys(data).forEach(key => formData.append(key, data[key]));
  return formData;
}

// ------

// 将模态框的 HTML 代码作为字符串插入到页面中
function createModal({ id, title, content = '', footerButtons = '', footerAlign = 'right' }) {
  const footerClass = footerButtons
    ? `modal__footer mt-4 flex justify-${footerAlign === 'center' ? 'center' : 'end'} gap-4`
    : 'hidden';

  return `
    <div data-id="wrapper" class="p-6 w-96">
          ${title ? `<header class="modal__header flex justify-between items-center">
            <h2 class="modal__title text-sm font-semibold">${title}</h2>
          </header>` : ''}
          <main class="">${content}</main>
          <footer class="${footerClass}">
            ${footerButtons}
          </footer>
    </div>
  `;
}

function insertModalHTML(target) {
  if(refs) return;
  refs = render('',()=>{
    // 加上印刷 pdf 提示，需要印刷时先导出高清 png，再使用在线工具转换为 pdf
    return createModal({
      // title: `<span data-id="export-modal-title"></span>`,
      content: `
        <div class="flex items-center">
          <label class="block mr-4 text-sm font-medium">文件名</label>
          <div class="flex items-center border border-slate-200 rounded-lg px-2 py-1 flex-grow">
            <input type="text" data-id="file-name-input" class="flex-grow p-1 border-none focus:outline-hidden" placeholder="请输入文件名">
            <span data-id="file-extension" class="ml-2 text-slate-500">.jpg</span>
          </div>
        </div>
        <div class="flex items-center mt-4">
          <label class="block mr-4 text-sm font-medium">格\u3000式</label>
          <div class="grid grid-cols-2 gap-2 fileTypes flex-grow">
            <button type="button" class="btn-sm btn-secondary" data-filetype="png">PNG(支持透明度)</button>
            <button type="button" class="btn-sm btn-secondary" data-filetype="jpg">JPG</button>
            <!--<button type="button" class="btn-sm btn-secondary" data-filetype="pdf">PDF(适合印刷)</button>-->
          </div>
        </div>
        
          <div class="flex items-center mt-4">
            <label class="block mr-4 text-sm font-medium">尺\u3000寸</label>
            <div data-id="size-multiplier" class="flex-grow"></div>
            <div class="text-slate-500 text-xs ml-2 w-4">倍</div>
          </div>
          

        <div class="flex items-center mt-4">
           <label class="block mr-4 text-sm font-medium">质\u3000量</label>
          <div data-id="quality" class="flex-grow"></div>
          <div class="text-slate-500 text-lg ml-2 w-4 cursor-pointer vicon-info" title="值越大，质量越高，文件越大。"></div>
        </div>
        <div class="flex items-center mt-4 gap-2 p-2 rounded-lg bg-slate-100 text-xs">
          <div data-id="canvas-size">
              ${exportCanvasConfig.width} x ${exportCanvasConfig.height} px
          </div>
          <hr class="h-4 border-slate-400 border-r">
          <div data-id="file-size">
            0.00 MB
          </div>
        </div>
        
        
        <div class="mt-4 text-sm text-slate-500 border-t border-slate-200 pt-4 leading-6">
          <p>如需印刷，可用高清 PNG，转成 PDF (CMYK)格式：</p>
          <p>1. 先下载高清 PNG；</p>
          <p>2. 在 <a href="https://www.photopea.com/" target="_blank" class="text-blue-500">Photopea</a> 中打开 PNG；</p>
          <p>3. 菜单栏 File > Export as > PDF (CMYK)导出即可。</p>
        </div>
      `,
      footerButtons: `
        <button data-id="export-cancel-btn" class="btn-secondary">取消</button>
        <button data-id="export-apply-btn" class="btn-primary">下载</button>
      `
    });
  },document.body);

  // 添加导出模态框
  alertRefs = render('',()=>{
    return createModal({
      id: 'alert-modal',
      // title: '透明背景检测',
      content: `
        <div data-id="content"></div>
      `,
      footerButtons: `
        <button data-id="export-jpg-btn" class="btn-secondary">继续 JPG</button>
        <button data-id="export-png-btn" class="btn-primary">导出 PNG</button>
      `
    });
  },document.body);

  tippyInstance = tippy(target||document.body, {
    content: refs.wrapper,
    trigger: 'manual',
    interactive: true,
    getReferenceClientRect: () => {
      if(currentButton){
        return currentButton.getBoundingClientRect();
      }
      return {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        right: 0,
        bottom: 0
      };
    },
    theme: 'light',
    arrow: false,
    placement: 'bottom',
    hideOnClick: false,
    appendTo: () => document.body,
    onClickOutside(instance, event) {
      const target = event.target;
      // 点击其它 tippy 实例，不关闭当前实例
      if (target.closest('[data-tippy-root]')) return;
      // 其他情况，关闭
      instance.hide();
    }
  });
  tippyInstance.hide();

  alertTippyInstance = tippy(target||document.body, {
    content: alertRefs.wrapper,
    trigger: 'manual',
    interactive: true,
    
    theme: 'light',
    arrow: false,
    placement: 'bottom',
    hideOnClick: false,
    onClickOutside(instance, event) {
      const target = event.target;
      // 点击其它 tippy 实例，不关闭当前实例
      if (target.closest('[data-tippy-root]')) return;
      // 其他情况，关闭
      instance.hide();
    }
  });
  alertTippyInstance.hide();
  

  initEvents();
  
}


// 把事件统一放到这里，避免重复绑定
const getQuickValues = () => {
  return [
    { value: 0.5, label: "0.5倍" },
    { value: 1, label: "原尺寸" },
    { value: 2, label: "2倍" },
    { value: 3, label: "3倍" },
    { value: 4, label: "4倍" },
  ];
}

function initEvents() {

  // 预测图片大小
  const predictSize = () => {
    const size = predictExportSize(canvas.getElement(), exportCanvasConfig, fileType, sizeMultiplier, quality);
    refs["file-size"].textContent = '预估：'+formatSize(size);
  }
  const throttledPredictSize = throttle(predictSize, 100);
  const debouncedPredictSize = debounce(throttledPredictSize, 100);
  updates.predictSize = predictSize;
  predictSize();

  const { update: updateSizeMultiplier } = elements.getGui(refs["size-multiplier"], "slider", {
    min: 0.5,
    max: 4,
    step: 0.01,
    quickValues: getQuickValues(),
    value: sizeMultiplier,
    onchange: (value) => {
      sizeMultiplier = value;
      refs["canvas-size"].textContent = `${Math.round(exportCanvasConfig.width * sizeMultiplier)} x ${Math.round(exportCanvasConfig.height * sizeMultiplier)} px`;
      // 预测图片大小
      debouncedPredictSize();
    },
  });
  updates.sizeMultiplier = updateSizeMultiplier;
  const { update: updateQuality } = elements.getGui(refs["quality"], "slider", {
    min: 0.5,
    max: 1,
    step: 0.01,
    quickValues: [
      {
        value: 0.5,
        label: "50%",
      },
      {
        value: 0.75,
        label: "75%",
      },
      {
        value: 0.95,
        label: "95%(默认)",
      },
      {
        value: 1,
        label: "100%",
      },
    ],
    value: quality,
    onchange: (value) => {
      quality = value;
      // 预测图片大小
      if (fileType === "jpg") {
        debouncedPredictSize();
      }
    },
  });
  updates.quality = updateQuality;

  updateFileSelectionUI(fileType);

  // 绑定导出按钮事件
  delegator.on(refs.wrapper, "click", "[data-filetype]", (event,target) => {
    fileType = target.dataset.filetype
    updateFileSelectionUI(fileType);
  });
  // 取消
  refs["export-cancel-btn"].addEventListener("click", () => {
    tippyInstance.hide();
  });

  refs["export-apply-btn"].addEventListener("click", () => {
    handleExport(fileType, sizeMultiplier, hasTransparentLayer);
  });
 alertRefs["export-png-btn"].addEventListener("click", () => {
    saveFile({  baseName: fileName, fileType: "png", sizeMultiplier });
    alertTippyInstance.hide();
  });
 alertRefs["export-jpg-btn"].addEventListener("click", () => {
    saveFile({  baseName: fileName, fileType: "jpg", sizeMultiplier });
    alertTippyInstance.hide();
  });
}
  
emitter.on('component:export-image', ({target, placement}) => {
  currentButton = target;
  insertModalHTML(target);
  openExportModal(target,placement);
});




