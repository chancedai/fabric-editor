import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import mitt from 'mitt';

// 动态导入模块：使用相对路径
const componentModules = import.meta.glob('../design/component/*.js');
const operationModules = import.meta.glob('../design/operation/*.js');
const menuOperationModules = import.meta.glob('../design/menu-operation/*.js');
const contentModules = import.meta.glob('../design/content/*.js');

export const jsCache = {};

export function loadModule(modulesMap, dir, name, callback) {
  const path = `../design/${dir}/${name}.js`;
  if (!jsCache[path]) {
    jsCache[path] = true;
    const importer = modulesMap[path];
    if (importer) {
      importer().then((m) => {
        callback && callback(m);
      }).catch((err) => {
        console.error('模块加载失败:', path, err);
      });
    } else {
      console.warn(`未找到模块: ${path}`);
    }
  }
}

export function jsImport(type, name, callback) {
  if(type === 'component') {
    loadComponent(name, callback);
  } else if(type === 'operation') {
    loadOperation(name, callback);
  } else if(type === 'menu-operation') {
    loadMenuOperation(name, callback);
  } else if(type === 'content') {
    loadContent(name, callback);
  }
}


// 加载操作模块
export function loadOperation(operation, callback) {
  loadModule(operationModules, 'operation', operation, callback);
}

// 加载菜单操作模块
export function loadMenuOperation(operation, callback) {
  loadModule(menuOperationModules, 'menu-operation', operation, callback);
}

// 加载组件模块
export function loadComponent(component, callback) {
  loadModule(componentModules, 'component', component, callback);

  // 特殊处理
  if (component === 'context-menu') {
    emitter.emit('context-menu:toggle');
  }
}

export function loadContent(content, callback) {
  loadModule(contentModules, 'content', content, callback);
}



class CachedMitt {
  constructor() {
    this.emitter = mitt();
    this.eventHistory = {};
    // 随机生成一个 uuid
    this.uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  emit(event, ...args) {
    if (!this.eventHistory[event]) {
      this.eventHistory[event] = [];
    }
    this.eventHistory[event].push(args);
    this.emitter.emit(event, ...args);
  }

  on(event, listener) {
    this.emitter.on(event, listener);
    if (this.eventHistory[event]) {
      this.eventHistory[event].forEach(args => listener(...args));
    }
  }
  // 使用 on 和 off 实现 once，及历史事件的回放
  once(event, listener) {
    const onceListener = (...args) => {
      listener(...args);
      this.emitter.off(event, onceListener);
    };
    this.on(event, onceListener);

    if (this.eventHistory[event]) {
      onceListener(...this.eventHistory[event][0]);
    }

  }
  // 获取数据
  get(event, listener, type) {
    // this.emitter.once(event, listener);
    this.once(this.uuid+'_'+event, listener);
    this.emitter.emit(this.uuid+'-'+event, type);
  }
  // 设置数据
  set(event, listener) {
    function send(data) {
      this.emitter.emit(this.uuid+'_'+event, data);
    }
    this.emitter.on(this.uuid+'-'+event, (type) => {
      listener(send.bind(this), type);
    });
  }
}



export const emitter = new CachedMitt();

// get/set 示例
// emitter.set('test', (send, data) => {
//   console.log('data:', data);
//   setTimeout(() => {
//     send('hello');
//   }, 1000);
// });

// emitter.get('test', (data) => {
//   console.log('get data:', data);
// }, 'world');

/**
 * 节流函数：限制函数在 delay 毫秒内只执行一次（可控制是否立即执行或结束时再执行）。
 * @param {Function} fn - 要节流执行的函数
 * @param {number} delay - 节流间隔时间（毫秒）
 * @param {Object} options - 控制是否首尾执行：{ leading: true, trailing: true }
 * @returns {Function} - 节流后的函数
 */
export function throttle(fn, delay = 100, options = {}) {
  let timer = null;
  let lastArgs = null;
  let lastThis = null;
  const { leading = true, trailing = true } = options;
  let lastCallTime = 0;

  return function (...args) {
    const now = Date.now();
    lastArgs = args;
    lastThis = this;

    const invoke = () => {
      lastCallTime = now;
      fn.apply(lastThis, lastArgs);
    };

    if (!timer && leading) {
      invoke();
    }

    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        if (trailing && now - lastCallTime >= delay) {
          invoke();
        }
      }, delay);
    }
  };
}



/**
 * 防抖函数：在 delay 毫秒内只执行最后一次调用，或选择首次立即执行一次。
 * @param {Function} fn - 要防抖执行的函数
 * @param {number} delay - 延迟执行的时间（毫秒）
 * @param {boolean} immediate - 是否在首次调用时立即执行一次
 * @returns {Function} - 防抖后的函数
 */
export function debounce(fn, delay = 100, immediate = false) {
  let timer = null;
  let lastArgs = null;
  let lastThis = null;

  return function (...args) {
    lastArgs = args;
    lastThis = this;

    const callNow = immediate && !timer;

    clearTimeout(timer);

    timer = setTimeout(() => {
      timer = null;
      if (!immediate) {
        fn.apply(lastThis, lastArgs);
      }
    }, delay);

    if (callNow) {
      fn.apply(lastThis, lastArgs);
    }
  };
}


export const render = (function(){
  // ✅ 内置模板工具
  const row = (label, id, className, rowClassName) => `
    <div class="flex items-center space-x-4${rowClassName?' '+ rowClassName:''}">
      ${label?`<div class="shrink-0 whitespace-nowrap text-gray-700">${label}</div>`:''}
      <div class="${className || 'flex-1'}" data-id="${id}"></div>
    </div>`;
  
  const titleRow = (title, id, className) => `
    <div class="flex items-center space-x-4">
      <h4 class="font-medium whitespace-nowrap">${title}</h4>
      ${id?`<div class="${className}"  data-id="${id}"></div>`:''}
    </div>`;

  const section = (id, rows) => `
    <div data-id="${id}" class="space-y-4 border-y-1 border-gray-200 border-opacity-50 p-4 -mt-[1px] relative hover:bg-slate-50">
      ${rows.join("")}
    </div>`;
  const buttons = (buttons = [], id) => {
      if (!buttons.length) return '';
    
      const btns = buttons.map(btn => {
        const {
          id,             // data-id 值
          text,           // 显示文本
          className = '', // 自定义 class，如 btn-primary
          type = 'button' // 默认 type
        } = btn;
    
        return `<button data-id="${id}" type="${type}" class="${className}">${text}</button>`;
      });
    
      return `<div class="flex justify-end space-x-2 p-4" ${id ? `data-id="${id}"` : ''}>${btns.join('')}</div>`;
    };
    


    var escapeRules = {
      '&': '&#38;', '<': '&#60;', '>': '&#62;',
      '"': '&#34;', "'": '&#39;', '/': '&#47;'
  };
  var escapeRegExp = /[&<>"'\/]/g;

  var _escape = (function () {
      var cache = Object.create(null);
      return function (code) {
          if (!code) return "";
          if (cache[code]) return cache[code];
          return (cache[code] = code.replace(escapeRegExp, m => escapeRules[m]));
      };
  })();

  var isArray = Array.isArray || function (arr) {
      return Object.prototype.toString.call(arr) === '[object Array]';
  };

  // ✅ 统一转换为字符串
  var toString = function (value) {
      if (isArray(value)) return value.join('');
      if (typeof value === 'string') return value;
      return String(value); // 其他类型转字符串
  };

  var _for = function (list, fn) {
      if (!list) return '';
      var html = [];
      if (isArray(list)) {
          for (var i = 0, len = list.length; i < len; i++) {
              html.push(toString(fn(list[i], i)));
          }
      } else {
          for (var key in list) {
              if (list.hasOwnProperty(key)) {
                  html.push(toString(fn(list[key], key)));
              }
          }
      }
      return html.join('');
  };

  const _if = (condition, trueValue, falseValue = '') => 
      toString(condition ? trueValue : falseValue);

  const getRefsByDataId = (container) => {
      let selectedRefs = {};
      container.querySelectorAll('[data-id]').forEach(node => {
          let dataId = node.getAttribute('data-id');
          if (!selectedRefs[dataId]) {
              selectedRefs[dataId] = node;
          } else {
              if (!isArray(selectedRefs[dataId])) {
                  selectedRefs[dataId] = [selectedRefs[dataId]];
              }
              selectedRefs[dataId].push(node);
          }
          // 把 data-id 属性去掉
          // node.removeAttribute('data-id');
      });
      return selectedRefs;
  };

  // 挂载到 render 上，方便统一调用
  const renderFunc = function (data, getHtml, container) {
      if (typeof getHtml !== 'function') {
          console.error("Invalid template");
          return;
      }
      var html = toString(getHtml(data, _escape, _for, _if));

      if (container) {
          if (typeof container === 'string') {
              container = document.querySelector(container);
          }
          if (!container) {
              console.error("Invalid container");
              return;
          }

          var tempContainer = document.createElement('div');
          tempContainer.innerHTML = html;
          const refs = getRefsByDataId(tempContainer);
          while (tempContainer.firstChild) {
              container.appendChild(tempContainer.firstChild);
          }

          return refs;
      }

      return html;
  };

  // ✅ 统一挂载模板辅助工具
  renderFunc.row = row;
  renderFunc.titleRow = titleRow;
  renderFunc.section = section;
  renderFunc.buttons = buttons;

  return renderFunc;
})();



export const delegator = {
  events: {},

  // 绑定事件委派
  on: function(node, events, selector, callback) {
    // 如果传入的 events 是一个数组，我们将绑定多个事件
    const eventList = Array.isArray(events) ? events : [events];

    // 创建一个唯一的事件处理函数
    const handler = (e) => {
      let target = e.target;

      // 非冒泡事件
      if (['focus', 'blur', 'focusin', 'focusout'].includes(e.type)) {
        if (target.matches(selector)) {
          callback(e, target);  // 将 target 作为第二个参数传递给回调函数
        }
      } else if (['mouseenter', 'mouseleave'].includes(e.type)) {
        // 处理 mouseenter 和 mouseleave 事件
        if (target.matches(selector)) {
          callback(e, target);  // 将 target 作为第二个参数传递给回调函数
        }
      } else {
        // 冒泡事件，沿着 DOM 树冒泡
        while (target && target !== node) {
          if (target.matches(selector)) {
            callback(e, target);  // 将 target 作为第二个参数传递给回调函数
            return;
          }
          target = target.parentElement;  // 向上冒泡
        }
      }
    };

    // 对每个事件类型绑定事件监听器
    eventList.forEach((event) => {
      if (!this.events[node]) this.events[node] = [];

      // 为不冒泡的事件设置捕获阶段（focusin, focusout, mouseenter, mouseleave）
      if (['focusin', 'focusout', 'mouseenter', 'mouseleave'].includes(event)) {
        node.addEventListener(event, handler, true);  // 捕获阶段
      } else {
        node.addEventListener(event, handler);
      }

      // 记录事件信息，以便以后移除
      this.events[node].push({ event, selector, callback, handler });
    });

    // 返回移除事件监听的函数
    return () => this.off(node, events, selector, callback);
  },

  // 移除事件委派
  off: function(node, events, selector, callback) {
    const eventList = Array.isArray(events) ? events : [events];

    if (this.events[node]) {
      this.events[node] = this.events[node].filter(({ event, selector: s, callback: cb, handler }) => {
        if (eventList.includes(event) && (selector ? s === selector : true) && (callback ? cb === callback : true)) {
          node.removeEventListener(event, handler);
          return false; // 移除事件监听
        }
        return true;
      });
    }
  },

  // 绑定一次性事件
  once: function(node, events, selector, callback) {
    const off = this.on(node, events, selector, (e, target) => {
      callback(e, target);
      off();  // 执行一次后移除事件监听
    });
  },

  // 触发自定义事件
  emit: function(node, event, detail = {}) {
    // 为兼容老浏览器，使用 document.createEvent 来创建 CustomEvent
    let customEvent;
    if (typeof CustomEvent === 'function') {
      customEvent = new CustomEvent(event, {
        bubbles: true,
        cancelable: true,
        detail
      });
    } else {
      customEvent = document.createEvent('CustomEvent');
      customEvent.initCustomEvent(event, true, true, detail);
    }
    node.dispatchEvent(customEvent);
  }
};

// // 使用示例：

// const container = document.querySelector('#container');

// // 绑定 focus 事件（用 focusin 代替）
// const offFocus = delegator.on(container, 'focusin', '.input', function(e, target) {
//   console.log('Input focused:', target);
// });

// // 绑定 blur 事件（用 focusout 代替）
// const offBlur = delegator.on(container, 'focusout', '.input', function(e, target) {
//   console.log('Input lost focus:', target);
// });

// // 绑定 mouseenter 事件
// const offMouseEnter = delegator.on(container, 'mouseenter', '.item', function(e, target) {
//   console.log('Mouse entered item:', target);
// });

// // 绑定 mouseleave 事件
// const offMouseLeave = delegator.on(container, 'mouseleave', '.item', function(e, target) {
//   console.log('Mouse left item:', target);
// });

// // 同时绑定多个事件类型
// const offClickAndMouseover = delegator.on(container, ['click', 'mouseover'], '.item', function(e, target) {
//   console.log('Event triggered:', e.type, 'on', target);
// });

// 移除事件监听
// offFocus();
// offBlur();
// offMouseEnter();
// offMouseLeave();
// offClickAndMouseover();



// 使用场景与示例
// 短时间内多次触发 resize 事件，只执行一次
// window.addEventListener('resize', throttle(() => {
//     console.log('resize');
// }, 1000));

// window.addEventListener('resize', debounce(() => {
//     console.log('resize');
// }, 1000));



function showToast(text, background, duration, showClose = false) {
    const toast = Toastify({
        text,
        duration: duration || 3000, // 3 秒后自动消失
        style: { 
            background, 
            color: "#f8f9fa", // 柔和的白色字体
            borderRadius: "6px", // 圆角更好看
            padding: "10px 16px"
        },
        position: "center",
        stopOnFocus: true,  // 鼠标悬停时不消失
        close: showClose, // 是否显示关闭按钮
        onClick: function () { toast.hideToast(); } // 点击时手动关闭
    });

    toast.showToast();
    return toast;
}

// 颜色优化后的提示
export const showError = (text, duration, showClose) => showToast(text, "rgba(220, 53, 69, 0.9)", duration, showClose);  // 柔和的红色
export const showSuccess = (text, duration, showClose) => showToast(text, "rgba(40, 167, 69, 0.9)", duration, showClose); // 柔和的绿色
// 柔和的灰色 
export const showInfo = (text, duration, showClose) => showToast(text, "rgba(108, 117, 125, 0.9)", duration, showClose);
export const showWarning = (text, duration, showClose) => showToast(text, "rgba(255, 193, 7, 0.9)", duration, showClose); // 柔和的黄色


export function getRefs(wrap, attr) {
  var refsObj = {};
    attr = attr || 'node-type';
    wrap = document.querySelector(wrap);
    if(wrap){
      var refs = wrap.querySelectorAll('[' + attr + ']');
    
      refsObj.wrap = wrap;
      refs.forEach(function (item) {
          refsObj[item.getAttribute(attr)] = item;
      });
    }
    
    return refsObj;
}


// export function delegateEvent(element, eventType, selector, fn) {
//     element.addEventListener(eventType, function (e) {
//         var target = e.target;
//         if(!target) {
//             return;
//         }
//         while (!target.matches(selector)) {
//             if (target === element) {
//                 target = null;
//                 break;
//             }
//             target = target.parentNode;
//         }
//         target && fn.call(target, e, target);
//     });
//     return element;
// }

// 懒加载图片_escape
export function lazyLoadImages(container) {
    container = container || document;
    const images = container.querySelectorAll("img.lazyload");

    images.forEach((img) => {
        // 判断图片是否在视口内
        if (isInViewport(img)) {
            const dataSrc = img.getAttribute("data-src");
            if (dataSrc) {
                img.src = dataSrc; // 加载图片
                img.classList.remove("lazyload"); // 移除懒加载类
            }
        }
    });
}

// 将 svg 缩放到目标尺寸
export function scaleSvgToTarget(svgString, targetWidth, targetHeight) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.documentElement;

  // 需要把 svg 放进页面里，才能使用 getBBox()
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.visibility = 'hidden';
  document.body.appendChild(container);
  container.appendChild(svg);

  // 得到实际内容边界
  const bbox = svg.getBBox();

  // 计算缩放比例，保持内容不变形
  const scaleX = targetWidth / bbox.width;
  const scaleY = targetHeight / bbox.height;
  const scale = Math.min(scaleX, scaleY);

  // 设定宽高
  svg.setAttribute('width', bbox.width * scale);
  svg.setAttribute('height', bbox.height * scale);

  // 设置 viewBox 方便缩放，注意这里调整视口
  svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

  const serializer = new XMLSerializer();
  const scaledSvgString = serializer.serializeToString(svg);

  // 清理
  document.body.removeChild(container);

  return scaledSvgString;
}

// 判断元素是否在视口内
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth);
}

// 通过 code type 获取iframe 的 docsrc
export function getDocSrc(code, type){
    const codes = {
      'echarts': `
        <script src="/v/js/echarts.min.js"></script>
        `,
      'mermaid': `
        <style>.mermaid { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;} .mermaid svg { width: 100%; height: 100%; }</style>
        <script src="/v/js/mermaid.min.js"></script>
        `,
      'vega': `
        <script src="/v/js/vega.min.js"></script>
        `,
      'cytoscape': `
        <script src="/v/js/cytoscape.min.js"></script>
        <script src="/v/js/layout-base.js"></script>
        <script src="/v/js/cose-base.js"></script>
        <script src="/v/js/cytoscape-fcose.js"></script>
        `,
      'jsmind': `
         <link type="text/css" rel="stylesheet" href="/v/css/jsmind.css" />
        <script type="text/javascript" src="/v/js/jsmind.js"></script>
        <script type="text/javascript" src="/v/js/dom-to-image.min.js" ></script>
        <script type="text/javascript" src="/v/js/jsmind.screenshot.js"></script>
        `,
      'plantuml': `
        <style>#chart img{margin:0 auto; display:block; max-width: 100%;}</style>
        <script src="/v/js/plantuml-encoder.min.js"></script>
        `,
      'd3': `
      <script src="/v/js/d3.v7.min.js"></script>
      `
    };
    const functions = {
        'echarts': `// 使用 ECharts 的 API 下载图片
        function downloadImage() {
        console.log(9999);
          const base64 = chart.getDataURL({ pixelRatio: 2 });
          
          let name = 'echarts.png';
          if(config && config.title && config.title.text) {
            name = config.title.text + '.png';
          }
          // postMessage 传递数据
          window.parent.postMessage({ base64, name }, '*');
        
        }
          window.downloadImage = downloadImage;
        // 让图表随窗口大小自适应，使用定时器，要预防频繁调用 resize 方法
        let timer = null;
        window.addEventListener('resize', () => {
          if (timer) {
            clearTimeout(timer);
          }
          if(chart){
            timer = setTimeout(() => {
              chart.resize();
            }, 100);
          }
          
        });`,
        'mermaid': `
        // 使用 Mermaid 的 API 下载图片
    function downloadImage() {
      const svg = document.querySelector('.mermaid svg');
      const base64 = 'data:image/svg+xml;base64,' + window.btoa(svg.outerHTML);
      console.log('base64:', base64);
      let name = 'mermaid.png';
      window.parent.postMessage({ base64, name }, '*');
    }
    // 让图表随窗口大小自适应，使用定时器，要预防频繁调用 resize 方法
    let timer = null;
    window.addEventListener('resize', () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        mermaid.init(undefined, document.querySelectorAll('.mermaid'));
      }, 800);
    });
            `,
        'vega': `
    // 使用 Vega 的 API 下载图片
        function downloadImage() {
          const canvas = document.querySelector('canvas');
          const base64 = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          window.parent.postMessage({ base64, name: 'vega.png' }, '*');
        }
            `,
        'cytoscape': `
    // 使用 Cytoscape 的 API 下载图片
        function downloadImage() {
          const base64 = cy.png();
          window.parent.postMessage({ base64, name: 'cytoscape.png' }, '*');
        }
        // 让图表随窗口大小自适应，使用定时器，要预防频繁调用 resize 方法
        let timer = null;
        window.addEventListener('resize', () => {
          if (timer) {
            clearTimeout(timer);
          }
          timer = setTimeout(() => {
            cy.resize();
            cy.fit();
          }, 800);
        });
            `,
        'jsmind': `
        function downloadImage() {
            jm.shoot();
        }
    
        let timer = null;
        window.addEventListener('resize', () => {
          if (timer) {
            clearTimeout(timer);
          }
          timer = setTimeout(() => {
            jm.resize();
          }, 800);
        });
            `,
        'plantuml': `
            function downloadImage() {
              // const a = document.createElement('a');
              // a.href = plantUMLUrl;
              // a.download = 'plantuml.png';
              // a.click();
              const base64 = plantUMLUrl;
              window.parent.postMessage({ base64, name: 'plantuml.png' }, '*');
            }
            `,
        'd3': `
      function downloadImage() {
      const svgNode = document.querySelector('svg');
      
      // 获取 SVG 的宽度和高度
      const svgWidth = svgNode.clientWidth;
      const svgHeight = svgNode.clientHeight;
    
      // 将 SVG 序列化为字符串
      const svgData = new XMLSerializer().serializeToString(svgNode);
    
      // 创建 canvas 元素
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 设置 canvas 大小与 SVG 匹配
      canvas.width = svgWidth;
      canvas.height = svgHeight;
    
      const img = new Image();
      img.onload = function() {
        // 当图片加载完成后，绘制到 canvas 上
        ctx.drawImage(img, 0, 0);
    
        // 获取图片的 base64 数据
        const base64 = canvas.toDataURL('image/png');
    
        // 将图片数据传递给父窗口
        window.parent.postMessage({ base64, name: 'd3.png' }, '*');
      };
    
      // 将 SVG 转换为图片
      img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgData)));
    }`
    
    
      };

      let doc = '';
      if(type === 'infog'){
        doc = `
  <!DOCTYPE html>
     <html lang="zh">
     <head>
         <meta charset="UTF-8">
         <meta name="viewport" content="width=device-width, initial-scale=1.0">
         <script src="https://cdn.tailwindcss.com"></script>
         <title>信息图文</title>
     </head>
     <body>
        ${code}
        ${codes[type] ? codes[type] : ''}
      <script>
      try {
          ${functions[type] ? functions[type] : ''}
    
          // 提醒渲染完成
          window.parent.postMessage({ render: true }, '*');
    
          window.addEventListener('message', function (e) {
              console.log('iframe message:', e.data);
              if (e.data === 'download') {
                  downloadImage();
              }
          }, false);
      } catch (error) {
          // window.parent.postMessage({ error: '图渲染失败：'+ error.message }, '*');
      }
    
      </script>
     
     </body>
     
        `;
      }else{
    
      doc = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ECharts Renderer</title>
      <style>
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
        body { background-color: #fff; }
        #chart { width: 100%;height:100%; min-height: 100%; max-width:100%; max-height:100%; display: flex; justify-content: center; align-items: center; }
        .loading{display:flex;flex-direction:column;justify-content:center;align-items:center;height:100%;color:#64748b;}
        .loading p{margin-top:20px;font-size:14px;font-family:Arial,Helvetica,sans-serif;}
        /* 旋转动画 */
        .loading svg{animation:spin 1s linear infinite;width: 32px;height: 32px;}
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
      </style>
    </head>
    <body>
      <div id="chart">
        <div node-type="loading" class="loading"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader-circle size-8 animate-spin text-muted-foreground"> <path d="M21 12a9 9 0 1 1-6.219-8.56"></path> </svg> <p class="text-sm text-muted-foreground">正在渲染...</p> </div>
      </div>
      ${codes[type] ? codes[type] : ''}
      <script>
      try {
          const chartNode = document.getElementById('chart');
          document.getElementById('chart').innerHTML = '';
          // const resizeObserver = new ResizeObserver(entries => {
          //   for (let entry of entries) {
          //     const { width, height } = entry.contentRect;
          //     entry.target.style.height = height + 'px';
          //     window.parent.postMessage({ height:height }, '*');
          //   }
          // });
          // resizeObserver.observe(chartNode);
    
          // 退出全屏后，重新计算高度
          function isFullscreen() {
            return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
          }
          
          window.addEventListener('resize', function () {
              if (!isFullscreen()) {
                  const height = 600;
                  chartNode.style.height = height + 'px';
                  window.parent.postMessage({ height: height }, '*');
              }
          });
          
    
          
          ${code}
          
          ${functions[type] ? functions[type] : ''}
    
          // 提醒渲染完成
          window.parent.postMessage({ render: true }, '*');
    
          window.addEventListener('message', function (e) {
              console.log('iframe message:', e.data);
              if (e.data === 'download') {
                  downloadImage();
              }
          }, false);
      } catch (error) {
          window.parent.postMessage({ error: '图表渲染失败：'+ error.message }, '*');
      }
    
      </script>
    </body>
    </html>
        `;
      }
    return doc;
}


/**
 * 解析 CSS 渐变字符串为自定义对象。
 * 支持 linear-gradient 和 radial-gradient 两种格式。
 **/
export function stringToGradient(str) {
  str = str.trim();
  const gradientMatch = str.match(
    /(linear|radial|repeating-linear|repeating-radial)-gradient\((.+)\)/
  );
  if (!gradientMatch) {
    throw new Error("Invalid gradient format");
  }

  const type = gradientMatch[1];
  const content = gradientMatch[2];
  const parts = content.split(/,(?![^\(]*\))/); // 避免 rgba() 被错误切割
  let angleOrPosition = parts[0].trim();

  let gradientType = type.includes("radial") ? "radial" : "linear";
  let isRepeating = type.includes("repeating");
  let angle = 180;
  let radialPosition = { x: 0.5, y: 0.5 };
  let shape = "circle";
  let extent = "farthest-corner";

  if (gradientType === "linear") {
    if (angleOrPosition.includes("deg")) {
      angle = parseFloat(angleOrPosition);
      parts.shift();
    }
  } else if (gradientType === "radial") {
    const radialMatch = angleOrPosition.match(
      /(circle|ellipse)?\s*(closest-side|closest-corner|farthest-side|farthest-corner)?\s*(at\s+([\d.]+%?)\s+([\d.]+%?))?/
    );
    if (radialMatch) {
      shape = radialMatch[1] || "circle";
      extent = radialMatch[2] || "farthest-corner";
      if (radialMatch[4] && radialMatch[5]) {
        radialPosition.x = radialMatch[4].includes("%")
          ? parseFloat(radialMatch[4]) / 100
          : parseFloat(radialMatch[4]);
        radialPosition.y = radialMatch[5].includes("%")
          ? parseFloat(radialMatch[5]) / 100
          : parseFloat(radialMatch[5]);
      }
    }
    parts.shift();
  }

  const colorStops = parts.map((stop, index, arr) => {
    const stopMatch = stop
      .trim()
      .match(/(rgba?\([^\)]+\)|#[0-9A-Fa-f]+|[a-zA-Z]+)\s*(\d+%)?/);
    if (!stopMatch) {
      console.log("Invalid color stop: " + stop);
      return {
        offset: 0,
        color: "transparent",
      };
    }
    const color = stopMatch[1];
    let offset = stopMatch[2]
      ? parseFloat(stopMatch[2]) / 100
      : index / (arr.length - 1);
    return { offset: Math.max(0, Math.min(1, offset)), color };
  });
  // 参考下面说明增加 coords 给 fabric使用
  // * @param {Number} [options.coords.x1] X coordiante of the first point for linear or of the focal point for radial
  // * @param {Number} [options.coords.y1] Y coordiante of the first point for linear or of the focal point for radial
  // * @param {Number} [options.coords.x2] X coordiante of the second point for linear or of the center point for radial
  // * @param {Number} [options.coords.y2] Y coordiante of the second point for linear or of the center point for radial
  // * @param {Number} [options.coords.r1] only for radial gradient, radius of the inner circle
  // * @param {Number} [options.coords.r2] only for radial gradient, radius of the external circle

  let coords;

  if (type === 'linear') {
    const angleRad = ((90 - angle) % 360) * Math.PI / 180;
    const x = Math.cos(angleRad);
    const y = Math.sin(angleRad);
    coords = {
      x1: 0.5 - x / 2,
      y1: 0.5 - y / 2,
      x2: 0.5 + x / 2,
      y2: 0.5 + y / 2,
    };
  }
   else {
    // 处理 radial gradient
    const cx = radialPosition.x;
    const cy = radialPosition.y;
    coords = {
      x1: cx, y1: cy,       // focal point
      x2: cx, y2: cy,       // center point
      r1: 0,                // 默认从 0 半径开始
      r2: 0.5,              // 默认扩展到 50% 大小
    };
  }

  // 通过 extent 计算 r2
  if (extent) {
    const radius = computeRadialGradientRadius(
      radialPosition.x,
      radialPosition.y,
      1,
      1,
      extent
    );
    coords.r2 = radius;
  }


  return {
    type: gradientType,
    gradientUnits: 'percentage',
    coords,
    isRepeating,
    angle,
    radialPosition,
    extent,
    shape,
    colorStops,
  };
}

export function gradientToString(gradient) {
  if( typeof gradient === 'string'){
    return gradient;
  }
  if(!gradient || !gradient.type){
    return '';
  }
  let str = "";
  if (gradient.type === "linear") {
    str += "linear-gradient(";
    if (gradient.angle) {
      str += `${gradient.angle}deg, `;
    }
  } else if (gradient.type === "radial") {
    str += `radial-gradient(${gradient.shape} ${gradient.extent} at ${(
      // gradient.radialPosition.x * 100
      gradient.coords.x2 * 100
    ).toFixed(2)}% ${(
      // gradient.radialPosition.y * 100
      gradient.coords.y2 * 100
    ).toFixed(2)}%, `;
  }

  gradient.colorStops.forEach((stop, index) => {
    str += `${stop.color}`;
    if (stop.offset !== undefined) {
      str += ` ${Math.round(stop.offset * 100)}%`;
    }
    if (index < gradient.colorStops.length - 1) {
      str += ", ";
    }
  });

  str += ")";
  return str;
}

/**
 * 根据渐变对象生成图片（Image 对象），适用于 fabric.js 作为背景图。
 *
 * 对于线性渐变，根据 angle 使用三角函数计算渐变起止点；
 * 对于径向渐变，默认以画布中心为圆心，半径取画布对角线长度的一半。
 */
export function computeRadialGradientRadius(cx, cy, width, height, extent) {
  switch (extent) {
    case "closest-side":
      // 到最近边的距离
      return Math.min(cx, width - cx, cy, height - cy);
    case "farthest-side":
      // 到最远边的距离
      return Math.max(cx, width - cx, cy, height - cy);
    case "closest-corner":
      // 到最近角的距离
      return Math.min(
        Math.hypot(cx, cy),
        Math.hypot(width - cx, cy),
        Math.hypot(cx, height - cy),
        Math.hypot(width - cx, height - cy)
      );
    case "farthest-corner":
      // 到最远角的距离
      return Math.max(
        Math.hypot(cx, cy),
        Math.hypot(width - cx, cy),
        Math.hypot(cx, height - cy),
        Math.hypot(width - cx, height - cy)
      );
    default:
      // 如果未识别，则默认采用最远角
      return Math.max(
        Math.hypot(cx, cy),
        Math.hypot(width - cx, cy),
        Math.hypot(cx, height - cy),
        Math.hypot(width - cx, height - cy)
      );
  }
}

export function colorToImage(color, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  const colorImage = new Image();
  colorImage.src = canvas.toDataURL("image/png");
  return colorImage;
}

export function gradientToImage(gradient, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  let gradientObj;

  if (gradient.type === "linear") {
    // ✅ 线性渐变：计算起止点
    const rad = (gradient.angle * Math.PI) / 180;
    const cx = width / 2,
      cy = height / 2;
    const L = Math.sqrt(width * width + height * height) / 2;
    const x0 = cx - Math.sin(rad) * L;
    const y0 = cy + Math.cos(rad) * L;
    const x1 = cx + Math.sin(rad) * L;
    const y1 = cy - Math.cos(rad) * L;
    gradientObj = ctx.createLinearGradient(x0, y0, x1, y1);
  } else if (gradient.type === "radial") {
    // ✅ 计算椭圆/圆的中心位置
    const cx = gradient.radialPosition.x * width;
    const cy = gradient.radialPosition.y * height;
    let radiusX, radiusY;

    if (gradient.extent) {
      radiusX = computeRadialGradientRadius(
        cx,
        cy,
        width,
        height,
        gradient.extent
      );
    } else {
      radiusX = Math.max(
        Math.hypot(cx, cy),
        Math.hypot(width - cx, cy),
        Math.hypot(cx, height - cy),
        Math.hypot(width - cx, height - cy)
      );
    }

    radiusY =
      gradient.shape === "ellipse" ? radiusX * (height / width) : radiusX;

    if (gradient.shape === "ellipse") {
      // ✅ **创建圆形渐变**（起点 0，终点 radiusX）
      gradientObj = ctx.createRadialGradient(cx, cy, 0, cx, cy, radiusX);

      // ✅ **使用变换实现椭圆**
      ctx.save();
      ctx.translate(cx, cy); // **移动到正确的中心**
      ctx.scale(1, height / width); // **拉伸 Y 轴，形成椭圆**
      ctx.translate(-cx, -cy); // **把坐标移回去**
    } else {
      // 普通圆形渐变
      gradientObj = ctx.createRadialGradient(cx, cy, 0, cx, cy, radiusX);
    }
  } else {
    throw new Error("Unsupported gradient type: " + gradient.type);
  }

  // ✅ 处理颜色停靠点
  gradient.colorStops.forEach((stop) => {
    const pos = Math.max(0, Math.min(1, stop.offset));
    gradientObj.addColorStop(pos, stop.color);
  });

  ctx.fillStyle = gradientObj;
  ctx.fillRect(0, 0, width, height);

  if (gradient.shape === "ellipse") {
    ctx.restore(); // **恢复原始坐标，避免影响后续绘制**
  }

  if (gradient.isRepeating) {
    const pattern = ctx.createPattern(canvas, "repeat");
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
  }

  const gradientImage = new Image();
  gradientImage.src = canvas.toDataURL("image/png");
  return gradientImage;
}
