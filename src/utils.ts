export const money=(n:number)=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(n||0);
export const slugify=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
export const strip=(h:string)=>new DOMParser().parseFromString(h||'','text/html').body.textContent?.replace(/\s+/g,' ').trim()||'';
const browserUuid=()=>{
  if(typeof globalThis.crypto?.randomUUID==='function')return globalThis.crypto.randomUUID();
  const bytes=new Uint8Array(16);
  if(typeof globalThis.crypto?.getRandomValues==='function')globalThis.crypto.getRandomValues(bytes);
  else for(let index=0;index<bytes.length;index+=1)bytes[index]=Math.floor(Math.random()*256);
  bytes[6]=(bytes[6]&15)|64;
  bytes[8]=(bytes[8]&63)|128;
  const hex=[...bytes].map(value=>value.toString(16).padStart(2,'0'));
  return `${hex.slice(0,4).join('')}-${hex.slice(4,6).join('')}-${hex.slice(6,8).join('')}-${hex.slice(8,10).join('')}-${hex.slice(10).join('')}`;
};
export const uid=(p='id')=>`${p}-${browserUuid()}`;
export const discount=(p:number,c:number)=>c>p?Math.round((1-p/c)*100):0;
