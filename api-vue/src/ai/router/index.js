import { createRouter, createWebHistory } from 'vue-router'


const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/:pathMatch(.*)*',
            name: 'NotFound',
            component: () => import('@/ai/views/NotFound.vue'),
            meta: { title: '搭建中' }
        },
    ],
})

router.beforeEach((to, from, next) => {
    const appName = 'AyIntelligence'
    const pageTitle = to.meta?.title || ''
    document.title = pageTitle ? `${pageTitle} - ${appName}` : appName
    next()
})

export default router
