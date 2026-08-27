import { createRouter, createWebHistory } from 'vue-router'


const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('@/account/views/HomeView.vue'),
            meta: { title: '首页' }
        },
        {
            path: '/user-panel',
            component: () => import('@/account/views/UserPanel.vue'),
            children: [
                { path: '', redirect: '/user-panel/account-overview' },
                {
                    path: 'account-overview',
                    component: () => import('@/account/views/account/AccountOverview.vue'),
                    meta: { title: '账号概览' }
                },
                {
                    path: 'user-info',
                    component: () => import('@/account/views/account/UserInfo.vue'),
                    meta: { title: '个人信息' }
                },
                {
                    path: 'link-account',
                    component: () => import('@/account/views/account/LinkAccount.vue'),
                    meta: { title: '第三方账号绑定' }
                },
                {
                    path: 'oauth',
                    component: () => import('@/account/views/account/Oauth.vue'),
                    meta: { title: '授权管理' }
                },
                {
                    path: 'security',
                    component: () => import('@/account/views/account/Security.vue'),
                    meta: { title: '安全中心' }
                },
                {
                    path: ':pathMatch(.*)*',
                    redirect: '/user-panel/account-overview'
                }
            ]
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'NotFound',
            component: () => import('@/account/views/NotFound.vue'),
            meta: { title: '404 Not Found' }
        },
    ],
})

router.beforeEach((to, from, next) => {
    const appName = 'AyAccountCenter'
    const pageTitle = to.meta?.title || ''
    document.title = pageTitle ? `${pageTitle} - ${appName}` : appName
    next()
})

export default router
