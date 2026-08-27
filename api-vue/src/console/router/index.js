import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('@/console/views/HomeView.vue'),
            meta: { title: '首页' }
        },
        {
            path: '/console-panel',
            component: () => import('@/console/views/ConsolePanel.vue'),
            children: [
                { path: '', redirect: '/console-panel/oauth-client' },
                {
                    path: 'oauth-client',
                    component: () => import('@/console/views/console/OAuthClient.vue'),
                    meta: { title: 'OAuth 客户端管理' }
                },
                {
                    path: 'users-manager',
                    component: () => import('@/console/views/console/UsersManager.vue'),
                    meta: { title: '账号管理' }
                },
                {
                    path: ':pathMatch(.*)*',
                    redirect: '/console-panel/oauth-client'
                }
            ]
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'NotFound',
            component: () => import('@/console/views/NotFound.vue'),
            meta: { title: '404 Not Found' }
        },
    ],
})

router.beforeEach((to, from, next) => {
    const appName = 'AyConsole'
    const pageTitle = to.meta?.title || ''
    document.title = pageTitle ? `${pageTitle} - ${appName}` : appName
    next()
})

export default router
