import './v4922-journal.css';
import './v50-journal-polish.css';
import {zodResolver} from '@hookform/resolvers/zod';
import {AlignLeft, ArrowLeft, ArrowRight, BookOpen, Clock3, Code2, Edit3, ExternalLink, FileText, MoreHorizontal, Plus, Search, Sparkles, Trash2} from 'lucide-react';
import {useMemo, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Link, Navigate, useParams} from 'react-router-dom';
import {z} from 'zod';
import {optimizedImage,SmartImage} from './image-utils';
import {Button, Dialog, DialogContent, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, Tabs, TabsContent, TabsList, TabsTrigger} from './ui';
import {useCommerce} from './context';

import {formatBlogDateV18, useBlogPostsV18, type BlogPostV18} from './blog-data-v18';

function slug(value:string){return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
const schema=z.object({title:z.string().min(4,'Nhập tiêu đề bài viết'),handle:z.string().min(3,'Nhập đường dẫn'),excerpt:z.string().min(10,'Nhập mô tả ngắn'),contentHtml:z.string().min(20,'Nhập nội dung bài viết'),image:z.string(),author:z.string().min(2),status:z.enum(['draft','published']),featured:z.boolean()});
type BlogForm=z.infer<typeof schema>;
const formatDate=formatBlogDateV18;

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
    {featured&&<section className="tf4922-journal-feature"><div className="tf4922-journal-feature-media"><SmartImage src={imageFor(featured,0,1400,900)} alt={featured.title} width={1400} height={900} priority/><span>{formatDate(featured.publishedAt)}</span></div><div className="tf4922-journal-feature-copy"><span><BookOpen/>BÀI ĐỌC TUẦN NÀY</span><h2>{featured.title}</h2><p>{featured.excerpt}</p><div><span><Clock3/>5 phút đọc</span><b>{featured.author}</b></div><Link to={`/blogs/${featured.handle}`}>Đọc toàn bộ bài viết <ArrowRight/></Link></div></section>}
    <section className="tf4922-journal-archive"><header><div><span>THƯ VIỆN BIÊN TẬP</span><h2>Góc nhìn mới nhất</h2></div><p>Nội dung được biên tập để dễ đọc, hữu ích và phù hợp với hành trình lựa chọn đồng hồ.</p></header><div className="tf4922-journal-grid">{remaining.map((post,index)=><article key={post.id}><Link to={`/blogs/${post.handle}`}><SmartImage src={imageFor(post,index+1,900,650)} alt={post.title} width={900} height={650}/><div className="tf4922-journal-card-copy"><div><time>{formatDate(post.publishedAt)}</time><span>TIMEFORGE</span></div><h3>{post.title}</h3><p>{post.excerpt}</p><b>Đọc bài viết <ArrowRight/></b></div></Link></article>)}</div>{!remaining.length&&<div className="tf4922-journal-empty"><BookOpen/><b>Đang chuẩn bị nội dung mới</b><span>Quay lại sau để đọc các bài viết tiếp theo.</span></div>}</section>
    <section className="tf4922-journal-letter"><div><span>THE LETTER</span><h2>Mỗi câu chuyện, một góc nhìn khác về thời gian.</h2><p>Theo dõi TimeForge Journal để nhận nội dung mới và tuyển chọn sản phẩm đáng chú ý.</p></div><Link to="/collections">Khám phá bộ sưu tập <ArrowRight/></Link></section>
  </main>;
}

export function BlogPostPageV18(){
  const{handle}=useParams();const{posts}=useBlogPostsV18();const{products}=useCommerce();
  const post=posts.find(item=>item.handle===handle&&item.status==='published');
  if(!post)return <Navigate to="/404"/>;
  const related=posts.filter(item=>item.status==='published'&&item.id!==post.id).slice(0,3);
  const fallback=products.find(item=>item.images[0])?.images[0]||'';
  const hero=optimizedImage(post.image||fallback,1700,1050,'fit');
  return <main className="tf4922-article-page"><div className="tf4922-article-top"><Link to="/blogs"><ArrowLeft/>TimeForge Journal</Link><span>ẤN BẢN BIÊN TẬP</span></div><article className="tf4922-article"><header><span>TIMEFORGE JOURNAL</span><h1>{post.title}</h1><p>{post.excerpt}</p><div><b>{post.author}</b><i/><time>{formatDate(post.publishedAt)}</time><i/><span>5 phút đọc</span></div></header><figure><SmartImage src={hero} alt={post.title} width={1700} height={1050} priority/><figcaption>TimeForge Editorial · Nghệ thuật và trải nghiệm sở hữu đồng hồ</figcaption></figure><div className="tf4922-article-body"><aside><span>NỘI DUNG</span><b>{post.title}</b><Link to="/collections">Khám phá đồng hồ <ArrowRight/></Link></aside><div className="tf4922-article-content" dangerouslySetInnerHTML={{__html:post.contentHtml}}/></div>{!!related.length&&<section className="tf4922-article-related"><header><span>ĐỌC TIẾP</span><h2>Bài viết liên quan</h2></header><div>{related.map((item,index)=><Link key={item.id} to={`/blogs/${item.handle}`}><SmartImage src={optimizedImage(item.image||products[index%Math.max(products.length,1)]?.images[0]||fallback,700,500,'fit')} alt={item.title} width={700} height={500}/><span>{formatDate(item.publishedAt)}</span><b>{item.title}</b><em>Đọc bài viết <ArrowRight/></em></Link>)}</div></section>}</article></main>;
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
  const published=posts.filter(item=>item.status==='published').length;
  const start=(post?:BlogPostV18)=>{const html=post?.contentHtml||'<p></p>';setEditing(post||null);setEditorTab('content');setPlainContent(htmlToPlainText(html));form.reset(post?{title:post.title,handle:post.handle,excerpt:post.excerpt,contentHtml:post.contentHtml,image:post.image,author:post.author,status:post.status,featured:post.featured}:{title:'',handle:'',excerpt:'',contentHtml:'<p></p>',image:'',author:'TimeForge Editorial',status:'draft',featured:false});setOpen(true)};
  const save=(data:BlogForm)=>{const timestamp=new Date().toISOString();const next:BlogPostV18={id:editing?.id||`blog-${Date.now()}`,title:data.title,handle:slug(data.handle||data.title),excerpt:data.excerpt,contentHtml:data.contentHtml,image:data.image,author:data.author,status:data.status,featured:data.featured,publishedAt:editing?.publishedAt||timestamp,updatedAt:timestamp};let list=editing?posts.map(item=>item.id===editing.id?next:item):[next,...posts];if(next.featured)list=list.map(item=>({...item,featured:item.id===next.id}));commit(list);setOpen(false);window.dispatchEvent(new CustomEvent('timeforge:toast',{detail:{message:'Đã lưu bài viết'}}))};
  const remove=(id:string)=>{commit(posts.filter(item=>item.id!==id));window.dispatchEvent(new CustomEvent('timeforge:toast',{detail:{message:'Đã xóa bài viết',tone:'info'}}))};
  return <div className="tf4923-admin-journal">
    <section className="tf4923-journal-overview">
      <div><span><Sparkles/>TIMEFORGE EDITORIAL</span><h2>Không gian biên tập Journal</h2><p>Quản lý bài viết, trạng thái xuất bản và nội dung dài trong một giao diện tách biệt khỏi CSS quản trị cũ.</p></div>
      <div className="tf4923-journal-metrics"><article><b>{posts.length}</b><span>Tổng bài viết</span></article><article><b>{published}</b><span>Đã xuất bản</span></article><article><b>{posts.length-published}</b><span>Bản nháp</span></article></div>
    </section>
    <section className="tf4923-journal-surface">
      <header className="tf4923-journal-toolbar"><label><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Tìm tiêu đề hoặc tác giả"/></label><Button onClick={()=>start()}><Plus/>Tạo bài viết</Button></header>
      <div className="tf4923-journal-table"><table><thead><tr><th>Bài viết</th><th>Tác giả</th><th>Ngày xuất bản</th><th>Trạng thái</th><th/></tr></thead><tbody>{filtered.map(post=><tr key={post.id}><td><div className="tf4923-blog-admin-title"><span>{post.image?<img src={optimizedImage(post.image,120,90)} alt="" loading="lazy"/>:<FileText/>}</span><div><b>{post.title}</b><small>/{post.handle}</small></div></div></td><td>{post.author}</td><td>{formatDate(post.publishedAt)}</td><td><span className={`tf4923-blog-status ${post.status}`}>{post.status==='published'?'Đã xuất bản':'Bản nháp'}</span></td><td><DropdownMenu><DropdownMenuTrigger asChild><Button variant="icon" aria-label="Thao tác"><MoreHorizontal/></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={()=>start(post)}><Edit3/>Chỉnh sửa</DropdownMenuItem>{post.status==='published'&&<DropdownMenuItem onSelect={()=>window.open(`/blogs/${post.handle}`,'_blank')}><ExternalLink/>Xem bài viết</DropdownMenuItem>}<DropdownMenuSeparator/><DropdownMenuItem className="danger" onSelect={()=>remove(post.id)}><Trash2/>Xóa</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>)}</tbody></table>{!filtered.length&&<div className="tf4923-blog-empty"><FileText/><h3>Chưa có bài viết phù hợp</h3><p>Tạo bài viết mới hoặc thay đổi từ khóa tìm kiếm.</p></div>}</div>
    </section>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="tf4923-blog-editor" title={editing?'Chỉnh sửa bài viết':'Tạo bài viết'} description="Nội dung được hiển thị trong TimeForge Journal."><form onSubmit={form.handleSubmit(save)}><div className="tf4923-blog-editor-main"><label>Tiêu đề<input {...form.register('title')} onBlur={event=>{if(!form.getValues('handle'))form.setValue('handle',slug(event.target.value))}}/></label><label>Đường dẫn<input {...form.register('handle')}/></label><label>Mô tả ngắn<textarea rows={3} {...form.register('excerpt')}/></label><div className="tf4923-blog-content-editor"><div className="tf4923-blog-editor-label"><span>Nội dung bài viết</span><small>Chỉnh nội dung thuần hoặc mã HTML.</small></div><Tabs value={editorTab} onValueChange={(value)=>{const next=value as 'content'|'html';if(next==='content')setPlainContent(htmlToPlainText(form.getValues('contentHtml')));setEditorTab(next)}}><TabsList className="tf4923-blog-tabs"><TabsTrigger value="content"><AlignLeft/>Nội dung</TabsTrigger><TabsTrigger value="html"><Code2/>HTML</TabsTrigger></TabsList><TabsContent value="content"><textarea className="tf4923-blog-plain-editor" rows={18} value={plainContent} onChange={(event)=>{const value=event.target.value;setPlainContent(value);form.setValue('contentHtml',plainTextToHtml(value),{shouldDirty:true,shouldValidate:true})}} placeholder="Nhập nội dung bài viết, không hiển thị mã HTML..."/></TabsContent><TabsContent value="html"><textarea className="tf4923-blog-html-editor" rows={18} {...form.register('contentHtml')} onChange={(event)=>{form.setValue('contentHtml',event.target.value,{shouldDirty:true,shouldValidate:true})}}/></TabsContent></Tabs></div></div><aside><label>Trạng thái<select {...form.register('status')}><option value="draft">Bản nháp</option><option value="published">Đã xuất bản</option></select></label><label>Tác giả<input {...form.register('author')}/></label><label>URL ảnh<input {...form.register('image')} placeholder="https://cdn.example.com/article.webp"/></label><label className="tf4923-blog-check"><input type="checkbox" {...form.register('featured')}/>Bài viết nổi bật</label><div className="tf4923-blog-errors">{Object.values(form.formState.errors).map((error,index)=><p key={index}>{String(error?.message||'Dữ liệu chưa hợp lệ')}</p>)}</div></aside><footer><Button type="button" variant="secondary" onClick={()=>setOpen(false)}>Hủy</Button><Button type="submit">Lưu bài viết</Button></footer></form></DialogContent></Dialog>
  </div>;
}
