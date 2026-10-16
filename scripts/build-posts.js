
const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");
const { marked } = require("marked");

const root = process.cwd();
const postsDir = path.join(root, "content", "posts");
const outputDir = path.join(root, "data");
const outputFile = path.join(outputDir, "posts.json");

function findMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) return findMarkdownFiles(fullPath);
    if (item.isFile() && item.name.toLowerCase().endsWith(".md")) {
      return [fullPath];
    }
    return [];
  });
}

const posts = findMarkdownFiles(postsDir).map((file) => {
  const parsed = matter(fs.readFileSync(file, "utf8"));
  const data = parsed.data;
  const slug = path.basename(file, ".md");
  const body = parsed.content.trim();

  return {
    slug,
    title: String(data.title || slug),
    date: data.date ? new Date(data.date).toISOString() : "",
    description: String(data.description || ""),
    thumbnail: String(data.thumbnail || ""),
    category: String(data.category || "Kiến thức CNTT"),
    body,
    html: marked.parse(body)
  };
});

posts.sort((a, b) => {
  const dateA = Date.parse(a.date) || 0;
  const dateB = Date.parse(b.date) || 0;
  return dateB - dateA;
});

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(posts, null, 2), "utf8");

console.log(`Build thành công: ${posts.length} bài CMS.`);
