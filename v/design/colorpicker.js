import Pickr from "@simonwep/pickr";
import "@simonwep/pickr/dist/themes/nano.min.css";
import Grapick from "grapick";
import "grapick/dist/grapick.min.css";
import { debounce, delegator, emitter, render, stringToGradient, gradientToString, colorToImage, gradientToImage } from "/v/__common__/utils";
import tippy from "tippy.js";
import "tippy.js/themes/light.css";
import elements from "./elements";
import { panel } from './component/sidebar';
import { getFabricGradient } from "./canvas";
import { getSwatches } from "./canvas/colorProcessor";

function isPartiallyInViewport(el) {
  const rect = el.getBoundingClientRect();
  const windowHeight = (window.innerHeight || document.documentElement.clientHeight);
  const windowWidth = (window.innerWidth || document.documentElement.clientWidth);

  return (
    rect.top < windowHeight &&  // 元素顶部在视口底部之上
    rect.bottom > 0 &&          // 元素底部在视口顶部之下
    rect.left < windowWidth &&  // 元素左侧在视口右边之左
    rect.right > 0              // 元素右侧在视口左边之右
  );
}

const renderDocColors = debounce(
async function(){
  if(!refs){
    return;
  }
  if(!isPartiallyInViewport(refs.tabsContent)){
    return;
  }
  // colorpicker 显示就要计算颜色
  canvasColors = await getSwatches();
  if(!soildRefs || !soildRefs.docColorsContainer){
    return;
  }
  const docColorsContainer = soildRefs.docColorsContainer;
  if(!docColorsContainer){
    return;
  }
  
  if(canvasColors.length === 0){
    docColorsContainer.classList.add("hidden");
    return;
  }
  docColorsContainer.classList.remove("hidden");
  docColorsContainer.innerHTML = "";
  render(null, () => {
    return [
      getTitle("文档颜色", canvasColors.length > 0),
      getColorList(canvasColors, canvasColors.length > 0),
    ]
  }, docColorsContainer);
}, 100);

emitter.on("canvas:swatches:changed", renderDocColors);



// 常用颜色
const colors = {
  // 纯色
  solid: [
    "#000000",
    "#545454",
    "#737373",
    "#a6a6a6",
    "#d9d9d9",
    "#ffffff",
    "#ff3131",
    "#ff5757",
    "#ff66c4",
    "#cb6ce6",
    "#8c52ff",
    "#5e17eb",
    "#0097b2",
    "#0cc0df",
    "#5ce1e6",
    "#38b6ff",
    "#5271ff",
    "#004aad",
    "#00bf63",
    "#7ed957",
    "#c1ff72",
    "#ffde59",
    "#ffbd59",
    "#ff914d",
  ],
  // 线性
  linear: [
    "linear-gradient(90deg, #000000, #737373)",
    "linear-gradient(90deg, #000000, #c89116)",
    "linear-gradient(90deg, #000000, #3533cd)",
    "linear-gradient(90deg, #a6a6a6, #ffffff)",
    "linear-gradient(90deg, #fff7ad, #ffa9f9)",
    "linear-gradient(90deg, #cdffd8, #94b9ff)",
    "linear-gradient(90deg, #ff3131, #ff914d)",
    "linear-gradient(90deg, #ff5757, #8c52ff)",
    "linear-gradient(90deg, #5170ff, #ff66c4)",
    "linear-gradient(90deg, #004aad, #cb6ce6)",
    "linear-gradient(90deg, #8c52ff, #5ce1e6)",
    "linear-gradient(90deg, #5de0e6, #004aad)",
    "linear-gradient(90deg, #8c52ff, #00bf63)",
    "linear-gradient(90deg, #0097b2, #7ed957)",
    "linear-gradient(90deg, #0cc0df, #ffde59)",
    "linear-gradient(90deg, #ffde59, #ff914d)",
    "linear-gradient(90deg, #ff66c4, #ffde59)",
    "linear-gradient(90deg, #8c52ff, #ff914d)",
  ],
  // 径向
  radial: [
    "radial-gradient(circle at 50% 50%, #000000, #737373)",
    "radial-gradient(circle at 50% 50%, #000000, #c89116)",
    "radial-gradient(circle at 50% 50%, #000000, #3533cd)",
    "radial-gradient(circle at 50% 50%, #a6a6a6, #ffffff)",
    "radial-gradient(circle at 50% 50%, #fff7ad, #ffa9f9)",
    "radial-gradient(circle at 50% 50%, #cdffd8, #94b9ff)",
    "radial-gradient(circle at 50% 50%, #ff3131, #ff914d)",
    "radial-gradient(circle at 50% 50%, #ff5757, #8c52ff)",
    "radial-gradient(circle at 50% 50%, #5170ff, #ff66c4)",
    "radial-gradient(circle at 50% 50%, #004aad, #cb6ce6)",
    "radial-gradient(circle at 50% 50%, #8c52ff, #5ce1e6)",
    "radial-gradient(circle at 50% 50%, #5de0e6, #004aad)",
    "radial-gradient(circle at 50% 50%, #8c52ff, #00bf63)",
    "radial-gradient(circle at 50% 50%, #0097b2, #7ed957)",
    "radial-gradient(circle at 50% 50%, #0cc0df, #ffde59)",
    "radial-gradient(circle at 50% 50%, #ffde59, #ff914d)",
    "radial-gradient(circle at 50% 50%, #ff66c4, #ffde59)",
    "radial-gradient(circle at 50% 50%, #8c52ff, #ff914d)",
  ],
};
// 是否触发onchange
let triggerOnChange = true;
let canvasColors = [];
let container = null;
let refs = null;
let soildRefs = null;
let linearRefs = null;
let radialRefs = null;
let currentOldColor = '';
let currentPanelType = "solid";
let currentOnChange = null;
let tippyInstance = null;
let solidColorPicker = null;

let gradientTippyInstance = null;
let gradientColorPicker = null;
let gradientColorPickerButton = null;
let gradientColorPickerChange = null;

let hackButton = document.createElement("button");
let currentButton = null;
let inited = {};

let currentTabs = {
  solid: false,
  linear: true,
  radial: true,
};
let tabNames = {
  solid: "纯色",
  linear: "线性",
  radial: "径向",
};
// tab头部选中添加的类
const tabActiveClass = "bg-white text-slate-900 font-medium";
// tab内容选中添加的类
const panelActiveClass = "visible";

function getCallBackObject() {
  return {
    button: currentButton,
    type: currentPanelType,

  };
}

// 设置按钮背景色
function setColorAndType(button, color, type) {
  if (button) {
    if(!type){
      type = getTypeFromColor(color);
    }
    button.style.background = color;
    button.dataset.color = color;
    button.dataset.type = type;
  }
}



// 给pickr添加吸色笔按钮
function addEyeDropperButton(pickr) {
  const eyeDropperButton = document.createElement("button");
  eyeDropperButton.className =
    "vicon-color-picker text-xl bg-slate-200 p-0.5 rounded-full cursor-pointer hover:bg-slate-300";
  eyeDropperButton.style.marginTop = ".4em"; // 使用 Tailwind 设置按钮样式并定位
  // 将按钮插入到 Pickr 弹出层
  const pickrRoot = pickr.getRoot();
  pickrRoot.interaction.result.parentElement.insertBefore(
    eyeDropperButton,
    pickrRoot.interaction.result
  );
  // 吸色笔功能
  if (window.EyeDropper) {
    const eyeDropper = new EyeDropper();
    eyeDropperButton.addEventListener("click", async () => {
      try {
        const result = await eyeDropper.open();
        pickr.setColor(result.sRGBHex);
        // currentOnChange(result.sRGBHex);
        // setLastUsedColor(result.sRGBHex, "solid");
      } catch (err) {
        console.warn("吸色笔取消了", err);
      }
    });
  } else {
    eyeDropperButton.disabled = true;
    eyeDropperButton.title = "当前浏览器不支持吸色笔功能";
  }
}

function destroyColorPicker(picker) {
  if (picker) {
    try {
      picker.destroyAndRemove();
    }
    catch (e) {
      console.log("destroyColorPicker error", e);
    }
    picker = null;
  }
}


// 在点击按钮后，才 使用 render 初始化面板 html

function renderPanels(showTabs, activeTab = "solid") {
  function getTabsClass() {
    return `mx-4 grid grid-cols-${
      showTabs.length
    } gap-2 bg-slate-100 rounded-full p-1 ${
      showTabs.length > 1 ? "visible" : "hidden"
    }`;
  }
  const tabs = ["solid", "linear", "radial"];
  if (refs) {
    // 修改 grid-cols-
    refs.tabs.className = getTabsClass();
    // 根据 showTabs 重新渲染面板
    tabs.forEach((key) => {
      if (showTabs.includes(key)) {
        // refs[key + 'Panel'].classList.remove('hidden');
        refs[key + "Tab"].classList.remove("hidden");
      } else {
        // refs[key + 'Panel'].classList.add('hidden');
        refs[key + "Tab"].classList.add("hidden");
      }
    });
  } else {
    container = document.createElement("div");
    container.setAttribute("data-id", "wrapper");
    container.className = "w-full h-full flex flex-col pt-4 text-xs text-slate-800 bg-white";
    refs = render(
      null,
      () => {
        return [
          

          // 选项卡头部，纯色、线性、径向，不显示也生成，只是不显示
          `<div data-id="tabs" class="
          ${getTabsClass()}
          ">`,
          tabs
            .map((key) => {
              return `<button data-id="${key}Tab" class="cursor-pointer text-center text-sm rounded-full px-2 py-1 rounded hover:bg-white hover:opacity-80 ${
                key === activeTab ? tabActiveClass : ""
              }  ${
                showTabs.includes(key) ? "" : "hidden"
              }" data-type="${key}">${tabNames[key]}</button>`;
            })
            .join(""),
          `</div>`,
          `<div class="flex-1 overflow-hidden hover:overflow-y-auto">`,
          // 选项卡内容，纯色、线性、径向
          `<div data-id="tabsContent" class="w-96 px-4 pb-4">`,
          tabs
            .map((key) => {
              return `<div data-id="${key}Panel" class="py-3 ${
                key === activeTab ? panelActiveClass : "hidden"
              }">
              <div data-id="${key}Container" class=""></div>
            </div>`;
            })
            .join(""),
          `</div>`,
          // 最近使用颜色面板  lastUsedPanel
          `<div data-id="lastUsedPanel" class="py-2 hidden">`,
          `<div data-id="lastUsedContainer" class="flex flex-wrap space-x-2"></div>`,
          `</div>`,
          `</div>`,
        ];
      },
      container
    );

    // 绑定事件();
    delegator.on(container, "click", "[data-id]", (e) => {
      // 切换选项卡面板
      const {type} = e.target.dataset;
      // 使用 renderPanel 和 type 切换
      if (type) {
        currentPanelType = type;
        renderPanel(type);
      }
    });

    
  }
  renderDocColors();
}

// 最近使用颜色存在本地存储中，只存 16个颜色， color,type
function getLastUsedColors() {
  const lastUsedColors = localStorage.getItem("lastUsedColors");
  if (lastUsedColors) {
    return JSON.parse(lastUsedColors);
  }
  return [];
}
function setLastUsedColor(color, type) {
  const lastUsedColors = getLastUsedColors();
  // 如果颜色已经存在了，就不添加
  if (
    lastUsedColors.some((item) => item.color === color && item.type === type)
  ) {
    return;
  }
  // 如果超过16个颜色了，就删除第一个
  if (lastUsedColors.length >= 16) {
    lastUsedColors.shift();
  }
  lastUsedColors.push({ color, type });
  localStorage.setItem("lastUsedColors", JSON.stringify(lastUsedColors));
}

// 渲染最近使用颜色面板，没有的话隐藏
function renderLastUsedPanel() {
  const panel = refs.lastUsedPanel;
  const container = refs.lastUsedContainer;
  const lastUsedColors = getLastUsedColors();
  if (lastUsedColors.length === 0) {
    panel.style.display = "none";
    return;
  }
  panel.style.display = "";
  render(
    null,
    () => {
      return lastUsedColors
        .map((item) => {
          return `<div data-id="lastUsedColor" class="w-10 h-10 rounded-full" style="background: ${item.color};" data-color="${item.color}" data-type="${item.type}"></div>`;
        })
        .join("");
    },
    container
  );
}

function getTitle(title, show) {
  return render(null, () => {
    return `<h5 class="py-4 font-medium text-sm ${show ? "" : "hidden"}">${title}</h5>`;
  });
}
function getColorList(colors, show) {
  return render(null, () => {
    return `
      <div data-id="colorList" class="grid grid-cols-8 gap-2 ${
        show ? "" : "hidden"
      }">
        ${colors
          .map((color) => {
            return `<div data-id="color" data-color="${color}" class="w-10 h-10 rounded-full cursor-pointer shadow-lg" style="background: ${color};"></div>`;
          })
          .join("")}
      </div>
      `;
  });
}

function colorToRgba(color) {
  // 如果是 rgb(a) 格式，直接返回
  if (color.startsWith("rgb")) {
    return color;
  }
  // 如果是 hex 格式，转成 rgb(a) 格式
  if (color.startsWith("#")) {
    // 处理 hex 颜色值
    let r, g, b;
    if (color.length === 7) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    } else if (color.length === 4) {
      r = parseInt(color[1] + color[1], 16);
      g = parseInt(color[2] + color[2], 16);
      b = parseInt(color[3] + color[3], 16);
    } else {
      throw new Error("Invalid hex color format");
    }
    return `rgba(${r}, ${g}, ${b}, 1)`;
  }
  // 如果是其他格式，直接返回
  return color;
}

// 将 rgba 转换为 rgb
function rgbaToRgb(rgba) {
  if (!rgba) return '';
  if (typeof rgba === 'string') {
    // 如果是 rgba 字符串，提取 rgb 部分
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) {
      return `rgb(${match[1]}, ${match[2]}, ${match[3]})`;
    }
    return rgba;
  }
  // 如果是 Color 对象
  if (typeof rgba.toRGBA === 'function') {
    const rgbaStr = rgba.toRGBA().toString();
    return rgbaToRgb(rgbaStr);
  }
  return '';
}

// 初始化 gradientColorPicker
function initGradientColorPicker(btn, color, onchange) {
  gradientColorPickerButton = btn;
  gradientColorPickerChange = onchange;
  if(!gradientTippyInstance){
    window.div = document.createElement('div');
    gradientTippyInstance = tippy(document.body, {
      content: div,
      arrow: false,
      theme: "light",
      trigger: "manual",
      interactive: true,
      placement: "bottom",
      hideOnClick: true,
      appendTo: document.body,
      getReferenceClientRect: () => {
        return gradientColorPickerButton.getBoundingClientRect();
      },
      // onClickOutside(instance, event) {
      //   // const target = event.target;
      //   // // 如果  tartget 是在 .pcr-app 内不关闭
      //   // if (target.closest(".pcr-app" || target === gradientColorPickerButton)) {
      //   //   return;
      //   // }else{
          
      //   // }
      //   instance.hide();
      // },
      onShow(instance) {
       
      },
      onHide(instance) {
        
      },
    });
    gradientColorPicker = Pickr.create({
      el: div,
      theme: "nano",
      default: color,
      appClass: '!w-full shadow-sm !rounded !visible !opacity-100',
  
      // swatches: colors.solid,

      swatches: canvasColors,
      useAsButton: true,
      inline: true,
      components: {
        preview: true,
        opacity: true,
        hue: true,
        showAlways: true,
        interaction: {
          // hex: true,
          // rgba: true,
          input: true,
          // clear: true,
          save: false,
        },
      },
    });
    addEyeDropperButton(gradientColorPicker);
    gradientColorPicker.on("change", (color)=>{
      gradientColorPickerChange(color);
    });

  }
  window.tt = gradientColorPicker.setColor;
  // gradientColorPicker._nanopop.update(btn);
  if(gradientColorPicker && gradientColorPicker._root){
    gradientColorPicker.setColor(color);
  }
  gradientTippyInstance.hide();
  gradientTippyInstance.show();
}

// 初始化纯色面板，选择颜色，画布颜色
async function initSolidPanel(color) {
  const container = refs.solidContainer;

  // 渲染纯色面板
  soildRefs = render(
    null,
    () => {
      return [
        // 选择颜色按钮、画布颜色列表、常用颜色列表
        // `<button title="选择颜色" data-id="solidColorBtn" class="w-10 h-10 rounded-full shadow-lg bg-colorpicker cursor-pointer flex items-center justify-center">
        //   <i class="vicon-zoom-in bg-white font-bold text-xs rounded-full p-0.5"></i>
        // </button>`,
        // picker 
        `<div data-id="colorPickerContainer" class="hidden"></div>`,
          // 文档颜色
        `<div data-id="docColorsContainer" class="hidden"></div>`,
        // 常用颜色标题+列表
        getTitle("常用颜色", colors.solid.length > 0),
        // 常用颜色列表
        getColorList(colors.solid, colors.solid.length > 0),
        
      ];
    },
    container
  );

  // 使用 pickr 渲染颜色选择器
  const colorPickerContainer = soildRefs.colorPickerContainer;
  solidColorPicker = Pickr.create({
    el: colorPickerContainer,
    theme: "nano",
    default: color || "#000000",
    appClass: "!w-full shadow-sm !rounded !visible !opacity-100",
    // swatches: colors.solid,
    useAsButton: true,
    inline: true,
    components: {
      preview: true,
      opacity: true,
      hue: true,
      showAlways: true,
      interaction: {
        // hex: true,
        // rgba: true,
        input: true,
        // clear: true,
        save: false,
      },
    },
  });
  addEyeDropperButton(solidColorPicker);
  // solidColorPicker.setColorRepresentation(H");

  solidColorPicker.on("change", function(color){
    currentOnChange(color.toHEXA().toString());
  });

  // 有时更新颜色不需要触发 onchange，如刚显示面板时，切换面板时
  updateFunctions.solid = function (color) {
    
    const type = getTypeFromColor(color);
    if(type !== "solid") {
      return;
    }
    // 天然的不会触发 change 事件
    solidColorPicker.setColor(color);
  };

  // 如果 color 的 type 不是 solid，则随机从 colors.solid 中取一个
  if (!color || getTypeFromColor(color) !== "solid") {
    const randomIndex = Math.floor(Math.random() * colors.solid.length);
    color = colors.solid[randomIndex];
  }
  updateFunctions.solid(color, false);

  delegator.on(container, "click", '[data-id="color"]', (e, target) => {
    const color = target.dataset.color;
    updateFunctions.solid(color);
  });

  renderDocColors();


}

async function initLinearPanel(color) {
  const container = refs.linearContainer;
  linearRefs = render(
    null,
    () => {
      return [
        // 使用 Grapick 渲染线性渐变面板
        // 渲染线性渐变
        `<div data-id="linearGrapickContainer" class="w-full py-4 bg-slate-100 rounded"></div>`,
        // 角度 slider
        `<div data-id="linearSliderContainer" class="flex items-center space-x-2 mt-2">`,
        // 角度不换行
        `<span class="whitespace-nowrap text-sm font-medium">角度</span>`,
        `<div data-id="linearSlider" class="w-full"></div>`,
        `</div>`,
        `<div data-id="linearPreview" class="w-full h-24 mt-4 bg-checkerboard border border-slate-200 rounded"></div>`,
        getTitle("常用颜色", colors.linear.length > 0),
        // 常用颜色列表
        getColorList(colors.linear, colors.linear.length > 0),
      ];
    },
    container
  );
  let cssGradient = '';
  const updatePreview = () => {
    const colors = linearGrapick.getColorValue();
    const preview = linearRefs.linearPreview;
    
    if(colors) {
      cssGradient = `${linearGrapick.getType()}-gradient(${linearGrapick.getDirection()}, ${colors})`;
    }
    preview.style.background = cssGradient;
  };
  const callback = function(){
    updatePreview();
    currentOnChange(cssGradient);
  };
  

  // 初始化线性渐变面板
  const linearGrapickContainer = linearRefs.linearGrapickContainer;
  const linearSlider = linearRefs.linearSlider;
  const { update: linearSliderUpdate } =  elements.getGui(linearSlider, "slider", {
    value: 90,
    min: 0,
    max: 360,
    onchange: function (newValue) {
      const orientation = newValue;
      linearGrapick.setDirection(orientation + "deg");
      // updatePreview();
    },
  });

  // 渲染线性渐变
  const linearGrapick = new Grapick({
    el: linearGrapickContainer,
    colorEl:
      '<button data-id="colorpicker" class="w-4 h-4 -ml-1.5 bg-white rounded-full border border-slate-200 shadow-lg"></button>',
  });
  linearGrapick.setColorPicker((handler) => {
    const button = handler.getEl().querySelector('[data-id="colorpicker"]');
    button.addEventListener("click", (e) => {
      let color = handler.getColor();
      color = rgbaToRgb(color);
      initGradientColorPicker(button, color, function(color) {
        handler.setColor(color.toRGBA().toString());
        // updatePreview();
      });
    });
  });
  linearGrapick.setType("linear");
  linearGrapick.setDirection("90deg");
  linearGrapick.on("change", debounce(callback, 100));

  updateFunctions.linear = function (color, change = true) {
    triggerOnChange = change;
    const type = getTypeFromColor(color);
    if(!color) {
      return;
    }
    if(type !== "linear") {
      return;
    }
    linearGrapick.clear();
    const gradient = stringToGradient(color);
    gradient.colorStops.forEach((stop, index) => {
      linearGrapick.addHandler(stop.offset * 100, stop.color);
    });
    // 设置角度
    if (gradient.type === "linear") {
      linearGrapick.setDirection(gradient.angle + "deg");
      linearSliderUpdate(gradient.angle);
    } else {
      linearGrapick.setDirection("90deg");
      linearSliderUpdate(90);
    }
  }

  // 如果 color 的 type 不是 linear，则随机从 colors.linear 中取一个
  if (!color || getTypeFromColor(color) !== "linear") {
    const randomIndex = Math.floor(Math.random() * colors.linear.length);
    color = colors.linear[randomIndex];
  }
  updateFunctions.linear(color, false);

  // 点击颜色列表，设置颜色
  delegator.on(container, "click", '[data-id="color"]', (e, target) => {
    const color = target.dataset.color;
    // color 格式类似 linear-gradient(90deg, #000000, #737373)，要使用 setDirection addHandler(position, color, select) 来设置
     updateFunctions.linear(color);

  });
  
  // 通过点击 linearPreview 位置设置角度
  linearRefs.linearPreview.addEventListener("click", (e) => {
    const rect = linearRefs.linearPreview.getBoundingClientRect();
    // 0 - 360
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    let degree = Math.atan2(dy, dx) * (180 / Math.PI);
    // 要整数
    degree = Math.round(degree);
    // 角度范围 0 - 360
    degree = (degree + 360) % 360;
    linearGrapick.setDirection(degree + "deg");
    linearSliderUpdate(degree);
    callback();
  });
}

async function initRadialPanel(color) {
  let radialShape = "circle";
  let radialSize = "closest-side";
  let radialCenterX = 50;
  let radialCenterY = 50;
  // 渲染径向渐变面板
  const container = refs.radialContainer;
  radialRefs = render(
    null,
    () => {
      return [
        // 使用 Grapick 渲染径向渐变面板
        // 渲染径向渐变
        `<div data-id="radialGrapickContainer" class="w-full py-4 bg-slate-100 rounded"></div>`,
        // 半径选择 最近边、最远边、最近角、最远角
        `<div data-id="radialSizeContainer" class="flex items-center space-x-2 mt-2">`,
        `<span class="whitespace-nowrap text-sm font-medium">半径</span>`,
        `<div data-id="radialSizeRadioContainer" class="flex items-center space-x-2">
          </div>`,
        `</div>`,
        // 中心点 slider
        `<div data-id="radialCenterXContainer" class="flex items-center space-x-2 mt-2">`,
        `<span class="whitespace-nowrap text-sm font-medium">中心点X</span>`,
        `<div data-id="radialCenterXSlider" class="w-full"></div>`,
        `</div>`,
        `<div data-id="radialCenterYContainer" class="flex items-center space-x-2 mt-2">`,
        `<span class="whitespace-nowrap text-sm font-medium">中心点Y</span>`,
        `<div data-id="radialCenterYSlider" class="w-full"></div>`,
        `</div>`,
        `<div data-id="radialPreview" class="w-full h-24 mt-4 bg-checkerboard border border-slate-200 rounded"></div>`,
        getTitle("常用颜色", colors.radial.length > 0),
        // 常用颜色列表
        getColorList(colors.radial, colors.radial.length > 0),
      ];
    },
    container
  );

  let cssGradient = '';
  const updatePreview = () => {
    const colors = radialGrapick.getColorValue();
    const preview = radialRefs.radialPreview;
    
    if(colors){
      cssGradient = `${radialGrapick.getType()}-gradient(${radialShape} ${radialSize} at ${radialCenterX}% ${radialCenterY}%, ${colors})`;
    }
    preview.style.background = cssGradient;
  };
  const callback = function(){
    updatePreview();
    currentOnChange(cssGradient);
  };
  // 渲染径向渐变
  const radialGrapickContainer = radialRefs.radialGrapickContainer;
  const radialGrapick = new Grapick({
    el: radialGrapickContainer,
    colorEl:
      '<button data-id="colorpicker" class="w-4 h-4 -ml-1.5 bg-white rounded-full border border-slate-200 shadow-lg"></button>',
  });
  radialGrapick.setColorPicker((handler) => {
    const button = handler.getEl().querySelector('[data-id="colorpicker"]');
    button.addEventListener("click", (e) => {
      let color = handler.getColor();
      color = rgbaToRgb(color);
      initGradientColorPicker(button, color, function(color){
        handler.setColor(color.toRGBA().toString());
        // updatePreview();
      });
    });
  });
  radialGrapick.setType("radial");
  radialGrapick.setDirection("90deg");
  // radialGrapick.setPosition('50% 50%');
  radialGrapick.on("change", debounce(callback, 100));

  // 径向渐变半径选择 导出的是update，需要改名为 updateSize

  const { update: updateSize } = elements.getGui(
    radialRefs.radialSizeRadioContainer,
    "radio",
    {
      //  elements.getGui(radialRefs.radialSizeRadioContainer, "radio", {
      choices: {
        "closest-side": "<span class='px-2 font-normal'>最近边</span>",
        "farthest-side": "<span class='px-2 font-normal'>最远边</span>",
        "closest-corner": "<span class='px-2 font-normal'>最近角</span>",
        "farthest-corner": "<span class='px-2 font-normal'>最远角</span>",
      },
      default: "closest-side",
      onchange: function (value) {
        radialSize = value;
        callback();
      },
    }
  );

  // 径向渐变中心点
  const { update: updateCenterX } = elements.getGui(
    radialRefs.radialCenterXSlider,
    "slider",
    {
      // elements.getGui(radialRefs.radialCenterXSlider, "slider", {
      value: 50,
      min: 0,
      max: 100,
      onchange: function (newValue) {
        radialCenterX = newValue;
        callback();
      },
    }
  );
  const { update: updateCenterY } = elements.getGui(
    radialRefs.radialCenterYSlider,
    "slider",
    {
      // elements.getGui(radialRefs.radialCenterYSlider, "slider", {
      value: 50,
      min: 0,
      max: 100,
      onchange: function (newValue) {
        radialCenterY = newValue;
        callback();
      },
    }
  );

  // 通过点击 radialPreview 位置设置中心点
  
  radialRefs.radialPreview.addEventListener("click", (e) => {
    const rect = radialRefs.radialPreview.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let centerX = (x / rect.width) * 100;
    let centerY = (y / rect.height) * 100;
    // 要整数
    centerX = Math.round(centerX);
    centerY = Math.round(centerY);
    radialCenterX = centerX;
    radialCenterY = centerY;
    updateCenterX(centerX);
    updateCenterY(centerY);
    callback();
  });

  updateFunctions.radial = function (color, change = true) {
    triggerOnChange = change;
    const type = getTypeFromColor(color);
    if (type !== "radial") {
      return;
    }
    radialGrapick.clear();
    const gradient = stringToGradient(color);
    gradient.colorStops.forEach((stop, index) => {
      radialGrapick.addHandler(stop.offset * 100, stop.color);
    });
    // 设置半径
    if (gradient.extent) {
      radialSize = gradient.extent;
      updateSize(radialSize);
    } else {
      radialSize = "closest-side";
      updateSize(radialSize);
    }
    // 设置形状
    if (gradient.shape) {
      radialShape = gradient.shape;
    } else {
      radialShape = "circle";
    }
    // 设置中心点
    if (gradient.radialPosition) {
      radialCenterX = gradient.radialPosition.x * 100;
      radialCenterY = gradient.radialPosition.y * 100;
    } else {
      radialCenterX = 50;
      radialCenterY = 50;
    }
    updateCenterX(radialCenterX);
    updateCenterY(radialCenterY);
  }

  // 如果color 的 type 不是 radial，就随机从 colors.radial 中取一个
  if (!color || getTypeFromColor(color) !== "radial") {
    const randomIndex = Math.floor(Math.random() * colors.radial.length);
    color = colors.radial[randomIndex];
  }
  updateFunctions.radial(color, false);

  // 点击颜色列表，设置颜色
  delegator.on(container, "click", '[data-id="color"]', (e, target) => {
    const color = target.dataset.color;

    updateFunctions.radial(color);
  });
}

const initFunctions = {
  solid: initSolidPanel,
  linear: initLinearPanel,
  radial: initRadialPanel,
};

const updateFunctions = {
  solid: function(){},
  linear: function(){},
  radial: function(){}
};

function getColorAndType(button) {
  const color = button.dataset.color;
  let type = button.dataset.type;
  if(!type) {
    type = getTypeFromColor(color);
  }
  return { color, type };
}

function getTypeFromColor(color) {
  if(!color){
    return 'solid';
  }
  if (color.startsWith("linear-gradient")) {
    return "linear";
  } else if (color.startsWith("radial-gradient")) {
    return "radial";
  } else {
    return "solid";
  }
}

// 如果对应的面板没初始化就渲染并初始化
function renderPanel(tabType,color) {
  // 初始化
  if (!inited[tabType]) {
    inited[tabType] = true;
    const initFunction = initFunctions[tabType];
    if (initFunction) {
      initFunction(color);
    }

  }
  else if(color){
    const updateFunction = updateFunctions[tabType];
    if (updateFunction) {
      // 不触发 onchange
      updateFunction(color, false);
    }
  }

  const tabClassList = tabActiveClass.split(" ");
  const panelClassList = panelActiveClass.split(" ");

  // 显示
  for (const key in currentTabs) {
    const tab = refs[`${key}Tab`];
    const panel = refs[`${key}Panel`];

    if (key !== tabType) {
      currentTabs[key] = false;
      tab.classList.remove(...tabClassList);
      panel.classList.remove(...panelClassList);
      panel.classList.add("hidden");
    } else {
      currentTabs[key] = true;
      tab.classList.add(...tabClassList);
      panel.classList.remove("hidden");
      panel.classList.add(...panelClassList);
    }
  }
  // if(tabType === 'solid'){
  //   // 纯色面板
  //   solidColorPicker.show();
  //   // renderLastUsedPanel();
  // }
}

function toggle(
  { button, color, type, showTabs, onchange,panelTitle, panelType }
) {

  showTabs = showTabs || ["solid", "linear", "radial"];
  color = gradientToString(color);
  currentOldColor = color;
  if(!type){
    type = getTypeFromColor(color);
  }
  currentPanelType = type;

  // 封装回调函数及其信息
  currentOnChange = debounce(function(color){
    if(!triggerOnChange) {
      triggerOnChange = true;
      return;
    }
    
    const type = getTypeFromColor(color);
    setColorAndType(button, color, type);
    if (typeof onchange !== "function") {
      return;
    }
    
    const callbackObject = {
      ...getCallBackObject(),
      color,
      type
    }
    // 如果 type 为 linear 或 radial，color 为线性渐变或径向渐变,添加一个 gradient 对象
    if (type === "linear" || type === "radial") {
      const gradient = stringToGradient(color);
      callbackObject.gradient = gradient;
      callbackObject.fabricColor = getFabricGradient(gradient);
      callbackObject.toImage = function(width, height){
        return gradientToImage(gradient, width|| 100, height || 100);
      };
    }else if (type === "solid") {
      callbackObject.fabricColor = color;
      callbackObject.toImage = function(width, height){
        return colorToImage(color, width|| 100, height || 100);
      };
    }
    
    onchange.apply( callbackObject, [callbackObject]);
  },100);

  // button = button || document.body;
  button = button || hackButton;

  renderPanels(showTabs, currentPanelType);

  // 如果传入了面板，就让 container 在面板中显示，panel有 panel.show('colorpicker', container, '选择颜色')方法，和 panel.hide 方法
  if (panelType) {
    // if(panel.getType() == 'colorpicker'){
    //   panel.hide();
    // }else{
      panel.show(panelType||'colorpicker', container, panelTitle||'选择颜色');
      renderPanel(currentPanelType, currentOldColor);
    // }
    currentButton = button;
    return;
  }

  // 把 container 从父级中移除，重新添加到 body 中
  
  // 重新添加到 body 中
  // document.body.appendChild(container);
  
  container.style.display = "";
  
  if (!tippyInstance) {
    tippyInstance = tippy(button, {
      content: container,
      arrow: false,
      theme: "light",
      trigger: "manual",
      interactive: true,
      placement: "bottom-start",
      hideOnClick: false,
      appendTo: document.body,
      getReferenceClientRect: () => {
        return currentButton.getBoundingClientRect();
      },
      onClickOutside(instance, event) {
        const target = event.target;
        // 如果  tartget 是在 .pcr-app 内不关闭
        if (target.closest(".pcr-app" || target === currentButton)) {
          return;
        }else{
          instance.hide();
        }
      },
      onShow(instance) {
        // 通过 type 来判断显示哪个面板
        renderPanel(currentPanelType, currentOldColor);
        // 计算触发点距离，避免显示不全
        const rect = instance.reference.getBoundingClientRect();
        const top = rect.top;
        const left = rect.left;
        const width = rect.width;
        const height = rect.height;
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        let maxHeight = windowHeight - top - height;
        let maxWidth = windowWidth - left - width;
        if(maxHeight < 0){
          maxHeight = 0;
        }
        if(maxWidth < 0){
          maxWidth = 0;
        }
        if(maxHeight > 0){
          instance.popper.style.maxHeight = maxHeight + 'px';
        }
        if(maxWidth > 0){
          instance.popper.style.maxWidth = maxWidth + 'px';
        }
        // overflow auto 
        instance.popper.style.overflow = 'auto';


        // show 时绑定 onchange 事件
      },
      onHide(instance) {
        // 隐藏时解绑 onchange 事件
        // 清除最大高度
        instance.popper.style.maxHeight = '';
        instance.popper.style.maxWidth = '';
        instance.popper.style.overflow = '';
      },
    });
  }

  if(tippyInstance.popper.querySelector('.tippy-content').firstChild !== container){
    tippyInstance.setContent('');
    tippyInstance.setContent(container);
  }

  // button !== tippyInstance.reference 如果是不同按钮，就重新绑定，且一定显示
  if (button !== currentButton) {
    // 先隐藏再显示，相当于重新定位
    tippyInstance.hide();
    tippyInstance.show();
  } else {
    if (tippyInstance.state.isVisible) {
      // 如果面板已经显示，就隐藏
      tippyInstance.hide();
    } else {
      tippyInstance.show();
    }
  }
  currentButton = button;
}

// 传入按钮 button, color, type, tabs, onchange 初始化，绑定事件，设置 button 背景色等
function initColorPicker(
  { button, color, type, showTabs, onchange, clz, panelTitle,panelType }
) {
  // 判断 button 是否存在
  if (!button) {
    console.error("button is null");
    return;
  }
  color = gradientToString(color);
  if (!type) {
    type = getTypeFromColor(color);
  }

  setColorAndType(button, color, type);

  // 判断button 是否绑定过click 事件
  if (button.dataset.click) {
    return;
  } else {
    button.dataset.click = true;
    if(clz){
      button.classList.add(...clz.split(" "));
    }
    button.addEventListener("click", function () {
      const { color, type } = getColorAndType(button);
      toggle({
        button,
        color,
        type,
        showTabs,
        onchange,
        panelTitle,
        panelType
      });
    });
  }
  return {
    update: function (newColor, newType) {
      newColor = gradientToString(newColor);
      setColorAndType(button, newColor, newType);
    },
  };
}

export default {
  initColorPicker,
  getColorAndType,
  toggle,
  gradientToString,
  stringToGradient,
};
