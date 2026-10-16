document.addEventListener("DOMContentLoaded", function () {
  // Menu trên màn hình nhỏ
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function () {
      const isOpen = navLinks.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Đóng menu" : "Mở menu"
      );
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Năm bản quyền tự động
  const year = document.getElementById("currentYear");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // Hiển thị bài viết
  const articleGrid = document.getElementById("articleGrid");
  const emptyArticles = document.getElementById("emptyArticles");
  const posts = Array.isArray(window.GMTECH_POSTS)
    ? [...window.GMTECH_POSTS]
    : [];

  posts.sort(function (a, b) {
    return (b.date || "").localeCompare(a.date || "");
  });

  if (articleGrid) {
    articleGrid.innerHTML = posts.map(function (post) {
      const date = formatDate(post.date);
      const url = safeURL(post.url || "#contact");

      return `
        <article class="article-card gmtech-sample-card" data-category="${escapeHTML(post.category || "GMTECH")}" data-search="${escapeHTML([post.title, post.category, post.excerpt].join(" "))}">
          <div class="article-art" aria-hidden="true">
            ${escapeHTML(post.icon || "✦")}
          </div>
          <div class="article-content">
            <div class="article-meta">
              ${escapeHTML(post.category || "GMTECH")}
              ${date ? " · " + escapeHTML(date) : ""}
            </div>
            <h3>${escapeHTML(post.title || "Bài viết GMTECH")}</h3>
            <p>${escapeHTML(post.excerpt || "")}</p>
            <a href="${url}"
               ${isExternal(post.url) ? 'target="_blank" rel="noopener noreferrer"' : ""}>
              Đọc thêm ↗
            </a>
          </div>
        </article>
      `;
    }).join("");

    if (emptyArticles) {
      emptyArticles.hidden = posts.length > 0;
    }
  }

  // Hiển thị liên kết ngoài
  const resourceGrid = document.getElementById("resourceGrid");
  const resources = Array.isArray(window.GMTECH_RESOURCES)
    ? window.GMTECH_RESOURCES
    : [];

  if (resourceGrid) {
    resourceGrid.innerHTML = resources.map(function (item) {
      const url = safeURL(item.url || "#");

      return `
        <a class="resource-card"
           href="${url}"
           target="_blank"
           rel="noopener noreferrer">
          <span class="resource-icon" aria-hidden="true">
            ${escapeHTML(item.icon || "↗")}
          </span>
          <strong>${escapeHTML(item.title || "Liên kết")}</strong>
          <small>${escapeHTML(item.description || "")}</small>
        </a>
      `;
    }).join("");
  }
});

// Hiển thị ngày theo định dạng Việt Nam
function formatDate(value) {
  if (!value) return "";

  const date = new Date(value + "T00:00:00");
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("vi-VN");
}

// Tránh đưa ký tự HTML không an toàn trực tiếp vào trang
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, function (char) {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[char];
  });
}

// Chỉ chấp nhận URL và giao thức thông dụng
function safeURL(value) {
  const url = String(value || "#").trim();

  if (
    url.startsWith("#") ||
    url.startsWith("/") ||
    url.startsWith("./") ||
    url.startsWith("../")
  ) {
    return url;
  }

  try {
    const parsed = new URL(url, window.location.href);
    const allowed = ["http:", "https:", "mailto:", "tel:"];

    return allowed.includes(parsed.protocol) ? parsed.href : "#";
  } catch (error) {
    return "#";
  }
}

function isExternal(value) {
  return /^https?:\/\//i.test(String(value || ""));
}