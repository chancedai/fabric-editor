

import { render } from "../../__common__/utils";
import { canvas, } from "../canvas";
import lib from "../lib";
import elements from "../elements";

// 外部依赖（请确保在使用前引入）：

// - lib.word(): 国际化文案方法

// - elements.getGui(): 根据类型生成控件的方法
// - canvas: fabric.Canvas 实例（原变量 d）
let currentRoughOptions = null;

const generateRoughOptionsPanel = async (roughOptions, container) => {

  currentRoughOptions = roughOptions || {
    fillStyle: "hachure",
    roughness: 2,
    fillWeight: 1,
    hachureAngle: -41,
    hachureGap: 8,
    set: (key, value) => {
      if(roughOptions){
        roughOptions[key] = value;
      }
    },
  };

  if (!container) {
    console.error("未找到容器，请确保已传入容器元素");
    return;
  }

  if(container.innerHTML) {
    return;
  }
  
  const refs = render('', (d, e, f, _if) => {
    function t(title, id) {
      let dataId = id ? `data-id="${id}"` : '';
      return `<h5 class="text-slate-700 text-sm py-2" ${dataId}>${title}</h5>`;
    }
    function c(id, className) {
      let dataId = id ? `data-id="${id}"` : '';
      return `<div ${dataId} class="${className}"></div>`;
    }
    return [
      render.row('','fillStyleContainer', 'my-1 flex-1'),
      render.row('粗糙度', 'roughnessContainer', 'my-1 flex-1'),
      render.row('填充粗细', 'fillWeightContainer', 'my-1 flex-1'),
      render.row('填充角度', 'hachureAngleContainer', 'my-1 flex-1'),
      render.row('填充间距', 'hachureGapContainer', 'my-1 flex-1'),
    ];

  }, container);

  const { fillStyleContainer, roughnessContainer, fillWeightContainer, hachureAngleContainer, hachureGapContainer } = refs;

// createRadioGroup 使用示例
// const radioGroup = createRadioGroup(document.body, {
//   choices: {
//       'apple': 'Apple',
//       'banana': 'Banana',
//       'cherry': 'Cherry',
//       'divider2': '_divider_',
//       'date': 'Date',
//       'time': 'Time',
//   },
//   default: 'banana',
//   onchange: (value) => {
//       console.log('Selected:', value);
//   },
// });

// 使用 radioGroup 代码 select

  const roughs = {
    hachure: 1366,
    solid: 1367,
    zigzag: 1368,
    "cross-hatch": 1369,
    dots: 1370,
    dashed: 1371,
    "zigzag-line": 1372,
  }

  const roughChoices = {}
  for (const key in roughs) {
    roughChoices[key] = `<div class="bg-checkerboard m-1 p-1 rounded cursor-pointer" title="${lib.word(roughs[key])}">
      <img src="https://xiaomingyan.com/static/common/d.gif" data-src="/v/design/rough/${key}.png" class="w-full m-auto">
    </div>`;
  }


  elements.getGui(fillStyleContainer, "radio", {
    
    choices: roughChoices,
    class: "grid grid-cols-4 gap-2 p-2 rounded",
    default: currentRoughOptions.fillStyle,
    onchange: (newFillStyle) => {
      currentRoughOptions.set("fillStyle", newFillStyle);
      canvas.requestRenderAll();
    },
  });

  elements.getGui(roughnessContainer, "slider", {
    value: currentRoughOptions.roughness,
    min: 0,
    max: 20,
    onchange: (value) => {
      currentRoughOptions.set("roughness", value);
      canvas.requestRenderAll();
    },
  });

  elements.getGui(fillWeightContainer, "slider", {
    value: currentRoughOptions.fillWeight,
    min: 0,
    max: 20,
    onchange: (value) => {
      currentRoughOptions.set("fillWeight", value);
      canvas.requestRenderAll();
    },
  });

  elements.getGui(hachureAngleContainer, "slider", {
    value: currentRoughOptions.hachureAngle,
    min: -90,
    max: 90,
    onchange: (value) => {
      currentRoughOptions.set("hachureAngle", value);
      canvas.requestRenderAll();
    },
  });

  elements.getGui(hachureGapContainer, "slider", {
    value: currentRoughOptions.hachureGap,
    min: 0,
    max: 20,
    onchange: (value) => {
      currentRoughOptions.set("hachureGap", value);
      canvas.requestRenderAll();
    },
  });

};

export default generateRoughOptionsPanel;


  
