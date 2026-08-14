export type CommerceEventName=
  |'page_view'|'product_view'|'add_to_cart'|'cart_view'|'checkout_started'|'checkout_completed'
  |'return_requested'|'exchange_requested'|'compare_view'|'watch_finder_completed';
export type CommerceDevice='desktop'|'tablet'|'mobile';
export type CommerceEventRange=number|'all';
export interface CommerceAttribution{
  source:string;
  medium:string;
  campaign:string;
  content?:string;
  term?:string;
  referrer:string;
  landingPage:string;
  sessionId:string;
  device:CommerceDevice;
}
export interface CommerceEvent{
  id:string;
  name:CommerceEventName;
  createdAt:string;
  value?:number;
  productId?:string;
  orderId?:string;
  path?:string;
  attribution:CommerceAttribution;
  metadata?:Record<string,string|number|boolean>;
}

const KEY='tf.v16.commerce-events';
const LEGACY_KEY='tf.v15.commerce-events';
const ATTR_KEY='tf.v16.attribution';
const SESSION_KEY='tf.v16.analytics-session';
const LOCAL_EVENT_LIMIT=600;
const REMOTE_BATCH_LIMIT=12;

const safeStorage=(kind:'local'|'session')=>{try{return kind==='local'?window.localStorage:window.sessionStorage}catch{return undefined}};
const uid=()=>`ses_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
const device=():CommerceDevice=>window.innerWidth<=680?'mobile':window.innerWidth<=1100?'tablet':'desktop';
export const isThemeEditorCommercePreview=()=>{
  try{const params=new URLSearchParams(window.location.search);return window.self!==window.top&&params.get('theme_preview')==='1'&&params.get('tf_editor')==='1'}catch{return false}
};
const sourceFromReferrer=(value:string)=>{try{const host=new URL(value).hostname.toLowerCase();if(!host)return'direct';if(host.includes('facebook')||host.includes('fb.'))return'facebook';if(host.includes('instagram'))return'instagram';if(host.includes('tiktok'))return'tiktok';if(host.includes('google'))return'google';if(host.includes('zalo'))return'zalo';return host.replace(/^www\./,'')}catch{return'direct'}};

export function captureCommerceAttribution():CommerceAttribution{
  if(isThemeEditorCommercePreview())return{source:'theme-editor',medium:'preview',campaign:'',referrer:'',landingPage:`${window.location.pathname}${window.location.search}`,sessionId:'theme-preview',device:device()};
  const session=safeStorage('session');const local=safeStorage('local');
  const params=new URLSearchParams(window.location.search);
  const hasCampaignSignal=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','gclid'].some(key=>params.has(key));
  const existing=session?.getItem(ATTR_KEY);if(existing&&!hasCampaignSignal){try{return JSON.parse(existing) as CommerceAttribution}catch{/* Rebuild malformed session attribution below. */}}
  const ref=document.referrer||'';
  const paidClick=params.has('fbclid')||params.has('gclid');
  const source=params.get('utm_source')||(params.has('fbclid')?'facebook':params.has('gclid')?'google':sourceFromReferrer(ref));
  const medium=params.get('utm_medium')||(paidClick?'paid':source==='direct'?'none':'referral');
  const sessionId=session?.getItem(SESSION_KEY)||uid();session?.setItem(SESSION_KEY,sessionId);
  const data:CommerceAttribution={
    source:source||'direct',medium,campaign:params.get('utm_campaign')||'',content:params.get('utm_content')||'',term:params.get('utm_term')||'',
    referrer:ref,landingPage:`${window.location.pathname}${window.location.search}`,sessionId,device:device(),
  };
  session?.setItem(ATTR_KEY,JSON.stringify(data));
  if(!local?.getItem(ATTR_KEY))local?.setItem(ATTR_KEY,JSON.stringify(data));
  return data;
}

let cachedRaw:string|null=null;
let cachedEvents:CommerceEvent[]|null=null;
let pendingLocalEvents:CommerceEvent[]|null=null;
let localPersistHandle:number|undefined;
let localPersistMode:'idle'|'timeout'|undefined;
const normalizeStoredEvents=(raw:string):CommerceEvent[]=>{
  try{
    const parsed=JSON.parse(raw) as Array<Partial<CommerceEvent>>;
    if(!Array.isArray(parsed))return[];
    return parsed.slice(0,LOCAL_EVENT_LIMIT).filter(item=>Boolean(item?.id&&item?.name&&item?.createdAt)).map(item=>({
      ...item,
      path:item.path||'/',
      attribution:item.attribution||captureCommerceAttribution(),
    } as CommerceEvent));
  }catch{return[]}
};

export function readCommerceEvents():CommerceEvent[]{
  if(pendingLocalEvents)return pendingLocalEvents;
  const local=safeStorage('local');
  const raw=local?.getItem(KEY)||local?.getItem(LEGACY_KEY)||'[]';
  if(cachedEvents&&cachedRaw===raw)return cachedEvents;
  cachedRaw=raw;
  cachedEvents=normalizeStoredEvents(raw);
  return cachedEvents;
}

const flushLocalEvents=()=>{
  if(localPersistHandle!==undefined){
    if(localPersistMode==='idle'&&'cancelIdleCallback'in window)window.cancelIdleCallback(localPersistHandle);
    else window.clearTimeout(localPersistHandle);
  }
  localPersistHandle=undefined;localPersistMode=undefined;
  const items=pendingLocalEvents;if(!items)return;
  pendingLocalEvents=null;
  const serialized=JSON.stringify(items);
  try{safeStorage('local')?.setItem(KEY,serialized)}catch{/* Analytics must never block storefront actions when storage is full. */}
  cachedRaw=serialized;cachedEvents=items;
};
const queueLocalEvents=(items:CommerceEvent[],immediate=false)=>{
  pendingLocalEvents=items;cachedEvents=items;
  if(immediate){flushLocalEvents();return}
  if(localPersistHandle!==undefined)return;
  const requestIdle=(window as unknown as {requestIdleCallback?:(callback:()=>void,options?:{timeout:number})=>number}).requestIdleCallback;
  if(requestIdle){
    localPersistMode='idle';
    localPersistHandle=requestIdle.call(window,flushLocalEvents,{timeout:500});
  }else{
    localPersistMode='timeout';
    localPersistHandle=window.setTimeout(flushLocalEvents,120);
  }
};

export function readRecentCommerceEvents(range:CommerceEventRange=7):CommerceEvent[]{
  if(range==='all')return readCommerceEvents();
  const safeDays=Math.max(1,Math.min(31,Math.round(range)));
  const cutoff=Date.now()-safeDays*86400000;
  return readCommerceEvents().filter(event=>{
    const timestamp=new Date(event.createdAt).getTime();
    return Number.isFinite(timestamp)&&timestamp>=cutoff;
  });
}

let remoteQueue:CommerceEvent[]=[];
let remoteTimer:number|undefined;
let lifecycleBound=false;
const postRemoteBatch=(events:CommerceEvent[],beacon=false)=>{
  if(!events.length||typeof window==='undefined'||!/^https?:$/.test(window.location.protocol))return;
  const body=JSON.stringify({events});
  if(beacon&&navigator.sendBeacon){
    navigator.sendBeacon('/api/analytics/events',new Blob([body],{type:'application/json'}));
    return;
  }
  void fetch('/api/analytics/events',{method:'POST',headers:{'Content-Type':'application/json'},body,credentials:'same-origin',keepalive:true}).catch(()=>undefined);
};
const flushRemoteQueue=(beacon=false)=>{
  if(remoteTimer!==undefined){window.clearTimeout(remoteTimer);remoteTimer=undefined}
  const batch=remoteQueue.splice(0,REMOTE_BATCH_LIMIT);
  postRemoteBatch(batch,beacon);
  if(remoteQueue.length&&!beacon)remoteTimer=window.setTimeout(()=>flushRemoteQueue(),900);
};
const queueRemoteEvent=(event:CommerceEvent)=>{
  remoteQueue.push(event);
  if(!lifecycleBound){
    lifecycleBound=true;
    window.addEventListener('pagehide',()=>flushRemoteQueue(true));
  }
  if(event.name==='checkout_completed'||remoteQueue.length>=REMOTE_BATCH_LIMIT)flushRemoteQueue();
  else if(remoteTimer===undefined)remoteTimer=window.setTimeout(()=>flushRemoteQueue(),1200);
};

export function trackCommerceEvent(name:CommerceEventName,payload:Omit<CommerceEvent,'id'|'name'|'createdAt'|'attribution'|'path'>={}){
  if(isThemeEditorCommercePreview())return undefined;
  const attribution=captureCommerceAttribution();const path=`${window.location.pathname}${window.location.search}`;const current=readCommerceEvents();const latest=current[0];
  if(latest&&latest.name===name&&latest.path===path&&Date.now()-new Date(latest.createdAt).getTime()<700)return latest;
  const next:CommerceEvent={id:`evt_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,name,createdAt:new Date().toISOString(),path,attribution:{...attribution,device:device()},...payload};
  const items=[next,...current].slice(0,LOCAL_EVENT_LIMIT);
  queueLocalEvents(items,name==='checkout_completed');
  window.dispatchEvent(new CustomEvent('timeforge:commerce-event',{detail:next}));
  queueRemoteEvent(next);
  return next;
}

const dateKey=(date:Date)=>date.toISOString().slice(0,10);
export interface CommerceEventSnapshot{events:CommerceEvent[];source:'firebase'|'local';remoteCount:number;localOnlyCount:number}
export async function readCommerceEventSnapshot(range:CommerceEventRange=7):Promise<CommerceEventSnapshot>{
  const allTime=range==='all';
  const safeDays=allTime?0:Math.max(1,Math.min(31,Math.round(range)));
  const{firebaseClient}=await import('./firebase');
  const localEvents=readRecentCommerceEvents(range);
  if(!firebaseClient.enabled)return{events:localEvents,source:'local',remoteCount:0,localOnlyCount:localEvents.length};
  const remote=new Map<string,CommerceEvent>();
  if(allTime){
    // The potentially larger root read only runs after the Admin explicitly selects All time.
    const buckets=await firebaseClient.read<Record<string,Record<string,CommerceEvent>>>('timeforge/analyticsEvents');
    Object.values(buckets||{}).forEach(bucket=>Object.values(bucket||{}).forEach(event=>{if(event?.id&&event?.name)remote.set(event.id,event)}));
  }else{
    // Read an extra UTC bucket, then enforce the exact rolling cutoff.
    const keys=Array.from({length:safeDays+1},(_,index)=>dateKey(new Date(Date.now()-index*86400000)));
    const results=await Promise.allSettled(keys.map(key=>firebaseClient.read<Record<string,CommerceEvent>>(`timeforge/analyticsEvents/${key}`)));
    if(!results.some(result=>result.status==='fulfilled'))throw(results[0] as PromiseRejectedResult)?.reason||new Error('Không thể đọc analytics từ Firebase.');
    results.forEach(result=>{if(result.status!=='fulfilled'||!result.value)return;Object.values(result.value).forEach(event=>{if(event?.id&&event?.name)remote.set(event.id,event)})});
  }
  const cutoff=Date.now()-safeDays*86400000;
  const recentRemote=allTime?[...remote.values()]:[...remote.values()].filter(event=>{
    const timestamp=new Date(event.createdAt).getTime();
    return Number.isFinite(timestamp)&&timestamp>=cutoff;
  });
  const merged=new Map(recentRemote.map(event=>[event.id,event]));
  localEvents.forEach(event=>merged.set(event.id,event));
  return{
    events:[...merged.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),
    source:'firebase',remoteCount:recentRemote.length,
    localOnlyCount:localEvents.filter(event=>!remote.has(event.id)).length,
  };
}
export async function readRemoteCommerceEvents(range:CommerceEventRange=7):Promise<CommerceEvent[]>{return(await readCommerceEventSnapshot(range)).events}

if(typeof window!=='undefined'){
  window.addEventListener('pagehide',flushLocalEvents);
  window.addEventListener('storage',(event)=>{if(event.key===KEY||event.key===LEGACY_KEY){cachedRaw=null;cachedEvents=null;pendingLocalEvents=null}});
}
