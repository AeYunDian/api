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
        host: '0.0.0.0',
        port: 443,
        strictPort: true,
        https: true,
        allowedHosts: ['online-dev.undz.cn', 'console-dev.undz.cn']
    },
    plugins: [
        vue(),
        vueDevTools(),
        basicSsl({
            name: 'dev',
            domains: ['*.undz.cn'],
            certDir: './cert'
        }),
        components({
            resolvers: [VarletImportResolver({
                style: 'css',
                autoImport: true,
            })]
        }),
        autoImport({
            resolvers: [VarletImportResolver({ autoImport: true })]
        })
    ],
    build: {
        outDir: '../api-assets',
        emptyOutDir: true
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
})
