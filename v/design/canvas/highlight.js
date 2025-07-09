import { debounce, emitter } from "../../__common__/utils";
let ghostRect = null; // 幽灵对象
let canvas = null; // 画布对象

export const highlightObject = debounce(function (target, source) {
  if (canvas && target && target.selectable && target !== canvas.getActiveObject()) {
    const zoom = canvas.getZoom();
    if (!ghostRect) {
      
      ghostRect = new fabric.Rect({
        left: target.left,
        top: target.top,
        width: target.width * target.scaleX, // 适配缩放
        height: target.height * target.scaleY,
        // fill: "rgba(255, 255, 0, 0.1)", // 半透明黄色高亮
        fill: "rgba(128, 0, 128, 0)", // 半透明紫色高亮
        stroke: "#8b3dff",
        strokeWidth: 2/zoom, // 适配缩放
        selectable: false,
        evented: false, // 禁止事件交互
        originX: target.originX, // 确保对齐
        originY: target.originY,
        angle: target.angle, // 适配旋转
      });
      ghostRect._isHighlightGhost = true;
    }else{
      ghostRect.set({
        left: target.left,
        top: target.top,
        width: target.width * target.scaleX, // 适配缩放
        height: target.height * target.scaleY,
        strokeWidth: 2/zoom, // 适配缩放
        angle: target.angle, // 适配旋转
        originX: target.originX, // 确保对齐
        originY: target.originY,
      });
      ghostRect.setCoords(); // 更新坐标
    }
    // canvas._objects.push(ghostRect); // 添加到 _objects 数组
    // canvas.requestRenderAll(); // 重新渲染

    const ctx = canvas.contextContainer;

    const prevClip = canvas.clipPath;
    canvas.clipPath = null;

    ctx.save();
    ctx.transform(...canvas.viewportTransform); // ✅ 应用 zoom 和 pan 等变换

    ghostRect.transform(ctx);  // ✅ 应用自身 transform（例如旋转）
    ghostRect._render(ctx);    // ✅ 真实绘制

    ctx.restore();

    canvas.clipPath = prevClip;

    if(source === 'canvas') {
      emitter.emit("canvas:highlight", {
        target
      }); 
    }
  }

  if(canvas && target) {
    canvas.currentHoverObject = target;
  }
  
}
, 16);

export function unhighlightObject(source) {
  if (ghostRect) {
    // 从 _objects 数组中移除幽灵对象
    canvas._objects = canvas._objects.filter((obj) => obj !== ghostRect);
    canvas.requestRenderAll();
    if(source === 'canvas') {
      emitter.emit("canvas:unhighlight");
    }
  }
  if(canvas) {
    canvas.currentHoverObject = null;
  }
}


// 主逻辑：绑定事件并控制状态
export function setupHighlighting(c) {

  canvas = c; // 将画布对象赋值给模块级变量
  
  canvas.on('mouse:over', function (e) {
    const target = e.target;
    highlightObject(target, 'canvas'); // 高亮目标对象
  });

  canvas.on("mouse:out", function (e) {
    unhighlightObject('canvas'); // 取消高亮
  });
  canvas.on("mouse:down", function (e) {
    // if(e.subTargets.length > 0) {
    //   console.log('mouse:down', e.subTargets[0],e.subTargets[0].group,e.subTargets[0].width,e.subTargets[0].height);
    //   canvas.discardActiveObject();
    //   canvas.setActiveObject(e.subTargets[0]);
    //   canvas.requestRenderAll();
    // }
    unhighlightObject('canvas'); // 取消高亮
  });;
  canvas.on("selection:created", function (e) {
    unhighlightObject('canvas'); // 取消高亮
  });
}
