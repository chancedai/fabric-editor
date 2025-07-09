// utils.js 中导入
import { emitter, throttle, debounce, render } from "../../__common__/utils";
let binded = false;
export function initNavigator({ canvas, canvasContainer }) {
  if (!canvas || !canvasContainer || binded) {
    console.warn('Missing required parameters.');
    return;
  }
  binded = true;

  const scrollContainer = canvasContainer.parentNode;
  let wrapper = null;
  let navigatorCanvas = null;
  let navigatorCtx = null;
  let navigatorScale = 1;
  let navImage = new Image();
  let isInitialized = false;
  let isDragging = false;
  let isVisible = false;
  let isSyncingScroll = false;  // 防止滚动事件和 vpt 同步互相触发
  let design = {
    width: 100,
    height: 100
  }

  // 可视区与内容间隔宽度
  const viewMargin = 60;

  function syncScrollFromVPT() {
    const vpt = canvas.viewportTransform;
    isSyncingScroll = true; // 防止触发 scroll → vpt 逻辑
    scrollContainer.scrollLeft = -vpt[4] + viewMargin;
    scrollContainer.scrollTop = -vpt[5] + viewMargin;
    requestAnimationFrame(() => {
      isSyncingScroll = false;
    });
  }

  function setupScrollNavigation() {
    const zoom = canvas.getZoom();
    const width = design.width * zoom;
    const height = design.height * zoom;
  
    // 添加 spacer 元素制造滚动条
    let spacer = scrollContainer.querySelector('[data-id="scroll-spacer"]');
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.dataset.id = 'scroll-spacer';
      spacer.style.position = 'absolute';
      spacer.style.top = '0';
      spacer.style.left = '0';
      spacer.style.pointerEvents = 'none';
      spacer.style.zIndex = '-1';
      scrollContainer.appendChild(spacer);
    }
  
    spacer.style.width = `${width}px`;
    spacer.style.height = `${height}px`;
  
    // 滚动控制 VPT
    scrollContainer.addEventListener('scroll', () => {
    if (isSyncingScroll) return;
      const { scrollLeft,scrollTop} = scrollContainer;
    
    // 始终设置，统一加 viewMargin
    const left = -scrollLeft + viewMargin;
    const top = -scrollTop + viewMargin;
    updateVpt(left, top);
    drawNavigator();
  });

    syncScrollFromVPT();  
  }
  function updateScrollSpacer() {
    let w = 0;
    let h = 0;
    if(isVisible){
      const zoom = canvas.getZoom();
      const width = design.width * zoom;
      const height = design.height * zoom;
      w = `${width+2*viewMargin}px`;
      h = `${height+2*viewMargin}px`;
    }
    const spacer = scrollContainer.querySelector('[data-id="scroll-spacer"]');
    if (spacer) {
      spacer.style.width = w;
      spacer.style.height = h;
    }
    
  }
  
  

  function createNavigatorCanvas() {
    const baseClass = "overflow-hidden flex flex-col items-center gap-2 bg-white border border-slate-200 p-2 text-sm text-slate-500 absolute rounded shadow-lg z-1 transition-all duration-300 ease-in-out";
    const classMap = {
      "top-left": "top-13 left-4",
      "top-right": "top-13 right-4",
      "bottom-left": "bottom-13 left-4",
      "bottom-right": "bottom-13 right-4",
    };
    const navigatorPosition = localStorage.getItem('navigatorPosition') || "bottom-right";
    const className = `${baseClass} ${classMap[navigatorPosition]} hidden`;
    wrapper = document.createElement('div');
    wrapper.className = className;

    const btns = {
      "top-left": {
        title: '固定在左上角',
        clz: 'rotate-45',
      },
      "top-right": {
        title: '固定在右上角',
        clz:'rotate-135',
      },
      "bottom-right": {
        title: '固定在右下角',
        clz:'rotate-225',
      },
      "bottom-left": {
        title: '固定在左下角',
        clz:'rotate-315',
      },
    };
    const nodes = render('', () => {
      return `
        <div class="flex items-center gap-1">
          ${Object.entries(btns).map(([key, value]) =>
            `<button title="${value.title}" class="w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center vicon-arrow-left cursor-pointer hover:bg-slate-200 ${value.clz} ${key === navigatorPosition ? 'hidden' : ''}" data-id="${key}"></button>`
          ).join('')}
        </div>
        <canvas data-id="canvas" class="border border-slate-200 cursor-move" style="pointer-events: auto;"></canvas>
      `;
    }, wrapper);

    wrapper.addEventListener('click', (e) => {
      const { id } = e.target.dataset;
      if (classMap[id]) {
        for (const key in btns) {
          if (key === id) nodes[key].classList.add('hidden');
          else nodes[key].classList.remove('hidden');
        }
        wrapper.className = `${baseClass} ${classMap[id]}`;
        localStorage.setItem('navigatorPosition', id);
      }
    });

    navigatorCanvas = nodes.canvas;
    scrollContainer.parentNode.appendChild(wrapper);
    navigatorCtx = navigatorCanvas.getContext('2d');
  }

  function generateImage(format = 'jpg', maxSize = 160) {
    if (format === 'jpg') format = 'jpeg';
  
    const originalVPT = canvas.viewportTransform;
    const originalWidth = exportCanvasConfig.width;
    const originalHeight = exportCanvasConfig.height;
  
    const maxOriginalSide = Math.max(originalWidth, originalHeight);
    const scaleFactor = maxSize / maxOriginalSide;
  
    // 暂时重置 VPT 以避免 zoom 影响导出
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  
    const dataUrl = canvas.toDataURL({
      format,
      multiplier: scaleFactor,
      left: 0,
      top: 0,
      width: originalWidth,
      height: originalHeight,
      quality: 0.8,
    });
  
    // 恢复 VPT
    canvas.setViewportTransform(originalVPT);
  
    return dataUrl;
  }

  function drawNavigator(cb) {
    
    if(isVisible){
      const { width, height} = design;
      const canvasW = width * navigatorScale;
      const canvasH = height * navigatorScale;

      navigatorCanvas.width = canvasW;
      navigatorCanvas.height = canvasH;
      navigatorCtx.clearRect(0, 0, canvasW, canvasH);
      navigatorCtx.drawImage(navImage, 0, 0, canvasW, canvasH);

      const zoom = canvas.getZoom();
      const vpt = canvas.viewportTransform;
      const viewX = (-vpt[4] / zoom) * navigatorScale;
      const viewY = (-vpt[5] / zoom) * navigatorScale;
      const viewW = canvas.getWidth() / zoom * navigatorScale;
      const viewH = canvas.getHeight() / zoom * navigatorScale;

      navigatorCtx.save();
      navigatorCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      navigatorCtx.beginPath();
      navigatorCtx.rect(0, 0, canvasW, canvasH);
      navigatorCtx.rect(viewX, viewY, viewW, viewH);
      navigatorCtx.fill('evenodd');

      navigatorCtx.strokeStyle = '#ffffff';
      navigatorCtx.lineWidth = 2;
      navigatorCtx.strokeRect(viewX, viewY, viewW, viewH);
      navigatorCtx.restore();

      emitter.emit('canvas:vpt');
    }
    

    if(typeof cb == 'function'){
      cb();
    }
  }

  function setupDrag() {
    let dragging = false;
    let lastX = 0, lastY = 0;

    function getCoords(e) {
      return e.touches ? e.touches[0] : e;
    }

    function onStart(e) {
      e.preventDefault();
      dragging = true;
      const pt = getCoords(e);
      lastX = pt.clientX;
      lastY = pt.clientY;
    }
    function onMove(e) {
      if (!dragging) return;
    
      const pt = getCoords(e);
      const dx = (pt.clientX - lastX) / navigatorScale;
      const dy = (pt.clientY - lastY) / navigatorScale;
      lastX = pt.clientX;
      lastY = pt.clientY;
    
      const zoom = canvas.getZoom();
      const canvasW = canvas.getWidth();
      const canvasH = canvas.getHeight();
      const bgW = design.width * zoom;
      const bgH = design.height * zoom;
      
    
      const minVptX = canvasW - bgW - viewMargin;
      const maxVptX = viewMargin;
      const minVptY = canvasH - bgH - viewMargin;
      const maxVptY = viewMargin;
    
      const vpt = canvas.viewportTransform;
    
      // 先更新
      vpt[4] -= dx * zoom;
      vpt[5] -= dy * zoom;
    
      // 再裁剪限制
      const left = Math.min(maxVptX, Math.max(minVptX, vpt[4]));
      const top = Math.min(maxVptY, Math.max(minVptY, vpt[5]));
      updateVpt(left,top);
      drawNavigator();
      syncScrollFromVPT(); // 拖动时同步滚动条
    }
    

    function onEnd() {
      dragging = false;
    }

    navigatorCanvas.addEventListener('mousedown', onStart);
    navigatorCanvas.addEventListener('touchstart', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);

  }

  function setupClickToNavigate() {
    navigatorCanvas.addEventListener('click', (e) => {
      const rect = navigatorCanvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
  
      const zoom = canvas.getZoom();
      const centerX = clickX / navigatorScale;
      const centerY = clickY / navigatorScale;
  
      const canvasW = canvas.getWidth();
      const canvasH = canvas.getHeight();
  
      const targetVptX = canvasW / 2 - centerX * zoom;
      const targetVptY = canvasH / 2 - centerY * zoom;
  
      // ✅ 限制不能超出边距（比如最小边距是 200 像素）
      
      const bgW = design.width * zoom;
      const bgH = design.height * zoom;
  
      const minVptX = canvasW - bgW - viewMargin;
      const maxVptX = +viewMargin;
  
      const minVptY = canvasH - bgH - viewMargin;
      const maxVptY = +viewMargin;  
  
      const left = Math.min(maxVptX, Math.max(minVptX, targetVptX));
      const top = Math.min(maxVptY, Math.max(minVptY, targetVptY));

      updateVpt(left, top);

      drawNavigator();
      syncScrollFromVPT();
    });
  }
  

  const updateImageAndDraw = debounce((cb) => {
    if (!isVisible) return;
    const { width, height } = design;
    const maxSide = 160;
    navigatorScale = maxSide / Math.max(width, height);

    if(navigatorCanvas){
      navigatorCanvas.width = width * navigatorScale;
      navigatorCanvas.height = height * navigatorScale;
    }

    // 2倍清楚点
    navImage.src = generateImage('jpg',maxSide);
    navImage.onload = function(){
      drawNavigator();
      if(typeof cb === 'function'){
        cb();
      }
    };
    navImage.onerror = () => console.error('Failed to load image.');

    
  }, 100);

  const toggleNavigatorVisibility = (shouldShow) => {
    
    
    if (shouldShow && !isVisible) {
      isVisible = true;
      updateImageAndDraw(function(){
        if(isVisible){
          wrapper && wrapper.classList.remove('hidden');
        }
      });
    }
    if(!shouldShow && isVisible){
      isVisible = false;
      // updateImageAndDraw();
      wrapper && wrapper.classList.add('hidden');
    }
  };

  function updateVpt(left,top){

    const { width, height } = design;
    const zoom = canvas.getZoom();
    // const canvasWidth = canvas.getWidth();
    // const canvasHeight = canvas.getHeight();
    const canvasWidth = scrollContainer.clientWidth;
    const canvasHeight  = scrollContainer.clientHeight;
    const vpt = canvas.viewportTransform;
    if(typeof left === 'undefined' || width*zoom <= canvasWidth-2*viewMargin){
      left = (canvasWidth - width * zoom) / 2;
    }
    
    if(typeof top === 'undefined' || height*zoom <= canvasHeight-2*viewMargin){
      top = (canvasHeight - height * zoom) / 2;
    }
    vpt[4] = left;
    vpt[5] = top;
    canvas.setViewportTransform(vpt);
    canvas.requestRenderAll();
  }

  function centerCanvasView() {
    updateVpt();
    syncScrollFromVPT(); 
  }

  function bindFabricEvents() {
    const events = [
      'fabric:object:added', 'fabric:object:removed', 'fabric:object:modified',
      'fabric:selection:created', 'fabric:selection:updated', 'fabric:selection:cleared',
      'canvas:overlay:modified', 'canvas:background:modified'
    ];
    events.forEach(event => emitter.on(event, updateImageAndDraw));
  }

  function setupAltDragPan() {
    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;
    // const viewMargin = 100; // 可根据需要调整
  
    function applyPanConstraint(vpt, dx, dy, zoom) {
      const canvasW = scrollContainer.clientWidth;
      const canvasH = scrollContainer.clientHeight;
      const contentW = design.width * zoom;
      const contentH = design.height * zoom;
  
      const canDragX = contentW + 2 * viewMargin > canvasW;
      const canDragY = contentH + 2 * viewMargin > canvasH;
  
      if (canDragX) {
        const minVptX = canvasW - contentW - viewMargin;
        const maxVptX = viewMargin;
        vpt[4] = Math.min(maxVptX, Math.max(minVptX, vpt[4] + dx));
      }
  
      if (canDragY) {
        const minVptY = canvasH - contentH - viewMargin;
        const maxVptY = viewMargin;
        vpt[5] = Math.min(maxVptY, Math.max(minVptY, vpt[5] + dy));
      }
    }
  
    canvas.on('mouse:down', function (opt) {
      const evt = opt.e;
      if (evt.altKey) {
        isDragging = true;
        canvas.selection = false;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
      }
    });
  
    canvas.on('mouse:move', function (opt) {
      if (!isDragging) return;
  
      const e = opt.e;
      const dx = e.clientX - lastPosX;
      const dy = e.clientY - lastPosY;
      lastPosX = e.clientX;
      lastPosY = e.clientY;
  
      const vpt = canvas.viewportTransform;
      const zoom = canvas.getZoom();
  
      applyPanConstraint(vpt, dx, dy, zoom);
  
      canvas.requestRenderAll();
      drawNavigator();
      syncScrollFromVPT();
    });
  
    canvas.on('mouse:up', function () {
      if (isDragging) {
        isDragging = false;
        canvas.setViewportTransform(canvas.viewportTransform);
        canvas.selection = true;
      }
    });
  }
  
  
  
    // 让选中的对象在可视区中间
    function centerSelection(shouldZoomToFit = false) {
      const object = canvas.getActiveObject();
    if (!object) return;
  
    const zoom = canvas.getZoom();
    // const canvasW = canvas.getWidth();
    // const canvasH = canvas.getHeight();
    const canvasW = scrollContainer.clientWidth;
    const canvasH  = scrollContainer.clientHeight;
  
    const objBounds = object.getBoundingRect(true); // 包含变换后的边界
  
    let targetZoom = zoom;
  
    if (shouldZoomToFit) {
      const scaleX = (canvasW - 2 * viewMargin) / objBounds.width;
      const scaleY = (canvasH - 2 * viewMargin) / objBounds.height;
      targetZoom = Math.min(scaleX, scaleY, zoom); // 不放大，只缩小
      canvas.setZoom(targetZoom);
    }
  
    const centerX = object.left + object.width / 2 * object.scaleX;
    const centerY = object.top + object.height / 2 * object.scaleY;
  
    const vptX = canvasW / 2 - centerX * targetZoom;
    const vptY = canvasH / 2 - centerY * targetZoom;
  
    const bgW = design.width * targetZoom;
    const bgH = design.height * targetZoom;
  
    const minVptX = canvasW - bgW - viewMargin;
    const maxVptX = +viewMargin;
    const minVptY = canvasH - bgH - viewMargin;
    const maxVptY = +viewMargin;
  
    const left = Math.min(maxVptX, Math.max(minVptX, vptX));
    const top = Math.min(maxVptY, Math.max(minVptY, vptY));
    
      // 更新 VPT 平移
      updateVpt(left, top);
    
      drawNavigator();         // 更新导航器状态
      syncScrollFromVPT();     // 如果你有滚动条或缩放同步，调用它
    }
  function maybeInitNavigator(zoom) {
    zoom = zoom || canvas.getZoom();
    const { width, height } = design;
    const { clientWidth, clientHeight } = scrollContainer;
    const isCanvasSmallerThanView = width*zoom <= (clientWidth-2*viewMargin) && height*zoom <= (clientHeight-2*viewMargin);
    centerCanvasView();
    if (isCanvasSmallerThanView) {
      // centerCanvasView();
    }else{
      // centerCanvasView();
      if (!isInitialized) {
        isInitialized = true;
        createNavigatorCanvas();
        setupDrag();
        setupClickToNavigate();
        bindFabricEvents();
        setupScrollNavigation();
        setupAltDragPan(); // 初始化 Alt 拖动功能
      }
    }
    toggleNavigatorVisibility(!isCanvasSmallerThanView);
    // 缩放spacer大小还有滚动条位置肯定变了
    updateScrollSpacer(); 
    syncScrollFromVPT();
    // 缩放导航器的可视区肯定也变了
    drawNavigator();
    // setupScrollNavigation();
  }


  

  emitter.on("canvas:resize", ({ width, height })=>{
    design = {
      width,
      height
    }
    maybeInitNavigator();
  });

  emitter.on("canvas:zoom", debounce(({zoom}) => maybeInitNavigator(zoom), 16));


  emitter.on("layers:object:activated", function () {
    centerSelection(true);
  });
  
  
  new ResizeObserver(throttle(() => {
    maybeInitNavigator()
  }, 100)).observe(scrollContainer);


}