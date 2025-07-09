import {
  getRefs,
  delegator,
  emitter,
  jsCache,
  jsImport,
} from "../../__common__/utils";
import tippy from "tippy.js";
// import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import Mousetrap from "mousetrap";

const refs = getRefs("#sidebar", "data-id");
// 把所有 refs 都解构出来
const {
  sidebarBtnArea,
  // 侧边栏收起按钮
  sideCollapse,
  // 侧边栏收起按钮图标
  sideCollapseIcon,
  // 侧边栏内容
  sidebarContent,
  // 当前选中对象（组）操作区
  objOpPanel,
  // 标题
  objOpTitle,
  // 关闭按钮
  objOpClose,
  // 操作区域
  objOpContent,
  // 内容显示区
  contentArea,
} = refs;

let currentOperationType = "";
function changeOperationType(type) {
  currentOperationType = type;
  emitter.emit("operation-type-change", type);
}

const types = [
  "template",
  "text",
  "image",
  "ornaments",
  "backgrounds",
  "overlays",
];

const colors = ["green", "purple", "blue", "orange", "pink", "yellow"];


let contentShown = false;

export function toggleSidebar() {
  // 如果没有显示内容区，默认显示 template
  if(sidebarContent.classList.contains("hidden")){
    if(!contentShown){
      toggleContentAreaByType("template");
    }
    showSidebar();
  }else{
    hideSidebar();
  }
  // sidebarContent.classList.toggle("hidden");
  // sideCollapseIcon.classList.toggle("rotate-90");
  // sideCollapseIcon.classList.toggle("-rotate-90");
  // toggleTitle();
  // // 关闭sidebar时，设置当前操作类型为空
  // if (sidebarContent.classList.contains("hidden")) {
  //   changeOperationType("");
  //   canvas.isDrawingMode = false;
  //   canvas.isDrawingShapes = false;
  //   canvas.defaultCursor = "default";
  // }
  
}
function toggleTitle() {
  if (!sideCollapse._tippy) return;
  sideCollapse._tippy.setContent(
    sidebarContent.classList.contains("hidden") ? "展开侧边栏" : "收起侧边栏"
  );
}
function showSidebar() {
  sidebarContent.classList.remove("hidden");
  sideCollapseIcon.classList.add("rotate-90");
  sideCollapseIcon.classList.remove("-rotate-90");

  toggleTitle();
}
function hideSidebar() {
  sidebarContent.classList.add("hidden");
  sideCollapseIcon.classList.remove("rotate-90");
  sideCollapseIcon.classList.add("-rotate-90");
  toggleTitle();
  changeOperationType("");
  canvas.isDrawingMode = false;
  canvas.isDrawingShapes = false;
}

// sideCollapse.addEventListener("click", () => {
//   toggleSidebar();
// });

// 一、显示操作区
// 1. 隐藏内容区
// 2. 显示操作区

function showOperationPanel(operationType, node, title) {
  if (!operationType) return;
  // emitter.emit('operation:destroy', currentOperationType);
  changeOperationType(operationType);

  contentArea.classList.add("hidden");
  objOpPanel.classList.remove("hidden");

  if(title){
    objOpTitle.innerHTML = title;
  }

  const wrappers = refs.objOpContent.querySelectorAll("[data-id=wrapper]");
  wrappers.forEach(wrapper => {
    if(wrapper !== node){
      wrapper.style.display = "none";
    }
  });
  // 如果 node 不是 placeholder 的子元素，则添加
  if(node){
    if(!refs.objOpContent.contains(node)){
      refs.objOpContent.appendChild(node);
    }
    node.style.display = "";
  }

  showSidebar();
}


// 二、隐藏操作区
// 1. 隐藏操作区
// 2. 显示内容区

function hideOperationPanel() {
  canvas.isDrawingMode = false;
  canvas.isDrawingShapes = false;
  if (!currentOperationType) return;
  objOpPanel.classList.add("hidden");
  contentArea.classList.remove("hidden");

  // 取消激活笔刷等
  // canvas.discardActiveObject().requestRenderAll();
  emitter.emit("operation:destroy", currentOperationType);
  changeOperationType("");

  if (!contentShown) {
    hideSidebar();
    sideCollapse.classList.add("hidden");
  }
  
}

// 三、显示内容区
// 1. 隐藏操作区
// 2. 显示内容区

function showContentArea() {
  objOpPanel.classList.add("hidden");
  contentArea.classList.remove("hidden");
  showSidebar();
}

// 切换内容区 4 个子区域的显示隐藏

function toggleContentArea(type) {
  if (!types.includes(type)) return;
  const upperType = type[0].toUpperCase() + type.slice(1);
  const currentBtn = refs[`component:sidebar:${type}`];
  const currentContent = refs[`content${upperType}`];
  const color = colors[types.indexOf(type)];
  // currentBtn.classList.add("bg-slate-100", "shadow-lg", `text-${color}-600`);
  currentBtn.setAttribute("aria-selected", "true");
  currentContent.classList.remove("hidden");
  types.forEach((t) => {
    if (t !== type) {
      const upperT = t[0].toUpperCase() + t.slice(1);
      const btn = refs[`component:sidebar:${t}`];
      const content = refs[`content${upperT}`];
      // btn.classList.remove("bg-slate-100", "shadow-lg", `text-${colors[types.indexOf(t)]}-600`);
      btn.setAttribute("aria-selected", "false");
      content.classList.add("hidden");
    }
  });

  if (currentContent.innerHTML) {
    emitter.emit("content:load", {
      type,
      container: currentContent,
    });
  }

  // vite 中异步加载一个 ornaments.js
  // import('./content/ornaments').then(({createView}) => {
  jsImport('content', type, ({ createView }) => {
    // 通用自定义事件加载内容
    emitter.emit("content:load", {
      type,
      container: currentContent,
      createView,
    });
  }); 
  
}

export async function toggleContentAreaByType(type, showSidebar = false) {
  if (!type) return;
  // 如果是侧边栏按钮, 切换内容区域
  if (types.includes(type)) {
    toggleContentArea(type);
    showContentArea();
    contentShown = true;
    if(showSidebar){
      sideCollapse.classList.remove("hidden");
    }
  }
}

// 判断是否已经加载过及绑定过事件
if (!jsCache["../design/component/sidebar.js"]) {
  // data-id="component:sidebar:template"
 
  // hover 时才显示滚动条，添加 类 overflow-y-auto
  // refs.sidebarBtnArea.addEventListener("mouseenter", () => {
  //   refs.sidebarBtnArea.classList.add("overflow-y-auto");
  // });
  
  // refs.sidebarBtnArea.addEventListener("mouseleave", () => {
  //   refs.sidebarBtnArea.classList.remove("overflow-y-auto");
  // });
  

  const menuHtml = {
    grid: [
      { text: "对齐辅助线", type: "toggleAlignGuides" },
      { text: "关闭", size: 0, type: "applyGrid" },
      { text: "25x25", size: 25, type: "applyGrid" },
      { text: "50x50", size: 50, type: "applyGrid" },
      { text: "75x75", size: 75, type: "applyGrid" },
      { text: "100x100", size: 100, type: "applyGrid" },
    ]
      .map(({ text, size, type }) => {
        let iconCheck = "";
        let dataSize =
          typeof size === "number" ? ' data-size="' + size + '"' : "";
        if (type === "toggleAlignGuides") {
          iconCheck = '<i class="vicon-check"></i>';
        }
        // return `<div class="px-4 py-2 cursor-pointer rounded-lg hover:bg-slate-100" data-size="${size}" data-id="${type}${size ? ',' + size : ''}">${text}${iconCheck}</div>`;
        return `<div class="px-4 py-2 cursor-pointer hover:bg-slate-100" ${dataSize} data-id="${type}${
          size ? "," + size : ""
        }">${text}${iconCheck}</div>`;
      })
      .join(""),
    brush: [
      { text: "铅笔", brush: "pencil", type: "brush" },
      { text: "蜡笔", brush: "crayon", type: "brush" },
      { text: "墨水笔", brush: "ink", type: "brush" },
      { text: "马克笔", brush: "marker", type: "brush" },
      { text: "图案", brush: "pattern", type: "brush" },
      { text: "圆形", brush: "circle", type: "brush" },
    ]
      .map(({ text, brush, type }) => {
        return `<div class="px-4 py-2 cursor-pointer hover:bg-slate-100" data-brush="${brush}" data-id="${type},${brush}">${text}</div>`;
      })
      .join(""),
    shapes: [
      {
        text: '<i class="vicon-pen-size"></i> 直线',
        shape: "line",
        type: "shape",
      },
      {
        text: '<i class="vicon-trending-flat"></i> 箭头',
        shape: "linearrow",
        type: "shape",
      },
      { text: '<i class="vicon-rect"></i> 矩形', shape: "rect", type: "shape" },
      {
        text: '<i class="vicon-circle"></i> 圆/椭圆',
        shape: "ellipse",
        type: "shape",
      },
      {
        text: '<i class="vicon-triangle"></i> 三角形',
        shape: "triangle",
        type: "shape",
      },
      { text: '<i class="vicon-star"></i> 星形', shape: "star", type: "shape" },
      {
        text: '<i class="vicon-heart"></i> 心形',
        shape: "heart",
        type: "shape",
      },
      {
        text: '<i class="vicon-polygon"></i> 多边形',
        shape: "polygon",
        type: "shape",
      },
    ]
      .map(({ text, shape }) => {
        return `<div class="px-4 py-2 cursor-pointer hover:bg-slate-100" data-shape="${shape}">${text}</div>`;
      })
      .join(""),
  };

  // 使用 tippy 点击按钮时显示对应的菜单

  const menuButtons = [
    refs["component:sidebar:brush"],
    // refs["component:sidebar:grid"],
    refs["component:sidebar:shapes"],
  ];
  const menuInstances = {};
  menuButtons.forEach((button) => {
    if(!button){
      return;
    }
    let type = button.dataset.id;
    type = type.split(":")[2];

    let menu = menuHtml[type];
    if (!menu) {
      return;
    }
    // 使用一个div包裹，不固定宽度，让内容自己撑开宽度
    menu = `<div class="min-w-max py-1" id="${type}Menu">${menu}</div>`;

    const instance = tippy(button, {
      content: menu,
      allowHTML: true,
      interactive: true,
      trigger: "click",
      placement: "right-start",
      offset: [0, 20],
      theme: "light",
      arrow: false,
      onShow(instance) {
        instance.reference.setAttribute("aria-selected", "true");
      },
      onHide(instance) {
        instance.reference.setAttribute("aria-selected", "false");
      },
    });
    menuInstances[type] = instance;
  });

  delegator.on(document.body, "click", "[data-id]", function (event, target) {
    const id = target.dataset.id;
    if (id.startsWith("component:sidebar:")) {
      const type = id.split(":")[2];
      toggleContentAreaByType(type);
    } else if (
      id.startsWith("applyGrid") ||
      id.startsWith("toggleAlignGuides")
    ) {
      const [type, value] = id.split(",");
      if (type === "toggleAlignGuides") {
        emitter.emit("operation:grid:toggleAlignGuides");
      } else if (type === "applyGrid") {
        emitter.emit("operation:grid:applyGrid", value);
      }
    } else {
      // 如果是关闭按钮，隐藏操作区
      if (id === "objOpClose") {
        hideOperationPanel();
      }
      // 如果是侧边栏收起按钮，切换侧边栏
      if (id === "sideCollapse" || id === "sideCollapseIcon") {
        toggleSidebar();
      }
    }
  });

  if(menuInstances.brush){
    delegator.on(
      menuInstances.brush.popper,
      "click",
      "[data-brush]",
      async function (event, target) {
        const { brush } = target.dataset;
        if (!brush) return;
        // operation:brush:init
        emitter.emit("operation:brush:init", brush);
        // 关闭菜单
        menuInstances.brush.hide();
      }
    );
  }
  if(menuInstances.shapes){
    delegator.on(
      menuInstances.shapes.popper,
      "click",
      ".tippy-content [data-shape]",
      async function (event, target) {
        const { shape } = target.dataset;
        if (!shape) return;
        if (shape === "polygon") {
          emitter.emit("operation:polygon:init", shape);
        } else {
          emitter.emit("operation:shape:init", shape);
        }
        // 关闭菜单
        menuInstances.shapes.hide();
      }
    );
  }
  

  emitter.on("sidebar:toggle", (type) => {
    if (types.includes(type)) {
      toggleContentAreaByType(type);
    }
    if (["brush", "grid", "shapes"].includes(type)) {
      menuInstances[type].show();
    }
  });

  console.info("sidebar loaded");
}

emitter.on("fabric:selection:cleared", function () {
  // 清除选中对象时，隐藏操作区
  if (currentOperationType) {
    hideOperationPanel();
  }
});

// 绑定一个事件来关闭操作区
emitter.on("sidebar:operation:close", function () {
    hideOperationPanel();
});

// 使用 emitter 绑定一个事件来 toggleContentAreaByType，参数是 type 和 showSidebar
emitter.on("sidebar:content:toggle", (type, showSidebar = false) => {
  toggleContentAreaByType(type, showSidebar);
});

// 由于sidebar.js 可能静态导入也可能动态导入，所以需要使用 jsCache 来缓存已经加载过的js文件，避免重复加载，参考 index.js
jsCache["../design/component/sidebar.js"] = true;

// 加上toggle sidebar 的快捷键，兼容各系统 window macOS ctrl/cmd + /
Mousetrap.bind("mod+/", () => {
  toggleSidebar();
  return false;
});

const panel = {
  show:showOperationPanel,
  hide:hideOperationPanel,
  content: objOpContent,
  title: objOpTitle,
  getType: () => currentOperationType,
};

export { panel };
