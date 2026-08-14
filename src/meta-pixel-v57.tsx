import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import type {CommerceEvent} from './commerce-events';
import {loadMarketingSettings} from './integrations';
import type {MetaMarketingSettings} from './types';

type MetaQueueFunction=((...args:unknown[])=>void)&{
  callMethod?:(...args:unknown[])=>void;
  queue:unknown[][];
  loaded:boolean;
  version:string;
};
declare global{interface Window{fbq?:MetaQueueFunction;_fbq?:MetaQueueFunction}}

const PIXEL_SCRIPT_ID='tf-meta-pixel-script';
let activeConfig:MetaMarketingSettings|null=null;
let initializedPixelIds=new Set<string>();
let pixelScriptFallback:number|undefined;
let lastTest:{pixelId:string;createdAt:string}|null=null;

const validPixelId=(value:string)=>/^\d{5,24}$/.test(value);
const installQueue=()=>{
  if(window.fbq)return window.fbq;
  const queue=((...args:unknown[])=>{
    if(queue.callMethod)queue.callMethod(...args);
    else queue.queue.push(args);
  }) as MetaQueueFunction;
  queue.queue=[];queue.loaded=true;queue.version='2.0';
  window.fbq=queue;window._fbq=queue;
  return queue;
};
const loadPixelScript=()=>{
  if(document.getElementById(PIXEL_SCRIPT_ID))return;
  const script=document.createElement('script');
  script.id=PIXEL_SCRIPT_ID;script.async=true;script.src='https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
};
const schedulePixelScript=(immediate=false)=>{
  if(document.getElementById(PIXEL_SCRIPT_ID))return;
  if(immediate){loadPixelScript();return}
  const request=()=>{
    const requestIdle=(window as unknown as {requestIdleCallback?:(callback:()=>void,options?:{timeout:number})=>number}).requestIdleCallback;
    if(requestIdle)requestIdle.call(window,loadPixelScript,{timeout:900});
    else window.setTimeout(loadPixelScript,80);
  };
  if(document.readyState==='complete')request();
  else window.addEventListener('load',request,{once:true});
  if(pixelScriptFallback===undefined)pixelScriptFallback=window.setTimeout(()=>{pixelScriptFallback=undefined;loadPixelScript()},1400);
};

export function configureMetaPixel(settings:MetaMarketingSettings,immediate=false){
  activeConfig=settings.enabled&&validPixelId(settings.pixelId)?settings:null;
  if(!activeConfig)return false;
  const fbq=installQueue();
  schedulePixelScript(immediate);
  if(!initializedPixelIds.has(activeConfig.pixelId)){
    fbq('init',activeConfig.pixelId);
    initializedPixelIds.add(activeConfig.pixelId);
  }
  return true;
}

const contentIds=(event:CommerceEvent)=>{
  const encoded=String(event.metadata?.contentIds||'').split(',').map(value=>value.trim()).filter(Boolean);
  return encoded.length?encoded:event.productId?[event.productId]:[];
};
const eventParameters=(event:CommerceEvent)=>{
  const ids=contentIds(event);
  return{
    ...(ids.length?{content_ids:ids,contents:ids.map(id=>({id,quantity:1})),content_type:'product'}:{}),
    ...(Number.isFinite(event.value)?{value:Number(event.value),currency:'VND'}:{}),
  };
};
const standardEventName=(name:CommerceEvent['name'])=>{
  const names:Partial<Record<CommerceEvent['name'],string>>={
    page_view:'PageView',product_view:'ViewContent',add_to_cart:'AddToCart',checkout_started:'InitiateCheckout',checkout_completed:'Purchase',
  };
  return names[name];
};

export function sendMetaCommerceEvent(event:CommerceEvent){
  if(!activeConfig||!window.fbq)return false;
  const standard=standardEventName(event.name);
  if(standard){
    window.fbq('trackSingle',activeConfig.pixelId,standard,eventParameters(event),{eventID:event.id});
    return true;
  }
  if(event.name==='compare_view'||event.name==='watch_finder_completed'){
    const customName=event.name==='compare_view'?'ProductCompare':'WatchFinderCompleted';
    window.fbq('trackSingleCustom',activeConfig.pixelId,customName,eventParameters(event),{eventID:event.id});
    return true;
  }
  return false;
}

export function MetaMarketingBridge(){
  const adminRoute=useLocation().pathname.startsWith('/admin');
  useEffect(()=>{
    if(adminRoute){activeConfig=null;return}
    let mounted=true;
    const pending:CommerceEvent[]=[];
    const receive=(raw:Event)=>{
      const event=(raw as CustomEvent<CommerceEvent>).detail;
      if(!event)return;
      if(!activeConfig)pending.push(event);
      else sendMetaCommerceEvent(event);
    };
    const refresh=async()=>{
      const settings=await loadMarketingSettings();
      if(!mounted)return;
      if(configureMetaPixel(settings))pending.splice(0).forEach(sendMetaCommerceEvent);
      else pending.length=0;
    };
    window.addEventListener('timeforge:commerce-event',receive);
    window.addEventListener('timeforge:marketing-settings-updated',refresh);
    void refresh();
    return()=>{mounted=false;window.removeEventListener('timeforge:commerce-event',receive);window.removeEventListener('timeforge:marketing-settings-updated',refresh)};
  },[adminRoute]);
  return null;
}

export const metaPixelRuntimeStatus=()=>{
  const test=lastTest;
  return{
    configured:Boolean(activeConfig),
    pixelId:activeConfig?.pixelId||'',
    queueReady:Boolean(window.fbq),
    scriptLoaded:Boolean(document.getElementById(PIXEL_SCRIPT_ID)),
    lastTestAt:test&&test.pixelId===activeConfig?.pixelId?test.createdAt:'',
  };
};

export function sendMetaPixelTestEvent(){
  const event:CommerceEvent={
    id:`test_${Date.now()}`,name:'product_view',createdAt:new Date().toISOString(),productId:'timeforge-test',value:0,path:window.location.pathname,
    attribution:{source:'admin-test',medium:'test',campaign:'pixel-health-check',referrer:'',landingPage:window.location.pathname,sessionId:'admin-test',device:window.innerWidth<=680?'mobile':window.innerWidth<=1100?'tablet':'desktop'},
    metadata:{test:true},
  };
  const sent=sendMetaCommerceEvent(event);
  if(sent&&activeConfig)lastTest={pixelId:activeConfig.pixelId,createdAt:event.createdAt};
  return sent;
}
