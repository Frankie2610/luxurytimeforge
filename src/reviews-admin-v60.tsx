import './v600-reviews-admin.css';
import {useMemo,useState,type ChangeEvent} from 'react';
import {Camera,CheckCircle2,ImagePlus,MessageSquareQuote,Pencil,Plus,Save,Star,Trash2,X} from 'lucide-react';
import {toast} from 'sonner';
import {useCommerce} from './context';
import {cloudinaryUploadConfigured,uploadCloudinaryImage} from './cloudinary-upload';
import type {StoreReview} from './types';
import {uid} from './utils';

const blankReview=():StoreReview=>({
  id:'',customerName:'',title:'',text:'',image:'',rating:5,source:'Khách hàng TimeForge',status:'published',featured:true,sortOrder:0,reviewType:'store',productId:'',
  createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
});

export function ReviewsAdminV60(){
  const{reviews,products,saveReview,deleteReview}=useCommerce();
  const[editing,setEditing]=useState<StoreReview|null>(null);
  const[uploading,setUploading]=useState(false);
  const[saving,setSaving]=useState(false);
  const sorted=useMemo(()=>[...reviews].sort((a,b)=>Number(b.featured)-Number(a.featured)||a.sortOrder-b.sortOrder||new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()),[reviews]);
  const publishedCount=reviews.filter(item=>item.status==='published').length;
  const imageCount=reviews.filter(item=>Boolean(item.image)).length;
  const productReviewCount=reviews.filter(item=>item.reviewType==='product'&&item.productId).length;
  const productById=useMemo(()=>new Map(products.map(item=>[item.id,item])),[products]);

  const startNew=()=>setEditing({...blankReview(),sortOrder:reviews.length});
  const patch=<K extends keyof StoreReview>(key:K,value:StoreReview[K])=>setEditing(current=>current?{...current,[key]:value}:current);
  const save=async()=>{
    if(!editing||saving)return;
    if(!editing.customerName.trim())return toast.error('Nhập tên khách hàng hoặc tên hiển thị.');
    if(!editing.text.trim()&&!editing.image.trim())return toast.error('Review cần có nội dung text hoặc hình ảnh.');
    if(editing.reviewType==='product'&&!editing.productId)return toast.error('Chọn sản phẩm cho review sản phẩm.');
    const now=new Date().toISOString();
    const next={...editing,id:editing.id||uid('review'),customerName:editing.customerName.trim(),title:editing.title.trim(),text:editing.text.trim(),image:editing.image.trim(),source:editing.source.trim()||'Khách hàng TimeForge',rating:Math.min(5,Math.max(1,Number(editing.rating)||5)),sortOrder:Number.isFinite(Number(editing.sortOrder))?Number(editing.sortOrder):0,createdAt:editing.id?editing.createdAt:now,updatedAt:now};
    try{
      setSaving(true);
      await saveReview(next);
      setEditing(null);
      toast.success(editing.id?'Đã cập nhật review.':'Đã thêm review mới.');
    }catch(error){toast.error(error instanceof Error?error.message:'Không thể lưu review lên Firebase.')}finally{setSaving(false)}
  };
  const remove=(item:StoreReview)=>{
    if(!window.confirm(`Xóa review của ${item.customerName}?`))return;
    deleteReview(item.id);toast.success('Đã xóa review.');
  };
  const upload=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    try{setUploading(true);const result=await uploadCloudinaryImage(file,'reviews');patch('image',result.url);toast.success('Đã tải ảnh review lên Cloudinary.')}catch(error){toast.error(error instanceof Error?error.message:'Không thể tải ảnh.')}finally{setUploading(false)}
  };

  return <div className="tf60-reviews-admin">
    <section className="tf60-review-hero">
      <div><small>SOCIAL PROOF</small><h2>Review & testimonial</h2><p>Review cửa hàng hiển thị ở khu “Trải nghiệm từ khách hàng”; review sản phẩm được gắn đúng SKU và hiển thị ngay trên trang sản phẩm tương ứng.</p></div>
      <button type="button" onClick={startNew}><Plus/>Thêm review</button>
    </section>

    <section className="tf60-review-stats" aria-label="Tổng quan review">
      <article><MessageSquareQuote/><span><b>{reviews.length}</b><small>Tổng review</small></span></article>
      <article><CheckCircle2/><span><b>{publishedCount}</b><small>Đang hiển thị</small></span></article>
      <article><Camera/><span><b>{imageCount}</b><small>Có hình ảnh</small></span></article>
      <article><Star/><span><b>{productReviewCount}</b><small>Review sản phẩm</small></span></article>
    </section>

    <section className="tf60-review-list">
      <header><div><h3>Nội dung đang quản lý</h3><p>Review “Xuất bản” mới ra storefront. Review sản phẩm phải chọn đúng sản phẩm; đánh dấu “Nổi bật” để ưu tiên thứ tự hiển thị.</p></div><span>{publishedCount} đang hiển thị</span></header>
      {sorted.length?<div className="tf60-review-grid">{sorted.map(item=><article key={item.id} className={item.status==='draft'?'is-draft':''}>
        {item.image?<div className="tf60-review-media"><img src={item.image} alt={`Review của ${item.customerName}`} loading="lazy" decoding="async"/></div>:<div className="tf60-review-quote"><MessageSquareQuote/></div>}
        <div className="tf60-review-card-copy">
          <div className="tf60-review-badges"><span className={item.status==='published'?'is-live':''}>{item.status==='published'?'Đang hiển thị':'Bản nháp'}</span>{item.reviewType==='product'&&<span>Sản phẩm · {productById.get(item.productId||'')?.sku||'chưa gắn'}</span>}{item.featured&&<span>Nổi bật</span>}</div>
          <div className="tf60-review-stars" aria-label={`${item.rating}/5 sao`}>{Array.from({length:5},(_,index)=><Star key={index} fill={index<item.rating?'currentColor':'none'}/>)}</div>
          {item.title&&<h4>{item.title}</h4>}{item.text&&<p>“{item.text}”</p>}
          <footer><span><b>{item.customerName}</b><small>{item.source||'Khách hàng TimeForge'}</small></span><div><button type="button" onClick={()=>setEditing({...item})} aria-label="Chỉnh sửa review"><Pencil/></button><button type="button" className="danger" onClick={()=>remove(item)} aria-label="Xóa review"><Trash2/></button></div></footer>
        </div>
      </article>)}</div>:<div className="tf60-review-empty"><MessageSquareQuote/><h3>Chưa có review riêng</h3><p>Storefront vẫn dùng testimonial mẫu trong Theme. Khi thêm review tại đây, dữ liệu mới sẽ tự thay phần mẫu.</p><button type="button" onClick={startNew}><Plus/>Thêm review đầu tiên</button></div>}
    </section>

    {editing&&<div className="tf60-review-overlay" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setEditing(null)}}><section className="tf60-review-editor" role="dialog" aria-modal="true" aria-label={editing.id?'Chỉnh sửa review':'Thêm review'}>
      <header><div><small>TESTIMONIAL EDITOR</small><h3>{editing.id?'Chỉnh sửa review':'Thêm review mới'}</h3></div><button type="button" onClick={()=>setEditing(null)} aria-label="Đóng"><X/></button></header>
      <div className="tf60-review-form">
        <label><span>Tên khách hàng / tên hiển thị</span><input value={editing.customerName} onChange={event=>patch('customerName',event.target.value)} placeholder="Ví dụ: Minh Anh · TP.HCM"/></label>
        <label><span>Tiêu đề ngắn</span><input value={editing.title} onChange={event=>patch('title',event.target.value)} placeholder="Ví dụ: Tư vấn rất có tâm"/></label>
        <label className="full"><span>Nội dung review</span><textarea rows={5} value={editing.text} onChange={event=>patch('text',event.target.value)} placeholder="Có thể để trống nếu review chỉ là ảnh chụp tin nhắn."/></label>
        <div className="tf60-review-field full"><span>Ảnh review</span><div className="tf60-review-image-field"><input aria-label="URL ảnh review" value={editing.image} onChange={event=>patch('image',event.target.value)} placeholder="https://res.cloudinary.com/..."/><label className={`tf60-review-upload ${uploading?'is-busy':''}`}><ImagePlus/>{uploading?'Đang tải...':'Tải ảnh'}<input type="file" accept="image/*" onChange={upload} disabled={uploading||!cloudinaryUploadConfigured}/></label></div><small>{cloudinaryUploadConfigured?'Hỗ trợ ảnh chụp Messenger/Zalo hoặc ảnh khách gửi.':'Cloudinary chưa cấu hình; vẫn có thể dán URL ảnh trực tiếp.'}</small></div>
        {editing.image&&<div className="tf60-review-image-preview full"><img src={editing.image} alt="Xem trước review"/></div>}
        <label><span>Loại review</span><select value={editing.reviewType||'store'} onChange={event=>{const value=event.target.value as 'store'|'product';patch('reviewType',value);if(value==='store')patch('productId','')}}><option value="store">Review cửa hàng</option><option value="product">Review sản phẩm</option></select></label>
        {editing.reviewType==='product'&&<label><span>Sản phẩm</span><select value={editing.productId||''} onChange={event=>patch('productId',event.target.value)}><option value="">Chọn sản phẩm...</option>{products.filter(item=>item.status==='active').sort((a,b)=>a.title.localeCompare(b.title,'vi')).map(item=><option key={item.id} value={item.id}>{item.sku} · {item.title}</option>)}</select></label>}
        <label><span>Nguồn / ghi chú</span><input value={editing.source} onChange={event=>patch('source',event.target.value)} placeholder="Khách hàng TimeForge"/></label>
        <label><span>Số sao</span><select value={editing.rating} onChange={event=>patch('rating',Number(event.target.value))}>{[5,4,3,2,1].map(value=><option key={value} value={value}>{value} sao</option>)}</select></label>
        <label><span>Trạng thái</span><select value={editing.status} onChange={event=>patch('status',event.target.value as StoreReview['status'])}><option value="published">Xuất bản</option><option value="draft">Bản nháp</option></select></label>
        <label><span>Thứ tự</span><input type="number" value={editing.sortOrder} onChange={event=>patch('sortOrder',Number(event.target.value))}/></label>
        <label className="tf60-review-check full"><input type="checkbox" checked={editing.featured} onChange={event=>patch('featured',event.target.checked)}/><span><b>Đánh dấu nổi bật</b><small>Review nổi bật được đưa lên đầu storefront.</small></span></label>
      </div>
      <footer><button type="button" className="secondary" onClick={()=>setEditing(null)}>Hủy</button><button type="button" className="primary" onClick={()=>void save()} disabled={saving}><Save/>{saving?'Đang lưu...':'Lưu review'}</button></footer>
    </section></div>}
  </div>;
}
