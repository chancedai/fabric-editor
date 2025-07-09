import { createImageCropper } from "./imageCropper";
import { canvas, debouncedCommitChange, exportCanvasConfig } from "../canvas";
import { emitter, colorToImage,stringToGradient, gradientToImage } from "../../__common__/utils";
import fabric from "../fabric";


const { openImageUpload, openCropper } = createImageCropper({
  context: "overlay",
  exportCanvasConfig,
  onApply: (img, type) => updateCanvasOverlay(img, false, type),
});


/**
 * 更新 fabric.js 画布前景。
 * 如果 source 为渐变字符串（如 "linear-gradient(...)" 或 "radial-gradient(...)"），
 * 则生成对应的图片作为前景，否则直接使用颜色或图片。
 *
 * 参数 isNormalColor 表示是否为普通颜色（非渐变），默认 true。
 */
function updateCanvasOverlay(source, isNormalColor = true, imageType) {
  // 如果 source 是 null, 则清空前景
  if (source === null) {
    canvas.setOverlayColor(null, () => {
      canvas.setOverlayImage(null, () => {
        // 触发 object:modified 事件，以便更新操作历史记录
        debouncedCommitChange();
        canvas.requestRenderAll();
        emitter.emit("canvas:overlay:modified", null);
      });
    });
    return;
  }
  // 如果不是普通颜色且 source 不是 canvas 元素，则处理渐变
  if(typeof source === 'string') {
    if(!isNormalColor && source.indexOf('gradient(') > 0) {
      const gradient = stringToGradient(source);
      // 假设全局 fabric 画布对象为 canvas
      source= gradientToImage(gradient, exportCanvasConfig.width, exportCanvasConfig.height);
    }else{
      source = colorToImage(source, exportCanvasConfig.width, exportCanvasConfig.height);
    }
  }

  if (source instanceof HTMLImageElement) {
    // 使用 fabric.Image.fromObject 将图片转换为 fabric 对象并设置为前景
    fabric.Image.fromObject(source, (fabricImage) => {
      fabricImage.set({
        globalCompositeOperation: imageType === "image/jpeg" ? "screen" : "multiply",
      });
      fabricImage.scaleX = exportCanvasConfig.width / fabricImage.width;
      fabricImage.scaleY = exportCanvasConfig.height / fabricImage.height;
      canvas.setOverlayImage(fabricImage, ()=>{
        // 触发 object:modified 事件，以便更新操作历史记录
        debouncedCommitChange();
        canvas.requestRenderAll();
        emitter.emit("canvas:overlay:modified", source);
      });
    });
  }
}

emitter.on("operation:overlay:init", ({ type, data, isNormalColor }) => {
  if (type === "url") openCropper(data);
  else if (type === "color") updateCanvasOverlay(data, isNormalColor);
  else if (type === "gradient") updateCanvasOverlay(data, false);
  else if (type === "upload") openImageUpload();
  else if (type === "remove") updateCanvasOverlay(null, true);
});

