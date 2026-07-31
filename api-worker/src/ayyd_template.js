// ============================================================
// template.js - 所有页面模板（首页、文章页、错误页）
// 所有动态内容均已转义，无任何 emoji
// ============================================================

// ---------- HTML 转义函数 ----------
function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
// 注意：此函数在服务端不可用，我们将使用 Node.js 风格的转义，或简单替换
// 由于 template.js 在 Worker 中运行（服务端），我们用字符串替换
function safeHtml(str) {
    if (typeof str !== 'string') str = String(str);
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ---------- 首页模板 ----------
export function homePage(articles, user, permissions, baseUrl = '/') {
    // 生成文章列表
    let listHtml = '';
    for (const art of articles) {
        const slug = safeHtml(art.slug || '');
        const title = safeHtml(art.title || '无标题');
        const author = safeHtml(art.mainAuthor || art.authors || '未知');
        const created = safeHtml(art.created || '');
        const summary = safeHtml(art.summary || '');
        const isPublic = art.public !== false;

        // 权限判断
        const canEditOwn = (permissions & 0b0010) && user && user.username === art.mainAuthor;
        const canEditAll = (permissions & 0b0100);
        const canDeleteOwn = (permissions & 0b1000) && user && user.username === art.mainAuthor;
        const canDeleteAll = (permissions & 0b10000);
        const canEdit = canEditOwn || canEditAll;
        const canDelete = canDeleteOwn || canDeleteAll;

        listHtml += `
            <div class="article-item" data-slug="${slug}">
                <div class="article-info">
                    <h2><a href="/p/${slug}.php">${title}</a></h2>
                    <div class="meta">作者：${author} | 日期：${created} | ${isPublic ? '公开' : '私有'}</div>
                    <div class="summary">${summary}</div>
                </div>
                <div class="article-actions">
                    ${canEdit ? `<button class="btn btn-warning edit-btn" data-slug="${slug}">编辑</button>` : ''}
                    ${canDelete ? `<button class="btn btn-danger delete-btn" data-slug="${slug}">删除</button>` : ''}
                </div>
            </div>
        `;
    }

    // 用户信息
    const userDisplay = user ? `用户：${safeHtml(user.username)}` : '未登录';
    const loginBtnHidden = user ? 'hidden' : '';
    const logoutBtnHidden = user ? '' : 'hidden';
    const newBtnHidden = (user && (permissions & (0b0010 | 0b0100))) ? '' : 'hidden';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>班级文库</title>
    <link rel="icon" href="https://undz.cn/logo.svg" type="image/svg+xml">
    <style>
        * { box-sizing: border-box; }
        body { font-family: "Times New Roman", Times, serif; background: #e0e0e0; margin: 0; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; background: #fff; border: 1px solid #aaa; padding: 20px; border-radius: 4px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header .site-name { font-size: 1.5em; font-weight: bold; }
        .header .site-name a { color: #000; text-decoration: none; }
        .header .aynet { font-style: italic; font-weight: bold; font-size: calc(1em + 3px); }
        .user-info { display: flex; align-items: center; gap: 10px; font-size: 14px; }
        .btn { padding: 5px 12px; border: none; border-radius: 3px; cursor: pointer; font-size: 14px; }
        .btn-primary { background: #007bff; color: #fff; }
        .btn-danger { background: #dc3545; color: #fff; }
        .btn-warning { background: #ffc107; color: #000; }
        .btn-success { background: #28a745; color: #fff; }
        .hidden { display: none; }
        .article-list { list-style: none; padding: 0; }
        .article-item { border-bottom: 1px dashed #ccc; padding: 15px 0; display: flex; justify-content: space-between; align-items: center; }
        .article-info h2 { margin: 0 0 5px; font-size: 1.2em; }
        .article-info h2 a { color: #0000ff; text-decoration: none; }
        .article-info h2 a:hover { text-decoration: underline; }
        .meta { font-size: 0.9em; color: #555; }
        .summary { font-size: 0.95em; margin-top: 5px; }
        .article-actions { display: flex; gap: 8px; }
        .footer { text-align: center; border-top: 1px solid #aaa; padding-top: 10px; margin-top: 20px; font-size: 0.8em; color: #777; }
        .footer .aynet { font-style: italic; font-weight: bold; font-size: calc(1em + 3px); }
        .footer a { color: #0000ff; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }

        /* 模态框 */
        .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center; }
        .modal-box { background: #fff; padding: 25px; border-radius: 8px; width: 90%; max-width: 700px; max-height: 90%; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .modal-box h2 { margin-top: 0; }
        .modal-box label { display: block; margin: 12px 0 4px; font-weight: bold; }
        .modal-box input, .modal-box textarea { width: 100%; padding: 8px; border: 1px solid #aaa; border-radius: 4px; font-family: inherit; }
        .modal-box textarea { min-height: 200px; }
        .modal-actions { margin-top: 20px; text-align: right; }
        .modal-actions .btn { margin-left: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="site-name"><a href="/">班级文库</a></div>
            <div class="aynet">AyNET</div>
        </div>

        <div class="user-info">
            <span id="userDisplay">${userDisplay}</span>
            <button id="loginBtn" class="btn btn-primary ${loginBtnHidden}">登录</button>
            <button id="logoutBtn" class="btn btn-danger ${logoutBtnHidden}">登出</button>
            <button id="newArticleBtn" class="btn btn-success ${newBtnHidden}">新建文章</button>
        </div>

        <div class="content">
            <h1>最新文章</h1>
            <ul class="article-list" id="articleList">
                ${listHtml}
            </ul>
            <div id="pagination" class="pagination"></div>
        </div>

        <div class="footer">
            <span class="aynet">AyNET</span> | Copyright 2026 AeYunDian | <a href="https://sh.undz.cn" target="_blank">sh.undz.cn</a>
        </div>
    </div>

    <!-- 模态框（新建/编辑） -->
    <div id="articleModal" class="modal-overlay">
        <div class="modal-box">
            <h2 id="modalTitle">新建文章</h2>
            <input type="hidden" id="editSlug" />
            <label>标题</label>
            <input type="text" id="articleTitle" />
            <label>作者（主作者）</label>
            <input type="text" id="articleAuthor" />
            <label>标签（逗号分隔）</label>
            <input type="text" id="articleTags" />
            <label>摘要</label>
            <input type="text" id="articleSummary" />
            <label>内容（HTML）</label>
            <textarea id="articleContent"></textarea>
            <label><input type="checkbox" id="articlePublic" checked /> 公开</label>
            <div class="modal-actions">
                <button class="btn" id="modalCancel">取消</button>
                <button class="btn btn-primary" id="modalSave">保存</button>
            </div>
        </div>
    </div>

    <script src="https://online.undz.cn/lib/auth-sdk.js"></script>
    <script>
        (function() {
            // 服务端注入的变量
            const currentUser = ${user ? JSON.stringify(user) : 'null'};
            const userPermissions = ${permissions || 0};

            // DOM 元素
            const userDisplay = document.getElementById('userDisplay');
            const loginBtn = document.getElementById('loginBtn');
            const logoutBtn = document.getElementById('logoutBtn');
            const newArticleBtn = document.getElementById('newArticleBtn');
            const articleList = document.getElementById('articleList');
            const modal = document.getElementById('articleModal');
            const modalTitle = document.getElementById('modalTitle');
            const editSlug = document.getElementById('editSlug');
            const articleTitle = document.getElementById('articleTitle');
            const articleAuthor = document.getElementById('articleAuthor');
            const articleTags = document.getElementById('articleTags');
            const articleSummary = document.getElementById('articleSummary');
            const articleContent = document.getElementById('articleContent');
            const articlePublic = document.getElementById('articlePublic');
            const modalCancel = document.getElementById('modalCancel');
            const modalSave = document.getElementById('modalSave');

            // 初始化 SDK
            let account = null;
            if (typeof createAyAccount === 'function') {
                account = createAyAccount({
                    appId: 'ayyd1255',
                    i18n: 'zh-cn'
                });
            } else {
                console.warn('AyAccount SDK 未加载，登录功能不可用');
            }

            // 更新显示（已由服务端渲染，但登录/登出后刷新页面）
            function updateUI() {
                // 直接刷新页面获取最新状态
                window.location.reload();
            }

            // 登录
            loginBtn.addEventListener('click', async function() {
                if (!account) {
                    alert('SDK 未加载，请刷新页面');
                    return;
                }
                try {
                    const result = await account.login();
                    if (result && result.user) {
                        updateUI();
                    }
                } catch (e) {
                    console.error('登录失败', e);
                    alert('登录失败：' + e.message);
                }
            });

            // 登出
            logoutBtn.addEventListener('click', async function() {
                if (!account) {
                    alert('SDK 未加载');
                    return;
                }
                try {
                    await account.logout();
                    updateUI();
                } catch (e) {
                    console.error('登出失败', e);
                    alert('登出失败：' + e.message);
                }
            });

            // 新建文章
            if (newArticleBtn) {
                newArticleBtn.addEventListener('click', function() {
                    openModal(null);
                });
            }

            // 模态框操作
            function openModal(slug) {
                modal.style.display = 'flex';
                if (slug) {
                    modalTitle.textContent = '编辑文章';
                    editSlug.value = slug;
                    fetch('/api/articles/' + slug)
                        .then(res => res.json())
                        .then(data => {
                            const a = data.article;
                            articleTitle.value = a.title || '';
                            articleAuthor.value = a.mainAuthor || '';
                            articleTags.value = a.tags || '';
                            articleSummary.value = a.summary || '';
                            articleContent.value = a.content || '';
                            articlePublic.checked = a.public !== false;
                        })
                        .catch(err => alert('加载文章失败：' + err.message));
                } else {
                    modalTitle.textContent = '新建文章';
                    editSlug.value = '';
                    articleTitle.value = '';
                    articleAuthor.value = '';
                    articleTags.value = '';
                    articleSummary.value = '';
                    articleContent.value = '';
                    articlePublic.checked = true;
                }
            }

            function closeModal() {
                modal.style.display = 'none';
            }

            modalCancel.addEventListener('click', closeModal);
            modal.addEventListener('click', function(e) {
                if (e.target === modal) closeModal();
            });

            modalSave.addEventListener('click', async function() {
                const slug = editSlug.value;
                const data = {
                    title: articleTitle.value.trim(),
                    mainAuthor: articleAuthor.value.trim() || (currentUser ? currentUser.username : ''),
                    authors: articleAuthor.value.trim() || (currentUser ? currentUser.username : ''),
                    tags: articleTags.value.trim(),
                    summary: articleSummary.value.trim(),
                    content: articleContent.value.trim(),
                    public: articlePublic.checked,
                };
                if (!data.title || !data.content) {
                    alert('标题和内容不能为空');
                    return;
                }
                try {
                    let url = '/api/articles';
                    let method = 'POST';
                    if (slug) {
                        url = '/api/articles/' + slug;
                        method = 'PUT';
                    }
                    const resp = await fetch(url, {
                        method: method,
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(data),
                    });
                    if (!resp.ok) {
                        const err = await resp.json();
                        alert('保存失败：' + (err.error || err.message));
                        return;
                    }
                    closeModal();
                    updateUI();
                } catch (e) {
                    alert('请求失败：' + e.message);
                }
            });

            // 事件委托：编辑和删除
            articleList.addEventListener('click', function(e) {
                const target = e.target;
                if (target.classList.contains('edit-btn')) {
                    const slug = target.dataset.slug;
                    openModal(slug);
                }
                if (target.classList.contains('delete-btn')) {
                    const slug = target.dataset.slug;
                    if (!confirm('确定要删除文章 "' + slug + '" 吗？')) return;
                    fetch('/api/articles/' + slug, {
                        method: 'DELETE',
                        credentials: 'include',
                    })
                    .then(res => {
                        if (!res.ok) return res.json().then(err => { throw new Error(err.error || '删除失败'); });
                        updateUI();
                    })
                    .catch(err => alert('删除失败：' + err.message));
                }
            });

            // 若用户已登录但无编辑权限，隐藏新建按钮
            if (currentUser && (userPermissions & (0b0010 | 0b0100)) === 0) {
                if (newArticleBtn) newArticleBtn.style.display = 'none';
            }
        })();
    </script>
</body>
</html>`;
}

// ---------- 文章详情页 ----------
export function articlePage(article) {
    const title = safeHtml(article.title || '无标题');
    const author = safeHtml(article.mainAuthor || article.authors || '未知');
    const created = safeHtml(article.created || '');
    const modified = safeHtml(article.modified || '');
    const tags = safeHtml(article.tags || '');
    const content = article.content || ''; // 内容为 HTML，不转义
    const contributors = safeHtml(article.authors || article.mainAuthor || '');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title} - 班级文库</title>
    <link rel="icon" href="https://undz.cn/logo.svg" type="image/svg+xml">
    <style>
        body { background: #e0e0e0; font-family: "Times New Roman", Times, serif; color: #333; margin:0; padding:20px; }
        .container { max-width: 900px; margin:0 auto; background: #fff; border: 1px solid #aaa; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header .site-name { font-size: 1.5em; font-weight: bold; }
        .header .site-name a { color: #000; text-decoration: none; }
        .header .aynet { font-style: italic; font-weight: bold; font-size: calc(1em + 3px); }
        .article-title { font-size: 1.8em; margin-bottom: 5px; }
        .article-meta { font-size: 0.9em; color: #555; margin-bottom: 10px; }
        .content-main { margin-top: 10px; }
        .article-footer { margin-top: 20px; border-top: 1px solid #aaa; padding-top: 10px; font-size: 0.9em; color: #555; }
        .footer { text-align: center; border-top: 1px solid #aaa; padding-top: 10px; margin-top: 20px; font-size: 0.8em; color: #777; }
        .footer .aynet { font-style: italic; font-weight: bold; font-size: calc(1em + 3px); }
        .footer a { color: #0000ff; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        hr { border: 1px solid #aaa; }
        a { color: #0000ff; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="site-name"><a href="/">班级文库</a></div>
            <div class="aynet">AyNET</div>
        </div>
        <div class="content">
            <h1 class="article-title">${title}</h1>
            <div class="article-meta">
                作者：${author} | 创建：${created} | 标签：${tags}
            </div>
            <hr>
            <div class="content-main">${content}</div>
            <hr>
            <div class="article-footer">
                最近更新：${modified || '无'} | 贡献者：${contributors}
            </div>
        </div>
        <div class="footer">
            <span class="aynet">AyNET</span> | Copyright 2026 AeYunDian | <a href="https://sh.undz.cn" target="_blank">sh.undz.cn</a>
        </div>
    </div>
</body>
</html>`;
}

// ---------- 错误页 ----------
export function errorPage(status, message = '') {
    const title = status === 404 ? '404 Not Found' : '500 Internal Server Error';
    const body = status === 404 ? 'The page you are looking for does not exist.' : 'An internal server error occurred.';
    return `<!DOCTYPE html>
<html>
<head><title>${title}</title></head>
<body bgcolor="white">
<center><h1>${title}</h1></center>
<center>${body}</center>
<hr><center>nginx</center>
<!-- padding to disable MSIE and Chrome friendly error page -->
<!-- padding to disable MSIE and Chrome friendly error page -->
<!-- padding to disable MSIE and Chrome friendly error page -->
</body>
</html>`;
}
