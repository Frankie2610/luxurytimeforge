const clean=value=>String(value??'').trim();
const list=value=>Array.isArray(value)?value.filter(Boolean):Object.values(value||{}).filter(Boolean);
const normalized=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
const databaseUrl=()=>clean(process.env.FIREBASE_DATABASE_URL||process.env.VITE_FIREBASE_DATABASE_URL).replace(/\/$/,'');
const fetchWithTimeout=async(url,options={},timeoutMs=7000)=>{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);try{return await fetch(url,{...options,signal:controller.signal})}finally{clearTimeout(timer)}};
const queryValues=(req,key)=>{const raw=req.query?.[key];const values=Array.isArray(raw)?raw:raw==null?[]:[raw];return [...new Set(values.flatMap(value=>String(value).split(',')).map(value=>clean(value).slice(0,80)).filter(Boolean))].slice(0,20)};
const numberValue=value=>{const parsed=Number(String(value??'').replace(/[^\d,.-]/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.'));return Number.isFinite(parsed)?parsed:0};
const discount=(price,compare)=>price>0&&compare>price?Math.round((1-price/compare)*100):0;
const normalizeKey=value=>clean(value).toLowerCase().replace(/[\s.-]+/g,'_');
const splitValues=value=>[...new Set(clean(value).split(/\s*(?:,|;|\||\/)\s*/).map(clean).filter(Boolean))];

let catalogCache={expiresAt:0,products:[],collections:[]};
async function readPath(path){
  const base=databaseUrl();if(!/^https:\/\//.test(base))throw new Error('Catalog unavailable');
  const url=new URL(`${base}/${path}.json`);if(process.env.FIREBASE_DATABASE_AUTH)url.searchParams.set('auth',process.env.FIREBASE_DATABASE_AUTH);
  const response=await fetchWithTimeout(url.toString(),{headers:{Accept:'application/json','Cache-Control':'no-cache'}},7000);
  if(!response.ok)throw new Error(`Firebase catalog read failed (${response.status})`);return response.json();
}
async function readBundle(){
  if(catalogCache.products.length&&catalogCache.expiresAt>Date.now())return catalogCache;
  const[productsRaw,collectionsRaw]=await Promise.all([readPath('timeforge/products'),readPath('timeforge/collections')]);
  const products=list(productsRaw).filter(product=>product&&product.status==='active'&&product.published!==false&&clean(product.handle));
  const collections=list(collectionsRaw);
  catalogCache={products,collections,expiresAt:Date.now()+60_000};return catalogCache;
}

const plainDescription=product=>clean(product.descriptionHtml||product.descriptionText).replace(/<br\s*\/?>/gi,'\n').replace(/<\/(?:li|p|h\d)>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').split('\n').map(clean).filter(Boolean);
const findSpec=(product,labels)=>{const wanted=labels.map(value=>value.toLowerCase());for(const line of plainDescription(product)){const divider=line.indexOf(':');if(divider<0)continue;const label=clean(line.slice(0,divider)).toLowerCase();if(wanted.some(item=>label===item||label.endsWith(item)))return clean(line.slice(divider+1))}return''};
const metafieldValues=(product,aliases)=>{const keys=new Set(aliases.map(normalizeKey));return list(product.metafields).filter(field=>keys.has(normalizeKey(field?.key))).flatMap(field=>splitValues(field?.value))};
const genderValues=product=>list(product.metafields).filter(field=>normalizeKey(field?.namespace)==='custom'&&normalizeKey(field?.key)==='gender').flatMap(field=>splitValues(field?.value)).map(value=>{const v=normalized(value);return v==='nam'||v==='male'?'Nam':v==='nu'||v==='female'?'Nữ':v==='unisex'?'Unisex':''}).filter(Boolean);
const tagMatch=(product,pattern)=>list(product.tags).map(clean).find(tag=>pattern.test(tag))||'';
const FILTER_ALIASES={
  discount:['discount','discount_percent','sale_percent'],faceShape:['faceshape','face_shape','dial_shape','watch_face_shape'],faceSize:['facesize','face_size','case_size','diameter','duong_kinh'],bandMaterial:['bandmaterial','band_material','strap_material','watch_band_material'],bandColor:['bandcolor','band_color','band-color','strap_color','m_u_d_y'],caseColor:['casecolor','case_color','case-color','watch_case_color'],classification:['classification','watch_type','movement','phan_loai']
};
function productFilterValues(product,key){
  if(key==='gender')return genderValues(product);
  const explicit=metafieldValues(product,FILTER_ALIASES[key]||[]);
  if(key==='discount'){
    const rate=explicit.length?Number(explicit[0].replace(/[^\d.]/g,'')):discount(Number(product.price)||0,Number(product.compareAtPrice)||0);
    if(!(rate>0))return[];if(rate<10)return['Dưới 10%'];if(rate<20)return['10% – 19%'];if(rate<30)return['20% – 29%'];if(rate<40)return['30% – 39%'];if(rate<50)return['40% – 49%'];return['Từ 50%'];
  }
  if(explicit.length)return explicit;
  if(key==='faceShape'){
    const value=findSpec(product,['Hình dạng mặt số','Hình dạng mặt','Dáng mặt']);if(value)return[value];
    if(/tonneau/i.test(product.title))return['Tonneau'];if(/square|vuông/i.test(product.title))return['Vuông'];if(/rectangle|chữ nhật/i.test(product.title))return['Chữ nhật'];return normalized(product.productType).includes('watch')?['Tròn']:[];
  }
  if(key==='faceSize'){const value=findSpec(product,['Kích thước mặt số','Đường kính','Kích thước vỏ'])||tagMatch(product,/^\d+(?:[.,]\d+)?\s*mm$/i);return value?[value.replace(/(\d)\s*mm$/i,'$1 mm')]:[]}
  if(key==='bandMaterial'){const value=findSpec(product,['Chất liệu dây','Dây đeo'])||tagMatch(product,/^Dây\s/i);const match=value.match(/dây\s+(kim loại|da|cao su|vải|silicone|thép[^,;]*)/i);return match?[`Dây ${clean(match[1]).toLowerCase()}`]:value?[value]:[]}
  if(key==='bandColor'){const value=findSpec(product,['Màu dây','Dây đeo']);const match=value.match(/màu\s+(.+)$/i);return match?[clean(match[1])]:[]}
  if(key==='caseColor'){const value=findSpec(product,['Màu vỏ','Màu viền','Viền đồng hồ']);return value?[value]:[]}
  if(key==='classification'){const value=findSpec(product,['Phân loại','Máy','Bộ máy']);if(value)return[/quartz/i.test(value)?'Đồng hồ Quartz':/automatic|cơ/i.test(value)?'Đồng hồ cơ':value];return product.productType?[normalized(product.productType)==='watches'?'Đồng hồ':clean(product.productType)]:[]}
  return[];
}

const stringValues=(product,field)=>field==='vendor'?[product.vendor]:field==='productType'?[product.productType]:field==='tag'?list(product.tags):field==='status'?[product.status]:field==='gender'?genderValues(product):[];
const numericValues=(product,field)=>{const variants=list(product.variants);if(field==='price')return[Number(product.price)||0,...variants.map(item=>Number(item.price)||0)];if(field==='compareAtPrice')return[Number(product.compareAtPrice)||0,...variants.map(item=>Number(item.compareAtPrice)||0)].filter(value=>value>0);if(field==='inventory')return variants.length?variants.map(item=>Number(item.inventory)||0):[Number(product.inventory)||0];if(field==='discountPercent')return[discount(Number(product.price)||0,Number(product.compareAtPrice)||0),...variants.map(item=>discount(Number(item.price)||0,Number(item.compareAtPrice)||0))];return[]};
const matchText=(values,operator,target)=>{const expected=normalized(target),usable=values.map(normalized).filter(Boolean);if(operator==='is_set')return usable.length>0;if(operator==='is_not_set')return usable.length===0;if(!expected)return false;if(operator==='not_equals')return usable.every(value=>value!==expected);if(operator==='contains')return usable.some(value=>value.includes(expected));if(operator==='not_contains')return usable.every(value=>!value.includes(expected));return usable.some(value=>value===expected)};
const matchNumber=(values,operator,target)=>{const usable=values.filter(Number.isFinite);if(operator==='is_set')return usable.some(value=>value>0);if(operator==='is_not_set')return usable.every(value=>value<=0);const expected=numberValue(target);if(operator==='not_equals')return usable.every(value=>value!==expected);if(operator==='greater_than')return usable.some(value=>value>expected);if(operator==='less_than')return usable.some(value=>value<expected);if(operator==='greater_or_equal')return usable.some(value=>value>=expected);if(operator==='less_or_equal')return usable.some(value=>value<=expected);return usable.some(value=>value===expected)};
const matchesCondition=(product,condition)=>['price','compareAtPrice','inventory','discountPercent'].includes(condition?.field)?matchNumber(numericValues(product,condition.field),condition.operator,condition.value):matchText(stringValues(product,condition?.field),condition?.operator,condition?.value);
function collectionProducts(collection,products){
  if(!collection)return products;
  if(collection.type!=='automatic'){const ids=new Set(Array.isArray(collection.productIds)?collection.productIds:String(collection.productIds||'').split(',').map(clean));return products.filter(product=>ids.has(product.id))}
  const conditions=list(collection.conditions);if(!conditions.length)return[];const any=collection.conditionMatch==='any';return products.filter(product=>{const results=conditions.map(condition=>matchesCondition(product,condition));return any?results.some(Boolean):results.every(Boolean)})
}

const PRICE_BANDS={under20:price=>price<20_000_000,'20to50':price=>price>=20_000_000&&price<50_000_000,'50to100':price=>price>=50_000_000&&price<100_000_000,over100:price=>price>=100_000_000};
const FILTER_KEYS=['gender','discount','faceShape','faceSize','bandMaterial','bandColor','caseColor','classification'];
function buildFacets(source){
  const vendors=new Map(),filters=Object.fromEntries(FILTER_KEYS.map(key=>[key,new Map()])),prices=new Map(Object.keys(PRICE_BANDS).map(key=>[key,0]));
  for(const product of source){if(clean(product.vendor))vendors.set(clean(product.vendor),(vendors.get(clean(product.vendor))||0)+1);for(const[key,match]of Object.entries(PRICE_BANDS))if(match(Number(product.price)||0)){prices.set(key,(prices.get(key)||0)+1);break}for(const key of FILTER_KEYS)for(const value of [...new Set(productFilterValues(product,key).map(clean).filter(Boolean))])filters[key].set(value,(filters[key].get(value)||0)+1)}
  const toOptions=map=>[...map.entries()].map(([value,count])=>({value,count})).sort((a,b)=>a.value.localeCompare(b.value,'vi'));
  return{vendors:toOptions(vendors),prices:[{value:'under20',label:'Dưới 20 triệu',count:prices.get('under20')||0},{value:'20to50',label:'20 – 50 triệu',count:prices.get('20to50')||0},{value:'50to100',label:'50 – 100 triệu',count:prices.get('50to100')||0},{value:'over100',label:'Trên 100 triệu',count:prices.get('over100')||0}],filters:Object.fromEntries(FILTER_KEYS.map(key=>[key,toOptions(filters[key])]))};
}
function applyFilters(source,req){
  const brands=queryValues(req,'brand'),priceBands=queryValues(req,'price'),stock=req.query?.stock==='1';const selected=Object.fromEntries(FILTER_KEYS.map(key=>[key,queryValues(req,key)]));
  return source.filter(product=>{if(brands.length&&!brands.includes(clean(product.vendor)))return false;if(stock&&Number(product.inventory)<=0)return false;if(priceBands.length&&!priceBands.some(key=>PRICE_BANDS[key]?.(Number(product.price)||0)))return false;for(const key of FILTER_KEYS){const wanted=selected[key];if(wanted.length&&!productFilterValues(product,key).some(value=>wanted.includes(value)))return false}return true});
}
function sortProducts(products,sort){const result=[...products];if(sort==='low')result.sort((a,b)=>(Number(a.price)||0)-(Number(b.price)||0));else if(sort==='high')result.sort((a,b)=>(Number(b.price)||0)-(Number(a.price)||0));else if(sort==='name')result.sort((a,b)=>clean(a.title).localeCompare(clean(b.title),'vi'));else if(sort==='nameDesc')result.sort((a,b)=>clean(b.title).localeCompare(clean(a.title),'vi'));else if(sort==='new')result.sort((a,b)=>clean(b.createdAt).localeCompare(clean(a.createdAt)));else if(sort==='old')result.sort((a,b)=>clean(a.createdAt).localeCompare(clean(b.createdAt)));return result}
function pageProduct(product){return{...product,id:clean(product.id||product.sku),handle:clean(product.handle),title:clean(product.title),vendor:clean(product.vendor),productType:clean(product.productType),category:clean(product.category),status:'active',published:true,price:Number(product.price)||0,compareAtPrice:Number(product.compareAtPrice)||0,inventory:Number(product.inventory)||0,images:list(product.images).map(clean).filter(Boolean),tags:list(product.tags).map(clean).filter(Boolean),variants:list(product.variants).map(item=>({...item,price:Number(item.price)||0,compareAtPrice:Number(item.compareAtPrice)||0,inventory:Number(item.inventory)||0})),options:list(product.options),metafields:list(product.metafields),rawShopify:undefined}}

export default async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({message:'Method not allowed'})}
  try{
    const bundle=await readBundle();const handle=clean(req.query?.handle);const collection=handle?bundle.collections.find(item=>clean(item.handle)===handle):null;if(handle&&!collection)return res.status(404).json({message:'Collection not found'});
    const source=collectionProducts(collection,bundle.products);const facets=buildFacets(source);const filtered=sortProducts(applyFilters(source,req),clean(req.query?.sort)||'featured');const pageSize=Math.max(24,Math.min(48,Number.parseInt(clean(req.query?.limit)||'48',10)||48));const total=filtered.length,totalPages=Math.max(1,Math.ceil(total/pageSize));const requested=Math.max(1,Number.parseInt(clean(req.query?.page)||'1',10)||1),page=Math.min(requested,totalPages);const start=(page-1)*pageSize;const products=filtered.slice(start,start+pageSize).map(pageProduct);
    res.setHeader('Cache-Control','public, s-maxage=120, stale-while-revalidate=300');res.setHeader('X-TimeForge-Catalog-Scope',`page-${page}-${pageSize}`);res.setHeader('X-TimeForge-Catalog-Total',String(total));res.setHeader('Access-Control-Allow-Origin','*');return res.status(200).json({products,scope:'catalog-page',page,pageSize,total,sourceTotal:source.length,totalPages,facets});
  }catch(error){console.error('[TimeForge] Catalog page failed:',error instanceof Error?error.message:error);res.setHeader('Cache-Control','no-store');return res.status(503).json({message:'Không thể tải trang sản phẩm'})}
}
