import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import {ViteEjsPlugin} from "vite-plugin-ejs";
// import inject from '@rollup/plugin-inject';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    optimizeDeps: {
      include: ['@codemirror/lang-html', '@codemirror/lang-css', '@codemirror/lang-javascript', '@codemirror/theme-one-dark', '@codemirror/lint', '@codemirror/commands'],
    },
    plugins: [
      tailwindcss(),
      // Vite 可能启用了 isolatedModules，默认的 ESM 模块系统可能会导致 window.jQuery 的赋值无法在全局生效。
      // inject({
      //   $: "jquery",
      //   jQuery: "jquery",
      // }),
      ViteEjsPlugin((viteConfig) => {
        // viteConfig is the current viteResolved config.
        console.log(viteConfig)
        return {
          title: "智绘",
          pagesPath: resolve(__dirname),
          year: new Date().getFullYear(),
        }
      })
    ],
    server: {
      // open: '/v/', // 启动开发服务器时，默认打开的页面
      open: '/v/design/', // 启动开发服务器时，默认打开的页面
    },
    build: {
      emptyOutDir: true,
      // assetsInclude: ['**/*.ejs'], 
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html'),
          v: resolve(__dirname, 'v/index.html'),
          iframes: resolve(__dirname, 'v/iframes/index.html'),
          design: resolve(__dirname, 'v/design/index.html'),
          templates: resolve(__dirname, 'v/templates/index.html'),
          list: resolve(__dirname, 'v/list/index.html'),
          detail: resolve(__dirname, 'v/detail/index.html'),
          agreement: resolve(__dirname, 'auth/agreement/index.html'),
          bindPhone: resolve(__dirname, 'auth/bind-phone/index.html'),
          resetPassword: resolve(__dirname, 'auth/reset-password/index.html'),
          signIn: resolve(__dirname, 'auth/sign-in/index.html'),
          signOut: resolve(__dirname, 'auth/sign-out/index.html'),
          signUp: resolve(__dirname, 'auth/sign-up/index.html'),
          updateProfile: resolve(__dirname, 'auth/update-profile/index.html'),
        },
      },
      outDir: 'dist', // 输出目录
    },
    base: '/', // 设置基础路径
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
  };
});
