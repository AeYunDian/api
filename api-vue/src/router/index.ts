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
      path: '/addrecord',
      name: 'add_record',
      meta: { title: '添加记录' },
      component: () => import('../views/AddRecordView.vue'),
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
  const baseTitle = 'AY毕业纪念册'
  const pageTitle = to.meta.title ? `${to.meta.title} | ${baseTitle}` : baseTitle

  if (typeof document !== 'undefined') {
    document.title = pageTitle
  }
})

export default router
