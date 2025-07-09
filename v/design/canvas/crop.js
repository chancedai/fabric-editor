export default function initCrop(canvas) {
  // 双击图片进入裁剪模式
  canvas.on('mouse:dblclick', function (event) {
    const target = event.target;
    if (target && target.type === 'image') {
      prepareCrop(target);
    }
  });

  // 准备裁剪
  function prepareCrop(img) {
    // 获取当前裁剪参数（若已存在）
    const cropX = img.cropX || 0;
    const cropY = img.cropY || 0;
    const cropW = img.width;
    const cropH = img.height;

    // 撤销已有裁剪，仅为设置裁剪框（但不清除 crop 参数）
    img.set({
      cropX: 0,
      cropY: 0,
      width: img._originalElement.naturalWidth,
      height: img._originalElement.naturalHeight,
      left: img.left - cropX * img.scaleX,
      top: img.top - cropY * img.scaleY,
    });

    // 裁剪框尺寸（中心创建）
    const cropRect = new fabric.Rect({
      id: 'crop-rect',
      originX: 'center',
      originY: 'center',
      left: img.left + (cropX + cropW / 2) * img.scaleX,
      top: img.top + (cropY + cropH / 2) * img.scaleY,
      width: cropW * img.scaleX,
      height: cropH * img.scaleY,
      fill: 'rgba(255, 255, 255, 0)',
      stroke: '#2a4365',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      cornerColor: '#2a4365',
      cornerStyle: 'circle',
      transparentCorners: false,
      lockRotation: true,
      lockScalingFlip: true,
    });

    // 背景遮罩
    const overlay = new fabric.Rect({
      id: 'overlay-rect',
      left: img.left,
      top: img.top,
      width: img.getScaledWidth(),
      height: img.getScaledHeight(),
      originX: 'left',
      originY: 'top',
      angle: img.angle,
      fill: 'rgba(0, 0, 0, 0.5)',
      selectable: false,
      evented: false,
      absolutePositioned: true
    });

    canvas.add(overlay);
    canvas.add(cropRect);
    canvas.setActiveObject(cropRect);
    canvas.renderAll();

    // 限制移动不超出图像边界
    cropRect.on('moving', () => {
      const cropBounds = cropRect.getBoundingRect(true); // include VPT
      const imgBounds = img.getBoundingRect(true);

      const dx = cropBounds.left < imgBounds.left ? imgBounds.left - cropBounds.left : 0;
      const dy = cropBounds.top < imgBounds.top ? imgBounds.top - cropBounds.top : 0;
      const dx2 = cropBounds.left + cropBounds.width > imgBounds.left + imgBounds.width
        ? imgBounds.left + imgBounds.width - (cropBounds.left + cropBounds.width) : 0;
      const dy2 = cropBounds.top + cropBounds.height > imgBounds.top + imgBounds.height
        ? imgBounds.top + imgBounds.height - (cropBounds.top + cropBounds.height) : 0;

      cropRect.left += dx + dx2;
      cropRect.top += dy + dy2;
    });

    // 保存缩放前状态
    cropRect.on('scaling', () => {
      cropRect.oldScaleX = cropRect.scaleX;
      cropRect.oldScaleY = cropRect.scaleY;
    });

    // 缩放限制在图片范围内
    cropRect.on('scaled', () => {
      const cropBounds = cropRect.getBoundingRect(true);
      const imgBounds = img.getBoundingRect(true);

      const overLeft = cropBounds.left < imgBounds.left;
      const overTop = cropBounds.top < imgBounds.top;
      const overRight = cropBounds.left + cropBounds.width > imgBounds.left + imgBounds.width;
      const overBottom = cropBounds.top + cropBounds.height > imgBounds.top + imgBounds.height;

      if (overLeft || overTop || overRight || overBottom) {
        cropRect.scaleX = cropRect.oldScaleX || 1;
        cropRect.scaleY = cropRect.oldScaleY || 1;
      }
    });

    // 裁剪确认（失焦或双击）
    cropRect.on('deselected', () => {
      cropImage(cropRect, img);
      canvas.remove(overlay);
    });

    cropRect.on('mouse:dblclick', () => {
      cropImage(cropRect, img);
      canvas.remove(overlay);
    });
  }

  // 执行裁剪
  function cropImage(cropRect, img) {
    canvas.remove(cropRect);

    // 获取图像边界 + 裁剪框边界（包含 VPT 偏移）
    const imgBounds = img.getBoundingRect(true);
    const cropBounds = cropRect.getBoundingRect(true);

    // 计算裁剪坐标（基于 scaleX/Y 和 crop 偏移）
    const newCropX = (cropBounds.left - imgBounds.left) / img.scaleX;
    const newCropY = (cropBounds.top - imgBounds.top) / img.scaleY;
    const newWidth = cropBounds.width / img.scaleX;
    const newHeight = cropBounds.height / img.scaleY;

    // 设置新的裁剪值
    img.set({
      cropX: (img.cropX || 0) + newCropX,
      cropY: (img.cropY || 0) + newCropY,
      width: newWidth,
      height: newHeight,
      left: cropBounds.left,
      top: cropBounds.top,
    });

    canvas.setActiveObject(img);
    canvas.renderAll();
  }
}
