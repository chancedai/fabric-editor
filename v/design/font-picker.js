import { render, throttle, delegator } from "../__common__/utils";
import googleFonts from "./google-fonts";
let __googleFonts = googleFonts;
/**
 * Native JS FontPicker
 * ---------------------
 * 一个纯原生 JavaScript 实现的字体选择器，支持 Google 字体和本地字体，
 * 使用 TailwindCSS 优雅美观的样式，并通过 options.container 参数将 UI 渲染到指定容器中。
 *
 * 特性：
 * - 快速预览并选择 Google 字体或本地字体。
 * - 使用 IntersectionObserver 实现懒加载字体。
 * - 支持选择字体粗细和斜体样式。
 * - 可通过名称、语言、类别进行查找过滤。
 * - 收藏和最近使用的字体存储于 cookie 中。
 * - 可编辑示例文本（默认内容：The quick brown fox jumps over the lazy dog）。
 * - 键盘导航支持（数字键切换粗细、I 键切换斜体、方向键、Enter、Esc）。
 * - 可直接替换普通 input 元素。
 *
 * 依赖：TailwindCSS 用于样式（需自行引入）。
 */

// 工具函数：Cookie 读写（多值存储）
function cookie(key, value) {
  const cookieName = "native_fontpicker";
  const cookieDays = 365;
  let jar = {};
  const cookies = document.cookie
    .split("; ")
    .find((row) => row.startsWith(cookieName + "="));
  if (cookies) {
    const result = decodeURIComponent(cookies.split("=")[1]);
    const pts = result.split("||");
    pts.forEach((pt) => {
      const parts = pt.split("|", 2);
      if (parts[0]) {
        jar[parts[0]] = parts[1];
      }
    });
  }
  if (arguments.length === 1) {
    return jar[key];
  }
  if (value === null || value === false) {
    delete jar[key];
  } else {
    jar[key] = value;
  }
  const pts = [];
  for (let k in jar) {
    pts.push(`${k}|${jar[k]}`);
  }
  let expires = "";
  if (cookieDays > 0) {
    const date = new Date();
    date.setTime(date.getTime() + cookieDays * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie =
    cookieName +
    "=" +
    encodeURIComponent(pts.join("||")) +
    "; path=/; SameSite=Lax" +
    expires;
}

// Google 字体数据（示例，后续可扩充）
//   var __googleFonts = {
// 	"Almendra Display": {
//       1:1,
//         "category": "display",
//         "variants": "400",
//         "subsets": "latin,latin-ext"
//     },
//     "Almendra SC": {
//       1:1,
//         "category": "serif",
//         "variants": "400",
//         "subsets": "latin"
//     },
//     "Alumni Sans": {
//         "category": "sans-serif",
//         "variants": "100,200,300,400,500,600,700,800,900,100i,200i,300i,400i,500i,600i,700i,800i,900i",
//         "subsets": "cyrillic,cyrillic-ext,latin,latin-ext,vietnamese"
//     },
//   };

// 重新排序 __googleFonts，有字段 1的排前面
__googleFonts = Object.keys(__googleFonts)
  .sort((a, b) => {
    if (__googleFonts[a][1] === 1) {
      return -1;
    }
    if (__googleFonts[b][1] === 1) {
      return 1;
    }
    return 0;
  })
  .reduce((acc, key) => {
    acc[key] = __googleFonts[key];
    return acc;
  }, {});

// Google 字体语言（示例）
var googleFontLangs = {
  en: {
    arabic: "Arabic",
    bengali: "Bengali",
    "chinese-hongkong": "Chinese (Hong Kong)",
    "chinese-simplified": "Chinese (Simplified)",
    "chinese-traditional": "Chinese (Traditional)",
    cyrillic: "Cyrillic",
    "cyrillic-ext": "Cyrillic Extended",
    devanagari: "Devanagari",
    greek: "Greek",
    "greek-ext": "Greek Extended",
    gujarati: "Gujarati",
    gurmukhi: "Gurmukhi",
    hebrew: "Hebrew",
    japanese: "Japanese",
    kannada: "Kannada",
    khmer: "Khmer",
    korean: "Korean",
    latin: "Latin",
    "latin-ext": "Latin Extended",
    malayalam: "Malayalam",
    myanmar: "Myanmar",
    oriya: "Oriya",
    sinhala: "Sinhala",
    tamil: "Tamil",
    telugu: "Telugu",
    thai: "Thai",
    tibetan: "Tibetan",
    vietnamese: "Vietnamese",
  },
  zh: {
    arabic: "阿拉伯语",
    bengali: "孟加拉语",
    "chinese-hongkong": "中文（香港）",
    "chinese-simplified": "中文（简体）",
    "chinese-traditional": "中文（繁体）",
    cyrillic: "西里尔语",
    "cyrillic-ext": "西里尔语扩展",
    devanagari: "天城文",
    greek: "希腊语",
    "greek-ext": "希腊语扩展",
    gujarati: "古吉拉特语",
    gurmukhi: "果鲁穆奇文",
    hebrew: "希伯来语",
    japanese: "日语",
    kannada: "卡纳达语",
    khmer: "高棉语",
    korean: "韩语",
    latin: "拉丁语",
    "latin-ext": "拉丁语扩展",
    malayalam: "马拉雅拉姆语",
    myanmar: "缅甸语",
    oriya: "奥里亚语",
    sinhala: "僧伽罗语",
    tamil: "泰米尔语",
    telugu: "泰卢固语",
    thai: "泰语",
    tibetan: "藏语",
    vietnamese: "越南语",
  },
};
// 翻译

const googleFontCats = [
  "serif",
  "sans-serif",
  "display",
  "handwriting",
  "monospace",
];

// 国际化字典（这里只提供英文）
const dictionaries = {
  en: {
    selectFont: "Select a font",
    search: "Search",
    allLangs: "All languages",
    favFonts: "Favorite fonts",
    //   加一个推荐字体
    recommendFonts: "Recommend fonts",
    localFonts: "Local fonts",
    googleFonts: "Google fonts",
    select: "Select",
    styles: "styles",
    serif: "serif",
    "sans-serif": "sans-serif",
    display: "display",
    handwriting: "handwriting",
    monospace: "monospace",
    other: "Other",
  },
  // 中文翻译
  zh: {
    selectFont: "选择字体",
    search: "搜索",
    allLangs: "所有语言",
    favFonts: "常用字体",
    recommendFonts: "推荐字体",
    localFonts: "本站字体",
    googleFonts: "谷歌字体",
    select: "选择",
    styles: "样式",
    serif: "衬线",
    "sans-serif": "无衬线",
    display: "展示",
    handwriting: "手写",
    monospace: "等宽",
    other: "其他",
  },
  // 可扩展其他语言
};

// 默认配置
const defaultOptions = {
  lang: "zh",
  variants: true,
  nrRecents: 3,
  lazyLoad: true,
  debug: false,
  localFontsUrl: "https://xiaomingyan.com/static/v/design/fonts/",
  localFontsType: "woff2",
  container: document.body, // 字体选择器 UI 将会插入到此容器中
  localFonts: {
    // Default: web safe fonts available on all platforms
    Arial: {
      category: "sans-serif",
      variants: "400,400i,700,700i",
    },
    "Courier New": {
      category: "monospace",
      variants: "400,400i,700,700i",
    },
    Georgia: {
      category: "serif",
      variants: "400,400i,700,700i",
    },
    Tahoma: {
      category: "sans-serif",
      variants: "400,400i,700,700i",
    },
    "Times New Roman": {
      category: "serif",
      variants: "400,400i,700,700i",
    },
    "Trebuchet MS": {
      category: "sans-serif",
      variants: "400,400i,700,700i",
    },
    Verdana: {
      category: "sans-serif",
      variants: "400,400i,700,700i",
    },
    Alimama_DongFangDaKai_Regular: {
      name: "Alimama DongFangDaKai",
      name_zh: "阿里巴巴东方大楷",
      category: "handwriting",
      variants: "400",
      subsets: "chinese-simplified,latin",
    },
  },
  googleFonts: null, // 如果为 null，则使用 __googleFonts 中的所有字体
  showClear: true,
  onSelect: function () {}, // 选择字体后的回调函数
  onShow: function () {}, // 显示字体选择器后的回调函数
  onHide: function () {}, // 隐藏字体选择器后的回调函数
};

// 用于跟踪已加载的字体
const fontsLoaded = {};

// 辅助函数：如果元素超出可视范围则滚动显示
function scrollIntoViewIfNeeded(elem) {
  const container = elem.parentElement;
  const rectElem = elem.getBoundingClientRect();
  const rectContainer = container.getBoundingClientRect();
  if (rectElem.bottom > rectContainer.bottom) {
    elem.scrollIntoView(false);
  }
  if (rectElem.top < rectContainer.top) {
    elem.scrollIntoView();
  }
}

// FontPicker 类
class FontPicker {
  constructor(inputElement, options = {}) {
    this.options = Object.assign({}, defaultOptions, options);
    // 检查并设置国际化字典
    if (!dictionaries[this.options.lang]) {
      this.options.lang = "en";
    }
    this.dictionary = dictionaries[this.options.lang];
    this.googleFontLangs = googleFontLangs[this.options.lang];
    // 处理 Google 字体列表
    if (this.options.googleFonts && Array.isArray(this.options.googleFonts)) {
      const gf = {};
      this.options.googleFonts.forEach((fontFamily) => {
        if (__googleFonts[fontFamily]) {
          gf[fontFamily] = __googleFonts[fontFamily];
        }
      });
      this.options.googleFonts = gf;
    } else if (this.options.googleFonts === null) {
      this.options.googleFonts = __googleFonts;
    }
    if (!this.options.localFonts) {
      this.options.localFonts = {};
    }
    this.allFonts = {
      google: this.options.googleFonts,
      local: this.options.localFonts,
    };

    // 如果没有传入 input，则创建一个隐藏的 input 元素保存值
    if (inputElement) {
      this.originalInput = inputElement;
      this.originalInput.style.display = "none";
    } else {
      this.originalInput = document.createElement("input");
      this.originalInput.type = "hidden";
      document.body.appendChild(this.originalInput);

      // 标记为“独立模式”（无 input）
      this.standaloneMode = true;
    }
    
    this.setupHtml();
    this.bindEvents();
    // 如果原始 input 有初始值，则应用该字体
    const fontSpec = this.originalInput.value;
    if (fontSpec) {
      this.applyFontToOriginalInput(fontSpec);
    }

    // 如果是独立模式，初始化后立即打开选择器
    if (this.standaloneMode) {
      this.toggleVisibility(true);
    }
  }

  

  // 加载字体：根据类型从 Google 或本地加载
  loadFont(type, fontFamily, callback, timeout = 30000) {
	if (fontsLoaded[fontFamily]) return;
	fontsLoaded[fontFamily] = true;
  
	// 用于等待字体加载完成的 Promise
	const fontLoadPromise = document.fonts.load(`1em ${fontFamily}`);
  
	// 超时 Promise
	const timeoutPromise = new Promise((resolve, reject) => {
	  setTimeout(() => reject(new Error("字体加载超时")), timeout);
	});
  
	// 开始加载字体
	if (type === "google") {
	  const fontData = this.options.googleFonts[fontFamily];
	  const url = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(
		/ /g,
		"+"
	  )}:wght@${fontData.variants.replace(/,/g, ";")}&display=swap`;
	  if (this.options.debug){
      console.log(`Loading Google font ${fontFamily} from ${url}`);
    }
	  const link = document.createElement("link");
	  link.href = url;
	  link.rel = "stylesheet";
	  document.head.appendChild(link);
	} else if (type === "local") {
	  if (
		/^(Arial|Courier New|Georgia|Tahoma|Times New Roman|Trebuchet MS|Verdana)$/i.test(
		  fontFamily
		)
	  )
		return;
	  if (this.options.debug) console.log(`Loading local font ${fontFamily}`);
	  if ("FontFace" in window) {
		const fontFace = new FontFace(
		  fontFamily,
		  `url('${this.options.localFontsUrl}${fontFamily}.${this.options.localFontsType}')`
		);
		fontFace.load().then((loadedFace) => {
		  document.fonts.add(loadedFace);
		});
	  } else {
		const map = {
		  ttf: "truetype",
		  woff: "woff",
		  woff2: "woff2",
		  otf: "opentype",
		};
		const style = document.createElement("style");
		style.textContent = `@font-face { font-family: '${fontFamily}'; src: local('${fontFamily}'), url('${
		  this.options.localFontsUrl
		}${fontFamily}.${this.options.localFontsType}') format('${
		  map[this.options.localFontsType]
		}'); }`;
		document.head.appendChild(style);
	  }
	}
  
	// 等待字体加载或者超时
	Promise.race([fontLoadPromise, timeoutPromise])
	  .then(() => {
		if (this.options.debug)
		  console.log(`字体 ${fontFamily} 加载完成`);
		if (callback && typeof callback === "function") callback();
	  })
	  .catch((err) => {
		if (this.options.debug)
		  console.error(`字体 ${fontFamily} 加载失败或超时: ${err.message}`);
		// 失败时也可以选择回调或执行其他逻辑
		if (callback && typeof callback === "function") callback(err);
	  });
  }
  
  openPicker() {
    this.pickerElement.style.display = "block";
  }

  closePicker() {
    if (this.options.autoClose) {
      this.pickerElement.style.display = "none";
    }
  }


  // 将类似 "Arial:400i" 的字体描述转换为组件
  fontSpecToComponents(fontSpec) {
    const parts = fontSpec.split(":");
    const family = parts[0];
    const variant = parts[1] || "400";
    let italic = false,
      weight = 400;
    if (/(\d+)i$/.test(variant)) {
      italic = true;
      weight = parseInt(RegExp.$1);
    } else {
      weight = parseInt(variant);
    }
    return { family, weight, italic };
  }

  // 根据选定的字体更新原始 input 与显示区域
  applyFontToOriginalInput(fontSpec) {
    // 遍历 localFonts
    let content = this.fontSpecSpan;
    if (fontSpec === "") {
      content.fontFamily = "";
      content.textContent = this.dictionary["selectFont"];
      this.originalInput.value = "";
      return;
    }
    const font = this.fontSpecToComponents(fontSpec);
    const type =
      this.options.googleFonts && __googleFonts[font.family]
        ? "google"
        : "local";
    this.loadFont(type, font.family);

    content.fontFamily = `'${font.family}'`;
    content.fontStyle = font.italic ? "italic" : "normal";
    content.fontWeight = font.weight;

    // 判断有没有 name 字段
    let name = this.allFonts[type]?.[font.family]?.name;
    if (name) {
      content.textContent = name;
    } else {
      content.textContent = fontSpec;
    }
  }

  // 控制字体选择器 UI 的显示与隐藏（本实现为嵌入式，非弹窗）
  toggleVisibility(show) {
    if (show) {
      this.containerEl.classList.remove("hidden");
      // 加载收藏与最近使用列表
      this.getFavorites();
      // 若原始 input 有值，则滚动到相应字体
      const fontSpec = this.originalInput.value;
      if (fontSpec) {
        const font = this.fontSpecToComponents(fontSpec);
        const li = this.resultsEl.querySelector(
          `li[data-font-family="${font.family}"]`
        );
        if (li) {
          li.setAttribute("data-font-italic", font.italic);
          li.setAttribute("data-font-weight", font.weight);
          li.classList.add("fp-active", "bg-slate-200");
          scrollIntoViewIfNeeded(li);
        }
      } else {
        this.resultsEl.scrollTop = 0;
      }
      if (this.options.lazyLoad) this.lazyLoad();
      this.resultsEl.focus();
      this.options.onShow.call(this);
    } else {
      if(this.standaloneMode) {
        return;
      }
      this.containerEl.classList.add("hidden");
      this.options.onHide.call(this);
    }
  }

  // 绑定各种事件（键盘、点击、原始 input 的 change 等）
  bindEvents() {
    this.resultsEl.addEventListener("keydown", (e) => this.keyDown(e));
    this.resultsEl.addEventListener("mouseenter", (e) => {
      const li = e.target.closest(".item:not(.fp-divider)");
      if (li && this.resultsEl.contains(li)) {
        this.clearHover();
        li.classList.add("fp-hover");
        const fontType = li.getAttribute("data-font-type");
        if (fontType === "local") return;
        this.loadFont(fontType, li.getAttribute("data-font-family"));
        this.showSample(li);
      }
    });
    this.resultsEl.addEventListener("click", (e) => {
      const li = e.target.closest(".item:not(.fp-divider)");
      if (li) {
        this.activateItem(li);
      }
    });
    this.originalInput.addEventListener("change", (e) => {
      this.applyFontToOriginalInput(e.target.value);
    });
    // 点击显示字体选择器
    this.selectEl.addEventListener("click", () => {
      if (!this.standaloneMode) {
        this.toggleVisibility(true);
      }
      
    });

    // this.toggleVisibility(true);
    // 清除按钮
    if (this.options.showClear) {
      const clearBtn = this.selectEl.querySelector(".fp-clear");
      if (clearBtn) {
        clearBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          // this.selectEl.style.fontFamily = '';
          this.fontSpecSpan.style.fontFamily = "";
          this.fontSpecSpan.textContent = this.dictionary["selectFont"];
          this.originalInput.value = "";
          this.originalInput.dispatchEvent(new Event("change"));
        });
      }
    }
  }

  // 清除列表项上的悬停样式
  clearHover() {
    const hovers = this.resultsEl.querySelectorAll("li.fp-hover");
    hovers.forEach((el) => el.classList.remove("fp-hover"));
  }

  // 键盘事件处理
  keyDown(e) {
    const activeLi = this.resultsEl.querySelector("li.fp-active");
    if (e.key >= "1" && e.key <= "9") {
      e.preventDefault();
      const fw = 100 * parseInt(e.key);
      const pill = activeLi
        ? activeLi.querySelector(`.fp-pill[data-font-weight="${fw}"]`)
        : null;
      if (pill) pill.click();
      return;
    }
    switch (e.key) {
      case "i":
      case "I":
        e.preventDefault();
        if (activeLi) {
          const italicPill = activeLi.querySelector(".fp-pill.italic");
          if (italicPill) italicPill.click();
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        let prevLi = activeLi ? activeLi.previousElementSibling : null;
        while (prevLi && prevLi.classList.contains("fp-divider")) {
          prevLi = prevLi.previousElementSibling;
        }
        if (!prevLi) {
          const items = this.resultsEl.querySelectorAll(".item:not(.fp-divider)");
          prevLi = items[items.length - 1];
        }
        if (prevLi) {
          prevLi.dispatchEvent(new Event("mouseenter"));
          prevLi.click();
          scrollIntoViewIfNeeded(prevLi);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        let nextLi = activeLi ? activeLi.nextElementSibling : null;
        while (nextLi && nextLi.classList.contains("fp-divider")) {
          nextLi = nextLi.nextElementSibling;
        }
        if (!nextLi) {
          nextLi = this.resultsEl.querySelector(".item:not(.fp-divider)");
        }
        if (nextLi) {
          nextLi.dispatchEvent(new Event("mouseenter"));
          nextLi.click();
          scrollIntoViewIfNeeded(nextLi);
        }
        break;
      case "Enter":
        e.preventDefault();
        if (activeLi) {
          const applyBtn = activeLi.querySelector("button.fp-apply");
          if (applyBtn) applyBtn.click();
        }
        break;
      case "Escape":
        e.preventDefault();
        this.toggleVisibility(false);
        break;
    }
  }
  // 处理列表项点击（激活后显示操作按钮与字体变体选择）
  activateItem(li) {
    const actives = this.resultsEl.querySelectorAll("li.fp-active");
    actives.forEach((el) => {
      el.classList.remove("fp-active", "bg-slate-200");
      const variantsEl = el.querySelector(".fp-variants");
      if (variantsEl) variantsEl.remove();
      const btnsEl = el.querySelector(".fp-btns");
      if (btnsEl) btnsEl.remove();
    });
    li.classList.add("fp-active", "bg-slate-200");

    // 字体变体选择（粗细、斜体）
    const fontData =
      this.allFonts[li.getAttribute("data-font-type")][
        li.getAttribute("data-font-family")
      ];
    const variants = fontData.variants ? fontData.variants.split(",") : [];
    if (this.options.variants && variants.length > 1) {
      const variantsContainer = document.createElement("div");
      variantsContainer.className = "fp-variants pt-2 grid grid-cols-5 gap-2";
      let hasItalic = false;
      variants.forEach((variant) => {
        if (/i$/.test(variant)) {
          hasItalic = true;
          return;
        }
        const fontWeight = parseInt(variant);
        const span = document.createElement("span");
        span.className =
          "fp-pill weight cursor-pointer bg-white border rounded  py-1 text-xs text-center " +
          (li.getAttribute("data-font-weight") == fontWeight
            ? "border-purple-500 text-purple-500"
            : "border-slate-200");
        span.setAttribute("data-font-weight", fontWeight);
        span.style.fontWeight = fontWeight;
        span.textContent = variant;
        span.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!variants.includes(fontWeight + "i")) {
            const italicPill = li.querySelector(".fp-pill.italic");
            if (italicPill) {
              italicPill.classList.remove("checked");
              italicPill.style.display = "none";
              li.setAttribute("data-font-italic", "false");
            }
          } else {
            const italicPill = li.querySelector(".fp-pill.italic");
            if (italicPill) {
              italicPill.style.display = "inline-block";
            }
          }
          const weightPills = li.querySelectorAll(".fp-pill.weight");
          weightPills.forEach((p) =>
            p.classList.remove("bg-purple-600", "text-purple-500")
          );
          span.classList.add("bg-purple-600", "text-purple-500");
          li.setAttribute("data-font-weight", fontWeight);
          this.showSample(li);
        });
        variantsContainer.appendChild(span);
      });
      if (hasItalic) {
        const italicSpan = document.createElement("span");
        italicSpan.className =
          "fp-pill italic cursor-pointer bg-white border rounded  py-1 text-xs text-center " +
          (li.getAttribute("data-font-italic") === "true"
            ? "bg-purple-600 text-purple-500"
            : "bg-slate-200 text-slate-800");
        italicSpan.textContent = "italic";
        italicSpan.addEventListener("click", (e) => {
          e.stopPropagation();
          const current = li.getAttribute("data-font-italic") === "true";
          li.setAttribute("data-font-italic", (!current).toString());
          italicSpan.classList.toggle("bg-purple-600");
          italicSpan.classList.toggle("text-purple-500");
          italicSpan.classList.toggle("bg-slate-200");
          italicSpan.classList.toggle("text-slate-800");
          this.showSample(li);
        });
        variantsContainer.appendChild(italicSpan);
      }
      li.appendChild(variantsContainer);
    } else if (variants.length === 1 && /i$/.test(variants[0])) {
      li.setAttribute("data-font-italic", "true");
    }

    // 操作按钮容器
    const btns = document.createElement("div");
    btns.className = "fp-btns flex space-x-2 pt-2 items-center";

    // 应用按钮
    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className =
      "fp-apply vicon-check bg-purple-600 text-white text-sm px-2 py-1 rounded flex hover:bg-purple-600 focus:outline-hidden";
    applyBtn.textContent = this.dictionary["select"];
    applyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const fontType = li.getAttribute("data-font-type");
      const fontFamily = li.getAttribute("data-font-family");
      const italic = li.getAttribute("data-font-italic") === "true";
      const weight = li.getAttribute("data-font-weight") || "400";
      let value = fontFamily;
      // 判断有没有 name 字段
      //   let name = this.allFonts[fontType][fontFamily].name;
      //   if (name) {
      //     value = name;
      //   }
      if (this.options.variants) {
        value += ":" + weight + (italic ? "i" : "");
      }
      // this.selectEl.style.fontFamily = `'${fontFamily}'`;
      // this.selectEl.style.fontStyle = italic ? 'italic' : 'normal';
      // this.selectEl.style.fontWeight = weight;
      this.fontSpecSpan.style.fontFamily = `'${fontFamily}'`;
      this.fontSpecSpan.style.fontStyle = italic ? "italic" : "normal";
      this.fontSpecSpan.style.fontWeight = weight;

      //   判断有没有 name 字段
      let name = this.allFonts[fontType]?.[fontFamily]?.name;
      if (name) {
        this.fontSpecSpan.textContent = name;
      } else {
        this.fontSpecSpan.textContent = value;
      }
      this.originalInput.value = value;
      
      if (this.options.nrRecents) {
        let recent = cookie("recents") || "";
        let recentArray = recent ? recent.split(",") : [];
        const cookieVal = fontType + ":" + fontFamily;
        if (!recentArray.includes(cookieVal)) {
          recentArray.unshift(cookieVal);
        }
        recentArray = recentArray.slice(0, this.options.nrRecents);
        cookie("recents", recentArray.join(","));
      }
      this.toggleVisibility(false);

	  const self = this;
	  function callback(){
		self.originalInput.dispatchEvent(new Event("change"));
		if (typeof self.options.onSelect === "function") {
			self.options.onSelect.call(self, {
			fontType,
			fontFamily,
			fontStyle: italic ? "italic" : "normal",
			fontWeight: weight,
			fontSpec: value,
			});
		}
	  }

      // 如果是本地字体，现在才加载
      if (fontType === "local") {
        this.loadFont(fontType, fontFamily, () => {
			callback();
		});
      }else{
		callback();
	  }
    });
    btns.appendChild(applyBtn);

    // 收藏按钮
    const favBtn = document.createElement("button");
    favBtn.className =
      "vicon-star bg-purple-600 border bg-white text-sm px-2 py-1 rounded hover:text-yellow-500 focus:outline-hidden " +
      (this.isFavorite(li) ? "checked text-yellow-500" : "text-slate-500");

    favBtn.title = this.dictionary["favFonts"];
    favBtn.innerHTML = "收藏";

    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const favKey =
        li.getAttribute("data-font-type") +
        ":" +
        li.getAttribute("data-font-family");
      let favorites = cookie("favs") || "";
      let favArray = favorites ? favorites.split(",") : [];
      if (favBtn.classList.contains("checked")) {
        favArray = favArray.filter((item) => item !== favKey);
      } else {
        if (!favArray.includes(favKey)) {
          favArray.push(favKey);
        }
      }
      favBtn.classList.toggle("checked");
      favBtn.classList.toggle("text-yellow-500");

      cookie("favs", favArray.join(","));
    });
    btns.appendChild(favBtn);

    li.appendChild(btns);
  }

  // 判断当前列表项是否在收藏中
  isFavorite(li) {
    const favs = cookie("favs") || "";
    const favArray = favs ? favs.split(",") : [];
    const key =
      li.getAttribute("data-font-type") +
      ":" +
      li.getAttribute("data-font-family");
    return favArray.includes(key);
  }

  // 利用 IntersectionObserver 实现懒加载
  lazyLoad() {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio > 0) {
          obs.unobserve(entry.target);
          const li = entry.target;

          //   本地字体滚动时不加载
          const fontType = li.getAttribute("data-font-type");
          if (fontType === "local") return;
          this.loadFont(fontType, li.getAttribute("data-font-family"));
          li.querySelector(".fp-name").style.fontFamily = `'${li.getAttribute(
            "data-font-family"
          )}'`;
          // li.style.fontFamily = `'${li.getAttribute('data-font-family')}'`;
        }
      });
    });
    const items = this.resultsEl.querySelectorAll(".item:not(.fp-divider)");
    items.forEach((item) => observer.observe(item));
  }

  // 构建过滤器 UI
  getFilterUI() {
    const filterContainer = document.createElement("div");
    filterContainer.className = "fp-filter pb-2";
    const refs = render(
      null,
      () => {
        return [
          `<div data-id="fpSearchWrap" class="fp-search-wrap relative">
				<i class="vicon-search text-xl absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500"></i>
				<input data-id="fpSearch" type="text" class="fp-search border rounded w-full py-2 px-8 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent
				" placeholder="${this.dictionary["search"]}" spellcheck="false">
				<button data-id="fpClear" title="清空" class="fp-clear absolute right-1 top-1/2 transform -translate-y-1/2 cursor-pointer appearance-none rounded-lg hover:bg-slate-100 w-8 h-8 flex items-center justify-center hidden">
					<i class="vicon-close text-sm p-0.5 text-white rounded-full bg-slate-400
					"></i>
				</button>
			</div>
			<select data-id="fpLangSelect" class="fp-lang border rounded my-2 p-2 w-full">
				<option value="">${this.dictionary["allLangs"]}</option>
				${Object.keys(this.googleFontLangs)
          .map(
            (l) => `<option value="${l}">${this.googleFontLangs[l]}</option>`
          )
          .join("")}
			</select>
			<div class="fp-row">
				<div data-id="fpCatsDiv" class="text-xs gap-2 grid grid-cols-3">
					${[...googleFontCats, "other"]
            .map(
              (cat) =>
                `<button data-category="${cat}" class="fp-category fp-pill btn-sm btn-secondary">${this.dictionary[cat]}</button>`
            )
            .join("")}
				</div>
			</div>`,
        ];
      },
      filterContainer
    );

    function toggleClearBtn() {
      let value = refs.fpSearch.value.trim();
      if (value === "") {
        refs.fpClear.classList.add("hidden");
      } else {
        refs.fpClear.classList.remove("hidden");
      }
    }

    refs.fpSearch.addEventListener("focus", () => {
      toggleClearBtn();
    });

    refs.fpSearch.addEventListener("keyup", () => {
      toggleClearBtn();
      this.applyFilter();
    });
    refs.fpClear.addEventListener("click", () => {
      refs.fpSearch.value = "";
      refs.fpSearch.focus();
      this.applyFilter();
    });
    refs.fpLangSelect.addEventListener("change", () => this.applyFilter());
    refs.fpCatsDiv.addEventListener("click", (e) => {
      const span = e.target.closest(".fp-category");
      if (span) {
        span.classList.toggle("checked");
        span.classList.toggle("btn-primary");
        this.applyFilter();
      }
    });
    this.filterEl = filterContainer;

    return filterContainer;
  }

  // 根据用户输入的过滤条件，筛选字体列表
  applyFilter() {
    const lang = this.filterEl.querySelector(".fp-lang").value;
    const searchTerm = this.filterEl
      .querySelector(".fp-search")
      .value.trim()
      .toLowerCase();
    const activeCats = Array.from(
      this.filterEl.querySelectorAll(".fp-category.checked")
    ).map((el) => el.getAttribute("data-category"));
    cookie("lang", lang === "" ? false : lang);
    cookie("cats", activeCats.join(","));
    for (let type in this.allFonts) {
      for (let fontFamily in this.allFonts[type]) {
        const fontData = this.allFonts[type][fontFamily];
        const subsets =
          fontData.subsets && fontData.subsets !== "*"
            ? fontData.subsets.split(",")
            : [];
        const li = this.resultsEl.querySelector(
          `li[data-font-family="${fontFamily}"]`
        );
        const cat = fontData.category || "other";
        if (
          (lang === "" || subsets.includes(lang)) &&
          (activeCats.length === 0 || activeCats.includes(cat)) &&
          (searchTerm === "" || fontFamily.toLowerCase().includes(searchTerm))
        ) {
          li.style.display = "";
        } else {
          li.style.display = "none";
        }
      }
    }
  }

  // 构建字体列表 UI
  getFontsList(localFonts, googleFonts, noDivider) {
    localFonts = localFonts || this.options.localFonts;
    googleFonts = googleFonts || this.options.googleFonts;
    noDivider = noDivider || false;

    const frag = document.createDocumentFragment();

    const dividerClass =
      "fp-divider px-4 sticky top-0 bg-white py-2 border-t border-slate-200";
    const liClass = "item cursor-pointer pl-8 pr-4 py-2 hover:bg-slate-100";
    const getFontName = (fontFamily, isLocal) => {
      if (isLocal) {
        return `<span class="fp-name py-2"><img src="https://xiaomingyan.com/static/common/d.gif" data-src="${this.options.localFontsUrl}previews/${fontFamily}.png" class="h-6 max-w-full object-contain  mr-2 inline-block" alt="${fontFamily}"></span>`;
      }
      return `<span class="fp-name py-2">${fontFamily}</span>`;
    };

    render(
      null,
      () => {
        return [
          noDivider
            ? ""
            : `<div class="${dividerClass}">${this.dictionary["localFonts"]}</div>`,
          `
			${Object.keys(localFonts)
        .map(
          (fontFamily) => `
				<div data-font-type="local" data-font-family="${fontFamily}" class="${liClass}
				">${getFontName(fontFamily, true)}</div>
			`
        )
        .join("")}`,
          noDivider
            ? ""
            : `<div class="${dividerClass}">${this.dictionary["googleFonts"]}</div>`,
          `
			${Object.keys(googleFonts)
        .map(
          (fontFamily) => `
				<div data-font-type="google" data-font-family="${fontFamily}" class="${liClass}
				">${getFontName(fontFamily)}</div>
			`
        )
        .join("")}
			`,
        ];
      },
      frag
    );
    return frag;
  }

  // 构建收藏和最近使用的字体列表，并插入到结果列表顶部
  getFavorites() {
    if (this.favoriteEl) {
      this.favoriteEl.remove();
    }
    let favs = cookie("favs") || "";
    let recents = cookie("recents") || "";
    const favArray = favs ? favs.split(",") : [];
    const recentArray = recents ? recents.split(",") : [];
    const combined = [...new Set([...recentArray, ...favArray])];
    if (combined.length > 0) {
      const frag = document.createElement("div");

      const localFonts = {};
      const googleFonts = {};
      combined.forEach((item) => {
        const parts = item.split(":");
        if (parts.length < 2) return;
        const [type, fontFamily] = parts;
        const fontData = this.allFonts[type][fontFamily];
        if (type === "local") {
          localFonts[fontFamily] = fontData;
        } else {
          googleFonts[fontFamily] = fontData;
        }
      });

      render(
        null,
        () => {
          return [
            `
				<div class="fp-divider px-4 sticky top-0 bg-white py-2 mt-1 border-t border-slate-200">${this.dictionary["favFonts"]}</div>
			`,
          ];
        },
        frag
      );

      const lis = this.getFontsList(localFonts, googleFonts, true);
      frag.appendChild(lis);
	  this.favoriteEl = frag;
      this.resultsEl.prepend(this.favoriteEl);
    }
  }

  // 构建整个 UI 结构，并插入到 options.container 指定的容器中
  setupHtml() {
    
    // // 过滤器 UI
    const filterUI = this.getFilterUI();
    

    const refs = render(
      null,
      () => {
        return [
          `
				<div data-id="fpContainer" class="fp-container h-full flex flex-col bg-white overflow-hidden text-sm hidden">
					<div class="fp-hd flex items-center justify-between px-4 py-2 ${this.standaloneMode?'hidden':''}">
						<h5 class="">${this.dictionary["selectFont"]}</h5>
						<button data-id="fpClose" class="fp-close vicon-close btn-icon" aria-label="Close"></button>
					</div>
					<div data-id="fpFilter" class="px-4"></div>
					<div data-id="fpResults" class="fp-results flex-1 overflow-auto py-2 bg-white outline-hidden" tabindex="0">
					</div>
				</div>
				`,
        ];
      },
      this.options.container
    );

    this.containerEl = refs.fpContainer;
    this.resultsEl = refs.fpResults;
    this.filterEl = refs.fpFilter;
    
    refs.fpClose.addEventListener("click", () => this.toggleVisibility(false));

    this.filterEl.appendChild(filterUI);
    // 为字体列表插入所有字体
    this.resultsEl.appendChild(this.getFontsList());
    // this.containerEl.appendChild(this.resultsEl);
    // 插入到指定容器中
    // this.options.container.appendChild(this.containerEl);
    // 替换原始 input 的显示元素
    this.selectEl = document.createElement("div");
    const refs2 = render(
      null,
      () => {
        return [
          `
				<div data-id="fpSelect" class="hidden fp-select w-full block border rounded px-3 py-1 cursor-pointer hover:bg-slate-100 flex items-center justify-between">
					<span data-id="fpFontSpec" class="fp-fontspec" tabindex="0">${
            this.dictionary["selectFont"]
          }</span>
					${
            this.options.showClear
              ? `<span class="fp-clear ml-2 text-slate-500 cursor-pointer">×</span>`
              : ""
          }
				</div>
				`,
        ];
      },
      this.originalInput.parentNode
    );
    this.selectEl = refs2.fpSelect;
    this.fontSpecSpan = refs2.fpFontSpec;
  }
}

// 将 FontPicker 暴露到全局
window.FontPicker = FontPicker;

export default FontPicker;
