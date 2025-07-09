import { emitter, delegator } from "../../__common__/utils";


// / **
// * 将 SVG 字符串编码为 base64 格式
// * @param {string} svgStr 
// * @returns {string}
// */
const encodeSvgBase64 = (svgStr) =>
 btoa(
   encodeURIComponent(svgStr).replace(/%([0-9A-F]{2})/g, (match, p1) =>
     String.fromCharCode("0x" + p1)
   )
 );

/**
* 构造 SVG 字符串
* @param {string} category - 符号分类
* @param {string} pathData - 符号路径数据
* @returns {string}
*/
const buildSvgString = (category, pathData) => {
 const viewBox =
   category === "other" ? "-1.6 -1.6 35.2 35.2" : "-15 -15 330 330";
 const widthValue = category === "other" ? 1 : 5;
 return (
   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">` +
   `<path fill="#fff" stroke="#000" stroke-width="${widthValue}" d="${pathData}"></path>` +
   `</svg>`
 );
};
// 全局 container 变量
let container;
// 全局视图管理栈
const viewStack = [];

const ornamentsNameMap = {
    "Airy Symbols": "轻盈图标",
    "Animals/Plants": "动物与植物",
    "Baby/Toys": "婴儿与玩具",
    "Badges & Ribbons": "徽章与丝带",
    "Bar": "酒吧元素",
    "Birthday/Party": "生日与派对",
    "Bottles/Glasses": "瓶子与杯子",
    "Circus": "马戏团",
    "Coffeeshop": "咖啡店",
    "Food": "美食",
    "Frames - Circle": "圆形边框",
    "Frames - Rectangular": "矩形边框",
    "Home appliances": "家用电器",
    "Love/Romance": "爱情与浪漫",
    "Ornaments - Centered": "居中装饰",
    "Ornaments - Corners": "角落装饰",
    "Ornaments - Flowers": "花卉装饰",
    "Ornaments - Rulers": "尺规装饰",
    "Ornaments - Sets": "组合装饰",
    "Ornaments - Sides": "边框装饰",
    "Ornaments - Vintage": "复古装饰",
    "Party/Fun": "派对与趣味",
    "People": "人物",
    "Pictograms": "图标符号",
    "Rating/Validation": "评分与验证",
    "Restaurant": "餐厅",
    "Seals/Stamps": "印章与戳记",
    "Speech bubbles": "对话气泡",
    "Symbols": "符号",
    "Transport": "交通工具",
    "Trees/Plants": "树木与植物",
    "Various": "其他"
  };

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

   const imagesNameMap = {
    "Animals": "动物",
    "Arrows": "箭头",
    "Buildings": "建筑",
    "Christmas": "圣诞节",
    "Clothes": "服装",
    "Flowers": "花卉",
    "Food": "美食",
    "General": "通用图案",
    "Golden badges": "金色徽章",
    "Holidays": "节日",
    "Home": "家庭",
    "Leaves": "树叶",
    "Love": "爱情",
    "Multimedia": "多媒体",
    "Nature": "自然",
    "Office": "办公",
    "Party": "派对",
    "People": "人物",
    "Snow flakes": "雪花",
    "Social media": "社交媒体",
    "Transportation": "交通工具",
    "Vacation": "度假"
  }
  
    
  
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


// 创建最终列表页，类似 createCategoryPart，但不含“更多”按钮，也不是滚动区域，是一个普通的列表
function createFinalListView(items) {
  const partDiv = document.createElement("div");
  partDiv.className = "w-full";

  // 在前面加一个搜索框，不要搜索按钮，用一个 div 包裹
  const searchWrapper = document.createElement("div");
  searchWrapper.className = "mb-2 p-2";
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "搜索";
  searchInput.className = "input w-full";
  searchWrapper.appendChild(searchInput);
  partDiv.appendChild(searchWrapper);

  

  function search () {
    const query = searchInput.value.trim();
    if (!query) {
      itemsWrapper.querySelectorAll(".item").forEach((item) => {
        item.style.display = "block";
      });
      return;
    }
    itemsWrapper.querySelectorAll(".item").forEach((item) => {
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

  searchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      search();
    }
  });


  // 创建列表区域
  const itemsWrapper = document.createElement("div");
  itemsWrapper.className = "flex flex-wrap justify-center gap-2 pb-4";

  // 直接渲染数据中的 items
  renderContentCallback(itemsWrapper, items);

  partDiv.appendChild(itemsWrapper);
  return partDiv;
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

  // 标题和“更多”按钮
  const headerDiv = document.createElement("div");
  headerDiv.className = "flex justify-between items-center mb-2";
  const titleEl = document.createElement("span");
  titleEl.textContent = category.title;
  titleEl.className = "text-sm font-semibold";
  headerDiv.appendChild(titleEl);

  // 如果存在更多数据，则显示“更多”按钮
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

  // 如果有更多，则添加最后一个假项（点击同样触发“更多”）
  if (category.hasMore) {
    const fakeItem = document.createElement("div");
    fakeItem.className = "flex-shrink-0 w-20 h-20 bg-slate-100 flex items-center justify-center rounded text-lg cursor-pointer hover:bg-slate-200";
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
 * @param {string} type 当前视图类型（点击“更多”时传入，用于数据加载，可按需调整）
 * @param {number} level 当前层级（1：主视图；2、3…：子视图）
 * @param {boolean} hasBack 是否显示返回按钮（主视图不显示）
 * @param {string} prevType 上一级分类类型（用于数据加载，可按需调整）
 */
function createView(title, type, level, hasBack = true, prevType) {
  const viewDiv = document.createElement("div");
  viewDiv.className = "w-full px-4 mx-auto flex flex-col";

  if (hasBack) {
    const header = document.createElement("div");
    header.className = " flex items-center pt-2 pb-0";
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
    titleEl.className = "font-semibold";
    header.appendChild(backBtn);
    header.appendChild(titleEl);
    viewDiv.appendChild(header);
  } else {
    // const titleEl = document.createElement("h2");
    // titleEl.textContent = title;
    // titleEl.className = "p-2 text-center font-semibold";
    // viewDiv.appendChild(titleEl);
  }

  // 添加内容区，初始显示加载中提示
  const contentDiv = document.createElement("div");
  contentDiv.innerHTML =
    '<div class="text-center text-slate-500">加载中...</div>';
  viewDiv.appendChild(contentDiv);

  // 进入页面时加载数据，加载成功后渲染所有分类区块
  
  loadViewData(title, type, level, prevType).then((data) => {
    const texts = {
      title: {
        text: '点击添加标题',
        className: 'text-3xl',
      },
      subtitle: {
        text: '点击添加副标题',
        className: 'text-2xl',
      },
      body: {
        text: '点击添加正文',
        className: 'text-lg',
      },
    }
    if(level === 1){
      contentDiv.innerHTML = `
      <div class="py-4">
          ${Object.keys(texts).map((key) => {
            return `<button data-id="editText" data-type="${key}" class="btn-secondary w-full mb-2 justify-start ${texts[key].className}">
            ${texts[key].text}
          </button>`;
          }).join('')}
          <div class="flex justify-between items-center gap-2">
            <button data-id="editText" data-type="curved" class="btn-secondary w-full mb-2 justify-start">
              <i class="vicon-curve mr-2"></i>弯曲文本
            </button>
            <button data-id="editText" data-type="warped" class="btn-secondary w-full mb-2 justify-start">
              <i class="vicon-warp mr-2"></i>扭曲文本
            </button>
          </div>
      </div>`;
    }else{
      contentDiv.innerHTML = "";
    }

    
    // // 第一个元素没有 items，那它本身就是 items
    // if(data[0].items){
    //     data.forEach((category) => {
    //     const part = createCategoryPart(category, level, type);
    //     contentDiv.appendChild(part);
    //     });
    // }else{
    //     // 渲染一个列表页面（最终页）
    //     const part = createFinalListView(data, level, type);
    //     contentDiv.appendChild(part);
    // }
        

  });

  return viewDiv;
}

/**
 * 展示下一级视图（点击“更多”或最后一个假项时调用）
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
 * @param {string} type 当前视图类型（点击“更多”传入，示例中暂未做区分）
 * @param {number} level 当前层级
 * @param {string} prevType 上一级分类类型（用于数据加载，可按需调整）
 * @returns {Promise<Array>} 返回数据数组
 */
function loadViewData(title, type, level, prevType) {
  
  let data;
  return new Promise((resolve) => {
    if (!type) {
      data = [
        {
          title: "装饰图案",
          type: "ornaments",
          hasMore: true,
          //   ["001.svg","003.svg","004.svg","005.svg","006.svg","007.svg","008.svg","010.svg"
          items: [
            {
              id: 1,
              title: "1",
              cover: "https://xiaomingyan.com/static/v/design/assets/ornaments/flourishes/001.png",
              dataType: 'ornament'
            },
            {
              id: 2,
              title: "2",
              cover: "https://xiaomingyan.com/static/v/design/assets/ornaments/flourishes/003.png",
              dataType: 'ornament'
            },
            {
              id: 3,
              title: "3",
              cover: "https://xiaomingyan.com/static/v/design/assets/ornaments/flourishes/004.png",
              dataType: 'ornament'
            },
            {
              id: 4,
              title: "4",
              cover: "https://xiaomingyan.com/static/v/design/assets/ornaments/flourishes/005.png",
              dataType: 'ornament'
            },
            {
              id: 5,
              title: "5",
              cover: "https://xiaomingyan.com/static/v/design/assets/ornaments/flourishes/006.png",
              dataType: 'ornament'
            },
            {
              id: 6,
              title: "6",
              cover: "https://xiaomingyan.com/static/v/design/assets/ornaments/flourishes/007.png",
              dataType: 'ornament'
            },
            {
              id: 7,
              title: "7",
              cover: "https://xiaomingyan.com/static/v/design/assets/ornaments/flourishes/008.png",
              dataType: 'ornament'
            },
            {
              id: 8,
              title: "8",
              cover: "https://xiaomingyan.com/static/v/design/assets/ornaments/flourishes/010.png",
              dataType: 'ornament'
            },
            {
              id: 9,
              title: "9",
              cover: "https://xiaomingyan.com/static/v/design/assets/ornaments/flourishes/011.png",
              dataType: 'ornament'
            },
          ],
        },
        
      ];
      resolve(data);
    } else {
      if (type === "ornaments") {
        loadScript("https://xiaomingyan.com/static/v/design/assets/ornaments.en.js", () => {
          //             badges: {
          // desc: "Badges & Ribbons"
          // imgs : ['001.svg', '002.svg', '003.svg]
          // }
          data = ZMprops.ornaments;
          //   转成可渲染的数据
          data = Object.keys(data).map((key) => {
            const item = data[key];
            return {
              title: ornamentsNameMap[item.desc] || item.desc,
              type: key,
              hasMore: item.imgs.length > 10,

              // 只要前 10 个
              items: item.imgs.slice(0, 10).map((img, index) => {
                return {
                  id: index + 1,
                  title: `${index + 1}`,
                  cover: `https://xiaomingyan.com/static/v/design/assets/ornaments/${key}/${img}`,
                  dataType: 'ornament'
                };
              }),
            };
          });
          resolve(data);
        });
      }
      if(prevType === "ornaments"){
        data = ZMprops.ornaments[type];
        data = data.imgs.map((img, index) => {
          return {
            id: index + 1,
            title: `${index + 1}`,
            hasMore: false,
            cover: `https://xiaomingyan.com/static/v/design/assets/ornaments/${type}/${img}`,
            dataType: 'ornament'
          };
        });
        resolve(data);
      }

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
  items.forEach((item) => {
    const itemDiv = document.createElement("div");
    let title = item.title||item.id||'';
    itemDiv.className =
      "item flex-shrink-0 w-20 h-20 flex flex-col items-center justify-center rounded text-xs bg-slate-100 p-1 cursor-pointer hover:bg-slate-200";
    
    if (item.cover) {
      const img = document.createElement("img");
      img.src = 'https://xiaomingyan.com/static/common/d.gif';
      if(item.dataType === 'ornament'){
        img.setAttribute("data-src", item.cover);
      }
      if(item.dataType === 'overlay' || item.dataType === 'images'){
        // http://localhost:5173https://xiaomingyan.com/static/v/design/assets/overlays/Bokeh/37.jpg
        // http://localhost:5173https://xiaomingyan.com/static/v/design/assets/overlays/Bokeh/thumb.37.png
        // 文件名前加 thumb.，后缀改为 png
        const thumb = item.cover.replace(/\/([^/]+)$/, '/thumb.$1').replace(/\.jpg$/, '.png');
        img.setAttribute("data-src", thumb);
        img.dataset.original = item.cover;
      }
      if(item.dataType === 'emojis'){
        img.setAttribute("data-src", item.cover);
      }
      if(item.dataType === 'border'){
        // corner-Blocks-Borders-Bl-01.svg 改为 thumb.corner-Blocks-Borders-Bl-01.png
        const thumb = item.cover.replace(/\/([^/]+)$/, '/thumb.$1').replace(/\.svg$/, '.png');
        img.setAttribute("data-src", thumb);
        img.dataset.original = item.cover;
      }
      if(item.dataType === 'ruler'){
        // border-Classic-Borders-Cl-01.svg 改为 thumb.border-Classic-Borders-Cl-01.png
        img.setAttribute("data-src", item.cover);
      }
      // 使用图片名称作为标题
      if(!title){
        title = item.cover.split('/').pop().split('.')[0];
      }
      img.alt = title;
      img.title = title;
      img.className = "object-contain max-w-full max-h-full w-full h-full p-1";
      itemDiv.appendChild(img);

      img.dataset.ornament = item.dataType;
    }

    

    containerEl.appendChild(itemDiv);
  });
}

// 是否已经绑定事件
let isBind = false;
emitter.on("content:load", (event) => {
  const { type } = event;
  if (type === "text") {
    container = event.container;
    container.innerHTML = "";
    const mainView = createView("文字", "", 1, false, "");
    viewStack.length = 0;
    viewStack.push(mainView);
    container.appendChild(mainView);
    if(!isBind){
      isBind = true;
      delegator.on(container, "click", ".item", (event, target) => {
        // 找 target 里面每一个元素
        const item = target.firstElementChild;
        let url = item.getAttribute("data-src") || item.src;
        const dataType = item.dataset.text;
      });

      delegator.on(container, "click", "[data-id]", (event, target) => {
        const { id } = target.dataset;
        if (id === "editText") {
          const type = target.dataset.type;
          emitter.emit("operation:text:init", {type, text: ""});
        }
        // if (id === "editText") {
        //   emitter.emit("operation:text:init", "curved");
        // }
        // if (id === "editTextWarped") {
        //   emitter.emit("operation:text:init", "warped");
        // }
      });
    }
  }
});



