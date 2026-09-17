/**
 * 调用后端 IP 地理检测接口
 * 接口返回 Cloudflare 标准字段：{ country, city, ... }
 * @returns {Promise<{ country: string, city?: string } | null>}
 */
export async function detectCountry() {
    try {
        const res = await fetch('https://api.undz.cn/ip/v1/get', {
            method: 'GET',
            headers: { accept: 'application/json' },
            signal: AbortSignal.timeout(5000),   // 5 秒超时
        })
        if (!res.ok) return null
        const data = await res.json()
        // CF 标准字段：country = 'CN' | 'US' | ...
        return { country: data.country || '', city: data.city || '' }
    } catch {
        return null   // 网络失败/超时 → 当作未知，不弹窗
    }
}

/** 是否为中国 */
export function isChina(country) {
    return country === 'CN' || country === 'CHINA'
}