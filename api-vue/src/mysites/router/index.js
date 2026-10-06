import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/mysites/views/HomeView.vue"),
      meta: { title: "站点列表" },
    },
    {
      path: "/sites/:id",
      name: "site-overview",
      component: () => import("@/mysites/views/SiteOverview.vue"),
      meta: { title: "站点数据" },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "NotFound",
      component: () => import("@/mysites/views/NotFound.vue"),
      meta: { title: "404 Not Found" },
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const appName = "AyAnalytics";
  const pageTitle = to.meta?.title || "";
  document.title = pageTitle ? `${pageTitle} - ${appName}` : appName;
  return true;
});

export default router;
