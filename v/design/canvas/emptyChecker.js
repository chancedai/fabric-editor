export function checkIfCanvasIsEmpty(canvas, canvasContainer) {
    let messageElement = null;
  
    const check = function() {
      const objects = canvas.getObjects();
      if (!messageElement) {
        messageElement = document.createElement('div');
        // 使用tailwindcss的类名
        messageElement.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-slate-400 flex items-center hidden';
        messageElement.innerHTML = '<i class="vicon-calm text-2xl mr-1"></i>画布为空，请添加模板或对象';
        canvasContainer.appendChild(messageElement);
      }
      if (objects.length === 0) {
        messageElement.classList.remove('hidden');
      } else {
        messageElement.classList.add('hidden');
      }
    };
  
    // 监听画布上的事件，确保每次修改时检查画布状态
    canvas.on('object:added', check);
    canvas.on('object:removed', check);
  }
  
  // 取消选中对象
function discardActiveObject() {
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }