
import { render, emitter, delegator } from "../../__common__/utils";


// 全局 container 变量
let container;
// 全局视图管理栈
const viewStack = [];


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
  viewDiv.className = "w-full h-full flex flex-col";

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
    // titleEl.className = "";
    header.appendChild(backBtn);
    header.appendChild(titleEl);
    viewDiv.appendChild(header);
  } else {
    // const titleEl = document.createElement("h2");
    // titleEl.textContent = title;
    // titleEl.className = "p-2 text-center";
    // viewDiv.appendChild(titleEl);
  }

  // 进入页面时加载数据，加载成功后渲染所有分类区块
  
  loadViewData(title, type, level, prevType).then((data) => {
    if(level === 1){
      const refs = render('', () => `
      <div class="flex-1 py-4 flex flex-col gap-4 overflow-hidden">
        <div class=" px-4">
            <button data-id="upload-image" class="btn-primary w-full">
              <i class="vicon-upload text-lg mr-1"></i>上传图片
            </button>
        </div>
        <div data-id="image-picker" class="flex-1 overflow-hidden"></div>
      </div>
      `, viewDiv);
      emitter.emit("operation:imagePicker:show", {
        container: refs['image-picker'],
        keyword: 'sky',
        orientation: '',
        color: '',
        onSelect: (url) => {
          emitter.emit("operation:upload-image:url", url);
        }
      });
    }

  });

  return viewDiv;
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


// 是否已经绑定事件
let isBind = false;
emitter.on("content:load", (event) => {
  const { type } = event;
  if (type === "image") {
    container = event.container;
    container.innerHTML = "";
    const mainView = createView("图片", "", 1, false, "");
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
        if (id === "upload-image") {
          emitter.emit("operation:upload-image:init");
        }
      });
    }
  }
});



