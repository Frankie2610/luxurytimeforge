import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {Archive,Check,ChevronDown,Copy,Download,Eye,FileUp,Filter,MoreHorizontal,PackageSearch,Pencil,Plus,Search,SlidersHorizontal,Trash2,X} from 'lucide-react';
import {useCommerce} from './context';
import type {Product,Status} from './types';
import {money,slugify,uid} from './utils';
import {AdminResourceFrame,AdminResourceSurface} from './admin-ui-v25';

const VIEW_KEY='tf.admin.product-views.v1';
type StockFilter='all'|'in_stock'|'low_stock'|'out_of_stock';
type SortKey='updated_desc'|'title_asc'|'inventory_asc'|'inventory_desc'|'price_asc'|'price_desc';
type ProductView={id:string;name:string;status:'all'|Status;vendor:string;productType:string;stock:StockFilter;sort:SortKey};
const defaultView:ProductView={id:'all',name:'Tất cả',status:'all',vendor:'',productType:'',stock:'all',sort:'updated_desc'};
const builtInViews:ProductView[]=[
 defaultView,
 {id:'active',name:'Đang hoạt động',status:'active',vendor:'',productType:'',stock:'all',sort:'updated_desc'},
 {id:'draft',name:'Bản nháp',status:'draft',vendor:'',productType:'',stock:'all',sort:'updated_desc'},
 {id:'low-stock',name:'Sắp hết hàng',status:'all',vendor:'',productType:'',stock:'low_stock',sort:'inventory_asc'}
];
const loadViews=():ProductView[]=>{try{const raw=localStorage.getItem(VIEW_KEY);return raw?JSON.parse(raw):[]}catch{return[]}};

export function AdminRouteSkeleton(){return <div className="admin-route-skeleton" aria-label="Đang tải"><div className="skeleton-line lg"/><div className="skeleton-actions"><span/><span/></div><section className="skeleton-card"><div className="skeleton-tabs"><span/><span/><span/></div>{Array.from({length:7}).map((_,i)=><div className="skeleton-row" key={i}><span/><span/><span/><span/></div>)}</section></div>}

function StatusBadge({status}:{status:Status}){return <span className={`v9-status ${status}`}>{status==='active'?'Đang hoạt động':status==='draft'?'Bản nháp':'Lưu trữ'}</span>}
function stockMatches(p:Product,stock:StockFilter){if(stock==='all')return true;if(stock==='out_of_stock')return p.inventory<=0;if(stock==='low_stock')return p.inventory>0&&p.inventory<=5;return p.inventory>0}
function sortProducts(list:Product[],sort:SortKey){return [...list].sort((a,b)=>{switch(sort){case'title_asc':return a.title.localeCompare(b.title,'vi');case'inventory_asc':return a.inventory-b.inventory;case'inventory_desc':return b.inventory-a.inventory;case'price_asc':return a.price-b.price;case'price_desc':return b.price-a.price;default:return new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime()}})}

export function ProductsV9(){
 const{products,saveProduct,deleteProducts}=useCommerce();
 const[q,setQ]=useState('');
 const[customViews,setCustomViews]=useState<ProductView[]>(loadViews);
 const[view,setView]=useState<ProductView>(defaultView);
 const[selected,setSelected]=useState<string[]>([]);
 const[filtersOpen,setFiltersOpen]=useState(false);
 const[saveOpen,setSaveOpen]=useState(false);
 const[viewName,setViewName]=useState('');
 const[menuId,setMenuId]=useState('');
 const filterRef=useRef<HTMLDivElement>(null);
 useEffect(()=>localStorage.setItem(VIEW_KEY,JSON.stringify(customViews)),[customViews]);
 useEffect(()=>{const close=(e:MouseEvent)=>{if(filterRef.current&&!filterRef.current.contains(e.target as Node))setFiltersOpen(false);setMenuId('')};document.addEventListener('click',close);return()=>document.removeEventListener('click',close)},[]);
 const vendors=useMemo(()=>[...new Set(products.map(p=>p.vendor).filter(Boolean))].sort(),[products]);
 const productTypes=useMemo(()=>[...new Set(products.map(p=>p.productType).filter(Boolean))].sort(),[products]);
 const shown=useMemo(()=>sortProducts(products.filter(p=>{
  const text=`${p.title} ${p.vendor} ${p.sku} ${p.productType}`.toLowerCase();
  return(!q||text.includes(q.toLowerCase()))&&(view.status==='all'||p.status===view.status)&&(!view.vendor||p.vendor===view.vendor)&&(!view.productType||p.productType===view.productType)&&stockMatches(p,view.stock)
 }),view.sort),[products,q,view]);
 const all=shown.length>0&&shown.every(p=>selected.includes(p.id));
 const activeFilterCount=[view.vendor,view.productType,view.stock!=='all',view.status!=='all'].filter(Boolean).length;
 const setStatus=(status:Status)=>{selected.forEach(id=>{const p=products.find(x=>x.id===id);if(p)saveProduct({...p,status,published:status==='active',updatedAt:new Date().toISOString()})});setSelected([]);window.dispatchEvent(new CustomEvent('timeforge:toast',{detail:{message:`Đã cập nhật ${selected.length} sản phẩm.`,tone:'success'}}))};
 const duplicate=(p:Product)=>{const now=new Date().toISOString();saveProduct({...structuredClone(p),id:uid('p'),title:`${p.title} (bản sao)`,handle:`${slugify(p.title)}-copy-${Date.now().toString().slice(-4)}`,status:'draft',published:false,createdAt:now,updatedAt:now});window.dispatchEvent(new CustomEvent('timeforge:toast',{detail:{message:'Đã nhân bản sản phẩm thành bản nháp.',tone:'success'}}))};
 const saveView=()=>{const name=viewName.trim();if(!name)return;const next={...view,id:uid('view'),name};setCustomViews(x=>[...x,next]);setView(next);setSaveOpen(false);setViewName('')};
 const resetFilters=()=>setView({...defaultView,id:view.id,name:view.name});
 const views=[...builtInViews,...customViews];
 return <AdminResourceFrame className="tf4917-catalog-page tf4917-products-page">
  <section className="tf4917-catalog-toolbar">
   <div className="tf4917-catalog-toolbar-copy"><span>CATALOG SẢN PHẨM</span><b>Quản lý dữ liệu bán hàng</b><small>{products.length} sản phẩm · tìm kiếm, lọc và cập nhật trong một màn hình.</small></div>
   <div className="tf4917-catalog-actions"><Link className="tf4917-action secondary" to="/admin/import-export"><FileUp/>Nhập CSV</Link><Link className="tf4917-action secondary" to="/admin/import-export"><Download/>Xuất CSV</Link><Link className="tf4917-action primary" to="/admin/products/new"><Plus/>Thêm sản phẩm</Link></div>
  </section>
  <AdminResourceSurface className="tf4917-catalog-surface v9-index-card">
   <div className="v9-viewbar"><div className="v9-views" role="tablist">{views.map(v=><button key={v.id} className={view.id===v.id?'active':''} onClick={()=>{setView(v);setSelected([])}}>{v.name}{v.id.startsWith('view_')&&<span onClick={e=>{e.stopPropagation();setCustomViews(x=>x.filter(a=>a.id!==v.id));if(view.id===v.id)setView(defaultView)}}><X/></span>}</button>)}<button className="v9-add-view" onClick={()=>setSaveOpen(true)}><Plus/>Lưu chế độ xem</button></div><button className="v9-sort-mini" title="Sắp xếp"><ChevronDown/></button></div>
   <div className="v9-index-tools">
    <label className="v9-search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm kiếm sản phẩm"/><kbd>/</kbd></label>
    <div className="v9-filter-wrap" ref={filterRef}><button className={`v9-tool-button ${activeFilterCount?'active':''}`} onClick={e=>{e.stopPropagation();setFiltersOpen(x=>!x)}}><Filter/>Bộ lọc{activeFilterCount>0&&<b>{activeFilterCount}</b>}</button>{filtersOpen&&<div className="v9-filter-popover" onClick={e=>e.stopPropagation()}><header><div><b>Lọc sản phẩm</b><small>Thu hẹp danh sách theo thuộc tính</small></div><button onClick={()=>setFiltersOpen(false)}><X/></button></header><label>Trạng thái<select value={view.status} onChange={e=>setView(x=>({...x,status:e.target.value as ProductView['status']}))}><option value="all">Tất cả</option><option value="active">Đang hoạt động</option><option value="draft">Bản nháp</option><option value="archived">Lưu trữ</option></select></label><label>Thương hiệu<select value={view.vendor} onChange={e=>setView(x=>({...x,vendor:e.target.value}))}><option value="">Tất cả thương hiệu</option>{vendors.map(v=><option key={v}>{v}</option>)}</select></label><label>Loại sản phẩm<select value={view.productType} onChange={e=>setView(x=>({...x,productType:e.target.value}))}><option value="">Tất cả loại</option>{productTypes.map(v=><option key={v}>{v}</option>)}</select></label><label>Tồn kho<select value={view.stock} onChange={e=>setView(x=>({...x,stock:e.target.value as StockFilter}))}><option value="all">Tất cả</option><option value="in_stock">Còn hàng</option><option value="low_stock">Sắp hết (1–5)</option><option value="out_of_stock">Hết hàng</option></select></label><footer><button onClick={resetFilters}>Xóa bộ lọc</button><button className="btn primary" onClick={()=>setFiltersOpen(false)}>Áp dụng</button></footer></div>}</div>
    <label className="v9-sort"><SlidersHorizontal/><select value={view.sort} onChange={e=>setView(x=>({...x,sort:e.target.value as SortKey}))}><option value="updated_desc">Cập nhật gần nhất</option><option value="title_asc">Tên A–Z</option><option value="inventory_asc">Tồn kho thấp nhất</option><option value="inventory_desc">Tồn kho cao nhất</option><option value="price_asc">Giá thấp nhất</option><option value="price_desc">Giá cao nhất</option></select></label>
   </div>
   {activeFilterCount>0&&<div className="v9-filter-chips">{view.status!=='all'&&<button onClick={()=>setView(x=>({...x,status:'all'}))}>Trạng thái: {view.status}<X/></button>}{view.vendor&&<button onClick={()=>setView(x=>({...x,vendor:''}))}>Thương hiệu: {view.vendor}<X/></button>}{view.productType&&<button onClick={()=>setView(x=>({...x,productType:''}))}>Loại: {view.productType}<X/></button>}{view.stock!=='all'&&<button onClick={()=>setView(x=>({...x,stock:'all'}))}>Tồn kho: {view.stock}<X/></button>}<button className="clear" onClick={resetFilters}>Xóa tất cả</button></div>}
   <div className="v9-result-meta"><span>{shown.length} sản phẩm</span>{selected.length>0&&<span>Đã chọn {selected.length}</span>}</div>
   <div className="table-wrap v9-table-wrap"><table className="v9-index-table"><thead><tr><th className="check-col"><input aria-label="Chọn tất cả" type="checkbox" checked={all} onChange={e=>setSelected(e.target.checked?shown.map(p=>p.id):[])}/></th><th>Sản phẩm</th><th>Trạng thái</th><th>Tồn kho</th><th>Loại</th><th>Thương hiệu</th><th>Giá</th><th className="action-col"/></tr></thead><tbody>{shown.map(p=><tr key={p.id} className={selected.includes(p.id)?'selected':''}><td><input aria-label={`Chọn ${p.title}`} type="checkbox" checked={selected.includes(p.id)} onChange={e=>setSelected(e.target.checked?[...selected,p.id]:selected.filter(id=>id!==p.id))}/></td><td><Link className="product-cell" to={`/admin/products/${p.id}`}><img src={p.images[0]} alt=""/><div><b>{p.title}</b><span>{p.sku||'Chưa có SKU'}</span></div></Link></td><td><StatusBadge status={p.status}/></td><td><div className={`v9-stock ${p.inventory<=0?'out':p.inventory<=5?'low':''}`}><span/>{p.inventory<=0?'Hết hàng':`${p.inventory} trong kho`}</div></td><td>{p.productType||'—'}</td><td>{p.vendor||'—'}</td><td><b>{money(p.price)}</b></td><td className="v9-row-menu"><button aria-label="Thêm thao tác" onClick={e=>{e.stopPropagation();setMenuId(menuId===p.id?'':p.id)}}><MoreHorizontal/></button>{menuId===p.id&&<div className="v9-context-menu" onClick={e=>e.stopPropagation()}><Link to={`/admin/products/${p.id}`}><Pencil/>Chỉnh sửa</Link><Link to={`/products/${p.handle}`} target="_blank"><Eye/>Xem trên cửa hàng</Link><button onClick={()=>duplicate(p)}><Copy/>Nhân bản</button><button onClick={()=>saveProduct({...p,status:p.status==='archived'?'draft':'archived',published:false,updatedAt:new Date().toISOString()})}><Archive/>{p.status==='archived'?'Đưa về bản nháp':'Lưu trữ'}</button><hr/><button className="danger" onClick={()=>{if(confirm(`Xóa ${p.title}?`))deleteProducts([p.id])}}><Trash2/>Xóa sản phẩm</button></div>}</td></tr>)}</tbody></table>{shown.length===0&&<div className="v9-empty-index"><PackageSearch/><h3>Không tìm thấy sản phẩm</h3><p>Thử thay đổi từ khóa hoặc xóa bộ lọc hiện tại.</p><button className="btn secondary" onClick={()=>{setQ('');resetFilters()}}>Xóa bộ lọc</button></div>}</div>
  </AdminResourceSurface>
  {selected.length>0&&<div className="v9-bulk-bar"><div><span className="v9-bulk-check"><Check/></span><b>{selected.length} sản phẩm được chọn</b><button onClick={()=>setSelected([])}>Bỏ chọn</button></div><div><button onClick={()=>setStatus('active')}>Đặt đang hoạt động</button><button onClick={()=>setStatus('draft')}>Chuyển thành bản nháp</button><button onClick={()=>setStatus('archived')}>Lưu trữ</button><button className="danger" onClick={()=>{if(confirm(`Xóa ${selected.length} sản phẩm?`)){deleteProducts(selected);setSelected([])}}}><Trash2/>Xóa</button></div></div>}
  {saveOpen&&<div className="v9-modal-backdrop" onMouseDown={()=>setSaveOpen(false)}><section className="v9-modal" onMouseDown={e=>e.stopPropagation()} role="dialog" aria-modal="true"><header><div><h2>Lưu chế độ xem</h2><p>Lưu bộ lọc và sắp xếp hiện tại để dùng lại.</p></div><button onClick={()=>setSaveOpen(false)}><X/></button></header><div className="v9-modal-body"><label>Tên chế độ xem<input autoFocus value={viewName} onChange={e=>setViewName(e.target.value)} placeholder="Ví dụ: Đồng hồ sắp hết hàng" onKeyDown={e=>{if(e.key==='Enter')saveView()}}/></label><div className="v9-view-summary"><span>Trạng thái: {view.status}</span><span>Tồn kho: {view.stock}</span><span>Sắp xếp: {view.sort}</span></div></div><footer><button className="btn secondary" onClick={()=>setSaveOpen(false)}>Hủy</button><button className="btn primary" disabled={!viewName.trim()} onClick={saveView}>Lưu chế độ xem</button></footer></section></div>}
 </AdminResourceFrame>
}

type Command={id:string;label:string;hint:string;path:string;group:string;icon:ReactNode};
export function AdminCommandPalette(){
 const{products}=useCommerce();const nav=useNavigate();const[open,setOpen]=useState(false),[q,setQ]=useState(''),[active,setActive]=useState(0);const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setOpen(true)}if(e.key==='Escape')setOpen(false)};const custom=()=>setOpen(true);window.addEventListener('keydown',key);window.addEventListener('timeforge:open-command',custom);return()=>{window.removeEventListener('keydown',key);window.removeEventListener('timeforge:open-command',custom)}},[]);
 useEffect(()=>{if(open){setQ('');setActive(0);setTimeout(()=>input.current?.focus(),30)}},[open]);
 const base:Command[]=[
  {id:'home',label:'Trang chủ admin',hint:'Tổng quan cửa hàng',path:'/admin',group:'Điều hướng',icon:<Search/>},
  {id:'new-product',label:'Thêm sản phẩm',hint:'Tạo một sản phẩm mới',path:'/admin/products/new',group:'Thao tác nhanh',icon:<Plus/>},
  {id:'orders',label:'Đơn hàng',hint:'Quản lý đơn hàng',path:'/admin/orders',group:'Điều hướng',icon:<Search/>},
  {id:'returns',label:'Hoàn trả',hint:'Xử lý yêu cầu hoàn trả và hoàn tiền',path:'/admin/returns',group:'Điều hướng',icon:<Search/>},
  {id:'draft-orders',label:'Đơn hàng nháp',hint:'Tạo đơn thay khách và gửi hóa đơn',path:'/admin/draft-orders',group:'Điều hướng',icon:<Search/>},
  {id:'new-draft-order',label:'Tạo đơn hàng nháp',hint:'Tạo draft order mới',path:'/admin/draft-orders/new',group:'Thao tác nhanh',icon:<Plus/>},
  {id:'collections',label:'Bộ sưu tập',hint:'Sắp xếp catalog',path:'/admin/collections',group:'Điều hướng',icon:<Search/>},
  {id:'theme',label:'Tùy chỉnh cửa hàng online',hint:'Mở Theme Editor',path:'/admin/online-store',group:'Thao tác nhanh',icon:<Search/>},
  {id:'import',label:'Nhập Shopify CSV',hint:'Nhập hoặc xuất dữ liệu',path:'/admin/import-export',group:'Thao tác nhanh',icon:<Search/>},
  {id:'integrations',label:'Thanh toán & giao hàng',hint:'Payment, tracking và Customer Account',path:'/admin/settings/integrations',group:'Cài đặt',icon:<Search/>},
  {id:'settings',label:'Thông tin cửa hàng',hint:'Tên shop, liên hệ, MST, social và tuyển dụng',path:'/admin/settings',group:'Cài đặt',icon:<Search/>}
 ];
 const productCommands=products.slice(0,40).map(p=>({id:p.id,label:p.title,hint:`${p.sku||'Chưa SKU'} · ${money(p.price)}`,path:`/admin/products/${p.id}`,group:'Sản phẩm',icon:<img src={p.images[0]} alt=""/>}));
 const commands=[...base,...productCommands].filter(c=>`${c.label} ${c.hint}`.toLowerCase().includes(q.toLowerCase())).slice(0,12);
 const choose=(c?:Command)=>{if(!c)return;nav(c.path);setOpen(false)};
 if(!open)return null;
 return <div className="command-backdrop" onMouseDown={()=>setOpen(false)}><section className="command-palette" onMouseDown={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Tìm kiếm trong admin"><label><Search/><input ref={input} value={q} onChange={e=>{setQ(e.target.value);setActive(0)}} placeholder="Tìm sản phẩm, đơn hàng hoặc trang..." onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();setActive(x=>Math.min(commands.length-1,x+1))}if(e.key==='ArrowUp'){e.preventDefault();setActive(x=>Math.max(0,x-1))}if(e.key==='Enter'){e.preventDefault();choose(commands[active])}}}/><kbd>ESC</kbd></label><div className="command-results">{commands.length?commands.map((c,i)=><button key={c.id} className={active===i?'active':''} onMouseEnter={()=>setActive(i)} onClick={()=>choose(c)}><span className="command-icon">{c.icon}</span><span><b>{c.label}</b><small>{c.hint}</small></span><em>{c.group}</em></button>):<div className="command-empty"><Search/><b>Không có kết quả</b><span>Thử tìm theo tên sản phẩm hoặc khu vực admin.</span></div>}</div><footer><span><kbd>↑</kbd><kbd>↓</kbd> di chuyển</span><span><kbd>↵</kbd> mở</span></footer></section></div>
}
