import lib from "./lib.js";
import { delegator, showInfo, emitter } from "../__common__/utils.js";
import tippy, {delegate} from "tippy.js";
// import "tippy.js/dist/tippy.css";
import 'tippy.js/themes/light.css';

// 使用 tippy 做一系列下拉菜单
// 先把各菜单的 html存在一个对象里，按钮点击时根据按钮的id来显示对应的菜单

const menuHtml = {
    toggleFileMenu: [
        {text: '另存为图片', icon: 'vicon-sd', type: 'saveImageAs', size: 'sd'},
        {text: '另存为图片', icon: 'vicon-hd', type: 'saveImageAs', size: 'hd'},
        {text: '保存/在线分享', icon: 'vicon-share', type: 'shareImage'},
        {text: '打印', icon: 'fas fa-print', type: 'printCanvas'},
        {text: '打开 (.json)', icon: '', type: 'openDesign'},
        {text: '保存 (.json)', icon: '', type: 'saveDesign'},
        {text: '选择背景', icon: '', type: 'setCanvasBackground'},
        {text: '图片大小', icon: '', type: 'setCanvasSize'},
        {text: '新建海报', icon: '', type: 'clearCanvas'},
        {text: '订购打印', icon: 'fas fa-shopping-cart', type: 'orderImage'},
        {text: '编辑结果', icon: '', type: 'editImage'},
    ].map(({text, icon, type, size}) => {
        return `<div class="px-4 py-2 cursor-pointer hover:bg-slate-100" data-id="${type}${size ? ',' + size : ''}">${text} <i class="${icon}"></i></div>`;
    }).join(''),
    toggleGrid: [
        {text: '对齐辅助线', type: 'toggleAlignGuides'},
        {text: '关闭', size:
        0, type: 'applyGrid'},
        {text: '25x25', size: 25, type: 'applyGrid'},
        {text: '50x50', size: 50, type: 'applyGrid'},
        {text: '75x75', size: 75, type: 'applyGrid'},
        {text: '100x100', size: 100, type: 'applyGrid'},
    ].map(({text, size, type}) => {
        return `<div class="px-4 py-2 cursor-pointer hover:bg-slate-100" data-size="${size}" data-id="${type}${size ? ',' + size : ''}">${text}</div>`;
    }).join(''),
    toggleBrush: [
        {text: '铅笔', brush: 'pencil', type: 'brush'},
        {text: '蜡笔', brush: 'crayon', type: 'brush'},
        {text: '墨水', brush: 'ink', type: 'brush'},
        {text: '马克笔', brush: 'marker', type: 'brush'},
        {text: '喷漆', brush: 'spraypaint', type: 'brush'},
        {text: '毛发', brush: 'fur', type: 'brush'},
        {text: '长毛', brush: 'longfur', type: 'brush'},
        {text: '阴影', brush: 'shaded', type: 'brush'},
        {text: '草稿风格', brush: 'sketchy', type: 'brush'},
        {text: '网状', brush: 'web', type: 'brush'},
        {text: '丝带', brush: 'ribbon', type: 'brush'},
        {text: '图案', brush: 'pattern', type: 'brush'},
        {text: '方块', brush: 'squares', type: 'brush'},
        {text: '圆形', brush: 'circle', type: 'brush'},
    ].map(({text, brush, type}) => {
        return `<div class="px-4 py-2 cursor-pointer hover:bg-slate-100" data-brush="${brush}" data-id="${type},${brush}">${text}</div>`;
    }).join(''),
    toggleShape: [
        {text: '直线', type: 'drawShape,line'},
        {text: '箭头', type: 'drawShape,linearrow'},
        {text: '矩形', type: 'drawShape,rect'},
        {text: '圆/椭圆', type: 'drawShape,ellipse'},
        {text: '三角形', type: 'drawShape,triangle'},
        {text: '星形', type: 'drawShape,star'},
        {text: '心形', type: 'drawShape,heart'},
        {text: '多边形', type: 'drawPolygon'},
    ].map(({text, type}) => {
        return `<div class="px-4 py-2 cursor-pointer hover:bg-slate-100" data-id="${type}">${text}</div>`;
    }).join(''),
    toggleText: [
        {text: '文本', type: 'editText'},
        {text: '弯曲文本', type: 'editTextCurved'},
        {text: '扭曲文本', type: 'editTextWarped'},
    ].map(({text, type}) => {
        return `<div class="px-4 py-2 cursor-pointer hover:bg-slate-100" data-id="${type}">${text}</div>`;
    }).join(''),
    toggleImage: [
        {text: '装饰图形 (svg)', type: 'image,ornament'},
        {text: '象形图', type: 'image,icon'},
        {text: '图片 & 表情符号', type: 'image,image'},
        {text: '叠加图层', type: 'image,overlay'},
        {text: '边框', type: 'image,border'},
        {text: '标尺', type: 'image,ruler'},
        {text: '符号', type: 'image,symbol'},
    ].map(({text, type}) => {
        return `<div class="px-4 py-2 cursor-pointer hover:bg-slate-100" data-id="${type}">${text}</div>`;
    }).join(''),
    toggleAlign: [
        {text: '左对齐', type: 'alignLeft'},
        {text: '居中对齐', type: 'alignCenter'},
        {text: '右对齐', type: 'alignRight'},
        {text: '两端对齐', type: 'alignJustify'},
    ].map(({text, type}) => {
        return `<div class="px-4 py-2 cursor-pointer hover:bg-slate-100" data-id="${type}">${text}</div>`;
    }).join(''),
    
};

// 使用 tippy 点击按钮时显示对应的菜单
const menuButtons = document.querySelectorAll('header [data-id^=toggle]');

menuButtons.forEach(button => {
    const type = button.dataset.id;
    let menu = menuHtml[type];
    if(!menu) {
        return;
    }
    // 使用一个div包裹，不固定宽度，让内容自己撑开宽度
    menu = `<div class="min-w-max py-1">${menu}</div>`;
    //
    
    const instance = tippy(button, {
        content: menu,
        allowHTML: true,
        interactive: true,
        placement: 'bottom-end',
        trigger: 'click',
        theme: 'light',
        arrow: false,
        offset: [0, 5],
        // hideOnClick: 'toggle',
    });
    button.addEventListener('click', () => {
        instance.show();
    });
});




