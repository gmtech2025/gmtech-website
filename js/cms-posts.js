
(async function () {
  const grid = document.getElementById("articleGrid");
  const emptyMessage = document.getElementById("emptyArticles");

  if (!grid) return;

  try {
    const response = await fetch("/data/posts.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Không tải được data/posts.json");

    const posts = await response.json();

    if (!Array.isArray(posts) || posts.length === 0) return;

    // Không xóa các bài mẫu hiện có.
    posts.forEach((post) => {
      const card = document.createElement("article");
      card.className = "article-card gmtech-cms-card";

      const title = document.createElement("h3");
      title.textContent = post.title || "Bài viết GMTECH";

      const meta = document.createElement("p");
      meta.className = "article-meta";
      meta.textContent = [
        post.category || "Kiến thức CNTT",
        post.date ? new Date(post.date).toLocaleDateString("vi-VN") : ""
      ].filter(Boolean).join(" · ");

      const excerpt = document.createElement("p");
      excerpt.textContent = post.description || "";

      const link = document.createElement("a");
      link.href = "#";
      link.textContent = "Đọc bài viết";
      link.className = "article-read-more";

      link.addEventListener("click", (event) => {
        event.preventDefault();
        showPost(post);
      });

      card.append(meta, title, excerpt, link);
      grid.appendChild(card);
    });

    if (emptyMessage) emptyMessage.hidden = true;
  } catch (error) {
    console.error("GMTECH CMS:", error);
    // Không xóa các bài mẫu nếu dữ liệu CMS chưa tải được.
  }

  function showPost(post) {
    let dialog = document.getElementById("gmtechPostDialog");

    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "gmtechPostDialog";
      dialog.className = "gmtech-post-dialog";
      dialog.innerHTML = `
        <button type="button" class="gmtech-post-close" aria-label="Đóng">Đóng ✕</button>
        <div class="gmtech-post-content"></div>
      `;
      document.body.appendChild(dialog);

      dialog.querySelector(".gmtech-post-close").addEventListener("click", () => {
        dialog.close();
      });

      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    }

    const content = dialog.querySelector(".gmtech-post-content");
    content.replaceChildren();

    const heading = document.createElement("h2");
    heading.textContent = post.title || "Bài viết GMTECH";

    const category = document.createElement("p");
    category.className = "article-meta";
    category.textContent = post.category || "Kiến thức CNTT";

    const body = document.createElement("div");
    body.className = "gmtech-post-body";

    // Hiển thị nội dung an toàn dưới dạng văn bản.
    // Bản đầu tiên giữ nguyên Markdown; sau này có thể nâng cấp
    // sang hiển thị định dạng Markdown đã được làm sạch.
    body.textContent = post.body || "";

    content.append(heading, category, body);
    dialog.showModal();
  }
})();
