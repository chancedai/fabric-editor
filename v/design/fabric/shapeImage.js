import { fabric } from 'fabric';


fabric.Shapeimage = fabric.util.createClass(fabric.Image, {
    type: "shapeimage",
    shapeHash: null,
    panning: !1,
    letterPaths: {
      A: ["3,0 7,0 10,10 7,10 6.5,8 3.5,8 3,10 0,10 3,0", "5,2 6,5 4,5 5,2"],
      B: [
        "0,0 8.5,0 10,2 10,4 9.5,5 10,6 10,8 8.5,10 0,10 0,0",
        "3,2 6.5,2 7,3 6.5,4 3,4 3,2",
        "3,6 6.5,6 7,7 6.5,8 3,8 3,6",
      ],
      C: [
        "2,0 8.5,0 10,2 10,3 7,3 6.5,2 3.7,2 3,3 3,7 3.7,8 6.5,8 7,7 10,7 10,8 8.5,10 2,10 0,7 0,3",
      ],
      D: ["0,0 8,0 10,3 10,7 8,10 0,10 0,0", "3,2 6,2 7,3.5 7,6.5 6,8 3,8"],
      E: ["0,0 10,0 10,2 3,2 3,4 7,4 7,6 3,6 3,8 10,8 10,10 0,10"],
      F: ["0,0 10,0 10,2 3,2 3,4 7,4 7,6 3,6 3,10 0,10"],
      G: [
        "2,0 8.5,0 10,2 10,3 7,3 6.3,2 3.7,2 3,3 3,7 3.7,8 6.3,8 7,7 7,6 6,6 6,5 10,5 10,8 8.5,10 2,10 0,7 0,3",
      ],
      H: ["0,0 3,0 3,3 7,3 7,0 10,0 10,10 7,10 7,6 3,6 3,10 0,10"],
      I: ["3.5,0 6.5,0 6.5,10 3.5,10"],
      J: ["5.5,0 8.5,0 8.5,8 6.5,10 3.5,10 1.5,8 1.5,7 4.5,7 4.5,8 5.5,8"],
      K: [
        "0,0 3,0 3,3 7,0 10,0 10,1 6.5,3.5 10,9 10,10 7.5,10 4.3,4.9 3,6 3,10 0,10",
      ],
      L: ["0,0 3,0 3,8 10,8 10,10 0,10"],
      M: ["0,0 3,0 5,3 7,0 10,0 10,10 7,10 7,4 5,7 3,4 3,10 0,10"],
      N: ["0,0 3,0 7,5 7,0 10,0 10,10 7,10 3,5 3,10 0,10"],
      O: [
        "2,0 8,0 10,3 10,7 8,10 2,10 0,7 0,3 2,0",
        "4,2 6,2 7,3.5 7,6.5 6,8 4,8 3,6.5 3,3.5",
      ],
      0: [
        "2,0 8,0 10,3 10,7 8,10 2,10 0,7 0,3 2,0",
        "4,2 6,2 7,3.5 7,6.5 6,8 4,8 3,6.5 3,3.5",
      ],
      P: ["0,0 8,0 10,3 8,6 3,6 3,10 0,10 0,0", "3,2 6,2 6.5,3 6,4 3,4"],
      Q: [
        "2,0 8,0 10,3 10,7 9.5,7.5 10,8 10,10 8,10 7.5,9.5 7,10 2,10 0,7 0,3 2,0",
        "4,2 6,2 7,3.5 7,6.5 6,8 4,8 3,6.5 3,3.5",
      ],
      R: [
        "0,0 8,0 10,3 8,6 10,10 7,10 5,6 3,6 3,10 0,10 0,0",
        "3,2 6,2 6.5,3 6,4 3,4",
      ],
      S: [
        "1.5,0 10,0 10,2 4,2 3.5,3 4,4 8.5,4 10,6 10,8 8.5,10 0,10 0,8 6,8 6.5,7 6,6 1.5,6 0,4 0,2",
      ],
      T: ["0,0 10,0 10,2 6.5,2 6.5,10 3.5,10 3.5,2 0,2"],
      U: ["0,0 3,0 3,7 4,8 6,8 7,7 7,0 10,0 10,8 8.5,10 1.5,10 0,8"],
      V: ["0,0 2.5,0 5,8 7.5,0 10,0 7,10 3,10"],
      W: [
        "0,0 2.5,0 3.5,6 4.5,1 5.5,1 6.5,6 7.5,0 10,0 8,10 5.5,10 5,7.6 4.5,10 2,10",
      ],
      X: ["0,0 3,0 5,3 7,0 10,0 6.5,5 10,10 7,10 5,7 3,10 0,10, 3.5,5"],
      Y: ["0,0 3,0 5,3 7,0 10,0 6.5,5 6.5,10 3.5,10 3.5,5"],
      Z: ["0,0 10,0 10,2 4,8 10,8 10,10 0,10 0,8 6,2 0,2"],
      1: ["3.5,0 6.5,0 6.5,10 3.5,10 3.5,3 2,3"],
      2: [
        "1.5,0 8.5,0 10,2 10,3 4.5,8 10,8 10,10 0,10 0,8 5.5,3 5,2 4,2 3.5,3 0,3 0,2",
      ],
      3: [
        "1.5,0 8.5,0 10,2 10,8 8.5,10 1.5,10 0,8 0,7 3,7 3.5,8 6.5,8 7,7 7,6 5,6 5,4 7,4 7,3 6.5,2 3.5,2 3,3 0,3 0,2",
      ],
      4: [
        "2,0 9,0 9,5 10,5 10,7 9,7 9,10 6,10 6,7 0,7 0,3.5 2,0",
        "4.5,2 6,2 6,5 3,5",
      ],
      5: [
        "0,0 10,0 10,2 3,2 3,4 9,4 10,5 10,8 8.5,10 1,10 0,9 0,7 3.5,7 4,8 6,8 6.5,7 6,6 0,6",
      ],
      6: [
        "1.5,0 8.5,0 10,2 10,3 7,3 6.5,2 3.5,2 3,3 3.5,4 9,4 10,5 10,8 8.5,10 1.5,10 0,8 0,2 1.5,0",
        "3.5,6 6.5,6 7,7 6.5,8 3.5,8 3,7",
      ],
      7: ["0,0 10,0 10,1.5 4,10 0,10 5,3 0,3"],
      8: [
        "1.5,0 8.5,0 10,2 10,4 9.5,5 10,6 10,8 8.5,10 1.5,10 0,8 0,6 0.5,5 0,4 0,2 1.5,0",
        "3.5,2 6.5,2 7,3 6.5,4 3.5,4 3,3 3.5,2",
        "3.5,6 6.5,6 7,7 6.5,8 3.5,8 3,7",
      ],
      9: [
        "1.5,0 8.5,0 10,2 10,8 8.5,10 1.5,10 0,8 0,7 3,7 3.5,8 6.5,8 7,7 6.5,6 1,6 0,5 0,2 1.5,0",
        "3.5,2 6.5,2 7,3 6.5,4 3.5,4 3,3 3.5,2",
      ],
      "#": [
        "2,0 4,0 4,2 6,2 6,0 8,0 8,2 10,2 10,4 8,4 8,6 10,6 10,8 8,8 8,10 6,10 6,8 4,8 4,10 2,10 2,8 0,8 0,6 2,6 2,4 0,4 0,2 2,2 2,0",
        "4,4 6,4 6,6 4,6",
      ],
    },
    // 重构后的代码片段：initialize 方法部分
  initialize: function (image, options) {
    // 缓存属性列表
    this.cacheProperties.push(
      "ppColor",
      "ppWidth",
      "cornerRadius",
      "blurWidth",
      "shape",
      "zoomLevel",
      "orgWidth",
      "orgHeight",
      "cx",
      "cy",
      "cw",
      "ch",
      "customPaths" // 新增缓存属性，确保序列化
    );
  
    // 如果未提供 options，则初始化为空对象
    options = options || {};
  
    // 初始尺寸备份
    options.initialWidth = options.width;
    options.initialHeight = options.height;
    // 默认值初始化
    options.ppColor = options.ppColor || "#fff";                   // 描边颜色
    options.ppWidth = options.ppWidth !== undefined ? options.ppWidth : 0; // 描边宽度
    options.cornerRadius = options.cornerRadius !== undefined ? options.cornerRadius : 0; // 圆角半径
    options.blurWidth = options.blurWidth !== undefined ? options.blurWidth : 0; // 模糊宽度
    options.orgWidth = options.orgWidth || image.width;           // 原始宽度
    options.orgHeight = options.orgHeight || image.height;        // 原始高度
    options.zoomLevel = options.zoomLevel || 0;                   // 缩放等级
    options.shape = options.shape || "rectangle";                 // 默认形状
    options.cx = options.cx || 0;                                 // 裁剪起始 X
    options.cy = options.cy || 0;                                 // 裁剪起始 Y
    options.cw = options.cw || options.orgWidth;                  // 裁剪宽度
    options.ch = options.ch || options.orgHeight;                 // 裁剪高度
    this.customPaths = options.customPaths || null;  // 自定义路径
  
    // 调用父类初始化方法
    this.callSuper("initialize", image, options);
  
    // 绑定事件变量（用于拖拽）
    let startX, startY, originCx, originCy, scaleXRatio, scaleYRatio;
  
    // 注册缩放事件：缩放时居中
    this.on("scaling", this.setCenter)
  
      // 鼠标按下：启动拖拽模式
      .on("mousedown", function (event) {
        if (event.e.altKey) {
          this.panning = this.lockMovementX = this.lockMovementY = true;
          this.hasControls = false;
          startX = event.pointer.x;
          startY = event.pointer.y;
          originCx = this.cx;
          originCy = this.cy;
          scaleXRatio = this.cw / this.getScaledWidth();
          scaleYRatio = this.ch / this.getScaledHeight();
        }
      })
  
      // 鼠标移动：实时调整裁剪区域
      .on("mousemove", function (event) {
        if (this.panning) {
          this.cx = originCx - (event.pointer.x - startX) * scaleXRatio;
          this.cy = originCy - (event.pointer.y - startY) * scaleYRatio;
          this._checkBoundaries();
          this.canvas && this.canvas.requestRenderAll();
        }
      })
  
      // 鼠标释放：结束拖拽
      .on("mouseup", function () {
        this.hasControls = true;
        this.panning = this.lockMovementX = this.lockMovementY = false;
        this.canvas && this.canvas.requestRenderAll();
      });
  },
  
  changeOrientation: function () {
    // 创建临时画布并获取其上下文
    const tempCanvas = fabric.util.createCanvasElement();
    const ctx = tempCanvas.getContext("2d");
  
    // 旋转后的新宽高（原始宽高互换）
    const newWidth = this.orgHeight;
    const newHeight = this.orgWidth;
  
    // 设置临时画布大小
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
  
    // 进行旋转操作：顺时针90度
    ctx.translate(newWidth, 0);
    ctx.rotate(Math.PI / 2);
  
    // 绘制原始图像到旋转后的画布
    ctx.drawImage(this._originalElement, 0, 0);
  
    // 更新图像元素和属性
    this.setElement(tempCanvas, {
      initialWidth: this.initialHeight,
      initialHeight: this.initialWidth,
  
      width: this.height,
      height: this.width,
  
      orgWidth: this.orgHeight,
      orgHeight: this.orgWidth,
  
      cx: this.cy,
      cy: this.cx,
      cw: this.ch,
      ch: this.cw,
  
      ppColor: this.ppColor,
      ppWidth: this.ppWidth,
      cornerRadius: this.cornerRadius,
      blurWidth: this.blurWidth,
      zoomLevel: this.zoomLevel,
      shape: this.shape,
    });
  
    // 请求画布重绘
    this.canvas.requestRenderAll();
  },


  
  drawShape: function (ctx, shapeType, shouldStroke, width, height) {
    const canvasWidth = width || this.width;
    const canvasHeight = height || this.height;
    const borderWidth = +this.ppWidth;
    const scaleRatio = canvasWidth / canvasHeight;
    const cornerRadius = +this.cornerRadius;
    const self = this;


    /**
     * 将归一化后的 paths 绘制到 canvas。
     * @param {Array} paths 通过 extractCustomPathsFromFabricObject 提取的 paths
     * @param {CanvasRenderingContext2D} ctx canvas 上下文
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     */
    function drawCustomShape(paths, ctx, canvasWidth, canvasHeight) {
      if (!paths || !paths.length) return;
      ctx.beginPath();
      for (const pathObj of paths) {
        const path = pathObj.path;
        let subPathStarted = false;

        for (const cmd of path) {
          const [command, ...args] = cmd;
          switch (command) {
            case "M":
              ctx.moveTo(args[0] * canvasWidth, args[1] * canvasHeight);
              subPathStarted = true;
              break;
            case "L":
              ctx.lineTo(args[0] * canvasWidth, args[1] * canvasHeight);
              break;
            case "C":
              ctx.bezierCurveTo(...args.map((v, i) => (i % 2 === 0 ? v * canvasWidth : v * canvasHeight)));
              break;
            case "Q":
              ctx.quadraticCurveTo(...args.map((v, i) => (i % 2 === 0 ? v * canvasWidth : v * canvasHeight)));
              break;
            case "Z":
              ctx.closePath();
              subPathStarted = false;
              break;
          }
        }
        if (subPathStarted) ctx.closePath();
      }
      // ctx.strokeStyle = 'transparent';
      // ctx.stroke();
    }
  
    /**
     * 绘制单个字母形状（来自字体路径）
     */
    function drawLetterShape(letter) {
      const scaleX = canvasWidth / 10;
      const scaleY = canvasHeight / 10;
      const paths = self.letterPaths[letter];
  
      ctx.beginPath();
      for (let path of paths) {
        const commands = path.split(" ");
        let isStarted = false;
        for (let command of commands) {
          const [x, y] = command.split(",").map(Number);
          const px = scaleX * x;
          const py = scaleY * y;
          isStarted ? ctx.lineTo(px, py) : (ctx.moveTo(px, py), isStarted = true);
        }
      }
      ctx.closePath();
    }

    


  
    /**
     * 绘制星形
     */
    function drawStar(points, outerRadius, innerRadius, scale) {
      ctx.save();
      ctx.beginPath();
      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      ctx.moveTo(0, -outerRadius);
      for (let i = 1; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI * i) / points;
        const x = radius * Math.sin(angle) * scale;
        const y = -radius * Math.cos(angle);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.restore();
    }
  
    /**
     * 形状绘制分发
     */
    function drawPrimitiveShape(type) {
      ctx.beginPath();
      switch (type) {
        case "hexagon1":
          ctx.moveTo(canvasWidth * 0.25, 0);
          ctx.lineTo(canvasWidth * 0.75, 0);
          ctx.lineTo(canvasWidth, canvasHeight / 2);
          ctx.lineTo(canvasWidth * 0.75, canvasHeight);
          ctx.lineTo(canvasWidth * 0.25, canvasHeight);
          ctx.lineTo(0, canvasHeight / 2);
          break;
  
        case "hexagon2":
          ctx.moveTo(canvasWidth / 2, 0);
          ctx.lineTo(canvasWidth, canvasHeight / 4);
          ctx.lineTo(canvasWidth, (3 * canvasHeight) / 4);
          ctx.lineTo(canvasWidth / 2, canvasHeight);
          ctx.lineTo(0, (3 * canvasHeight) / 4);
          ctx.lineTo(0, canvasHeight / 4);
          break;
  
        case "octagon1":
          ctx.moveTo(canvasWidth * 0.3, 0);
          ctx.lineTo(canvasWidth * 0.7, 0);
          ctx.lineTo(canvasWidth, canvasHeight * 0.3);
          ctx.lineTo(canvasWidth, canvasHeight * 0.7);
          ctx.lineTo(canvasWidth * 0.7, canvasHeight);
          ctx.lineTo(canvasWidth * 0.3, canvasHeight);
          ctx.lineTo(0, canvasHeight * 0.7);
          ctx.lineTo(0, canvasHeight * 0.3);
          break;
  
        case "octagon2":
          ctx.moveTo(canvasWidth * 0.5, 0);
          ctx.lineTo(canvasWidth * 0.85, canvasHeight * 0.15);
          ctx.lineTo(canvasWidth, canvasHeight * 0.5);
          ctx.lineTo(canvasWidth * 0.85, canvasHeight * 0.85);
          ctx.lineTo(canvasWidth * 0.5, canvasHeight);
          ctx.lineTo(canvasWidth * 0.15, canvasHeight * 0.85);
          ctx.lineTo(0, canvasHeight * 0.5);
          ctx.lineTo(canvasWidth * 0.15, canvasHeight * 0.15);
          break;
  
        case "circle":
          ctx.ellipse(
            canvasWidth / 2,
            canvasHeight / 2,
            canvasWidth / 2,
            canvasHeight / 2,
            0,
            0,
            Math.PI * 2
          );
          break;
  
        case "diamond":
          ctx.moveTo(canvasWidth / 2, 0);
          ctx.lineTo(canvasWidth, canvasHeight / 2);
          ctx.lineTo(canvasWidth / 2, canvasHeight);
          ctx.lineTo(0, canvasHeight / 2);
          break;
  
        case "heart":
          ctx.save();
          const sx = canvasWidth / 110;
          const sy = canvasHeight / 95;
          ctx.translate(canvasWidth / 2, canvasHeight / 2);
          ctx.moveTo(sx, -33 * sy);
          ctx.bezierCurveTo(0, -36 * sy, -5 * sx, -47 * sy, -25 * sx, -47 * sy);
          ctx.bezierCurveTo(-55 * sx, -47 * sy, -55 * sx, -10.5 * sy, -55 * sx, -10.5 * sy);
          ctx.bezierCurveTo(-55 * sx, 7 * sy, -35 * sx, 29 * sy, 0, 47 * sy);
          ctx.bezierCurveTo(35 * sx, 29 * sy, 55 * sx, 7 * sy, 55 * sx, -10.5 * sy);
          ctx.bezierCurveTo(55 * sx, -10.5 * sy, 55 * sx, -47 * sy, 25 * sx, -47 * sy);
          ctx.bezierCurveTo(10 * sx, -47 * sy, 0, -36 * sy, 0, -33 * sy);
          ctx.restore();
          break;
  
        case "roundRect":
          const r = cornerRadius;
          ctx.moveTo(r, 0);
          ctx.lineTo(canvasWidth - r, 0);
          ctx.quadraticCurveTo(canvasWidth, 0, canvasWidth, r);
          ctx.lineTo(canvasWidth, canvasHeight - r);
          ctx.quadraticCurveTo(canvasWidth, canvasHeight, canvasWidth - r, canvasHeight);
          ctx.lineTo(r, canvasHeight);
          ctx.quadraticCurveTo(0, canvasHeight, 0, canvasHeight - r);
          ctx.lineTo(0, r);
          ctx.quadraticCurveTo(0, 0, r, 0);
          break;
  
        case "triangle-t":
          ctx.moveTo(canvasWidth / 2, 0);
          ctx.lineTo(canvasWidth, canvasHeight);
          ctx.lineTo(0, canvasHeight);
          break;
  
        case "triangle-b":
          ctx.moveTo(0, 0);
          ctx.lineTo(canvasWidth, 0);
          ctx.lineTo(canvasWidth / 2, canvasHeight);
          break;
  
        case "triangle-l":
          ctx.moveTo(canvasWidth, 0);
          ctx.lineTo(canvasWidth, canvasHeight);
          ctx.lineTo(0, canvasHeight / 2);
          break;
  
        case "triangle-r":
          ctx.moveTo(0, 0);
          ctx.lineTo(0, canvasHeight);
          ctx.lineTo(canvasWidth, canvasHeight / 2);
          break;
  
        case "triangle-lt":
          ctx.moveTo(0, 0);
          ctx.lineTo(canvasWidth, 0);
          ctx.lineTo(0, canvasHeight);
          break;
  
        case "triangle-rb":
          ctx.moveTo(canvasWidth, 0);
          ctx.lineTo(canvasWidth, canvasHeight);
          ctx.lineTo(0, canvasHeight);
          break;
  
        case "triangle-rt":
          ctx.moveTo(0, 0);
          ctx.lineTo(canvasWidth, 0);
          ctx.lineTo(canvasWidth, canvasHeight);
          break;
  
        case "triangle-lb":
          ctx.moveTo(0, 0);
          ctx.lineTo(0, canvasHeight);
          ctx.lineTo(canvasWidth, canvasHeight);
          break;
  
        default:
          ctx.rect(0, 0, canvasWidth, canvasHeight);
          break;
      }
      ctx.closePath();
    }
  
    // ==== 主逻辑 ====

    if(shapeType === 'custom'){
      // drawCustomShape(this.customPaths);
      drawCustomShape(this.customPaths, ctx, canvasWidth, canvasHeight);
    }else if (/^letter\-(.{1})/.test(shapeType)) {
      // 字母形状的绘制
      drawLetterShape(RegExp.$1);
    }else if (shapeType.startsWith("star")) {
      // 星形形状的绘制
      const size = canvasHeight;
      const starPointMap = {
        star5: [5, size / 2, size / 4],
        star6: [6, size / 2, size / 3.5],
        star12: [12, size / 2, size / 2.8],
        star24: [24, size / 2, size / 2.3]
      };
      const [points, outer, inner] = starPointMap[shapeType];
      drawStar(points, outer, inner, scaleRatio);
    } else {
      // 其他形状
      drawPrimitiveShape(shapeType);
    }
  
  
    // ==== 可选描边 ====
    if (shouldStroke && borderWidth > 0) {
      ctx.save();
      ctx.scale(1 / this.scaleX, 1 / this.scaleY);
      ctx.lineCap = "square";
      ctx.lineWidth = 2 * borderWidth;
      ctx.strokeStyle = this.ppColor;
      ctx.stroke();
      ctx.restore();
    }
  
    ctx.clip("evenodd");
  },
  
  getBlurCanvas: function () {
    const viewportTransform = this.canvas.viewportTransform;
    const blur = this.blurWidth;
  
    const blurCanvas = fabric.util.createCanvasElement();
    const ctx = blurCanvas.getContext("2d");
  
    const scaledWidth = this.width * viewportTransform[0];
    const scaledHeight = this.height * viewportTransform[3];
  
    blurCanvas.width = scaledWidth;
    blurCanvas.height = scaledHeight;
  
    // Apply scaling to context
    ctx.scale(viewportTransform[0], viewportTransform[3]);
  
    // Configure shadow for blur effect
    ctx.fillStyle = "#000";
    ctx.shadowBlur = blur * viewportTransform[0];
    ctx.shadowColor = "#000";
    ctx.shadowOffsetX = scaledWidth + blur * viewportTransform[0];
    ctx.shadowOffsetY = scaledHeight + blur * viewportTransform[3];
  
    ctx.save();
    ctx.translate(-this.width, -this.height);
  
    // Draw the custom shape (no fill) with reduced size for blur margin
    this.drawShape(ctx, this.shape, false, this.width - 2 * blur, this.height - 2 * blur);
  
    ctx.restore();
  
    ctx.fill("evenodd");
  
    // Composite original image inside the blurred shape
    ctx.globalCompositeOperation = "source-atop";
    ctx.drawImage(
      this._element,
      this.cx, this.cy, this.cw, this.ch, // source area
      0, 0, this.width, this.height      // destination area
    );
  
    return blurCanvas;
  },
  
  _render: function (ctx) {
    const hasPinhole = this.ppWidth > 0;
    const needsBlur = this.blurWidth > 0;
    const needsCustomRender = 
      this.shape !== "rectangle" || this.ppWidth !== 0 || this.zoomLevel !== 0 || this.blurWidth !== 0;
  
    // If simple rectangle with no effects, use default rendering
    // if (!needsCustomRender) {
    //   return this.callSuper("_render", ctx);
    // }
  
    const sourceElement = needsBlur ? this.getBlurCanvas() : this._element;
  
    // Translate canvas origin to center
    ctx.translate(-this.width / 2, -this.height / 2);
  
    // Use temporary canvas for masking if pinhole is not used
    let renderCtx = ctx;
    let tempCanvas;
  
    if (!hasPinhole) {
      tempCanvas = fabric.util.createCanvasElement();
      tempCanvas.width = this.width;
      tempCanvas.height = this.height;
      renderCtx = tempCanvas.getContext("2d");
    }
  
    // Draw the custom shape path (used for clipping or pinhole)
    this.drawShape(renderCtx, this.shape, true);
  
    // Draw image content
    if (needsBlur) {
      renderCtx.drawImage(sourceElement, 0, 0, this.width, this.height);
    } else {
      renderCtx.drawImage(
        sourceElement,
        this.cx, this.cy, this.cw, this.ch, // source
        0, 0, this.width, this.height      // destination
      );
    }
  
    // If we used an offscreen canvas, draw it back to the main context
    if (!hasPinhole) {
      ctx.drawImage(tempCanvas, 0, 0);
    }
  
    // Track state hash to detect changes
    const newHash = `${this.shape}${this.ppWidth}${this.cornerRadius}${this.ppColor}${this.blurWidth}${this.cx}${this.cy}${this.zoomLevel}${this.customPaths}`;
  
    if (newHash !== this.shapeHash) {
      this.shapeHash = newHash;
      if (this.canvas) {
        this.canvas.fire("object:modified", { target: this });
      }
    }
  },
  
  setCenter: function () {
    const scaledWidth = this.getScaledWidth();
    const scaledHeight = this.getScaledHeight();
    const originalAspect = this.orgWidth / this.orgHeight;
    const scaledAspect = scaledWidth / scaledHeight;
  
    if (scaledAspect >= originalAspect) {
      // Fit to width
      this.cw = this.orgWidth;
      this.ch = this.orgWidth / scaledAspect;
      this.cx = 0;
      this.cy = (this.orgHeight - this.ch) / 2;
    } else {
      // Fit to height
      this.cw = this.orgHeight * scaledAspect;
      this.ch = this.orgHeight;
      this.cx = (this.orgWidth - this.cw) / 2;
      this.cy = 0;
    }
  
    this.zoomLevel = 0;
    return this;
  },
  _checkBoundaries: function () {
    // Clamp content width/height to [1, original size]
    this.cw = Math.max(1, Math.min(this.cw, this.orgWidth));
    this.ch = Math.max(1, Math.min(this.ch, this.orgHeight));
  
    // Clamp position to valid bounds
    this.cx = Math.max(0, Math.min(this.cx, this.orgWidth - this.cw));
    this.cy = Math.max(0, Math.min(this.cy, this.orgHeight - this.ch));
  },
  
    // _checkBoundaries: function () {
    //   this.cw > this.orgWidth && (this.cw = this.orgWidth);
    //   this.ch > this.orgHeight && (this.ch = this.orgHeight);
    //   1 >= this.cw && (this.cw = 1);
    //   1 >= this.ch && (this.ch = 1);
    //   0 > this.cx && (this.cx = 0);
    //   0 > this.cy && (this.cy = 0);
    //   this.cx > this.orgWidth - this.cw && (this.cx = this.orgWidth - this.cw);
    //   this.cy > this.orgHeight - this.ch && (this.cy = this.orgHeight - this.ch);
    // },
    _doZoom: function (zoomDelta) {
      const widthDelta = (this.orgWidth / 100) * zoomDelta;
      const heightDelta = widthDelta / (this.getScaledWidth() / this.getScaledHeight());
    
      this.zoomLevel += zoomDelta;
    
      if (this.zoomLevel > 99) {
        this.cw = this.ch = 1;
        this.zoomLevel = 100;
      } else if (this.zoomLevel < 1) {
        this.setCenter();
        this.zoomLevel = 0;
      } else {
        this.cw -= widthDelta;
        this.ch -= heightDelta;
        this.cx += widthDelta / 2;
        this.cy += heightDelta / 2;
      }
    
      // Ensure clean integers
      this.cw = Math.round(this.cw);
      this.ch = Math.round(this.ch);
      this.cx = Math.round(this.cx);
      this.cy = Math.round(this.cy);
    },
    
    zoomBy: function (offsetXPercent, offsetYPercent, zoomDelta) {
      const percentToWidth = this.width / 100;
      const percentToHeight = this.height / 100;
    
      if (offsetXPercent) {
        this.cx += offsetXPercent * percentToWidth;
      }
      if (offsetYPercent) {
        this.cy += offsetYPercent * percentToHeight;
      }
    
      if (zoomDelta) {
        this._doZoom(zoomDelta);
      }
    
      this.cx = Math.round(this.cx);
      this.cy = Math.round(this.cy);
    
      this._checkBoundaries();
    },
    
    zoomTo: function (targetXPercent, targetYPercent, targetZoomLevel) {
      if (targetXPercent) {
        this.cx = (targetXPercent / 100) * (this.orgWidth - this.cw);
      }
    
      if (targetYPercent) {
        this.cy = (targetYPercent / 100) * (this.orgHeight - this.ch);
      }
    
      if (typeof targetZoomLevel === 'number') {
        const zoomDelta = targetZoomLevel - this.zoomLevel;
        this._doZoom(zoomDelta);
      }
    
      this._checkBoundaries();
    },
    
    reset: function () {
      this.set({
        scaleX: 1,
        scaleY: 1,
        width: this.initialWidth,
        height: this.initialHeight,
        opacity: 1,
        ppWidth: 0,
        cornerRadius: 0,
        blurWidth: 0,
        ppColor: "#fff",
        angle: 0,
        zoomLevel: 0,
        cx: 0,
        cy: 0,
        cw: this.orgWidth,
        ch: this.orgHeight,
        shape: "rectangle",
        skewX: 0,
        skewY: 0,
        flipX: false,
        flipY: false,
      });
    
      this.setCoords();
      this._element = this._originalElement;
      this.setCenter();
      this.canvas.requestRenderAll();
    },
    /**
     * 替换当前对象的图片内容
     * @param {HTMLImageElement | HTMLCanvasElement} newImageElement - 新的图像元素
     * @param {Object} [options={}] - 可选参数
     * @param {boolean} [options.resetSize=true] - 是否重置到新图像的宽高
     * @param {boolean} [options.center=true] - 是否自动居中裁剪区域
     * @param {boolean} [options.keepZoomLevel=false] - 是否保持当前 zoomLevel
     */
      replaceImage: function (newImageElement, options = {}) {
      if (!newImageElement) return;

      const {
        resetSize = true,
        center = true,
        keepZoomLevel = false,
      } = options;

      // 更新 element（并更新一些基本参数）
      this.setElement(newImageElement, {
        width: resetSize ? newImageElement.width : this.width,
        height: resetSize ? newImageElement.height : this.height,
        orgWidth: newImageElement.width,
        orgHeight: newImageElement.height,
        cw: newImageElement.width,
        ch: newImageElement.height,
        cx: 0,
        cy: 0,
      });

      // 更新原始元素引用（若有）
      this._originalElement = newImageElement;

      // 是否重置中心对齐
      if (center) {
        this.setCenter();
      }

      // 如果需要保留缩放等级，则复原 zoomLevel
      if (keepZoomLevel) {
        this._doZoom(this.zoomLevel);
      } else {
        this.zoomLevel = 0;
      }

      // 重新渲染
      if (this.canvas) {
        this.canvas.requestRenderAll();
      }
    },

    
    toObject: function (extraProps = []) {
      // 过滤有效的滤镜对象
      const serializedFilters = this.filters
        .filter(filter => filter) // 忽略 null 或 undefined
        .map(filter => filter.toObject());
    
      // 基础属性列表
      const baseProps = [
        "crossOrigin", "cropX", "cropY", "shape",
        "orgWidth", "orgHeight", "ppColor", "ppWidth",
        "cornerRadius", "blurWidth", "zoomLevel", "minimized",
        "cx", "cy", "cw", "ch", "customPaths"
      ];
    
      // 调用父类的 toObject 方法，附加额外的属性
      const inheritedProps = this.callSuper("toObject", baseProps.concat(extraProps));
    
      // 合并属性
      const result = fabric.util.object.extend(inheritedProps, {
        src: this.getSrc(),
        filters: serializedFilters
      });
    
      // 若存在 resizeFilter，也序列化
      if (this.resizeFilter) {
        result.resizeFilter = this.resizeFilter.toObject();
      }
    
      return result;
    },
    
  });
  fabric.Shapeimage.fromObject = function (serialized, callback) {
    const obj = fabric.util.object.clone(serialized);
  
    fabric.util.loadImage(
      obj.src,
      function (image, isError) {
        if (isError) {
          callback?.(null, isError);
          return;
        }
  
        // 初始化主 filters
        fabric.Shapeimage.prototype._initFilters.call(obj, obj.filters, function (mainFilters) {
          obj.filters = mainFilters || [];
  
          // 初始化 resizeFilter
          fabric.Shapeimage.prototype._initFilters.call(obj, [obj.resizeFilter], function (resizeFilters) {
            obj.resizeFilter = resizeFilters?.[0] || null;
  
            // enliven clipPath（如有）
            fabric.util.enlivenObjects([obj.clipPath], function ([clipPath]) {
              obj.clipPath = clipPath;
  
              // 创建并返回实例
              const instance = new fabric.Shapeimage(image, obj);
              callback(instance);
            });
          });
        });
      },
      null,
      obj.crossOrigin
    );
  };