
import tippy, { delegate } from "tippy.js";
import "tippy.js/dist/tippy.css";

// 自适应最大高度插件
const AdaptiveMaxHeightPlugin = {
  fn() {
    return {
      onMount(instance) {
        const box = instance.popper.querySelector('.tippy-box');
        const rect = instance.reference.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const padding = 20;

        let maxHeight;
        const placement = instance.placement || 'bottom'; // fallback

        if (placement.startsWith('top')) {
          maxHeight = rect.top - padding;
        } else if (placement.startsWith('bottom')) {
          maxHeight = viewportHeight - rect.bottom - padding;
        } else {
          maxHeight = Math.max(rect.top, viewportHeight - rect.bottom) - padding;
        }

        maxHeight = Math.max(maxHeight, 100);
        box.style.maxHeight = `${maxHeight}px`;
        box.style.overflowY = 'auto';
      }
    };
  }
};


tippy.setDefaultProps({ 
  maxWidth: '50vw',
  // plugins: [AdaptiveMaxHeightPlugin],
})

delegate("body", {
  target: "[title]",
  allowHTML: true,
  content(reference) {
    const title = reference.getAttribute("title");
    reference.removeAttribute("title");
    return '<div class="p-2">' + title + "</div>";
  },
  
  theme: "light", // 主题，可选：'light'、'dark' 或自定义
  animation: "fade", // 可选动画：'scale' / 'fade' / 'shift-away'
  arrow: true, // 显示箭头
  offset: [0, 20], // 偏移量
  placement: "bottom", // 位置
  delay: 0, // 立即显示（默认有 300ms 延迟）
  appendTo: document.body,
});