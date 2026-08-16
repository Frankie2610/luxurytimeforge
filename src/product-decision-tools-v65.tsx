import {useMemo,useState,type FormEvent} from 'react';
import {BellRing,Check,ChevronDown,Mail,Ruler,ShieldCheck,Sparkles} from 'lucide-react';
import {firebaseClient} from './firebase';
import {toast} from 'sonner';
import type {Product} from './types';
import {money,uid} from './utils';
import './v650-product-tools.css';

type Props={product:Product;variantId:string;variantTitle?:string;sku?:string;price:number};
const PRICE_ALERT_PREFIX='tf:price-alert:v1:';

function productCaseSize(product:Product){
  const candidates=[...(product.metafields||[]).map(item=>`${item.key} ${item.value}`),...(product.tags||[]),product.title,product.descriptionText];
  for(const value of candidates){
    const text=String(value||'');
    const match=text.match(/(?:case|diameter|size|đường kính|kích thước|mặt)[^0-9]{0,18}(\d{2}(?:[.,]\d)?)\s*mm/i)||text.match(/\b(3[2-9]|4[0-8])(?:[.,]\d)?\s*mm\b/i);
    if(match){const number=Number(String(match[1]||match[0]).replace(',','.').match(/\d+(?:\.\d+)?/)?.[0]);if(Number.isFinite(number))return number}
  }
  return null;
}
function recommendedRange(wrist:number){if(wrist<15)return[34,38];if(wrist<17)return[37,41];if(wrist<19)return[39,43];return[41,46]}

function WristFitAdvisor({product}:{product:Product}){
  const[wrist,setWrist]=useState(16.5);
  const[min,max]=recommendedRange(wrist);
  const current=useMemo(()=>productCaseSize(product),[product]);
  const verdict=current==null?'Chưa có kích thước mặt trong dữ liệu':current<min?'Thiết kế thiên về gọn, thanh lịch':current>max?'Thiết kế thiên về nổi bật, mạnh tay':'Kích thước nằm trong vùng cân đối gợi ý';
  return <details className="tf65-decision-card tf65-fit-advisor">
    <summary><span className="tf65-decision-icon"><Ruler/></span><span><small>CHỌN SIZE DỄ HƠN</small><b>Tư vấn kích thước cổ tay</b><em>{min}–{max} mm phù hợp</em></span><ChevronDown/></summary>
    <div className="tf65-decision-body">
      <div className="tf65-wrist-scale"><header><span>Chu vi cổ tay</span><b>{wrist.toFixed(1)} cm</b></header><input type="range" min="13" max="22" step="0.5" value={wrist} onChange={e=>setWrist(Number(e.target.value))}/><footer><span>13 cm</span><span>22 cm</span></footer></div>
      <div className="tf65-fit-result"><div><small>GỢI Ý ĐƯỜNG KÍNH</small><strong>{min}–{max} mm</strong><span>Khoảng cân đối để bắt đầu chọn mẫu.</span></div><div><small>MẪU ĐANG XEM</small><strong>{current?`${current} mm`:'—'}</strong><span>{verdict}</span></div></div>
      <p><Sparkles/>Gợi ý dựa trên tỷ lệ phổ biến; dáng vỏ, lug-to-lug và sở thích đeo vẫn có thể làm cảm giác thực tế khác nhau.</p>
    </div>
  </details>;
}

function PriceDropAlert({product,variantId,variantTitle,sku,price}:Props){
  const storageKey=`${PRICE_ALERT_PREFIX}${product.id}:${variantId||'default'}`;
  const[saved,setSaved]=useState(()=>{try{return typeof window!=='undefined'?window.localStorage.getItem(storageKey)||'':''}catch{return''}});
  const[email,setEmail]=useState(saved);
  const[threshold,setThreshold]=useState(10);
  const[busy,setBusy]=useState(false);
  const target=Math.max(0,Math.round(price*(1-threshold/100)/1000)*1000);
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();const normalized=email.trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)){toast.error('Email chưa đúng định dạng.');return}
    if(!firebaseClient.enabled){toast.error('Kênh theo dõi giá đang tạm thời chưa kết nối.');return}
    setBusy(true);const now=new Date().toISOString();const id=uid('price');
    try{await firebaseClient.write(`timeforge/priceAlerts/${id}`,{id,productId:product.id,productHandle:product.handle,productTitle:product.title,variantId:variantId||'',variantTitle:variantTitle||'',sku:sku||product.sku||'',email:normalized,currentPrice:price,targetPrice:target,thresholdPercent:threshold,status:'waiting',source:'product_page',createdAt:now,updatedAt:now});try{window.localStorage.setItem(storageKey,normalized)}catch{}setSaved(normalized);toast.success('Đã bật theo dõi giá cho mẫu này.')}catch{toast.error('Chưa thể lưu theo dõi giá. Vui lòng thử lại.')}finally{setBusy(false)}
  };
  return <details className="tf65-decision-card tf65-price-alert">
    <summary><span className="tf65-decision-icon"><BellRing/></span><span><small>THEO DÕI GIÁ</small><b>Báo khi giá giảm</b><em>Mục tiêu từ {money(target)}</em></span><ChevronDown/></summary>
    <div className="tf65-decision-body">{saved?<div className="tf65-alert-saved"><Check/><div><small>ĐÃ GHI NHẬN</small><b>Đang theo dõi cho {saved}</b><span>Mức giảm đang chọn: {threshold}%.</span></div><button type="button" onClick={()=>{setSaved('');setEmail('');try{window.localStorage.removeItem(storageKey)}catch{}}}>Đổi email</button></div>:<><div className="tf65-price-threshold"><span>Báo khi giảm ít nhất</span><div>{[5,10,15].map(value=><button type="button" key={value} className={threshold===value?'is-active':''} onClick={()=>setThreshold(value)}>{value}%</button>)}</div></div><form onSubmit={submit}><label><Mail/><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email nhận thông báo" autoComplete="email"/></label><button disabled={busy||!email.trim()}>{busy?'Đang lưu...':'Theo dõi giá'}<BellRing/></button></form><p><ShieldCheck/>Chỉ dùng email để báo thay đổi giá của mẫu này; không tự động đăng ký newsletter.</p></>}</div>
  </details>;
}

export function ProductDecisionToolsV65(props:Props){return <section className="tf65-product-decision-tools" aria-label="Công cụ hỗ trợ chọn đồng hồ"><WristFitAdvisor product={props.product}/><PriceDropAlert {...props}/></section>}
