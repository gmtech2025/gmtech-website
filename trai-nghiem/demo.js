"use strict";
(function(){
const $=id=>document.getElementById(id);
const format=n=>new Intl.NumberFormat("vi-VN").format(n);
const mode=document.body.dataset.demo;
if(mode==="classes"){
 const seed=[
  {name:"Học viên mẫu 01",group:"Tiếng Anh A1",present:true,fee:600000,paid:600000},
  {name:"Học viên mẫu 02",group:"Tiếng Anh A1",present:false,fee:600000,paid:0},
  {name:"Học viên mẫu 03",group:"Tiếng Anh A1",present:true,fee:600000,paid:300000},
  {name:"Học viên mẫu 04",group:"Tiếng Anh B1",present:true,fee:700000,paid:700000},
  {name:"Học viên mẫu 05",group:"Tiếng Anh B1",present:false,fee:700000,paid:200000},
  {name:"Học viên mẫu 06",group:"Tiếng Anh B1",present:true,fee:700000,paid:700000}
 ];
 let people=seed.map(x=>({...x}));
 const render=()=>{
   const group=$("classFilter").value;
   const selected=people.filter(s=>group==="all"||s.group===group);
   $("studentCount").textContent=String(selected.length);
   $("presentCount").textContent=String(selected.filter(s=>s.present).length);
   $("outstanding").textContent=format(selected.reduce((sum,s)=>sum+s.fee-s.paid,0))+" đ";
   const tb=$("studentRows");tb.replaceChildren();
   selected.forEach(s=>{
     const tr=document.createElement("tr");
     [s.name,s.group,format(s.fee)+" đ",format(s.paid)+" đ"].forEach(v=>{
       const td=document.createElement("td");td.textContent=v;tr.appendChild(td);
     });
     const td=document.createElement("td");
     const b=document.createElement("button");b.type="button";b.textContent=s.present?"✓ Có mặt":"— Vắng";
     b.setAttribute("aria-label","Đổi trạng thái điểm danh của "+s.name);
     b.addEventListener("click",()=>{s.present=!s.present;render()});
     td.appendChild(b);tr.appendChild(td);tb.appendChild(tr);
   });
 };
 $("classFilter").addEventListener("change",render);
 $("resetDemo").addEventListener("click",()=>{people=seed.map(x=>({...x}));$("classFilter").value="all";render();$("feedback").textContent="Đã khôi phục dữ liệu giả lập.";});
 render();
}
if(mode==="lesson"){
 const ids=["subject","grade","topic","goals","activities","assessment"];
 const render=()=>{
  $("pTitle").textContent=$("topic").value.trim()||"Chủ đề bài dạy";
  $("pMeta").textContent=[$("subject").value,$("grade").value].filter(Boolean).join(" · ");
  $("pGoals").textContent=$("goals").value.trim()||"(Chưa nhập)";
  $("pActivities").textContent=$("activities").value.trim()||"(Chưa nhập)";
  $("pAssessment").textContent=$("assessment").value.trim()||"(Chưa nhập)";
 };
 ids.forEach(id=>$(id).addEventListener("input",render));
 $("exportLesson").addEventListener("click",()=>{
  const text="GIÁO ÁN MINH HỌA – CẦN GIÁO VIÊN KIỂM DUYỆT\n\n"+
   "Môn: "+$("subject").value+"\nKhối lớp: "+$("grade").value+"\nChủ đề: "+$("topic").value+
   "\n\nMỤC TIÊU\n"+$("goals").value+"\n\nHOẠT ĐỘNG\n"+$("activities").value+
   "\n\nĐÁNH GIÁ\n"+$("assessment").value+
   "\n\nLưu ý: Bản demo chỉ là mẫu soạn thảo, không tự xác nhận đáp ứng mọi quy định giáo dục.\n";
  const url=URL.createObjectURL(new Blob(["\ufeff",text],{type:"text/plain;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download="GMTECH-giao-an-demo.txt";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),500);
  $("feedback").textContent="Đã tạo tệp văn bản để tải về trên thiết bị.";
 });
 render();
}
if(mode==="sim"){
 const render=()=>{
  const numerator=Number($("numerator").value),denominator=Number($("denominator").value);
  const ratio=numerator/denominator;
  $("numValue").textContent=String(numerator);
  $("denValue").textContent=String(denominator);
  $("fractionValue").textContent=numerator+" / "+denominator+" = "+(ratio*100).toLocaleString("vi-VN",{maximumFractionDigits:1})+"%";
  $("fractionBar").style.width=Math.min(100,ratio*100)+"%";
  $("fractionBar").parentElement.setAttribute("aria-valuenow",String(Math.round(Math.min(1,ratio)*100)));
  $("fractionNote").textContent=numerator>denominator?"Tử số lớn hơn mẫu số: phân số lớn hơn 1. Thanh minh họa giới hạn ở 100%.":"Thay đổi các thanh trượt để xem tỷ lệ trực quan.";
 };
 ["numerator","denominator"].forEach(id=>$(id).addEventListener("input",render));
 render();
}
if(mode==="crm"){
 const seed=[
  {company:"Đơn vị minh họa A",service:"AI & Automation",stage:"Mới",amount:2000000},
  {company:"Trung tâm minh họa B",service:"EduTech K12",stage:"Đang trao đổi",amount:5000000},
  {company:"Doanh nghiệp minh họa C",service:"IT Outsourcing",stage:"Đã báo giá",amount:9000000}
 ];
 let leads=seed.map(x=>({...x}));
 const render=()=>{
  $("leadCount").textContent=leads.length;
  $("leadTalking").textContent=leads.filter(x=>x.stage==="Đang trao đổi").length;
  $("leadAmount").textContent=format(leads.reduce((s,x)=>s+x.amount,0))+" đ";
  const tb=$("leadRows");tb.replaceChildren();
  leads.filter(x=>$("stageFilter").value==="all"||x.stage===$("stageFilter").value).forEach((x,i)=>{
   const tr=document.createElement("tr");
   [x.company,x.service,x.stage,format(x.amount)+" đ"].forEach(v=>{
    const td=document.createElement("td");td.textContent=v;tr.appendChild(td);
   });
   const td=document.createElement("td");const b=document.createElement("button");b.textContent="Xóa";
   b.addEventListener("click",()=>{leads=leads.filter(a=>a!==x);render()});
   td.appendChild(b);tr.appendChild(td);tb.appendChild(tr);
  });
 };
 $("stageFilter").addEventListener("change",render);
 $("leadForm").addEventListener("submit",e=>{
   e.preventDefault();
   const company=$("company").value.trim().slice(0,100);
   const amount=Number($("amount").value);
   if(!company||!Number.isFinite(amount)||amount<0||amount>1e12)return;
   leads.push({company,service:$("service").value,stage:$("stage").value,amount});
   $("leadForm").reset();$("feedback").textContent="Đã thêm vào phiên demo này (không gửi lên máy chủ).";render();
 });
 $("resetDemo").addEventListener("click",()=>{leads=seed.map(x=>({...x}));$("stageFilter").value="all";$("feedback").textContent="Đã khôi phục dữ liệu mẫu.";render()});
 render();
}
})();
