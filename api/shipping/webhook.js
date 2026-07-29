import crypto from 'node:crypto';
import {firebaseEntries,firebaseMultiPatch,firebaseRead} from '../../server/firebase-rest.js';

function safeEqual(left,right){
  const a=Buffer.from(String(left||''));const b=Buffer.from(String(right||''));
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
function mapStatus(value){
  const status=String(value||'').toLowerCase();
  if(['delivered','completed','success'].includes(status))return'delivered';
  if(['shipped','in_transit','transit','picked_up'].includes(status))return'shipped';
  if(['returned','returning','rto'].includes(status))return'returned';
  if(['cancelled','canceled','failed'].includes(status))return'cancelled';
  return'processing';
}
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({message:'Method not allowed'});
  const secret=process.env.SHIPPING_WEBHOOK_SECRET;
  if(!secret)return res.status(501).json({message:'Shipping webhook is not configured'});
  const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body||{});
  const received=req.headers['x-signature']||req.headers['x-webhook-signature'];
  const expected=crypto.createHmac('sha256',secret).update(raw).digest('hex');
  if(!safeEqual(received,expected))return res.status(401).json({message:'Invalid signature'});
  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
  const orderId=body.orderId||body.order_id;const orderNumber=body.orderNumber||body.order_number;
  const trackingNumber=String(body.trackingNumber||body.tracking_number||'').trim();
  if((!orderId&&!orderNumber)||!trackingNumber)return res.status(400).json({message:'Missing order or tracking reference'});
  try{
    const[rawOrders,rawWorkflows]=await Promise.all([firebaseRead('timeforge/orders'),firebaseRead('timeforge/orderWorkflows').catch(()=>null)]);
    const found=firebaseEntries(rawOrders).find(([,order])=>order?.id===orderId||order?.number===orderNumber);
    if(!found)return res.status(404).json({message:'Order not found'});
    const[orderKey,order]=found;const status=mapStatus(body.status);const now=new Date().toISOString();
    const workflow=rawWorkflows||{events:[],fulfillments:[],refunds:[],returns:[]};
    const fulfillments=Array.isArray(workflow.fulfillments)?workflow.fulfillments:[];
    const existing=fulfillments.findIndex(item=>item.orderId===order.id&&(item.trackingNumber===trackingNumber||!item.trackingNumber));
    const carrier=String(body.carrier||body.shippingProvider||order.shippingCarrier||'Đơn vị vận chuyển');
    const trackingUrl=String(body.trackingUrl||body.tracking_url||order.trackingUrl||'');
    const record={id:existing>=0?fulfillments[existing].id:`fulfill_${Date.now()}`,orderId:order.id,lineIds:existing>=0?fulfillments[existing].lineIds:order.lines.map(line=>line.id),carrier,trackingNumber,trackingUrl,status:status==='delivered'?'delivered':status==='shipped'?'shipped':'processing',createdAt:existing>=0?fulfillments[existing].createdAt:now,updatedAt:now};
    const nextFulfillments=existing>=0?fulfillments.map((item,index)=>index===existing?record:item):[record,...fulfillments];
    const event={id:`shipping_${Date.now()}`,orderId:order.id,type:'shipping_webhook',title:status==='delivered'?'Đã giao hàng':status==='shipped'?'Đơn hàng đang vận chuyển':status==='returned'?'Đơn hàng đang hoàn về':'Cập nhật vận chuyển',detail:`${carrier} · ${trackingNumber}`,createdAt:now,actor:'Shipping webhook'};
    const nextWorkflow={...workflow,fulfillments:nextFulfillments,events:[event,...(Array.isArray(workflow.events)?workflow.events:[])]};
    const nextOrder={...order,shippingCarrier:carrier,trackingNumber,trackingUrl,fulfillmentStatus:status==='delivered'?'fulfilled':status==='returned'?'returned':'processing',status:status==='delivered'?'completed':order.status,updatedAt:now,...(status==='shipped'?{shippedAt:order.shippedAt||now}:{}),...(status==='delivered'?{shippedAt:order.shippedAt||now,deliveredAt:now}:{})};
    await firebaseMultiPatch({[`timeforge/orders/${orderKey}`]:nextOrder,'timeforge/orderWorkflows':nextWorkflow});
    return res.status(200).json({received:true,orderId:order.id,status,trackingNumber});
  }catch(error){return res.status(500).json({message:error instanceof Error?error.message:'Shipping webhook processing failed'});}
}
