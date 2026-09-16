/* ============================================================
   资源内容层
   —— 构建时把 resources/posts/*.md 打进包
   —— frontmatter 支持：字符串 / 布尔 / 内联数组 / 多行数组 / 对象数组
   —— 跳过 draft: true
   ============================================================ */

import MarkdownIt from 'markdown-it'

const modules = import.meta.glob('./posts/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
})

/* ---------- 工具：去引号 ---------- */
function strip(s) {
    return String(s).trim().replace(/^["']|["']$/g, '')
}

/* ---------- 工具：标量解析 ---------- */
function parseScalar(v) {
    const s = String(v).trim()
    if (s === 'true') return true
    if (s === 'false') return false
    return strip(s)
}

/* ---------- Frontmatter 解析（支持对象数组） ---------- */
function parseFrontmatter(raw) {
    const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw)
    if (!m) return { data: {}, body: raw }

    const lines = m[1].split(/\r?\n/)
    const data = {}
    let currentKey = null
    let currentList = null
    let currentObj = null

    for (const line of lines) {
        if (!line.trim()) continue

        // 1) 对象数组的新条目：  - name: xxx
        const objStart = /^\s*-\s+([a-zA-Z][\w-]*)\s*:\s*(.*)$/.exec(line)
        if (objStart && currentKey) {
            if (!Array.isArray(data[currentKey])) data[currentKey] = []
            currentObj = { [objStart[1]]: parseScalar(objStart[2]) }
            data[currentKey].push(currentObj)
            currentList = null
            continue
        }

        // 2) 对象内的后续字段：      url: yyy（缩进）
        const objKV = /^\s+([a-zA-Z][\w-]*)\s*:\s*(.*)$/.exec(line)
        if (objKV && currentObj) {
            currentObj[objKV[1]] = parseScalar(objKV[2])
            continue
        }

        // 3) 简单列表项：  - item
        const listItem = /^\s*-\s+(.*)$/.exec(line)
        if (listItem && currentKey && !currentObj) {
            if (!currentList) {
                currentList = []
                data[currentKey] = currentList
            }
            currentList.push(strip(listItem[1]))
            continue
        }

        // 4) 顶层 key: value
        const kv = /^([a-zA-Z][\w-]*)\s*:\s*(.*)$/.exec(line)
        if (kv) {
            const key = kv[1]
            const val = kv[2].trim()
            currentKey = key
            currentList = null
            currentObj = null

            if (val === '') {
                data[key] = []          // 占位，后面按元素类型填充
            } else if (val.startsWith('[') && val.endsWith(']')) {
                data[key] = val.slice(1, -1)
                    .split(',')
                    .map(s => strip(s))
                    .filter(Boolean)
            } else {
                data[key] = parseScalar(val)
            }
        }
    }
    return { data, body: m[2] }
}

/* ---------- VuePress 风格容器（与文章内容层一致） ---------- */
function preprocessContainers(src) {
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

const md = new MarkdownIt({
    html: true,
    linkify: true,
    breaks: true,
})

/* ---------- 构建资源对象 ---------- */
function buildResource(filePath, raw) {
    const slug = filePath.replace('./posts/', '').replace(/\.md$/, '')
    const { data, body } = parseFrontmatter(raw)

    if (data.draft === true) return null

    const h1Match = /^\s*#\s+(.+)$/m.exec(body)
    const fallbackTitle = h1Match ? h1Match[1].trim() : slug

    const catRaw = data.category ?? data.categories ?? '未分类'
    const category = Array.isArray(catRaw) ? catRaw[0] : catRaw

    const tagsRaw = data.tags ?? data.tag ?? []
    const tags = Array.isArray(tagsRaw) ? tagsRaw : [tagsRaw]

    const platformsRaw = data.platforms ?? data.platform ?? []
    const platforms = Array.isArray(platformsRaw) ? platformsRaw : [platformsRaw]

    const downloadsRaw = data.downloads ?? []
    const downloads = Array.isArray(downloadsRaw)
        ? downloadsRaw
            .filter(d => d && typeof d === 'object' && d.url)
            .map(d => ({
                name: d.name || '下载',
                url: d.url,
                platform: d.platform || '',
                size: d.size || '',
                version: d.version || '',
            }))
        : []

    const fileDate = /\.(\d{4}-\d{2}-\d{2})\.md$/.exec(filePath)?.[1]
    const date = data.date ? String(data.date).slice(0, 10) : (fileDate || '1970-01-01')

    return {
        slug,
        title: data.title || fallbackTitle,
        date,
        category,
        tags,
        platforms,
        version: data.version || '',
        license: data.license || '',
        size: data.size || '',
        official: data.official || '',
        repo: data.repo || '',
        docs: data.docs || '',
        downloads,
        listed: data.listed !== false,
        summary: data.summary || body
            .replace(/^---[\s\S]*?---/g, '')
            .replace(/:::[^\n]*\n/g, '')
            .replace(/^@tab[^\n]*\n/gm, '')
            .replace(/[#>*`\[\]()\-!\n]/g, ' ')
            .trim().slice(0, 100),
        featured: Boolean(data.featured),
        content: body.trim(),
    }
}
/* ---------- 全量（详情页用，含 listed:false） ---------- */
export const resources = Object.entries(modules)
    .map(([file, raw]) => buildResource(file, raw))
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date))

/* ---------- 列表可见（总览/侧边栏/推荐用） ---------- */
export const listedResources = resources.filter(r => r.listed)

/* ---------- 聚合：仅统计列表可见的资源 ---------- */
export const resourceCategories = [...new Set(listedResources.map(r => r.category))]
    .filter(Boolean).sort()

export const resourcePlatforms = [...new Set(listedResources.flatMap(r => r.platforms))]
    .filter(Boolean).sort()

export const resourceTags = [...new Set(listedResources.flatMap(r => r.tags))]
    .filter(Boolean).sort()

/* ---------- 查询 ---------- */
// 详情页：全量查询，保证 listed:false 可直达
export function getResource(slug) {
    return resources.find(r => r.slug === slug)
}

// 列表相关：只在 listedResources 里查
export function getListedResourcesByCategory(cat) {
    return listedResources.filter(r => r.category === cat)
}
export function getListedResourcesByPlatform(p) {
    return listedResources.filter(r => r.platforms.includes(p))
}
export function getFeaturedResources() {
    return listedResources.filter(r => r.featured)
}
export function getRecentResources(n = 6) {
    return listedResources.slice(0, n)
}

/* ---------- Markdown 渲染 ---------- */
export function renderResourceMarkdown(src) {
    return md.render(preprocessContainers(src))
}

/* ---------- Tabs 交互绑定 ---------- */
export function bindResourceTabs(root = document) {
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