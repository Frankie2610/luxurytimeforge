import crypto from 'node:crypto';

function safeEqual(left,right){
  const a=Buffer.from(String(left||''));const b=Buffer.from(String(right||''));
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
function mapStatus(value){
  const status=String(value||'').toLowerCase();
  if(['paid','success','completed'].includes(status))return'paid';
  if(['refunded','refund'].includes(status))return'refunded';
  if(['failed','cancelled','canceled','expired'].includes(status))return'failed';
  return'pending';
}
async function updateFirebase(orderId,orderNumber,paymentStatus,providerRef){
  const base=String(process.env.FIREBASE_DATABASE_URL||'').replace(/\/$/,'');
  const auth=process.env.FIREBASE_DATABASE_AUTH;
  if(!base||!auth)return{persisted:false,reason:'Firebase server credentials are not configured'};
  const url=`${base}/timeforge/orders.json?auth=${encodeURIComponent(auth)}`;
  const response=await fetch(url,{headers:{'Cache-Control':'no-store'}});
  if(!response.ok)throw new Error(`Firebase read failed (${response.status})`);
  const orders=await response.json();
  const list=Array.isArray(orders)?orders:Object.values(orders||{});
  const index=list.findIndex(order=>order?.id===orderId||order?.number===orderNumber);
  if(index<0)return{persisted:false,reason:'Order not found'};
  list[index]={...list[index],paymentStatus,updatedAt:new Date().toISOString(),paymentReference:providerRef||list[index].paymentReference};
  const write=await fetch(url,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(list)});
  if(!write.ok)throw new Error(`Firebase write failed (${write.status})`);
  return{persisted:true};
}
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({message:'Method not allowed'});
  const secret=process.env.PAYMENT_WEBHOOK_SECRET;
  if(!secret)return res.status(501).json({message:'Payment webhook is not configured'});
  const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body||{});
  const received=req.headers['x-signature']||req.headers['x-webhook-signature'];
  const expected=crypto.createHmac('sha256',secret).update(raw).digest('hex');
  if(!safeEqual(received,expected))return res.status(401).json({message:'Invalid signature'});
  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
  const orderId=body.orderId||body.order_id;const orderNumber=body.orderNumber||body.order_number;
  if(!orderId&&!orderNumber)return res.status(400).json({message:'Missing order reference'});
  const paymentStatus=mapStatus(body.status||body.paymentStatus);
  try{const result=await updateFirebase(orderId,orderNumber,paymentStatus,body.paymentLinkId||body.transactionId||body.id);return res.status(200).json({received:true,paymentStatus,...result});}
  catch(error){return res.status(500).json({message:error instanceof Error?error.message:'Webhook processing failed'});}
}
