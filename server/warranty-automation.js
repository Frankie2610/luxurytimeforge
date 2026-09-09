import {firebaseEntries,firebaseMultiPatch,firebaseRead} from './firebase-rest.js';
const clean=(value,max=180)=>String(value||'').trim().slice(0,max);
const safeKey=value=>String(value||'').replace(/[.#$\[\]\/]/g,'_').slice(0,180);
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
async function sendActivationEmail(order,records){
  const key=process.env.RESEND_API_KEY,from=process.env.NEWSLETTER_FROM_EMAIL||process.env.RESEND_FROM_EMAIL||process.env.EMAIL_FROM;
  const activationUrl=clean(process.env.WARRANTY_ACTIVATION_URL||'',800);
  if(!key||!from||!order.customerEmail||!activationUrl)return{status:'not_configured'};
  const store=process.env.NEWSLETTER_STORE_NAME||'Luxury TimeForge';
  const itemHtml=records.map(record=>`<li><strong>${escapeHtml(record.productTitle)}</strong> · SKU ${escapeHtml(record.sku)}</li>`).join('');
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[order.customerEmail],subject:`Kích hoạt bảo hành điện tử · ${order.number}`,html:`<div style="font-family:Arial,sans-serif;line-height:1.65;color:#1d2b23;max-width:620px;margin:auto"><p style="font-size:12px;letter-spacing:.12em;color:#8a6a27">${escapeHtml(store).toUpperCase()}</p><h2 style="margin:0 0 12px">Đơn hàng đã sẵn sàng kích hoạt bảo hành</h2><p>Hệ thống đã tạo hồ sơ bảo hành chờ kích hoạt cho đơn <strong>${escapeHtml(order.number)}</strong>.</p><ul>${itemHtml}</ul><p><a href="${escapeHtml(activationUrl)}" style="display:inline-block;padding:11px 18px;background:#173f2a;color:#fff;text-decoration:none;border-radius:6px">Kích hoạt bảo hành</a></p><p style="font-size:12px;color:#68736d">Khách hàng vẫn cần hoàn tất bước xác thực OTP/email trên trang kích hoạt trước khi bảo hành có hiệu lực.</p></div>`,reply_to:process.env.NEWSLETTER_REPLY_TO||undefined})});
  return{status:response.ok?'sent':'failed'};
}
export async function syncWarrantyForPaidOrder(orderId){
  const orders=firebaseEntries(await firebaseRead('timeforge/orders'));
  const found=orders.find(([,order])=>order?.id===orderId);
  if(!found)return{ok:false,reason:'order_not_found'};
  const[orderKey,order]=found;
  if(order.paymentStatus!=='paid')return{ok:false,reason:'order_not_paid'};
  if(order.warrantyAutomationStatus==='ready'&&Number(order.warrantyRecordCount)>0)return{ok:true,skipped:true,count:Number(order.warrantyRecordCount)};
  const products=firebaseEntries(await firebaseRead('timeforge/products').catch(()=>({}))).map(([,product])=>product);
  const now=new Date().toISOString();
  const records=[];
  for(const line of Array.isArray(order.lines)?order.lines:[]){
    const product=products.find(item=>item?.id===line.productId||item?.sku===line.sku||(Array.isArray(item?.variants)&&item.variants.some(variant=>variant?.sku===line.sku)));
    const quantity=Math.max(1,Number(line.quantity)||1);
    for(let index=0;index<quantity;index+=1){
      const id=safeKey(`${order.id}_${line.id}_${index+1}`);
      records.push({id,orderId:order.id,orderNumber:clean(order.number,80),customerId:clean(order.customerId,120),customerName:clean(order.customerName,120),email:clean(order.customerEmail,160).toLowerCase(),phone:clean(order.customerPhone,30),productId:clean(line.productId,120),variantId:clean(line.variantId,120),sku:clean(line.sku,100),productTitle:clean(line.title,180),brand:clean(product?.vendor,100),purchaseDate:String(order.paidAt||order.createdAt||now).slice(0,10),warrantyMonths:24,status:'pending_activation',source:'timeforge_paid_order',createdAt:now,updatedAt:now});
    }
  }
  const updates={};
  records.forEach(record=>{updates[`timeforge/warrantyPending/${record.id}`]=record});
  const email=await sendActivationEmail(order,records).catch(()=>({status:'failed'}));
  updates[`timeforge/orders/${orderKey}/warrantyAutomationStatus`]='ready';
  updates[`timeforge/orders/${orderKey}/warrantyRecordCount`]=records.length;
  updates[`timeforge/orders/${orderKey}/warrantySyncedAt`]=now;
  updates[`timeforge/orders/${orderKey}/warrantyActivationEmailStatus`]=email.status;
  await firebaseMultiPatch(updates);
  return{ok:true,count:records.length,emailStatus:email.status};
}
