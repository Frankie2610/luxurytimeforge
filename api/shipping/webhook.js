import crypto from 'node:crypto';

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
async function firebaseRead(path){
  const base=String(process.env.FIREBASE_DATABASE_URL||'').replace(/\/$/,'');
  const auth=process.env.FIREBASE_DATABASE_AUTH;
  if(!base||!auth)throw new Error('Firebase server credentials are not configured');
  const response=await fetch(`${base}/${path}.json?auth=${encodeURIComponent(auth)}`,{headers:{'Cache-Control':'no-store'}});
  if(!response.ok)throw new Error(`Firebase read failed (${response.status})`);
  return response.json();
}
async function firebaseWrite(path,value){
  const base=String(process.env.FIREBASE_DATABASE_URL||'').replace(/\/$/,'');
  const auth=process.env.FIREBASE_DATABASE_AUTH;
  const response=await fetch(`${base}/${path}.json?auth=${encodeURIComponent(auth)}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
  if(!response.ok)throw new Error(`Firebase write failed (${response.status})`);
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
  const trackingNumber=String(body.trackingNumber||body.tracking_number||'');
  if((!orderId&&!orderNumber)||!trackingNumber)return res.status(400).json({message:'Missing order or tracking reference'});
  try{
    const [rawOrders,rawWorkflows]=await Promise.all([firebaseRead('timeforge/orders'),firebaseRead('timeforge/orderWorkflows')]);
    const orders=Array.isArray(rawOrders)?rawOrders:Object.values(rawOrders||{});
    const index=orders.findIndex(order=>order?.id===orderId||order?.number===orderNumber);
    if(index<0)return res.status(404).json({message:'Order not found'});
    const order=orders[index];const status=mapStatus(body.status);const now=new Date().toISOString();
    const workflow=rawWorkflows||{events:[],fulfillments:[],refunds:[],returns:[]};
    const fulfillments=Array.isArray(workflow.fulfillments)?workflow.fulfillments:[];
    const existing=fulfillments.findIndex(item=>item.orderId===order.id&&(item.trackingNumber===trackingNumber||!item.trackingNumber));
    const record={id:existing>=0?fulfillments[existing].id:`fulfill_${Date.now()}`,orderId:order.id,lineIds:existing>=0?fulfillments[existing].lineIds:order.lines.map(line=>line.id),carrier:String(body.carrier||body.shippingProvider||'Đơn vị vận chuyển'),trackingNumber,trackingUrl:String(body.trackingUrl||body.tracking_url||''),status:status==='delivered'?'delivered':status==='shipped'?'shipped':'processing',createdAt:existing>=0?fulfillments[existing].createdAt:now,updatedAt:now};
    const nextFulfillments=existing>=0?fulfillments.map((item,i)=>i===existing?record:item):[record,...fulfillments];
    const event={id:`shipping_${Date.now()}`,orderId:order.id,type:'shipping_webhook',title:status==='delivered'?'Đã giao hàng':status==='shipped'?'Đơn hàng đang vận chuyển':status==='returned'?'Đơn hàng đang hoàn về':'Cập nhật vận chuyển',detail:`${record.carrier} · ${trackingNumber}`,createdAt:now,actor:'Shipping webhook'};
    const nextWorkflow={...workflow,fulfillments:nextFulfillments,events:[event,...(workflow.events||[])]};
    orders[index]={...order,fulfillmentStatus:status==='delivered'?'fulfilled':status==='returned'?'returned':'processing',status:status==='delivered'?'completed':order.status,updatedAt:now};
    await Promise.all([firebaseWrite('timeforge/orders',orders),firebaseWrite('timeforge/orderWorkflows',nextWorkflow)]);
    return res.status(200).json({received:true,orderId:order.id,status,trackingNumber});
  }catch(error){return res.status(500).json({message:error instanceof Error?error.message:'Shipping webhook processing failed'});}
}
