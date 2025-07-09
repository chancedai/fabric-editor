import { render, debounce, delegator, emitter, showError } from "../../__common__/utils";
import request from "../../../src/utils/request";

function showUnsplashPicker(options = {}) {
  const {
    keyword = '',
    orientation = '',
    color = '',
    onSelect,
    onClose,
    container = document.body
  } = options;

  const existingPicker = container.querySelector('.unsplash-picker-wrapper');
  if (existingPicker) {
    return {
      destroy() {
        existingPicker.remove();
        onClose?.();
      }
    };
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'unsplash-picker-wrapper h-full';
  container.appendChild(wrapper);

  let state = {
    page: 1,
    query: keyword,
    orientation,
    color,
    loading: false
  };

  let refs;

  const getTemplate = (data, _escape) => {
    return `
    <div class="relative h-full overflow-hidden">
      <div class="px-4 pb-4 bg-white w-full bg-white flex flex-col gap-2 z-1">
        <div class="flex items-center gap-4">
          <div class="relative w-full flex-1">
            <input type="text" data-id="query" placeholder="搜索图片..." class="input w-full px-3 py-1.5 pr-8" value="${_escape(data.query)}"/>
            <button data-id="clear" class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black ${!data.query ? 'hidden' : ''}">
              <i class="vicon-close"></i>
            </button>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <select data-id="orientation" class="flex-1 border border-slate-200 px-2 py-1.5 text-sm rounded">
            <option value="">方向</option>
            <option value="landscape"${data.orientation === 'landscape' ? ' selected' : ''}>横向</option>
            <option value="portrait"${data.orientation === 'portrait' ? ' selected' : ''}>纵向</option>
            <option value="squarish"${data.orientation === 'squarish' ? ' selected' : ''}>正方形</option>
          </select>
          <select data-id="color" class="flex-1 border border-slate-200 px-2 py-1.5 text-sm rounded">
            <option value="">颜色</option>
            <option value="black_and_white"${data.color === 'black_and_white' ? ' selected' : ''}>黑白</option>
            <option value="black"${data.color === 'black' ? ' selected' : ''}>黑色</option>
            <option value="white"${data.color === 'white' ? ' selected' : ''}>白色</option>
            <option value="yellow"${data.color === 'yellow' ? ' selected' : ''}>黄色</option>
            <option value="orange"${data.color === 'orange' ? ' selected' : ''}>橙色</option>
            <option value="red"${data.color === 'red' ? ' selected' : ''}>红色</option>
            <option value="purple"${data.color === 'purple' ? ' selected' : ''}>紫色</option>
            <option value="green"${data.color === 'green' ? ' selected' : ''}>绿色</option>
            <option value="teal"${data.color === 'teal' ? ' selected' : ''}>青色</option>
            <option value="blue"${data.color === 'blue' ? ' selected' : ''}>蓝色</option>
          </select>
        </div>
      </div>
      <div data-id="gridWrap" class="flex-1 h-full overflow-x-hidden overflow-y-auto">
        <div data-id="grid" class="w-92 pl-4 pb-4 text-sm columns-2 gap-4">
      </div>
      <div data-id="loading" class="absolue left-0 bottom-4 w-full text-center py-2 hidden text-slate-400 text-sm">加载中...</div>
    </div>
  `;
  };

  // const debounceReload = debounce(() => reload(), 400);

  function renderContainer() {
    wrapper.innerHTML = '';
    refs = render(state, getTemplate, wrapper);
  }

  function reload() {
    state.page = 1;
    state.query = refs.query.value.trim();
    state.orientation = refs.orientation.value;
    state.color = refs.color.value;
    refs.grid.innerHTML = '';
    renderContainer();
    loadImages();
  }

  function loadImages() {
    if (state.loading) return;
    state.loading = true;
    refs.loading.classList.remove('hidden');

    const params = {
      page: state.page,
      per_page: 12,
      query: state.query || '自然'
    };
    
    if (state.orientation) params.orientation = state.orientation;
    if (state.color) params.color = state.color;

    // 构建查询字符串
    request.get(`/api/unsplash/search/photos`,params)
      .then(data => {
        const html = data.results.map((photo, i) => `
          <div class="break-inside-avoid mb-2 cursor-pointer group" data-id="img-${state.page}-${i}" data-url="${photo.urls.regular}">
            <img data-src="${photo.urls.thumb}" src="https://xiaomingyan.com/static/common/d.gif" alt="${photo.alt_description || ''}" class="w-full rounded shadow transition-transform hover:scale-105" />
            <div class="text-slate-400 text-xs mt-1 truncate">by ${photo.user.name}</div>
          </div>
        `).join('');
        
        refs.grid.insertAdjacentHTML('beforeend', html);
        state.page++;
        state.loading = false;
        refs.loading.classList.add('hidden');
      })
      .catch(err => {
        console.error('Unsplash 错误:', err);
        state.loading = false;
        refs.loading.classList.add('hidden');
        showError('加载图片失败，请稍后重试');
      });
  }

  function bindEvents() {
    // 移除 input 事件的 debounceReload
    // delegator.on(wrapper, 'input', '[data-id="query"]', debounceReload);
    
    // 添加失去焦点和回车事件
    delegator.on(wrapper, 'blur', '[data-id="query"]', reload);
    delegator.on(wrapper, 'keydown', '[data-id="query"]', (e) => {
      if (e.key === 'Enter') {
        reload();
      }
    });
    
    delegator.on(wrapper, 'change', '[data-id="orientation"]', reload);
    delegator.on(wrapper, 'change', '[data-id="color"]', reload);
    delegator.on(wrapper, 'click', '[data-id="clear"]', () => {
      refs.query.value = '';
      reload();
    });

    refs.gridWrap.addEventListener('scroll', () => {
      if (refs.gridWrap.scrollTop + refs.gridWrap.clientHeight >= refs.gridWrap.scrollHeight - 100 && !state.loading) {
        loadImages();
      }
    });

    delegator.on(wrapper, 'click', '[data-id^="img-"]', (e, target) => {
      const url = target.getAttribute('data-url');
      onSelect?.(url);
    });
  }

  renderContainer();
  bindEvents();
  loadImages(); // 默认发起一次加载

  return {
    destroy() {
      wrapper.remove();
      onClose?.();
    }
  };
}

emitter.on("operation:imagePicker:show", (options) => {
  showUnsplashPicker(options);
});
