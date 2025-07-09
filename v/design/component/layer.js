
import { delegator, emitter, showInfo, throttle,render, showError } from "../../__common__/utils.js";
import { toggleContentAreaByType,toggleSidebar } from "./sidebar.js";
import Sortable from 'sortablejs';
import { canvas, exportCanvasConfig, debouncedCommitChange } from "../canvas.js";
import { highlightObject, unhighlightObject } from "../canvas/highlight.js";

const CanvasVisibilityManager = (function () {
  let originalState = {};
  
  // 假设用户提供了 throttle 方法
  function throttle(fn, delay) {
      let lastCall = 0;
      return function (...args) {
          const now = Date.now();
          if (now - lastCall >= delay) {
              lastCall = now;
              fn(...args);
          }
      };
  }

  // 使用 throttle 限制 renderAll 频率（比如 100ms）
  const throttledRender = throttle((canvas) => canvas.renderAll(), 100);

  function saveCanvasState(canvas) {
      originalState = {
          objects: canvas.getObjects().map(obj => ({
              id: obj,
              visible: obj.visible,
              stateful: obj.stateful
          })),
          backgroundImage: canvas.backgroundImage,
          backgroundColor: canvas.backgroundColor,
          overlayImage: canvas.overlayImage,
          overlayColor: canvas.overlayColor
      };
  }

  function showOnlyBackground(canvas) {
      saveCanvasState(canvas);

      canvas.getObjects().forEach(obj => {
          obj.stateful = false;
          obj.visible = false;
      });

      if (canvas.overlayImage) {
          canvas.overlayImage.visible = false;
      }
      if (canvas.overlayColor) {
          canvas.overlayColor = '';
      }

      throttledRender(canvas);
  }

  function showOnlyOverlay(canvas) {
      saveCanvasState(canvas);

      canvas.getObjects().forEach(obj => {
          obj.stateful = false;
          obj.visible = false;
      });

      if (canvas.backgroundImage) {
          canvas.backgroundImage.visible = false;
      }
      if (canvas.backgroundColor) {
          canvas.backgroundColor = '';
      }

      throttledRender(canvas);
  }

  function restoreCanvas(canvas) {
      if (!originalState.objects) return;

      originalState.objects.forEach(({ id, visible, stateful }) => {
          id.visible = visible;
          id.stateful = stateful;
      });

      canvas.backgroundImage = originalState.backgroundImage;
      canvas.backgroundColor = originalState.backgroundColor;
      canvas.overlayImage = originalState.overlayImage;
      canvas.overlayColor = originalState.overlayColor;

      if (canvas.backgroundImage) {
          canvas.backgroundImage.visible = true;
      }
      if (canvas.overlayImage) {
          canvas.overlayImage.visible = true;
      }

      throttledRender(canvas);
  }

  return {
      showOnlyBackground,
      showOnlyOverlay,
      restoreCanvas
  };
})();




function generateLayerImage(canvas, type) {
  // 每个 type（background 或 overlay）都有自己的缓存
  let cache = null;
  let lastColor = null;
  let lastImageSrc = null;
  let lastTargetWidth = null;
  let lastTargetHeight = null;

  return function (exportCanvasConfig = {}, outputSize = {}) {
      // 获取当前颜色和图片
      const currentColor = type === "background" ? canvas.backgroundColor : canvas.overlayColor;
      const currentImage = type === "background" ? canvas.backgroundImage : canvas.overlayImage;
      const currentImageSrc = currentImage ? currentImage.getSrc() : null;

      // 原始画布大小
      const originalWidth = exportCanvasConfig.width || canvas.width;
      const originalHeight = exportCanvasConfig.height || canvas.height;

      // 目标输出大小
      let targetWidth = outputSize.width || null;
      let targetHeight = outputSize.height || null;

      // 计算等比例缩放
      if (!targetWidth && targetHeight) {
          targetWidth = (originalWidth / originalHeight) * targetHeight;
      } else if (targetWidth && !targetHeight) {
          targetHeight = (originalHeight / originalWidth) * targetWidth;
      } else if (targetWidth && targetHeight) {
          // 保证图片完整显示（contain）
          const scale = Math.min(targetWidth / originalWidth, targetHeight / originalHeight);
          targetWidth = originalWidth * scale;
          targetHeight = originalHeight * scale;
      } else {
          targetWidth = originalWidth;
          targetHeight = originalHeight;
      }

      // 如果内容和尺寸都没变化，返回缓存
      if (cache &&
          lastColor === currentColor &&
          lastImageSrc === currentImageSrc &&
          lastTargetWidth === targetWidth &&
          lastTargetHeight === targetHeight) {
          return cache;
      }

      // 创建 Canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = targetWidth;
      tempCanvas.height = targetHeight;
      const ctx = tempCanvas.getContext('2d');

      // 填充颜色
      if (currentColor) {
          ctx.fillStyle = currentColor;
          ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      }

      // 绘制图片
      if (currentImage) {
          const imgCanvas = currentImage.toCanvasElement();

          // 计算缩放比例（保证不会放大）
          const scale = Math.min(targetWidth / imgCanvas.width, targetHeight / imgCanvas.height, 1);
          const drawWidth = imgCanvas.width * scale;
          const drawHeight = imgCanvas.height * scale;
          const offsetX = (targetWidth - drawWidth) / 2;
          const offsetY = (targetHeight - drawHeight) / 2;

          ctx.drawImage(imgCanvas, offsetX, offsetY, drawWidth, drawHeight);
      }

      // 生成 DataURL 并缓存
      cache = tempCanvas.toDataURL('image/png');
      lastColor = currentColor;
      lastImageSrc = currentImageSrc;
      lastTargetWidth = targetWidth;
      lastTargetHeight = targetHeight;

      return cache;
  };
}

// 分别创建背景和前景的处理函数
const getBackgroundAsImage = generateLayerImage(canvas, "background");
const getOverlayAsImage = generateLayerImage(canvas, "overlay");


// dataset 不能存储对象，在这里建立一个对象映射
const tempObjectMap = {};

const container = document.querySelector('#layersPanel');

// objBringForward: () => {
//   canvas.bringForward(object);
//   debouncedCommitChange();
// },
// objSendBackwards: () => {
//   canvas.sendBackwards(object);
//   debouncedCommitChange();
// },
// objBringTop: () => {
//   canvas.bringToFront(object);
//   debouncedCommitChange();
// },
// objSendBottom: () => {
//   canvas.sendToBack(object);
//   debouncedCommitChange();
// },
// {
//   title: "上移一层",
//   iconClass: "vicon-move-up",
//   type: "objSendBackwards"
// },
// {
//   title: "下移一层",
//   iconClass: "vicon-move-up rotate-180",
//   type: "objBringForward"
// },
// {
//   type: 'hr',
// },
// {
//   title: "移至顶层",
//   iconClass: "vicon-move-top",
//   type: "objBringTop"
// },
// {
//   title: "移至底层",
//   iconClass: "vicon-move-top rotate-180",
//   type: "objSendBottom"
// },
const refs = render('',(d,e,f,_if)=>{
  return `
  <div class="w-60 h-full overflow-hidden" data-id="wrapper">
    <div class="w-60 flex flex-col h-full">
      <h3 class="flex items-center justify-between p-2 border-b-2 border-slate-200 sticky top-0 bg-white z-50">
        <div class="text-sm font-semibold" data-id="title">图层</div>
        <button data-id="close" class="vicon-close btn-icon" title="关闭"></button>
      </h3>
      

      <!-- overlay -->
      <div data-id="overlay" class="bg-slate-100 m-2 px-2 py-1 rounded-md flex items-center justify-between cursor-pointer border-2 border-slate-200 hover:border-purple-300">
        <div class="flex items-center mr-2">
        <button class="vicon-overlay p-1 hover:bg-slate-200 rounded-md" title="编辑"></button>
        <img class="object-contain bg-checkerboard rounded mx-2" data-id="overlayImage" src=""><span class="text-xs">前景</span>
        </div>
      </div>
      <!-- 图层列表 -->
      <div class="bg-slate-100 flex-1 space-y-2 p-2 border-t border-b my-2 border-slate-200 overflow-hidden hover:overflow-y-auto">
        <ul class="space-y-2 w-62" data-id="layers">
        </ul>
      </div>
      <!-- background -->
      <div data-id="background" class="bg-slate-100 m-2 px-2 py-1 rounded-md flex items-center justify-between cursor-pointer border-2 border-slate-200 hover:border-purple-300">
        <div class="flex items-center mr-2">
        <button class="vicon-texture p-1 hover:bg-slate-200 rounded-md" title="编辑"></button>
        <img class="object-contain bg-checkerboard rounded mx-2" data-id="backgroundImage" src=""><span class="text-xs">背景</span>
        </div>
      </div>
      <!-- 图层操作 两列 -->
      <div data-id="layerOperation" class="grid grid-cols-2 gap-2 p-2 hidden">
        <button class="btn-secondary btn-sm" data-id="bringForward"><i class="mr-1 text-xl vicon-move-up rotate-180"></i>上移一层</button>
        <button class="btn-secondary btn-sm" data-id="sendBackwards"><i class="mr-1 text-xl vicon-move-up"></i>下移一层</button>
        <button class="btn-secondary btn-sm" data-id="bringTop"><i class="mr-1 text-xl vicon-move-top"></i>移至顶层</button>
        <button class="btn-secondary btn-sm" data-id="sendBottom"><i class="mr-1 text-xl vicon-move-top rotate-180"></i>移至底层</button>
      </div>
    </div>
  </div>`},container);
// 滚动条位置
let lastScrollTop = 0;
  const layers = refs.layers;

if (layers) {
  renderCanvasLayers(canvas, layers);
}


function toggleLayersPanel(trigger) {
  container.classList.toggle("hidden");
  if (trigger && trigger._tippy){
    trigger._tippy.setContent(container.classList.contains("hidden") ? "展开图层" : "收起图层");
  }
}

// layersCollapse.addEventListener("click", () => {
//   toggleLayersPanel();
// });
refs.close.addEventListener("click", () => {
  toggleLayersPanel();
});

emitter.on('layer:toggle', (trigger) => {
  toggleLayersPanel(trigger);
});

emitter.on('component:layer', (trigger) => {
  toggleLayersPanel(trigger);
});

refs.layerOperation.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target) return;

  const object = canvas.getActiveObject();
  if (!object) {
      showInfo('请先选择一个对象');
      return;
  }

  const operationType = target.dataset.id;
  switch (operationType) {
      case 'bringForward':
          canvas.bringForward(object);
          renderCanvasLayers(canvas, layers);
          break;
      case 'sendBackwards':
          canvas.sendBackwards(object);
          break;
      case 'bringTop':
          canvas.bringToFront(object);
          break;
      case 'sendBottom':
          canvas.sendToBack(object);
          break;
      default:
          break;
  }
  // renderCanvasLayers(canvas, layers);
  debouncedCommitChange();
});






/**
 * 管理和渲染图形对象层的显示。
 * @param {Object} canvas - 画布对象，用于获取和操作图形对象。
 * @param {HTMLElement} layers - 层列表的DOM容器，用于展示图层。
 */
function renderCanvasLayers(canvas, layers) {

  // 监听layers 滚动事件
  layers.parentNode.addEventListener('scroll', function(e) {
    lastScrollTop = e.target.scrollTop;
  });


  const renderLayers = throttle(() => {
    // 如果没有正在绘制图形且没有选择状态
    if (!isProcessing && !canvas.isDrawingShapes) {
        layers.innerHTML = '';  // 清空当前图层列表

        const activeObject = canvas.getActiveObject();  // 获取当前选中的图形对象
        const allObjects = canvas.getObjects();  // 获取所有图形对象
        const totalObjects = allObjects.length;

        // 显示图层操作按钮
        if (activeObject) {
            refs.layerOperation.classList.remove('hidden');
        } else {
            refs.layerOperation.classList.add('hidden');
        }

        let selectedLayerItem = null;  // 用来保存选中的图层项

        // 遍历所有图形对象
        for (let i = totalObjects - 1; i >= 0; i--) {
            const currentObject = allObjects[i];
            if (currentObject._isHighlightGhost) continue;  // 跳过高亮对象
            const objectWidth = currentObject.getScaledWidth();
            const objectHeight = currentObject.getScaledHeight();

            // 将对象渲染为canvas元素，并缩放以适应
            currentObject.toCanvasElement({
                multiplier: Math.min(30 / objectWidth, 30 / objectHeight, 1),
                withoutTransform: false
            });

            // 如果对象可见，更新对应的可见性
            let objectElement;
            if (currentObject.visible) {
                objectElement = currentObject.toCanvasElement({
                    multiplier: Math.min(150 / objectWidth, 40 / objectHeight, 1),
                    withoutTransform: false
                });
                objectMap[currentObject.uid] = objectElement;  // 存储已渲染的元素
            } else {
                objectElement = objectMap[currentObject.uid];
            }

            // 如果对象不可选择，显示锁定图标
            let lockIcon = null;
            if (!currentObject.selectable) {
                lockIcon = createLockIcon(currentObject);
            }

            // 渲染对象到层列表
            const layerItem = document.createElement('li');
            const layerItemClass = activeObject === currentObject ? ['border-purple-600', 'hover:border-purple-600']:['border-slate-300','hover:border-purple-500'];
            layerItemClass.push('w-56','bg-slate-300','px-2', 'py-1', 'flex-1', 'rounded-md', 'flex', 'items-center', 'justify-between', 'cursor-pointer', 'border-2');
            layerItem.classList.add(...layerItemClass);
            const objectId = i;
            tempObjectMap[objectId] = currentObject;
            layerItem.dataset.objectId = objectId;

            const layerContent = document.createElement('div');
            layerContent.classList.add('flex', 'items-center','mr-2');

            const visibilityButton = document.createElement('button');
            let visibilityButtonClass = [ 'p-1', 'hover:bg-slate-200', 'rounded-md'];
            if (currentObject.visible) {
                visibilityButtonClass.push('vicon-visibility');
                visibilityButton.title = '隐藏对象';
            } else {
                visibilityButtonClass.push('vicon-visibility-off');
                visibilityButton.title = '显示对象';
            }
            visibilityButton.classList.add(...visibilityButtonClass);

            visibilityButton.addEventListener('click', () => {
                currentObject.set('visible', !currentObject.visible);
                canvas.requestRenderAll();
                visibilityButton.classList.toggle('vicon-visibility');
                visibilityButton.classList.toggle('vicon-visibility-off');
                visibilityButton.title = currentObject.visible ? '隐藏对象' : '显示对象';
            });

            const moreButton = document.createElement('button');
            moreButton.classList.add('vicon-drag', 'p-1', 'hover:bg-slate-200', 'rounded-md','mr-2','cursor-move');
            moreButton.title = '更多操作';

            const layerImageWrapper = document.createElement('div');
            layerImageWrapper.classList.add('bg-slate-300','flex','flex-1' , 'items-center', 'flex-shrink-0','object-contain','w-30','h-8','p-1');
            
            const layerImage = document.createElement('img');
            layerImage.classList.add('object-contain','w-full','h-full');
            // Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported.
            layerImage.crossOrigin = 'anonymous';
            try {
              layerImage.src = objectElement.toDataURL();
            } catch (error) {
              showError('Failed to convert objectElement to DataURL');
              console.error('Failed to convert objectElement to DataURL:', error);
            }
            layerImageWrapper.appendChild(layerImage);

            layerContent.appendChild(moreButton);
            layerContent.appendChild(layerImageWrapper);

            const layerActions = document.createElement('div');
            layerActions.classList.add('flex', 'items-center','flex-shrink-0');

            if (lockIcon) {
                layerActions.appendChild(lockIcon);
            }

            layerActions.appendChild(visibilityButton);

            layerItem.appendChild(layerContent);
            layerItem.appendChild(layerActions);

            layers.appendChild(layerItem);

            // 如果这是选中的图层，保存它
            if (activeObject === currentObject) {
                selectedLayerItem = layerItem;
            }
        }

        layers.parentNode.scrollTop = lastScrollTop;
        // 如果有选中的图层，滚动到视口内
        if (selectedLayerItem && !isProcessing){
            selectedLayerItem.scrollIntoView({
                // behavior: 'smooth', // 平滑滚动
                block: 'center' // 将选中的项居中
            });
        }
    }
}, 100);


  let isProcessing = false;  // 防止重复操作
  const objectMap = {};  // 存储对象的元素映射


  emitter.on("fabric:selection:created", renderLayers);
  emitter.on("fabric:selection:updated", renderLayers);
  emitter.on("fabric:selection:cleared", renderLayers);
  emitter.on("fabric:object:added", renderLayers);
  emitter.on("fabric:object:modified", renderLayers);

  function clickItem(target){
      isProcessing = true;
      // const target = event.target.closest('li');
      const object = tempObjectMap[target.dataset.objectId];
      const activeClass = ['border-purple-600', 'hover:border-purple-600'];
      const normalClass = ['border-slate-300', 'hover:border-purple-600'];

      // 取消其他图层的选中状态
      const activeItems = layers.querySelectorAll('li.' + activeClass[0]);
      activeItems.forEach(item => {
        item.classList.remove(...activeClass);
        item.classList.add(...normalClass);
      });
      

      if (object.selectable) {
          target.classList.remove(...normalClass);
          target.classList.add(...activeClass);
          canvas.setActiveObject(object).requestRenderAll();
          emitter.emit('layers:object:activated', {
            object
          })
          refs.layerOperation.classList.remove('hidden');
      }else{
        showInfo('要选择对象，请先解锁');
      }

      // 使用requestAnimationFrame确保操作结束后恢复状态
      setTimeout(() => {
          isProcessing = false;
      }, 150);
      unhighlightObject();
  }

  delegator.on(layers, 'click', '.vicon-drag',function(event,target){
    // const item = target.closest('li');
    // const object = tempObjectMap[item.dataset.objectId];
    emitter.emit('context-menu:rightMenu:show',event);
  });

  // 处理图层点击事件
  delegator.on(layers, 'click','li',function(event,target){
  // layers.addEventListener('click', (event) => {
      // if (event.target.closest('li')) {
          clickItem(target);
      // }
  });
  delegator.on(layers, 'mousedown','li',function(event,target){
    clickItem(target);
    if(event.button === 2){
      emitter.emit('context-menu:rightMenu:show',event);
      // event.preventDefault();
    }
  });
  delegator.on(layers, 'contextmenu', 'li', function(event, target) {
    event.preventDefault();
  });

//   鼠标划过图层时高亮对应的对象，鼠标移出时取消高亮
  (function(){
    let currentHoveredItem = null;

    layers.addEventListener('mouseover', (event) => {
        const li = event.target.closest('li');
        if (!li || !layers.contains(li) || li === currentHoveredItem) return;

        currentHoveredItem = li;
        const { objectId } = li.dataset;
        const object = tempObjectMap[objectId];
        if (object) highlightObject(object);
    });

    layers.addEventListener('mouseout', (event) => {
        const toElement = event.relatedTarget;
        const li = event.target.closest('li');

        // 如果还在当前 hovered 的 li 或其子元素中，则不触发 unhighlight
        if (!li || !currentHoveredItem || !toElement) return;
        if (currentHoveredItem.contains(toElement)) return;

        currentHoveredItem = null;
        unhighlightObject();
    });
    // 在画布中高亮，同步高亮列表对应的项
    emitter.on("canvas:highlight", ({target}) => {
        const objectId = Object.keys(tempObjectMap).find(key => tempObjectMap[key] === target);
        if (objectId) {
            const li = layers.querySelector(`li[data-object-id="${objectId}"]`);
            if (li) {
                li.classList.remove('border-slate-300');
                li.classList.add('border-purple-500');
            }
        }
    });

    emitter.on("canvas:unhighlight", () => {
        const activeItems = layers.querySelectorAll('li.border-purple-500');
        activeItems.forEach(item => {
            item.classList.remove('border-purple-500');
            item.classList.add('border-slate-300');
        });
    });


  })();

  // 初始化图层的排序功能
  initializeLayerSorting(layers);
}


/**
* 创建锁定图标，用于显示不可选择的对象
* @param {Object} object - 目标图形对象
* @returns {HTMLElement} - 锁定图标的HTML元素
*/
function createLockIcon(object) {
  const lockIcon = document.createElement('button');
  lockIcon.classList.add('vicon-lock', 'p-1', 'hover:vicon-lock-open', 'rounded-md');
  lockIcon.title = '解锁对象';
  lockIcon.addEventListener('click', () => {
      object.selectable = true;
      canvas.setActiveObject(object);
      canvas.fire("object:unlocked")
      canvas.requestRenderAll();
      debouncedCommitChange();
  });
  return lockIcon;
}

/**
* 初始化图层的排序功能
* @param {HTMLElement} layers - 层容器的DOM对象
*/
function initializeLayerSorting(layers) {
  new Sortable(layers, {
      draggable: 'li',
      // handle: '.vicon-drag',  // 设置可拖动的元素
      onEnd: (evt) => {
          const items = layers.querySelectorAll('li');
          items.forEach((item, index) => {
              const object = tempObjectMap[item.dataset.objectId];
              object.moveTo(items.length - index - 1);  // 调整图层顺序
          });
      }
  });
}

// hover overlay 时只显示 overlay，hover background 时只显示 background
refs.overlayImage.addEventListener('mouseenter', () => {
  CanvasVisibilityManager.showOnlyOverlay(canvas);
});

refs.backgroundImage.addEventListener('mouseenter', () => {
  CanvasVisibilityManager.showOnlyBackground(canvas);
});

refs.overlayImage.addEventListener('mouseleave', () => {
  CanvasVisibilityManager.restoreCanvas(canvas);
});

refs.backgroundImage.addEventListener('mouseleave', () => {
  CanvasVisibilityManager.restoreCanvas(canvas);
});

refs.overlay.addEventListener('click', () => {
  toggleSidebar();
  toggleContentAreaByType('overlays');
});

refs.background.addEventListener('click', () => {
  toggleSidebar();
  toggleContentAreaByType('backgrounds');
});

const renderOverlay = throttle((image) => {
  const overlayImage = getOverlayAsImage(exportCanvasConfig, { height: 32 });
  refs.overlayImage.src = overlayImage;
}
, 100);

const renderBackground = throttle((image) => {
  const backgroundImage = getBackgroundAsImage(exportCanvasConfig, { height: 32 });
  refs.backgroundImage.src = backgroundImage;
}
, 100);

renderOverlay();
renderBackground();

canvas.on('after:render', () => {
  renderOverlay();
  renderBackground();
});

emitter.on('canvas:overlay:modified', (image) => {
  renderOverlay(image);
});

emitter.on('canvas:background:modified', (image) => {
  renderBackground(image);
});



