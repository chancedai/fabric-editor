/**
 * 将所有 Fabric 事件代理为自定义事件并通过 emitter 发出
 * @param {fabric.Canvas} canvas - Fabric 画布实例
 * @param {EventEmitter} emitter - 用于广播事件的 emitter 实例
 */
export function bindFabricEvents(canvas, emitter) {
    const fabricEvents = [
      "mouse:down",
      "mouse:move",
      "mouse:up",
      "mouse:dblclick",
      "mouse:click",
      "object:added",
      "object:modified",
      "object:selected",
      "object:scaling",
      "object:rotating",
      "object:removed",
      "object:moving",
      "object:skewing",
      "object:translating",
      "selection:created",
      "selection:cleared",
      "selection:updated",
      "selection:disabled",
      "canvas:cleared",
      "canvas:zoom",
      "canvas:pan",
      "key:down",
      "key:up",
      "touch:start",
      "touch:move",
      "touch:end",
      "before:render",
      "after:render",
    ];
  
    fabricEvents.forEach((event) => {
      canvas.on(event, (options) => {
        emitter.emit("fabric:" + event, options);
      });
    });
  }
  