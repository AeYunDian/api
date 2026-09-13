// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
// 由于组件库交互事件使用 touch 事件进行开发，不支持桌面端的 mouse 事件，使用 @varlet/touch-emulator 将 touch -> mouse 从而实现桌面端适配。
import '@varlet/touch-emulator'
import MyIcon from '@/shared/MyIcon.vue'
import { isHostShell, initWindow } from '@/shared/utils/hostshell'

const url = new URL(window.location.href);
if (isHostShell() && !url.searchParams.has('notinithostshell')) {
    initWindow({ borderStyle: 'none', windowState: 'normal', enableEdgeResize: true, minWidth: 1000, minHeight: 800 });
}

const hostname = window.location.hostname
const appModules = {
    index: () => import('./index/App.vue'),
    account: () => import('./account/App.vue'),
    console: () => import('./console/App.vue'),
    relay: () => import('./relay/App.vue'),
    ai: () => import('./ai/App.vue'),
    default: () => import('./default/App.vue'),
}
const routerModules = {
    index: () => import('./index/router/index.js'),
    account: () => import('./account/router/index.js'),
    ai: () => import('./ai/router/index.js'),
    console: () => import('./console/router/index.js'),
}
const titles = {
    account: 'AyAccountCenter',
    console: 'AyConsole',
    relay: 'AyRelay',
    ai: 'AyIntelligence',
    default: '404 Not Found',
}

function getAppName() {
    if (hostname === "undz.cn" || hostname === "dev.undz.cn") return 'index'
    if (hostname.includes('ai')) return 'ai'
    if (hostname.includes('relay')) return 'relay'
    if (hostname.includes('console')) return 'console'
    if (hostname.includes('online')) return 'account'
    return DEFAULT_APP
}

const DEFAULT_APP = 'default'




function preloadAllRoutes(router) {
    const schedule = window.requestIdleCallback || window.setTimeout;

    schedule(() => {
        const routes = router.getRoutes();
        // 筛选出使用动态导入的组件
        const loadTasks = routes
            .filter(route => route.component && typeof route.component === 'function')
            .map(route => route.component().catch((err) => { console.warn(`[Preload] ${err.message}`) }));
        // 并发加载，不阻塞主线程
        Promise.allSettled(loadTasks).then(() => {
            console.log('[Preload] All route components have been loaded');
        });
    }, { timeout: 3000 }); // 最多延迟 3 秒后强制执行
}

let appInstance = null;

async function loadApp(retryCount = 0) {
    try {
        // 卸载之前的应用
        if (appInstance) {
            appInstance.unmount();
            appInstance = null;
        }
        const appName = getAppName()
        if (!appModules[appName]) {
            throw new Error(`未知应用: ${appName}`)
        }
        const appModulePromise = appModules[appName]()
        const routerModulePromise = routerModules[appName]
            ? routerModules[appName]()
            : Promise.resolve(null)
        const [AppModule, RouterModule] = await Promise.all([
            appModulePromise,
            routerModulePromise
        ])
        const App = AppModule.default
        const router = RouterModule?.default || null

        const app = createApp(App)
        app.use(createPinia())
        const { useThemeStore } = await import('@/shared/stores/theme')
        const themeStore = useThemeStore();
        themeStore.initializeTheme();
        if (router) {
            app.use(router)
        }
        app.component('MyIcon', MyIcon)
        appInstance = app;
        app.mount('#app');
        document.title = titles[appName] || 'Ay Services'
        if (router) {
            preloadAllRoutes(router);
        }

    } catch (err) {
        try {
            const { StyleProvider, Themes } = await import('@varlet/ui');
            const { Dialog } = await import('@varlet/ui');
            await import('@varlet/ui/es/dialog/style');
            StyleProvider(Themes.md3Light);
            if (retryCount >= 3) {
                console.error('重试次数过多，停止尝试');
                Dialog({
                    title: '加载失败',
                    message: err.message,
                    cancelButton: false,
                    confirmButton: false
                });
                return;
            }

            const res = await Dialog({
                title: '加载失败',
                message: err.message + '\n是否重试？',
                cancelButton: false
            });
            if (res === 'confirm') {
                loadApp(retryCount + 1);
            }
        } catch (err) {
            console.error(err)
            alert(`加载出错：${err.message}`);
        }
    }
}
await loadApp();