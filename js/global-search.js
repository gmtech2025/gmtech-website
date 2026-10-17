(function () {
  "use strict";
  const form = document.getElementById("globalSearchForm");
  const input = document.getElementById("globalSearchInput");
  const results = document.getElementById("globalSearchResults");
  if (!form || !input || !results) return;

  let index = [];
  let ready = false;
  const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLocaleLowerCase("vi");
  const make = (type, title, description, href, extra) => ({type, title:String(title || ""),description:String(description || ""),href, haystack:normalize([title,description,extra].join(" "))});
  const safeSlug = value => encodeURIComponent(String(value || ""));
  async function fetchList(file) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch("/data/" + file + ".json", {signal:controller.signal});
      if (!response.ok) throw new Error(file + ": " + response.status);
      const json = await response.json();
      return Array.isArray(json) ? json : [];
    } catch (error) {
      console.warn("Global search: missing " + file, error);
      return [];
    } finally { clearTimeout(timer); }
  }
  async function load() {
    const [products, services, posts] = await Promise.all([fetchList("products"),fetchList("services"),fetchList("posts")]);
    index = [
      ...products.filter(p => p.published !== false).map(p => make("Sản phẩm",p.title,p.description,"#products",[p.category,p.sku,p.cpu,p.ram,p.storage,p.display].join(" "))),
      ...services.filter(s => s.published !== false).map(s => make("Dịch vụ",s.title,s.description,"#services",s.category)),
      ...posts.map(p => make("Bài viết",p.title,p.description,p.slug ? "/bai-viet/" + safeSlug(p.slug) + "/" : "#articles",[p.category,p.category_parent,p.category_child,...(Array.isArray(p.tags)?p.tags:[])].join(" ")))
    ];
    // If CMS data is unavailable, include the HTML fallback product/service cards.
    for (const [id,type,href] of [["productGrid","Sản phẩm","#products"],["serviceGrid","Dịch vụ","#services"]]) {
      if (index.some(x => x.type === type)) continue;
      document.querySelectorAll("#"+id+" article").forEach(card => {
        index.push(make(type,card.querySelector("h3")?.textContent,card.querySelector("p")?.textContent,href,""));
      });
    }
    ready = true;
    if (input.value.trim()) render();
  }
  function hide() { results.hidden = true; results.replaceChildren(); input.setAttribute("aria-expanded","false"); }
  function render() {
    const q = normalize(input.value.trim());
    if (!q) { hide(); return; }
    results.replaceChildren();
    const matches = index.filter(item => item.haystack.includes(q)).slice(0,12);
    const heading = document.createElement("p");
    heading.className = "global-search-status";
    heading.textContent = !ready ? "Đang chuẩn bị dữ liệu tìm kiếm…" : matches.length ? "Kết quả phù hợp ("+matches.length+(matches.length===12?"+":"")+")" : "Không tìm thấy nội dung phù hợp.";
    results.append(heading);
    matches.forEach(item => {
      const link = document.createElement("a");
      link.className = "global-search-result";
      link.href = item.href;
      const type = document.createElement("span");
      type.textContent = item.type;
      const body = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = item.title;
      const desc = document.createElement("small");
      desc.textContent = item.description;
      body.append(title,desc);
      link.append(type,body);
      link.addEventListener("click",hide);
      results.append(link);
    });
    results.hidden = false;
    input.setAttribute("aria-expanded","true");
  }
  input.addEventListener("input",render);
  form.addEventListener("submit",event => {
    event.preventDefault();
    render();
    const first = results.querySelector(".global-search-result");
    if (first) first.focus();
  });
  document.addEventListener("keydown",event => { if (event.key === "Escape") hide(); });
  document.addEventListener("click",event => { if (!form.contains(event.target) && !results.contains(event.target)) hide(); });
  load();
})();
