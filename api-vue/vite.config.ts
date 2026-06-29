import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import viteCompression from 'vite-plugin-compression'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  build: {
    outDir: '../api-worker/dist',
    reportCompressedSize: false,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('element-plus')) return 'vendor-element-plus'
            if (id.includes('@element-plus/icons-vue')) return 'vendor-icons'
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router'))
              return 'vendor-vue'
            if (id.includes('jsQR')) return 'vendor-scanner'
            if (id.includes('@zxing/library')) return 'vendor-scanner'
            if (id.includes('lodash') || id.includes('lodash-es')) return 'vendor-lodash'
            if (id.includes('axios')) return 'vendor-axios'
            if (id.includes('dayjs')) return 'vendor-dayjs'
            if (id.includes('echarts')) return 'vendor-echarts'
            if (id.includes('element-plus')) return 'vendor-element-plus'
            return 'vendor-common'
          }
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash].[ext]',
      },
    },
  },
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    Icons({ autoInstall: true }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 5120,
    }),
    visualizer({
      filename: 'stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
    viteCompression({
      algorithm: 'brotliCompress', // 改用 Brotli
      ext: '.br',
      threshold: 5120,
    }),
    AutoImport({
      resolvers: [
        ElementPlusResolver(),

        IconsResolver({
          enabledCollections: ['ep'],
        }),
      ],
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
      ],
      imports: [
        'vue',
        {
          'element-plus': [
            'ElMessage',
            'ElNotification',
            'ElMessageBox',
            'FormInstance',
            'FormRules',
          ],
        },
      ],
      dts: 'auto-imports.d.ts',
    }),
    Components({
      resolvers: [
        ElementPlusResolver({
          importStyle: 'sass',
        }),
        ElementPlusResolver(),
        IconsResolver({
          enabledCollections: ['ep'],
        }),
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
