
const options = {
    skipSpecialTypes: true,
    refreshObjectsOnCanvas: false
};
const rotateIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15.25 18.48V15a.75.75 0 1 0-1.5 0v4c0 .97.78 1.75 1.75 1.75h4a.75.75 0 1 0 0-1.5h-2.6a8.75 8.75 0 0 0-2.07-15.53.75.75 0 1 0-.49 1.42 7.25 7.25 0 0 1 .91 13.34zM8.75 5.52V9a.75.75 0 0 0 1.5 0V5c0-.97-.78-1.75-1.75-1.75h-4a.75.75 0 0 0 0 1.5h2.6a8.75 8.75 0 0 0 2.18 15.57.75.75 0 0 0 .47-1.43 7.25 7.25 0 0 1-1-13.37z"></path></svg>
`;
// 控件尺寸阈值
const CONTROL_SIZE = 20;
const THRESHOLD = CONTROL_SIZE * 2;

function rotatedResizeCursor(baseAngleDeg) {
    return function(eventData, control, fabricObject) {
      const objectAngle = fabricObject.angle || 0;
      const totalAngle = (baseAngleDeg + objectAngle) % 360;
  
      const directions = [
        'ns-resize',       // 0°
        'nesw-resize',     // 45°
        'ew-resize',       // 90°
        'nwse-resize',     // 135°
        'ns-resize',       // 180°
        'nesw-resize',     // 225°
        'ew-resize',       // 270°
        'nwse-resize'      // 315°
      ];
  
      const index = Math.round(totalAngle / 45) % 8;
      return directions[index];
    };
  }
  
    // 通过对象几个属性来判断是否要渲染， 包括：拖拽、旋转、缩放，还有 selectable
    function shouldRenderControl(fabricObject) {
        if (!fabricObject || !fabricObject.selectable || fabricObject.isEditing || fabricObject.__isDragging || fabricObject.__isScaling || fabricObject.__isRotating) {
            return false;
        }else{
            // 这里可以添加其他条件来判断是否渲染控件
            return true;
        }
    }

    // 🌟 控件渲染：带圆角的矩形控件
    function renderRoundedRectControl(ctx, left, top, styleOverride = {}, fabricObject, width = 20, height = 6, radius = 3) {
      if (!shouldRenderControl(fabricObject)) return;  // 不渲染拖拽中、旋转中、缩放中的控件
  
      ctx.save();
      ctx.translate(left, top);
      ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle || 0));
  
      const isHovered = !!this.__hover;
      ctx.fillStyle = isHovered ? '#8b3dff' : '#ffffff';
  
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 4;
  
      const w = width;
      const h = height;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + radius, -h / 2);
      ctx.lineTo(w / 2 - radius, -h / 2);
      ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + radius);
      ctx.lineTo(w / 2, h / 2 - radius);
      ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - radius, h / 2);
      ctx.lineTo(-w / 2 + radius, h / 2);
      ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - radius);
      ctx.lineTo(-w / 2, -h / 2 + radius);
      ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + radius, -h / 2);
      ctx.closePath();
      ctx.fill();
  
      ctx.restore();
    }
  
    // 🌟 控件渲染：圆形控件
    function renderCircleControl(ctx, left, top, styleOverride = {}, fabricObject) {
      if (!shouldRenderControl(fabricObject)) return;  // 不渲染拖拽中、旋转中、缩放中的控件
      const zoom = fabricObject.canvas?.getZoom?.() || 1;
      const width = fabricObject.getScaledWidth()*zoom;
      const height = fabricObject.getScaledHeight()*zoom;
      if ((width < THRESHOLD || height < THRESHOLD) && this !== fabricObject.controls.br) {
        return; // 对象太小，只显示右下角（br）
      }
  
      ctx.save();
      ctx.translate(left, top);
  
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 4;
  
      const isHovered = !!this.__hover;
      ctx.fillStyle = isHovered ? '#8b3dff' : '#ffffff';
  
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, 2 * Math.PI);
      ctx.fill();
  
      ctx.restore();
    }
  
    function svgStringToImage(svgStr) {
      return new Promise((resolve) => {
        const svgBlob = new Blob([svgStr], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.src = url;
      });
    }


    const vertical = function(ctx, left, top, styleOverride, fabricObject) {
      const zoom = fabricObject.canvas?.getZoom?.() || 1;
      const height = fabricObject.getScaledHeight()*zoom;
      if (height < THRESHOLD && this === fabricObject.controls.mr) {
        return; // 对象太矮，只显示上边（mt）
      }
        renderRoundedRectControl.apply(this, [ctx, left, top, styleOverride, fabricObject, 6, 20, 3]);
      }
    const horizontal = function(ctx, left, top, styleOverride, fabricObject) {
        if(fabricObject.type === 'textasset'){
            return;
        }
        const zoom = fabricObject.canvas?.getZoom?.() || 1;
        const width = fabricObject.getScaledWidth()*zoom;
        if (width < THRESHOLD && this === fabricObject.controls.mb) {
          return; // 对象太窄，只显示左边（ml）
        }
        renderRoundedRectControl.apply(this, [ctx, left, top, styleOverride, fabricObject, 20, 6, 3]);
    }
  
    async function init(fabric,canvas) {
        fabric.Object.NUM_FRACTION_DIGITS = 4;
        // 🌟 基础样式配置
        fabric.Object.prototype.set({
            transparentCorners: false,
            borderColor: '#8b3dff',
            cornerColor: '#ffffff',
            borderScaleFactor: 2.5,
            cornerStyle: 'circle',
            cornerStrokeColor: '#8b3dff',
            borderOpacityWhenMoving: 1
        });
      const [rotateImgIcon, rotateImgHoverIcon] = await Promise.all([
        svgStringToImage(rotateIcon.replace('currentColor', '#0d1216')),
        svgStringToImage(rotateIcon.replace('currentColor', '#ffffff'))
      ]);
  
      // 👉 中间边控件（上下左右）
      function intervalControl() {
        fabric.Object.prototype.controls.ml = new fabric.Control({
          x: -0.5, y: 0, offsetX: -1,
          cursorStyleHandler: rotatedResizeCursor(270),
          actionHandler: function(eventData, transform, x, y) {
            const target = transform.target;
            target.__isScaling = true;
            if (target.type === 'textasset') {
                return fabric.controlsUtils.changeWidth(eventData, transform, x, y);
              }
            return fabric.controlsUtils.scalingXOrSkewingY(eventData, transform, x, y);
          },
          render: vertical
        });
      
        fabric.Object.prototype.controls.mr = new fabric.Control({
          x: 0.5, y: 0, offsetX: 1,
          cursorStyleHandler: rotatedResizeCursor(90),
          actionHandler: function(eventData, transform, x, y) {
            const target = transform.target;
            target.__isScaling = true;
            if (target.type === 'textasset') {
                return fabric.controlsUtils.changeWidth(eventData, transform, x, y);
              }
            return fabric.controlsUtils.scalingXOrSkewingY(eventData, transform, x, y);
          },
          render: vertical
        });
      
        fabric.Object.prototype.controls.mt = new fabric.Control({
          x: 0, y: -0.5, offsetY: -1,
          cursorStyleHandler: rotatedResizeCursor(0),
          actionHandler: function(eventData, transform, x, y) {
            const target = transform.target;
            target.__isScaling = true;
            return fabric.controlsUtils.scalingYOrSkewingX(eventData, transform, x, y);
          },
          render: horizontal
        });
      
        fabric.Object.prototype.controls.mb = new fabric.Control({
          x: 0, y: 0.5, offsetY: 1,
          cursorStyleHandler: rotatedResizeCursor(180),
          actionHandler: function(eventData, transform, x, y) {
            const target = transform.target;
            target.__isScaling = true;
            return fabric.controlsUtils.scalingYOrSkewingX(eventData, transform, x, y);
          },
          render: horizontal
        });
      }
      
  
      function peakControl() {
        const cornerAngles = {
          tl: 315,
          tr: 55,
          bl: 225,
          br: 135
        };
      
        Object.entries(cornerAngles).forEach(([pos, angle]) => {
          fabric.Object.prototype.controls[pos] = new fabric.Control({
            x: pos.includes('l') ? -0.5 : 0.5,
            y: pos.includes('t') ? -0.5 : 0.5,
            cursorStyleHandler: rotatedResizeCursor(angle),
            actionHandler: function(eventData, transform, x, y) {
              const target = transform.target;
              target.__isScaling = true;
              return fabric.controlsUtils.scalingEqually(eventData, transform, x, y);
            },
            render: renderCircleControl
          });
        });
      }

  
      // 👉 旋转控件（SVG 图标）
      function rotationControl() {
        function drawImg(ctx, left, top, w = 36, h = 36, angle = 0) {
            if (!rotateImgIcon || !rotateImgIcon.complete) return;
          
            const isHovered = !!this.__hover;
            const img = isHovered ? rotateImgHoverIcon : rotateImgIcon;
          
            ctx.save();
            ctx.translate(left, top);
            ctx.rotate(fabric.util.degreesToRadians(angle));
          
            // ✅ 背景圆（直径为 24px）
            const radius = 12;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 4;
            ctx.fillStyle = isHovered ? '#8b3dff' : '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, 2 * Math.PI);
            ctx.fill();
          
            // ✅ 图标缩小为一半（比如 16x16）
            const iconSize = 16;
            ctx.drawImage(img, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
          
            ctx.restore();
          }
          
          
          
        fabric.Object.prototype.controls.mtr = new fabric.Control({
          x: 0,
          y: -0.5, // 相对于对象的高度
          offsetY: -40, // 固定位置（像素）
          cursorStyleHandler: fabric.controlsUtils.rotationStyleHandler,
          actionHandler: function (eventData, transform, x, y) {
            const target = transform.target;
            target.__isRotating = true;
            return fabric.controlsUtils.rotationWithSnapping(eventData, transform, x, y);
          },
          actionName: 'rotate',
          render: function(ctx, left, top, styleOverride, fabricObject) {
            if (!shouldRenderControl(fabricObject)) return; // 旋转中、拖拽中、缩放中不显示
            
            drawImg.apply(this, [ctx, left, top, 36, 36, fabricObject.angle]);
            
          }
        });
      }
  
      
  
      peakControl();
      intervalControl();
      rotationControl();
      
  
      // 🔄 挂载到所有对象
      Object.entries(fabric).forEach(([name, klass]) => {
        if (typeof klass === 'function' && klass.prototype instanceof fabric.Object) {
          const isSpecial = klass.prototype instanceof fabric.Group || name === 'ActiveSelection';
          if (options.skipSpecialTypes && isSpecial) return;
          klass.prototype.controls = fabric.Object.prototype.controls;
        }
      });
  
      // 🧼 自动清除旋转标志
      canvas?.on('mouse:up', () => {
        canvas.getObjects().forEach(obj => {
          if (obj.__isRotating) {
            obj.__isRotating = false;
          }
          if (obj.__isScaling) {
            obj.__isScaling = false;
          }
          if (obj.__isDragging) {
            obj.__isDragging = false;
          }
        });
        canvas.requestRenderAll();
      });
  
      // 强制刷新控件（可选）
      if (options.refreshObjectsOnCanvas && canvas instanceof fabric.Canvas) {
        canvas.getObjects().forEach(obj => {
          if (obj instanceof fabric.Object && !obj.isEditing) {
            obj.controls = fabric.Object.prototype.controls;
          }
        });
        canvas.requestRenderAll();
      }
  
      let lastHoveredObject = null;
      let lastHoveredCorner = 0;
      const controlNames = ['mr', 'ml', 'mt', 'mb', 'tl', 'tr', 'bl', 'br', 'mtr'];
  
      // 清除所有 hover 状态的封装函数
      function clearHoverState(target) {
        if(lastHoveredObject){
          if(target!== lastHoveredObject || target.__corner !== lastHoveredCorner){
            const control = lastHoveredObject.controls?.[lastHoveredCorner];
            if (control && control.__hover) {
                control.__hover = false;
                lastHoveredObject.canvas.requestRenderAll();
                lastHoveredObject = null;
                lastHoveredCorner = 0;
            }
            }
        }
      }
      // 🌟 控件 hover 检测
      function handleControlHover(event) {
        const target = event.target;
        clearHoverState(target);
        if (target&&target.__corner) {
          const corner = target.__corner;
          if(target === lastHoveredObject && corner === lastHoveredCorner){
            return; // 如果当前对象和上次 hover 的对象相同，则不处理
          }
          if(corner && controlNames.includes(corner)) {
            const control = target.controls[corner];
            if (control) {
              control.__hover = true;
            }
            lastHoveredObject = target;
            lastHoveredCorner = corner;
            target.canvas.requestRenderAll();
          }
        }
      }
  
      canvas.on('mouse:move', function(event) {
        requestAnimationFrame(() => {
            handleControlHover(event);
        });
        
      });
  
      // // 👏 控件拖拽时隐藏，拖拽结束后显示控件
      canvas.on('object:moving', (e) => {
        e.target.__isDragging = true;
      });
  
    }


  export default {
    init
  }

