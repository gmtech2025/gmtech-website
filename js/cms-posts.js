(async function () {
  const grid = document.getElementById("articleGrid");
  const emptyMessage = document.getElementById("emptyArticles");
  if (!grid) return;

  const labels = {
    "quan-tri-mang": "Quản trị hệ thống & mạng",
    "sua-chua-phan-cung": "Sửa chữa & phần cứng",
    "an-toan-thong-tin": "An toàn thông tin",
    "giai-phap-doanh-nghiep": "Giải pháp CNTT doanh nghiệp",
    "ai-tu-dong-hoa": "Phần mềm, AI & tự động hóa",
    "dao-tao": "Đào tạo & hướng dẫn"
  };

  try {
    const response = await fetch("/data/posts.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Không tải được data/posts.json");
    const posts = await response.json();
    if (Array.isArray(posts)) posts.forEach((post) => {
      const parentKey = String(post.category_parent || "").trim();
      const parent = labels[parentKey] || parentKey;
      const child = String(post.category_child || "").trim();
      const legacy = String(post.category || "").trim();
      const category = parent || legacy || "Kiến thức CNTT";
      const tags = Array.isArray(post.tags) ? post.tags.map(x => String(x).trim()).filter(Boolean) : [];
      const card = document.createElement("article");
      card.className = "article-card gmtech-cms-card";
      card.dataset.category = category;
      card.dataset.parent = category;
      card.dataset.child = child;
      card.dataset.search = [post.title, post.description, category, child, ...tags].join(" ");

      if (post.thumbnail) {
        const img = document.createElement("img");
        img.className = "gmtech-article-image";
        img.src = post.thumbnail;
        if (post.image_srcset) {
          img.srcset = post.image_srcset;
          img.sizes = "(max-width: 540px) 100vw, (max-width: 900px) 50vw, 400px";
          img.width = post.image_width; img.height = post.image_height;
        }
        img.alt = post.image_alt || post.title || "Ảnh bài viết GMTECH";
        img.loading = "lazy";
        img.decoding = "async";
        img.addEventListener("error", () => {
          const fallback = document.createElement("div");
          fallback.className = "gmtech-article-image gmtech-article-image-placeholder";
          fallback.setAttribute("aria-hidden", "true");
          fallback.textContent = "GMTECH";
          img.replaceWith(fallback);
        }, { once: true });
        card.appendChild(img);
      } else {
        const fallback = document.createElement("div");
        fallback.className = "gmtech-article-image gmtech-article-image-placeholder";
        fallback.setAttribute("aria-hidden", "true");
        fallback.textContent = "GMTECH";
        card.appendChild(fallback);
      }
      const content = document.createElement("div");
      content.className = "gmtech-article-card-content";
      const meta = document.createElement("p");
      meta.className = "article-meta";
      meta.textContent = [parent || legacy || "Kiến thức CNTT", formatDate(post.date)].filter(Boolean).join(" · ");
      content.appendChild(meta);

      const classification = document.createElement("div");
      classification.className = "gmtech-post-classification";
      if (child) {
        const el = document.createElement("span");
        el.className = "gmtech-post-child";
        el.textContent = child;
        classification.appendChild(el);
      }
      if (tags.length) {
        const tagList = document.createElement("div");
        tagList.className = "gmtech-post-tags";
        tags.forEach(tag => {
          const el = document.createElement("span");
          el.className = "gmtech-post-tag";
          el.textContent = tag;
          tagList.appendChild(el);
        });
        classification.appendChild(tagList);
      }
      if (classification.childElementCount) content.appendChild(classification);

      const title = document.createElement("h3");
      const titleLink = document.createElement("a");
      titleLink.href = `/bai-viet/${encodeURIComponent(post.slug)}/`;
      titleLink.textContent = post.title || "Bài viết GMTECH";
      title.appendChild(titleLink);
      const excerpt = document.createElement("p");
      excerpt.className = "gmtech-article-excerpt";
      excerpt.textContent = post.description || "";
      const link = document.createElement("a");
      link.className = "article-read-more";
      link.textContent = "Đọc bài viết";
      link.href = `/bai-viet/${encodeURIComponent(post.slug)}/`;
      content.append(title, excerpt, link);
      card.appendChild(content);
      grid.appendChild(card);
    });
  } catch (error) {
    console.error("GMTECH CMS:", error);
  }
  setupFilters();

  function setupFilters() {
    const search = document.getElementById("articleSearch");
    const filterBox = document.getElementById("articleFilters");
    const count = document.getElementById("articleResultCount");
    const cards = Array.from(grid.querySelectorAll(".article-card"));
    if (!filterBox) return;

    // Bài mẫu cũ vẫn được giữ lại; coi danh mục cũ là nhóm cha để không làm mất khả năng lọc.
    cards.forEach(card => {
      if (!card.dataset.parent) card.dataset.parent = card.dataset.category || "Khác";
      if (!card.dataset.child) card.dataset.child = "";
    });

    const parents = [...new Set(cards.map(card => card.dataset.parent).filter(Boolean))];
    parents.forEach(parent => {
      if (filterBox.querySelector('[data-filter="' + CSS.escape(parent) + '"]')) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gmtech-filter-button";
      btn.dataset.filter = parent;
      btn.textContent = parent;
      btn.setAttribute("aria-pressed", "false");
      filterBox.appendChild(btn);
    });

    let activeParent = "all";

    const apply = () => {
      const q = String(search?.value || "").trim().toLocaleLowerCase("vi");
      let shown = 0;
      cards.forEach(card => {
        const parentOK = activeParent === "all" || card.dataset.parent === activeParent;
        const haystack = String(card.dataset.search || card.textContent).toLocaleLowerCase("vi");
        const show = parentOK && (!q || haystack.includes(q));
        card.hidden = !show;
        if (show) shown++;
      });
      if (emptyMessage) emptyMessage.hidden = shown > 0;
      if (count) count.textContent = shown + (shown === 1 ? " bài viết" : " bài viết");
    };

    filterBox.addEventListener("click", event => {
      const btn = event.target.closest("button[data-filter]");
      if (!btn) return;
      activeParent = btn.dataset.filter;
      filterBox.querySelectorAll("button[data-filter]").forEach(item => {
        const on = item === btn;
        item.classList.toggle("is-active", on);
        item.setAttribute("aria-pressed", String(on));
      });
      apply();
    });
    search?.addEventListener("input", apply);
    apply();
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Ho_Chi_Minh"
    }).format(date);
  }
})();