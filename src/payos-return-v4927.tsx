import {ArrowLeft,CheckCircle2,Clock3,RefreshCw,ShieldCheck,XCircle} from 'lucide-react';
import {useEffect,useMemo,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {trackCommerceEvent} from './commerce-events';
import {useCommerce} from './context';
import {money} from './utils';
import './v4927-commerce.css';

type PayOSState='checking'|'paid'|'cancelled'|'failed'|'error';
type PayOSStatusResponse={orderId:string;orderNumber:string;orderCode:number;amount:number;status:string;paymentStatus:'pending'|'paid'|'failed';contentIds?:string[];items?:number;message?:string};

const completedKey=(orderId:string)=>`tf.v4927.payos.completed.${orderId}`;

export function PayOSReturnPageV4927(){
  const[params]=useSearchParams();
  const{orders,updateOrder}=useCommerce();
  const orderId=params.get('orderId')||'';
  const token=params.get('token')||'';
  const cancelledByReturn=params.get('cancel')==='1';
  const[state,setState]=useState<PayOSState>('checking');
  const[data,setData]=useState<PayOSStatusResponse|null>(null);
  const[message,setMessage]=useState('Đang đối chiếu giao dịch trực tiếp với PayOS...');
  const[retrying,setRetrying]=useState(false);
  const order=useMemo(()=>orders.find(item=>item.id===orderId),[orders,orderId]);

  useEffect(()=>{
    if(!orderId||!token){setState('error');setMessage('Liên kết xác minh thanh toán không đầy đủ.');return}
    let active=true;let timer:number|undefined;let attempts=0;
    const verify=async()=>{
      try{
        const response=await fetch(`/api/payments/status?orderId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`,{headers:{Accept:'application/json'},cache:'no-store'});
        const result=await response.json().catch(()=>({})) as PayOSStatusResponse;
        if(!response.ok)throw new Error(result.message||'Không thể xác minh trạng thái thanh toán.');
        if(!active)return;
        setData(result);
        if(result.paymentStatus==='paid'||result.status==='PAID'){
          setState('paid');setMessage('PayOS đã xác nhận thanh toán thành công.');
          if(order?.paymentStatus!=='paid')updateOrder(orderId,{paymentStatus:'paid',paymentProvider:'payos',paymentOrderCode:result.orderCode});
          if(!localStorage.getItem(completedKey(orderId))){trackCommerceEvent('checkout_completed',{orderId,value:result.amount,metadata:{contentIds:(result.contentIds||[]).join(','),items:Number(result.items||0)}});localStorage.setItem(completedKey(orderId),'1')}
          return;
        }
        if(result.status==='CANCELLED'||cancelledByReturn){setState('cancelled');setMessage('Giao dịch đã được hủy. Đơn hàng vẫn được giữ để bạn thanh toán lại.');return}
        if(['FAILED','EXPIRED'].includes(result.status)||result.paymentStatus==='failed'){setState('failed');setMessage(result.status==='EXPIRED'?'Liên kết thanh toán đã hết hạn.':'Giao dịch chưa hoàn tất.');return}
        attempts+=1;
        if(attempts>=12){setState('error');setMessage('PayOS chưa trả về kết quả cuối cùng. Bạn có thể kiểm tra lại sau ít phút.');return}
        setMessage('Giao dịch đang được xử lý. Hệ thống sẽ tự kiểm tra lại...');
        timer=window.setTimeout(verify,2500);
      }catch(reason){if(active){setState('error');setMessage(reason instanceof Error?reason.message:'Không thể xác minh thanh toán.')}}
    };
    void verify();
    return()=>{active=false;if(timer)window.clearTimeout(timer)};
  },[cancelledByReturn,order?.paymentStatus,orderId,token,updateOrder]);

  const retryPayment=async()=>{
    if(!orderId)return;
    setRetrying(true);setMessage('Đang tạo liên kết PayOS mới...');
    try{
      const response=await fetch('/api/payments/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId})});
      const result=await response.json().catch(()=>({})) as {checkoutUrl?:string;message?:string};
      if(!response.ok||!result.checkoutUrl)throw new Error(result.message||'Không thể tạo liên kết thanh toán mới.');
      window.location.assign(result.checkoutUrl);
    }catch(reason){setRetrying(false);setState('error');setMessage(reason instanceof Error?reason.message:'Không thể tạo liên kết thanh toán mới.')}
  };

  const icon=state==='paid'?<CheckCircle2/>:state==='checking'?<Clock3/>:<XCircle/>;
  const title=state==='paid'?'Thanh toán thành công':state==='checking'?'Đang xác minh thanh toán':state==='cancelled'?'Bạn đã hủy thanh toán':state==='failed'?'Thanh toán chưa hoàn tất':'Chưa thể xác minh';
  return <main className="tf4927-payos-page">
    <section className={`tf4927-payos-card is-${state}`} aria-live="polite">
      <div className="tf4927-payos-brand"><span>TIMEFORGE</span><b>×</b><strong>payOS</strong></div>
      <div className="tf4927-payos-icon">{icon}{state==='checking'&&<i/>}</div>
      <small>{state==='paid'?'PAYMENT VERIFIED':'SECURE PAYMENT'}</small>
      <h1>{title}</h1>
      <p>{message}</p>
      {(data||order)&&<dl className="tf4927-payos-receipt">
        <div><dt>Mã đơn hàng</dt><dd>{data?.orderNumber||order?.number||'—'}</dd></div>
        <div><dt>Số tiền</dt><dd>{money(data?.amount||order?.total||0)}</dd></div>
        <div><dt>Phương thức</dt><dd>QR ngân hàng · PayOS</dd></div>
        <div><dt>Trạng thái</dt><dd>{state==='paid'?'Đã thanh toán':state==='checking'?'Đang đối chiếu':'Chờ thanh toán lại'}</dd></div>
      </dl>}
      <div className="tf4927-payos-security"><ShieldCheck/><span><b>Kết quả được kiểm tra từ máy chủ PayOS</b><small>TimeForge không dựa vào nội dung URL để xác nhận đã thanh toán.</small></span></div>
      <div className="tf4927-payos-actions">
        {state==='paid'&&<Link className="is-primary" to={`/order-confirmation/${orderId}`}>Xem đơn hàng</Link>}
        {['cancelled','failed','error'].includes(state)&&<button type="button" className="is-primary" onClick={retryPayment} disabled={retrying}><RefreshCw/>{retrying?'Đang tạo link...':'Thanh toán lại'}</button>}
        <Link to="/collections"><ArrowLeft/>Tiếp tục mua sắm</Link>
      </div>
    </section>
  </main>;
}
