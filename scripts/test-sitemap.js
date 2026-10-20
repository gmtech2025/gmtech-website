'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {sitemapRoutes,writeSitemap} = require('./build-sitemap');
const original = {posts:[{slug:'published-post',published:true},{slug:'draft',published:false}],products:[{slug:'real-laptop'},{slug:'demo',is_sample:true}],services:[{slug:'it-service'}],legacy:[{url:'/bai-viet/legacy/'},{url:'https://other.example/'}]};
assert(sitemapRoutes({posts:[{slug:'bài-viết-mới'}]}).includes('/bai-viet/'+encodeURIComponent('bài-viết-mới')+'/'));
const routes = sitemapRoutes(original);
assert(routes.includes('/quizmark/'));
assert(routes.includes('/bai-viet/published-post/'));
assert(!routes.some(route=>/draft|demo|other/.test(route)));
const withNew = {...original,posts:[...original.posts,{slug:'new-cms-post'}]};
assert(sitemapRoutes(withNew).includes('/bai-viet/new-cms-post/'));
assert(!sitemapRoutes({...original,posts:[]}).includes('/bai-viet/published-post/'));
assert.equal(sitemapRoutes({...original,legacy:[...original.legacy,{url:'/bai-viet/published-post/'}]}).length,routes.length);
assert.throws(()=>sitemapRoutes({posts:[{slug:'../unsafe'}]}),/Invalid/);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gmtech-sitemap-'));
try {
  assert.throws(()=>writeSitemap(dir,original),/does not exist/);
  for(const route of sitemapRoutes(withNew)){
    const folder=path.join(dir,route.slice(1));fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'index.html'),'<!doctype html>');
  }
  writeSitemap(dir,withNew);
  assert(fs.readFileSync(path.join(dir,'sitemap.xml'),'utf8').includes('https://gmtech.win/bai-viet/new-cms-post/'));
  writeSitemap(dir,original);
  assert(!fs.readFileSync(path.join(dir,'sitemap.xml'),'utf8').includes('new-cms-post'));
} finally {fs.rmSync(dir,{recursive:true,force:true});}
console.log('Sitemap tests passed: publication, new/removal updates, samples, duplicates, invalid paths and missing pages.');
