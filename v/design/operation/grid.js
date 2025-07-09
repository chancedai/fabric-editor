
import { canvas} from "../canvas";

import { delegator, emitter,showInfo } from "../../__common__/utils";


{/* <div class="min-w-max py-1"><div class="px-4 py-2 cursor-pointer rounded-lg hover:bg-slate-100" data-size="undefined" data-id="toggleAlignGuides">对齐辅助线</div><div class="px-4 py-2 cursor-pointer rounded-lg hover:bg-slate-100" data-size="0" data-id="applyGrid">关闭</div><div class="px-4 py-2 cursor-pointer rounded-lg hover:bg-slate-100" data-size="25" data-id="applyGrid,25">25x25</div><div class="px-4 py-2 cursor-pointer rounded-lg hover:bg-slate-100" data-size="50" data-id="applyGrid,50">50x50</div><div class="px-4 py-2 cursor-pointer rounded-lg hover:bg-slate-100" data-size="75" data-id="applyGrid,75">75x75</div><div class="px-4 py-2 cursor-pointer rounded-lg hover:bg-slate-100" data-size="100" data-id="applyGrid,100">100x100</div></div> */}
// 全局变量：保存当前的网格前景
let gridOverlayElement = null;


/**
 * 应用网格效果
 * @param {number} gridSize - 网格的尺寸（非0时启用网格）
 * @param {Object} settings - 包含当前设置，比如 zoom（缩放级别）
 */
function applyGrid(gridSize, settings) {


  // 如果已有网格前景，则移除之
  if (gridOverlayElement) {
    gridOverlayElement.remove();
    gridOverlayElement = null;
  }

  // 移除“网格尺寸”下拉菜单中所有已选中的打钩图标
  document
    .querySelectorAll("#gridMenu > div[data-size] .vicon-check")
    .forEach(checkIcon => checkIcon.remove());

  // 在当前选中的网格尺寸项后添加打钩图标
  const gridMenuItem = document.querySelector(
    `#gridMenu div[data-size="${gridSize}"]`
  );
  if (gridMenuItem) {
    gridMenuItem.insertAdjacentHTML("beforeend", '<i class="vicon-check"></i>');
  }

  // 如果 gridSize 大于 0，则计算网格间距，并创建新的网格前景
  if (gridSize > 0) {
    const gridSpacing = Math.round(gridSize * settings.zoom);

    // 创建一个 div 元素作为网格前景
    gridOverlayElement = document.createElement("div");
    gridOverlayElement.id = "gridLines";
    gridOverlayElement.classList.add("absolute", "top-0", "left-0", "w-full", "h-full");
    // 使用 data-* 属性记录网格尺寸
    gridOverlayElement.setAttribute("data-size", gridSize);
    // 设置背景样式，实现水平和垂直方向上的重复线条效果
    gridOverlayElement.style.backgroundSize = `${gridSpacing}px ${gridSpacing}px`;
    gridOverlayElement.style.backgroundImage =
      `repeating-linear-gradient(0deg, #aaa, #aaa 1px, transparent 1px, transparent ${gridSpacing}px), ` +
      `repeating-linear-gradient(-90deg, #aaa, #aaa 1px, transparent 1px, transparent ${gridSpacing}px)`;

    // 找到 canvas.lower-canvas 元素，并在其后插入网格前景
    const lowerCanvas = document.querySelector("canvas.lower-canvas");
    if (lowerCanvas && lowerCanvas.parentNode) {
      lowerCanvas.parentNode.insertBefore(gridOverlayElement, lowerCanvas.nextSibling);
    }
  }
}


// let alignGuideLinesInit = false;
// let alignGuideLinesIsActive = false;
// function toggleAlignGuides(showTip = true) {
//   // 关闭网格状态
  

//   // 如果 AlignGuideLines 未初始化，则初始化之
//   if (!alignGuideLinesInit) {
//     AlignGuideLines.init(canvas);
//     alignGuideLinesInit = true;
//   }

//   if (alignGuideLinesIsActive) {
//     // 禁用对齐辅助线
//     AlignGuideLines.disable();
//      // 移除“对齐辅助线”菜单项中的打钩图标
//      const checkIcon = document.querySelector('#gridMenu [data-id="toggleAlignGuides"] .vicon-check');
//      if (checkIcon) {
//        checkIcon.remove();
//      }
//     if (showTip) {
//       showInfo("对齐辅助线已禁用");
//     }

//     alignGuideLinesIsActive = false;
    
//   } else {
//     // 启用对齐辅助线
//     AlignGuideLines.enable();
//    // 在“对齐辅助线”菜单项后添加打钩图标
//    const alignGuideItem = document.querySelector('#gridMenu [data-id="toggleAlignGuides"]');
//    if (alignGuideItem) {
//      alignGuideItem.insertAdjacentHTML("beforeend", '<i class="vicon-check"></i>');
//    }
//     if (showTip) {
//       showInfo("对齐辅助线已启用");
//     }

//     alignGuideLinesIsActive = true;
    
//   }
// }

// if(type === 'toggleAlignGuides') {
//   emitter.emit('operation:grid:toggleAlignGuides');
// }else if(type === 'applyGrid') {
//   emitter.emit('operation:grid:applyGrid', value);
// }

emitter.on("operation:grid:applyGrid", (gridSize) => {
  applyGrid(gridSize, { zoom: 1 });
});

// emitter.on("operation:grid:toggleAlignGuides", () => {
//   toggleAlignGuides();
// });

// // 默认开启对齐辅助线
// toggleAlignGuides(false);

