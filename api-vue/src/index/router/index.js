import { createRouter, createWebHistory } from 'vue-router'
import { getPost } from '@/index/content'
import { getResource } from '@/index/resources'
const PLATFORM = '韵典综合平台'

const routes = [
    { path: '/', name: 'home', component: () => import('@/index/views/HomeView.vue'), meta: { title: '首页', nav: 'home' } },
    { path: '/articles', name: 'articles', component: () => import('@/index/views/ArticleListView.vue'), meta: { title: '文章', nav: 'articles' } },
    { path: '/articles/:slug', name: 'article', component: () => import('@/index/views/ArticleDetailView.vue'), meta: { title: '文章详情' } },
    { path: '/categories/:slug', name: 'category', component: () => import('@/index/views/CategoryView.vue'), meta: { title: '分类' } },
    { path: '/tags/:slug', name: 'tag', component: () => import('@/index/views/TagView.vue'), meta: { title: '标签' } },
    { path: '/archive', name: 'archive', component: () => import('@/index/views/ArchiveView.vue'), meta: { title: '归档', nav: 'archive' } },
    {
        path: '/search',
        name: 'search',
        component: () => import('@/index/views/SearchView.vue'),
        meta: { title: '搜索', nav: 'search' },
    },
    {
        path: '/resources',
        name: 'resources',
        component: () => import('@/index/views/ResourceListView.vue'),
        meta: { title: '资源', nav: 'resources' },
    },
    {
        path: '/resources/:slug',
        name: 'resource',
        component: () => import('@/index/views/ResourceDetailView.vue'),
        meta: { title: '资源详情' },
    },

    /* 站点信息类 */
    { path: '/about', name: 'about', component: () => import('@/index/views/AboutView.vue'), meta: { title: '关于本站', nav: 'about' } },
    { path: '/contact', name: 'contact', component: () => import('@/index/views/ContactView.vue'), meta: { title: '联系我', nav: 'contact' } },
    { path: '/privacy', name: 'privacy', component: () => import('@/index/views/PrivacyView.vue'), meta: { title: '隐私政策' } },
    { path: '/terms', name: 'terms', component: () => import('@/index/views/TermsView.vue'), meta: { title: '服务条款' } },
    { path: '/cookies', name: 'cookies', component: () => import('@/index/views/CookieView.vue'), meta: { title: 'Cookie 政策' } },

    { path: '/:pathMatch(.*)*', name: 'notFound', component: () => import('@/index/views/NotFoundView.vue'), meta: { title: '页面未找到' } },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(to, from, saved) {
        if (saved) return saved
        return { top: 0 }
    },
})

router.afterEach((to) => {
    let pageTitle = to.meta?.title ?? ''
    if (to.name === 'article') {
        const post = getPost(to.params.slug)
        if (post) pageTitle = post.title
    }
    if (to.name === 'resource') {
        const resource = getResource(to.params.slug)
        if (resource) pageTitle = resource.title
    }
    document.title = pageTitle ? `${pageTitle} - ${PLATFORM}` : PLATFORM
})

export default router