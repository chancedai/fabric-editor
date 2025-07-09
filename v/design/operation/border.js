import { delegator, emitter, showInfo, render } from "../../__common__/utils";
import fabric from "../fabric";
import { canvas, exportCanvasConfig, debouncedCommitChange } from "../canvas";
import { panel } from "../component/sidebar";
import elements from "../elements";

const { init } = (() => {
  let refs = null;
  let colorPickerUpdate = function () {};
  let sliderUpdate = function () {};
  let borderFillColor = "rgba(0,0,0,1)";
  let borderScale = 1;
  let currentBorderObject = null;
  let currentUrl = null;
  async function renderUI() {
    if (refs) {
      return;
    }
    refs = render(
      "",
      () => {
        return [
          `<div data-id="wrapper"  class="text-sm">`,
          render.section("", [
            render.row("颜色", "colorPicker", 'flex-grow-0'),
            render.row("大小", "sizeSilder"),
          ]),
          render.section("", [
          `<div data-id="previewContainer" class="p-2 bg-checkerboard border-2 border-slate-200 rounded-lg">
              <div class="flex space-x-2 justify-center">
                <img data-id="cornerImg" class="rounded">
                <img data-id="borderImg" class="rounded">
              </div>
          </div>`
          ]),
          render.buttons([
            { id: "cancelBtn", text: "取消", className: "btn-secondary" },
            { id: "applyBtn", text: "应用", className: "btn-primary" },
          ]),
          `</div>`,
        ];
      },
      panel.content
    );

    const {
      cornerImg,
      borderImg,
      cancelBtn,
      applyBtn,
      colorPicker,
      sizeSilder,
    } = refs;


    let { update } = elements.getGui(colorPicker, "colorButton", {
      color: borderFillColor,
      onchange: (info) => {
        let newColor = info.fabricColor;
        borderFillColor = newColor;
      },
    });

    colorPickerUpdate = update;

    const { update: update2 } = elements.getGui(sizeSilder, "slider", {
      value: 100 * borderScale,
      min: 10,
      max: 200,
      onchange: (newValue) => {
        borderScale = newValue / 100;
        if (cornerImg) {
          cornerImg.width = cornerImg.naturalWidth * borderScale;
          cornerImg.height = cornerImg.naturalHeight * borderScale;
        }
        if (borderImg) {
          borderImg.width = borderImg.naturalWidth * borderScale;
          borderImg.height = borderImg.naturalHeight * borderScale;
        }
      },
    });

    sliderUpdate = update2;

    cancelBtn.addEventListener("click", () => {
      panel.hide("border");
    });
    // 操作按钮
    applyBtn.addEventListener("click", () => {
      // corner border 同时加载加快速度
      const cornerImg = new Image();
      const borderImg = new Image();
      cornerImg.crossOrigin = "anonymous";
      borderImg.crossOrigin = "anonymous";
      let count = 0;
      function onload() {
        count++;
        if (count === 2) {
          let params = {
            scale: borderScale,
            left: 10,
            top: 10,
            width: exportCanvasConfig.width - 20,
            height: exportCanvasConfig.height - 20,
            fill: borderFillColor,
          };
          if (/\.svg$/.test(currentUrl)) {
            params.left = 0;
            params.top = 0;
            params.width = exportCanvasConfig.width;
            params.height = exportCanvasConfig.height;
          }
          const newBorder = new fabric.Borderimage(
            borderImg,
            cornerImg,
            params
          );
          canvas.add(newBorder);
          // canvas.sendToBack(newBorder);
          showInfo("边框已添加");
        }
      }
      cornerImg.onload = onload;
      borderImg.onload = onload;
      cornerImg.src = currentUrl;
      borderImg.src = currentUrl.replace(/corner/, "border");
    });
  }

  /**
   * 构建边框编辑界面并将其插入到外部容器 panel.content 内（容器宽度 250px，使用 TailwindCSS 样式）
   */
  async function init(url) {
    currentUrl = url;


    if (refs) {
      colorPickerUpdate({
        color: borderFillColor,
        
      });

      sliderUpdate(borderScale);
    } else {
      renderUI();
    }

    const { cornerImg, borderImg, colorPicker } = refs;

    function toggleColorPicker(show) {
      if (show) {
        colorPicker.style.display = "";
      } else {
        colorPicker.style.display = "none";
      }
    }

    // 当边框文件为 svg 时显示颜色选择器
    toggleColorPicker(false);
    if (/\.svg$/.test(currentUrl)) {
      toggleColorPicker(true);
    } else {
      toggleColorPicker(false);
    }

    cornerImg.src = currentUrl;
    borderImg.src = currentUrl.replace(/corner/, "border");
    cornerImg.onload = () => {
      cornerImg.width = cornerImg.naturalWidth * borderScale;
      cornerImg.height = cornerImg.naturalHeight * borderScale;
    };
    borderImg.onload = () => {
      borderImg.width = borderImg.naturalWidth * borderScale;
      borderImg.height = borderImg.naturalHeight * borderScale;
    };

    panel.show("border", refs.wrapper, "添加边框");
  }
  return {
    init,
  };
})();


const { edit } = (() => {
  let refs = null;
  let colorPickerUpdate = function () {};
  let sliderUpdate = function () {};
  let currentBorderObject = null;
  let borderFillColor = "rgba(0,0,0,1)";
  let borderScale = 1;
  async function renderUI() {
    if (refs) {
      return;
    }
    refs = render(
      "",
      () => {
        return [
          `<div data-id="wrapper"  class="text-sm">`,
          render.section("", [
            render.row("颜色", "colorPicker", 'flex-grow-0', currentBorderObject.isSVG?'':' hidden'),
            render.row("大小", "sizeSilder"),
          ]),
          `</div>`,
        ];
      },
      panel.content
    );

    const { colorPicker, sizeSilder } = refs;

    
    const { update } = elements.getGui(colorPicker, "colorButton", {
      color: borderFillColor,
      onchange: (info) => {
        let newColor = info.fabricColor;
        borderFillColor = newColor;
        currentBorderObject.set("fill", borderFillColor);
        debouncedCommitChange()
        canvas.requestRenderAll();
      },
    });
    colorPickerUpdate = update;
    const { update: update2 } = elements.getGui(sizeSilder, "slider", {
      value: 100 * borderScale,
      min: 1,
      max: 200,
      onchange: (newValue) => {
        borderScale = newValue / 100;
        currentBorderObject.set("scale", borderScale);
        debouncedCommitChange()
        canvas.requestRenderAll();
      },
    });
    sliderUpdate = update2;
  }
  async function edit(borderObj) {
    currentBorderObject = borderObj;
    borderFillColor = currentBorderObject.get("fill");
    borderScale = currentBorderObject.get("scale");

    if (refs) {
      colorPickerUpdate({
        color: borderFillColor,

      });
      sliderUpdate(borderScale);
    } else {
      renderUI();
    }

    const { colorPicker, sizeSilder } = refs;
    
    if (currentBorderObject.isSVG) {
      colorPicker.style.display = "";
    } else {
      colorPicker && (colorPicker.style.display = "none");
    }
    panel.show("border", refs.wrapper, '编辑边框');
  }

  return {
    edit,
  };
})();

emitter.on("operation:border:init", (url) => {
  
  init(url);
});

emitter.on("operation:border:edit", async (object) => {
  
  edit(object);
});

