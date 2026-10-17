(()=>{'use strict';
 document.querySelectorAll('[data-share-url]').forEach(section=>{
  const url=section.dataset.shareUrl,title=section.dataset.shareTitle;
  const status=section.querySelector('.share-status'),manual=section.querySelector('.share-manual'),native=section.querySelector('[data-native-share]');
  const showManual=()=>{manual.hidden=false;const input=manual.querySelector('input');input.focus();input.select();status.textContent='Hãy sao chép liên kết trong ô bên dưới để gửi qua Zalo hoặc Facebook.'};
  section.querySelector('[data-copy-link]').addEventListener('click',async()=>{
   try{if(!navigator.clipboard?.writeText){showManual();return}await navigator.clipboard.writeText(url);manual.hidden=true;status.textContent='Đã sao chép liên kết. Bạn có thể dán vào Zalo hoặc Facebook.'}catch{showManual()}
  });
  if(typeof navigator.share==='function'){
   native.hidden=false;
   native.addEventListener('click',async()=>{
    try{await navigator.share({title,url});status.textContent='Đã mở chia sẻ trên thiết bị.'}catch(error){if(error.name==='AbortError'){status.textContent='';return}status.textContent='Thiết bị chưa chia sẻ được. Bạn có thể dùng Sao chép liên kết hoặc Chia sẻ Facebook.'}
   });
  }
 });
})();
