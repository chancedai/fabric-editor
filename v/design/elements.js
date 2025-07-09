
import lib from './lib';
import '@simonwep/pickr/dist/themes/monolith.min.css'; 
import Pickr from '@simonwep/pickr';
import { throttle,debounce, render, emitter } from '../__common__/utils';
import ValueAdjuster from '../__common__/value-adjuster';
import Colorpicker from './colorpicker';
import noUiSlider from 'nouislider';
import 'nouislider/dist/nouislider.css';

import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

Pickr.prototype.setSwatches = function(swatches) {
  if (!swatches.length) return;
  for (let i = this._swatchColors.length - 1; i > -1; i--) {
      this.removeSwatch(i);
  }
  swatches.forEach(swatch => this.addSwatch(swatch));
}



// elements 模块封装了各种用于绘图工具界面的 UI 元素创建函数
const elements = (() => {
  // 存放所有销毁回调函数的数组，用于后续清理已创建的组件
  let destroyCallbacks = [];

  function createColorPicker(container, config = {}) {
    const defaultConfig = {
        // pickrWrapper 类
        pickrWrapperClass: "absolute w-8 h-8 top-0 left-0",
        // span 类
        spanClass: "w-full h-8 border border-slate-300 rounded-md block pl-8 text-slate-700 relative cursor-pointer leading-8",
        color: "#ff0000", // 默认颜色
        format: "rgb",    // 默认颜色格式
        opacity: true,    // 是否显示透明度
        swatches: ["#ffffff", "#00ff00", "#0000ff", "#ffff00"], // 默认色板
        onchange: null,    // 颜色变化时回调,
        // 可以控制不显示 span(颜色值)
        showValue: true

    };
    const cfg = { ...defaultConfig, ...config };

    container.classList.add("relative");

    const pickrWrapper = document.createElement("div");
    // 如果白色，和背景色混淆，看不见，所以加个边框
    pickrWrapper.className = cfg.pickrWrapperClass;
    container.appendChild(pickrWrapper);

    // 创建颜色选择器容器
    const pickrButton = document.createElement("div");
    pickrWrapper.appendChild(pickrButton);

    let span = null;
    if(cfg.showValue) {
        // 创建输入框，显示当前颜色
        span = document.createElement("span");
        // 占满剩余空间
        span.className = cfg.spanClass;
        span.textContent = cfg.color;  // 初始化时显示默认颜色
        container.appendChild(span);
    }

    // 记录初始颜色
    let initialColor = cfg.color;

    const pickr = Pickr.create({
        el: pickrButton,
        theme: 'monolith',
        default: cfg.color,
        swatches: cfg.swatches,
        lockOpacity: !cfg.opacity,
        defaultRepresentation: cfg.format.toUpperCase(),
        autoReposition: true,
        i18n: {
            'ui:dialog': '颜色选择器',
            'btn:toggle': '切换颜色选择器',
            'btn:swatch': '示例颜色',
            'btn:last-color': '使用上次颜色',
            'btn:save': '保存',
            'btn:cancel': '取消',
            'btn:clear': '清除颜色',
            'aria:btn:save': '保存并关闭',
            'aria:btn:cancel': '取消并关闭',
            'aria:btn:clear': '清除并关闭',
            'aria:input': '颜色输入框',
            'aria:palette': '颜色调色板',
            'aria:hue': '色调滑块',
            'aria:opacity': '透明度滑块'
        },
        components: {
            preview: true,
            opacity: cfg.opacity,
            hue: true,
            palette: true,
            interaction: {
                input: true,
                cancel: true,
            }
        }
    });

    // 监听颜色变化
    pickr.on('change', (color) => {
        let newColor = color.toHEXA().toString(0);
        if (cfg.format.toLowerCase() === "rgb") {
            newColor = color.toRGBA().toString(0);
        }
        pickr.applyColor(true); // 让 Pickr 确认颜色变更
        if (span) {
          span.textContent = newColor;  // 同步更新输入框的颜色值
        }
        if (typeof cfg.onchange === "function") {
            cfg.onchange(newColor);
        }
    });

    // 监听取消事件，恢复初始颜色
    pickr.on('cancel', () => {
        pickr.setColor(initialColor);  // 恢复到初始颜色
        if (span) {
          span.textContent = initialColor;
        }
        pickr.hide(); // 隐藏颜色选择器
    });

    // 当点击时，toggle颜色选择器
    span.addEventListener("click", throttle(() => {
        const event = new Event("click");
        pickr.getRoot().button.dispatchEvent(event);
    }
    , 100));

    // 在 Pickr 弹出层添加吸色笔按钮
    const eyeDropperButton = document.createElement("button");
    eyeDropperButton.className = "vicon-color-picker text-xl bg-slate-200 p-1 mt rounded-sm cursor-pointer hover:bg-slate-300";
    eyeDropperButton.style.marginTop = '.4em'; // 使用 Tailwind 设置按钮样式并定位

    // 将按钮插入到 Pickr 弹出层
    const pickrRoot = pickr.getRoot();
    pickrRoot.interaction.result.parentElement.insertBefore(eyeDropperButton, pickrRoot.interaction.result);

    // 吸色笔功能
    if (window.EyeDropper) {
        const eyeDropper = new EyeDropper();
        eyeDropperButton.addEventListener("click", async () => {
            try {
                const result = await eyeDropper.open();
                pickr.setColor(result.sRGBHex);
            } catch (err) {
                console.warn("吸色笔取消了", err);
            }
        });
    } else {
        eyeDropperButton.disabled = true;
        eyeDropperButton.title = "当前浏览器不支持吸色笔功能";
    }

    // // 清除现有的所有色板颜色
    // const removeExistingSwatches = () => {
    //     const swatchElements = pickr.getRoot().swatches.querySelectorAll('button');
    //     swatchElements.forEach((swatchElement, index) => {
    //         pickr.removeSwatch(index); // 移除现有的颜色
    //     });
    // };

    // // 添加自定义色板
    // const addCustomSwatches = (swatches) => {
    //     swatches.forEach(color => pickr.addSwatch(color)); // 添加新的颜色
    // };

    return {
        update: (newConfig) => {
            if (newConfig.color) {
                initialColor = newConfig.color; // 更新记录的初始颜色
                pickr.setColor(newConfig.color);
                span.textContent = newConfig.color;  // 更新输入框的值
            }
            if (newConfig.swatches) {
                // removeExistingSwatches(); // 清除现有的颜色
                // addCustomSwatches(newConfig.swatches); // 添加新的颜色
                pickr.setSwatches(newConfig.swatches);
            }
        }
    };
}
const createNumberInput = (container, config) => {
  const defaultConfig = {
    value: 0,
    min: -Infinity,
    max: Infinity,
    step: 1,
    quickValues: [],
    prefix: "",
    suffix: "",
    disabled: false,
    debounceDelay: 5000,
    onchange: () => {}
  };

  const cfg = { ...defaultConfig, ...config };
  let value = cfg.value;

  const wrapper = document.createElement("div");
  wrapper.className = `relative inline-block${cfg.prefix || cfg.suffix ? ' flex items-center gap-2' : ''}`;

  if (cfg.prefix) {
    const prefixSpan = document.createElement("span");
    prefixSpan.className = "text-slate-500 text-sm";
    prefixSpan.textContent = cfg.prefix;
    wrapper.appendChild(prefixSpan);
  }

  const input = document.createElement("input");
  input.type = "text";
  input.className = "input text-center w-20";
  input.value = value;
  wrapper.appendChild(input);

  if (cfg.suffix) {
    const suffixSpan = document.createElement("span");
    suffixSpan.className = "text-slate-500 text-sm";
    suffixSpan.textContent = cfg.suffix;
    wrapper.appendChild(suffixSpan);
  }

  container.appendChild(wrapper);

  const clampValue = () => {
    const raw = input.value;
    if (raw === "") return;

    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      const clamped = Math.max(cfg.min, Math.min(cfg.max, parsed));
      value = clamped;
      input.value = clamped;
      cfg.onchange(clamped);
    }
  };

  const delayedClamp = debounce(clampValue, cfg.debounceDelay);

  input.addEventListener("input", () => {
    delayedClamp();
  });

  input.addEventListener("blur", clampValue);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      clampValue();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.max(cfg.min, Math.min(cfg.max, (parseFloat(input.value) || 0) + cfg.step));
      value = next;
      input.value = next;
      cfg.onchange(next);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(cfg.min, Math.min(cfg.max, (parseFloat(input.value) || 0) - cfg.step));
      value = next;
      input.value = next;
      cfg.onchange(next);
    }
  });

  input.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? cfg.step : -cfg.step;
    const next = Math.max(cfg.min, Math.min(cfg.max, (parseFloat(input.value) || 0) + delta));
    value = next;
    input.value = next;
    cfg.onchange(next);
  });

  input.addEventListener("focus", (e) => e.target.select());

  const buildDropdown = () => {
    dropdownContent.innerHTML = "";
    const qv = cfg.quickValues.length === 0 && Number.isFinite(cfg.min) && Number.isFinite(cfg.max)
      ? [
          { value: cfg.min, label: `${cfg.min}` },
          { value: Math.round((cfg.min + cfg.max) / 2), label: `${Math.round((cfg.min + cfg.max) / 2)}` },
          { value: cfg.max, label: `${cfg.max}` }
        ]
      : cfg.quickValues;

    qv.forEach(({ value: v, label }) => {
      const btn = document.createElement("button");
      btn.className = "w-full whitespace-nowrap text-left px-4 py-1 hover:bg-slate-100 block font-light";
      btn.innerHTML = label;
      btn.addEventListener("click", () => {
        if (v.startsWith && v.startsWith("__")) {
        } else {
          value = v;
          input.value = v;
        }
        cfg.onchange(v);
        dropdown.hide();
        input.focus();
      });
      dropdownContent.appendChild(btn);
    });
  };

  const dropdownContent = document.createElement("div");
  dropdownContent.className = "py-1 space-y-1 text-sm";

  buildDropdown();

  const dropdown = tippy(input, {
    content: dropdownContent,
    trigger: "manual",
    interactive: true,
    placement: "bottom",
    theme: "light",
    appendTo: () => document.body
  });

  input.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.show();
  });

  dropdownContent.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // if (cfg.disabled) {
  //   input.disabled = true;
  //   input.classList.add("bg-slate-100", "text-slate-400", "cursor-not-allowed");
  // }

  const destroy = () => {
    dropdown.destroy();
    wrapper.remove();
  };

  return {
    update: (val) => {
      value = Math.max(cfg.min, Math.min(cfg.max, val));
      input.value = value;
    },
    updateConfig: (newCfg) => {
      Object.assign(cfg, newCfg);
      // input.disabled = cfg.disabled;
      // input.classList.toggle("bg-slate-100", cfg.disabled);
      // input.classList.toggle("text-slate-400", cfg.disabled);
      // input.classList.toggle("cursor-not-allowed", cfg.disabled);
      buildDropdown();
    },
    destroy
  };
};



const createSlider = (container, config) => {
  const defaultConfig = {
    min: 0,
    max: 100,
    step: 1,
    value: 0,
    quickValues: [],
    prefix: "",
    suffix: "",
    range: null,
    inputMin: null,
    inputMax: null,
    onchange: () => {}
  };

  const cfg = { ...defaultConfig, ...config };

  let sliderMin = cfg.range?.[0] ?? cfg.min;
  let sliderMax = cfg.range?.[1] ?? cfg.max;
  let inputMin = cfg.inputMin ?? sliderMin;
  let inputMax = cfg.inputMax ?? sliderMax;

  const step = cfg.step;
  let value = typeof cfg.value === "undefined" ? sliderMin : cfg.value;

  const wrapper = document.createElement("div");
  wrapper.className = "flex items-center gap-4 w-full";
  container.appendChild(wrapper);

  const sliderEl = document.createElement("div");
  sliderEl.className = "w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer";
  wrapper.appendChild(sliderEl);

  const inputWrapper = document.createElement("div");
  wrapper.appendChild(inputWrapper);

  const numberInput = createNumberInput(inputWrapper, {
    value,
    min: inputMin,
    max: inputMax,
    step,
    quickValues: cfg.quickValues,
    prefix: cfg.prefix,
    suffix: cfg.suffix,
    onchange: (val) => {
      const visualVal = Math.max(sliderMin, Math.min(sliderMax, val));
      sliderEl.noUiSlider.set(visualVal);
      cfg.onchange(val);
    }
  });

  noUiSlider.create(sliderEl, {
    start: Math.max(sliderMin, Math.min(sliderMax, value)),
    range: { min: sliderMin, max: sliderMax },
    step,
    connect: [true, false],
    keyboardSupport: true
  });

  sliderEl.noUiSlider.on("update", (values, handle) => {
    numberInput.update(parseFloat(values[handle]));
  });

  sliderEl.noUiSlider.on("change", (values, handle) => {
    const val = parseFloat(values[handle]);
    numberInput.update(val);
    cfg.onchange(val);
  });

  sliderEl.noUiSlider.on("slide", (values, handle) => {
    const val = parseFloat(values[handle]);
    cfg.onchange(val);
  });

  const destroy = () => {
    sliderEl.noUiSlider.destroy();
    numberInput.destroy();
    wrapper.remove();
  };

  return {
    update: (val) => {
      const visualVal = Math.max(sliderMin, Math.min(sliderMax, val));
      sliderEl.noUiSlider.set(visualVal);
      numberInput.update(val);
    },
    updateConfig: (newConfig) => {
      Object.assign(cfg, newConfig);

      sliderMin = cfg.range?.[0] ?? cfg.min;
      sliderMax = cfg.range?.[1] ?? cfg.max;
      inputMin = cfg.inputMin ?? sliderMin;
      inputMax = cfg.inputMax ?? sliderMax;

      sliderEl.noUiSlider.updateOptions({
        range: { min: sliderMin, max: sliderMax },
        step: cfg.step
      });

      numberInput.updateConfig({
        min: inputMin,
        max: inputMax,
        step: cfg.step,
        quickValues: cfg.quickValues,
        prefix: cfg.prefix,
        suffix: cfg.suffix,
        disabled: cfg.disabled
      });
    },
    destroy
  };
};









 /**
 * 创建一组按钮控件。
 * @param {HTMLElement} container - 用于附加按钮组的容器元素
 * @param {Object} config - 配置对象，必须包含 choices 对象和可选的 onclick 回调
 * @returns {Object} - 返回包含按钮组容器的对象
 */
const createButtonGroup = (container, config) => {
  // 创建一个 div 容器，设置 Tailwind CSS 类名
  const buttonGroup = document.createElement("div");
  buttonGroup.classList.add("flex", "gap-2");

  // 遍历配置中的每个选项，生成对应的按钮
  for (let choiceKey in config.choices) {
      const button = document.createElement("button");
      button.type = "button";
      button.classList.add("px-2", "py-1", "bg-slate-500", "text-white", "rounded", "hover:bg-slate-600", "focus:outline-hidden", "focus:ring-1", "focus:ring-slate-400");
      button.style.minWidth = "2rem"; // 按钮最小宽度设置为 2rem
      button.innerHTML = config.choices[choiceKey].label; // 按钮显示配置中定义的 label
      
      button.addEventListener("click", () => {
          if (config.onclick) {
              config.onclick(choiceKey);
          }
      });
      
      buttonGroup.appendChild(button);
  }
  
  // 创建一个外层 div，并添加按钮组
  const wrapper = document.createElement("div");
  wrapper.appendChild(buttonGroup);
  container.appendChild(wrapper);
  
  return { wrapper, buttons: buttonGroup };

};

const createCheckboxGroup = (container, config) => {
  const checkboxGroup = document.createElement('div');
  checkboxGroup.className = config.class || 'inline-flex rounded-lg border border-slate-200 bg-white p-1 gap-1';

  Object.entries(config.choices).forEach(([choiceKey, choiceValue]) => {
    if (choiceKey === "_divider_") {
      const divider = document.createElement('div');
      divider.className = 'mx-1 w-px bg-slate-200';
      checkboxGroup.appendChild(divider);
      return;
    }

    const isChecked = choiceValue.checked;
    const labelElem = document.createElement('label');
    labelElem.className = `cursor-pointer flex items-center justify-center min-w-6 min-h-6 text-sm font-medium transition-colors 
      ${isChecked ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'}
      relative overflow-hidden rounded-md`;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = choiceKey;
    input.checked = isChecked;
    input.className = 'sr-only';

    const border = document.createElement('div');
    border.className = 'absolute -inset-px rounded-md ring-1 ring-transparent transition';

    const updateState = () => {
      labelElem.classList.toggle('bg-purple-600', input.checked);
      labelElem.classList.toggle('text-white', input.checked);
      labelElem.classList.toggle('text-slate-600', !input.checked);
      labelElem.classList.toggle('hover:bg-slate-100', !input.checked);
    };

    input.addEventListener('change', () => {
      updateState();
      config.onchange(input.name, input.checked);
    });

    labelElem.prepend(border);
    labelElem.appendChild(input);
    labelElem.appendChild(new DOMParser().parseFromString(choiceValue.label, 'text/html').body.firstChild);
    updateState();

    checkboxGroup.appendChild(labelElem);
  });

  container.appendChild(checkboxGroup);
  return { 
    wrapper: checkboxGroup,
    update: (checkedObj) => {
      checkboxGroup.querySelectorAll('input').forEach(input => {
        input.checked = checkedObj[input.name];
        // input.dispatchEvent(new Event('change'));
      });
    }
  };
};

const createRadioGroup = (container, config) => {
  const defaultValue = config.default || null;
  const groupName = config.name || `v${Math.random().toString(36).substr(2, 9)}`;
  const radioGroup = document.createElement('div');
  radioGroup.className = config.class || 'inline-flex rounded-lg border border-slate-200 bg-white p-1 gap-1';

  Object.entries(config.choices).forEach(([key, label]) => {
    if (key === "_divider_") {
      const divider = document.createElement('div');
      divider.className = 'mx-1 w-px bg-slate-200';
      radioGroup.appendChild(divider);
      return;
    }

    const isActive = key == defaultValue;
    const labelElem = document.createElement('label');
    labelElem.className = `cursor-pointer flex items-center justify-center min-w-6 min-h-6 transition-colors 
      ${isActive ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'}
      relative overflow-hidden rounded-md`;

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = groupName;
    input.value = key;
    input.className = 'sr-only';
    input.checked = isActive;

    const border = document.createElement('div');
    border.className = 'absolute -inset-px rounded-md ring-1 ring-transparent transition';

    input.addEventListener('change', () => {
      radioGroup.querySelectorAll('label').forEach(label => {
        label.classList.remove('bg-purple-600', 'text-white');
        label.classList.add('text-slate-600', 'hover:bg-slate-100');
      });
      labelElem.classList.add('bg-purple-600', 'text-white');
      labelElem.classList.remove('text-slate-600', 'hover:bg-slate-100');
      config.onchange(key);
    });

    labelElem.prepend(border);
    labelElem.appendChild(input);
    labelElem.appendChild(new DOMParser().parseFromString(label, 'text/html').body.firstChild);

    radioGroup.appendChild(labelElem);
  });

  container.appendChild(radioGroup);
  return { 
    wrapper: radioGroup,
    update: (value) => {
      radioGroup.querySelectorAll('input').forEach(input => {
        input.checked = input.value == value;
      });
      radioGroup.querySelectorAll('label').forEach(label => {
        if (label.querySelector('input').value == value) {
          label.classList.add('bg-purple-600', 'text-white');
          label.classList.remove('text-slate-600', 'hover:bg-slate-100');
        } else {
          label.classList.remove('bg-purple-600', 'text-white');
          label.classList.add('text-slate-600', 'hover:bg-slate-100');
        }
      });
    }
  };
};



{/* <label class="flex items-center cursor-pointer">
  <input type="checkbox" class="sr-only peer" />
  <div class="w-11 h-6 bg-slate-300 rounded-full peer-checked:bg-purple-600 transition-colors duration-300 relative">
    <div class="w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 translate-x-1 peer-checked:translate-x-6"></div>
  </div>
  <span class="ml-3 text-slate-700">接收通知</span>
</label>
 */}

 const createIOSCheckbox = (container, config) => {
  const refs = render({}, () => `
    <label class="flex items-center cursor-pointer text-sm">
      ${config.labelPosition === 'before' ? `<span class="mr-2 text-slate-700">${config.label || ''}</span>` : ''}
      <input type="checkbox"
             class="sr-only peer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
             data-id="checkbox"
             ${config.checked ? 'checked' : ''} />

      <div data-id="track"
           class="w-11 h-6 bg-slate-300 rounded-full transition-colors duration-300 relative
                  peer-checked:bg-purple-600
                  peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500 peer-focus-visible:ring-offset-1">
        <div data-id="thumb"
             class="absolute top-0.5 left-[2px] w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300
                    peer-checked:translate-x-5
                    active:scale-95 active:shadow"></div>
      </div>
      ${config.labelPosition !== 'before' ? `<span class="ml-2 text-slate-700">${config.label || ''}</span>` : ''}
    </label>
  `, container);

  const checkbox = refs.checkbox;
  const track = refs.track;
  const thumb = refs.thumb;

  const updateThumb = () => {
    // 样式通过类控制，这里保留但可省略逻辑控制
    thumb.classList.toggle('translate-x-5', checkbox.checked);
    thumb.classList.toggle('translate-x-0', !checkbox.checked);
    track.classList.toggle('bg-purple-600', checkbox.checked);
    track.classList.toggle('bg-slate-300', !checkbox.checked);
  };

  let suppressEvent = false;

  checkbox.addEventListener('change', (e) => {
    updateThumb();
    if (!suppressEvent && typeof config.onchange === 'function') {
      config.onchange(e.target.checked);
    }
  });

  const update = (checked) => {
    suppressEvent = true;
    checkbox.checked = checked;
    updateThumb();
    suppressEvent = false;
  };

  updateThumb(); // 初始化状态

  return {
    input: checkbox,
    update
  };
};



    

/**
 * 创建优雅的文本输入框
 * @param {HTMLElement} container - 容器元素
 * @param {Object} config - 配置对象
 * @returns {Object} 包含容器元素的对象
 */
const createTextInput = (container, config) => {
  const wrapper = document.createElement('div');
  wrapper.className = `relative ${config.class || ''}`;

  const input = document.createElement('input');
  input.type = config.type || 'text';
  input.className = 'w-full px-4 py-2.5 text-slate-700 bg-white border border-slate-200 rounded-lg transition-all' +
                   ' focus:border-purple-500 outline-hidden hover:border-slate-300' +
                   ' placeholder-slate-400/75 focus:ring-1 focus:ring-purple-200';

  // 基础属性配置
  if (config.val) input.value = config.val;
  if (config.id) input.id = config.id;
  if (config.name) input.name = config.name;
  if (config.placeholder) input.placeholder = config.placeholder;

  // min max 
  if(input.type === 'number') {
      if (config.min) input.min = config.min;
      if (config.max) input.max = config.max;
  }

  // 事件绑定
  if (config.onchange) {
      input.addEventListener('change', function() {
          config.onchange(this.value);
      });
  }
  if (config.onkeyup) {
      input.addEventListener('keyup', function() {
          config.onkeyup(this.value);
      });
  }

  // 动态焦点效果
  const border = document.createElement('div');
  border.className = 'absolute inset-0 rounded-lg pointer-events-none transition-all';
  border.style.boxShadow = '0 0 0 2px transparent';
  
  input.addEventListener('focus', () => {
      border.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
  });
  input.addEventListener('blur', () => {
      border.style.boxShadow = '0 0 0 2px transparent';
  });

  wrapper.append(border, input);
  container.appendChild(wrapper);
  return { 
    wrapper, 
    input,
    update: (val) => {
      input.value = val;
    }
   };
};


const createTextArea = (container, config) => {
  const wrapper = document.createElement('div');
  wrapper.className = `relative ${config.class || ''}`;

  const textarea = document.createElement('textarea');
  // 移除focus:ring相关样式
  textarea.className = 'w-full p-1 text-slate-700 bg-white border border-slate-200 rounded-lg transition-all' +
                      ' focus:border-purple-500 outline-hidden' + // 移除非必要的ring效果
                      ' hover:border-slate-300 placeholder-slate-400 resize-y min-h-[2em]';

  // 保持其他属性设置...
  textarea.rows = config.rows || 3;

  if (config.val) textarea.value = config.val;
  if (config.id) textarea.id = config.id;
  if (config.name) textarea.name = config.name;

  // 优化边框动画逻辑
  const border = document.createElement('div');
  border.className = 'absolute inset-0 rounded-lg pointer-events-none transition-all' +
                    ' border border-transparent'; // 合并样式

  // 修改交互效果实现方式
  let isFocused = false;
  textarea.addEventListener('focus', () => {
      isFocused = true;
      border.classList.add('border-purple-200');
      border.style.opacity = '1';
  });
  textarea.addEventListener('blur', () => {
      isFocused = false;
      border.classList.remove('border-purple-200');
      border.style.opacity = '0';
  });
    // 事件绑定
  if (config.onkeyup) {
      textarea.addEventListener('keyup', function() {
          config.onkeyup(this.value);
      });
  }

  // 添加平滑过渡
  border.style.transition = 'opacity 0.2s ease, border-color 0.2s ease';
  
  // 悬停效果优化
  wrapper.addEventListener('mouseenter', () => {
      if (!isFocused) {
          border.style.opacity = '0.3';
          border.classList.add('border-slate-200');
      }
  });
  wrapper.addEventListener('mouseleave', () => {
      if (!isFocused) {
          border.style.opacity = '0';
          border.classList.remove('border-slate-200');
      }
  });

  wrapper.append(border, textarea);
  container.appendChild(wrapper);
  
  // 保持高度自适应逻辑...
  return { 
    wrapper,
    update: (val) => {
      textarea.value = val;
    }
   };
};
  /**
 * 创建一个下拉选择框（select）。
 * @param {HTMLElement} container - 用于附加下拉框的容器元素
 * @param {Object} config - 配置对象，支持 id、name、default、choices、onchange 等属性
 * @returns {Object} - 返回包含下拉框容器的对象
 */
const createSelect = (container, config) => {
  // 获取默认选中的值（若有）
  let defaultValue = config.default !== undefined ? config.default : null;
  
  // 创建 select 元素，并添加 Tailwind CSS 样式
  const select = document.createElement("select");
  select.classList.add("block", "w-full", "px-4", "py-2", "border", "border-slate-300", "rounded", "bg-white", "text-slate-700", "focus:outline-hidden", "focus:ring-1", "focus:ring-purple-500");
  
  if (config.id) {
      select.id = config.id;
  }
  if (config.name) {
      select.name = config.name;
  }

  // 如果 choices 为数组，则转换成对象形式
  let choicesObj = {};
  if (Array.isArray(config.choices)) {
      config.choices.forEach(choice => {
          choicesObj[choice] = choice;
      });
  } else {
      choicesObj = config.choices;
  }

  // 为每个选项生成 option 元素，若为默认选中项则添加 selected 属性
  for (let key in choicesObj) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = choicesObj[key];
      if (key == defaultValue) {
          option.selected = true;
      }
      select.appendChild(option);
  }

  // 绑定 change 事件，调用配置中的 onchange 回调
  select.addEventListener("change", function () {
      if (config.onchange) {
          config.onchange(this.value);
      }
  });

  // 创建外层 div 并添加 select
  const wrapper = document.createElement("div");
  wrapper.appendChild(select);
  container.appendChild(wrapper);

  // updateSelect 不要触发 onchange 事件
  function updateSelect(value) {
      // 更新 select 的选中项
      const options = select.querySelectorAll("option");
      options.forEach(option => {
          option.selected = option.value === value;
      });
  }
  // 如果没有提供 default，则设置为第一个选项
  if (defaultValue === null) {
      defaultValue = select.options[0].value;
      updateSelect(defaultValue);
  }

  return {
      update: updateSelect
  };
};

// createSelect 示例
// const selectContainer = document.createElement('div');
// createSelect(selectContainer, {
//     id: 'select-example',
//     name: 'select-example',
//     default: 'b',
//     choices: {
//         a: 'Option A',
//         b: 'Option B',
//         c: 'Option C'
//     },
//     onchange: (value) => {
//         console.log('Selected:', value);
//     }
// });


//   /**
//  * 创建一个字体选择器控件。
//  * @param {HTMLElement} container - 用于附加字体选择器的容器元素，如果为空，则自动创建一个新的容器
//  * @param {Object} config - 配置对象，支持 id、name、default、parentElement、localFonts、onchange 等属性
//  * @returns {Object} - 返回包含字体选择器容器的对象
//  */
// const createFontPicker = (container, config) => {
//   // 创建一个文本输入框用于显示和选择字体
//   const fontInput = document.createElement('input');
//   fontInput.type = 'text';
//   if (config.id) {
//     fontInput.id = config.id;
//   }
//   if (config.name) {
//     fontInput.name = config.name;
//   }
//   if (typeof config.default !== 'undefined') {
//     fontInput.value = config.default;
//   }
//   // 为 input 添加 TailwindCSS 样式
//   // fontInput.className = 'border rounded px-3 py-2 w-full focus:outline-hidden focus:ring focus:border-purple-300';

  

//   // 将字体选择器包装在一个 div 中，并添加到指定的容器中
//   const containerDiv = document.createElement('div');
//   // containerDiv.className = 'p-4 space-y-2';
//   containerDiv.appendChild(fontInput);
//   container.appendChild(containerDiv);

//   // 如果没有提供 container，则创建一个新的容器元素，放在 fontInput 后面
//   // let parentElement = config.parentElement;
//   let parentElement = document.querySelector('[data-id="fontPickerContainer"]');
  
//   // const wrapper = document.createElement('div');
//   //   wrapper.id = 'picker-wrapper';
//   //   wrapper.classList.add('z-10', 'absolute', 'top-0', 'left-0','w-full', 'h-full', 'bg-white','hidden');
//   //   // wrapper.style.display = 'none';
//   //   parentElement.appendChild(wrapper);

//   // 初始化 FontPicker（使用我们之前创建的原生版本）
//   // parentElement 用于指定字体选择器 UI 显示的容器，默认 document.body
//   const picker = new FontPicker(fontInput, {
//     lang: 'zh',
//     // container: wrapper,
//     container: parentElement,
//     // localFontsUrl: config.localFontsUrl || '',
//     localFonts: config.localFonts || localFonts,
//     onShow: function() {
//       this.containerEl.classList.add('z-10', 'absolute', 'top-0', 'left-0','w-full', 'h-full', 'bg-white');
//       // parentElement.scrollTo(0, 0);
//       // parentElement.classList.add('overflow-hidden');
//       parentElement.classList.remove('hidden');
//       // parentElement.style.display = '';
//     },
//     onHide: () => {
//       // parentElement.style.display = 'none';
//       parentElement.classList.add('hidden');
//     },
//     // onSelect: (font) => {
//     //   fontInput.value = font.family;
//     //   if (config.onchange) {
//     //     debugger;
//     //     config.onchange(font.family);
//     //   }
//     // }
//     // this.options.onSelect({
//     //   fontType,
//     //   fontFamily,
//     //   fontStyle: italic ? "italic" : "normal",
//     //   fontWeight: weight,
//     //   fontSpec: value,
//     // });
//     // 其它配置项可在此传入
//   });

//   // 当字体改变时，调用 config.onchange 回调
//   fontInput.addEventListener('change', function () {
//     if (typeof config.onchange === 'function') {
//       config.onchange(fontInput.value);
//     }
//   });

//   // 注册销毁回调，假设全局有 destroyCallbacks 数组（如果需要）
//   if (window.destroyCallbacks && Array.isArray(window.destroyCallbacks)) {
//     window.destroyCallbacks.push(() => {
//       try {
//         if (picker.destroy) {
//           picker.destroy();
//         }
//       } catch (error) {
//         // 销毁过程中忽略异常
//       }
//     });
//   }

//   return { 
//       // wrapper, 
//       fontInput, 
//       update: (value) => {
//         fontInput.value = value;
//         picker.applyFontToOriginalInput(value);
//       }
//     }
// };
function enableSmoothScroll(fontButton, { speed = 1, pause = 1000 } = {}) {
  let scrollInterval = null;
  let pauseTimeout = null;
  let scrollingRight = true;

  const scrollStep = () => {
    if (scrollingRight) {
      fontButton.scrollLeft += speed;
      if (fontButton.scrollLeft >= fontButton.scrollWidth - fontButton.clientWidth) {
        scrollingRight = false;
        clearInterval(scrollInterval);
        pauseTimeout = setTimeout(() => {
          scrollInterval = setInterval(scrollStep, 10);
        }, pause);
      }
    } else {
      fontButton.scrollLeft -= speed;
      if (fontButton.scrollLeft <= 0) {
        scrollingRight = true;
        clearInterval(scrollInterval);
        pauseTimeout = setTimeout(() => {
          scrollInterval = setInterval(scrollStep, 10);
        }, pause);
      }
    }
  };

  const startScrolling = () => {
    if (fontButton.scrollWidth <= fontButton.clientWidth) return;
    clearInterval(scrollInterval);
    clearTimeout(pauseTimeout);
    scrollInterval = setInterval(scrollStep, 10);
  };

  fontButton.addEventListener('mouseenter', startScrolling);
  fontButton.addEventListener('mouseleave', () => {
    clearInterval(scrollInterval);
    clearTimeout(pauseTimeout);
    fontButton.scrollLeft = 0;
  });
}


// fontButton 显示字体名，并且名字的字体就主该字体，点击后弹出字体选择器
const createFontButton = (container, config) => {
  const defaultConfig = {
    object: null, // 关联的对象
    font: "e23baf", // 默认字体
    name: "Roboto", // 显示的字体名称
  };
  const cfg = { ...defaultConfig, ...config };
  const fontButton = document.createElement("button");
  // 字体不换行，超过部分用省略号表示
  fontButton.className = "min-w-8 h-8 max-w-24 border border-slate-200 text-sm cursor-pointer flex items-center rounded-lg hover:bg-slate-100 px-2 overflow-hidden text-ellipsis whitespace-nowrap";
  fontButton.style.fontFamily = '"'+cfg.font+'"'; // 设置按钮字体
  fontButton.textContent = cfg.name; // 显示字体名称
  
  container.appendChild(fontButton);

  // 点击按钮时，显示字体选择器
  fontButton.addEventListener("click", (e) => {
    emitter.emit("operation:font:edit", cfg.object);
  });
  // 如果字体超过宽度，hover 时，慢慢显示完整字体，使用滚动条，慢慢从左向右到最右边，停一下再慢慢从右向左滚动到最左边
  enableSmoothScroll(fontButton, { speed: 1, pause: 1000 });

  return {
    fontButton,
    update: (newConfig) => {
      if (newConfig.font) {
        cfg.font = newConfig.font; // 更新字体
        fontButton.style.fontFamily = '"'+cfg.font+'"'; // 更新按钮字体
      }
      if(newConfig.name) {
        cfg.name = newConfig.name; // 更新字体名称
        fontButton.textContent = cfg.name; // 更新按钮文本
      }
      if(newConfig.object) {
        cfg.object = newConfig.object; // 更新关联对象
        emitter.emit("operation:font:update", cfg.object);
      }
    }
  };
};


  

const createColorButton = (container, config) => {
  const defaultConfig = {
    color: "#ff0000", // 默认颜色
    opacity: true,    // 是否显示透明度
    swatches: ["#ffffff", "#00ff00", "#0000ff", "#ffff00"], // 默认色板
    onchange: null,    // 颜色变化时回调,
    clz: 'w-6 h-6 rounded-full border border-slate-200 bg-checkerboard cursor-pointer',
  };
  const cfg = { ...defaultConfig, ...config };
  // const color = config.color;
  const {update} = Colorpicker.initColorPicker({
    button: container,
    ...cfg,
    onchange: function(info) {
      container.style.background = info.color;
      cfg.onchange(this);
    }
  });
  return {
    update: (newConfig) => {
      if (newConfig.color) {
        let color = newConfig.color;
        color = Colorpicker.gradientToString(color);
        cfg.color = color; // 更新颜色
        update(color);
      }
      // if (newConfig.swatches) {
      //   cfg.swatches = newConfig.swatches; // 更新色板
      //   update(cfg.color);
      // }
    }
  }
}


// 创建一个按钮，点击使用 tippy 弹出层，层里有 letter spacing/line height slider
const createLetterSpacingButton = (container, config) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "vicon-text-spacing text-lg w-7 h-7 rounded-lg hover:bg-slate-100";
  container.appendChild(button);
  let tooltip = null;
  let letterSpacingSlider = null;
  let lineHeightSlider = null;
  let refs = null;

  function updateSliders() {
    if (letterSpacingSlider) {
      letterSpacingSlider.update(config.letterSpacing);
    }
    if (lineHeightSlider) {
      lineHeightSlider.update(config.lineHeight);
    }
  }

  function init(button){
    const content = document.createElement("div");
    content.className = "flex flex-col gap-1 w-68 p-4";
    refs = render({}, () => `
      <div class="flex flex-col">
        <span class="text-sm">字间距</span>
        <div class="" data-id="letterSpacing"></div>
      </div>
      <div class="flex flex-col">
        <span class="text-sm">行\u3000高</span>
        <div class="" data-id="lineHeight"></div>
      </div>
    `, content);
    letterSpacingSlider = createSlider(refs.letterSpacing, {
      range: [-500, 500],
      value: config.letterSpacing,
      onchange: (value) => {
        config.onchange('letterSpacing', value);
      }
    });
    lineHeightSlider = createSlider(refs.lineHeight, {
      range: [0.25, 5],
      step: 0.01,
      value: config.lineHeight,
      onchange: (value) => {
        config.onchange('lineHeight', value);
      }
    });
    tooltip = tippy(button, {
      content: content,
      offset: [0, 14],
      // 手动
      // trigger: 'manual',
      trigger: 'click',
      hideOnClick: true,
      theme: 'light',
      // placement: 'bottom',
      arrow: false,
      interactive: true,
    });
    tooltip.show();
  }


  button.addEventListener("click", (e) => {
    if (!tooltip) {
      init(button);
    }
  });

  return {
    update: (newConfig) => {
      if (newConfig.letterSpacing) {
        config.letterSpacing = newConfig.letterSpacing;
      }
      if (newConfig.lineHeight) {
        config.lineHeight = newConfig.lineHeight;
      }
      updateSliders();
    }
  };
};

// 参考 createLetterSpacingButton，做一个控制透明度的按钮
// const createOpacityButton = (container, config) => {
//   const button = document.createElement("button");
//   button.type = "button";
//   button.className = "vicon-opacity text-lg w-7 h-7 rounded-lg hover:bg-slate-100";
//   container.appendChild(button);
//   let tippyInstance = null;
//   button.addEventListener("click", (e) => {
//     if(tippyInstance) {
//       tippyInstance.destroy();
//     }
//       tippyInstance = tippy(button, {
//         content: () => {
//           const content = document.createElement("div");
//           content.className = "flex flex-col gap-2 w-80 p-4";
//           // 最后加一个重置(删除)按钮，设置为 100 
//           const refs = render({}, () => `
//               <span class="text-sm">不透明度</span>
//               <div data-id="opacity"></div>
//               <button data-id="delete" class="btn-primary"><i class="vicon-delete text-lg mr-1"></i>删除</button>
//           `, content);
//           const opacitySlider = createSlider(refs.opacity, {
//             range: [1, 100],
//             step: 1,
//             value: config.opacity,
//             onchange: (value) => {
//               config.onchange('opacity', value);
//             }
//           });
//           refs.delete.addEventListener("click", () => {
//             config.onchange('opacity', 100);
//             opacitySlider.update(100);
//           });
//           return content;
//         },
//         offset: [0, 14],
//         // 手动
//         trigger: 'manual',
//         theme: 'light',
//         placement: 'bottom',
//         arrow: false,
//         interactive: true,
//         hideOnClick: false,
//       });
    
//     if(tippyInstance.state.isVisible) {
//       tippyInstance.hide();
//       return;
//     }
//     tippyInstance.show();
//   });
//   return {
//     update: (newConfig) => {
//       if (newConfig.opacity) {
//         config.opacity = newConfig.opacity;
//       }
//       if (tippyInstance) {
//         tippyInstance.hide();
//       }
//     }
//   };
// };
  

  

  // 模块返回一个对象，提供创建不同类型 GUI 元素的方法（getGui），以及销毁所有创建元素的函数（destroy）
  return {
    /**
     * 根据指定类型创建 GUI 元素
     * @param {HTMLElement | jQuery} container - 元素将被添加到此容器中
     * @param {string} type - GUI 元素的类型，如 "buttons", "scroller", "colorPicker", "radio", "checkbox", "select", "fontPicker", "slider", "text", "textarea"
     * @param {Object} config - 每种 GUI 元素对应的配置对象
     * @returns {Object} - 返回创建好的 GUI 元素
     * @throws {Error} - 如果请求的 GUI 元素类型不存在，则抛出错误
     */
    getGui: (container, type, config) => {
      switch (type) {
        case "buttons":
          return createButtonGroup(container, config);
        case "colorPicker":
          return createColorPicker(container, config);
        case "radio":
          return createRadioGroup(container, config);
        case "checkbox":
          return createCheckboxGroup(container, config);
        case "select":
          return createSelect(container, config);
        // case "fontPicker":
        //   return createFontPicker(container, config);
        case "slider":
          return createSlider(container, config);
        case "text":
          return createTextInput(container, config);
        case "number":
          return createNumberInput(container, config);
        case "textarea":
          return createTextArea(container, config);
        case "valueAdjuster":
          const instance = new ValueAdjuster(container, config);
          return {
            update: (newValue) => {
              instance.update(newValue);
            },
          }
        case "colorButton":
          return createColorButton(container, config);
        case "letterSpacingButton":
          return createLetterSpacingButton(container, config);
        case "fontButton":
          return createFontButton(container, config);
        // case "opacityButton":
        //   return createOpacityButton(container, config);
        case "iosCheckbox":
          return createIOSCheckbox(container, config);
        default:
          throw Error("Error: GUI element " + type + " does not exist!");
      }
    },
    /**
     * 调用所有注册的销毁回调，销毁所有创建的 GUI 元素
     */
    destroy: () => {
      for (let i = 0; i < destroyCallbacks.length; i++) {
        destroyCallbacks[i]();
      }
      // 清空销毁回调数组
      destroyCallbacks = [];
    },
  };
})();

export default elements;

