// 简单 MD5 实现（浏览器版）
function md5(str) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(buf => {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  });
}

/**
 * 为 fabric.Canvas 添加撤销/重做功能
 * @param {fabric.Canvas} fabric - fabric 实例
 */
export function addUndoRedoToFabric(fabric) {
  const Canvas = fabric.Canvas;

  Canvas.prototype.initialize = (function (a) {
    return function (...b) {
      a.call(this, ...b);
      this._historyInit();
      return this;
    };
  })(Canvas.prototype.initialize);

  Canvas.prototype.dispose = (function (a) {
    return function (...b) {
      a.call(this, ...b);
      this._historyDispose();
      return this;
    };
  })(Canvas.prototype.dispose);

  // 异步封装版本：获取下一个 JSON 状态，并替换 base64 内容
  Canvas.prototype._historyNext = function () {
    const json = this.toDatalessJSON(this.extraProps);
    return this._replaceLargeFieldsAndHash(json).then(result => JSON.stringify(result));
  };

  // 替换长字段为 ID 并存储到缓存
  Canvas.prototype._replaceLargeFieldsAndHash = async function (obj) {
    const output = structuredClone(obj);
    const cache = this._resourceCache = this._resourceCache || {};
    const hashMap = this._hashMap = this._hashMap || {};
    const maxLength = 2000;

    async function recurse(o) {
      for (const key in o) {
        const val = o[key];
        if (typeof val === "string" && val.length > maxLength) {
          const hash = await md5(val);
          if (!hashMap[hash]) {
            cache[hash] = val;
            hashMap[hash] = hash;
          }
          o[key] = { __resourceId__: hash };
        } else if (typeof val === "object" && val !== null) {
          await recurse(val);
        }
      }
    }

    await recurse(output);
    return output;
  };

  // 还原 ID 为真实内容
  Canvas.prototype._restoreLargeFields = function (obj) {
    const cache = this._resourceCache || {};
    function recurse(o) {
      for (const key in o) {
        const val = o[key];
        if (val && typeof val === "object" && val.__resourceId__) {
          o[key] = cache[val.__resourceId__] || null;
        } else if (typeof val === "object" && val !== null) {
          recurse(val);
        }
      }
    }
    recurse(obj);
    return obj;
  };

  Canvas.prototype._historyEvents = function () {
    return {
      "object:added": this._historySaveAction,
      "object:removed": this._historySaveAction,
      "object:modified": this._historySaveAction,
      "object:skewing": this._historySaveAction,
    };
  };

  Canvas.prototype._historyInit = function () {
    this.historyUndo = [];
    this.historyRedo = [];
    this.extraProps = ["selectable"];
    this._resourceCache = {};
    this._hashMap = {};
    this.historyProcessing = false;
    this._historyNext().then(state => {
      this.historyNextState = state;
      this.on(this._historyEvents());
    });
  };

  Canvas.prototype._historyDispose = function () {
    this.off(this._historyEvents());
  };

  Canvas.prototype._historySaveAction = function () {
    if (!this.historyProcessing) {
      const current = this.historyNextState;
      this._historyNext().then(next => {
        this.historyUndo.push(current);
        if (this.historyUndo.length > 50) this.historyUndo.shift();
        this.historyNextState = next;
        this.fire("history:append", { json: current });
        this.fire("undo:redo", {
          undo: this.historyUndo.length,
          redo: this.historyRedo.length,
        });
      });
    }
  };

  Canvas.prototype.undo = function (callback) {
    this.historyProcessing = true;
    const state = this.historyUndo.pop();
    if (state) {
      this.historyRedo.push(this.historyNextState);
      this.historyNextState = state;
      this._loadHistory(state, "history:undo", callback);
    } else {
      this.historyProcessing = false;
    }
    this.fire("undo:redo", {
      undo: this.historyUndo.length,
      redo: this.historyRedo.length,
    });
  };

  Canvas.prototype.redo = function (callback) {
    this.historyProcessing = true;
    const state = this.historyRedo.pop();
    if (state) {
      this.historyUndo.push(this.historyNextState);
      this.historyNextState = state;
      this._loadHistory(state, "history:redo", callback);
    } else {
      this.historyProcessing = false;
    }
    this.fire("undo:redo", {
      undo: this.historyUndo.length,
      redo: this.historyRedo.length,
    });
  };

  Canvas.prototype._loadHistory = function (jsonStr, eventName, callback) {
    const data = JSON.parse(jsonStr);
    const restored = this._restoreLargeFields(data);
    this.loadFromJSON(restored, () => {
      this.requestRenderAll();
      this.fire(eventName);
      this.historyProcessing = false;
      callback && callback();
    });
  };

  Canvas.prototype.clearHistory = function () {
    this.historyUndo = [];
    this.historyRedo = [];
    this._resourceCache = {};
    this._hashMap = {};
    this.historyProcessing = false;
    this.fire("history:clear");
    this.fire("undo:redo", {
      undo: this.historyUndo.length,
      redo: this.historyRedo.length,
    });
  };

  Canvas.prototype.offHistory = function () {
    this.historyProcessing = true;
  };

  Canvas.prototype.onHistory = function () {
    this.historyProcessing = false;
    this._historySaveAction();
  };

  Canvas.prototype.hasRedo = function () {
    return this.historyRedo.length > 0;
  };

  Canvas.prototype.hasUndo = function () {
    return this.historyUndo.length > 0;
  };
}