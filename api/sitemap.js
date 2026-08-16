const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
const base=()=>String(process.env.PUBLIC_SITE_URL||process.env.VITE_PUBLIC_SITE_URL||'https://luxurytimeforge.vercel.app').replace(/\/$/,'');
async function read(path){const db=String(process.env.FIREBASE_DATABASE_URL||'').replace(/\/$/,''),auth=process.env.FIREBASE_DATABASE_AUTH;if(!db||!auth)return null;const r=await fetch(`${db}/${path}.json?auth=${encodeURIComponent(auth)}`,{headers:{'Cache-Control':'no-store'}});return r.ok?r.json():null}
const list=value=>Array.isArray(value)?value.filter(Boolean):Object.values(value||{}).filter(Boolean);
export default async function handler(_req,res){
  const site=base(),today=new Date().toISOString().slice(0,10);let products=[],collections=[];
  try{[products,collections]=await Promise.all([read('timeforge/products').then(list),read('timeforge/collections').then(list)])}catch{}
  const urls=[
    {loc:'/',priority:'1.0',freq:'daily'},{loc:'/collections',priority:'0.9',freq:'daily'},{loc:'/watch-finder',priority:'0.7',freq:'monthly'},{loc:'/blogs',priority:'0.7',freq:'weekly'},
    {loc:'/pages/about',priority:'0.6',freq:'monthly'},{loc:'/pages/warranty',priority:'0.7',freq:'monthly'},{loc:'/pages/shipping',priority:'0.6',freq:'monthly'},{loc:'/pages/returns',priority:'0.6',freq:'monthly'},
    ...collections.filter(c=>c?.handle&&c?.status!=='draft').map(c=>({loc:`/collections/${encodeURIComponent(c.handle)}`,priority:'0.8',freq:'weekly',lastmod:String(c.updatedAt||today).slice(0,10)})),
    ...products.filter(p=>p?.handle&&p?.published!==false&&p?.status==='active').map(p=>({loc:`/products/${encodeURIComponent(p.handle)}`,priority:'0.8',freq:'weekly',lastmod:String(p.updatedAt||today).slice(0,10)})),
  ];
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${esc(site+u.loc)}</loc>${u.lastmod?`<lastmod>${esc(u.lastmod)}</lastmod>`:''}<changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>`;
  res.setHeader('Content-Type','application/xml; charset=utf-8');res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');return res.status(200).send(xml);
}
