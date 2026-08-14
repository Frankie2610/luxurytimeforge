import {lazy,Suspense,useEffect,useMemo,useRef,useState} from 'react';
import {ArrowDownRight,ArrowUpRight,Globe2,RotateCcw,ShoppingBag,WalletCards} from 'lucide-react';
import {useCommerce} from './context';
import {readCommerceEvents,readRemoteCommerceEvents} from './commerce-events';
import {useReturns} from './returns-v13';
import {money} from './utils';
import {Surface} from './ui';
import type {AnalyticsDailyV59,AnalyticsFunnelV59,AnalyticsPaymentV59,AnalyticsSourceV59} from './analytics-charts-v59';

const AnalyticsChartsV59=lazy(()=>import('./analytics-charts-v59').then(module=>({default:module.AnalyticsChartsV59})));
const sourceLabel=(source:string)=>({direct:'Trực tiếp',facebook:'Facebook',instagram:'Instagram',tiktok:'TikTok',google:'Google',zalo:'Zalo'}[source]||source);
const localDateKey=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const shortDay=new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit'});
function Metric({label,value,note,icon}:{label:string;value:string;note:string;icon:React.ReactNode}){return <Surface className="v15-metric"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></Surface>}
function DeferredAnalyticsChartsV59({daily,sourceData,funnel,payment}:{daily:AnalyticsDailyV59[];sourceData:AnalyticsSourceV59[];funnel:AnalyticsFunnelV59[];payment:AnalyticsPaymentV59[]}){
 const host=useRef<HTMLDivElement>(null);const[ready,setReady]=useState(false);
 useEffect(()=>{const node=host.current;if(!node||typeof IntersectionObserver==='undefined'){setReady(true);return}const observer=new IntersectionObserver(([entry])=>{if(entry?.isIntersecting){setReady(true);observer.disconnect()}},{rootMargin:'420px 0px'});observer.observe(node);return()=>observer.disconnect()},[]);
 return <div ref={host} className="tf59-analytics-deferred" aria-busy={!ready}>{ready?<Suspense fallback={<div className="tf59-analytics-skeleton"><i/><i/><i/></div>}><AnalyticsChartsV59 daily={daily} sourceData={sourceData} funnel={funnel} payment={payment}/></Suspense>:<div className="tf59-analytics-skeleton"><i/><i/><i/></div>}</div>;
}
export function AnalyticsV15(){
 const{orders}=useCommerce();const{items:returns}=useReturns();const[events,setEvents]=useState(readCommerceEvents);
 useEffect(()=>{let active=true;void readRemoteCommerceEvents(14).then(value=>{if(active)setEvents(value)}).catch(()=>undefined);return()=>{active=false}},[]);
 const validOrders=orders.filter(o=>o.status!=='cancelled');const revenue=validOrders.reduce((s,o)=>s+o.total,0);const returned=returns.filter(r=>!['rejected','closed'].includes(r.status));
 const checkoutStarted=events.filter(e=>e.name==='checkout_started').length;const checkoutCompleted=Math.max(events.filter(e=>e.name==='checkout_completed').length,validOrders.length);const conversion=checkoutStarted?checkoutCompleted/checkoutStarted*100:0;const returnRate=validOrders.length?returned.length/validOrders.length*100:0;
 const daily=useMemo<AnalyticsDailyV59[]>(()=>Array.from({length:14},(_,index)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-(13-index));const key=localDateKey(d);const dayOrders=validOrders.filter(o=>o.createdAt.slice(0,10)===key);return{day:shortDay.format(d),revenue:dayOrders.reduce((s,o)=>s+o.total,0),orders:dayOrders.length}}),[orders]);
 const funnel:AnalyticsFunnelV59[]=[{name:'Xem sản phẩm',value:events.filter(e=>e.name==='product_view').length},{name:'Thêm giỏ',value:events.filter(e=>e.name==='add_to_cart').length},{name:'Bắt đầu checkout',value:checkoutStarted},{name:'Hoàn tất',value:checkoutCompleted}];
 const payment:AnalyticsPaymentV59[]=Object.entries(validOrders.reduce<Record<string,number>>((acc,o)=>({...acc,[o.paymentMethod]:(acc[o.paymentMethod]||0)+1}),{})).map(([name,value])=>({name:name==='cod'?'COD':name==='online'?'Online':'Chuyển khoản',value}));
 const sourceData=useMemo<AnalyticsSourceV59[]>(()=>{
   const bucket=new Map<string,{source:string;sessions:Set<string>;views:number;checkouts:number;orders:number;revenue:number}>();
   events.forEach(event=>{const source=event.attribution?.source||'direct';const current=bucket.get(source)||{source,sessions:new Set<string>(),views:0,checkouts:0,orders:0,revenue:0};current.sessions.add(event.attribution?.sessionId||event.id);if(event.name==='page_view'||event.name==='product_view')current.views+=1;if(event.name==='checkout_started')current.checkouts+=1;if(event.name==='checkout_completed'){current.orders+=1;current.revenue+=Number(event.value||0)}bucket.set(source,current)});
   return [...bucket.values()].map(item=>({name:sourceLabel(item.source),source:item.source,sessions:item.sessions.size,views:item.views,checkouts:item.checkouts,orders:item.orders,revenue:item.revenue,conversion:item.sessions.size?item.orders/item.sessions.size*100:0})).sort((a,b)=>b.orders-a.orders||b.sessions-a.sessions);
 },[events]);
 const topSource=sourceData[0];
 return <div className="v15-analytics"><header className="v15-page-heading"><div><small>COMMERCE INTELLIGENCE</small><h2>Phân tích bán hàng</h2><p>Doanh thu, nguồn chuyển đổi, checkout và chất lượng sau bán hàng trong cùng một màn hình.</p></div></header><div className="v15-metrics v16-analytics-metrics"><Metric label="Doanh thu" value={money(revenue)} note={`${validOrders.length} đơn hợp lệ`} icon={<WalletCards/>}/><Metric label="Chuyển đổi checkout" value={`${conversion.toFixed(1)}%`} note={`${checkoutCompleted}/${checkoutStarted||0} phiên`} icon={conversion>=40?<ArrowUpRight/>:<ArrowDownRight/>}/><Metric label="Giá trị đơn trung bình" value={money(revenue/Math.max(1,validOrders.length))} note="Không gồm đơn đã hủy" icon={<ShoppingBag/>}/><Metric label="Tỷ lệ hoàn/đổi" value={`${returnRate.toFixed(1)}%`} note={`${returned.length} yêu cầu đang ghi nhận`} icon={<RotateCcw/>}/><Metric label="Nguồn nổi bật" value={topSource?.name||'Chưa có dữ liệu'} note={topSource?`${topSource.sessions} phiên · ${topSource.orders} đơn`:'Bắt đầu ghi nhận từ V16'} icon={<Globe2/>}/></div><DeferredAnalyticsChartsV59 daily={daily} sourceData={sourceData} funnel={funnel} payment={payment}/></div>
}
