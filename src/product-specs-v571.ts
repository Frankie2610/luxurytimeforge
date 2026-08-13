import type {Product} from './types';

export type ProductSpecKey=
  |'sku'|'gender'|'caseMaterial'|'bezel'|'diameter'|'dialColor'|'glass'
  |'waterResistance'|'movement'|'strap'|'bandColor'|'size'
  |'brandOrigin'|'manufacturedOrigin'|'warranty';

export type ProductSpecsV571=Partial<Record<ProductSpecKey,string>>;

const SPEC_ALIASES:Record<ProductSpecKey,string[]>={
  sku:['Mã SKU','SKU'],
  gender:['Giới tính','Đối tượng sử dụng','Gender'],
  caseMaterial:['Chất liệu vỏ máy','Chất liệu vỏ','Case material','Chất liệu'],
  bezel:['Viền đồng hồ','Màu viền','Bezel'],
  diameter:['Đường kính mặt','Đường kính','Kích thước mặt','Case size'],
  dialColor:['Màu mặt số','Màu mặt đồng hồ','Màu mặt','Dial color','Màu sắc'],
  glass:['Chất liệu kính','Mặt kính','Loại kính','Crystal'],
  waterResistance:['Khả năng chống nước','Độ chịu nước','Chống nước','Water resistance'],
  movement:['Loại máy','Bộ máy','Movement','Máy'],
  strap:['Chất liệu dây đeo','Chất liệu dây','Dây đeo','Loại dây','Strap'],
  bandColor:['Màu dây đeo','Màu dây','Band color'],
  size:['Kích thước','Size'],
  brandOrigin:['Xuất xứ thương hiệu','Thương hiệu từ'],
  manufacturedOrigin:['Xuất xứ sản xuất','Sản xuất tại','Nơi sản xuất'],
  warranty:['Thời gian bảo hành','Bảo hành'],
};

const aliasEntries=(Object.entries(SPEC_ALIASES) as Array<[ProductSpecKey,string[]]>)
  .flatMap(([key,aliases])=>aliases.map(alias=>({key,alias})))
  .sort((a,b)=>b.alias.length-a.alias.length);

const escapeRegExp=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const labelPattern=aliasEntries.map(item=>escapeRegExp(item.alias.normalize('NFC'))).join('|');
const labelMatcher=new RegExp(`(${labelPattern})\\s*[:：]`,'giu');
const aliasToKey=new Map(aliasEntries.map(item=>[item.alias.normalize('NFC').toLocaleLowerCase('vi'),item.key]));

const decodeEntities=(value:string)=>value
  .replace(/&nbsp;|&#160;/gi,' ')
  .replace(/&amp;/gi,'&')
  .replace(/&quot;/gi,'"')
  .replace(/&#39;|&apos;/gi,"'")
  .replace(/&lt;/gi,'<')
  .replace(/&gt;/gi,'>')
  .replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code)||32))
  .replace(/&#x([\da-f]+);/gi,(_,code)=>String.fromCodePoint(Number.parseInt(code,16)||32));

const readableText=(value:string)=>decodeEntities(String(value||''))
  .replace(/<br\s*\/?>/gi,'\n')
  .replace(/<\/(?:p|li|div|tr|h[1-6])\s*>/gi,'\n')
  .replace(/<li[^>]*>/gi,'\n')
  .replace(/<[^>]+>/g,' ')
  .normalize('NFC')
  .replace(/[\t\r\f\v]+/g,' ')
  .replace(/ *\n */g,'\n')
  .replace(/ {2,}/g,' ')
  .trim();

const fold=(value:string)=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('vi').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim();

const wordCaps:Partial<Record<ProductSpecKey,number>>={
  sku:8,gender:5,caseMaterial:18,bezel:8,diameter:8,dialColor:8,glass:12,waterResistance:8,
  movement:12,strap:20,bandColor:8,size:10,brandOrigin:6,manufacturedOrigin:6,warranty:10,
};

const cleanValue=(raw:string,key:ProductSpecKey,productTitle:string)=>{
  let value=readableText(raw)
    .replace(/^[-–—|;•,\s]+|[-–—|;•,\s]+$/g,'')
    .replace(/\s+(?:Thông số sản phẩm|Thông tin sản phẩm|Product specifications?).*$/iu,'')
    .trim();
  if(productTitle){
    const titleIndex=value.toLocaleLowerCase('vi').indexOf(productTitle.normalize('NFC').toLocaleLowerCase('vi'));
    if(titleIndex>0)value=value.slice(0,titleIndex).trim();
  }
  value=value.split(/\n+/)[0]?.trim()||'';
  const sentence=value.search(/[.!?]\s/);
  if(sentence>0)value=value.slice(0,sentence).trim();
  const cap=wordCaps[key];
  if(cap){
    const words=value.split(/\s+/);
    if(words.length>cap)value=words.slice(0,cap).join(' ');
  }
  if(value.length>140)value=value.slice(0,140).replace(/\s+\S*$/,'').trim();
  return value.replace(/^[:：]\s*/,'').trim();
};

const scanSpecs=(source:string,productTitle:string):ProductSpecsV571=>{
  const text=readableText(source);
  if(!text)return{};
  const matches=[...text.matchAll(labelMatcher)];
  const result:ProductSpecsV571={};
  matches.forEach((match,index)=>{
    const alias=String(match[1]||'').normalize('NFC').toLocaleLowerCase('vi');
    const key=aliasToKey.get(alias);
    if(!key||result[key])return;
    const start=(match.index||0)+match[0].length;
    const end=matches[index+1]?.index??text.length;
    const value=cleanValue(text.slice(start,end),key,productTitle);
    if(value)result[key]=value;
  });
  return result;
};

const directSpecs=(product:Product):ProductSpecsV571=>{
  const result:ProductSpecsV571={};
  const rows=[...Object.entries(product.rawShopify||{}),...(product.metafields||[]).map(item=>[`${item.namespace} ${item.key}`,item.value] as [string,string])];
  rows.forEach(([rawKey,rawValue])=>{
    const normalizedKey=fold(rawKey);
    const match=aliasEntries.find(item=>{
      const alias=fold(item.alias);
      return normalizedKey===alias||normalizedKey.endsWith(` ${alias}`)||normalizedKey.startsWith(`${alias} `);
    });
    if(!match||result[match.key])return;
    const value=cleanValue(rawValue,match.key,product.title);
    if(value)result[match.key]=value;
  });
  return result;
};

const cache=new WeakMap<Product,ProductSpecsV571>();

export function extractProductSpecsV571(product:Product):ProductSpecsV571{
  const cached=cache.get(product);if(cached)return cached;
  const explicit=directSpecs(product);
  const fromHtml=scanSpecs(product.descriptionHtml,product.title);
  const fromText=scanSpecs(product.descriptionText,product.title);
  const result:ProductSpecsV571={...fromText,...fromHtml,...explicit,sku:product.sku||product.variants[0]?.sku||explicit.sku||fromHtml.sku||fromText.sku};
  cache.set(product,result);
  return result;
}

export const productSearchTextV571=(product:Product)=>readableText([
  product.title,product.vendor,product.productType,product.category,product.tags.join(' '),
  product.descriptionText,product.descriptionHtml,
].join(' ')).replace(/\s+/g,' ').trim();
