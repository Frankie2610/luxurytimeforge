import {useEffect,useMemo} from 'react';
import {useLocation} from 'react-router-dom';
import {useStorefrontData} from './context';
import {resolveStoreName} from './store-profile';

const FALLBACK_SITE='https://luxurytimeforge.vercel.app';
const FALLBACK_IMAGE='/social-cover.jpg';
const clean=(value:string)=>value.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const clamp=(value:string,max:number)=>value.length<=max?value:`${value.slice(0,Math.max(0,max-1)).trim()}…`;
const setMeta=(selector:string,attrs:Record<string,string>)=>{let node=document.head.querySelector<HTMLMetaElement>(selector);if(!node){node=document.createElement('meta');document.head.appendChild(node)}Object.entries(attrs).forEach(([key,value])=>node!.setAttribute(key,value))};
const setLink=(rel:string,href:string)=>{let node=document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);if(!node){node=document.createElement('link');node.rel=rel;document.head.appendChild(node)}node.href=href};
const pageSeo:Record<string,{title:string;description:string}>={
  '/pages/about':{title:'Giới thiệu Luxury Timeforge',description:'Tìm hiểu câu chuyện, tiêu chuẩn tuyển chọn sản phẩm và trải nghiệm mua đồng hồ tại Luxury Timeforge.'},
  '/pages/warranty':{title:'Chính sách bảo hành đồng hồ',description:'Chính sách bảo hành đồng hồ tại Luxury Timeforge: thời hạn, thay pin, dây đeo, quy trình tiếp nhận và các trường hợp ngoài bảo hành.'},
  '/pages/shipping':{title:'Chính sách giao hàng đồng hồ',description:'Thông tin giao hàng, thời gian dự kiến, đóng gói và hỗ trợ theo dõi đơn hàng từ Luxury Timeforge.'},
  '/pages/returns':{title:'Chính sách đổi trả đồng hồ',description:'Điều kiện, thời hạn và quy trình đổi trả sản phẩm tại Luxury Timeforge.'},
};

export function SeoHeadV60(){
  const location=useLocation();
  const{products,collections,storeProfile}=useStorefrontData();
  const seo=useMemo(()=>{
    const site=(String(import.meta.env.VITE_PUBLIC_SITE_URL||'').trim()||FALLBACK_SITE).replace(/\/$/,'');
    const storeName=resolveStoreName(storeProfile.storeName),path=location.pathname;
    const productHandle=path.startsWith('/products/')?decodeURIComponent(path.slice('/products/'.length)):'';
    const product=productHandle?products.find(item=>item.handle===productHandle):undefined;
    const collectionHandle=path.startsWith('/collections/')?decodeURIComponent(path.slice('/collections/'.length)):'';
    const collection=collectionHandle?collections.find(item=>item.handle===collectionHandle):undefined;
    let title=storeProfile.seoTitle||`${storeName} | Đồng hồ chính hãng`,description=storeProfile.seoDescription||storeProfile.storeDescription||'Đồng hồ chính hãng, thông tin minh bạch, giao hàng toàn quốc và hỗ trợ hậu mãi từ Luxury Timeforge.',image=storeProfile.socialShareImage||storeProfile.logoImage||FALLBACK_IMAGE,type='website',noindex=false;
    if(product){title=product.seoTitle||`${product.title} chính hãng | ${storeName}`;description=product.seoDescription||product.descriptionText||clean(product.descriptionHtml)||`${product.title} chính hãng tại ${storeName}. Xem giá, tình trạng hàng, thông số và chính sách bảo hành.`;image=product.images[0]||image;type='product'}
    else if(collection){title=`${collection.title} | Đồng hồ chính hãng | ${storeName}`;description=collection.description||`Khám phá bộ sưu tập ${collection.title} được ${storeName} tuyển chọn.`;image=collection.image||image}
    else if(path==='/collections'){title=`Đồng hồ chính hãng | ${storeName}`;description='Khám phá đồng hồ theo thương hiệu, mức giá, giới tính, chất liệu dây, kích thước mặt và tình trạng còn hàng.'}
    else if(path==='/watch-finder'){title=`Tư vấn chọn đồng hồ theo nhu cầu | ${storeName}`;description='Tìm mẫu đồng hồ phù hợp theo phong cách, kích thước và ngân sách với công cụ tư vấn của Luxury Timeforge.'}
    else if(path==='/blogs'){title=`Kiến thức & tư vấn đồng hồ | TimeForge Journal`;description='Kiến thức, cảm hứng, hướng dẫn chọn và chăm sóc đồng hồ từ Luxury Timeforge.'}
    else if(path.startsWith('/blogs/')){title=`TimeForge Journal | ${storeName}`;description='Bài viết và góc nhìn về đồng hồ từ Luxury Timeforge.'}
    else if(pageSeo[path]){title=`${pageSeo[path].title} | ${storeName}`;description=pageSeo[path].description}
    else if(path.startsWith('/pages/')){const slug=path.split('/').filter(Boolean).pop()||'';title=`${slug.replace(/-/g,' ')} | ${storeName}`}
    else if(path==='/search'||path==='/wishlist'||path==='/compare'||path==='/cart'||path==='/checkout'||path==='/404'||path.startsWith('/account')||path.startsWith('/order-confirmation')||path.startsWith('/payment/')||path.startsWith('/admin'))noindex=true;
    const canonicalPath=path==='/'?'':path.replace(/\/$/,'');const canonical=`${site}${canonicalPath}`;const absoluteImage=/^https?:\/\//i.test(image)?image:`${site}${image.startsWith('/')?'':'/'}${image}`;
    return{site,storeName,path,title:clamp(clean(title),68),description:clamp(clean(description),158),image:absoluteImage,type,noindex,canonical,product,collection};
  },[collections,location.pathname,products,storeProfile]);

  useEffect(()=>{
    document.documentElement.lang='vi';document.title=seo.title;
    setMeta('meta[name="description"]',{name:'description',content:seo.description});
    setMeta('meta[name="robots"]',{name:'robots',content:seo.noindex?'noindex, nofollow':'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'});
    const verification=String(import.meta.env.VITE_GOOGLE_SITE_VERIFICATION||'').trim();if(verification)setMeta('meta[name="google-site-verification"]',{name:'google-site-verification',content:verification});
    setMeta('meta[property="og:title"]',{property:'og:title',content:seo.title});setMeta('meta[property="og:description"]',{property:'og:description',content:seo.description});setMeta('meta[property="og:type"]',{property:'og:type',content:seo.type});setMeta('meta[property="og:url"]',{property:'og:url',content:seo.canonical});setMeta('meta[property="og:image"]',{property:'og:image',content:seo.image});setMeta('meta[property="og:image:secure_url"]',{property:'og:image:secure_url',content:seo.image});setMeta('meta[property="og:image:alt"]',{property:'og:image:alt',content:`${seo.storeName} — đồng hồ chính hãng`});setMeta('meta[property="og:locale"]',{property:'og:locale',content:'vi_VN'});setMeta('meta[property="og:site_name"]',{property:'og:site_name',content:seo.storeName});
    setMeta('meta[name="twitter:card"]',{name:'twitter:card',content:'summary_large_image'});setMeta('meta[name="twitter:title"]',{name:'twitter:title',content:seo.title});setMeta('meta[name="twitter:description"]',{name:'twitter:description',content:seo.description});setMeta('meta[name="twitter:image"]',{name:'twitter:image',content:seo.image});setLink('canonical',seo.canonical);
    const id='tf60-structured-data';let script=document.getElementById(id) as HTMLScriptElement|null;if(!script){script=document.createElement('script');script.id=id;script.type='application/ld+json';document.head.appendChild(script)}
    const logo=/^https?:\/\//i.test(storeProfile.logoImage)?storeProfile.logoImage:`${seo.site}${storeProfile.logoImage||'/luxury-timeforge-logo.svg'}`;
    const organization={'@type':'Organization','@id':`${seo.site}/#organization`,name:seo.storeName,url:seo.site,logo,email:storeProfile.storeEmail||undefined,telephone:storeProfile.storePhone||undefined,address:storeProfile.storeAddress||undefined};
    const website={'@type':'WebSite','@id':`${seo.site}/#website`,url:seo.site,name:seo.storeName,alternateName:'TimeForge',inLanguage:'vi-VN',publisher:{'@id':`${seo.site}/#organization`}};
    const crumbs=[{name:'Trang chủ',url:seo.site}];if(seo.path!=='/'){if(seo.product)crumbs.push({name:'Đồng hồ',url:`${seo.site}/collections`});crumbs.push({name:seo.product?.title||seo.collection?.title||pageSeo[seo.path]?.title||seo.title,url:seo.canonical})}
    const breadcrumb={'@type':'BreadcrumbList','@id':`${seo.canonical}#breadcrumb`,itemListElement:crumbs.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.name,item:item.url}))};
    const pageEntity=seo.product?{'@type':'Product','@id':`${seo.canonical}#product`,name:seo.product.title,url:seo.canonical,image:seo.product.images.filter(Boolean),description:seo.description,sku:seo.product.sku,brand:{'@type':'Brand',name:seo.product.vendor||seo.storeName},offers:{'@type':'Offer',url:seo.canonical,priceCurrency:'VND',price:seo.product.price,availability:seo.product.inventory>0?'https://schema.org/InStock':'https://schema.org/OutOfStock',itemCondition:'https://schema.org/NewCondition',seller:{'@id':`${seo.site}/#organization`}}}:seo.collection?{'@type':'CollectionPage','@id':`${seo.canonical}#webpage`,url:seo.canonical,name:seo.title,description:seo.description,isPartOf:{'@id':`${seo.site}/#website`}}:{'@type':'WebPage','@id':`${seo.canonical}#webpage`,url:seo.canonical,name:seo.title,description:seo.description,inLanguage:'vi-VN',isPartOf:{'@id':`${seo.site}/#website`},breadcrumb:{'@id':`${seo.canonical}#breadcrumb`}};
    script.textContent=JSON.stringify({'@context':'https://schema.org','@graph':[organization,website,breadcrumb,pageEntity]});
  },[seo,storeProfile.logoImage,storeProfile.storeAddress,storeProfile.storeEmail,storeProfile.storePhone]);
  return null;
}
