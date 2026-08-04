import {useEffect, useState} from 'react';
import {firebaseClient} from './firebase';
import {asList} from './data-normalize';

export type BlogStatus='draft'|'published';
export interface BlogPostV18 {id:string;title:string;handle:string;excerpt:string;contentHtml:string;image:string;author:string;publishedAt:string;updatedAt:string;status:BlogStatus;featured:boolean;}

const BLOG_KEY='tf.v18.blog-posts';
const now=new Date().toISOString();
const seedPosts:BlogPostV18[]=[
  {id:'blog-1',title:'Cách chọn kích thước đồng hồ cân đối với cổ tay',handle:'cach-chon-kich-thuoc-dong-ho',excerpt:'Những nguyên tắc đơn giản để lựa chọn đường kính, độ dày và kiểu dây phù hợp.',contentHtml:'<p>Kích thước đồng hồ nên được nhìn như một tổng thể gồm đường kính, khoảng cách càng, độ dày và kiểu dây.</p><h2>Đường kính chỉ là điểm bắt đầu</h2><p>Một thiết kế 40 mm có thể trông gọn hơn mẫu 38 mm nếu càng ngắn và mặt số được chia tỷ lệ tốt.</p><h2>Ưu tiên sự cân đối</h2><p>Lựa chọn phù hợp là mẫu tạo cảm giác thoải mái, không tràn quá mép cổ tay và hài hòa với phong cách sử dụng.</p>',image:'',author:'TimeForge Editorial',publishedAt:now,updatedAt:now,status:'published',featured:true},
  {id:'blog-2',title:'Quartz và Automatic: khác biệt nằm ở trải nghiệm',handle:'quartz-va-automatic',excerpt:'So sánh hai cơ chế phổ biến từ góc nhìn sử dụng hàng ngày và chăm sóc dài hạn.',contentHtml:'<p>Quartz ưu tiên độ chính xác và sự thuận tiện. Automatic mang đến trải nghiệm cơ khí, chuyển động và tính kết nối với nghệ thuật chế tác.</p><h2>Chọn theo nhịp sử dụng</h2><p>Nhu cầu đeo thường xuyên, tần suất bảo dưỡng và cảm nhận cá nhân quan trọng hơn việc xem một cơ chế luôn tốt hơn cơ chế còn lại.</p>',image:'',author:'TimeForge Editorial',publishedAt:new Date(Date.now()-86400000*9).toISOString(),updatedAt:now,status:'published',featured:false},
  {id:'blog-3',title:'Giữ đồng hồ luôn bền đẹp trong quá trình sử dụng',handle:'cham-soc-dong-ho',excerpt:'Hướng dẫn vệ sinh, bảo quản và kiểm tra định kỳ cho đồng hồ dây da, dây kim loại.',contentHtml:'<p>Tránh để đồng hồ tiếp xúc kéo dài với hóa chất, nhiệt độ cao và độ ẩm vượt quá mức chống nước được công bố.</p><h2>Bảo quản đúng cách</h2><p>Lau nhẹ sau khi sử dụng, giữ dây da khô ráo và kiểm tra gioăng định kỳ là những bước đơn giản nhưng hiệu quả.</p>',image:'',author:'TimeForge Care',publishedAt:new Date(Date.now()-86400000*18).toISOString(),updatedAt:now,status:'published',featured:false},
];

function normalizePosts(value:unknown){return asList<BlogPostV18>(value)}
function readPosts(){try{const raw=localStorage.getItem(BLOG_KEY);return raw?normalizePosts(JSON.parse(raw)):seedPosts}catch{return seedPosts}}

export function useBlogPostsV18(){
  const[posts,setPosts]=useState<BlogPostV18[]>(readPosts);
  useEffect(()=>{if(!firebaseClient.enabled)return;void firebaseClient.read<BlogPostV18[]|Record<string,BlogPostV18>>('timeforge/blogPosts').then(remote=>{const normalized=normalizePosts(remote);if(normalized.length){setPosts(normalized);localStorage.setItem(BLOG_KEY,JSON.stringify(normalized));}})},[]);
  useEffect(()=>{const sync=()=>setPosts(readPosts());window.addEventListener('timeforge:blogs-updated',sync);return()=>window.removeEventListener('timeforge:blogs-updated',sync)},[]);
  const commit=(next:BlogPostV18[])=>{setPosts(next);localStorage.setItem(BLOG_KEY,JSON.stringify(next));window.dispatchEvent(new Event('timeforge:blogs-updated'));if(firebaseClient.enabled)void firebaseClient.write('timeforge/blogPosts',next)};
  return{posts,commit};
}

export function formatBlogDateV18(value:string){return new Date(value).toLocaleDateString('vi-VN',{day:'2-digit',month:'long',year:'numeric'})}
