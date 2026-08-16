import {useEffect,useMemo} from 'react';
import {useLocation} from 'react-router-dom';
import {useCommerce} from './context';
import {resolveStoreName} from './store-profile';

const FALLBACK_SITE='https://luxurytimeforge.vercel.app';
const FALLBACK_IMAGE='/social-cover.jpg';
const clean=(value:string)=>value.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const clamp=(value:string,max:number)=>value.length<=max?value:`${value.slice(0,Math.max(0,max-1)).trim()}…`;
const setMeta=(selector:string,attrs:Record<string,string>)=>{
  let node=document.head.querySelector<HTMLMetaElement>(selector);
  if(!node){node=document.createElement('meta');document.head.appendChild(node)}
  Object.entries(attrs).forEach(([key,value])=>node!.setAttribute(key,value));
};
const setLink=(rel:string,href:string)=>{
  let node=document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if(!node){node=document.createElement('link');node.rel=rel;document.head.appendChild(node)}
  node.href=href;
};

export function SeoHeadV60(){
  const location=useLocation();
  const{products,collections,storeProfile}=useCommerce();
  const seo=useMemo(()=>{
    const site=(String(import.meta.env.VITE_PUBLIC_SITE_URL||'').trim()||FALLBACK_SITE).replace(/\/$/,'');
    const storeName=resolveStoreName(storeProfile.storeName);
    const path=location.pathname;
    const productHandle=path.startsWith('/products/')?decodeURIComponent(path.slice('/products/'.length)):'';
    const product=productHandle?products.find(item=>item.handle===productHandle):undefined;
    const collectionHandle=path.startsWith('/collections/')?decodeURIComponent(path.slice('/collections/'.length)):'';
    const collection=collectionHandle?collections.find(item=>item.handle===collectionHandle):undefined;
    let title=`${storeName} | Đồng hồ chính hãng`;
    let description=storeProfile.storeDescription||'Đồng hồ chính hãng, thông tin minh bạch, giao hàng toàn quốc và hỗ trợ hậu mãi từ Luxury Timeforge.';
    let image=FALLBACK_IMAGE;
    let type='website';
    let noindex=false;
    if(product){title=product.seoTitle||`${product.title} | ${storeName}`;description=product.seoDescription||product.descriptionText||clean(product.descriptionHtml)||`${product.title} chính hãng tại ${storeName}, giao hàng toàn quốc và hỗ trợ hậu mãi.`;image=product.images[0]||image;type='product'}
    else if(collection){title=`${collection.title} | ${storeName}`;description=collection.description||`Khám phá bộ sưu tập ${collection.title} được ${storeName} tuyển chọn.`;image=collection.image||image}
    else if(path==='/collections'){title=`Tất cả đồng hồ | ${storeName}`;description='Khám phá đồng hồ theo thương hiệu, mức giá, giới tính, chất liệu dây, kích thước mặt và tình trạng còn hàng.'}
    else if(path==='/watch-finder'){title=`Tư vấn chọn đồng hồ | ${storeName}`;description='Tìm mẫu đồng hồ phù hợp theo nhu cầu, phong cách và ngân sách với công cụ tư vấn của Luxury Timeforge.'}
    else if(path==='/blogs'){title=`TimeForge Journal | ${storeName}`;description='Kiến thức, cảm hứng và hướng dẫn chọn đồng hồ từ Luxury Timeforge.'}
    else if(path.startsWith('/blogs/')){title=`TimeForge Journal | ${storeName}`;description='Bài viết và góc nhìn về đồng hồ từ Luxury Timeforge.'}
    else if(path.startsWith('/pages/')){const slug=path.split('/').filter(Boolean).pop()||'';title=`${slug.replace(/-/g,' ')} | ${storeName}`}
    else if(path==='/search'||path==='/wishlist'||path==='/compare'||path==='/cart'||path==='/checkout'||path==='/404'||path.startsWith('/account')||path.startsWith('/order-confirmation')||path.startsWith('/payment/')||path.startsWith('/admin'))noindex=true;
    const canonicalPath=path==='/'?'':path.replace(/\/$/,'');
    const canonical=`${site}${canonicalPath}`;
    const absoluteImage=/^https?:\/\//i.test(image)?image:`${site}${image.startsWith('/')?'':'/'}${image}`;
    return{site,storeName,title:clamp(clean(title),70),description:clamp(clean(description),160),image:absoluteImage,type,noindex,canonical,product};
  },[collections,location.pathname,products,storeProfile]);

  useEffect(()=>{
    document.documentElement.lang='vi';
    document.title=seo.title;
    setMeta('meta[name="description"]',{name:'description',content:seo.description});
    setMeta('meta[name="robots"]',{name:'robots',content:seo.noindex?'noindex, nofollow':'index, follow, max-image-preview:large'});
    setMeta('meta[property="og:title"]',{property:'og:title',content:seo.title});
    setMeta('meta[property="og:description"]',{property:'og:description',content:seo.description});
    setMeta('meta[property="og:type"]',{property:'og:type',content:seo.type});
    setMeta('meta[property="og:url"]',{property:'og:url',content:seo.canonical});
    setMeta('meta[property="og:image"]',{property:'og:image',content:seo.image});
    setMeta('meta[property="og:image:secure_url"]',{property:'og:image:secure_url',content:seo.image});
    setMeta('meta[property="og:image:alt"]',{property:'og:image:alt',content:`${seo.storeName} — đồng hồ chính hãng`});
    setMeta('meta[property="og:locale"]',{property:'og:locale',content:'vi_VN'});
    setMeta('meta[property="og:site_name"]',{property:'og:site_name',content:seo.storeName});
    setMeta('meta[name="twitter:card"]',{name:'twitter:card',content:'summary_large_image'});
    setMeta('meta[name="twitter:title"]',{name:'twitter:title',content:seo.title});
    setMeta('meta[name="twitter:description"]',{name:'twitter:description',content:seo.description});
    setMeta('meta[name="twitter:image"]',{name:'twitter:image',content:seo.image});
    setLink('canonical',seo.canonical);

    const id='tf60-structured-data';
    let script=document.getElementById(id) as HTMLScriptElement|null;
    if(!script){script=document.createElement('script');script.id=id;script.type='application/ld+json';document.head.appendChild(script)}
    const organization={
      '@context':'https://schema.org','@type':'Organization',name:seo.storeName,url:seo.site,logo:`${seo.site}/luxury-timeforge-logo.svg`,
      email:storeProfile.storeEmail||undefined,telephone:storeProfile.storePhone||undefined,address:storeProfile.storeAddress||undefined,
    };
    const data=seo.product?{
      '@context':'https://schema.org','@type':'Product',name:seo.product.title,image:seo.product.images.filter(Boolean),description:seo.description,sku:seo.product.sku,brand:{'@type':'Brand',name:seo.product.vendor||seo.storeName},
      offers:{'@type':'Offer',url:seo.canonical,priceCurrency:'VND',price:seo.product.price,availability:seo.product.inventory>0?'https://schema.org/InStock':'https://schema.org/OutOfStock',itemCondition:'https://schema.org/NewCondition'},
    }:organization;
    script.textContent=JSON.stringify(data);
  },[seo,storeProfile.storeAddress,storeProfile.storeEmail,storeProfile.storePhone]);
  return null;
}
