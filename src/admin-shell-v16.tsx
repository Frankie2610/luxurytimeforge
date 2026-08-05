import './legacy.css';
import {useEffect,useMemo,useState,type ComponentType} from 'react';
import {Link,NavLink,Outlet,useLocation,useNavigate} from 'react-router-dom';
import {
  Activity,ArrowUpRight,BadgePercent,BarChart3,Bell,Boxes,ChevronDown,ChevronRight,
  BookOpen,CircleUserRound,FileText,FileUp,Home,Layers3,LayoutTemplate,Menu,PackageSearch,Plus,
  PanelLeftClose,PanelLeftOpen,RotateCcw,Rows3,Search,Settings,ShoppingBag,Store,Tags,Users,UserRoundSearch,Wrench,X,
} from 'lucide-react';
import {toast as sonnerToast} from 'sonner';
import {useCommerce} from './context';
import {useAuth} from './auth';
import{hasPermission,routePermission,roleLabels}from'./permissions';
import {useReturns} from './returns-v13';
import {AdminCommandPalette} from './admin-v9';
import {AdminRouteBoundary} from './admin-route-boundary';
import './admin-v4938.css';
import './v50-admin-polish.css';
import './v504-admin-final.css';
import './v508-admin-final.css';
import './v509-admin-final.css';
import './v512-admin-contrast.css';
import './v521-ui-polish.css';
import './v522-ui-refinement.css';
import './v523-product-admin-fix.css';
import './v531-admin-dashboard.css';
import './v540-admin-refinement.css';
import './v550-admin-polish.css';
import './v560-admin-features.css';
import './v563-admin-scroll-polish.css';
import {
  Button,DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui';

type NavItem={to:string;label:string;icon:ComponentType<{className?:string}>;count?:number};
type NavSection={label?:string;items:NavItem[]};

const adminRoutePrefetchers:Record<string,()=>Promise<unknown>>={
  orders:()=>Promise.all([import('./admin-sprint11'),import('./admin-sprint12')]),
  'draft-orders':()=>import('./admin-sprint12'),
  products:()=>Promise.all([import('./admin-v9'),import('./product-editor-v39')]),
  collections:()=>import('./admin'),
  'product-groups':()=>import('./product-groups-admin-v504'),
  inventory:()=>import('./admin-operations-v10'),
  customers:()=>import('./admin-operations-v10'),
  'customer-segments':()=>import('./admin-sprint11'),
  analytics:()=>import('./analytics-v15'),
  discounts:()=>import('./admin-operations-v10'),
  returns:()=>import('./returns-v13'),
  blogs:()=>import('./blog-v18'),
  pages:()=>import('./content-pages-admin-v23'),
  'online-store':()=>import('./online-store-v19'),
  settings:()=>Promise.all([import('./admin'),import('./integrations-v13'),import('./team-v20')]),
  activity:()=>import('./operations'),
  'import-export':()=>import('./admin'),
};
const prefetchAdminRoute=(path:string)=>{const section=path.split('/')[2]||'';void adminRoutePrefetchers[section]?.();};

type PageMeta={title:string;eyebrow:string;description:string;fullBleed?:boolean};
const pageMap:Record<string,PageMeta>={
  '/admin':{title:'Trang chủ',eyebrow:'Tổng quan',description:'Theo dõi hoạt động quan trọng của cửa hàng trong một màn hình.'},
  '/admin/orders':{title:'Đơn hàng',eyebrow:'Vận hành',description:'Quản lý thanh toán, giao hàng và vòng đời đơn hàng.'},
  '/admin/returns':{title:'Hoàn trả & đổi hàng',eyebrow:'Sau bán hàng',description:'Xét duyệt yêu cầu, hoàn kho và xử lý đổi sản phẩm.'},
  '/admin/draft-orders':{title:'Đơn hàng nháp',eyebrow:'Vận hành',description:'Tạo báo giá hoặc đơn hàng thay khách hàng.'},
  '/admin/products':{title:'Sản phẩm',eyebrow:'Danh mục',description:'Quản lý sản phẩm, trạng thái, giá bán và tồn kho.'},
  '/admin/collections':{title:'Bộ sưu tập',eyebrow:'Danh mục',description:'Sắp xếp sản phẩm theo chiến dịch và nhóm hiển thị.'},
  '/admin/product-groups':{title:'Nhóm BST theo SKU',eyebrow:'Danh mục',description:'Nhập file và nhóm các phiên bản cùng dòng theo tiền tố SKU.'},
  '/admin/inventory':{title:'Hàng tồn kho',eyebrow:'Vận hành',description:'Theo dõi số lượng, cảnh báo và lịch sử điều chỉnh.'},
  '/admin/customers':{title:'Khách hàng',eyebrow:'Khách hàng',description:'Hồ sơ, lịch sử mua và giá trị vòng đời khách hàng.'},
  '/admin/customer-segments':{title:'Phân khúc khách hàng',eyebrow:'Khách hàng',description:'Tạo nhóm động phục vụ chăm sóc và marketing.'},
  '/admin/analytics':{title:'Phân tích',eyebrow:'Báo cáo',description:'Doanh thu, chuyển đổi và nguồn tạo đơn hàng.'},
  '/admin/discounts':{title:'Mã giảm giá',eyebrow:'Marketing',description:'Thiết lập ưu đãi, điều kiện và thời gian hiệu lực.'},
  '/admin/blogs':{title:'Bài viết',eyebrow:'Nội dung',description:'Tạo và quản lý nội dung cho TimeForge Journal.'},
  '/admin/pages':{title:'Trang nội dung',eyebrow:'Nội dung',description:'Biên tập trang Giới thiệu, Bảo hành, Giao hàng và Đổi trả trên website khách.'},
  '/admin/activity':{title:'Nhật ký hoạt động',eyebrow:'Hệ thống',description:'Theo dõi những thay đổi quan trọng trong Admin.'},
  '/admin/import-export':{title:'Nhập / xuất dữ liệu',eyebrow:'Dữ liệu',description:'Đồng bộ catalog bằng Shopify CSV và xuất bản sao dữ liệu.'},
  '/admin/online-store':{title:'Cửa hàng online',eyebrow:'Kênh bán hàng',description:'Điều chỉnh template, section, block và giao diện hiển thị.',fullBleed:true},
  '/admin/settings':{title:'Thông tin cửa hàng',eyebrow:'Cửa hàng online',description:'Quản lý tên shop, liên hệ, địa chỉ, mã số thuế, social và tuyển dụng.'},
  '/admin/settings/team':{title:'Nhân sự & phân quyền',eyebrow:'Hệ thống',description:'Quản lý vai trò và phạm vi truy cập Admin.'},
  '/admin/settings/integrations':{title:'Thanh toán & giao hàng',eyebrow:'Tích hợp',description:'Quản lý payment adapter, vận chuyển và tài khoản khách hàng.'},
};

function routeMeta(pathname:string):PageMeta{
  if(pathname.startsWith('/admin/products/new'))return{title:'Thêm sản phẩm',eyebrow:'Sản phẩm',description:'Tạo sản phẩm mới và chuẩn hóa dữ liệu bán hàng.',fullBleed:true};
  if(pathname.startsWith('/admin/products/'))return{title:'Chỉnh sửa sản phẩm',eyebrow:'Sản phẩm',description:'Cập nhật nội dung, media, biến thể và SEO.',fullBleed:true};
  if(pathname.startsWith('/admin/orders/'))return{title:'Chi tiết đơn hàng',eyebrow:'Đơn hàng',description:'Xử lý thanh toán, fulfillment, hoàn tiền và dòng thời gian.'};
  if(pathname.startsWith('/admin/draft-orders/new'))return{title:'Tạo đơn hàng nháp',eyebrow:'Đơn hàng nháp',description:'Chọn khách hàng, sản phẩm và điều kiện thanh toán.'};
  if(pathname.startsWith('/admin/draft-orders/'))return{title:'Chỉnh sửa đơn hàng nháp',eyebrow:'Đơn hàng nháp',description:'Hoàn thiện báo giá trước khi chuyển thành đơn hàng.'};
  return pageMap[pathname]||{title:'TimeForge Admin',eyebrow:'Quản trị',description:'Quản lý cửa hàng TimeForge.'};
}

function ToastBridge(){useEffect(()=>{const listener=(event:Event)=>{const detail=(event as CustomEvent<{message:string;tone?:'success'|'danger'|'info'}>).detail;if(!detail?.message)return;if(detail.tone==='danger')sonnerToast.error(detail.message);else if(detail.tone==='info')sonnerToast.info(detail.message);else sonnerToast.success(detail.message)};window.addEventListener('timeforge:toast',listener);return()=>window.removeEventListener('timeforge:toast',listener)},[]);return null}

export function AdminLayoutV16(){
  const[open,setOpen]=useState(false);
  const[collapsed,setCollapsed]=useState(()=>typeof window!=='undefined'&&window.localStorage.getItem('tf:admin-sidebar-collapsed')==='1');
  const[density,setDensity]=useState<'comfortable'|'compact'>(()=>{try{return typeof window!=='undefined'&&window.localStorage.getItem('tf:admin-density')==='compact'?'compact':'comfortable'}catch{return'comfortable'}});
  const location=useLocation();
  const navigate=useNavigate();
  const{dataSource,orders,products}=useCommerce();
  const{items:returns}=useReturns();
  const{user,logout}=useAuth();
  const meta=routeMeta(location.pathname);
  const operationalCounts=useMemo(()=>({
    pendingOrders:orders.reduce((count,item)=>count+(item.status==='open'?1:0),0),
    pendingReturns:returns.reduce((count,item)=>count+(item.status==='requested'?1:0),0),
    lowStock:products.reduce((count,item)=>count+(item.inventory<=3?1:0),0),
  }),[orders,products,returns]);
  const{pendingOrders,pendingReturns,lowStock}=operationalCounts;
  const sections=useMemo<NavSection[]>(()=>[
    {items:[{to:'/admin',label:'Trang chủ',icon:Home}]},
    {label:'Đơn hàng',items:[
      {to:'/admin/orders',label:'Đơn hàng',icon:ShoppingBag,count:pendingOrders},
      {to:'/admin/draft-orders',label:'Đơn hàng nháp',icon:FileText},
      {to:'/admin/returns',label:'Hoàn trả & đổi hàng',icon:RotateCcw,count:pendingReturns},
    ]},
    {label:'Sản phẩm',items:[
      {to:'/admin/products',label:'Sản phẩm',icon:Boxes},
      {to:'/admin/collections',label:'Bộ sưu tập',icon:Tags},
      {to:'/admin/product-groups',label:'Nhóm BST theo SKU',icon:Layers3},
      {to:'/admin/inventory',label:'Hàng tồn kho',icon:PackageSearch,count:lowStock},
    ]},
    {label:'Khách hàng',items:[
      {to:'/admin/customers',label:'Khách hàng',icon:Users},
      {to:'/admin/customer-segments',label:'Phân khúc',icon:UserRoundSearch},
    ]},
    {label:'Marketing & nội dung',items:[
      {to:'/admin/discounts',label:'Mã giảm giá',icon:BadgePercent},
      {to:'/admin/blogs',label:'Bài viết',icon:BookOpen},
      {to:'/admin/pages',label:'Trang nội dung',icon:FileText},
      {to:'/admin/analytics',label:'Phân tích',icon:BarChart3},
    ]},
    {label:'Kênh bán hàng',items:[
      {to:'/admin/online-store',label:'Cửa hàng online',icon:LayoutTemplate},
      {to:'/admin/settings',label:'Thông tin cửa hàng',icon:Store},
    ]},
    {label:'Hệ thống',items:[
      {to:'/admin/import-export',label:'Nhập / xuất',icon:FileUp},
      {to:'/admin/activity',label:'Hoạt động',icon:Activity},
    ]},
  ].map(section=>({...section,items:section.items.filter(item=>hasPermission(user?.role,routePermission(item.to)))})).filter(section=>section.items.length),[pendingOrders,pendingReturns,lowStock,user?.role]);
  useEffect(()=>{setOpen(false)},[location.pathname]);
  useEffect(()=>{window.localStorage.setItem('tf:admin-sidebar-collapsed',collapsed?'1':'0')},[collapsed]);
  useEffect(()=>{try{window.localStorage.setItem('tf:admin-density',density)}catch{/* Density remains available for the current session when storage is blocked. */}},[density]);
  useEffect(()=>{if(!open)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[open]);
  const initials=(user?.name||user?.email||'A').trim().slice(0,1).toUpperCase();
  const liveData=dataSource==='firebase';
  const dataSourceLabel=dataSource==='loading'?'Đang tải Firebase':liveData?'Firebase live':dataSource==='error'?'Lỗi tải catalog':dataSource==='local'?'Local':'Dữ liệu mẫu';
  const toggleDensity=()=>{const next=density==='compact'?'comfortable':'compact';setDensity(next);sonnerToast.success(next==='compact'?'Đã chuyển bảng sang chế độ gọn':'Đã chuyển bảng sang chế độ thoáng')};
  return <div className={`v16-admin-shell tf-admin-v499 ${collapsed?'is-sidebar-collapsed':''} ${density==='compact'?'is-density-compact':''}`}>
    {open&&<button className="v16-admin-backdrop" aria-label="Đóng menu" onClick={()=>setOpen(false)}/>} 
    <aside className={`v16-admin-sidebar ${open?'is-open':''}`} aria-label="Điều hướng quản trị">
      <div className="v16-admin-brand">
        <Link to="/admin"><span className="v16-admin-mark">TF</span><span><b>TimeForge</b><small>Commerce</small></span></Link>
        <button className="v16-admin-close" onClick={()=>setOpen(false)} aria-label="Đóng menu"><X/></button>
      </div>
      <button className="v16-store-switcher"><span className="v16-store-avatar">TF</span><span><b>TimeForge</b><small>Cửa hàng chính</small></span><ChevronDown/></button>
      <nav className="v16-admin-nav">
        {sections.map((section,index)=><section key={section.label||index}>{section.label&&<p>{section.label}</p>}{section.items.map(({to,label,icon:Icon,count})=><NavLink key={to} to={to} end={to==='/admin'} title={label} onPointerEnter={()=>prefetchAdminRoute(to)} onFocus={()=>prefetchAdminRoute(to)}><Icon/><span>{label}</span>{Boolean(count)&&<em>{count}</em>}</NavLink>)}</section>)}
      </nav>
      <div className="v16-admin-sidebar-footer">
        <NavLink to="/admin/settings/integrations" title="Tích hợp"><Wrench/><span>Tích hợp</span></NavLink>
        {hasPermission(user?.role,'team.manage')&&<NavLink to="/admin/settings/team" title="Nhân sự & phân quyền"><Users/><span>Phân quyền</span></NavLink>}<NavLink to="/admin/settings" title="Cài đặt"><Settings/><span>Cài đặt</span></NavLink>
        <button className="v35-collapse-nav" onClick={()=>setCollapsed(value=>!value)} title={collapsed?'Mở rộng thanh điều hướng':'Thu gọn thanh điều hướng'}>{collapsed?<PanelLeftOpen/>:<PanelLeftClose/>}<span>{collapsed?'Mở rộng':'Thu gọn'}</span></button>
      </div>
    </aside>
    <div className="v16-admin-main">
      <header className="v16-admin-topbar">
        <button className="v16-menu-button" onClick={()=>setOpen(true)} aria-label="Mở menu"><Menu/></button>
        <button className="v16-command-button" onClick={()=>window.dispatchEvent(new Event('timeforge:open-command'))}><Search/><span>Tìm kiếm trong TimeForge</span><kbd>Ctrl K</kbd></button>
        <div className="v16-topbar-actions">
          <span className={`v16-data-state ${liveData?'is-live':''}`} title="Nguồn catalog hiện tại"><i/>{dataSourceLabel}</span>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="secondary" size="sm" className="v16-create-button"><Plus/>Tạo mới<ChevronDown/></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={()=>navigate('/admin/products/new')}><Boxes/>Sản phẩm</DropdownMenuItem><DropdownMenuItem onSelect={()=>navigate('/admin/draft-orders/new')}><FileText/>Đơn hàng nháp</DropdownMenuItem><DropdownMenuItem onSelect={()=>navigate('/admin/discounts')}><BadgePercent/>Mã giảm giá</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
          <Link className="v16-view-store" to="/" target="_blank">Xem cửa hàng<ArrowUpRight/></Link>
          <DropdownMenu><DropdownMenuTrigger asChild><button className="v16-icon-action v35-notification-trigger" aria-label="Thông báo"><Bell/>{(pendingOrders+pendingReturns+lowStock)>0&&<span>{Math.min(pendingOrders+pendingReturns+lowStock,99)}</span>}</button></DropdownMenuTrigger><DropdownMenuContent align="end" className="v35-notification-menu"><div className="v35-notification-heading"><b>Thông báo</b><small>Các việc cần xử lý</small></div>{pendingOrders>0&&<DropdownMenuItem onSelect={()=>navigate('/admin/orders')}><ShoppingBag/><span><b>{pendingOrders} đơn hàng đang mở</b><small>Kiểm tra thanh toán và xử lý đơn</small></span></DropdownMenuItem>}{pendingReturns>0&&<DropdownMenuItem onSelect={()=>navigate('/admin/returns')}><RotateCcw/><span><b>{pendingReturns} yêu cầu hoàn trả</b><small>Đang chờ xét duyệt</small></span></DropdownMenuItem>}{lowStock>0&&<DropdownMenuItem onSelect={()=>navigate('/admin/inventory')}><PackageSearch/><span><b>{lowStock} sản phẩm sắp hết</b><small>Cần bổ sung hoặc điều chỉnh tồn kho</small></span></DropdownMenuItem>}{pendingOrders+pendingReturns+lowStock===0&&<div className="v35-notification-empty"><Bell/><b>Không có việc gấp</b><small>Cửa hàng đang hoạt động ổn định.</small></div>}</DropdownMenuContent></DropdownMenu>
          <DropdownMenu><DropdownMenuTrigger asChild><button className="v16-user-trigger"><span>{initials}</span><span><b>{user?.name||'Admin'}</b><small>{user?.role?roleLabels[user.role]:'Quản trị viên'}</small></span><ChevronDown/></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="v16-user-menu"><DropdownMenuItem onSelect={()=>navigate('/admin/settings')}><CircleUserRound/>Tài khoản quản trị</DropdownMenuItem><DropdownMenuItem onSelect={toggleDensity}><Rows3/>{density==='compact'?'Chế độ bảng: Gọn':'Chế độ bảng: Thoáng'}</DropdownMenuItem><DropdownMenuSeparator/><DropdownMenuItem className="danger" onSelect={()=>void logout()}>Đăng xuất</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
      </header>
      <div className={`v16-admin-page ${meta.fullBleed?'is-fullbleed':''}`}>
        {!meta.fullBleed&&<header className="v16-page-header"><div><div className="v35-page-breadcrumb"><Link to="/admin">TimeForge</Link><ChevronRight/><span>{meta.title}</span></div><small>{meta.eyebrow}</small><h1>{meta.title}</h1><p>{meta.description}</p></div><ChevronRight aria-hidden="true"/></header>}
        <main className="v16-admin-content"><AdminRouteBoundary key={location.pathname}><Outlet/></AdminRouteBoundary></main>
      </div>
    </div>
    <ToastBridge/><AdminCommandPalette/>
  </div>;
}
