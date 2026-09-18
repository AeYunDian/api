// src/shared/utils/resources.js

/**
 * 资源清单
 *
 * 每一项结构：
 *   name     {string}                 资源唯一标识（用于日志和去重）
 *   apps     {string[] | '*' | Fn}    哪些应用加载；'*' 表示全部；也可传 (appName) => boolean
 *   load     {(ctx) => Promise|void}  加载函数
 *   unload   {() => Promise|void}     卸载函数（可选）
 *   enabled  {boolean}                默认 true，临时关闭某个资源时置 false
 *   order    {number}                 可选，数字小的先加载（默认 0）
 *
 * 上下文对象 ctx = { appName, hostname, resources }
 */
const resources = [
    {
        name: 'accessibility',
        apps: ['index'],
        order: 10,
        async load() {
            const { loadAccessibility } = await import('./accessibility')
            await loadAccessibility()
        },
        async unload() {
            const { unloadAccessibility } = await import('./accessibility')
            unloadAccessibility()
        },
    },

    // 👇 以后新增资源直接往这里追加
    // {
    //   name: 'analytics',
    //   apps: ['index', 'account'],
    //   order: 20,
    //   async load() { ... },
    //   async unload() { ... },
    // },
]

/* ---------------- 内部工具 ---------------- */

/** 判断某个资源是否应该在当前应用加载 */
function shouldLoad(resource, appName) {
    if (resource.enabled === false) return false
    const { apps } = resource
    if (apps === '*') return true
    if (Array.isArray(apps)) return apps.includes(appName)
    if (typeof apps === 'function') return apps(appName)
    return false
}

/** 按 order 排序（不修改原数组） */
function sortByOrder(list) {
    return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

/** 统一把结果包成 Promise，吞掉同步抛错 */
async function safeCall(fn, args, label) {
    try {
        return await fn?.(...args)
    } catch (err) {
        console.warn(`[Resources] ${label} 失败:`, err)
    }
}

/* ---------------- 对外 API ---------------- */

/** 加载当前应用需要的所有资源，返回已加载的资源名列表 */
export async function loadResourcesForApp(appName, hostname) {
    const ctx = { appName, hostname, resources }
    const matched = sortByOrder(resources.filter(r => shouldLoad(r, appName)))
    const loaded = []

    // 顺序加载（保证 order 有意义），单项失败不影响其它
    for (const resource of matched) {
        if (typeof resource.load !== 'function') continue
        await safeCall(resource.load, [ctx], `加载 "${resource.name}"`)
        loaded.push(resource.name)
    }

    if (loaded.length) {
        console.log(`[Resources] 应用 "${appName}" 已加载:`, loaded.join(', '))
    }
    return loaded
}

/** 卸载所有资源（幂等） */
export async function unloadAllResources() {
    const toUnload = sortByOrder(resources)
        .filter(r => typeof r.unload === 'function')
        .reverse() // 卸载顺序与加载顺序相反，符合依赖关系

    for (const resource of toUnload) {
        await safeCall(resource.unload, [], `卸载 "${resource.name}"`)
    }
}

/** 获取资源清单的只读快照（调试用） */
export function getResourceManifest() {
    return resources.map(({ name, apps, enabled, order }) => ({
        name,
        apps: Array.isArray(apps) ? apps : apps === '*' ? '*' : '(fn)',
        enabled: enabled !== false,
        order: order ?? 0,
    }))
}

export default resources