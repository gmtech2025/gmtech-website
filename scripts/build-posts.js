const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");
const { marked } = require("marked");
const sanitizeHtml = require("sanitize-html");

const root = process.cwd();
const dist = path.join(root, "dist");
const postsDir = path.join(root, "content", "posts");

const excluded = new Set([
  ".git",
  ".github",
  "node_modules",
  "content",
  "scripts",
  "dist",
  "data",
  "package.json",
  "package-lock.json",
  ".dev.vars",
  ".env"
]);

const allowedTags = [
  "p", "h1", "h2", "h3", "h4",
  "ul", "ol", "li", "blockquote", "pre", "code",
  "strong", "em", "del", "a", "img", "hr", "br",
  "table", "thead", "tbody", "tr", "th", "td"
];

function cleanHtml(html) {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      th: ["align"],
      td: ["align"]
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer"
      })
    }
  });
}

function copySiteFiles(source, target) {
  fs.mkdirSync(target, { recursive: true });

  for (const item of fs.readdirSync(source, { withFileTypes: true })) {
    if (source === root && excluded.has(item.name)) continue;

    const from = path.join(source, item.name);
    const to = path.join(target, item.name);

    if (item.isDirectory()) {
      copySiteFiles(from, to);
    } else if (item.isFile()) {
      fs.copyFileSync(from, to);
    }
  }
}

function findMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) return findMarkdownFiles(fullPath);

    return item.isFile() && item.name.endsWith(".md")
      ? [fullPath]
      : [];
  });
}

function toValidDate(value) {
  if (!value) return "";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function safeThumbnail(value) {
  const src = String(value || "").trim();

  if (!src) return "";
  if (src.startsWith("/") && !src.startsWith("//")) return src;
  if (/^https:\/\/[^/]+/i.test(src)) return src;

  return "";
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function makeSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeArticlePage(post) {
  const title = escapeHtml(post.title);
  const description = escapeHtml(post.description);
  const category = escapeHtml(post.category);
  const date = post.date
    ? new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh"
      }).format(new Date(post.date))
    : "";

  const image = post.thumbnail
    ? `<img class="hero" src="${escapeHtml(post.thumbnail)}" alt="${title}">`
    : "";

  const body = post.html || `<p>${escapeHtml(post.body)}</p>`;

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | GMTECH</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  ${post.thumbnail
    ? `<meta property="og:image" content="${escapeHtml(post.thumbnail.startsWith("http") ? post.thumbnail : "https://gmtech.pages.dev" + post.thumbnail)}">`
    : ""}
  <link rel="canonical" href="https://gmtech.pages.dev/bai-viet/${encodeURIComponent(post.slug)}/">
  <link rel="stylesheet" href="/css/style.css">
  <style>
    .post-page { max-width: 900px; margin: 0 auto; padding: 32px 20px 64px; }
    .post-nav { margin-bottom: 28px; }
    .post-nav a, .post-back { color: #087fbd; text-decoration: none; }
    .post-title { line-height: 1.35; margin-bottom: 12px; overflow-wrap: anywhere; }
    .post-meta { color: #64748b; font-size: .95rem; margin-bottom: 24px; }
    .hero { display: block; width: 100%; max-height: 480px; object-fit: contain; margin: 20px auto 28px; border-radius: 12px; }
    .post-body { line-height: 1.85; overflow-wrap: anywhere; }
    .post-body img { max-width: 100%; height: auto; }
    .post-body pre { overflow-x: auto; padding: 16px; background: #f1f5f9; border-radius: 8px; }
    .post-body table { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; }
    .post-body th, .post-body td { border: 1px solid #cbd5e1; padding: 8px; }
    .post-back { display: inline-block; margin-top: 32px; font-weight: 600; }
  </style>
</head>
<body>
  <main class="post-page">
    <nav class="post-nav"><a href="/">← GMTECH — Trang chủ</a></nav>
    <article>
      <p class="post-meta">${category}${date ? " · " + date : ""}</p>
      <h1 class="post-title">${title}</h1>
      ${description ? `<p>${description}</p>` : ""}
      ${image}
      <div class="post-body">${body}</div>
    </article>
    <a class="post-back" href="/">← Quay lại trang chủ GMTECH</a>
  </main>
</body>
</html>`;
}

fs.rmSync(dist, { recursive: true, force: true });
copySiteFiles(root, dist);

const usedSlugs = new Set();

const posts = findMarkdownFiles(postsDir).map((file) => {
  const parsed = matter(fs.readFileSync(file, "utf8"));
  const data = parsed.data;
  const body = parsed.content.trim();

  const renderedHtml = marked.parse(body, {
    gfm: true,
    breaks: false
  });

  const baseSlug = makeSlug(path.basename(file, ".md")) || "bai-viet";
  let slug = baseSlug;
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix++}`;
  }
  usedSlugs.add(slug);

  const legacyCategory = String(data.category || "").trim();
  const categoryParent = String(data.category_parent || "").trim();
  const categoryChild = String(data.category_child || "").trim();

  const rawTags = data.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags.map((tag) => String(tag).trim()).filter(Boolean)
    : typeof rawTags === "string"
      ? rawTags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [];

  return {
    slug: path.basename(file, ".md"),
    title: String(data.title || path.basename(file, ".md")),
    date: toValidDate(data.date),
    description: String(data.description || ""),
    thumbnail: safeThumbnail(data.thumbnail),

    // Giữ trường cũ để tương thích website hiện tại.
    category: legacyCategory || categoryChild || categoryParent || "Kiến thức CNTT",

    // Các trường phân loại mới.
    category_parent: categoryParent,
    category_child: categoryChild,
    tags,

    body,
    html: cleanHtml(renderedHtml)
  };
});

posts.sort(
  (a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)
);

// Giữ dữ liệu JSON để trang chủ tiếp tục đọc như trước.
const dataDir = path.join(dist, "data");
fs.mkdirSync(dataDir, { recursive: true });

fs.writeFileSync(
  path.join(dataDir, "posts.json"),
  JSON.stringify(posts, null, 2),
  "utf8"
);

// Tạo một trang HTML riêng cho mỗi bài viết CMS.
for (const post of posts) {
  const articleDir = path.join(dist, "bai-viet", post.slug);
  fs.mkdirSync(articleDir, { recursive: true });

  fs.writeFileSync(
    path.join(articleDir, "index.html"),
    makeArticlePage(post),
    "utf8"
  );
}

console.log(`Build thành công: ${posts.length} bài CMS.`);
console.log("Đã tạo trang chi tiết trong dist/bai-viet/");
console.log("Thư mục triển khai: dist/");
