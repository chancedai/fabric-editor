import { emitter} from "../../__common__/utils";
import fabric from "../fabric";
import { canvas, exportCanvasConfig} from "../canvas";





// 向画布添加图片（支持 SVG 与普通图片）
function addImageToCanvas(imageUrl) {
  if (/\.svg$/.test(imageUrl) || /^data:image\/svg/.test(imageUrl.substr(0, 20))) {
    fabric.loadSVGFromURL(imageUrl, (objects, options) => {
      const svgGroup = fabric.util.groupSVGElements(objects, options);
      const scale = Math.min(exportCanvasConfig.width / svgGroup.width, exportCanvasConfig.height / svgGroup.height);
      const finalScale = scale/2;
      // 居中
      svgGroup.set({ left: (exportCanvasConfig.width - svgGroup.width * finalScale) / 2, top: (exportCanvasConfig.height - svgGroup.height * finalScale) / 2, scaleX: finalScale, scaleY: finalScale });
      canvas.add(svgGroup);
      canvas.setActiveObject(svgGroup);
      canvas.calcOffset();
      canvas.requestRenderAll();
    });
  } else {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = Math.min(exportCanvasConfig.width / img.naturalWidth, exportCanvasConfig.height / img.naturalHeight);
      const finalScale = scale/2;
      const fabricImage = new fabric.Shapeimage(img, {
        width: img.width,
        height: img.height,
        left: (exportCanvasConfig.width - img.width * finalScale) / 2,
        top: (exportCanvasConfig.height - img.height * finalScale) / 2,
        scaleX: finalScale,
        scaleY: finalScale,
      });
      canvas.add(fabricImage);
      canvas.setActiveObject(fabricImage);
      canvas.calcOffset();
      canvas.requestRenderAll();
    };
    img.src = imageUrl;
  }
}


emitter.on("operation:image:init", (url) => {
  addImageToCanvas(url);
});

emitter.on("operation:image:edit", (url) => {
  addImageToCanvas(url);
  
});
