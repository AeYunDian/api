import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import components from 'unplugin-vue-components/vite'
import autoImport from 'unplugin-auto-import/vite'
import { VarletImportResolver } from '@varlet/import-resolver'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { visualizer } from 'rollup-plugin-visualizer'
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
        visualizer({
            filename: 'stats.html',
            open: false,
            gzipSize: true,
            brotliSize: true,
        }),
        components({
            resolvers: [VarletImportResolver({ autoImport: true, })]
        }),
        autoImport({
            resolvers: [VarletImportResolver({ autoImport: true })]
        })
    ],
    build: {
        outDir: '../api-assets',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                // 入口和 chunk 的文件名模板（按您的分类）
                entryFileNames: 'js/[name]-[hash].js',
                chunkFileNames: 'js/[name]-[hash].js',
                assetFileNames: (assetInfo) => {
                    const name = assetInfo.name || '';
                    if (name.endsWith('.css')) return 'css/[name]-[hash][extname]';
                    if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(name)) return 'images/[name]-[hash][extname]';
                    if (/\.(woff2?|eot|ttf|otf)$/.test(name)) return 'fonts/[name]-[hash][extname]';
                    return 'assets/[name]-[hash][extname]';
                },

                manualChunks(id) {
                    if (id.includes('@vue') || id.includes('vue-router') || id.includes('pinia')) {
                        if (id.includes('@vue')) return 'vendor-vue';
                        if (id.includes('vue-router')) return 'vendor-router';
                        if (id.includes('pinia')) return 'vendor-pinia';
                    }

                    if (id.includes('@varlet/shared') || id.includes('@varlet/use')) {
                        return 'vendor-varlet-libs';
                    }

                    if (id.includes('dayjs')) return 'vendor-dayjs';
                    if (id.includes('@popperjs') || id.includes('popper.js')) return 'vendor-popper';
                    if (id.includes('rattail') || id.includes('js-cookie')) return 'vendor-varlet-libs'; // 归入 Varlet 公共

                    const varletMatch = id.match(/\/@varlet\/ui\/es\/([^/]+)/);
                    if (varletMatch) {
                        const dir = varletMatch[1];
                        const commonDirs = ['utils', 'locale', 'context', 'hooks', 'styles', 'themes', 'constants'];
                        if (commonDirs.includes(dir)) {
                            return 'vendor-varlet-common';
                        }
                        return `varlet-${dir}`;
                    }
                }
            }
        }
    },
    base: '/',
    minify: 'terser',
    sourceMap: false,
    terserOptions: {
        compress: {
            dead_code: true,
            passes: 4,
            unsafe: true,
            unsafe_proto: true,
        },
        mangle: {
            toplevel: true,
        },
        format: {
            comments: false,
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
})
