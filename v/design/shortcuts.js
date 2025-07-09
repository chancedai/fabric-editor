import { delegator, showInfo, emitter, throttle, debounce } from "../__common__/utils";
import Mousetrap from "mousetrap";
import { canvas, debouncedCommitChange } from "./canvas.js";


 // 绑定快捷键
function bindKeyboardShortcuts() {

    function w(object) {
      object.setCoords();
      // 更新菜单
    }
    Mousetrap.bind("esc", () => {
        canvas.discardActiveObject().requestRenderAll();
    })
      .bind("f", () => {
        const object = canvas.getActiveObject();
        object && (canvas.bringForward(object), debouncedCommitChange());
      })
      .bind("shift+f", () => {
        const object = canvas.getActiveObject();
        object && (canvas.bringToFront(object), debouncedCommitChange());
      })
      .bind("b", () => {
        const object = canvas.getActiveObject();
        object && (canvas.sendBackwards(object), debouncedCommitChange());
      })
      .bind("shift+b", () => {
        const object = canvas.getActiveObject();
        object && (canvas.sendToBack(object), debouncedCommitChange());
      })
      .bind("mod+a", (a) => {
        canvas.discardActiveObject()
          .setActiveObject(
            new fabric.ActiveSelection(canvas.getObjects(), { canvas: canvas })
          )
          .requestRenderAll();
        return false;
      })
      .bind("mod+c", () => {
        canvas.cloneObject();
      })
      .bind(["del", "backspace"], (e) => {
        const object = canvas.getActiveObject();
        object && canvas.removeObject(object);
        e.preventDefault();
      })
      .bind("left", () => {
        const object = canvas.modifyObject("left", -1);
        object && w(object);
        return false;
      })
      .bind("right", () => {
        const object = canvas.modifyObject("left", 1);
        object && w(object);
        return false;
      })
      .bind("up", () => {
        const object = canvas.modifyObject("top", -1);
        object && w(object);
        return false;
      })
      .bind("down", () => {
        const object = canvas.modifyObject("top", 1);
        object && w(object);
        return false;
      })
      .bind("mod+right", () => {
        const object = canvas.modifyObject("angleBy", 1);
        object && w(object);
        return false;
      })
      .bind("mod+left", () => {
        const object = canvas.modifyObject("angleBy", -1);
        object && w(object);
        return false;
      })
      .bind("mod+g", () => {
        V();
        return false;
      })
      .bind("mod+shift+g", () => {
        W();
        return false;
      })
      .bind("mod+y", () => {
        canvas.redo();
        return false;
      })
      .bind("mod+z", () => {
        canvas.undo();
        return false;
      })
      .bind("mod+s", () => {
        X(!1);
        return false;
      })
      .bind("mod+p", () => {
        R();
        return false;
      })
      .bind("h", () => {
        const object = canvas.getActiveObject();
        object && (object.centerH().setCoords(), debouncedCommitChange(), w(object));
      })
      .bind("v", () => {
        const object = canvas.getActiveObject();
        object && (object.centerV().setCoords(), debouncedCommitChange(), w(object));
      })
      .bind("s", () => {
        const object = canvas.getActiveObject();
        object && object.exportPNG();
      })
      .bind("-", () => {
        canvas.modifyObject("zoomBy-z", -4);
        return false;
      })
      .bind("+", () => {
        canvas.modifyObject("zoomBy-z", 4);
        return false;
      })
      .bind("alt+right", () => {
        canvas.modifyObject("zoomBy-x", -5);
        return false;
      })
      .bind("alt+left", () => {
        canvas.modifyObject("zoomBy-x", 5);
        return false;
      })
      .bind("alt+down", () => {
        canvas.modifyObject("zoomBy-y", -5);
        return false;
      })
      .bind("alt+up", () => {
        canvas.modifyObject("zoomBy-y", 5);
        return false;
      });
  }
function bindKeyboardShortcuts() {
    Mousetrap.bind("esc", () => {
      resetCanvas();
    })
      .bind("f", () => {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          canvas.bringForward(activeObject);
          debouncedCommitChange();
        }
      })
      .bind("shift+f", () => {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          canvas.bringToFront(activeObject);
          debouncedCommitChange();
        }
      })
      .bind("b", () => {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          canvas.sendBackwards(activeObject);
          debouncedCommitChange();
        }
      })
      .bind("shift+b", () => {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          canvas.sendToBack(activeObject);
          debouncedCommitChange();
        }
      })
      .bind("mod+a", (event) => {
        canvas.discardActiveObject()
          .setActiveObject(
            new fabric.ActiveSelection(canvas.getObjects(), { canvas: canvas })
          )
          .requestRenderAll();
        return false;
      })
      .bind("mod+c", () => {
        canvas.cloneObject();
      })
      .bind(["del", "backspace"], (event) => {
        const activeObject = canvas.getActiveObject();
        if (activeObject) canvas.removeObject(activeObject);
        event.preventDefault();
      })
      .bind("left", () => moveObject("left", -1))
      .bind("right", () => moveObject("left", 1))
      .bind("up", () => moveObject("top", -1))
      .bind("down", () => moveObject("top", 1))
      .bind("mod+right", () => rotateObject(1))
      .bind("mod+left", () => rotateObject(-1))
      .bind("mod+g", () => groupObjects())
      .bind("mod+shift+g", () => ungroupObjects())
      .bind("mod+y", () => canvas.redo())
      .bind("mod+z", () => canvas.undo())
      .bind("mod+s", () => saveProject())
      .bind("mod+p", () => printProject())
      .bind("h", () => centerHorizontally())
      .bind("v", () => centerVertically())
      .bind("s", () => exportPNG())
      .bind("-", () => zoomCanvas("out"))
      .bind("+", () => zoomCanvas("in"))
      .bind("alt+right", () => zoomCanvas("x", -5))
      .bind("alt+left", () => zoomCanvas("x", 5))
      .bind("alt+down", () => zoomCanvas("y", -5))
      .bind("alt+up", () => zoomCanvas("y", 5));
  }
  
  function generateShortcutGuide() {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? '⌘' : 'Ctrl';
    const shortcuts = [
      { keys: 'Esc', action: '重置画布' },
      { keys: 'F', action: '前移一层' },
      { keys: 'Shift+F', action: '移至最前' },
      { keys: 'B', action: '后移一层' },
      { keys: 'Shift+B', action: '移至最后' },
      { keys: `${modKey}+A`, action: '全选对象' },
      { keys: `${modKey}+C`, action: '克隆选中对象' },
      { keys: 'Del / Backspace', action: '删除选中对象' },
      { keys: '方向键', action: '移动选中对象' },
      { keys: `${modKey}+方向键`, action: '旋转对象' },
      { keys: `${modKey}+G`, action: '组合对象' },
      { keys: `${modKey}+Shift+G`, action: '取消组合' },
      { keys: `${modKey}+Z`, action: '撤销' },
      { keys: `${modKey}+Y`, action: '重做' },
      { keys: `${modKey}+S`, action: '保存项目' },
      { keys: `${modKey}+P`, action: '打印项目' },
      { keys: 'H', action: '水平居中' },
      { keys: 'V', action: '垂直居中' },
      { keys: 'S', action: '导出 PNG' },
      { keys: '- / +', action: '缩小/放大' },
      { keys: 'Alt+方向键', action: '调整 X/Y 轴缩放' }
    ];
  
    let guideHtml = '<h3>快捷键说明</h3><ul>';
    shortcuts.forEach(shortcut => {
      guideHtml += `<li><strong>${shortcut.keys}</strong>: ${shortcut.action}</li>`;
    });
    guideHtml += '</ul>';
  
    document.getElementById('shortcut-guide').innerHTML = guideHtml;
  }