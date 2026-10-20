(function () {
  "use strict";
  const zalo = "https://zalo.me/0908215486";
  const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const safeImage = v => {
    const s = String(v || "").trim();
    return (s.startsWith("/") && !s.startsWith("//")) || /^https:\/\/[^\s]+$/i.test(s) ? s : "";
  };
  async function load(path) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(path, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("HTTP " + response.status + ": " + path);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Dữ liệu không phải danh sách: " + path);
      return data;
    } finally { clearTimeout(timeout); }
  }
  function image(src, title, item = {}) {
    const valid = safeImage(src);
    return valid ? '<img class="catalog-image" loading="lazy" decoding="async" src="' + esc(valid) + '"' + (item.image_srcset ? ' srcset="' + esc(item.image_srcset) + '" sizes="(max-width: 540px) 100vw, (max-width: 900px) 50vw, 400px" width="' + esc(item.image_width) + '" height="' + esc(item.image_height) + '"' : '') + ' alt="' + esc(title) + '">'
      : '<div class="catalog-image-placeholder" aria-hidden="true">GMTECH</div>';
  }
  function modal(title, body) {
    let m = document.getElementById("catalogModal");
    if (!m) {
      m = document.createElement("div");
      m.id = "catalogModal";
      m.className = "catalog-modal";
      m.hidden = true;
      m.innerHTML = '<div class="catalog-modal-panel" role="dialog" aria-modal="true" aria-labelledby="catalogModalTitle"><button class="catalog-modal-close" type="button" aria-label="Đóng">Đóng ✕</button><div id="catalogModalBody"></div></div>';
      document.body.append(m);
      m.addEventListener("click", e => { if (e.target === m || e.target.closest(".catalog-modal-close")) closeModal(); });
      document.addEventListener("keydown", e => { if (e.key === "Escape" && !m.hidden) closeModal(); });
    }
    function closeModal() { m.hidden = true; document.body.style.overflow = ""; }
    m.querySelector("#catalogModalBody").innerHTML = '<h2 id="catalogModalTitle">' + esc(title) + '</h2>' + body;
    m.hidden = false;
    document.body.style.overflow = "hidden";
    m.querySelector(".catalog-modal-close").focus();
  }
  function detailUrl(kind, item) { return "/" + kind + "/" + encodeURIComponent(item.slug) + "/"; }
  function specs(p) {
    const fields = [["cpu", "CPU"], ["ram", "RAM"], ["storage", "SSD"], ["display", "Màn hình"]];
    const chips = fields.filter(([key]) => String(p[key] || "").trim()).map(([key, label]) => '<span class="spec-chip"><span aria-hidden="true">◆</span> ' + esc(label) + ': ' + esc(p[key]) + '</span>');
    return chips.length ? '<div class="catalog-specs" aria-label="Thông số nhanh">' + chips.join("") + '</div>' : "";
  }
  function renderProducts(items) {
    const root = document.getElementById("productGrid");
    if (!root || !items.length) return; // Preserve server-rendered, clearly labeled fallback.
    root.replaceChildren();
    items.slice(0, 6).forEach(p => {
      const card = document.createElement("article");
      card.className = "catalog-card";
      const sample = p.is_sample ? '<span class="catalog-badge sample">Sản phẩm minh họa</span>' : "";
      const price = p.is_sample ? "Liên hệ xác nhận" : (p.price ? esc(p.price) : "Liên hệ");
      card.innerHTML = image(p.image, p.image_alt || p.title, p) +
        '<div class="catalog-body"><div class="catalog-badges"><span class="catalog-badge">' + esc(p.category || "Laptop") + '</span>' + sample + '</div><h3><a href="' + detailUrl('san-pham', p) + '">' + esc(p.title) + '</a></h3><p>' + esc(p.description) + '</p>' +
        specs(p) + '<div class="catalog-foot"><span class="catalog-price">' + price + '</span></div><div class="catalog-actions"><a class="catalog-detail" href="' + detailUrl('san-pham', p) + '">Xem cấu hình</a><a class="catalog-zalo" href="' + zalo + '" target="_blank" rel="noopener noreferrer" aria-label="Tư vấn Zalo về ' + esc(p.title) + '">Tư vấn qua Zalo ↗</a></div></div>';
      root.append(card);
    });
  }
  function renderServices(items) {
    const root = document.getElementById("serviceGrid");
    if (!root || !items.length) return;
    root.replaceChildren();
    items.slice(0, 9).forEach(s => {
      const card = document.createElement("article");
      card.className = "service-catalog-card";
      card.innerHTML = '<div class="service-icon" aria-hidden="true">' + esc(s.icon || "✦") + '</div>' +
        (s.is_sample ? '<div class="catalog-badges"><span class="catalog-badge sample">Nội dung minh họa</span></div>' : "") +
        '<h3><a href="' + detailUrl('dich-vu', s) + '">' + esc(s.title) + '</a></h3><p>' + esc(s.description) + '</p><a class="service-more" href="' + detailUrl('dich-vu', s) + '">Tìm hiểu dịch vụ ↗</a>';
      root.append(card);
    });
  }
  document.addEventListener("DOMContentLoaded", async () => {
    try { renderProducts(await load("/data/products.json")); } catch (err) { console.warn("GMTECH: giữ sản phẩm dự phòng", err); }
    try { renderServices(await load("/data/services.json")); } catch (err) { console.warn("GMTECH: giữ dịch vụ dự phòng", err); }
  });
})();
