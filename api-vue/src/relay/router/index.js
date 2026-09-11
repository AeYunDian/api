import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/:pathMatch(.*)*',
            name: 'Tip',
            component: () => import('@/relay/views/Tip.vue'),
            meta: { title: 'Tip' }
        },
    ],
})

router.beforeEach((to, from, next) => {
    const appName = 'AyRelay'
    const pageTitle = to.meta?.title || ''
    document.title = pageTitle ? `${pageTitle} - ${appName}` : appName
    next()
})

export default router
