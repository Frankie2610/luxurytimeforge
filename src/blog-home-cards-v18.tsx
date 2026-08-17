import {ArrowRight, CalendarDays} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useProductCatalog} from './context';
import {formatBlogDateV18, useBlogPostsV18} from './blog-data-v18';
import {optimizedImage,SmartImage} from './image-utils';

export function BlogCardsV18({limit=3}:{limit?:number}){
  const{posts}=useBlogPostsV18();
  const{products}=useProductCatalog();
  const list=posts.filter(item=>item.status==='published').sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,limit);
  const fallback=products.find(item=>item.images[0])?.images[0]||'';
  return <div className="v18-home-blog-grid">{list.map((post,index)=><article key={post.id}><Link to={`/blogs/${post.handle}`}><SmartImage src={optimizedImage(post.image||products[index%Math.max(products.length,1)]?.images[0]||fallback,900,620)} alt={post.title} width={900} height={620} sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"/><div><time><CalendarDays/>{formatBlogDateV18(post.publishedAt)}</time><h3>{post.title}</h3><p>{post.excerpt}</p><span>Đọc bài viết<ArrowRight/></span></div></Link></article>)}</div>;
}
