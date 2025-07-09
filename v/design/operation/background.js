import { createImageCropper } from "./imageCropper";
import { canvas, debouncedCommitChange, exportCanvasConfig } from "../canvas";
import { emitter, colorToImage,stringToGradient, gradientToImage } from "../../__common__/utils";
import fabric from "../fabric";

const { openImageUpload, openCropper } = createImageCropper({
  context: "background",
  exportCanvasConfig,
  onApply: (img) => updateCanvasBackground(img),
});

/**
 * 更新 fabric.js 画布背景。
 * 如果 source 为渐变字符串（如 "linear-gradient(...)" 或 "radial-gradient(...)"），
 * 则生成对应的图片作为背景，否则直接使用颜色或图片。
 *
 * 参数 isNormalColor 表示是否为普通颜色（非渐变），默认 true。
 */
function updateCanvasBackground(source, isNormalColor = true) {
  // 如果 source 是 null, 则清空背景
  if (source === null) {
    canvas.setBackgroundColor(null, () => {
      canvas.setBackgroundImage(null, () => {
        // 触发 object:modified 事件，以便更新操作历史记录
        debouncedCommitChange();
        canvas.requestRenderAll();
        emitter.emit("canvas:background:modified", null);
      });
    });
    return;
  }
  
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
    // 使用 fabric.Image.fromObject 将图片转换为 fabric 对象并设置为背景
    fabric.Image.fromObject(source, (fabricImage) => {
      fabricImage.scaleX = exportCanvasConfig.width / fabricImage.width;
      fabricImage.scaleY = exportCanvasConfig.height / fabricImage.height;
      canvas.backgroundImage = null;
      canvas.setBackgroundImage(fabricImage, ()=>{
        // 触发 object:modified 事件，以便更新操作历史记录
        debouncedCommitChange();
        canvas.requestRenderAll();
        emitter.emit("canvas:background:modified", source);
      });
    });
  }
}


emitter.on("operation:background:init", ({ type, data, isNormalColor }) => {
  if (type === "url") openCropper(data);
  else if (type === "color") updateCanvasBackground(data, isNormalColor);
  else if (type === "gradient") updateCanvasBackground(data, false);
  else if (type === "upload") openImageUpload();
  else if (type === "remove") updateCanvasBackground(null, true);
});