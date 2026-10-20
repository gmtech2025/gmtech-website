'use strict';
// Branding belongs to the renderer; editors can leave SEO fields empty.
function documentTitle(title, override) {
  const base = String(override || '').trim() || String(title || '').trim();
  return base.replace(/(?:\s*[|–—-]\s*GM\s*TECH\s*)+$/i, '').trim() + ' | GMTECH';
}
module.exports = {documentTitle};
