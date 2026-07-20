export type CommerceEventName='page_view'|'product_view'|'add_to_cart'|'cart_view'|'checkout_started'|'checkout_completed'|'return_requested'|'exchange_requested';
export type CommerceDevice='desktop'|'tablet'|'mobile';
export interface CommerceAttribution{source:string;medium:string;campaign:string;referrer:string;landingPage:string;sessionId:string;device:CommerceDevice}
export interface CommerceEvent{id:string;name:CommerceEventName;createdAt:string;value?:number;productId?:string;orderId?:string;path?:string;attribution:CommerceAttribution;metadata?:Record<string,string|number|boolean>}
const KEY='tf.v16.commerce-events';
const LEGACY_KEY='tf.v15.commerce-events';
const ATTR_KEY='tf.v16.attribution';
const SESSION_KEY='tf.v16.analytics-session';
const safeStorage=(kind:'local'|'session')=>{try{return kind==='local'?window.localStorage:window.sessionStorage}catch{return undefined}};
const uid=()=>`ses_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
const device=():CommerceDevice=>window.innerWidth<=680?'mobile':window.innerWidth<=1100?'tablet':'desktop';
const sourceFromReferrer=(value:string)=>{try{const host=new URL(value).hostname.toLowerCase();if(!host)return'direct';if(host.includes('facebook')||host.includes('fb.'))return'facebook';if(host.includes('instagram'))return'instagram';if(host.includes('tiktok'))return'tiktok';if(host.includes('google'))return'google';if(host.includes('zalo'))return'zalo';return host.replace(/^www\./,'')}catch{return'direct'}};
export function captureCommerceAttribution():CommerceAttribution{
 const session=safeStorage('session');const local=safeStorage('local');
 const existing=session?.getItem(ATTR_KEY);if(existing){try{return JSON.parse(existing) as CommerceAttribution}catch{}}
 const params=new URLSearchParams(window.location.search);const ref=document.referrer||'';
 const source=params.get('utm_source')||params.has('fbclid')?'facebook':params.has('gclid')?'google':sourceFromReferrer(ref);
 const correctedSource=params.get('utm_source')||(params.has('fbclid')?'facebook':params.has('gclid')?'google':sourceFromReferrer(ref));
 const medium=params.get('utm_medium')||(params.has('fbclid')||params.has('gclid')?'paid':'direct'===correctedSource?'none':'referral');
 const sessionId=session?.getItem(SESSION_KEY)||uid();session?.setItem(SESSION_KEY,sessionId);
 const data:CommerceAttribution={source:correctedSource||source||'direct',medium,campaign:params.get('utm_campaign')||'',referrer:ref,landingPage:`${window.location.pathname}${window.location.search}`,sessionId,device:device()};
 session?.setItem(ATTR_KEY,JSON.stringify(data));
 if(!local?.getItem(ATTR_KEY))local?.setItem(ATTR_KEY,JSON.stringify(data));
 return data;
}
export function readCommerceEvents():CommerceEvent[]{try{const local=safeStorage('local');const raw=local?.getItem(KEY)||local?.getItem(LEGACY_KEY)||'[]';const parsed=JSON.parse(raw) as Array<Partial<CommerceEvent>>;return parsed.map(item=>({...item,attribution:item.attribution||captureCommerceAttribution(),path:item.path||'/'} as CommerceEvent))}catch{return[]}}
export function trackCommerceEvent(name:CommerceEventName,payload:Omit<CommerceEvent,'id'|'name'|'createdAt'|'attribution'|'path'>={}){
 const local=safeStorage('local');const attribution=captureCommerceAttribution();const path=`${window.location.pathname}${window.location.search}`;const current=readCommerceEvents();const latest=current[0];
 if(latest&&latest.name===name&&latest.path===path&&Date.now()-new Date(latest.createdAt).getTime()<700)return latest;
 const next:CommerceEvent={id:`evt_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,name,createdAt:new Date().toISOString(),path,attribution:{...attribution,device:device()},...payload};
 const items=[next,...current].slice(0,2500);local?.setItem(KEY,JSON.stringify(items));window.dispatchEvent(new CustomEvent('timeforge:commerce-event',{detail:next}));return next;
}
