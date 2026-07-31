// template.js
export function homePage(articles, currentPage, totalPages, baseUrl = '/') {
    let listHtml = '';
    for (const art of articles) {
        const title = art.title || '无标题';
        const slug = art.slug || '';
        const authorDisplay = art.mainAuthor || art.authors || '';
        const created = art.created || '';
        const summary = art.summary || '';
        listHtml += `<div class="article-item">
            <h2><a href="/p/${slug}.php">${title}</a></h2>
            <div class="meta">作者：${authorDisplay} | 日期：${created}</div>
            <div class="summary">${summary}</div>
        </div>`;
    }

    let pageNav = '';
    if (totalPages > 1) {
        pageNav += '<div class="pagination">';
        if (currentPage > 1) {
            pageNav += `<a href="${baseUrl}?tab=${currentPage - 1}">上一页</a> `;
        }
        for (let i = 1; i <= totalPages; i++) {
            pageNav += (i === currentPage)
                ? `<strong>${i}</strong> `
                : `<a href="${baseUrl}?tab=${i}">${i}</a> `;
        }
        if (currentPage < totalPages) {
            pageNav += `<a href="${baseUrl}?tab=${currentPage + 1}">下一页</a>`;
        }
        pageNav += '</div>';
    }

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>班级文库</title>
    <link rel="icon" href="https://undz.cn/logo.svg" type="image/svg+xml">
    <style>
        body { background: #e0e0e0; font-family: "Times New Roman", Times, serif; color: #333; margin:0; padding:20px; }
        .container { max-width: 900px; margin:0 auto; background: #fff; border: 1px solid #aaa; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header .site-name { font-size: 1.5em; font-weight: bold; }
        .header .site-name a { color: #000; text-decoration: none; }
        .header .aynet { font-style: italic; font-weight: bold; font-size: calc(1em + 3px); }
        .article-item { margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
        .article-item h2 { margin: 0 0 5px; font-size: 1.2em; }
        .article-item h2 a { color: #0000ff; text-decoration: none; }
        .article-item h2 a:hover { text-decoration: underline; }
        .meta { font-size: 0.9em; color: #555; }
        .summary { margin-top: 5px; font-size: 0.95em; }
        .pagination { margin-top: 20px; text-align: center; }
        .pagination a { color: #0000ff; text-decoration: none; margin: 0 5px; }
        .pagination a:hover { text-decoration: underline; }
        .pagination strong { margin: 0 5px; }
        .footer { text-align: center; border-top: 1px solid #aaa; padding-top: 10px; margin-top: 20px; font-size: 0.8em; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="site-name"><a href="/">班级文库</a></div>
            <div class="aynet">AyNET</div>
        </div>
        <div class="content">
            <h1>最新文章</h1>
            ${listHtml}
            ${pageNav}
        </div>
        <div class="footer">
            &copy; 2026 班级学习资料 | 基于 Cloudflare Workers
        </div>
    </div>
</body>
</html>`;
}

export function articlePage(article) {
    const title = article.title || '无标题';
    const authorDisplay = article.mainAuthor || article.authors || '';
    const created = article.created || '';
    const modified = article.modified || '';
    const tags = article.tags || '';
    const content = article.content || '';
    const contributors = article.authors || article.mainAuthor || '';

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
                作者：${authorDisplay} | 创建：${created}
                ${tags ? ` | 标签：${tags}` : ''}
            </div>
            <hr>
            <div class="content-main">${content}</div>
            <hr>
            <div class="article-footer">
                最近更新：${modified || '无'} | 贡献者：${contributors}
            </div>
        </div>
        <div class="footer">
            &copy; 2026 班级学习资料 | 基于 Cloudflare Workers
        </div>
    </div>
</body>
</html>`;
}

export function errorPage(status, message = '') {
    const title = status === 404 ? '404 Not Found' : '500 Internal Server Error';
    const body = status === 404 ? 'The page you are looking for does not exist.' : 'An internal server error occurred.';
    return `<!DOCTYPE html>
<html>
<head><title>${title}</title></head>
<body>
<center><h1>${title}</h1></center>
<center>${body}</center>
<hr><center>nginx</center>
<!-- a padding to disable MSIE and Chrome friendly error page -->
<!-- a padding to disable MSIE and Chrome friendly error page -->
<!-- a padding to disable MSIE and Chrome friendly error page -->
</body>
</html>`;
}