
const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");
const { marked } = require("marked");

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
  "package-lock.json"
]);

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
    return item.isFile() && item.name.endsWith(".md") ? [fullPath] : [];
  });
}

function toValidDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

fs.rmSync(dist, { recursive: true, force: true });
copySiteFiles(root, dist);

const posts = findMarkdownFiles(postsDir).map((file) => {
  const parsed = matter(fs.readFileSync(file, "utf8"));
  const data = parsed.data;
  const body = parsed.content.trim();

  return {
    slug: path.basename(file, ".md"),
    title: String(data.title || path.basename(file, ".md")),
    date: toValidDate(data.date),
    description: String(data.description || ""),
    thumbnail: String(data.thumbnail || ""),
    category: String(data.category || "Kiến thức CNTT"),
    body,
    html: marked.parse(body)
  };
});

posts.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));

const dataDir = path.join(dist, "data");
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(
  path.join(dataDir, "posts.json"),
  JSON.stringify(posts, null, 2),
  "utf8"
);

console.log(`Build thành công: ${posts.length} bài CMS.`);
console.log("Thư mục triển khai: dist/");
