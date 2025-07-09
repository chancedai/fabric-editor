import { emitter, render } from "../../__common__/utils";
import { canvas } from "../canvas";
import { panel } from "../component/sidebar";
import elements from "../elements";

/*
  外部变量和方法（需自行导入）：
  - elements
  - lib
  - canvas.requestRenderAll()
  - E (容器元素)
*/

let currentObject;
let shadowColor = "rgba(0,0,0,0.5)";
let shadowOffsetX = 0;
let shadowOffsetY = 0;
let shadowBlur = 0;
let shadowResetButton;
let refs = null;
const updates = {};

const updateShadow = () => {
  currentObject.set("shadow", {
    offsetX: shadowOffsetX,
    offsetY: shadowOffsetY,
    blur: shadowBlur,
    color: shadowColor,
    affectStroke: /line|path/.test(currentObject.type),
  });
  canvas.requestRenderAll();
  shadowResetButton.disabled =
    shadowOffsetX === 0 && shadowOffsetY === 0 && shadowBlur === 0;
};

function renderUI(settings) {
  if (refs) {
    return;
  }

  refs = render(
    "",
    () => {
      return [
      `<div data-id="wrapper" class="text-sm h-full overflow-auto">`,
        render.section("shadow", [
          render.titleRow("阴影", "colorPicker"),
          render.row("水平偏移", "sliderX"),
          render.row("垂直偏移", "sliderY"),
          render.row("模糊度\u3000", "sliderBlur"),
        ]),
        render.buttons([
          { id: 'delete', text: '<i class="vicon-delete text-lg mr-1"></i>删除', className: 'btn-primary' }
        ]),
      `</div>`,
      ];
    
    },
    panel.content
  );

  shadowResetButton = refs.delete;
  shadowResetButton.addEventListener("click", () => {
    currentObject.set("shadow", null);
    shadowResetButton.disabled = true;
    shadowOffsetX = shadowOffsetY = shadowBlur = 0;
    ['sliderX', 'sliderY', 'sliderBlur'].forEach(id => {
      const update = updates[id];
      update(0);
    });
    shadowColor = "";
    updates['colorPicker']({
      color: shadowColor,
    });
    canvas.requestRenderAll();
  });

  settings.forEach((setting) => {
    const { update } = elements.getGui(
      refs[setting.id],
      setting.type,
      setting.guiProps
    );
    updates[setting.id] = update;
  });
}

async function updateUI() {

  const settings = [
    {
      id: "colorPicker",
      type: "colorButton",
      label: "阴影颜色",
      val: {
        color: shadowColor,

      },
      guiProps: {
        color: shadowColor,
        
        onchange: (info) => {
          const color = info.fabricColor;
          shadowColor = color;
          updateShadow();
        },
      },
    },
    {
      id: "sliderX",
      type: "slider",
      label: "水平偏移",
      val: shadowOffsetX,
      guiProps: {
        value: shadowOffsetX,
        min: -100,
        max: 100,
        asDropdown: false,
        onchange: (value) => {
          shadowOffsetX = value;
          updateShadow();
        },
      },
    },
    {
      id: "sliderY",
      type: "slider",
      label: "垂直偏移",
      val: shadowOffsetY,
      guiProps: {
        value: shadowOffsetY,
        min: -100,
        max: 100,
        asDropdown: false,
        onchange: (value) => {
          shadowOffsetY = value;
          updateShadow();
        },
      },
    },
    {
      id: "sliderBlur",
      type: "slider",
      label: "模糊度\u3000",
      val: shadowBlur,
      guiProps: {
        value: shadowBlur,
        min: 0,
        max: 100,
        asDropdown: false,
        onchange: (value) => {
          shadowBlur = value;
          updateShadow();
        },
      },
    },
  ];

  if (refs) {
    // 更新值
    settings.forEach((setting) => {
      const update = updates[setting.id];
      update(setting.val);
    });
  } else {
    // 渲染UI
    renderUI(settings);
  }
  panel.show("shadow", refs.wrapper, '阴影设置');
}


function init(object) {
  currentObject = object;
  if (currentObject.shadow) {
    shadowColor = currentObject.shadow.color;
    shadowOffsetX = currentObject.shadow.offsetX;
    shadowOffsetY = currentObject.shadow.offsetY;
    shadowBlur = currentObject.shadow.blur;
  } else {
    shadowColor = "";
    shadowOffsetX = 0;
    shadowOffsetY = 0;
    shadowBlur = 0;
  }
  updateUI();
}

emitter.on("operation:shadow:init", (object) => {
  init(object);
});
