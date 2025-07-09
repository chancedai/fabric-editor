class LazyLoad {
  constructor(options = {}) {
    this.selector = options.selector || 'img[data-src]';
    this.root = options.root || null;
    this.threshold = options.threshold || 0.1;
    this.init();
  }

  init() {
    this.observer = new IntersectionObserver(this.loadImage.bind(this), {
      root: this.root,
      threshold: this.threshold,
    });

    // 先绑定已有图片
    this.observeImages(document.querySelectorAll(this.selector));

    // 监听新插入的图片
    this.observeNewImages();
  }

  observeImages(images) {
    images.forEach(img => {
      if (!img.dataset.lazyLoaded) {
        this.observer.observe(img);
        img.dataset.lazyLoaded = 'true'; // 防止重复绑定
      }
    });
  }

  observeNewImages() {
    const mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            // 如果直接插入的是图片
            if (node.matches(this.selector)) {
              this.observeImages([node]);
            }
            // 如果插入的是容器，去找里面的图片
            else if (node.querySelectorAll) {
              const imgs = node.querySelectorAll(this.selector);
              if (imgs.length) {
                this.observeImages(imgs);
              }
            }
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  loadImage(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        img.removeAttribute('data-lazy-loaded');
        this.observer.unobserve(img); // 解绑监听，提升性能
      }
    });
  }
}

// 初始化
new LazyLoad();
