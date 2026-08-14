import './v4922-journal.css';
import './v50-journal-polish.css';
import './v522-ui-refinement.css';
import './v573-journal-polish.css';
import './v575-journal-polish.css';
import './v576-journal-readability.css';
import './v580-journal-polish.css';
import {ArrowLeft, ArrowRight, BookOpen, Clock3, ListTree, Sparkles} from 'lucide-react';
import {useEffect, useMemo, useRef} from 'react';
import {Link, Navigate, useParams} from 'react-router-dom';
import {optimizedImage,SmartImage} from './image-utils';
import {useCommerce} from './context';

import {formatBlogDateV18, useBlogPostsV18, type BlogPostV18} from './blog-data-v18';

function slug(value:string){return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
const formatDate=formatBlogDateV18;

type ArticleHeadingV573={id:string;label:string;level:2|3};
function prepareArticleV573(value:string){
  const fallback={html:value,headings:[] as ArticleHeadingV573[],minutes:1};
  if(typeof document==='undefined')return fallback;
  const root=document.createElement('div');
  root.innerHTML=value;
  const used=new Map<string,number>();
  const headings=[...root.querySelectorAll<HTMLHeadingElement>('h2,h3')].map((heading,index)=>{
    const label=(heading.textContent||'').replace(/\s+/g,' ').trim()||`Phần ${index+1}`;
    const base=slug(label)||`phan-${index+1}`;
    const count=used.get(base)||0;
    used.set(base,count+1);
    const id=count?`${base}-${count+1}`:base;
    heading.id=id;
    return{id,label,level:Number(heading.tagName.slice(1)) as 2|3};
  });
  const words=(root.textContent||'').trim().split(/\s+/).filter(Boolean).length;
  return{html:root.innerHTML,headings,minutes:Math.max(1,Math.ceil(words/220))};
}

export function BlogIndexV18(){
  const{posts}=useBlogPostsV18();
  const{products}=useCommerce();
  const published=posts.filter(item=>item.status==='published').sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
  const fallback=products.find(item=>item.images[0])?.images[0]||'';
  const featured=published.find(item=>item.featured)||published[0];
  const remaining=published.filter(item=>item.id!==featured?.id);
  const imageFor=(post:BlogPostV18|undefined,index:number,width:number,height:number)=>optimizedImage(post?.image||products[index%Math.max(products.length,1)]?.images[0]||fallback,width,height,'fit');
  return <main className="tf4922-journal-page">
    <section className="tf4922-journal-hero">
      <div className="tf4922-journal-hero-inner">
        <div className="tf4922-journal-hero-copy"><span><Sparkles/>TIMEFORGE JOURNAL</span><h1>Những câu chuyện làm nên <em>nghệ thuật của thời gian.</em></h1><p>Góc nhìn tuyển chọn về thiết kế, kỹ nghệ, phong cách và trải nghiệm sở hữu đồng hồ.</p><div className="tf4922-journal-hero-meta"><b>Ấn bản tuyển chọn</b><i/><span>{published.length} bài viết</span></div></div>
        {featured&&<Link className="tf4922-journal-cover" to={`/blogs/${featured.handle}`}><SmartImage src={imageFor(featured,0,1100,920)} alt={featured.title} width={1100} height={920} priority/><span className="tf4922-cover-shade"/><div><small>BÀI VIẾT NỔI BẬT</small><h2>{featured.title}</h2><span>Khám phá bài viết <ArrowRight/></span></div></Link>}
      </div>
    </section>
    <nav className="tf4922-journal-categories" aria-label="Chủ đề TimeForge Journal"><div><button className="is-active" aria-current="page">Khám phá</button><button>Kiến thức</button><button>Phong cách</button><button>Chăm sóc</button><button>Câu chuyện thương hiệu</button></div></nav>
    {featured&&<section className="tf4922-journal-feature"><div className="tf4922-journal-feature-media"><SmartImage src={imageFor(featured,0,1200,760)} alt={featured.title} width={1200} height={760}/><span>{formatDate(featured.publishedAt)}</span></div><div className="tf4922-journal-feature-copy"><span><BookOpen/>BÀI ĐỌC TUẦN NÀY</span><h2>{featured.title}</h2><p>{featured.excerpt}</p><div><span><Clock3/>5 phút đọc</span><b>{featured.author}</b></div><Link to={`/blogs/${featured.handle}`}>Đọc toàn bộ bài viết <ArrowRight/></Link></div></section>}
    <section className="tf4922-journal-archive"><header><div><span>THƯ VIỆN BIÊN TẬP</span><h2>Góc nhìn mới nhất</h2></div><p>Nội dung được biên tập để dễ đọc, hữu ích và phù hợp với hành trình lựa chọn đồng hồ.</p></header><div className="tf4922-journal-grid">{remaining.map((post,index)=><article key={post.id}><Link to={`/blogs/${post.handle}`}><SmartImage src={imageFor(post,index+1,900,650)} alt={post.title} width={900} height={650}/><div className="tf4922-journal-card-copy"><div><time>{formatDate(post.publishedAt)}</time><span>TIMEFORGE</span></div><h3>{post.title}</h3><p>{post.excerpt}</p><b>Đọc bài viết <ArrowRight/></b></div></Link></article>)}</div>{!remaining.length&&<div className="tf4922-journal-empty"><BookOpen/><b>Đang chuẩn bị nội dung mới</b><span>Quay lại sau để đọc các bài viết tiếp theo.</span></div>}</section>
    <section className="tf4922-journal-letter"><div><span>THE LETTER</span><h2>Mỗi câu chuyện, một góc nhìn khác về thời gian.</h2><p>Theo dõi TimeForge Journal để nhận nội dung mới và tuyển chọn sản phẩm đáng chú ý.</p></div><Link to="/collections">Khám phá bộ sưu tập <ArrowRight/></Link></section>
  </main>;
}

export function BlogPostPageV18(){
  const{handle}=useParams();const{posts}=useBlogPostsV18();const{products}=useCommerce();
  const post=posts.find(item=>item.handle===handle&&item.status==='published');
  const article=useMemo(()=>prepareArticleV573(post?.contentHtml||''),[post?.contentHtml]);
  const articleRef=useRef<HTMLElement|null>(null);
  const progressRef=useRef<HTMLElement|null>(null);
  useEffect(()=>{
    const node=articleRef.current;
    if(!node)return;
    let frame=0;
    const update=()=>{
      frame=0;
      const rect=node.getBoundingClientRect();
      const scrollable=Math.max(1,node.offsetHeight-window.innerHeight*.72);
      const passed=Math.min(scrollable,Math.max(0,-rect.top+window.innerHeight*.18));
      progressRef.current?.style.setProperty('--tf573-reading-progress',`${passed/scrollable*100}%`);
    };
    const schedule=()=>{if(!frame)frame=window.requestAnimationFrame(update)};
    update();
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
    return()=>{window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);if(frame)window.cancelAnimationFrame(frame)};
  },[post?.id]);
  if(!post)return <Navigate to="/404"/>;
  const related=posts.filter(item=>item.status==='published'&&item.id!==post.id).slice(0,3);
  const fallback=products.find(item=>item.images[0])?.images[0]||'';
  const hero=optimizedImage(post.image||fallback,1700,1050,'fit');
  return <main className="tf4922-article-page"><i ref={progressRef} className="tf573-reading-progress" aria-hidden="true"/><div className="tf4922-article-top"><Link to="/blogs"><ArrowLeft/>TimeForge Journal</Link><span>ẤN BẢN BIÊN TẬP</span></div><article ref={articleRef} className="tf4922-article tf573-article-reading"><header><span>TIMEFORGE JOURNAL</span><h1>{post.title}</h1><p>{post.excerpt}</p><div><b>{post.author}</b><i/><time>{formatDate(post.publishedAt)}</time><i/><span><Clock3/>{article.minutes} phút đọc</span></div></header><figure><SmartImage src={hero} alt={post.title} width={1700} height={1050} priority/><figcaption>TimeForge Editorial · Nghệ thuật và trải nghiệm sở hữu đồng hồ</figcaption></figure><div className="tf4922-article-body tf573-article-body"><aside className="tf573-reading-tools"><div><BookOpen/><span><small>BÀI ĐỌC</small><b>{article.minutes} phút</b></span></div>{article.headings.length?<nav aria-label="Mục lục bài viết"><span><ListTree/>Trong bài</span>{article.headings.map(item=><a key={item.id} className={item.level===3?'is-sub':''} href={`#${item.id}`}>{item.label}</a>)}</nav>:<p>Nội dung được trình bày liền mạch để đọc nhanh trên mọi thiết bị.</p>}<Link to="/collections">Khám phá đồng hồ <ArrowRight/></Link></aside><div className="tf4922-article-content" dangerouslySetInnerHTML={{__html:article.html}}/></div>{!!related.length&&<section className="tf4922-article-related"><header><span>ĐỌC TIẾP</span><h2>Bài viết liên quan</h2></header><div>{related.map((item,index)=><Link key={item.id} to={`/blogs/${item.handle}`}><SmartImage src={optimizedImage(item.image||products[index%Math.max(products.length,1)]?.images[0]||fallback,700,500,'fit')} alt={item.title} width={700} height={500}/><span>{formatDate(item.publishedAt)}</span><b>{item.title}</b><em>Đọc bài viết <ArrowRight/></em></Link>)}</div></section>}</article></main>;
}
