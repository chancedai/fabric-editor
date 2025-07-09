import { emitter, delegator,render } from "../../__common__/utils";
// import { load } from "webfontloader";

// load({
//   google: { families: ["Material Icons:400"] },
//   custom: {
//     families: ["IcoFont:400", "Font Awesome 6 Free:900"],
//     urls: [
//       "/v/design/css/icofont.min.css",
//       "/v/design/css/fontawesome.min.css",
//     ],
//   },
// });

const loadCss = (url) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
};

loadCss("https://xiaomingyan.com/static/v/design/css/icofont.min.css");
loadCss("https://xiaomingyan.com/static/v/design/css/fontawesome.min.css");
loadCss("https://xiaomingyan.com/static/v/design/css/material.min.css");


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


// 创建最终列表页，类似 createCategoryPart，但不含"更多"按钮，也不是滚动区域，是一个普通的列表
function createFinalListView(items) {
  const state = {
    query: ''
  };

  const getTemplate = (data, _escape) => `
      <div class="pb-4 pr-4 w-full bg-white flex flex-col gap-2 z-1">
        <div class="flex items-center gap-4">
          <div class="relative w-full flex-1">
            <input
              type="text"
              data-id="search"
              placeholder="搜索"
              value="${_escape(data.query)}"
              class="input w-full px-3 py-1.5 pr-8"
            />
            <button data-id="clear" class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black ${!data.query ? 'hidden' : ''}">
              <i class="vicon-close"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="flex-1 overflow-auto">
        <div data-id="itemsWrapper" class="grid grid-cols-4 gap-2 pb-4 w-88">
        </div>
      </div>
  `;

  const wrapper = document.createElement("div");
  wrapper.className = "w-full h-full overflow-hidden flex flex-col overflow-hidden";
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
  partDiv.className = "w-88 mb-6";

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
 * @param {string} type 当前视图类型（点击"更多"时传入，用于数据加载，可按需调整）
 * @param {number} level 当前层级（1：主视图；2、3…：子视图）
 * @param {boolean} hasBack 是否显示返回按钮（主视图不显示）
 * @param {string} prevType 上一级分类类型（用于数据加载，可按需调整）
 */
function createView(title, type, level, hasBack = true, prevType) {
  const viewDiv = document.createElement("div");
  viewDiv.className = "w-full h-full overflow-hidden mx-auto flex flex-col space-y-4";

  // 渲染 header
  const refs = render(
    { title, hasBack },
    ({ title, hasBack }, ) => [
      hasBack? `
        <div class="px-4 flex items-center pt-2 pb-0" data-id="header">
          <button class="vicon-arrow-back btn-icon mr-1" title="返回" data-id="backBtn"></button>
          <h2>${title}</h2>
        </div> `:'',
      `<div data-id="content"  class="flex-1 overflow-auto pl-4">
        <div class="text-center text-slate-500">加载中...</div>
      </div>`
    ],
    viewDiv
  );

  if (!hasBack) viewDiv.classList.add('py-4');
  // 加载数据后替换内容
  loadViewData(title, type, level, prevType).then((data) => {
    refs.content.innerHTML = "";
    
    if (data[0].items) {
      data.forEach((category) => {
        const part = createCategoryPart(category, level, type);
        refs.content.appendChild(part);
      });
    } else {
      const part = createFinalListView(data, level, type);
      refs.content.appendChild(part);
    }
  });

  if (hasBack && refs.backBtn) {
    refs.backBtn.addEventListener("click", () => {
      container.removeChild(viewDiv);
      viewStack.pop();
      if (viewStack.length > 0) {
        viewStack[viewStack.length - 1].style.display = "flex";
      }
    });
  }

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
        { title: "图标", type: "pictograms", hasMore: true, items: [
    // "angry-monster": "e800",
    // bathtub: "e801",
    // "bird-wings": "e802",
    // bow: "e803",
    // castle: "e804",
    // circuit: "e805",
    // "crown-king": "e806",
    // "crown-queen": "e807",
    // dart: "e808",
    // "disability-race": "e809",
    {
      id: 1,
      title: "angry-monster",
      icon: ['angry-monster','e800'],
      iconType: "icofont",
      dataType: "pictograms",
    },
    // 生成余下的数据
    {
      id: 2,
      title: "bathtub",
      icon: ['bathtub','e801'],
      iconType: "icofont",
      dataType: "pictograms",
    },
    {
      id: 3,
      title: "bird-wings",
      icon: ['bird-wings','e802'],
      iconType: "icofont",
      dataType: "pictograms",
    },
    {
      id: 4,
      title: "bow",
      icon: ['bow','e803'],
      iconType: "icofont",
      dataType: "pictograms",
    },
    {
      id: 5,
      title: "castle",
      icon: ['castle','e804'],
      iconType: "icofont",
      dataType: "pictograms",
    },
    {
      id: 6,
      title: "circuit",
      icon: ['circuit','e805'],
      iconType: "icofont",
      dataType: "pictograms",
    },
    {
      id: 7,
      title: "crown-king",
      icon: ['crown-king','e806'],
      iconType: "icofont",
      dataType: "pictograms",
    },
    {
      id: 8,
      title: "crown-queen",
      icon: ['crown-queen','e807'],
      iconType: "icofont",
      dataType: "pictograms",
    },
    {
      id: 9,
      title: "dart",
      icon: ['dart','e808'],
      iconType: "icofont",
      dataType: "pictograms",
    },
    {
      id: 10,
      title: "disability-race",
      icon: ['disability-race','e809'],
      iconType: "icofont",
      dataType: "pictograms",
    }
    
    ] },
        
        { title: "贴纸", type: "images", hasMore: true, items: [

      //     "1997283.png",
      // "3127839474.png",
      // "3546790.png",
      // "3548652.png",
      // "3550250.png",
      // "3553181.png",
      // "3556447.png",
      // "3574013.png",
      // "3684185.png",
      // "3822566.png",
      // "3871280.png",
      // "389407.png",
      {
        id: 1,
        title: "1",
        cover: "https://xiaomingyan.com/static/v/design/assets/images/holidays/1997283.png",
        dataType: "images"
      },
      {
        id: 2,
        title: "2",
        cover: "https://xiaomingyan.com/static/v/design/assets/images/holidays/3127839474.png",
        dataType: "images",
      },
      {
        id: 3,
        title: "3",
        cover: "https://xiaomingyan.com/static/v/design/assets/images/holidays/3546790.png",
        dataType: "images",
      },
      {
        id: 4,
        title: "4",
        cover: "https://xiaomingyan.com/static/v/design/assets/images/holidays/3548652.png",
        dataType: "images",
      },
      {
        id: 5,
        title: "5",
        cover: "https://xiaomingyan.com/static/v/design/assets/images/holidays/3550250.png",
        dataType: "images",
      },
      {
        id: 6,
        title: "6",
        cover: "https://xiaomingyan.com/static/v/design/assets/images/holidays/3553181.png",
        dataType: "images",
      },
      {
        id: 7,
        title: "7",
        cover: "https://xiaomingyan.com/static/v/design/assets/images/holidays/3556447.png",
        dataType: "images",
      },
      {
        id: 8,
        title: "8",
        cover: "https://xiaomingyan.com/static/v/design/assets/images/holidays/3574013.png",
        dataType: "images",
      },
      {
        id: 9,
        title: "9",
        cover: "https://xiaomingyan.com/static/v/design/assets/images/holidays/3684185.png",
        dataType: "images",
      },
      {
        id: 10,
        title: "10",
        cover: "https://xiaomingyan.com/static/v/design/assets/images/holidays/3822566.png",
        dataType: "images",
      }
      
        ] },
        { title: "卡通表情", type: "emojis", hasMore: true, items: [
          // {
          //   char: "\ud83d\ude00",
          //   code: "1f600",
          //   name: "grinning face",
          //   cat: "face-smiling",
          //   filename: "emoji_u1f600.svg",
          // },
          // {
          //   char: "\ud83d\ude03",
          //   code: "1f603",
          //   name: "grinning face with big eyes",
          //   cat: "face-smiling",
          //   filename: "emoji_u1f603.svg",
          // },
          // {
          //   char: "\ud83d\ude04",
          //   code: "1f604",
          //   name: "grinning face with smiling eyes",
          //   cat: "face-smiling",
          //   filename: "emoji_u1f604.svg",
          // },
          // {
          //   char: "\ud83d\ude01",
          //   code: "1f601",
          //   name: "beaming face with smiling eyes",
          //   cat: "face-smiling",
          //   filename: "emoji_u1f601.svg",
          // },
          // {
          //   char: "\ud83d\ude06",
          //   code: "1f606",
          //   name: "grinning squinting face",
          //   cat: "face-smiling",
          //   filename: "emoji_u1f606.svg",
          // },
          // {
          //   char: "\ud83d\ude05",
          //   code: "1f605",
          //   name: "grinning face with sweat",
          //   cat: "face-smiling",
          //   filename: "emoji_u1f605.svg",
          // },
          // {
          //   char: "\ud83e\udd23",
          //   code: "1f923",
          //   name: "rolling on the floor laughing",
          //   cat: "face-smiling",
          //   filename: "emoji_u1f923.svg",
          // },
          // {
          //   char: "\ud83d\ude02",
          //   code: "1f602",
          //   name: "face with tears of joy",
          //   cat: "face-smiling",
          //   filename: "emoji_u1f602.svg",
          // },
          // {
          //   char: "\ud83d\ude42",
          //   code: "1f642",
          //   name: "slightly smiling face",
          //   cat: "face-smiling",
          //   filename: "emoji_u1f642.svg",
          // },
          // {
          //   char: "\ud83d\ude43",
          //   code: "1f643",
          //   name: "upside-down face",
          //   cat: "face-smiling",
          //   filename: "emoji_u1f643.svg",
          // },
          {
            id: 1,
            title: "grinning face",
            cover: "https://xiaomingyan.com/static/v/design/assets/emojis/emoji_u1f600.svg",
            dataType: "emojis",
          },
          // 生成余下的数据
          {
            id: 2,
            title: "grinning face with big eyes",
            cover: "https://xiaomingyan.com/static/v/design/assets/emojis/emoji_u1f603.svg",
            dataType: "emojis",
          },
          {
            id: 3,
            title: "grinning face with smiling eyes",
            cover: "https://xiaomingyan.com/static/v/design/assets/emojis/emoji_u1f604.svg",
            dataType: "emojis",
          },
          {
            id: 4,
            title: "beaming face with smiling eyes",
            cover: "https://xiaomingyan.com/static/v/design/assets/emojis/emoji_u1f601.svg",
            dataType: "emojis",
          },
          {
            id: 5,
            title: "grinning squinting face",
            cover: "https://xiaomingyan.com/static/v/design/assets/emojis/emoji_u1f606.svg",
            dataType: "emojis",
          },
          {
            id: 6,
            title: "grinning face with sweat",
            cover: "https://xiaomingyan.com/static/v/design/assets/emojis/emoji_u1f605.svg",
            dataType: "emojis",
          },
          {
            id: 7,
            title: "rolling on the floor laughing",
            cover: "https://xiaomingyan.com/static/v/design/assets/emojis/emoji_u1f923.svg",
            dataType: "emojis",
          },
          {
            id: 8,
            title: "face with tears of joy",
            cover: "https://xiaomingyan.com/static/v/design/assets/emojis/emoji_u1f602.svg",
            dataType: "emojis",
          },
          {
            id: 9,
            title: "slightly smiling face",
            cover: "https://xiaomingyan.com/static/v/design/assets/emojis/emoji_u1f642.svg",
            dataType: "emojis",
          },
          {
            id: 10,
            title: "upside-down face",
            cover: "https://xiaomingyan.com/static/v/design/assets/emojis/emoji_u1f643.svg",
            dataType: "emojis",
          }
          
        ] },
        { title: "花纹边框", type: "borders", hasMore: true, items: [
          // ZMprops.borders = [
          //   "corner-Blocks-Borders-Bl-01.svg",
          //   "corner-Blocks-Borders-Bl-02.svg",
          //   "corner-Blocks-Borders-Bl-03.svg",
          //   "corner-Blocks-Borders-Bl-04.svg",
          //   "corner-Blocks-Borders-Bl-06.svg",
          //   "corner-Blocks-Borders-Bl-09.svg",
          //   "corner-Blocks-Borders-Bl-10.svg",
          //   "corner-Blocks-Borders-Bl-12.svg",
          //   "corner-Blocks-Borders-Bl-13.svg",
          //   "corner-Blocks-Borders-Bl-14.svg",
          {
            id: 1,
            title: "corner-Blocks-Borders-Bl-01.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/borders/corner-Blocks-Borders-Bl-01.svg",
            dataType: "border"
          },
          // 生成余下的数据
          {
            id: 2,
            title: "corner-Blocks-Borders-Bl-02.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/borders/corner-Blocks-Borders-Bl-02.svg",
            dataType: "border"
          },
          {
            id: 3,
            title: "corner-Blocks-Borders-Bl-03.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/borders/corner-Blocks-Borders-Bl-03.svg",
            dataType: "border"
          },
          {
            id: 4,
            title: "corner-Blocks-Borders-Bl-04.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/borders/corner-Blocks-Borders-Bl-04.svg",
            dataType: "border"
          },
          {
            id: 5,
            title: "corner-Blocks-Borders-Bl-06.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/borders/corner-Blocks-Borders-Bl-06.svg",
            dataType: "border"
          },
          {
            id: 6,
            title: "corner-Blocks-Borders-Bl-09.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/borders/corner-Blocks-Borders-Bl-09.svg",
            dataType: "border"
          },
          {
            id: 7,
            title: "corner-Blocks-Borders-Bl-10.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/borders/corner-Blocks-Borders-Bl-10.svg",
            dataType: "border"
          },
          {
            id: 8,
            title: "corner-Blocks-Borders-Bl-12.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/borders/corner-Blocks-Borders-Bl-12.svg",
            dataType: "border"
          },
          {
            id: 9,
            title: "corner-Blocks-Borders-Bl-13.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/borders/corner-Blocks-Borders-Bl-13.svg",
            dataType: "border"
          },
          {
            id: 10,
            title: "corner-Blocks-Borders-Bl-14.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/borders/corner-Blocks-Borders-Bl-14.svg",
            dataType: "border"
          }
        ] },
        { title: "花纹线条", type: "rulers", hasMore: true, items: [
          // ZMprops.rulers = [
          //   "border-Classic-Borders-Cl-01.svg",
          //   "border-Classic-Borders-Cl-02.svg",
          //   "border-Classic-Borders-Cl-19.svg",
          //   "border-Classic-Borders-Cl-20.svg",
          //   "border-Classic-Borders-Cl-23.svg",
          //   "border-Classic-Borders-Cl-44.svg",
          //   "border-Classic-Borders-Cl-45.svg",
          //   "border-Classic-Borders-Cl-48.svg",
          //   "border-Classic-Borders-Cl-55.svg",
          //   "border-Dashed-Borders-Da-01.svg",
          // 生成余下的数据
          {
            id: 1,
            title: "border-Classic-Borders-Cl-01.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/rulers/border-Classic-Borders-Cl-01.svg",
            dataType: "ruler"
          },
          {
            id: 2,
            title: "border-Classic-Borders-Cl-02.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/rulers/border-Classic-Borders-Cl-02.svg",
            dataType: "ruler"
          },
          {
            id: 3,
            title: "border-Classic-Borders-Cl-19.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/rulers/border-Classic-Borders-Cl-19.svg",
            dataType: "ruler"
          },
          {
            id: 4,
            title: "border-Classic-Borders-Cl-20.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/rulers/border-Classic-Borders-Cl-20.svg",
            dataType: "ruler"
          },
          {
            id: 5,
            title: "border-Classic-Borders-Cl-23.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/rulers/border-Classic-Borders-Cl-23.svg",
            dataType: "ruler"
          },
          {
            id: 6,
            title: "border-Classic-Borders-Cl-44.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/rulers/border-Classic-Borders-Cl-44.svg",
            dataType: "ruler"
          },
          {
            id: 7,
            title: "border-Classic-Borders-Cl-45.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/rulers/border-Classic-Borders-Cl-45.svg",
            dataType: "ruler"
          },
          {
            id: 8,
            title: "border-Classic-Borders-Cl-48.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/rulers/border-Classic-Borders-Cl-48.svg",
            dataType: "ruler"
          },
          {
            id: 9,
            title: "border-Classic-Borders-Cl-55.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/rulers/border-Classic-Borders-Cl-55.svg",
            dataType: "ruler"
          },
          {
            id: 10,
            title: "border-Dashed-Borders-Da-01.svg",
            cover: "https://xiaomingyan.com/static/v/design/assets/rulers/border-Dashed-Borders-Da-01.svg",
            dataType: "ruler"
          }
        ] },
        {
          title: "符号",
          type: "symbols",
          hasMore: true,
          items: [
            {
              id: 1,
              title: "bat",
              path: "m143.40468,206.20782c-0.49527,-8.51843 -1.60919,-23.17813 -13.91826,-16.10698c-5.69614,2.11977 -22.79842,7.51244 -14.5293,-3.62979c-4.53243,-11.10219 -22.97476,5.42294 -24.24419,-2.29205c9.91943,-10.64906 -4.7813,-22.35199 -15.17139,-14.80321c-6.39341,1.76166 -19.4276,12.91188 -21.9789,9.37552c5.93793,-7.52516 19.31312,-22.93167 3.18112,-27.55084c-17.5302,-3.97589 -32.93319,8.09392 -48.1771,14.68205c-4.57452,3.57106 -10.39707,2.94862 -4.70683,-2.99597c19.7419,-30.64111 50.72646,-53.70857 85.10566,-65.43076c8.33369,-2.70812 21.16511,-8.70424 21.41656,4.97536c5.15313,12.59007 8.81947,28.33097 22.08977,34.80917c15.28362,8.49702 4.32793,-24.52711 20.16156,-12.05241c6.66379,4.32207 20.92268,-3.91697 22.87737,0.71265c-3.88257,5.55579 -5.70456,15.41883 4.55382,10.3489c17.81406,-7.0078 30.89859,-22.70471 39.67026,-39.22318c9.16278,-1.3768 18.27335,5.56162 26.62798,9.24753c27.74529,15.70954 44.86571,45.39448 52.13728,75.65768c-7.5513,-4.24557 -14.87186,-12.828 -24.02185,-16.20273c-9.75534,-4.87419 -20.75789,-5.73363 -31.48114,-5.39867c-5.02554,5.98985 -7.99353,13.42558 -3.62529,20.86708c3.80284,14.25407 -12.13176,-4.90576 -17.88498,-6.20744c-10.74191,-7.67955 -21.03323,3.92213 -18.67635,14.82222c-2.42909,2.10051 -9.92085,-3.5218 -14.32263,-2.86926c-9.05026,-2.72606 -15.42468,1.20085 -9.97261,10.61331c-7.98315,-0.97417 -19.64474,-13.28291 -26.70493,-1.69363c-3.0779,2.89514 -4.66377,8.66307 -8.40561,10.34547z",
              pathType: 'animals',
              dataType: "symbol",
            },
            {
              id: 2,
              title: "bull",
              path: "m247.95622,28.12305c-12.19972,2.23394 -21.61887,16.95667 -20.74588,29.01591c1.44209,13.7284 17.93463,5.12075 22.80087,1.23941c-2.90906,11.49207 -26.14024,13.85409 -24.83565,-0.12387c-17.69467,13.05878 -30.95056,33.52913 -52.86781,40.14553c-19.77757,4.59067 -40.50726,3.0742 -60.45068,0.39017c-12.12445,-1.13604 -23.69794,-7.26224 -35.91985,-5.97962c-13.09134,3.59118 -23.59412,13.16467 -36.65408,16.93906c-13.77014,6.03062 -8.51065,22.6805 -9.70401,34.47604c0.36829,17.55977 -2.85913,36.16287 -15.09811,49.55722c-7.11563,10.54993 -7.76443,24.43282 -13.48046,35.44298c18.99679,-0.19772 7.54522,-25.59486 17.99728,-35.91756c14.58305,-6.75189 14.16003,-25.2986 16.19452,-38.95529c1.4834,-5.51941 0.74519,-25.08188 6.61763,-22.44334c7.21924,16.22275 11.33028,34.35388 9.69645,52.12326c-9.5553,8.96404 -24.74576,15.34862 -22.54872,31.87126c0.72458,14.96526 -8.38036,25.74033 -15.4907,37.48604c4.56749,6.89259 1.00608,20.69472 14.11573,16.65324c8.77115,1.68887 13.10825,-2.37698 4.45589,-8.42346c-13.07829,-12.56499 5.13552,-29.16821 12.20585,-40.168c7.30689,-12.28131 22.16195,-12.86801 33.02653,-20.13979c15.00671,-8.95824 25.97935,-22.79263 35.92999,-36.78595c8.71432,9.26259 -13.75776,17.74474 -17.07076,27.20334c-7.22755,7.75058 -20.15694,21.85651 -2.99889,26.65347c13.26358,4.53796 25.75887,13.79143 25.35975,28.30255c0.22051,9.84615 24.38135,18.76527 19.43611,2.77341c-8.3609,-14.92882 -28.34064,-20.79163 -33.65835,-37.70844c-3.6715,-12.98383 11.61318,-19.27325 18.93525,-8.74269c12.96419,-1.41862 26.57983,-10.04028 40.80356,-11.3647c14.66299,-5.4577 18.06927,14.52957 29.8145,19.76668c9.79047,9.67969 18.77974,21.93582 17.54285,36.4783c1.1926,12.30893 9.52699,25.16873 23.92239,23.90201c16.80026,-2.80963 -5.10118,-20.70317 -12.79568,-24.81631c-11.14896,-13.29695 -9.30676,-32.20113 -16.24597,-47.51259c-5.00217,-4.52083 0.22685,-26.45532 0.40694,-10.76334c-0.90044,17.98242 24.73294,7.66248 22.97939,-6.09152c4.36166,-10.95654 -11.58513,-4.19417 -9.47617,-15.24252c-1.73091,-13.74937 -0.74355,-30.75096 -12.6731,-40.17292c-6.8737,-6.7591 -4.7831,-7.41829 2.70201,-2.07212c14.59439,7.55807 11.75914,24.79303 12.78276,38.37691c4.22589,17.80225 21.30753,-5.24332 20.80711,-14.89757c2.92691,-20.96336 12.92174,-42.46973 32.42046,-52.68139c-5.2402,-2.56694 -30.94765,6.73531 -28.79092,-4.9679c10.59921,9.00244 25.18661,-0.80075 37.71524,1.85265c16.62164,0.68233 20.74963,-22.79317 2.53195,-23.94116c-11.78333,-6.98062 -21.92947,-19.31897 -37.15829,-18.35906c-22.07759,7.39931 -8.43927,-13.11165 -2.53694,-22.37832zm21.60802,9.50184c-1.66193,5.79599 -12.61478,17.62506 0.56973,12.83867c1.89221,-3.91013 1.1131,-8.97168 -0.56973,-12.83867zm-3.4996,26.34877c5.90985,9.81916 -11.80539,1.02993 0,0zm24.39551,10.15293c-2.05029,4.18517 5.51468,4.9676 -0.32553,4.96455c-3.08926,4.10121 -4.4324,-5.29953 0.32553,-4.96455z",
              pathType: 'animals',
              dataType: "symbol",
            },
            {
              id: 3,
              title: "camel",
              path: "m105.23692,274.01276c10.42601,-6.85904 -13.23158,-12.66162 -16.74452,-19.13904c-10.34003,-12.71768 -13.56136,-29.62202 -16.44211,-45.3219c4.95107,-8.43617 2.94567,-17.1517 4.73958,-25.91959c8.77055,-13.01825 13.62244,-28.29056 22.43666,-41.26205c9.81532,2.07159 20.42883,10.03517 30.26162,13.06094c8.8764,15.9576 -7.35719,29.2457 -5.44854,44.69498c3.72314,14.40366 -6.25101,26.40735 -8.25558,39.83173c0.06986,12.69931 11.61848,25.55493 24.23922,16.82416c-0.64038,-9.26088 -18.64324,-12.13185 -10.58395,-25.1562c2.65187,-13.46596 11.34413,-24.24693 17.91676,-35.55937c-3.71349,-13.26427 1.2287,-30.0778 9.59569,-40.02118c8.49532,8.2068 14.36288,22.63718 15.66277,34.12883c0.16464,13.17332 17.70532,21.98904 17.37173,37.50392c1.31061,13.71669 7.73416,26.77841 16.64259,34.21387c4.65822,9.68192 33.56361,4.63116 18.16859,-6.87111c-12.71291,-11.47281 -27.33986,-23.63953 -29.27029,-41.92267c-5.27388,-10.85303 6.84843,-26.2316 -8.03899,-30.76501c0.92262,-14.70679 -2.97293,-31.40077 5.40811,-44.51862c12.07202,-10.31686 29.7518,-11.08165 41.29709,-22.49498c14.0099,-9.28757 21.96306,-24.50421 26.44456,-40.2729c6.78918,-7.60537 17.33322,-24.04447 29.06323,-15.49826c11.50851,7.1165 3.01477,-10.78561 9.62354,-14.73589c-5.45358,-19.67866 -27.58679,-10.231 -41.40082,-15.14074c-12.54193,-8.39989 -25.52765,-3.55679 -34.67496,6.0378c-6.85069,3.08698 -3.14447,11.16754 3.57637,8.12783c-4.82072,16.0155 -11.46542,33.6401 -26.07742,43.1243c-16.7653,7.33572 -26.11705,-14.39821 -36.07204,-23.83146c-10.86565,-10.63506 -17.60231,-26.15123 -31.2878,-33.45204c-19.0355,-4.82 -33.49794,11.89507 -47.87449,21.30644c-14.26775,7.14342 -31.39994,10.67369 -41.13367,24.60683c-16.15372,19.41527 -5.91326,48.70807 -22.89915,67.80049c-6.99636,10.58755 -22.39972,18.21231 -20.28306,32.7636c7.50211,15.58318 0.92728,34.18239 5.02367,50.94881c3.02735,12.11708 7.50982,27.68176 22.18437,29.48123c11.54434,7.31882 17.83198,-8.01192 5.60827,-12.45197c-14.75563,-6.55614 -16.77197,-25.01053 -17.95741,-39.18628c-3.25454,-14.0275 7.86033,-23.30806 12.45064,-34.31837c-3.87635,-10.75487 9.79252,-25.37375 18.46243,-23.19664c-6.47958,9.9541 -15.94005,22.87103 -0.60315,31.06966c-0.20134,0.50305 2.25023,-9.18846 6.19941,-12.10042c-0.58951,-7.59273 -8.29086,-14.05685 -0.12206,-21.73929c14.33151,-9.55606 11.17263,18.16365 8.19696,26.02383c-0.15744,12.07039 -16.33567,21.65707 -8.0749,33.75336c9.04985,14.91904 13.29631,32.04613 16.76897,48.94904c4.98299,14.02148 17.57185,24.27618 33.31381,20.65268l2.58825,-0.02829z",
              pathType: 'animals',
              dataType: "symbol",
            },
            {
              id: 4,
              title: "cat",
              path: "m111.55353,268.57376c-12.38409,-9.66019 -26.54234,-3.66064 -40.17431,-4.38614c-11.9392,-10.23105 -26.45395,2.16507 -37.70551,-7.68756c-14.55057,-12.97847 10.67308,-21.10451 5.29292,-36.51207c-0.60409,-22.18257 -10.10326,-42.27484 -20.08909,-60.91698c-7.07184,-14.82233 -4.56518,-31.85568 -6.84103,-47.71686c-8.17014,-11.38815 -16.33076,-25.48726 -6.60928,-39.55753c10.981,-11.86565 5.81937,-27.47561 1.50418,-41.19728c11.10318,3.26597 23.84772,18.14071 38.4552,15.16287c9.93419,-6.39761 15.9648,-0.073 17.62218,11.6365c5.20781,15.03792 8.24681,35.60265 24.68163,40.4529c17.26196,4.92876 36.58965,6.02341 50.24171,20.484c24.96439,23.38795 36.53986,60.25828 35.56061,95.79604c2.26117,16.61917 23.11539,7.79897 33.43477,10.24997c17.3054,-0.76804 33.91818,4.66769 50.66774,8.39909c14.94962,3.97684 27.61282,-8.59756 41.65988,-10.10515c2.37341,14.53128 -16.06888,20.58582 -26.14133,25.0639c-11.95706,5.08662 -24.89989,5.20694 -37.1826,1.47655c-26.55344,-6.62021 -54.69701,-4.88251 -79.92953,6.75992c-13.61838,5.01505 -26.84254,14.51093 -41.6569,13.32327l-2.79124,-0.72549l0,0.00003z",
              pathType: 'animals',
              dataType: "symbol",
            },
            {
              id: 5,
              title: "chick",
              path: "m76.6114,300.49948c-0.94218,-11.68399 1.80264,-23.81186 -2.78349,-35.22473c-7.45612,-25.10127 -23.93798,-47.16536 -31.36633,-72.21014c-3.21228,-16.80365 -8.65163,-34.79272 -2.2363,-51.43718c9.2771,-20.44891 24.58445,-39.1077 45.00853,-51.46853c11.45798,-6.87112 33.39433,1.8131 33.44485,-16.51133c3.62297,-20.89642 15.43811,-40.3082 30.48538,-56.28489c17.86485,-17.49571 47.98021,-20.77926 71.28149,-10.72216c13.19823,4.36545 26.92773,11.92505 29.85556,25.342c-2.0408,13.23198 13.36339,22.40786 12.41484,34.53756c-13.98409,-0.03379 -27.4267,2.25514 -39.10866,9.99602c-8.20006,3.8867 -26.4511,6.08187 -12.88864,15.86904c12.71146,21.22634 12.39029,48.02362 0.02443,69.35255c-8.24092,16.61523 -18.78058,33.14909 -36.37866,43.00504c-13.36313,9.14961 -27.77914,16.93257 -42.68192,23.79149c-11.62872,11.1774 5.32764,27.26614 9.71201,38.8335c3.36447,3.54044 4.524,10.84882 11.15869,9.08932c15.28535,0.25418 32.76015,-1.9313 44.98404,7.81229c-8.94319,8.25949 -25.89421,-1.41025 -38.02573,4.80051c-8.78024,5.75812 -19.06332,7.43823 -31.36371,7.58014c-13.23612,4.30203 -27.23189,-3.61423 -39.08569,1.66962c-4.11388,0.41238 -8.38321,3.40195 -12.45068,2.1799zm58.28394,-16.2124c-4.84233,-9.87674 -20.53861,1.56897 -6.10292,2.32874c2.30783,-0.47092 12.8125,3.03821 6.10292,-2.32874zm-17.85122,-4.32443c14.82944,-9.3367 7.74453,-25.48042 -1.79045,-35.63309c-3.24258,-2.97528 -4.73457,-8.94336 -9.13439,-9.94019c-6.73362,0 -13.46722,0 -20.20084,0c-4.65086,8.49229 -2.48404,17.86589 0.89217,26.43201c3.51066,10.88467 6.16319,28.60654 23.56189,23.00385c2.6806,-0.4599 4.89924,-2.07458 6.67162,-3.86258z",
              pathType: 'animals',
              dataType: "symbol",
            },
            {
              id: 6,
              title: "cormorant",
              path: "m143.5415,0.99936c-4.24326,11.41716 -19.29625,4.15632 -24.74561,12.50427c0.52748,6.07653 -8.29025,7.80436 -13.00653,8.43892c-8.50133,3.84879 -22.80692,-4.79845 -26.45377,4.01417c10.96676,1.70561 23.50823,0.97173 33.37776,7.63992c6.81084,8.30698 18.80501,9.32233 23.86815,19.00227c5.01492,11.90637 0.21405,24.79235 -6.1066,35.16777c-5.40714,11.63457 -14.24293,22.0266 -17.15868,34.6068c0.20795,13.02319 4.72718,25.69211 3.20084,38.80902c0.9605,10.14279 6.64024,19.14648 10.04536,28.64983c5.00912,10.57565 9.93535,21.70013 17.62276,30.53665c7.02892,8.87558 29.89705,11.67009 23.64502,24.91443c-4.01926,11.10844 -7.40147,24.48637 -19.39478,29.5565c-9.50977,5.9848 -21.3932,8.93677 -29.06369,17.37073c3.84956,0.36453 28.16327,-14.36331 23.8996,1.69739c-9.52658,11.2518 16.95053,-0.69223 23.42963,-2.18207c4.74442,-0.99915 4.29691,14.62488 8.52766,3.80228c5.95903,-10.08762 6.23502,-21.34366 11.26126,-30.51312c2.4781,-10.25645 3.82962,7.94009 9.64467,10.12222c7.07556,9.50238 7.79694,-14.07236 11.23129,-19.70615c2.62747,-8.54028 4.63826,-23.31885 8.02322,-27.91885c0.19868,-2.83281 6.58795,3.93147 5.0274,-3.78851c0.90347,-23.48584 -1.83659,-48.86755 -15.67365,-68.59196c-9.60602,-8.62669 -13.22336,-21.57266 -21.36568,-31.47811c-10.01912,-4.8186 -8.05391,-19.66993 -20.19205,-21.12443c-2.75856,-10.2361 2.62035,-22.86311 4.63016,-33.73514c2.78795,-10.12834 8.4742,-20.66132 3.52232,-31.15684c-3.76698,-10.86702 -11.83783,-21.03737 -23.57631,-23.51091c-5.21049,-2.63619 -9.89668,-4.17218 -2.89241,-7.84742c4.71588,-7.73713 -7.28709,7.39913 -1.58588,-2.982l0.25854,-2.29765l-0.00003,0zm-57.08003,24.11987c12.78673,0.33177 -8.83535,0.35227 0,0zm92.46721,218.72338c11.05893,4.6954 0.80228,21.55537 -5.46918,26.98338c-13.1071,-3.20859 2.39713,-19.21964 5.46918,-26.98338l0,0zm-10.64413,31.82323c-5.88483,2.41168 -15.44353,4.13849 -3.83093,0.46683l1.97208,-0.34274l1.85886,-0.12408z",
              pathType: 'animals',
              dataType: "symbol",
            },
            {
              id: 7,
              title: "cow",
              path: "m28.0749,243.56958c-11.25466,-1.13762 -0.26117,-18.72878 -4.5063,-26.87576c-0.04291,-11.99254 -4.49496,-23.80263 -3.04635,-35.73141c8.85702,-21.03091 1.47632,-43.99974 -0.46577,-65.6628c-0.878,-4.78294 -0.85219,-17.06834 -3.03475,-6.14601c-6.04425,18.41563 -0.13999,41.17824 -5.30961,59.82921c-8.64015,10.38419 -15.16653,-6.09071 -6.91858,-12.40807c9.63606,-15.16887 7.3071,-35.6004 7.63113,-54.51396c-0.41477,-11.95865 4.38277,-26.97649 18.58104,-27.31744c12.14677,-0.91866 23.64877,4.86966 35.90276,4.15359c35.73927,0.55689 71.83095,0.86755 107.11801,-5.64501c17.61354,-4.0591 35.14902,3.10693 52.79015,0.20057c9.91351,1.07068 15.15811,-3.56471 10.78886,-12.26689c7.38425,-5.09429 13.06598,9.66071 16.34573,-3.48148c11.89191,-8.19559 13.54935,15.99933 26.71921,9.16614c15.88589,2.05862 -6.90274,16.26875 6.39813,23.38159c8.04169,6.20473 20.35629,21.57409 4.35831,26.00379c-13.75446,-0.96602 -27.54028,-0.06377 -41.30312,0.60226c-6.36993,10.6367 -19.62016,18.61491 -18.16837,32.55296c-1.1003,16.62756 -12.74783,33.02081 -28.69196,38.18489c-6.81386,-1.34894 -9.78644,0.85432 -8.9351,7.83342c-3.52046,9.11967 -4.14098,18.73875 -3.72333,28.43974c-1.04204,5.34808 1.17265,9.50755 4.32187,13.62691c-3.70361,6.41692 -24.92326,2.61598 -16.88379,-9.5238c2.05592,-15.92261 -0.36317,-31.91132 -2.16568,-47.74242c-8.4565,-6.01532 -18.70856,-3.81294 -27.26753,1.0208c-18.88187,6.9252 -40.73763,13.48228 -60.10471,4.59438c-10.79734,-3.01547 -27.0833,-5.25847 -35.10848,3.84904c-3.611,13.73518 -2.64567,28.48619 -5.7238,42.42607c-0.05178,7.28806 6.88112,13.54532 -4.86428,11.51134c-4.90851,0.11278 -9.83028,0.26732 -14.73372,-0.06165zm10.02217,-15.5108c1.93175,-6.52728 -2.78621,-23.11049 -3.1906,-7.64299c-1.60691,4.90746 0.4367,28.47777 2.83738,12.83046c0.15187,-1.72662 0.25968,-3.45683 0.35322,-5.18747z",
              pathType: 'animals',
              dataType: "symbol",
            },
            {
              id: 8,
              title: "crow_2",
              path: "m299.86716,62.24508c-8.36279,-13.35279 -25.79254,-10.94299 -38.7652,-13.97612c-10.77151,-4.46517 -27.26852,-8.74568 -34.93257,4.02601c-10.22766,11.92024 -19.30536,24.77381 -27.38379,38.20519c-16.9417,18.56395 -37.51366,33.44937 -58.19264,47.49408c-17.41919,8.55826 -36.48907,15.23247 -50.59015,29.17691c-26.77713,17.17799 -59.39612,20.30975 -89.00278,30.37996c5.24787,1.82477 28.48156,-4.80739 12.86404,2.45506c-11.61908,3.82678 4.57293,7.38318 9.74338,4.83008c-4.08242,4.36552 -5.2054,4.72249 -0.18473,4.65681c-9.12115,5.09712 20.25491,-1.58305 4.07883,5.5506c-7.04263,2.05971 -24.35976,21.06046 -8.48079,12.5005c14.76321,-6.14401 30.50038,-9.23448 45.85791,-13.45705c-11.48634,11.80891 -27.85513,19.19374 -35.74965,34.16698c0.17943,3.86479 12.21982,-7.85281 17.31087,-9.77229c28.95095,-17.49719 59.28473,-33.71347 91.89844,-43.16046c4.45381,1.07288 5.32478,12.99994 14.00563,6.90237c0.76199,7.59987 19.82927,-11.92125 14.84979,3.30377c8.25793,-13.03635 -0.01482,14.1528 7.62892,18.26904c3.90089,5.15268 19.92041,12.26512 6.86195,14.03082c-5.77165,8.63597 8.09146,-3.46425 11.11865,4.62627c11.3129,4.10901 3.07231,8.32173 -5.11652,5.83363c-6.27592,-0.83809 -7.57079,7.40965 -1.22719,2.29182c7.57507,5.19347 19.60568,3.32813 29.26515,5.56088c9.65308,0.80066 21.35422,-9.88435 25.01279,-7.29437c-8.89755,-6.38512 -21.77765,1.41119 -31.54323,-3.51736c-2.05963,-6.62599 22.89082,2.37143 22.94131,-8.82851c11.68727,-1.08766 -9.82895,-2.59717 -14.00406,0.04509c-14.38026,0.76889 -21.75813,-12.59969 -31.88164,-20.19017c0.30659,-15.75429 11.86186,-29.28856 23.95569,-38.18524c15.77855,-9.50124 31.96706,-21.73888 36.43575,-40.70174c4.63271,-16.88809 7.21239,-34.29048 9.31848,-51.60873c2.84918,-11.17406 11.03882,-21.49306 23.60089,-20.65947c6.77469,-0.94415 13.57404,-1.72816 20.30646,-2.95438z",
              pathType: 'animals',
              dataType: "symbol",
            },
            {
              id: 9,
              title: "crow",
              path: "m65.63132,15.69366c7.23991,-11.19251 23.71874,-13.17996 36.20271,-14.69413c13.92134,1.25098 24.65079,12.10254 32.81262,22.59631c9.49452,8.5772 21.08662,15.85565 25.83853,28.41352c12.01437,5.95259 26.19815,9.13653 33.55229,21.87244c11.11548,14.36729 17.52112,31.75739 23.31628,48.60368c0.92021,12.5585 6.47,24.01521 8.36046,36.46043c3.24197,12.33818 5.82637,24.53572 9.31963,36.76498c3.88237,12.71416 9.39792,24.81319 13.2628,37.54517c7.05891,11.17328 13.48564,22.96204 17.86821,35.4054c-10.48648,-0.88873 0.96857,15.8573 2.93524,22.45895c2.86746,13.58783 -12.84537,5.80856 -15.59308,-0.46634c-9.70456,9.1796 -29.57259,11.24072 -38.3669,-0.80743c-9.26392,-12.20752 -14.38051,-27.69696 -27.16855,-36.53391c-5.02811,-4.18506 -9.90665,-22.45958 -11.7061,-6.32031c6.38489,16.05743 -18.74254,6.90547 -27.66772,9.78912c-15.99664,-3.21661 6.07263,-12.35889 12.86923,-11.27576c6.38602,-6.35408 17.01372,-16.99594 1.7589,-20.33147c-10.44731,-4.15326 -23.84068,-14.68553 -29.71439,0.99188c-7.37552,3.90117 -20.59412,22.40862 -5.95329,23.77255c5.91614,12.10878 -17.0737,3.35048 -23.49316,6.21452c-6.05255,1.90814 -21.13758,-1.4375 -7.08788,-4.49867c12.08796,-1.9845 17.85132,-16.8317 25.44044,-25.82515c-0.25166,-11.53856 -9.48829,-20.69617 -16.41167,-29.40816c-7.36517,-12.27962 -17.64172,-22.79747 -22.75925,-36.23717c-3.35689,-13.95544 -9.74807,-26.85826 -12.98938,-40.84583c-3.65936,-14.01762 -7.85575,-29.82359 0.01893,-43.25633c3.58914,-11.78534 5.08364,-22.78083 -2.44828,-32.4814c-10.40722,-8.4583 -25.19866,-5.06594 -37.19873,-10.67507c-1.4463,-9.05923 17.76661,-12.5158 26.11695,-14.53937c3.17027,-0.11009 5.59681,-2.76167 8.88516,-2.69248z",
              pathType: 'animals',
              dataType: "symbol",
            },
            {
              id: 10,
              title: "dog",
              path: "m100.16203,296.98279c-8.8212,-9.63385 1.38332,-24.43997 -0.42293,-36.27057c0.75693,-11.26283 0.70357,-22.55605 0.97627,-33.83612c-5.62751,-3.03004 -11.14646,-9.8163 -17.39571,-9.15442c-9.39647,12.28885 -8.36188,28.63301 -15.80033,41.86707c-4.14935,12.68604 -14.20047,25.1369 -28.95629,23.20023c-15.78228,0.24448 -5.31179,-12.67972 3.94138,-14.51392c15.5036,-7.47278 14.489,-27.14363 17.24157,-41.59114c1.02824,-10.18478 3.24236,-20.5625 3.54647,-30.63432c-6.4542,-14.31418 -15.78849,-28.37114 -13.67442,-44.85196c-0.91037,-17.78856 4.2768,-37.23788 -5.08019,-53.53189c-5.56927,-15.61405 3.8713,-31.59072 2.9399,-47.52759c0.9721,-14.78285 -5.20505,-30.54867 1.20562,-44.61136c13.7762,-15.53139 12.97964,13.29988 18.95111,20.54415c5.64886,15.40877 24.7487,10.76537 35.50636,4.24826c7.2022,-4.10769 16.87807,-28.32801 24.44378,-14.32351c3.37997,14.22579 -6.14093,25.38077 -12.22646,36.88495c-6.86581,22.01683 5.86861,44.08519 20.93388,59.44197c24.83763,26.97977 44.07555,59.68134 54.0882,95.03609c1.31316,14.68071 3.98535,28.23558 12.82726,40.18617c10.20438,10.1714 26.16472,9.68739 39.32852,13.25957c9.22101,2.52521 30.75206,5.14639 26.47435,17.3808c-14.74448,2.4689 -30.09541,0.23105 -44.90068,-1.32291c-17.28331,-2.73001 -35.00906,-7.2897 -49.09666,-18.1597c-14.62904,-9.61427 -18.7715,20.00995 -34.01671,10.65375c-2.19362,-7.70334 10.66454,-19.74266 -6.53938,-19.26297c-6.33104,0.30879 -15.00338,1.82024 -19.76239,4.89166c1.07452,12.16098 2.04812,24.36316 4.2893,36.36713c-1.78267,6.00809 -14.15643,12.93057 -18.82182,5.63058z",
              pathType: 'animals',
              dataType: "symbol",
            },
            
          ],
        }
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
      if(type === "pictograms"){
        loadScript("https://xiaomingyan.com/static/v/design/js/shapes.min.js", () => {
          // SHAPES = {
          //   "font-awesome": {
          //     "accessible-icon": { l: "Accessible Icon", s: ["fab"], u: "f368" },
          //     accusoft: { l: "Accusoft", s: ["fab"], u: "f369" },
          //   },
          //   material: {
          //     "3d_rotation": "e84d",
          //     "ac_unit": "eb3b",
          //   },
          //   icofont: {
          //     "angry-monster": "e800",
          //     bathtub: "e801",
          //     "bird-wings": "e802",
          //   },
          // };

          data = [];
          // shapes 中每类取 10个
          for (let key in SHAPES) {
            const itemsObj = SHAPES[key];
            // 转成数组，每个数组是 key+':'+值的字符串
            const items = [];
            for (let item in itemsObj) {
              items.push([item, itemsObj[item]]);
            }
            
            data.push({
              title: key,
              type: key,
              hasMore: items.length > 10,
              items: items.slice(0, 10).map((icon, index) => {
                return {
                  id: index + 1,
                  title: `${index + 1}`,
                  icon: icon,
                  iconType: key,
                  dataType: 'pictograms'
                };
              }),
            });
          }
          resolve(data);
        });
      }
      if(prevType === "pictograms"){
        // 转成数组，每个数组是 key+':'+值的字符串
        const items = [];
        for (let item in SHAPES[type]) {
          items.push([item, SHAPES[type][item]]);
        }
        data = items.map((icon, index) => {
          return {
            id: index + 1,
            title: `${index + 1}`,
            icon: icon,
            iconType: type,
            dataType: 'pictograms'
          };
        });
        resolve(data);
      }
      if(type === "images"){
        loadScript("https://xiaomingyan.com/static/v/design/assets/images.en.js", () => {
          data = ZMprops.images;
          // ZMprops.images = {
          //   holidays: {
          //     desc: "Holidays",
          //     imgs: [
          //       "1997283.png",
          //       "3127839474.png",
          //       "3546790.png",
          //       "3548652.png",
          //       "3550250.png",
          //       "3553181.png",
          //       "3556447.png",
          //       "3574013.png",
          //       "3684185.png",
          //       "3822566.png",
          //     ],
          //   },
          //   ...
          // };
          data = Object.keys(data).map((key) => {
            const item = data[key];
            return {
              title: imagesNameMap[item.desc] || item.desc,
              type: key,
              hasMore: item.imgs.length > 10,
              items: item.imgs.slice(0, 10).map((img, index) => {
                return {
                  id: index + 1,
                  title: `${index + 1}`,
                  cover: `https://xiaomingyan.com/static/v/design/assets/images/${key}/${img}`,
                  dataType: 'images'
                };
              }),
            };
          });
          resolve(data);
        });
      }
      if(prevType === "images"){
        data = ZMprops.images[type];
        data = data.imgs.map((img, index) => {
          return {
            id: index + 1,
            title: `${index + 1}`,
            hasMore: false,
            cover: `https://xiaomingyan.com/static/v/design/assets/images/${type}/${img}`,
            dataType: 'images'
          };
        });
        resolve(data);
      }
      if(type === "emojis"){
        loadScript("https://xiaomingyan.com/static/v/design/assets/emojis.js", () => {
          data = ZMprops.emojis;
          // ZMprops.emojis = [
          //   {
          //     char: "\ud83d\ude00",
          //     code: "1f600",
          //     name: "grinning face",
          //     cat: "face-smiling",
          //     filename: "emoji_u1f600.svg",
          //   },

          data = data.map((item, index) => {
            return {
              id: index + 1,
              title: item.name,
              cover: `https://xiaomingyan.com/static/v/design/assets/emojis/${item.filename}`,
              dataType: 'emojis'
            };
          });
          resolve(data);
        });
      }
      if(type === "borders"){
        loadScript("https://xiaomingyan.com/static/v/design/assets/borders.js", () => {
          data = ZMprops.borders;
          // ZMprops.borders = [
          //   "corner-Blocks-Borders-Bl-01.svg",
          //   "corner-Blocks-Borders-Bl-02.svg",
          //   "corner-Blocks-Borders-Bl-03.svg",
          //   "corner-Blocks-Borders-Bl-04.svg",
          //   "corner-Blocks-Borders-Bl-06.svg",
          //   "corner-Blocks-Borders-Bl-09.svg",
          //   "corner-Blocks-Borders-Bl-10.svg",
          //   "corner-Blocks-Borders-Bl-12.svg",
          //   "corner-Blocks-Borders-Bl-13.svg",
          //   "corner-Blocks-Borders-Bl-14.svg",

          data = data.map((item, index) => {
            return {
              id: index + 1,
              title: item,
              cover: `https://xiaomingyan.com/static/v/design/assets/borders/${item}`,
              dataType: 'border'
            };
          });
          resolve(data);
        });
      }
      if(type === "rulers"){
        loadScript("https://xiaomingyan.com/static/v/design/assets/rulers.js", () => {
          data = ZMprops.rulers;
          // ZMprops.rulers = [
          //   "border-Classic-Borders-Cl-01.svg",
          //   "border-Classic-Borders-Cl-02.svg",
          //   "border-Classic-Borders-Cl-19.svg",
          //   "border-Classic-Borders-Cl-20.svg",
          //   "border-Classic-Borders-Cl-23.svg",
          //   "border-Classic-Borders-Cl-44.svg",
          //   "border-Classic-Borders-Cl-45.svg",
          //   "border-Classic-Borders-Cl-48.svg",
          //   "border-Classic-Borders-Cl-55.svg",
          //   "border-Dashed-Borders-Da-01.svg",

          data = data.map((item, index) => {
            return {
              id: index + 1,
              title: item,
              cover: `https://xiaomingyan.com/static/v/design/assets/rulers/${item}`,
              dataType: 'ruler'
            };
          });
          resolve(data);
        });
      }
      if(type === "symbols"){
        // /v/design/js/symbols
        loadScript("https://xiaomingyan.com/static/v/design/js/symbols.min.js", () => {
          // const SYMBOLS = {
          //   animals: {
          //     bat: 
          data = [];
          for (let key in SYMBOLS) {
            const itemsObj = SYMBOLS[key];
            const items = [];
            for (let item in itemsObj) {
              items.push([item, itemsObj[item]]);
            }
            data.push({
              title: key,
              type: key,
              hasMore: items.length > 10,
              items: items.slice(0, 10).map((symbol, index) => {
                return {
                  id: index + 1,
                  title: symbol[0],
                  path: symbol[1],
                  pathType: key,
                  dataType: 'symbol'
                };
              }),
            });
          }
          resolve(data);
        });
      }
      if(prevType === "symbols"){
        const itemsObj = SYMBOLS[type];
        const items = [];
        for (let item in itemsObj) {
          items.push([item, itemsObj[item]]);
        }
        data = items.map((symbol, index) => {
          return {
            id: index + 1,
            title: symbol[0],
            path: symbol[1],
            pathType: type,
            dataType: 'symbol'
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

    // k.append("<h4><span>FontAwesome</span></h4>");
    //         for (let a in SHAPES["font-awesome"]) {
    //           let e = SHAPES["font-awesome"][a];
    //           for (let h of e.s)
    //             k.append(
    //               `<i class="ficon ${h} fa-2x fa-fw fa-${a}" data-shape="fa:${h},${e.u}" title="${e.l} (${e.u})"></i>`
    //             );
    //         }
    //         k.append(
    //           '<h4><span><i class="fab fa-google"></i> Material Design</span></h4>'
    //         );
    //         for (let a in SHAPES.material)
    //           k.append(
    //             `<span class="ficon material-icons" data-shape="ma:${SHAPES.material[a]}" title="${a} (${SHAPES.material[a]})">&#x${SHAPES.material[a]};</span>`
    //           );
    //         k.append("<h4><span>IcoFont</span></h4>");
    //         for (let a in SHAPES.icofont)
    //           k.append(
    //             `<i class="ficon icofont icofont-${a}" data-shape="ico:${SHAPES.icofont[a]}" title="${a} (${SHAPES.icofont[a]})"></i>`
    //           );
    if(item.icon){
      let iconEl;
      const info = item.icon;
      if(item.iconType === "material"){
        iconEl = document.createElement("span");
        iconEl.className = "ficon material-icons !text-6xl";
        iconEl.innerHTML = `&#x${info[1]};`;
        iconEl.dataset.shape = `ma:${info[1]}`;
        title = `${info[0]} (${info[1]})`;
        
      }
      if(item.iconType === "font-awesome"){
        iconEl = document.createElement("i");
        const iconInfo = info[1];
        iconEl.className = `ficon ${iconInfo.s[0]} fa-2x fa-fw fa-${info[0]} !text-6xl`;
        iconEl.dataset.shape = `fa:${iconInfo.s[0]},${iconInfo.u}`;
        title = `${iconInfo.l} (${iconInfo.u})`;
      }
        
      if(item.iconType === "icofont"){
        iconEl = document.createElement("i");
        iconEl.className = `ficon icofont icofont-${info[0]} !text-6xl`;
        iconEl.dataset.shape = `ico:${info[1]}`;
        title = `${info[0]} (${info[1]})`;
      }

      if(iconEl){
      iconEl.title = title;
      iconEl.dataset.ornament = item.dataType;
      iconEl.dataset.iconType = item.iconType;
      itemDiv.appendChild(iconEl);
      }
    }

    if(item.path){
      const svgStr = buildSvgString(item.pathType, item.path);
      const base64Svg = "data:image/svg+xml;base64," + encodeSvgBase64(svgStr);
      const img = document.createElement("img");
      img.src = 'https://xiaomingyan.com/static/common/d.gif';
      img.setAttribute("data-src", base64Svg);
      img.alt = title;
      img.title = title;
      img.className = "object-contain max-w-full max-h-full w-full h-full p-1";
      itemDiv.appendChild(img);
      img.dataset.ornament = item.dataType;
      img.dataset.path = item.path;
      img.dataset.pathType = item.path;
      itemDiv.appendChild(img);
      
    }

    
    // const titleSpan = document.createElement("span");
    // titleSpan.className = "text-xs block text-center";
    // titleSpan.textContent = title;
    // itemDiv.appendChild(titleSpan);
    containerEl.appendChild(itemDiv);
  });
}

// // 渲染列表 items  类似瀑布流，但是固定宽度高度
// function renderList(containerEl, items) {
//   containerEl.innerHTML = "";
//   items.forEach((item) => {
//     const itemDiv = document.createElement("div");
//     itemDiv.className =
//       "min-w-[50px] h-20 flex flex-col items-center justify-center rounded text-xs bg-slate-200 p-1";
//     if (item.cover) {
//       const img = document.createElement("img");
//       img.src = 'https://xiaomingyan.com/static/common/d.gif';
//         img.setAttribute("data-src", item.cover);
//       img.alt = item.title;
//       img.className = "w-10 h-10 object-cover mb-1";
//       itemDiv.appendChild(img);
//     }
//     const titleSpan = document.createElement("span");
//     titleSpan.textContent = item.title;
//     itemDiv.appendChild(titleSpan);
//     containerEl.appendChild(itemDiv);
//   });
// }


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
//     { title: "装饰图案", type: "ornaments",hasMore:true, items:[
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
emitter.on("content:load", (event) => {
  const { type } = event;

  // 注意 ornaments 有s
  if (type === "ornaments") {
    container = event.container;
    container.innerHTML = "";
    const mainView = createView("", "", 1, false, "");
    viewStack.length = 0;
    viewStack.push(mainView);
    container.appendChild(mainView);
    if(!isBind){
      isBind = true;
      delegator.on(container, "click", ".item", (event, target) => {
        // 找 target 里面每一个元素
        const item = target.firstElementChild;
        let url = item.getAttribute("data-src") || item.src;
        const dataType = item.dataset.ornament;
        if(dataType === 'ornament'){
          emitter.emit("operation:svg:init", url);
        }
        if(dataType === 'pictograms'){
          // const iconType = item.dataset.iconType;
          const shape = item.dataset.shape;
          emitter.emit("operation:iconFont:init", shape);
        }
        if(dataType === 'overlay'){
          // url 要转成原图
          url = item.dataset.original;
          emitter.emit("operation:overlay:init", url);
        }
        if(dataType === 'images'){
          emitter.emit("operation:image:init", url);
        }
        if(dataType === 'emojis'){
          emitter.emit("operation:image:init", url);
        }
        if(dataType === 'border'){
          url = item.dataset.original;
          emitter.emit("operation:border:init", url);
        }
        if(dataType === 'ruler'){
          emitter.emit("operation:ruler:init", url);
        }
        if(dataType === 'symbol'){
          const path = item.dataset.path;
          emitter.emit("operation:symbol:init", path);
        }
      });
    }
  }
});



