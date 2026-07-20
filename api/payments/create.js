import crypto from 'node:crypto';

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({message:'Method not allowed'});
  const {orderId,orderNumber,amount,currency='VND',description,returnUrl,cancelUrl}=req.body||{};
  if(!orderId||!orderNumber||!Number.isFinite(Number(amount))||Number(amount)<=0)return res.status(400).json({message:'Invalid payment request'});
  const endpoint=process.env.PAYMENT_PROVIDER_ENDPOINT;
  const apiKey=process.env.PAYMENT_PROVIDER_API_KEY;
  const secret=process.env.PAYMENT_PROVIDER_SECRET;
  if(!endpoint||!apiKey||!secret)return res.status(501).json({message:'Payment provider is not configured on the server.'});
  const payload={orderId,orderNumber,amount:Number(amount),currency,description,returnUrl,cancelUrl,timestamp:Date.now()};
  const signature=crypto.createHmac('sha256',secret).update(JSON.stringify(payload)).digest('hex');
  const upstream=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-API-Key':apiKey,'X-Signature':signature},body:JSON.stringify(payload)});
  const data=await upstream.json().catch(()=>({}));
  if(!upstream.ok)return res.status(upstream.status).json({message:data.message||'Payment provider request failed'});
  return res.status(200).json({checkoutUrl:data.checkoutUrl||data.checkout_url,paymentLinkId:data.paymentLinkId||data.id});
}
