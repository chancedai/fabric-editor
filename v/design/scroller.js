import $ from "jquery";
class Scroller {
    constructor(a) {
      this.config = Scroller.mergeSettings(a);
      this.$scroller = $(this.config.element);
      if (0 == this.$scroller.length) throw Error("Scroller: Element not found!");
      this.$slides = $(this.config.slides);
      if (0 == this.$slides.length) throw Error("Scroller: Slides not found!");
      this.resizeHandler = this.resizeHandler.bind(this);
      var b = this;
      this.$scroller.on("refresh", function () {
        b.resizeHandler();
      });
      this.init();
      this.resizeHandler();
    }
    init() {
      var a = this;
      this.config.showPrevNext &&
        ((this.$prevBtn = $("<div>", { class: "arrow prev" })
          .on("click", function () {
            var b = $(".slide:first-child", a.$slides).outerWidth(!0);
            a.$slides[0].scrollLeft -= b;
          })
          .on("dblclick", function () {
            a.$slides[0].scrollLeft = 0;
          })
          .appendTo(this.$scroller)),
        (this.$nextBtn = $("<div>", { class: "arrow next" })
          .on("click", function () {
            var b = $(".slide:first-child", a.$slides).outerWidth(!0);
            a.$slides[0].scrollLeft += b;
          })
          .on("dblclick", function () {
            a.$slides[0].scrollLeft = a.$slides[0].scrollWidth;
          })
          .appendTo(this.$scroller)),
        window.addEventListener("resize", this.resizeHandler),
        window.addEventListener("orientationchange", this.resizeHandler),
        this.$slides[0].addEventListener("scroll", this.resizeHandler));
      this.config.oninit.call(this);
    }
    resizeHandler() {
      var a = this.$slides[0],
        b = this.$prevBtn,
        c = this.$nextBtn;
      0 != a.scrollLeft || b.hasClass("disabled")
        ? 0 < a.scrollLeft && b.hasClass("disabled") && b.removeClass("disabled")
        : b.addClass("disabled");
      a.scrollLeft + a.offsetWidth != a.scrollWidth || c.hasClass("disabled")
        ? a.scrollLeft + a.offsetWidth < a.scrollWidth &&
          c.hasClass("disabled") &&
          c.removeClass("disabled")
        : c.addClass("disabled");
    }
    destroy() {
      this.config.showPrevNext &&
        (this.$nextBtn.remove(),
        this.$prevBtn.remove(),
        window.removeEventListener("resize", this.resizeHandler),
        window.removeEventListener("orientationchange", this.resizeHandler),
        this.$slides[0].removeEventListener("scroll", this.resizeHandler));
    }
    static mergeSettings(a) {
      const b = {
        element: null,
        slides: null,
        showPrevNext: !0,
        oninit: () => {},
      };
      for (const c in a) b[c] = a[c];
      return b;
    }
  }

  export default Scroller;