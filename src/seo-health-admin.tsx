import {useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {AlertCircle,ArrowUpRight,CheckCircle2,ImageOff,Search,ShieldCheck,Tag,TextSearch} from 'lucide-react';
import {useCommerce} from './context';
import type {Product} from './types';
import './seo-health-admin.css';

type Issue='no-image'|'no-description'|'no-seo-title'|'no-seo-description'|'duplicate-handle';
const issueLabels:Record<Issue,string>={
  'no-image':'Thiếu ảnh sản phẩm',
  'no-description':'Thiếu nội dung mô tả',
  'no-seo-title':'Thiếu SEO title',
  'no-seo-description':'Thiếu meta description',
  'duplicate-handle':'Trùng URL sản phẩm'
};
export function SeoHealthAdmin(){
  const {products,isLoading}=useCommerce();
  const [filter,setFilter]=useState<Issue|'all'>('all');
  const [query,setQuery]=useState('');
  const {active,counts,results,health}=useMemo(()=>{
    const active=products.filter(p=>p.status==='active'&&p.published);
    const counts=Object.fromEntries(Object.keys(issueLabels).map(key=>[key,0])) as Record<Issue,number>;
    const seen=new Map<string,number>();
    active.forEach(p=>{seen.set(p.handle,(seen.get(p.handle)||0)+1)});
    const results=active.map(product=>{
      const issues:Issue[]=[];
      if(!product.images?.some(Boolean))issues.push('no-image');
      if(!(product.descriptionText||product.descriptionHtml||'').replace(/<[^>]+>/g,'').trim())issues.push('no-description');
      if(!(product.seoTitle||'').trim())issues.push('no-seo-title');
      if(!(product.seoDescription||'').trim())issues.push('no-seo-description');
      if((seen.get(product.handle)||0)>1)issues.push('duplicate-handle');
      issues.forEach(issue=>counts[issue]++);
      return {product,issues};
    });
    const health=results.filter(x=>!x.issues.length).length;
    return {active,counts,results,health};
  },[products]);
  const shown=useMemo(()=>results.filter(x=>x.issues.length&&(filter==='all'||x.issues.includes(filter))&&(`${x.product.title} ${x.product.sku} ${x.product.vendor}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')))).slice(0,150),[results,filter,query]);
  const riskCount=results.length-health;
  const selectors=Object.entries(issueLabels) as [Issue,string][];
  return <div className="tf-seo-health">
    <div className="tf-seo-intro"><div><span><ShieldCheck size={17}/> SEO HEALTH CENTER</span><h2>Chất lượng hiển thị tìm kiếm</h2><p>Phát hiện nội dung cần bổ sung trước khi Google lập chỉ mục. Chỉ tính sản phẩm đang xuất bản. Kiểm tra tự động tại đây không thay thế Google Search Console.</p></div><a href="/sitemap.xml" target="_blank" rel="noreferrer">Mở sitemap <ArrowUpRight size={16}/></a></div>
    <div className="tf-seo-summary"><article><small>SẢN PHẨM ĐANG BÁN</small><strong>{active.length.toLocaleString('vi-VN')}</strong><span>Tổng số trang có thể tối ưu</span></article><article><small>ĐỦ THÔNG TIN CƠ BẢN</small><strong>{health.toLocaleString('vi-VN')}</strong><span>Không có lỗi trong các tiêu chí dưới đây</span></article><article className={riskCount?'is-warning':''}><small>CẦN HOÀN THIỆN</small><strong>{riskCount.toLocaleString('vi-VN')}</strong><span>{active.length?Math.round(riskCount/active.length*100):0}% catalog đang xuất bản</span></article></div>
    <div className="tf-seo-issue-grid">{selectors.map(([key,label])=><button key={key} onClick={()=>setFilter(key)} aria-pressed={filter===key} className={filter===key?'is-selected':''}><span>{key==='no-image'?<ImageOff/>:key==='duplicate-handle'?<Tag/>:key==='no-description'?<TextSearch/>:<AlertCircle/>}</span><b>{counts[key].toLocaleString('vi-VN')}</b><small>{label}</small></button>)}</div>
    <section className="tf-seo-table"><header><div><h3>Danh sách cần xử lý</h3><p>Ưu tiên ảnh, nội dung mô tả và URL duy nhất trước.</p></div><div className="tf-seo-controls"><label><Search size={17}/><input aria-label="Tìm sản phẩm cần tối ưu" placeholder="Tìm tên hoặc SKU..." value={query} onChange={e=>setQuery(e.target.value)}/></label><select aria-label="Lọc vấn đề SEO" value={filter} onChange={e=>setFilter(e.target.value as Issue|'all')}><option value="all">Tất cả vấn đề</option>{selectors.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div></header>
      <div className="tf-seo-table-scroll"><table><thead><tr><th>Sản phẩm</th><th>Thương hiệu</th><th>Điểm cần cải thiện</th><th>Thao tác</th></tr></thead><tbody>{shown.map(({product,issues})=><tr key={product.id}><td><b>{product.title}</b><small>{product.sku}</small></td><td>{product.vendor||'—'}</td><td><div className="tf-seo-tags">{issues.map(issue=><span key={issue}>{issueLabels[issue]}</span>)}</div></td><td><Link to={`/admin/products/${encodeURIComponent(product.id)}`}>Chỉnh sửa <ArrowUpRight size={14}/></Link></td></tr>)}</tbody></table></div>
      {!shown.length&&<div className="tf-seo-empty">{isLoading?'Đang tải dữ liệu sản phẩm...':<><CheckCircle2 size={22}/><b>Không tìm thấy vấn đề phù hợp</b><span>Thử chọn một bộ lọc khác hoặc kiểm tra các trang mới.</span></>}</div>}
      {results.filter(x=>x.issues.length).length>shown.length&&<p className="tf-seo-note">Hiển thị tối đa 150 sản phẩm mỗi lần để admin vẫn mượt trên mobile. Thu hẹp theo mã SKU hoặc bộ lọc để xử lý tiếp.</p>}
    </section>
  </div>;
}
