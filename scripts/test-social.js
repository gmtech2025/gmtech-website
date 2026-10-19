'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {metadata,sharing,FACEBOOK}=require('./social');
const {catalogPage,articlePage}=require('./build-layout');
const url='/san-pham/test/',title='Máy "A" & B';
assert(metadata(title,url,{image:'/assets/a.jpg',description:'Mô tả'}).includes('https://gmtech.win/assets/a.jpg'));
assert(metadata(title,url).includes('Máy &quot;A&quot; &amp; B'));
const bar=sharing(title,url,true);
assert(bar.includes(FACEBOOK.replaceAll('&','&amp;')));
assert(bar.includes('u=https%3A%2F%2Fgmtech.win%2Fsan-pham%2Ftest%2F'));
for(const html of [catalogPage({title:'Test',slug:'test',description:'Specific product',image:'/assets/a.jpg',body:'Test'},'products'),articlePage({title:'Post',slug:'post',description:'Specific article',thumbnail:'/assets/post.jpg',html:'<p>Post</p>'})]){
 assert(html.includes('property="og:image"'));assert(html.includes('data-copy-link'));assert(html.includes('floating-messenger'));assert(html.includes('/js/social-sharing.js'));
}
const source=fs.readFileSync('js/social-sharing.js','utf8');
async function client(navigator){
 const handlers={},status={textContent:''},input={focus(){this.focused=true},select(){this.selected=true}},manual={hidden:true,querySelector(){return input}},native={hidden:true,addEventListener(name,fn){handlers.share=fn}},copy={addEventListener(name,fn){handlers.copy=fn}};
 const section={dataset:{shareUrl:'https://gmtech.win/san-pham/test/',shareTitle:'Test'},querySelector(s){return {'.share-status':status,'.share-manual':manual,'[data-native-share]':native,'[data-copy-link]':copy}[s]}};
 vm.runInNewContext(source,{navigator,document:{querySelectorAll(){return[section]}}});
 return{handlers,status,manual,native,input};
}
(async()=>{
 let copied='';let c=await client({clipboard:{writeText:async v=>{copied=v}}});assert(c.native.hidden);await c.handlers.copy();assert.equal(copied,'https://gmtech.win/san-pham/test/');assert.match(c.status.textContent,/Đã sao chép/);
 c=await client({});await c.handlers.copy();assert(!c.manual.hidden&&c.input.selected);
 c=await client({clipboard:{writeText:async()=>{throw Error('denied')}}});await c.handlers.copy();assert(!c.manual.hidden);
 c=await client({share:async()=>{throw Object.assign(Error(),{name:'AbortError'})}});assert(!c.native.hidden);await c.handlers.share();assert.equal(c.status.textContent,'');
 c=await client({share:async()=>{throw Error('unsupported')}});await c.handlers.share();assert.match(c.status.textContent,/Sao chép/);
 console.log('Social tests passed: canonical sharing URLs, escaped metadata, page integration, copy success/denied/unavailable, native share cancellation/error.');
})();
