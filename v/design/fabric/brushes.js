/**
 * fabric.brushes - A collection of brushes for fabric.js (version 4 and up).
 *
 * Made by Arjan Haverkamp, https://www.webgear.nl
 * Copyright 2021 Arjan Haverkamp
 * MIT Licensed
 * @version 1.0 - 2021-06-02
 * @url https://github.com/av01d/fabric-brushes
 *
 * Inspiration sources:
 * - https://github.com/tennisonchan/fabric-brush
 * - https://mrdoob.com/projects/harmony/
 * - http://perfectionkills.com/exploring-canvas-drawing-techniques/
 */

(function(fabric) {

	/**
	 * Trim a canvas. Returns the left-top coordinate where trimming began.
	 * @param {canvas} canvas A canvas element to trim. This element will be trimmed (reference).
	 * @returns {Object} Left-top coordinate of trimmed area. Example: {x:65, y:104}
	 * @see: https://stackoverflow.com/a/22267731/3360038
	 */
	fabric.util.trimCanvas = function(canvas) {
		var ctx = canvas.getContext('2d'),
			w = canvas.width,
			h = canvas.height,
			pix = {x:[], y:[]}, n,
			imageData = ctx.getImageData(0,0,w,h),
			fn = function(a,b) { return a-b };
	
		for (var y = 0; y < h; y++) {
			for (var x = 0; x < w; x++) {
				if (imageData.data[((y * w + x) * 4)+3] > 0) {
					pix.x.push(x);
					pix.y.push(y);
				}
			}
		}
		pix.x.sort(fn);
		pix.y.sort(fn);
		n = pix.x.length-1;
	
		//if (n == -1) {
		//	// Nothing to trim... empty canvas?
		//}
	
		w = pix.x[n] - pix.x[0];
		h = pix.y[n] - pix.y[0];
		var cut = ctx.getImageData(pix.x[0], pix.y[0], w, h);
	
		canvas.width = w;
		canvas.height = h;
		ctx.putImageData(cut, 0, 0);
	
		return {x:pix.x[0], y:pix.y[0]};
	}
	
	/**
	 * Extract r,g,b,a components from any valid color.
	 * Returns {undefined} when color cannot be parsed.
	 *
	 * @param {number} color Any color string (named, hex, rgb, rgba)
	 * @returns {(Array|undefined)} Example: [0,128,255,1]
	 * @see https://gist.github.com/oriadam/396a4beaaad465ca921618f2f2444d49
	 */
	fabric.util.colorValues = function(color) {
		if (!color) { return; }
		if (color.toLowerCase() === 'transparent') { return [0, 0, 0, 0]; }
		if (color[0] === '#') {
			if (color.length < 7) {
				// convert #RGB and #RGBA to #RRGGBB and #RRGGBBAA
				color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3] + (color.length > 4 ? color[4] + color[4] : '');
			}
			return [parseInt(color.substr(1, 2), 16),
				parseInt(color.substr(3, 2), 16),
				parseInt(color.substr(5, 2), 16),
				color.length > 7 ? parseInt(color.substr(7, 2), 16)/255 : 1];
		}
		if (color.indexOf('rgb') === -1) {
			// convert named colors
			var tempElem = document.body.appendChild(document.createElement('fictum')); // intentionally use unknown tag to lower chances of css rule override with !important
			var flag = 'rgb(1, 2, 3)'; // this flag tested on chrome 59, ff 53, ie9, ie10, ie11, edge 14
			tempElem.style.color = flag;
			if (tempElem.style.color !== flag) {
				return; // color set failed - some monstrous css rule is probably taking over the color of our object
			}
			tempElem.style.color = color;
			if (tempElem.style.color === flag || tempElem.style.color === '') {
				return; // color parse failed
			}
			color = getComputedStyle(tempElem).color;
			document.body.removeChild(tempElem);
		}
		if (color.indexOf('rgb') === 0)	{
			if (color.indexOf('rgba') === -1) {
				color += ',1'; // convert 'rgb(R,G,B)' to 'rgb(R,G,B)A' which looks awful but will pass the regxep below
			}
			return color.match(/[\.\d]+/g).map(function(a)	{
				return +a
			});
		}
	}
	
	fabric.Point.prototype.angleBetween = function(that) {
		return Math.atan2( this.x - that.x, this.y - that.y);
	};
	
	fabric.Point.prototype.normalize = function(thickness) {
		if (null === thickness || undefined === thickness) {
			thickness = 1;
		}
	
		var length = this.distanceFrom({ x: 0, y: 0 });
	
		if (length > 0) {
			this.x = this.x / length * thickness;
			this.y = this.y / length * thickness;
		}
	
		return this;
	};
	
	/**
	 * Convert a brush drawing on the upperCanvas to an image on the fabric canvas.
	 * This makes the drawing editable, it can be moved, rotated, scaled, skewed etc.
	 */
	// fabric.BaseBrush.prototype.convertToImg = function() {
	// 	var pixelRatio = this.canvas.getRetinaScaling(),
	// 		c = fabric.util.copyCanvasElement(this.canvas.upperCanvasEl),
	// 		xy = fabric.util.trimCanvas(c),
	// 		img = new fabric.Image(c);
	
	// 	img.set({left:xy.x/pixelRatio,top:xy.y/pixelRatio,'scaleX':1/pixelRatio,'scaleY':1/pixelRatio}).setCoords();
	// 	this.canvas.add(img).clearContext(this.canvas.contextTop);
	// 	this.canvas.clearContext(this.canvas.contextTop);
	// }
	fabric.BaseBrush.prototype.convertToImg = function() {
		var pixelRatio = this.canvas.getRetinaScaling(),
			c = fabric.util.copyCanvasElement(this.canvas.upperCanvasEl),
			xy = fabric.util.trimCanvas(c),
			img = new fabric.Image(c);
	
		// 计算 viewportTransform 的逆变换
		var transform = this.canvas.viewportTransform;
		var invTransform = fabric.util.invertTransform(transform);
	
		// 计算修正坐标（但不缩放图像本身）
		var localXY = new fabric.Point(xy.x / pixelRatio, xy.y / pixelRatio);
		var globalXY = fabric.util.transformPoint(localXY, invTransform);
	
		var zoomFactor = this.canvas.getZoom(); 

		zoomFactor = pixelRatio * zoomFactor;
		zoomFactor = 1/zoomFactor;
		
		img.set({
			left: globalXY.x,
			top: globalXY.y,
			scaleX: zoomFactor,
			scaleY: zoomFactor,
		}).setCoords(); 
	
		this.canvas.add(img);
		this.canvas.clearContext(this.canvas.contextTop);
	};
	
	
	
	
	

	
	fabric.util.getRandom = function(max, min) {
		min = min ? min : 0;
		return Math.random() * ((max ? max : 1) - min) + min;
	};
	
	fabric.util.clamp = function (n, max, min) {
		if (typeof min !== 'number') { min = 0; }
		return n > max ? max : n < min ? min : n;
	};
	
	fabric.Stroke = fabric.util.createClass(fabric.Object,{
		color: null,
		inkAmount: null,
		lineWidth: null,
	
		_point: null,
		_lastPoint: null,
		_currentLineWidth: null,
	
		initialize: function(ctx, pointer, range, color, lineWidth, inkAmount) {
			var rx = fabric.util.getRandom(range),
				c = fabric.util.getRandom(Math.PI * 2),
				c0 = fabric.util.getRandom(Math.PI * 2),
				x0 = rx * Math.sin(c0),
				y0 = rx / 2 * Math.cos(c0),
				cos = Math.cos(c),
				sin = Math.sin(c);
	
			this.ctx = ctx;
			this.color = color;
			this._point = new fabric.Point(pointer.x + x0 * cos - y0 * sin, pointer.y + x0 * sin + y0 * cos);
			this.lineWidth = lineWidth;
			this.inkAmount = inkAmount;
			this._currentLineWidth = lineWidth;
	
			ctx.lineCap = 'round';
		},
	
		update: function(pointer, subtractPoint, distance) {
			this._lastPoint = fabric.util.object.clone(this._point);
			this._point = this._point.addEquals({ x: subtractPoint.x, y: subtractPoint.y });
	
			var n = this.inkAmount / (distance + 1),
				per = (n > 0.3 ? 0.2 : n < 0 ? 0 : n);
			this._currentLineWidth = this.lineWidth * per;
		},
	
		draw: function() {
			var ctx = this.ctx;
			ctx.save();
			this.line(ctx, this._lastPoint, this._point, this.color, this._currentLineWidth);
			ctx.restore();
		},
	
		line: function(ctx, point1, point2, color, lineWidth) {
			ctx.strokeStyle = color;
			ctx.lineWidth = lineWidth;
			ctx.beginPath();
			ctx.moveTo(point1.x, point1.y);
			ctx.lineTo(point2.x, point2.y);
			ctx.stroke();
		}
	});
	
	/**
	 * CrayonBrush
	 * Based on code by Tennison Chan.
	 */
	fabric.CrayonBrush = fabric.util.createClass(fabric.BaseBrush, {
		color: '#000',
		opacity: 0.6,
		width: 30,
	
		_baseWidth: 20,
		_inkAmount: 10,
		_latestStrokeLength: 0,
		_point: null,
		_sep: 5,
		_size: 0,
		_latest: null,
		_drawn: false,
	
		initialize: function(canvas, opt) {
			opt = opt || {};
	
			this.canvas = canvas;
			this.width = opt.width || canvas.freeDrawingBrush.width;
			this.color = opt.color || canvas.freeDrawingBrush.color;
			this.opacity = opt.opacity || canvas.contextTop.globalAlpha;
			this._point = new fabric.Point(0, 0);
		},
	
		onMouseDown: function(pointer) {
			this.canvas.contextTop.globalAlpha = this.opacity;
			this._size = this.width / 2 + this._baseWidth;
			this._drawn = false;
			this.set(pointer);
		},
	
		onMouseMove: function(pointer) {
			this.update(pointer);
			this.draw(this.canvas.contextTop);
		},
	
		onMouseUp: function() {
			if (this._drawn) {
				this.convertToImg();
			}
			this._latest = null;
			this._latestStrokeLength = 0;
			this.canvas.contextTop.globalAlpha = 1;
		},
	
		set: function(p) {
			if (this._latest) {
				this._latest.setFromPoint(this._point);
			} else {
				this._latest = new fabric.Point(p.x, p.y);
			}
			fabric.Point.prototype.setFromPoint.call(this._point, p);
		},
	
		update: function(p) {
			this.set(p);
			this._latestStrokeLength = this._point.subtract(this._latest).distanceFrom({ x: 0, y: 0 });
		},
	
		draw: function(ctx) {
			var i, j, p, r, c, x, y, w, h, v, s, stepNum, dotSize, dotNum, range;
	
			v = this._point.subtract(this._latest);
			s = Math.ceil(this._size / 2);
			stepNum = Math.floor(v.distanceFrom({ x: 0, y: 0 }) / s) + 1;
			v.normalize(s);
	
			dotSize = this._sep * fabric.util.clamp(this._inkAmount / this._latestStrokeLength * 3, 1, 0.5);
			dotNum = Math.ceil(this._size * this._sep);
	
			range = this._size / 2;
	
			// ctx.save();
			this._saveAndTransform(ctx);
			ctx.fillStyle = this.color;
			ctx.beginPath();
			for (i = 0; i < dotNum; i++) {
				for (j = 0; j < stepNum; j++) {
					p = this._latest.add(v.multiply(j));
					r = fabric.util.getRandom(range);
					c = fabric.util.getRandom(Math.PI * 2);
					w = fabric.util.getRandom(dotSize, dotSize / 2);
					h = fabric.util.getRandom(dotSize, dotSize / 2);
					x = p.x + r * Math.sin(c) - w / 2;
					y = p.y + r * Math.cos(c) - h / 2;
					ctx.rect(x, y, w, h);
				}
			}
			ctx.fill();
			ctx.restore();
			this._drawn = true;
		},
	
		_render: function() {}
	
	}); // End CrayonBrush
	

	/**
	 * InkBrush
	 * Based on code by Tennison Chan.
	 */
	fabric.InkBrush = fabric.util.createClass(fabric.BaseBrush, {
		color: '#000',
		opacity: 1,
		width: 30,
	
		_baseWidth: 20,
		_inkAmount: 7,
		_lastPoint: null,
		_point: null,
		_range: 10,
		_strokes: null,
	
		initialize: function(canvas, opt) {
			opt = opt || {};
	
			this.canvas = canvas;
			this.width = opt.width || canvas.freeDrawingBrush.width;
			this.color = opt.color || canvas.freeDrawingBrush.color;
			this.opacity = opt.opacity || canvas.contextTop.globalAlpha;
	
			this._point = new fabric.Point();
		},
	
		_render: function(pointer) {
			var len, i, point = this.setPointer(pointer),
				subtractPoint = point.subtract(this._lastPoint),
				distance = point.distanceFrom(this._lastPoint),
				stroke;
			const ctx = this.canvas.contextTop;
			this._saveAndTransform(ctx);

			for (i = 0, len = this._strokes.length; i < len; i++) {
				stroke = this._strokes[i];
				stroke.update(point, subtractPoint, distance);
				stroke.draw();
			}

			ctx.restore();
	
			if (distance > 30) {
				this.drawSplash(point, this._inkAmount);
			}
			
		},
	
		onMouseDown: function(pointer) {
			this.canvas.contextTop.globalAlpha = this.opacity;
			this._resetTip(pointer);
		},
	
		onMouseMove: function(pointer) {
			if (this.canvas._isCurrentlyDrawing) {
				this._render(pointer);
			}
		},
	
		onMouseUp: function() {
			this.convertToImg();
			this.canvas.contextTop.globalAlpha = 1;
		},
	
		drawSplash: function(pointer, maxSize) {
			var c, r, i, point,
				ctx = this.canvas.contextTop,
				num = fabric.util.getRandom(12),
				range = maxSize * 10,
				color = this.color;
	
			// ctx.save();
			this._saveAndTransform(ctx);
			for (i = 0; i < num; i++) {
				r = fabric.util.getRandom(range, 1);
				c = fabric.util.getRandom(Math.PI * 2);
				point = new fabric.Point(pointer.x + r * Math.sin(c), pointer.y + r * Math.cos(c));
	
				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.arc(point.x, point.y, fabric.util.getRandom(maxSize) / 2, 0, Math.PI * 2, false);
				ctx.fill();
			}
			ctx.restore();
		},
	
		setPointer: function(pointer) {
			var point = new fabric.Point(pointer.x, pointer.y);
	
			this._lastPoint = fabric.util.object.clone(this._point);
			this._point = point;
	
			return point;
		},
	
		_resetTip: function(pointer) {
			var len, i, point = this.setPointer(pointer);
	
			this._strokes = [];
			this.size = this.width / 5 + this._baseWidth;
			this._range = this.size / 2;
	
			for (i = 0, len = this.size; i < len; i++) {
				this._strokes[i] = new fabric.Stroke(this.canvas.contextTop, point, this._range, this.color, this.width, this._inkAmount);
			}
		}
	}); // End InkBrush
	

	/**
	 * MarkerBrush
	 * Based on code by Tennison Chan.
	 */
	fabric.MarkerBrush = fabric.util.createClass(fabric.BaseBrush, {
		color: '#000',
		opacity: 1,
		width: 30,
	
		_baseWidth: 10,
		_lastPoint: null,
		_lineWidth: 3,
		_point: null,
		_size: 0,
	
		initialize: function(canvas, opt) {
			opt = opt || {};
	
			this.canvas = canvas;
			this.width = opt.width || canvas.freeDrawingBrush.width;
			this.color = opt.color || canvas.freeDrawingBrush.color;
			this.opacity = opt.opacity || canvas.contextTop.globalAlpha;
			this.canvas.contextTop.globalAlpha = this.opacity;
			this._point = new fabric.Point();
	
			this.canvas.contextTop.lineJoin = 'round';
			this.canvas.contextTop.lineCap = 'round';
		},
	
		_render: function(pointer) {
			var ctx, lineWidthDiff, i, len;
	
			ctx = this.canvas.contextTop;
			this._saveAndTransform(ctx);
			ctx.beginPath();
	
			for(i = 0, len = (this._size / this._lineWidth) / 2; i < len; i++) {
				lineWidthDiff = (this._lineWidth - 1) * i;
	
				ctx.globalAlpha = 0.8 * this.opacity;
				ctx.moveTo(this._lastPoint.x + lineWidthDiff, this._lastPoint.y + lineWidthDiff);
				ctx.lineTo(pointer.x + lineWidthDiff, pointer.y + lineWidthDiff);
				ctx.stroke();
			}

			ctx.restore();
	
			this._lastPoint = new fabric.Point(pointer.x, pointer.y);
		},
	
		onMouseDown: function(pointer) {
			this._lastPoint = pointer;
			this.canvas.contextTop.strokeStyle = this.color;
			this.canvas.contextTop.lineWidth = this._lineWidth;
			this._size = this.width + this._baseWidth;
		},
	
		onMouseMove: function(pointer) {
			if (this.canvas._isCurrentlyDrawing) {
				this._render(pointer);
			}
		},
	
		onMouseUp: function() {
			this.canvas.contextTop.globalAlpha = this.opacity;
			this.canvas.contextTop.globalAlpha = 1;
			this.convertToImg();
		}
	}); // End MarkerBrush
	

	
	})(typeof fabric !== 'undefined' ? fabric : require('fabric').fabric);