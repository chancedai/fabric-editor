import { getRefs, delegator } from "./utils";

import { EditorState } from "@codemirror/state";
import { EditorView, keymap, highlightActiveLine, lineNumbers, highlightActiveLineGutter } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";
import { lintGutter } from "@codemirror/lint";
import { history, undo,redo,defaultKeymap } from "@codemirror/commands";

// 获取 body 里面所有 node-type 属性的元素
const refs = getRefs('#editor', 'node-type');

// 创建并导出一个新的事件，其中 doc 数据包含在 detail 中
const createSaveEvent = (doc) => {
  const saveEvent = new CustomEvent('editor-save', { detail: { doc } });
  document.dispatchEvent(saveEvent);
};

// 监听 Ctrl+S 或 Cmd+S 事件
const handleSave = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault(); // 阻止浏览器默认的保存行为
    const doc = editor.state.doc.toString();
    createSaveEvent(doc);
  }
};

// 绑定键盘事件
document.addEventListener('keydown', handleSave);

// 节流防抖保存函数
let saveTimeout;
function debounceSave(doc){
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      createSaveEvent(doc);
    }, 500); // 延迟 500ms 执行保存
};

// 初始化 CodeMirror
const editor = new EditorView({
  state: EditorState.create({
    doc: "",
    extensions: [
      lineNumbers(), // ✅ 启用行号
      highlightActiveLineGutter(),
      javascript(),
      html(),
      css(),
      oneDark,
      lintGutter(),
      history(),
      keymap.of([...defaultKeymap]), // ✅ 解决 Enter 换行问题
      highlightActiveLine(), // ✅ 高亮当前行
      // highlightSelectionMatches(),
      EditorView.lineWrapping, // ✅ 允许长行换行
      EditorState.allowMultipleSelections.of(true),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          debounceSave(update.state.doc.toString());
        }
      }),
    ],
  }),
  parent: refs.innerEditor,
});

function resizeEditor() {
  const {width, height} =  refs.innerEditor.getBoundingClientRect();
  editor.dom.style.width = `${width}px`;
  editor.dom.style.height = `${height}px`;
}
// 创建 ResizeObserver 实例
const resizeObserver = new ResizeObserver(resizeEditor);
// 监听父容器大小变化
resizeObserver.observe(refs.innerEditor);
resizeEditor();

/**
 * 设置编辑器内容的方法
 * @param {string} newContent 要设置的新代码内容
 */
export function setEditorContent(newContent) {
  editor.dispatch({
    changes: { from: 0, to: editor.state.doc.length, insert: newContent },
  });
}

export function undoEditor(){
  undo(editor);
}

export function redoEditor(){
  redo(editor);
}

// // 页面加载时恢复 localStorage 内容
// const savedContent = localStorage.getItem('editorContent');
// if (savedContent) {
//   setEditorContent(savedContent);
// }

// 关闭页面提醒
// window.addEventListener('beforeunload', (event) => {
//   // 只在有未保存内容时提醒
//   if (editor.state.doc.length > 0) {
//     event.preventDefault();
//     event.returnValue = '您有未保存的更改，确定要离开吗？';
//   }
// });

// document.addEventListener('keydown', (event) => {
//   if (event.key === 'Enter' && event.target === editor.contentDOM) {
//     event.preventDefault(); // 阻止默认行为
//     const { state } = editor;
//     const { selection } = state;
//     const { from, to } = selection.main;

//     // 插入换行符
//     editor.dispatch({
//       changes: { from, to, insert: "\n" },
//       selection: { anchor: from + 1 }, // 将光标移动到新行的开头
//     });
//   }
// });