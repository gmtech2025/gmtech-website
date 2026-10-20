'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cheerio = require('cheerio');
const sharp = require('sharp');
const {articlePage,catalogPage} = require('./build-layout');
const {optimizeSiteImages} = require('./build-images');

async function run() {
  for (const render of [item=>articlePage({...item,html:'<p>Nội dung</p>'}),item=>catalogPage({...item,body:'# Nội dung từ CMS'},'products')]) {
    const base = {title:'Tiêu đề hiển thị',slug:'test',description:'Mô tả ngắn',thumbnail:'/assets/a.jpg',image:'/assets/a.jpg'};
    let $ = cheerio.load(render(base));
    assert.equal($('title').text(),'Tiêu đề hiển thị | GMTECH');
    assert.equal($('meta[name="description"]').attr('content'),'Mô tả ngắn');
    assert.equal($('h1').length,1);
    $ = cheerio.load(render({...base,seo_title:'Tìm kiếm "A" & B | GMTECH',seo_description:'Mô tả SEO <đúng nội dung>',image_alt:'Cổng bên trái của máy'}));
    assert.equal($('title').text(),'Tìm kiếm "A" & B | GMTECH');
    assert.equal($('meta[property="og:title"]').attr('content'),$('title').text());
    assert.equal($('meta[name="description"]').attr('content'),'Mô tả SEO <đúng nội dung>');
    assert.equal($('h1').text(),base.title);
    assert.equal($('img.post-hero').attr('alt'),'Cổng bên trái của máy');
    assert.equal($('link[rel="canonical"]').attr('href').includes('/test/'),true);
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'gmtech-seo-'));
  try {
    const uploads = path.join(dir,'assets/uploads');
    fs.mkdirSync(uploads,{recursive:true});
    const original = await sharp({create:{width:2000,height:1000,channels:4,background:'#0788aa'}}).png().toBuffer();
    fs.writeFileSync(path.join(uploads,'photo.png'),original);
    fs.writeFileSync(path.join(uploads,'broken.jpg'),'not an image');
    fs.writeFileSync(path.join(uploads,'logo.svg'),'<svg xmlns="http://www.w3.org/2000/svg"/>');
    fs.writeFileSync(path.join(uploads,'small.png'),await sharp(original).resize(100).png().toBuffer());
    fs.writeFileSync(path.join(dir,'index.html'),'<!doctype html><html><body><img class="post-hero" src="/assets/uploads/photo.png" alt="Ảnh thật"><img src="/assets/uploads/small.png" alt="Nhỏ"><img src="https://external.invalid/photo.jpg" alt="Ngoài"><img src="/assets/uploads/missing.png"><img src="/assets/uploads/broken.jpg"><img src="/assets/uploads/logo.svg"></body></html>');
    const report = await optimizeSiteImages(dir);
    assert.equal(report.length,2);
    assert(fs.readFileSync(path.join(uploads,'photo.png')).equals(original),'Original image changed');
    const $ = cheerio.load(fs.readFileSync(path.join(dir,'index.html'),'utf8'));
    const hero = $('img.post-hero');
    assert.equal(hero.attr('alt'),'Ảnh thật');
    assert.equal(hero.attr('width'),'1200');
    assert.equal(hero.attr('height'),'600');
    assert.equal(hero.attr('loading'),undefined,'Hero must not be lazy loaded');
    assert(hero.attr('srcset').includes('480w') && hero.attr('srcset').includes('800w'));
    const meta = await sharp(path.join(dir,hero.attr('src').slice(1))).metadata();
    assert.equal(meta.format,'webp');assert.equal(meta.width,1200);assert.equal(meta.height,600);
    assert.equal($('img[alt="Nhỏ"]').attr('width'),'100','Small image enlarged');
    for (const src of ['https://external.invalid/photo.jpg','/assets/uploads/missing.png','/assets/uploads/broken.jpg','/assets/uploads/logo.svg']) assert($(`img[src="${src}"]`).length,'Fallback removed: '+src);
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
  // Audit actual generated pages, including all original sample articles.
  const manifest = fs.readFileSync('dist/sitemap.xml','utf8');
  const routes = [...manifest.matchAll(/<loc>https:\/\/gmtech.win([^<]+)<\/loc>/g)].map(m=>m[1]);
  for (const route of routes) {
    const $ = cheerio.load(fs.readFileSync(path.join('dist',decodeURIComponent(route),'index.html'),'utf8'));
    assert.equal($('h1').length,1,'H1 structure: '+route);
    assert.equal($('title').length,1);
    assert($('meta[name="description"]').attr('content'));
    assert.equal($('link[rel="canonical"]').attr('href'),'https://gmtech.win'+route.replaceAll('&amp;','&'));
    for (const img of $('img').toArray()) {
      const src = $(img).attr('src');
      assert($(img).attr('alt') !== undefined,'Missing alt: '+route);
      if(src && src.startsWith('/')) assert(fs.existsSync(path.join('dist',decodeURIComponent(src))), 'Missing asset: '+src);
    }
  }
  console.log(`SEO tests passed: metadata override/fallback/escaping, H1, original preservation, dimensions, WebP, failure fallback and ${routes.length} public pages.`);
}
run().catch(error=>{console.error(error);process.exitCode=1;});
