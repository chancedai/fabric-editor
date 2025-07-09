import { fabric } from 'fabric';

// 新类型 textasset 还有 highlight
(function () {
  function o(t) {
    t.textDecoration &&
      (-1 < t.textDecoration.indexOf("underline") && (t.underline = !0),
      -1 < t.textDecoration.indexOf("line-through") && (t.linethrough = !0),
      -1 < t.textDecoration.indexOf("overline") && (t.overline = !0),
      delete t.textDecoration);
  }

  const svgCache = new Map();

  /**
   * 异步下载 SVG 字符串、替换颜色占位符，并加载成 fabric 对象数据
   * @param {Object} item - 一个 Textasset 对象，必须包含 texts 属性（数组）
   * @returns {Promise<boolean>} 返回一个 Promise，成功时返回 true
   */
  async function downloadSvg(item) {
    const highlights = (item.texts || [])
      .map((t, index) => ({ index, highlight: t.highlight }))
      .filter((h) => !!h.highlight);

    if (!highlights.length) return false;

    for (const { index: i, highlight } of highlights) {
      if (!highlight || highlight.type !== "svg" || !highlight.url) continue;
      try {
        if (!svgCache.has(highlight.url)) {
          const svg = await fetch(highlight.url).then((res) => res.text());
          svgCache.set(highlight.url, svg);
        }
        const realSvg = svgCache
          .get(highlight.url)
          .replace(/{{\s*color\s*}}/g, () => highlight.svgInfo.colors[0] || "")
          .replace(
            /{{\s*colors\[(\d+)\]\s*}}/g,
            (_, args) => highlight.svgInfo.colors[Number.parseInt(args)] || ""
          );
        const svgData = await new Promise((resolve, reject) => {
          fabric.loadSVGFromString(realSvg, (objects, options) => {
            if (objects) resolve({ objects, options });
            else reject(new Error("Failed to load SVG"));
          });
        });
        if (!item._svgData) item._svgData = new Map();
        item._svgData.set(i, svgData);
      } catch (error) {
        console.warn("download svg failed, ", error);
      }
    }
    return true;
  }
  fabric.Textasset = fabric.util.createClass(fabric.Textbox, {
    // fabric.Textasset = fabric.util.createClass(fabric.IText, {
    type: "textasset",
    bottomShadowProps: {},
    initialize: function (a, b) {
      this.cacheProperties.push(
        "bottomFill",
        "bottomOffsetX",
        "bottomOffsetY",
        "bottomStroke",
        "bottomStrokeWidth"
      );

      this.cacheProperties.push("texts");

      b || (b = {});

      this.texts = b.texts || [];
      this._svgData = new Map();

      this.set("stroke", b.stroke || "rgba(0,0,0,1)");
      this.set("strokeWidth", b.strokeWidth || 0);
      this.set("bottomFill", b.bottomFill || "rgba(0,0,0,1)");
      this.set("bottomOffsetX", b.bottomOffsetX || 0);
      this.set("bottomOffsetY", b.bottomOffsetY || 0);
      this.set("bottomStroke", b.bottomStroke || null);
      this.set("bottomStrokeWidth", b.bottomStrokeWidth || 0);
      this.callSuper("initialize", a, b);
      "underline" == this.textDecoration && (this.underline = !0);

      if (this.texts.length > 0) {
        downloadSvg(this).then(() => {
          this.dirty = true;
        });
      }
    },
    _isTransparent: function (a) {
      return a && /^rgb/.test(a)
        ? ((a = a
            .split("(")[1]
            .split(")")[0]
            .split(",")
            .map((b) => +b)),
          4 == a.length && 0 == a[3])
        : "transparent" == a
        ? !0
        : !1;
    },
    _renderText: function (a) {
      (this._isTransparent(this.bottomFill) && this.shadow) ||
        (this.bottomShadowProps = this.shadow
          ? {
              shadowColor: this.shadow.color,
              shadowOffsetX: this.shadow.offsetX,
              shadowOffsetY: this.shadow.offsetY,
              shadowBlur: this.shadow.blur,
            }
          : {});
      this._renderBottom(a);
      this._isTransparent(this.bottomFill) || this._removeShadow(a);
      // this._renderTextDecoration(a, "underline");
      // this._renderTextFill(a);
      // this._renderTextStroke(a);
      this._renderHighlight(a);
      this.callSuper("_renderText", a);
    },

    _renderBottom: function (a) {
      var b = 0,
        k = this._getLeftOffset(),
        l = this._getTopOffset();
      if (!this._isTransparent(this.bottomFill)) {
        var e = this.fill;
        this.fill = this.bottomFill;
        a.save();
        var c = 0;
        for (var f = this._textLines.length; c < f; c++) {
          var d = this.getHeightOfLine(c);
          var g = d / this.lineHeight;
          var h = this._getLineLeftOffset(c);
          this._renderTextLine(
            "fillText",
            a,
            this._textLines[c],
            k + h - this.bottomOffsetX,
            l + b + g - this.bottomOffsetY,
            c
          );
          b += d;
        }
        a.restore();
        this.fill = e;
      }
      if (this.bottomStroke && this.bottomStrokeWidth) {
        e = this.stroke;
        this.stroke = !0;
        b = 0;
        a.save();
        a.strokeStyle = this.bottomStroke;
        a.lineWidth = this.bottomStrokeWidth;
        a.miterLimit = 2;
        c = 0;
        for (f = this._textLines.length; c < f; c++)
          (d = this.getHeightOfLine(c)),
            (g = d / this.lineHeight),
            (h = this._getLineLeftOffset(c)),
            this._renderTextLine(
              "strokeText",
              a,
              this._textLines[c],
              k + h - this.bottomOffsetX,
              l + b + g - this.bottomOffsetY,
              c
            ),
            (b += d);
        a.restore();
        this.stroke = e;
      }
    },
    toObject: function (a) {
      return fabric.util.object.extend(this.callSuper("toObject", a), {
        bottomFill: this.bottomFill,
        bottomOffsetX: this.bottomOffsetX,
        bottomOffsetY: this.bottomOffsetY,
        bottomStroke: this.bottomStroke,
        bottomStrokeWidth: this.bottomStrokeWidth,
      });
    },
    setTexts: function (texts) {
      this.texts = texts;
      this._svgData = new Map();
      return downloadSvg(this).then((res) => {
        this.dirty = true;
        return res;
      });
    },
    _renderHighlight(ctx) {
      try {
        if (!this.texts.length || !this.__charBounds?.length) return;

        const indexLineMap = [];
        const index2IndexOfLine = [];
        const lineTop = [];
        let curLineTop = 0;

        for (let line = 0; line < this._textLines.length; line++) {
          lineTop.push(curLineTop);
          curLineTop += this.getHeightOfLine(line);
          const chars = this._textLines[line];
          if (chars) {
            for (let i = 0; i < chars.length; i++) {
              index2IndexOfLine.push(i);
            }
            indexLineMap.push(...Array(chars.length).fill(line));
          }
        }

        let idx = 0;
        const textsSplit = [];

        this.texts.forEach((tObj, tIdx) => {
          if (
            !tObj.text.length ||
            !tObj.highlight ||
            tObj.highlight.type !== "svg" ||
            !tObj.highlight.url
          ) {
            idx += tObj.text.length;
            return;
          }

          let startLineIndex = indexLineMap[idx];
          let startIdx = 0;

          for (let i = 0; i < tObj.text.length; i++) {
            const curLineIndex = indexLineMap[idx + i];
            if (curLineIndex !== startLineIndex) {
              textsSplit.push({
                textsIndex: tIdx,
                start: index2IndexOfLine[idx + startIdx],
                end: index2IndexOfLine[idx + i - 1] + 1,
                lineIndex: startLineIndex,
                textObj: { ...tObj, text: tObj.text.substring(startIdx, i) },
              });
              startIdx = i;
              startLineIndex = curLineIndex;
            }
          }

          textsSplit.push({
            textsIndex: tIdx,
            start: index2IndexOfLine[idx + startIdx],
            end: index2IndexOfLine[idx + tObj.text.length - 1] + 1,
            lineIndex: startLineIndex,
            textObj: { ...tObj, text: tObj.text.substring(startIdx) },
          });

          idx += tObj.text.length;
        });

        textsSplit.forEach((t) => {
          const svg = this._svgData.get(t.textsIndex);
          if (!svg || t.lineIndex >= this.__charBounds.length) return;

          const curCharBoxs = this.__charBounds[t.lineIndex];

          // 生成 svg 的 fabric 对象组
          const baseSvgGroup = fabric.util.groupSVGElements(svg.objects, {
            ...svg.options,
            selectable: false,
            evented: false,
          });

          let position = "top";
          // 判断当前 svg 是否使用描边：若任一对象有 stroke 属性，则认为是 stroke 样式
          let isStroke = true;
          if (baseSvgGroup.fill) {
            isStroke = false;
          }

          if (isStroke) {
            baseSvgGroup.strokeWidth = t.textObj.highlight.svgInfo.strokeWidth;
            // 整体对齐该文本段的区域
            const charBox = curCharBoxs[t.start];
            const lastCharBox = curCharBoxs[t.end];
            const left =
              this._getLeftOffset() +
              this._getLineLeftOffset(t.lineIndex) +
              charBox.left;
            const top = this._getTopOffset() + lineTop[t.lineIndex];
            const width = lastCharBox.left - charBox.left;
            const height = charBox.height;
            const bottom = top + height;
            baseSvgGroup.set({
              left,
              top,
              scaleX: width / baseSvgGroup.width,
              scaleY: height / baseSvgGroup.height,
            });
            baseSvgGroup.render(ctx);
          } else {
            // fill 类型：认为 svg 是一个“点”，需要在每个字符下添加一个 svg，并根据 strokeWidth 参数放大宽高
            const scaleFactor = t.textObj.highlight.svgInfo.strokeWidth || 1;
            for (let charIndex = t.start; charIndex < t.end; charIndex++) {
              const charBox = curCharBoxs[charIndex];
              // 为每个字符重新生成一个 svg 对象
              const dot = fabric.util.groupSVGElements(svg.objects, {
                ...svg.options,
                selectable: false,
                evented: false,
              });
              // 以原 svg 的宽高作为基准，再乘以 scaleFactor 得到放大后的尺寸
              const dotWidth = dot.width * scaleFactor;
              const dotHeight = dot.height * scaleFactor;
              // 将 dot 居中对齐在该字符下方（可根据需要微调 top 的位置）
              const left =
                this._getLeftOffset() +
                this._getLineLeftOffset(t.lineIndex) +
                charBox.left +
                (charBox.width - dotWidth) / 2;
              const top =
                this._getTopOffset() + lineTop[t.lineIndex] + charBox.height;
              dot.set({
                left,
                top,
                scaleX: scaleFactor,
                scaleY: scaleFactor,
              });
              dot.render(ctx);
            }
          }
        });
      } catch (e) {
        console.error("_renderHighlight error", e);
      }
    },
  });

  fabric.Textasset.fromObject = function (t, e) {
    var i = fabric.util.stylesFromArray(t.styles, t.text),
      r = Object.assign({}, t, { styles: i });
    if ((o(r), r.styles))
      for (var n in r.styles) for (var s in r.styles[n]) o(r.styles[n][s]);
    fabric.Object._fromObject("Textasset", r, e, "text");
  };
})();

// Textasset 类型只有放大控制
// (function(){
//   var controlsUtils = fabric.controlsUtils,
//   scaleSkewStyleHandler = controlsUtils.scaleSkewCursorStyleHandler,
//   objectControls = fabric.Object.prototype.controls;

//   var textBoxControls = fabric.Textasset.prototype.controls = { };

//     textBoxControls.mtr = objectControls.mtr;
//     textBoxControls.tr = objectControls.tr;
//     textBoxControls.br = objectControls.br;
//     textBoxControls.tl = objectControls.tl;
//     textBoxControls.bl = objectControls.bl;
//     // textBoxControls.mt = objectControls.mt;
//     // textBoxControls.mb = objectControls.mb;

//     textBoxControls.mr = new fabric.Control({
//       x: 0.5,
//       y: 0,
//       actionHandler: controlsUtils.changeWidth,
//       cursorStyleHandler: scaleSkewStyleHandler,
//       actionName: 'resizing',
//     });

//     textBoxControls.ml = new fabric.Control({
//       x: -0.5,
//       y: 0,
//       actionHandler: controlsUtils.changeWidth,
//       cursorStyleHandler: scaleSkewStyleHandler,
//       actionName: 'resizing',
//     });

// })();

// 弯曲字体
fabric.Textcurved = fabric.util.createClass(fabric.IText, {
  type: "textcurved",
  pathProperties: ["radius", "flipped"],
  cacheProperties: fabric.IText.prototype.cacheProperties.concat(
    "radius",
    "flipped"
  ),
  initialize: function (a, b) {
    this.textAlign = "center";
    this.radius = b.radius ?? 250;
    this.flipped = b.flipped ?? !1;
    this.charSpacing = b.charSpacing ?? 0;
    b.kerning &&
      (this.charSpacing = (b.kerning / (b.fontSize ?? this.fontSize)) * 1e3);
    b.diameter && (this.radius = b.diameter / 2);
    this.path = new fabric.Path([], { visible: !1 });
    this.callSuper("initialize", a, b);
    this._setPath();
  },
  onKeyDown: function (a) {
    "Enter" === a.key
      ? (a.preventDefault(), a.stopImmediatePropagation())
      : this.callSuper("onKeyDown", a);
  },
  _render: function (a) {
    a.save();
    a.translate(0, this._pathOffset);
    this.callSuper("_render", a);
    a.restore();
  },
  _set: function (a, b) {
    this.callSuper("_set", a, b);
    this.pathProperties.includes(a) && this._setPath();
  },
  _setPath: function () {
    this.pathAlign = this.flipped ? "ascender" : "baseline";
    this.path._setPath(
      this.flipped
        ? [
            ["M", 0, 0],
            ["a", this.radius, this.radius, 0, 1, 0, 0, 2 * this.radius],
            ["a", this.radius, this.radius, 0, 1, 0, 0, 2 * -this.radius],
          ]
        : [
            ["M", 0, 0],
            ["a", this.radius, this.radius, 0, 1, 1, 0, 2 * -this.radius],
            ["a", this.radius, this.radius, 0, 1, 1, 0, 2 * this.radius],
          ]
    );
    this.setPathInfo();
    this.initDimensions();
    this.setCoords();
  },
  initDimensions: function () {
    this.__skipDimension ||
      (this.callSuper("initDimensions"),
      this.path.path.length &&
        ((this._textWidth = this.calcTextWidth()),
        (this._textHeight = this.calcTextHeight()),
        this._calculateOffset()));
  },
  _calculateOffset: function () {
    var a = this._textHeight,
      b = this._textWidth / (2 * this.radius),
      c = Math.min(b, Math.PI);
    b = Math.min(b, Math.PI / 2);
    if (this.flipped) {
      var d = this.radius;
      a = d + a;
      c = Math.min(d * Math.cos(c), a * Math.cos(c));
      this.width = a * Math.sin(b) * 2;
      this.height = a - c;
      this._pathOffset = -(c + a) / 2;
    } else
      (d = -this.radius),
        (a = d - a),
        (c = Math.max(d * Math.cos(c), a * Math.cos(c))),
        (this.width = -a * Math.sin(b) * 2),
        (this.height = c - a),
        (this._pathOffset = -(a + c) / 2);
    this.pathStartOffset = (this.charSpacing / 2e3) * this.fontSize;
  },
  _getSelectionIndices: function () {
    var a = this.inCompositionMode
      ? this.hiddenTextarea.selectionEnd
      : this.selectionEnd;
    const b = this.get2DCursorLocation(
      this.inCompositionMode
        ? this.hiddenTextarea.selectionStart
        : this.selectionStart
    ).charIndex;
    a = this.get2DCursorLocation(a).charIndex - 1;
    return a > b ? [b, a] : [a, b];
  },
  _getSelectionAngle: function (a) {
    a = (a - this._textWidth / 2) / this.radius;
    return this.flipped ? -1.5 * Math.PI - a : a - Math.PI / 2;
  },
  _drawSelectionArc: function (a, b, c, d = !1) {
    a.beginPath();
    a.arc(0, this._pathOffset, this.radius, b, c, d);
    a.arc(0, this._pathOffset, this.radius + this._textHeight, c, b, !d);
    a.closePath();
    a.fill();
  },
  renderSelection: function (a, b) {
    const [c, d] = this._getSelectionIndices();
    var e = this.__charBounds[0][d].left + this.__charBounds[0][d].width;
    a = this._getSelectionAngle(this.__charBounds[0][c].left);
    e = this._getSelectionAngle(e);
    b.fillStyle = this.inCompositionMode
      ? this.compositionColor || "black"
      : this.selectionColor;
    this._drawSelectionArc(b, a, e, this.flipped);
  },
  renderCursor: function (a, b) {
    a = this.get2DCursorLocation().charIndex;
    const c = this._getSelectionAngle(this.__charBounds[0][a].left),
      d = 1 / this.radius;
    b.fillStyle = this.cursorColor || this.getValueOfPropertyAt(0, a, "fill");
    b.globalAlpha = this.__isMousedown ? 1 : this._currentCursorOpacity;
    this._drawSelectionArc(b, c, c + d);
  },
  toObject: function () {
    return fabric.util.object.extend(this.callSuper("toObject"), {
      path: void 0,
      radius: this.radius,
      flipped: this.flipped,
    });
  },
});
fabric.Textcurved.fromObject = function (a, b) {
  return fabric.Object._fromObject("Textcurved", a, b, "text");
};

// 变形字体
fabric.Textwarped = fabric.util.createClass(fabric.IText, {
  type: "textwarped",
  resizeProperties: ["sizeTop", "sizeBottom"],
  cacheProperties: fabric.IText.prototype.cacheProperties.concat(
    "sizeTop",
    "sizeBottom",
    "warpType"
  ),
  _createCanvasElement: function () {
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.left = "-9999px";
    canvas.style.top = "-9999px";
    canvas.style.zIndex = "-1";
    canvas.style.pointerEvents = "none";
    canvas.style.userSelect = "none";
    return canvas;
  },
  initialize: function (b, a) {
    this.opCanvas = this._createCanvasElement();
    this.opCtx = this.opCanvas.getContext("2d");

    this.tgCanvas = this._createCanvasElement();
    this.tgCtx = this.tgCanvas.getContext("2d");
    this.sizeTop = a?.sizeTop ?? 0;
    this.sizeBottom = a?.sizeBottom ?? 0;
    this.warpType = a?.warpType ?? 0;
    this.callSuper("initialize", b, a);
    document.body.append(this.opCanvas, this.tgCanvas);
  },
  onKeyDown: function (b) {
    "Enter" === b.key
      ? (b.preventDefault(), b.stopImmediatePropagation())
      : this.callSuper("onKeyDown", b);
  },
  _renderChar: function (b, a, c, d, f, e, g) {
    this.callSuper(
      "_renderChar",
      b,
      a,
      c,
      d,
      f,
      e,
      this.height / 2 - this._descent
    );
  },
  _set: function (b, a) {
    this.callSuper("_set", b, a);
    this.resizeProperties.includes(b) && this.initDimensions();
  },
  _getWarpAt(b, a = 1) {
    b = fabric.Textwarped.warpFunctions[this.warpType](b);
    const c =
      -this._msrHeight * a * 0.5 + b * this.sizeTop * this._msrHeight * a;
    return [
      c + this._offset * a,
      this._msrHeight * a * 0.5 + b * this.sizeBottom * this._msrHeight * a - c,
    ];
  },
  renderCursor(b, a) {
    const c = a.fillRect;
    a.fillRect = (d, f, e, g) => {
      const [h, k] = this._getWarpAt(d / this.width + 0.5);
      c.call(a, d, h, e, k);
    };
    this.callSuper("renderCursor", b, a);
    a.fillRect = c;
  },
  renderSelection(b, a) {
    const c = a.fillRect;
    a.fillRect = (d, f, e, g) => {
      c.call(a, d, -this._totHeight / 2, e, this._totHeight);
    };
    this.callSuper("renderSelection", b, a);
    a.fillRect = c;
  },
  initDimensions: function () {
    this.callSuper("initDimensions");
    this.opCtx.save();
    this._setTextStyles(this.opCtx);
    var b = this.opCtx.measureText(this.text || "!");
    this.opCtx.restore();
    var a = b.actualBoundingBoxDescent;
    this._msrHeight = b = b.actualBoundingBoxAscent + a;
    this._descent = a + 1;
    a = Math.abs(this.sizeTop) * b;
    const c = Math.abs(this.sizeBottom) * b;
    this.height = this._totHeight = b + a + c;
    this._offset = (a - c) / 2;
  },
  _render: function (b) {
    this.opCanvas.width = 2 * this.width;
    this.opCanvas.height = 2 * this._msrHeight;
    this.opCtx.clearRect(0, 0, this.opCanvas.width, this.opCanvas.height);
    this.tgCanvas.width = 2 * this.width;
    this.tgCanvas.height = 2 * this._totHeight;
    this.tgCtx.clearRect(0, 0, this.tgCanvas.width, this.tgCanvas.height);
    this.opCtx.save();
    this.opCtx.translate(this.width, this._msrHeight);
    this.opCtx.scale(2, 2);
    this.height = this._msrHeight;
    this.callSuper("_render", this.opCtx);
    this.height = this._totHeight;
    this.opCtx.restore();
    for (let a = 0; a < this.opCanvas.width; a += 1) {
      const [c, d] = this._getWarpAt(a / (2 * this.width), 2);
      this.tgCtx.drawImage(
        this.opCanvas,
        a,
        0,
        1,
        this.opCanvas.height,
        a,
        c + this._totHeight,
        1,
        d
      );
    }
    b.drawImage(
      this.tgCanvas,
      0,
      0,
      this.tgCanvas.width,
      this.tgCanvas.height,
      -this.width / 2,
      -this._totHeight / 2,
      this.width,
      this._totHeight
    );
  },
  toObject: function () {
    return fabric.util.object.extend(this.callSuper("toObject"), {
      sizeTop: this.sizeTop,
      sizeBottom: this.sizeBottom,
      warpType: this.warpType,
    });
  },
});
fabric.Textwarped.fromObject = function (b, a) {
  return fabric.Object._fromObject("Textwarped", b, a, "text");
};
fabric.Textwarped.warpFunctions = {
  round: (b) => 1 - 2 * Math.sin(b * Math.PI),
  straight: (b) => 1 - Math.abs(4 * b - 2),
  skewed: (b) => 1 - 2 * b,
};