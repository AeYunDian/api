/* ============================================================
   静态内容层：构建时把 posts/ 下所有 .md 打进包
   ============================================================ */

const modules = import.meta.glob('./posts/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
})

function parseFrontmatter(raw) {
    const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw)
    if (!m) return { data: {}, body: raw }
    const data = {}
    for (const line of m[1].split(/\r?\n/)) {
        const i = line.indexOf(':')
        if (i === -1) continue
        const key = line.slice(0, i).trim()
        let val = line.slice(i + 1).trim()
        if (!key) continue
        if (val.startsWith('[') && val.endsWith(']')) {
            val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
        } else if (val === 'true' || val === 'false') {
            val = val === 'true'
        } else {
            val = val.replace(/^["']|["']$/g, '')
        }
        data[key] = val
    }
    return { data, body: m[2] }
}

function buildPost(filePath, raw) {
    const slug = filePath.replace('./posts/', '').replace(/\.md$/, '')
    const { data, body } = parseFrontmatter(raw)
    const date = data.date ? String(data.date) : '1970-01-01'
    return {
        slug,
        title: data.title || slug,
        date,
        category: data.category || '未分类',
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
        summary: data.summary || body.replace(/[#>*`\-\n]/g, ' ').trim().slice(0, 80),
        featured: Boolean(data.featured),
        readingMinutes: Math.max(1, Math.round(body.length / 350)),
        content: body.trim(),
    }
}

export const posts = Object.entries(modules)
    .map(([file, raw]) => buildPost(file, raw))
    .sort((a, b) => b.date.localeCompare(a.date))

export const categories = [...new Set(posts.map(p => p.category))].sort()
export const tags = [...new Set(posts.flatMap(p => p.tags))].sort()

export function getPost(slug) { return posts.find(p => p.slug === slug) }
export function getPostsByCategory(cat) { return posts.filter(p => p.category === cat) }
export function getPostsByTag(tag) { return posts.filter(p => p.tags.includes(tag)) }
export function getFeatured() { return posts.filter(p => p.featured) }
export function getRecent(n = 6) { return posts.slice(0, n) }

export function getArchive() {
    const map = {}
    for (const p of posts) {
        const y = p.date.slice(0, 4)
            ; (map[y] ??= []).push(p)
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
}

import MarkdownIt from 'markdown-it'
const md = new MarkdownIt({ html: false, linkify: true, breaks: true })
export function renderMarkdown(src) { return md.render(src) }