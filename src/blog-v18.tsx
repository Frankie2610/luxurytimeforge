import './legacy.css';
import {zodResolver} from '@hookform/resolvers/zod';
import {AlignLeft, ArrowLeft, ArrowRight, CalendarDays, Code2, Edit3, ExternalLink, FileText, MoreHorizontal, Plus, Search, Trash2} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Link, Navigate, useParams} from 'react-router-dom';
import {z} from 'zod';
import {firebaseClient} from './firebase';
import {optimizedImage} from './image-utils';
import {Button, Dialog, DialogContent, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, Tabs, TabsContent, TabsList, TabsTrigger} from './ui';
import {useCommerce} from './context';

export type BlogStatus='draft'|'published';
export interface BlogPostV18 {id:string;title:string;handle:string;excerpt:string;contentHtml:string;image:string;author:string;publishedAt:string;updatedAt:string;status:BlogStatus;featured:boolean;}

const BLOG_KEY='tf.v18.blog-posts';
const now=new Date().toISOString();
const seedPosts:BlogPostV18[]=[
  {id:'blog-1',title:'Cách chọn kích thước đồng hồ cân đối với cổ tay',handle:'cach-chon-kich-thuoc-dong-ho',excerpt:'Những nguyên tắc đơn giản để lựa chọn đường kính, độ dày và kiểu dây phù hợp.',contentHtml:'<p>Kích thước đồng hồ nên được nhìn như một tổng thể gồm đường kính, khoảng cách càng, độ dày và kiểu dây.</p><h2>Đường kính chỉ là điểm bắt đầu</h2><p>Một thiết kế 40 mm có thể trông gọn hơn mẫu 38 mm nếu càng ngắn và mặt số được chia tỷ lệ tốt.</p><h2>Ưu tiên sự cân đối</h2><p>Lựa chọn phù hợp là mẫu tạo cảm giác thoải mái, không tràn quá mép cổ tay và hài hòa với phong cách sử dụng.</p>',image:'',author:'TimeForge Editorial',publishedAt:now,updatedAt:now,status:'published',featured:true},
  {id:'blog-2',title:'Quartz và Automatic: khác biệt nằm ở trải nghiệm',handle:'quartz-va-automatic',excerpt:'So sánh hai cơ chế phổ biến từ góc nhìn sử dụng hàng ngày và chăm sóc dài hạn.',contentHtml:'<p>Quartz ưu tiên độ chính xác và sự thuận tiện. Automatic mang đến trải nghiệm cơ khí, chuyển động và tính kết nối với nghệ thuật chế tác.</p><h2>Chọn theo nhịp sử dụng</h2><p>Nhu cầu đeo thường xuyên, tần suất bảo dưỡng và cảm nhận cá nhân quan trọng hơn việc xem một cơ chế luôn tốt hơn cơ chế còn lại.</p>',image:'',author:'TimeForge Editorial',publishedAt:new Date(Date.now()-86400000*9).toISOString(),updatedAt:now,status:'published',featured:false},
  {id:'blog-3',title:'Giữ đồng hồ luôn bền đẹp trong quá trình sử dụng',handle:'cham-soc-dong-ho',excerpt:'Hướng dẫn vệ sinh, bảo quản và kiểm tra định kỳ cho đồng hồ dây da, dây kim loại.',contentHtml:'<p>Tránh để đồng hồ tiếp xúc kéo dài với hóa chất, nhiệt độ cao và độ ẩm vượt quá mức chống nước được công bố.</p><h2>Bảo quản đúng cách</h2><p>Lau nhẹ sau khi sử dụng, giữ dây da khô ráo và kiểm tra gioăng định kỳ là những bước đơn giản nhưng hiệu quả.</p>',image:'',author:'TimeForge Care',publishedAt:new Date(Date.now()-86400000*18).toISOString(),updatedAt:now,status:'published',featured:false},
];

function readPosts(){try{const raw=localStorage.getItem(BLOG_KEY);return raw?JSON.parse(raw) as BlogPostV18[]:seedPosts}catch{return seedPosts}}
function slug(value:string){return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
export function useBlogPostsV18(){
  const[posts,setPosts]=useState<BlogPostV18[]>(readPosts);
  useEffect(()=>{if(!firebaseClient.enabled)return;void firebaseClient.read<BlogPostV18[]>('timeforge/blogPosts').then(remote=>{if(remote?.length){setPosts(remote);localStorage.setItem(BLOG_KEY,JSON.stringify(remote));}})},[]);
  useEffect(()=>{const sync=()=>setPosts(readPosts());window.addEventListener('timeforge:blogs-updated',sync);return()=>window.removeEventListener('timeforge:blogs-updated',sync)},[]);
  const commit=(next:BlogPostV18[])=>{setPosts(next);localStorage.setItem(BLOG_KEY,JSON.stringify(next));window.dispatchEvent(new Event('timeforge:blogs-updated'));if(firebaseClient.enabled)void firebaseClient.write('timeforge/blogPosts',next)};
  return{posts,commit};
}

const schema=z.object({title:z.string().min(4,'Nhập tiêu đề bài viết'),handle:z.string().min(3,'Nhập đường dẫn'),excerpt:z.string().min(10,'Nhập mô tả ngắn'),contentHtml:z.string().min(20,'Nhập nội dung bài viết'),image:z.string(),author:z.string().min(2),status:z.enum(['draft','published']),featured:z.boolean()});
type BlogForm=z.infer<typeof schema>;
function formatDate(value:string){return new Date(value).toLocaleDateString('vi-VN',{day:'2-digit',month:'long',year:'numeric'})}

export function BlogIndexV18(){
  const{posts}=useBlogPostsV18();
  const{products}=useCommerce();
  const published=posts.filter(item=>item.status==='published').sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
  const fallback=products.find(item=>item.images[0])?.images[0]||'';
  const featured=published.find(item=>item.featured)||published[0];
  return <div className="v18-blog-page">
    <header className="v18-blog-hero"><div><span>TIMEFORGE JOURNAL</span><h1>Kiến thức, câu chuyện và nghệ thuật của thời gian.</h1><p>Nội dung tuyển chọn về đồng hồ, phong cách, chăm sóc và trải nghiệm sở hữu.</p></div></header>
    {featured&&<section className="v18-blog-featured"><Link to={`/blogs/${featured.handle}`}><img src={optimizedImage(featured.image||fallback,1400,900)} alt={featured.title}/><div><span>BÀI VIẾT NỔI BẬT</span><time>{formatDate(featured.publishedAt)}</time><h2>{featured.title}</h2><p>{featured.excerpt}</p><b>Đọc bài viết <ArrowRight/></b></div></Link></section>}
    <section className="v18-blog-grid-wrap"><div className="v18-blog-grid">{published.filter(item=>item.id!==featured?.id).map((post,index)=><article key={post.id}><Link to={`/blogs/${post.handle}`}><img src={optimizedImage(post.image||products[(index+1)%Math.max(products.length,1)]?.images[0]||fallback,900,620)} alt={post.title}/><div><time>{formatDate(post.publishedAt)}</time><h2>{post.title}</h2><p>{post.excerpt}</p><span>Đọc thêm <ArrowRight/></span></div></Link></article>)}</div></section>
  </div>;
}

export function BlogPostPageV18(){
  const{handle}=useParams();const{posts}=useBlogPostsV18();const{products}=useCommerce();
  const post=posts.find(item=>item.handle===handle&&item.status==='published');
  if(!post)return <Navigate to="/404"/>;
  const related=posts.filter(item=>item.status==='published'&&item.id!==post.id).slice(0,3);
  const fallback=products.find(item=>item.images[0])?.images[0]||'';
  return <article className="v18-blog-detail"><Link className="v18-blog-back" to="/blogs"><ArrowLeft/>Tạp chí TimeForge</Link><header><span>TIMEFORGE JOURNAL</span><h1>{post.title}</h1><div><time>{formatDate(post.publishedAt)}</time><i/> <b>{post.author}</b></div><p>{post.excerpt}</p></header><figure><img src={optimizedImage(post.image||fallback,1600,1000)} alt={post.title}/></figure><div className="v18-blog-content" dangerouslySetInnerHTML={{__html:post.contentHtml}}/>{!!related.length&&<section className="v18-blog-related"><h2>Bài viết liên quan</h2><div>{related.map(item=><Link key={item.id} to={`/blogs/${item.handle}`}><span>{formatDate(item.publishedAt)}</span><b>{item.title}</b><ArrowRight/></Link>)}</div></section>}</article>;
}


function htmlToPlainText(value:string){
  return value
    .replace(/<h[1-6][^>]*>/gi,'\n')
    .replace(/<\/h[1-6]>/gi,'\n')
    .replace(/<li[^>]*>/gi,'• ')
    .replace(/<\/li>/gi,'\n')
    .replace(/<br\s*\/?>/gi,'\n')
    .replace(/<\/p>/gi,'\n\n')
    .replace(/<[^>]+>/g,'')
    .replace(/&nbsp;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;/gi,"'")
    .replace(/\n{3,}/g,'\n\n')
    .trim();
}
function escapeHtml(value:string){return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function plainTextToHtml(value:string){
  return value.split(/\n{2,}/).map(block=>block.trim()).filter(Boolean).map(block=>{
    const lines=block.split('\n').map(line=>line.trim()).filter(Boolean);
    if(lines.length&&lines.every(line=>line.startsWith('• ')))return `<ul>${lines.map(line=>`<li>${escapeHtml(line.slice(2))}</li>`).join('')}</ul>`;
    return `<p>${lines.map(escapeHtml).join('<br>')}</p>`;
  }).join('');
}
export function AdminBlogsV18(){
  const{posts,commit}=useBlogPostsV18();const[query,setQuery]=useState('');const[editing,setEditing]=useState<BlogPostV18|null>(null);const[open,setOpen]=useState(false);const[editorTab,setEditorTab]=useState<'content'|'html'>('content');const[plainContent,setPlainContent]=useState('');
  const form=useForm<BlogForm>({resolver:zodResolver(schema),defaultValues:{title:'',handle:'',excerpt:'',contentHtml:'<p></p>',image:'',author:'TimeForge Editorial',status:'draft',featured:false}});
  const filtered=useMemo(()=>posts.filter(item=>`${item.title} ${item.author} ${item.status}`.toLowerCase().includes(query.toLowerCase())),[posts,query]);
  const start=(post?:BlogPostV18)=>{const html=post?.contentHtml||'<p></p>';setEditing(post||null);setEditorTab('content');setPlainContent(htmlToPlainText(html));form.reset(post?{title:post.title,handle:post.handle,excerpt:post.excerpt,contentHtml:post.contentHtml,image:post.image,author:post.author,status:post.status,featured:post.featured}:{title:'',handle:'',excerpt:'',contentHtml:'<p></p>',image:'',author:'TimeForge Editorial',status:'draft',featured:false});setOpen(true)};
  const save=(data:BlogForm)=>{const timestamp=new Date().toISOString();const next:BlogPostV18={id:editing?.id||`blog-${Date.now()}`,title:data.title,handle:slug(data.handle||data.title),excerpt:data.excerpt,contentHtml:data.contentHtml,image:data.image,author:data.author,status:data.status,featured:data.featured,publishedAt:editing?.publishedAt||timestamp,updatedAt:timestamp};let list=editing?posts.map(item=>item.id===editing.id?next:item):[next,...posts];if(next.featured)list=list.map(item=>({...item,featured:item.id===next.id}));commit(list);setOpen(false);window.dispatchEvent(new CustomEvent('timeforge:toast',{detail:{message:'Đã lưu bài viết'}}))};
  const remove=(id:string)=>{commit(posts.filter(item=>item.id!==id));window.dispatchEvent(new CustomEvent('timeforge:toast',{detail:{message:'Đã xóa bài viết',tone:'info'}}))};
  return <div className="v18-admin-blog"><div className="v18-admin-blog-actions"><label><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Tìm tiêu đề hoặc tác giả"/></label><Button onClick={()=>start()}><Plus/>Tạo bài viết</Button></div><section className="v18-admin-blog-table"><table><thead><tr><th>Bài viết</th><th>Tác giả</th><th>Ngày xuất bản</th><th>Trạng thái</th><th/></tr></thead><tbody>{filtered.map(post=><tr key={post.id}><td><div className="v18-blog-admin-title"><span>{post.image?<img src={optimizedImage(post.image,120,90)} alt=""/>:<FileText/>}</span><div><b>{post.title}</b><small>/{post.handle}</small></div></div></td><td>{post.author}</td><td>{formatDate(post.publishedAt)}</td><td><span className={`v18-blog-status ${post.status}`}>{post.status==='published'?'Đã xuất bản':'Bản nháp'}</span></td><td><DropdownMenu><DropdownMenuTrigger asChild><Button variant="icon" aria-label="Thao tác"><MoreHorizontal/></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={()=>start(post)}><Edit3/>Chỉnh sửa</DropdownMenuItem>{post.status==='published'&&<DropdownMenuItem onSelect={()=>window.open(`/blogs/${post.handle}`,'_blank')}><ExternalLink/>Xem bài viết</DropdownMenuItem>}<DropdownMenuSeparator/><DropdownMenuItem className="danger" onSelect={()=>remove(post.id)}><Trash2/>Xóa</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>)}</tbody></table>{!filtered.length&&<div className="v18-blog-empty"><FileText/><h3>Chưa có bài viết phù hợp</h3><p>Tạo bài viết mới hoặc thay đổi từ khóa tìm kiếm.</p></div>}</section><Dialog open={open} onOpenChange={setOpen}><DialogContent className="v18-blog-editor" title={editing?'Chỉnh sửa bài viết':'Tạo bài viết'} description="Nội dung được hiển thị trong TimeForge Journal."><form onSubmit={form.handleSubmit(save)}><div className="v18-blog-editor-main"><label>Tiêu đề<input {...form.register('title')} onBlur={event=>{if(!form.getValues('handle'))form.setValue('handle',slug(event.target.value))}}/></label><label>Đường dẫn<input {...form.register('handle')}/></label><label>Mô tả ngắn<textarea rows={3} {...form.register('excerpt')}/></label><div className="v23-blog-content-editor"><div className="v23-blog-editor-label"><span>Nội dung bài viết</span><small>Chỉnh nội dung thuần hoặc mã HTML.</small></div><Tabs value={editorTab} onValueChange={(value)=>{const next=value as 'content'|'html';if(next==='content')setPlainContent(htmlToPlainText(form.getValues('contentHtml')));setEditorTab(next)}}><TabsList className="v23-blog-tabs"><TabsTrigger value="content"><AlignLeft/>Nội dung</TabsTrigger><TabsTrigger value="html"><Code2/>HTML</TabsTrigger></TabsList><TabsContent value="content"><textarea className="v23-blog-plain-editor" rows={18} value={plainContent} onChange={(event)=>{const value=event.target.value;setPlainContent(value);form.setValue('contentHtml',plainTextToHtml(value),{shouldDirty:true,shouldValidate:true})}} placeholder="Nhập nội dung bài viết, không hiển thị mã HTML..."/></TabsContent><TabsContent value="html"><textarea className="code" rows={18} {...form.register('contentHtml')} onChange={(event)=>{form.setValue('contentHtml',event.target.value,{shouldDirty:true,shouldValidate:true})}}/></TabsContent></Tabs></div></div><aside><label>Trạng thái<select {...form.register('status')}><option value="draft">Bản nháp</option><option value="published">Đã xuất bản</option></select></label><label>Tác giả<input {...form.register('author')}/></label><label>URL ảnh<input {...form.register('image')} placeholder="Cloudinary secure_url"/></label><label className="check"><input type="checkbox" {...form.register('featured')}/>Bài viết nổi bật</label><div className="v18-blog-errors">{Object.values(form.formState.errors).map((error,index)=><p key={index}>{error?.message}</p>)}</div></aside><footer><Button type="button" variant="secondary" onClick={()=>setOpen(false)}>Hủy</Button><Button type="submit">Lưu bài viết</Button></footer></form></DialogContent></Dialog></div>;
}

export function BlogCardsV18({limit=3}:{limit?:number}){const{posts}=useBlogPostsV18();const{products}=useCommerce();const list=posts.filter(item=>item.status==='published').sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,limit);const fallback=products.find(item=>item.images[0])?.images[0]||'';return <div className="v18-home-blog-grid">{list.map((post,index)=><article key={post.id}><Link to={`/blogs/${post.handle}`}><img src={optimizedImage(post.image||products[index%Math.max(products.length,1)]?.images[0]||fallback,900,620)} alt={post.title}/><div><time><CalendarDays/>{formatDate(post.publishedAt)}</time><h3>{post.title}</h3><p>{post.excerpt}</p><span>Đọc bài viết<ArrowRight/></span></div></Link></article>)}</div>}
