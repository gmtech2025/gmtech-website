'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ORIGIN = 'https://gmtech.win';
const xmlEscape = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));

// Use the same published collections as the page builder, never scan copied demos.
function sitemapRoutes({posts=[], products=[], services=[], legacy=[]}) {
  const routes = ['/', '/dich-vu/', '/san-pham/', '/kien-thuc/', '/quizmark/'];
  for (const [items, section] of [[posts,'bai-viet'], [products.filter(item=>!item.is_sample),'san-pham'], [services,'dich-vu']]) {
    for (const item of items) {
      if (item.published === false) continue;
      if (!/^[\p{L}\p{M}\p{N}-]+$/u.test(item.slug)) throw new Error('Invalid sitemap slug: '+item.slug);
      routes.push(`/${section}/${encodeURIComponent(item.slug)}/`);
    }
  }
  for (const item of legacy) {
    if (/^\/bai-viet\/[a-z0-9-]+\/$/.test(item.url)) routes.push(item.url);
  }
  return [...new Set(routes)].sort();
}
function writeSitemap(dist, collections) {
  const routes = sitemapRoutes(collections);
  for (const route of routes) {
    if (!fs.existsSync(path.join(dist, decodeURIComponent(route.slice(1)), 'index.html'))) {
      throw new Error('Sitemap page does not exist: '+route);
    }
  }
  // Omit lastmod: publication dates and build time do not prove content modification.
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+routes.map(route=>`  <url><loc>${xmlEscape(ORIGIN+route)}</loc></url>`).join('\n')+'\n</urlset>\n';
  fs.writeFileSync(path.join(dist,'sitemap.xml'),xml,'utf8');
  console.log(`Sitemap: ${routes.length} URL công khai trên ${ORIGIN}.`);
}
module.exports = {sitemapRoutes,writeSitemap};
