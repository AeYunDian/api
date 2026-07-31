// ============================================================
// 文章管理 Worker
// 集成 online.undz.cn 认证，使用 GitHub 存储文章
// ============================================================

import { TAG_LOGGEDIN, TAG_NOT_LOGGEDIN, TAG_BANNED, checkAuth } from './online.undz.cn.js';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { parse } from 'cookie';
import { homePage, articlePage, errorPage } from './ayyd_template.js';

// ---------- 常量 ----------
const GITHUB_API = 'https://api.github.com';
const REPO = 'AeYunDian/alyd';
const INDEX_PATH = 'index.xml';
const CONFIG_PATH = 'config.xml';
const ARTICLES_DIR = 'p/';

// 权限位定义
const PERM_VIEW = 0b0001;
const PERM_EDIT_OWN = 0b0010;
const PERM_EDIT_ALL = 0b0100;
const PERM_DEL_OWN = 0b1000;
const PERM_DEL_ALL = 0b10000;

// ---------- CORS ----------
function corsHeaders(request) {
    const origin = request.headers.get('Origin');
    const headers = {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Cookie',
        'Access-Control-Max-Age': '86400',
    };
    headers['Access-Control-Allow-Origin'] = origin || '*';
    return headers;
}

function handleOptions(request) {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders({ headers: { Origin: '' } }),
            ...extraHeaders,
        },
    });
}

// ---------- GitHub API 操作 ----------
async function getGitHubFile(path, token) {
    const url = `${GITHUB_API}/repos/${REPO}/contents/${encodeURIComponent(path)}`;
    const resp = await fetch(url, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
        },
    });
    if (resp.status === 404) return null;
    if (!resp.ok) throw new Error(`GitHub API error: ${resp.status}`);
    const data = await resp.json();
    const content = atob(data.content.replace(/\n/g, ''));
    return { content, sha: data.sha };
}

async function updateGitHubFile(path, content, message, token, sha = null) {
    const url = `${GITHUB_API}/repos/${REPO}/contents/${encodeURIComponent(path)}`;
    const body = {
        message,
        content: btoa(content),
        branch: 'main',
    };
    if (sha) body.sha = sha;
    const resp = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`GitHub update error: ${resp.status}`);
    return await resp.json();
}

async function deleteGitHubFile(path, message, token, sha) {
    const url = `${GITHUB_API}/repos/${REPO}/contents/${encodeURIComponent(path)}`;
    const body = { message, sha, branch: 'main' };
    const resp = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`GitHub delete error: ${resp.status}`);
    return await resp.json();
}

// ---------- XML 解析 ----------
const xmlParser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: false,
    trimValues: true,
    parseTagValue: false,
});
const xmlBuilder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    indentBy: '  ',
});

function parseXML(text) {
    return xmlParser.parse(text);
}
function buildXML(obj) {
    return xmlBuilder.build(obj);
}

// ---------- index.xml ----------
async function getIndex(token) {
    const result = await getGitHubFile(INDEX_PATH, token);
    if (!result) return { articles: [], sha: null };
    const parsed = parseXML(result.content);
    const articles = parsed?.articles?.article || [];
    return { articles: Array.isArray(articles) ? articles : [articles], sha: result.sha };
}

async function saveIndex(articles, message, token, sha = null) {
    const xmlObj = { articles: { article: articles } };
    const xml = buildXML(xmlObj);
    await updateGitHubFile(INDEX_PATH, xml, message, token, sha);
}

// ---------- config.xml ----------
async function getConfig(token) {
    const result = await getGitHubFile(CONFIG_PATH, token);
    if (!result) {
        const defaultConfig = { users: { user: [] } };
        const xml = buildXML(defaultConfig);
        await updateGitHubFile(CONFIG_PATH, xml, 'Init config.xml', token);
        return { users: {}, sha: null };
    }
    const parsed = parseXML(result.content);
    const users = parsed?.users?.user || [];
    const userMap = {};
    for (const u of (Array.isArray(users) ? users : [users])) {
        const id = u.id;
        if (id) userMap[id] = parseInt(u.permissions || '0', 10);
    }
    return { users: userMap, sha: result.sha };
}

// ---------- 文章解析 ----------
function parseArticleXML(xmlText) {
    const parsed = parseXML(xmlText);
    const root = parsed.article || parsed;
    const getText = (tag) => {
        const val = root[tag];
        return val ? String(val).trim() : '';
    };
    let content = '';
    if (root.content) {
        if (typeof root.content === 'string') content = root.content;
        else if (root.content['#text']) content = root.content['#text'];
        else if (root.content['#cdata']) content = root.content['#cdata'];
        else content = JSON.stringify(root.content);
    }
    return {
        title: getText('title'),
        mainAuthor: getText('mainAuthor'),
        authors: getText('authors'),
        created: getText('created'),
        modified: getText('modified'),
        tags: getText('tags'),
        public: getText('public') !== 'false',
        summary: getText('summary'),
        content,
        slug: getText('slug'),
    };
}

function buildArticleXML(article) {
    const obj = {
        article: {
            title: article.title || '',
            mainAuthor: article.mainAuthor || '',
            authors: article.authors || '',
            created: article.created || new Date().toISOString(),
            modified: article.modified || new Date().toISOString(),
            tags: article.tags || '',
            public: article.public !== false ? 'true' : 'false',
            summary: article.summary || '',
            content: article.content || '',
        }
    };
    return buildXML(obj);
}

// ---------- 权限辅助 ----------
function getUserPermissions(userId, config) {
    if (!userId) return 0;
    return config.users[String(userId)] || 0;
}

function canEditArticle(user, article, permissions) {
    if (!user) return false;
    const own = (permissions & PERM_EDIT_OWN) && user.username === article.mainAuthor;
    const all = (permissions & PERM_EDIT_ALL);
    return own || all;
}

function canDeleteArticle(user, article, permissions) {
    if (!user) return false;
    const own = (permissions & PERM_DEL_OWN) && user.username === article.mainAuthor;
    const all = (permissions & PERM_DEL_ALL);
    return own || all;
}

// ---------- 主 Worker ----------
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;
        const token = env.PERACCKEY;
        if (!token) {
            return jsonResponse({ error: 'Missing PERACCKEY' }, 500);
        }

        if (method === 'OPTIONS') return handleOptions(request);

        // 认证
        const [status, user] = await checkAuth(request, env);
        const isLoggedIn = (status === TAG_LOGGEDIN);
        const userId = isLoggedIn ? String(user.id) : null;

        // 读取权限
        const config = await getConfig(token);
        const permissions = getUserPermissions(userId, config);

        const cors = corsHeaders(request);

        try {
            // ---------- 首页 ----------
            if (path === '/' && method === 'GET') {
                const index = await getIndex(token);
                const articles = index.articles.map(a => ({
                    slug: a.slug || '',
                    title: a.title || '',
                    mainAuthor: a.mainAuthor || '',
                    authors: a.authors || '',
                    created: a.created || '',
                    modified: a.modified || '',
                    tags: a.tags || '',
                    public: a.public !== 'false',
                    summary: a.summary || '',
                }));
                const html = homePage(articles, user, permissions);
                return new Response(html, {
                    status: 200,
                    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
                });
            }

            // ---------- 文章详情 ----------
            const match = path.match(/^\/p\/(.+)\.php$/);
            if (match && method === 'GET') {
                const slug = match[1];
                const filePath = `${ARTICLES_DIR}${slug}.xml`;
                const result = await getGitHubFile(filePath, token);
                if (!result) {
                    return new Response(errorPage(404), { status: 404, headers: { 'Content-Type': 'text/html' } });
                }
                const article = parseArticleXML(result.content);
                const html = articlePage(article);
                return new Response(html, {
                    status: 200,
                    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
                });
            }

            // ---------- API ----------
            if (path.startsWith('/api/')) {
                // 状态
                if (path === '/api/auth/status' && method === 'GET') {
                    if (isLoggedIn) return jsonResponse({ loggedIn: true, user }, 200, cors);
                    else return jsonResponse({ loggedIn: false }, 200, cors);
                }

                // 权限
                if (path === '/api/auth/permissions' && method === 'GET') {
                    return jsonResponse({ permissions }, 200, cors);
                }

                // 文章列表
                if (path === '/api/articles' && method === 'GET') {
                    const index = await getIndex(token);
                    const articles = index.articles.map(a => ({
                        slug: a.slug || '',
                        title: a.title || '',
                        mainAuthor: a.mainAuthor || '',
                        authors: a.authors || '',
                        created: a.created || '',
                        modified: a.modified || '',
                        tags: a.tags || '',
                        public: a.public !== 'false',
                        summary: a.summary || '',
                    }));
                    return jsonResponse({ articles }, 200, cors);
                }

                // 获取单篇
                const apiMatch = path.match(/^\/api\/articles\/([^/]+)$/);
                if (apiMatch && method === 'GET') {
                    const slug = apiMatch[1];
                    const filePath = `${ARTICLES_DIR}${slug}.xml`;
                    const result = await getGitHubFile(filePath, token);
                    if (!result) return jsonResponse({ error: 'Not found' }, 404, cors);
                    const article = parseArticleXML(result.content);
                    return jsonResponse({ article }, 200, cors);
                }

                // 创建
                if (path === '/api/articles' && method === 'POST') {
                    if (!isLoggedIn) return jsonResponse({ error: 'Unauthorized' }, 401, cors);
                    if ((permissions & (PERM_EDIT_OWN | PERM_EDIT_ALL)) === 0) {
                        return jsonResponse({ error: 'Permission denied' }, 403, cors);
                    }
                    const body = await request.json().catch(() => null);
                    if (!body || !body.title || !body.content) {
                        return jsonResponse({ error: 'Missing title or content' }, 400, cors);
                    }
                    let slug = body.slug;
                    if (!slug) {
                        slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                    }
                    const index = await getIndex(token);
                    if (index.articles.some(a => a.slug === slug)) {
                        return jsonResponse({ error: 'Slug already exists' }, 409, cors);
                    }
                    const now = new Date().toISOString();
                    const articleData = {
                        title: body.title,
                        mainAuthor: body.mainAuthor || (user ? user.username : ''),
                        authors: body.authors || (user ? user.username : ''),
                        created: now,
                        modified: now,
                        tags: body.tags || '',
                        public: body.public !== false,
                        summary: body.summary || '',
                        content: body.content,
                    };
                    const xml = buildArticleXML(articleData);
                    await updateGitHubFile(`${ARTICLES_DIR}${slug}.xml`, xml, `Add article ${slug}`, token);
                    const newEntry = {
                        slug,
                        title: articleData.title,
                        mainAuthor: articleData.mainAuthor,
                        authors: articleData.authors,
                        created: articleData.created,
                        modified: articleData.modified,
                        tags: articleData.tags,
                        public: articleData.public ? 'true' : 'false',
                        summary: articleData.summary,
                    };
                    index.articles.push(newEntry);
                    await saveIndex(index.articles, `Add ${slug} to index`, token, index.sha);
                    return jsonResponse({ success: true, slug }, 201, cors);
                }

                // 更新
                if (apiMatch && method === 'PUT') {
                    const slug = apiMatch[1];
                    if (!isLoggedIn) return jsonResponse({ error: 'Unauthorized' }, 401, cors);
                    const filePath = `${ARTICLES_DIR}${slug}.xml`;
                    const existing = await getGitHubFile(filePath, token);
                    if (!existing) return jsonResponse({ error: 'Not found' }, 404, cors);
                    const oldArticle = parseArticleXML(existing.content);
                    if (!canEditArticle(user, oldArticle, permissions)) {
                        return jsonResponse({ error: 'Permission denied' }, 403, cors);
                    }
                    const body = await request.json().catch(() => null);
                    if (!body) return jsonResponse({ error: 'Invalid request' }, 400, cors);
                    const updated = { ...oldArticle, ...body, modified: new Date().toISOString() };
                    updated.title = updated.title || oldArticle.title;
                    updated.content = updated.content || oldArticle.content;
                    const xml = buildArticleXML(updated);
                    await updateGitHubFile(filePath, xml, `Update ${slug}`, token, existing.sha);
                    const index = await getIndex(token);
                    const idx = index.articles.findIndex(a => a.slug === slug);
                    if (idx !== -1) {
                        index.articles[idx].title = updated.title;
                        index.articles[idx].mainAuthor = updated.mainAuthor;
                        index.articles[idx].authors = updated.authors;
                        index.articles[idx].modified = updated.modified;
                        index.articles[idx].tags = updated.tags;
                        index.articles[idx].public = updated.public ? 'true' : 'false';
                        index.articles[idx].summary = updated.summary;
                        await saveIndex(index.articles, `Update index for ${slug}`, token, index.sha);
                    }
                    return jsonResponse({ success: true }, 200, cors);
                }

                // 删除
                if (apiMatch && method === 'DELETE') {
                    const slug = apiMatch[1];
                    if (!isLoggedIn) return jsonResponse({ error: 'Unauthorized' }, 401, cors);
                    const filePath = `${ARTICLES_DIR}${slug}.xml`;
                    const existing = await getGitHubFile(filePath, token);
                    if (!existing) return jsonResponse({ error: 'Not found' }, 404, cors);
                    const article = parseArticleXML(existing.content);
                    if (!canDeleteArticle(user, article, permissions)) {
                        return jsonResponse({ error: 'Permission denied' }, 403, cors);
                    }
                    await deleteGitHubFile(filePath, `Delete ${slug}`, token, existing.sha);
                    const index = await getIndex(token);
                    const filtered = index.articles.filter(a => a.slug !== slug);
                    await saveIndex(filtered, `Remove ${slug} from index`, token, index.sha);
                    return jsonResponse({ success: true }, 200, cors);
                }

                return jsonResponse({ error: 'API not found' }, 404, cors);
            }

            // 其他 404
            return new Response(errorPage(404), { status: 404, headers: { 'Content-Type': 'text/html' } });

        } catch (err) {
            console.error(err);
            return new Response(errorPage(500), { status: 500, headers: { 'Content-Type': 'text/html' } });
        }
    },
};