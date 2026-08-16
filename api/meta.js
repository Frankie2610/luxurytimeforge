const DEFAULT_COVER='/social-cover.jpg';
const clean=value=>String(value||'').trim();
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
const text=value=>clean(value).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
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

async function readPublic(path){
  const base=publicDatabaseUrl();
  if(!base)return null;
  const response=await fetch(`${base}/${path}.json`,{headers:{Accept:'application/json','Cache-Control':'no-cache'}});
  if(!response.ok)throw new Error(`Firebase public read failed (${response.status})`);
  return response.json();
}

async function readCatalog(path){
  try{const privateValue=await readPrivate(path);if(privateValue!=null)return privateValue}catch{}
  return readPublic(path);
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

async function sendMerchantFeed(req,res){
  if((req.method||'GET')!=='GET')return res.status(405).end('Method not allowed');
  const site=baseSite();let products=[],productGroups=[];
  try{[products,productGroups]=await Promise.all([readCatalog('timeforge/products').then(list),readCatalog('timeforge/productGroups').then(list)])}catch(error){console.error('[TimeForge] Merchant feed catalog read failed:',error instanceof Error?error.message:error)}
  const active=products.filter(product=>{
    const images=Array.isArray(product?.images)?product.images.filter(Boolean):[];
    return product?.handle&&product?.published!==false&&product?.status==='active'&&Number(product?.price)>0&&images.length>0;
  });
  const groupFor=product=>productGroups.find(group=>group?.status==='active'&&list(group.items).some(item=>item?.productId===product.id||clean(item?.sku).toUpperCase()===clean(product.sku).toUpperCase()));
  const money=value=>{const amount=Number(value);return Number.isFinite(amount)&&amount>=0?`${Math.round(amount)} VND`:'0 VND'};
  const digits=value=>String(value||'').replace(/\D/g,'');
  const absoluteProductImage=value=>absolute(value,site);
  const items=active.map(product=>{
    const current=Math.max(0,Number(product.price)||0),compare=Math.max(0,Number(product.compareAtPrice)||0),onSale=compare>current&&current>0;
    const gtin=digits(product.barcode),validGtin=[8,12,13,14].includes(gtin.length)?gtin:'';
    const images=(Array.isArray(product.images)?product.images:[]).map(absoluteProductImage).filter(Boolean);
    const description=text(product.descriptionText||product.descriptionHtml||`${product.title} tại Luxury Timeforge`).slice(0,5000);
    const group=groupFor(product);
    return `<item><g:id>${esc(product.sku||product.id)}</g:id><title>${esc(product.title)}</title><description>${esc(description)}</description><link>${esc(`${site}/products/${encodeURIComponent(product.handle)}`)}</link>${images[0]?`<g:image_link>${esc(images[0])}</g:image_link>`:''}${images.slice(1,10).map(image=>`<g:additional_image_link>${esc(image)}</g:additional_image_link>`).join('')}<g:availability>${Number(product.inventory)>0?'in_stock':'out_of_stock'}</g:availability><g:condition>new</g:condition><g:price>${esc(money(onSale?compare:current))}</g:price>${onSale?`<g:sale_price>${esc(money(current))}</g:sale_price>`:''}${clean(product.vendor)?`<g:brand>${esc(product.vendor)}</g:brand>`:''}${validGtin?`<g:gtin>${esc(validGtin)}</g:gtin>`:''}${clean(product.sku)?`<g:mpn>${esc(product.sku)}</g:mpn>`:''}${clean(product.category||product.productType)?`<g:product_type>${esc(product.category||product.productType)}</g:product_type>`:''}${group?`<g:item_group_id>${esc(group.id||group.skuPrefix||group.name)}</g:item_group_id>`:''}<g:identifier_exists>${validGtin||clean(product.sku)?'yes':'no'}</g:identifier_exists></item>`;
  }).join('\n');
  const xml=`<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0"><channel><title>Luxury Timeforge</title><link>${esc(site)}</link><description>Google Merchant Center product feed</description>${items}</channel></rss>`;
  res.setHeader('Content-Type','application/xml; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=900, stale-while-revalidate=3600');
  res.setHeader('X-TimeForge-Feed-Items',String(active.length));
  return res.status(200).send(xml);
}

async function sendSitemap(_req,res){
  const site=baseSite(),today=new Date().toISOString().slice(0,10);let products=[],collections=[],posts=[];
  try{[products,collections,posts]=await Promise.all([readPrivate('timeforge/products').then(list),readPrivate('timeforge/collections').then(list),readPrivate('timeforge/blogPosts').then(list)])}catch{}
  const urls=[
    {loc:'/',priority:'1.0',freq:'daily'},{loc:'/collections',priority:'0.9',freq:'daily'},{loc:'/watch-finder',priority:'0.7',freq:'monthly'},{loc:'/blogs',priority:'0.7',freq:'weekly'},
    {loc:'/pages/about',priority:'0.6',freq:'monthly'},{loc:'/pages/warranty',priority:'0.7',freq:'monthly'},{loc:'/pages/shipping',priority:'0.6',freq:'monthly'},{loc:'/pages/returns',priority:'0.6',freq:'monthly'},
    ...collections.filter(c=>c?.handle&&c?.status!=='draft').map(c=>({loc:`/collections/${encodeURIComponent(c.handle)}`,priority:'0.8',freq:'weekly',lastmod:String(c.updatedAt||today).slice(0,10)})),
    ...products.filter(p=>p?.handle&&p?.published!==false&&p?.status==='active').map(p=>({loc:`/products/${encodeURIComponent(p.handle)}`,priority:'0.8',freq:'weekly',lastmod:String(p.updatedAt||today).slice(0,10)})),
    ...posts.filter(post=>post?.handle&&post?.status==='published').map(post=>({loc:`/blogs/${encodeURIComponent(post.handle)}`,priority:'0.65',freq:'monthly',lastmod:String(post.updatedAt||post.publishedAt||today).slice(0,10)})),
  ];
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${esc(site+u.loc)}</loc>${u.lastmod?`<lastmod>${esc(u.lastmod)}</lastmod>`:''}<changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>`;
  res.setHeader('Content-Type','application/xml; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(xml);
}

function sendRobots(_req,res){
  const site=baseSite();
  const body=[
    'User-agent: *','Allow: /','Disallow: /admin/','Disallow: /checkout','Disallow: /account/','Disallow: /order-confirmation/','Disallow: /payment/','Disallow: /search',`Sitemap: ${site}/sitemap.xml`,'',
  ].join('\n');
  res.setHeader('Content-Type','text/plain; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(body);
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
  if(resource==='robots'){if((req.method||'GET')!=='GET')return res.status(405).end('Method not allowed');return sendRobots(req,res)}
  if(resource==='merchant-feed')return sendMerchantFeed(req,res);
  if(resource==='social-image')return sendSocialImage(req,res);
  return res.status(404).json({error:'Unknown metadata resource'});
}
