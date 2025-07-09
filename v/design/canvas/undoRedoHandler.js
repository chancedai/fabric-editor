export function setupUndoRedo(canvas, delegator) {
    const undoButton = document.querySelector("[data-id='undo']");
    const redoButton = document.querySelector("[data-id='redo']");
    if(!undoButton || !redoButton){
      return;
    }
    // 监听撤销和重做事件
    canvas.on("undo:redo", (d) => {
      undoButton.disabled = !d.undo;
      redoButton.disabled = !d.redo;
    });
  
    // 监听点击事件，触发撤销和重做操作
    delegator.on(document.body, "click", "[data-id]", function (event, target) {
      const { id } = target.dataset;
  
      switch (id) {
        case "undo":
          discardActiveObject();
          canvas.undo();
          break;
        case "redo":
          discardActiveObject();
          canvas.redo();
          break;
      }
    });
  }
  
  // 假设你有一个用于清理选中的对象的函数
  function discardActiveObject() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.discardActiveObject();
    }
  }
  