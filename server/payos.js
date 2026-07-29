import crypto from 'node:crypto';
import {PayOS} from '@payos/node';
import {firebaseAppendUnique,firebaseEntries,firebasePatch,firebaseRead,firebaseWrite,findOrder} from './firebase-rest.js';

export const paymentSessionPath=(orderId)=>`timeforge/paymentSessions/${orderId}`;

export function getPayOS(){
  return new PayOS({
    clientId:process.env.PAYOS_CLIENT_ID,
    apiKey:process.env.PAYOS_API_KEY,
    checksumKey:process.env.PAYOS_CHECKSUM_KEY,
    timeout:15000,
    maxRetries:1,
  });
}

export function publicOrigin(req){
  const configured=String(process.env.PUBLIC_SITE_URL||'').trim();
  const forwardedHost=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim();
  const forwardedProto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
  const value=configured||`${forwardedProto}://${forwardedHost}`;
  const url=new URL(value);
  if(!['http:','https:'].includes(url.protocol))throw new Error('PUBLIC_SITE_URL is invalid');
  return url.origin;
}

export function safeOrderId(value){
  const id=String(value||'').trim();
  if(!/^[A-Za-z0-9_-]{6,120}$/.test(id))throw new Error('Invalid order reference');
  return id;
}

export function validateOrderForPayment(order){
  if(!order||!['payos','online'].includes(order.paymentMethod))throw new Error('Order is not eligible for PayOS');
  if(order.paymentStatus==='paid')throw new Error('Order has already been paid');
  if(order.status==='cancelled')throw new Error('Order has been cancelled');
  const amount=Number(order.total);
  const subtotal=Array.isArray(order.lines)?order.lines.reduce((sum,line)=>sum+Number(line?.lineTotal||0),0):0;
  const expected=subtotal-Number(order.discountAmount||0)+Number(order.shippingAmount||0)+Number(order.taxAmount||0);
  if(!Number.isSafeInteger(amount)||amount<=0||amount>500000000)throw new Error('Invalid order amount');
  if(!Number.isSafeInteger(subtotal)||subtotal<=0||expected!==amount)throw new Error('Order totals do not match');
  return amount;
}

const finiteMoney=value=>Number.isSafeInteger(Number(value))&&Number(value)>=0;
const cleanText=(value,max=160)=>String(value||'').trim().slice(0,max);

function evaluateDiscount(discounts,code,subtotal,shipping){
  const normalized=cleanText(code,48).toUpperCase();
  if(!normalized)return{code:'',amount:0,shippingDiscount:0};
  const discount=discounts.find(item=>String(item?.code||'').toUpperCase()===normalized&&item?.active);
  if(!discount)return{code:'',amount:0,shippingDiscount:0};
  const now=Date.now();
  if(discount.startsAt&&new Date(discount.startsAt).getTime()>now)return{code:'',amount:0,shippingDiscount:0};
  if(discount.endsAt&&new Date(discount.endsAt).getTime()<now)return{code:'',amount:0,shippingDiscount:0};
  if(Number(discount.usageLimit)>0&&Number(discount.usageCount)>=Number(discount.usageLimit))return{code:'',amount:0,shippingDiscount:0};
  if(subtotal<Number(discount.minimumSubtotal||0))return{code:'',amount:0,shippingDiscount:0};
  const value=Math.max(0,Number(discount.value||0));
  const amount=discount.type==='percentage'?Math.min(subtotal,Math.round(subtotal*value/100)):discount.type==='fixed_amount'?Math.min(subtotal,value):0;
  return{code:cleanText(discount.code,48),amount,shippingDiscount:discount.type==='free_shipping'?shipping:0};
}

export async function persistVerifiedOnlineOrder(submitted){
  if(!submitted||submitted.paymentMethod!=='online')throw new Error('Invalid online order');
  const orderId=safeOrderId(submitted.id);
  if(orderId!==safeOrderId(submitted.id)||!/^TF-[A-Za-z0-9-]{6,40}$/.test(String(submitted.number||'')))throw new Error('Invalid order identity');
  if(!Array.isArray(submitted.lines)||!submitted.lines.length||submitted.lines.length>50)throw new Error('Invalid order lines');
  const[catalogRaw,discountRaw,integration]=await Promise.all([
    firebaseRead('timeforge/products'),
    firebaseRead('timeforge/discounts').catch(()=>[]),
    firebaseRead('timeforge/settings/integrations').catch(()=>null),
  ]);
  const products=firebaseEntries(catalogRaw).map(([,product])=>product);
  const discounts=Array.isArray(discountRaw)?discountRaw:Object.values(discountRaw||{});
  const lines=submitted.lines.map((line,index)=>{
    const quantity=Number(line?.quantity);
    if(!Number.isSafeInteger(quantity)||quantity<1||quantity>99)throw new Error('Invalid product quantity');
    const product=products.find(item=>item?.id===line.productId||item?.sku===line.sku);
    if(!product||product.status!=='active'||product.published===false)throw new Error('Product is not available');
    const variants=Array.isArray(product.variants)?product.variants:[];
    const variant=variants.find(item=>item?.id===line.variantId)||variants[0];
    const inventory=Number(variant?.inventory??product.inventory??0);
    if(inventory<quantity)throw new Error(`${cleanText(product.title,80)} không đủ tồn kho.`);
    const unitPrice=Number(variant?.price??product.price);
    if(!finiteMoney(unitPrice)||unitPrice<=0)throw new Error('Invalid catalog price');
    return{id:cleanText(line.id,100)||`line_${index+1}`,productId:product.id,variantId:variant?.id||cleanText(line.variantId,100),title:cleanText(product.title,160),variantTitle:cleanText(variant?.title||'Default Title',100),sku:cleanText(variant?.sku||product.sku,100),image:cleanText(product.images?.[0],800),quantity,unitPrice,lineTotal:unitPrice*quantity};
  });
  const subtotal=lines.reduce((sum,line)=>sum+line.lineTotal,0);
  const threshold=Math.max(0,Number(integration?.shipping?.freeShippingThreshold||5000000));
  const baseShipping=subtotal>=threshold?0:50000;
  const discount=evaluateDiscount(discounts,submitted.discountCode,subtotal,baseShipping);
  const shippingAmount=Math.max(0,baseShipping-discount.shippingDiscount);
  const total=subtotal-discount.amount+shippingAmount;
  if(!finiteMoney(total)||Number(submitted.total)!==total)throw new Error('Order totals do not match current catalog');
  const address=submitted.shippingAddress||{};
  if(!cleanText(submitted.customerName,120)||!cleanText(submitted.customerPhone,30)||!cleanText(address.address1,180)||!cleanText(address.district,100)||!cleanText(address.city,100))throw new Error('Missing delivery information');
  const now=new Date().toISOString();
  const verified={...submitted,id:orderId,number:String(submitted.number),createdAt:now,updatedAt:now,customerName:cleanText(submitted.customerName,120),customerEmail:cleanText(submitted.customerEmail,160),customerPhone:cleanText(submitted.customerPhone,30),shippingAddress:{fullName:cleanText(address.fullName,120),phone:cleanText(address.phone,30),email:cleanText(address.email,160),address1:cleanText(address.address1,180),address2:cleanText(address.address2,180),ward:cleanText(address.ward,100),district:cleanText(address.district,100),city:cleanText(address.city,100),country:cleanText(address.country,80),postalCode:cleanText(address.postalCode,20)},lines,subtotal,discountCode:discount.code,discountAmount:discount.amount,shippingAmount,taxAmount:0,total,currency:'VND',status:'open',paymentStatus:'pending',fulfillmentStatus:'unfulfilled',paymentMethod:'online',paymentProvider:'payos',note:cleanText(submitted.note,1000),source:'storefront'};
  await firebaseAppendUnique('timeforge/orders',verified,'id');
  return verified;
}

export function createOrderCode(){
  return Date.now()*100+crypto.randomInt(10,100);
}

export function createReturnToken(){return crypto.randomBytes(24).toString('base64url')}

export function tokenMatches(received,expected){
  const left=Buffer.from(String(received||''));
  const right=Buffer.from(String(expected||''));
  return left.length===right.length&&left.length>0&&crypto.timingSafeEqual(left,right);
}

export function mapPayOSStatus(status){
  const value=String(status||'').toUpperCase();
  if(value==='PAID')return'paid';
  if(['FAILED','EXPIRED'].includes(value))return'failed';
  return'pending';
}

export async function readPaymentSession(orderId){
  return firebaseRead(paymentSessionPath(orderId));
}

export async function syncPaymentState({orderId,status,paymentLinkId,reference,orderCode,paidAt}){
  const found=await findOrder(orderId);
  if(!found)return{persisted:false};
  const paymentStatus=mapPayOSStatus(status);
  const patch={
    paymentStatus,
    paymentProvider:'payos',
    paymentReference:reference||paymentLinkId||found.order.paymentReference||'',
    paymentOrderCode:Number(orderCode)||found.order.paymentOrderCode||0,
    updatedAt:new Date().toISOString(),
    ...(paymentStatus==='paid'?{status:found.order.status==='open'?'confirmed':found.order.status,paidAt:paidAt||new Date().toISOString(),paymentConfirmationSource:'payos_webhook'}:{}),
  };
  await firebasePatch(`timeforge/orders/${found.key}`,patch);
  return{persisted:true,order:{...found.order,...patch}};
}

export async function savePaymentSession(orderId,session){
  await firebaseWrite(paymentSessionPath(orderId),session);
  return session;
}
