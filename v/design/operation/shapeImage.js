
import { delegator, emitter, showInfo, render, throttle, debounce } from "../../__common__/utils";

import fabric from "../fabric";
import { canvas, exportCanvasConfig } from "../canvas";
import lib from "../lib";
import { panel } from "../component/sidebar";
import elements from "../elements";

let refs = null;
let currentShape = null;
let updates = {};
let shape = "rectangle";
let selectedLetter = "A";
let aspectRatioEnabled = true;
let currentWidth = 0;
let currentHeight = 0;
let currentBorderWidth = 0;
let currentCornerRadius = 0;
let currentBlurWidth = 0;
// 定义支持的形状类型
const shapeTypes = [
  "rectangle", "roundRect", "circle", "diamond", "heart", "star5",
  "star6", "star12", "star24", "hexagon1", "hexagon2", "octagon1",
  "octagon2", "triangle-lb", "triangle-rt", "triangle-lt", "triangle-rb",
  "triangle-t", "triangle-b", "triangle-r", "triangle-l", "letter"
];
let intervalId = null;

  function startAction(action, canvas) {
    handlePanZoom(action, canvas); // 立即执行一次
    intervalId = setInterval(() => handlePanZoom(action, canvas), 100); // 持续执行
  }

  function stopAction() {
    if (intervalId) clearInterval(intervalId);
  }

  function handlePanZoom(action, canvas) {
    switch (action) {
      case "zoom-in":
        canvas.modifyObject("zoomBy-z", 4);
        break;
      case "zoom-out":
        canvas.modifyObject("zoomBy-z", -4);
        break;
      case "right":
        canvas.modifyObject("zoomBy-x", 4);
        break;
      case "left":
        canvas.modifyObject("zoomBy-x", -4);
        break;
      case "up":
        canvas.modifyObject("zoomBy-y", -4);
        break;
      case "down":
        canvas.modifyObject("zoomBy-y", 4);
        break;
      case "reset":
        canvas.modifyObject("zoomReset");
        break;
    }
  }

function renderUI(settings) {
  if (refs) {
    return;
  }
  refs = render('', () => {
    function t(title) {
      return `<h5 class="text-slate-700 text-sm py-2">${title}</h5>`;
    }
    function c(id, className) {
      let dataId = id?`data-id="${id}"`:'';
      return `<div ${dataId} class="${className}"></div>`;
    }
    const btnMap = {
      // 图标类、tiltle、tippy 位置
      'zoom-in': ['vicon-zoom-in', '放大', 'top'],
      'zoom-out': ['vicon-zoom-out', '缩小', 'bottom'],
      'up': ['vicon-small-arrow rotate-180', '上移', 'top'],
      'left': ['vicon-small-arrow rotate-90', '左移', 'left'],
      'reset': ['vicon-recenter', '重置', 'top'],
      'right': ['vicon-small-arrow -rotate-90', '右移', 'right'],
      'down': ['vicon-small-arrow', '下移', 'bottom'],
    };
    
    const btnClass = 'btn-icon bg-white active:scale-90 shadow-md';
    
    function getBtn(action) {
      const [icon, title, placement] = btnMap[action];
      return `<button class="${btnClass} ${icon}" data-id="${action}" title="${title || ''}" data-tippy-placement="${placement}"></button>`;
    }
    
    return [
      `<div data-id="wrapper" class="text-sm h-full overflow-auto">`,
      render.section("", [
        render.titleRow("长按按钮持续平移和缩放", ""),
        // `<p class="text-slate-500 text-xs pb-1">长按按钮持续平移和缩放</p>`,
        `<div class="bg-slate-100 p-4 rounded-lg space-x-3 flex items-center justify-center">
          <div class="rounded-lg space-y-3">
            <div class="flex justify-center">
              ${getBtn('up')}
            </div>
            <div class="flex justify-center gap-3">
              ${getBtn('left')}
              ${getBtn('reset')}
              ${getBtn('right')}
            </div>
            <div class="flex justify-center">
              ${getBtn('down')}
            </div>
          </div>
          <div class="flex flex-col justify-center gap-3">
            ${getBtn('zoom-in')}
            ${getBtn('zoom-out')}
          </div>
          </div>`,
      ]),

      render.section("", [
        render.titleRow("形状", ""),
        render.row("", "shapeChoices"),
      ]),

      render.section("letterSelectorWrapper", [
        render.titleRow("字母", "letterSelectorTitle"),
        render.row("", "letterSelector"),
      ]),

      render.section("", [
        render.titleRow("大小", "aspectRatioEnabled"),
        render.row("宽度", "widthSlider"),
        render.row("高度", "heightSlider"),
      ]),
      
      render.section("border", [
        render.titleRow("边框", "colorFieldset"),
        render.row("宽度", "borderWidthFieldset"),
        render.row("模糊", "blurWidthFieldset"),
      ]),

      render.section("cornerRadius", [
        // render.titleRow("圆角", "cornerRadiusFieldset"),
        render.row("圆角", "cornerRadiusFieldset"),
      ]),

      `</div>`


    ];

  }, panel.content);

  // 遍历配置数组生成各个设置项
  settings.forEach((setting) => {
    
    // 添加控件，保持原有逻辑不变
    const {update} = elements.getGui(refs[setting.id], setting.type, setting.guiProps);
      updates[setting.id] = update;
  });

  delegator.on(refs.wrapper, 'mousedown', '[data-id]', (e, target) => {
    const action = target.dataset.id;
    startAction(action, canvas);
  });
  delegator.on(refs.wrapper, 'mouseup', '[data-id]', (e, target) => {
    stopAction();
  });
  delegator.on(refs.wrapper, 'mouseleave', '[data-id]', (e, target) => {
    stopAction();
  });


}

// 打开形状编辑器的函数
const updateUI = async () => {

  shape = currentShape.shape;
  selectedLetter = "A";

  if (/^letter\-(.{1})/.test(currentShape.shape)) {
    selectedLetter = RegExp.$1;
    shape = "letter";
  }


  const letterChoices = {};
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    letterChoices[letter] = `<span class="w-full flex items-center justify-center rounded-full">${letter}</span>`;
  }

  for (let i = 48; i <= 57; i++) {
    const number = String.fromCharCode(i);
    letterChoices[number] = `<span class="w-full flex items-center justify-center rounded-full">${number}</span>`;
  }

  letterChoices["#"] = `<span class="w-full flex items-center justify-center rounded-full">#</span>`;


  currentWidth = (currentShape.type === "activeSelection" ? "" : Math.round(currentShape.getScaledWidth()));
  currentHeight = (currentShape.type === "activeSelection" ? "" : Math.round(currentShape.getScaledHeight()));
  currentBorderWidth = currentShape.ppWidth;
  currentCornerRadius = currentShape.cornerRadius;
  currentBlurWidth = currentShape.blurWidth;

  function createQuickValuesFromDimension(totalSize, type = "width") {
    const isHorizontal = type === "width" || type === "left";
    const isPosition = type === "left" || type === "top";
  
    const ratios = [
      [1, 12], [1, 6], [1, 4], [1, 3], [1, 2],
      [2, 3], [3, 4], [5, 6], [11, 12], [1, 1],
    ];
  
    // 如果是 left 或 top，还需要加一个 0 的比例
    if (isPosition) {
      ratios.unshift([0, 12]);
    }
  
    return ratios.map(([numerator, denominator]) => {
      const ratio = numerator / denominator;
      const value = Math.round(totalSize * ratio);
      const percent = Math.round(ratio * 100);
      const fractionLabel = `${numerator}/${denominator}`;
      const labelText = isPosition
        ? `偏移 ${fractionLabel} (${value}px / ${percent}%)`
        : `${fractionLabel} (${value}px / ${percent}%)`;
  
      const isImportant = ["1/2", "1/3", "2/3"].includes(fractionLabel);
      const svgSize = 24;
      const barLength = Math.round(ratio * svgSize);
      const barRemainder = svgSize - barLength;
  
      const svg = isHorizontal
        ? `<svg class="w-6 h-4 mr-1" viewBox="0 0 24 10" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="2" width="${barLength}" height="6" fill="currentColor"/>
            <rect x="${barLength}" y="2" width="${barRemainder}" height="6" fill="#e5e7eb"/>
          </svg>`
        : `<svg class="w-3 h-5 mr-1" viewBox="0 0 10 24" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="${svgSize - barLength}" width="6" height="${barLength}" fill="currentColor"/>
            <rect x="2" y="0" width="6" height="${svgSize - barLength}" fill="#e5e7eb"/>
          </svg>`;
  
      return {
        value: value,
        label: `
          <span class="flex items-center">
            ${svg}
            <span class="text-xs ${isImportant ? 'font-bold text-slate-900' : 'text-slate-700'}">
              ${labelText}
            </span>
          </span>
        `
      };
    });
  }

  const widthQuickValues = createQuickValuesFromDimension(exportCanvasConfig.width, "width");
  const heightQuickValues = createQuickValuesFromDimension(exportCanvasConfig.height, "height");

  const settings = [
    {
      id: 'letterSelector',
      type: 'radio',
      val: selectedLetter,
      guiProps: {
        class: "grid grid-cols-8 bg-slate-100 p-2 rounded gap-2",
        choices: letterChoices,
        onchange: (value) => {
          selectedLetter = value;
          updateShapeEditor();
        }
      }
    },
    {
      id: 'shapeChoices',
      type: 'radio',
      val: shape,
      guiProps: {
        class: "grid grid-cols-4 gap-2",
        choices: shapeTypes.reduce((acc, type) => {
          acc[type] = `
            <div class="bg-checkerboard m-1 p-1 cursor-pointer items-center" title="${type}">
              <img src="https://xiaomingyan.com/static/common/d.gif" data-src="https://xiaomingyan.com/static/v/design/shape-types/${type}.png"
              class="w-full m-auo">
            </div>
          `;
          return acc;
        }
          , {}),
        onchange: (value) => {
          shape = value;
          updateShapeEditor();
          toggleLetterSelector();
          toggleCornerRadius();
        },
      }
    },
    {
      id: 'widthSlider',
      type: 'slider',
      val: currentWidth,
      guiProps: {
        value: currentWidth,
        min: 10,
        max: exportCanvasConfig.width,
        inputMax: 2 * exportCanvasConfig.width,
        quickValues: widthQuickValues,
        step: 1,
        onchange: function(value){
          currentWidth = Math.round(value);
          updateShapeSize("width");
        },
      },
    },
    {
      id: 'aspectRatioEnabled',
      type: 'iosCheckbox',
      val: aspectRatioEnabled,
      guiProps: {
        checked: aspectRatioEnabled,
        label: "锁定比例",
        labelPosition: 'after',
        onchange: (checked) => {
          aspectRatioEnabled = checked;
        },
      },
      // guiProps: {
      //   class: "mx-2 flex items-center justify-center",
      //   choices: {
      //     aspectRatio: { 
      //       label: '<i title="保持纵横比" class="vicon-link text-2xl"></i>', 
      //       value: 'aspectRatio', 
      //       checked: aspectRatioEnabled 
      //     }
      //   },
      //   onchange: (name, checked) => {
      //     aspectRatioEnabled = checked;

      //     if (aspectRatioEnabled) {
      //       updateShapeSize("width");
      //     }
      //   }
      // }
    },
    {
      id: 'heightSlider',
      type: 'slider',
      val: currentHeight,
      guiProps: {
        value: currentHeight,
        min: 10,
        max: exportCanvasConfig.height,
        inputMax: 2 * exportCanvasConfig.height,
        quickValues: heightQuickValues,
        step: 1,
        onchange: function(value){
          currentHeight = Math.round(value);
          updateShapeSize("height");
        },
      }
    },
    {
      id: 'colorFieldset',
      type: 'colorButton',
      val: {
        color: currentShape.ppColor,
        
      },
      guiProps: {
        opacity: true,
        position: "top left",
        
        color: currentShape.ppColor,
        showTabs: ['solid'],
        onchange: (info) => {
          let color = info.fabricColor;
          canvas.apply(currentShape, (obj) => {
            obj.set("ppColor", color);
          }).requestRenderAll();
        },
      }
    },
    {
      id: 'borderWidthFieldset',
      type: 'slider',
      val: currentBorderWidth,
      guiProps: {
        value: currentBorderWidth,
        range: [0, Math.max(currentWidth, currentHeight)],
        inputMax: 9999, 
        onchange: (value) => {
          currentBorderWidth = value;
          canvas.apply(currentShape, (obj) => {
            obj.set("ppWidth", value);
          }).requestRenderAll();
        },
      }
    },
    {
      id: 'cornerRadiusFieldset',
      type: 'slider',
      val: currentCornerRadius,
      guiProps: {
        value: currentCornerRadius,
        range: [0, Math.max(currentWidth, currentHeight)],
        inputMax: 9999, 
        onchange: (value) => {
          currentCornerRadius = value;
          canvas.apply(currentShape, (obj) => {
            obj.set("cornerRadius", value);
          }).requestRenderAll();
        },
      }
    },
    {
      id: 'blurWidthFieldset',
      type: 'slider',
      val: currentBlurWidth,
      guiProps: {
        value: currentBlurWidth,
        range: [0, 50],
        onchange: (value) => {
          currentBlurWidth = value;
          canvas.apply(currentShape, (obj) => {
            obj.set("blurWidth", value);
          }).requestRenderAll();
        },
      }
    },

  ];

  if(refs){
    // 更新值
    settings.forEach((setting) => {
      const update = updates[setting.id];
      update(setting.val);
    })

  }else{
    // 渲染UI
    renderUI(settings)
  }

  



  // 更新形状编辑器
  const updateShapeEditor = debounce(() => {
    const selectedShape = shape === "letter" ? `letter-${selectedLetter}` : shape;
    canvas.apply(currentShape, (obj) => {
      obj.set("shape", selectedShape);
    }).requestRenderAll();
  }, 100);

  // 是否显示字母选择下拉框
  function toggleLetterSelector() {
    const show = shape === "letter";
    refs.letterSelectorWrapper.style.display = show ? "block" : "none";
  }

  toggleLetterSelector();

  // 是否显示圆角
  function toggleCornerRadius() {
    const show = shape === "roundRect";
    refs.cornerRadius.style.display = show ? "block" : "none";
  }

  toggleCornerRadius();



  // 宽高改变时更新形状
  const updateShapeSize = debounce((dimension) => {
    let value = 0;
    const newSize = { scaleX: 1, scaleY: 1 };

    if (dimension === "width") {
      value = currentWidth;
      if (!/^\d+$/.test(value) || value > 2 * exportCanvasConfig.width || value < 10) {
        
        showInfo("宽度必须是 10 到 2 倍画布宽度的整数");
        return;
      }
      newSize.width = +value;
      if (aspectRatioEnabled) {
        newSize.height = Math.round(value / (currentShape.orgWidth / currentShape.orgHeight));
        updates['heightSlider'](newSize.height);
        // heightSlider.value = newSize.height;
      }
    }

    if (dimension === "height") {
      value = currentHeight;
      if (!/^\d+$/.test(value) || value > 2 * exportCanvasConfig.height || value < 10) {
        showInfo("高度必须是 10 到 2 倍画布高度的整数");
        return;
      }
      newSize.height = +value;
      if (aspectRatioEnabled) {
        newSize.width = Math.round((currentShape.orgWidth / currentShape.orgHeight) * value);
        // widthSlider.value = newSize.width;
        updates['widthSlider'](newSize.width);
      }
    }

    // 更新宽度百分比
    // widthSlider.value = Math.min(200, Math.round((newSize.width / currentShape.orgWidth) * 100));
    canvas.apply(currentShape, (obj) => {
      obj.set(newSize).setCoords();
      // setCenter(); obj.setCenterToOrigin();
    });
  }, 100);

  panel.show('shapeImage', refs.wrapper, '图片编辑');
};



async function edit(shape) {
  currentShape = shape;
  updateUI();
}


emitter.on("operation:shapeImage:edit", (shape) => {
  edit(shape);
});



