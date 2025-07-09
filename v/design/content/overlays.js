import { emitter, delegator, render, throttle } from "../../__common__/utils";
import elements from "../elements";

// 全局 container 变量
let container;
// 全局视图管理栈
const viewStack = [];

const overlayNameMap = {
  "Art flowers": "艺术花卉",
  "Autumn leaves": "秋叶",
  "Bokeh": "虚化光斑",
  "Bubbles": "气泡",
  "Butterflies and Dragonflies": "蝴蝶与蜻蜓",
  "Confetti": "五彩纸屑",
  "Fire": "火焰",
  "Fireworks": "烟花",
  "Flare/Haze": "光晕与薄雾",
  "Floating dust": "漂浮尘埃",
  "Funny bubbles": "趣味泡泡",
  "Glitters": "闪光粒子",
  "Light leaks": "光影漏光",
  "Lightning": "闪电",
  "Lights and Stars": "灯光与星星",
  "Night lights - gold": "夜灯（金色）",
  "Night lights - silver": "夜灯（银色）",
  "Patels": "柔光色调",
  "Rainbow": "彩虹",
  "Romantic bokeh": "浪漫光斑",
  "Scrambled letters": "乱序字母",
  "Sky": "天空",
  "Sparkle": "闪耀光点",
  "String lights": "串灯",
  "Sunlight": "阳光",
  "Winter": "冬日景象"
};

  
/**
 * 更新滚动指示器（左右箭头和渐变层）的显示状态
 * @param {HTMLElement} scrollEl 滚动容器
 * @param {HTMLElement} leftArrow 左箭头按钮
 * @param {HTMLElement} rightArrow 右箭头按钮
 * @param {HTMLElement} leftOverlay 左侧渐变层
 * @param {HTMLElement} rightOverlay 右侧渐变层
 */
function updateScrollIndicators(
  scrollEl,
  leftArrow,
  rightArrow,
  leftOverlay,
  rightOverlay
) {
  const scrollLeft = scrollEl.scrollLeft;
  const maxScrollLeft = scrollEl.scrollWidth - scrollEl.clientWidth;
  if (scrollLeft <= 0) {
    leftArrow.style.display = "none";
    leftOverlay.style.display = "none";
  } else {
    leftArrow.style.display = "block";
    leftOverlay.style.display = "block";
  }
  if (scrollLeft >= maxScrollLeft) {
    rightArrow.style.display = "none";
    rightOverlay.style.display = "none";
  } else {
    rightArrow.style.display = "block";
    rightOverlay.style.display = "block";
  }
}

// const filterIcons = (query) => {
//   query = query.toLowerCase();
//   const icons = container.querySelectorAll(".ficon");
//   icons.forEach((icon) => {
//     icon.style.display =
//       icon.title.toLowerCase().indexOf(query) === -1 ? "none" : "";
//   });
// };

// searchInput.addEventListener("keyup", (event) => {
//   filterIcons(event.currentTarget.value);
// });


// 创建最终列表页，类似 createCategoryPart，但不含"更多"按钮，也不是滚动区域，是一个普通的列表
function createFinalListView(items) {
  const state = {
    query: ''
  };

  const getTemplate = (data, _escape) => `
    <div class="w-full flex flex-col overflow-hidden">
      <div class="px-4 pb-4 bg-white w-full bg-white flex flex-col gap-2 z-1">
        <div class="flex items-center gap-4">
          <div class="relative w-full flex-1">
            <input
              type="text"
              data-id="search"
              placeholder="搜索"
              value="${_escape(data.query)}"
              class="border border-slate-300 w-full px-3 py-1.5 rounded-lg text-sm pr-8"
            />
            <button data-id="clear" class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black ${!data.query ? 'hidden' : ''}">
              <i class="vicon-close"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="flex-1 overflow-auto pl-4">
        <div data-id="itemsWrapper" class="grid grid-cols-4 gap-2 pb-4 w-88">
        </div>
      </div>
    </div>
  `;

  const wrapper = document.createElement("div");
  wrapper.className = "w-full flex flex-col overflow-hidden";
  const refs = render(state, getTemplate, wrapper);

  // 添加清除按钮事件处理
  delegator.on(wrapper, 'click', '[data-id="clear"]', () => {
    refs.search.value = '';
    refs.clear.classList.add('hidden');
    search();
  });

  // 添加输入框输入事件处理
  delegator.on(wrapper, 'input', '[data-id="search"]', () => {
    if (refs.search.value) {
      refs.clear.classList.remove('hidden');
    } else {
      refs.clear.classList.add('hidden');
    }
  });

  function search () {
    const query = refs.search.value.trim();
    if (!query) {
      refs.itemsWrapper.querySelectorAll(".item").forEach((item) => {
        item.style.display = "block";
      });
      return;
    }
    refs.itemsWrapper.querySelectorAll(".item").forEach((item) => {
      const titleNode = item.querySelector("[title]");
      if (!titleNode) return;
      const title = titleNode.title || '';

      if (title.indexOf(query) === -1) {
        item.style.display = "none";
      } else {
        item.style.display = "block";
      }
    });
  }

  // 添加失去焦点和回车事件
  delegator.on(wrapper, 'blur', '[data-id="search"]', search);
  delegator.on(wrapper, 'keydown', '[data-id="search"]', (e) => {
    if (e.key === 'Enter') {
      search();
    }
  });

  // 直接渲染数据中的 items
  renderContentCallback(refs.itemsWrapper, items);
  return wrapper;
}


/**
 * 创建单个分类区块（已含 items 数据）
 * @param {Object} category 分类数据对象 {title, type, hasMore, items}
 * @param {number} level 当前层级（1 表示主视图，2、3…表示子视图）
 * @param {string} prevType 上一级分类类型（用于数据加载，可按需调整）
 */
function createCategoryPart(category, level, prevType) {
  const partDiv = document.createElement("div");
  partDiv.className = "w-full mb-6";

  // 标题和"更多"按钮
  const headerDiv = document.createElement("div");
  headerDiv.className = "flex justify-between items-center mb-2";
  const titleEl = document.createElement("span");
  titleEl.textContent = category.title;
  titleEl.className = "text-sm font-semibold";
  headerDiv.appendChild(titleEl);

  // 如果存在更多数据，则显示"更多"按钮
  if (category.hasMore) {
    const moreBtn = document.createElement("button");
    moreBtn.textContent = "更多";
    moreBtn.className = "text-xs hover:text-purple-500";
    moreBtn.addEventListener("click", () => {
      showNextView(category.title, category.type, level + 1, prevType);
    });
    headerDiv.appendChild(moreBtn);
  }
  partDiv.appendChild(headerDiv);

  // 创建滚动区域
  const scrollContainer = document.createElement("div");
  scrollContainer.className = "relative";
  const itemsWrapper = document.createElement("div");
  itemsWrapper.className = "flex space-x-2 overflow-hidden";

  // 直接渲染数据中的 items
  renderContentCallback(itemsWrapper, category.items);

  // 如果有更多，则添加最后一个假项（点击同样触发"更多"）
  if (category.hasMore) {
    const fakeItem = document.createElement("div");
    fakeItem.className = "flex-shrink-0 border border-slate-100 item w-20 h-20 flex flex-col items-center justify-center  bg-slate-100 flex items-center justify-center rounded-lg overflow-hidden text-lg cursor-pointer hover:bg-slate-200";
    fakeItem.innerHTML = '<i class="vicon-more"></i>';
    fakeItem.addEventListener("click", () => {
      showNextView(category.title, category.type, level + 1, prevType);
    });
    itemsWrapper.appendChild(fakeItem);
  }

  // 创建左右箭头及渐变层
  const leftArrow = document.createElement("button");
  //   向左实心三角形
  leftArrow.innerHTML =
    '<i class="vicon-small-arrow block w-4 h-4 rotate-90"></i>';
  leftArrow.className =
    "absolute -left-2 top-1/2 transform -translate-y-1/2 p-1 z-10";
  leftArrow.addEventListener("click", () => {
    itemsWrapper.scrollBy({ left: -250, behavior: "smooth" });
  });

  const rightArrow = document.createElement("button");
  //   向右实心三角形
  rightArrow.innerHTML =
    '<i class="vicon-small-arrow block w-4 h-4 -rotate-90"></i>';
  rightArrow.className =
    "absolute -right-2 top-1/2 transform -translate-y-1/2 p-1 z-10";
  rightArrow.addEventListener("click", () => {
    itemsWrapper.scrollBy({ left: 250, behavior: "smooth" });
  });

  const leftOverlay = document.createElement("div");
  leftOverlay.className =
    "absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent z-5 pointer-events-none";

  const rightOverlay = document.createElement("div");
  rightOverlay.className =
    "absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent z-5 pointer-events-none";

  itemsWrapper.addEventListener("scroll", () => {
    updateScrollIndicators(
      itemsWrapper,
      leftArrow,
      rightArrow,
      leftOverlay,
      rightOverlay
    );
  });

  scrollContainer.appendChild(leftOverlay);
  scrollContainer.appendChild(rightOverlay);
  scrollContainer.appendChild(leftArrow);
  scrollContainer.appendChild(rightArrow);
  scrollContainer.appendChild(itemsWrapper);

  partDiv.appendChild(scrollContainer);
  setTimeout(() => {
    updateScrollIndicators(
        itemsWrapper,
        leftArrow,
        rightArrow,
        leftOverlay,
        rightOverlay
    );
    }, 1000);
  return partDiv;
}

/**
 * 创建视图页面
 * @param {string} title 页面标题（大分类或子分类名称）
 * @param {string} type 当前视图类型（点击"更多"时传入，用于数据加载，可按需调整）
 * @param {number} level 当前层级（1：主视图；2、3…：子视图）
 * @param {boolean} hasBack 是否显示返回按钮（主视图不显示）
 * @param {string} prevType 上一级分类类型（用于数据加载，可按需调整）
 */
function createView(title, type, level, hasBack = true, prevType) {
  const viewDiv = document.createElement("div");
  viewDiv.className = "w-full h-full mx-auto flex flex-col";

  if (hasBack) {
    const header = document.createElement("div");
    header.className = "flex items-center py-2 px-4";
    const backBtn = document.createElement("button");
    backBtn.className = "vicon-arrow-back text-lg mr-2";
    backBtn.title = "返回";
    backBtn.addEventListener("click", () => {
      container.removeChild(viewDiv);
      viewStack.pop();
      if (viewStack.length > 0) {
        viewStack[viewStack.length - 1].style.display = "flex";
      }
    });
    const titleEl = document.createElement("h2");
    titleEl.textContent = title;
    titleEl.className = "sticky";
    header.appendChild(backBtn);
    header.appendChild(titleEl);
    viewDiv.appendChild(header);
  } else {
    // const titleEl = document.createElement("h2");
    // titleEl.textContent = title;
    // titleEl.className = "sticky p-2 text-center";
    // viewDiv.appendChild(titleEl);
  }

  // 添加内容区，初始显示加载中提示
  const contentDiv = document.createElement("div");
  contentDiv.className = "flex-1 flex flex-col overflow-hidden";
  contentDiv.innerHTML =
    '<div class="text-center text-slate-500">加载中...</div>';
  viewDiv.appendChild(contentDiv);

  // 进入页面时加载数据，加载成功后渲染所有分类区块
  loadViewData(title, type, level, prevType).then(async (data) => {
    contentDiv.innerHTML = "";

    let refs; // 将 refs 声明移到外层

    if(level === 1){
      refs = render('', (d,e,f,_if) => {
        return [
          `<div class="grid grid-cols-3 p-4 gap-2">`,
          `<button class="btn-primary bg-red-500 hover:bg-red-600" data-id="removeButton"><i class="vicon-delete text-lg mr-1"></i>删除</button>`,
          `<button class="btn-primary !bg-blue-500 hover:!bg-blue-600" data-id="customColor"><i class="vicon-palette text-lg mr-1"></i>颜色</button>`,
          `<button class="btn-primary bg-green-500 hover:bg-green-600" data-id="uploadOverlayImage"><i class="vicon-upload text-lg mr-1"></i>图片</button>`,
          `</div>`,
          `<div class="flex mx-4 border-b border-slate-200 mb-4 text-sm">`,
          `<button class="flex-1 py-2 text-center -mb-[1px] border-b-2 border-purple-500 text-purple-500" data-id="tab-library">本地图库</button>`,
          `<button class="flex-1 py-2 text-center -mb-[1px]" data-id="tab-unsplash">Unsplash</button>`,
          `</div>`,
          `<div data-id="library" class="tab-content flex-1 overflow-auto px-4"></div>`,
          `<div data-id="unsplash" class="tab-content flex-1 overflow-hidden hidden"></div>`
        ];
      }, contentDiv);

      // 绑定 tab 切换事件
      delegator.on(contentDiv, 'click', '[data-id^="tab-"]', (e, target) => {
        const tabId = target.dataset.id;
        const contentId = tabId.replace('tab-', '');
        
        // 更新 tab 样式
        contentDiv.querySelectorAll('[data-id^="tab-"]').forEach(tab => {
          tab.classList.remove('border-b-2', 'border-purple-500', 'text-purple-500');
        });
        target.classList.add('border-b-2', 'border-purple-500', 'text-purple-500');
        
        // 切换内容显示
        contentDiv.querySelectorAll('.tab-content').forEach(content => {
          content.classList.add('hidden');
        });
        refs[contentId].classList.remove('hidden');

        // 如果是 unsplash tab，初始化 image-picker
        if (contentId === 'unsplash') {
          emitter.emit("operation:imagePicker:show", {
            container: refs.unsplash,
            keyword: 'overlay',
            orientation: '',
            color: '',
            onSelect: (url) => {
              emitter.emit("operation:overlay:init", {
                type: 'url',
                data: url
              });
            }
          });
        }
      });

      const {update} = elements.getGui(refs.customColor, 'colorButton',{
        color: '#ccc',
        clz: '',
        panelType: 'overlay',
        panelTitle: '自定义颜色前景',
        onchange: function(info){
          emitter.emit("operation:overlay:init", {
            type: info.gradient?'gradient':'color',
            data: info.color,
            isNormalColor: info.gradient?false:true
          });
        }
      });

      // 默认显示图库 tab
      refs.library.classList.remove('hidden');
    }

    // 渲染图库内容
    if(data[0].items){
      data.forEach((category) => {
        const part = createCategoryPart(category, level, type);
        if(refs){
          refs.library.appendChild(part);
        }else{
          contentDiv.appendChild(part);
        }
      });
    }else{
      const part = createFinalListView(data, level, type);
      if(refs){
        refs.library.appendChild(part);
      }else{
        contentDiv.appendChild(part);
      }
    }
  });

  return viewDiv;
}

/**
 * 展示下一级视图（点击"更多"或最后一个假项时调用）
 * @param {string} title 当前分类标题
 * @param {string} type 当前分类类型
 * @param {number} level 当前层级+1
 * @param {string} prevType 上一级分类类型（用于数据加载，可按需调整）
 */
function showNextView(title, type, level, prevType) {
  if (viewStack.length > 0) {
    viewStack[viewStack.length - 1].style.display = "none";
  }
  const newView = createView(title, type, level, true, prevType);
  viewStack.push(newView);
  container.appendChild(newView);
}

/**
 * 模拟加载数据（主视图或子视图），返回的数据格式与示例一致
 * @param {string} title 当前视图标题（用于示例，可按需调整）
 * @param {string} type 当前视图类型（点击"更多"传入，示例中暂未做区分）
 * @param {number} level 当前层级
 * @param {string} prevType 上一级分类类型（用于数据加载，可按需调整）
 * @returns {Promise<Array>} 返回数据数组
 */
function loadViewData(title, type, level, prevType) {
  
  let data;
  return new Promise((resolve) => {
    
      if (type === "overlays") {
        loadScript("https://xiaomingyan.com/static/v/design/assets/overlays.en.js", () => {
          // ZMprops.overlays = [
          //   {
          //     name: "abstract",
          //     desc: "Abstract",
          //     imgs: [
          //       { src: "1.jpg", size: "2048x1365" },
          //       { src: "2.jpg", size: "2048x1365" },
          data = ZMprops.overlays;
          //   遍历 data 转成可渲染的数据

          // data 是对象
          data = Object.keys(data).map((key) => {
            // 如果没有 imgs，直接返回
            const item = data[key];
            return {
              title: overlayNameMap[item.desc] || key,
              type: key,
              hasMore: item.imgs.length > 6,
              items: item.imgs.slice(0, 6).map((img, index) => {
                return {
                  id: index + 1,
                  title: `${index + 1}`,
                  cover: `https://xiaomingyan.com/static/v/design/assets/overlays/${key}/${img}`,
                  dataType: 'ornament'
                };
              }),
            };
          });
          
          // data = data.map((item) => {
          //   return {
          //     title: overlaysNameMap[item.desc] || item.desc,
          //     type: item.name,
          //     hasMore: item.imgs.length > 10,

          //     // 只要前 10 个
          //     items: item.imgs.slice(0, 10).map((img, index) => {
          //       return {
          //         id: index + 1,
          //         title: `${index + 1}`,
          //         cover: `https://xiaomingyan.com/static/v/design/assets/overlays/${item.name}/${img.src}`,
          //         dataType: 'background',
          //         ...img
          //       };
          //     }),
          //   };
          // });
          resolve(data);
        });
      }
      if(prevType === "overlays"){
        // 在 ZMprops.overlays 数组中找到 item.name === type 的对象
        let data = ZMprops.overlays[type];
        // ZMprops.overlays.forEach((item) => {
        //   if (item.name === type) {
        //     data = item;
        //   }
        // });
        if (!data) {
          resolve([]);
          return;
        }
        data = data.imgs.map((img, index) => {
          return {
            id: index + 1,
            title: `${index + 1}`,
            hasMore: false,
            cover: `https://xiaomingyan.com/static/v/design/assets/overlays/${type}/${img}`,
            dataType: 'ornament'
          };
        });
        resolve(data);
      }
    });
  
  
}

/**
 * 渲染分类区块内的 items
 * @param {HTMLElement} containerEl 滚动容器
 * @param {Array} items 数据数组（每项包含 id、title、cover 等）
 */
function renderContentCallback(containerEl, items) {
  containerEl.innerHTML = "";
  render('',(d,e,f,_if) => {
    return f(items,(item) => {
      const title = item.title||item.id||'';
      const className = "flex-shrink-0 border border-slate-100 item  w-20 h-20 flex flex-col items-center justify-center rounded-lg overflow-hidden text-xs bg-slate-100 cursor-pointer hover:bg-slate-200";

      // 不管是 jpg还是 png 它的 thumb 都是 png
      // let thumb = item.cover.replace(/\/([^/]+)$/, '/thumb.$1');
      // // 替换 jpg 为 png
      // thumb = thumb.replace(/\.jpg$/, '.png');

      const thumb = item.cover.replace(/\/([^/]+)$/, '/thumb.$1').replace(/\.jpg$/, '.png');

      return `<div class="${className}">
        <img src="${thumb}" data-src="${thumb}" data-original="${item.cover}" data-id="overlay" alt="${title}" title="${title}" class="object-cover w-full h-full">
      </div>`;
    });
  }, containerEl);
}


// 原生的加载 js 方法,js 运行完后调用 callback
function loadScript(url, callback) {
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = url;

  if (script.readyState) {
    // IE
    script.onreadystatechange = function () {
      if (script.readyState == "loaded" || script.readyState == "complete") {
        script.onreadystatechange = null;
        callback();
        document.body.removeChild(script);
      }
    };
  } else {
    // Others
    script.onload = function () {
      callback();
      document.body.removeChild(script);
    };
  }

  document.body.appendChild(script);
}

window.ZMprops = window.ZMprops || {};

// const data = [
//     { title: "装饰图案", type: "overlays",hasMore:true, items:[
//         {
//             id: 1,
//             title: "装饰图案1",
//             cover: "https://via.placeholder.com/50",
//         }
//     ] },
//     { title: "图标", type: "pictograms", hasMore:true,items:[]},
//     { title: "卡通贴纸", type: "images_emojis",hasMore:true, items:[]},
//     { title: "可爱表情", type: "emojis",hasMore:true, items:[]},
//     { title: "叠加特效", type: "overlays",hasMore:true, items:[]},
//     { title: "花纹边框", type: "borders",hasMore:true, items:[]},
//     { title: "花纹线条", type: "rulers",hasMore:true, items:[]},
// ]
// 是否已经绑定事件
let isBind = false;
emitter.on("content:load", async (event) => {
  const { type } = event;

  // 注意 overlays 有s
  if (type === "overlays") {
    
    if(!isBind){
      container = event.container;
      container.innerHTML = "";
      const mainView = createView("前景", "overlays", 1, false, "");
      viewStack.length = 0;
      viewStack.push(mainView);
      container.appendChild(mainView);
      isBind = true;
      delegator.on(container, "click", ".item", (event, target) => {
        // 找 target 里面每一个元素
        const item = target.firstElementChild;
        if(item){
          const dataType = item.dataset.id;
          const original = item.dataset.original;
          if(dataType === 'overlay'){
            emitter.emit("operation:overlay:init", {
              type: 'url',
              data: original
            });
          }
        }
        
        if(target.dataset.color && target.dataset.color !== 'undefined'){
          const color = target.dataset.color;
          // 加一个字段用来判断是否是普通颜色，不是的话需要用 canvas 来处理
          const isNormalColor = color.indexOf('linear-gradient') === -1;
          emitter.emit("operation:overlay:init", {
            type: 'color',
            data: color,
            isNormalColor
          });
        }
      });

      delegator.on(container, "click", "[data-id]", (event, target) => {
        const { id } = target.dataset;
        // if (id === "customColor") {
        //   emitter.emit("operation:overlay:init", {
        //     type: 'gradient'
        //   });
        // }
        if (id === "uploadOverlayImage") {
          emitter.emit("operation:overlay:init", {
            type: 'upload'
          });
        }
        if (id === "removeButton") {
          emitter.emit("operation:overlay:init", {
            type: 'remove'
          });
        }
      }); 
    }
  }
});



