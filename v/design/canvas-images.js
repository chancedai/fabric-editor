("use strict");
(function e$jscomp$0(z, B, E) {
  function p(u, d) {
    if (!B[u]) {
      if (!z[u]) {
        var c = "function" == typeof require && require;
        if (!d && c) return c(u, !0);
        if (t) return t(u, !0);
        d = Error("Cannot find module '" + u + "'");
        throw ((d.code = "MODULE_NOT_FOUND"), d);
      }
      d = B[u] = { exports: {} };
      z[u][0].call(
        d.exports,
        function (b) {
          var a = z[u][1][b];
          return p(a ? a : b);
        },
        d,
        d.exports,
        e$jscomp$0,
        z,
        B,
        E
      );
    }
    return B[u].exports;
  }
  for (
    var t = "function" == typeof require && require, w = 0;
    w < E.length;
    w++
  )
    p(E[w]);
  return p;
})(
  {
    1: [
      function (z, B, E) {
        if (!x)
          var x = {
            map: function (p, t) {
              var w = {};
              return t
                ? p.map(function (u, d) {
                    w.index = d;
                    return t.call(w, u);
                  })
                : p.slice();
            },
            naturalOrder: function (p, t) {
              return p < t ? -1 : p > t ? 1 : 0;
            },
            sum: function (p, t) {
              var w = {};
              return p.reduce(
                t
                  ? function (u, d, c) {
                      w.index = c;
                      return u + t.call(w, d);
                    }
                  : function (u, d) {
                      return u + d;
                    },
                0
              );
            },
            max: function (p, t) {
              return Math.max.apply(null, t ? x.map(p, t) : p);
            },
          };
        z = (function () {
          function p(b) {
            function a() {
              e.sort(b);
              g = !0;
            }
            var e = [],
              g = !1;
            return {
              push: function (f) {
                e.push(f);
                g = !1;
              },
              peek: function (f) {
                g || a();
                void 0 === f && (f = e.length - 1);
                return e[f];
              },
              pop: function () {
                g || a();
                return e.pop();
              },
              size: function () {
                return e.length;
              },
              map: function (f) {
                return e.map(f);
              },
              debug: function () {
                g || a();
                return e;
              },
            };
          }
          function t(b, a, e, g, f, k, h) {
            this.r1 = b;
            this.r2 = a;
            this.g1 = e;
            this.g2 = g;
            this.b1 = f;
            this.b2 = k;
            this.histo = h;
          }
          function w() {
            this.vboxes = new p(function (b, a) {
              return x.naturalOrder(
                b.vbox.count() * b.vbox.volume(),
                a.vbox.count() * a.vbox.volume()
              );
            });
          }
          function u(b) {
            var a = Array(32768),
              e,
              g,
              f,
              k;
            b.forEach(function (h) {
              g = h[0] >> 3;
              f = h[1] >> 3;
              k = h[2] >> 3;
              e = (g << 10) + (f << 5) + k;
              a[e] = (a[e] || 0) + 1;
            });
            return a;
          }
          function d(b, a) {
            var e = 1e6,
              g = 0,
              f = 1e6,
              k = 0,
              h = 1e6,
              l = 0,
              r,
              m,
              n;
            b.forEach(function (q) {
              r = q[0] >> 3;
              m = q[1] >> 3;
              n = q[2] >> 3;
              r < e ? (e = r) : r > g && (g = r);
              m < f ? (f = m) : m > k && (k = m);
              n < h ? (h = n) : n > l && (l = n);
            });
            return new t(e, g, f, k, h, l, a);
          }
          function c(b, a) {
            function e(y) {
              var C = y + "1";
              y += "2";
              for (m = a[C]; m <= a[y]; m++)
                if (l[m] > h / 2) {
                  var G = a.copy();
                  var H = a.copy();
                  var A = m - a[C];
                  var F = a[y] - m;
                  for (
                    A =
                      A <= F
                        ? Math.min(a[y] - 1, ~~(m + F / 2))
                        : Math.max(a[C], ~~(m - 1 - A / 2));
                    !l[A];

                  )
                    A++;
                  for (F = r[A]; !F && l[A - 1]; ) F = r[--A];
                  G[y] = A;
                  H[C] = G[y] + 1;
                  return [G, H];
                }
            }
            if (a.count()) {
              var g = a.r2 - a.r1 + 1,
                f = a.g2 - a.g1 + 1,
                k = x.max([g, f, a.b2 - a.b1 + 1]);
              if (1 == a.count()) return [a.copy()];
              var h = 0,
                l = [],
                r = [],
                m,
                n,
                q;
              if (k == g)
                for (m = a.r1; m <= a.r2; m++) {
                  var v = 0;
                  for (n = a.g1; n <= a.g2; n++)
                    for (q = a.b1; q <= a.b2; q++) {
                      var D = (m << 10) + (n << 5) + q;
                      v += b[D] || 0;
                    }
                  h += v;
                  l[m] = h;
                }
              else if (k == f)
                for (m = a.g1; m <= a.g2; m++) {
                  v = 0;
                  for (n = a.r1; n <= a.r2; n++)
                    for (q = a.b1; q <= a.b2; q++)
                      (D = (n << 10) + (m << 5) + q), (v += b[D] || 0);
                  h += v;
                  l[m] = h;
                }
              else
                for (m = a.b1; m <= a.b2; m++) {
                  v = 0;
                  for (n = a.r1; n <= a.r2; n++)
                    for (q = a.g1; q <= a.g2; q++)
                      (D = (n << 10) + (q << 5) + m), (v += b[D] || 0);
                  h += v;
                  l[m] = h;
                }
              l.forEach(function (y, C) {
                r[C] = h - y;
              });
              return k == g ? e("r") : k == f ? e("g") : e("b");
            }
          }
          t.prototype = {
            volume: function (b) {
              if (!this._volume || b)
                this._volume =
                  (this.r2 - this.r1 + 1) *
                  (this.g2 - this.g1 + 1) *
                  (this.b2 - this.b1 + 1);
              return this._volume;
            },
            count: function (b) {
              var a = this.histo;
              if (!this._count_set || b) {
                b = 0;
                var e, g, f;
                for (e = this.r1; e <= this.r2; e++)
                  for (g = this.g1; g <= this.g2; g++)
                    for (f = this.b1; f <= this.b2; f++) {
                      var k = (e << 10) + (g << 5) + f;
                      b += a[k] || 0;
                    }
                this._count = b;
                this._count_set = !0;
              }
              return this._count;
            },
            copy: function () {
              return new t(
                this.r1,
                this.r2,
                this.g1,
                this.g2,
                this.b1,
                this.b2,
                this.histo
              );
            },
            avg: function (b) {
              var a = this.histo;
              if (!this._avg || b) {
                var e = (b = 0),
                  g = 0,
                  f = 0,
                  k,
                  h,
                  l;
                for (k = this.r1; k <= this.r2; k++)
                  for (h = this.g1; h <= this.g2; h++)
                    for (l = this.b1; l <= this.b2; l++) {
                      var r = (k << 10) + (h << 5) + l;
                      r = a[r] || 0;
                      b += r;
                      e += r * (k + 0.5) * 8;
                      g += r * (h + 0.5) * 8;
                      f += r * (l + 0.5) * 8;
                    }
                this._avg = b
                  ? [~~(e / b), ~~(g / b), ~~(f / b)]
                  : [
                      ~~((8 * (this.r1 + this.r2 + 1)) / 2),
                      ~~((8 * (this.g1 + this.g2 + 1)) / 2),
                      ~~((8 * (this.b1 + this.b2 + 1)) / 2),
                    ];
              }
              return this._avg;
            },
            contains: function (b) {
              var a = b[0] >> 3;
              gval = b[1] >> 3;
              bval = b[2] >> 3;
              return (
                a >= this.r1 &&
                a <= this.r2 &&
                gval >= this.g1 &&
                gval <= this.g2 &&
                bval >= this.b1 &&
                bval <= this.b2
              );
            },
          };
          w.prototype = {
            push: function (b) {
              this.vboxes.push({ vbox: b, color: b.avg() });
            },
            palette: function () {
              return this.vboxes.map(function (b) {
                return b.color;
              });
            },
            size: function () {
              return this.vboxes.size();
            },
            map: function (b) {
              for (var a = this.vboxes, e = 0; e < a.size(); e++)
                if (a.peek(e).vbox.contains(b)) return a.peek(e).color;
              return this.nearest(b);
            },
            nearest: function (b) {
              for (var a = this.vboxes, e, g, f, k = 0; k < a.size(); k++)
                if (
                  ((g = Math.sqrt(
                    Math.pow(b[0] - a.peek(k).color[0], 2) +
                      Math.pow(b[1] - a.peek(k).color[1], 2) +
                      Math.pow(b[2] - a.peek(k).color[2], 2)
                  )),
                  g < e || void 0 === e)
                )
                  (e = g), (f = a.peek(k).color);
              return f;
            },
            forcebw: function () {
              var b = this.vboxes;
              b.sort(function (g, f) {
                return x.naturalOrder(x.sum(g.color), x.sum(f.color));
              });
              var a = b[0].color;
              5 > a[0] && 5 > a[1] && 5 > a[2] && (b[0].color = [0, 0, 0]);
              a = b.length - 1;
              var e = b[a].color;
              251 < e[0] &&
                251 < e[1] &&
                251 < e[2] &&
                (b[a].color = [255, 255, 255]);
            },
          };
          return {
            quantize: function (b, a) {
              function e(h, l) {
                for (var r = 1, m = 0, n; 1e3 > m; )
                  if (((n = h.pop()), n.count())) {
                    var q = c(g, n);
                    n = q[0];
                    q = q[1];
                    if (!n) break;
                    h.push(n);
                    q && (h.push(q), r++);
                    if (r >= l) break;
                    if (1e3 < m++) break;
                  } else h.push(n), m++;
              }
              if (!b.length || 2 > a || 256 < a) return !1;
              var g = u(b),
                f = 0;
              g.forEach(function () {
                f++;
              });
              var k = d(b, g);
              b = new p(function (h, l) {
                return x.naturalOrder(h.count(), l.count());
              });
              b.push(k);
              e(b, 0.75 * a);
              for (
                k = new p(function (h, l) {
                  return x.naturalOrder(
                    h.count() * h.volume(),
                    l.count() * l.volume()
                  );
                });
                b.size();

              )
                k.push(b.pop());
              e(k, a - k.size());
              for (a = new w(); k.size(); ) a.push(k.pop());
              return a;
            },
          };
        })();
        B.exports = z.quantize;
      },
      {},
    ],
    2: [
      function (z, B, E) {
        (function () {
          var x,
            p,
            t,
            w = function (d, c) {
              return function () {
                return d.apply(c, arguments);
              };
            },
            u = [].slice;
          window.Swatch = p = (function () {
            function d(c, b) {
              this.rgb = c;
              this.population = b;
            }
            d.prototype.hsl = void 0;
            d.prototype.rgb = void 0;
            d.prototype.population = 1;
            d.yiq = 0;
            d.prototype.getHsl = function () {
              return this.hsl
                ? this.hsl
                : (this.hsl = t.rgbToHsl(
                    this.rgb[0],
                    this.rgb[1],
                    this.rgb[2]
                  ));
            };
            d.prototype.getPopulation = function () {
              return this.population;
            };
            d.prototype.getRgb = function () {
              return this.rgb;
            };
            d.prototype.getHex = function () {
              return (
                "#" +
                (
                  16777216 +
                  (this.rgb[0] << 16) +
                  (this.rgb[1] << 8) +
                  this.rgb[2]
                )
                  .toString(16)
                  .slice(1, 7)
              );
            };
            d.prototype.getTitleTextColor = function () {
              this._ensureTextColors();
              return 200 > this.yiq ? "#fff" : "#000";
            };
            d.prototype.getBodyTextColor = function () {
              this._ensureTextColors();
              return 150 > this.yiq ? "#fff" : "#000";
            };
            d.prototype._ensureTextColors = function () {
              if (!this.yiq)
                return (this.yiq =
                  (299 * this.rgb[0] + 587 * this.rgb[1] + 114 * this.rgb[2]) /
                  1e3);
            };
            return d;
          })();
          window.Vibrant = t = (function () {
            function d(c, b, a) {
              this.swatches = w(this.swatches, this);
              var e;
              "undefined" === typeof b && (b = 64);
              "undefined" === typeof a && (a = 5);
              c = new x(c);
              try {
                var g = c.getImageData();
                var f = g.data;
                var k = c.getPixelCount();
                var h = [];
                for (e = 0; e < k; ) {
                  var l = 4 * e;
                  var r = f[l + 0];
                  var m = f[l + 1];
                  var n = f[l + 2];
                  var q = f[l + 3];
                  125 <= q &&
                    ((250 < r && 250 < m && 250 < n) || h.push([r, m, n]));
                  e += a;
                }
                var v = this.quantize(h, b);
                this._swatches =
                  !1 !== v
                    ? v.vboxes.map(
                        (function (D) {
                          return function (y) {
                            return new p(y.color, y.vbox.count());
                          };
                        })(this)
                      )
                    : [];
                this.maxPopulation = this.findMaxPopulation;
                this.generateVarationColors();
                this.generateEmptySwatches();
              } finally {
                c.removeCanvas();
              }
            }
            d.prototype.quantize = z("quantize");
            d.prototype._swatches = [];
            d.prototype.TARGET_DARK_LUMA = 0.26;
            d.prototype.MAX_DARK_LUMA = 0.45;
            d.prototype.MIN_LIGHT_LUMA = 0.55;
            d.prototype.TARGET_LIGHT_LUMA = 0.74;
            d.prototype.MIN_NORMAL_LUMA = 0.3;
            d.prototype.TARGET_NORMAL_LUMA = 0.5;
            d.prototype.MAX_NORMAL_LUMA = 0.7;
            d.prototype.TARGET_MUTED_SATURATION = 0.3;
            d.prototype.MAX_MUTED_SATURATION = 0.4;
            d.prototype.TARGET_VIBRANT_SATURATION = 1;
            d.prototype.MIN_VIBRANT_SATURATION = 0.35;
            d.prototype.WEIGHT_SATURATION = 3;
            d.prototype.WEIGHT_LUMA = 6;
            d.prototype.WEIGHT_POPULATION = 1;
            d.prototype.VibrantSwatch = void 0;
            d.prototype.MutedSwatch = void 0;
            d.prototype.DarkVibrantSwatch = void 0;
            d.prototype.DarkMutedSwatch = void 0;
            d.prototype.LightVibrantSwatch = void 0;
            d.prototype.LightMutedSwatch = void 0;
            d.prototype.HighestPopulation = 0;
            d.prototype.generateVarationColors = function () {
              this.VibrantSwatch = this.findColorVariation(
                this.TARGET_NORMAL_LUMA,
                this.MIN_NORMAL_LUMA,
                this.MAX_NORMAL_LUMA,
                this.TARGET_VIBRANT_SATURATION,
                this.MIN_VIBRANT_SATURATION,
                1
              );
              this.LightVibrantSwatch = this.findColorVariation(
                this.TARGET_LIGHT_LUMA,
                this.MIN_LIGHT_LUMA,
                1,
                this.TARGET_VIBRANT_SATURATION,
                this.MIN_VIBRANT_SATURATION,
                1
              );
              this.DarkVibrantSwatch = this.findColorVariation(
                this.TARGET_DARK_LUMA,
                0,
                this.MAX_DARK_LUMA,
                this.TARGET_VIBRANT_SATURATION,
                this.MIN_VIBRANT_SATURATION,
                1
              );
              this.MutedSwatch = this.findColorVariation(
                this.TARGET_NORMAL_LUMA,
                this.MIN_NORMAL_LUMA,
                this.MAX_NORMAL_LUMA,
                this.TARGET_MUTED_SATURATION,
                0,
                this.MAX_MUTED_SATURATION
              );
              this.LightMutedSwatch = this.findColorVariation(
                this.TARGET_LIGHT_LUMA,
                this.MIN_LIGHT_LUMA,
                1,
                this.TARGET_MUTED_SATURATION,
                0,
                this.MAX_MUTED_SATURATION
              );
              return (this.DarkMutedSwatch = this.findColorVariation(
                this.TARGET_DARK_LUMA,
                0,
                this.MAX_DARK_LUMA,
                this.TARGET_MUTED_SATURATION,
                0,
                this.MAX_MUTED_SATURATION
              ));
            };
            d.prototype.generateEmptySwatches = function () {
              if (void 0 === this.VibrantSwatch) {
                if (void 0 !== this.DarkVibrantSwatch) {
                  var c = this.DarkVibrantSwatch.getHsl();
                  c[2] = this.TARGET_NORMAL_LUMA;
                  this.VibrantSwatch = new p(d.hslToRgb(c[0], c[1], c[2]), 0);
                }
                void 0 !== this.LightVibrantSwatch &&
                  ((c = this.LightVibrantSwatch.getHsl()),
                  (c[2] = this.TARGET_NORMAL_LUMA),
                  (this.VibrantSwatch = new p(
                    d.hslToRgb(c[0], c[1], c[2]),
                    0
                  )));
              }
              void 0 === this.DarkVibrantSwatch &&
                void 0 !== this.VibrantSwatch &&
                ((c = this.VibrantSwatch.getHsl()),
                (c[2] = this.TARGET_DARK_LUMA),
                (this.DarkVibrantSwatch = new p(
                  d.hslToRgb(c[0], c[1], c[2]),
                  0
                )));
              void 0 === this.LightVibrantSwatch &&
                void 0 !== this.VibrantSwatch &&
                ((c = this.VibrantSwatch.getHsl()),
                (c[2] = this.TARGET_LIGHT_LUMA),
                (this.LightVibrantSwatch = new p(
                  d.hslToRgb(c[0], c[1], c[2]),
                  0
                )));
              void 0 === this.MutedSwatch &&
                void 0 !== this.VibrantSwatch &&
                ((c = this.VibrantSwatch.getHsl()),
                (c[1] = this.TARGET_MUTED_SATURATION),
                (this.MutedSwatch = new p(d.hslToRgb(c[0], c[1], c[2]), 0)));
              void 0 === this.DarkMutedSwatch &&
                void 0 !== this.DarkVibrantSwatch &&
                ((c = this.DarkVibrantSwatch.getHsl()),
                (c[1] = this.TARGET_MUTED_SATURATION),
                (this.DarkMutedSwatch = new p(
                  d.hslToRgb(c[0], c[1], c[2]),
                  0
                )));
              if (
                void 0 === this.LightMutedSwatch &&
                void 0 !== this.LightVibrantSwatch
              )
                return (
                  (c = this.LightVibrantSwatch.getHsl()),
                  (c[1] = this.TARGET_MUTED_SATURATION),
                  (this.LightMutedSwatch = new p(
                    d.hslToRgb(c[0], c[1], c[2]),
                    0
                  ))
                );
            };
            d.prototype.findMaxPopulation = function () {
              var c;
              var b = 0;
              var a = this._swatches;
              var e = 0;
              for (c = a.length; e < c; e++) {
                var g = a[e];
                b = Math.max(b, g.getPopulation());
              }
              return b;
            };
            d.prototype.findColorVariation = function (c, b, a, e, g, f) {
              var k;
              var h = void 0;
              var l = 0;
              var r = this._swatches;
              var m = 0;
              for (k = r.length; m < k; m++) {
                var n = r[m];
                var q = n.getHsl()[1];
                var v = n.getHsl()[2];
                q >= g &&
                  q <= f &&
                  v >= b &&
                  v <= a &&
                  !this.isAlreadySelected(n) &&
                  ((v = this.createComparisonValue(
                    q,
                    e,
                    v,
                    c,
                    n.getPopulation(),
                    this.HighestPopulation
                  )),
                  void 0 === h || v > l) &&
                  ((h = n), (l = v));
              }
              return h;
            };
            d.prototype.createComparisonValue = function (c, b, a, e, g, f) {
              return this.weightedMean(
                this.invertDiff(c, b),
                this.WEIGHT_SATURATION,
                this.invertDiff(a, e),
                this.WEIGHT_LUMA,
                g / f,
                this.WEIGHT_POPULATION
              );
            };
            d.prototype.invertDiff = function (c, b) {
              return 1 - Math.abs(c - b);
            };
            d.prototype.weightedMean = function () {
              var c, b, a;
              var e = 1 <= arguments.length ? u.call(arguments, 0) : [];
              for (c = a = b = 0; c < e.length; ) {
                var g = e[c];
                var f = e[c + 1];
                b += g * f;
                a += f;
                c += 2;
              }
              return b / a;
            };
            d.prototype.swatches = function () {
              return {
                Vibrant: this.VibrantSwatch,
                Muted: this.MutedSwatch,
                DarkVibrant: this.DarkVibrantSwatch,
                DarkMuted: this.DarkMutedSwatch,
                LightVibrant: this.LightVibrantSwatch,
                LightMuted: this.LightMutedSwatch,
              };
            };
            d.prototype.isAlreadySelected = function (c) {
              return (
                this.VibrantSwatch === c ||
                this.DarkVibrantSwatch === c ||
                this.LightVibrantSwatch === c ||
                this.MutedSwatch === c ||
                this.DarkMutedSwatch === c ||
                this.LightMutedSwatch === c
              );
            };
            d.rgbToHsl = function (c, b, a) {
              c /= 255;
              b /= 255;
              a /= 255;
              var e = Math.max(c, b, a);
              var g = Math.min(c, b, a);
              var f = void 0;
              var k = (e + g) / 2;
              if (e === g) f = g = 0;
              else {
                var h = e - g;
                g = 0.5 < k ? h / (2 - e - g) : h / (e + g);
                switch (e) {
                  case c:
                    f = (b - a) / h + (b < a ? 6 : 0);
                    break;
                  case b:
                    f = (a - c) / h + 2;
                    break;
                  case a:
                    f = (c - b) / h + 4;
                }
                f /= 6;
              }
              return [f, g, k];
            };
            d.hslToRgb = function (c, b, a) {
              var e, g;
              var f = (e = g = void 0);
              f = function (k, h, l) {
                0 > l && (l += 1);
                1 < l && --l;
                return l < 1 / 6
                  ? k + 6 * (h - k) * l
                  : 0.5 > l
                  ? h
                  : l < 2 / 3
                  ? k + (h - k) * (2 / 3 - l) * 6
                  : k;
              };
              0 === b
                ? (g = e = f = a)
                : ((b = 0.5 > a ? a * (1 + b) : a + b - a * b),
                  (a = 2 * a - b),
                  (g = f(a, b, c + 1 / 3)),
                  (e = f(a, b, c)),
                  (f = f(a, b, c - 1 / 3)));
              return [255 * g, 255 * e, 255 * f];
            };
            return d;
          })();
          window.CanvasImage = x = (function () {
            function d(c) {
              this.canvas = document.createElement("canvas");
              this.context = this.canvas.getContext("2d");
              document.body.appendChild(this.canvas);
              this.width = this.canvas.width = c.width;
              this.height = this.canvas.height = c.height;
              this.context.drawImage(c, 0, 0, this.width, this.height);
            }
            d.prototype.clear = function () {
              return this.context.clearRect(0, 0, this.width, this.height);
            };
            d.prototype.update = function (c) {
              return this.context.putImageData(c, 0, 0);
            };
            d.prototype.getPixelCount = function () {
              return this.width * this.height;
            };
            d.prototype.getImageData = function () {
              return this.context.getImageData(0, 0, this.width, this.height);
            };
            d.prototype.removeCanvas = function () {
              return this.canvas.parentNode.removeChild(this.canvas);
            };
            return d;
          })();
        }).call(this);
      },
      { quantize: 1 },
    ],
  },
  {},
  [2]
);