import {useEffect,useMemo,useState,type FormEvent} from 'react';
import {ArrowLeft,ArrowRight,Check,ChevronRight,Compass,ListFilter,Plus,RotateCcw,Scale,Share2,ShoppingBag,Sparkles,Trash2} from 'lucide-react';
import {Link,useSearchParams} from 'react-router-dom';
import {toast} from 'sonner';
import {useCartActions,useProductCatalog} from './context';
import {useCompareV57} from './compare-v57';
import {productImage,SmartImage} from './image-utils';
import {trackCommerceEvent} from './commerce-events';
import {extractProductSpecsV571,productSearchTextV571,type ProductSpecsV571,type ProductSpecKey} from './product-specs-v571';
import type {Product} from './types';
import {money} from './utils';
import './v570-storefront-features.css';
import './v571-storefront-polish.css';
import './v572-storefront-tools.css';
import './v573-compare-polish.css';
import './v576-compare-polish.css';
import './v670-ai-automation.css';

type CompareRow={label:string;always?:boolean;read:(product:Product,specs:ProductSpecsV571)=>string};
const spec=(key:ProductSpecKey)=>(_:Product,specs:ProductSpecsV571)=>specs[key]||'—';
const compareRows:CompareRow[]=[
  {label:'Giá bán',always:true,read:product=>money(product.price)},
  {label:'Thương hiệu',always:true,read:product=>product.vendor||'—'},
  {label:'Mã SKU',always:true,read:(product,specs)=>product.sku||specs.sku||'—'},
  {label:'Dòng sản phẩm',read:product=>product.productType||product.category||'—'},
  {label:'Giới tính',read:spec('gender')},
  {label:'Chất liệu vỏ máy',read:spec('caseMaterial')},
  {label:'Viền đồng hồ',read:spec('bezel')},
  {label:'Đường kính',read:spec('diameter')},
  {label:'Màu mặt số',read:spec('dialColor')},
  {label:'Chất liệu kính',read:spec('glass')},
  {label:'Chống nước',read:spec('waterResistance')},
  {label:'Máy',read:spec('movement')},
  {label:'Dây đeo',read:spec('strap')},
  {label:'Màu dây',read:spec('bandColor')},
  {label:'Kích thước / Size',read:spec('size')},
  {label:'Xuất xứ thương hiệu',read:spec('brandOrigin')},
  {label:'Sản xuất tại',read:spec('manufacturedOrigin')},
  {label:'Bảo hành',read:spec('warranty')},
  {label:'Tình trạng',always:true,read:product=>product.inventory>0?`Còn hàng (${product.inventory})`:'Tạm hết hàng'},
];

export function ComparePageV57(){
  const{ids,remove,clear,replace}=useCompareV57();
  const{products}=useProductCatalog();
  const{addToCart}=useCartActions();
  const[searchParams]=useSearchParams();
  const[differencesOnly,setDifferencesOnly]=useState(false);
  const sharedIds=searchParams.get('products')||'';
  const selected=useMemo(()=>ids.map(id=>products.find(product=>product.id===id)).filter((product):product is Product=>Boolean(product)),[ids,products]);
  const selectedData=useMemo(()=>selected.map(product=>({product,specs:extractProductSpecsV571(product)})),[selected]);
  const availableRows=useMemo(()=>compareRows.filter(row=>row.always||selectedData.some(item=>row.read(item.product,item.specs)!=='—')),[selectedData]);
  const rows=useMemo(()=>{
    if(!differencesOnly||selectedData.length<2)return availableRows;
    return availableRows.filter(row=>new Set(selectedData.map(item=>row.read(item.product,item.specs).trim().toLocaleLowerCase('vi'))).size>1);
  },[availableRows,differencesOnly,selectedData]);
  const tableCountClass=selected.length>=3?'count-3':selected.length===2?'count-2':'count-1';
  useEffect(()=>{
    if(!sharedIds||!products.length)return;
    const requested=[...new Set(sharedIds.split(',').map(id=>id.trim()).filter(Boolean))].slice(0,3);
    const valid=requested.filter(id=>products.some(product=>product.id===id));
    if(valid.length&&valid.join('|')!==ids.join('|'))replace(valid);
  },[ids,products,replace,sharedIds]);
  useEffect(()=>{if(selected.length<2)setDifferencesOnly(false)},[selected.length]);
  const selectedKey=selected.map(product=>product.id).join('|');
  useEffect(()=>{if(selected.length>=2)trackCommerceEvent('compare_view',{value:selected.reduce((sum,product)=>sum+product.price,0),metadata:{count:selected.length,contentIds:selected.map(product=>product.id).join(',')}})},[selectedKey]);
  const share=async()=>{
    const url=new URL('/compare',window.location.origin);url.searchParams.set('products',selected.map(product=>product.id).join(','));
    try{
      if(navigator.share){await navigator.share({title:'So sánh sản phẩm',text:'Xem bảng so sánh sản phẩm này',url:url.toString()});return}
      await navigator.clipboard.writeText(url.toString());toast.success('Đã sao chép link so sánh');
    }catch(error){if((error as DOMException)?.name!=='AbortError')window.prompt('Sao chép liên kết so sánh',url.toString())}
  };
  const add=(product:Product)=>{
    const variant=product.variants.find(item=>item.inventory>0)||product.variants[0];
    if(product.inventory<=0||!variant){toast.error('Sản phẩm đang tạm hết hàng');return}
    addToCart(product.id,variant.id,1);
    trackCommerceEvent('add_to_cart',{productId:product.id,value:variant.price||product.price,metadata:{source:'compare'}});
    toast.success(`Đã thêm ${product.title} vào giỏ`);
  };
  if(!selected.length)return <main className="tf57-feature-page tf57-empty-feature"><Scale/><small>PRODUCT COMPARE</small><h1>Chưa có sản phẩm để so sánh</h1><p>Thêm tối đa 3 mẫu từ danh sách hoặc trang chi tiết để xem điểm khác biệt rõ ràng.</p><Link to="/collections">Khám phá sản phẩm<ArrowRight/></Link></main>;
  return <main className="tf57-feature-page tf57-compare-page">
    <nav className="tf57-feature-breadcrumb"><Link to="/">Trang chủ</Link><ChevronRight/><span>So sánh sản phẩm</span></nav>
    <header className="tf57-feature-hero tf572-compare-hero"><div><small>COMPARE WITH CLARITY</small><h1>Đặt các lựa chọn cạnh nhau.</h1><p><span className="tf572-compare-copy-desktop">Mỗi thông số được bóc tách thành một hàng riêng; vuốt ngang trên tablet hoặc mobile để sản phẩm luôn nằm cạnh nhau.</span><span className="tf572-compare-copy-mobile">Vuốt ngang để xem từng tiêu chí mà không tách sản phẩm khỏi cùng một hàng.</span></p><div className="tf576-compare-pills" aria-label="Cách bảng so sánh hoạt động"><span><Scale/>Cùng một hàng</span><span><ListFilter/>Từng tiêu chí riêng</span><span><Check/>Dữ liệu trực tiếp</span></div></div><div className="tf571-compare-hero-actions"><button type="button" className="is-share" onClick={()=>void share()}><Share2/>Chia sẻ</button>{selected.length<3&&<Link className="is-add" to="/collections"><Plus/>Thêm sản phẩm</Link>}<button type="button" className="is-clear" onClick={clear}><Trash2/>Xóa</button></div></header>
    <section className="tf572-compare-toolbar" aria-label="Tùy chọn bảng so sánh">
      <div><b>{selected.length} sản phẩm</b><span>{rows.length}/{availableRows.length} tiêu chí đang hiển thị</span></div>
      <button type="button" className={differencesOnly?'is-active':''} onClick={()=>setDifferencesOnly(value=>!value)} disabled={selected.length<2} aria-pressed={differencesOnly}><ListFilter/><span>Chỉ hiện điểm khác</span><i aria-hidden="true"/></button>
    </section>
    <div className="tf571-compare-scroll" role="region" aria-label="Bảng so sánh sản phẩm" tabIndex={0}>
      <table className={`tf571-compare-table ${tableCountClass}`}>
        <thead><tr><th className="tf571-criterion"><Scale/><b>Tiêu chí</b></th>{selectedData.map(({product})=><th key={product.id} scope="col"><article className="tf571-compare-product"><button type="button" onClick={()=>remove(product.id)} aria-label={`Bỏ ${product.title}`}><Trash2/></button><Link to={`/products/${product.handle}`}><SmartImage src={productImage(product)} alt={product.title} width={520} height={520}/><small>{product.vendor}</small><h2>{product.title}</h2></Link></article></th>)}</tr></thead>
        <tbody>{rows.length?rows.map(row=><tr key={row.label}><th scope="row">{row.label}</th>{selectedData.map(({product,specs})=><td key={product.id}>{row.read(product,specs)}</td>)}</tr>):<tr className="tf572-compare-no-difference"><th scope="row">Kết quả</th><td colSpan={selected.length}>Các tiêu chí hiện có đang giống nhau.</td></tr>}</tbody>
        <tfoot><tr><th scope="row">Thao tác</th>{selectedData.map(({product})=><td key={product.id}><div className="tf571-compare-row-actions"><button type="button" onClick={()=>add(product)} disabled={product.inventory<=0}><ShoppingBag/>{product.inventory>0?'Thêm vào giỏ':'Hết hàng'}</button><Link to={`/products/${product.handle}`}>Chi tiết<ArrowRight/></Link></div></td>)}</tr></tfoot>
      </table>
    </div>
    <p className="tf571-compare-hint">Mẹo: trên màn hình nhỏ, kéo ngang bảng để giữ các sản phẩm trên cùng một hàng.</p>
  </main>;
}

type FinderAnswers={recipient:'all'|'men'|'women';budget:'under3'|'3to5'|'5to8'|'over8';style:'sport'|'classic'|'fashion';brand:string};
type AnswerKey=keyof FinderAnswers;
type FinderStep={key:AnswerKey;eyebrow:string;title:string;description:string;options:Array<{value:string;label:string;note:string}>};
type FinderIndexed={product:Product;text:string;specs:ProductSpecsV571};
const finderBaseSteps:FinderStep[]=[
  {key:'recipient',eyebrow:'BƯỚC 1 · NGƯỜI ĐEO',title:'Bạn đang chọn cho ai?',description:'Thông tin này giúp ưu tiên đúng kiểu dáng và kích thước.',options:[{value:'all',label:'Không giới hạn',note:'Xem cả thiết kế unisex'},{value:'men',label:'Nam',note:'Ưu tiên mẫu nam và unisex'},{value:'women',label:'Nữ',note:'Ưu tiên mẫu nữ và unisex'}]},
  {key:'budget',eyebrow:'BƯỚC 2 · NGÂN SÁCH',title:'Khoảng giá phù hợp?',description:'Chọn mức ngân sách để kết quả thực tế hơn.',options:[{value:'under3',label:'Dưới 3 triệu',note:'Dễ tiếp cận'},{value:'3to5',label:'3 – 5 triệu',note:'Cân bằng lựa chọn'},{value:'5to8',label:'5 – 8 triệu',note:'Nhiều mẫu nổi bật'},{value:'over8',label:'Trên 8 triệu',note:'Thiết kế cao cấp'}]},
  {key:'style',eyebrow:'BƯỚC 3 · PHONG CÁCH',title:'Phong cách bạn yêu thích?',description:'Kết quả được xếp hạng theo tín hiệu từ tên, mô tả và thông số.',options:[{value:'sport',label:'Thể thao',note:'Năng động, mạnh mẽ'},{value:'classic',label:'Cổ điển',note:'Tinh gọn, dễ phối'},{value:'fashion',label:'Thời trang',note:'Nổi bật, giàu điểm nhấn'}]},
];
const priceMatches=(price:number,budget:FinderAnswers['budget'])=>budget==='under3'?price<3_000_000:budget==='3to5'?price>=3_000_000&&price<=5_000_000:budget==='5to8'?price>5_000_000&&price<=8_000_000:price>8_000_000;
const stylePattern=(style:FinderAnswers['style'])=>({sport:/thể thao|sport|chronograph|silicone|năng động|adidas/,classic:/cổ điển|classic|thanh lịch|dây da|leather|tối giản/,fashion:/thời trang|fashion|đá|crystal|rose gold|vàng|guess/}[style]);
const genderMatches=(gender:string,recipient:FinderAnswers['recipient'])=>{
  if(recipient==='all'||gender.includes('unisex')||gender.includes('cả nam'))return true;
  const tokens=gender.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').split(/[^a-z0-9]+/).filter(Boolean);
  return recipient==='men'?['nam','men','male'].some(token=>tokens.includes(token)):['nu','women','female'].some(token=>tokens.includes(token));
};
const finderScore=(item:FinderIndexed,answers:FinderAnswers)=>{
  const{product,text,specs}=item;let score=0;
  if(priceMatches(product.price,answers.budget))score+=8;else score-=4;
  if(answers.brand==='all')score+=1;else if(product.vendor.toLocaleLowerCase('vi').trim()===answers.brand)score+=7;else score-=3;
  const gender=String(specs.gender||'').toLocaleLowerCase('vi');
  if(answers.recipient==='all')score+=1;else if(genderMatches(gender,answers.recipient))score+=gender.includes('unisex')?4:6;
  if(stylePattern(answers.style).test(text))score+=6;
  if(product.inventory>0)score+=3;else score-=20;
  if(product.compareAtPrice>product.price)score+=1;
  return score;
};
const finderReasons=(item:FinderIndexed,answers:FinderAnswers)=>{
  const reasons:string[]=[];const gender=String(item.specs.gender||'').toLocaleLowerCase('vi');
  if(priceMatches(item.product.price,answers.budget))reasons.push('Đúng ngân sách');
  if(answers.brand!=='all'&&item.product.vendor.toLocaleLowerCase('vi').trim()===answers.brand)reasons.push('Đúng thương hiệu');
  if(answers.recipient!=='all'&&genderMatches(gender,answers.recipient))reasons.push(gender.includes('unisex')?'Thiết kế unisex':`Phù hợp ${answers.recipient==='men'?'nam':'nữ'}`);
  if(stylePattern(answers.style).test(item.text))reasons.push(`Phong cách ${answers.style==='sport'?'thể thao':answers.style==='classic'?'cổ điển':'thời trang'}`);
  if(item.product.compareAtPrice>item.product.price)reasons.push('Đang có ưu đãi');
  return reasons.slice(0,3);
};


type AiFinderIntent={recipient:'all'|'men'|'women';budgetMin:number;budgetMax:number;style:'sport'|'classic'|'fashion'|'minimal'|'luxury'|'casual'|'all';brand:string;caseMin:number;caseMax:number;strap:string[];colors:string[];keywords:string[];summary:string};
type AiFinderResult=FinderIndexed&{score:number;reasons:string[]};
const foldAi=(value:string)=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLocaleLowerCase('vi').replace(/[^a-z0-9]+/g,' ').trim();
const numberFromText=(value:string)=>Number(String(value||'').replace(',','.'))||0;
const moneyMultiplier=(unit:string)=>/trieu|tr\b|m\b/i.test(foldAi(unit))?1_000_000:/nghin|ngan|k\b/i.test(foldAi(unit))?1_000:1;
const localAiIntent=(query:string,brands:string[]):AiFinderIntent=>{
  const raw=String(query||'');const text=foldAi(raw);let budgetMin=0,budgetMax=0,caseMin=0,caseMax=0;
  const range=raw.match(/(?:tu|từ)?\s*(\d+(?:[.,]\d+)?)\s*(trieu|triệu|tr|m)?\s*(?:-|–|—|den|đến|toi|tới)\s*(\d+(?:[.,]\d+)?)\s*(trieu|triệu|tr|m)/i);
  if(range){budgetMin=numberFromText(range[1])*moneyMultiplier(range[2]||range[4]||'');budgetMax=numberFromText(range[3])*moneyMultiplier(range[4]||range[2]||'')}
  else{const under=raw.match(/(?:duoi|dưới|toi da|tối đa|max)\s*(\d+(?:[.,]\d+)?)\s*(trieu|triệu|tr|m|nghin|nghìn|ngan|ngàn|k)?/i);if(under)budgetMax=numberFromText(under[1])*moneyMultiplier(under[2]||'');else{const around=raw.match(/(?:khoang|khoảng|tam|tầm)?\s*(\d+(?:[.,]\d+)?)\s*(trieu|triệu|tr|m)\b/i);if(around){const value=numberFromText(around[1])*moneyMultiplier(around[2]);budgetMin=Math.round(value*.78);budgetMax=Math.round(value*1.12)}}}
  const caseRange=raw.match(/(\d{2}(?:[.,]\d+)?)\s*(?:-|–|—|den|đến)\s*(\d{2}(?:[.,]\d+)?)\s*mm/i);if(caseRange){caseMin=numberFromText(caseRange[1]);caseMax=numberFromText(caseRange[2])}else{const caseUnder=raw.match(/(?:duoi|dưới|toi da|tối đa|max)?\s*(\d{2}(?:[.,]\d+)?)\s*mm/i);if(caseUnder){const value=numberFromText(caseUnder[1]);if(/duoi|dưới|toi da|tối đa|max/i.test(caseUnder[0]))caseMax=value;else{caseMin=Math.max(0,value-2);caseMax=value+2}}}
  const recipient=/\b(nu|women|female)\b/.test(text)?'women':/\b(nam|men|male)\b/.test(text)?'men':'all';
  const style:AiFinderIntent['style']= /the thao|sport|chronograph|nang dong/.test(text)?'sport':/toi gian|minimal/.test(text)?'minimal':/sang trong|luxury|cao cap/.test(text)?'luxury':/co dien|classic|thanh lich|van phong|cong so/.test(text)?'classic':/thoi trang|fashion|noi bat/.test(text)?'fashion':/casual|hang ngay|de deo/.test(text)?'casual':'all';
  const brand=brands.find(value=>text.includes(foldAi(value)))||'';
  const strap=[] as string[];if(/kim loai|thep|steel|stainless/.test(text))strap.push('steel');if(/day da|leather/.test(text))strap.push('leather');if(/silicone|cao su|rubber/.test(text))strap.push('silicone');if(/mesh|luoi/.test(text))strap.push('mesh');
  const colors=[] as string[];[['black',/den|black/],['silver',/bac|silver/],['gold',/vang|gold/],['rose gold',/rose gold|vang hong/],['blue',/xanh duong|blue/],['green',/xanh la|green/],['white',/trang|white/],['brown',/nau|brown/]].forEach(([value,pattern])=>{if((pattern as RegExp).test(text))colors.push(value as string)});
  const keywords=['van phong','cong so','di lam','du tiec','du lich','hang ngay','mong','nhe','chronograph','automatic','quartz'].filter(key=>text.includes(key));
  return{recipient,budgetMin,budgetMax,style,brand,caseMin,caseMax,strap,colors,keywords,summary:raw.trim().slice(0,180)};
};
const diameterNumber=(value:string)=>Number(String(value||'').replace(',','.').match(/\d+(?:\.\d+)?/)?.[0]||0);
const aiResultReasons=(item:FinderIndexed,intent:AiFinderIntent)=>{
  const reasons:string[]=[];const diameter=diameterNumber(item.specs.diameter||item.specs.size||'');const text=item.text;
  if((!intent.budgetMin||item.product.price>=intent.budgetMin)&&(!intent.budgetMax||item.product.price<=intent.budgetMax)&&(intent.budgetMin||intent.budgetMax))reasons.push('Đúng ngân sách');
  if(intent.brand&&foldAi(item.product.vendor)===foldAi(intent.brand))reasons.push(`Đúng ${item.product.vendor}`);
  if(intent.recipient!=='all'&&genderMatches(String(item.specs.gender||'').toLocaleLowerCase('vi'),intent.recipient))reasons.push(`Phù hợp ${intent.recipient==='men'?'nam':'nữ'}`);
  if(diameter&&((!intent.caseMin||diameter>=intent.caseMin)&&(!intent.caseMax||diameter<=intent.caseMax))&&(intent.caseMin||intent.caseMax))reasons.push(`${diameter} mm phù hợp`);
  if(intent.strap.length&&intent.strap.some(value=>text.includes(foldAi(value==='steel'?'thép kim loại':value==='leather'?'dây da':value==='silicone'?'silicone':value))))reasons.push('Đúng chất liệu dây');
  if(intent.style!=='all'&&stylePattern(intent.style==='minimal'||intent.style==='luxury'||intent.style==='casual'?'classic':intent.style as FinderAnswers['style']).test(text))reasons.push(`Hợp phong cách ${intent.style==='classic'?'thanh lịch':intent.style==='sport'?'thể thao':intent.style==='fashion'?'thời trang':intent.style}`);
  if(item.product.compareAtPrice>item.product.price)reasons.push('Đang có ưu đãi');
  return reasons.slice(0,3);
};
const aiFinderScore=(item:FinderIndexed,intent:AiFinderIntent)=>{
  const product=item.product;let score=0;const diameter=diameterNumber(item.specs.diameter||item.specs.size||'');const gender=String(item.specs.gender||'').toLocaleLowerCase('vi');
  if(product.inventory>0)score+=8;else score-=100;
  if(intent.budgetMin||intent.budgetMax){if((!intent.budgetMin||product.price>=intent.budgetMin)&&(!intent.budgetMax||product.price<=intent.budgetMax))score+=14;else score-=8}
  if(intent.brand)score+=foldAi(product.vendor)===foldAi(intent.brand)?12:-2;
  if(intent.recipient!=='all')score+=genderMatches(gender,intent.recipient)?9:-3;
  if(intent.caseMin||intent.caseMax){if(diameter&&(!intent.caseMin||diameter>=intent.caseMin)&&(!intent.caseMax||diameter<=intent.caseMax))score+=10;else if(diameter)score-=5}
  if(intent.strap.length)score+=intent.strap.some(value=>item.text.includes(foldAi(value==='steel'?'thép kim loại':value==='leather'?'dây da':value==='silicone'?'silicone':value)))?7:-1;
  if(intent.colors.length)score+=intent.colors.some(value=>item.text.includes(foldAi(value)))?4:0;
  if(intent.keywords.length)score+=intent.keywords.filter(value=>item.text.includes(foldAi(value))).length*2;
  if(intent.style!=='all'){const resolved=intent.style==='minimal'||intent.style==='luxury'||intent.style==='casual'?'classic':intent.style as FinderAnswers['style'];if(stylePattern(resolved).test(item.text))score+=8}
  if(product.compareAtPrice>product.price)score+=1;
  return score;
};
function AiWatchAdvisor({indexedProducts,brands}:{indexedProducts:FinderIndexed[];brands:string[]}){
  const[query,setQuery]=useState('');const[busy,setBusy]=useState(false);const[intent,setIntent]=useState<AiFinderIntent|null>(null);const[provider,setProvider]=useState<'gemini'|'fallback'|''>('');
  const results=useMemo<AiFinderResult[]>(()=>intent?indexedProducts.filter(item=>item.product.status==='active'&&item.product.published&&item.product.inventory>0).map(item=>({...item,score:aiFinderScore(item,intent),reasons:aiResultReasons(item,intent)})).sort((a,b)=>b.score-a.score||a.product.price-b.product.price).slice(0,4):[],[indexedProducts,intent]);
  const submit=async(event:FormEvent)=>{event.preventDefault();const value=query.trim();if(value.length<3){toast.info('Mô tả thêm ngân sách, phong cách hoặc kích thước bạn muốn.');return}setBusy(true);let next:AiFinderIntent|null=null;let source:'gemini'|'fallback'='fallback';try{const response=await fetch('/api/meta?resource=watch-advisor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:value})});const payload=await response.json().catch(()=>({}));if(response.ok&&payload?.intent){next=payload.intent as AiFinderIntent;source='gemini'}}catch{}if(!next)next=localAiIntent(value,brands);const ranked=indexedProducts.filter(item=>item.product.status==='active'&&item.product.published&&item.product.inventory>0).map(item=>({...item,score:aiFinderScore(item,next!)})).sort((a,b)=>b.score-a.score||a.product.price-b.product.price).slice(0,4);setIntent(next);setProvider(source);setBusy(false);trackCommerceEvent('watch_finder_completed',{metadata:{mode:'ai',provider:source,query:value.slice(0,120),contentIds:ranked.map(item=>item.product.id).join(',')}})};
  return <section className="tf670-ai-finder" aria-label="AI Watch Advisor"><header><span><Sparkles/></span><div><small>AI WATCH ADVISOR</small><h1>Nói nhu cầu, hệ thống lọc catalog thật.</h1><p>Ví dụ: “Nam, khoảng 7 triệu, mặt dưới 42mm, dây kim loại, đi làm văn phòng.”</p></div></header><form onSubmit={submit}><textarea value={query} onChange={event=>setQuery(event.target.value)} placeholder="Mô tả ngân sách, phong cách, kích thước, thương hiệu..." rows={2}/><button type="submit" disabled={busy||!query.trim()}>{busy?'Đang phân tích...':'Tìm bằng AI'}<ArrowRight/></button></form>{intent&&<div className="tf670-ai-summary"><div><span className={provider==='gemini'?'is-ai':'is-fallback'}><Sparkles/>{provider==='gemini'?'Gemini':'Smart fallback'}</span><b>{intent.summary||query}</b><small>AI chỉ hiểu nhu cầu; kết quả bên dưới được lọc từ catalog và tồn kho thật.</small></div><button type="button" onClick={()=>{setIntent(null);setProvider('');setQuery('')}}><RotateCcw/>Làm lại</button></div>}{intent&&<div className="tf670-ai-results">{results.length?results.map(({product,reasons},index)=><article key={product.id}><span>{String(index+1).padStart(2,'0')}</span><Link to={`/products/${product.handle}`}><SmartImage src={productImage(product)} alt={product.title} width={520} height={520}/><small>{product.vendor}</small><h2>{product.title}</h2><strong>{money(product.price)}</strong><div>{reasons.map(reason=><em key={reason}>{reason}</em>)}</div><b>Xem sản phẩm<ArrowRight/></b></Link></article>):<div className="tf670-ai-empty"><Compass/><b>Chưa có mẫu phù hợp đang còn hàng.</b><span>Thử nới ngân sách hoặc kích thước.</span></div>}</div>}<footer><span>Gemini → hiểu câu tự nhiên</span><span>Catalog thật → xếp hạng</span><span>Inventory realtime → loại mẫu hết hàng</span></footer></section>;
}

export function WatchFinderPageV57(){
  const{products}=useProductCatalog();
  const[step,setStep]=useState(0);
  const[answers,setAnswers]=useState<Partial<FinderAnswers>>({});
  const indexedProducts=useMemo<FinderIndexed[]>(()=>products.map(product=>({product,text:productSearchTextV571(product).toLocaleLowerCase('vi'),specs:extractProductSpecsV571(product)})),[products]);
  const aiBrands=useMemo(()=>[...new Set(products.map(product=>product.vendor.trim()).filter(Boolean))],[products]);
  const finderSteps=useMemo<FinderStep[]>(()=>{
    const counts=new Map<string,{label:string;count:number}>();
    products.filter(product=>product.status==='active'&&product.published&&product.vendor.trim()).forEach(product=>{
      const value=product.vendor.toLocaleLowerCase('vi').trim();
      const current=counts.get(value)||{label:product.vendor.trim(),count:0};
      current.count+=1;counts.set(value,current);
    });
    const brandOptions=[{value:'all',label:'Tất cả thương hiệu',note:'Để hệ thống xếp hạng tự do'},...[...counts.entries()].sort((a,b)=>b[1].count-a[1].count||a[1].label.localeCompare(b[1].label,'vi')).slice(0,6).map(([value,item])=>({value,label:item.label,note:`${item.count} mẫu đang xuất bản`}))];
    return[...finderBaseSteps,{key:'brand',eyebrow:'BƯỚC 4 · THƯƠNG HIỆU',title:'Có ưu tiên thương hiệu không?',description:'Danh sách được lấy trực tiếp từ catalog đang xuất bản.',options:brandOptions}];
  },[products]);
  const complete=step>=finderSteps.length;
  const results=useMemo(()=>{
    if(!complete)return[];
    const resolved=answers as FinderAnswers;
    const active=indexedProducts.filter(item=>item.product.status==='active'&&item.product.published&&item.product.inventory>0);
    const strict=active.filter(item=>priceMatches(item.product.price,resolved.budget));
    return(strict.length?strict:active).map(item=>({...item,score:finderScore(item,resolved),reasons:finderReasons(item,resolved)})).sort((a,b)=>b.score-a.score||a.product.price-b.product.price).slice(0,6);
  },[answers,complete,indexedProducts]);
  const resultKey=results.map(item=>item.product.id).join('|');
  useEffect(()=>{if(complete)trackCommerceEvent('watch_finder_completed',{metadata:{recipient:answers.recipient||'',budget:answers.budget||'',style:answers.style||'',brand:answers.brand||'',contentIds:results.map(item=>item.product.id).join(',')}})},[complete,resultKey]);
  const choose=(value:string)=>{const current=finderSteps[step];setAnswers(previous=>({...previous,[current.key]:value}));setStep(index=>index+1)};
  const reset=()=>{setAnswers({});setStep(0)};
  if(complete)return <main className="tf57-feature-page tf57-finder-page is-results">
    <nav className="tf57-feature-breadcrumb"><Link to="/">Trang chủ</Link><ChevronRight/><span>Tư vấn chọn đồng hồ</span></nav>
    <header className="tf57-feature-hero"><div><small>CURATED FOR YOU</small><h1>Những lựa chọn hợp gu nhất.</h1><p>Kết quả được xếp hạng từ ngân sách, phong cách, người đeo và thương hiệu bạn đã chọn.</p></div><button type="button" onClick={reset}><RotateCcw/>Làm lại</button></header>
    <section className="tf57-finder-summary" aria-label="Câu trả lời đã chọn">{finderSteps.map((item,index)=><button type="button" key={item.key} onClick={()=>setStep(index)}><small>{item.title}</small><b>{item.options.find(option=>option.value===answers[item.key])?.label}</b><span>Sửa</span></button>)}</section>
    {results.length?<section className="tf57-finder-results">{results.map(({product,reasons},index)=><article key={product.id}><span className="tf57-result-rank">{String(index+1).padStart(2,'0')}</span><Link to={`/products/${product.handle}`}><SmartImage src={productImage(product)} alt={product.title} width={680} height={680}/><small>{product.vendor}</small><h2>{product.title}</h2><strong>{money(product.price)}</strong><div className="tf571-finder-reasons">{reasons.map(reason=><span key={reason}>{reason}</span>)}</div><span className="tf57-result-action">Xem sản phẩm<ArrowRight/></span></Link></article>)}</section>:<section className="tf57-finder-empty"><Compass/><h2>Chưa có mẫu khớp hoàn toàn</h2><p>Thử tăng khoảng ngân sách hoặc bỏ giới hạn thương hiệu.</p><button onClick={reset}>Chọn lại</button></section>}
  </main>;
  const current=finderSteps[step];
  return <main className="tf57-feature-page tf57-finder-page">
    <nav className="tf57-feature-breadcrumb"><Link to="/">Trang chủ</Link><ChevronRight/><span>Tư vấn chọn đồng hồ</span></nav>
    <AiWatchAdvisor indexedProducts={indexedProducts} brands={aiBrands}/>
    <div className="tf670-finder-divider"><span>hoặc</span><b>Chọn theo 4 câu hỏi nhanh</b></div>
    <section className="tf57-finder-shell">
      <aside><Sparkles/><small>WATCH FINDER</small><h1>Tìm chiếc đồng hồ hợp gu trong một phút.</h1><p>4 câu hỏi ngắn, không cần đăng nhập. Kết quả lấy trực tiếp từ catalog đang có hàng.</p><div className="tf571-finder-step-dots" aria-label={`Bước ${step+1} trên ${finderSteps.length}`}>{finderSteps.map((item,index)=><i key={item.key} className={index<=step?'is-active':''}/>)}</div><div className="tf57-finder-progress"><span style={{width:`${step/finderSteps.length*100}%`}}/></div><small>{step+1}/{finderSteps.length}</small></aside>
      <div className="tf57-finder-question"><header><small>{current.eyebrow}</small><h2>{current.title}</h2><p>{current.description}</p></header><div>{current.options.map(option=><button type="button" key={option.value} onClick={()=>choose(option.value)} className={answers[current.key]===option.value?'is-selected':''}><span><b>{option.label}</b><small>{option.note}</small></span><Check/></button>)}</div>{step>0&&<button className="tf57-finder-back" type="button" onClick={()=>setStep(index=>index-1)}><ArrowLeft/>Quay lại</button>}</div>
    </section>
  </main>;
}
