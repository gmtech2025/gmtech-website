
(async function () {
  const grid = document.getElementById("articleGrid");
  const emptyMessage = document.getElementById("emptyArticles");

  if (!grid) return;

  try {
    const response = await fetch("/data/posts.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Không tải được data/posts.json");
    }

    const posts = await response.json();

    if (!Array.isArray(posts) || posts.length === 0) return;

    posts.forEach((post) => {
      const card = document.createElement("article");
      card.className = "article-card gmtech-cms-card";

      if (post.thumbnail) {
        const image = document.createElement("img");
        image.className = "gmtech-article-image";
        image.src = post.thumbnail;
        image.alt = post.title || "Bài viết GMTECH";
        image.loading = "lazy";
        image.decoding = "async";

        image.addEventListener("error", () => image.remove());
        card.appendChild(image);
      }

      const content = document.createElement("div");
      content.className = "gmtech-article-card-content";

      const meta = document.createElement("p");
      meta.className = "article-meta";
      meta.textContent = [
        post.category || "Kiến thức CNTT",
        formatDate(post.date)
      ].filter(Boolean).join(" · ");

      const title = document.createElement("h3");
      title.textContent = post.title || "Bài viết GMTECH";

      const excerpt = document.createElement("p");
      excerpt.className = "gmtech-article-excerpt";
      excerpt.textContent = post.description || "";

      const link = document.createElement("a");
      link.className = "article-read-more";
      link.textContent = "Đọc bài viết";
      link.href = `/bai-viet/${encodeURIComponent(post.slug)}/`;

      const classification = createClassification(post);
      content.append(meta, classification, title, excerpt, link);
      card.appendChild(content);
      grid.appendChild(card);
    });

    if (emptyMessage) emptyMessage.hidden = true;
  } catch (error) {
    console.error("GMTECH CMS:", error);
  }
// Thêm chức năng bắt đầu ...
  function createClassification(post) {
    const wrapper = document.createElement("div");
    wrapper.className = "gmtech-post-classification";

    const parent = String(post.category_parent || "").trim();
    const child = String(post.category_child || "").trim();

    if (parent || child) {
      const category = document.createElement("p");
      category.className = "gmtech-post-categories";

      category.textContent = [parent, child]
        .filter(Boolean)
        .join(" › ");

      wrapper.appendChild(category);
    }

    const tags = Array.isArray(post.tags)
      ? post.tags
          .map((tag) => String(tag).trim())
          .filter(Boolean)
      : [];

    if (tags.length > 0) {
      const tagList = document.createElement("div");
      tagList.className = "gmtech-post-tags";
      tagList.setAttribute("aria-label", "Thẻ bài viết");

      tags.forEach((tag) => {
        const item = document.createElement("span");
        item.className = "gmtech-post-tag";
        item.textContent = tag;
        tagList.appendChild(item);
      });

      wrapper.appendChild(tagList);
    }

    return wrapper;
  }
  // Thêm chức năng kết thúc
  function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  }

  function showPost(post) {
    let dialog = document.getElementById("gmtechPostDialog");

    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "gmtechPostDialog";
      dialog.className = "gmtech-post-dialog";

      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "gmtech-post-close";
      closeButton.textContent = "Đóng ✕";
      closeButton.setAttribute("aria-label", "Đóng bài viết");

      const content = document.createElement("article");
      content.className = "gmtech-post-content";

      dialog.append(closeButton, content);
      document.body.appendChild(dialog);

      closeButton.addEventListener("click", () => dialog.close());

      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });

      dialog.addEventListener("close", () => {
        document.body.style.overflow = "";
      });
    }

    const content = dialog.querySelector(".gmtech-post-content");
    content.replaceChildren();

    const heading = document.createElement("h2");
    heading.textContent = post.title || "Bài viết GMTECH";

    const meta = document.createElement("p");
    meta.className = "article-meta";
    meta.textContent = [
      post.category || "Kiến thức CNTT",
      formatDate(post.date)
    ].filter(Boolean).join(" · ");

    const classification = createClassification(post);
    content.append(heading, meta, classification);

    if (post.thumbnail) {
      const image = document.createElement("img");
      image.className = "gmtech-post-hero";
      image.src = post.thumbnail;
      image.alt = post.title || "Ảnh bài viết GMTECH";
      image.loading = "lazy";
      image.addEventListener("error", () => image.remove());
      content.appendChild(image);
    }

    const body = document.createElement("div");
    body.className = "gmtech-post-body";

    // Chỉ dùng HTML đã được làm sạch ở bước build.
    // Nếu không có HTML, hiển thị nội dung như văn bản thuần.
    if (typeof post.html === "string" && post.html.trim()) {
      body.innerHTML = post.html;
    } else {
      body.textContent = post.body || "";
    }

    content.appendChild(body);
    document.body.style.overflow = "hidden";
    dialog.showModal();
  }
})();
