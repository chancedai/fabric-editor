import { emitter } from "../../__common__/utils";

// 扩展了 fabric.js 的 Canvas 类，增强了鼠标交互和事件处理系统
(function () {
    function e(e, t) {
      return e.button && e.button === t - 1;
    }
    fabric.util.object.extend(fabric.Canvas.prototype, {
      cursorMap: ["ns-resize", "nesw-resize", "ew-resize", "nwse-resize", "ns-resize", "nesw-resize", "ew-resize", "nwse-resize"],
      copyStyleApplying: false,
      dragImageFromContainer: null,
      preMouseTarget: null,
      isEditMode: false,
      editMode: function (e, t) {
        this.isEditMode = e === "enter";
      },
      __onMouseDown: function (_t4) {
        var a = this;
        if (!this.isEditMode) {
          this._cacheTransformEventData(_t4);
          var n = this._target;
          var i = this.subActiveObject;
          var r = false;
          if (n && (n.clipParent || n.clipChild)) {
            var o = n._findTargetCorner(this.getPointer(_t4, true));
            if (n.clipParent) {
              n = n.isControlVisible(o) ? n : n.clipParent;
            }
            this.setActiveObject(n, _t4);
          } else if (n && n.canModifyChildren && i && i.group === n) {
            var c = i._findTargetCorner(this.getPointer(_t4, true));
            if (i.isControlVisible(c)) {
              this.preMouseTarget = n;
              n = i;
              this.setActiveObject(n, _t4);
              r = true;
            }
          }
          var s = this.targets && this.targets.length && this.targets[0] || n;
          if (function (e) {
            return !!e && (e.isLock || e.group && e.group.isLock || e.group && e.group.group && e.group.group.isLock) && e.type === _f.i.IMAGE_CONTAINER && e.hasSource();
          }(s) && !s._findTargetCorner(this.getPointer(_t4, true))) {
            this.dragImageFromContainer = s;
            emitter.emit('imagecontainer_drag_start', {
              target: s,
              e: _t4
            });
          }
          this._handleEvent(_t4, "down:before");
          this.selectionFullyContained = true;
          this.isMouseDown = true;
          if (_t4.shiftKey && this._activeObject && this._activeObject.type === _f.i.BACKGROUND) {
            this._activeObject = null;
          }
          if (_t4.shiftKey) {
            this.selectionFullyContained = false;
          }
          var l = false;
          if (e(_t4, 3)) {
            if (this.fireRightClick) {
              if (n) {
                this.setActiveObject(n);
              }
              var u = this.targets && this.targets.length > 0 ? this.targets[0] : null;
              emitter.emit('object:selected_by_right_click', {
                e: _t4,
                target: n,
                subTarget: u
              });
              this.requestRenderAll();
              l = true;
            }
          } else if (e(_t4, 2)) {
            if (this.fireMiddleClick) {
              this._handleEvent(_t4, "down", 2);
            }
          } else if (this.isDrawingMode) {
            this._onMouseDownInDrawingMode(_t4);
          } else if (this._isMainEvent(_t4) && !this._currentTransform) {
            if (this._activeObject && this.isCliping && n !== this._activeObject) {
              if (this._activeObject._onDoubleClick) {
                this._activeObject._onDoubleClick();
              } else if (this._activeObject.clipParent && this._activeObject.clipParent._onDoubleClick) {
                this._activeObject.clipParent._onDoubleClick();
              }
            } else {
              if (this._activeObject && n !== this._activeObject && n !== this._activeObject.group && this._activeObject.isEditing) {
                this._activeObject.exitEditing();
              }
              var h = this._pointer;
              this._previousPointer = h;
              var d = this._shouldRender(n);
              var p = this._shouldGroup(_t4, n);
              if (this._shouldClearSelection(_t4, n)) {
                this.discardActiveObject(_t4);
              } else if (p) {
                this._handleGrouping(_t4, n);
                n = this._activeObject;
              }
              if (!l && !!this.selection && !r && (!n || !n.selectable && !n.isEditing && n !== this._activeObject || !!n.canSelection || !!n.isLock)) {
                this._groupSelector = {
                  ex: h.x,
                  ey: h.y,
                  top: 0,
                  left: 0
                };
              }
              if (n) {
                var g = n === this._activeObject;
                if (n.selectable && !n.canSelection) {
                  this.setActiveObject(n, _t4);
                  (n._objects || []).sort(function (e, t) {
                    return a._objects.indexOf(e) - a._objects.indexOf(t);
                  });
                }
                if ((n === this._activeObject || !!this._activeObject && n === this._activeObject.group) && (!!n.__corner || !p)) {
                  if (!l) {
                    this._setupCurrentTransform(_t4, n, g);
                  }
                }
              }
              this._handleEvent(_t4, "down");
              if (d || p) {
                this.requestRenderAll();
              }
            }
          }
        }
      },
      __onMouseUp: function (_t5) {
        if (!this.isEditMode) {
          var a;
          var n = this._currentTransform;
          var i = this._groupSelector;
          var r = false;
          var o = !i || i.left === 0 && i.top === 0;
          this._cacheTransformEventData(_t5);
          a = this._target;
          if (this.dragImageFromContainer) {
            emitter.emit('imagecontainer_drag_end', {
              target: this.dragImageFromContainer,
              e: _t5
            });
            this.dragImageFromContainer = null;
          }
          if (this.isMouseDown && this.preMouseTarget && a && a.group && a.group.canModifyChildren) {
            this.targets.unshift(a);
            a = this.preMouseTarget;
            this.setActiveObject(this.preMouseTarget, null);
            this.preMouseTarget = null;
          }
          this.isMouseDown = false;
          this._handleEvent(_t5, "up:before");
          if (e(_t5, 3)) {
            if (this.fireRightClick) {
              this._handleEvent(_t5, "up", 3, o);
            }
          } else {
            if (e(_t5, 2)) {
              if (this.fireMiddleClick) {
                this._handleEvent(_t5, "up", 2, o);
              }
              this._resetTransformEventData();
              return;
            }
            if (this.isDrawingMode && this._isCurrentlyDrawing) {
              this._onMouseUpInDrawingMode(_t5);
            } else if (this._isMainEvent(_t5)) {
              if (n) {
                this._finalizeCurrentTransform(_t5);
                r = n.actionPerformed;
              }
              if (o) {
                if (a && a.selectable && a.canSelection) {
                  this.setActiveObject(a, null);
                }
              } else {
                this._maybeGroupObjects(_t5);
                r ||= this._shouldRender(a);
              }
              if (a) {
                if (n && n.action === "drag") {
                  var c = this._target;
                  var s = {
                    e: _t5,
                    target: c,
                    subTargets: this.targets || [],
                    button: 1,
                    isClick: false,
                    pointer: this._pointer,
                    absolutePointer: this._absolutePointer,
                    transform: this._currentTransform
                  };
                  this.fire("mouse:end_drag", s);
                  c.borderDashArray = [3, 0];
                }
                a.isMoving = false;
              }
              this._setCursorFromEvent(_t5, a);
              this._handleEvent(_t5, "up", 1, o);
              this._groupSelector = null;
              this._currentTransform = null;
              if (a) {
                a.__corner = 0;
              }
              if (a && a.isEditing) {
                this.setCursor(a.hoverCursor);
              }
              if (r) {
                this.requestRenderAll();
              } else if (!o) {
                this.renderTop();
              }
            }
          }
        }
      },
      fireSyntheticInOutEvents: function (e, t, a) {
        var n;
        var i;
        var r;
        var o = a.targetName + "_subTargets";
        var c = this[a.targetName];
        var s = this[o];
        var l = c !== e;
        var u = a.canvasEvtIn;
        var h = a.canvasEvtOut;
        if (!l) {
          var d = null;
          if (s && s.length > 0) {
            d = s[0];
          }
          var p = null;
          if (this.targets && this.targets) {
            p = this.targets[0];
          }
          l = d != p;
        }
        if (l) {
          n = {
            e: t,
            target: e,
            previousTarget: c,
            subTargets: this.targets,
            preSubTargets: s
          };
          i = {
            e: t,
            target: c,
            nextTarget: e,
            subTargets: s,
            nextSubTargets: this.targets
          };
          this[a.targetName] = e;
          this[o] = this.targets;
        }
        r = e && l;
        if (c && l) {
          if (h) {
            this.fire(h, i);
          }
          c.fire(a.evtOut, i);
        }
        if (r) {
          if (u) {
            this.fire(u, n);
          }
          e.fire(a.evtIn, n);
        }
      },
      setCursor: function (e) {
        if (this.copyStyleApplying) {
          e = this.defaultCursor;
        }
        if (this.spaceKey && !this.isMouseDown) {
          e = "grab";
        }
        if (this.spaceKey && this.isMouseDown) {
          e = "grabbing";
        }
        if (this.upperCanvasEl.style.cursor !== e) {
          this.upperCanvasEl.style.cursor = e;
        }
      },
      getCornerCursor: function (e, t, a) {
        if (this.actionIsDisabled(e, t, a)) {
          return this.notAllowedCursor;
        } else if (e in {
          mt: 0,
          tr: 1,
          mr: 2,
          br: 3,
          mb: 4,
          bl: 5,
          ml: 6,
          tl: 7
        }) {
          return this._getRotatedCornerCursor(e, t, a);
        } else if (e === "mtr" && t.hasRotatingPoint) {
          return this.rotationCursor;
        } else if (e === "mbm") {
          return this.moveCursor;
        } else {
          return this.defaultCursor;
        }
      },
      actionIsDisabled: function (e, t, n) {
        if (e === "mt" || e === "mb") {
          if (n[this.altActionKey]) {
            return t.lockSkewingX;
          } else {
            return t.lockScalingY;
          }
        } else if (e === "ml" || e === "mr") {
          if (n[this.altActionKey]) {
            return t.lockSkewingY;
          } else {
            return t.lockScalingX;
          }
        } else if (e === "mtr") {
          return t.lockRotation;
        } else if (this._isUniscalePossible(n, t)) {
          return t.lockScalingX && t.lockScalingY;
        } else {
          return t.lockScalingX || t.lockScalingY;
        }
      },
      _getActionFromCorner: function (e, t, a) {
        if (!t || !e) {
          return "drag";
        }
        switch (t) {
          case "mtr":
            return "rotate";
          case "ml":
          case "mr":
            if (a[this.altActionKey]) {
              return "skewY";
            } else {
              return "scaleX";
            }
          case "mt":
          case "mb":
            if (a[this.altActionKey]) {
              return "skewX";
            } else {
              return "scaleY";
            }
          case "mbm":
            return "drag";
          default:
            return "scale";
        }
        return false;
      },
      spaceKey: false,
      _transformObject: function (e) {
        var t = this.getPointer(e);
        var a = this._currentTransform;
        a.reset = false;
        this._currentTransform.skewX = 0;
        this._currentTransform.skewY = 0;
        if (a.action === "drag" && !Boolean(a.target.isMoving)) {
          var n = this._target;
          var i = {
            e: e,
            target: n,
            subTargets: this.targets || [],
            button: 1,
            isClick: false,
            pointer: this._pointer,
            absolutePointer: this._absolutePointer,
            transform: this._currentTransform
          };
          this.fire("mouse:start_drag", i);
          n.borderDashArray = [3, 3];
        }
        a.target.isMoving = true;
        a.shiftKey = e.shiftKey;
        a.altKey = e[this.centeredKey];
        this._beforeScaleTransform(e, a);
        this._performTransformAction(e, a, t);
        if (a.actionPerformed) {
          this.requestRenderAll();
        }
      },
      __onMouseMove: function (e) {
        if (!this.isEditMode) {
          var _t6;
          var a = this.findTarget(e);
          if (this.isMouseDown && a && (a.clipParent || a.clipChild)) {
            var n = a.clipParent || a;
            var i = a.clipChild || a;
            var r = n._findTargetCorner(this.getPointer(e, true));
            var o = i._findTargetCorner(this.getPointer(e, true));
            var c = e.movementX;
            var s = e.movementY;
            if (r && r === o) {
              var l = false;
              switch (r) {
                case "tl":
                  l = c >= 0 && s >= 0;
                  break;
                case "tr":
                  l = c <= 0 && s >= 0;
                  break;
                case "bl":
                  l = c >= 0 && s <= 0;
                  break;
                case "br":
                  l = c <= 0 && s <= 0;
              }
              a = l ? i : n;
              this.setActiveObject(a, e);
              this._setupCurrentTransform(e, a, a === this._activeObject);
            }
          }
          if (this.dragImageFromContainer) {
            emitter.emit('imagecontainer_dragging', {
              target: this.dragImageFromContainer,
              e: e
            });
          } else {
            this._handleEvent(e, "move:before");
            this._cacheTransformEventData(e);
            if (this.isDrawingMode) {
              this._onMouseMoveInDrawingMode(e);
            } else if (this._isMainEvent(e)) {
              var u = this._groupSelector;
              if (u) {
                _t6 = this._pointer;
                u.left = _t6.x - u.ex;
                u.top = _t6.y - u.ey;
                this.renderTop();
              } else if (this._currentTransform) {
                this._transformObject(e);
              } else {
                a = this.findTarget(e) || null;
                this._setCursorFromEvent(e, a);
                this._fireOverOutEvents(a, e);
              }
              this._handleEvent(e, "move");
              this._resetTransformEventData();
            }
          }
        }
      },
      _checkTarget: function (e, t, a, n) {
        n = n || {};
        if (t && t.visible && t.evented && this.containsPoint(null, t, e)) {
          if (!this.perPixelTargetFind && !t.perPixelTargetFind || t.isEditing || this.isMouseDown || n.skipPixelFind) {
            return true;
          }
          if (!this.isTargetTransparent(t, a.x, a.y)) {
            return true;
          }
        }
      }
    });
  })();