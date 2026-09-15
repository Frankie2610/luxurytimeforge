import crypto from 'node:crypto';
import {firebaseEntries,firebaseRead} from './firebase-rest.js';

const cleanText=(value,max=240)=>String(value||'').trim().slice(0,max);
const normalizeIdentity=(value)=>cleanText(value).toLowerCase().replace(/\s+/g,'');
const normalizeAddress=(value)=>cleanText(value,500).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const defaultReferralSettings={enabled:true,requireFirstOrder:true,useEmailAntiFraud:false,requireVerifiedEmail:false,sameIpMode:'review',sameDeviceMode:'block',sameAddressMode:'review',maxReferralsPerDay:5};
const normalizeSettings=(raw)=>({...defaultReferralSettings,...(raw||{}),maxReferralsPerDay:Math.max(1,Number(raw?.maxReferralsPerDay??5))});
const referralCodeForCustomer=(customerId)=>{let hash=2166136261;for(const char of String(customerId||'')){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}return`TF${(hash>>>0).toString(36).toUpperCase().padStart(7,'0').slice(-7)}`};
const hashReferralIp=(ip)=>ip?crypto.createHash('sha256').update(`${process.env.REFERRAL_HASH_SALT||'timeforge-referral'}:${ip}`).digest('hex').slice(0,24):'';

export async function referralConfirmationPreflight({payload,requestContext={}}){
  const code=cleanText(payload?.referralCode,24).toUpperCase();
  if(!code)return{required:false};
  const[customersRaw,ordersRaw,settingsRaw]=await Promise.all([
    firebaseRead('timeforge/customers').catch(()=>({})),
    firebaseRead('timeforge/orders').catch(()=>({})),
    firebaseRead('timeforge/settings/referral').catch(()=>({})),
  ]);
  const settings=normalizeSettings(settingsRaw||{});
  if(!settings.enabled)return{required:true,reason:'Ưu đãi giới thiệu hiện không khả dụng.'};
  const customerEntries=firebaseEntries(customersRaw),orderEntries=firebaseEntries(ordersRaw);
  const referrerEntry=customerEntries.find(([,customer])=>referralCodeForCustomer(customer?.id)===code);
  if(!referrerEntry)return{required:true,reason:'Mã giới thiệu không còn hợp lệ.'};
  const referrer=referrerEntry[1],referrerId=String(referrer.id||referrerEntry[0]);
  const phone=normalizeIdentity(payload?.customer?.phone),email=normalizeIdentity(payload?.customer?.email);
  const refPhone=normalizeIdentity(referrer.phone),refEmail=normalizeIdentity(referrer.email);
  if(phone&&refPhone&&phone===refPhone)return{required:true,reason:'Ưu đãi giới thiệu không áp dụng cho giao dịch này.'};
  if(settings.useEmailAntiFraud&&email&&refEmail&&email===refEmail)return{required:true,reason:'Ưu đãi giới thiệu không áp dụng cho giao dịch này.'};
  const buyerHistory=orderEntries.filter(([,order])=>(phone&&normalizeIdentity(order?.customerPhone)===phone)||(settings.useEmailAntiFraud&&email&&normalizeIdentity(order?.customerEmail)===email));
  if(settings.requireFirstOrder&&buyerHistory.length)return{required:true,reason:'Ưu đãi giới thiệu không áp dụng cho tài khoản này.'};
  const buyerAddress=normalizeAddress(`${payload?.shippingAddress?.address1||''}${payload?.shippingAddress?.address2||''}${payload?.shippingAddress?.ward||''}${payload?.shippingAddress?.district||''}${payload?.shippingAddress?.city||''}`);
  const sameAddress=(Array.isArray(referrer.addresses)?referrer.addresses:[]).some(address=>buyerAddress&&normalizeAddress(`${address.address1||''}${address.address2||''}${address.ward||''}${address.district||''}${address.city||''}`)===buyerAddress);
  if(sameAddress&&settings.sameAddressMode==='block')return{required:true,reason:'Ưu đãi giới thiệu không áp dụng cho giao dịch này.'};
  const device=cleanText(payload?.referralDeviceId,140);
  const ipHash=hashReferralIp(requestContext?.ip);
  const relatedReferralOrders=orderEntries.map(([,order])=>order).filter(order=>order?.referralReferrerId===referrerId);
  if(device&&settings.sameDeviceMode==='block'&&relatedReferralOrders.some(order=>order?.referralDeviceId===device))return{required:true,reason:'Ưu đãi giới thiệu không áp dụng trên thiết bị này.'};
  if(ipHash&&settings.sameIpMode==='block'&&relatedReferralOrders.some(order=>order?.referralIpHash===ipHash))return{required:true,reason:'Ưu đãi giới thiệu không áp dụng cho giao dịch này.'};
  const dayAgo=Date.now()-86400000;
  const recentCount=relatedReferralOrders.filter(order=>new Date(order?.createdAt||0).getTime()>=dayAgo).length;
  if(recentCount>=settings.maxReferralsPerDay)return{required:true,reason:'Ưu đãi giới thiệu hiện không thể áp dụng.'};
  return{required:false};
}
