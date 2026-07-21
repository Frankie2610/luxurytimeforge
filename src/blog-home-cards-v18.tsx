import {ArrowRight, CalendarDays} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useCommerce} from './context';
import {formatBlogDateV18, useBlogPostsV18} from './blog-data-v18';
import {optimizedImage} from './image-utils';

export function BlogCardsV18({limit=3}:{limit?:number}){
  const{posts}=useBlogPostsV18();
  const{products}=useCommerce();
  const list=posts.filter(item=>item.status==='published').sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,limit);
  const fallback=products.find(item=>item.images[0])?.images[0]||'';
  return <div className="v18-home-blog-grid">{list.map((post,index)=><article key={post.id}><Link to={`/blogs/${post.handle}`}><img src={optimizedImage(post.image||products[index%Math.max(products.length,1)]?.images[0]||fallback,900,620)} alt={post.title}/><div><time><CalendarDays/>{formatBlogDateV18(post.publishedAt)}</time><h3>{post.title}</h3><p>{post.excerpt}</p><span>Đọc bài viết<ArrowRight/></span></div></Link></article>)}</div>;
}
