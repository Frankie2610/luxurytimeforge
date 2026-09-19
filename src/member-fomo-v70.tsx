import {useEffect,useMemo,useState} from 'react';
import {Crown,Flame,LockKeyhole,ShieldCheck,ShoppingBag,Sparkles,TimerReset} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {toast} from 'sonner';
import {useCartActions} from './context';
import {useWishlist} from './wishlist';
import {useCompareV57} from './compare-v57';
import type {Product} from './types';
import {money} from './utils';
import './v700-member-fomo.css';

type Hold={id:string;productId:string;customerId:string;expiresAt:number;status:string;tierId:string};
type Opportunity={id:string;productId:string;expiresAt:number;creditMultiplier:number};
type Tier={id:string;label:string;minSpend:number;creditMultiplier:number;holdMinutes:number};
type FomoStatus={inventory:number;activeHolds:number;availableInventory:number;lowStock:boolean;selfHold:Hold|null;member:null|{customerId:string;tier:Tier;eligibleSpend:number;nextTier:Tier|null;remaining:number};opportunity:Opportunity|null;settings:{fomoEnabled:boolean;personalHoldEnabled:boolean;lowStockThreshold:number}};

const sessionToken=()=>{try{return String(JSON.parse(localStorage.getItem('tf.v12.customer-session')||'null')?.token||'')}catch{return''}};
const duration=(expiresAt:number,now:number)=>{const seconds=Math.max(0,Math.floor((expiresAt-now)/1000));const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=seconds%60;return h>0?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`};

export function MemberFomoV70({product,variantId,price}:{product:Product;variantId:string;price:number}){
  const wishlist=useWishlist();const compare=useCompareV57();const{addToCart}=useCartActions();const navigate=useNavigate();
  const token=useMemo(()=>sessionToken(),[]);const saved=wishlist.has(product.id)||compare.includes(product.id);
  const[status,setStatus]=useState<FomoStatus|null>(null);const[busy,setBusy]=useState(false);const[now,setNow]=useState(Date.now());
  const refresh=async()=>{try{const response=await fetch('/api/account/request-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'fomo-status',productId:product.id,variantId,token,saved:Boolean(token&&saved)})});if(!response.ok)return;setStatus(await response.json())}catch{/* Product remains purchasable when FOMO service is unavailable. */}};
  useEffect(()=>{void refresh()},[product.id,token,saved]);
  useEffect(()=>{if(!status?.selfHold&&!status?.opportunity)return;const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer)},[status?.selfHold?.expiresAt,status?.opportunity?.expiresAt]);
  useEffect(()=>{if(status?.selfHold&&status.selfHold.expiresAt<=now)void refresh();if(status?.opportunity&&status.opportunity.expiresAt<=now)void refresh()},[now]);
  const hold=async()=>{if(!token){navigate('/account/login');return}setBusy(true);try{const response=await fetch('/api/account/request-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'hold',productId:product.id,variantId,token})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.message||'Chưa thể giữ hàng.');toast.success('Đã giữ riêng 1 chiếc cho tài khoản Member của mày.');await refresh()}catch(error){toast.error(error instanceof Error?error.message:'Chưa thể giữ hàng.')}finally{setBusy(false)}};
  const release=async()=>{setBusy(true);try{await fetch('/api/account/request-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'release-hold',productId:product.id,variantId,token})});await refresh();toast.success('Đã trả chiếc này về kho bán chung.')}finally{setBusy(false)}};
  const buyNow=()=>{addToCart(product.id,variantId,1);navigate('/checkout')};
  const inventory=status?.inventory??product.inventory;const available=status?.availableInventory??inventory;const lowStock=status?.lowStock??(inventory>0&&inventory<=3);const selfHold=status?.selfHold&&status.selfHold.expiresAt>now?status.selfHold:null;const opportunity=status?.opportunity&&status.opportunity.expiresAt>now?status.opportunity:null;
  const unlock=status?.member?.nextTier&&status.member.remaining>0&&price>=status.member.remaining?status.member.nextTier:null;
  if(status&&!status.settings.fomoEnabled)return null;
  if(!lowStock&&!selfHold&&!opportunity&&!unlock)return null;
  return <section className="tf700-fomo" aria-label="Quyền lợi và tình trạng hàng thật">
    <div className="tf700-fomo-head"><span><Flame/></span><div><small>LIVE BUYING SIGNALS</small><b>Quyền lợi thật · tồn kho thật</b></div><ShieldCheck/></div>
    <div className="tf700-fomo-grid">
      {lowStock&&<article className="tf700-signal is-stock"><div className="tf700-signal-icon"><Flame/></div><div><small>STOCK PRESSURE</small><h3>{available>0?`Chỉ còn ${available} chiếc có thể đặt ngay`:'Số còn lại đang được Member giữ'}</h3><p>Tồn kho gốc: {inventory}{status&&status.activeHolds>0?` · ${status.activeHolds} chiếc đang hold`:''}. Số liệu không mô phỏng.</p></div>{available>0&&<button onClick={buyNow}><ShoppingBag/>Mua ngay</button>}</article>}
      {selfHold?<article className="tf700-signal is-hold active"><div className="tf700-signal-icon"><LockKeyhole/></div><div><small>PERSONAL HOLD</small><h3>1 chiếc đang được giữ riêng cho mày</h3><p>Checkout của khách khác không thể dùng phần tồn kho này trong <b>{duration(selfHold.expiresAt,now)}</b>.</p></div><button onClick={release} disabled={busy}>Bỏ giữ</button></article>:status?.member&&status.settings.personalHoldEnabled&&available>0?<article className="tf700-signal is-hold"><div className="tf700-signal-icon"><LockKeyhole/></div><div><small>PERSONAL HOLD · {status.member.tier.label.toUpperCase()}</small><h3>Khóa 1 chiếc trước khi quyết định</h3><p>Quyền giữ theo hạng hiện tại: {status.member.tier.holdMinutes} phút. Hết giờ hàng tự quay lại bán chung.</p></div><button onClick={hold} disabled={busy}>{busy?'Đang giữ...':'Giữ chiếc này'}</button></article>:null}
      {opportunity&&<article className="tf700-signal is-window"><div className="tf700-signal-icon"><TimerReset/></div><div><small>MEMBER OPPORTUNITY</small><h3>x{opportunity.creditMultiplier} Forge Credits cho mẫu mày đã lưu</h3><p>Quyền lợi hết sau <b>{duration(opportunity.expiresAt,now)}</b>. Nếu checkout mẫu này trong cửa sổ, bonus được gắn vào đơn thật.</p></div><button onClick={buyNow}><Sparkles/>Dùng quyền lợi</button></article>}
      {unlock&&<article className="tf700-signal is-tier"><div className="tf700-signal-icon"><Crown/></div><div><small>TIER UNLOCK PURCHASE</small><h3>Ở giá hiện tại, mẫu này có thể mở {unlock.label}</h3><p>Còn {money(status!.member!.remaining)} để lên hạng; mẫu này đang {money(price)}. Hạng được chốt theo số tiền thực trả sau ưu đãi và hoàn trả.</p></div><button onClick={buyNow}><Crown/>Chọn mẫu & tiến tới {unlock.label}</button></article>}
      {!token&&lowStock&&available>0&&<article className="tf700-member-nudge"><Sparkles/><div><b>Member có thể giữ chiếc này thật</b><span>Đăng ký miễn phí để mở Personal Hold, tier và Forge Credits.</span></div><button onClick={()=>navigate('/account/login')}>Đăng nhập / đăng ký</button></article>}
    </div>
  </section>;
}
