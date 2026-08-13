import {firebaseMultiPatch} from '../../server/firebase-rest.js';

const allowedEvents=new Set([
  'page_view','product_view','add_to_cart','cart_view','checkout_started','checkout_completed',
  'return_requested','exchange_requested','compare_view','watch_finder_completed',
]);
const clean=(value,max=160)=>String(value||'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,max);
const cleanPath=(value)=>{
  const text=clean(value,500);
  try{return new URL(text,'https://timeforge.invalid').pathname.slice(0,320)||'/'}catch{return text.split('?')[0].slice(0,320)||'/'}
};
const referrerHost=(value)=>{try{return new URL(String(value||'')).hostname.slice(0,180)}catch{return''}};
const safeMetadata=(input)=>{
  if(!input||typeof input!=='object'||Array.isArray(input))return undefined;
  const entries=Object.entries(input).slice(0,12).flatMap(([key,value])=>{
    const safeKey=clean(key,48).replace(/[^a-zA-Z0-9_-]/g,'');
    if(!safeKey||!['string','number','boolean'].includes(typeof value))return[];
    return[[safeKey,typeof value==='string'?clean(value,240):value]];
  });
  return entries.length?Object.fromEntries(entries):undefined;
};
const normalizeEvent=(input,now)=>{
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  const id=clean(input.id,80).replace(/[^a-zA-Z0-9_-]/g,'');
  const name=clean(input.name,40);
  const timestamp=Date.parse(String(input.createdAt||''));
  if(!id||!allowedEvents.has(name)||!Number.isFinite(timestamp))return null;
  if(timestamp>now+2*86400000||timestamp<now-45*86400000)return null;
  const value=Number(input.value);
  const attribution=input.attribution&&typeof input.attribution==='object'?input.attribution:{};
  return{
    id,name,createdAt:new Date(timestamp).toISOString(),
    ...(Number.isFinite(value)&&value>=0&&value<=1_000_000_000_000?{value}:{}),
    ...(input.productId?{productId:clean(input.productId,100)}:{}),
    ...(input.orderId?{orderId:clean(input.orderId,100)}:{}),
    path:cleanPath(input.path),
    attribution:{
      source:clean(attribution.source,80)||'direct',medium:clean(attribution.medium,80)||'none',campaign:clean(attribution.campaign,160),
      content:clean(attribution.content,160),term:clean(attribution.term,160),referrer:referrerHost(attribution.referrer),
      landingPage:cleanPath(attribution.landingPage),sessionId:clean(attribution.sessionId,100),
      device:['desktop','tablet','mobile'].includes(attribution.device)?attribution.device:'desktop',
    },
    ...(safeMetadata(input.metadata)?{metadata:safeMetadata(input.metadata)}:{}),
  };
};
const requestIsSameOrigin=(req)=>{
  const origin=String(req.headers.origin||'').trim();
  if(!origin)return true;
  const forwarded=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim();
  try{return new URL(origin).host===forwarded}catch{return false}
};

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({message:'Method not allowed'});
  if(!requestIsSameOrigin(req))return res.status(403).json({message:'Origin không hợp lệ.'});
  let body={};
  try{body=typeof req.body==='string'?JSON.parse(req.body||'{}'):req.body||{}}catch{return res.status(400).json({message:'JSON không hợp lệ.'})}
  if(JSON.stringify(body).length>60_000)return res.status(413).json({message:'Payload quá lớn.'});
  const incoming=Array.isArray(body.events)?body.events.slice(0,12):[];
  const now=Date.now();
  const events=incoming.map(item=>normalizeEvent(item,now)).filter(Boolean);
  if(!events.length)return res.status(400).json({message:'Không có sự kiện hợp lệ.'});
  const updates=Object.fromEntries(events.map(event=>[`timeforge/analyticsEvents/${event.createdAt.slice(0,10)}/${event.id}`,event]));
  try{
    await firebaseMultiPatch(updates);
    return res.status(202).json({accepted:events.length});
  }catch(error){
    const message=error instanceof Error?error.message:'Không thể ghi nhận analytics.';
    const config=/credentials are not configured/i.test(message);
    return res.status(config?501:500).json({message:config?'Analytics phía server chưa được cấu hình.':'Không thể ghi nhận analytics.'});
  }
}
