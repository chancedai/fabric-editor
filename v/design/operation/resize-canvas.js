import Fuse from 'fuse.js';
import { render, delegator, throttle, emitter,showWarning, showInfo, showSuccess } from '../../__common__/utils';
import { updateDesignSize, exportCanvasConfig } from "../canvas";
import { panel } from "../component/sidebar";
import elements from "../elements";
import sizes from './sizes.js';

let refs = null;
let updateWidthSlider = null;
let updateHeightSlider = null;
let updateWidthSliderConfig = null;
let updateHeightSliderConfig = null;
let updateUnit = null;
let fuse = null;

const unitToPx = {
  px: 1,
  mm: 3.78,
  cm: 37.8,
  in: 96
};

function convertToPx(value, unit) {
  return value * unitToPx[unit];
}

function convertFromPx(pxValue, targetUnit) {
  return pxValue / unitToPx[targetUnit];
}

function convert(value, fromUnit, toUnit) {
  const px = convertToPx(value, fromUnit);
  return convertFromPx(px, toUnit);
}


// 把 10000px 转成其它单位的值
const px10000 = 10000;
const px10000In = parseFloat(convert(px10000, 'px', 'in'));
const px10000Cm = parseFloat(convert(px10000, 'px', 'cm'));
const px10000Mm = parseFloat(convert(px10000, 'px', 'mm'));
const px10000Px = px10000;

const state = {
  width: 1080,
  height: 1920,
  unit: 'px',
  ratioLocked: true,
  searchText: '',
  matchedSizes: sizes,
  ratio: 1080 / 1920
};

let lastPhySize = exportCanvasConfig.phySize;

function parseSizeString(sizeStr, defaultUnit = 'px') {
  sizeStr = sizeStr?.replace(/\s+/g, '');
  // 支持 3.5 x 2.0 in 和 3.5x2.0in 两种格式
  const match = sizeStr?.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(px|mm|cm|in)?$/i);
  if (match) {
    const [, w, h, unit] = match;
    return {
      width: parseFloat(w),
      height: parseFloat(h), 
      unit: unit || defaultUnit
    };
  }
  return null;
}
function saveLastPhySize(sizeStr) {
  localStorage.setItem('lastPhySize', sizeStr);
  lastPhySize = sizeStr;
  updateRestoreButtonUI(sizeStr);
}

function restoreLastSize() {
  const saved = localStorage.getItem('lastPhySize');
  if (saved) {
    lastPhySize = saved;
    updateDesignSize?.(saved, saved, true);
    localStorage.removeItem('lastPhySize');
    lastPhySize = saved;
    updateRestoreButtonUI('');
    showSuccess('已经恢复上一次的画布大小');
    const parsed = parseSizeString(saved);
    if(parsed) {
      Object.assign(state, parsed);
      state.ratio = state.width / state.height;
      updateUIFromState();
    }
  }
  
}

function updateRestoreButtonUI(sizeStr) {
  
  if(typeof sizeStr !== 'string') {
    sizeStr = localStorage.getItem('lastPhySize');
  }
  // 并且和现在的尺寸不一样
  if(sizeStr){
    refs.restore.classList.remove('hidden');
    refs.restore.innerHTML = `<i class="vicon-redo scale-x-[-1] text-lg pl-1"></i>恢复上次画布大小 ${sizeStr}`;
  }else{
    refs.restore.classList.add('hidden');
    refs.restore.innerHTML = '';
  }
}

function getSliderConfig() {
  const unit = state.unit;

  const unitConfigs = {
    px: {
      values: [1, 100, 200, 500, 1000, 2000, 5000, 10000],
      suffix: 'px',
      max: 10000
    },
    mm: {
      values: [1, 10, 100, 200, 500, 1000, 2000, 2645.5],
      suffix: 'mm',
      max: px10000Mm
    },
    cm: {
      values: [1, 5, 10, 20, 50, 100, 200, 264.55],
      suffix: 'cm',
      max: px10000Cm
    },
    in: {
      values: [1, 5, 10, 20, 50, 100, 104.167],
      suffix: 'in',
      max: px10000In
    }
  };

  const config = unitConfigs[unit] || unitConfigs.px;

  const quickValues = config.values.map(value => ({
    value,
    label: `${value} ${config.suffix}`
  }));

  return {
    range: [1, config.max],
    quickValues
  };
}

function updateWidth() {
  updateWidthSlider(state.width);
}

function updateHeight() {
  updateHeightSlider(state.height);
}


function updateSliderConfig() {
  const { range, quickValues } = getSliderConfig();
  updateWidthSliderConfig({ range, quickValues });
  updateHeightSliderConfig({ range, quickValues });
}


function updateUIFromState() {
  updateSliderConfig();
  updateWidth();
  updateHeight();
  updateUnit();
  
  const btn = refs.lockRatio;
  if (btn) {
    // btn.textContent = state.ratioLocked ? '锁定比例 🔒' : '锁定比例 🔓';
    btn.classList.toggle('btn-primary', state.ratioLocked);
    btn.classList.toggle('btn-secondary', !state.ratioLocked);
  }
}

function mountCanvasResizePanel() {
  const container = panel.content;

  const parsed = parseSizeString(exportCanvasConfig.phySize);
  if (parsed) {
    Object.assign(state, parsed);
  } else {
    state.width = exportCanvasConfig.width;
    state.height = exportCanvasConfig.height;
    state.unit = 'px';
    exportCanvasConfig.phySize = state.width + 'x' + state.height + 'px';
  }
  state.ratio = state.width / state.height;

  lastPhySize = exportCanvasConfig.phySize;

  if (!refs) {
    fuse = new Fuse(sizes, {
      keys: ['t', 's', 'r'],
      threshold: 0.3
    });

    refs = render({}, (d, $e, $for, $if) => {
      return [
        `<div data-id="wrapper" class="h-full flex flex-col text-sm">`,
          `<div class="sticky top-0 bg-white z-10">`,
            render.section("", [
              // 恢复上一次的 phySize
              render.row("宽度", "widthSlider"),
              render.row("高度", "heightSlider"),
              `<div class="flex items-center gap-1 justify-between">
                ${render.row("单位", "unitSelect")}
                <button data-id="lockRatio" class="px-2 btn-secondary" title="锁定比例"><i class="vicon-link text-lg"></i></button>
                <button data-id="swapWH" class="px-2 btn-secondary" title="调转宽高"><i class="vicon-rotate text-lg"></i></button>
                <button data-id="apply" class="btn-primary transition duration-300">确定</button>
              </div>`,
              `<button data-id="restore" class="w-full btn-secondary hidden"></button>`,
            ]),

            `<div class="flex items-center gap-4 p-4 border-b border-slate-200 hover:bg-slate-50">
                <div class="relative w-full flex-1">
                  <input type="text" data-id="query" placeholder="搜索尺寸 / 类型 / 比例..." class="input w-full px-3 py-1.5 pr-8">
                  <button data-id="clear" class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black hidden">
                    <i class="vicon-close"></i>
                  </button>
                </div>
              </div>`,
            
          `</div>`,
        `<div data-id="list" class="flex-1 p-4 overflow-hidden hover:overflow-y-auto"></div>`,
        `</div>`
      ];
    }, container);


    const { update } = elements.getGui(refs.unitSelect, "radio", {
      default: state.unit,
        choices: {
          px: '<span class="px-1">px</span>',
          mm: '<span class="px-1">mm</span>',
          cm: '<span class="px-1">cm</span>',
          in: '<span class="px-1">in</span>',
        },
        onchange: (unit) => {
          const oldUnit = state.unit;
          const newUnit = unit;
          if (newUnit !== oldUnit) {
            state.width = convert(state.width, oldUnit, newUnit);
            state.height = convert(state.height, oldUnit, newUnit);
            state.unit = newUnit;
          }
          updateUIFromState();
        },
      });
      updateUnit = function() {
        update(state.unit);
      };


      const { range, quickValues } = getSliderConfig();

    ({ update: updateWidthSlider, updateConfig: updateWidthSliderConfig } = elements.getGui(refs.widthSlider, "slider", {
      range,
      quickValues,
      value: state.width,
      onchange: (value) => {
        state.width = value;
        if (state.ratioLocked) {
          state.height = Math.round(value / state.ratio);
          updateHeight();
        } else {
          state.ratio = state.width / state.height;
        }
      }
    }));

    ({ update: updateHeightSlider, updateConfig: updateHeightSliderConfig } = elements.getGui(refs.heightSlider, "slider", {
      range,
      quickValues,
      value: state.height,
      onchange: (value) => {
        state.height = value;
        if (state.ratioLocked) {
          state.width = Math.round(value * state.ratio);
          updateWidth();
        } else {
          state.ratio = state.width / state.height;
        }
      }
    }));

    delegator.on(container, 'click', '[data-id="lockRatio"]', (e,el) => {
      state.ratioLocked = !state.ratioLocked;
      el.classList.toggle('btn-primary', state.ratioLocked);
      el.classList.toggle('btn-secondary', !state.ratioLocked);
    });

    delegator.on(container, 'click', '[data-id="swapWH"]', () => {
      [state.width, state.height] = [state.height, state.width];
      updateWidth();
      updateHeight();
    });

    delegator.on(container, 'click', '[data-id="apply"]', () => {
      // 最大边不能超过 10000px, 不是px 单位，则转成 px
      let width = state.width;
      let height = state.height;
     
      // 是否超过
      let isOver = false;
      let message = '';
      let unit = state.unit;
      if (state.unit === 'cm') {
        if(width > px10000Cm || height > px10000Cm) {
          isOver = true;
          message = px10000Cm;
        }
      } else if (state.unit === 'mm') {
        if(width > px10000Mm || height > px10000Mm) {
          isOver = true;
          message = px10000Mm;
        }
      } else if (state.unit === 'in') {
        if(width > px10000In || height > px10000In) {
          isOver = true;
          message = px10000In;
        }
      } else {
        if(width > px10000Px || height > px10000Px) {
          isOver = true;
          message = px10000Px;
        }
      }

      if(isOver) {
        showWarning(`最大边不能超过 ${message} ${unit}`);
        return;
      }
      const sizeStr = `${state.width}x${state.height}${state.unit}`;
      // 如果使用新的 phySize，则更新画布
      if(lastPhySize !== sizeStr) {
        saveLastPhySize(lastPhySize);
        lastPhySize = sizeStr;
        updateDesignSize?.(sizeStr, sizeStr, true);
        showSuccess('画布大小已更新');
      }else{
        showWarning('画布大小未发生变化');
      }
    });

    delegator.on(container, 'click', '[data-id="restore"]', () => {
      // 恢复 lastPhySize
      restoreLastSize();
    });

    delegator.on(container, 'input', '[data-id="query"]', throttle((e) => {
      state.searchText = e.target.value.trim();
      refs.clear.classList.toggle('hidden', !state.searchText);
      updateSizeList(fuse);
    }, 150));

    delegator.on(container, 'click', '[data-id="clear"]', () => {
      state.searchText = '';
      refs.query.value = '';
      refs.clear.classList.add('hidden');
      updateSizeList(fuse);
    });

    delegator.on(container, 'click', '[data-id="item"]', (e, el) => {
      const index = [...refs.list.children[0].children].indexOf(el);
      const item = state.matchedSizes[index];
      if (item) {
        const parsed = parseSizeString(item.s);
        if (parsed) {
          Object.assign(state, parsed);
          state.ratio = state.width / state.height;
          updateUIFromState();

          // refs.apply 抖动一下，使用 TailwindCSS 类提醒用户
          refs.apply.classList.remove('shake'); // 重置动画（防止快速点击无效）
          void refs.apply.offsetWidth; // 触发 reflow
          refs.apply.classList.add('shake');
        }
      }
    });

  }

  updateRestoreButtonUI();
  updateSizeList(fuse);
  updateUIFromState();
  panel.show('resize-canvas', refs.wrapper, '画布大小');
}

function updateSizeList(fuse) {
  const list = state.searchText ? fuse.search(state.searchText).map(r => r.item) : sizes;
  state.matchedSizes = list;
  if(list.length === 0) {
    refs.list.innerHTML = `<div class="text-center text-slate-400">没有找到匹配的尺寸，可以自定义尺寸</div>`;
    return;
  }
  refs.list.innerHTML = `<div class="flex flex-col gap-2 w-88">` + list.map(size => {
      const s = parseSizeString(size.s);
      const w = s.width; 
      const h = s.height;
      const ratio = w/h;
      const maxSide = 52;
      const previewWidth = ratio >= 1 ? maxSide : maxSide * ratio;
      const previewHeight = ratio >= 1 ? maxSide / ratio : maxSide;
      return `
        <div data-id="item" class="relative p-2 flex items-center gap-2 border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
          <div class="flex-shrink-0 w-16 h-16 p-1 bg-slate-200 rounded-lg flex items-center justify-center">
            <div class="bg-white rounded shadow-sm border-1 border-purple-700" style="width:${previewWidth}px;height:${previewHeight}px"></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm line-clamp-1 leading-snug mb-1 text-slate-700">${size.t}</div>
            <div class="text-xs text-slate-400 flex items-center gap-1">
              <span class="font-mono">${size.s}</span>
            </div>
          </div>
          <div class="absolute bottom-2 right-2 text-[10px] text-slate-500 px-1 rounded bg-slate-200">${size.r}</div>
        </div>
      `;
  }).join('') + `</div>`;
}

emitter.on('operation:resize-canvas:init', () => {
  const type = panel.getType();
  if(type === 'resize-canvas') {
    panel.hide();
  }else{
    mountCanvasResizePanel();
  }
});
