import fabric from "../fabric";

import middleIcon from '/v/design/svgs/control/middle.svg';      // 竖向中间控件图片
import middleIconhoz from '/v/design/svgs/control/middlehoz.svg';  // 横向中间控件图片
import edgeIcon from '/v/design/svgs/control/edge.svg';            // 顶点控件图片
import rotateIcon from '/v/design/svgs/control/rotate.svg';        // 旋转控件图片

// rotateCursorTemplate：旋转光标 SVG 模板，后面我们根据基础角度和对象 angle 替换
function rotateCursorTemplate(angle, x = 5.25, y = 14.75) {
  return `<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='24' height='24'>
  <defs>
    <filter id='a' width='266.7%' height='156.2%' x='-75%' y='-21.9%' filterUnits='objectBoundingBox'>
      <feOffset dy='1' in='SourceAlpha' result='shadowOffsetOuter1'/>
      <feGaussianBlur in='shadowOffsetOuter1' result='shadowBlurOuter1' stdDeviation='1'/>
      <feColorMatrix in='shadowBlurOuter1' result='shadowMatrixOuter1' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0'/>
      <feMerge>
        <feMergeNode in='shadowMatrixOuter1'/>
        <feMergeNode in='SourceGraphic'/>
      </feMerge>
    </filter>
    <path id='b' d='M1.67 12.67a7.7 7.7 0 0 0 0-9.34L0 5V0h5L3.24 1.76a9.9 9.9 0 0 1 0 12.48L5 16H0v-5l1.67 1.67z'/>
  </defs>
  <g fill='none' fill-rule='evenodd'>
    <path d='M0 24V0h24v24z'/>
    <g fill-rule='nonzero' filter='url(#a)' transform='rotate(${angle} ${x} ${y})'>
      <use fill='#000' fill-rule='evenodd' xlink:href='#b'/>
      <path stroke='#FFF' d='M1.6 11.9a7.21 7.21 0 0 0 0-7.8L-.5 6.2V-.5h6.7L3.9 1.8a10.4 10.4 0 0 1 0 12.4l2.3 2.3H-.5V9.8l2.1 2.1z'/>
    </g>
  </g>
</svg>`;
}

// resizeCursorTemplate：resize 光标 SVG 模板，带 {ANGLE} 占位符
function resizeCursorTemplate(angle, x = 12, y = 12) {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'>
  <defs>
    <filter id='a' width='150%' height='150%' x='-25%' y='-17.9%' filterUnits='objectBoundingBox'>
      <feOffset dy='1' in='SourceAlpha' result='shadowOffsetOuter1'/>
      <feGaussianBlur in='shadowOffsetOuter1' result='shadowBlurOuter1' stdDeviation='1'/>
      <feColorMatrix in='shadowBlurOuter1' result='shadowMatrixOuter1' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0'/>
      <feMerge>
        <feMergeNode in='shadowMatrixOuter1'/>
        <feMergeNode in='SourceGraphic'/>
      </feMerge>
    </filter>
  </defs>
  <g fill='none' fill-rule='evenodd'>
    <path d='M0 0h24v24H0z'/>
    <g filter='url(#a)' transform='rotate(${angle} ${x} ${y})'>
      <path fill='#FFF' d='m4.257 7.087 4.072 4.068L5.5 13.983l8.473-.013.013-8.47-2.841 2.842L7.07 4.274 5.656 2.859 8.5.017H.014v8.484l2.829-2.827z'/>
      <path fill='#000' d='m5.317 6.733 4.427 4.424-1.828 1.828 5.056-.016.014-5.054-1.842 1.841-4.428-4.422-2.474-2.475 1.844-1.843H1.013v5.071l1.83-1.828z'/>
    </g>
  </g>
</svg>`;
}

// 生成边控件光标：有效角度 = baseAngle - objAngle，热点由 caller 指定
function getResizeCursorEdge(baseAngle, objAngle, hotspotX, hotspotY) {
  const effectiveAngle = baseAngle - objAngle;
  return `url("data:image/svg+xml,${encodeURIComponent(resizeCursorTemplate(effectiveAngle, hotspotX, hotspotY))}") ${hotspotX} ${hotspotY}, auto`;
}

// 生成角控件光标：有效角度 = baseAngle + objAngle
function getResizeCursorCorner(baseAngle, objAngle, hotspotX, hotspotY) {
  const effectiveAngle = baseAngle + objAngle;
  return `url("data:image/svg+xml,${encodeURIComponent(resizeCursorTemplate(effectiveAngle, hotspotX, hotspotY))}") ${hotspotX} ${hotspotY}, auto`;
}

// 生成旋转控件光标：有效角度 = baseAngle + objAngle
function getRotateCursor(baseAngle, objAngle, hotspotX, hotspotY) {
  const effectiveAngle = baseAngle + objAngle;
  return `url("data:image/svg+xml,${encodeURIComponent(rotateCursorTemplate(effectiveAngle, hotspotX, hotspotY))}") ${hotspotX} ${hotspotY}, auto`;
}

/*—————————————————————————————
  工具函数：绘制图像、加载图片
——————————————————————————————*/
function drawImg(ctx, left, top, img, wSize, hSize, angle) {
  if (!img.complete) return;
  if (angle === undefined) return;
  ctx.save();
  ctx.translate(left, top);
  ctx.rotate(fabric.util.degreesToRadians(angle));
  ctx.drawImage(img, -wSize / 2, -hSize / 2, wSize, hSize);
  ctx.restore();
}

function createImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      
      resolve(img);
    };
    img.onerror = () => {
      
      reject(img);
    };
  });
}

/*—————————————————————————————
  控件定义
——————————————————————————————*/

// 边中控件：ml/mr 用于水平边，mt/mb 用于垂直边。
// 这里采用 getResizeCursorEdge，不随对象旋转。
// 设定基础角度：ml/mr 使用 -45°，mt/mb 使用 45°。
async function intervalControl() {
  const verticalImg = await createImage(middleIcon);
  const horizontalImg = await createImage(middleIconhoz);

  function renderVertical(ctx, left, top, styleOverride, fabricObject) {
    drawImg(ctx, left, top, verticalImg, 20, 25, fabricObject.angle);
  }
  function renderHorizontal(ctx, left, top, styleOverride, fabricObject) {
    drawImg(ctx, left, top, horizontalImg, 25, 20, fabricObject.angle);
  }
  fabric.Object.prototype.controls.ml = new fabric.Control({
    x: -0.5,
    y: 0,
    offsetX: -10,
    // 基础角度 -45，不随对象旋转：有效角度 = -45 - obj.angle
    // cursorStyleHandler: (e, control, obj) => getResizeCursorEdge(-45, obj.angle, 12, 12),
    actionHandler: fabric.controlsUtils.scalingX,
    getActionName: fabric.controlsUtils.scaleOrSkewActionName,
    render: renderVertical
  });
  fabric.Object.prototype.controls.mr = new fabric.Control({
    x: 0.5,
    y: 0,
    offsetX: 10,
    // cursorStyleHandler: (e, control, obj) => getResizeCursorEdge(-45, obj.angle, 12, 12),
    actionHandler: fabric.controlsUtils.scalingX,
    getActionName: fabric.controlsUtils.scaleOrSkewActionName,
    render: renderVertical
  });
  fabric.Object.prototype.controls.mt = new fabric.Control({
    x: 0,
    y: -0.5,
    offsetY: -10,
    // 基础角度 45：有效角度 = 45 - obj.angle
    // cursorStyleHandler: (e, control, obj) => getResizeCursorEdge(45, obj.angle, 12, 12),
    actionHandler: fabric.controlsUtils.scalingY,
    getActionName: fabric.controlsUtils.scaleOrSkewActionName,
    render: renderHorizontal
  });
  fabric.Object.prototype.controls.mb = new fabric.Control({
    x: 0,
    y: 0.5,
    offsetY: 10,
    // cursorStyleHandler: (e, control, obj) => getResizeCursorEdge(45, obj.angle, 12, 12),
    actionHandler: fabric.controlsUtils.scalingY,
    getActionName: fabric.controlsUtils.scaleOrSkewActionName,
    render: renderHorizontal
  });
}

// 角控件：采用 getResizeCursorCorner，随对象旋转。
// tl、br 使用基础角度 45，tr、bl 使用基础角度 -45。
async function peakControl() {
  const edgeImg = await createImage(edgeIcon);
  function renderCorner(ctx, left, top, styleOverride, fabricObject) {
    drawImg(ctx, left, top, edgeImg, 25, 25, fabricObject.angle);
  }
  fabric.Object.prototype.controls.tl = new fabric.Control({
    x: -0.5,
    y: -0.5,
    // 有效角度 = 45 + obj.angle
    // cursorStyleHandler: (e, control, obj) => getResizeCursorCorner(45, obj.angle, 12, 12),
    actionHandler: fabric.controlsUtils.scalingEqually,
    render: renderCorner
  });
  fabric.Object.prototype.controls.tr = new fabric.Control({
    x: 0.5,
    y: -0.5,
    // 有效角度 = -45 + obj.angle
    // cursorStyleHandler: (e, control, obj) => getResizeCursorCorner(-45, obj.angle, 12, 12),
    actionHandler: fabric.controlsUtils.scalingEqually,
    render: renderCorner
  });
  fabric.Object.prototype.controls.bl = new fabric.Control({
    x: -0.5,
    y: 0.5,
    // 有效角度 = -45 + obj.angle
    // cursorStyleHandler: (e, control, obj) => getResizeCursorCorner(-45, obj.angle, 12, 12),
    actionHandler: fabric.controlsUtils.scalingEqually,
    render: renderCorner
  });
  fabric.Object.prototype.controls.br = new fabric.Control({
    x: 0.5,
    y: 0.5,
    // 有效角度 = 45 + obj.angle
    // cursorStyleHandler: (e, control, obj) => getResizeCursorCorner(45, obj.angle, 12, 12),
    actionHandler: fabric.controlsUtils.scalingEqually,
    render: renderCorner
  });
}

// 旋转控件：基础角度设为 90，随对象旋转（有效角度 = 90 + obj.angle）。
async function rotationControl() {
  const rotateImg = await createImage(rotateIcon);
  function renderRotate(ctx, left, top, styleOverride, fabricObject) {
    drawImg(ctx, left, top, rotateImg, 40, 40, fabricObject.angle);
  }
  fabric.Object.prototype.controls.mtr = new fabric.Control({
    x: 0,
    y: -0.5,
    offsetY: -40,
    // cursorStyleHandler: (e, control, obj) => getRotateCursor(90, obj.angle, 5.25, 14.75),
    actionHandler: fabric.controlsUtils.rotationWithSnapping,
    getActionName: () => "rotate",
    withConnection: true,
    render: renderRotate
  });
}

async function initControlsPlugin() {
  await Promise.all([intervalControl(), peakControl(), rotationControl()]);
  fabric.Object.prototype.set({
    transparentCorners: false,
    borderColor: '#51B9F9',
    cornerColor: '#FFF',
    borderScaleFactor: 2.5,
    cornerStyle: 'circle',
    cornerStrokeColor: '#0E98FC'
  });
}

export default initControlsPlugin;
