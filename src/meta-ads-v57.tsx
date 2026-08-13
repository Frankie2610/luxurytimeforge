import {useEffect,useMemo,useState} from 'react';
import {Activity,BarChart3,CheckCircle2,Copy,Download,ExternalLink,Funnel,Link2,Megaphone,MousePointerClick,PackageCheck,RefreshCw,Save,Settings2,ShieldCheck,ShoppingBag,TriangleAlert} from 'lucide-react';
import {toast} from 'sonner';
import {readCommerceEvents,readRemoteCommerceEvents,type CommerceEvent,type CommerceEventName} from './commerce-events';
import {defaultMetaMarketingSettings,loadMarketingSettings,saveMarketingSettings} from './integrations';
import {configureMetaPixel,metaPixelRuntimeStatus,sendMetaPixelTestEvent} from './meta-pixel-v57';
import {useCommerce} from './context';
import {productImage} from './image-utils';
import type {MetaMarketingSettings,Product} from './types';
import {money} from './utils';
import './v570-meta-ads.css';

const eventDefinitions:Array<{name:CommerceEventName;label:string;meta:string}>=[
  {name:'page_view',label:'PageView',meta:'Lượt xem trang'},
  {name:'product_view',label:'ViewContent',meta:'Xem chi tiết sản phẩm'},
  {name:'add_to_cart',label:'AddToCart',meta:'Thêm vào giỏ'},
  {name:'checkout_started',label:'InitiateCheckout',meta:'Bắt đầu thanh toán'},
  {name:'checkout_completed',label:'Purchase',meta:'Hoàn tất đơn hàng'},
];
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

export function MetaAdsV57(){
  const{products}=useCommerce();
  const[settings,setSettings]=useState<MetaMarketingSettings>(defaultMetaMarketingSettings);
  const[loadingSettings,setLoadingSettings]=useState(true);
  const[saving,setSaving]=useState(false);
  const[dirty,setDirty]=useState(false);
  const[events,setEvents]=useState<CommerceEvent[]>(readCommerceEvents);
  const[eventsLoading,setEventsLoading]=useState(true);
  const[runtimeTick,setRuntimeTick]=useState(0);
  const[path,setPath]=useState('/collections');
  const[campaign,setCampaign]=useState('meta_prospecting');
  const[content,setContent]=useState('carousel_01');

  const loadEvents=async()=>{setEventsLoading(true);try{setEvents(await readRemoteCommerceEvents(7))}catch{setEvents(readCommerceEvents());toast.info('Đang hiển thị dữ liệu trên trình duyệt này')}finally{setEventsLoading(false)}};
  useEffect(()=>{void loadMarketingSettings().then(value=>{setSettings(value);setLoadingSettings(false)})},[]);
  useEffect(()=>{void loadEvents()},[]);
  const patch=(value:Partial<MetaMarketingSettings>)=>{setSettings(current=>({...current,...value}));setDirty(true)};
  const runtime=useMemo(()=>metaPixelRuntimeStatus(),[runtimeTick,settings.enabled,settings.pixelId]);
  const counts=useMemo(()=>Object.fromEntries(eventDefinitions.map(item=>[item.name,events.filter(event=>event.name===item.name).length])) as Record<CommerceEventName,number>,[events]);
  const metaEvents=useMemo(()=>events.filter(isMetaAttributed),[events]);
  const purchases=metaEvents.filter(event=>event.name==='checkout_completed').length;
  const revenue=metaEvents.filter(event=>event.name==='checkout_completed').reduce((sum,event)=>sum+Number(event.value||0),0);
  const metaSessions=new Set(metaEvents.map(sessionKey)).size;
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
  const testPixel=()=>{if(dirty){toast.error('Lưu cấu hình trước khi gửi event thử.');return}if(configureMetaPixel(settings)&&sendMetaPixelTestEvent())toast.success('Đã gửi ViewContent thử nghiệm. Kiểm tra Test Events trong Meta.');else toast.error('Hãy bật Pixel, nhập Pixel ID và lưu trước khi thử.')};
  const targetUrl=useMemo(()=>{
    const root=siteRoot(settings.siteUrl);
    let url:URL;
    try{url=new URL(path||'/',root)}catch{url=new URL('/',root)}
    url.searchParams.set('utm_source',settings.defaultSource||'facebook');
    url.searchParams.set('utm_medium',settings.defaultMedium||'paid_social');
    if(campaign.trim())url.searchParams.set('utm_campaign',campaign.trim());
    if(content.trim())url.searchParams.set('utm_content',content.trim());
    return url.toString();
  },[campaign,content,path,settings.defaultMedium,settings.defaultSource,settings.siteUrl]);
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

  const activeProducts=useMemo(()=>products.filter(product=>product.status==='active'&&product.published),[products]);
  const missingCatalogImages=activeProducts.filter(product=>!/^https?:\/\//.test(productImage(product))).length;
  const exportCatalog=()=>{
    const root=siteRoot(settings.siteUrl);
    const headers=['id','title','description','availability','condition','price','sale_price','link','image_link','brand','google_product_category'];
    const rows=activeProducts.map(product=>{
      const onSale=product.compareAtPrice>product.price;
      return[
        product.id,product.title,catalogDescription(product),product.inventory>0?'in stock':'out of stock','new',
        `${Math.round(onSale?product.compareAtPrice:product.price)} VND`,onSale?`${Math.round(product.price)} VND`:'',
        `${root}/products/${encodeURIComponent(product.handle)}`,productImage(product),product.vendor,'Apparel & Accessories > Jewelry > Watches',
      ];
    });
    const csv=`\uFEFF${[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n')}`;
    download(`timeforge-meta-catalog-${new Date().toISOString().slice(0,10)}.csv`,csv,'text/csv;charset=utf-8');
    toast.success(`Đã xuất ${rows.length} sản phẩm cho Meta Catalog`);
  };
  const latestEvent=events[0];

  if(loadingSettings)return <div className="tf57-meta-loading"><span/><span/><span/></div>;
  return <div className="tf57-meta-page">
    <section className="tf57-meta-overview">
      <article><span><Megaphone/></span><div><small>PHIÊN TỪ META · 7 NGÀY</small><strong>{metaSessions}</strong><p>Theo landing UTM/fbclid</p></div></article>
      <article><span><MousePointerClick/></span><div><small>THÊM GIỎ HÀNG</small><strong>{addToCarts}</strong><p>{metaSessions?`${(addToCarts/metaSessions*100).toFixed(1)}% trên phiên Meta`:'Chưa đủ dữ liệu'}</p></div></article>
      <article><span><ShoppingBag/></span><div><small>ĐƠN HOÀN TẤT</small><strong>{purchases}</strong><p>Trong 7 ngày gần nhất</p></div></article>
      <article><span><BarChart3/></span><div><small>DOANH THU GHI NHẬN</small><strong>{money(revenue)}</strong><p>Không thay thế số liệu Ads Manager</p></div></article>
    </section>

    <div className="tf57-meta-primary-grid">
      <section className="tf57-meta-card tf57-pixel-settings"><header><span><Settings2/></span><div><small>META PIXEL</small><h2>Cấu hình tín hiệu chuyển đổi</h2><p>Pixel chỉ được tải trên trang khách khi công tắc bật và ID hợp lệ.</p></div></header>
        <label className="tf57-meta-switch"><span><b>Kích hoạt Meta Pixel</b><small>Gửi PageView, ViewContent, AddToCart, InitiateCheckout và Purchase.</small></span><button type="button" className={settings.enabled?'is-on':''} onClick={()=>patch({enabled:!settings.enabled})} aria-pressed={settings.enabled}><i/></button></label>
        <div className="tf57-meta-fields"><label><span>Pixel ID</span><input inputMode="numeric" value={settings.pixelId} onChange={event=>patch({pixelId:event.target.value.replace(/\D/g,'').slice(0,24)})} placeholder="Ví dụ: 123456789012345"/></label><label><span>URL website chính</span><input value={settings.siteUrl} onChange={event=>patch({siteUrl:event.target.value})} placeholder={window.location.origin}/></label></div>
        <div className="tf57-meta-config-actions"><button type="button" className="secondary" onClick={testPixel}><Activity/>Gửi event thử</button><button type="button" className="primary" onClick={()=>void save()} disabled={saving||!dirty}><Save/>{saving?'Đang lưu...':'Lưu cấu hình'}</button></div>
      </section>

      <section className="tf57-meta-card tf57-event-health"><header><span><ShieldCheck/></span><div><small>EVENT HEALTH</small><h2>Sức khỏe dữ liệu</h2><p>{latestEvent?`Event gần nhất: ${dateTime(latestEvent.createdAt)}`:'Chưa ghi nhận sự kiện'}</p></div><button type="button" onClick={()=>void loadEvents()} disabled={eventsLoading} aria-label="Tải lại dữ liệu"><RefreshCw className={eventsLoading?'is-spinning':''}/></button></header>
        <div className="tf57-health-summary"><span className={settings.enabled&&/^\d{5,24}$/.test(settings.pixelId)?'good':'warn'}>{settings.enabled&&/^\d{5,24}$/.test(settings.pixelId)?<CheckCircle2/>:<TriangleAlert/>}<b>{settings.enabled?'Pixel đã cấu hình':'Pixel đang tắt'}</b></span><span className={runtime.queueReady?'good':'neutral'}>{runtime.queueReady?<CheckCircle2/>:<Activity/>}<b>{runtime.queueReady?'Runtime sẵn sàng':'Chờ lưu cấu hình'}</b></span></div>
        <div className="tf57-event-list">{eventDefinitions.map(item=>{const total=counts[item.name]||0;return <article key={item.name}><span className={total?'is-active':''}>{total?<CheckCircle2/>:<Activity/>}</span><div><b>{item.label}</b><small>{item.meta}</small></div><strong>{total}</strong></article>})}</div>
      </section>
    </div>

    <section className="tf57-meta-card tf57-utm-builder"><header><span><Link2/></span><div><small>CAMPAIGN URL BUILDER</small><h2>Tạo link UTM nhất quán</h2><p>Dùng link này cho từng mẫu quảng cáo để báo cáo không bị gộp sai nguồn.</p></div></header><div className="tf57-utm-grid"><label><span>Trang đích</span><input value={path} onChange={event=>setPath(event.target.value)} placeholder="/collections/adidas"/></label><label><span>utm_campaign</span><input value={campaign} onChange={event=>setCampaign(event.target.value)} placeholder="meta_prospecting_aug"/></label><label><span>utm_content</span><input value={content} onChange={event=>setContent(event.target.value)} placeholder="carousel_01"/></label><label><span>utm_source / medium</span><div className="tf57-double-field"><input value={settings.defaultSource} onChange={event=>patch({defaultSource:event.target.value})}/><input value={settings.defaultMedium} onChange={event=>patch({defaultMedium:event.target.value})}/></div></label></div><div className="tf57-generated-link"><code>{targetUrl}</code><button type="button" onClick={()=>void copyLink()}><Copy/>Sao chép</button></div></section>

    <section className="tf57-meta-card tf57-catalog-card"><header><span><PackageCheck/></span><div><small>META CATALOG</small><h2>Feed sản phẩm sẵn sàng tải lên</h2><p>Đồng bộ ID sản phẩm với content_ids của Pixel để chạy quảng cáo động chính xác hơn.</p></div><button type="button" onClick={exportCatalog}><Download/>Tải CSV</button></header><div className="tf57-catalog-stats"><span><b>{activeProducts.length}</b><small>Sản phẩm đang xuất bản</small></span><span><b>{activeProducts.filter(product=>product.inventory>0).length}</b><small>Sản phẩm còn hàng</small></span><span className={missingCatalogImages?'warn':''}><b>{missingCatalogImages}</b><small>Thiếu URL ảnh công khai</small></span></div></section>

    <section className="tf57-meta-card tf57-campaign-report"><header><span><Funnel/></span><div><small>7-DAY ATTRIBUTION</small><h2>Hiệu quả theo utm_campaign</h2><p>Attribution theo landing UTM/fbclid; nên đối chiếu thêm với Meta Ads Manager.</p></div><a href="https://business.facebook.com/adsmanager" target="_blank" rel="noreferrer">Mở Ads Manager<ExternalLink/></a></header>
      {campaignRows.length?<div className="tf57-campaign-table"><div className="head"><span>Chiến dịch</span><span>Phiên</span><span>Xem SP</span><span>Thêm giỏ</span><span>Checkout</span><span>Đơn</span><span>Doanh thu</span></div>{campaignRows.map(row=><div key={row.campaign}><b>{row.campaign}</b><span data-label="Phiên">{row.sessions.size}</span><span data-label="Xem SP">{row.views}</span><span data-label="Thêm giỏ">{row.adds}</span><span data-label="Checkout">{row.checkouts}</span><span data-label="Đơn">{row.purchases}</span><strong data-label="Doanh thu">{money(row.revenue)}</strong></div>)}</div>:<div className="tf57-meta-empty"><Megaphone/><h3>Chưa có traffic quảng cáo được gắn UTM</h3><p>Tạo link ở phía trên, dùng cho mẫu quảng cáo rồi quay lại xem phễu theo chiến dịch.</p></div>}
    </section>
  </div>;
}
