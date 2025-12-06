import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import Inspect from 'vite-plugin-inspect'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import VueRouter from 'unplugin-vue-router/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import Layouts from 'vite-plugin-vue-layouts'
import tailwindcss from '@tailwindcss/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers' // 自动引入element-plus组件
import path from 'path'

const resolve = (dir: string) => path.join(__dirname, dir)
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // https://github.com/posva/unplugin-vue-router
    VueRouter({
      extensions: ['.vue', '.md'],
      exclude: ['**/components/**', '**/widgets/**'],
      dts: './typed-router.d.ts',
    }),
    vue({
      script: {
        defineModel: true,
        propsDestructure: true // 解构 props
      }
    }),
    vueJsx(),
    // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
    Layouts({ defaultLayout: 'dynamic' }),
    Inspect(),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        '@vueuse/head',
        '@vueuse/core',
        VueRouterAutoImports,
        {
          // add any other imports you were relying on
          'vue-router/auto': ['useLink'],
        },
      ],
      dts: './auto-imports.d.ts',
      dirs: ['src/composables', 'src/stores'],
      vueTemplate: true,
      resolvers: [ElementPlusResolver()]
    }),
    //
    Components({
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
        /\.md$/ // .md
      ],
      dirs: ['src/components'],
      deep: true,
      resolvers: [ElementPlusResolver()]
    }),
    // https://tailwindcss.com/docs/installation/using-vite
    tailwindcss(),
  ],
  server: {
    port: 3334,
    host: '0.0.0.0',
    open: true,
    proxy: {
      '/api': {
        target: 'https://uapis.cn',
        changeOrigin: true,
        // rewrite: path => path.replace(/^\/api/, '')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve('src')
    }
  }
})
