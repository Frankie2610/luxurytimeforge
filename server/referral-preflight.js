import crypto from 'node:crypto';
import {firebaseEntries,firebaseRead} from './firebase-rest.js';

const cleanText=(value,max=240)=>String(value||'').trim().slice(0,max);
const normalizeIdentity=(value)=>cleanText(value).toLowerCase().replace(/\s+/g,'');
const normalizeAddress=(value)=>cleanText(value,500).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const defaultReferralSettings={enabled:true,requireFirstOrder:true,useEmailAntiFraud:false,requireVerifiedEmail:false,sameIpMode:'review',sameDeviceMode:'block',sameAddressMode:'review',maxReferralsPerDay:5};
const normalizeSettings=(raw)=>({...defaultReferralSettings,...(raw||{}),maxReferralsPerDay:Math.max(1,Number(raw?.maxReferralsPerDay??5))});
const referralCodeForCustomer=(customerId)=>{let hash=2166136261;for(const char of String(customerId||'')){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}return`TF${(hash>>>0).toString(36).toUpperCase().padStart(7,'0').slice(-7)}`};
const hashReferralIp=(ip)=>ip?crypto.createHash('sha256').update(`${process.env.REFERRAL_HASH_SALT||'timeforge-referral'}:${ip}`).digest('hex').slice(0,24):'';

function cartSubtotal(productsRaw,cart){
  const products=firebaseEntries(productsRaw);
  return(Array.isArray(cart)?cart:[]).reduce((sum,line)=>{
    const found=products.find(([,product])=>String(product?.id||'')===String(line?.productId||''));
    if(!found)return sum;
    const product=found[1];
    const variants=Array.isArray(product?.variants)?product.variants:[];
    const variant=variants.find(item=>String(item?.id||'')===String(line?.variantId||''))||variants[0];
    const price=Math.max(0,Number(variant?.price??product?.price??0));
    const quantity=Math.max(0,Number(line?.quantity||0));
    return sum+price*quantity;
  },0);
}

function invalidDiscountReason(discountEntries,code,subtotal){
  if(!code)return'';
  const found=discountEntries.find(([,item])=>String(item?.code||'').trim().toUpperCase()===code&&item?.active);
  if(!found)return'Mã giảm giá không còn hợp lệ hoặc đã tắt.';
  const discount=found[1],now=Date.now();
  if(discount.startsAt&&new Date(discount.startsAt).getTime()>now)return'Mã giảm giá chưa bắt đầu.';
  if(discount.endsAt&&new Date(discount.endsAt).getTime()<now)return'Mã giảm giá đã hết hạn.';
  if(Number(discount.usageLimit)>0&&Number(discount.usageCount)>=Number(discount.usageLimit))return'Mã giảm giá đã hết lượt sử dụng.';
  if(subtotal<Number(discount.minimumSubtotal||0))return'Mã giảm giá không còn đủ điều kiện áp dụng cho đơn hàng này.';
  return'';
}

function referralBlockReason({payload,settings,customerEntries,orderEntries,requestContext}){
  const code=cleanText(payload?.referralCode,24).toUpperCase();
  if(!code)return'';
  if(!settings.enabled)return'Ưu đãi giới thiệu hiện không khả dụng.';
  const referrerEntry=customerEntries.find(([,customer])=>referralCodeForCustomer(customer?.id)===code);
  if(!referrerEntry)return'Mã giới thiệu không còn hợp lệ.';
  const referrer=referrerEntry[1],referrerId=String(referrer.id||referrerEntry[0]);
  const phone=normalizeIdentity(payload?.customer?.phone),email=normalizeIdentity(payload?.customer?.email);
  const refPhone=normalizeIdentity(referrer.phone),refEmail=normalizeIdentity(referrer.email);
  if(phone&&refPhone&&phone===refPhone)return'Ưu đãi giới thiệu không áp dụng cho giao dịch này.';
  if(settings.useEmailAntiFraud&&email&&refEmail&&email===refEmail)return'Ưu đãi giới thiệu không áp dụng cho giao dịch này.';
  const buyerHistory=orderEntries.filter(([,order])=>(phone&&normalizeIdentity(order?.customerPhone)===phone)||(settings.useEmailAntiFraud&&email&&normalizeIdentity(order?.customerEmail)===email));
  if(settings.requireFirstOrder&&buyerHistory.length)return'Ưu đãi giới thiệu không áp dụng cho khách hàng này.';
  const buyerAddress=normalizeAddress(`${payload?.shippingAddress?.address1||''}${payload?.shippingAddress?.address2||''}${payload?.shippingAddress?.ward||''}${payload?.shippingAddress?.district||''}${payload?.shippingAddress?.city||''}`);
  const sameAddress=(Array.isArray(referrer.addresses)?referrer.addresses:[]).some(address=>buyerAddress&&normalizeAddress(`${address.address1||''}${address.address2||''}${address.ward||''}${address.district||''}${address.city||''}`)===buyerAddress);
  if(sameAddress&&settings.sameAddressMode==='block')return'Ưu đãi giới thiệu không áp dụng cho giao dịch này.';
  const device=cleanText(payload?.referralDeviceId,140),ipHash=hashReferralIp(requestContext?.ip);
  const related=orderEntries.map(([,order])=>order).filter(order=>order?.referralReferrerId===referrerId);
  if(device&&settings.sameDeviceMode==='block'&&related.some(order=>order?.referralDeviceId===device))return'Ưu đãi giới thiệu không áp dụng trên thiết bị này.';
  if(ipHash&&settings.sameIpMode==='block'&&related.some(order=>order?.referralIpHash===ipHash))return'Ưu đãi giới thiệu không áp dụng cho giao dịch này.';
  const dayAgo=Date.now()-86400000;
  if(related.filter(order=>new Date(order?.createdAt||0).getTime()>=dayAgo).length>=settings.maxReferralsPerDay)return'Ưu đãi giới thiệu hiện không thể áp dụng.';
  return'';
}

export async function offerConfirmationPreflight({payload,cart,requestContext={}}){
  const discountCode=cleanText(payload?.discountCode,48).toUpperCase();
  const referralCode=cleanText(payload?.referralCode,24).toUpperCase();
  if(!discountCode&&!referralCode)return{required:false,stripDiscount:false,stripReferral:false,reason:''};
  const[customersRaw,ordersRaw,settingsRaw,discountsRaw,productsRaw]=await Promise.all([
    firebaseRead('timeforge/customers').catch(()=>({})),
    firebaseRead('timeforge/orders').catch(()=>({})),
    firebaseRead('timeforge/settings/referral').catch(()=>({})),
    firebaseRead('timeforge/discounts').catch(()=>({})),
    discountCode?firebaseRead('timeforge/products').catch(()=>({})):Promise.resolve({}),
  ]);
  const subtotal=discountCode?cartSubtotal(productsRaw,cart):0;
  const discountReason=invalidDiscountReason(firebaseEntries(discountsRaw),discountCode,subtotal);
  const referralReason=referralBlockReason({payload,settings:normalizeSettings(settingsRaw||{}),customerEntries:firebaseEntries(customersRaw),orderEntries:firebaseEntries(ordersRaw),requestContext});
  const stripDiscount=Boolean(discountReason),stripReferral=Boolean(referralReason);
  const reasons=[discountReason,referralReason].filter(Boolean);
  return{required:stripDiscount||stripReferral,stripDiscount,stripReferral,reason:reasons.join(' ')};
}
