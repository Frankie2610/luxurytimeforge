export const money=(n:number)=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(n||0);
export const slugify=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
export const strip=(h:string)=>new DOMParser().parseFromString(h||'','text/html').body.textContent?.replace(/\s+/g,' ').trim()||'';
export const uid=(p='id')=>`${p}-${crypto.randomUUID()}`;
export const discount=(p:number,c:number)=>c>p?Math.round((1-p/c)*100):0;
