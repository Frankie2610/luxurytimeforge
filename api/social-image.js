const DEFAULT_COVER='/social-cover.jpg';
const clean=value=>String(value||'').trim();
const publicDatabaseUrl=()=>clean(process.env.FIREBASE_DATABASE_URL||process.env.VITE_FIREBASE_DATABASE_URL).replace(/\/$/,'');
const requestOrigin=req=>{
  const host=clean(req.headers['x-forwarded-host']||req.headers.host).split(',')[0].trim();
  const proto=clean(req.headers['x-forwarded-proto']||'https').split(',')[0].trim()||'https';
  return host?`${proto}://${host}`:'https://luxurytimeforge.vercel.app';
};
const absolute=(value,origin)=>{
  const raw=clean(value);
  if(!raw)return'';
  if(/^https?:\/\//i.test(raw))return raw;
  return `${origin}${raw.startsWith('/')?'':'/'}${raw}`;
};
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
export default async function handler(req,res){
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
