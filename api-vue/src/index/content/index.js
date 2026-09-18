/* ============================================================
   静态内容层（方案 B）
   —— 每个 .md 由 unplugin-vue-markdown 编译成 Vue SFC
   —— raw glob 用于构建时提取 frontmatter / 摘要 / 搜索索引
   —— component glob 用于按需加载文章组件
   —— 删除 renderMarkdown / bindMarkdownTabs / preprocessContainers
   ============================================================ */

const rawModules = import.meta.glob("./posts/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const componentModules = import.meta.glob("./posts/*.md");

/* ---------- Frontmatter 解析（支持多行数组） ---------- */
function parseFrontmatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) return { data: {}, body: raw };

  const lines = m[1].split(/\r?\n/);
  const data = {};
  let currentKey = null;
  let currentList = null;

  for (const line of lines) {
    const listMatch = /^\s*-\s+(.*)$/.exec(line);
    if (listMatch && currentKey) {
      if (!currentList) {
        currentList = [];
        data[currentKey] = currentList;
      }
      currentList.push(listMatch[1].trim().replace(/^["']|["']$/g, ""));
      continue;
    }

    const kvMatch = /^([a-zA-Z][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (kvMatch) {
      const key = kvMatch[1];
      const val = kvMatch[2].trim();
      currentKey = key;
      currentList = null;

      if (val === "") {
        data[key] = [];
        currentList = data[key];
      } else if (val.startsWith("[") && val.endsWith("]")) {
        data[key] = val
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else if (val === "true" || val === "false") {
        data[key] = val === "true";
      } else {
        data[key] = val.replace(/^["']|["']$/g, "");
      }
    }
  }
  return { data, body: m[2] };
}

/* ---------- 清理正文，用于摘要与搜索 ----------
   —— 不再需要处理 ::: 容器，因为 SFC 编译后容器会变成组件标签
   —— 这里只需剥掉 script / 组件标签 / markdown 标记
---------------------------------------------- */
function toPlainText(body) {
  return (
    body
      // 去掉 <script setup> ... </script>
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      // 去掉 <style> ... </style>
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      // 去掉 Vue 组件标签（保留内部文本）
      .replace(/<\/?[A-Z][\w-]*(\s[^>]*)?>/g, "")
      // 去掉 HTML 注释
      .replace(/<!--[\s\S]*?-->/g, "")
      // 去掉 markdown 标记
      .replace(/[#>*`\[\]()\-!\n\r]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/* ---------- 构建文章对象 ---------- */
function buildPost(filePath, raw) {
  const slug = filePath.replace("./posts/", "").replace(/\.md$/, "");
  const { data, body } = parseFrontmatter(raw);

  if (data.draft === true) return null;

  // 标题兜底：优先 frontmatter，其次 h1，最后 slug
  const h1Match = /^#\s+(.+)$/m.exec(body);
  const fallbackTitle = h1Match ? h1Match[1].trim() : slug;

  const catRaw = data.category ?? data.categories ?? "未分类";
  const category = Array.isArray(catRaw) ? catRaw[0] : catRaw;
  const tagsRaw = data.tags ?? data.tag ?? [];
  const tags = Array.isArray(tagsRaw) ? tagsRaw : [tagsRaw];

  const fileDate = /\.(\d{4}-\d{2}-\d{2})\.md$/.exec(filePath)?.[1];
  const date = data.date
    ? String(data.date).slice(0, 10)
    : fileDate || "1970-01-01";

  const plainText = toPlainText(body);

  return {
    slug,
    title: data.title || fallbackTitle,
    date,
    category,
    tags,
    listed: data.listed !== false,
    summary: data.summary || plainText.slice(0, 100),
    featured: Boolean(data.featured),
    readingMinutes: Math.max(1, Math.round(plainText.length / 350)),
    // ★ 新增：搜索用的纯文本索引
    searchText: plainText.toLowerCase(),
    // ★ 新增：异步组件加载函数（由 unplugin-vue-markdown 提供）
    component: componentModules[filePath],
  };
}

/* ---------- 全量（详情页用，含 listed:false） ---------- */
export const posts = Object.entries(rawModules)
  .map(([file, raw]) => buildPost(file, raw))
  .filter(Boolean)
  .sort((a, b) => b.date.localeCompare(a.date));

/* ---------- 列表可见（列表/分类/标签/归档/推荐/侧边栏） ---------- */
export const listedPosts = posts.filter((p) => p.listed);

/* ---------- 聚合：仅统计列表可见 ---------- */
export const categories = [...new Set(listedPosts.map((p) => p.category))]
  .filter(Boolean)
  .sort();

export const tags = [...new Set(listedPosts.flatMap((p) => p.tags))]
  .filter(Boolean)
  .sort();

/* ---------- 查询：详情页走全量 ---------- */
export function getPost(slug) {
  return posts.find((p) => p.slug === slug);
}

/* ---------- 查询：列表相关走 listedPosts ---------- */
export function getPostsByCategory(cat) {
  return listedPosts.filter((p) => p.category === cat);
}
export function getPostsByTag(tag) {
  return listedPosts.filter((p) => p.tags.includes(tag));
}
export function getFeatured() {
  return listedPosts.filter((p) => p.featured);
}
export function getRecent(n = 6) {
  return listedPosts.slice(0, n);
}

export function getArchive() {
  const map = {};
  for (const p of listedPosts) {
    const y = p.date.slice(0, 4);
    (map[y] ??= []).push(p);
  }
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
}

/* ---------- 全站搜索（供 SearchView 使用） ----------
   返回合并排序后的结果，已经是统一结构
---------------------------------------------- */
export function searchPosts(keyword) {
  const q = String(keyword || "")
    .trim()
    .toLowerCase();
  if (!q) return [];
  return listedPosts.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      p.searchText.includes(q),
  );
}
