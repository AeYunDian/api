// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
// 由于组件库交互事件使用 touch 事件进行开发，不支持桌面端的 mouse 事件，使用 @varlet/touch-emulator 将 touch -> mouse 从而实现桌面端适配。
import '@varlet/touch-emulator'
import MyIcon from '@/shared/MyIcon.vue'

import { Snackbar } from '@varlet/ui'
import '@varlet/ui/es/snackbar/style';

const hostname = window.location.hostname
const appModules = {
    account: () => import('./account/App.vue'),
    console: () => import('./console/App.vue'),
    default: () => import('./default/App.vue'),
}
const routerModules = {
    account: () => import('./account/router/index.js'),
    console: () => import('./console/router/index.js'),
    default: () => import('./default/router/index.js'),
}
const titles = {
    account: 'AyAccountCenter',
    console: 'AyConsole',
    default: 'Ay Services'
}

const DEFAULT_APP = 'default'

function getAppName() {
    if (hostname.includes('console')) return 'console'
    if (hostname.includes('online')) return 'account'
    return DEFAULT_APP
}

const loadApp = async () => {
    const appName = getAppName()
    if (!appModules[appName]) {
        Snackbar.error({
            content: `未知应用: ${appName}`,
            duration: 1000 * 60 * 60,
        })
        throw new Error(`未知应用: ${appName}`)
    }
    const [AppModule, RouterModule] = await Promise.all([
        appModules[appName](),
        routerModules[appName]()
    ])

    const App = AppModule.default
    const router = RouterModule.default
    document.title = titles[appName] || 'Ay Services'
    const app = createApp(App)
    app.use(createPinia())
    app.use(router)
    app.component('MyIcon', MyIcon)
    app.mount('#app')
}

loadApp().catch(err => console.error('加载失败:', err))