'use strict';
// Publication date is explicit content data, never a file edit time.
function selectLatest(products, posts, now = Date.now()) {
  const eligible = item => item.published !== false && item.published !== 'false' && ![true,'true'].includes(item.is_sample) && Number.isFinite(Date.parse(item.date)) && Date.parse(item.date) <= now;
  const newest = list => [...list].sort((a,b) => Date.parse(b.date)-Date.parse(a.date) || String(a.slug || a.url).localeCompare(String(b.slug || b.url))).slice(0,2);
  return {
    products: newest(products.filter(item => eligible(item) && item.availability !== 'sold-out')),
    posts: newest(posts.filter(eligible))
  };
}
module.exports = {selectLatest};
