import rough from "roughjs";
import { fabric } from "fabric";
import "./fabric/brushes.js";
import "./fabric/shapeImage.js";
// import "./fabric/canvas.js";
import "./fabric/text.js";
// import './fabric/object.js';
// import './fabric/controls.js';
// import './fabric/image.js';
// import './fabric/imageContainer.js';
// import "./fabric/shapeImageGroup.js";
//  Fabric.js 中设置了 CanvasTextBaseline，但使用了无效的值 "alphabetical"，应该是 alphabetic

fabric.Text.prototype._setTextStyles = function (t, e, i) {
  t.textBaseline = "alphabetic"; // ✅ 修正错误的 "alphabetical"

  if (this.path) {
    switch (this.pathAlign) {
      case "center":
        t.textBaseline = "middle";
        break;
      case "ascender":
        t.textBaseline = "top";
        break;
      case "descender":
        t.textBaseline = "bottom";
    }
  }
  t.font = this._getFontDeclaration(e, i);
};

(function (fabric) {
  // Utility function to trim the canvas by removing empty spaces
  fabric.util.trimCanvas = function (canvas, threshold = 0) {
    const ctx = canvas.getContext("2d"),
      canvasWidth = canvas.width,
      canvasHeight = canvas.height,
      imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

    let minX = canvasWidth + 1,
      minY = canvasHeight + 1,
      maxX = -1,
      maxY = -1;

    // Loop through the canvas pixel data to find the bounding box of non-transparent areas
    for (let y = 0; y < canvasHeight; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        if (imageData.data[4 * (y * canvasWidth + x) + 3] > threshold) {
          minX = Math.min(x, minX);
          minY = Math.min(y, minY);
          maxX = Math.max(x, maxX);
          maxY = Math.max(y, maxY);
        }
      }
    }

    // Get the image data for the cropped area and update the canvas size
    const croppedImageData = ctx.getImageData(
      minX,
      minY,
      maxX - minX,
      maxY - minY
    );
    canvas.width = maxX - minX;
    canvas.height = maxY - minY;
    ctx.putImageData(croppedImageData, 0, 0);

    return { width: canvas.width, height: canvas.height, x: minX, y: minY };
  };

  // Check if the device supports touch events
  const isTouchDevice = (() => {
    if (
      "ontouchstart" in window ||
      (window.DocumentTouch && document instanceof DocumentTouch)
    )
      return true;
    const mediaQuery = [
      "(",
      " -webkit- -moz- -o- -ms- ".split(" ").join("touch-enabled),("),
      "heartz)",
    ].join("");
    return window.matchMedia(mediaQuery).matches;
  })();

  // Define a group object for managing paths
  fabric.PathGroup = {};
  fabric.PathGroup.fromObject = function (options, callback) {
    const paths = options.paths;
    delete options.paths;

    if (typeof paths === "string") {
      fabric.loadSVGFromURL(paths, function (svgElements) {
        svgElements = fabric.util.groupSVGElements(svgElements, options, paths);
        svgElements.type = "group";
        options.paths = paths;
        callback(svgElements);
      });
    } else {
      fabric.util.enlivenObjects(paths, function (enlivenedObjects) {
        enlivenedObjects.forEach((object) => object._removeTransformMatrix());
        const group = new fabric.Group(enlivenedObjects, options);
        group.type = "group";
        options.paths = paths;
        callback(group);
      });
    }
  };

  // Create an image object from an object description
  fabric.Image.fromObject = function (options, callback) {
    fabric.util.loadImage(
      options.src,
      function (imageElement, error) {
        if (error) return callback && callback(null, error);

        fabric.Image.prototype._initFilters.call(
          options,
          options.filters,
          function (filters) {
            options.filters = filters || [];
            fabric.Image.prototype._initFilters.call(
              options,
              [options.resizeFilter],
              function (resizeFilters) {
                options.resizeFilter = resizeFilters[0];

                if (typeof options.version === "undefined") {
                  const naturalWidth =
                    imageElement.naturalWidth || imageElement.width;
                  const naturalHeight =
                    imageElement.naturalHeight || imageElement.height;
                  const scaleX =
                    ((options.scaleX || 1) * options.width) / naturalWidth;
                  const scaleY =
                    ((options.scaleY || 1) * options.height) / naturalHeight;
                  options.width = naturalWidth;
                  options.height = naturalHeight;
                  options.scaleX = scaleX;
                  options.scaleY = scaleY;
                }

                callback(new fabric.Image(imageElement, options));
              }
            );
          }
        );
      },
      null,
      options.crossOrigin || "anonymous"
    );
  };

  // Extend the object initialization to include a unique identifier
  fabric.Object.prototype.initialize = (function (originalInit) {
    return function (...args) {
      originalInit.call(this, ...args);
      this.uid = this.type + "-" + Math.random().toString(36).substr(2, 9);
      return this;
    };
  })(fabric.Object.prototype.initialize);

  // Set the origin of the object to its center
  fabric.Object.prototype.setOriginToCenter = function () {
    this._originalOriginX = this.originX;
    this._originalOriginY = this.originY;
    const centerPoint = this.getCenterPoint();
    this.set({
      originX: "center",
      originY: "center",
      left: centerPoint.x,
      top: centerPoint.y,
    });
  };

  // Reset the object's position to its original origin
  fabric.Object.prototype.setCenterToOrigin = function () {
    const originalPoint = this.translateToOriginPoint(
      this.getCenterPoint(),
      this._originalOriginX,
      this._originalOriginY
    );
    this.set({
      originX: this._originalOriginX,
      originY: this._originalOriginY,
      left: originalPoint.x,
      top: originalPoint.y,
    });
  };

  // Define the texture size limit for the fabric objects
  fabric.textureSize = 4096;

  // Set common properties for objects on the canvas (like border color, corner style, etc.)
  fabric.Object.prototype.set({
    transparentCorners: false,
    borderColor: "#8b3dff",
    cornerColor: "#FFF",
    borderScaleFactor: 2,
    cornerStyle: "circle",
    cornerStrokeColor: "#8b3dff",
    borderOpacityWhenMoving: 1,
    padding: 0,
    cornerSize: isTouchDevice ? 30 : 15,
    getZindex: function () {
      return this.canvas.getObjects().indexOf(this);
    },
    exportPNG: async function (filename) {
      filename = filename || "object";
      const canvasElement = this.toCanvasElement();

      if (window.showSaveFilePicker) {
        try {
          const blob = await new Promise((resolve) => {
            canvasElement.toBlob((blob) => resolve(blob), "image/png");
          });

          const fileHandle = await window.showSaveFilePicker({
            suggestedName: filename + ".png",
            types: [
              {
                description: "PNG Image",
                accept: { "image/png": [".png"] },
              },
            ],
          });

          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (error) {
          console.error("Save cancelled or failed:", error);
        }
      } else {
        // Fallback for browsers that do not support showSaveFilePicker
        const link = document.createElement("a");
        link.href = canvasElement.toDataURL();
        link.download = filename + ".png";
        link.click();
      }
    },
  });

  // Modify the position of the object's control buttons (for manipulating the object)
  fabric.Object.prototype.controls.mtr.offsetY = isTouchDevice ? -60 : -35;

  let clonedObject = null;

  // Methods for managing objects in the canvas (like cloning, modifying, copying, pasting, etc.)
  fabric.Canvas.prototype.set({
    apply: function (object, callback) {
      if (object.type === "activeSelection") {
        object.getObjects().forEach((item) => callback(item));
      } else {
        callback(object);
      }
      this.requestRenderAll();
      return this;
    },

    modifyObject: function (property, value, object) {
      object = object || this.getActiveObject();
      if (!object) return false;

      switch (property) {
        case "zoomReset":
          object.type === "shapeimage" && object.zoomTo(0, 0, 0);
          break;
        case "zoomBy-x":
          object.type === "shapeimage" && object.zoomBy(value, null, null);
          break;
        case "zoomBy-y":
          object.type === "shapeimage" && object.zoomBy(null, value, null);
          break;
        case "zoomBy-z":
          object.type === "shapeimage" && object.zoomBy(null, null, value);
          break;
        case "angleBy":
          value = +value;
          value = object.get("angle") + value;
          value =
            value > 360 ? value - 360 : value < -360 ? value + 360 : value;
          object.rotate(value);
          break;
        case "angle":
          object.rotate(+value);
          break;
        case "flipX":
        case "flipY":
          object.toggle(property);
          break;
        default:
          object.set(property, object.get(property) + value);
      }

      if (property === "left" || property === "top") object.setCoords();
      this.fire("object:modified");
      this.requestRenderAll();
      return object;
    },

    cloneObject: function () {
      this.copyObject(() => {
        this.pasteObject();
      });
    },

    copyObject: function (callback) {
      const object = this.getActiveObject();
      if (!object) return false;
      object.clone((cloned) => {
        clonedObject = cloned;
        callback && callback();
      });
    },

    pasteObject: function () {
      if (!clonedObject) return;
      const canvas = this;
      clonedObject.clone((cloned) => {
        canvas.discardActiveObject();
        cloned.set({
          left: cloned.left + 10,
          top: cloned.top + 10,
          evented: true,
        });
        if (cloned.type === "activeSelection") {
          cloned.canvas = canvas;
          cloned.forEachObject((item) => canvas.add(item));
          cloned.setCoords();
        } else {
          canvas.add(cloned);
        }
        clonedObject.top += 10;
        clonedObject.left += 10;
        canvas.setActiveObject(cloned);
        canvas.requestRenderAll();
      });
    },

    removeObject: function (object) {
      const canvas = this;
      object = object || canvas.getActiveObject();
      object &&
        canvas.apply(object, function (item) {
          item && canvas.remove(item);
        });
      canvas.discardActiveObject();
    },
  });
})(fabric);


// 新类型：标尺图片
("use strict");
fabric.Rulerimage = fabric.util.createClass(fabric.Object, {
  type: "rulerimage",
  initialize: function (b, a) {
    a || (a = {});
    this.lockScalingFlip = !0;
    this.callSuper("initialize", a);
    this._element = fabric.util.getById(b);
    this.setOptions(a);
    this.set("fill", a.fill || "#000");
  },
  _set: function (b, a) {
    if (!this.canvas || !/^scale[XY]/.test(b))
      return this.callSuper("_set", b, a);
    this.canvas.fire("object:scaling", { target: this });
    this["scaleY" == b ? "height" : "width"] *= a;
    this.scaleX = this.scaleY = 1;
    this.canvas.requestRenderAll();
    return this;
  },
  _render: function (b) {
    var a = this.width,
      e = this.height,
      k = a / -2,
      l = e / -2,
      f = this._element.width,
      g = this._element.height,
      c = e / g,
      h = fabric.util.createCanvasElement();
    f *= c;
    c *= g;
    g = Math.max(1, Math.floor(a / f));
    h.width = f;
    h.height = c;
    var d = h.getContext("2d");
    d.drawImage(this._element, 0, 0, f, c);
    d.fillStyle = this.fill;
    d.globalCompositeOperation = "source-in";
    d.fillRect(0, 0, f, c);
    c = fabric.util.createCanvasElement();
    d = c.getContext("2d");
    c.width = g * f;
    c.height = e;
    d.rect(0, 0, c.width, c.height);
    d.fillStyle = d.createPattern(h, "repeat");
    d.fill();
    b.drawImage(c, k, l, a, e);
  },
  toObject: function (b) {
    return fabric.util.object.extend(this.callSuper("toObject", b), {
      fill: this.fill,
      src: this._element.src,
    });
  },
});
fabric.Rulerimage.fromObject = function (b, a) {
  fabric.util.loadImage(b.src, function (e) {
    a && a(new fabric.Rulerimage(e, b));
  });
};

// 新类型：边框图片
("use strict");
(function (d) {
  d.Borderimage = d.util.createClass(d.Object, {
    type: "borderimage",
    fill: "#000",
    initialize: function (b, a, e) {
      this.cacheProperties.push("scale");
      e || (e = {});
      this.perPixelTargetFind = this.lockScalingFlip = !0;
      this.callSuper("initialize", e);
      this._bimgElement = d.util.getById(b);
      this._cimgElement = d.util.getById(a);
      this.setOptions(e);
      this.set("fill", e.fill || "#000");
      this.set("scale", e.scale || 1);
      this.isSVG = /\.svg$/.test(b.src) && /\.svg$/.test(a.src);
    },
    _set: function (b, a) {
      if (!this.canvas || !/^scale[XY]/.test(b))
        return this.callSuper("_set", b, a);
      this.canvas.fire("object:scaling", { target: this });
      this["scaleY" == b ? "height" : "width"] *= a;
      this.canvas.requestRenderAll();
      return this;
    },
    _render: function (b) {
      function a(w) {
        "undefined" == typeof a.canvas &&
          ((a.canvas = d.util.createCanvasElement()),
          (a.canvas.width = h),
          (a.canvas.height = k));
        var l = a.canvas,
          c = l.getContext("2d"),
          m,
          f;
        switch (w) {
          case "lt":
            var g = (m = 0);
            var q = (f = 1);
            var t = r;
            var n = u;
            break;
          case "rt":
            m = h;
            g = 0;
            f = -1;
            q = 1;
            t = r + z - h;
            n = u;
            break;
          case "lb":
            m = 0;
            g = k;
            f = 1;
            q = -1;
            t = r;
            n = u + A - k;
            break;
          case "rb":
            (m = h), (g = k), (q = f = -1), (t = r + z - h), (n = u + A - k);
        }
        c.clearRect(0, 0, l.width, l.height);
        c.save();
        c.translate(m, g);
        c.scale(f, q);
        c.drawImage(p._cimgElement, 0, 0, h, k);
        p.isSVG &&
          ((c.fillStyle = p.fill),
          (c.globalCompositeOperation = "source-in"),
          c.fillRect(0, 0, h, k));
        c.restore();
        b.drawImage(l, t, n);
      }
      function e(w) {
        switch (w) {
          case "top":
            var l = r + h;
            var c = u;
            var m = 0;
            break;
          case "bottom":
            l = r + h;
            c = u + A - v;
            m = Math.PI;
            break;
          case "left":
            l = r;
            c = u + v;
            m = -Math.PI / 2;
            break;
          case "right":
            (m = Math.PI / 2), (l = r + z - v), (c = u + v);
        }
        if ("top" == w || "bottom" == w) {
          var f = z - 2 * h;
          var g = Math.max(1, Math.round(f / E));
          var q = g * x;
          g = y;
          var t = f;
          f = v;
        } else
          (f = A - 2 * k),
            (g = Math.max(1, Math.round(f / E))),
            (q = y),
            (g *= x),
            (t = v);
        var n = d.util.createCanvasElement(),
          B = n.getContext("2d");
        n.width = q;
        n.height = g;
        B.rect(0, 0, q, g);
        B.rotate(m);
        B.fillStyle = B.createPattern(C, "repeat");
        B.fill();
        /left|right/.test(w)
          ? ((c += k - v), b.drawImage(n, l, c - 1, t, f + 2))
          : b.drawImage(n, l - 1, c, t + 2, f);
      }
      var p = this,
        z = this.width,
        A = this.height,
        r = this.width / -2,
        u = this.height / -2,
        x = this._bimgElement.width,
        y = this._bimgElement.height,
        E = x * this.scale,
        v = y * this.scale,
        h = this._cimgElement.width * this.scale,
        k = this._cimgElement.height * this.scale,
        C = d.util.createCanvasElement(),
        D = C.getContext("2d");
      C.width = x;
      C.height = y;
      D.drawImage(p._bimgElement, 0, 0, x, y);
      p.isSVG &&
        ((D.fillStyle = p.fill),
        (D.globalCompositeOperation = "source-in"),
        D.fillRect(0, 0, x, y));
      a("lt");
      a("rt");
      a("rb");
      a("lb");
      z > 2 * h && (e("top"), e("bottom"));
      A > 2 * k && (e("left"), e("right"));
    },
    toObject: function (b) {
      return d.util.object.extend(this.callSuper("toObject", b), {
        fill: this.fill,
        scale: this.scale,
        bsrc: this._bimgElement.src,
        csrc: this._cimgElement.src,
      });
    },
  });
  d.Borderimage.async = !0;
  d.Borderimage.fromObject = function (b, a) {
    d.util.loadImage(b.bsrc, function (e) {
      d.util.loadImage(b.csrc, function (p) {
        p = new d.Borderimage(e, p, b);
        a && a(p);
      });
    });
  };
})(fabric);

fabric.Heart = fabric.util.createClass(fabric.Object, {
  type: "heart",
  initialize: function (b) {
    this.cacheProperties.push("size");
    b = b || {};
    this.set("shadow", b.shadow || null);
    this.set("size", b.size || 100);
    this.set("width", this.size).set("height", this.size);
    this.callSuper("initialize", b);
  },
  _set: function (b, a) {
    switch (b) {
      case "size":
        this.size = a;
        this.set("width", a).set("height", a);
        break;
      default:
        this.callSuper("_set", b, a);
    }
  },
  toObject: function () {
    return fabric.util.object.extend(this.callSuper("toObject"), {
      size: this.get("size"),
    });
  },
  _render: function (b, a) {
    a = this.size;
    b.beginPath();
    b.save();
    b.translate(-this.width / 2, -this.height / 2);
    b.moveTo(0, a / 4);
    b.quadraticCurveTo(0, 0, a / 4, 0);
    b.quadraticCurveTo(a / 2, 0, a / 2, a / 6);
    b.quadraticCurveTo(a / 2, 0, (3 * a) / 4, 0);
    b.quadraticCurveTo(0 + a, 0, 0 + a, a / 4);
    b.quadraticCurveTo(0 + a, a / 2, (3 * a) / 4, (3 * a) / 4);
    b.lineTo(a / 2, 0 + a);
    b.lineTo(a / 4, (3 * a) / 4);
    b.quadraticCurveTo(0, a / 2, 0, a / 4);
    b.closePath();
    b.restore();
    this._renderFill(b);
    this._renderStroke(b);
  },
});
fabric.Heart.fromObject = function (b, a) {
  a && a(new fabric.Heart(fabric.util.object.clone(b)));
};

fabric.Star = fabric.util.createClass(fabric.Object, {
  type: "star",
  initialize: function (a) {
    this.cacheProperties.push("numPoints", "innerRadius", "outerRadius");
    a = a || {};
    this.points = [];
    this.set("shadow", a.shadow || null);
    this.set("numPoints", a.numPoints || 0);
    this.set("innerRadius", a.innerRadius || 0);
    this.set("outerRadius", a.outerRadius || 0);
    this.callSuper("initialize", a);
    a = 2 * this.get("outerRadius");
    this.set("width", a).set("height", a);
    this._setPoints();
  },
  _set: function (a, b) {
    switch (a) {
      case "innerRadius":
        this.innerRadius = b;
        this.dirty = !0;
        this._setPoints();
        break;
      case "outerRadius":
        this.outerRadius = b;
        this.dirty = !0;
        this.set("width", 2 * b).set("height", 2 * b);
        this._setPoints();
        break;
      case "numPoints":
        this.numPoints = b;
        this.dirty = !0;
        this._setPoints();
        break;
      default:
        this.callSuper("_set", a, b);
    }
  },
  _setPoints: function (a, b) {
    a = this.points = [];
    a.push({ x: 0, y: 0 - this.outerRadius });
    for (b = 1; b < 2 * this.numPoints; b++) {
      var c = 0 === b % 2 ? this.outerRadius : this.innerRadius,
        d = (b * Math.PI) / this.numPoints;
      a.push({ x: c * Math.sin(d), y: -c * Math.cos(d) });
    }
  },
  toObject: function () {
    return fabric.util.object.extend(this.callSuper("toObject"), {
      numPoints: this.get("numPoints"),
      innerRadius: this.get("innerRadius"),
      outerRadius: this.get("outerRadius"),
      points: this.points,
    });
  },
  toSVG: function (a) {
    for (
      var b = this._createBaseSVGMarkup(),
        c = [],
        d,
        e = 0,
        f = this.points.length;
      e < f;
      e++
    )
      (d = this.points[e]),
        c.push(
          fabric.util.toFixed(d.x, 2),
          ",",
          fabric.util.toFixed(d.y, 2),
          " "
        );
    b.push(
      "<polygon ",
      'points="',
      c.join(""),
      '" ',
      'style="',
      this.getSvgStyles(),
      '" ',
      'transform="',
      this.getSvgTransform(),
      this.getSvgTransformMatrix(),
      '"/>\n'
    );
    return a ? a(b.join("")) : b.join("");
  },
  _render: function (a, b) {
    b = this.points;
    var c = b[0];
    a.beginPath();
    a.save();
    a.moveTo(c.x, c.y);
    for (var d = 1, e = b.length; d < e; d++) (c = b[d]), a.lineTo(c.x, c.y);
    a.closePath();
    a.restore();
    this._renderFill(a);
    this._renderStroke(a);
  },
  complexity: function () {
    return this.points.length;
  },
});
fabric.Star.fromElement = function (a, b) {
  return a ? fabric.Polygon.fromElement(a, b) : null;
};
fabric.Star.fromObject = function (a, b) {
  b && b(new fabric.Star(fabric.util.object.clone(a)));
};

("use strict");
fabric.Linearrow = fabric.util.createClass(fabric.Line, {
  type: "linearrow",
  initialize: function (a, b) {
    b || (b = {});
    this.callSuper("initialize", a, b);
  },
  toObject: function () {
    return fabric.util.object.extend(this.callSuper("toObject"));
  },
  _render: function (a) {
    this.callSuper("_render", a);
    if (this.visible) {
      a.save();
      var b = Math.atan2(this.y2 - this.y1, this.x2 - this.x1);
      a.translate((this.x2 - this.x1) / 2, (this.y2 - this.y1) / 2);
      a.rotate(b);
      a.beginPath();
      b = this.strokeWidth;
      a.moveTo(b / 1.5, 0);
      a.lineTo(-2 * b, 2 * b);
      a.lineTo(-2 * b, -2 * b);
      a.closePath();
      a.fillStyle = this.stroke;
      a.fill();
      a.restore();
    }
  },
});
fabric.Linearrow.fromObject = function (a, b) {
  b && b(new fabric.Linearrow([a.x1, a.y1, a.x2, a.y2], a));
};




(function (c) {
  c.RoughRect = c.util.createClass(c.Rect, {
    type: "roughRect",
    fillWeight: 1,
    fillStyle: "hachure",
    hachureGap: 5,
    hachureAngle: -41,
    roughness: 1,
    _rough: null,
    _modified: !1,
    initialize(a) {
      this.cacheProperties.push(
        "fillWeight",
        "fillStyle",
        "hachureGap",
        "hachureAngle",
        "roughness",
        "scaleX",
        "scaleY"
      );
      this.stateProperties.push(
        "fillWeight",
        "fillStyle",
        "hachureGap",
        "hachureAngle",
        "roughness"
      );
      this.callSuper("initialize", a);
    },
    toObject(a) {
      return c.util.object.extend(this.callSuper("toObject"), {
        fillWeight: this.fillWeight,
        fillStyle: this.fillStyle,
        hachureGap: this.hachureGap,
        hachureAngle: this.hachureAngle,
        roughness: this.roughness,
      });
    },
    _set(a, b) {
      this.callSuper("_set", a, b);
      this.dirty && (this._modified = !0);
    },
    _render(a) {
      a = rough.canvas(a.canvas);
      if (!this._rough || this._modified)
        this._rough = a.rectangle(
          -(this.width / 2),
          -(this.height / 2),
          this.width,
          this.height,
          {
            stroke: 0 == this.strokeWidth ? "none" : this.stroke,
            strokeWidth: this.strokeWidth,
            fill: this.fill,
            fillWeight: this.fillWeight,
            fillStyle: this.fillStyle,
            hachureGap: this.hachureGap,
            hachureAngle: this.hachureAngle,
            roughness: this.roughness,
          }
        );
      a.draw(this._rough);
      this._modified = !1;
    },
  });
  c.RoughRect.fromObject = (a, b) => c.Object._fromObject("RoughRect", a, b);
  c.RoughEllipse = c.util.createClass(c.Ellipse, {
    type: "roughEllipse",
    fillWeight: 1,
    fillStyle: "hachure",
    hachureGap: 5,
    hachureAngle: -41,
    roughness: 1,
    _rough: null,
    _modified: !1,
    initialize(a) {
      this.cacheProperties.push(
        "fillWeight",
        "fillStyle",
        "hachureGap",
        "hachureAngle",
        "roughness",
        "scaleX",
        "scaleY"
      );
      this.stateProperties.push(
        "fillWeight",
        "fillStyle",
        "hachureGap",
        "hachureAngle",
        "roughness"
      );
      this.callSuper("initialize", a);
    },
    toObject(a) {
      return c.util.object.extend(this.callSuper("toObject"), {
        fillWeight: this.fillWeight,
        fillStyle: this.fillStyle,
        hachureGap: this.hachureGap,
        hachureAngle: this.hachureAngle,
        roughness: this.roughness,
      });
    },
    _set(a, b) {
      this.callSuper("_set", a, b);
      this.dirty && (this._modified = !0);
    },
    _render(a) {
      a = rough.canvas(a.canvas);
      if (!this._rough || this._modified)
        this._rough = a.ellipse(0, 0, 2 * this.rx, 2 * this.ry, {
          stroke: 0 == this.strokeWidth ? "none" : this.stroke,
          strokeWidth: this.strokeWidth,
          fill: this.fill,
          fillWeight: this.fillWeight,
          fillStyle: this.fillStyle,
          hachureGap: this.hachureGap,
          hachureAngle: this.hachureAngle,
          roughness: this.roughness,
        });
      a.draw(this._rough);
      this._modified = !1;
    },
  });
  c.RoughEllipse.fromObject = (a, b) =>
    c.Object._fromObject("RoughEllipse", a, b);
  c.RoughTriangle = c.util.createClass(c.Triangle, {
    type: "roughTriangle",
    fillWeight: 1,
    fillStyle: "hachure",
    hachureGap: 5,
    hachureAngle: -41,
    roughness: 1,
    _rough: null,
    _modified: !1,
    initialize(a) {
      this.cacheProperties.push(
        "fillWeight",
        "fillStyle",
        "hachureGap",
        "hachureAngle",
        "roughness",
        "scaleX",
        "scaleY"
      );
      this.stateProperties.push(
        "fillWeight",
        "fillStyle",
        "hachureGap",
        "hachureAngle",
        "roughness"
      );
      this.callSuper("initialize", a);
    },
    toObject(a) {
      return c.util.object.extend(this.callSuper("toObject"), {
        fillWeight: this.fillWeight,
        fillStyle: this.fillStyle,
        hachureGap: this.hachureGap,
        hachureAngle: this.hachureAngle,
        roughness: this.roughness,
      });
    },
    _set(a, b) {
      this.callSuper("_set", a, b);
      this.dirty && (this._modified = !0);
    },
    _render(a) {
      a = rough.canvas(a.canvas);
      if (!this._rough || this._modified)
        this._rough = a.polygon(
          [
            [0, -this.height / 2],
            [this.width / 2, this.height / 2],
            [-this.width / 2, this.height / 2],
            [0, -this.height / 2],
          ],
          {
            stroke: 0 == this.strokeWidth ? "none" : this.stroke,
            strokeWidth: this.strokeWidth,
            fill: this.fill,
            fillWeight: this.fillWeight,
            fillStyle: this.fillStyle,
            hachureGap: this.hachureGap,
            hachureAngle: this.hachureAngle,
            roughness: this.roughness,
          }
        );
      a.draw(this._rough);
      this._modified = !1;
    },
  });
  c.RoughTriangle.fromObject = (a, b) =>
    c.Object._fromObject("RoughTriangle", a, b);
  c.RoughHeart = c.util.createClass(c.Heart, {
    type: "roughHeart",
    fillWeight: 1,
    fillStyle: "hachure",
    hachureGap: 5,
    hachureAngle: -41,
    roughness: 1,
    _rough: null,
    _modified: !1,
    initialize(a) {
      this.cacheProperties.push(
        "fillWeight",
        "fillStyle",
        "hachureGap",
        "hachureAngle",
        "roughness",
        "scaleX",
        "scaleY"
      );
      this.stateProperties.push(
        "fillWeight",
        "fillStyle",
        "hachureGap",
        "hachureAngle",
        "roughness"
      );
      this.callSuper("initialize", a);
    },
    toObject(a) {
      return c.util.object.extend(this.callSuper("toObject"), {
        fillWeight: this.fillWeight,
        fillStyle: this.fillStyle,
        hachureGap: this.hachureGap,
        hachureAngle: this.hachureAngle,
        roughness: this.roughness,
      });
    },
    _set(a, b) {
      this.callSuper("_set", a, b);
      this.dirty && (this._modified = !0);
    },
    _render(a) {
      const b = rough.canvas(a.canvas);
      a.save();
      let d = this.size / 220;
      a.scale(0.9 * d, 1 * d);
      a.translate(0, this.height / (2 * d));
      if (!this._rough || this._modified)
        this._rough = b.path(
          "M0 0 c-35,-75 -65,-60 -100,-100 a70,70 -45 0,1 100,-100 a70,70 45 0,1 100,100 c-35,40 -65,25 -100,100",
          {
            stroke: 0 == this.strokeWidth ? "none" : this.stroke,
            strokeWidth: this.strokeWidth,
            fill: this.fill,
            fillWeight: this.fillWeight,
            fillStyle: this.fillStyle,
            hachureGap: this.hachureGap,
            hachureAngle: this.hachureAngle,
            roughness: this.roughness,
          }
        );
      b.draw(this._rough);
      a.restore();
      this._modified = !1;
    },
  });
  c.RoughHeart.fromObject = (a, b) => c.Object._fromObject("RoughHeart", a, b);
  c.RoughStar = c.util.createClass(c.Star, {
    type: "roughStar",
    fillWeight: 1,
    fillStyle: "hachure",
    hachureGap: 5,
    hachureAngle: -41,
    roughness: 1,
    _rough: null,
    _modified: !1,
    initialize(a) {
      this.cacheProperties.push(
        "fillWeight",
        "fillStyle",
        "hachureGap",
        "hachureAngle",
        "roughness",
        "scaleX",
        "scaleY"
      );
      this.stateProperties.push(
        "fillWeight",
        "fillStyle",
        "hachureGap",
        "hachureAngle",
        "roughness"
      );
      this.callSuper("initialize", a);
    },
    toObject(a) {
      return c.util.object.extend(this.callSuper("toObject"), {
        fillWeight: this.fillWeight,
        fillStyle: this.fillStyle,
        hachureGap: this.hachureGap,
        hachureAngle: this.hachureAngle,
        roughness: this.roughness,
      });
    },
    _set(a, b) {
      this.callSuper("_set", a, b);
      this.dirty && (this._modified = !0);
    },
    _render(a) {
      const b = this.points;
      a = rough.canvas(a.canvas);
      if (!this._rough || this._modified) {
        const d = [];
        for (let e = 0, f = b.length; e < f; e++) {
          let g = b[e];
          d.push([g.x, g.y]);
        }
        this._rough = a.polygon(d, {
          stroke: 0 == this.strokeWidth ? "none" : this.stroke,
          strokeWidth: this.strokeWidth,
          fill: this.fill,
          fillWeight: this.fillWeight,
          fillStyle: this.fillStyle,
          hachureGap: this.hachureGap,
          hachureAngle: this.hachureAngle,
          roughness: this.roughness,
        });
      }
      a.draw(this._rough);
      this._modified = !1;
    },
  });
  c.RoughStar.fromObject = (a, b) => c.Object._fromObject("RoughStar", a, b);
  c.RoughPolygon = c.util.createClass(c.Polygon, {
    type: "roughPolygon",
    fillWeight: 1,
    fillStyle: "hachure",
    hachureGap: 5,
    hachureAngle: -41,
    roughness: 1,
    _rough: null,
    _modified: !1,
    _translatePolyCoords(a) {
      let b = Infinity,
        d = Infinity;
      for (var e of a) (b = Math.min(e.x, b)), (d = Math.min(e.y, d));
      e = [];
      for (let f of a)
        e.push({ x: Math.round(f.x - b), y: Math.round(f.y - d) });
      return e;
    },
    initialize(a, b) {
      this.cacheProperties.push(
        "fillWeight",
        "fillStyle",
        "hachureGap",
        "hachureAngle",
        "roughness",
        "scaleX",
        "scaleY"
      );
      this.stateProperties.push(
        "fillWeight",
        "fillStyle",
        "hachureGap",
        "hachureAngle",
        "roughness"
      );
      this.callSuper("initialize", a, b);
      this.points = this._translatePolyCoords(a);
    },
    toObject(a) {
      return c.util.object.extend(this.callSuper("toObject", a), {
        fillWeight: this.fillWeight,
        fillStyle: this.fillStyle,
        hachureGap: this.hachureGap,
        hachureAngle: this.hachureAngle,
        roughness: this.roughness,
        points: this.points,
      });
    },
    _set(a, b) {
      this.callSuper("_set", a, b);
      this.dirty && (this._modified = !0);
    },
    _render(a) {
      a = rough.canvas(a.canvas);
      const b = [];
      for (let d of this.points)
        b.push([d.x - this.width / 2, d.y - this.height / 2]);
      if (!this._rough || this._modified)
        this._rough = a.polygon(b, {
          stroke: 0 == this.strokeWidth ? "none" : this.stroke,
          strokeWidth: this.strokeWidth,
          fill: this.fill,
          fillWeight: this.fillWeight,
          fillStyle: this.fillStyle,
          hachureGap: this.hachureGap,
          hachureAngle: this.hachureAngle,
          roughness: this.roughness,
        });
      a.draw(this._rough);
      this._modified = !1;
    },
  });
  c.RoughPolygon.fromObject = (a, b) =>
    c.Object._fromObject("RoughPolygon", a, b, "points");
})("undefined" !== typeof fabric ? fabric : require("fabric").fabric);
export default fabric;
