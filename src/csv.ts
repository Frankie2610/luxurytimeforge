import Papa from 'papaparse';
import type{ImportResult,Metafield,Product,ProductOption,Status,Variant}from'./types';
import{slugify,strip,uid}from'./utils';
import{canonicalProduct,isFirebaseSafeSku,normalizeSku}from'./product-data';
import{isFirebaseSafeObjectKey}from'./firebase-value';

const num=(v:unknown)=>{const raw=String(v??'').trim();if(!raw)return 0;const normalized=raw.replace(/\s/g,'').replace(/(?<=\d)[.,](?=\d{3}(?:\D|$))/g,'').replace(',','.').replace(/[^0-9.-]/g,'');const n=Number(normalized);return Number.isFinite(n)?n:0};
const bool=(v:unknown)=>['true','1','yes','y','co','có','active','published'].includes(String(v??'').trim().toLowerCase());
const clean=(value:unknown)=>String(value??'').trim();
const resolveImportedStatus=(rawStatus:string,publishFallback:boolean):Status=>{
  const normalized=rawStatus.trim().toLowerCase();
  if(normalized==='active')return'active';
  if(normalized==='archive'||normalized==='archived')return'archived';
  if(normalized==='draft')return'draft';
  return publishFallback?'active':'draft';
};
const resolveImportedPublished=(status:Status,rawStatus:string,rawPublished:string,publishFallback:boolean)=>{
  if(status!=='active')return false;
  if(rawPublished.trim())return bool(rawPublished);
  return rawStatus.trim()?true:publishFallback;
};
const norm=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const aliases=(...values:string[])=>new Set(values.map(norm));
const findValue=(row:Record<string,string>,names:Set<string>)=>{for(const[header,value]of Object.entries(row)){if(names.has(norm(header))&&clean(value))return clean(value)}return''};
const splitList=(value:string)=>value.split(/[\n;,|]+/).map(item=>item.trim()).filter(Boolean);
const looksLikeUrl=(value:string)=>/^https?:\/\//i.test(value)||/^\/\//.test(value);
const unsafeFirebaseHeaders=(headers:string[])=>headers.filter(header=>!isFirebaseSafeObjectKey(header));
const unsafeHeaderWarning=(headers:string[])=>{const unsafe=unsafeFirebaseHeaders(headers);return unsafe.length?`Firebase sẽ tự động bỏ qua ${unsafe.length} cột raw có tên chứa . # $ / [ ]; các trường sản phẩm chuẩn và URL ảnh vẫn được nhập.`:''};
export const firebaseSafeRawRow=(row:Record<string,string>)=>Object.fromEntries(Object.entries(row).filter(([key])=>isFirebaseSafeObjectKey(key)));

const SKU=aliases('SKU','Mã SKU','Ma SKU','Variant SKU','Product ID','Mã sản phẩm','Ma san pham','ID');
const TITLE=aliases('Title','Tên sản phẩm','Ten san pham','Product Name','Tên đồng hồ','Ten dong ho','Description');
const DESCRIPTION=aliases('Body (HTML)','Mô tả','Mo ta','Mô tả sản phẩm','Mo ta san pham','Description HTML','Product Description');
const VENDOR=aliases('Vendor','Brand','Thương hiệu','Thuong hieu','Nhãn hiệu','Nhan hieu');
const TYPE=aliases('Type','Product Type','Loại sản phẩm','Loai san pham','Danh mục','Danh muc','Category');
const PRICE=aliases('Variant Price','Price','Giá bán','Gia ban','Giá','Gia','Sale Price');
const COMPARE=aliases('Variant Compare At Price','Compare At Price','Giá gốc','Gia goc','Original Price','List Price');
const COST=aliases('Cost per item','Cost','Giá vốn','Gia von');
const INVENTORY=aliases('Variant Inventory Qty','Inventory','Tồn kho','Ton kho','Số lượng','So luong','Quantity');
const BARCODE=aliases('Variant Barcode','Barcode','Mã vạch','Ma vach');
const HANDLE=aliases('Handle','Slug','URL handle');
const STATUS=aliases('Status','Trạng thái','Trang thai');
const PUBLISHED=aliases('Published','Đăng bán','Dang ban','Hiển thị','Hien thi');
const TAGS=aliases('Tags','Tag','Thẻ','The');
const SEO_TITLE=aliases('SEO Title','Tiêu đề SEO','Tieu de SEO');
const SEO_DESCRIPTION=aliases('SEO Description','Mô tả SEO','Mo ta SEO');
const IMAGE_HEADERS=['image src','image url','images','image','hinh anh','url hinh anh','duong dan hinh anh','photo url','anh san pham','hinh anh 1','hinh anh 2','hinh anh 3','hinh anh 4'];

const SPEC_ALIASES:[string,string[]][]=[
  ['Giới tính',['Giới tính','Gioi tinh','Gender']],
  ['Chất liệu vỏ máy',['Chất liệu vỏ máy','Chat lieu vo may','Case Material']],
  ['Viền đồng hồ',['Viền đồng hồ','Vien dong ho','Bezel']],
  ['Đường kính',['Đường kính','Duong kinh','Case Diameter','Diameter']],
  ['Màu mặt số',['Màu mặt số','Mau mat so','Dial Color']],
  ['Chất liệu kính',['Chất liệu kính','Chat lieu kinh','Crystal','Glass Material']],
  ['Chống nước',['Chống nước','Chong nuoc','Water Resistance']],
  ['Máy',['Máy','May','Movement']],
  ['Dây đeo',['Dây đeo','Day deo','Strap','Band']],
  ['Xuất xứ thương hiệu',['Xuất xứ thương hiệu','Xuat xu thuong hieu','Brand Origin']],
  ['Sản xuất tại',['Sản xuất tại','San xuat tai','Made In','Country of Manufacture']],
];

const metafieldKey=(header:string)=>{const m=header.match(/\(product\.metafields\.([^)]+)\)/i);if(!m)return null;const path=m[1],dot=path.indexOf('.');return dot>0?{namespace:path.slice(0,dot),key:path.slice(dot+1)}:{namespace:'custom',key:path}};
const optionList=(rows:Record<string,string>[]):ProductOption[]=>[1,2,3].flatMap(n=>{const name=rows.map(r=>r[`Option${n} Name`]?.trim()).find(Boolean);if(!name||name.toLowerCase()==='title')return[];const values=[...new Set(rows.map(r=>r[`Option${n} Value`]?.trim()).filter(Boolean))] as string[];return[{id:`option-${slugify(name)}`,name,values}]});
const metafields=(row:Record<string,string>):Metafield[]=>Object.entries(row).flatMap(([header,value])=>{const parsed=metafieldKey(header);if(!parsed||!clean(value))return[];return[{id:`${parsed.namespace}.${parsed.key}`,namespace:parsed.namespace,key:parsed.key,value:clean(value),type:'single_line_text_field'}]});

function rowImages(row:Record<string,string>):string[]{
  const urls:string[]=[];
  for(const[header,value]of Object.entries(row)){
    const normalized=norm(header);
    const isImageHeader=IMAGE_HEADERS.some(item=>normalized===item||normalized.startsWith(`${item} `))||(/image|photo|hinh anh|anh san pham/.test(normalized)&&/url|src|link|image|photo|hinh|anh/.test(normalized));
    if(!isImageHeader)continue;
    for(const candidate of splitList(clean(value))){if(looksLikeUrl(candidate))urls.push(candidate.startsWith('//')?`https:${candidate}`:candidate)}
  }
  return [...new Set(urls)];
}

function specificationData(row:Record<string,string>):{html:string;metafields:Metafield[]} {
  const items=SPEC_ALIASES.flatMap(([label,names])=>{const value=findValue(row,aliases(...names));return value?[{label,value}]:[]});
  return{
    html:items.length?`<h2>Thông số sản phẩm</h2><ul>${items.map(item=>`<li><strong>${item.label}:</strong> ${item.value}</li>`).join('')}</ul>`:'',
    metafields:items.map(item=>({id:`custom.${slugify(item.label)}`,namespace:'custom',key:slugify(item.label).replace(/-/g,'_'),value:item.value,type:'single_line_text_field'})),
  };
}

export function parseGenericRows(data:Record<string,string>[],publish:boolean):ImportResult{
  const warnings:string[]=[];
  let missingImageCount=0;
  const headerWarning=unsafeHeaderWarning(data.length?Object.keys(data[0]):[]);if(headerWarning)warnings.push(headerWarning);
  const groups=new Map<string,Record<string,string>[]>();
  data.forEach((row,index)=>{
    const sku=normalizeSku(findValue(row,SKU));
    if(!sku){warnings.push(`Dòng ${index+2}: bỏ qua vì thiếu SKU.`);return}
    if(!isFirebaseSafeSku(sku)){warnings.push(`Dòng ${index+2}: SKU “${sku}” có ký tự không hợp lệ cho Firebase.`);return}
    groups.set(sku,[...(groups.get(sku)||[]),row]);
  });
  let draftCount=0;
  const products=[...groups.entries()].flatMap(([sku,rows])=>{
    const row=rows[0];
    const title=findValue(row,TITLE)||sku;
    const vendor=findValue(row,VENDOR);
    const rawDescription=findValue(row,DESCRIPTION);
    const descriptionHtml=/<[a-z][\s\S]*>/i.test(rawDescription)?rawDescription:rawDescription?`<p>${rawDescription}</p>`:'';
    const specs=specificationData(row);
    const images=[...new Set(rows.flatMap(rowImages))];
    if(!images.length){missingImageCount++;return[]}
    const price=num(findValue(row,PRICE));
    const compareAtPrice=num(findValue(row,COMPARE));
    const inventory=num(findValue(row,INVENTORY));
    const rawStatus=findValue(row,STATUS);
    const rawPublished=findValue(row,PUBLISHED);
    const status=resolveImportedStatus(rawStatus,rawPublished.trim()?bool(rawPublished):publish);
    const published=resolveImportedPublished(status,rawStatus,rawPublished,publish);
    if(status!=='active'||!published)draftCount++;
    const variant:Variant={id:sku,title:'Default Title',sku,price,compareAtPrice,inventory,optionValues:{}};
    const product:Product={
      id:sku,sku,
      handle:findValue(row,HANDLE)||slugify(`${vendor}-${title}-${sku}`),
      title,
      descriptionHtml:`${descriptionHtml}${specs.html}`,
      descriptionText:strip(`${rawDescription} ${SPEC_ALIASES.map(([label,names])=>{const value=findValue(row,aliases(...names));return value?`${label}: ${value}`:''}).filter(Boolean).join(' ')}`),
      vendor,
      productType:findValue(row,TYPE),
      category:findValue(row,aliases('Product Category','Danh mục chuẩn','Category'))||findValue(row,TYPE),
      tags:splitList(findValue(row,TAGS)),
      status,
      published,
      images,
      price,compareAtPrice,cost:num(findValue(row,COST)),
      barcode:findValue(row,BARCODE),inventory,trackInventory:true,
      weight:num(findValue(row,aliases('Variant Grams','Weight','Trọng lượng','Trong luong'))),
      weightUnit:findValue(row,aliases('Variant Weight Unit','Weight Unit','Đơn vị trọng lượng','Don vi trong luong'))||'g',
      seoTitle:findValue(row,SEO_TITLE)||`${title} | Luxury Timeforge`,
      seoDescription:findValue(row,SEO_DESCRIPTION)||strip(rawDescription).slice(0,155),
      variants:[variant],options:[],metafields:specs.metafields,
      createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),rawShopify:firebaseSafeRawRow(row),
    };
    return[canonicalProduct(product)];
  });
  if(missingImageCount)warnings.push(`Đã bỏ qua ${missingImageCount} sản phẩm chưa có URL hình ảnh.`);
  return{products,headers:data.length?Object.keys(data[0]):[],rowCount:data.length,draftCount,warnings:[...new Set(warnings)]};
}

export function parseShopifyRows(data:Record<string,string>[],headers:string[],publish:boolean):ImportResult{
  const groups=new Map<string,Record<string,string>[]>();
  const warnings:string[]=[];
  let missingImageCount=0;
  const headerWarning=unsafeHeaderWarning(headers);if(headerWarning)warnings.push(headerWarning);
  data.forEach((row,index)=>{const handle=clean(row.Handle);const sku=normalizeSku(row['Variant SKU']);const key=handle||sku;if(!key){warnings.push(`Dòng ${index+2}: thiếu Handle và Variant SKU.`);return}groups.set(key,[...(groups.get(key)||[]),row])});
  let draftCount=0;
  const products=[...groups.entries()].flatMap(([groupKey,rows])=>{
    const main=rows.find(row=>clean(row.Title))||rows[0];
    const variants:Variant[]=rows.filter(row=>row['Variant SKU']||row['Option1 Value']||row['Variant Price']).map((row,index)=>{
      const sku=normalizeSku(row['Variant SKU']);
      const optionValues=Object.fromEntries([1,2,3].flatMap(number=>row[`Option${number} Name`]&&row[`Option${number} Value`]?[[row[`Option${number} Name`],row[`Option${number} Value`]]]:[]));
      return{id:sku||`${groupKey}-${index+1}`,title:row['Option1 Value']||sku||`Variant ${index+1}`,sku,price:num(row['Variant Price']),compareAtPrice:num(row['Variant Compare At Price']),inventory:num(row['Variant Inventory Qty']),optionValues};
    });
    const primarySku=normalizeSku(variants[0]?.sku||main['Variant SKU']);
    if(!primarySku){warnings.push(`Sản phẩm ${main.Title||groupKey}: bỏ qua vì thiếu SKU.`);return[]}
    if(!isFirebaseSafeSku(primarySku)){warnings.push(`SKU “${primarySku}” có ký tự Firebase không hỗ trợ.`);return[]}
    const images=[...new Set(rows.flatMap(rowImages))];
    if(!images.length){missingImageCount++;return[]}
    const original=clean(main.Status);
    const rawPublished=clean(main.Published);
    const status=resolveImportedStatus(original,rawPublished?bool(rawPublished):publish);
    const published=resolveImportedPublished(status,original,rawPublished,publish);
    if(status!=='active'||!published)draftCount++;
    const html=main['Body (HTML)']||'';
    const first=variants[0];
    const product:Product={
      id:primarySku,sku:primarySku,handle:clean(main.Handle)||slugify(`${main.Vendor}-${main.Title}-${primarySku}`),title:main.Title||groupKey.replace(/-/g,' '),
      descriptionHtml:html,descriptionText:strip(html),vendor:main.Vendor||'',productType:main.Type||'',category:main['Product Category']||'',tags:splitList(main.Tags||''),
      status,published,
      images,price:first?.price||num(main['Variant Price']),compareAtPrice:first?.compareAtPrice||num(main['Variant Compare At Price']),cost:num(main['Cost per item']),
      barcode:main['Variant Barcode']||'',inventory:variants.reduce((sum,item)=>sum+item.inventory,0)||num(main['Variant Inventory Qty']),trackInventory:main['Variant Inventory Tracker']==='shopify',weight:num(main['Variant Grams']),weightUnit:main['Variant Weight Unit']||'g',
      seoTitle:main['SEO Title']||`${main.Title||groupKey} | Luxury Timeforge`,seoDescription:main['SEO Description']||strip(html).slice(0,155),options:optionList(rows),metafields:metafields(main),
      variants:variants.length?variants:[{id:primarySku,title:'Default Title',sku:primarySku,price:num(main['Variant Price']),compareAtPrice:num(main['Variant Compare At Price']),inventory:num(main['Variant Inventory Qty']),optionValues:{}}],
      createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),rawShopify:firebaseSafeRawRow(main),
    };
    return[canonicalProduct(product)];
  });
  if(missingImageCount)warnings.push(`Đã bỏ qua ${missingImageCount} sản phẩm chưa có URL hình ảnh.`);
  return{products,headers,rowCount:data.length,draftCount,warnings:[...new Set(warnings)]};
}

export function parseShopifyCsv(file:File,publish=true):Promise<ImportResult>{
  return new Promise((resolve,reject)=>Papa.parse<Record<string,string>>(file,{
    header:true,skipEmptyLines:'greedy',transformHeader:header=>header.replace(/^\uFEFF/,'').trim(),
    complete:({data,meta,errors})=>{
      if(errors.some(error=>error.type==='Quotes'))return reject(new Error('CSV có dấu nháy không hợp lệ.'));
      const headers=meta.fields||[];
      const isShopify=headers.some(header=>norm(header)==='handle')&&headers.some(header=>norm(header)==='variant sku');
      const result=isShopify?parseShopifyRows(data,headers,publish):parseGenericRows(data,publish);
      resolve({...result,headers});
    },error:reject,
  }));
}

const base=['Handle','Title','Body (HTML)','Vendor','Product Category','Type','Tags','Published','Option1 Name','Option1 Value','Option2 Name','Option2 Value','Option3 Name','Option3 Value','Variant SKU','Variant Grams','Variant Inventory Tracker','Variant Inventory Qty','Variant Inventory Policy','Variant Fulfillment Service','Variant Price','Variant Compare At Price','Variant Requires Shipping','Variant Taxable','Variant Barcode','Image Src','Image Position','Image Alt Text','Gift Card','SEO Title','SEO Description','Variant Weight Unit','Cost per item','Status'];
export function exportShopifyCsv(products:Product[],headers?:string[]){const cols=headers?.length?[...headers]:[...base];products.forEach(product=>(product.metafields||[]).forEach(field=>{const match=cols.find(header=>header.includes(`(product.metafields.${field.namespace}.${field.key})`));if(!match)cols.push(`${field.key} (product.metafields.${field.namespace}.${field.key})`)}));const rows:Record<string,string>[]=[];products.forEach(product=>{const variants=product.variants.length?product.variants:[{id:'',title:'Default Title',sku:product.sku,price:product.price,compareAtPrice:product.compareAtPrice,inventory:product.inventory,optionValues:{}}];variants.forEach((variant,index)=>{const row=Object.fromEntries(cols.map(header=>[header,''])) as Record<string,string>;if(index===0){Object.assign(row,product.rawShopify||{});Object.assign(row,{Handle:product.handle,Title:product.title,'Body (HTML)':product.descriptionHtml,Vendor:product.vendor,'Product Category':product.category,Type:product.productType,Tags:product.tags.join(', '),Published:String(product.published),'SEO Title':product.seoTitle,'SEO Description':product.seoDescription,Status:product.status});(product.metafields||[]).forEach(field=>{const header=cols.find(item=>item.includes(`(product.metafields.${field.namespace}.${field.key})`));if(header)row[header]=field.value})}else row.Handle=product.handle;[1,2,3].forEach(number=>{const option=product.options?.[number-1];if(option){row[`Option${number} Name`]=option.name;row[`Option${number} Value`]=variant.optionValues?.[option.name]||option.values[0]||''}else if(number===1){row['Option1 Name']='Title';row['Option1 Value']=variant.title}});Object.assign(row,{'Variant SKU':variant.sku,'Variant Price':String(variant.price),'Variant Compare At Price':String(variant.compareAtPrice||''),'Variant Inventory Qty':String(variant.inventory),'Variant Inventory Tracker':product.trackInventory?'shopify':'','Variant Inventory Policy':'deny','Variant Fulfillment Service':'manual','Variant Requires Shipping':'true','Variant Taxable':'true','Variant Barcode':index===0?product.barcode:'','Variant Grams':String(product.weight||0),'Variant Weight Unit':product.weightUnit,'Cost per item':index===0?String(product.cost||''):'','Image Src':product.images[index]||(!index?product.images[0]||'':''),'Image Position':product.images[index]?String(index+1):''});rows.push(row)});product.images.slice(variants.length).forEach((image,index)=>{const row=Object.fromEntries(cols.map(header=>[header,''])) as Record<string,string>;row.Handle=product.handle;row['Image Src']=image;row['Image Position']=String(variants.length+index+1);rows.push(row)})});return Papa.unparse(rows,{columns:cols,quotes:true,newline:'\r\n'})}
export function download(content:string,name:string){const blob=new Blob(['\uFEFF',content],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();URL.revokeObjectURL(url)}
