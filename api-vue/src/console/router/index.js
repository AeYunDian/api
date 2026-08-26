import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/console/views/HomeView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
        // {
        //     path: '/user-panel',
        //     component: () => import('@/console/views/UserPanel.vue'),
        //     children: [
        //         { path: '', redirect: '/user-panel/account-overview' },
        //         {
        //             path: 'account-overview',
        //             component: () => import('@/console/views/account/AccountOverview.vue')
        //         },
        //         {
        //             path: 'user-info',
        //             component: () => import('@/console/views/account/UserInfo.vue')
        //         },
        //         {
        //             path: 'link-account',
        //             component: () => import('@/console/views/account/LinkAccount.vue')
        //         },
        //         {
        //             path: 'oauth',
        //             component: () => import('@/console/views/account/Oauth.vue')
        //         },
        //         {
        //             path: 'security',
        //             component: () => import('@/console/views/account/Security.vue')
        //         },
        //         {
        //             path: ':pathMatch(.*)*',
        //             redirect: '/user-panel/account-overview'
        //         }
        //     ]
        // },
        {
            path: '/:pathMatch(.*)*',
            name: 'NotFound',
            component: () => import('@/console/views/NotFound.vue')
        },
    ],
})

export default router
