import { fabric } from 'fabric';


// fabric.Shapeimagegroup = fabric.util.createClass(fabric.Group, {
//     type: "shapeimagegroup",
// });

// var xt;
// (function (e) {
//   e.HORIZONTAL = "horizontal";
//   e.VERTICAL = "vertical";
// })(xt ||= {});
// var Rt = function (e) {
//   function t(e, a, n) {
//     var c;
//     Object(_i.a)(this, t);
//     (c = Object(_r.a)(this, Object(_o.a)(t).call(this, Nt(e) || [], a, n))).stateProperties = _s.fabric.Group.prototype.stateProperties.concat(t.needInitFields);
//     c.viewBoxWidth = undefined;
//     c.viewBoxHeight = undefined;
//     c.spacing = 10;
//     c.margin = 0;
//     c.radius = 0;
//     c.changeSizeWhenScaleXY = true;
//     c.slotObjects = [];
//     c.slotSvgUrl = undefined;
//     c.isScaleEqually = false;
//     c.noScaleCache = false;
//     c.canModifyChildren = true;
//     c.drawChildrenBorders = true;
//     c.noHoverBorder = true;
//     c.noOutBorder = true;
//     c.reObjectsPosition = function () {
//       var e;
//       var t = c.width;
//       var a = c.height;
//       var n = c.margin;
//       var i = c.spacing;
//       var r = i * 0.5;
//       for (var o = 0; o < c._objects.length; o++) {
//         var l = c._objects[o];
//         var u = c.slotObjects[o];
//         var h = u.width;
//         var d = u.height;
//         if ((e = u) && e.hasOwnProperty("width") && e.hasOwnProperty("height") && !e.hasOwnProperty("path")) {
//           e.hasOwnProperty("points");
//         }
//         var p = h * t - i;
//         var g = d * a - i;
//         l.left = u.left * t + r;
//         l.top = u.top * a + r;
//         var f = new _s.fabric.Point(l.left + p * 0.5, l.top + g * 0.5);
//         var m = p + i * h;
//         var v = g + i * d;
//         if (l.scaleX && l.scaleX !== 1) {
//           m /= l.scaleX;
//         }
//         if (l.scaleY && l.scaleY !== 1) {
//           v /= l.scaleY;
//         }
//         l.updateSize({
//           width: m,
//           height: v
//         });
//         var b = [1 + i / t, 0, 0, 1 + i / a, 0, 0];
//         var _ = _s.fabric.util.transformPoint(f, b);
//         l.setPositionByOrigin(_, "center", "center");
//         l.left += n - n * 2 * (u.left + 0.5);
//         l.top += n - n * 2 * (u.top + 0.5);
//         m -= n * 2 * h;
//         v -= n * 2 * d;
//         l.updateSize({
//           width: m,
//           height: v
//         });
//         if (l.group) {
//           l.setCoords(true, false);
//         } else {
//           l.setCoords();
//         }
//         l.dirty = true;
//       }
//       c.dirty = true;
//     };
//     c._scaling = function (e) {
//       c.isScaleEqually = e.transform.action === "scale";
//     };
//     c.shouldCache = function () {
//       var e;
//       var t;
//       var a;
//       var n;
//       var i;
//       var r;
//       var o = "";
//       return function () {
//         if (_s.fabric.isLikelyNode) {
//           return true;
//         }
//         var l = c._objects.map(function (e) {
//           return e.opacity;
//         }).join("");
//         return e === c.width && t === c.height && a === c.spacing && r === c.margin && n === c.scaleX && i === c.scaleY && o === l || (e = c.width, t = c.height, a = c.spacing, r = c.margin, n = c.scaleX, i = c.scaleY, o = l, c.reObjectsPosition(), true);
//       };
//     }();
//     c.minScaleWH = 64;
//     c.set = function (e, a) {
//       if (e instanceof Object) {
//         for (var n in e) {
//           c.set(n, e[n]);
//         }
//       } else if (e === "radius") {
//         c.radius = a;
//         c.setRadius();
//         c._fireDataChanged(true);
//       } else if (e === "spacing") {
//         c.spacing = a;
//         c._fireDataChanged(true);
//       } else if (e === "margin") {
//         c.margin = a;
//         c._fireDataChanged(true);
//       } else if (e === "scaleX") {
//         if (!c.childrenTooSmall(c.isScaleEqually ? "" : "width") || a > c[e]) {
//           if (c.isShiftKey()) {
//             Object(me.a)(Object(_o.a)(t.prototype), "set", Object(fe.a)(c)).call(Object(fe.a)(c), "width", c.width * a / c[e]);
//           } else {
//             Object(me.a)(Object(_o.a)(t.prototype), "set", Object(fe.a)(c)).call(Object(fe.a)(c), e, a);
//           }
//         }
//       } else if (e === "scaleY") {
//         if (!c.childrenTooSmall(c.isScaleEqually ? "" : "height") || a > c[e]) {
//           if (c.isShiftKey()) {
//             Object(me.a)(Object(_o.a)(t.prototype), "set", Object(fe.a)(c)).call(Object(fe.a)(c), "height", c.height * a / c[e]);
//           } else {
//             Object(me.a)(Object(_o.a)(t.prototype), "set", Object(fe.a)(c)).call(Object(fe.a)(c), e, a);
//           }
//         }
//       } else if (e === "width") {
//         if (!c.childrenTooSmall("width") || a > c[e]) {
//           Object(me.a)(Object(_o.a)(t.prototype), "set", Object(fe.a)(c)).call(Object(fe.a)(c), e, a);
//         }
//       } else if (e === "height") {
//         if (!c.childrenTooSmall("height") || a > c[e]) {
//           Object(me.a)(Object(_o.a)(t.prototype), "set", Object(fe.a)(c)).call(Object(fe.a)(c), e, a);
//         }
//       } else {
//         Object(me.a)(Object(_o.a)(t.prototype), "set", Object(fe.a)(c)).call(Object(fe.a)(c), e, a);
//       }
//       return Object(fe.a)(c);
//     };
//     c.childrenTooSmall = function (e) {
//       if (e === "width") {
//         return c._objects.some(function (e) {
//           return e.getScaledWidth() < 10;
//         });
//       } else if (e === "height") {
//         return c._objects.some(function (e) {
//           return e.getScaledHeight() < 10;
//         });
//       } else {
//         return c._objects.some(function (e) {
//           return e.getScaledWidth() < 10 || e.getScaledHeight() < 10;
//         });
//       }
//     };
//     Object.assign(Object(fe.a)(c), {
//       type: _f.i.IMAGE_CONTAINER_GROUP,
//       subTargetCheck: true
//     });
//     c._initFields(a);
//     c.on("scaling", c._scaling);
//     return c;
//   }
//   Object(c.a)(t, e);
//   Object(ge.a)(t, [{
//     key: "_initFields",
//     value: function (e) {
//       var t = this;
//       if (e) {
//         if (e.hasOwnProperty("viewBoxWidth")) {
//           this.viewBoxWidth = e.viewBoxWidth;
//         }
//         if (e.hasOwnProperty("viewBoxHeight")) {
//           this.viewBoxHeight = e.viewBoxHeight;
//         }
//         if (e.hasOwnProperty("spacing")) {
//           this.spacing = e.spacing;
//         }
//         if (e.hasOwnProperty("margin")) {
//           this.margin = e.margin;
//         }
//         if (e.hasOwnProperty("radius")) {
//           this.radius = e.radius;
//         }
//         if (e.hasOwnProperty("slotObjects")) {
//           this.slotObjects = e.slotObjects;
//           Nt(this.slotObjects);
//           this.forEachObject(function (e, a) {
//             e.slotObject = t.slotObjects[a];
//           });
//         }
//       }
//     }
//   }, {
//     key: "init",
//     value: function () {
//       var e = Object(pe.a)(de.mark(function e(t) {
//         var a = this;
//         return de.wrap(function (e) {
//           while (true) {
//             switch (e.prev = e.next) {
//               case 0:
//                 this.slotSvgUrl = t;
//                 return e.abrupt("return", new Promise(function () {
//                   var e = Object(pe.a)(de.mark(function e(n, i) {
//                     return de.wrap(function (e) {
//                       while (true) {
//                         switch (e.prev = e.next) {
//                           case 0:
//                             _H(t, function (e, t) {
//                               var i = [];
//                               e.map(function (e) {
//                                 var n = e.width;
//                                 var r = e.height;
//                                 var o = e.left;
//                                 var c = e.top;
//                                 var s = e.originX;
//                                 var l = e.originY;
//                                 var u = new B({
//                                   width: n,
//                                   height: r,
//                                   left: o,
//                                   top: c,
//                                   originX: s,
//                                   originY: l
//                                 });
//                                 u.width = u.width / t.viewBoxWidth;
//                                 u.height = u.height / t.viewBoxHeight;
//                                 u.left = u.left / t.viewBoxWidth - 0.5;
//                                 u.top = u.top / t.viewBoxHeight - 0.5;
//                                 a.slotObjects.push(u);
//                                 var h = new Lt("", undefined, {
//                                   left: o,
//                                   top: c,
//                                   width: n,
//                                   height: r,
//                                   originX: s,
//                                   originY: l,
//                                   clipShape: e,
//                                   isFromContainerGroup: true
//                                 });
//                                 h.slotObject = u;
//                                 i.push(h);
//                               });
//                               a.initialize(i, t);
//                               n(a);
//                             });
//                           case 1:
//                           case "end":
//                             return e.stop();
//                         }
//                       }
//                     }, e);
//                   }));
//                   return function (t, a) {
//                     return e.apply(this, arguments);
//                   };
//                 }()));
//               case 2:
//               case "end":
//                 return e.stop();
//             }
//           }
//         }, e, this);
//       }));
//       return function (t) {
//         return e.apply(this, arguments);
//       };
//     }()
//   }, {
//     key: "setRadius",
//     value: function () {
//       var e = this;
//       this.getObjects().map(function (t) {
//         var a;
//         if ((a = t.clipShape) && a.hasOwnProperty("width") && a.hasOwnProperty("height") && !a.hasOwnProperty("path") && !a.hasOwnProperty("points")) {
//           t.clipShape.rx = t.clipShape.ry = e.radius;
//           t.clipShape.dirty = true;
//           t.dirty = true;
//         }
//       });
//       this.dirty = true;
//     }
//   }, {
//     key: "isShiftKey",
//     value: function () {
//       return this.canvas && !this.canvas.shiftKey;
//     }
//   }, {
//     key: "hasSource",
//     value: function () {
//       return !!this.getObjects().filter(function (e) {
//         return e.hasSource();
//       }).length;
//     }
//   }, {
//     key: "getNeedClearChild",
//     value: function () {
//       var e = this.getObjects().filter(function (e) {
//         return e.hasSource();
//       });
//       if (e.length) {
//         return e.sort(function (e, t) {
//           return e.addImagTimeStamp - t.addImagTimeStamp;
//         })[0];
//       } else {
//         return null;
//       }
//     }
//   }, {
//     key: "onDelete",
//     value: function (e) {
//       if (e) {
//         e.type;
//         this.type;
//       }
//       return false;
//     }
//   }, {
//     key: "isValidResolution",
//     value: function (e) {
//       var t = [];
//       this.getObjects().map(function (a) {
//         if (a instanceof v && !a.isValidResolution(e)) {
//           var n = {
//             id: a.objectId,
//             src: a.getSrc(),
//             width: a.getScaledWidth(),
//             height: a.getScaledHeight()
//           };
//           t.push(n);
//         }
//       });
//       return t;
//     }
//   }, {
//     key: "remove",
//     value: function () {
//       var e;
//       var t = this._objects;
//       var a = false;
//       for (var n = 0, i = arguments.length; n < i; n++) {
//         if ((e = t.indexOf(n < 0 || arguments.length <= n ? undefined : arguments[n])) !== -1) {
//           a = true;
//           t.splice(e, 1);
//           this.slotObjects.splice(e, 1);
//         }
//       }
//       if (this.renderOnAddRemove && a) {
//         this.requestRenderAll();
//       }
//       return this;
//     }
//   }, {
//     key: "deletCell",
//     value: function (e) {
//       var t = this;
//       var a = e.subTarget;
//       var n = e.direction;
//       n = n || xt.HORIZONTAL;
//       a = a || this.canvas && this.canvas.subActiveObject;
//       var i = this.getBounds(a.slotObject);
//       var r = this.findNearbyCell({
//         currentTarget: a,
//         direction: xt.HORIZONTAL,
//         findDirection: -1,
//         justAround: true
//       });
//       var o = this.findNearbyCell({
//         currentTarget: a,
//         direction: xt.VERTICAL,
//         findDirection: -1,
//         justAround: true
//       });
//       this.remove(a);
//       function c(e, a, n) {
//         var r = [];
//         var o = new Map();
//         var c = e.reduce(function (e, n) {
//           var i = t.getBounds(n.slotObject);
//           var c = i[a];
//           r.push(i);
//           if (!o.has(i.position) || c > o.get(i.position)) {
//             o.set(i.position, c);
//             return e + c;
//           } else {
//             return e;
//           }
//         }, 0);
//         e.forEach(function (e) {
//           var r = t.getBounds(e.slotObject);
//           var s = i[a] * o.get(r.position) / c;
//           e.slotObject[a] += s;
//           if (e.slotObject.position === n) {
//             if (n === "right") {
//               e.slotObject.left -= s;
//             }
//             if (n === "bottom") {
//               e.slotObject.top -= s;
//             }
//           }
//         });
//       }
//       if (r.length) {
//         c(r, "width", "right");
//       } else if (o.length) {
//         c(o, "height", "bottom");
//       }
//       this.canvas.targets.shift();
//       this.canvas.setActiveObject(this);
//       this.canvas.requestRenderAll();
//     }
//   }, {
//     key: "updateSlotSize",
//     value: function (e) {
//       var _t1 = e.target;
//       var a = e.multiply;
//       var n = e.by;
//       var i = e.corner;
//       var r = n === "x" ? xt.HORIZONTAL : xt.VERTICAL;
//       var o = this.getPositionByCorner(i);
//       var c = this.findNearbyCell({
//         currentTarget: _t1,
//         direction: r,
//         position: o,
//         findDirection: 1
//       });
//       var s = this.findNearbyCell({
//         currentTarget: _t1,
//         direction: r,
//         position: o,
//         findDirection: -1
//       });
//       var l = this._objects;
//       var u = this.spacing;
//       var h = this.spacing;
//       var d = n === "x" ? this.width : this.height;
//       var p = r === xt.HORIZONTAL ? "width" : "height";
//       var _g3 = _t1[p] * a;
//       var m = Infinity;
//       var v = Infinity;
//       var b = true;
//       var _ = false;
//       var A = undefined;
//       try {
//         for (var y, E = l[Symbol.iterator](); !(b = (y = E.next()).done); b = true) {
//           var C = y.value;
//           var O = C === _t1 || c.includes(C);
//           var k = s.includes(C);
//           if (O) {
//             v = Math.min(C.slotObject[p] - 0.05, v);
//           } else if (k) {
//             m = Math.min(C.slotObject[p] - 0.05, m);
//           }
//         }
//       } catch (G) {
//         _ = true;
//         A = G;
//       } finally {
//         try {
//           if (!b && E.return != null) {
//             E.return();
//           }
//         } finally {
//           if (_) {
//             throw A;
//           }
//         }
//       }
//       var w = _t1.slotObject[p];
//       var I = w + m;
//       var S = w - v;
//       var j = (_g3 + u + h * 2 * w) / (d + u - h * 2);
//       if (j <= S) {
//         j = S;
//       } else if (j >= I) {
//         j = I;
//       }
//       var T = j - w;
//       var x = true;
//       var L = false;
//       var P = undefined;
//       try {
//         for (var D, N = l[Symbol.iterator](); !(x = (D = N.next()).done); x = true) {
//           var R = D.value;
//           var F = R === _t1 || c.includes(R);
//           var M = s.includes(R);
//           var B = R.slotObject[p];
//           var U = undefined;
//           if ((F || M) && (F ? (R.slotObject[p] += T, U = r === xt.HORIZONTAL ? "left" : "top") : M && (R.slotObject[p] -= T, U = r === xt.HORIZONTAL ? "right" : "bottom"), o === U)) {
//             var V = r === xt.HORIZONTAL ? "left" : "top";
//             R.slotObject[V] -= R.slotObject[p] - B;
//           }
//         }
//       } catch (G) {
//         L = true;
//         P = G;
//       } finally {
//         try {
//           if (!x && N.return != null) {
//             N.return();
//           }
//         } finally {
//           if (L) {
//             throw P;
//           }
//         }
//       }
//       t.getInstance().dispatchEvent(g.MONITOR_GUIDE_CLOSE, _f.g.GUIDE_CLIP_COLLAGE);
//       this.reObjectsPosition();
//     }
//   }, {
//     key: "getPositionByCorner",
//     value: function (e) {
//       return {
//         ml: "left",
//         mr: "right",
//         mt: "top",
//         mb: "bottom"
//       }[e];
//     }
//   }, {
//     key: "getNearbyCorner",
//     value: function (e) {
//       return {
//         ml: this.findNearbyCell({
//           currentTarget: e,
//           direction: xt.HORIZONTAL,
//           position: "left",
//           findDirection: -1
//         }).length > 0,
//         mr: this.findNearbyCell({
//           currentTarget: e,
//           direction: xt.HORIZONTAL,
//           position: "right",
//           findDirection: -1
//         }).length > 0,
//         mt: this.findNearbyCell({
//           currentTarget: e,
//           direction: xt.HORIZONTAL,
//           position: "top",
//           findDirection: -1
//         }).length > 0,
//         mb: this.findNearbyCell({
//           currentTarget: e,
//           direction: xt.HORIZONTAL,
//           position: "bottom",
//           findDirection: -1
//         }).length > 0
//       };
//     }
//   }, {
//     key: "findNearbyCell",
//     value: function (e) {
//       var t = this;
//       var a = e.currentTarget;
//       var n = e.direction;
//       var i = e.position;
//       var r = e.findDirection;
//       var o = e.justAround;
//       var c = this._objects;
//       var s = [];
//       var l = this.getBounds(a.slotObject);
//       var u = true;
//       var h = false;
//       var d = undefined;
//       try {
//         for (var p, g = function () {
//             var e = p.value;
//             var a = t.getBounds(e.slotObject);
//             if (l === a) {
//               return "continue";
//             }
//             var c = [n];
//             if (!n) {
//               c = [xt.HORIZONTAL, xt.VERTICAL];
//             }
//             c.forEach(function (n) {
//               if (t.isEqualByDeriction({
//                 currentSlot: l,
//                 compareSlot: a,
//                 direction: n,
//                 position: i,
//                 findDirection: r,
//                 justAround: o
//               })) {
//                 s.push(e);
//               }
//             });
//           }, f = c[Symbol.iterator](); !(u = (p = f.next()).done); u = true) {
//           g();
//         }
//       } catch (m) {
//         h = true;
//         d = m;
//       } finally {
//         try {
//           if (!u && f.return != null) {
//             f.return();
//           }
//         } finally {
//           if (h) {
//             throw d;
//           }
//         }
//       }
//       return s;
//     }
//   }, {
//     key: "isEqualByDeriction",
//     value: function (e) {
//       var t = e.currentSlot;
//       var a = e.compareSlot;
//       var n = e.direction;
//       var i = e.position;
//       var r = e.findDirection;
//       var o = e.justAround;
//       var c = this.getRevertPosition;
//       if (i) {
//         var s = false;
//         var l = true;
//         if (r < 0) {
//           if (s = Math.abs(t[i] * 1000 - a[c(i)] * 1000) < 3) {
//             a.position = i;
//           }
//         } else if (r > 0) {
//           if (s = Math.abs(t[i] * 1000 - a[i] * 1000) < 3) {
//             a.position = c(i);
//           }
//         } else {
//           s = Math.abs(t[i] * 1000 - a[i] * 1000) < 3 || Math.abs(t[i] * 1000 - a[c(i)] * 1000) < 3;
//         }
//         if (o) {
//           var u = n === xt.HORIZONTAL ? "top" : "left";
//           var h = t[u] * 1000 - 3;
//           var d = t[c(u)] * 1000 + 3;
//           l = a[u] * 1000 >= h && a[c(u)] * 1000 <= d;
//         }
//         return s && l;
//       }
//       if (n === xt.HORIZONTAL) {
//         return this.isEqualByDeriction(Dt({}, e, {
//           position: "left"
//         })) || this.isEqualByDeriction(Dt({}, e, {
//           position: "right"
//         }));
//       } else {
//         return this.isEqualByDeriction(Dt({}, e, {
//           position: "top"
//         })) || this.isEqualByDeriction(Dt({}, e, {
//           position: "bottom"
//         }));
//       }
//     }
//   }, {
//     key: "getRevertPosition",
//     value: function (e) {
//       switch (e) {
//         case "left":
//           return "right";
//         case "right":
//           return "left";
//         case "top":
//           return "bottom";
//         case "bottom":
//           return "top";
//         default:
//           return "";
//       }
//     }
//   }, {
//     key: "getBounds",
//     value: function (e) {
//       var t = e.left;
//       var a = e.top;
//       var n = e.width;
//       var i = e.height;
//       e.right = t + n;
//       e.bottom = a + i;
//       return e;
//     }
//   }, {
//     key: "toObject",
//     value: function (e, a) {
//       var n = this;
//       var i = t.needInitFields.concat(e);
//       var r = Object(me.a)(Object(_o.a)(t.prototype), "toObject", this).call(this, i, a);
//       var c = this.slotObjects.map(function (t) {
//         var i = t.includeDefaultValues;
//         t.includeDefaultValues = n.includeDefaultValues;
//         var r = t.toObject ? t.toObject(e, a) : ib(t);
//         t.includeDefaultValues = i;
//         return r;
//       });
//       r.slotObjects = c;
//       return r;
//     }
//   }, {
//     key: "toDataURL",
//     value: function (e) {
//       var a;
//       var n = [];
//       if (e && e.clearContent) {
//         this.forEachObject(function (e, t) {
//           var a = e.clearImage(e);
//           e = a.target;
//           n.push(a.originProps);
//         });
//       }
//       a = Object(me.a)(Object(_o.a)(t.prototype), "toDataURL", this).call(this, e);
//       var i = this.canvas;
//       this.getObjects().map(function (e) {
//         e.set("canvas", i);
//       });
//       if (e && e.clearContent) {
//         this.forEachObject(function (e, t) {
//           var a = n[t];
//           for (var i in a) {
//             e[i] = a[i];
//           }
//           e.dirty = true;
//         });
//         this.dirty = true;
//       }
//       return a;
//     }
//   }, {
//     key: "_fireDataChanged",
//     value: function (e) {
//       Object(me.a)(Object(_o.a)(t.prototype), "_fireDataChanged", this).call(this, e);
//     }
//   }]);
//   return t;
// }(_s.fabric.Group);



// 依赖的外部变量和方法：
//   fabric               - Fabric.js 主库
//   fabric.Group         - Fabric.js 的 Group 基类
//   fabric.util.createClass  - Fabric.js 的创建类工具
//   fabric.util.enlivenObjects - 反序列化对象列表的工具
//   fabric.Image         - 用于在 Fabric 画布上显示图像的类
//   fabric.Point         - 表示二维坐标点的类
//   HORIZONTAL, VERTICAL - 布局方向常量
//   loadAndPrepareSvg         - 自定义的从 SVG 读取切槽数据函数（需实现）
//   SlotBox              - 自定义的切槽描述对象类（需实现）
/**
 * 自定义支持圆角的矩形类，继承自 fabric.Rect。
 */
export class RoundedRectangle extends fabric.Rect {
  constructor(options = {}) {
    super(options);

    // 启用在缩放时改变尺寸
    this.changeSizeWhenScaleXY = true;

    // 是否禁用缓存缩放图像
    this.noScaleCache = false;

    // 是否在内部使用圆角
    this.roundInside = options.roundInside || false;

    // 剪裁父元素
    this.clipParent = undefined;
  }

  /**
   * 自定义渲染函数，支持圆角绘制（支持 roundInside 控制）
   * @param {CanvasRenderingContext2D} ctx 
   * @param {boolean} useAbsoluteCoords 
   * @param {boolean} skipFill 
   */
  _render(ctx, useAbsoluteCoords = false, skipFill = false) {
    if (this.width !== 1 || this.height !== 1) {
      const radiusX = this.rx ? Math.min(this.rx, this.width / 2) : 0;
      const radiusY = this.ry ? Math.min(this.ry, this.height / 2) : 0;
      const w = this.width;
      const h = this.height;
      const left = useAbsoluteCoords ? this.left : -w / 2;
      const top = useAbsoluteCoords ? this.top : -h / 2;
      const useRoundedCorners = radiusX !== 0 || radiusY !== 0;
      const bezier = 0.4477152502;

      ctx.beginPath();
      ctx.moveTo(left + radiusX, top);
      ctx.lineTo(left + w - radiusX, top);

      if (this.roundInside && useRoundedCorners) {
        ctx.bezierCurveTo(left + w - radiusX, top + bezier * radiusY, left + w - bezier * radiusX, top + radiusY, left + w, top + radiusY);
      } else if (useRoundedCorners) {
        ctx.bezierCurveTo(left + w - bezier * radiusX, top, left + w, top + bezier * radiusY, left + w, top + radiusY);
      }

      ctx.lineTo(left + w, top + h - radiusY);

      if (this.roundInside && useRoundedCorners) {
        ctx.bezierCurveTo(left + w - bezier * radiusX, top + h - radiusY, left + w - radiusX, top + h - bezier * radiusY, left + w - radiusX, top + h);
      } else if (useRoundedCorners) {
        ctx.bezierCurveTo(left + w, top + h - bezier * radiusY, left + w - bezier * radiusX, top + h, left + w - radiusX, top + h);
      }

      ctx.lineTo(left + radiusX, top + h);

      if (this.roundInside && useRoundedCorners) {
        ctx.bezierCurveTo(left + radiusX, top + h - bezier * radiusY, left + bezier * radiusX, top + h - radiusY, left, top + h - radiusY);
      } else if (useRoundedCorners) {
        ctx.bezierCurveTo(left + bezier * radiusX, top + h, left, top + h - bezier * radiusY, left, top + h - radiusY);
      }

      ctx.lineTo(left, top + radiusY);

      if (this.roundInside && useRoundedCorners) {
        ctx.bezierCurveTo(left + bezier * radiusX, top + radiusY, left + radiusX, top + bezier * radiusY, left + radiusX, top);
      } else if (useRoundedCorners) {
        ctx.bezierCurveTo(left, top + bezier * radiusY, left + bezier * radiusX, top, left + radiusX, top);
      }

      ctx.closePath();

      if (!skipFill) {
        this._renderPaintInOrder(ctx);
      }
    } else {
      ctx.fillRect(-0.5, -0.5, 1, 1);
    }
  }

  /**
   * 转换为对象（用于 JSON 序列化）
   */
  toObject(additionalProps = []) {
    return {
      ...super.toObject([...RoundedRectangle.needInitFields || [], ...additionalProps]),
      roundInside: this.roundInside
    };
  }

  /**
   * 拷贝样式（用于克隆、粘贴等）
   */
  copyStyle() {
    return {
      ...super.copyStyle?.(),
      fill: this.get('fill'),
      stroke: this.get('stroke'),
      strokeWidth: this.get('strokeWidth'),
      strokeDashArray: [...(this.get('strokeDashArray') || [])],
      strokeDashType: this.get('strokeDashType'),
      strokeLineCap: this.get('strokeLineCap'),
      type: 'polygon' // 标记为多边形样式
    };
  }

  /**
   * 粘贴样式（从另一对象继承）
   * @param {Object} sourceStyle 
   */
  pasteStyle(sourceStyle) {
    let newStyle = {};

    switch (sourceStyle.type) {
      case 'polygon':
        newStyle = {
          fill: sourceStyle.fill,
          stroke: sourceStyle.stroke,
          strokeWidth: sourceStyle.strokeWidth,
          strokeDashArray: sourceStyle.strokeDashArray,
          strokeDashType: sourceStyle.strokeDashType,
          strokeLineCap: sourceStyle.strokeLineCap,
          openShadow: sourceStyle.openShadow,
          shadow: sourceStyle.shadow,
          opacity: sourceStyle.opacity
        };
        break;
      case 'svg':
      case 'grid':
        if (sourceStyle.fills?.[0]) {
          newStyle.fill = sourceStyle.fills[0].fill;
        }
        Object.assign(newStyle, {
          openShadow: sourceStyle.openShadow,
          shadow: sourceStyle.shadow,
          opacity: sourceStyle.opacity
        });
        break;
      case 'textbox':
        newStyle.opacity = sourceStyle.opacity;
        break;
      default:
        Object.assign(newStyle, {
          openShadow: sourceStyle.openShadow,
          shadow: sourceStyle.shadow,
          opacity: sourceStyle.opacity
        });
    }

    const center = this.getCenterPoint();
    this.setOptions(newStyle);
    this.setPositionByOrigin(center, 'center', 'center');
  }

  /**
   * 取消选中处理（用于剪裁组内交互）
   */
  onDeselect(event) {
    if (this.clipParent) {
      if (!event || event.object !== this.clipParent) {
        if (this.clipParent.isEditing) {
          this.clipParent.closeClipBounds(false);
        }
      }
    }
    return false;
  }
}

/**
 * 加载远程 SVG 并清理其样式（空 fill 填黑，none 透明），适用于 Fabric.js。
 *
 * @param {string} url - SVG 文件 URL
 * @param {function} onLoad - 加载成功后的回调 (objects, metadata)
 * @param {function} onError - 加载失败的回调
 * @param {object} options - 可选配置项（会自动添加 parentType: "svg"）
 */
function loadAndPrepareSvg(url, onLoad, onError, options = {}) {
  options.parentType = "svg"; // 明确指定类型供内部识别

  // const cleanedUrl = cleanResourceUrl(url);

  fabric.loadSVGFromURL(
    url,
    function (svgObjects, metadata, originalDomElements) {
      if (originalDomElements) {
        originalDomElements.forEach((domElement, index) => {
          const fillValue = domElement.getAttribute("fill");

          // 空 fill：设为黑色并去掉 ID
          if (fillValue === "") {
            svgObjects[index].fill = "#000000";
            delete svgObjects[index].id;
          }

          // fill 为 none：设为透明黑色
          if (fillValue === "none") {
            svgObjects[index].fill = "#000000";
            svgObjects[index].opacity = 0;
          }
        });
      }
      
      onLoad(svgObjects, metadata);
    },
    onError,
    Object.assign({ crossOrigin: "anonymous" }, options)
  );
}

const LayoutDirection = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical'
};

fabric.ShapeImageGroup = fabric.util.createClass(fabric.Group, {
  // type: 'shapeimagegroup',
  type: 'imageContainerGroup',

  // 静态字段：需要从 options 中初始化的属性列表
  statics: {
    needInitFields: ['viewBoxWidth', 'viewBoxHeight', 'spacing', 'margin', 'radius', 'slotObjects']
  },

  /**
   * 构造函数
   * @param {Array} objects  子对象列表
   * @param {Object} options 可选参数，包括 viewBoxWidth/viewBoxHeight/spacing/margin/radius/slotObjects
   */
  initialize: function(objects, options, callback) {
    
    options = options || {};
    // 调用父类构造
    // this.callSuper('initialize', objects || [], options, callback);
    

    // 复制并扩展 stateProperties
    this.stateProperties = fabric.Group.prototype.stateProperties.concat(
      fabric.ShapeImageGroup.needInitFields
    );

    // 默认布局和外观设置
    this.viewBoxWidth = undefined;
    this.viewBoxHeight = undefined;
    this.spacing = 10;    // 子元素之间的间距
    this.margin = 0;      // 容器边缘的边距
    this.radius = 0;      // 圆角半径
    this.changeSizeWhenScaleXY = true;
    this.isScaleEqually = false;
    this.noScaleCache = false;
    this.drawChildrenBorders = true;
    this.noHoverBorder = true;
    this.noOutBorder = true;

    // 槽数据
    this.slotObjects = [];
    this.slotSvgUrl = undefined;

    // 子元素最小缩放阈值
    this.minScaleWH = 64;

    // 从 options 初始化字段
    this._initFields(options);

    // 监听缩放事件，用于判断是否等比缩放
    this.on('scaling', this._onScaling.bind(this));

    if (objects && objects.length > 0) {
      this.callSuper('initialize', objects || [], options, callback);
    }

    this.subTargetCheck = true;
  },

  /**
   * 从 options 中读取初始化字段
   * @param {Object} options
   */
  _initFields: function(options) {
    if (!options) return;
    if ('viewBoxWidth' in options) this.viewBoxWidth = options.viewBoxWidth;
    if ('viewBoxHeight' in options) this.viewBoxHeight = options.viewBoxHeight;
    if ('spacing' in options) this.spacing = options.spacing;
    if ('margin' in options) this.margin = options.margin;
    if ('radius' in options) this.radius = options.radius;
    if (Array.isArray(options.slotObjects)) {
      // 反序列化 slotObjects
      this.slotObjects = fabric.util.enlivenObjects(options.slotObjects);
      this._objects.forEach((obj, idx) => {
        obj.slotObject = this.slotObjects[idx];
      });
    }
  },

  /**
   * 从 SVG URL 加载切槽并初始化拼图
   * @param {string} svgUrl
   * @return {Promise}
   */
  /** 从 SVG URL 加载槽并初始化 */
  init: function(svgUrl) {
    this.slotSvgUrl = svgUrl;
    return new Promise((resolve, reject) => {
      loadAndPrepareSvg(svgUrl, (shapes, svgInfo) => {
        const promises = shapes.map(data => {
          return new Promise((res, rej) => {
            const slot = new RoundedRectangle({
              width: data.width / svgInfo.viewBoxWidth,
              height: data.height / svgInfo.viewBoxHeight,
              left: data.left / svgInfo.viewBoxWidth - 0.5,
              top: data.top / svgInfo.viewBoxHeight - 0.5,
              originX: 'left',
              originY: 'top'
            });
            const image = new Image();
            image.onload = () => {
              // const img = new fabric.Shapeimage(image, {
              const img = new fabric.ImageContainer("", undefined,{
                left: data.left,
                top: data.top,
                width: data.width,
                height: data.height,
                originX: 'left',
                originY: 'top',
                clipShape: data,
                clipPath: data,
                isFromContainerGroup: true
              });

              img.slotObject = slot;
              // 添加到 canvas 后才会有 canvas 属性
              // this.canvas.add(img);
              res(img); // ✅ resolve 单个 img 对象
            };
            // image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WkFdkgAAAAASUVORK5CYII=';
            image.src ="data:image/jpg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA8AAD/4QMuaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA2LjAtYzAwMiA3OS4xNjQ0ODgsIDIwMjAvMDcvMTAtMjI6MDY6NTMgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCAyMi4wIChNYWNpbnRvc2gpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjdFNEFENjc5NTc0MDExRUM4NzUzRTZGM0ZGRDhFNTlEIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjdFNEFENjdBNTc0MDExRUM4NzUzRTZGM0ZGRDhFNTlEIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6N0U0QUQ2Nzc1NzQwMTFFQzg3NTNFNkYzRkZEOEU1OUQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6N0U0QUQ2Nzg1NzQwMTFFQzg3NTNFNkYzRkZEOEU1OUQiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAGBAQEBQQGBQUGCQYFBgkLCAYGCAsMCgoLCgoMEAwMDAwMDBAMDg8QDw4MExMUFBMTHBsbGxwfHx8fHx8fHx8fAQcHBw0MDRgQEBgaFREVGh8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//wAARCAIAAgADAREAAhEBAxEB/8QAlAABAAIDAQEAAAAAAAAAAAAAAAIEAQMFBgcBAQADAQEAAAAAAAAAAAAAAAABAgMEBRABAAIBAgIFBgwEBQUAAAAAAAECAxEEMQUhQVESBmFxgaGxMpHB0SJCUnKyEzMUB6IjRBbhgpLSRcJDc1QVEQEBAAIBBAIDAQADAQAAAAAAAQIDEUFREgQxEyFhFAVxIjJC/9oADAMBAAIRAxEAPwD769B4oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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";
            
          });
        });
  
        Promise.all(promises).then(items => {
          this.slotObjects = items.map(i => i.slotObject);
  
          // this.initialize(items, {
          //   viewBoxWidth: svgInfo.viewBoxWidth,
          //   viewBoxHeight: svgInfo.viewBoxHeight
          // });
          this.callSuper('initialize', items, {
            viewBoxWidth: svgInfo.viewBoxWidth,
            viewBoxHeight: svgInfo.viewBoxHeight
          });
  
          resolve(this);
        }).catch(reject);
      });
    });
  },
  


  /**
   * 根据容器尺寸、间距、边距等重新布局子元素位置和大小
   */
  reObjectsPosition: function() {
    const w = this.width;
    const h = this.height;
    const m = this.margin;
    const s = this.spacing;
    const halfS = s / 2;

    this._objects.forEach((child, idx) => {
      const slot = this.slotObjects[idx];
      // 计算目标宽高，减去间距
      const targetW = slot.width * w - s;
      const targetH = slot.height * h - s;
      // 初步定位
      child.left = slot.left * w + halfS;
      child.top  = slot.top  * h + halfS;
      // 调整大小
      child.width  = targetW;
      child.height = targetH;
      // 应用变换后中心定位
      const center = new fabric.Point(
        child.left + targetW/2,
        child.top  + targetH/2
      );
      const matrix = [1 + s/w, 0, 0, 1 + s/h, 0, 0];
      const newCenter = fabric.util.transformPoint(center, matrix);
      child.setPositionByOrigin(newCenter, 'center', 'center');
      // 应用边距微调
      child.left += m - 2*m*(slot.left + 0.5);
      child.top  += m - 2*m*(slot.top  + 0.5);
      child.setCoords();
      child.dirty = true;
    });
    this.dirty = true;
  },

  /**
   * 缩放时判断是否等比缩放（Shift 按下）
   */
  _onScaling: function(event) {
    this.isScaleEqually = event.transform.action === 'scale';
  },

  /**
   * 决定是否缓存绘制；如果尺寸、间距等变化，则重新布局
   */
  shouldCache: (function() {
    let prev = {};
    return function() {
      if (fabric.isLikelyNode) return true;
      const key = this._objects.map(o=>o.opacity).join('');
      if (
        prev.w === this.width && prev.h===this.height &&
        prev.s===this.spacing && prev.m===this.margin &&
        prev.sx===this.scaleX && prev.sy===this.scaleY &&
        prev.k===key
      ) {
        return true;
      }
      // 更新缓存标记，并重新布局
      prev = { w:this.width, h:this.height, s:this.spacing, m:this.margin, sx:this.scaleX, sy:this.scaleY, k:key };
      this.reObjectsPosition();
      return true;
    };
  })(),

  /**
   * 重写 set 方法，处理 radius/spacing/margin/scaleX/scaleY
   */
  set: function(prop, val) {
    if (typeof prop === 'object') {
      for (let k in prop) this.set(k, prop[k]);
      return this;
    }
    switch(prop) {
      case 'radius':
        this.radius = val;
        this.setRadius();
        this._fireDataChanged(true);
        break;
      case 'spacing':
        this.spacing = val;
        this._fireDataChanged(true);
        break;
      case 'margin':
        this.margin = val;
        this._fireDataChanged(true);
        break;
      case 'scaleX':
      case 'scaleY':
        // 缩放时避免子元素过小
        this.callSuper('set', prop, val);
        this._fireDataChanged(true);
        break;
      default:
        this.callSuper('set', prop, val);
    }
    return this;
  },

  /**
   * 设置圆角到子元素的 clipPath 上
   */
  setRadius: function() {
    this._objects.forEach(child => {
      const clip = child.clipPath;
      if (clip && 'rx' in clip && 'ry' in clip) {
        clip.rx = clip.ry = this.radius;
        clip.dirty = true;
        child.dirty = true;
      }
    });
    this.dirty = true;
  },

  /**
   * 判断是否按下 Shift 键（等比缩放）
   */
  isShiftKey: function() {
    return this.canvas && !this.canvas.shiftKey;
  },

  /**
   * 判断是否有图像资源已加载
   */
  hasSource: function() {
    return this._objects.some(o => o.hasSource && o.hasSource());
  },

  /**
   * 返回最早加载的图像，用于清理
   */
  getNeedClearChild: function() {
    const loaded = this._objects.filter(o => o.hasSource && o.hasSource());
    if (!loaded.length) return null;
    return loaded.sort((a,b)=>a.addImageTimeStamp-b.addImageTimeStamp)[0];
  },

  /**
   * 判断子元素分辨率是否有效
   */
  isValidResolution: function(res) {
    const invalid = [];
    this._objects.forEach(obj => {
      if (obj.isValidResolution && !obj.isValidResolution(res)) {
        invalid.push({ id: obj.objectId, src: obj.getSrc(), width: obj.getScaledWidth(), height: obj.getScaledHeight() });
      }
    });
    return invalid;
  },

  /**
   * 删除子元素，并更新布局
   */
  remove: function(...items) {
    let removed = false;
    items.forEach(item => {
      const i = this._objects.indexOf(item);
      if (i !== -1) {
        this._objects.splice(i,1);
        this.slotObjects.splice(i,1);
        removed = true;
      }
    });
    if (removed && this.renderOnAddRemove) {
      this.requestRenderAll();
    }
    return this;
  },

  /**
   * 序列化对象，包含 slotObjects
   */
  toObject: function(props, opts) {
    props = props || [];
    const obj = this.callSuper('toObject', props.concat(fabric.ShapeImageGroup.needInitFields), opts);
    obj.slotObjects = this.slotObjects.map(s=>s.toObject(props,opts));
    return obj;
  },

  /**
   * 导出 DataURL，支持 clearContent
   */
  toDataURL: function(options) {
    const saved = [];
    if (options && options.clearContent) {
      this._objects.forEach((child,i)=>{
        saved[i] = child._clearImageProps();
      });
    }
    const url = this.callSuper('toDataURL', options);
    this._objects.forEach(ch=>ch.canvas=this.canvas);
    if (options && options.clearContent) {
      this._objects.forEach((ch,i)=>ch._restoreImageProps(saved[i]));
      this.dirty = true;
    }
    return url;
  },


  /**
   * 删除单元格，并按原始逻辑重新分配相邻空间
   * @param {Object} event 包含 subTarget, direction
   */
  deleteCell: function(event) {
    // 对应原始 deletCell 方法
    var target = event.subTarget;
    var direction = event.direction || LayoutDirection.HORIZONTAL;
    // 如果没有传入 subTarget，则使用 canvas 当前子对象
    target = target || (this.canvas && this.canvas.subActiveObject);
    // 获取目标槽的边界
    var bounds = this.getBounds(target.slotObject);
    // 查找水平方向和垂直方向上相邻的槽
    var horiz = this.findNearbyCell({ currentTarget: target, direction: LayoutDirection.HORIZONTAL, findDirection: -1, justAround: true });
    var vert  = this.findNearbyCell({ currentTarget: target, direction: LayoutDirection.VERTICAL,   findDirection: -1, justAround: true });
    // 从容器中移除该子对象
    this.remove(target);
    // 分发函数：根据剩余槽的尺寸比例重新分配空间
    var redistribute = function(cells, dim, pos) {
      var totalMap = new Map();
      // 计算各分组总长度
      var sum = cells.reduce(function(acc, cell) {
        var b = this.getBounds(cell.slotObject)[dim];
        var key = cell.slotObject.position;
        if (!totalMap.has(key) || b > totalMap.get(key)) {
          totalMap.set(key, b);
          return acc + b;
        }
        return acc;
      }.bind(this), 0);
      // 按比例增加剩余槽的 slotObjects 大小
      cells.forEach(function(cell) {
        var sb = this.getBounds(cell.slotObject)[dim];
        var increment = bounds[dim] * totalMap.get(cell.slotObject.position) / sum;
        cell.slotObject[dim] += increment;
        // 如果该槽原本位于末端，需要向前调整起始坐标
        if (cell.slotObject.position === pos) {
          if (pos === 'right') cell.slotObject.left -= increment;
          if (pos === 'bottom') cell.slotObject.top  -= increment;
        }
      }.bind(this));
    }.bind(this);
    // 水平优先，否则垂直优先
    if (horiz.length) {
      redistribute(horiz, 'width', 'right');
    } else if (vert.length) {
      redistribute(vert, 'height', 'bottom');
    }
    // 更新画布选中与渲染
    this.canvas.targets.shift();
    this.canvas.setActiveObject(this);
    this.canvas.requestRenderAll();
  },

  /**
   * 根据拖拽放大/缩小单个槽并调整邻槽
   * @param {Object} params { target, multiply, by, corner }
   */
  updateSlotSize: function(e) {
    // TODO: 完整移植原 `updateSlotSize` 逻辑
    var _t1 = e.target;
      var a = e.multiply;
      var n = e.by;
      var i = e.corner;
      var r = n === "x" ? LayoutDirection.HORIZONTAL : LayoutDirection.VERTICAL;
      var o = this.getPositionByCorner(i);
      var c = this.findNearbyCell({
        currentTarget: _t1,
        direction: r,
        position: o,
        findDirection: 1
      });
      var s = this.findNearbyCell({
        currentTarget: _t1,
        direction: r,
        position: o,
        findDirection: -1
      });
      var l = this._objects;
      var u = this.spacing;
      var h = this.spacing;
      var d = n === "x" ? this.width : this.height;
      var p = r === LayoutDirection.HORIZONTAL ? "width" : "height";
      var _g3 = _t1[p] * a;
      var m = Infinity;
      var v = Infinity;
      var b = true;
      var _ = false;
      var A = undefined;
      try {
        for (var y, E = l[Symbol.iterator](); !(b = (y = E.next()).done); b = true) {
          var C = y.value;
          var O = C === _t1 || c.includes(C);
          var k = s.includes(C);
          if (O) {
            v = Math.min(C.slotObject[p] - 0.05, v);
          } else if (k) {
            m = Math.min(C.slotObject[p] - 0.05, m);
          }
        }
      } catch (G) {
        _ = true;
        A = G;
      } finally {
        try {
          if (!b && E.return != null) {
            E.return();
          }
        } finally {
          if (_) {
            throw A;
          }
        }
      }
      var w = _t1.slotObject[p];
      var I = w + m;
      var S = w - v;
      var j = (_g3 + u + h * 2 * w) / (d + u - h * 2);
      if (j <= S) {
        j = S;
      } else if (j >= I) {
        j = I;
      }
      var T = j - w;
      var x = true;
      var L = false;
      var P = undefined;
      try {
        for (var D, N = l[Symbol.iterator](); !(x = (D = N.next()).done); x = true) {
          var R = D.value;
          var F = R === _t1 || c.includes(R);
          var M = s.includes(R);
          var B = R.slotObject[p];
          var U = undefined;
          if ((F || M) && (F ? (R.slotObject[p] += T, U = r === LayoutDirection.HORIZONTAL ? "left" : "top") : M && (R.slotObject[p] -= T, U = r === LayoutDirection.HORIZONTAL ? "right" : "bottom"), o === U)) {
            var V = r === LayoutDirection.HORIZONTAL ? "left" : "top";
            R.slotObject[V] -= R.slotObject[p] - B;
          }
        }
      } catch (G) {
        L = true;
        P = G;
      } finally {
        try {
          if (!x && N.return != null) {
            N.return();
          }
        } finally {
          if (L) {
            throw P;
          }
        }
      }
      t.getInstance().dispatchEvent(g.MONITOR_GUIDE_CLOSE, _f.g.GUIDE_CLIP_COLLAGE);
      this.reObjectsPosition();
  },

  /**
   * 获取某个角点对应的槽位置（left/right/top/bottom）
   */
  getPositionByCorner: function(corner) {
    return { ml:'left', mr:'right', mt:'top', mb:'bottom' }[corner];
  },

  /**
   * 判断某子对象的四个方向上是否存在邻槽
   */
  getNearbyCorner: function(e) {
    // TODO: 调用 findNearbyCell 实现与原代码等价
    return {
              ml: this.findNearbyCell({
                currentTarget: e,
                direction: LayoutDirection.HORIZONTAL,
                position: "left",
                findDirection: -1
              }).length > 0,
              mr: this.findNearbyCell({
                currentTarget: e,
                direction: LayoutDirection.HORIZONTAL,
                position: "right",
                findDirection: -1
              }).length > 0,
              mt: this.findNearbyCell({
                currentTarget: e,
                direction: LayoutDirection.HORIZONTAL,
                position: "top",
                findDirection: -1
              }).length > 0,
              mb: this.findNearbyCell({
                currentTarget: e,
                direction: LayoutDirection.HORIZONTAL,
                position: "bottom",
                findDirection: -1
              }).length > 0
            };

  },
  isEqualByDeriction: function (e) {
          var t = e.currentSlot;
          var a = e.compareSlot;
          var n = e.direction;
          var i = e.position;
          var r = e.findDirection;
          var o = e.justAround;
          var c = this.getRevertPosition;
          if (i) {
            var s = false;
            var l = true;
            if (r < 0) {
              if (s = Math.abs(t[i] * 1000 - a[c(i)] * 1000) < 3) {
                a.position = i;
              }
            } else if (r > 0) {
              if (s = Math.abs(t[i] * 1000 - a[i] * 1000) < 3) {
                a.position = c(i);
              }
            } else {
              s = Math.abs(t[i] * 1000 - a[i] * 1000) < 3 || Math.abs(t[i] * 1000 - a[c(i)] * 1000) < 3;
            }
            if (o) {
              var u = n === xt.HORIZONTAL ? "top" : "left";
              var h = t[u] * 1000 - 3;
              var d = t[c(u)] * 1000 + 3;
              l = a[u] * 1000 >= h && a[c(u)] * 1000 <= d;
            }
            return s && l;
          }
          if (n === xt.HORIZONTAL) {
            return this.isEqualByDeriction(Dt({}, e, {
              position: "left"
            })) || this.isEqualByDeriction(Dt({}, e, {
              position: "right"
            }));
          } else {
            return this.isEqualByDeriction(Dt({}, e, {
              position: "top"
            })) || this.isEqualByDeriction(Dt({}, e, {
              position: "bottom"
            }));
          }
        },
  /**
   * 查找与指定槽按方向/位置/距离条件相邻的所有对象
   * @param {Object} opts { currentTarget, direction, position, findDirection, justAround }
   */
  findNearbyCell: function(e) {
    // TODO: 移植原 findNearbyCell 及 isEqualByDeriction 逻辑
    var t = this;
      var a = e.currentTarget;
      var n = e.direction;
      var i = e.position;
      var r = e.findDirection;
      var o = e.justAround;
      var c = this._objects;
      var s = [];
      var l = this.getBounds(a.slotObject);
      var u = true;
      var h = false;
      var d = undefined;
      try {
        for (var p, g = function () {
            var e = p.value;
            var a = t.getBounds(e.slotObject);
            if (l === a) {
              return "continue";
            }
            var c = [n];
            if (!n) {
              c = [LayoutDirection.HORIZONTAL, LayoutDirection.VERTICAL];
            }
            c.forEach(function (n) {
              if (t.isEqualByDeriction({
                currentSlot: l,
                compareSlot: a,
                direction: n,
                position: i,
                findDirection: r,
                justAround: o
              })) {
                s.push(e);
              }
            });
          }, f = c[Symbol.iterator](); !(u = (p = f.next()).done); u = true) {
          g();
        }
      } catch (m) {
        h = true;
        d = m;
      } finally {
        try {
          if (!u && f.return != null) {
            f.return();
          }
        } finally {
          if (h) {
            throw d;
          }
        }
      }
      return s;
    
  },

  /**
   * 比较两个槽描述在某方向上位置是否满足删除/拖拽条件
   */
  isEqualByDirection: function(e) {
    // TODO: 实现原 isEqualByDeriction 逻辑
          var t = e.currentSlot;
      var a = e.compareSlot;
      var n = e.direction;
      var i = e.position;
      var r = e.findDirection;
      var o = e.justAround;
      var c = this.getRevertPosition;
      if (i) {
        var s = false;
        var l = true;
        if (r < 0) {
          if (s = Math.abs(t[i] * 1000 - a[c(i)] * 1000) < 3) {
            a.position = i;
          }
        } else if (r > 0) {
          if (s = Math.abs(t[i] * 1000 - a[i] * 1000) < 3) {
            a.position = c(i);
          }
        } else {
          s = Math.abs(t[i] * 1000 - a[i] * 1000) < 3 || Math.abs(t[i] * 1000 - a[c(i)] * 1000) < 3;
        }
        if (o) {
          var u = n === LayoutDirection.HORIZONTAL ? "top" : "left";
          var h = t[u] * 1000 - 3;
          var d = t[c(u)] * 1000 + 3;
          l = a[u] * 1000 >= h && a[c(u)] * 1000 <= d;
        }
        return s && l;
      }
      if (n === LayoutDirection.HORIZONTAL) {
        return this.isEqualByDeriction(Dt({}, e, {
          position: "left"
        })) || this.isEqualByDeriction(Dt({}, e, {
          position: "right"
        }));
      } else {
        return this.isEqualByDeriction(Dt({}, e, {
          position: "top"
        })) || this.isEqualByDeriction(Dt({}, e, {
          position: "bottom"
        }));
      }
    
  },

  /**
   * 获取相对位置的反向映射（left<->right, top<->bottom）
   */
  getRevertPosition: function(pos) {
    switch(pos) {
      case 'left': return 'right';
      case 'right': return 'left';
      case 'top': return 'bottom';
      case 'bottom': return 'top';
      default: return '';
    }
  },

  /**
   * 返回槽对象的边界信息(left, top, right, bottom)
   */
  getBounds: function(slot) {
    const left = slot.left;
    const top  = slot.top;
    slot.right  = left + slot.width;
    slot.bottom = top  + slot.height;
    return slot;
  },

  /**
   * 派发数据变更事件
   */
  _fireDataChanged: function(options) {
    return;
    // this.callSuper('_fireDataChanged', options);
    this.canvas.fire("object:modified", { target: this, withoutStep: options });
  }
});

// fabric.ShapeImageGroup.fromObject = function (n, i, r) {
//   r = a(r);
//   var o = n.objects;
//   var c = t(n, true);
//   delete c.objects;
//   if (typeof o !== "string") {
//     if (Array.isArray(o)) {
//       o.forEach(function (e) {
//         return e.isFromContainerGroup = true;
//       });
//     }
//     e(o, function (a) {
//       e([n.clipPath], function (o) {
//         var c = t(n, true);
//         c.clipPath = o[0];
//         delete c.objects;
//         e(n.slotObjects, function (e) {
//           c.slotObjects = e;
//           if (i) {
//             i(new Rt(a, c, true));
//           }
//         }, "", undefined, r);
//       }, "", undefined, r);
//     }, "", undefined, r);
//   } else {
//     _H(o, function (e) {
//       var t = _s.fabric.util.groupSVGElements(e, n, o);
//       t.set(c);
//       if (i) {
//         i(t);
//       }
//     });
//   }
// };

// 把 fabric.ShapeImageGroup.fromObject转为可读性更高的源代码
fabric.ShapeImageGroup.fromObject = function (serializedGroup, callback, reviver) {
  reviver = ensureReviver(reviver); // a(r) 是某种 reviver 工具函数
  const rawObjects = serializedGroup.objects;
  const commonProps = extractProperties(serializedGroup, true); // t(n, true)
  const enlivenObjects = fabric.util.enlivenObjects;
  delete commonProps.objects; // 不需要再保留原始 objects

  if (typeof rawObjects !== "string") {
    // rawObjects 是数组（不是 SVG URL）
    if (Array.isArray(rawObjects)) {
      // 标记所有子对象为从组中恢复
      rawObjects.forEach(obj => {
        obj.isFromContainerGroup = true;
      });
    }

    // 反序列化每个对象（e() 是类似 fabric.util.enlivenObjects 的函数）
    enlivenObjects(rawObjects, function (enlivenedObjects) {
      // clipPath 也反序列化（可能是数组，通常为单个对象）
      enlivenObjects([serializedGroup.clipPath], function (enlivenedClipPaths) {
        const groupProps = extractProperties(serializedGroup, true);
        groupProps.clipPath = enlivenedClipPaths[0];
        delete groupProps.objects;

        // 处理 slotObjects（每个对象 slot 映射）
        enlivenObjects(serializedGroup.slotObjects, function (enlivenedSlots) {
          groupProps.slotObjects = enlivenedSlots;

          if (callback) {
            // Rt 是自定义 Group 类，如 ShapeImageGroup
            const group = new fabric.ShapeImageGroup(enlivenedObjects, groupProps, true);
            callback(group);
          }
        }, "", undefined, reviver);
      }, "", undefined, reviver);
    }, "", undefined, reviver);

  } else {
    // rawObjects 是字符串：SVG URL，走 SVG 加载逻辑
    loadSVGFromURL(rawObjects, function (elements) {
      const group = fabric.util.groupSVGElements(elements, serializedGroup, rawObjects);
      group.set(commonProps);
      if (callback) {
        callback(group);
      }
    });
  }
};

