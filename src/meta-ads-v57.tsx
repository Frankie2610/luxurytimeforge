import {useEffect,useMemo,useRef,useState} from 'react';
import {Activity,BadgePercent,BarChart3,CheckCircle2,ChevronDown,ChevronUp,Copy,Database,Download,ExternalLink,FileWarning,Funnel,Globe2,Link2,Megaphone,MousePointerClick,PackageCheck,RefreshCw,Save,Search,Settings2,ShieldCheck,ShoppingBag,TriangleAlert} from 'lucide-react';
import {toast} from 'sonner';
import {readCommerceEvents,readCommerceEventSnapshot,readRecentCommerceEvents,type CommerceEvent,type CommerceEventName,type CommerceEventRange,type CommerceEventSnapshot} from './commerce-events';
import {defaultMetaMarketingSettings,loadMarketingSettings,saveMarketingSettings} from './integrations';
import {configureMetaPixel,metaPixelRuntimeStatus,sendMetaPixelTestEvent} from './meta-pixel-v57';
import {useCommerce} from './context';
import {productImage,SmartImage} from './image-utils';
import type {MetaMarketingSettings,Product} from './types';
import {money} from './utils';
import './v570-meta-ads.css';
import './v571-meta-admin.css';
import './v572-meta-admin.css';
import './v573-meta-admin.css';

const eventDefinitions:Array<{name:CommerceEventName;label:string;meta:string}>=[
  {name:'page_view',label:'PageView',meta:'Lượt xem trang'},
  {name:'product_view',label:'ViewContent',meta:'Xem chi tiết sản phẩm'},
  {name:'add_to_cart',label:'AddToCart',meta:'Thêm vào giỏ'},
  {name:'checkout_started',label:'InitiateCheckout',meta:'Bắt đầu thanh toán'},
  {name:'checkout_completed',label:'Purchase',meta:'Hoàn tất đơn hàng'},
];
const eventLabel=new Map(eventDefinitions.map(item=>[item.name,item.label]));
const siteRoot=(value:string)=>{try{const url=new URL(value||window.location.origin);if(!['http:','https:'].includes(url.protocol)||!url.host)return window.location.origin;return`${url.protocol}//${url.host}`.replace(/\/$/,'')}catch{return window.location.origin}};
const csvCell=(value:unknown)=>`"${String(value??'').replaceAll('"','""')}"`;
const download=(name:string,content:string,type:string)=>{const url=URL.createObjectURL(new Blob([content],{type}));const link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000)};
const campaignName=(event:CommerceEvent)=>event.attribution?.campaign||'(không có utm_campaign)';
const sessionKey=(event:CommerceEvent)=>event.attribution?.sessionId||event.id;
const isMetaAttributed=(event:CommerceEvent)=>{
  const source=String(event.attribution?.source||'').trim().toLowerCase();
  const referrer=String(event.attribution?.referrer||'').toLowerCase();
  return['facebook','instagram','meta','fb'].includes(source)||referrer.includes('facebook.com')||referrer.includes('instagram.com');
};
const dateTime=(value:string)=>new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value));
const catalogDescription=(product:Product)=>String(product.descriptionText||product.descriptionHtml.replace(/<[^>]+>/g,' ')||product.title).replace(/\s+/g,' ').trim().slice(0,5000);
const publicAsset=(root:string,value:string)=>{try{const url=new URL(value,root);return['http:','https:'].includes(url.protocol)?url.toString():''}catch{return''}};
type CatalogIssueFilterV573='all'|'media'|'identity'|'pricing'|'content'|'stock';
const catalogIssueGroupV573=(kind:string):CatalogIssueFilterV573=>kind==='image'?'media':['sku','duplicate','handle'].includes(kind)?'identity':kind==='price'?'pricing':kind==='description'?'content':'stock';

export function MetaAdsV57(){
  const{products,discounts}=useCommerce();
  const[settings,setSettings]=useState<MetaMarketingSettings>(defaultMetaMarketingSettings);
  const[loadingSettings,setLoadingSettings]=useState(true);
  const[saving,setSaving]=useState(false);
  const[dirty,setDirty]=useState(false);
  const[events,setEvents]=useState<CommerceEvent[]>(readCommerceEvents);
  const[eventsLoading,setEventsLoading]=useState(true);
  const[eventStorage,setEventStorage]=useState<Pick<CommerceEventSnapshot,'source'|'remoteCount'|'localOnlyCount'>>({source:'local',remoteCount:0,localOnlyCount:readCommerceEvents().length});
  const[rangeDays,setRangeDays]=useState<7|14|30|'all'>(7);
  const[eventScope,setEventScope]=useState<'all'|'meta'>('all');
  const[eventFilter,setEventFilter]=useState<'all'|CommerceEventName>('all');
  const[eventQuery,setEventQuery]=useState('');
  const[eventLimit,setEventLimit]=useState(5);
  const[catalogOpen,setCatalogOpen]=useState(false);
  const[catalogFilter,setCatalogFilter]=useState<CatalogIssueFilterV573>('all');
  const[catalogQuery,setCatalogQuery]=useState('');
  const eventRequestRef=useRef(0);
  const[runtimeTick,setRuntimeTick]=useState(0);
  const[path,setPath]=useState('/collections');
  const[campaign,setCampaign]=useState('meta_prospecting');
  const[content,setContent]=useState('carousel_01');
  const[adProductId,setAdProductId]=useState('');
  const[promoCode,setPromoCode]=useState('');

  const loadEvents=async(range:CommerceEventRange=rangeDays)=>{
    const requestId=++eventRequestRef.current;setEventsLoading(true);
    try{
      const snapshot=await readCommerceEventSnapshot(range);
      if(requestId!==eventRequestRef.current)return;
      setEvents(snapshot.events);setEventStorage(snapshot);
    }catch{
      if(requestId!==eventRequestRef.current)return;
      const local=readRecentCommerceEvents(range);setEvents(local);setEventStorage({source:'local',remoteCount:0,localOnlyCount:local.length});toast.info('Đang hiển thị dữ liệu trên trình duyệt này');
    }finally{if(requestId===eventRequestRef.current)setEventsLoading(false)}
  };
  useEffect(()=>{void loadMarketingSettings().then(value=>{setSettings(value);setLoadingSettings(false)})},[]);
  useEffect(()=>{void loadEvents(rangeDays)},[rangeDays]);
  const patch=(value:Partial<MetaMarketingSettings>)=>{setSettings(current=>({...current,...value}));setDirty(true)};
  const runtime=useMemo(()=>metaPixelRuntimeStatus(),[runtimeTick,settings.enabled,settings.pixelId]);
  const metaEvents=useMemo(()=>events.filter(isMetaAttributed),[events]);
  const scopedEvents=eventScope==='meta'?metaEvents:events;
  const counts=useMemo(()=>Object.fromEntries(eventDefinitions.map(item=>[item.name,scopedEvents.filter(event=>event.name===item.name).length])) as Record<CommerceEventName,number>,[scopedEvents]);
  const rangeLabel=rangeDays==='all'?'toàn thời gian':`${rangeDays} ngày`;
  const funnelSteps=useMemo(()=>eventDefinitions.map((item,index)=>{
    const total=counts[item.name]||0;
    const previous=index?counts[eventDefinitions[index-1].name]||0:total;
    const rate=index===0?'Điểm vào':previous?`${(total/previous*100).toFixed(1)}% từ bước trước`:'Chưa đủ dữ liệu';
    return{...item,total,rate};
  }),[counts]);
  const funnelInsight=useMemo(()=>{
    const candidates=eventDefinitions.slice(1).map((item,index)=>{
      const previous=counts[eventDefinitions[index].name]||0;
      const total=counts[item.name]||0;
      return previous?{from:eventDefinitions[index].label,to:item.label,rate:total/previous,drop:Math.max(0,previous-total),step:index+1}:null;
    }).filter((item):item is NonNullable<typeof item>=>Boolean(item));
    const weakest=candidates.sort((a,b)=>a.rate-b.rate)[0];
    if(!weakest)return null;
    const actions=['Kiểm tra tốc độ landing page và liên kết sản phẩm.','Làm rõ CTA, giá và lý do mua trên trang sản phẩm.','Giảm ma sát ở giỏ hàng và giữ nút thanh toán dễ thấy.','Rà phương thức thanh toán, lỗi form và tín hiệu tin cậy.'];
    return{...weakest,action:actions[Math.max(0,weakest.step-1)]};
  },[counts]);
  const purchases=metaEvents.filter(event=>event.name==='checkout_completed').length;
  const revenue=metaEvents.filter(event=>event.name==='checkout_completed').reduce((sum,event)=>sum+Number(event.value||0),0);
  const metaSessions=new Set(metaEvents.map(sessionKey)).size;
  const scopedSessions=new Set(scopedEvents.map(sessionKey)).size;
  const addToCarts=metaEvents.filter(event=>event.name==='add_to_cart').length;
  const save=async()=>{
    if(settings.enabled&&!/^\d{5,24}$/.test(settings.pixelId)){toast.error('Pixel ID chỉ gồm 5–24 chữ số');return}
    setSaving(true);
    try{
      const normalized=await saveMarketingSettings({...settings,siteUrl:siteRoot(settings.siteUrl)});
      setSettings(normalized);setDirty(false);
      window.dispatchEvent(new Event('timeforge:marketing-settings-updated'));
      window.setTimeout(()=>setRuntimeTick(value=>value+1),500);
      toast.success('Đã lưu cấu hình Meta Ads');
    }catch(error){toast.error(error instanceof Error?error.message:'Không thể lưu cấu hình Meta Ads')}finally{setSaving(false)}
  };
  const testPixel=()=>{if(dirty){toast.error('Lưu cấu hình trước khi gửi event thử.');return}if(configureMetaPixel(settings,true)&&sendMetaPixelTestEvent()){setRuntimeTick(value=>value+1);toast.success('Đã gửi ViewContent thử nghiệm. Kiểm tra Test Events trong Meta.')}else toast.error('Hãy bật Pixel, nhập Pixel ID và lưu trước khi thử.')};
  const activeProducts=useMemo(()=>products.filter(product=>product.status==='active'&&product.published),[products]);
  const activeDiscounts=useMemo(()=>discounts.filter(item=>{
    const now=Date.now();
    return item.active&&(!item.startsAt||new Date(item.startsAt).getTime()<=now)&&(!item.endsAt||new Date(item.endsAt).getTime()>=now)&&(item.usageLimit<=0||item.usageCount<item.usageLimit);
  }).sort((a,b)=>a.code.localeCompare(b.code)),[discounts]);
  const adProduct=useMemo(()=>activeProducts.find(product=>product.id===adProductId)||null,[activeProducts,adProductId]);
  const targetUrl=useMemo(()=>{
    const root=siteRoot(settings.siteUrl);
    let url:URL;
    try{url=new URL(path||'/',root)}catch{url=new URL('/',root)}
    url.searchParams.set('utm_source',settings.defaultSource||'facebook');
    url.searchParams.set('utm_medium',settings.defaultMedium||'paid_social');
    if(campaign.trim())url.searchParams.set('utm_campaign',campaign.trim());
    if(content.trim())url.searchParams.set('utm_content',content.trim());
    if(promoCode.trim())url.searchParams.set('discount',promoCode.trim().toUpperCase());
    return url.toString();
  },[campaign,content,path,promoCode,settings.defaultMedium,settings.defaultSource,settings.siteUrl]);
  const copyLink=async()=>{try{await navigator.clipboard.writeText(targetUrl);toast.success('Đã sao chép link quảng cáo')}catch{window.prompt('Sao chép liên kết',targetUrl)}};

  const campaignRows=useMemo(()=>{
    const groups=new Map<string,{campaign:string;sessions:Set<string>;views:number;adds:number;checkouts:number;purchases:number;revenue:number}>();
    metaEvents.forEach(event=>{
      const name=campaignName(event);const row=groups.get(name)||{campaign:name,sessions:new Set<string>(),views:0,adds:0,checkouts:0,purchases:0,revenue:0};
      row.sessions.add(sessionKey(event));
      if(event.name==='product_view')row.views+=1;
      if(event.name==='add_to_cart')row.adds+=1;
      if(event.name==='checkout_started')row.checkouts+=1;
      if(event.name==='checkout_completed'){row.purchases+=1;row.revenue+=Number(event.value||0)}
      groups.set(name,row);
    });
    return[...groups.values()].sort((a,b)=>b.purchases-a.purchases||b.checkouts-a.checkouts||b.sessions.size-a.sessions.size);
  },[metaEvents]);

  const catalogIssues=useMemo(()=>{
    const duplicateSkus=new Map<string,number>();
    activeProducts.forEach(product=>{const sku=product.sku.trim().toUpperCase();if(sku)duplicateSkus.set(sku,(duplicateSkus.get(sku)||0)+1)});
    const root=siteRoot(settings.siteUrl);
    return activeProducts.flatMap(product=>{
      const issues:Array<{productId:string;sku:string;title:string;kind:string;label:string}>=[];
      const add=(kind:string,label:string)=>issues.push({productId:product.id,sku:product.sku||'—',title:product.title,kind,label});
      const image=productImage(product);
      if(!publicAsset(root,image)||image.startsWith('data:'))add('image','Thiếu URL ảnh công khai');
      if(!product.sku.trim())add('sku','Thiếu mã SKU');
      if(product.sku.trim()&&(duplicateSkus.get(product.sku.trim().toUpperCase())||0)>1)add('duplicate','Trùng mã SKU');
      if(!product.handle.trim())add('handle','Thiếu handle');
      if(!Number.isFinite(product.price)||product.price<=0)add('price','Giá bán không hợp lệ');
      if(!String(product.descriptionText||product.descriptionHtml||'').replace(/<[^>]+>/g,' ').trim())add('description','Thiếu mô tả');
      if(product.inventory<=0)add('stock','Hết hàng');
      return issues;
    });
  },[activeProducts,settings.siteUrl]);
  const catalogIssueProducts=new Set(catalogIssues.map(item=>item.productId)).size;
  const missingCatalogImages=new Set(catalogIssues.filter(item=>item.kind==='image').map(item=>item.productId)).size;
  const outOfStockProducts=new Set(catalogIssues.filter(item=>item.kind==='stock').map(item=>item.productId)).size;
  const normalizedCatalogQuery=catalogQuery.trim().toLocaleLowerCase('vi');
  const filteredCatalogIssues=useMemo(()=>catalogIssues.filter(item=>{
    if(catalogFilter!=='all'&&catalogIssueGroupV573(item.kind)!==catalogFilter)return false;
    if(!normalizedCatalogQuery)return true;
    return[item.sku,item.title,item.label].some(value=>String(value||'').toLocaleLowerCase('vi').includes(normalizedCatalogQuery));
  }),[catalogFilter,catalogIssues,normalizedCatalogQuery]);
  const exportCatalog=()=>{
    const root=siteRoot(settings.siteUrl);
    const headers=['id','title','description','availability','condition','price','sale_price','link','image_link','brand','google_product_category'];
    const rows=activeProducts.map(product=>{
      const onSale=product.compareAtPrice>product.price;
      return[
        product.id,product.title,catalogDescription(product),product.inventory>0?'in stock':'out of stock','new',
        `${Math.round(onSale?product.compareAtPrice:product.price)} VND`,onSale?`${Math.round(product.price)} VND`:'',
        `${root}/products/${encodeURIComponent(product.handle)}`,publicAsset(root,productImage(product)),product.vendor,'Apparel & Accessories > Jewelry > Watches',
      ];
    });
    const csv=`\uFEFF${[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n')}`;
    download(`timeforge-meta-catalog-${new Date().toISOString().slice(0,10)}.csv`,csv,'text/csv;charset=utf-8');
    toast.success(`Đã xuất ${rows.length} sản phẩm cho Meta Catalog`);
  };
  const exportCatalogIssues=()=>{
    const headers=['product_id','sku','title','issue_type','issue'];
    const rows=filteredCatalogIssues.map(item=>[item.productId,item.sku,item.title,item.kind,item.label]);
    download(`timeforge-catalog-health-${new Date().toISOString().slice(0,10)}.csv`,`\uFEFF${[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n')}`,'text/csv;charset=utf-8');
    toast.success(`Đã xuất ${rows.length} lỗi/cảnh báo đang lọc`);
  };
  const normalizedQuery=eventQuery.trim().toLocaleLowerCase('vi');
  const filteredEvents=useMemo(()=>scopedEvents.filter(event=>{
    if(eventFilter!=='all'&&event.name!==eventFilter)return false;
    if(!normalizedQuery)return true;
    return[eventLabel.get(event.name)||event.name,event.path,event.attribution?.source,event.attribution?.campaign,event.productId,event.orderId].some(value=>String(value||'').toLocaleLowerCase('vi').includes(normalizedQuery));
  }),[eventFilter,normalizedQuery,scopedEvents]);
  const visibleEvents=filteredEvents.slice(0,eventLimit);
  useEffect(()=>setEventLimit(5),[eventFilter,eventScope,normalizedQuery,rangeDays]);
  const exportEvents=()=>{
    const headers=['time','event','path','source','medium','campaign','session','product_id','order_id','value'];
    const rows=filteredEvents.map(event=>[event.createdAt,eventLabel.get(event.name)||event.name,event.path,event.attribution?.source,event.attribution?.medium,event.attribution?.campaign,event.attribution?.sessionId,event.productId,event.orderId,event.value||'']);
    download(`timeforge-events-${rangeDays==='all'?'all-time':`${rangeDays}d`}-${new Date().toISOString().slice(0,10)}.csv`,`\uFEFF${[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n')}`,'text/csv;charset=utf-8');
  };
  const latestEvent=scopedEvents[0];
  const validPixel=/^\d{5,24}$/.test(settings.pixelId);
  const validSiteUrl=(()=>{try{const url=new URL(settings.siteUrl);return url.protocol==='https:'&&Boolean(url.hostname)}catch{return false}})();
  const setupChecks=[
    {label:'Pixel đang bật',detail:'Cho phép storefront nạp mã Pixel.',ready:settings.enabled},
    {label:'Pixel ID hợp lệ',detail:validPixel?settings.pixelId:'Chỉ nhập 5–24 chữ số.',ready:validPixel},
    {label:'Website dùng HTTPS',detail:validSiteUrl?siteRoot(settings.siteUrl):'Nhập URL website chính đang chạy quảng cáo.',ready:validSiteUrl},
    {label:'Đã chạy event thử',detail:runtime.lastTestAt?`ViewContent test: ${dateTime(runtime.lastTestAt)}`:runtime.queueReady?'Pixel đã sẵn sàng; bấm Gửi event thử.':'Lưu cấu hình rồi bấm Gửi event thử.',ready:Boolean(runtime.lastTestAt)},
  ];
  const setupReady=setupChecks.filter(item=>item.ready).length;
  const setupScore=Math.round(setupReady/setupChecks.length*100);
  const eventCoverage=eventDefinitions.map(definition=>{
    const matches=scopedEvents.filter(event=>event.name===definition.name);
    return{...definition,count:matches.length,latest:matches[0]?.createdAt||''};
  });

  if(loadingSettings)return <div className="tf57-meta-loading"><span/><span/><span/></div>;
  return <div className="tf57-meta-page">
    <section className="tf571-analytics-toolbar">
      <div><span><Database/></span><div><small>FIRST-PARTY ANALYTICS</small><b>{scopedEvents.length} events · {scopedSessions} phiên</b><p>Dữ liệu website tự ghi nhận; không phải số liệu lấy từ Meta Ads Manager.</p><em className={eventStorage.source==='firebase'?'is-firebase':'is-local'}>{eventStorage.source==='firebase'?`Firebase: ${eventStorage.remoteCount} · Chờ đồng bộ trên máy này: ${eventStorage.localOnlyCount}`:`Chỉ dữ liệu trên máy này: ${eventStorage.localOnlyCount}`}</em></div></div>
      <div className="tf571-toolbar-controls"><div role="group" aria-label="Phạm vi dữ liệu"><button type="button" className={eventScope==='all'?'is-active':''} onClick={()=>setEventScope('all')}>Tất cả traffic</button><button type="button" className={eventScope==='meta'?'is-active':''} onClick={()=>setEventScope('meta')}>Chỉ Meta</button></div><div role="group" aria-label="Khoảng thời gian">{([7,14,30,'all'] as const).map(range=><button type="button" key={range} className={rangeDays===range?'is-active':''} onClick={()=>setRangeDays(range)}>{range==='all'?'All time':`${range} ngày`}</button>)}</div></div>
    </section>
    <section className="tf57-meta-overview">
      <article><span><Megaphone/></span><div><small>PHIÊN TỪ META · {rangeDays==='all'?'ALL TIME':`${rangeDays} NGÀY`}</small><strong>{metaSessions}</strong><p>Theo landing UTM/fbclid</p></div></article>
      <article><span><MousePointerClick/></span><div><small>THÊM GIỎ HÀNG</small><strong>{addToCarts}</strong><p>{metaSessions?`${(addToCarts/metaSessions*100).toFixed(1)}% trên phiên Meta`:'Chưa đủ dữ liệu'}</p></div></article>
      <article><span><ShoppingBag/></span><div><small>ĐƠN HOÀN TẤT</small><strong>{purchases}</strong><p>Trong {rangeLabel}</p></div></article>
      <article><span><BarChart3/></span><div><small>DOANH THU GHI NHẬN</small><strong>{money(revenue)}</strong><p>Không thay thế số liệu Ads Manager</p></div></article>
    </section>

    <div className="tf57-meta-primary-grid">
      <section className="tf57-meta-card tf57-pixel-settings"><header><span><Settings2/></span><div><small>META PIXEL</small><h2>Cấu hình tín hiệu chuyển đổi</h2><p>Pixel chỉ được tải trên trang khách khi công tắc bật và ID hợp lệ.</p></div></header>
        <label className="tf57-meta-switch"><span><b>Kích hoạt Meta Pixel</b><small>Gửi PageView, ViewContent, AddToCart, InitiateCheckout và Purchase.</small></span><button type="button" className={settings.enabled?'is-on':''} onClick={()=>patch({enabled:!settings.enabled})} aria-pressed={settings.enabled}><i/></button></label>
        <div className="tf57-meta-fields"><label><span>Pixel ID</span><input inputMode="numeric" value={settings.pixelId} onChange={event=>patch({pixelId:event.target.value.replace(/\D/g,'').slice(0,24)})} placeholder="Ví dụ: 123456789012345"/></label><label><span>URL website chính</span><input value={settings.siteUrl} onChange={event=>patch({siteUrl:event.target.value})} placeholder={window.location.origin}/></label></div>
        <div className="tf57-meta-config-actions"><button type="button" className="secondary" onClick={testPixel}><Activity/>Gửi event thử</button><button type="button" className="primary" onClick={()=>void save()} disabled={saving||!dirty}><Save/>{saving?'Đang lưu...':'Lưu cấu hình'}</button></div>
        <ol className="tf59-pixel-howto"><li><b>1</b><span>Bật Pixel và nhập đúng ID</span></li><li><b>2</b><span>Lưu cấu hình</span></li><li><b>3</b><span>Gửi event thử rồi xem Test Events</span></li></ol>
      </section>

      <section className="tf57-meta-card tf57-event-health"><header><span><ShieldCheck/></span><div><small>EVENT HEALTH · {eventScope==='meta'?'META':'TẤT CẢ'}</small><h2>Sức khỏe dữ liệu</h2><p>{latestEvent?`Event gần nhất: ${dateTime(latestEvent.createdAt)} · ${rangeLabel}`:'Chưa ghi nhận sự kiện'}</p></div><button type="button" onClick={()=>void loadEvents()} disabled={eventsLoading} aria-label="Tải lại dữ liệu"><RefreshCw className={eventsLoading?'is-spinning':''}/></button></header>
        <div className="tf57-health-summary"><span className={settings.enabled&&validPixel?'good':'warn'}>{settings.enabled&&validPixel?<CheckCircle2/>:<TriangleAlert/>}<b>{settings.enabled&&validPixel?'Pixel đã cấu hình':settings.enabled?'Pixel ID chưa hợp lệ':'Pixel đang tắt'}</b></span><span className={runtime.queueReady?'good':'neutral'}>{runtime.queueReady?<CheckCircle2/>:<Activity/>}<b>{runtime.queueReady?'Runtime sẵn sàng':'Chưa chạy event thử'}</b></span></div>
        <div className="tf572-health-note"><Activity/><span><b>{scopedEvents.length} event · {scopedSessions} phiên</b><small>{eventStorage.source==='firebase'?'Đã hợp nhất Firebase và dữ liệu chưa đồng bộ trên máy này.':'Đang dùng dữ liệu lưu trên trình duyệt này.'}</small></span></div>
      </section>
    </div>

    <section className="tf57-meta-card tf59-pixel-readiness">
      <header><span><ShieldCheck/></span><div><small>PIXEL READINESS CENTER</small><h2>Mức sẵn sàng và độ phủ event</h2><p>Kiểm tra cấu hình trình duyệt cùng 5 hành vi commerce mà website đã ghi nhận trong {rangeLabel}.</p></div><a href="https://business.facebook.com/events_manager2/list" target="_blank" rel="noreferrer">Mở Test Events<ExternalLink/></a></header>
      <div className="tf59-pixel-readiness-layout">
        <article className="tf59-pixel-score"><div><strong>{setupScore}</strong><span>/100</span></div><b>{setupReady}/{setupChecks.length} bước cấu hình đã đạt</b><i><span style={{width:`${setupScore}%`}}/></i><small>{setupScore===100?'Cấu hình trình duyệt đã sẵn sàng để kiểm tra event.':'Hoàn tất các mục còn cảnh báo trước khi tăng ngân sách quảng cáo.'}</small></article>
        <div className="tf59-pixel-checks">{setupChecks.map(item=><article className={item.ready?'is-ready':'is-warning'} key={item.label}>{item.ready?<CheckCircle2/>:<TriangleAlert/>}<span><b>{item.label}</b><small>{item.detail}</small></span><em>{item.ready?'Đạt':'Kiểm tra'}</em></article>)}</div>
      </div>
      <div className="tf59-event-coverage" aria-label="Độ phủ event commerce">{eventCoverage.map(item=><article className={item.count?'is-observed':'is-empty'} key={item.name}><span>{item.count?<CheckCircle2/>:<Activity/>}</span><div><b>{item.label}</b><small>{item.meta}</small></div><strong>{item.count}</strong><em>{item.latest?`Gần nhất ${dateTime(item.latest)}`:'Chưa ghi nhận'}</em></article>)}</div>
      <p className="tf59-pixel-note"><Globe2/><span><b>Dữ liệu ở đây là first-party analytics của website.</b> Sau khi gửi thử, đối chiếu thêm trong Events Manager → Test Events; Purchase chỉ nên phát sinh khi đơn hàng được tạo thành công.</span></p>
    </section>

    <section className="tf57-meta-card tf572-funnel-card">
      <header><span><Funnel/></span><div><small>CONVERSION FUNNEL · {eventScope==='meta'?'META':'TẤT CẢ'}</small><h2>Phễu chuyển đổi {rangeLabel}</h2><p>Đọc nhanh lượng người đi từ xem trang đến hoàn tất đơn, cùng tỷ lệ giữ lại ở từng bước.</p></div></header>
      <div className="tf572-conversion-funnel">{funnelSteps.map((step,index)=><article key={step.name}><div><span>{index+1}</span><small>{step.meta}</small></div><b>{step.label}</b><strong>{step.total}</strong><em>{step.rate}</em></article>)}</div>
      {funnelInsight&&<div className="tf573-funnel-insight"><TriangleAlert/><span><small>ĐIỂM CẦN ƯU TIÊN</small><b>{funnelInsight.from} → {funnelInsight.to}: giữ lại {(funnelInsight.rate*100).toFixed(1)}%</b><p>{funnelInsight.drop?`Giảm ${funnelInsight.drop} event. `:''}{funnelInsight.action}</p></span></div>}
    </section>

    <section className="tf57-meta-card tf571-event-explorer">
      <header><span><Database/></span><div><small>EVENT EXPLORER</small><h2>Nhật ký hành vi và chuyển đổi</h2><p>Tìm nhanh theo event, nguồn, campaign hoặc URL.</p></div><button type="button" onClick={exportEvents} disabled={!filteredEvents.length}><Download/>Xuất dữ liệu</button></header>
      <div className="tf571-event-filters"><label><Search/><input value={eventQuery} onChange={event=>setEventQuery(event.target.value)} placeholder="Tìm nguồn, campaign, URL, SKU/ID…"/></label><select value={eventFilter} onChange={event=>setEventFilter(event.target.value as 'all'|CommerceEventName)} aria-label="Lọc loại event"><option value="all">Tất cả event</option>{eventDefinitions.map(item=><option value={item.name} key={item.name}>{item.label}</option>)}</select></div>
      {filteredEvents.length?<><div className="tf571-event-table"><div className="head"><span>Event / thời gian</span><span>Nguồn / campaign</span><span>Trang</span><span>Giá trị</span></div>{visibleEvents.map(event=><div key={event.id}><span><b>{eventLabel.get(event.name)||event.name}</b><small>{dateTime(event.createdAt)}</small></span><span><b>{event.attribution?.source||'direct'}</b><small>{event.attribution?.campaign||'Không có campaign'}</small></span><code>{event.path||'/'}</code><strong>{Number(event.value||0)>0?money(Number(event.value)):event.productId||event.orderId||'—'}</strong></div>)}</div><div className="tf572-event-more"><span>Đang xem {visibleEvents.length}/{filteredEvents.length} event</span><div>{eventLimit>5&&<button type="button" onClick={()=>setEventLimit(5)}><ChevronUp/>Thu gọn</button>}{eventLimit<filteredEvents.length&&<button type="button" className="primary" onClick={()=>setEventLimit(value=>Math.min(value+20,filteredEvents.length))}>Xem thêm<ChevronDown/></button>}</div></div></>:<div className="tf57-meta-empty is-compact"><Search/><h3>Không có event phù hợp</h3><p>Đổi phạm vi, khoảng ngày hoặc bộ lọc để kiểm tra lại.</p></div>}
    </section>

    <section className="tf57-meta-card tf57-utm-builder tf59-ad-link-kit"><header><span><Link2/></span><div><small>PRODUCT AD LINK KIT</small><h2>Tạo link quảng cáo theo sản phẩm</h2><p>Chọn landing page và ưu đãi; website sẽ giữ mã đến tận giỏ hàng/checkout và vẫn ghi nhận UTM/fbclid.</p></div></header><div className="tf57-utm-grid tf59-ad-link-grid"><label><span>Sản phẩm quảng cáo</span><select value={adProductId} onChange={event=>{const id=event.target.value;setAdProductId(id);const product=activeProducts.find(item=>item.id===id);if(product)setPath(`/products/${product.handle}`)}}><option value="">Trang đích tùy chỉnh</option>{activeProducts.map(product=><option key={product.id} value={product.id}>{product.title} · {product.sku}</option>)}</select></label><label><span>Mã ưu đãi đính kèm</span><select value={promoCode} onChange={event=>setPromoCode(event.target.value)}><option value="">Không đính kèm mã</option>{activeDiscounts.map(item=><option value={item.code} key={item.id}>{item.code} · {item.title}</option>)}</select></label><label><span>Trang đích</span><input value={path} onChange={event=>{setPath(event.target.value);setAdProductId('')}} placeholder="/collections/adidas"/></label><label><span>utm_campaign</span><input value={campaign} onChange={event=>setCampaign(event.target.value)} placeholder="meta_prospecting_aug"/></label><label><span>utm_content</span><input value={content} onChange={event=>setContent(event.target.value)} placeholder="carousel_01"/></label><label><span>utm_source / medium</span><div className="tf57-double-field"><input value={settings.defaultSource} onChange={event=>patch({defaultSource:event.target.value})}/><input value={settings.defaultMedium} onChange={event=>patch({defaultMedium:event.target.value})}/></div></label></div>{adProduct&&<article className="tf59-ad-product-preview"><SmartImage src={productImage(adProduct)} alt={adProduct.title} width={180} height={180}/><span><small>LANDING SẢN PHẨM</small><b>{adProduct.title}</b><p>{adProduct.sku} · {adProduct.inventory>0?`Còn ${adProduct.inventory}`:'Hết hàng'}</p></span><strong>{money(adProduct.price)}</strong>{promoCode&&<em><BadgePercent/>{promoCode}</em>}</article>}<div className="tf57-generated-link"><code>{targetUrl}</code><button type="button" onClick={()=>void copyLink()}><Copy/>Sao chép</button></div></section>

    <section className={`tf57-meta-card tf57-catalog-card tf573-catalog-card ${catalogOpen?'is-open':''}`}>
      <button type="button" className="tf573-catalog-toggle" onClick={()=>setCatalogOpen(value=>!value)} aria-expanded={catalogOpen} aria-controls="tf573-catalog-details">
        <span><PackageCheck/></span><div><small>CATALOG HEALTH</small><b>Sức khỏe catalog</b><p>{catalogIssueProducts?`${catalogIssueProducts} sản phẩm cần kiểm tra`:'Catalog sẵn sàng chạy quảng cáo'}</p></div><em className={catalogIssueProducts?'warn':'good'}>{catalogIssueProducts||'✓'}</em>{catalogOpen?<ChevronUp/>:<ChevronDown/>}
      </button>
      {catalogOpen&&<div id="tf573-catalog-details" className="tf573-catalog-details">
        <header><div><h2>Kiểm tra catalog trước khi chạy quảng cáo</h2><p>Rà ảnh công khai, SKU, handle, giá, mô tả, tồn kho và SKU trùng trước khi xuất feed.</p></div><div className="tf571-catalog-actions"><button type="button" onClick={exportCatalogIssues} disabled={!filteredCatalogIssues.length}><FileWarning/>Xuất lỗi đang lọc</button><button type="button" onClick={exportCatalog}><Download/>Xuất Meta CSV</button></div></header>
        <div className="tf571-catalog-health-grid"><span><b>{activeProducts.length}</b><small>Đang xuất bản</small></span><span className={catalogIssueProducts?'warn':'good'}><b>{catalogIssueProducts}</b><small>Sản phẩm cần kiểm tra</small></span><span className={missingCatalogImages?'warn':'good'}><b>{missingCatalogImages}</b><small>Thiếu URL ảnh</small></span><span className={outOfStockProducts?'warn':'good'}><b>{outOfStockProducts}</b><small>Hết hàng</small></span></div>
        {catalogIssues.length?<><div className="tf573-catalog-filters"><label><Search/><input value={catalogQuery} onChange={event=>setCatalogQuery(event.target.value)} placeholder="Tìm SKU hoặc tên sản phẩm…"/></label><select value={catalogFilter} onChange={event=>setCatalogFilter(event.target.value as CatalogIssueFilterV573)} aria-label="Lọc nhóm lỗi catalog"><option value="all">Tất cả lỗi</option><option value="media">Hình ảnh</option><option value="identity">SKU & nhận diện</option><option value="pricing">Giá bán</option><option value="content">Mô tả</option><option value="stock">Tồn kho</option></select><span>{filteredCatalogIssues.length}/{catalogIssues.length} cảnh báo</span></div>{filteredCatalogIssues.length?<div className="tf571-catalog-issues">{filteredCatalogIssues.slice(0,8).map((item,index)=><div key={`${item.productId}-${item.kind}-${index}`}><span><b>{item.sku}</b><small>{item.title}</small></span><em>{item.label}</em></div>)}{filteredCatalogIssues.length>8&&<p>Còn {filteredCatalogIssues.length-8} cảnh báo đang lọc — xuất CSV để xử lý đầy đủ.</p>}</div>:<div className="tf573-catalog-filter-empty"><Search/><span><b>Không có cảnh báo phù hợp</b><small>Đổi từ khóa hoặc nhóm lỗi để kiểm tra lại.</small></span></div>}</>:<div className="tf571-catalog-clean"><CheckCircle2/><span><b>Catalog sạch</b><small>Chưa phát hiện lỗi trong các trường đang kiểm tra.</small></span></div>}
      </div>}
    </section>

    <section className="tf57-meta-card tf57-campaign-report"><header><span><Funnel/></span><div><small>{rangeDays==='all'?'ALL-TIME':`${rangeDays}-DAY`} ATTRIBUTION</small><h2>Hiệu quả theo utm_campaign</h2><p>Attribution theo landing UTM/fbclid; nên đối chiếu thêm với Meta Ads Manager.</p></div><a href="https://business.facebook.com/adsmanager" target="_blank" rel="noreferrer">Mở Ads Manager<ExternalLink/></a></header>
      {campaignRows.length?<div className="tf57-campaign-table"><div className="head"><span>Chiến dịch</span><span>Phiên</span><span>Xem SP</span><span>Thêm giỏ</span><span>Checkout</span><span>Đơn</span><span>Doanh thu</span></div>{campaignRows.map(row=><div key={row.campaign}><b>{row.campaign}</b><span data-label="Phiên">{row.sessions.size}</span><span data-label="Xem SP">{row.views}</span><span data-label="Thêm giỏ">{row.adds}</span><span data-label="Checkout">{row.checkouts}</span><span data-label="Đơn">{row.purchases}</span><strong data-label="Doanh thu">{money(row.revenue)}</strong></div>)}</div>:<div className="tf57-meta-empty"><Megaphone/><h3>Chưa có traffic quảng cáo được gắn UTM</h3><p>Tạo link ở phía trên, dùng cho mẫu quảng cáo rồi quay lại xem phễu theo chiến dịch.</p></div>}
    </section>
  </div>;
}
