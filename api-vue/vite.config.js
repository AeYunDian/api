import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import components from 'unplugin-vue-components/vite'
import autoImport from 'unplugin-auto-import/vite'
import { VarletImportResolver } from '@varlet/import-resolver'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  server: {
    host: 'c.undz.cn', // 监听所有网络接口，方便局域网访问
    port: 443,
    strictPort: true,
    https: true,
    allowedHosts: ['c.undz.cn']
  },
  plugins: [
    vue(),
    vueDevTools(),
    basicSsl({
      name: 'test',
      domains: ['*.undz.cn'],
      certDir: '../cert'
    }),
    components({
      resolvers: [VarletImportResolver()]
    }),
    autoImport({
      resolvers: [VarletImportResolver({ autoImport: true })]
    })
  ],
  build: {
    outDir: '../api-assets'
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
