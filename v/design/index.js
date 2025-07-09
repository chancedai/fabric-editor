
import { delegator, emitter, loadOperation, loadMenuOperation, loadComponent, jsImport} from '../__common__/utils';
import '../__common__/lazyload';
import './canvas';
import './component/sidebar';
import './canvas-control';
// 对象菜单
// import "./context-menu";
// 图层列表
// import "./component/layers";p
// import "./component/sidebar";
// 主菜单下拉列表
// import "./menu";
// 文件操作
// import "./component/file";
import './title';
// import './export-image';

// 加载 operation 的缓存，如果正在加载中，或者已经加载过了，就不再加载
// const jsCache = {};
// type 如 operation:background:init 
emitter.on('*', (type, e) => {
    if(type.startsWith('operation:')) {
        let operation = type.split(':')[1];
        if(operation === 'destroy') {
            return;
        }
        loadOperation(operation);
    }
    if(type.startsWith('menu-operation:')) {
        let menu = type.split(':')[1];
        loadMenuOperation(menu);
    }
    if(type.startsWith('component:')) {
        let component = type.split(':')[1];
        loadComponent(component);
    }
});




// data-id="component:layer"
delegator.on(document.body, 'click', '[data-id]', function(e, target) {
    let id = target.dataset.id;
    if(id.startsWith('component:')) {
        emitter.emit(id, {
            target
        });
        // let component = id.split(':')[1];
        // loadComponent(component, target);
    }
});

const preloadModules = [
    'operation:grid',
    'component:context-menu',
    'component:file',
    // '/v/design/operation/grid.js',
    // '/v/design/component/context-menu.js',
    // '/v/design/component/file.js',
];



// 使用 requestIdleCallback 预加载
function preloadJS() {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            preloadModules.forEach((module) => {
                const [type, name] = module.split(':');
                jsImport(type, name);
            });
        });
    } else {
        // 兼容不支持 requestIdleCallback 的浏览器
        setTimeout(() => {
            preloadModules.forEach((module) => {
                const [type, name] = module.split(':');
                jsImport(type, name);
            });
        }, 3000); // 3 秒后预加载
    }
}

// 当页面加载完成后，预加载常用模块
window.addEventListener('load', preloadJS);
