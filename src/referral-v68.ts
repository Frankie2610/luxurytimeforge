import {firebaseClient} from './firebase';

export type ReferralRewardType='percentage'|'fixed_amount';
export type ReferralSettings={
 enabled:boolean;friendRewardType:ReferralRewardType;friendRewardValue:number;referrerRewardType:ReferralRewardType;referrerRewardValue:number;
 minimumSubtotal:number;rewardDelayDays:number;rewardExpiryDays:number;requireFirstOrder:boolean;useEmailAntiFraud:boolean;requireVerifiedEmail:boolean;
 sameIpMode:'allow'|'review'|'block';sameDeviceMode:'allow'|'review'|'block';sameAddressMode:'allow'|'review'|'block';maxReferralsPerDay:number;
};
export type ReferralAttribution={code:string;referrerId?:string;deviceId:string;capturedAt:string;settingsSnapshot?:ReferralSettings};

export const REFERRAL_SETTINGS_KEY='tf:referral-settings:v1';
export const REFERRAL_ATTRIBUTION_KEY='tf:referral-attribution:v1';
export const REFERRAL_DEVICE_KEY='tf:referral-device:v1';
export const defaultReferralSettings:ReferralSettings={enabled:true,friendRewardType:'percentage',friendRewardValue:10,referrerRewardType:'percentage',referrerRewardValue:10,minimumSubtotal:1000000,rewardDelayDays:7,rewardExpiryDays:60,requireFirstOrder:true,useEmailAntiFraud:false,requireVerifiedEmail:false,sameIpMode:'review',sameDeviceMode:'block',sameAddressMode:'review',maxReferralsPerDay:5};
const safeSettings=(value:Partial<ReferralSettings>|null|undefined):ReferralSettings=>({...defaultReferralSettings,...value,friendRewardValue:Math.max(0,Number(value?.friendRewardValue??defaultReferralSettings.friendRewardValue)),referrerRewardValue:Math.max(0,Number(value?.referrerRewardValue??defaultReferralSettings.referrerRewardValue)),minimumSubtotal:Math.max(0,Number(value?.minimumSubtotal??defaultReferralSettings.minimumSubtotal)),rewardDelayDays:Math.max(0,Number(value?.rewardDelayDays??defaultReferralSettings.rewardDelayDays)),rewardExpiryDays:Math.max(1,Number(value?.rewardExpiryDays??defaultReferralSettings.rewardExpiryDays)),maxReferralsPerDay:Math.max(1,Number(value?.maxReferralsPerDay??defaultReferralSettings.maxReferralsPerDay))});
export function readReferralSettings(){try{return safeSettings(JSON.parse(localStorage.getItem(REFERRAL_SETTINGS_KEY)||'null'))}catch{return defaultReferralSettings}}
export async function loadReferralSettings(){try{const live=await firebaseClient.read<ReferralSettings>('timeforge/settings/referral');const settings=safeSettings(live);localStorage.setItem(REFERRAL_SETTINGS_KEY,JSON.stringify(settings));return settings}catch{return readReferralSettings()}}
export async function saveReferralSettings(settings:ReferralSettings){const next=safeSettings(settings);localStorage.setItem(REFERRAL_SETTINGS_KEY,JSON.stringify(next));if(firebaseClient.enabled)await firebaseClient.write('timeforge/settings/referral',next);return next}
export function referralCodeForCustomer(customerId:string){let hash=2166136261;for(const char of customerId){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}return`TF${(hash>>>0).toString(36).toUpperCase().padStart(7,'0').slice(-7)}`}
export function referralLinkForCustomer(customerId:string,origin=typeof window!=='undefined'?window.location.origin:''){return`${origin}/ref/${referralCodeForCustomer(customerId)}`}
export function referralDeviceId(){let id='';try{id=localStorage.getItem(REFERRAL_DEVICE_KEY)||'';if(!id){id=`dev_${crypto.randomUUID?.()||`${Date.now()}_${Math.random().toString(36).slice(2)}`}`;localStorage.setItem(REFERRAL_DEVICE_KEY,id)}}catch{id=`dev_${Date.now()}_${Math.random().toString(36).slice(2)}`};return id}
export function captureReferral(code:string,settings?:ReferralSettings){const attribution:ReferralAttribution={code:code.trim().toUpperCase(),deviceId:referralDeviceId(),capturedAt:new Date().toISOString(),settingsSnapshot:settings};try{localStorage.setItem(REFERRAL_ATTRIBUTION_KEY,JSON.stringify(attribution))}catch{}return attribution}
export function readReferralAttribution():ReferralAttribution|null{try{const parsed=JSON.parse(localStorage.getItem(REFERRAL_ATTRIBUTION_KEY)||'null') as ReferralAttribution|null;if(!parsed?.code)return null;const age=Date.now()-new Date(parsed.capturedAt).getTime();if(age>30*86400000){localStorage.removeItem(REFERRAL_ATTRIBUTION_KEY);return null}return parsed}catch{return null}}
export function referralFriendDiscount(subtotal:number,settings=readReferralSettings()){if(!settings.enabled||subtotal<settings.minimumSubtotal)return 0;return settings.friendRewardType==='percentage'?Math.min(subtotal,Math.round(subtotal*Math.min(100,settings.friendRewardValue)/100)):Math.min(subtotal,Math.round(settings.friendRewardValue))}
