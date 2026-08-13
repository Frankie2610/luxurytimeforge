import {useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,ChevronRight,Compass,RotateCcw,Scale,Sparkles,Trash2} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useCommerce} from './context';
import {useCompareV57} from './compare-v57';
import {productImage,SmartImage} from './image-utils';
import {trackCommerceEvent} from './commerce-events';
import type {Product} from './types';
import {money} from './utils';
import './v570-storefront-features.css';

const productText=(product:Product)=>`${product.title} ${product.vendor} ${product.productType} ${product.category} ${product.tags.join(' ')} ${product.descriptionText} ${product.descriptionHtml.replace(/<[^>]+>/g,' ')}`.replace(/\s+/g,' ').trim();
const field=(product:Product,label:string)=>{
  const match=productText(product).match(new RegExp(`${label}\\s*:?\\s*([^|;\\n•<]+)`,'i'));
  return match?.[1]?.trim()||'—';
};
const compareRows=[
  {label:'Giá bán',read:(product:Product)=>money(product.price)},
  {label:'Thương hiệu',read:(product:Product)=>product.vendor||'—'},
  {label:'Mã SKU',read:(product:Product)=>product.sku||'—'},
  {label:'Dòng sản phẩm',read:(product:Product)=>product.productType||product.category||'—'},
  {label:'Giới tính',read:(product:Product)=>field(product,'Giới tính')},
  {label:'Chất liệu',read:(product:Product)=>field(product,'Chất liệu')},
  {label:'Màu sắc',read:(product:Product)=>field(product,'Màu sắc')},
  {label:'Kích thước',read:(product:Product)=>field(product,'(?:Size|Kích thước)')},
  {label:'Tình trạng',read:(product:Product)=>product.inventory>0?`Còn hàng (${product.inventory})`:'Tạm hết hàng'},
];

export function ComparePageV57(){
  const{ids,remove,clear}=useCompareV57();
  const{products}=useCommerce();
  const selected=useMemo(()=>ids.map(id=>products.find(product=>product.id===id)).filter((product):product is Product=>Boolean(product)),[ids,products]);
  useEffect(()=>{if(selected.length>=2)trackCommerceEvent('compare_view',{value:selected.reduce((sum,product)=>sum+product.price,0),metadata:{count:selected.length,contentIds:selected.map(product=>product.id).join(',')}})},[selected.map(product=>product.id).join('|')]);
  if(!selected.length)return <main className="tf57-feature-page tf57-empty-feature"><Scale/><small>PRODUCT COMPARE</small><h1>Chưa có sản phẩm để so sánh</h1><p>Thêm tối đa 3 mẫu từ danh sách hoặc trang chi tiết để xem điểm khác biệt rõ ràng.</p><Link to="/collections">Khám phá sản phẩm<ArrowRight/></Link></main>;
  return <main className="tf57-feature-page tf57-compare-page">
    <nav className="tf57-feature-breadcrumb"><Link to="/">Trang chủ</Link><ChevronRight/><span>So sánh sản phẩm</span></nav>
    <header className="tf57-feature-hero"><div><small>COMPARE WITH CLARITY</small><h1>Đặt các lựa chọn cạnh nhau.</h1><p>So sánh nhanh giá, thông số và tình trạng hàng trước khi quyết định.</p></div><button type="button" onClick={clear}><Trash2/>Xóa danh sách</button></header>
    <section className={`tf57-compare-grid count-${selected.length}`} aria-label="Bảng so sánh sản phẩm">
      <div className="tf57-compare-labels"><div className="tf57-compare-label-head"><Scale/><b>Tiêu chí</b></div>{compareRows.map(row=><div key={row.label}>{row.label}</div>)}</div>
      {selected.map(product=><article key={product.id}>
        <header><button type="button" onClick={()=>remove(product.id)} aria-label={`Bỏ ${product.title}`}><Trash2/></button><Link to={`/products/${product.handle}`}><SmartImage src={productImage(product)} alt={product.title} width={560} height={560}/><small>{product.vendor}</small><h2>{product.title}</h2></Link></header>
        {compareRows.map(row=><div key={row.label} data-label={row.label}>{row.read(product)}</div>)}
        <footer><Link to={`/products/${product.handle}`}>Xem chi tiết<ArrowRight/></Link></footer>
      </article>)}
      {selected.length<3&&<Link className="tf57-compare-add" to="/collections"><span>+</span><b>Thêm sản phẩm</b><small>Còn {3-selected.length} vị trí</small></Link>}
    </section>
  </main>;
}

type FinderAnswers={recipient:'all'|'men'|'women';budget:'under3'|'3to5'|'5to8'|'over8';style:'sport'|'classic'|'fashion';brand:string};
type AnswerKey=keyof FinderAnswers;
type FinderStep={key:AnswerKey;eyebrow:string;title:string;description:string;options:Array<{value:string;label:string;note:string}>};
const finderBaseSteps:FinderStep[]=[
  {key:'recipient',eyebrow:'BƯỚC 1 · NGƯỜI ĐEO',title:'Bạn đang chọn cho ai?',description:'Thông tin này giúp ưu tiên đúng kiểu dáng và kích thước.',options:[{value:'all',label:'Không giới hạn',note:'Xem cả thiết kế unisex'},{value:'men',label:'Nam',note:'Ưu tiên mẫu nam và unisex'},{value:'women',label:'Nữ',note:'Ưu tiên mẫu nữ và unisex'}]},
  {key:'budget',eyebrow:'BƯỚC 2 · NGÂN SÁCH',title:'Khoảng giá phù hợp?',description:'Chọn mức ngân sách để kết quả thực tế hơn.',options:[{value:'under3',label:'Dưới 3 triệu',note:'Dễ tiếp cận'},{value:'3to5',label:'3 – 5 triệu',note:'Cân bằng lựa chọn'},{value:'5to8',label:'5 – 8 triệu',note:'Nhiều mẫu nổi bật'},{value:'over8',label:'Trên 8 triệu',note:'Thiết kế cao cấp'}]},
  {key:'style',eyebrow:'BƯỚC 3 · PHONG CÁCH',title:'Phong cách bạn yêu thích?',description:'Kết quả sẽ được xếp hạng theo tín hiệu từ tên, mô tả và thông số.',options:[{value:'sport',label:'Thể thao',note:'Năng động, mạnh mẽ'},{value:'classic',label:'Cổ điển',note:'Tinh gọn, dễ phối'},{value:'fashion',label:'Thời trang',note:'Nổi bật, giàu điểm nhấn'}]},
];
const priceMatches=(price:number,budget:FinderAnswers['budget'])=>budget==='under3'?price<3_000_000:budget==='3to5'?price>=3_000_000&&price<=5_000_000:budget==='5to8'?price>5_000_000&&price<=8_000_000:price>8_000_000;
const finderScore=(product:Product,answers:FinderAnswers)=>{
  const text=productText(product).toLocaleLowerCase('vi');let score=0;
  if(priceMatches(product.price,answers.budget))score+=8;else score-=4;
  if(answers.brand==='all')score+=1;else if(product.vendor.toLocaleLowerCase('vi').trim()===answers.brand)score+=7;else score-=3;
  const gender=field(product,'Giới tính').toLocaleLowerCase('vi');
  if(answers.recipient==='all')score+=1;
  else if(gender.includes('unisex')||gender.includes('cả nam'))score+=4;
  else if(answers.recipient==='men'&&/nam|men|male/.test(gender))score+=6;
  else if(answers.recipient==='women'&&/nữ|women|female/.test(gender))score+=6;
  const styleWords={sport:/thể thao|sport|chronograph|silicone|năng động|adidas/,classic:/cổ điển|classic|thanh lịch|dây da|leather|tối giản/,fashion:/thời trang|fashion|đá|crystal|rose gold|vàng|guess/}[answers.style];
  if(styleWords.test(text))score+=6;
  if(product.inventory>0)score+=3;else score-=20;
  if(product.compareAtPrice>product.price)score+=1;
  return score;
};

export function WatchFinderPageV57(){
  const{products}=useCommerce();
  const[step,setStep]=useState(0);
  const[answers,setAnswers]=useState<Partial<FinderAnswers>>({});
  const finderSteps=useMemo<FinderStep[]>(()=>{
    const counts=new Map<string,{label:string;count:number}>();
    products.filter(product=>product.status==='active'&&product.published&&product.vendor.trim()).forEach(product=>{
      const value=product.vendor.toLocaleLowerCase('vi').trim();
      const current=counts.get(value)||{label:product.vendor.trim(),count:0};
      current.count+=1;counts.set(value,current);
    });
    const brandOptions=[{value:'all',label:'Tất cả thương hiệu',note:'Để hệ thống xếp hạng tự do'},...[...counts.entries()].sort((a,b)=>b[1].count-a[1].count||a[1].label.localeCompare(b[1].label,'vi')).slice(0,5).map(([value,item])=>({value,label:item.label,note:`${item.count} mẫu đang xuất bản`}))];
    return[...finderBaseSteps,{key:'brand',eyebrow:'BƯỚC 4 · THƯƠNG HIỆU',title:'Có ưu tiên thương hiệu không?',description:'Danh sách được lấy trực tiếp từ catalog đang xuất bản.',options:brandOptions}];
  },[products]);
  const complete=step>=finderSteps.length;
  const results=useMemo(()=>{
    if(!complete)return[];
    const resolved=answers as FinderAnswers;
    const active=products.filter(product=>product.status==='active'&&product.published&&product.inventory>0);
    const strict=active.filter(product=>priceMatches(product.price,resolved.budget));
    return (strict.length?strict:active).map(product=>({product,score:finderScore(product,resolved)})).sort((a,b)=>b.score-a.score||a.product.price-b.product.price).slice(0,6).map(item=>item.product);
  },[answers,complete,products]);
  useEffect(()=>{if(complete)trackCommerceEvent('watch_finder_completed',{metadata:{recipient:answers.recipient||'',budget:answers.budget||'',style:answers.style||'',brand:answers.brand||'',contentIds:results.map(product=>product.id).join(',')}})},[complete]);
  const choose=(value:string)=>{const current=finderSteps[step];setAnswers(previous=>({...previous,[current.key]:value}));setStep(index=>index+1)};
  const reset=()=>{setAnswers({});setStep(0)};
  if(complete)return <main className="tf57-feature-page tf57-finder-page is-results">
    <nav className="tf57-feature-breadcrumb"><Link to="/">Trang chủ</Link><ChevronRight/><span>Tư vấn chọn đồng hồ</span></nav>
    <header className="tf57-feature-hero"><div><small>CURATED FOR YOU</small><h1>Những lựa chọn hợp gu nhất.</h1><p>Kết quả được xếp hạng từ ngân sách, phong cách, người đeo và thương hiệu bạn đã chọn.</p></div><button type="button" onClick={reset}><RotateCcw/>Làm lại</button></header>
    <section className="tf57-finder-summary">{finderSteps.map(item=><span key={item.key}><small>{item.title}</small><b>{item.options.find(option=>option.value===answers[item.key])?.label}</b></span>)}</section>
    {results.length?<section className="tf57-finder-results">{results.map((product,index)=><article key={product.id}><span className="tf57-result-rank">{String(index+1).padStart(2,'0')}</span><Link to={`/products/${product.handle}`}><SmartImage src={productImage(product)} alt={product.title} width={680} height={680}/><small>{product.vendor}</small><h2>{product.title}</h2><strong>{money(product.price)}</strong><span className="tf57-result-action">Xem sản phẩm<ArrowRight/></span></Link></article>)}</section>:<section className="tf57-finder-empty"><Compass/><h2>Chưa có mẫu khớp hoàn toàn</h2><p>Thử tăng khoảng ngân sách hoặc chọn cả hai thương hiệu.</p><button onClick={reset}>Chọn lại</button></section>}
  </main>;
  const current=finderSteps[step];
  return <main className="tf57-feature-page tf57-finder-page">
    <nav className="tf57-feature-breadcrumb"><Link to="/">Trang chủ</Link><ChevronRight/><span>Tư vấn chọn đồng hồ</span></nav>
    <section className="tf57-finder-shell">
      <aside><Sparkles/><small>WATCH FINDER</small><h1>Tìm chiếc đồng hồ hợp gu trong một phút.</h1><p>4 câu hỏi ngắn, không cần đăng nhập. Kết quả lấy trực tiếp từ catalog đang có hàng.</p><div className="tf57-finder-progress"><span style={{width:`${step/finderSteps.length*100}%`}}/></div><small>{step+1}/{finderSteps.length}</small></aside>
      <div className="tf57-finder-question"><header><small>{current.eyebrow}</small><h2>{current.title}</h2><p>{current.description}</p></header><div>{current.options.map(option=><button type="button" key={option.value} onClick={()=>choose(option.value)}><span><b>{option.label}</b><small>{option.note}</small></span><Check/></button>)}</div>{step>0&&<button className="tf57-finder-back" type="button" onClick={()=>setStep(index=>index-1)}><ArrowLeft/>Quay lại</button>}</div>
    </section>
  </main>;
}
