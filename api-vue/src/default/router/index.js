import { createRouter, createWebHistory } from 'vue-router'
import NotFound from '@/default/views/NotFound.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/:pathMatch(.*)*',
            name: 'NotFound',
            component: NotFound
        },
    ],
})

export default router
