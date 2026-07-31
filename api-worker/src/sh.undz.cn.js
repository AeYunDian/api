import { homePage, articlePage, errorPage } from './ayyd_template';
import { XMLParser } from 'fast-xml-parser';

// ---------- 加密 / 解密辅助 ----------
async function getKey(env) {
    const keyStr = env.PRIVATE_KEY;
    if (!keyStr) return null;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyStr);
    return await crypto.subtle.digest('SHA-256', keyData); // 32字节
}

async function decrypt(encryptedBase64, keyBuffer) {
    if (!keyBuffer) return encryptedBase64; // 不加密直接返回
    try {
        const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);
        const key = await crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-GCM' }, false, ['decrypt']);
        const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
        return new TextDecoder().decode(plaintext);
    } catch (e) {
        throw new Error('Decryption failed: ' + e.message);
    }
}

async function fetchAndDecrypt(url, env) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Fetch failed with status ${resp.status}`);
    const text = await resp.text();
    if (env.PRIVATE_KEY) {
        const keyBuffer = await getKey(env);
        return await decrypt(text, keyBuffer);
    } else {
        return text;
    }
}

// ---------- XML 解析（使用 fast-xml-parser）----------
function parseXML(xmlText) {
    const parser = new XMLParser({
        ignoreAttributes: false,
        parseAttributeValue: false,
        trimValues: true,
        parseTagValue: false, // 保持字符串原样
    });
    const result = parser.parse(xmlText);
    return result;
}

// 从 index.xml 提取文章列表
function extractArticlesFromIndex(parsed) {
    // 结构: { articles: { article: [ ... ] } }
    let articles = parsed?.articles?.article;
    if (!articles) return [];
    // 确保是数组
    if (!Array.isArray(articles)) articles = [articles];

    const result = [];
    for (const item of articles) {
        const slug = item.slug || '';
        if (!slug) continue;
        const publicVal = (item.public || '').trim();
        const isPublic = publicVal === '' || publicVal.toLowerCase() === 'true';
        result.push({
            slug,
            title: item.title || '',
            mainAuthor: item.mainAuthor || '',
            authors: item.authors || '',
            created: item.created || '',
            modified: item.modified || '',
            tags: item.tags || '',
            public: isPublic,
            summary: item.summary || '',
        });
    }
    result.sort((a, b) => new Date(b.created) - new Date(a.created));
    return result;
}

// 从文章 xml 提取完整信息
function extractArticleFromXML(parsed) {
    const root = parsed.article || parsed; // 防止根节点命名
    const getText = (tag) => {
        const val = root[tag];
        return val ? String(val).trim() : '';
    };
    const publicVal = getText('public');
    const isPublic = publicVal === '' || publicVal.toLowerCase() === 'true';
    // content 可能是对象或字符串
    let content = '';
    if (root.content) {
        // 如果 content 是对象（有 #text 或 #cdata）则取其内容
        if (typeof root.content === 'string') {
            content = root.content;
        } else if (root.content['#text']) {
            content = root.content['#text'];
        } else if (root.content['#cdata']) {
            content = root.content['#cdata'];
        } else {
            // 复杂情况，尝试转字符串
            content = JSON.stringify(root.content);
        }
    }
    return {
        title: getText('title'),
        mainAuthor: getText('mainAuthor'),
        authors: getText('authors'),
        created: getText('created'),
        modified: getText('modified'),
        tags: getText('tags'),
        public: isPublic,
        summary: getText('summary'),
        content,
    };
}

// ---------- Worker 主逻辑 ----------
export default {
    async fetch(request, env) {
        try {
            const url = new URL(request.url);
            const path = url.pathname;

            // 处理 favicon.ico（避免触发 404 错误页）
            if (path === '/favicon.ico') {
                return new Response(null, { status: 204 });
            }

            // ---------- 首页 ----------
            if (path === '/') {
                const tab = parseInt(url.searchParams.get('tab') || '1', 10);
                const page = Math.max(1, tab);

                const indexUrl = 'https://raw.githubusercontent.com/AeYunDian/alyd/main/index.xml';
                let xmlText;
                try {
                    xmlText = await fetchAndDecrypt(indexUrl, env);
                } catch (e) {
                    return new Response(errorPage(500, 'Failed to fetch index'), {
                        status: 500,
                        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
                    });
                }

                let parsed;
                try {
                    parsed = parseXML(xmlText);
                } catch (e) {
                    return new Response(errorPage(500, 'Failed to parse index XML'), {
                        status: 500,
                        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
                    });
                }

                let articles = extractArticlesFromIndex(parsed).filter(a => a.public !== false);
                const perPage = 10;
                const totalPages = Math.ceil(articles.length / perPage);
                const currentPage = Math.min(page, totalPages || 1);
                const start = (currentPage - 1) * perPage;
                const end = Math.min(start + perPage, articles.length);
                const pageArticles = articles.slice(start, end);

                const html = homePage(pageArticles, currentPage, totalPages);
                return new Response(html, {
                    status: 200,
                    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
                });
            }

            // ---------- 文章页 /p/xxx.php ----------
            const match = path.match(/^\/p\/(.+)\.php$/);
            if (match) {
                const slug = match[1];
                const articleUrl = `https://raw.githubusercontent.com/AeYunDian/alyd/main/p/${slug}.xml`;

                let xmlText;
                try {
                    xmlText = await fetchAndDecrypt(articleUrl, env);
                } catch (e) {
                    return new Response(errorPage(404, 'Article not found'), {
                        status: 404,
                        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
                    });
                }

                let parsed;
                try {
                    parsed = parseXML(xmlText);
                } catch (e) {
                    return new Response(errorPage(500, 'Failed to parse article XML'), {
                        status: 500,
                        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
                    });
                }

                let article;
                try {
                    article = extractArticleFromXML(parsed);
                } catch (e) {
                    return new Response(errorPage(500, 'Failed to extract article data'), {
                        status: 500,
                        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
                    });
                }

                // 如果文章不公开，依然返回（只对首页隐藏）
                const html = articlePage(article);
                return new Response(html, {
                    status: 200,
                    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
                });
            }

            // ---------- 其他路径 404 ----------
            return new Response(errorPage(404, 'Page not found'), {
                status: 404,
                headers: { 'Content-Type': 'text/html;charset=UTF-8' },
            });

        } catch (err) {
            // 全局捕获
            return new Response(errorPage(500, 'Internal Server Error'), {
                status: 500,
                headers: { 'Content-Type': 'text/html;charset=UTF-8' },
            });
        }
    },
};