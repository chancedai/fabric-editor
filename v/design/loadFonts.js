// SharedFontLoader.js
// 单例字体加载器，缓存已加载字体，管理加载状态，支持批量操作和超时控制

/**
 * 1. 默认的字体数据映射，请在此处替换为项目中的 fontMap
 * const defaultFontMap = { ... };
 * 2. 字体文件的公共路径前缀
 */
import lib from './lib.js';
const defaultFontMap = lib.fontMap;
const defaultBaseUrl = 'https://xiaomingyan.com/static/v/design/fonts/ttf';

class SharedFontLoader {
  constructor() {
    if (SharedFontLoader.instance) return SharedFontLoader.instance;
    // 已成功加载的字体 id 集合
    this._loaded = new Set();
    // 正在加载的字体 id -> { promise }
    this._loading = new Map();
    // 加载失败的字体 id -> 错误信息
    this._failures = new Map();
    SharedFontLoader.instance = this;
  }

  /**
   * 批量加载字体
   * @param {Array<string>} ids      - 要加载的字体 id 列表
   * @param {Object} [options]
   * @param {number} [options.timeout=10000]   - 超时时间 ms
   * @param {Function} [options.onSuccess]     - 每个字体加载成功回调 (id)
   * @param {Function} [options.onError]       - 每个字体加载失败回调 (id, error)
   * @param {Function} [options.onComplete]    - 全部完成后回调 ({ loaded, failed })
   * @returns {Promise<{loaded: string[], failed: {id: string, error: any}[]}>}
   */
  load(ids, options = {}) {
    const { timeout = 20000, onSuccess, onError, onComplete } = options;
    
    const tasks = ids.map(id =>
      this._loadSingle(id, defaultFontMap[id], timeout, onSuccess, onError)
    );
    return Promise.allSettled(tasks).then(results => {
      const loaded = [];
      const failed = [];
      results.forEach((res, idx) => {
        const id = ids[idx];
        if (res.status === 'fulfilled') loaded.push(id);
        else failed.push({ id, error: res.reason });
      });
      onComplete && onComplete({ loaded, failed });
      return { loaded, failed };
    });
  }

  /**
   * 加载单个字体实现（私有方法）
   */
  _loadSingle(id, font, timeout, onSuccess, onError) {
    if (!font || !font.f) {
      const err = new Error(`fontMap 中缺少 id=${id} 的描述或样式信息`);
      onError && onError(id, err);
      return Promise.reject(err);
    }
    if (this._loaded.has(id)) {
      onSuccess && onSuccess(id);
      return Promise.resolve(id);
    }
    if (this._loading.has(id)) {
      return this._loading.get(id).promise;
    }
    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const err = new Error(`字体加载超时: ${id}`);
        this._cleanup(id);
        this._failures.set(id, err);
        onError && onError(id, err);
        reject(err);
      }, timeout);
      const loadPromises = font.f.map(({ s, w, t }) => {
        const url = `${font.urlBase|| defaultBaseUrl }/${id}-${s}-${w}.${t}`;
        const face = new FontFace(id, `url(${url})`, { style: s, weight: w });
        return face.load().then(loadedFace => {
          document.fonts.add(loadedFace);
        });
      });
      Promise.all(loadPromises)
        .then(() => {
          clearTimeout(timer);
          this._cleanup(id);
          this._loaded.add(id);
          onSuccess && onSuccess(id);
          resolve(id);
        })
        .catch(err => {
          clearTimeout(timer);
          this._cleanup(id);
          this._failures.set(id, err);
          onError && onError(id, err);
          reject(err);
        });
    });
    this._loading.set(id, { promise });
    return promise;
  }

  /**
   * 清理加载状态（私有方法）
   */
  _cleanup(id) {
    this._loading.delete(id);
  }

  /**
   * 判断字体是否已加载
   * @param {string} id
   * @returns {boolean}
   */
  isLoaded(id) {
    return this._loaded.has(id);
  }

  /**
   * 获取加载失败的错误信息
   * @param {string} id
   * @returns {Error|null}
   */
  getError(id) {
    return this._failures.get(id) || null;
  }
}

// ---------------- 导出简化接口 ----------------
const loader = new SharedFontLoader();
/**
 * 简化方法：只需传入 ids 和回调配置即可批量加载字体
 * @param {Array<string>} ids
 * @param {Object} options - 同 load 方法的配置
 */
export default function loadFonts(ids, options) {
  return loader.load(ids, options);
}
