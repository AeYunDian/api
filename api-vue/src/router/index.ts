declare module 'vue-router' {
  interface RouteMeta {
    title?: string
  }
}

import { createRouter, createWebHistory } from 'vue-router'
const HomeView = () => import('@/views/HomeView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: { title: '主页' },
      component: HomeView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: '404',
      meta: { title: '404 页面未找到' },
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

router.afterEach((to) => {
  const baseTitle = "AyAccount"
  const pageTitle = to.meta.title ? to.meta.title : baseTitle

  if (typeof document !== 'undefined') {
    document.title = pageTitle
  }
})

export default router
