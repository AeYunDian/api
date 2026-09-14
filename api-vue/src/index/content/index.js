/* ============================================================
   静态内容层：构建时把 posts/ 下所有 .md 打进包
   —— 支持 VuePress 风格容器（::: warning / ::: tabs / ::: center）
   —— 跳过 draft: true
   ============================================================ */

import MarkdownIt from 'markdown-it'

const modules = import.meta.glob('./posts/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
})

/* ---------- Frontmatter 解析（支持多行数组） ---------- */
function parseFrontmatter(raw) {
    const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw)
    if (!m) return { data: {}, body: raw }

    const lines = m[1].split(/\r?\n/)
    const data = {}
    let currentKey = null
    let currentList = null

    for (const line of lines) {
        const listMatch = /^\s*-\s+(.*)$/.exec(line)
        if (listMatch && currentKey) {
            if (!currentList) { currentList = []; data[currentKey] = currentList }
            currentList.push(listMatch[1].trim().replace(/^["']|["']$/g, ''))
            continue
        }

        const kvMatch = /^([a-zA-Z][\w-]*)\s*:\s*(.*)$/.exec(line)
        if (kvMatch) {
            const key = kvMatch[1]
            const val = kvMatch[2].trim()
            currentKey = key
            currentList = null

            if (val === '') {
                data[key] = []
                currentList = data[key]
            } else if (val.startsWith('[') && val.endsWith(']')) {
                data[key] = val.slice(1, -1)
                    .split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
            } else if (val === 'true' || val === 'false') {
                data[key] = val === 'true'
            } else {
                data[key] = val.replace(/^["']|["']$/g, '')
            }
        }
    }
    return { data, body: m[2] }
}

/* ---------- VuePress 容器 → HTML（注意处理顺序：内层先于外层） ---------- */
function preprocessContainers(src) {
    // 1) 先处理不嵌套的简单容器
    src = src.replace(
        /^:::\s*center\s*$\n([\s\S]*?)^:::\s*$/gm,
        (_, inner) => `<div class="md-center">\n\n${inner.trim()}\n\n</div>`
    )
    src = src.replace(
        /^:::\s*warning\s*$\n([\s\S]*?)^:::\s*$/gm,
        (_, inner) => `<div class="md-alert md-alert--warning">\n\n${inner.trim()}\n\n</div>`
    )
    src = src.replace(
        /^:::\s*info\s*$\n([\s\S]*?)^:::\s*$/gm,
        (_, inner) => `<div class="md-alert md-alert--info">\n\n${inner.trim()}\n\n</div>`
    )
    src = src.replace(
        /^:::\s*tip\s*$\n([\s\S]*?)^:::\s*$/gm,
        (_, inner) => `<div class="md-alert md-alert--tip">\n\n${inner.trim()}\n\n</div>`
    )
    src = src.replace(
        /^:::\s*(?:danger|error)\s*$\n([\s\S]*?)^:::\s*$/gm,
        (_, inner) => `<div class="md-alert md-alert--danger">\n\n${inner.trim()}\n\n</div>`
    )

    // 2) 再处理 tabs（此时内部若含 center，已变成 <div class="md-center">）
    src = src.replace(
        /^:::\s*tabs\s*$\n([\s\S]*?)^:::\s*$/gm,
        (_, body) => {
            const parts = body.split(/^@tab\s+/m).filter(s => s.trim())
            if (!parts.length) return ''
            const tabs = parts.map((p, i) => {
                const lines = p.split('\n')
                const title = lines.shift().trim()
                const content = lines.join('\n').trim()
                return { title, content, idx: i }
            })
            const nav = tabs.map((t, i) =>
                `<button class="md-tab__btn${i === 0 ? ' is-active' : ''}" data-md-tab="${i}">${t.title}</button>`
            ).join('')
            const panels = tabs.map((t, i) =>
                `<div class="md-tab__panel${i === 0 ? ' is-active' : ''}" data-md-tab-panel="${i}">\n\n${t.content}\n\n</div>`
            ).join('\n')
            return `<div class="md-tabs">\n<div class="md-tabs__nav">${nav}</div>\n<div class="md-tabs__panels">${panels}</div>\n</div>`
        }
    )

    return src
}

/* ---------- MarkdownIt 实例 ---------- */
const md = new MarkdownIt({
    html: true,       // 允许容器 HTML（文章来自仓库，作者可控）
    linkify: true,
    breaks: true,
})

/* ---------- 构建文章对象 ---------- */
function buildPost(filePath, raw) {
    const slug = filePath.replace('./posts/', '').replace(/\.md$/, '')
    const { data, body } = parseFrontmatter(raw)

    if (data.draft === true) return null

    const h1Match = /^\s*#\s+(.+)$/m.exec(body)
    const fallbackTitle = h1Match ? h1Match[1].trim() : slug

    const catRaw = data.category ?? data.categories ?? '未分类'
    const category = Array.isArray(catRaw) ? catRaw[0] : catRaw
    const tagsRaw = data.tags ?? data.tag ?? []
    const tags = Array.isArray(tagsRaw) ? tagsRaw : [tagsRaw]

    // 文件名里的日期作为兜底：xxx.2026-05-20.md
    const fileDate = /\.(\d{4}-\d{2}-\d{2})\.md$/.exec(filePath)?.[1]
    const date = data.date
        ? String(data.date).slice(0, 10)
        : (fileDate || '1970-01-01')

    return {
        slug,
        title: data.title || fallbackTitle,
        date,
        category,
        tags,
        summary: data.summary || body
            .replace(/^---[\s\S]*?---/g, '')
            .replace(/:::[^\n]*\n/g, '')
            .replace(/^@tab[^\n]*\n/gm, '')
            .replace(/[#>*`\[\]()\-!\n]/g, ' ')
            .trim().slice(0, 100),
        featured: Boolean(data.featured),
        readingMinutes: Math.max(1, Math.round(body.length / 350)),
        content: body.trim(),
    }
}

export const posts = Object.entries(modules)
    .map(([file, raw]) => buildPost(file, raw))
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date))

export const categories = [...new Set(posts.map(p => p.category))].filter(Boolean).sort()
export const tags = [...new Set(posts.flatMap(p => p.tags))].filter(Boolean).sort()

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

/* ---------- Markdown 渲染 ---------- */
export function renderMarkdown(src) {
    return md.render(preprocessContainers(src))
}

/* ---------- Tabs 交互绑定（页面挂载后调用） ---------- */
export function bindMarkdownTabs(root = document) {
    root.querySelectorAll('.md-tabs').forEach(tabs => {
        if (tabs.dataset.bound) return
        tabs.dataset.bound = '1'
        tabs.querySelectorAll('.md-tab__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = btn.dataset.mdTab
                tabs.querySelectorAll('.md-tab__btn').forEach(b =>
                    b.classList.toggle('is-active', b === btn))
                tabs.querySelectorAll('.md-tab__panel').forEach(p =>
                    p.classList.toggle('is-active', p.dataset.mdTabPanel === idx))
            })
        })
    })
}