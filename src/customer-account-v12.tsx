// These account primitives previously came only from the lazy storefront chunk.
// Import them here so /member and /member/login have identical CSS on hard refresh.
import './legacy.css';
import './v524-customer-account.css';
import './v525-customer-order-detail.css';
import './v582-customer-polish.css';
import './v690-member-hub.css';
import './v700-member-auth.css';
import './v526-account-returns.css';
import './v704-member-polish.css';
import './v705-luxury-mobile.css';
import './v706-track-tiers.css';
import './v708-member-refinement.css';
import {AnimatePresence, motion} from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Award, BadgePercent, Bell, BookOpen, CalendarDays, Check, ChevronRight, CircleUserRound, Clock3, Copy,
  Gift, Heart, LockKeyhole, LogOut, MapPin, PackageCheck, PackageSearch, RotateCcw, Scale, Search, ShieldCheck, ShoppingBag, Sparkles, Star, Ticket, Truck, UserRound, Watch, X,
} from 'lucide-react';
import {FormEvent, useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Link, Navigate, useNavigate, useParams} from 'react-router-dom';
import {useCartActions, useCommerce} from './context';
import {SmartImage} from './image-utils';
import {resolveStoreLogo,resolveStoreName} from './store-profile';
import type {Customer, Order} from './types';
import {money} from './utils';
import {asList} from './data-normalize';
import {referralLinkForCustomer,referralCodeForCustomer} from './referral-v68';
import {useWishlist} from './wishlist';
import {useCompareV57} from './compare-v57';
import {defaultMemberSettings,eligibleMemberOrders,loadMemberSettings,readMemberSettings,memberCredits,memberProgress,recommendationScore,tierCoupons,type MemberSettings} from './member-v69';
import './referral-v68.css';

const SESSION_KEY = 'tf.v12.customer-session';
const workflowKey = 'tf.s11.order-workflows';
type Session = {customerId: string; signedInAt: string; expiresAt?: string;token?:string};
type WorkflowStore = {events: Array<{id:string;orderId:string;type:string;title:string;detail:string;createdAt:string;actor:string}>; fulfillments: Array<{id:string;orderId:string;carrier:string;trackingNumber:string;trackingUrl:string;status:string;createdAt:string}>};
const readSession = (): Session | null => {try {const value = localStorage.getItem(SESSION_KEY);if(!value)return null;const session=JSON.parse(value) as Session;if(session.expiresAt&&new Date(session.expiresAt).getTime()<=Date.now()){localStorage.removeItem(SESSION_KEY);localStorage.removeItem('tf.v70.member-customer');localStorage.removeItem('tf.v70.member-orders');return null}return session;} catch {return null;}};
const readWorkflow = (): WorkflowStore => {try {const value=localStorage.getItem(workflowKey);const parsed=value?JSON.parse(value):null;return{events:asList<WorkflowStore['events'][number]>(parsed?.events),fulfillments:asList<WorkflowStore['fulfillments'][number]>(parsed?.fulfillments)};}catch{return{events:[],fulfillments:[]};}};
const fmt = (value: string) => new Date(value).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit', year:'numeric'});
const statusLabel: Record<Order['status'], string> = {open:'Đang tiếp nhận',confirmed:'Đã xác nhận',completed:'Hoàn tất',cancelled:'Đã hủy'};
const fulfillmentLabel: Record<Order['fulfillmentStatus'], string> = {unfulfilled:'Chưa xử lý',processing:'Đang chuẩn bị',fulfilled:'Đã giao',returned:'Đã hoàn trả'};

function AccountShell({customer, children}: {customer?: Customer; children: React.ReactNode}) {
  const navigate = useNavigate();
  const {storeProfile}=useCommerce();
  const storeName=resolveStoreName(storeProfile.storeName);
  const storeLogo=resolveStoreLogo(storeProfile.logoImage);
  const logout = () => {localStorage.removeItem(SESSION_KEY);localStorage.removeItem('tf.v70.member-customer');localStorage.removeItem('tf.v70.member-orders'); navigate('/account/login', {replace:true});};
  return <div className="v12-account-page v524-account-page"><a className="v12-skip-link" href="#account-main">Bỏ qua đến nội dung</a><header className="v12-account-header v524-account-header"><Link to="/" className="v12-account-logo v524-account-brand"><span className="v524-account-brand-mark"><img src={storeLogo} alt="" width="48" height="48" decoding="async"/></span><span className="v524-account-brand-copy"><b>{storeName}</b><small>Khu vực thành viên</small></span></Link><nav aria-label="Tài khoản khách hàng"><Link className="v524-account-shop-link" to="/collections" aria-label="Tiếp tục mua sắm" title="Tiếp tục mua sắm"><ShoppingBag/>Tiếp tục mua sắm</Link>{customer&&<button className="v524-account-logout" type="button" aria-label="Đăng xuất khỏi tài khoản" title="Đăng xuất" onClick={logout}><LogOut/>Đăng xuất</button>}</nav></header><main id="account-main">{children}</main></div>;
}
const SESSION_CUSTOMER_KEY='tf.v70.member-customer';
const SESSION_ORDERS_KEY='tf.v70.member-orders';
// Orders from Firebase may contain object-valued lines; always normalize before rendering after refresh.
const normalizeCustomerOrder=(raw:unknown):Order|null=>{
 if(!raw||typeof raw!=='object')return null;
 const order=raw as Order & {lines?:unknown};
 if(!order.id||!order.number)return null;
 const lines=asList<Order['lines'][number]>(order.lines).map((line,index)=>({
  ...line,id:String(line?.id||`${order.id}-line-${index}`),title:String(line?.title||'Đồng hồ'),
  quantity:Math.max(1,Number(line?.quantity)||1),unitPrice:Math.max(0,Number(line?.unitPrice)||0),
  lineTotal:Math.max(0,Number(line?.lineTotal)||(Number(line?.unitPrice)||0)*(Number(line?.quantity)||1)),
  image:String(line?.image||''),sku:String(line?.sku||''),variantTitle:String(line?.variantTitle||'')
 }));
 return {...order,lines,createdAt:String(order.createdAt||new Date(0).toISOString()),
  total:Math.max(0,Number(order.total)||0),status:order.status||'open',
  fulfillmentStatus:order.fulfillmentStatus||'unfulfilled',paymentStatus:order.paymentStatus||'pending'} as Order;
};
const normalizeCustomerOrders=(raw:unknown):Order[]=>asList<unknown>(raw).map(normalizeCustomerOrder).filter((order):order is Order=>Boolean(order));
const readSessionOrders=():Order[]=>{try{return normalizeCustomerOrders(JSON.parse(localStorage.getItem(SESSION_ORDERS_KEY)||'[]'))}catch{return[]}};
const normalizePhone=(value:unknown)=>{let digits=String(value||'').replace(/\D/g,'');if(digits.startsWith('84')&&digits.length>=10)digits=`0${digits.slice(2)}`;return digits};
const readSessionCustomer=():Customer|undefined=>{try{const value=JSON.parse(localStorage.getItem(SESSION_CUSTOMER_KEY)||'null') as Customer|null;return value||undefined}catch{return undefined}};
const orderBelongs=(order:Order,customer:Customer)=>order.customerId===customer.id||(Boolean(customer.phone)&&Boolean(order.customerPhone)&&normalizePhone(order.customerPhone)===normalizePhone(customer.phone))||(Boolean(customer.email)&&String(order.customerEmail||'').toLowerCase()===String(customer.email||'').toLowerCase());
export function CustomerLoginV12() {
  const navigate=useNavigate();
  const[mode,setMode]=useState<'login'|'register'>('login');
  const [publicMemberSettings,setPublicMemberSettings]=useState<MemberSettings>(()=>readMemberSettings());
  useEffect(()=>{let active=true;void loadMemberSettings().then(value=>{if(active)setPublicMemberSettings(value)});return()=>{active=false}},[]);

  const[phone,setPhone]=useState('');const[password,setPassword]=useState('');const[name,setName]=useState('');const[email,setEmail]=useState('');const[birthDate,setBirthDate]=useState('');const[claimOrderCode,setClaimOrderCode]=useState('');const[claimRequired,setClaimRequired]=useState(false);const[terms,setTerms]=useState(false);const[busy,setBusy]=useState(false);const[error,setError]=useState('');
  const session=readSession();if(session&&readSessionCustomer()?.membership?.status==='active')return <Navigate to="/member" replace/>;
  const createSession=(customer:Customer,token:string,expiresAt:number,linkedOrders:Order[]=[])=>{const now=new Date();localStorage.setItem(SESSION_KEY,JSON.stringify({customerId:customer.id,signedInAt:now.toISOString(),expiresAt:new Date(expiresAt).toISOString(),token}));localStorage.setItem(SESSION_CUSTOMER_KEY,JSON.stringify(customer));localStorage.setItem(SESSION_ORDERS_KEY,JSON.stringify(linkedOrders));navigate('/member',{replace:true});};
  const submit=async(event:FormEvent)=>{event.preventDefault();setError('');setBusy(true);try{const body=mode==='login'?{action:'password-login',phone,password}:{action:'register',phone,password,name,email,birthDate,claimOrderCode,termsAccepted:terms};const response=await fetch('/api/account/request-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json().catch(()=>({})) as {message?:string;code?:string;customer?:Customer;orders?:Order[];token?:string;expiresAt?:number};if(!response.ok){if(data.code==='CLAIM_REQUIRED')setClaimRequired(true);throw new Error(data.message||'Không thể xử lý tài khoản Member.')}if(!data.customer||!data.token||!data.expiresAt)throw new Error('Phản hồi đăng nhập chưa đầy đủ.');createSession(data.customer,data.token,data.expiresAt,data.orders||[])}catch(reason){setError(reason instanceof Error?reason.message:'Không thể xử lý tài khoản Member.')}finally{setBusy(false)}};
  return <AccountShell><section className="v12-login-layout v524-login-layout tf700-auth-layout"><motion.div className="v12-login-copy v524-login-copy tf700-auth-copy" initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}><div className="v524-login-eyebrow"><span/>THÀNH VIÊN TIMEFORGE</div><h1>Mỗi khoảnh khắc,<br/>thêm một đặc quyền.</h1><p>Tham gia TimeForge để theo dõi bộ sưu tập đồng hồ, tích điểm từ đơn hàng đã thanh toán và nhận những quyền lợi dành riêng cho bạn.</p><div className="tf700-auth-benefits"><span><ShieldCheck/><b>Mua sắm theo cách của bạn</b><small>Không cần tài khoản vẫn mua và theo dõi đơn dễ dàng.</small></span><span><Award/><b>Thêm ưu đãi khi gắn bó</b><small>Tích điểm, lên hạng và nhận ưu đãi sinh nhật.</small></span><span><LockKeyhole/><b>Giữ chiếc đồng hồ bạn yêu thích</b><small>Thành viên có thể giữ sản phẩm còn hàng trong thời gian quy định.</small></span></div><Link className="tf700-guest-track" to="/track-order"><Search/>Tra cứu đơn hàng không cần đăng nhập</Link><MemberRules settings={publicMemberSettings} compact/></motion.div><div className="v524-login-form-wrap"><motion.form className="v12-login-card v524-login-card tf700-auth-card" onSubmit={submit} initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:.08}}><div className="tf700-auth-top"><div className="v524-login-icon" aria-hidden="true"><CircleUserRound/></div><div className="tf700-auth-tabs" role="group" aria-label="Chọn hình thức tài khoản"><button type="button" aria-pressed={mode==='login'} className={mode==='login'?'is-active':''} onClick={()=>{setMode('login');setError('')}}>Đăng nhập</button><button type="button" aria-pressed={mode==='register'} className={mode==='register'?'is-active':''} onClick={()=>{setMode('register');setError('')}}>Đăng ký thành viên</button></div></div><small>{mode==='login'?'ĐĂNG NHẬP THÀNH VIÊN':'THAM GIA TIMEFORGE'}</small><h2>{mode==='login'?'Chào mừng trở lại':'Đăng ký thành viên miễn phí'}</h2><p>{mode==='login'?'Nhập số điện thoại và mật khẩu để tiếp tục.':'Đăng ký miễn phí để lưu lịch sử mua hàng, tích điểm và nhận quyền lợi dành riêng cho bạn.'}</p>{mode==='register'&&<><label><span>Họ và tên</span><input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Nguyễn Văn A"/></label><label><span>Ngày sinh</span><input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)}/><small>Ngày sinh được xác nhận khi đăng ký để bảo vệ quyền lợi sinh nhật.</small></label><label><span>Email <em>không bắt buộc</em></span><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@example.com"/></label></>}<label><span>Số điện thoại</span><input autoFocus={mode==='login'} inputMode="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="09xxxxxxxx"/></label><label><span>Mật khẩu</span><input type="password" autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự"/></label>{mode==='register'&&claimRequired&&<label className="tf700-claim"><span>Mã đơn hàng đã mua</span><input value={claimOrderCode} onChange={e=>setClaimOrderCode(e.target.value)} placeholder="TF-260919-1234"/><small>Số điện thoại này đã từng mua hàng. Nhập mã đơn gần nhất để bảo vệ lịch sử mua hàng của bạn.</small></label>}{mode==='register'&&<label className="tf700-terms"><input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)}/><span>Tôi đồng ý với <a href="#the-le-thanh-vien" onClick={event=>{event.preventDefault();document.querySelector<HTMLDetailsElement>('.tf704-rules.is-compact')?.setAttribute('open','');document.querySelector('.tf704-rules.is-compact')?.scrollIntoView({behavior:'smooth',block:'nearest'})}}>thể lệ thành viên</a> và cho phép sử dụng lịch sử mua hàng để xét hạng, tích điểm.</span></label>}{error&&<div className="v12-form-error" role="alert">{error}</div>}<button className="v12-primary" disabled={busy||!phone.trim()||!password.trim()||(mode==='register'&&(!name.trim()||!birthDate||!terms||(claimRequired&&!claimOrderCode.trim())))}>{busy?'Đang xử lý...':mode==='login'?'Đăng nhập':'Tạo tài khoản'}<ArrowRight/></button><Link className="v12-track-link" to="/track-order"><Search/>Tra cứu đơn hàng không cần tài khoản</Link></motion.form><div className="v524-login-assurance"><ShieldCheck/><span><b>Không bắt buộc đăng ký</b><small>Bạn vẫn có thể mua hàng và tra cứu đơn ngay cả khi chưa là thành viên.</small></span></div></div></section></AccountShell>;
}
function currentCustomer(customers:Customer[]){const session=readSession();if(!session)return undefined;const local=customers.find(item=>item.id===session.customerId);const snapshot=readSessionCustomer();const customer=local?.membership?.status==='active'?local:snapshot;return customer?.membership?.status==='active'?customer:undefined;}


type MemberUpdate={id:string;title:string;detail:string;date?:string;url?:string};
function MemberRules({settings,compact=false}:{settings:MemberSettings;compact?:boolean}){
 return <details className={`tf704-rules ${compact?'is-compact':''}`} id={compact?undefined:'the-le-thanh-vien'}>
  <summary><span><BookOpen aria-hidden="true"/><b>Thể lệ và quyền lợi thành viên</b></span><ChevronRight aria-hidden="true"/></summary>
  <div className="tf704-rules-content">
   <p>Tham gia miễn phí. Hạng được tính theo tổng chi tiêu từ những đơn đã thanh toán, không tính đơn hủy hoặc hoàn trả.</p>
   <div className="tf704-tier-table" role="table" aria-label="Điều kiện và quyền lợi từng hạng">
    <div className="tf704-tier-table-head" role="row"><span role="columnheader">Hạng</span><span role="columnheader">Chi tiêu từ</span><span role="columnheader">Hệ số điểm</span><span role="columnheader">Giữ hàng</span></div>
    {settings.tiers.map(tier=><div className={`tf704-tier-row is-${tier.id}`} role="row" key={tier.id}><strong role="cell">{tier.label}</strong><span role="cell" data-label="Chi tiêu từ">{tier.minSpend?money(tier.minSpend):'Đăng ký miễn phí'}</span><span role="cell" data-label="Hệ số điểm">×{tier.creditMultiplier.toLocaleString('vi-VN',{maximumFractionDigits:2})}</span><span role="cell" data-label="Giữ hàng">{settings.personalHoldEnabled?`${tier.holdMinutes} phút`:'Tạm chưa áp dụng'}</span></div>)}
   </div>
   <div className="tf704-tier-perks" aria-label="Quyền lợi theo từng hạng">{settings.tiers.map(tier=><article key={tier.id} className={`is-${tier.id}`}><strong>{tier.label}</strong><p>{tier.benefits.length?tier.benefits.join(' · '):'Quyền lợi được cập nhật theo từng chương trình.'}</p></article>)}</div>
   <p>Cứ mỗi {money(settings.creditSpendUnit)} chi tiêu hợp lệ, bạn nhận 1 điểm cơ bản; hệ số tính theo hạng xét theo lịch sử chi tiêu. Điểm được ghi nhận sau khi thanh toán thành công và có thể được điều chỉnh khi hoàn trả.</p>
   {settings.birthdayBoostEnabled&&<p>Trong tháng sinh nhật, {settings.birthdayMaxOrders} đơn đủ điều kiện đầu tiên được nhân ×{settings.birthdayMultiplier.toLocaleString('vi-VN',{maximumFractionDigits:2})} điểm. Nếu có ưu đãi nhân điểm khác cùng lúc, áp dụng hệ số cao hơn, không cộng dồn.</p>}
   <p>Mã ưu đãi chỉ hiển thị khi đang có hiệu lực. Giữ hàng chỉ áp dụng cho sản phẩm còn hàng và khi chương trình đang mở. Điểm hiện dùng để ghi nhận quyền lợi thành viên; chức năng đổi điểm thành mã giảm giá chưa được mở.</p>
   <small>Ngưỡng hạng và quyền lợi có thể được điều chỉnh khi TimeForge cập nhật thể lệ tại trang này.</small>
  </div>
 </details>;
}
function MemberNotifications({customerId,updates}:{customerId:string;updates:MemberUpdate[]}){
 const key=`tf.member-notification-read:${customerId}`;
 const [open,setOpen]=useState(false);
 const [seen,setSeen]=useState<string[]>(()=>{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value.map(String):[]}catch{return[]}});
 const triggerRef=useRef<HTMLButtonElement>(null);
 const dialogRef=useRef<HTMLDivElement>(null);
 const unread=updates.filter(item=>!seen.includes(item.id)).length;
 const close=()=>{setOpen(false);triggerRef.current?.focus()};
 const show=()=>{
  if(!open){const next=Array.from(new Set([...seen,...updates.map(item=>item.id)])).slice(-150);setSeen(next);try{localStorage.setItem(key,JSON.stringify(next))}catch{/* Storage may be unavailable. */}}
  setOpen(value=>!value);
 };
 useEffect(()=>{
  if(!open)return;
  const root=document.documentElement;
  const body=document.body;
  const scrollY=window.scrollY;
  const htmlOverflow=root.style.overflow,bodyOverflow=body.style.overflow;
  const bodyPosition=body.style.position,bodyTop=body.style.top,bodyWidth=body.style.width;
  root.style.overflow='hidden';
  body.style.overflow='hidden';
  body.style.position='fixed';
  body.style.top=`-${scrollY}px`;
  body.style.width='100%';
  dialogRef.current?.focus();
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();close();return}
   if(event.key!=='Tab'||!dialogRef.current)return;
   const items=Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(element=>element.getClientRects().length>0);
   if(!items.length){event.preventDefault();dialogRef.current.focus();return}
   const first=items[0],last=items[items.length-1],focused=document.activeElement;
   if(event.shiftKey&&(focused===first||focused===dialogRef.current)){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&focused===last){event.preventDefault();first.focus()}
  };
  document.addEventListener('keydown',onKey);
  return()=>{
   document.removeEventListener('keydown',onKey);
   root.style.overflow=htmlOverflow;
   body.style.overflow=bodyOverflow;
   body.style.position=bodyPosition;
   body.style.top=bodyTop;
   body.style.width=bodyWidth;
   window.scrollTo({top:scrollY,left:0,behavior:'auto'});
  };
 },[open]);
 return <div className="tf704-notification-wrap">
  <button ref={triggerRef} type="button" className="tf704-notification-button tf708-notification-trigger" aria-label={unread?`${unread} thông báo chưa đọc`:'Thông báo thành viên'} aria-expanded={open} aria-haspopup="dialog" aria-controls="tf708-notification-dialog" onClick={show}><Bell aria-hidden="true"/>{unread>0&&<span className="tf704-notification-count">{unread>9?'9+':unread}</span>}</button>
  {open&&createPortal(<div className="tf708-notification-layer">
   <button className="tf708-notification-backdrop" type="button" aria-label="Đóng thông báo" onClick={close}/>
   <div ref={dialogRef} id="tf708-notification-dialog" className="tf708-notification-dialog" role="dialog" aria-modal="true" aria-labelledby="tf708-notification-title" tabIndex={-1}>
    <header className="tf708-notification-header"><div className="tf708-notification-header-icon"><Bell aria-hidden="true"/></div><div><small>TIMEFORGE MEMBER</small><h2 id="tf708-notification-title">Thông báo của bạn</h2><p>Cập nhật đơn hàng và quyền lợi thành viên</p></div><button type="button" className="tf708-notification-close" aria-label="Đóng thông báo" onClick={close}><X aria-hidden="true"/></button></header>
    <div className="tf708-notification-content">
     {updates.length?<div className="tf708-notification-list">{updates.map(item=><article key={item.id} className="tf708-notification-item"><span className="tf708-notification-item-icon"><PackageCheck aria-hidden="true"/></span><div><strong>{item.title}</strong><p>{item.detail}</p>{item.date&&<small>{fmt(item.date)}</small>}{item.url&&<Link to={item.url} onClick={()=>setOpen(false)}>Xem chi tiết <ArrowRight aria-hidden="true"/></Link>}</div></article>)}</div>:<div className="tf708-notification-empty"><Bell aria-hidden="true"/><strong>Chưa có thông báo mới</strong><p>Khi đơn hàng hoặc quyền lợi thành viên có cập nhật, thông tin sẽ xuất hiện tại đây.</p></div>}
    </div>
    <footer className="tf708-notification-footer"><button type="button" onClick={close}>Đóng thông báo</button></footer>
   </div>
  </div>,document.body)}
 </div>;
}
export function CustomerAccountV12() {
  const {customers,orders,products,discounts}=useCommerce();
  const {addToCart}=useCartActions();
  const navigate=useNavigate();
  const wishlist=useWishlist();
  const compare=useCompareV57();
  const [memberSettings,setMemberSettings]=useState<MemberSettings>(defaultMemberSettings);
  const [remoteOrders,setRemoteOrders]=useState<Order[]>(()=>readSessionOrders());
  const [remoteReferrals,setRemoteReferrals]=useState<Order[]>([]);
  const customer=currentCustomer(customers);
  const allOrders=useMemo(()=>{const map=new Map<string,Order>();for(const order of [...remoteOrders,...orders])map.set(order.id,order);return[...map.values()]},[orders,remoteOrders]);
  const related=useMemo(()=>customer?allOrders.filter(order=>orderBelongs(order,customer)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)):[],[customer,allOrders]);
  useEffect(()=>{let active=true;void loadMemberSettings().then(value=>{if(active)setMemberSettings(value)});const session=readSession();if(session?.token)void fetch('/api/account/request-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'member-data',token:session.token})}).then(async response=>{if(response.status===401||response.status===403){localStorage.removeItem(SESSION_KEY);localStorage.removeItem(SESSION_CUSTOMER_KEY);localStorage.removeItem(SESSION_ORDERS_KEY);if(active)navigate('/member/login',{replace:true});return null}return response.ok?response.json():null}).then(data=>{if(!active||!data)return;if(data.customer)localStorage.setItem(SESSION_CUSTOMER_KEY,JSON.stringify(data.customer));if(data.orders){const safeOrders=normalizeCustomerOrders(data.orders);setRemoteOrders(safeOrders);localStorage.setItem(SESSION_ORDERS_KEY,JSON.stringify(safeOrders))}if(data.referrals)setRemoteReferrals(normalizeCustomerOrders(data.referrals))}).catch(()=>{});return()=>{active=false}},[]);
  if(!customer)return <Navigate to="/member/login" replace/>;
  const paidOrders=eligibleMemberOrders(related);
  const progress=memberProgress(related,memberSettings);
  const credits=memberCredits(customer,related,memberSettings);
  const coupons=tierCoupons(discounts,progress,memberSettings);
  const reorder=(order:Order)=>{order.lines.forEach(line=>addToCart(line.productId,line.variantId,line.quantity));navigate('/cart');};
  const referralLink=referralLinkForCustomer(customer.id);
  const copyReferral=()=>{void navigator.clipboard?.writeText(referralLink);};
  const referredOrders=remoteReferrals.length?remoteReferrals:allOrders.filter(order=>order.referralReferrerId===customer.id);
  const referralQualified=referredOrders.filter(order=>order.referralRewardStatus==='qualified'&&(order.paymentStatus==='paid'||order.status==='completed')).length;
  const savedIds=new Set([...wishlist.ids,...compare.ids]);
  const decisionProducts=[...savedIds].map(id=>products.find(product=>product.id===id)).filter((product):product is NonNullable<typeof product>=>Boolean(product)).sort((a,b)=>{
    const aScarce=a.inventory>0&&a.inventory<=3?0:a.inventory<=0?2:1,bScarce=b.inventory>0&&b.inventory<=3?0:b.inventory<=0?2:1;
    return aScarce-bScarce||a.inventory-b.inventory;
  }).slice(0,4);
  const ownedProductIds=new Set(paidOrders.flatMap(order=>order.lines.map(line=>line.productId)));
  const ownedProducts=products.filter(product=>ownedProductIds.has(product.id));
  const preferenceProducts=[...ownedProducts,...decisionProducts.filter(product=>!ownedProductIds.has(product.id))];
  const averagePaid=paidOrders.length?paidOrders.reduce((sum,order)=>sum+order.total,0)/paidOrders.length:0;
  const recommendations=products.map(product=>({product,score:recommendationScore(product,preferenceProducts,savedIds,averagePaid)})).filter(item=>item.score>-100).sort((a,b)=>b.score-a.score||a.product.price-b.product.price).slice(0,3);
  const vaultItems=paidOrders.flatMap(order=>order.lines.flatMap(line=>Array.from({length:Math.max(1,line.quantity)},(_,index)=>{
    const product=products.find(item=>item.id===line.productId);
    const purchased=new Date(order.paidAt||order.createdAt);const years=['Versace','Ferragamo'].some(brand=>String(product?.vendor||'').toLowerCase().includes(brand.toLowerCase()))?4:2;
    const warrantyEnd=new Date(purchased);warrantyEnd.setFullYear(warrantyEnd.getFullYear()+years);
    return{key:`${order.id}-${line.id}-${index}`,order,line,product,warrantyEnd,years};
  })));
  const vault=vaultItems.slice(0,6);
  const tierClass=`is-${progress.tier.id}`;
  const birthdayMonth=customer.birthDate?new Date(`${customer.birthDate}T00:00:00`).toLocaleDateString('vi-VN',{month:'long'}):'';
  const birthMonth=customer.birthDate?Number(customer.birthDate.slice(5,7)):0;
  const memberUpdates:MemberUpdate[]=[
   ...related.slice(0,4).map(order=>({id:`order:${order.id}:${order.status}:${order.fulfillmentStatus}:${order.paymentStatus}`,title:`Đơn hàng ${order.number}`,detail:`${statusLabel[order.status]} · ${fulfillmentLabel[order.fulfillmentStatus]}`,date:order.createdAt,url:`/account/orders/${order.id}`})),
   ...(birthMonth===new Date().getMonth()+1&&memberSettings.birthdayBoostEnabled?[{id:`birthday:${new Date().getFullYear()}:${customer.id}`,title:'Quyền lợi sinh nhật của bạn',detail:`Tháng này, ${memberSettings.birthdayMaxOrders} đơn đủ điều kiện đầu tiên được nhân ×${memberSettings.birthdayMultiplier.toLocaleString('vi-VN',{maximumFractionDigits:2})} điểm.`}]:[])
  ];
  return <AccountShell customer={customer}>
    <div className="tf704-member-toolbar"><div><small>TIMEFORGE · THÀNH VIÊN</small><strong>Không gian thành viên</strong></div><MemberNotifications key={customer.id} customerId={customer.id} updates={memberUpdates}/></div>
    <section className="v12-account-hero v524-account-hero tf690-member-hero">
      <div className="v524-account-hero-copy"><small>KHÔNG GIAN CỦA BẠN</small><h1>Xin chào, {String(customer.name||'bạn').trim().split(' ').slice(-1)[0]}.</h1><p>Theo dõi các đơn hàng, những mẫu đồng hồ yêu thích và quyền lợi thành viên tại một nơi.</p><div className="tf582-account-pills" aria-label="Tiện ích tài khoản"><span>Bộ sưu tập</span><span>Điểm tích lũy</span><span>Mẫu quan tâm</span><span>Giới thiệu bạn bè</span></div><div className="v524-account-quick-actions"><Link to="/collections"><ShoppingBag/>Khám phá đồng hồ</Link><Link to="/wishlist"><Heart/>Mẫu đang lưu</Link></div></div>
      <article className={`tf690-pass ${tierClass}`}><header><span><Award/>TIMEFORGE MEMBER</span><b>{progress.tier.label}</b></header><div className="tf690-pass-name">{customer.name}</div><div className="tf690-pass-progress"><span><b>{money(progress.eligibleSpend)}</b><small>Chi tiêu hợp lệ</small></span><span><b>{credits.balance.toLocaleString('vi-VN')}</b><small>Điểm tích lũy</small></span></div>{progress.nextTier?<><div className="tf690-progress-track"><i style={{width:`${progress.progress}%`}}/></div><p>Còn <b>{money(progress.remaining)}</b> để lên <strong>{progress.nextTier.label}</strong></p></>:<p><Star/> Bạn đang ở hạng cao nhất.</p>}</article>
    </section>

    <MemberRules settings={memberSettings}/>
    <section className="tf690-value-strip" aria-label="Tóm tắt thành viên"><article className={`tf706-tier-stat is-${progress.tier.id}`}><Award/><span><small>Hạng hiện tại</small><b>{progress.tier.label}</b></span></article><article><Sparkles/><span><small>Hệ số tích điểm</small><b>x{progress.tier.creditMultiplier.toFixed(progress.tier.creditMultiplier%1?2:0)}</b></span></article><article><Watch/><span><small>Đồng hồ đã mua</small><b>{vaultItems.length}</b></span></article><article><Gift/><span><small>Lượt giới thiệu thành công</small><b>{referralQualified}</b></span></article></section>

    <section className="v12-account-grid tf690-account-grid"><main>
      <section className="tf690-section"><div className="v12-section-title"><div><small>BỘ SƯU TẬP ĐỒNG HỒ</small><h2>Đồng hồ đã sở hữu</h2><p>Các đồng hồ trong đơn hàng đã thanh toán sẽ xuất hiện tại đây.</p></div><ShieldCheck/></div>{vault.length?<div className="tf690-vault-grid">{vault.map(item=><article key={item.key}><div className="tf690-vault-image"><SmartImage src={item.line.image||item.product?.images?.[0]||''} alt={item.line.title} width={220} height={220}/><span>{item.years}Y CARE</span></div><div className="tf690-vault-copy"><small>{item.product?.vendor||'TIMEFORGE'} · {item.line.sku||'NO SKU'}</small><h3>{item.line.title}</h3><dl><div><dt>Mua ngày</dt><dd>{fmt(item.order.paidAt||item.order.createdAt)}</dd></div><div><dt>Bảo hành dự kiến đến</dt><dd>{fmt(item.warrantyEnd.toISOString())}</dd></div><div><dt>Đơn gốc</dt><dd><Link to={`/account/orders/${item.order.id}`}>{item.order.number}</Link></dd></div></dl></div></article>)}</div>:<div className="tf690-empty tf708-empty tf708-empty-owned"><div className="tf708-empty-icon"><Watch aria-hidden="true"/></div><small>BỘ SƯU TẬP CỦA BẠN</small><h3>Hành trình bắt đầu từ chiếc đồng hồ đầu tiên</h3><p>Những chiếc đồng hồ trong đơn hàng đã thanh toán sẽ được lưu tại đây để bạn dễ dàng xem lại.</p><Link to="/collections">Khám phá bộ sưu tập <ArrowRight aria-hidden="true"/></Link></div>}</section>

      <section className="tf690-section"><div className="v12-section-title"><div><small>MẪU ĐANG QUAN TÂM</small><h2>Những mẫu bạn đang cân nhắc</h2><p>Các mẫu bạn đã lưu hoặc so sánh, cùng tình trạng hàng hiện tại.</p></div><Scale/></div>{decisionProducts.length?<div className="tf690-radar-grid">{decisionProducts.map(product=><article key={product.id}><Link className="tf690-radar-image" to={`/products/${product.handle}`}><SmartImage src={product.images[0]} alt={product.title} width={260} height={260}/>{product.inventory>0&&product.inventory<=3?<span className="is-scarce">Chỉ còn {product.inventory}</span>:product.inventory<=0?<span className="is-out">Tạm hết hàng</span>:<span>Còn hàng</span>}</Link><div><small>{product.vendor}</small><Link to={`/products/${product.handle}`}>{product.title}</Link><b>{money(product.price)}</b>{product.compareAtPrice>product.price&&<em>Đang thấp hơn giá niêm yết {Math.round((1-product.price/product.compareAtPrice)*100)}%</em>}</div></article>)}</div>:<div className="tf690-empty compact tf708-empty tf708-empty-wishlist"><div className="tf708-empty-icon"><Heart aria-hidden="true"/></div><small>MẪU ĐANG QUAN TÂM</small><h3>Lưu lại chiếc đồng hồ khiến bạn ấn tượng</h3><p>Những mẫu bạn yêu thích hoặc đang so sánh sẽ xuất hiện ở đây để tiện theo dõi.</p><Link to="/collections">Khám phá đồng hồ <ArrowRight aria-hidden="true"/></Link></div>}</section>

      <section className="tf690-section"><div className="v12-section-title"><div><small>GỢI Ý DÀNH RIÊNG CHO BẠN</small><h2>3 mảnh ghép tiếp theo</h2><p>Gợi ý dựa trên những mẫu bạn đã mua, đã quan tâm và sản phẩm đang còn hàng.</p></div><Sparkles/></div><div className="tf690-next-grid">{recommendations.map(({product},index)=><article key={product.id}><span className="tf690-next-index">0{index+1}</span><SmartImage src={product.images[0]} alt={product.title} width={280} height={280}/><small>{product.vendor}</small><h3>{product.title}</h3><p>{ownedProducts.length&&!ownedProducts.some(item=>item.vendor===product.vendor)?'Bổ sung một thương hiệu mới cho bộ sưu tập.':averagePaid&&product.price>=averagePaid*.65&&product.price<=averagePaid*1.35?'Nằm trong vùng giá gần các lần mua trước.':'Một lựa chọn khác để mở rộng phong cách.'}</p><footer><b>{money(product.price)}</b><Link to={`/products/${product.handle}`}>Xem mẫu<ArrowRight/></Link></footer></article>)}</div></section>

      <section className="tf690-section tf690-orders tf708-orders"><div className="v12-section-title tf708-orders-heading"><div><small>LỊCH SỬ MUA HÀNG</small><h2>Đơn hàng gần đây</h2><p>Xem lại những lần mua sắm và trạng thái giao hàng của bạn.</p></div><Link to="/track-order"><PackageSearch aria-hidden="true"/>Tra cứu đơn <ArrowRight aria-hidden="true"/></Link></div>{related.length?<div className="v12-order-list tf708-order-list">{related.map(order=><article className="tf708-order-card" key={order.id}><header><div><small>Ngày đặt: {fmt(order.createdAt)}</small><Link to={`/account/orders/${order.id}`}>{order.number}</Link></div><span className={`v12-status ${order.status}`}>{statusLabel[order.status]}</span></header><div className="v12-order-thumbs">{order.lines.slice(0,3).map(line=><SmartImage key={line.id} src={line.image} alt={line.title} width={110} height={110}/>)}{order.lines.length>3&&<span>+{order.lines.length-3}</span>}</div><footer><div><b>{money(order.total)}</b><small>{order.lines.reduce((sum,line)=>sum+line.quantity,0)} sản phẩm · {fulfillmentLabel[order.fulfillmentStatus]}</small></div><div><button onClick={()=>reorder(order)}>Mua lại</button><Link to={`/account/orders/${order.id}`}>Xem chi tiết<ChevronRight/></Link></div></footer></article>)}</div>:<div className="v12-empty-state"><ShoppingBag/><h3>Chưa có đơn hàng</h3><p>Các đơn hàng dùng email hoặc số điện thoại này sẽ xuất hiện tại đây.</p><Link className="v12-primary" to="/collections">Khám phá bộ sưu tập</Link></div>}</section>
    </main>

    <aside className="tf690-member-aside">
      <section className="tf690-wallet"><header><span><BadgePercent/><small>ĐIỂM TÍCH LŨY</small></span><b>{credits.balance.toLocaleString('vi-VN')} <em>FC</em></b></header><div className="tf690-wallet-breakdown"><span><small>Điểm cơ bản</small><b>{credits.baseCredits}</b></span><span><small>Điểm thưởng theo hạng</small><b>+{credits.tierBonus}</b></span><span><small>Điểm thưởng sinh nhật</small><b>+{credits.birthdayBonus}</b></span>{credits.campaignBonus>0&&<span><small>Điểm thưởng ưu đãi riêng</small><b>+{credits.campaignBonus}</b></span>}</div><p>Mỗi <b>{money(memberSettings.creditSpendUnit)}</b> chi tiêu hợp lệ = 1 điểm cơ bản trước khi áp dụng hệ số hạng.</p>{memberSettings.birthdayBoostEnabled&&<div className="tf690-birthday"><CalendarDays/><span><b>Nhân ×{memberSettings.birthdayMultiplier} điểm sinh nhật</b><small>{birthdayMonth?`Áp dụng ${memberSettings.birthdayMaxOrders} đơn đầu tiên trong ${birthdayMonth}.`:'Bổ sung ngày sinh để nhận quyền lợi sinh nhật.'}</small></span>{credits.birthdayBoostUsed&&<strong>ĐÃ DÙNG</strong>}</div>}</section>

      <section className={`tf690-tier-benefits is-${progress.tier.id}`}><header><Award/><div><small>QUYỀN LỢI {progress.tier.label.toUpperCase()}</small><h3>Đã mở khóa</h3></div></header>{progress.tier.benefits.map(item=><p key={item}><Check/>{item}</p>)}</section>

      <section className="tf690-coupons"><header><Ticket/><div><small>MÃ ƯU ĐÃI THÀNH VIÊN</small><h3>Mã ưu đãi hiện có</h3></div></header>{coupons.length?coupons.map(coupon=><article key={coupon.id}><div><b>{coupon.code}</b><small>{coupon.type==='percentage'?`${coupon.value}%`:coupon.type==='fixed_amount'?money(coupon.value):'Miễn phí vận chuyển'} · đơn từ {money(coupon.minimumSubtotal)}</small></div><button onClick={()=>void navigator.clipboard?.writeText(coupon.code)}><Copy/>Sao chép</button></article>):<p>Hiện chưa có mã ưu đãi dành riêng cho hạng {progress.tier.label}. Mã mới sẽ xuất hiện tại đây khi có chương trình phù hợp.</p>}</section>

      <section className="v12-address-card rf68-member-referral tf690-referral"><header><Gift/><h3>Giới thiệu bạn bè</h3></header><div className="tf690-referral-kpis"><span><b>{referredOrders.length}</b><small>Đơn ghi nhận</small></span><span><b>{referralQualified}</b><small>Đủ điều kiện</small></span></div><p>Chia sẻ đường dẫn cá nhân. Quyền lợi giới thiệu được ghi nhận khi đơn hàng đáp ứng điều kiện chương trình.</p><code>{referralCodeForCustomer(customer.id)}</code><button type="button" onClick={copyReferral}><Copy/>Sao chép link giới thiệu</button></section>

      <section className="v12-profile-card tf690-profile"><div className="v12-avatar">{customer.name.slice(0,1).toUpperCase()}</div><h2>{customer.name}</h2><p>{customer.email}<br/>{customer.phone}</p><div>{customer.acceptsMarketing?<span><Check/>Đang nhận email tuyển chọn</span>:<span>Chưa đăng ký email</span>}</div>{customer.birthDate&&<small className="tf690-profile-birth"><CalendarDays/> {new Date(`${customer.birthDate}T00:00:00`).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})}</small>}</section>

      <section className="v12-address-card"><header><MapPin/><h3>Địa chỉ đã lưu</h3></header>{customer.addresses?.length?customer.addresses.map(address=><address key={address.id}><b>{address.firstName} {address.lastName}</b><span>{address.address1}{address.address2?`, ${address.address2}`:''}</span><span>{address.ward}, {address.district}, {address.city}</span><span>{address.phone}</span>{address.isDefault&&<small>Mặc định</small>}</address>):<p>Địa chỉ từ đơn hàng sẽ được lưu tại đây.</p>}</section>
    </aside></section>
  </AccountShell>;
}
function Progress({order}: {order: Order}) {
  const cancelled=order.status==='cancelled';
  const steps=[{label:'Đặt hàng',done:true},{label:'Xác nhận',done:['confirmed','completed'].includes(order.status)},{label:'Chuẩn bị',done:['processing','fulfilled'].includes(order.fulfillmentStatus)},{label:'Đã giao',done:order.fulfillmentStatus==='fulfilled'||order.status==='completed'}];
  return <div className={`v12-order-progress ${cancelled?'cancelled':''}`}>{steps.map((step,index)=><div key={step.label} className={step.done?'done':''}><span>{cancelled?'×':step.done?<Check/>:index+1}</span><b>{step.label}</b></div>)}</div>;
}
export function CustomerOrderV12() {
  const {customers,orders,products}=useCommerce();const sessionOrders=readSessionOrders();const accountOrders=[...sessionOrders,...orders.filter(order=>!sessionOrders.some(item=>item.id===order.id))];const {addToCart}=useCartActions();const navigate=useNavigate();const {id=''}=useParams();const customer=currentCustomer(customers);if(!customer)return <Navigate to="/account/login" replace/>;const order=accountOrders.find(item=>item.id===id&&orderBelongs(item,customer));if(!order)return <Navigate to="/account" replace/>;const workflow=readWorkflow();const fulfillment=workflow.fulfillments.find(item=>item.orderId===order.id);const events=workflow.events.filter(item=>item.orderId===order.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));const reorder=()=>{order.lines.forEach(line=>addToCart(line.productId,line.variantId,line.quantity));navigate('/cart');};return <AccountShell customer={customer}><section className="v12-order-detail"><Link className="v12-back" to="/account"><ArrowLeft/>Quay lại tài khoản</Link><header><div><small>CHI TIẾT ĐƠN HÀNG</small><h1>{order.number}</h1><p>Đặt ngày {fmt(order.createdAt)} · {statusLabel[order.status]}</p></div><div><button onClick={()=>navigator.clipboard?.writeText(order.number)}><Copy/>Sao chép mã</button><button className="v12-primary" onClick={reorder}>Mua lại đơn này</button>{order.status!=='cancelled'&&order.fulfillmentStatus!=='returned'&&<Link className="v13-return-link" to={`/account/orders/${order.id}/return`}><RotateCcw/>Yêu cầu hoàn trả</Link>}</div></header><Progress order={order}/><div className="v12-order-detail-grid"><main><section className="v12-detail-card"><header><PackageCheck/><div><h2>{fulfillmentLabel[order.fulfillmentStatus]}</h2><p>{fulfillment?.trackingNumber?`${fulfillment.carrier} · ${fulfillment.trackingNumber}`:'TimeForge sẽ cập nhật mã vận đơn tại đây.'}</p></div></header>{order.lines.map(line=><article className="v12-detail-line" key={line.id}><SmartImage src={line.image} alt={line.title} width={150} height={150}/><div><Link to={`/products/${products.find(product=>product.id===line.productId)?.handle||line.productId}`}>{line.title}</Link><small>{line.variantTitle} · SKU {line.sku||'—'}</small><span>{line.quantity} × {money(line.unitPrice)}</span></div><b>{money(line.lineTotal)}</b></article>)}{fulfillment?.trackingUrl&&<a className="v12-tracking-button" href={fulfillment.trackingUrl} target="_blank" rel="noreferrer"><Truck/>Theo dõi vận chuyển<ArrowRight/></a>}</section><section className="v12-detail-card"><header><Clock3/><div><h2>Dòng thời gian</h2><p>Cập nhật mới nhất từ TimeForge.</p></div></header><div className="v12-customer-timeline"><article><i/><div><b>Đơn hàng được tạo</b><span>{fmt(order.createdAt)}</span></div></article>{events.map(event=><article key={event.id}><i/><div><b>{event.title}</b><p>{event.detail}</p><span>{fmt(event.createdAt)}</span></div></article>)}</div></section></main><aside><section className="v12-detail-card"><h2>Tóm tắt thanh toán</h2><dl><div><dt>Tạm tính</dt><dd>{money(order.subtotal)}</dd></div><div><dt>Giảm giá</dt><dd>−{money(order.discountAmount)}</dd></div><div><dt>Vận chuyển</dt><dd>{order.shippingAmount?money(order.shippingAmount):'Miễn phí'}</dd></div><div className="total"><dt>Tổng cộng</dt><dd>{money(order.total)}</dd></div></dl><span className={`v12-payment ${order.paymentStatus}`}>{order.paymentStatus==='paid'?'Đã thanh toán':order.paymentStatus==='refunded'?'Đã hoàn tiền':'Chờ thanh toán'}</span></section><section className="v12-detail-card"><h2>Giao đến</h2><address><b>{order.customerName}</b><span>{order.shippingAddress.address1}{order.shippingAddress.address2?`, ${order.shippingAddress.address2}`:''}</span><span>{order.shippingAddress.ward}, {order.shippingAddress.district}</span><span>{order.shippingAddress.city}, {order.shippingAddress.country}</span><span>{order.customerPhone}</span></address></section></aside></div></section></AccountShell>;
}
function TrackOrderProgress({order}:{order:Order}){
 const cancelled=order.status==='cancelled';
 const returned=order.fulfillmentStatus==='returned';
 const steps=[
  {title:'Đã đặt hàng',complete:true},
  {title:'Đã xác nhận',complete:order.status==='confirmed'||order.status==='completed'||order.fulfillmentStatus==='processing'||order.fulfillmentStatus==='fulfilled'},
  {title:'Đang chuẩn bị',complete:order.fulfillmentStatus==='processing'||order.fulfillmentStatus==='fulfilled'},
  {title:'Đã giao hàng',complete:order.fulfillmentStatus==='fulfilled'}
 ];
 const active=steps.reduce((index,step,i)=>step.complete?i:index,0);
 return <div className="tf706-progress" aria-label="Tiến trình xử lý đơn hàng">
  <ol>{steps.map((step,index)=><li key={step.title} className={step.complete?'is-complete':index===Math.min(active+1,3)?'is-next':''} aria-current={step.complete&&index===active?'step':undefined}>
   <span className="tf706-progress-marker">{step.complete?<Check aria-hidden="true"/>:String(index+1).padStart(2,'0')}</span><span className="tf706-progress-text">{step.title}</span>
  </li>)}</ol>
  {(cancelled||returned)&&<p className="tf706-progress-exception">{cancelled?'Đơn hàng đã bị hủy.':'Đơn hàng đang trong quá trình hoàn trả.'}</p>}
 </div>;
}
const trackedPaymentLabel=(order:Order)=>{
 if(order.paymentStatus==='paid')return 'Đã thanh toán';
 if(order.paymentStatus==='refunded')return 'Đã hoàn tiền';
 if(order.paymentStatus==='failed')return 'Thanh toán chưa thành công';
 return order.paymentMethod?.toLowerCase().includes('cod')?'Thanh toán khi nhận hàng':'Chờ thanh toán';
};
export function TrackOrderV12() {
 const[number,setNumber]=useState('');const[identity,setIdentity]=useState('');const[found,setFound]=useState<Order|null>(null);
 const[searched,setSearched]=useState(false);const[busy,setBusy]=useState(false);const[error,setError]=useState('');
 const submit=async(event:FormEvent)=>{
  event.preventDefault();setBusy(true);setError('');setSearched(false);
  try{
   const response=await fetch('/api/account/request-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'track-order',number,identity})});
   const data=await response.json().catch(()=>({})) as {order?:Order;message?:string};
   if(!response.ok||!data.order)throw new Error(data.message||'Không tìm thấy đơn hàng phù hợp.');
   const normalized=normalizeCustomerOrder(data.order);if(!normalized)throw new Error('Chưa thể tải chi tiết đơn hàng. Vui lòng thử lại.');
   setFound(normalized);
  }catch(reason){setFound(null);setError(reason instanceof Error?reason.message:'Không thể tra cứu đơn hàng.')}
  finally{setSearched(true);setBusy(false)}
 };
 const workflow=readWorkflow();
 const fulfillment=found?workflow.fulfillments.find(item=>item.orderId===found.id):undefined;
 const trackingCode=found?.trackingNumber||fulfillment?.trackingNumber||'';
 const carrier=found?.shippingCarrier||fulfillment?.carrier||'';
 const shippingLabel=found?(found.status==='cancelled'?'Đơn hàng đã hủy':found.fulfillmentStatus==='unfulfilled'?'Đang chờ xử lý':fulfillmentLabel[found.fulfillmentStatus]):'';
 return <AccountShell><section className="v12-track-page tf710-track-page tf706-track-page">
  <div className="v12-track-copy tf710-track-hero tf706-track-hero"><small><PackageSearch aria-hidden="true"/> TRA CỨU ĐƠN HÀNG</small><h1>Hành trình chiếc đồng hồ của bạn</h1><p>Theo dõi trạng thái xử lý, vận chuyển và sản phẩm trong đơn chỉ bằng mã đơn hàng cùng thông tin liên hệ đã dùng khi mua. Không cần đăng nhập.</p></div>
  <form className="tf710-track-form tf706-track-form" onSubmit={submit}>
   <label><span>Mã đơn hàng</span><input autoComplete="off" value={number} onChange={event=>setNumber(event.target.value)} placeholder="Ví dụ: TF-260915-2821"/></label>
   <label><span>Số điện thoại hoặc email đặt hàng</span><input autoComplete="off" value={identity} onChange={event=>setIdentity(event.target.value)} placeholder="Nhập đúng thông tin trên đơn"/></label>
   <button className="v12-primary" disabled={busy||!number.trim()||!identity.trim()}><Search aria-hidden="true"/>{busy?'Đang tra cứu…':'Xem tình trạng đơn hàng'}</button>
  </form>
  <AnimatePresence mode="wait">{searched&&(found?<motion.section key="found" className="tf706-result" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
   <header className="tf706-order-header"><div><small>ĐƠN HÀNG <span>{found.number}</span></small><h2>{statusLabel[found.status]}</h2><p>Ngày đặt hàng: {fmt(found.createdAt)}</p></div><span className={`tf706-status-badge ${found.status==='cancelled'?'is-cancelled':found.fulfillmentStatus==='fulfilled'?'is-delivered':'is-processing'}`}>{found.fulfillmentStatus==='fulfilled'?'Đã giao hàng':found.status==='cancelled'?'Đã hủy':shippingLabel}</span></header>
   <section className="tf706-progress-card" aria-label="Trạng thái đơn hàng"><div className="tf706-card-heading"><div><small>CẬP NHẬT ĐƠN HÀNG</small><h3>Tiến trình xử lý</h3></div><Clock3 aria-hidden="true"/></div><TrackOrderProgress order={found}/></section>
   <section className="tf706-shipping-card" aria-label="Thông tin vận chuyển"><span className="tf706-shipping-icon"><Truck aria-hidden="true"/></span><div><small>VẬN CHUYỂN</small><strong>{shippingLabel}</strong><p>{trackingCode?`${carrier||'Đơn vị vận chuyển'} · Mã vận đơn: ${trackingCode}`:'Mã vận đơn sẽ được cập nhật khi đơn hàng được bàn giao cho đơn vị vận chuyển.'}</p></div></section>
   <section className="tf706-products tf707-products" aria-label="Các đồng hồ trong đơn hàng">
    <header className="tf706-products-heading tf707-products-heading">
     <div><small>ĐƠN HÀNG CỦA BẠN</small><h3>Những chiếc đồng hồ đã đặt</h3><p>Mỗi mẫu được hiển thị riêng để bạn dễ kiểm tra.</p></div>
     <span className="tf707-product-count">{found.lines.reduce((sum,line)=>sum+line.quantity,0)} chiếc</span>
    </header>
    <div className="tf706-product-list tf707-product-list">
     {found.lines.length?found.lines.map((line,index)=><article className="tf706-product-row tf707-watch-card" key={line.id}>
      <header className="tf707-watch-heading"><span className="tf707-watch-index">MẪU {String(index+1).padStart(2,'0')}</span><span className="tf707-watch-position">{index+1} / {found.lines.length}</span></header>
      <div className="tf707-watch-body">
       <div className="tf706-product-image tf707-watch-image"><SmartImage src={line.image} alt={line.title} width={280} height={280}/></div>
       <div className="tf706-product-info tf707-watch-info">
        <strong>{line.title}</strong>
        {line.variantTitle&&line.variantTitle.trim().toLowerCase()!=='default title'&&<span className="tf707-watch-variant">{line.variantTitle}</span>}
        {line.sku&&<span className="tf707-watch-sku">Mã sản phẩm <b>{line.sku}</b></span>}
        <div className="tf707-watch-pricing"><span>Đơn giá</span><b>{money(line.unitPrice)}</b></div>
       </div>
      </div>
      <footer className="tf707-watch-footer">
       <span className="tf707-watch-quantity">Số lượng <b>{line.quantity.toLocaleString('vi-VN')}</b></span>
       <span className="tf707-watch-line-total"><small>Thành tiền</small><strong>{money(line.lineTotal)}</strong></span>
      </footer>
     </article>):<p className="tf706-empty-products">Danh sách sản phẩm đang được cập nhật. Vui lòng liên hệ cửa hàng nếu cần hỗ trợ.</p>}
    </div>
   </section>
   <section className="tf706-invoice tf707-invoice"><div className="tf706-invoice-meta"><span><small>Người nhận</small><strong>{found.customerName||'Khách hàng'}</strong></span><span><small>Thanh toán</small><strong>{trackedPaymentLabel(found)}</strong></span></div><div className="tf706-invoice-total"><span>Tổng tiền đơn hàng</span><strong>{money(found.total)}</strong></div></section>
  </motion.section>:<motion.div key="empty" className="v12-form-error tf706-track-error" initial={{opacity:0}} animate={{opacity:1}} role="alert">{error||'Không tìm thấy đơn hàng phù hợp. Vui lòng kiểm tra lại mã đơn và thông tin liên hệ.'}</motion.div>)}</AnimatePresence>
  <Link className="v12-track-account tf706-member-invite" to="/member/login"><UserRound aria-hidden="true"/>Tham gia TimeForge để lưu lịch sử mua hàng và nhận quyền lợi thành viên<ArrowRight aria-hidden="true"/></Link>
 </section></AccountShell>;
}
