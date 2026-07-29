import {findOrder} from '../../server/firebase-rest.js';
import {createOrderCode,createReturnToken,getPayOS,publicOrigin,readPaymentSession,safeOrderId,savePaymentSession,validateOrderForPayment} from '../../server/payos.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({message:'Method not allowed'});
  try{
    const orderId=safeOrderId(req.body?.orderId);
    const found=await findOrder(orderId)
    if(!found)return res.status(404).json({message:'Không tìm thấy dữ liệu đơn hàng để tạo thanh toán PayOS.'});
    const order=found.order;
    const amount=validateOrderForPayment(order);
    const existing=await readPaymentSession(orderId).catch(()=>null);
    if(existing?.status==='PENDING'&&existing.checkoutUrl&&Number(existing.expiresAt||0)>Math.floor(Date.now()/1000)+30){
      return res.status(200).json({checkoutUrl:existing.checkoutUrl,paymentLinkId:existing.paymentLinkId,orderCode:existing.orderCode,qrCode:existing.qrCode||''});
    }

    const orderCode=createOrderCode();
    const returnToken=createReturnToken();
    const origin=publicOrigin(req);
    const query=`orderId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(returnToken)}`;
    const ttl=Math.min(60,Math.max(5,Number(process.env.PAYOS_LINK_TTL_MINUTES||15)));
    const expiredAt=Math.floor(Date.now()/1000)+ttl*60;
    const description=`TF${String(orderCode).slice(-7)}`;
    const payment=await getPayOS().paymentRequests.create({
      orderCode,
      amount,
      description,
      returnUrl:`${origin}/payment/payos/return?${query}`,
      cancelUrl:`${origin}/payment/payos/return?${query}&cancel=1`,
      buyerName:String(order.customerName||'').slice(0,120),
      buyerEmail:String(order.customerEmail||'').slice(0,120)||undefined,
      buyerPhone:String(order.customerPhone||'').slice(0,20),
      buyerAddress:[order.shippingAddress?.address1,order.shippingAddress?.ward,order.shippingAddress?.district,order.shippingAddress?.city].filter(Boolean).join(', ').slice(0,255),
      items:[{name:`Đơn hàng ${String(order.number||'TimeForge')}`.slice(0,25),quantity:1,price:amount}],
      expiredAt,
    });
    const now=new Date().toISOString();
    await savePaymentSession(orderId,{orderId,orderNumber:order.number,orderCode,amount,status:payment.status||'PENDING',paymentLinkId:payment.paymentLinkId,checkoutUrl:payment.checkoutUrl,qrCode:payment.qrCode||'',returnToken,expiresAt,createdAt:now,updatedAt:now});
    return res.status(200).json({checkoutUrl:payment.checkoutUrl,paymentLinkId:payment.paymentLinkId,orderCode,qrCode:payment.qrCode||''});
  }catch(error){
    const message=error instanceof Error?error.message:'Không thể tạo liên kết PayOS.';
    const configuration=/missing|configured|PAYOS_|Firebase server/i.test(message);
    return res.status(configuration?501:400).json({message:configuration?'PayOS hoặc Firebase phía server chưa được cấu hình đầy đủ.':message});
  }
}
