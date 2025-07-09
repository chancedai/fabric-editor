const AlignGuideLines = {
    canvas: null,
    ctx: null,
    aligningLineOffset: 5,
    aligningLineMargin: 4,
    aligningLineWidth: 1,
    aligningLineColor: "#8b3dff",
    // viewportTransform: null,
    // zoom: 1,
    verticalLines: [],
    horizontalLines: [],
  
    init(canvasInstance, config) {
      this.ctx = canvasInstance.getSelectionContext();
      this.canvas = canvasInstance;
      this.config = config;
      if(!config){
        this.config = {
            left: 0,
            top: 0,
            width: canvasInstance.getWidth(),
            height: canvasInstance.getHeight()
        }
      }
      return this;
    },
  
    drawVerticalLine(line) {
      this.drawLine(
        line.x + 0.5,
        Math.min(line.y1, line.y2),
        line.x + 0.5,
        Math.max(line.y1, line.y2)
      );
    },
  
    drawHorizontalLine(line) {
      this.drawLine(
        Math.min(line.x1, line.x2),
        line.y + 0.5,
        Math.max(line.x1, line.x2),
        line.y + 0.5
      );
    },
  
    drawLine(x1, y1, x2, y2) {
      const { ctx } = this;
      const { viewportTransform: vpt } = this.canvas;
      const zoom = this.canvas.getZoom();
  
      const clipLeft = this.config.left;
      const clipTop = this.config.top;
      const clipRight = clipLeft + this.config.width;
      const clipBottom = clipTop + this.config.height;
  
      const inClipBounds = (x, y) => x >= clipLeft && x <= clipRight && y >= clipTop && y <= clipBottom;
      if (!inClipBounds(x1, y1) && !inClipBounds(x2, y2)) return;
  
      ctx.save();
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = this.aligningLineWidth;
      ctx.strokeStyle = this.aligningLineColor;
      ctx.beginPath();
      ctx.moveTo((x1 * zoom) + vpt[4], (y1 * zoom) + vpt[5]);
      ctx.lineTo((x2 * zoom) + vpt[4], (y2 * zoom) + vpt[5]);
      ctx.stroke();
      ctx.restore();
    },
  
    isInRange(value1, value2) {
      value1 = Math.round(value1);
      value2 = Math.round(value2);
      const margin = this.aligningLineMargin;
      for (let i = value1 - margin; i <= value1 + margin; i++) {
        if (i === value2) return true;
      }
      return false;
    },
  
    mouseDown() {
    //   this.viewportTransform = this.canvas.viewportTransform;
    //   this.zoom = this.canvas.getZoom();
    },
  
    objectMoving(opt) {
      const b = AlignGuideLines;
      const d = b.aligningLineOffset;
      const a = opt.target;
      const objects = b.canvas.getObjects();
      const center = a.getCenterPoint();
      const g = center.x;
      const c = center.y;
      const rect = a.getBoundingRect();
      const m = rect.height / b.canvas.viewportTransform[3];
      const k = rect.width / b.canvas.viewportTransform[0];
      let p = false, q = false;
  
      const bounds = b.config;
  
      if (b.canvas._currentTransform) {
        for (let i = objects.length; i--;) {
          if (objects[i] === a) continue;
  
          const other = objects[i];
          const oCenter = other.getCenterPoint();
          const f = oCenter.x;
          const e = oCenter.y;
          const oRect = other.getBoundingRect();
          const l = oRect.height / b.canvas.viewportTransform[3];
          const h = oRect.width / b.canvas.viewportTransform[0];
  
          if (b.isInRange(f, g)) {
            q = true;
            b.verticalLines.push({
              x: f,
              y1: Math.min(e - l / 2 - d, c - m / 2 - d),
              y2: Math.max(e + l / 2 + d, c + m / 2 + d),
            });
            a.setPositionByOrigin(new fabric.Point(f, c), "center", "center");
          }
          if (b.isInRange(f - h / 2, g - k / 2)) {
            q = true;
            b.verticalLines.push({
              x: f - h / 2,
              y1: Math.min(e - l / 2 - d, c - m / 2 - d),
              y2: Math.max(e + l / 2 + d, c + m / 2 + d),
            });
            a.setPositionByOrigin(new fabric.Point(f - h / 2 + k / 2, c), "center", "center");
          }
          if (b.isInRange(f + h / 2, g + k / 2)) {
            q = true;
            b.verticalLines.push({
              x: f + h / 2,
              y1: Math.min(e - l / 2 - d, c - m / 2 - d),
              y2: Math.max(e + l / 2 + d, c + m / 2 + d),
            });
            a.setPositionByOrigin(new fabric.Point(f + h / 2 - k / 2, c), "center", "center");
          }
  
          if (b.isInRange(e, c)) {
            p = true;
            b.horizontalLines.push({
              y: e,
              x1: Math.min(f - h / 2 - d, g - k / 2 - d),
              x2: Math.max(f + h / 2 + d, g + k / 2 + d),
            });
            a.setPositionByOrigin(new fabric.Point(g, e), "center", "center");
          }
          if (b.isInRange(e - l / 2, c - m / 2)) {
            p = true;
            b.horizontalLines.push({
              y: e - l / 2,
              x1: Math.min(f - h / 2 - d, g - k / 2 - d),
              x2: Math.max(f + h / 2 + d, g + k / 2 + d),
            });
            a.setPositionByOrigin(new fabric.Point(g, e - l / 2 + m / 2), "center", "center");
          }
          if (b.isInRange(e + l / 2, c + m / 2)) {
            p = true;
            b.horizontalLines.push({
              y: e + l / 2,
              x1: Math.min(f - h / 2 - d, g - k / 2 - d),
              x2: Math.max(f + h / 2 + d, g + k / 2 + d),
            });
            a.setPositionByOrigin(new fabric.Point(g, e + l / 2 - m / 2), "center", "center");
          }
        }
  
        // 吸附到导出区域边缘
        const clipEdgesX = [
          { x: bounds.left, type: "left" },
          { x: bounds.left + bounds.width / 2, type: "centerX" },
          { x: bounds.left + bounds.width, type: "right" },
        ];
  
        // clipEdgesX.forEach(edge => {
        //   if (b.isInRange(edge.x, g)) {
        //     q = true;
        //     b.verticalLines.push({ x: edge.x, y1: bounds.top, y2: bounds.top + bounds.height });
        //     if (edge.type === "left") {
        //       a.setPositionByOrigin(new fabric.Point(edge.x + k / 2, c), "center", "center");
        //     } else if (edge.type === "centerX") {
        //       a.setPositionByOrigin(new fabric.Point(edge.x, c), "center", "center");
        //     } else if (edge.type === "right") {
        //       a.setPositionByOrigin(new fabric.Point(edge.x - k / 2, c), "center", "center");
        //     }
        //   }
        // });
        clipEdgesX.forEach(edge => {
            const shouldSnap = edge.type === "centerX" ? b.isInRange(edge.x, g) : b.isInRange(edge.x, g - k / 2) || b.isInRange(edge.x, g + k / 2);
            if (shouldSnap) {
              q = true;
              b.verticalLines.push({ x: edge.x, y1: bounds.top, y2: bounds.top + bounds.height });
          
              if (edge.type === "left") {
                a.setPositionByOrigin(new fabric.Point(edge.x + k / 2, c), "center", "center");
              } else if (edge.type === "centerX") {
                a.setPositionByOrigin(new fabric.Point(edge.x, c), "center", "center");
              } else if (edge.type === "right") {
                a.setPositionByOrigin(new fabric.Point(edge.x - k / 2, c), "center", "center");
              }
            }
          });
          
  
        const clipEdgesY = [
          { y: bounds.top, type: "top" },
          { y: bounds.top + bounds.height / 2, type: "centerY" },
          { y: bounds.top + bounds.height, type: "bottom" },
        ];
  
        clipEdgesY.forEach(edge => {
          if (b.isInRange(edge.y, c)) {
            p = true;
            b.horizontalLines.push({ y: edge.y, x1: bounds.left, x2: bounds.left + bounds.width });
            if (edge.type === "top") {
              a.setPositionByOrigin(new fabric.Point(g, edge.y + m / 2), "center", "center");
            } else if (edge.type === "centerY") {
              a.setPositionByOrigin(new fabric.Point(g, edge.y), "center", "center");
            } else if (edge.type === "bottom") {
              a.setPositionByOrigin(new fabric.Point(g, edge.y - m / 2), "center", "center");
            }
          }
        });
  
        if (!p) b.horizontalLines = [];
        if (!q) b.verticalLines = [];
      }
    },
  
    beforeRender() {
      const a = AlignGuideLines.canvas;
      if (a.contextTop) a.clearContext(a.contextTop);
    },
  
    afterRender() {
      const a = AlignGuideLines;
      for (let i = a.verticalLines.length; i--;) a.drawVerticalLine(a.verticalLines[i]);
      for (let i = a.horizontalLines.length; i--;) a.drawHorizontalLine(a.horizontalLines[i]);
      a.verticalLines = a.horizontalLines = [];
    },
  
    mouseUp() {
      const a = AlignGuideLines;
      a.verticalLines = a.horizontalLines = [];
      a.canvas.renderAll();
    },
  
    enable() {
      this.canvas
        .on("mouse:down", this.mouseDown)
        .on("object:moving", this.objectMoving)
        .on("before:render", this.beforeRender)
        .on("after:render", this.afterRender)
        .on("mouse:up", this.mouseUp);
      return this;
    },
  
    disable() {
      this.canvas
        .off("mouse:down", this.mouseDown)
        .off("object:moving", this.objectMoving)
        .off("before:render", this.beforeRender)
        .off("after:render", this.afterRender)
        .off("mouse:up", this.mouseUp);
      return this;
    }
  };
  
  
  
export default AlignGuideLines;
  