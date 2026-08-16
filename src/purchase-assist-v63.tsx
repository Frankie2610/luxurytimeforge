import {useMemo,useState,type FormEvent} from 'react';
import {BellRing,Calculator,Check,ChevronDown,Mail,ShieldCheck,WalletCards} from 'lucide-react';
import {toast} from 'sonner';
import type {Product} from './types';
import {firebaseClient} from './firebase';
import {money,uid} from './utils';
import './v630-purchase-assist.css';

type Props={
  product:Product;
  variantId:string;
  variantTitle?:string;
  sku?:string;
  price:number;
  inventory:number;
};

const MONTHS=[3,6,9,12] as const;
const UPFRONT=[0,20,30] as const;
const STOCK_ALERT_PREFIX='tf:stock-alert:v1:';

const normalizeContact=(value:string)=>value.trim().toLowerCase().replace(/\s+/g,' ');
const validEmail=(value:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPhone=(value:string)=>{
  const digits=value.replace(/[^\d+]/g,'').replace(/^\+84/,'0');
  return /^0\d{8,10}$/.test(digits);
};
const contactType=(value:string)=>validEmail(value)?'email':validPhone(value)?'phone':'';

function InstallmentEstimate({price}:{price:number}){
  const[months,setMonths]=useState<(typeof MONTHS)[number]>(6);
  const[upfrontPercent,setUpfrontPercent]=useState<(typeof UPFRONT)[number]>(20);
  const upfront=Math.round(price*upfrontPercent/100);
  const financed=Math.max(0,price-upfront);
  const monthly=Math.ceil(financed/months/1000)*1000;
  const cheapest=Math.ceil(price/12/1000)*1000;
  return <details className="tf63-installment">
    <summary><span className="tf63-assist-icon"><Calculator/></span><span><small>KẾ HOẠCH THANH TOÁN</small><b>Ước tính trả góp</b><em>Từ {money(cheapest)}/tháng</em></span><ChevronDown/></summary>
    <div className="tf63-installment-body">
      <div className="tf63-installment-choice"><span>Kỳ hạn</span><div>{MONTHS.map(value=><button type="button" className={months===value?'is-active':''} onClick={()=>setMonths(value)} key={value}>{value} tháng</button>)}</div></div>
      <div className="tf63-installment-choice"><span>Trả trước</span><div>{UPFRONT.map(value=><button type="button" className={upfrontPercent===value?'is-active':''} onClick={()=>setUpfrontPercent(value)} key={value}>{value}%</button>)}</div></div>
      <div className="tf63-installment-result">
        <div><small>TRẢ TRƯỚC</small><b>{money(upfront)}</b></div>
        <div className="primary"><small>ƯỚC TÍNH / THÁNG</small><strong>{money(monthly)}</strong><span>× {months} tháng</span></div>
        <div><small>SỐ TIỀN CHIA KỲ</small><b>{money(financed)}</b></div>
      </div>
      <p><ShieldCheck/>Số liệu dùng để tham khảo ngân sách, chưa bao gồm lãi/phí của ngân hàng hoặc đơn vị trả góp. Số tiền thực tế phụ thuộc phương thức thanh toán được duyệt.</p>
    </div>
  </details>;
}

function StockAlert({product,variantId,variantTitle,sku}:{product:Product;variantId:string;variantTitle?:string;sku?:string}){
  const storageKey=`${STOCK_ALERT_PREFIX}${product.id}:${variantId||'default'}`;
  const initialSaved=useMemo(()=>{
    if(typeof window==='undefined')return'';
    try{return window.localStorage.getItem(storageKey)||''}catch{return''}
  },[storageKey]);
  const[contact,setContact]=useState(initialSaved);
  const[submitted,setSubmitted]=useState(Boolean(initialSaved));
  const[busy,setBusy]=useState(false);
  const[trap,setTrap]=useState('');
  const submit=async(event:FormEvent)=>{
    event.preventDefault();
    if(trap){setSubmitted(true);return}
    const value=normalizeContact(contact);
    const kind=contactType(value);
    if(!kind){toast.error('Nhập email hoặc số điện thoại hợp lệ để nhận thông báo.');return}
    if(!firebaseClient.enabled){toast.error('Kênh thông báo đang tạm thời chưa kết nối. Vui lòng liên hệ shop.');return}
    setBusy(true);
    const now=new Date().toISOString();
    const id=uid('stock');
    try{
      await firebaseClient.write(`timeforge/stockAlerts/${id}`,{
        id,productId:product.id,productHandle:product.handle,productTitle:product.title,
        variantId:variantId||'',variantTitle:variantTitle||'',sku:sku||product.sku||'',
        contact:value,contactType:kind,status:'waiting',source:'product_page',createdAt:now,updatedAt:now,
      });
      try{window.localStorage.setItem(storageKey,value)}catch{/* non-critical */}
      setSubmitted(true);
      toast.success('Đã ghi nhận. Shop có thể liên hệ khi mẫu này có hàng lại.');
    }catch{
      toast.error('Chưa thể lưu đăng ký. Vui lòng thử lại hoặc liên hệ shop.');
    }finally{setBusy(false)}
  };
  if(submitted)return <section className="tf63-stock-alert is-saved" aria-live="polite"><span className="tf63-assist-icon"><Check/></span><div><small>ĐÃ GHI NHẬN</small><b>Shop sẽ ưu tiên báo khi có hàng</b><p>Liên hệ: <strong>{contact}</strong></p><button type="button" onClick={()=>{setSubmitted(false);setContact('');try{window.localStorage.removeItem(storageKey)}catch{/* noop */}}}>Đổi thông tin liên hệ</button></div></section>;
  return <section className="tf63-stock-alert"><span className="tf63-assist-icon"><BellRing/></span><div><small>MẪU ĐANG TẠM HẾT</small><b>Thông báo khi có hàng</b><p>Để lại email hoặc số điện thoại. Thông tin chỉ dùng để liên hệ về mẫu đồng hồ này.</p><form onSubmit={submit}><label><Mail/><input value={contact} onChange={event=>setContact(event.target.value)} placeholder="Email hoặc số điện thoại" autoComplete="off" inputMode="text" aria-label="Email hoặc số điện thoại nhận thông báo"/></label><input className="tf63-stock-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={event=>setTrap(event.target.value)}/><button disabled={busy}>{busy?'Đang lưu...':'Nhận thông báo'}<BellRing/></button></form><span className="tf63-stock-note"><ShieldCheck/>Không tự động đăng ký quảng cáo.</span></div></section>;
}

export function PurchaseAssistV63(props:Props){
  return <div className="tf63-purchase-assist">
    {props.inventory<=0?<StockAlert product={props.product} variantId={props.variantId} variantTitle={props.variantTitle} sku={props.sku}/>:<InstallmentEstimate price={props.price}/>} 
    {props.inventory>0&&<div className="tf63-installment-mini"><WalletCards/><span><b>Muốn chia nhỏ ngân sách?</b><small>Mở “Ước tính trả góp” phía trên để thử kỳ hạn phù hợp.</small></span></div>}
  </div>;
}
