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

function makeArticlePage(post, allPosts = []) {
  const title = escapeHtml(post.title);
  const description = escapeHtml(post.description);
  const category = escapeHtml(post.category_parent_label || post.category);
  const date = post.date
    ? new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh"
      }).format(new Date(post.date))
    : "";

  const image = post.thumbnail
    ? `<img class="hero" src="${escapeHtml(post.thumbnail)}" alt="${title}" loading="eager">`
    : "";

  const body = post.html || `<p>${escapeHtml(post.body)}</p>`;
  const currentIndex = allPosts.findIndex(item => item.slug === post.slug);
  const previous = currentIndex >= 0 ? allPosts[currentIndex + 1] : null;
  const next = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const articleUrl = item => `/bai-viet/${encodeURIComponent(item.slug)}/`;
  const navLink = (item, label, direction) => item
    ? `<a class="post-step post-step-${direction}" href="${articleUrl(item)}"><span>${label}</span><strong>${escapeHtml(item.title)}</strong></a>`
    : `<span class="post-step post-step-${direction} is-disabled"><span>${label}</span><strong>${direction === "previous" ? "Đây là bài cũ nhất" : "Đây là bài mới nhất"}</strong></span>`;

  const relatedPosts = allPosts
    .filter(item => item.slug !== post.slug)
    .filter(item => {
      const sameChild = post.category_child && item.category_child === post.category_child;
      const sameParent = post.category_parent && item.category_parent === post.category_parent;
      return sameChild || sameParent;
    })
    .slice(0, 3);

  const relatedSection = relatedPosts.length
    ? `<section class="post-related" aria-labelledby="post-related-title">
        <h2 id="post-related-title">Bài viết liên quan</h2>
        <div class="post-related-grid">
          ${relatedPosts.map(item => `<a class="post-related-card" href="${articleUrl(item)}">
            <span>${escapeHtml(item.category_parent_label || item.category || "Kiến thức CNTT")}</span>
            <strong>${escapeHtml(item.title)}</strong>
            ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
            <em>Đọc bài viết →</em>
          </a>`).join("")}
        </div>
      </section>`
    : "";

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
    ? `<meta property="og:image" content="${escapeHtml(post.thumbnail.startsWith("http") ? post.thumbnail : "https://gmtech.win" + post.thumbnail)}">`
    : ""}
  <link rel="canonical" href="https://gmtech.win/bai-viet/${encodeURIComponent(post.slug)}/">
  <link rel="stylesheet" href="/css/style.css">
  <style>
    .post-page { max-width: 900px; margin: 0 auto; padding: 32px 20px 64px; }
    .post-nav a, .post-back { color: #087fbd; text-decoration: none; }
    .post-title { line-height: 1.35; margin-bottom: 12px; overflow-wrap: anywhere; }
    .post-meta { color: #64748b; font-size: .95rem; margin-bottom: 24px; }
    .hero { display: block; width: 100%; max-height: 480px; object-fit: contain; margin: 20px auto 28px; border-radius: 12px; }
    .post-body { line-height: 1.85; overflow-wrap: anywhere; }
    .post-body img { max-width: 100%; height: auto; }
    .post-body pre { overflow-x: auto; padding: 16px; background: #f1f5f9; border-radius: 8px; }
    .post-body table { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; }
    .post-body th, .post-body td { border: 1px solid #cbd5e1; padding: 8px; }
  </style>
</head>
<body>
  <main class="post-page">
    <nav class="post-breadcrumbs" aria-label="Đường dẫn điều hướng">
      <a href="/">Trang chủ</a><span aria-hidden="true">/</span>
      <a href="/#articles">Bài viết</a><span aria-hidden="true">/</span>
      <span aria-current="page">${title}</span>
    </nav>
    <article>
      <p class="post-meta">${category}${date ? " · " + date : ""}</p>
      <h1 class="post-title">${title}</h1>
      ${description ? `<p class="post-description">${description}</p>` : ""}
      ${image}
      <div class="post-body">${body}</div>
    </article>
    <nav class="post-pagination" aria-label="Điều hướng bài viết">
      ${navLink(previous, "Bài trước", "previous")}
      ${navLink(next, "Bài tiếp theo", "next")}
    </nav>
    ${relatedSection}
    <a class="post-back" href="/#articles">← Quay lại danh sách bài viết</a>
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
  const categoryLabels = {
    "quan-tri-mang": "Quản trị hệ thống & mạng",
    "sua-chua-phan-cung": "Sửa chữa & phần cứng",
    "an-toan-thong-tin": "An toàn thông tin",
    "giai-phap-doanh-nghiep": "Giải pháp CNTT doanh nghiệp",
    "ai-tu-dong-hoa": "Phần mềm, AI & tự động hóa",
    "dao-tao": "Đào tạo & hướng dẫn"
  };
  const categoryParentLabel = categoryLabels[categoryParent] || categoryParent;
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
    category: legacyCategory || categoryParentLabel || categoryChild || "Kiến thức CNTT",

    // Các trường phân loại mới.
    category_parent: categoryParent,
    category_parent_label: categoryParentLabel,
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
    makeArticlePage(post, posts),
    "utf8"
  );
}


function buildCatalog(collectionName, outputName) {
  const folder = path.join(root, "content", collectionName);
  const catalogSlugs = new Set();
  const entries = findMarkdownFiles(folder).map((file) => {
    const parsed = matter(fs.readFileSync(file, "utf8"));
    const data = parsed.data;
    const baseSlug = makeSlug(data.slug || path.basename(file, ".md")) || collectionName;
    if (catalogSlugs.has(baseSlug)) throw new Error("Trùng slug danh mục: " + baseSlug);
    catalogSlugs.add(baseSlug);
    return {
      slug: baseSlug,
      title: String(data.title || baseSlug),
      category: String(data.category || ""),
      description: String(data.description || ""),
      image: safeThumbnail(data.image),
      cpu: String(data.cpu || ""),
      ram: String(data.ram || ""),
      storage: String(data.storage || ""),
      display: String(data.display || ""),
      price: String(data.price || ""),
      sku: String(data.sku || ""),
      availability: String(data.availability || "unconfirmed"),
      icon: String(data.icon || "✦"),
      is_sample: data.is_sample === true || String(data.is_sample).toLowerCase() === "true",
      published: data.published !== false && String(data.published).toLowerCase() !== "false",
      body: parsed.content.trim()
    };
  }).filter(item => item.published);
  fs.writeFileSync(path.join(dataDir, outputName), JSON.stringify(entries, null, 2), "utf8");
  const route = collectionName === "products" ? "san-pham" : "dich-vu";
  for (const item of entries) {
    const dir = path.join(dist, route, item.slug);
    fs.mkdirSync(dir, {recursive:true});
    const specLines = [["cpu","CPU"],["ram","RAM"],["storage","Lưu trữ"],["display","Màn hình"]]
      .filter(([key]) => item[key]).map(([key,label]) => `<li>${label}: ${escapeHtml(item[key])}</li>`).join("");
    const details = (specLines ? `<ul>${specLines}</ul>` : "") +
      (collectionName === "products" ? `<p>Giá: ${escapeHtml(item.is_sample ? "Liên hệ xác nhận" : item.price || "Liên hệ")}. Tình trạng: ${item.availability === "in-stock" && !item.is_sample ? "Còn hàng (theo cập nhật)" : "Liên hệ xác nhận"}.</p>` : "") +
      (item.is_sample ? "<p>Thông tin minh họa; liên hệ xác nhận trước khi đặt mua hoặc sử dụng dịch vụ.</p>" : "") +
      (item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">` : "") +
      cleanHtml(marked.parse(item.body || item.description)) +
      '<p><a href="https://zalo.me/0908215486">Trao đổi qua Zalo</a> · <a href="tel:0908215486">Gọi 0908 215 486</a></p>';
    let page = makeArticlePage({...item, date:"", thumbnail:"", html:details});
    page = page.replaceAll(`/bai-viet/${encodeURIComponent(item.slug)}/`, `/${route}/${encodeURIComponent(item.slug)}/`)
      .replaceAll('/#articles', collectionName === "products" ? '/#products' : '/#services')
      .replace('>Bài viết</a>', collectionName === "products" ? '>Sản phẩm</a>' : '>Dịch vụ</a>')
      .replace(/<nav class="post-pagination"[\s\S]*?<\/nav>/, "")
      .replace('Quay lại danh sách bài viết', 'Quay lại danh mục');
    fs.writeFileSync(path.join(dir, "index.html"), page);
  }
  return entries.length;
}
const productCount = buildCatalog("products", "products.json");
const serviceCount = buildCatalog("services", "services.json");

console.log(`Build thành công: ${posts.length} bài CMS.`);
console.log(`Đã tạo ${productCount} sản phẩm và ${serviceCount} dịch vụ CMS.`);
console.log("Đã tạo trang chi tiết trong dist/bai-viet/");
console.log("Thư mục triển khai: dist/");

// Preserve the three original article cards with real, shareable detail URLs.
const legacyScope = {window:{}};
require("node:vm").runInNewContext(fs.readFileSync(path.join(root,"js/posts.js"),"utf8"),legacyScope);
for (const item of legacyScope.window.GMTECH_POSTS || []) {
  if (!/^\/bai-viet\/[a-z0-9-]+\/$/.test(item.url)) continue;
  const slug = item.url.split("/")[2];
  const dir = path.join(dist,"bai-viet",slug);
  if (fs.existsSync(dir)) throw new Error("Trùng URL bài viết: " + slug);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,"index.html"),makeArticlePage({...item,slug,date:item.date,description:item.excerpt,html:`<p>${escapeHtml(item.excerpt)}</p><p><a href="/#services">Xem dịch vụ GMTECH</a> · <a href="/#contact">Trao đổi nhu cầu</a></p>`}));
}
