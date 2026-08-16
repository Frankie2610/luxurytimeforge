const DEFAULT_COVER='/social-cover.jpg';
const clean=value=>String(value||'').trim();
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
const baseSite=()=>String(process.env.PUBLIC_SITE_URL||process.env.VITE_PUBLIC_SITE_URL||'https://luxurytimeforge.vercel.app').replace(/\/$/,'');
const publicDatabaseUrl=()=>clean(process.env.FIREBASE_DATABASE_URL||process.env.VITE_FIREBASE_DATABASE_URL).replace(/\/$/,'');
const requestOrigin=req=>{
  const host=clean(req.headers['x-forwarded-host']||req.headers.host).split(',')[0].trim();
  const proto=clean(req.headers['x-forwarded-proto']||'https').split(',')[0].trim()||'https';
  return host?`${proto}://${host}`:baseSite();
};
const absolute=(value,origin)=>{
  const raw=clean(value);
  if(!raw)return'';
  if(/^https?:\/\//i.test(raw))return raw;
  return `${origin}${raw.startsWith('/')?'':'/'}${raw}`;
};
const list=value=>Array.isArray(value)?value.filter(Boolean):Object.values(value||{}).filter(Boolean);

function resourceFromRequest(req){
  const direct=clean(req.query?.resource);
  if(direct)return direct;
  try{return clean(new URL(req.url||'','http://localhost').searchParams.get('resource'))}catch{return''}
}

async function readPrivate(path){
  const db=publicDatabaseUrl(),auth=process.env.FIREBASE_DATABASE_AUTH;
  if(!db||!auth)return null;
  const r=await fetch(`${db}/${path}.json?auth=${encodeURIComponent(auth)}`,{headers:{'Cache-Control':'no-store'}});
  return r.ok?r.json():null;
}

async function readPublicStoreProfile(){
  const base=publicDatabaseUrl();
  if(!base)return null;
  const response=await fetch(`${base}/timeforge/settings/store.json`,{headers:{Accept:'application/json','Cache-Control':'no-cache'}});
  if(!response.ok)throw new Error(`Firebase public profile read failed (${response.status})`);
  return response.json();
}

async function fetchImage(url){
  const response=await fetch(url,{redirect:'follow',headers:{Accept:'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'}});
  if(!response.ok)throw new Error(`Social image fetch failed (${response.status})`);
  const contentType=clean(response.headers.get('content-type')).split(';')[0].toLowerCase();
  if(!contentType.startsWith('image/'))throw new Error('Social image source is not an image');
  const buffer=Buffer.from(await response.arrayBuffer());
  if(!buffer.length)throw new Error('Social image is empty');
  if(buffer.length>12*1024*1024)throw new Error('Social image exceeds 12 MB');
  return{buffer,contentType};
}

async function sendSitemap(_req,res){
  const site=baseSite(),today=new Date().toISOString().slice(0,10);let products=[],collections=[];
  try{[products,collections]=await Promise.all([readPrivate('timeforge/products').then(list),readPrivate('timeforge/collections').then(list)])}catch{}
  const urls=[
    {loc:'/',priority:'1.0',freq:'daily'},{loc:'/collections',priority:'0.9',freq:'daily'},{loc:'/watch-finder',priority:'0.7',freq:'monthly'},{loc:'/blogs',priority:'0.7',freq:'weekly'},
    {loc:'/pages/about',priority:'0.6',freq:'monthly'},{loc:'/pages/warranty',priority:'0.7',freq:'monthly'},{loc:'/pages/shipping',priority:'0.6',freq:'monthly'},{loc:'/pages/returns',priority:'0.6',freq:'monthly'},
    ...collections.filter(c=>c?.handle&&c?.status!=='draft').map(c=>({loc:`/collections/${encodeURIComponent(c.handle)}`,priority:'0.8',freq:'weekly',lastmod:String(c.updatedAt||today).slice(0,10)})),
    ...products.filter(p=>p?.handle&&p?.published!==false&&p?.status==='active').map(p=>({loc:`/products/${encodeURIComponent(p.handle)}`,priority:'0.8',freq:'weekly',lastmod:String(p.updatedAt||today).slice(0,10)})),
  ];
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${esc(site+u.loc)}</loc>${u.lastmod?`<lastmod>${esc(u.lastmod)}</lastmod>`:''}<changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>`;
  res.setHeader('Content-Type','application/xml; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(xml);
}

async function sendSocialImage(req,res){
  if(!['GET','HEAD'].includes(req.method||'GET'))return res.status(405).end('Method not allowed');
  const origin=requestOrigin(req);
  let source=absolute(DEFAULT_COVER,origin);
  let sourceKind='default-cover';
  try{
    const profile=await readPublicStoreProfile();
    if(clean(profile?.socialShareImage)){source=absolute(profile.socialShareImage,origin);sourceKind='social-share'}
    else if(clean(profile?.logoImage)){source=absolute(profile.logoImage,origin);sourceKind='store-logo'}
  }catch(error){console.warn('[TimeForge] Social image profile fallback:',error instanceof Error?error.message:error)}
  try{
    let image;
    try{image=await fetchImage(source)}catch(primaryError){
      if(sourceKind==='default-cover')throw primaryError;
      source=absolute(DEFAULT_COVER,origin);sourceKind='default-cover';image=await fetchImage(source);
    }
    res.setHeader('Content-Type',image.contentType);
    res.setHeader('Cache-Control','public, max-age=300, s-maxage=300, stale-while-revalidate=86400');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('X-TimeForge-Social-Source',sourceKind);
    res.setHeader('Content-Length',String(image.buffer.length));
    if(req.method==='HEAD')return res.status(200).end();
    return res.status(200).send(image.buffer);
  }catch(error){
    console.error('[TimeForge] Social image failed:',error instanceof Error?error.message:error);
    return res.status(502).end('Social image unavailable');
  }
}

export default async function handler(req,res){
  const resource=resourceFromRequest(req);
  if(resource==='sitemap'){
    if((req.method||'GET')!=='GET')return res.status(405).end('Method not allowed');
    return sendSitemap(req,res);
  }
  if(resource==='social-image')return sendSocialImage(req,res);
  return res.status(404).json({error:'Unknown metadata resource'});
}
