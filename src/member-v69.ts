import type {Customer,Discount,Order,Product} from './types';
import {firebaseClient} from './firebase';

export type MemberTierId='member'|'silver'|'gold'|'platinum';
export type MemberTier={id:MemberTierId;label:string;minSpend:number;creditMultiplier:number;holdMinutes:number;couponCodes:string[];benefits:string[]};
export type MemberSettings={enabled:boolean;creditSpendUnit:number;birthdayBoostEnabled:boolean;birthdayMultiplier:number;birthdayMaxOrders:number;fomoEnabled:boolean;lowStockThreshold:number;personalHoldEnabled:boolean;opportunityEnabled:boolean;opportunityHours:number;opportunityCreditMultiplier:number;tiers:MemberTier[];updatedAt:string};
export type MemberProgress={tier:MemberTier;nextTier?:MemberTier;eligibleSpend:number;progress:number;remaining:number};
export type CreditSummary={balance:number;baseCredits:number;tierBonus:number;birthdayBonus:number;campaignBonus:number;eligibleOrders:number;birthdayBoostUsed:boolean};

const KEY='tf.v69.member-settings';
export const defaultMemberSettings:MemberSettings={
  enabled:true,
  creditSpendUnit:10_000,
  birthdayBoostEnabled:true,
  birthdayMultiplier:2,
  birthdayMaxOrders:1,
  fomoEnabled:true,
  lowStockThreshold:3,
  personalHoldEnabled:true,
  opportunityEnabled:true,
  opportunityHours:48,
  opportunityCreditMultiplier:2,
  tiers:[
    {id:'member',label:'Member',minSpend:0,creditMultiplier:1,holdMinutes:30,couponCodes:[],benefits:['TimeForge Vault','Decision Radar','Referral cá nhân']},
    {id:'silver',label:'Silver',minSpend:5_000_000,creditMultiplier:1.1,holdMinutes:45,couponCodes:[],benefits:['Tích Forge Credits nhanh hơn','Ưu tiên hỗ trợ sau mua']},
    {id:'gold',label:'Gold',minSpend:10_000_000,creditMultiplier:1.25,holdMinutes:60,couponCodes:[],benefits:['Tích Forge Credits x1.25','Ưu đãi dịch vụ riêng']},
    {id:'platinum',label:'Platinum',minSpend:20_000_000,creditMultiplier:1.5,holdMinutes:90,couponCodes:[],benefits:['Tích Forge Credits x1.5','Quyền lợi chăm sóc cao nhất']},
  ],
  updatedAt:new Date(0).toISOString(),
};

const tierOrder:MemberTierId[]=['member','silver','gold','platinum'];
const cleanTier=(value:Partial<MemberTier>|undefined,index:number):MemberTier=>{
  const id=tierOrder[index]||'member';
  return{id,label:String(value?.label||id[0].toUpperCase()+id.slice(1)),minSpend:Math.max(0,Number(value?.minSpend)||0),creditMultiplier:Math.max(1,Number(value?.creditMultiplier)||1),holdMinutes:Math.max(10,Math.min(180,Math.floor(Number(value?.holdMinutes)||defaultMemberSettings.tiers[index]?.holdMinutes||30))),couponCodes:Array.isArray(value?.couponCodes)?value!.couponCodes.map(String).map(v=>v.trim().toUpperCase()).filter(Boolean):[],benefits:Array.isArray(value?.benefits)?value!.benefits.map(String).map(v=>v.trim()).filter(Boolean):[]};
};
export function normalizeMemberSettings(value:Partial<MemberSettings>|null|undefined):MemberSettings{
  const raw=Array.isArray(value?.tiers)?value!.tiers:defaultMemberSettings.tiers;
  const tiers=tierOrder.map((_,index)=>cleanTier(raw[index],index));
  tiers[0]={...tiers[0],id:'member',minSpend:0};
  for(let index=1;index<tiers.length;index+=1)tiers[index]={...tiers[index],minSpend:Math.max(tiers[index-1].minSpend,tiers[index].minSpend)};
  return{enabled:value?.enabled!==false,creditSpendUnit:Math.max(1_000,Number(value?.creditSpendUnit)||defaultMemberSettings.creditSpendUnit),birthdayBoostEnabled:value?.birthdayBoostEnabled!==false,birthdayMultiplier:Math.max(1,Number(value?.birthdayMultiplier)||2),birthdayMaxOrders:Math.max(1,Math.floor(Number(value?.birthdayMaxOrders)||1)),fomoEnabled:value?.fomoEnabled!==false,lowStockThreshold:Math.max(1,Math.min(10,Math.floor(Number(value?.lowStockThreshold)||3))),personalHoldEnabled:value?.personalHoldEnabled!==false,opportunityEnabled:value?.opportunityEnabled!==false,opportunityHours:Math.max(1,Math.min(168,Math.floor(Number(value?.opportunityHours)||48))),opportunityCreditMultiplier:Math.max(1,Math.min(5,Number(value?.opportunityCreditMultiplier)||2)),tiers,updatedAt:String(value?.updatedAt||new Date().toISOString())};
}
export function readMemberSettings():MemberSettings{
  if(typeof window==='undefined')return defaultMemberSettings;
  try{return normalizeMemberSettings(JSON.parse(localStorage.getItem(KEY)||'null'))}catch{return defaultMemberSettings}
}
export async function loadMemberSettings():Promise<MemberSettings>{
  const cached=readMemberSettings();
  if(!firebaseClient.enabled)return cached;
  try{const remote=await firebaseClient.read<Partial<MemberSettings>>('timeforge/settings/member');const next=normalizeMemberSettings(remote||cached);localStorage.setItem(KEY,JSON.stringify(next));return next}catch{return cached}
}
export async function saveMemberSettings(settings:MemberSettings){
  const next=normalizeMemberSettings({...settings,updatedAt:new Date().toISOString()});
  if(typeof window!=='undefined')localStorage.setItem(KEY,JSON.stringify(next));
  if(firebaseClient.enabled)await firebaseClient.write('timeforge/settings/member',next);
  return next;
}
export const eligibleMemberOrders=(orders:Order[])=>orders.filter(order=>order.paymentStatus==='paid'&&order.status!=='cancelled'&&order.fulfillmentStatus!=='returned');
export function memberProgress(orders:Order[],settings:MemberSettings):MemberProgress{
  const eligibleSpend=eligibleMemberOrders(orders).reduce((sum,order)=>sum+Math.max(0,order.total),0);
  const tiers=settings.tiers;
  let tier=tiers[0];for(const candidate of tiers)if(eligibleSpend>=candidate.minSpend)tier=candidate;
  const index=tiers.findIndex(item=>item.id===tier.id),nextTier=tiers[index+1];
  const range=nextTier?Math.max(1,nextTier.minSpend-tier.minSpend):1;
  const progress=nextTier?Math.min(100,Math.max(0,((eligibleSpend-tier.minSpend)/range)*100)):100;
  return{tier,nextTier,eligibleSpend,progress,remaining:nextTier?Math.max(0,nextTier.minSpend-eligibleSpend):0};
}
const birthMonth=(customer:Customer)=>{if(!customer.birthDate)return 0;const date=new Date(`${customer.birthDate}T00:00:00`);return Number.isNaN(date.getTime())?0:date.getMonth()+1};
export function memberCredits(customer:Customer,orders:Order[],settings:MemberSettings):CreditSummary{
  const sorted=[...eligibleMemberOrders(orders)].sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  let spendBefore=0,baseCredits=0,tierBonus=0,birthdayBonus=0,campaignBonus=0,birthdayUses=0;
  const month=birthMonth(customer);
  for(const order of sorted){
    const activeTier=settings.tiers.reduce((best,candidate)=>spendBefore>=candidate.minSpend?candidate:best,settings.tiers[0]);
    const base=Math.floor(Math.max(0,order.total)/settings.creditSpendUnit);
    const tierTotal=Math.floor(base*activeTier.creditMultiplier);
    const orderDate=new Date(order.paidAt||order.createdAt);
    const birthdayEligible=settings.birthdayBoostEnabled&&month>0&&orderDate.getMonth()+1===month&&birthdayUses<settings.birthdayMaxOrders;
    const campaignMultiplier=Math.max(1,Number(order.memberCreditMultiplier)||1);
    const birthdayMultiplier=birthdayEligible?settings.birthdayMultiplier:1;
    const appliedMultiplier=Math.max(birthdayMultiplier,campaignMultiplier);
    const finalTotal=Math.floor(tierTotal*appliedMultiplier);
    const extra=Math.max(0,finalTotal-tierTotal);
    baseCredits+=base;tierBonus+=Math.max(0,tierTotal-base);
    if(birthdayEligible&&birthdayMultiplier>=campaignMultiplier){birthdayBonus+=extra;birthdayUses+=1}else campaignBonus+=extra;
    spendBefore+=Math.max(0,order.total);
  }
  return{balance:baseCredits+tierBonus+birthdayBonus+campaignBonus,baseCredits,tierBonus,birthdayBonus,campaignBonus,eligibleOrders:sorted.length,birthdayBoostUsed:birthdayUses>0};
}
export function tierCoupons(discounts:Discount[],progress:MemberProgress,settings:MemberSettings){
  const rank=settings.tiers.findIndex(item=>item.id===progress.tier.id);
  const codes=new Set(settings.tiers.slice(0,rank+1).flatMap(item=>item.couponCodes.map(code=>code.toUpperCase())));
  const now=Date.now();return discounts.filter(item=>codes.has(item.code.toUpperCase())&&item.active&&new Date(item.startsAt).getTime()<=now&&new Date(item.endsAt).getTime()>=now&&(item.usageLimit<=0||item.usageCount<item.usageLimit));
}
export function recommendationScore(product:Product,owned:Product[],savedIds:Set<string>,averagePaid:number){
  if(!product.published||product.status!=='active'||product.inventory<=0||owned.some(item=>item.id===product.id)||savedIds.has(product.id))return-999;
  let score=0;const ownedVendors=new Set(owned.map(item=>item.vendor).filter(Boolean));const ownedTypes=new Set(owned.map(item=>item.productType||item.category).filter(Boolean));
  if(!ownedVendors.has(product.vendor))score+=4;else score+=1;
  if(!ownedTypes.has(product.productType||product.category))score+=3;
  if(averagePaid>0){const ratio=product.price/averagePaid;if(ratio>=.65&&ratio<=1.35)score+=3;else if(ratio>=.45&&ratio<=1.7)score+=1;}
  if(product.inventory<=3)score+=1;
  return score;
}
