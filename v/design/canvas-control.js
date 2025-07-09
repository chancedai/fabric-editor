import elements from "./elements.js";
import {
  delegator,
  emitter,
  throttle,
  debounce,
} from "../__common__/utils.js";
import "tippy.js/themes/light.css";
import Mousetrap from "mousetrap";

import { canvas, exportCanvasConfig, zoomCanvas, viewMargin } from "./canvas.js";


// 存储缩放比例
let canvasScaleType = "fit"; // 适应屏幕大小
let canvasScale = 1;
const canvasZoomListNode = document.querySelector("[data-id='zoomList']");
// const canvasZoomNode = document.querySelector("[data-id='zoomPercent']");
const canvasContainer = document.querySelector("#canvasContainer");
const parentContainer = canvasContainer.parentElement; // 获取父容器

const zoomSlider = document.querySelector("[data-id='zoomSlider']");

// 添加画布缩放控制
const MIN_SCALE = 0.1; // 最小缩放比例
const MAX_SCALE = 10;  // 最大缩放比例
const SCALE_STEP = 0.02; // 缩放步长

// 鼠标滚轮缩放
canvasContainer.addEventListener('wheel', (e) => {
  // 如果按住 Ctrl 键，则缩放画布
  if (!e.ctrlKey) {
    return;
  }
  
  e.preventDefault();
  
  // 计算缩放比例
  const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
  const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, canvasScale + delta));
  
  if (newScale !== canvasScale) {
    scaleCanvasContainer(newScale);
  }
});

// 触摸板双指缩放
let initialDistance = 0;
canvasContainer.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    initialDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
  }
});

canvasContainer.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2) {
    e.preventDefault();
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    
    // 计算缩放比例
    const scale = currentDistance / initialDistance;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, canvasScale * scale));
    
    if (newScale !== canvasScale) {
      scaleCanvasContainer(newScale);
      initialDistance = currentDistance;
    }
  }
});

const {update: sliderUpdate} = elements.getGui(zoomSlider, 'slider', {
  min: 10,
  max: 500,
  step: 1,
  value: 100,
  quickValues: [
    {
      value: 10,
      label: "10%",
    },
    {
      value: 25,
      label: "25%",
    },
    {
      value: 50,
      label: "50%",
    },
    {
      value: 75,
      label: "75%",
    },
    {
      value: 100,
      label: "100%",
    },
    {
      value: 150,
      label: "150%",
    },
    {
      value: 200,
      label: "200%",
    },
    {
      value: 300,
      label: "300%",
    },
    {
      value: 400,
      label: "400%",
    },
    {
      value: 500,
      label: "500%",
    },
    {
      value: '__fit',
      label: "适应屏幕",
    }
  ],
  onchange: throttle( (val) => {
    if (val === "__fit") {
      canvasScaleType = "fit";
      fitCanvasToParent();
      return;
    }
    const scale = val / 100;
    canvasScaleType = "scale";
    scaleCanvasContainer(scale, "slider");
  }, 100)
});


// 适应屏幕，缩放到适合父容器大小（带有一些空白），并且要保持宽高比例，不变形，宽度都不要超过父容器的宽度
function fitCanvasToParent() {
  if(canvasScaleType !== "fit"){
    return;
  }

  let scale = getCurrentScale();
  // 获取父容器的宽度和高度
  const parentWidth = parentContainer.clientWidth;
  const parentHeight = parentContainer.clientHeight;

  // 设置一个边距来保证 canvasContainer 周围有空白区域
  // const margin = 50 * scale;
  const width = parentWidth - viewMargin * 2;
  const height = parentHeight - viewMargin * 2;
  scale = Math.min(width / exportCanvasConfig.width, height / exportCanvasConfig.height);
  scaleCanvasContainer(scale);
}



// 获取当前的缩放比例
function getCurrentScale() {
  const transform = canvasContainer.style.transform;
  const match = transform.match(/scale\(([^)]+)\)/);
  return match ? parseFloat(match[1]) : 1; // 默认是 1（未缩放时）
}


function centerCanvasView(scaleFactor) {
  // 假设 canvas.getWidth/Height 比较慢，可缓存
  const canvasWidth = canvas.getWidth() * scaleFactor;
  const canvasHeight = canvas.getHeight() * scaleFactor;
  const containerWidth = canvasContainer.clientWidth;
  const containerHeight = canvasContainer.clientHeight;

  // 只在超出时滚动，避免多余操作
  if (canvasWidth > containerWidth) {
    canvasContainer.scrollLeft = (canvasWidth - containerWidth) / 2;
  }

  if (canvasHeight > containerHeight) {
    canvasContainer.scrollTop = (canvasHeight - containerHeight) / 2;
  }
}

function scaleCanvasContainer(scaleFactor, source) {
  scaleFactor = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleFactor));
  if (canvasScale === scaleFactor) return;

  canvasScale = scaleFactor;

  

  // 只更新 slider UI（非触发 onchange）
  if (source !== "slider") {
    sliderUpdate((scaleFactor * 100).toFixed(0));
  }

  // 滚动和居中操作放进 rAF，避免阻塞 UI
  // requestAnimationFrame(() => {
    zoomCanvas(scaleFactor); // 注意：这里是否做了重绘？是否可以延迟？
    centerCanvasView(scaleFactor);
  // });
}


const scrollContainer = canvasContainer.parentNode;
emitter.on("load:canvas:before", (event) => {
  setTimeout(() => {
    // fitCanvasToParent();
    canvasContainer.style.visibility = 'visible';
    // canvasContainer.parentElement.classList.remove("overflow-hidden");
  }, 16);
});
emitter.on('canvas:resize',()=>{
  fitCanvasToParent();
});
// fitCanvasToParent();
new ResizeObserver(throttle(() => {
  // 判断 scaleType
  if (canvasScaleType === "fit") {
    fitCanvasToParent();
  } else {
    // scaleCanvasContainer(canvasScale);
  }
  
  }, 16)
).observe(scrollContainer);

delegator.on(document.body, "click", "[data-id]", function (event, target) {
  const { id } = target.dataset;
  switch (id) {
    case "resize":
      emitter.emit("operation:resize-canvas:init");
      break;
    default:
      break;
  }
});
// 绑定放大，缩小，适合屏幕快捷键
// 使用 mod 代替 ctrl/cmd，兼容 macOS 和 Windows
// 返回 false 阻止浏览器默认行为
Mousetrap.bind("mod+=", () => {
  scaleCanvasContainer(canvasScale + 0.1, "slider");
  return false;
});
Mousetrap.bind("mod+-", () => {
  scaleCanvasContainer(canvasScale - 0.1, "slider");
  return false;
});
Mousetrap.bind("mod+0", () => {
  canvasScaleType = "fit";
  fitCanvasToParent();
  return false;
});