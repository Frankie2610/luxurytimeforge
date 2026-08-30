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
const fetchWithTimeout=async(url,options={},timeoutMs=4500)=>{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),Math.max(500,timeoutMs));
  try{return await fetch(url,{...options,signal:controller.signal})}
  finally{clearTimeout(timer)}
};
const normalized=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
const canonicalStoreName=value=>normalized(value)==='luxury timeforge'?'Luxury TimeForge':clean(value)||'Luxury TimeForge';
const productGender=product=>list(product?.metafields).filter(field=>normalized(field?.namespace)==='custom'&&normalized(field?.key)==='gender').flatMap(field=>clean(field?.value).split(/[,;|/]/)).map(normalized);
const PUBLIC_PRODUCT_ATTRIBUTE_KEYS=new Map([
  ['gender','Giới tính'],['faceshape','Hình dạng mặt số'],['face_shape','Hình dạng mặt số'],['dial_shape','Hình dạng mặt số'],['watch_face_shape','Hình dạng mặt số'],
  ['facesize','Kích thước mặt số'],['face_size','Kích thước mặt số'],['case_size','Kích thước mặt số'],['diameter','Kích thước mặt số'],['duong_kinh','Kích thước mặt số'],
  ['bandmaterial','Chất liệu dây'],['band_material','Chất liệu dây'],['strap_material','Chất liệu dây'],['watch_band_material','Chất liệu dây'],
  ['bandcolor','Màu dây'],['band_color','Màu dây'],['strap_color','Màu dây'],['casecolor','Màu vỏ'],['case_color','Màu vỏ'],['watch_case_color','Màu vỏ'],
  ['classification','Phân loại'],['watch_type','Phân loại'],['movement','Bộ máy'],['phan_loai','Phân loại'],
]);
const productAttributes=product=>{const out={};for(const field of list(product?.metafields)){const key=normalized(field?.key).replace(/\s+/g,'_');const label=PUBLIC_PRODUCT_ATTRIBUTE_KEYS.get(key);const value=clean(field?.value);if(label&&value&&!out[label])out[label]=value}return out};
const productOptions=product=>list(product?.options).map(option=>({name:clean(option?.name),values:list(option?.values).map(clean).filter(Boolean)})).filter(option=>option.name&&option.values.length);
const publicVariants=product=>list(product?.variants).map(variant=>({id:clean(variant?.id)||undefined,title:clean(variant?.title)||undefined,sku:clean(variant?.sku)||undefined,price:Number(variant?.price)||0,compareAtPrice:Number(variant?.compareAtPrice)>Number(variant?.price)?Number(variant?.compareAtPrice):undefined,availability:Number(variant?.inventory)>0?'in_stock':'out_of_stock',options:variant?.optionValues&&typeof variant.optionValues==='object'?variant.optionValues:undefined}));
const SEO_LANDING_ROUTES=[
  {loc:'/dong-ho-nam',match:p=>productGender(p).some(value=>value==='nam'||value==='male')},
  {loc:'/dong-ho-nu',match:p=>productGender(p).some(value=>value==='nu'||value==='female')},
  {loc:'/dong-ho-duoi-5-trieu',match:p=>Number(p?.price)>0&&Number(p?.price)<=5000000},
  {loc:'/dong-ho-sale',match:p=>Number(p?.compareAtPrice)>Number(p?.price)&&Number(p?.price)>0},
];

function resourceFromRequest(req){
  const direct=clean(req.query?.resource);
  if(direct)return direct;
  try{return clean(new URL(req.url||'','http://localhost').searchParams.get('resource'))}catch{return''}
}

async function readPrivate(path){
  const db=publicDatabaseUrl(),auth=process.env.FIREBASE_DATABASE_AUTH;
  if(!db||!auth)return null;
  const r=await fetchWithTimeout(`${db}/${path}.json?auth=${encodeURIComponent(auth)}`,{headers:{'Cache-Control':'no-store'}},4000);
  return r.ok?r.json():null;
}

async function readPublicStoreProfile(){
  const base=publicDatabaseUrl();
  if(!base)return null;
  const response=await fetchWithTimeout(`${base}/timeforge/settings/store.json`,{headers:{Accept:'application/json','Cache-Control':'no-cache'}},4000);
  if(!response.ok)throw new Error(`Firebase public profile read failed (${response.status})`);
  return response.json();
}

async function readPublic(path){
  const base=publicDatabaseUrl();
  if(!base)return null;
  const response=await fetchWithTimeout(`${base}/${path}.json`,{headers:{Accept:'application/json','Cache-Control':'no-cache'}},4000);
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
    const description=text(product.descriptionText||product.descriptionHtml||`${product.title} tại Luxury TimeForge`).slice(0,5000);
    const group=groupFor(product);
    return `<item><g:id>${esc(product.sku||product.id)}</g:id><title>${esc(product.title)}</title><description>${esc(description)}</description><link>${esc(`${site}/products/${encodeURIComponent(product.handle)}`)}</link>${images[0]?`<g:image_link>${esc(images[0])}</g:image_link>`:''}${images.slice(1,10).map(image=>`<g:additional_image_link>${esc(image)}</g:additional_image_link>`).join('')}<g:availability>${Number(product.inventory)>0?'in_stock':'out_of_stock'}</g:availability><g:condition>new</g:condition><g:price>${esc(money(onSale?compare:current))}</g:price>${onSale?`<g:sale_price>${esc(money(current))}</g:sale_price>`:''}${clean(product.vendor)?`<g:brand>${esc(product.vendor)}</g:brand>`:''}${validGtin?`<g:gtin>${esc(validGtin)}</g:gtin>`:''}${clean(product.sku)?`<g:mpn>${esc(product.sku)}</g:mpn>`:''}${clean(product.category||product.productType)?`<g:product_type>${esc(product.category||product.productType)}</g:product_type>`:''}${group?`<g:item_group_id>${esc(group.id||group.skuPrefix||group.name)}</g:item_group_id>`:''}<g:identifier_exists>${validGtin||clean(product.sku)?'yes':'no'}</g:identifier_exists></item>`;
  }).join('\n');
  const xml=`<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0"><channel><title>Luxury TimeForge</title><link>${esc(site)}</link><description>Google Merchant Center product feed</description>${items}</channel></rss>`;
  res.setHeader('Content-Type','application/xml; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=900, stale-while-revalidate=3600');
  res.setHeader('X-TimeForge-Feed-Items',String(active.length));
  return res.status(200).send(xml);
}

async function sendSitemap(_req,res){
  const site=baseSite(),today=new Date().toISOString().slice(0,10);
  const safeList=async(label,path)=>{try{return list(await readCatalog(path))}catch(error){console.warn(`[TimeForge] sitemap ${label} fallback:`,error instanceof Error?error.message:error);return[]}};
  const [products,collections,posts]=await Promise.all([
    safeList('products','timeforge/products'),
    safeList('collections','timeforge/collections'),
    safeList('blog posts','timeforge/blogPosts'),
  ]);
  const activeProducts=products.filter(p=>p?.handle&&p?.published!==false&&p?.status==='active');
  // These are permanent editorial landing pages. They remain indexable even while
  // product data is warming up; an empty client-side result must never emit noindex.
  const landingUrls=SEO_LANDING_ROUTES.map(route=>({loc:route.loc,priority:'0.78',freq:'weekly'}));
  const rawUrls=[
    {loc:'/',priority:'1.0',freq:'daily'},{loc:'/collections',priority:'0.9',freq:'daily'},{loc:'/watch-finder',priority:'0.7',freq:'monthly'},{loc:'/blogs',priority:'0.7',freq:'weekly'},
    {loc:'/pages/about',priority:'0.6',freq:'monthly'},{loc:'/pages/warranty',priority:'0.7',freq:'monthly'},{loc:'/pages/shipping',priority:'0.6',freq:'monthly'},{loc:'/pages/returns',priority:'0.6',freq:'monthly'},
    ...landingUrls,
    ...collections.filter(c=>c?.handle&&c?.status!=='draft').map(c=>({loc:`/collections/${encodeURIComponent(c.handle)}`,priority:'0.8',freq:'weekly',lastmod:String(c.updatedAt||today).slice(0,10)})),
    ...activeProducts.map(p=>({loc:`/products/${encodeURIComponent(p.handle)}`,priority:'0.8',freq:'weekly',lastmod:String(p.updatedAt||today).slice(0,10)})),
    ...posts.filter(post=>post?.handle&&post?.status==='published').map(post=>({loc:`/blogs/${encodeURIComponent(post.handle)}`,priority:'0.65',freq:'monthly',lastmod:String(post.updatedAt||post.publishedAt||today).slice(0,10)})),
  ];
  const seen=new Set();const urls=rawUrls.filter(item=>{if(!item?.loc||seen.has(item.loc))return false;seen.add(item.loc);return true});
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${esc(site+u.loc)}</loc>${u.lastmod?`<lastmod>${esc(u.lastmod)}</lastmod>`:''}<changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>`;
  res.setHeader('Content-Type','application/xml; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=1800, stale-while-revalidate=86400');
  res.setHeader('X-Robots-Tag','index, follow');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-TimeForge-Sitemap-Urls',String(urls.length));
  return res.status(200).send(xml);
}

async function sendImageSitemap(_req,res){
  const site=baseSite();let products=[];
  try{products=await readCatalog('timeforge/products').then(list)}catch{}
  const entries=products.filter(product=>product?.handle&&product?.published!==false&&product?.status==='active'&&list(product?.images).length).map(product=>{
    const images=list(product.images).map(value=>absolute(value,site)).filter(Boolean).slice(0,10);
    return `  <url><loc>${esc(`${site}/products/${encodeURIComponent(product.handle)}`)}</loc>${images.map(image=>`<image:image><image:loc>${esc(image)}</image:loc></image:image>`).join('')}</url>`;
  });
  const xml=`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>`;
  res.setHeader('Content-Type','application/xml; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('X-TimeForge-Image-Pages',String(entries.length));
  return res.status(200).send(xml);
}

const PRIVATE_ROBOT_PATHS=['/api/','/admin/','/checkout','/account/','/order-confirmation/','/payment/','/search','/cart','/wishlist','/compare','/track-order'];
function robotGroup(agent){return[`User-agent: ${agent}`,'Allow: /',...PRIVATE_ROBOT_PATHS.map(path=>`Disallow: ${path}`),'']}
function sendRobots(_req,res){
  const site=baseSite();
  const body=[
    '# Luxury TimeForge crawler policy',
    '# Search/discovery: Googlebot + OAI-SearchBot are allowed on all public storefront pages.',
    '# AI model access: GPTBot and Google-Extended are explicitly allowed on public storefront pages.',
    ...robotGroup('OAI-SearchBot'),
    ...robotGroup('GPTBot'),
    ...robotGroup('Google-Extended'),
    ...robotGroup('*'),
    `Sitemap: ${site}/sitemap.xml`,
    `Sitemap: ${site}/image-sitemap.xml`,
    '',
  ].join('\n');
  res.setHeader('Content-Type','text/plain; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(body);
}

async function readPublicCatalogBundle(){
  const safe=async(label,fn,fallback)=>{try{return await fn()}catch(error){console.warn(`[TimeForge] ${label} read fallback:`,error instanceof Error?error.message:error);return fallback}};
  const [products,collections,posts,profile]=await Promise.all([
    safe('products',()=>readCatalog('timeforge/products').then(list),[]),
    safe('collections',()=>readCatalog('timeforge/collections').then(list),[]),
    safe('blog posts',()=>readCatalog('timeforge/blogPosts').then(list),[]),
    safe('store profile',()=>readPublicStoreProfile(),null),
  ]);
  const activeProducts=products.filter(product=>product?.handle&&product?.published!==false&&product?.status==='active'&&Number(product?.price)>0);
  const activeCollections=collections.filter(collection=>collection?.handle&&collection?.status!=='draft');
  const activePosts=posts.filter(post=>post?.handle&&post?.status==='published');
  return{profile,products:activeProducts,collections:activeCollections,posts:activePosts};
}

async function sendAiCatalog(_req,res){
  const site=baseSite();const bundle=await readPublicCatalogBundle();
  const payload={
    schemaVersion:'1.0',generatedAt:new Date().toISOString(),site,language:'vi-VN',currency:'VND',
    store:{name:canonicalStoreName(bundle.profile?.storeName),description:text(bundle.profile?.seoDescription||bundle.profile?.storeDescription||'Đồng hồ chính hãng, thông tin minh bạch, giao hàng toàn quốc và hỗ trợ hậu mãi.'),url:site,telephone:clean(bundle.profile?.storePhone)||undefined,email:clean(bundle.profile?.storeEmail)||undefined,address:clean(bundle.profile?.storeAddress)||undefined,sameAs:[bundle.profile?.facebookUrl,bundle.profile?.instagramUrl,bundle.profile?.tiktokUrl].map(clean).filter(value=>/^https?:\/\//i.test(value))},
    policies:{warranty:`${site}/pages/warranty`,shipping:`${site}/pages/shipping`,returns:`${site}/pages/returns`},
    collections:bundle.collections.map(collection=>({id:collection.id,handle:collection.handle,title:collection.title,description:text(collection.description),url:`${site}/collections/${encodeURIComponent(collection.handle)}`,image:absolute(collection.image,site)||undefined,updatedAt:collection.updatedAt||undefined})),
    products:bundle.products.map(product=>{const images=list(product.images).map(value=>absolute(value,site)).filter(Boolean);const compare=Number(product.compareAtPrice)||0,price=Number(product.price)||0;const barcode=clean(product.barcode).replace(/\D/g,'');return{id:product.id,handle:product.handle,title:product.title,url:`${site}/products/${encodeURIComponent(product.handle)}`,brand:clean(product.vendor)||undefined,sku:clean(product.sku)||undefined,gtin:[8,12,13,14].includes(barcode.length)?barcode:undefined,category:clean(product.category||product.productType)||undefined,productType:clean(product.productType)||undefined,tags:list(product.tags).map(clean).filter(Boolean).slice(0,30),description:text(product.seoDescription||product.descriptionText||product.descriptionHtml||'').slice(0,5000),attributes:productAttributes(product),options:productOptions(product),variants:publicVariants(product),price,compareAtPrice:compare>price?compare:undefined,currency:'VND',availability:Number(product.inventory)>0?'in_stock':'out_of_stock',images:images.slice(0,10),updatedAt:product.updatedAt||undefined}},),
    articles:bundle.posts.map(post=>({handle:post.handle,title:post.title,url:`${site}/blogs/${encodeURIComponent(post.handle)}`,excerpt:text(post.excerpt||post.contentHtml).slice(0,1000),author:clean(post.author)||'Luxury TimeForge',image:absolute(post.image,site)||undefined,publishedAt:post.publishedAt||undefined,updatedAt:post.updatedAt||undefined})),
  };
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=1800');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('X-Robots-Tag','index, follow');
  return res.status(200).json(payload);
}

async function sendLlms(_req,res,full=false){
  const site=baseSite();const bundle=await readPublicCatalogBundle();const storeName=canonicalStoreName(bundle.profile?.storeName);
  const lines=[
    `# ${storeName}`,
    '',
    '> Cửa hàng đồng hồ chính hãng tại Việt Nam. Dữ liệu công khai trên website gồm catalog sản phẩm, giá bán, tình trạng hàng, nội dung tư vấn và chính sách hậu mãi.',
    '',
    '## Nguồn chính thức',
    `- Website: ${site}/`,
    `- Catalog máy đọc: ${site}/ai-catalog.json`,
    `- Sitemap: ${site}/sitemap.xml`,
    `- Image sitemap: ${site}/image-sitemap.xml`,
    `- Google Merchant feed: ${site}/google-products.xml`,
    '',
    '## Trang mua sắm',
    `- Tất cả đồng hồ: ${site}/collections`,
    `- Đồng hồ nam: ${site}/dong-ho-nam`,
    `- Đồng hồ nữ: ${site}/dong-ho-nu`,
    `- Đồng hồ dưới 5 triệu: ${site}/dong-ho-duoi-5-trieu`,
    `- Đồng hồ đang giảm giá: ${site}/dong-ho-sale`,
    `- Watch Finder: ${site}/watch-finder`,
    '',
    '## Chính sách',
    `- Giới thiệu: ${site}/pages/about`,
    `- Bảo hành: ${site}/pages/warranty`,
    `- Giao hàng: ${site}/pages/shipping`,
    `- Đổi trả: ${site}/pages/returns`,
    '',
    '## Nội dung',
    `- TimeForge Journal: ${site}/blogs`,
    '',
    '## Lưu ý dữ liệu',
    '- Ưu tiên URL sản phẩm và ai-catalog.json cho giá/tình trạng hàng mới nhất.',
    '- Không dùng các trang admin, tài khoản, checkout hoặc thanh toán làm nguồn thông tin công khai.',
  ];
  if(full){
    lines.push('','## Sản phẩm đang xuất bản');
    for(const product of bundle.products){lines.push(`- ${product.title} | ${clean(product.vendor)||'Luxury TimeForge'} | SKU ${clean(product.sku)||'N/A'} | ${Math.round(Number(product.price)||0)} VND | ${Number(product.inventory)>0?'Còn hàng':'Tạm hết hàng'} | ${site}/products/${encodeURIComponent(product.handle)}`)}
    if(bundle.posts.length){lines.push('','## Bài viết');for(const post of bundle.posts)lines.push(`- ${post.title} | ${site}/blogs/${encodeURIComponent(post.handle)}`)}
  }
  res.setHeader('Content-Type','text/plain; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=1800');
  res.setHeader('Access-Control-Allow-Origin','*');
  return res.status(200).send(lines.join('\n')+'\n');
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
  if(resource==='image-sitemap'){if((req.method||'GET')!=='GET')return res.status(405).end('Method not allowed');return sendImageSitemap(req,res)}
  if(resource==='merchant-feed')return sendMerchantFeed(req,res);
  if(resource==='ai-catalog'){if((req.method||'GET')!=='GET')return res.status(405).end('Method not allowed');return sendAiCatalog(req,res)}
  if(resource==='llms'){if((req.method||'GET')!=='GET')return res.status(405).end('Method not allowed');return sendLlms(req,res,false)}
  if(resource==='llms-full'){if((req.method||'GET')!=='GET')return res.status(405).end('Method not allowed');return sendLlms(req,res,true)}
  if(resource==='social-image')return sendSocialImage(req,res);
  return res.status(404).json({error:'Unknown metadata resource'});
}
