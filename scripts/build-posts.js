const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");

const postsDir = path.join(process.cwd(), "content", "posts");
const outputDir = path.join(process.cwd(), "data");
const outputFile = path.join(outputDir, "posts.json");

function walkMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) return walkMarkdown(fullPath);
    if (entry.isFile() && entry.name.endsWith(".md")) return [fullPath];

    return [];
  });
}

const posts = walkMarkdown(postsDir).map((file) => {
  const raw = fs.readFileSync(file, "utf8");
  const parsed = matter(raw);
  const data = parsed.data;

  return {
    title: data.title || path.basename(file, ".md"),
    date: data.date || "",
    description: data.description || "",
    thumbnail: data.thumbnail || "",
    category: data.category || "Kiến thức CNTT",
    body: parsed.content.trim(),
    slug: path.basename(file, ".md")
  };
});

posts.sort((a, b) => new Date(b.date) - new Date(a.date));

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(posts, null, 2), "utf8");

console.log(`Đã tạo ${outputFile} với ${posts.length} bài viết.`);
