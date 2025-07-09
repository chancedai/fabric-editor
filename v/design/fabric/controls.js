// 扩展 fabric 控制点
function _R(e) {
  return e.type === 'pointLine' || e.type === 'line';
}
function O(e, t, a, n, i, r) {
  if ("undefined" === typeof r && (r = 5),
  "number" === typeof r)
      r = {
          tl: r,
          tr: r,
          br: r,
          bl: r
      };
  else {
      var o = {
          tl: 0,
          tr: 0,
          br: 0,
          bl: 0
      };
      for (var c in o)
          r[c] = r[c] || o[c]
  }
  e.beginPath(),
  e.moveTo(t + r.tl, a),
  e.lineTo(t + n - r.tr, a),
  e.quadraticCurveTo(t + n, a, t + n, a + r.tr),
  e.lineTo(t + n, a + i - r.br),
  e.quadraticCurveTo(t + n, a + i, t + n - r.br, a + i),
  e.lineTo(t + r.bl, a + i),
  e.quadraticCurveTo(t, a + i, t, a + i - r.bl),
  e.lineTo(t, a + r.tl),
  e.quadraticCurveTo(t, a, t + r.tl, a),
  e.closePath()
}
function st(e) {
  if (!e.canvas) {
    return true;
  }
  var t = e.canvas.getZoom();
  var a = e.getScaledWidth() * t;
  var n = e.getScaledHeight() * t;
  return !!e && !_R(e) && (!!(a <= 24) || !!(n <= 24));
}
var lt = fabric.util.degreesToRadians;
(function () {
  var e;
  var t;
  var a;
  fabric.loadSVGFromString("\n      <?xml version=\"1.0\" encoding=\"UTF-8\"?>\n      <svg width=\"24px\" height=\"24px\" viewBox=\"0 0 24 24\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n          <!-- Generator: Sketch 59 (86127) - https://sketch.com -->\n          <title>Icon / Ball Control / Ball Control-Spin</title>\n          <desc>Created with Sketch.</desc>\n          <g id=\"Icon-/-Ball-Control-/-Ball-Control-Spin\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n              <circle id=\"椭圆形\" stroke-opacity=\"0.15\" stroke=\"#000000\" fill=\"#FFFFFF\" cx=\"12\" cy=\"12\" r=\"11.5\"></circle>\n              <g id=\"Icon-/-cursor-/-Spin\" fill=\"#1B1E24\">\n                  <path d=\"M10.6666667,6 L10.6666667,10 L9.06333333,8.39666667 C8.014,9.252 7.33333333,10.5433333 7.33333333,12 C7.33333333,14.5733333 9.42733333,16.6666667 12,16.6666667 L12,16.6666667 L12,18 C8.686,18 6,15.314 6,12 C6,10.1726667 6.81933333,8.54133333 8.10866667,7.442 L8.10866667,7.442 L6.66666667,6 L10.6666667,6 Z M12,6 C15.314,6 18,8.686 18,12 C18,13.8273333 17.1806667,15.4586667 15.8913333,16.558 L15.8913333,16.558 L17.3333333,18 L13.3333333,18 L13.3333333,14 L14.9366667,15.6033333 C15.986,14.748 16.6666667,13.4566667 16.6666667,12 C16.6666667,9.42666667 14.5726667,7.33333333 12,7.33333333 L12,7.33333333 Z\" id=\"合并形状\"></path>\n              </g>\n          </g>\n      </svg>\n    ", function (t, a) {
    (e = fabric.util.groupSVGElements(t, a)).shouldCache = function () {
      return false;
    };
    e.paintFirst = "stroke";
  });
  fabric.loadSVGFromString("\n      <?xml version=\"1.0\" encoding=\"UTF-8\"?>\n      <svg width=\"24px\" height=\"24px\" viewBox=\"0 0 24 24\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n          <!-- Generator: Sketch 59 (86127) - https://sketch.com -->\n          <title>Icon / Ball Control / Ball Control-Move</title>\n          <desc>Created with Sketch.</desc>\n          <g id=\"Icon-/-Ball-Control-/-Ball-Control-Move\" stroke=\"none\" stroke-width=\"1\" fill=\"none\">\n              <circle id=\"椭圆形\" stroke-opacity=\"0.15\" stroke=\"#000000\" fill=\"#FFFFFF\" cx=\"12\" cy=\"12\" r=\"11.5\"></circle>\n              <g id=\"Icon-/-cursor-/-Drag\" fill=\"#1B1E24\" stroke=\"#FFFFFF\" stroke-width=\"0.75\">\n                  <path d=\"M12.9375,8.62575 L12.9375,11.0625 L15.37425,11.0625 L15.37425,8.84488322 L18.5304185,12 L15.37425,15.1551168 L15.37425,12.9375 L12.9375,12.9375 L12.9375,15.37575 L15.1555436,15.37575 L12,18.5302417 L8.84445645,15.37575 L11.0625,15.37575 L11.0625,12.9375 L8.625,12.9375 L8.625,15.1553301 L5.46966991,12 L8.625,8.84466991 L8.625,11.0625 L11.0625,11.0625 L11.0625,8.62575 L8.84488322,8.62575 L12,5.46958152 L15.1551168,8.62575 L12.9375,8.62575 Z\" id=\"Fill-1\"></path>\n              </g>\n          </g>\n      </svg>\n    ", function (e, a) {
    (t = fabric.util.groupSVGElements(e, a)).shouldCache = function () {
      return false;
    };
    t.paintFirst = "stroke";
  });
  fabric.loadSVGFromString("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n    <svg width=\"17px\" height=\"17px\" viewBox=\"0 0 17 17\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n        <title>Icon / Ball-Control / drag-n5</title>\n        <g id=\"Symbol\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n            <path d=\"M14.5,0 C15.8807119,-2.53632657e-16 17,1.11928813 17,2.5 C17,3.88071187 15.8807119,5 14.5,5 L5,5 L5,14.5 C5,15.8807119 3.88071187,17 2.5,17 C1.11928813,17 1.69088438e-16,15.8807119 0,14.5 L0,2.5 C-1.69088438e-16,1.11928813 1.11928813,2.53632657e-16 2.5,0 L14.5,0 Z\" id=\"Icon-/-Ball-Control-/-drag-n5\" fill=\"#FFFFFF\"></path>\n        </g>\n    </svg>", function (e, t) {
    (a = fabric.util.groupSVGElements(e, t)).shouldCache = function () {
      return false;
    };
    a.centeredRotation = true;
    a.strokeWidth = 2;
    a.paintFirst = "stroke";
  });
  fabric.util.object.extend(fabric.Object.prototype, {
    cornerStyleIcons: {
      br: "circle",
      tl: "circle",
      tr: "circle",
      bl: "circle",
      ml: "rect",
      mr: "rect",
      mt: "rect",
      mb: "rect",
      mtr: e,
      mbm: t
    },
    drawControls: function (e, t) {
      t = t || {};
      var a = this._calculateCurrentDimensions();
      var n = a.x;
      var i = a.y;
      var r = t.cornerSize || this.cornerSize;
      var o = -(n + r) / 2;
      var c = -(i + r) / 2;
      var s = typeof t.transparentCorners !== "undefined" ? t.transparentCorners : this.transparentCorners;
      var l = typeof t.hasRotatingPoint !== "undefined" ? t.hasRotatingPoint : this.hasRotatingPoint;
      var u = s ? "stroke" : "fill";
      e.save();
      e.strokeStyle = e.fillStyle = t.cornerColor || this.cornerColor;
      if (!this.transparentCorners) {
        e.strokeStyle = t.cornerStrokeColor || this.cornerStrokeColor;
      }
      this._setLineDash(e, t.cornerDashArray || this.cornerDashArray, null);
      if (!this.get("lockUniScaling")) {
        if (!st(this)) {
          this._drawControl("mt", e, u, o + n / 2, c, t);
        }
        if (!st(this)) {
          this._drawControl("mb", e, u, o + n / 2, c + i, t);
        }
        if (!st(this)) {
          this._drawControl("mr", e, u, o + n, c + i / 2, t);
        }
        this._drawControl("ml", e, u, o, c + i / 2, t);
      }
      if (!st(this)) {
        this._drawControl("tl", e, u, o, c, t);
      }
      if (!st(this)) {
        this._drawControl("tr", e, u, o + n, c, t);
      }
      if (!st(this)) {
        this._drawControl("bl", e, u, o, c + i, t);
      }
      this._drawControl("br", e, u, o + n, c + i, t);
      if (l) {
        this._drawControl("mtr", e, u, o + n / 2, c - this.rotatingPointOffset, t);
      }
      this._drawControl("mbm", e, u, o + n / 2, c + i + this.rotatingPointOffset, t);
      e.restore();
      return this;
    },
    _drawControl: function (e, t, n, i, r, o) {
      o = o || {};
      if (this.isControlVisible(e)) {
        var c = this.clipParent;
        if (!c || c.isControlVisible(e)) {
          var l = this.__corner;
          var u = this.cornerSize;
          var h = !this.transparentCorners && this.cornerStrokeColor;
          var d = this.cornerStyleIcons[e];
          if (l === e && this.cornerHighlightColor) {
            t.fillStyle = this.cornerHighlightColor;
            t.strokeStyle = this.cornerHighlightStrokeColor;
          } else {
            t.fillStyle = o.cornerColor || this.cornerColor;
            t.strokeStyle = o.cornerStrokeColor || this.cornerStrokeColor;
          }
          switch (d) {
            case "circle":
              t.beginPath();
              t.arc(i + u / 2, r + u / 2, u / 2, 0, Math.PI * 2, false);
              if (h) {
                t.stroke();
              }
              t[n]();
              break;
            case "rect":
              var p;
              var g;
              var f;
              var m;
              t.save();
              var v = this._getRectConrolSize(t, e, i, r);
              p = v.width;
              g = v.height;
              f = v.offsetX;
              m = v.offsetY;
              if (this.cornerRoundSize > 0) {
                O(t, f, m, p, g, this.cornerRoundSize);
                if (h) {
                  t.stroke();
                }
                t[n]();
              } else {
                if (h) {
                  t.strokeRect(f, m, p, g);
                }
                t[n + "Rect"](f, m, p, g);
              }
              t.restore();
              break;
            case "clip":
              (d = a.setCoords()).set("fill", t.fillStyle);
              d.set("stroke", t.strokeStyle);
              var b = 0;
              var _ = 0;
              switch (e) {
                case "tl":
                  b = 3;
                  _ = 3;
                  d.rotate(0).setCoords();
                  break;
                case "tr":
                  b = u / 2 + 3;
                  _ = 3;
                  d.rotate(90).setCoords();
                  break;
                case "br":
                  b = u / 2 + 3;
                  _ = u / 2 + 3;
                  d.rotate(180).setCoords();
                  break;
                case "bl":
                  b = 3;
                  _ = u / 2 + 3;
                  d.rotate(-90).setCoords();
              }
              d.left = i + b;
              d.top = r + _;
              d.render(t);
              this.iconStyle = d;
              break;
            default:
              if (d instanceof fabric.Object) {
                var A = (d.getScaledWidth() - u) / 2;
                var y = (d.getScaledHeight() - u) / 2;
                d.left = i - A;
                d.top = r - y;
                d.render(t);
              } else {
                if (!this.transparentCorners) {
                  t.clearRect(i, r, u, u);
                }
                if (h) {
                  t.strokeRect(i, r, u, u / 2);
                }
                t[n + "Rect"](i, r, u, u / 2);
              }
          }
        }
      }
    },
    _getRectConrolSize: function (e, t, a, n) {
      var i;
      var r;
      var o;
      var c;
      switch (t) {
        case "mt":
        case "mb":
          r = 6;
          i = 14;
          c = n + 3;
          o = a - 3;
          break;
        case "ml":
        case "mr":
          r = 14;
          i = 6;
          c = n - 3;
          o = a + 3;
      }
      return {
        width: i,
        height: r,
        left: a,
        top: n,
        offsetX: o,
        offsetY: c
      };
    },
    _findTargetCorner: function (e) {
      var t = this.clipParent || this.clipChild;
      if (this.group && this.group.canModifyChildren) ;else if (!this.hasControls || this.isLock || this.group || !this.canvas || this.canvas._activeObject !== this && !t) {
        return false;
      }
      var a = ["br", "ml", "mb", "tl", "tr", "bl", "mt", "mr", "mtr", "mbm"];
      for (var n in a) {
        if (this._findTargetCornerByName(e, a[n])) {
          return a[n];
        }
      }
      return false;
    },
    _findTargetCornerByName: function (e, t) {
      var a;
      var n;
      var i = e.x;
      var r = e.y;
      this.__corner = 0;
      if (!this.isControlVisible(t)) {
        return false;
      }
      if (t === "mtr" && !this.hasRotatingPoint) {
        return false;
      }
      if (this.get("lockUniScaling") && (t === "mt" || t === "mr" || t === "mb" || t === "ml")) {
        return false;
      }
      var o = this.oCoords;
      if (this.group && this.group.canModifyChildren) {
        o = this.getCoords(null, null, true);
      }
      n = this._getImageLines(o[t].corner);
      if ((a = this._findCrossPoints({
        x: i,
        y: r
      }, n)) !== 0 && a % 2 === 1) {
        this.__corner = t;
        return t;
      } else {
        return undefined;
      }
    },
    _setCornerCoords: function (e) {
      var t;
      var a;
      var n = e || this.oCoords;
      var i = fabric.util.degreesToRadians(45 - this.angle);
      var r = this.cornerSize * 0.707106;
      var o = r * fabric.util.cos(i);
      var c = r * fabric.util.sin(i);
      for (var l in n) {
        t = n[l].x;
        a = n[l].y;
        n[l].corner = {
          tl: {
            x: t - c,
            y: a - o
          },
          tr: {
            x: t + o,
            y: a - c
          },
          bl: {
            x: t - o,
            y: a + c
          },
          br: {
            x: t + c,
            y: a + o
          }
        };
      }
    },
    getCoords: function (e, t, a) {
      if (a && this.group && this.group.canModifyChildren) {
        var n = this.calcCoords(false, this.calcTransformMatrix());
        this._setCornerCoords(n);
        return n;
      }
      if (!this.oCoords) {
        this.setCoords();
      }
      var i = e ? this.aCoords : this.oCoords;
      return function (e) {
        return [new fabric.Point(e.tl.x, e.tl.y), new fabric.Point(e.tr.x, e.tr.y), new fabric.Point(e.br.x, e.br.y), new fabric.Point(e.bl.x, e.bl.y)];
      }(t ? this.calcCoords(e) : i);
    },
    toLocalPoint: function (e, t, a) {
      var n;
      var i;
      var r = this.getCenterPoint();
      n = typeof t !== "undefined" && typeof a !== "undefined" ? this.translateToGivenOrigin(r, "center", "center", t, a) : new fabric.Point(this.left, this.top);
      i = new fabric.Point(e.x, e.y);
      if (this.angle) {
        i = fabric.util.rotatePoint(i, r, -lt(this.angle));
      }
      if (this.group && this.group.canModifyChildren) {
        i = fabric.util.transformPoint(i, fabric.util.invertTransform(this.group.calcTransformMatrix()));
      }
      return i.subtractEquals(n);
    },
    toCanvasElement: function (e) {
      e ||= {};
      var t = fabric.util;
      var a = t.saveObjectTransform(this);
      var n = this.group;
      var i = this.shadow;
      var r = Math.abs;
      var o = (e.multiplier || 1) * (e.enableRetinaScaling ? fabric.devicePixelRatio : 1);
      delete this.group;
      if (e.withoutTransform) {
        t.resetObjectTransform(this);
      }
      if (e.withoutShadow) {
        this.shadow = null;
      }
      var c;
      var l;
      var u;
      var h;
      var d = fabric.util.createCanvasElement();
      var p = this.getBoundingRect(true, true);
      var g = this.shadow;
      var f = {
        x: 0,
        y: 0
      };
      if (this.getMaxShadowOffset) {
        var m = this.getMaxShadowOffset();
        f.x = m.maxOffsetX * 2;
        f.y = m.maxOffsetY * 2;
      } else if (g) {
        l = g.blur;
        c = g.nonScaling ? {
          scaleX: 1,
          scaleY: 1
        } : this.getObjectScaling();
        f.x = Math.round(r(g.offsetX) + l) * 2 * r(c.scaleX);
        f.y = Math.round(r(g.offsetY) + l) * 2 * r(c.scaleY);
      }
      u = p.width + f.x;
      h = p.height + f.y;
      d.width = Math.ceil(u);
      d.height = Math.ceil(h);
      var v = new fabric.StaticCanvas(d, {
        enableRetinaScaling: false,
        renderOnAddRemove: false,
        skipOffscreen: false
      });
      if (e.format === "jpeg") {
        v.backgroundColor = "#fff";
      }
      this.setPositionByOrigin(new fabric.Point(v.width / 2, v.height / 2), "center", "center");
      var b = this.canvas;
      v.add(this);
      var _ = v.toCanvasElement(o || 1, e);
      this.shadow = i;
      this.canvas = b;
      if (n) {
        this.group = n;
      }
      this.set(a).setCoords();
      v._objects = [];
      v.dispose();
      v = null;
      return _;
    }
  });
})();