/**
 * scripts/gen-sitemap.mjs
 * 在 vite build 之后运行，只针对博客子应用生成 sitemap.xml / robots.txt。
 * 不扫描 dist，因此不会混入 account / console / login 等其他子应用的路由。
 */
import { writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')
const HOSTNAME = 'https://undz.cn'
const POSTS_DIR = join(ROOT, 'src/index/content/posts')
const OUT_DIR = resolve(ROOT, '../api-assets')

/* ---- 静态路由（带优先级）---- */
const staticRoutes = [
    { path: '/', priority: 1.0, changefreq: 'daily', lastmod: '2026-09-14' },
    { path: '/articles', priority: 0.9, changefreq: 'daily', lastmod: '2026-09-14' },
    { path: '/projects', priority: 0.9, changefreq: 'weekly', lastmod: '2026-09-14' },
    { path: '/archive', priority: 0.7, changefreq: 'weekly', lastmod: '2026-09-14' },
    { path: '/about', priority: 0.6, changefreq: 'monthly', lastmod: '2026-09-13' },
    { path: '/contact', priority: 0.5, changefreq: 'monthly', lastmod: '2026-09-13' },
    { path: '/privacy', priority: 0.3, changefreq: 'yearly', lastmod: '2026-09-13' },
    { path: '/terms', priority: 0.3, changefreq: 'yearly', lastmod: '2026-09-13' },
    { path: '/cookies', priority: 0.3, changefreq: 'yearly', lastmod: '2026-09-13' },
]

/* ---- 从 posts 目录读取文章 slug，自动生成文章 URL ---- */
function getPostRoutes() {
    if (!existsSync(POSTS_DIR)) return []
    return readdirSync(POSTS_DIR)
        .filter(f => f.endsWith('.md'))
        .map(f => {
            const slug = f.replace(/\.md$/, '')
            const raw = readFileSync(join(POSTS_DIR, f), 'utf8')
            // 从 frontmatter 里提取 date
            const m = /^---[\s\S]*?^date:\s*(.+)$/m.exec(raw)
            const lastmod = m ? m[1].trim() : new Date().toISOString().slice(0, 10)
            return {
                path: `/articles/${slug}`,
                priority: 0.8,
                changefreq: 'monthly',
                lastmod,
            }
        })
}

/* ---- 生成 sitemap.xml ---- */
function buildSitemap(routes) {
    const fallback = new Date().toISOString()
    const urls = routes.map(r => `  <url>
    <loc>${HOSTNAME}${r.path}</loc>
    <lastmod>${r.lastmod || fallback}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>
  </url>`).join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}


/* ---- 生成 robots.txt ---- */
function buildRobots() {
    return `User-agent: *
Allow: /

Sitemap: ${HOSTNAME}/sitemap.xml
`
}

/* ---- 执行 ---- */
if (!existsSync(OUT_DIR)) {
    console.error(`[sitemap] 输出目录不存在：${OUT_DIR}`)
    process.exit(1)
}

const routes = [...staticRoutes, ...getPostRoutes()]
writeFileSync(join(OUT_DIR, 'sitemap.xml'), buildSitemap(routes), 'utf8')
writeFileSync(join(OUT_DIR, 'robots.txt'), buildRobots(), 'utf8')

console.log(`[sitemap] 已生成 ${routes.length} 条 URL → ${join(OUT_DIR, 'sitemap.xml')}`)
console.log(`[robots]  已生成 → ${join(OUT_DIR, 'robots.txt')}`)