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
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "strong", "em", "del",
  "a", "img", "hr", "br",
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

  return Number.isNaN(date.getTime())
    ? ""
    : date.toISOString();
}

function safeThumbnail(value) {
  const src = String(value || "").trim();

  if (!src) return "";

  // Chỉ chấp nhận đường dẫn ảnh tương đối hoặc URL HTTPS.
  if (src.startsWith("/") && !src.startsWith("//")) return src;
  if (/^https:\/\/[^/]+/i.test(src)) return src;

  return "";
}

fs.rmSync(dist, { recursive: true, force: true });
copySiteFiles(root, dist);

const posts = findMarkdownFiles(postsDir).map((file) => {
  const parsed = matter(fs.readFileSync(file, "utf8"));
  const data = parsed.data;
  const body = parsed.content.trim();

  const renderedHtml = marked.parse(body, {
    gfm: true,
    breaks: false
  });

  return {
    slug: path.basename(file, ".md"),
    title: String(data.title || path.basename(file, ".md")),
    date: toValidDate(data.date),
    description: String(data.description || ""),
    thumbnail: safeThumbnail(data.thumbnail),
    category: String(data.category || "Kiến thức CNTT"),
    body,
    html: cleanHtml(renderedHtml)
  };
});

posts.sort(
  (a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)
);

const dataDir = path.join(dist, "data");
fs.mkdirSync(dataDir, { recursive: true });

fs.writeFileSync(
  path.join(dataDir, "posts.json"),
  JSON.stringify(posts, null, 2),
  "utf8"
);

console.log(`Build thành công: ${posts.length} bài CMS.`);
console.log("Thư mục triển khai: dist/");
