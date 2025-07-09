import { render, delegator } from '../__common__/utils';
import Fuse from 'fuse.js';
import loadFonts from './loadFonts';


export class FontPicker {
  constructor(options) {
    this.container = typeof options.container === 'string' 
      ? document.querySelector(options.container) 
      : options.container;
    if (!this.container) throw new Error('Invalid container');

    this.fonts = options.fonts || [];
    this.groups = options.groups || [];
    this.baseUrl = options.baseUrl || '';
    this.onchange = options.onchange || function () {};
    this.onload = options.onload || function () {};
    this.onerror = options.onerror || function () {};
    this.selectedId = options.selectedId || null;
    this.favorites = new Set();
    this.filterGroup = '全部';
    this.searchText = '';
    this.loadingIds = new Set();

    this.refs = {};
    this._init();
  }

  _init() {
    this.container.innerHTML = '';
    this._renderUI();
    this._bindEvents();
    this._renderFontList();
  }

  _renderUI() {
    this.refs = render(null, (data, e, f, _if) => `
      <div class="space-y-4 flex flex-col h-full overflow-hidden">
        <div class="px-4 relative w-full">
          <i class="vicon-search text-xl absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
          <input class="input w-full px-3 py-1.5 px-8" type="text" data-id="search" placeholder="搜索字体..." />
          <button data-id="clearSearch" class="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black hidden">
            <i class="vicon-close"></i>
          </button>
        </div>
        <div class="flex flex-wrap gap-2 px-4" data-id="tabs">
          ${this._getTabsHTML()}
        </div>
        <div class="flex-1 overflow-auto" data-id="fontList"></div>
      </div>
    `, this.container);
  }

  _getTabsHTML() {
    let tabs = ['全部', ...this._getUniqueGroups(), '收藏', '文档字体'];
    tabs = tabs.filter(tab => !tab.startsWith('preset'));
    return tabs.map(tab => `
      <button data-tab="${tab}" class="btn-sm ${this.filterGroup === tab ? 'btn-primary' : 'btn-secondary'}">
        ${tab}
      </button>
    `).join('');
  }

  _bindEvents() {
    const { search, clearSearch, tabs, fontList } = this.refs;

    // 绑定搜索框事件
    delegator.on(this.container, 'input', '[data-id="search"]', (e, target) => {
      this.searchText = target.value.trim();
      this._renderFontList();
      this._toggleClearButton();
    });

    // 绑定清除按钮事件
    delegator.on(this.container, 'click', '[data-id="clearSearch"]', () => {
      this.searchText = '';
      this.refs.search.value = '';
      this._renderFontList();
    });

    // 绑定 tabs 切换事件
    delegator.on(this.container, 'click', '[data-tab]', (e, target) => {
      const tab = target.getAttribute('data-tab');
      if (tab) {
        this.filterGroup = tab;
        this._updateTabs();
        this._renderFontList();
      }
    });

    // 绑定收藏按钮点击事件
    delegator.on(this.container, 'click', '[data-fav-id]', (e, target) => {
      // 通过 stopPropagation 防止触发选择字体操作
      e.stopPropagation();
      
      // 点击收藏按钮，更新收藏状态
      const id = target.getAttribute('data-fav-id');
      this._toggleFavorite(id);
      
      // 只渲染收藏按钮部分，而不是整个字体列表
      this._renderFontFavorite(id);
    });

    // 绑定字体项和收藏按钮点击事件
    delegator.on(this.container, 'click', '[data-font-item]', (e, target) => {
      // 如果点击的是字体项，触发选择字体操作
      const id = target.getAttribute('data-font-item');
      this._selectFont(id);
    });

    
  }

  _toggleClearButton() {
    const { clearSearch, search } = this.refs;
    clearSearch.classList.toggle('hidden', search.value.trim() === '');
  }

  _renderFontList() {
    const list = this._filterFonts();

    this.refs.fontList.innerHTML = list.map(font => `
      <div class="font-item ${this.selectedId === font.id ? 'bg-slate-200 hover:bg-slate-200' : 'hover:bg-slate-100'}" data-font-item="${font.id}">
        <img src="https://xiaomingyan.com/static/common/d.gif" data-src="${this.baseUrl}/svg/${font.id}.svg" alt="${font.en}" class="h-4 w-auto" data-font-id="${font.id}" />
        <div class="flex items-center space-x-2 ml-2">
          <button class="btn-icon" data-fav-id="${font.id}">
            ${this.favorites.has(font.id) ? '<i class="vicon-star text-lg text-purple-600"></i>' : '<i class="vicon-star text-lg"></i>'}
          </button>
        </div>
        <div class="loader absolute top-4 right-2 animate-spin w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full" style="display: none;"></div>
      </div>
    `).join('');
  }

  _renderFontFavorite(id) {
    const fontItem = this.refs.fontList.querySelector(`[data-font-item="${id}"]`);
    if (fontItem) {
      const favBtn = fontItem.querySelector('[data-fav-id]');
      if (favBtn) {
        favBtn.innerHTML = this.favorites.has(id) 
          ? '<i class="vicon-star text-lg text-purple-600"></i>' 
          : '<i class="vicon-star text-lg"></i>';
      }
    }
  }

  _filterFonts() {
    let list = [...this.fonts];

    if (this.filterGroup === '收藏') {
      list = list.filter(f => this.favorites.has(f.id));
    } else if (this.filterGroup === '文档字体') {
      const docGroup = this.groups.find(g => g.title === '文档字体');
      if (docGroup) list = list.filter(f => docGroup.list.includes(f.id));
    } else if (this.filterGroup !== '全部') {
      list = list.filter(f => f.g === this.filterGroup);
    }

    if (this.searchText) {
      const fuse = new Fuse(list, { keys: ['en', 'cn'], threshold: 0.4 });
      list = fuse.search(this.searchText).map(r => r.item);
    }

    return list;
  }

  _getUniqueGroups() {
    const groups = new Set();
    this.fonts.forEach(font => {
      if (font.g) groups.add(font.g);
    });
    return Array.from(groups);
  }

  _updateTabs() {
    this.refs.tabs.innerHTML = this._getTabsHTML();
  }

  _getFont(id) {
    const font = this.fonts.find(f => f.id === id);
    return font ? font : null;
  }

  _selectFont(id, callback = true) {
    if (this.selectedId === id) return;  // 如果当前已经选中该字体，直接返回
  
    // 更新选中的字体 ID
    const previousSelectedId = this.selectedId;
    this.selectedId = id;
  
    // 如果有之前选中的字体项，更新它的渲染状态（比如移除选中样式）
    if (previousSelectedId) {
      this._updateFontItemSelected(previousSelectedId, false);
    }
  
    // 标记加载中状态，并渲染当前选中的字体项
    this.loadingIds.add(id);
    this._updateFontItemSelected(id, true);  // 仅更新当前选中的字体项，标记为选中
    this._updateFontItemLoading(id, true);  // 标记当前字体项为加载中

    const font = this._getFont(id);
  
    // 加载字体
    this._loadFont(id, font);
  
    // 调用回调函数
    if (callback) this.onchange(font);
  }
  // 更新字体，但不触发回调
  update(id){
    this._selectFont(id, false);
  }
  
  // 用于更新字体项的选中状态
  _updateFontItemSelected(id, isSelected = false) {
    const fontItem = this.refs.fontList.querySelector(`[data-font-item="${id}"]`);
    if (!fontItem) return;

    const itemClassList = fontItem.classList;
    if (isSelected) {
      itemClassList.add('bg-slate-200');
      itemClassList.remove('hover:bg-slate-100');
    } else {
      itemClassList.remove('bg-slate-200');
      itemClassList.add('hover:bg-slate-100');
    }
  }

  // 用于更新字体项的加载中状态
  _updateFontItemLoading(id, isLoading = false) {
    const fontItem = this.refs.fontList.querySelector(`[data-font-item="${id}"]`);
    if (!fontItem) return;

    const loader = fontItem.querySelector('.loader');
    if (loader) {
      loader.style.display = isLoading ? 'block' : 'none';  // 显示或隐藏加载动画
    }
  }

  _loadFont(id, font) {
    if (!font) return;

    // onComplete && onComplete({ loaded, failed });
    loadFonts([id], {
      onComplete: (result) => {
        const { loaded, failed } = result;
        this.loadingIds.delete(id);
        this._updateFontItemLoading(id, false);  // 隐藏加载中动画
        if (loaded.length > 0) {
          this.onload(font);  // 调用 onload 回调
        }
        if (failed.length > 0) {
          console.error(`Font loading failed for ${id}:`, failed);
          this.onerror(font, failed[0]);  // 调用 onerror 回调
        }
      }
    });
  }

  _toggleFavorite(id) {
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
    } else {
      this.favorites.add(id);
    }
  }
}
