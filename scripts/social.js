'use strict';
const FACEBOOK='https://www.facebook.com/share/1JN1cQmjFv/?mibextid=wwXIfr';
const ZALO='https://zalo.me/0908215486';
const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function metadata(title,url,meta={}){
 const canonical='https://gmtech.win'+url;
 const description=meta.description||'GMTECH — Giải pháp CNTT, laptop và hỗ trợ doanh nghiệp tại Quảng Ngãi. Liên hệ 0908 215 486.';
 const image=meta.image||'/assets/gmtech-logo.png';
 const absoluteImage=image.startsWith('https://')?image:'https://gmtech.win'+image;
 return `<meta name="description" content="${escape(description)}"><meta property="og:site_name" content="GMTECH"><meta property="og:locale" content="vi_VN"><meta property="og:type" content="${meta.type==='article'?'article':'website'}"><meta property="og:title" content="${escape(title)} | GMTECH"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(canonical)}"><meta property="og:image" content="${escape(absoluteImage)}"><meta property="og:image:alt" content="${escape(title)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)} | GMTECH"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${escape(absoluteImage)}">`;
}
function sharing(title,route,product=false){
 const url='https://gmtech.win'+route;
 return `<section class="social-actions" aria-label="Chia sẻ và liên hệ" data-share-title="${escape(title)}" data-share-url="${escape(url)}"><h2>${product?'Chia sẻ sản phẩm · Hỏi GMTECH':'Chia sẻ bài viết · Trao đổi cùng GMTECH'}</h2><div class="social-buttons"><button type="button" data-native-share hidden>Chia sẻ…</button><button type="button" data-copy-link>Sao chép liên kết</button><a class="social-facebook" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer">Chia sẻ Facebook</a><a class="social-zalo" href="${ZALO}" target="_blank" rel="noopener noreferrer">${product?'Hỏi sản phẩm qua Zalo':'Trao đổi qua Zalo'}</a><a href="${escape(FACEBOOK)}" target="_blank" rel="noopener noreferrer">Liên hệ Facebook</a></div><p class="share-help">Chọn Zalo hoặc Facebook trong bảng chia sẻ của thiết bị nếu có, hoặc sao chép liên kết để gửi.</p><p class="share-status" role="status" aria-live="polite"></p><div class="share-manual" hidden><label>Liên kết để sao chép<input type="text" readonly value="${escape(url)}"></label></div></section>`;
}
module.exports={FACEBOOK,ZALO,metadata,sharing};
