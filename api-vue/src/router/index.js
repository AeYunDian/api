import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/user-panel',
      component: () => import('@/views/UserPanel.vue'),
      children: [
        { path: '', redirect: '/user-panel/account-overview' },
        {
          path: 'account-overview',
          component: () => import('@/views/account/AccountOverview.vue')
        },
        {
          path: 'user-info',
          component: () => import('@/views/account/UserInfo.vue')
        },
        {
          path: 'link-account',
          component: () => import('@/views/account/LinkAccount.vue')
        },
        {
          path: 'oauth',
          component: () => import('@/views/account/Oauth.vue')
        },
        {
          path: 'security',
          component: () => import('@/views/account/Security.vue')
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
      component: () => import('@/views/NotFound.vue')
    },
  ],
})

export default router
