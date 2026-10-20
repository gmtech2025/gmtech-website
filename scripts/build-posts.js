const fs = require("node:fs");
const path = require("node:path");
const grayMatter = require("gray-matter");
const yaml = require("js-yaml");
const matter = source => grayMatter(source, {engines:{yaml:{parse:yaml.load,stringify:yaml.dump}}});
const { marked } = require("marked");
const sanitizeHtml = require("sanitize-html");
const site = require("./build-layout");

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
      h1: "h2",
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

function makeArticlePage(post, allPosts = []) { return site.articlePage(post, allPosts); }

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
    published: data.published !== false && String(data.published).toLowerCase() !== "false",
    is_sample: data.is_sample === true || String(data.is_sample).toLowerCase() === "true",
    seo_title: String(data.seo_title || "").trim(),
    seo_description: String(data.seo_description || "").trim(),
    image_alt: String(data.image_alt || "").trim(),
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
}).filter(item => item.published);

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


const catalogEntries = {};
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
      date: toValidDate(data.date),
      title: String(data.title || baseSlug),
      category: String(data.category || ""),
      seo_title: String(data.seo_title || "").trim(),
    seo_description: String(data.seo_description || "").trim(),
    image_alt: String(data.image_alt || "").trim(),
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
  catalogEntries[collectionName] = entries;
  const route = collectionName === "products" ? "san-pham" : "dich-vu";
  for (const item of entries) {
    const dir = path.join(dist, route, item.slug);
    fs.mkdirSync(dir, {recursive:true});
    const page = site.catalogPage(item, collectionName);
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

site.writeIndexPages({dist,posts,products:catalogEntries.products,services:catalogEntries.services,legacy:legacyScope.window.GMTECH_POSTS||[]});

// Regenerate discovery URLs after every CMS build using only published content.
require('./build-sitemap').writeSitemap(dist, {
  posts,
  products: catalogEntries.products,
  services: catalogEntries.services,
  legacy: legacyScope.window.GMTECH_POSTS || []
});

// Generate responsive derivatives in dist only; retain all original uploads.
require("./build-images").optimizeSiteImages(dist).catch(error => { console.error(error); process.exitCode = 1; });
