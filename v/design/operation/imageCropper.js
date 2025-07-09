// imageCropper.js
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.min.css";
import { render, showInfo } from "../../__common__/utils";
import { panel } from "../component/sidebar";
import lib from "../lib";

export function createImageCropper({ context = "background", onApply, exportCanvasConfig }) {
  let refs = null;
  let cropperInstance = null;

  function openFileInput() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", (event) => {
      handleFile(event.target.files[0]);
      input.remove();
    });
    document.body.appendChild(input);
    input.click();
  }

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      openCropper(event.target.result);
    };
    reader.readAsDataURL(file);
  }

  function renderUI(imageSrc) {
    if (refs) {
      refs.wrapper.style.display = "";
      return;
    }

    refs = render(
      "",
      () => [
        `<div data-id="wrapper" class="text-sm h-full overflow-auto">`,
        render.section("uploadContainer", [
          `<div class="text-center p-4 border-dashed border-2 border-slate-300 rounded-lg">
            <p>${lib.word(2009, '<a href="#" data-id="browseBtn" class="text-purple-500">' + lib.word(2004) + "</a>")}</p>
            <p class="text-xs mt-2 text-slate-500">${lib.word(1315)}</p>
          </div>`,
        ]),
        render.section("cropWrapper", [
          render.titleRow("裁剪", "cropSizeContainer"),
          `<div data-id="cropperContainer" class="w-full">
            <img class="img-fluid" style="visibility: hidden;" data-id="imageElement" src="${imageSrc}">
          </div>`,
        ]),
        render.buttons([
          { id: "cancelBtn", text: "取消", className: "btn-secondary" },
          { id: "applyBtn", text: "应用", className: "btn-primary" },
        ], "buttons"),
        `</div>`,
      ],
      panel.content
    );

    const { uploadContainer, browseBtn, imageElement, cropSizeContainer, cropWrapper, cancelBtn, applyBtn, buttons } = refs;

    browseBtn.addEventListener("click", () => {
      openFileInput();
      return false;
    });

    uploadContainer.addEventListener("dragover", (e) => {
      e.preventDefault(); uploadContainer.classList.add("border-purple-500");
    });
    uploadContainer.addEventListener("dragleave", (e) => {
      e.preventDefault(); uploadContainer.classList.remove("border-purple-500");
    });
    uploadContainer.addEventListener("drop", (e) => {
      e.preventDefault(); uploadContainer.classList.remove("border-purple-500");
      handleFile(e.dataTransfer.files[0]);
    });

    imageElement.addEventListener("error", function () {
      if (imageElement.getAttribute("src") === "undefined") return;
      showInfo("对不起，无法加载图片，请稍候重试。");
      destroyCropper();
    });

    imageElement.addEventListener("load", function () {
      cropperInstance = new Cropper(imageElement, {
        aspectRatio: exportCanvasConfig.width / exportCanvasConfig.height,
        toggleDragModeOnDblclick: false,
        movable: false,
        zoomable: false,
        rotatable: false,
        scalable: false,
        zoomOnWheel: false,
        dragMode: "move",
        viewMode: 1,
        autoCropArea: 1,
        cropmove: showSize,
        ready: showSize,
      });

      function showSize() {
        const data = cropperInstance.getData(true);
        cropSizeContainer.innerHTML = `${data.width} x ${data.height}px`;
      }
    });

    applyBtn.addEventListener("click", () => {
      const canvas = cropperInstance.getCroppedCanvas();
      const imageType = /\.jpe?g$/i.test(imageElement.src) ? "image/jpeg" : "image/png";
      const croppedImage = new Image();
      croppedImage.crossOrigin = "anonymous";
      croppedImage.onload = () => onApply(croppedImage, imageType);
      croppedImage.src = canvas.toDataURL(imageType, 0.92);
      panel.hide();
      destroyCropper();
    });

    cancelBtn.addEventListener("click", () => {
      panel.hide();
      destroyCropper();
    });

    function destroyCropper() {
      if (cropperInstance) cropperInstance.destroy();
      const cropperContainer = cropWrapper.querySelector(".cropper-container");
      if (cropperContainer) cropperContainer.remove();
    }
  }

  function openImageUpload() {
    renderUI();
    const { uploadContainer, cropWrapper, buttons } = refs;
    cropWrapper.style.display = "none";
    buttons.style.display = "none";
    uploadContainer.style.display = "";
    panel.show(context, refs.wrapper, `上传${context === "background" ? "背景" : "前景"}图片`);
    openFileInput();
  }

  function openCropper(imageSrc) {
    renderUI(imageSrc);
    const { uploadContainer, cropWrapper, imageElement, buttons } = refs;
    uploadContainer.style.display = "none";
    cropWrapper.style.display = "";
    buttons.style.display = "";
    imageElement.src = imageSrc;
    panel.show(context, refs.wrapper, context === "background" ? "背景" : "前景");
  }

  return { openImageUpload, openCropper };
}
