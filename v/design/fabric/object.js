const xe = {
  "SELECTION_CREATED": "selection:created",
  "SELECTION_CLEARD": "selection:cleared",
  "OBJECT_MODIFIED": "object:modified",
  "SVG_FILL_MODIFIED": "svg:fill_modified",
  "OBJECT_SELECTED": "object:selected",
  "OBJECT_SELECTED_BY_RIGHT_CLICK": "object:selected_by_right_click",
  "OBJECT_ROTATING": "object:rotating",
  "OBJECT_SCALING": "object:scaling",
  "OBJECT_MOVING": "object:moving",
  "OBJECT_ADDED": "object:added",
  "OBJECT_REMOVED": "object:removed",
  "SELECTED_UPDATE": "selection:updated",
  "SHOW_LOCK_SHAKE": "show_lock_shake",
  "MOUSE_DBCLICK": "mousedblclick",
  "MODIFIED": "modified",
  "MOUSE_UP": "mouse:up",
  "MOUSE_DOWN": "mouse:down",
  "MOUSE_STRAT_DRAG": "mouse:start_drag",
  "MOUSE_END_DRAG": "mouse:end_drag",
  "MOUSE_MOVE": "mouse:move",
  "MOUSE_OVER": "mouse:over",
  "MOUSE_OUT": "mouse:out",
  "MOUSE_DBLCLICK": "mouse:dblclick",
  "TEXT_CHANGED": "text:changed",
  "TEXT_SELECTION_CHANGED": "text:selection:changed",
  "TEXT_EDITING_ENTERED": "text:editing:entered",
  "TEXT_EDITING_EXITED": "text:editing:exited",
  "TEXT_SCALE_CHANGE": "text_scale_change",
  "TEXT_FONT_FAMILY_LOADED": "text_font_family_loaded",
  "TEXT_FONT_INFO_READY": "text_font_info_ready",
  "TEXT_FONT_LOAD_BY_OBJECTS": "text_font_load_by_objects",
  "FTIMAGE_SHOW_CLIP": "FTImage:showClip",
  "FTIMAGE_CLOSE_CLIP": "FTImage:closeClip",
  "FTGRIDLINE_STATUS_CHANGED": "FTGridline:statusChanged",
  "CANVAS_DRAGENTER": "dragenter",
  "CANVAS_DRAGLEAVE": "dragleave",
  "CANVAS_DRAGOVER": "dragover",
  "CANVAS_DROP": "drop",
  "BEFORE_RENDER": "before:render",
  "AFTER_RENDER": "after:render",
  "TOGGLE_PAGE": "toggle_page",
  "PAGE_LOADED": "page_loaded",
  "FTIMAGE_EXIT_EDIT": "FTimage_exit_edit",
  "CANCEL_COLOR_PICK": "cancel_Color_pick",
  "CHART_SCALE_CHANGE": "chart_scale_change",
  "IMAGECONTAINER_DRAG_START": "imagecontainer_drag_start",
  "IMAGECONTAINER_DRAGGING": "imagecontainer_dragging",
  "IMAGECONTAINER_DRAG_END": "imagecontainer_drag_end",
  "LEFT_MENU_TOGGLE": "left_menu_toggle",
  "FILTER_TXT_UPLOAD_SUCCESS": "filter_txt_upload_success",
  "FILTER_TXT_DRAW": "filter_txt_draw",
  "FILTER_TXT_DRAW_NEED": "filter_txt_draw_need",
  "MODIFIED_UI": "modified_ui",
  "IMAGE_STROKE_CHANGE": "image_stroke_change",
  "ADD_TEMPLATE_FAMILY_NAME": "add_template_family_name"
};
var e = fabric.util.object.clone,
  t = fabric.util.toFixed,
  a = fabric.StaticCanvas.supports("setLineDash"),
  n = fabric.util.degreesToRadians;
(fabric.Object.NUM_FRACTION_DIGITS = 3),
  fabric.util.object.extend(fabric.Object.prototype, {
    strokeWidth: 0,
    rotatingPointOffset: 30,
    objectId: null,
    fill: "rgb(0,0,0)",
    lockScalingFlip: !0,
    canSelection: !1,
    isLock: !1,
    fills: [],
    stateProperties:
      "top left width height scaleX scaleY flipX flipY originX originY transformMatrix stroke strokeWidth strokeDashArray strokeLineCap strokeDashOffset strokeLineJoin strokeMiterLimit angle opacity fill globalCompositeOperation shadow clipTo visible backgroundColor isLock skewX skewY fillRule paintFirst strokeUniform vip elementId fromVipTemp strokeDashType".split(
        " "
      ),
    openShadow: !0,
    loadError: null,
    loadErrorType: null,
    limitMinWidth: void 0,
    limitMinHeight: void 0,
    dataVersion: "1.1",
    _cacheZoom: fabric.isLikelyNode ? 4 : 2,
    toggleLock: function (e) {
      this.isLock = e;
    },
    initialize: function (e) {
      e &&
        ((this.parentType = e.parentType),
        this.setOptions(e),
        this.setControl(e.stretchMode)),
        e.objectId || this.generateNewObjectId();
    },
    setControl: function (e) {
      return;
      switch (e) {
        case "horizontal":
          this.setControlsVisibility({
            mt: !1,
            mb: !1,
          });
          break;
        case "vertical":
          this.setControlsVisibility({
            ml: !1,
            mr: !1,
          });
          break;
        case "equal":
          this.setControlsVisibility({
            ml: !1,
            mr: !1,
            mt: !1,
            mb: !1,
          });
          break;
        case "horizontalOnly":
          this.setControlsVisibility({
            tl: !1,
            tr: !1,
            br: !1,
            bl: !1,
            mt: !1,
            mb: !1,
          });
          break;
        case "verticalOnly":
          this.setControlsVisibility({
            tl: !1,
            tr: !1,
            br: !1,
            bl: !1,
            ml: !1,
            mr: !1,
          });
          break;
        case "none":
          this.setControlsVisibility({
            tl: !1,
            tr: !1,
            br: !1,
            bl: !1,
            ml: !1,
            mt: !1,
            mr: !1,
            mb: !1,
            mtr: !1,
          });
          break;
        case "any":
          this.setControlsVisibility({
            tl: !0,
            tr: !0,
            br: !0,
            bl: !0,
            ml: !0,
            mt: !0,
            mr: !0,
            mb: !0,
            mtr: !0,
          });
      }
    },
    generateNewObjectId: function (e) {
    //   this.objectId = u()();
    this.objectId = crypto.randomUUID();
    },
    initFills: function (e) {
      var t,
        a = {};
      (t = e.reduce(function (e, t) {
        return !a[t.id] && (a[t.id] = e.push(t)), e;
      }, [])),
        (this.fills = t);
    },
    setFills: function (e) {
      this.getObjects
        ? (this.getObjects().forEach(function (t) {
            var a = e.find(function (e) {
              return t.id && e.id && t.id.toLowerCase().match(e.id);
            });
            a &&
              t.set({
                fill: a.fill,
              });
          }),
          this.initFills(e))
        : this.set({
            fill: e[0].fill,
          });
    },
    cornerStrokeColor: "rgba(0,0,0, 0.15)",
    cornerSize: 12,
    cornerRoundSize: 3,
    cornerColor: "rgba(255,255,255,1)",
    cornerHighlightColor: "#4BD3FB",
    cornerHighlightStrokeColor: "rgba(255,255,255,1)",
    transparentCorners: !1,
    cornerStyle: "circle",
    borderColor: "#4BD3FB",
    borderDashArray: [3, 0],
    borderScaleFactor: 2,
    borderOpacityWhenMoving: 1,
    fromVipTemp: void 0,
    vip: !1,
    elementId: "",
    // setCoords: function (e, t) {
    //   return (
    //     !this.group ||
    //       "activeSelection" === this.group.type ||
    //       e ||
    //       t ||
    //       ((e = !0), (t = !0)),
    //     (this.oCoords = this.calcCoords(e)),
    //     t || (this.aCoords = this.calcCoords(!0)),
    //     e || (this._setCornerCoords && this._setCornerCoords()),
    //     this
    //   );
    // },
    calcCoords: function (e, t) {
      var a = new fabric.Point(0, 0),
        n = this._calcRotateMatrix(),
        i = this._calcTranslateMatrix(),
        r = t || fabric.util.multiplyTransformMatrices(i, n),
        o = this.getViewportTransform(),
        c = e ? r : fabric.util.multiplyTransformMatrices(o, r),
        l = this._getTransformedDimensions(),
        u = l.x / 2,
        h = l.y / 2,
        d = fabric.util.transformPoint(a.setXY(-u, -h), c),
        p = fabric.util.transformPoint(a.setXY(u, -h), c),
        g = fabric.util.transformPoint(a.setXY(-u, h), c),
        f = fabric.util.transformPoint(a.setXY(u, h), c),
        m = {
          tl: d,
          tr: p,
          br: f,
          bl: g,
        };
      if (!e) {
        var v = this.padding,
          b = fabric.util.degreesToRadians(this.angle),
          _ = fabric.util.cos(b),
          A = fabric.util.sin(b),
          y = _ * v,
          E = A * v,
          C = y + E,
          O = y - E;
        v &&
          ((d.x -= O),
          (d.y -= C),
          (p.x += C),
          (p.y -= O),
          (g.x -= C),
          (g.y += O),
          (f.x += O),
          (f.y += C));
        var k = new fabric.Point((d.x + g.x) / 2, (d.y + g.y) / 2),
          w = new fabric.Point((p.x + d.x) / 2, (p.y + d.y) / 2),
          I = new fabric.Point((f.x + p.x) / 2, (f.y + p.y) / 2),
          S = new fabric.Point((f.x + g.x) / 2, (f.y + g.y) / 2),
          j = new fabric.Point(
            w.x + A * this.rotatingPointOffset,
            w.y - _ * this.rotatingPointOffset
          ),
          T = new fabric.Point(
            S.x - A * this.rotatingPointOffset,
            S.y + _ * this.rotatingPointOffset
          );
        Object.assign(m, {
          ml: k,
          mt: w,
          mr: I,
          mb: S,
          mtr: j,
        //   mbm: T,
        });
      }
      return m;
    },
    _getControlsVisibility: function () {
      return (
        this._controlsVisibility ||
          (this._controlsVisibility = {
            tl: !0,
            tr: !0,
            br: !0,
            bl: !0,
            ml: !0,
            mt: !0,
            mr: !0,
            mb: !0,
            mtr: !0,
            // mbm: !0,
          }),
        this._controlsVisibility
      );
    },
    isControlVisible: function (e) {
      var t = this._getControlsVisibility()[e];
      return (
        (!t ||
          (!this.isMoving && 0 === this.__corner) ||
          (e === this.__corner && "mtr" !== e)) &&
        t
      );
    },
    onSelect: function (e) {
      var t = !1;
      return e && e.e && "mouseup" === e.e.type && this.isLock && (t = !0), t;
    },
    changeRotationWhenScaleX: function () {
      return !1;
    },
    toObject: function (e) {
      var a = [
          "id",
          "objectId",
          "isLock",
          "canSelection",
          "fills",
          "hasBorder",
          "oldStrokeWidth",
          "lockUniScaling",
          "lockScalingX",
          "lockScalingY",
          "dataVersion",
        ].concat(e),
        n = fabric.Object.NUM_FRACTION_DIGITS,
        i = {
          type: this.type,
          fromVipTemp: this.fromVipTemp,
          version: fabric.version,
          dataVersion: this.dataVersion,
          originX: this.originX,
          originY: this.originY,
          left: t(this.left, n),
          top: t(this.top, n),
          width: t(this.width, n),
          height: t(this.height, n),
          fill:
            this.fill && this.fill.toObject ? this.fill.toObject() : this.fill,
          elementId: this.elementId,
          stroke:
            this.stroke && this.stroke.toObject
              ? this.stroke.toObject()
              : this.stroke,
          strokeWidth: t(this.strokeWidth, n),
          strokeDashArray: this.strokeDashArray
            ? this.strokeDashArray.concat()
            : this.strokeDashArray,
          strokeLineCap: this.strokeLineCap,
          strokeDashOffset: this.strokeDashOffset,
          strokeLineJoin: this.strokeLineJoin,
          stretchMode: this.stretchMode,
          strokeMiterLimit: t(this.strokeMiterLimit, n),
          scaleX: t(this.scaleX, n),
          scaleY: t(this.scaleY, n),
          angle: t(this.angle, n),
          flipX: this.flipX,
          flipY: this.flipY,
          opacity: t(this.opacity, n),
          shadow:
            this.shadow && this.shadow.toObject
              ? this.shadow.toObject()
              : this.shadow,
          visible: this.visible,
          vip: this.vip,
          clipTo: this.clipTo && String(this.clipTo),
          backgroundColor: this.backgroundColor,
          fillRule: this.fillRule,
          paintFirst: this.paintFirst,
          globalCompositeOperation: this.globalCompositeOperation,
          transformMatrix: this.transformMatrix
            ? this.transformMatrix.concat()
            : null,
          skewX: t(this.skewX, n),
          skewY: t(this.skewY, n),
          openShadow: this.openShadow,
          strokeDashType: this.strokeDashType,
        };
      return (
        this.clipPath &&
          ((i.clipPath = this.clipPath.toObject(a)),
          (i.clipPath.inverted = this.clipPath.inverted),
          (i.clipPath.absolutePositioned = this.clipPath.absolutePositioned)),
        fabric.util.populateWithProperties(this, i, a),
        this.includeDefaultValues || (i = this._removeDefaultValues(i)),
        i
      );
    },
    needsItsOwnCache: function () {
      return (
        !(!this.willDrawShadow() || (!this.hasFill() && !this.hasStroke())) ||
        !!this.clipPath
      );
    },
    willDrawShadow: function () {
      return (
        this.openShadow &&
        !!this.shadow &&
        (0 !== this.shadow.offsetX || 0 !== this.shadow.offsetY)
      );
    },
    _setShadow: function (e) {
      if (this.openShadow && this.shadow) {
        var t,
          a = this.shadow,
          n = this.canvas,
          i = (n && n.viewportTransform[0]) || 1,
          r = (n && n.viewportTransform[3]) || 1;
        (t = a.nonScaling
          ? {
              scaleX: 1,
              scaleY: 1,
            }
          : this.getObjectScaling()),
          n &&
            n._isRetinaScaling() &&
            ((i *= fabric.devicePixelRatio),
            (r *= fabric.devicePixelRatio)),
          (e.shadowColor = a.color),
          (e.shadowBlur =
            (a.blur *
              fabric.browserShadowBlurConstant *
              (i + r) *
              (t.scaleX + t.scaleY)) /
            4),
          (e.shadowOffsetX = a.offsetX * i * t.scaleX),
          (e.shadowOffsetY = a.offsetY * r * t.scaleY);
      }
    },
    skipFillWhenGetElementColors: function () {
      return !1;
    },
    getElementColors: function () {
      var e = [];
      return (
        !this.skipFillWhenGetElementColors() && this.fill && e.push(this.fill),
        this.stroke && this.strokeWidth > 0 && e.push(this.stroke),
        this.fills &&
          this.fills.length > 0 &&
          this.fills.forEach(function (t) {
            t && t.fill && e.push(t.fill);
          }),
        this.openShadow && this.shadow && e.push(this.shadow.color),
        e
      );
    },
    getSavedState: function (t) {
      var a = (t && t.propertySet) || "stateProperties";
      return e(this["_" + a], !0);
    },
    showLoadError: function (e) {
      var t = this;
      if (!this.loadError) {
        fabric.loadSVGFromString(
          '<?xml version="1.0" encoding="UTF-8"?>\n          <svg width="16px" height="16px" viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n              \x3c!-- Generator: Sketch 53.2 (72643) - https://sketchapp.com --\x3e\n              <title>Icon / Error 2</title>\n              <desc>Created with Sketch.</desc>\n              <g id="Icon-/-Error-2" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n                  <path d="M8,1 C4.134,1 1,4.134 1,8 C1,11.866 4.134,15 8,15 C11.866,15 15,11.866 15,8 C15,4.134 11.866,1 8,1" id="Fill-1" fill="#F24A62"></path>\n                  <path d="M8.0363,13.1456 C7.4563,13.1456 6.9853,12.6986 6.9853,12.1456 C6.9853,11.5936 7.4563,11.1456 8.0363,11.1456 C8.6163,11.1456 9.0873,11.5936 9.0873,12.1456 C9.0873,12.6986 8.6163,13.1456 8.0363,13.1456 Z M8.0724,10.1319 C7.5194,10.1319 7.0724,9.6849 7.0724,9.1319 L7.0724,4.1319 C7.0724,3.5789 7.5194,3.1319 8.0724,3.1319 C8.6254,3.1319 9.0724,3.5789 9.0724,4.1319 L9.0724,9.1319 C9.0724,9.6849 8.6254,10.1319 8.0724,10.1319 Z" id="\u5408\u5e76\u5f62\u72b6" fill="#FFFFFF"></path>\n              </g>\n          </svg>',
          function (a, n) {
            (t.loadError = fabric.util.groupSVGElements(a, n)),
              (t.loadError.originX = "center"),
              (t.loadError.originY = "center"),
              (t.loadError.objectCaching = !1),
              (t.dirty = !0),
              e && e();
          }
        );
      }
    },
    showNetworkError: function () {},
    renderLoadErrorIcon: function (e) {
      if (this.loadError) {
        var t = this.loadError.width,
          a = this.loadError.height,
          n = A(this.width, this.height, t, a);
        this.loadError.scale(n),
          e.save(),
          this.loadError.render(e),
          e.restore();
      }
    },
    renderCache: function (options) {
      options = options || {};
    
      // 确保缓存画布存在
      if (!this._cacheCanvas) {
        this._createCacheCanvas();
      }
    
      // 如果缓存是脏的，需要重新绘制缓存
      if (this.isCacheDirty()) {
        // 如果启用了状态缓存，保存状态
        if (this.statefullCache) {
          this.saveState({
            propertySet: "cacheProperties",
          });
        }
    
        // 绘制对象到缓存上下文
        this.drawObject(this._cacheContext, options.forClipping, true);
    
        // 如果定义了 EnhancedImage 且当前对象是它的实例，则绘制水印
        if (typeof fabric.EnhancedImage !== "undefined" && this instanceof fabric.EnhancedImage) {
          this.drawWatermark();
        }
    
        // 如果需要缓存描边
        if (options.cacheStroke) {
          if (!this._cacheStrokeCanvas) {
            this._cacheStrokeCanvas = fabric.util.createCanvasElement();
          }
    
          const cacheCanvas = this._cacheCanvas;
          const width = cacheCanvas.width;
          const height = cacheCanvas.height;
    
          const strokeCanvas = this._cacheStrokeCanvas;
          strokeCanvas.width = width;
          strokeCanvas.height = height;
    
          const strokeContext = strokeCanvas.getContext("2d");
          strokeContext.clearRect(0, 0, width, height);
          strokeContext.drawImage(cacheCanvas, 0, 0);
    
          // 设置为脏以触发重新渲染
          this.dirty = true;
    
          // 调用父类方法执行缓存渲染
          fabric.Object.prototype.renderCache.call(this);
    
          // 合成原图层与描边效果
          const originalCompositeOperation = strokeContext.globalCompositeOperation;
          strokeContext.globalCompositeOperation = "source-out";
          strokeContext.drawImage(cacheCanvas, 0, 0);
          strokeContext.globalCompositeOperation = originalCompositeOperation;
    
          // 再次调用父类的缓存渲染
          this.dirty = true;
          fabric.Object.prototype.renderCache.call(this, {
            forClipping: options.forClipping,
          });
        }
    
        // 缓存已更新完毕，标记为不脏
        this.dirty = false;
      }
    },
    
    isVip: function () {
      return this.vip;
    },
    isLegacyObject: function (e) {
      var t = e || this;
      return t.group && t.isLegacyObject
        ? t.isLegacyObject(t.group)
        : !t.elementId &&
            (!t.objectId || (t.objectId && t.objectId.length < 25));
    },
    needDrawWatermark: function (e) {
      return (
        !!this.canvas &&
        (e || (e = this),
        !!this.canvas.watermarkElement &&
          (!this.canvas.watermarkElement ||
            this.type !== 'imageContainerGroup') &&
          (!this.group ||
            this.group.type !== 'group' ||
            !this.group.isVip()) &&
          (!(!e.needWaterMark || !e.needWaterMark()) ||
            !(this.canvas.getVip() || !e.isVip())))
      );
    },
    drawWatermark: function (e, t) {
      if (this.canvas) {
        var a = this.canvas.watermarkElement;
        if (this.needDrawWatermark() && a && (this._cacheContext || e)) {
          var n = a.width,
            i = a.height;
          if (!e && this._cacheContext) {
            var r = this._cacheCanvas,
              o = r.width,
              c = r.height,
              s = this.width,
              l = this.height,
              u = this.zoomX,
              h = this.zoomY,
              d = (this.flipX, this.flipY, Math.min((s * u) / n, (l * h) / i)),
              p = n * d,
              g = i * d;
            this._cacheContext.save(),
              this._cacheContext.beginPath(),
              this._cacheContext.setTransform(
                1,
                0,
                0,
                1,
                (o - s * u) / 2,
                (c - l * h) / 2
              ),
              (this._cacheContext.globalCompositeOperation = "source-atop"),
              this._cacheContext.rect(0, 0, s * u, l * h),
              this._cacheContext.clip();
            for (var f = 0; f < s * u; f += p)
              for (var m = 0; m < l * h; m += g)
                this._cacheContext.drawImage(a, 0, 0, n, i, f, m, p, g);
            this._cacheContext.restore();
          } else if (e) {
            var v = this.flipX,
              b = (this.flipY, e.canvas),
              _ = b.width,
              A = b.height,
              y = 0,
              E = 0,
              C = 0,
              O = 0;
            t
              ? ((y = v ? (t.width + t.left) / 2 : t.left),
                (E = t.top),
                (C = t.width),
                (O = t.height))
              : ((y = 0), (E = 0), (C = this.width), (O = this.height));
            var k = Math.min(C / n, O / i),
              w = n * k,
              I = i * k;
            e.save(),
              e.setTransform(1, 0, 0, 1, y, E),
              (e.globalCompositeOperation = "source-atop");
            for (var S = 0; S < _; S += w)
              for (var j = 0; j < A; j += I)
                e.drawImage(a, 0, 0, n, i, S, j, w, I);
            e.restore();
          }
        }
      }
    },
    _limitCacheSize: function (e) {
      var t = this,
        a = function (e) {
          var a = t._cacheZoom;
          for (var n in e)
            "number" === typeof e[n] && (e[n] = Number(e[n].toFixed(5)));
          return (
            (e.width *= a), (e.height *= a), (e.zoomX *= a), (e.zoomY *= a), e
          );
        },
        n = fabric.perfLimitSizeTotal,
        i = e.width,
        r = e.height,
        o = fabric.maxCacheSideLimit,
        c = fabric.minCacheSideLimit;
      if (i <= o && r <= o && i * r <= n)
        return i < c && (e.width = c), r < c && (e.height = c), a(e);
      var l = i / r,
        u = fabric.util.limitDimsByArea(l, n),
        h = fabric.util.capValue,
        d = h(c, u.x, o),
        p = h(c, u.y, o);
      return (
        i > d && ((e.zoomX /= i / d), (e.width = d), (e.capped = !0)),
        r > p && ((e.zoomY /= r / p), (e.height = p), (e.capped = !0)),
        a(e)
      );
    },
    getCacheCanvasPixelByEvent: function (e) {
      if (!this._cacheCanvas || !this.canvas) return [0, 0, 0, 0];
      var t = this.canvas.getZoom(),
        a = fabric.devicePixelRatio,
        n = this.canvas.getDocumentRectWithZoom(),
        i = n.x,
        r = n.y,
        o = this._cacheCanvas,
        c = o.width,
        l = o.height,
        u = this.width,
        h = this.height,
        d = this.zoomX,
        p = this.zoomY,
        g = this.left,
        f = this.top,
        m = this.angle,
        v = {
          x: (c - u * d) / 2,
          y: (l - h * p) / 2,
        },
        b = new fabric.Point(0, 0);
      b.setFromPoint(e),
        b.subtractEquals(new fabric.Point(i, r)),
        b.subtractEquals(new fabric.Point(g, f).multiplyEquals(t)),
        b.rotateAround(
          {
            x: 0,
            y: 0,
          },
          (-m * Math.PI) / 180
        ),
        b.multiplyEquals(2 * a),
        b.addEquals(new fabric.Point(v.x, v.y));
      var _ = this._cacheContext.getImageData(b.x, b.y, 1, 1).data;
      return [_[0], _[1], _[2], _[3]];
    },

    // todo
    /**
 * 渲染对象的描边（Stroke）
 */
_renderStroke: function (ctx) {
  // 如果未设置描边颜色或描边宽度为 0，直接跳过
  if (!this.stroke || this.strokeWidth === 0) return;

  // 如果有阴影但不影响描边，则临时移除阴影效果
  if (this.shadow && !this.shadow.affectStroke) {
    this._removeShadow(ctx);
  }

  ctx.save();

  // 如果启用了 strokeUniform（描边保持均匀宽度）
  if (this.strokeUniform) {
    const scale = this.getObjectScaling();
    ctx.scale(1 / scale.scaleX, 1 / scale.scaleY);
  }

  // 设置虚线效果（如果有）
  this._setLineDash(ctx, this.strokeDashArray, this._renderDashedStroke, true);

  // 渐变或图案描边处理
  if (this.stroke.toLive && this.stroke.gradientUnits === "percentage") {
    this._applyPatternForTransformedGradient(ctx, this.stroke);
  } else {
    this._applyPatternGradientTransform(ctx, this.stroke);
  }

  ctx.stroke();
  ctx.restore();
},

/**
 * 设置线条虚线样式
 * @param {CanvasRenderingContext2D} ctx - 画布上下文
 * @param {Array<number>} dashArray - 虚线模式数组
 * @param {Function} fallbackFn - 兼容旧浏览器用的虚线渲染函数
 * @param {boolean} scaleDash - 是否根据描边宽度缩放虚线长度
 */
_setLineDash: function (ctx, dashArray, fallbackFn, scaleDash) {
  
  if (!dashArray || dashArray.length === 0) return;

  // 如果是奇数个元素的 dashArray，复制一份使其偶数，避免渲染错误
  if (dashArray.length % 2 === 1) {
    dashArray = dashArray.concat(dashArray);
  }

  // 现代浏览器支持 setLineDash
  if (a /* 表示支持 setLineDash 的条件 */) {
    if (scaleDash) {
      const strokeWidth = this.strokeWidth || 0;
      dashArray = dashArray.map(value => value * strokeWidth);
    }
    ctx.setLineDash(dashArray);
  } else if (fallbackFn) {
    // 老版本浏览器 fallback（比如使用自定义函数绘制虚线）
    fallbackFn(ctx);
  }
},

/**
 * 绘制对象的边框（用于选中/编辑状态）
 * @param {CanvasRenderingContext2D} ctx - 画布上下文
 * @param {Object} options - 选项，支持 borderColor 和 borderDashArray
 */
drawBorders: function (ctx, options = {}) {
  
  const dimensions = this._calculateCurrentDimensions();
  const width = dimensions.x;
  const height = dimensions.y;

  ctx.save();
  ctx.strokeStyle = options.borderColor || this.borderColor;

  // 设置边框的虚线样式
  this._setLineDash(ctx, options.borderDashArray || this.borderDashArray, null);

  // 在对象中心绘制边框矩形（因为对象是以中心点为基准定位的）
  ctx.strokeRect(-width / 2, -height / 2, width, height);
  ctx.restore();

  return this;
},

    drawCacheOnCanvas: function (e) {
      if (
        this._cacheCanvas &&
        this._cacheCanvas.width > 0 &&
        this._cacheCanvas.height > 0
      ) {
        if ((e.scale(1 / this.zoomX, 1 / this.zoomY), fabric.isLikelyNode)) {
          this.revertShadow(e, this);
          var t = e.shadowOffsetX,
            a = e.shadowOffsetY,
            n = fabric.util.degreesToRadians(360 - (this.angle || 0)),
            i = fabric.util.rotatePoint(
              new fabric.Point(t, a),
              new fabric.Point(0, 0),
              n
            );
          (e.shadowOffsetX = i.x * (this.flipX ? -1 : 1)),
            (e.shadowOffsetY = i.y * (this.flipY ? -1 : 1));
        }
        e.drawImage(
          this._cacheCanvas,
          -this.cacheTranslationX,
          -this.cacheTranslationY
        );
      }
    },
    revertShadow: function (e) {
      if (this.openShadow && this.shadow) {
        var t,
          a = this.shadow,
          n = this.canvas,
          i = (n && n.viewportTransform[0]) || 1,
          r = (n && n.viewportTransform[3]) || 1;
        (t = a.nonScaling
          ? {
              scaleX: 1,
              scaleY: 1,
            }
          : this.getObjectScaling()),
          n &&
            n._isRetinaScaling() &&
            ((i *= fabric.devicePixelRatio),
            (r *= fabric.devicePixelRatio)),
          this._cacheZoom && ((i *= this._cacheZoom), (r *= this._cacheZoom)),
          (e.shadowColor = a.color),
          (e.shadowBlur =
            (a.blur *
              fabric.browserShadowBlurConstant *
              (i + r) *
              (t.scaleX + t.scaleY)) /
            4),
          (e.shadowOffsetX = a.offsetX * i * t.scaleX),
          (e.shadowOffsetY = a.offsetY * r * t.scaleY);
      }
    },
    copyStyle: function () {
      var e = this.openShadow,
        t = this.shadow,
        a = this.opacity,
        n = Math.max(this.get("scaleX") || 1, this.get("scaleY") || 1),
        i = this.get("strokeWidth") * n;
      return (
        t && (t = t.toObject()),
        {
          openShadow: e,
          shadow: t,
          opacity: a,
          strokeScaleWidth: i,
        }
      );
    },
    pasteStyle: function (e) {
      if (e.type === f.i.TEXTBOX) {
        var t = e.opacity;
        this.setOptions({
          opacity: t,
        });
      } else {
        var a = e.openShadow,
          n = e.shadow,
          i = e.opacity;
        this.setOptions({
          openShadow: a,
          shadow: n,
          opacity: i,
        });
      }
    },
    resetStrokeWidth: function (e, t) {
      var a = t.strokeScaleWidth,
        n = t.strokeWidth,
        i = e.strokes,
        r = Math.max(this.get("scaleX") || 1, this.get("scaleY") || 1);
      n && (e.strokeWidth = a / r),
        i &&
          i.strokeWidth &&
          i.strokeScaleWidth &&
          ((e.strokes.strokeWidth = i.strokeScaleWidth / r),
          delete e.strokes.strokeScaleWidth),
        delete e.strokeScaleWidth;
    },
    _renderControls: function (ctx, options) {
      // 获取画布的变换矩阵和对象的变换矩阵
      const viewportTransform = this.getViewportTransform();
      let objectTransform = this.calcTransformMatrix();
    
      // 解析 options，优先使用 options 的值，否则 fallback 到实例上的属性
      const showBorders = typeof (options = options || {}).hasBorders !== 'undefined'
        ? options.hasBorders
        : this.hasBorders;
    
      const showControls = typeof options.hasControls !== 'undefined'
        ? options.hasControls
        : this.hasControls;
    
      // 组合整体变换矩阵（画布变换 + 对象变换）
      objectTransform = fabric.util.multiplyTransformMatrices(viewportTransform, objectTransform);
    
      // 获取矩阵分解结果（旋转角度、缩放、偏移等）
      const decomposed = fabric.util.qrDecompose(objectTransform);
    
      ctx.save();
      ctx.translate(decomposed.translateX, decomposed.translateY);
    
      // 设置边框宽度
      ctx.lineWidth = 1 * this.borderScaleFactor;
    
      // 如果当前对象没有组，就设置透明度（移动时降低透明度）
      if (!this.group) {
        ctx.globalAlpha = this.isMoving ? this.borderOpacityWhenMoving : 1;
      }
    
      
      // 如果是多选场景（ActiveSelection）
      if (options.forActiveSelection) {
        ctx.rotate(n(decomposed.angle));
    
        // 如果不是 ELEMENT_GROUP 类型的组，则绘制边框
        if (!this.group || this.group.type !== 'elementGroup') {
          showBorders && this.drawBordersInGroup(ctx, decomposed, options);
        }
    
        // 绘制控制点
        showControls && this.drawControlsInGroup(ctx, decomposed, options);
      } else {
        // 普通对象旋转并绘制
        ctx.rotate(n(this.angle));
        showBorders && this.drawBorders(ctx, options);
        showControls && this.drawControls(ctx, options);
      }
    
      ctx.restore();
    },    
    drawControlsInGroup: function (ctx, transform, options) {
      
      options = options || {};
    
      // 获取未变换时的宽高（对象尺寸）
      const rawDimensions = this._getNonTransformedDimensions();
    
      // 组合矩阵：根据当前变换设置缩放与扭曲
      const composedMatrix = fabric.util.composeMatrix({
        scaleX: transform.scaleX,
        scaleY: transform.scaleY,
        skewX: transform.skewX,
      });
    
      // 计算变换后的宽高
      const transformedSize = fabric.util.transformPoint(rawDimensions, composedMatrix);
      const width = transformedSize.x;
      const height = transformedSize.y;
    
      const cornerSize = options.cornerSize || this.cornerSize;
    
      // 控制点起始坐标
      const startX = -(width + cornerSize) / 2;
      const startY = -(height + cornerSize) / 2;
    
      // 透明角属性与旋转点开关
      const useTransparentCorners = typeof options.transparentCorners !== 'undefined'
        ? options.transparentCorners
        : this.transparentCorners;
    
      const showRotatingPoint = typeof options.hasRotatingPoint !== 'undefined'
        ? options.hasRotatingPoint
        : this.hasRotatingPoint;
    
      // 使用 stroke 还是 fill 来绘制角点
      const drawStyle = useTransparentCorners ? "stroke" : "fill";
    
      ctx.save();
    
      // 设置控制点颜色
      ctx.strokeStyle = ctx.fillStyle = options.cornerColor || this.cornerColor;
    
      if (!useTransparentCorners) {
        ctx.strokeStyle = options.cornerStrokeColor || this.cornerStrokeColor;
      }
    
      // 设置虚线
      this._setLineDash(ctx, options.cornerDashArray || this.cornerDashArray, null);
      
    
      // 四角控制点
      this._drawControl("tl", ctx, drawStyle, startX, startY, options);                      // Top Left
      this._drawControl("tr", ctx, drawStyle, startX + width, startY, options);             // Top Right
      this._drawControl("bl", ctx, drawStyle, startX, startY + height, options);            // Bottom Left
      this._drawControl("br", ctx, drawStyle, startX + width, startY + height, options);    // Bottom Right
    
      // 如果允许非等比缩放，绘制中边控制点
      if (!this.get("lockUniScaling")) {
        this._drawControl("mt", ctx, drawStyle, startX + width / 2, startY, options);          // Middle Top
        this._drawControl("mb", ctx, drawStyle, startX + width / 2, startY + height, options); // Middle Bottom
        this._drawControl("mr", ctx, drawStyle, startX + width, startY + height / 2, options); // Middle Right
        this._drawControl("ml", ctx, drawStyle, startX, startY + height / 2, options);         // Middle Left
      }
    
      // 如果启用旋转控制点，绘制旋转控制点
      if (showRotatingPoint) {
        this._drawControl(
          "mtr",
          ctx,
          drawStyle,
          startX + width / 2,
          startY - this.rotatingPointOffset,
          options
        );
      }
    
      ctx.restore();
    
      return this;
    },    
    getRootScale: function () {
      var e = Math.max(this.scaleX || 1, this.scaleY || 1);
      return this.group && (e *= this.group.getRootScale()), e;
    },
    _fireDataChanged: function (e) {
      this.canvas &&
        this.canvas.trigger(xe.OBJECT_MODIFIED, {
          target: this,
          withoutStep: e,
        });
    },
  });
