import crypto from 'node:crypto';
import {firebaseEntries,firebaseMultiPatch,firebaseRead,findOrder} from './firebase-rest.js';

const cleanText=(value,max=160)=>String(value||'').trim().slice(0,max);
const safeInteger=(value)=>Number.isSafeInteger(Number(value))?Number(value):0;
const vietnamStamp=()=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'2-digit',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const values=Object.fromEntries(parts.map(part=>[part.type,part.value]));return`${values.year||''}${values.month||''}${values.day||''}`};
const orderNumber=()=>`TF-${vietnamStamp()}-${crypto.randomInt(1000,10000)}`;
const bankTransferContent=(lines,number)=>{const raw=cleanText(lines?.[0]?.sku,100).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12)||'ORDER';const suffix=String(number||'').replace(/\D/g,'').slice(-4)||String(crypto.randomInt(1000,10000));return`TF${vietnamStamp()}-${raw}-${suffix}`};
const safeRequestId=(value)=>{const input=cleanText(value,120);return/^[A-Za-z0-9_-]{8,120}$/.test(input)?input:`order_${crypto.randomUUID().replaceAll('-','')}`};
const uid=(prefix)=>`${prefix}_${crypto.randomUUID().replaceAll('-','')}`;

function normalizePaymentMethod(value){
  const method=String(value||'cod');
  if(method==='online')return'payos';
  if(['cod','bank_transfer','payos'].includes(method))return method;
  throw new Error('Phương thức thanh toán không hợp lệ.');
}

function normalizeIntegrations(raw){
  const sourcePayment=raw?.payment||{};
  const payment={...sourcePayment,cod:sourcePayment.cod!==false,bankTransfer:sourcePayment.bankTransfer!==false,online:sourcePayment.online===true};
  const legacy={id:'bank_legacy',bankName:cleanText(payment.bankName,120),accountName:cleanText(payment.bankAccountName,160),accountNumber:cleanText(payment.bankAccountNumber,80),branch:'',note:'',enabled:true,priority:1};
  const accounts=(Array.isArray(payment.bankAccounts)&&payment.bankAccounts.length?payment.bankAccounts:[legacy]).map((item,index)=>({
    id:cleanText(item?.id,100)||`bank_${index+1}`,
    bankName:cleanText(item?.bankName,120),
    accountName:cleanText(item?.accountName,160),
    accountNumber:cleanText(item?.accountNumber,80),
    branch:cleanText(item?.branch,160),
    note:cleanText(item?.note,240),
    enabled:item?.enabled!==false,
    priority:Number.isFinite(Number(item?.priority))?Number(item.priority):index+1,
  }));
  const preferred=accounts.find(item=>item.id===payment.preferredBankAccountId&&item.enabled)||accounts.filter(item=>item.enabled).sort((a,b)=>a.priority-b.priority)[0]||null;
  const transferDiscount={enabled:Boolean(payment.bankTransferDiscount?.enabled),type:payment.bankTransferDiscount?.type==='fixed_amount'?'fixed_amount':'percentage',value:Math.max(0,Number(payment.bankTransferDiscount?.value||0)),minimumSubtotal:Math.max(0,Number(payment.bankTransferDiscount?.minimumSubtotal||0))};
  return{payment:{...payment,bankAccounts:accounts,preferredBankAccountId:preferred?.id||'',bankTransferDiscount:transferDiscount},shipping:{freeShippingThreshold:Math.max(0,Number(raw?.shipping?.freeShippingThreshold||5000000))},preferred};
}

function evaluatePromo(discountEntries,code,subtotal,shipping){
  const normalized=cleanText(code,48).toUpperCase();
  if(!normalized)return{key:'',code:'',amount:0,shippingDiscount:0,discount:null};
  const found=discountEntries.find(([,item])=>String(item?.code||'').toUpperCase()===normalized&&item?.active);
  if(!found)return{key:'',code:'',amount:0,shippingDiscount:0,discount:null};
  const[key,discount]=found;const now=Date.now();
  if(discount.startsAt&&new Date(discount.startsAt).getTime()>now)return{key:'',code:'',amount:0,shippingDiscount:0,discount:null};
  if(discount.endsAt&&new Date(discount.endsAt).getTime()<now)return{key:'',code:'',amount:0,shippingDiscount:0,discount:null};
  if(Number(discount.usageLimit)>0&&Number(discount.usageCount)>=Number(discount.usageLimit))return{key:'',code:'',amount:0,shippingDiscount:0,discount:null};
  if(subtotal<Number(discount.minimumSubtotal||0))return{key:'',code:'',amount:0,shippingDiscount:0,discount:null};
  const value=Math.max(0,Number(discount.value||0));
  const amount=discount.type==='percentage'?Math.min(subtotal,Math.round(subtotal*value/100)):discount.type==='fixed_amount'?Math.min(subtotal,Math.round(value)):0;
  return{key,code:cleanText(discount.code,48),amount,shippingDiscount:discount.type==='free_shipping'?shipping:0,discount};
}


const defaultReferralSettings={enabled:true,friendRewardType:'percentage',friendRewardValue:10,referrerRewardType:'percentage',referrerRewardValue:10,minimumSubtotal:1000000,rewardDelayDays:7,rewardExpiryDays:60,requireFirstOrder:true,useEmailAntiFraud:false,requireVerifiedEmail:false,sameIpMode:'review',sameDeviceMode:'block',sameAddressMode:'review',maxReferralsPerDay:5};
function normalizeReferralSettings(raw){return{...defaultReferralSettings,...(raw||{}),friendRewardValue:Math.max(0,Number(raw?.friendRewardValue??10)),referrerRewardValue:Math.max(0,Number(raw?.referrerRewardValue??10)),minimumSubtotal:Math.max(0,Number(raw?.minimumSubtotal??1000000)),rewardDelayDays:Math.max(0,Number(raw?.rewardDelayDays??7)),rewardExpiryDays:Math.max(1,Number(raw?.rewardExpiryDays??60)),maxReferralsPerDay:Math.max(1,Number(raw?.maxReferralsPerDay??5))}}
function referralCodeForCustomer(customerId){let hash=2166136261;for(const char of String(customerId||'')){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}return`TF${(hash>>>0).toString(36).toUpperCase().padStart(7,'0').slice(-7)}`}
function normalizeIdentity(value){return cleanText(value,240).toLowerCase().replace(/\s+/g,'')}
function normalizeAddress(value){return cleanText(value,500).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')}
function referralDiscountAmount(settings,subtotal){if(!settings.enabled||subtotal<settings.minimumSubtotal)return 0;return settings.friendRewardType==='percentage'?Math.min(subtotal,Math.round(subtotal*Math.min(100,settings.friendRewardValue)/100)):Math.min(subtotal,Math.round(settings.friendRewardValue))}
function hashReferralIp(ip){if(!ip)return'';return crypto.createHash('sha256').update(`${process.env.REFERRAL_HASH_SALT||'timeforge-referral'}:${ip}`).digest('hex').slice(0,24)}
function evaluateReferral({settings,payload,customerEntries,orderEntries,subtotal,requestContext}){
 const code=cleanText(payload?.referralCode,24).toUpperCase();if(!settings.enabled||!code)return{code:'',discountAmount:0,score:0,riskLevel:'low',status:'pending',signals:[],referrerId:'',ipHash:''};
 const referrerEntry=customerEntries.find(([,customer])=>referralCodeForCustomer(customer?.id)===code);if(!referrerEntry)return{code,discountAmount:0,score:100,riskLevel:'high',status:'blocked',signals:['Mã giới thiệu không tồn tại'],referrerId:'',ipHash:''};
 const referrer=referrerEntry[1],referrerId=String(referrer.id||referrerEntry[0]);let score=0;const signals=[];let hardBlock=false;
 const phone=normalizeIdentity(payload.customer?.phone),email=normalizeIdentity(payload.customer?.email);const refPhone=normalizeIdentity(referrer.phone),refEmail=normalizeIdentity(referrer.email);
 if(phone&&refPhone&&phone===refPhone){score+=100;signals.push('Trùng số điện thoại người giới thiệu');hardBlock=true}
 if(settings.useEmailAntiFraud&&email&&refEmail&&email===refEmail){score+=100;signals.push('Trùng email người giới thiệu');hardBlock=true}
 const buyerHistory=orderEntries.filter(([,order])=>(phone&&normalizeIdentity(order?.customerPhone)===phone)||(settings.useEmailAntiFraud&&email&&normalizeIdentity(order?.customerEmail)===email));
 if(settings.requireFirstOrder&&buyerHistory.length){score+=100;signals.push('Khách đã có lịch sử đơn hàng');hardBlock=true}
 if(settings.useEmailAntiFraud&&settings.requireVerifiedEmail&&!payload.referralEmailVerified){score+=35;signals.push('Email chưa được xác thực')}
 const buyerAddress=normalizeAddress(`${payload.shippingAddress?.address1||''}${payload.shippingAddress?.address2||''}${payload.shippingAddress?.ward||''}${payload.shippingAddress?.district||''}${payload.shippingAddress?.city||''}`);
 const sameAddress=(Array.isArray(referrer.addresses)?referrer.addresses:[]).some(address=>buyerAddress&&normalizeAddress(`${address.address1||''}${address.address2||''}${address.ward||''}${address.district||''}${address.city||''}`)===buyerAddress);
 if(sameAddress&&settings.sameAddressMode!=='allow'){score+=settings.sameAddressMode==='block'?60:30;signals.push('Địa chỉ trùng người giới thiệu');if(settings.sameAddressMode==='block')hardBlock=true}
 const device=cleanText(payload.referralDeviceId,140);const ipHash=hashReferralIp(requestContext?.ip);const now=Date.now(),dayAgo=now-86400000;
 const relatedReferralOrders=orderEntries.map(([,o])=>o).filter(o=>o?.referralReferrerId===referrerId);
 if(device&&relatedReferralOrders.some(o=>o.referralDeviceId===device)&&settings.sameDeviceMode!=='allow'){score+=settings.sameDeviceMode==='block'?60:40;signals.push('Thiết bị đã dùng referral này');if(settings.sameDeviceMode==='block')hardBlock=true}
 if(ipHash&&relatedReferralOrders.some(o=>o.referralIpHash===ipHash)&&settings.sameIpMode!=='allow'){score+=settings.sameIpMode==='block'?60:25;signals.push('IP đã dùng referral này');if(settings.sameIpMode==='block')hardBlock=true}
 const recentCount=relatedReferralOrders.filter(o=>new Date(o.createdAt||0).getTime()>=dayAgo).length;if(recentCount>=settings.maxReferralsPerDay){score+=60;signals.push('Vượt giới hạn referral/ngày');hardBlock=true}
 const riskLevel=score>=60?'high':score>=30?'medium':'low';const status=hardBlock||score>=60?'blocked':score>=30?'review':'pending';const discountAmount=status==='blocked'?0:referralDiscountAmount(settings,subtotal);
 return{code,discountAmount,score,riskLevel,status,signals,referrerId,deviceId:device,ipHash};
}

function evaluateTransferDiscount(settings,method,subtotal){
  const config=settings.payment.bankTransferDiscount;
  if(method!=='bank_transfer'||!config.enabled||subtotal<config.minimumSubtotal||config.value<=0)return{amount:0,label:''};
  const amount=config.type==='percentage'?Math.min(subtotal,Math.round(subtotal*Math.min(100,config.value)/100)):Math.min(subtotal,Math.round(config.value));
  return{amount,label:config.type==='percentage'?`Ưu đãi chuyển khoản ${config.value}%`:`Ưu đãi chuyển khoản ${amount.toLocaleString('vi-VN')}đ`};
}

function customerFromOrder(customerEntries,payload,total){
  const email=cleanText(payload.customer?.email,160).toLowerCase();
  const phone=cleanText(payload.customer?.phone,30);
  const existing=customerEntries.find(([,item])=>(email&&String(item?.email||'').toLowerCase()===email)||(phone&&String(item?.phone||'')===phone));
  const now=new Date().toISOString();
  const address=payload.shippingAddress||{};
  const addressItem={id:uid('address'),firstName:cleanText(payload.customer?.name,120).split(' ')[0]||'',lastName:cleanText(payload.customer?.name,120).split(' ').slice(1).join(' '),phone,address1:cleanText(address.address1,180),address2:cleanText(address.address2,180),ward:cleanText(address.ward,100),district:cleanText(address.district,100),city:cleanText(address.city,100),country:cleanText(address.country||'Việt Nam',80),postalCode:cleanText(address.postalCode,20),isDefault:!existing?.[1]?.addresses?.length};
  if(existing){const[key,item]=existing;return{key,customer:{...item,name:cleanText(payload.customer?.name,120),email,phone,ordersCount:Number(item.ordersCount||0)+1,totalSpent:Number(item.totalSpent||0)+total,addresses:[...(Array.isArray(item.addresses)?item.addresses:[]),addressItem]}}}
  const id=uid('customer');return{key:id,customer:{id,name:cleanText(payload.customer?.name,120),email,phone,ordersCount:1,totalSpent:total,tags:['Online'],createdAt:now,acceptsMarketing:false,addresses:[addressItem],notes:[]}};
}

export async function createVerifiedStorefrontOrder({payload,cart,requestId,requestContext={}}){
  if(!payload||!Array.isArray(cart)||!cart.length||cart.length>50)throw new Error('Giỏ hàng không hợp lệ.');
  const id=safeRequestId(requestId);
  const existing=await findOrder(id).catch(()=>null);
  if(existing)return existing.order;
  const method=normalizePaymentMethod(payload.paymentMethod);
  const[catalogRaw,discountRaw,integrationRaw,customersRaw,referralRaw,ordersRaw]=await Promise.all([
    firebaseRead('timeforge/products'),
    firebaseRead('timeforge/discounts').catch(()=>({})),
    firebaseRead('timeforge/settings/integrations').catch(()=>({})),
    firebaseRead('timeforge/customers').catch(()=>({})),
    firebaseRead('timeforge/settings/referral').catch(()=>({})),
    firebaseRead('timeforge/orders').catch(()=>({})),
  ]);
  const productEntries=firebaseEntries(catalogRaw);
  const discountEntries=firebaseEntries(discountRaw);
  const settings=normalizeIntegrations(integrationRaw||{});
  const referralSettings=normalizeReferralSettings(referralRaw||{});
  if(method==='cod'&&!settings.payment.cod)throw new Error('Thanh toán khi nhận hàng hiện đang tạm tắt.');
  if(method==='bank_transfer'&&!settings.payment.bankTransfer)throw new Error('Chuyển khoản ngân hàng hiện đang tạm tắt.');
  if(method==='payos'&&!settings.payment.online)throw new Error('Thanh toán PayOS hiện đang tạm tắt.');
  const mergedCart=[...cart.reduce((groups,line)=>{
    const productId=cleanText(line?.productId,120);
    const variantId=cleanText(line?.variantId,120);
    const quantity=safeInteger(line?.quantity);
    if(!productId||quantity<1||quantity>99)throw new Error('Số lượng sản phẩm không hợp lệ.');
    const key=`${productId}::${variantId}`;
    const previous=groups.get(key);
    const mergedQuantity=(previous?.quantity||0)+quantity;
    if(mergedQuantity>99)throw new Error('Số lượng sản phẩm không hợp lệ.');
    groups.set(key,{productId,variantId,quantity:mergedQuantity});
    return groups;
  },new Map()).values()];
  const lines=mergedCart.map((line,index)=>{
    const found=productEntries.find(([,product])=>product?.id===line.productId);
    if(!found)throw new Error('Sản phẩm không còn tồn tại.');
    const[,product]=found;
    if(product.status!=='active'||product.published===false)throw new Error(`${cleanText(product.title,80)} chưa sẵn sàng để bán.`);
    const variants=Array.isArray(product.variants)?product.variants:[];
    const variant=variants.find(item=>item?.id===line.variantId)||variants[0];
    const inventory=Number(variant?.inventory??product.inventory??0);
    if(inventory<line.quantity)throw new Error(`${cleanText(product.title,80)} không đủ tồn kho.`);
    const unitPrice=Number(variant?.price??product.price);
    if(!Number.isSafeInteger(unitPrice)||unitPrice<=0)throw new Error('Giá sản phẩm không hợp lệ.');
    return{id:`line_${index+1}_${id.slice(-8)}`,productKey:found[0],productId:product.id,variantId:variant?.id||line.variantId,title:cleanText(product.title,160),variantTitle:cleanText(variant?.title||'Default Title',100),sku:cleanText(variant?.sku||product.sku,100),image:cleanText(product.images?.[0],800),quantity:line.quantity,unitPrice,lineTotal:unitPrice*line.quantity};
  });
  const subtotal=lines.reduce((sum,line)=>sum+line.lineTotal,0);
  const baseShipping=subtotal>=settings.shipping.freeShippingThreshold?0:50000;
  const promo=evaluatePromo(discountEntries,payload.discountCode,subtotal,baseShipping);
  const paymentDiscount=evaluateTransferDiscount(settings,method,subtotal);
  const referral=evaluateReferral({settings:referralSettings,payload,customerEntries:firebaseEntries(customersRaw),orderEntries:firebaseEntries(ordersRaw),subtotal,requestContext});
  const referralDiscount=promo.code?0:referral.discountAmount;
  const shippingAmount=Math.max(0,baseShipping-promo.shippingDiscount);
  const discountAmount=Math.min(subtotal,promo.amount+paymentDiscount.amount+referralDiscount);
  const total=subtotal-discountAmount+shippingAmount;
  const address=payload.shippingAddress||{};
  if(!cleanText(payload.customer?.name,120)||!cleanText(payload.customer?.phone,30)||!cleanText(address.address1,180)||!cleanText(address.district,100)||!cleanText(address.city,100))throw new Error('Thiếu thông tin giao hàng bắt buộc.');
  if(method==='bank_transfer'&&!settings.preferred?.accountNumber)throw new Error('Cửa hàng chưa cấu hình số tài khoản nhận chuyển khoản.');
  const now=new Date().toISOString();
  const customerResult=customerFromOrder(firebaseEntries(customersRaw),payload,total);
  const number=orderNumber();
  const transferContent=method==='bank_transfer'?bankTransferContent(lines,number):'';
  const order={
    id,number,createdAt:now,updatedAt:now,customerId:customerResult.customer.id,customerName:cleanText(payload.customer.name,120),customerEmail:cleanText(payload.customer.email,160),customerPhone:cleanText(payload.customer.phone,30),
    shippingAddress:{fullName:cleanText(address.fullName||payload.customer.name,120),phone:cleanText(address.phone||payload.customer.phone,30),email:cleanText(address.email||payload.customer.email,160),address1:cleanText(address.address1,180),address2:cleanText(address.address2,180),ward:cleanText(address.ward,100),district:cleanText(address.district,100),city:cleanText(address.city,100),country:cleanText(address.country||'Việt Nam',80),postalCode:cleanText(address.postalCode,20)},
    lines:lines.map(({productKey,...line})=>line),subtotal,discountCode:promo.code,discountAmount,promotionDiscountAmount:promo.amount,paymentDiscountAmount:paymentDiscount.amount,paymentDiscountLabel:paymentDiscount.label,referralCode:referral.code||undefined,referralDiscountAmount:referralDiscount||0,referralReferrerId:referral.referrerId||undefined,referralFraudScore:referral.code?referral.score:undefined,referralRiskLevel:referral.code?referral.riskLevel:undefined,referralRewardStatus:referral.code?referral.status:undefined,referralRiskSignals:referral.code?referral.signals:undefined,referralDeviceId:referral.code?referral.deviceId:undefined,referralIpHash:referral.code?referral.ipHash:undefined,shippingAmount,taxAmount:0,total,currency:'VND',status:'open',paymentStatus:'pending',fulfillmentStatus:'unfulfilled',paymentMethod:method,paymentProvider:method==='payos'?'payos':undefined,
    ...(method==='bank_transfer'&&settings.preferred?{bankAccountId:settings.preferred.id,bankName:settings.preferred.bankName,bankAccountName:settings.preferred.accountName,bankAccountNumber:settings.preferred.accountNumber,bankTransferContent:transferContent}:{}),
    note:cleanText(payload.note,1000),source:'storefront',
  };
  const updates={};
  updates[`timeforge/orders/${id}`]=order;
  updates[`timeforge/customers/${customerResult.key}`]=customerResult.customer;
  const linesByProduct=new Map();
  for(const line of lines){
    const grouped=linesByProduct.get(line.productKey)||[];
    grouped.push(line);
    linesByProduct.set(line.productKey,grouped);
  }
  for(const[productKey,productLines]of linesByProduct){
    const found=productEntries.find(([key])=>key===productKey);
    if(!found)continue;
    const original=found[1];
    const product=structuredClone(original);
    const quantitiesByVariant=new Map(productLines.map(line=>[line.variantId,line.quantity]));
    const totalQuantity=productLines.reduce((sum,line)=>sum+line.quantity,0);
    product.variants=(Array.isArray(product.variants)?product.variants:[]).map(variant=>{
      const quantity=quantitiesByVariant.get(variant.id)||0;
      return quantity?{...variant,inventory:Math.max(0,Number(variant.inventory||0)-quantity)}:variant;
    });
    product.inventory=Math.max(0,Number(product.inventory||0)-totalQuantity);
    product.updatedAt=now;
    updates[`timeforge/products/${productKey}`]=product;
    for(const line of productLines){
      const before=Number(original.variants?.find(item=>item.id===line.variantId)?.inventory??original.inventory??0);
      const adjustmentId=uid('adjustment');
      updates[`timeforge/inventoryAdjustments/${adjustmentId}`]={id:adjustmentId,productId:line.productId,variantId:line.variantId,sku:line.sku,productTitle:line.title,delta:-line.quantity,before,after:Math.max(0,before-line.quantity),reason:'order',note:`Trừ kho cho ${order.number}`,createdAt:now,referenceId:id};
    }
  }
  if(promo.discount&&promo.key)updates[`timeforge/discounts/${promo.key}`]={...promo.discount,usageCount:Number(promo.discount.usageCount||0)+1};
  await firebaseMultiPatch(updates);
  return order;
}
