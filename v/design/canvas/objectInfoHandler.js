export function setupObjectInfoDisplay(canvas, emitter) {
    const infoDisplay = document.querySelector("[data-id='objectInfo']");
    if(!infoDisplay){
      return;
    }
    
    // 点击显示编辑面板
    infoDisplay.addEventListener("click", () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        emitter.emit("operation:position:edit", activeObject);
      }
    });
  
    /**
     * 更新对象信息显示区域的内容
     * @param {Object} targetObject - 包含对象信息的实例，必须具有 left、top、angle、getScaledWidth、getScaledHeight 等属性，
     *                                若包含 fontFamily 属性，则同时包含 fontSize 属性
     */
    function updateObjectInfo(targetObject) {
        targetObject = canvas.getActiveObject();
        if (!targetObject) {
          infoDisplay.innerHTML = "";
          infoDisplay.classList.add("text-slate-400");
          return;
        }
    
        infoDisplay.classList.remove("text-slate-400");
    
        // 153×321 @0° #189,362
        infoDisplay.innerHTML = `
          <div class="m-1 px-2 py-1 bg-slate-100 text-slate-800 rounded-lg text-sm font-mono flex items-center space-x-2">
            <span>${Math.round(targetObject.getScaledWidth())}×${Math.round(targetObject.getScaledHeight())}</span>
            <span class="text-slate-400">@</span>
            <span>${Math.round(targetObject.angle)}°</span>
            <span class="text-slate-400">#</span>
            <span>${Math.round(targetObject.left)},${Math.round(targetObject.top)}</span>
          </div>
        `;
      }
  
    // 更新对象坐标、尺寸、旋转角度等基本信息
    canvas.on({
      "selection:created": () => {
        if (!canvas.isDrawingShapes) {
          updateObjectInfo();
        }
      },
      "selection:updated": () => {
        updateObjectInfo();
      },
      "object:moving": ({ target: activeObject }) => {
        updateObjectInfo(activeObject);
      },
      "object:scaling": ({ target: activeObject }) => {
        updateObjectInfo(activeObject);
      },
      "object:rotating": ({ target: activeObject }) => {
        updateObjectInfo(activeObject);
      },
      "object:modified": () => {
        updateObjectInfo();
      },
      "selection:cleared": () => {
        updateObjectInfo();
      },
    });
  
    emitter.on("canvas:position:edited", (targetObject) => {
      updateObjectInfo(targetObject);
    });
  }
  