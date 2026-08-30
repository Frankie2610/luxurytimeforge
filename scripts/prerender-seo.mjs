import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const DIST=path.join(ROOT,'dist');
const FALLBACK_SITE='https://luxurytimeforge.vercel.app';
const DEFAULT_IMAGE='/social-cover.jpg';

const clean=value=>String(value??'').trim();
const stripHtml=value=>clean(value).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const jsonSafe=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const clamp=(value,max)=>{const s=stripHtml(value);return s.length<=max?s:`${s.slice(0,Math.max(0,max-1)).trim()}…`};
const list=value=>Array.isArray(value)?value.filter(Boolean):value&&typeof value==='object'?Object.values(value).filter(Boolean):[];
const absolute=(value,site)=>{const raw=clean(value);if(!raw)return'';return /^https?:\/\//i.test(raw)?raw:`${site}${raw.startsWith('/')?'':'/'}${raw}`};
const normalize=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
const gtinField=barcode=>{const digits=clean(barcode).replace(/\D/g,'');return[8,12,13,14].includes(digits.length)?{[`gtin${digits.length}`]:digits}:{}};
const money=value=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(Math.max(0,Number(value)||0));
const isoDate=value=>{const d=new Date(value||Date.now());return Number.isNaN(d.getTime())?new Date().toISOString():d.toISOString()};

const PUBLIC_PRODUCT_ATTRIBUTE_KEYS=new Map([
  ['gender','Giới tính'],['faceshape','Hình dạng mặt số'],['face_shape','Hình dạng mặt số'],['dial_shape','Hình dạng mặt số'],['watch_face_shape','Hình dạng mặt số'],
  ['facesize','Kích thước mặt số'],['face_size','Kích thước mặt số'],['case_size','Kích thước mặt số'],['diameter','Kích thước mặt số'],['duong_kinh','Kích thước mặt số'],
  ['bandmaterial','Chất liệu dây'],['band_material','Chất liệu dây'],['strap_material','Chất liệu dây'],['watch_band_material','Chất liệu dây'],
  ['bandcolor','Màu dây'],['band_color','Màu dây'],['strap_color','Màu dây'],['casecolor','Màu vỏ'],['case_color','Màu vỏ'],['watch_case_color','Màu vỏ'],
  ['classification','Phân loại'],['watch_type','Phân loại'],['movement','Bộ máy'],['phan_loai','Phân loại'],
]);
const normalizedKey=value=>normalize(value).replace(/[\s.-]+/g,'_');
const productAttributes=product=>{const out={};for(const field of list(product?.metafields)){const label=PUBLIC_PRODUCT_ATTRIBUTE_KEYS.get(normalizedKey(field?.key));const value=clean(field?.value);if(label&&value&&!out[label])out[label]=value}return out};
const productAdditionalProperties=product=>Object.entries(productAttributes(product)).map(([name,value])=>({'@type':'PropertyValue',name,value}));
const numberValue=value=>{const normalized=clean(value).replace(/[^\d,.-]/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.');const parsed=Number(normalized);return Number.isFinite(parsed)?parsed:0};
const discountPercent=(price,compare)=>{const p=Number(price)||0,c=Number(compare)||0;return c>p&&c>0?Math.round((1-p/c)*100):0};
const genderValues=product=>list(product?.metafields).filter(field=>normalizedKey(field?.namespace)==='custom'&&normalizedKey(field?.key)==='gender').flatMap(field=>clean(field?.value).split(/[,;|/]/)).map(normalize).filter(Boolean);
const collectionStringValues=(product,field)=>{if(field==='vendor')return[product?.vendor];if(field==='productType')return[product?.productType];if(field==='tag')return list(product?.tags);if(field==='status')return[product?.status];if(field==='gender')return genderValues(product);return[]};
const collectionNumericValues=(product,field)=>{const variants=list(product?.variants);if(field==='price')return[Number(product?.price)||0,...variants.map(item=>Number(item?.price)||0)];if(field==='compareAtPrice')return[Number(product?.compareAtPrice)||0,...variants.map(item=>Number(item?.compareAtPrice)||0)].filter(value=>value>0);if(field==='inventory')return variants.length?variants.map(item=>Number(item?.inventory)||0):[Number(product?.inventory)||0];if(field==='discountPercent')return[discountPercent(product?.price,product?.compareAtPrice),...variants.map(item=>discountPercent(item?.price,item?.compareAtPrice))];return[]};
const matchText=(values,operator,target)=>{const expected=normalize(target),usable=values.map(normalize).filter(Boolean);if(operator==='is_set')return usable.length>0;if(operator==='is_not_set')return usable.length===0;if(!expected)return false;if(operator==='not_equals')return usable.every(value=>value!==expected);if(operator==='contains')return usable.some(value=>value.includes(expected));if(operator==='not_contains')return usable.every(value=>!value.includes(expected));return usable.some(value=>value===expected)};
const matchNumber=(values,operator,target)=>{const usable=values.filter(Number.isFinite);if(operator==='is_set')return usable.some(value=>value>0);if(operator==='is_not_set')return usable.every(value=>value<=0);const expected=numberValue(target);if(operator==='not_equals')return usable.every(value=>value!==expected);if(operator==='greater_than')return usable.some(value=>value>expected);if(operator==='less_than')return usable.some(value=>value<expected);if(operator==='greater_or_equal')return usable.some(value=>value>=expected);if(operator==='less_or_equal')return usable.some(value=>value<=expected);return usable.some(value=>value===expected)};
const matchesCollectionCondition=(product,condition)=>{const field=clean(condition?.field),operator=clean(condition?.operator)||'equals',target=clean(condition?.value);return['price','compareAtPrice','inventory','discountPercent'].includes(field)?matchNumber(collectionNumericValues(product,field),operator,target):matchText(collectionStringValues(product,field),operator,target)};
const resolveCollectionProducts=(collection,products)=>{if(collection?.type!=='automatic')return products.filter(product=>list(collection?.productIds).map(clean).includes(clean(product?.id)));const conditions=list(collection?.conditions);if(!conditions.length)return[];return products.filter(product=>{const results=conditions.map(condition=>matchesCollectionCondition(product,condition));return collection?.conditionMatch==='any'?results.some(Boolean):results.every(Boolean)})};

function readDotEnv(){
  const values={};
  for(const file of ['.env','.env.local']){
    const target=path.join(ROOT,file);if(!existsSync(target))continue;
    const body=requireText(target);
    for(const line of body.split(/\r?\n/)){
      if(!line||/^\s*#/.test(line)||!line.includes('='))continue;
      const i=line.indexOf('=');const key=line.slice(0,i).trim();let value=line.slice(i+1).trim();
      if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
      if(key)values[key]=value;
    }
  }
  return values;
}
function requireText(file){return requireText.cache?.get(file)??''}
requireText.cache=new Map();
for(const file of ['.env','.env.local']){const target=path.join(ROOT,file);if(existsSync(target))requireText.cache.set(target,await readFile(target,'utf8'))}
const fileEnv=readDotEnv();
const env={...fileEnv,...process.env};
let site=clean(env.PUBLIC_SITE_URL||env.VITE_PUBLIC_SITE_URL||FALLBACK_SITE).replace(/\/$/,'');
if(!site||/localhost|127\.0\.0\.1/i.test(site))site=FALLBACK_SITE;
const db=clean(env.FIREBASE_DATABASE_URL||env.VITE_FIREBASE_DATABASE_URL).replace(/\/$/,'');
const auth=clean(env.FIREBASE_DATABASE_AUTH);

async function fetchJson(dbPath,query={}){
  if(!db)return null;
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
  try{
    const params=new URLSearchParams();
    for(const [key,value] of Object.entries(query||{}))if(value!==undefined&&value!==null&&value!=='')params.set(key,String(value));
    if(auth)params.set('auth',auth);
    const suffix=params.size?`?${params.toString()}`:'';
    const response=await fetch(`${db}/${dbPath}.json${suffix}`,{headers:{Accept:'application/json'},signal:controller.signal});
    if(!response.ok)throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  }finally{clearTimeout(timer)}
}
async function safeFetch(label,dbPath,query={}){
  try{return await fetchJson(dbPath,query)}
  catch(error){console.warn(`[V0.66.5 SEO] Could not read ${label}; continuing without it.`,error?.message||error);return null}
}

let template=await readFile(path.join(DIST,'index.html'),'utf8');
const googleVerification=clean(env.VITE_GOOGLE_SITE_VERIFICATION);

const data={profile:null,products:[],collections:[],posts:[],reviews:[],groups:[],contentPages:[]};
if(db){
  const [profile,products,collections,posts,reviews,groups,contentPages]=await Promise.all([
    safeFetch('store profile','timeforge/settings/store'),
    safeFetch('products','timeforge/products'),
    safeFetch('collections','timeforge/collections'),
    safeFetch('blog posts','timeforge/blogPosts'),
    auth?safeFetch('reviews','timeforge/reviews'):safeFetch('published reviews','timeforge/reviews',{orderBy:'"status"',equalTo:'"published"'}),
    safeFetch('product groups','timeforge/productGroups'),
    safeFetch('content pages','timeforge/contentPages'),
  ]);
  data.profile=profile||null;data.products=list(products);data.collections=list(collections);data.posts=list(posts);data.reviews=list(reviews);data.groups=list(groups);data.contentPages=list(contentPages);
  console.log(`[V0.66.5 SEO] Catalog loaded: ${data.products.length} products, ${data.collections.length} collections, ${data.posts.length} posts, ${data.reviews.length} published reviews.`);
}else console.warn('[V0.66.5 SEO] No Firebase database URL at build time; catalog routes will rely on client rendering until the next production build with env configured.');

const profile=data.profile||{};
const storeName=normalize(profile.storeName)==='luxury timeforge'?'Luxury TimeForge':clean(profile.storeName)||'Luxury TimeForge';
const storeDescription=clean(profile.seoDescription||profile.storeDescription)||'Đồng hồ chính hãng, thông tin minh bạch, giao hàng toàn quốc và hỗ trợ hậu mãi.';
const logo=absolute(profile.logoImage||'/luxury-timeforge-logo.svg',site);
const socialImage=absolute(profile.socialShareImage||DEFAULT_IMAGE,site);
const sameAs=[profile.facebookUrl,profile.instagramUrl,profile.tiktokUrl].map(clean).filter(v=>/^https?:\/\//i.test(v));
const activeProducts=data.products.filter(p=>p?.handle&&p?.published!==false&&p?.status==='active'&&Number(p?.price)>0);
const activeCollections=data.collections.filter(c=>c?.handle&&c?.status!=='draft');
const activePosts=data.posts.filter(p=>p?.handle&&p?.status==='published');
const publishedReviews=data.reviews.filter(r=>r?.status==='published');
const contentPage=slug=>data.contentPages.find(page=>page?.slug===slug&&page?.published!==false);
const contentPageHtml=(page,fallback)=>{
  if(!page)return fallback;
  const sections=list(page.sections).map(section=>`<h2>${esc(section?.title||'Thông tin')}</h2><p>${esc(stripHtml(section?.body||''))}</p>`).join('');
  return `${clean(page.eyebrow)?`<p><strong>${esc(page.eyebrow)}</strong></p>`:''}${clean(page.lead)?`<p>${esc(stripHtml(page.lead))}</p>`:''}${sections}`;
};

const privatePaths=['/admin','/checkout','/account','/order-confirmation','/payment','/search','/cart','/wishlist','/compare','/track-order'];
const isPrivate=p=>privatePaths.some(prefix=>p===prefix||p.startsWith(`${prefix}/`));

function orgEntity(){
  return {'@type':['OnlineStore','Organization'],'@id':`${site}/#organization`,name:storeName,alternateName:'Luxury TimeForge Vietnam',url:`${site}/`,logo,image:socialImage,description:storeDescription,email:clean(profile.storeEmail)||undefined,telephone:clean(profile.storePhone)||undefined,address:clean(profile.storeAddress)?{'@type':'PostalAddress',streetAddress:clean(profile.storeAddress),addressCountry:'VN'}:undefined,areaServed:{'@type':'Country',name:'Vietnam'},currenciesAccepted:'VND',sameAs:sameAs.length?sameAs:undefined,contactPoint:(clean(profile.storePhone)||clean(profile.storeEmail))?{'@type':'ContactPoint',telephone:clean(profile.storePhone)||undefined,email:clean(profile.storeEmail)||undefined,contactType:'customer service',areaServed:'VN',availableLanguage:['vi']}:undefined,hasMerchantReturnPolicy:{'@type':'MerchantReturnPolicy',merchantReturnLink:`${site}/pages/returns`,applicableCountry:'VN'},hasShippingService:{'@type':'ShippingService','@id':`${site}/#standard-shipping`,name:'Giao hàng tiêu chuẩn Luxury TimeForge',fulfillmentType:'https://schema.org/FulfillmentTypeDelivery',shippingConditions:{'@type':'ShippingConditions',shippingDestination:{'@type':'DefinedRegion',addressCountry:'VN'},transitTime:{'@type':'ServicePeriod',duration:{'@type':'QuantitativeValue',minValue:1,maxValue:4,unitCode:'DAY'}}}}};
}
function websiteEntity(){return {'@type':'WebSite','@id':`${site}/#website`,url:`${site}/`,name:storeName,alternateName:'Luxury TimeForge Vietnam',description:storeDescription,inLanguage:'vi-VN',publisher:{'@id':`${site}/#organization`}}}
function breadcrumbEntity(route,title,product=false){
  const items=[{name:'Trang chủ',item:`${site}/`}];
  if(product)items.push({name:'Đồng hồ',item:`${site}/collections`});
  if(route!=='/')items.push({name:title,item:`${site}${route}`});
  return {'@type':'BreadcrumbList','@id':`${site}${route==='/' ? '/' : route}#breadcrumb`,itemListElement:items.map((x,i)=>({'@type':'ListItem',position:i+1,name:x.name,item:x.item}))};
}
function basePageEntity(route,title,description,type='WebPage'){
  return {'@type':type,'@id':`${site}${route==='/' ? '/' : route}#webpage`,url:`${site}${route==='/'?'':route}`,name:title,description,inLanguage:'vi-VN',isPartOf:{'@id':`${site}/#website`}};
}
function offerFor(product,canonical){
  return {'@type':'Offer',url:canonical,priceCurrency:'VND',price:Number(product.price)||0,availability:Number(product.inventory)>0?'https://schema.org/InStock':'https://schema.org/OutOfStock',itemCondition:'https://schema.org/NewCondition',seller:{'@id':`${site}/#organization`},shippingDetails:{'@type':'OfferShippingDetails',shippingDestination:{'@type':'DefinedRegion',addressCountry:'VN'},deliveryTime:{'@type':'ShippingDeliveryTime',transitTime:{'@type':'QuantitativeValue',minValue:1,maxValue:4,unitCode:'DAY'}}}};
}
function productEntity(product){
  const route=`/products/${encodeURIComponent(product.handle)}`,canonical=`${site}${route}`;
  const productReviews=publishedReviews.filter(r=>r.reviewType==='product'&&r.productId===product.id&&clean(r.customerName));
  const average=productReviews.length?productReviews.reduce((s,r)=>s+Math.min(5,Math.max(1,Number(r.rating)||5)),0)/productReviews.length:0;
  return {'@type':'Product','@id':`${canonical}#product`,name:clean(product.title),url:canonical,image:list(product.images).map(v=>absolute(v,site)).filter(Boolean),description:clamp(product.seoDescription||product.descriptionText||product.descriptionHtml||`${product.title} tại ${storeName}.`,5000),sku:clean(product.sku)||undefined,mpn:clean(product.sku)||undefined,category:clean(product.category||product.productType)||undefined,additionalProperty:productAdditionalProperties(product).length?productAdditionalProperties(product):undefined,...gtinField(product.barcode),brand:{'@type':'Brand',name:clean(product.vendor)||storeName},aggregateRating:productReviews.length?{'@type':'AggregateRating',ratingValue:Number(average.toFixed(2)),reviewCount:productReviews.length,bestRating:5,worstRating:1}:undefined,review:productReviews.slice(0,6).map(r=>({'@type':'Review',name:clean(r.title)||undefined,reviewBody:clean(r.text)||undefined,datePublished:clean(r.createdAt).slice(0,10)||undefined,reviewRating:{'@type':'Rating',ratingValue:Number(r.rating)||5,bestRating:5,worstRating:1},author:{'@type':'Person',name:clean(r.customerName)}})),offers:offerFor(product,canonical)};
}

function setAttrMeta(html,selectorPattern,tag){return selectorPattern.test(html)?html.replace(selectorPattern,tag):html.replace('</head>',`${tag}\n</head>`)}
function renderHead(html,{title,description,canonical,image,type='website',noindex=false,graph=[]}){
  const robots=noindex?'noindex, nofollow':'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const safeTitle=clamp(title,68),safeDescription=clamp(description,158),safeImage=absolute(image||socialImage,site);
  html=html.replace(/<title>[\s\S]*?<\/title>/i,`<title>${esc(safeTitle)}</title>`);
  html=setAttrMeta(html,/<meta\s+name=["']description["'][^>]*>/i,`<meta name="description" content="${esc(safeDescription)}"/>`);
  html=setAttrMeta(html,/<meta\s+name=["']robots["'][^>]*>/i,`<meta name="robots" content="${esc(robots)}"/>`);
  html=setAttrMeta(html,/<link\s+rel=["']canonical["'][^>]*>/i,`<link rel="canonical" href="${esc(canonical)}"/>`);
  const metas={
    'og:title':safeTitle,'og:description':safeDescription,'og:type':type,'og:url':canonical,'og:image':safeImage,'og:image:secure_url':safeImage,'og:image:alt':`${storeName} — ${safeTitle}`,
  };
  for(const [prop,val] of Object.entries(metas))html=setAttrMeta(html,new RegExp(`<meta\\s+property=["']${prop.replace(':','\\:')}["'][^>]*>`,'i'),`<meta property="${prop}" content="${esc(val)}"/>`);
  const tw={'twitter:title':safeTitle,'twitter:description':safeDescription,'twitter:image':safeImage};
  for(const [name,val] of Object.entries(tw))html=setAttrMeta(html,new RegExp(`<meta\\s+name=["']${name.replace(':','\\:')}["'][^>]*>`,'i'),`<meta name="${name}" content="${esc(val)}"/>`);
  if(googleVerification)html=setAttrMeta(html,/<meta\s+name=["']google-site-verification["'][^>]*>/i,`<meta name="google-site-verification" content="${esc(googleVerification)}"/>`);
  const structured=`<script id="tf60-structured-data" type="application/ld+json">${jsonSafe({'@context':'https://schema.org','@graph':graph.filter(Boolean)})}</script>`;
  if(/<script\s+id=["']tf60-structured-data["'][\s\S]*?<\/script>/i.test(html))html=html.replace(/<script\s+id=["']tf60-structured-data["'][\s\S]*?<\/script>/i,structured);else html=html.replace('</head>',`${structured}\n</head>`);
  if(!html.includes('id="tf-prerender-style"'))html=html.replace('</head>',`<style id="tf-prerender-style">.tf-prerender{max-width:1180px;margin:0 auto;padding:32px 20px 48px;font:16px/1.6 system-ui,-apple-system,Segoe UI,sans-serif;color:#18231d}.tf-prerender h1{font-size:clamp(28px,5vw,48px);line-height:1.12;margin:0 0 14px}.tf-prerender h2{margin-top:30px}.tf-prerender a{color:#1f4930}.tf-prerender img{max-width:360px;height:auto}.tf-prerender ul{padding-left:20px}.tf-prerender .price{font-size:1.35rem;font-weight:700}.tf-prerender .crumbs{font-size:.9rem;margin-bottom:18px}</style>\n</head>`);
  return html;
}
function shellBody(route,title,description,inner=''){
  const crumbs=route==='/'?'':`<p class="crumbs"><a href="/">Trang chủ</a> › ${esc(title)}</p>`;
  return `<main class="tf-prerender" data-seo-prerender="v0.66.5">${crumbs}<h1>${esc(title)}</h1><p>${esc(description)}</p>${inner}<p><a href="/collections">Xem toàn bộ đồng hồ</a> · <a href="/pages/warranty">Bảo hành</a> · <a href="/pages/shipping">Giao hàng</a> · <a href="/pages/returns">Đổi trả</a></p></main>`;
}
function injectRoot(html,body){return html.replace(/<div\s+id=["']root["']>[\s\S]*?<\/div>/i,`<div id="root">${body}</div>`)}
async function writeRoute(route,meta,body){
  let html=renderHead(template,meta);html=injectRoot(html,body);
  if(route==='/'){await writeFile(path.join(DIST,'index.html'),html);return}
  const rel=route.replace(/^\//,'');
  // Keep directory/index.html for conventional static hosting and also emit a flat
  // .html file. Vercel cleanUrls resolves /products/foo to /products/foo.html
  // before the SPA catch-all rewrite, so crawlers receive the prerendered document.
  const dir=path.join(DIST,rel);await mkdir(dir,{recursive:true});await writeFile(path.join(dir,'index.html'),html);
  const flat=path.join(DIST,`${rel}.html`);await mkdir(path.dirname(flat),{recursive:true});await writeFile(flat,html);
}

const coreRoutes=[];
function pushStatic(route,title,description,inner='',image=socialImage,type='website',extraGraph=[]){
  const canonical=`${site}${route==='/'?'':route}`;const graph=[orgEntity(),websiteEntity(),breadcrumbEntity(route,title),basePageEntity(route,title,description),...extraGraph];
  coreRoutes.push({route,meta:{title,description,canonical,image,type,noindex:isPrivate(route),graph},body:shellBody(route,title,description,inner)});
}

const landingDefs=[
  {path:'/dong-ho-nam',title:'Đồng hồ nam chính hãng',description:'Khám phá đồng hồ nam chính hãng với thiết kế dễ đeo, giá minh bạch, tình trạng hàng và hậu mãi rõ ràng.',match:p=>{const values=list(p.metafields).filter(f=>normalize(f.namespace)==='custom'&&normalize(f.key)==='gender').flatMap(f=>clean(f.value).split(/[,;|/]/)).map(normalize);return values.some(v=>v==='nam'||v==='male')}},
  {path:'/dong-ho-nu',title:'Đồng hồ nữ chính hãng',description:'Khám phá đồng hồ nữ chính hãng với nhiều kiểu dáng, kích thước và mức giá tại Luxury TimeForge.',match:p=>{const values=list(p.metafields).filter(f=>normalize(f.namespace)==='custom'&&normalize(f.key)==='gender').flatMap(f=>clean(f.value).split(/[,;|/]/)).map(normalize);return values.some(v=>v==='nu'||v==='female')}},
  {path:'/dong-ho-duoi-5-trieu',title:'Đồng hồ chính hãng dưới 5 triệu',description:'Tìm đồng hồ chính hãng dưới 5 triệu đồng, dễ so sánh thương hiệu, giá và tình trạng còn hàng.',match:p=>Number(p.price)>0&&Number(p.price)<=5000000},
  {path:'/dong-ho-sale',title:'Đồng hồ đang giảm giá',description:'Xem các mẫu đồng hồ đang giảm giá với giá bán, giá so sánh và tình trạng hàng được cập nhật rõ ràng.',match:p=>Number(p.compareAtPrice)>Number(p.price)&&Number(p.price)>0},
];

const homeList=activeProducts.slice(0,12).map(p=>`<li><a href="/products/${encodeURIComponent(p.handle)}">${esc(p.title)}</a>${clean(p.vendor)?` — ${esc(p.vendor)}`:''} — ${esc(money(p.price))}</li>`).join('');
pushStatic('/',profile.seoTitle||`${storeName} | Đồng hồ chính hãng`,profile.seoDescription||storeDescription,`<h2>Mua đồng hồ theo nhu cầu</h2><p><a href="/dong-ho-nam">Đồng hồ nam</a> · <a href="/dong-ho-nu">Đồng hồ nữ</a> · <a href="/dong-ho-duoi-5-trieu">Dưới 5 triệu</a> · <a href="/dong-ho-sale">Đang giảm giá</a></p>${homeList?`<h2>Sản phẩm đang xuất bản</h2><ul>${homeList}</ul>`:''}<h2>Thông tin mua hàng</h2><p>Sản phẩm trên website được trình bày với giá bán, tình trạng hàng, thông tin sản phẩm và chính sách hậu mãi để khách hàng dễ kiểm tra trước khi mua.</p>`);
pushStatic('/collections',`Đồng hồ chính hãng | ${storeName}`,'Khám phá đồng hồ theo thương hiệu, mức giá, giới tính, chất liệu dây, kích thước mặt và tình trạng còn hàng.',activeCollections.length?`<h2>Bộ sưu tập</h2><ul>${activeCollections.slice(0,50).map(c=>`<li><a href="/collections/${encodeURIComponent(c.handle)}">${esc(c.title)}</a></li>`).join('')}</ul>`:'');
pushStatic('/watch-finder',`Tư vấn chọn đồng hồ theo nhu cầu | ${storeName}`,'Tìm mẫu đồng hồ phù hợp theo phong cách, kích thước và ngân sách với công cụ tư vấn của Luxury TimeForge.','<p>Watch Finder hỗ trợ khoanh vùng lựa chọn theo nhu cầu trước khi xem chi tiết từng sản phẩm.</p>');
pushStatic('/blogs','TimeForge Journal | Kiến thức & tư vấn đồng hồ','Kiến thức, cảm hứng, hướng dẫn chọn và chăm sóc đồng hồ từ Luxury TimeForge.',activePosts.length?`<h2>Bài viết mới</h2><ul>${activePosts.slice(0,30).map(p=>`<li><a href="/blogs/${encodeURIComponent(p.handle)}">${esc(p.title)}</a>${p.excerpt?` — ${esc(clamp(p.excerpt,180))}`:''}</li>`).join('')}</ul>`:'');
const aboutPage=contentPage('about'),warrantyPage=contentPage('warranty'),shippingPage=contentPage('shipping'),returnsPage=contentPage('returns');
pushStatic('/pages/about',`Giới thiệu ${storeName}`,clamp(aboutPage?.lead||'Tìm hiểu câu chuyện, tiêu chuẩn tuyển chọn sản phẩm và trải nghiệm mua đồng hồ tại Luxury TimeForge.',158),contentPageHtml(aboutPage,`<h2>Về ${esc(storeName)}</h2><p>${esc(storeDescription)}</p>${clean(profile.storeAddress)?`<p>Địa chỉ: ${esc(profile.storeAddress)}</p>`:''}${clean(profile.storePhone)?`<p>Điện thoại: ${esc(profile.storePhone)}</p>`:''}`));
pushStatic('/pages/warranty','Chính sách bảo hành đồng hồ',clamp(warrantyPage?.lead||'Thông tin thời hạn và quy trình bảo hành đồng hồ tại Luxury TimeForge.',158),contentPageHtml(warrantyPage,'<p>Versace và Ferragamo được hỗ trợ tối đa 4 năm, gồm 2 năm bảo hành toàn cầu và 2 năm hỗ trợ tại Việt Nam. Các thương hiệu còn lại áp dụng 2 năm tại Việt Nam hoặc theo bảo hành quốc tế đi kèm sản phẩm.</p>'));
pushStatic('/pages/shipping','Chính sách giao hàng đồng hồ',clamp(shippingPage?.lead||'Thông tin giao hàng, thời gian dự kiến, đóng gói và hỗ trợ theo dõi đơn hàng từ Luxury TimeForge.',158),contentPageHtml(shippingPage,'<p>Luxury TimeForge hỗ trợ giao hàng toàn quốc. Thời gian giao hàng thường dự kiến 1–4 ngày làm việc sau khi xác nhận, tùy khu vực và tình trạng sản phẩm.</p>'));
pushStatic('/pages/returns','Chính sách đổi trả đồng hồ',clamp(returnsPage?.lead||'Điều kiện và quy trình đổi trả sản phẩm tại Luxury TimeForge.',158),contentPageHtml(returnsPage,'<p>Yêu cầu đổi trả được xem xét theo tình trạng sản phẩm, thời điểm tiếp nhận và điều kiện đã công bố. Khách hàng nên giữ nguyên hộp, phụ kiện, tem và chứng từ đi kèm.</p>'));

for(const landing of landingDefs){
  const matched=activeProducts.filter(landing.match).slice(0,48);
  const inner=matched.length
    ?`<h2>${matched.length} mẫu phù hợp</h2><ul>${matched.map(p=>`<li><a href="/products/${encodeURIComponent(p.handle)}">${esc(p.title)}</a> — ${esc(money(p.price))}</li>`).join('')}</ul>`
    :`<h2>Khám phá sản phẩm</h2><p>Danh sách sản phẩm được cập nhật từ catalog Luxury TimeForge. Xem toàn bộ đồng hồ hoặc quay lại trang này khi catalog hoàn tất đồng bộ.</p>`;
  const itemList=matched.length?[{'@type':'ItemList',itemListElement:matched.slice(0,24).map((p,i)=>({'@type':'ListItem',position:i+1,url:`${site}/products/${encodeURIComponent(p.handle)}`,name:p.title}))}]:[];
  pushStatic(landing.path,`${landing.title} | ${storeName}`,landing.description,inner,matched[0]?.images?.[0]||socialImage,'website',itemList);
}

for(const entry of coreRoutes)await writeRoute(entry.route,entry.meta,entry.body);

for(const collection of activeCollections){
  const route=`/collections/${encodeURIComponent(collection.handle)}`;const title=`${collection.title} | Đồng hồ chính hãng | ${storeName}`;const description=clamp(collection.description||`Khám phá bộ sưu tập ${collection.title} được ${storeName} tuyển chọn.`,158);
  const products=resolveCollectionProducts(collection,activeProducts);
  const inner=products.length?`<h2>Sản phẩm trong bộ sưu tập</h2><ul>${products.slice(0,48).map(p=>`<li><a href="/products/${encodeURIComponent(p.handle)}">${esc(p.title)}</a> — ${esc(money(p.price))}</li>`).join('')}</ul>`:'<p>Xem sản phẩm đang hiển thị trong bộ sưu tập trên giao diện website.</p>';
  const canonical=`${site}${route}`;const graph=[orgEntity(),websiteEntity(),breadcrumbEntity(route,title),{'@type':'CollectionPage','@id':`${canonical}#webpage`,url:canonical,name:title,description,inLanguage:'vi-VN',isPartOf:{'@id':`${site}/#website`},mainEntity:products.length?{'@type':'ItemList',itemListElement:products.slice(0,24).map((p,i)=>({'@type':'ListItem',position:i+1,url:`${site}/products/${encodeURIComponent(p.handle)}`,name:p.title}))}:undefined}];
  await writeRoute(route,{title,description,canonical,image:collection.image||socialImage,type:'website',graph},shellBody(route,title,description,inner));
}

for(const product of activeProducts){
  const route=`/products/${encodeURIComponent(product.handle)}`,canonical=`${site}${route}`;const title=product.seoTitle||`${product.title} chính hãng | ${storeName}`;const description=clamp(product.seoDescription||product.descriptionText||product.descriptionHtml||`${product.title} chính hãng tại ${storeName}. Xem giá, tình trạng hàng, thông số và chính sách bảo hành.`,158);const image=list(product.images)[0]||socialImage;
  const bodyDesc=clamp(product.descriptionText||product.descriptionHtml||description,1000);const available=Number(product.inventory)>0?'Còn hàng':'Tạm hết hàng';
  const attributes=Object.entries(productAttributes(product));const attributeHtml=attributes.length?`<h2>Thông tin sản phẩm</h2><ul>${attributes.map(([name,value])=>`<li><strong>${esc(name)}:</strong> ${esc(value)}</li>`).join('')}</ul>`:'';
  const inner=`${image?`<p><img src="${esc(absolute(image,site))}" alt="${esc(product.title)}" loading="eager"/></p>`:''}<p class="price">${esc(money(product.price))}${Number(product.compareAtPrice)>Number(product.price)?` <del>${esc(money(product.compareAtPrice))}</del>`:''}</p><p><strong>Thương hiệu:</strong> ${esc(product.vendor||'Luxury TimeForge')} · <strong>SKU:</strong> ${esc(product.sku||'Đang cập nhật')} · <strong>Tình trạng:</strong> ${esc(available)}</p><p>${esc(bodyDesc)}</p>${product.category||product.productType?`<p><strong>Danh mục:</strong> ${esc(product.category||product.productType)}</p>`:''}${attributeHtml}`;
  const graph=[orgEntity(),websiteEntity(),breadcrumbEntity(route,title,true),basePageEntity(route,title,description),productEntity(product)];
  await writeRoute(route,{title,description,canonical,image,type:'product',graph},shellBody(route,title,description,inner));
}

for(const post of activePosts){
  const route=`/blogs/${encodeURIComponent(post.handle)}`,canonical=`${site}${route}`;const title=`${post.title} | TimeForge Journal`;const description=clamp(post.excerpt||post.contentHtml||'Bài viết và góc nhìn về đồng hồ từ Luxury TimeForge.',158);const image=post.image||socialImage;
  const article={'@type':'BlogPosting','@id':`${canonical}#article`,headline:post.title,description,image:absolute(image,site),datePublished:isoDate(post.publishedAt),dateModified:isoDate(post.updatedAt||post.publishedAt),author:{'@type':'Organization',name:clean(post.author)||storeName,url:`${site}/`},publisher:{'@id':`${site}/#organization`},mainEntityOfPage:{'@id':`${canonical}#webpage`},inLanguage:'vi-VN'};
  const graph=[orgEntity(),websiteEntity(),breadcrumbEntity(route,title),basePageEntity(route,title,description,'WebPage'),article];
  const inner=`${post.image?`<p><img src="${esc(absolute(post.image,site))}" alt="${esc(post.title)}"/></p>`:''}<p>${esc(clamp(post.excerpt||post.contentHtml,1200))}</p><p><strong>Tác giả:</strong> ${esc(post.author||storeName)}</p>`;
  await writeRoute(route,{title,description,canonical,image,type:'article',graph},shellBody(route,title,description,inner));
}

console.log(`[V0.66.5 SEO] Prerendered ${coreRoutes.length+activeCollections.length+activeProducts.length+activePosts.length} routes into dist/.`);
