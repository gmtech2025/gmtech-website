'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const cheerio = require('cheerio');

function htmlFiles(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.isFile() && entry.name.endsWith('.html') ? [file] : [];
  });
}

async function optimizeSiteImages(dist) {
  const uploads = path.resolve(dist, 'assets/uploads');
  const output = path.join(dist, 'assets/optimized');
  const cache = new Map();
  const report = [];
  async function variants(src) {
    // Only local uploaded photos/covers. Never fetch remote URLs or touch the
    // brand artwork, CSS sprites, SVGs, GIFs, or animated images.
    if (!src || !src.startsWith('/assets/uploads/') || /[?#]/.test(src)) return null;
    if (cache.has(src)) return cache.get(src);
    cache.set(src, null);
    let file;
    try { file = path.resolve(dist, '.' + decodeURIComponent(src)); } catch { return null; }
    if (!file.startsWith(uploads + path.sep) || !/\.(png|jpe?g|webp)$/i.test(file) || !fs.existsSync(file)) return null;
    if (!fs.realpathSync(file).startsWith(fs.realpathSync(uploads) + path.sep)) return null;
    try {
      const bytes = fs.readFileSync(file);
      const meta = await sharp(bytes, {limitInputPixels:40000000}).metadata();
      if (!meta.width || !meta.height || (meta.pages || 1) > 1) return null;
      const rotated = [5,6,7,8].includes(meta.orientation);
      const nativeWidth = rotated ? meta.height : meta.width;
      const maxWidth = Math.min(nativeWidth, 1200);
      const widths = [...new Set([480,800,maxWidth].filter(w => w <= maxWidth))].sort((a,b)=>a-b);
      const hash = crypto.createHash('sha256').update(bytes).update('webp-q86-v1').digest('hex').slice(0,12);
      const name = path.basename(file, path.extname(file)).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').replace(/[^a-zA-Z0-9-]/g,'-').slice(0,70) || 'image';
      fs.mkdirSync(output, {recursive:true});
      const generated = [];
      for (const width of widths) {
        const filename = `${name}-${hash}-${width}.webp`;
        const info = await sharp(bytes, {limitInputPixels:40000000}).rotate().resize({width,withoutEnlargement:true}).webp({quality:86,effort:4}).toFile(path.join(output,filename));
        generated.push({src:'/assets/optimized/'+filename,width:info.width,height:info.height,bytes:info.size});
      }
      const largest = generated[generated.length-1];
      const result = {...largest,srcset:generated.map(x=>`${x.src} ${x.width}w`).join(', ')};
      cache.set(src, result);
      report.push({original:src,originalBytes:bytes.length,...result});
      return result;
    } catch (error) {
      console.warn(`Giữ ảnh gốc ${src}: ${error.message}`);
      return null;
    }
  }
  let updated = 0;
  for (const file of htmlFiles(dist)) {
    const original = fs.readFileSync(file,'utf8');
    const $ = cheerio.load(original, {decodeEntities:false});
    let changed = false;
    for (const node of $('img').toArray()) {
      const img = $(node);
      // Respect any explicit art direction already supplied by the author.
      if (img.attr('srcset') || img.parent().is('picture')) continue;
      const result = await variants(img.attr('src'));
      if (!result) continue;
      img.attr({src:result.src,srcset:result.srcset,width:String(result.width),height:String(result.height),decoding:'async'});
      const hero = img.hasClass('post-hero');
      img.attr('sizes', hero ? '(max-width: 900px) 100vw, 900px' : '(max-width: 540px) 100vw, (max-width: 900px) 50vw, 400px');
      if (!hero && !img.attr('loading')) img.attr('loading','lazy');
      changed = true;
      updated++;
    }
    if (changed) fs.writeFileSync(file,$.html(),'utf8');
  }
  // Older client renderers keep their JSON contract; expose responsive fields
  // as additive optional properties, never overwrite original CMS sources.
  for (const [name,key] of [['posts','thumbnail'],['products','image'],['services','image']]) {
    const file = path.join(dist,'data',name+'.json');
    if (!fs.existsSync(file)) continue;
    const entries = JSON.parse(fs.readFileSync(file,'utf8'));
    for (const entry of entries) {
      const result = await variants(entry[key]);
      if (result) Object.assign(entry,{[key]:result.src,image_srcset:result.srcset,image_width:result.width,image_height:result.height});
    }
    fs.writeFileSync(file,JSON.stringify(entries,null,2),'utf8');
  }
  console.log(`Ảnh: ${report.length} ảnh nguồn, ${updated} vị trí HTML có WebP responsive; giữ nguyên ảnh gốc.`);
  return report;
}
module.exports = {optimizeSiteImages};
