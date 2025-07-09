import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import { render, delegator } from "./utils";
class ValueAdjuster {
    constructor(container, options = {}) {
      if(typeof container === "string") {
        container = document.querySelector(container);
      }
      this.container = container;
      
      this.min = options.min || 1;
      this.max = options.max || 800;
      this.step = options.step || 1;
      this.value = options.defaultValue || 16;
      this.quickValues = options.quickValues || [6,8,10,12,14,16,18,21,24,28,32,36,42,48,56,64,72,80,88,96,104,120,144];
      this.classes = Object.assign({
        wrapper: "inline-flex items-center border border-gray-200 rounded-lg overflow-hidden",
        button: "text-l p-0 hover:bg-slate-100 h-8 w-8 flex items-center justify-center", // 宽高一致
        input: "w-12 h-8 text-center text-sm p-1 focus:outline-none focus:bg-slate-200 hover:bg-slate-100", // 输入框与按钮同高
        
        quickSelect: "max-h-[50vh] w-24 overflow-y-auto overflow-x-hidden flex-col items-center",
        quickSelectItem: "w-full max-w-full border-box text-left py-1 pl-4 hover:bg-slate-200",
      }, options.classes);

      this.onChange = options.onChange || function(){};
      this.createUI();
    }
  
    createUI() {
      this.refs = render({}, () => `
        <div class="${this.classes.wrapper}">
          <button class="vicon-zoom-out ${this.classes.button}" data-id="decrease"></button>
          <input type="text" class="${this.classes.input}" data-id="input" value="${this.value}" />
          <button class="vicon-zoom-in ${this.classes.button}" data-id="increase"></button>
        </div>
      `, this.container);
  
      this.bindEvents();
    }

    // 获取正确的值
    getValue(newValue) {
        if (newValue === "") {
            newValue = this.value;
          }
          if (isNaN(newValue)) {
            newValue = this.value;
          } else {
            newValue = parseFloat(newValue);
          }
          if (newValue > this.max) {
            newValue = this.max;
          } else if (newValue < this.min) {
            newValue = this.min;
          }
        //   newValue只保留2位小数
        newValue = Math.round(newValue * 100) / 100;
            return newValue;
    }

  
    bindEvents() {
      delegator.on(this.container, 'click', '[data-id="decrease"]', () => {
        const newValue = this.getValue(this.value - 1);
        this._update(newValue);

      });
      delegator.on(this.container, 'click', '[data-id="increase"]', () => {
        const newValue = this.getValue(this.value + 1);
        this._update(newValue);
      });
      this.refs.input.addEventListener('focus', (e) => {
        e.target.select();
        this.showQuickSelect();
      });
      this.refs.input.addEventListener('click', (e) => {
        this.showQuickSelect();
      });
      delegator.on(this.container, 'input', '[data-id="input"]', (e, target) => {
        // 保证输入为数字，如果不是数字，则使用上一个值或默认值，如果超过最大值 使用最大值，如果小于最小值使用最小值
        let targetValue = target.value.trim();
        let newValue = targetValue;
        newValue = this.getValue(newValue);
        this.tempValue = newValue;

        if(this.inputTimeout) {
            clearTimeout(this.inputTimeout);
        }
        // 如果输入的值和当前值不一样，则延时1秒后更新
        // 否则立即更新
        if(this.tempValue !== targetValue) {
            this.inputTimeout = setTimeout(() => {
                this._update(this.tempValue);
            }
            , 1000);
        }else{
            this._update(newValue);
        }

      });
      delegator.on(this.container, 'wheel', '[data-id="input"]', (e) => {
        e.preventDefault();
        let newValue = this.getValue(this.value + (e.deltaY < 0 ? this.step : -this.step));
        this._update(newValue);
      });
    }
  
    showQuickSelect() {
      if (!this.tippyInstance){
        this.tippyInstance = tippy(this.refs.input, {
          content: `<div class='${this.classes.quickSelect}'>${this.quickValues.map(value => `<button class='${this.classes.quickSelectItem}' data-value='${value}'>${value}</button>`).join('')}</div>`,
          allowHTML: true,
          interactive: true,
          trigger: 'manual',
          theme: 'light',
          placement: 'bottom',
          offset: [0, 13],
          arrow: false,
          // maxWidth: "50vw",
          // onShown(instance) {
          //   const popper = instance.popper;
          //   const screenHeight = window.innerHeight;
          //   popper.style.maxHeight = `${screenHeight / 2}px`;
          //   popper.style.overflowY = "auto";
          // }
        });
      
        setTimeout(() => {
          const popper = this.tippyInstance.popper;
          delegator.on(popper, 'click', '[data-value]', (e, target) => {

              let newValue = this.getValue(parseInt(target.dataset.value));
              this._update(newValue);
              this.tippyInstance.hide();
          });
        }, 50);
      }
      if(!this.tippyInstance.state.isVisible) {
        this.tippyInstance.show();
      }
      

    }
  
    _update(newValue) {
      this.value = newValue;
      this.refs.input.value = this.value;
      if (this.onChange) this.onChange(this.value);
    }
    update(newValue) {
        this.value = this.getValue(newValue);
        this.refs.input.value = this.value;
    }
  }
  
export default ValueAdjuster;
  