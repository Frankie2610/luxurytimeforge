import {lazy,Suspense} from 'react';
import {Navigate,Route,Routes} from 'react-router-dom';
import {ProtectedAdmin} from './auth';
import {PermissionGate} from './access-denied-v20';

const StoreLayout=lazy(()=>import('./storefront-v10').then(m=>({default:m.StoreLayoutV10})));
const Home=lazy(()=>import('./storefront-v10').then(m=>({default:m.HomeV10})));
const CollectionPage=lazy(()=>import('./storefront-v10').then(m=>({default:m.CollectionPageV10})));
const ProductPage=lazy(()=>import('./storefront-v10').then(m=>({default:m.ProductPageV10})));
const SearchPage=lazy(()=>import('./storefront-v10').then(m=>({default:m.SearchPageV10})));
const ContentPage=lazy(()=>import('./storefront-v10').then(m=>({default:m.ContentPageV10})));
const NotFound=lazy(()=>import('./storefront-v10').then(m=>({default:m.NotFoundV10})));
const CartPageV11=lazy(()=>import('./checkout-v11').then(m=>({default:m.CartPageV11})));
const CheckoutPageV11=lazy(()=>import('./checkout-v11').then(m=>({default:m.CheckoutPageV11})));
const OrderConfirmationV11=lazy(()=>import('./checkout-v11').then(m=>({default:m.OrderConfirmationV11})));
const PayOSReturnPageV4927=lazy(()=>import('./payos-return-v4927').then(m=>({default:m.PayOSReturnPageV4927})));
const CustomerLoginV12=lazy(()=>import('./customer-account-v12').then(m=>({default:m.CustomerLoginV12})));
const CustomerAccountV12=lazy(()=>import('./customer-account-v12').then(m=>({default:m.CustomerAccountV12})));
const CustomerOrderV12=lazy(()=>import('./customer-account-v12').then(m=>({default:m.CustomerOrderV12})));
const TrackOrderV12=lazy(()=>import('./customer-account-v12').then(m=>({default:m.TrackOrderV12})));
const CustomerReturnV13=lazy(()=>import('./returns-v13').then(m=>({default:m.CustomerReturnV13})));
const ReturnsAdminV13=lazy(()=>import('./returns-v13').then(m=>({default:m.ReturnsAdminV13})));
const IntegrationsV13=lazy(()=>import('./integrations-v13').then(m=>({default:m.IntegrationsV13})));
const AdminLayout=lazy(()=>import('./admin-shell-v16').then(m=>({default:m.AdminLayoutV16})));
const ProductEditor=lazy(()=>import('./product-editor-v39').then(m=>({default:m.ProductEditorV39})));
const Collections=lazy(()=>import('./admin').then(m=>({default:m.Collections})));
const ImportExport=lazy(()=>import('./admin').then(m=>({default:m.ImportExport})));
const SettingsPage=lazy(()=>import('./admin').then(m=>({default:m.SettingsPage})));
const ProductsV9=lazy(()=>import('./admin-v9').then(m=>({default:m.ProductsV9})));
const AdminLogin=lazy(()=>import('./login').then(m=>({default:m.AdminLogin})));
const AcceptAdminInviteV4917=lazy(()=>import('./admin-invite').then(m=>({default:m.AcceptAdminInviteV4917})));
const ActivityLog=lazy(()=>import('./operations').then(m=>({default:m.ActivityLog})));
const AnalyticsV15=lazy(()=>import('./analytics-v15').then(m=>({default:m.AnalyticsV15})));
const CustomersV3=lazy(()=>import('./admin-operations-v10').then(m=>({default:m.CustomersV10})));
const OrdersV11=lazy(()=>import('./admin-sprint11').then(m=>({default:m.OrdersV11})));
const CustomerSegmentsV11=lazy(()=>import('./admin-sprint11').then(m=>({default:m.CustomerSegmentsV11})));
const DraftOrdersV12=lazy(()=>import('./admin-sprint12').then(m=>({default:m.DraftOrdersV12})));
const DraftOrderEditorV12=lazy(()=>import('./admin-sprint12').then(m=>({default:m.DraftOrderEditorV12})));
const OrderDetailV12=lazy(()=>import('./admin-sprint12').then(m=>({default:m.OrderDetailV12})));
const InvoiceV12=lazy(()=>import('./admin-sprint12').then(m=>({default:m.InvoiceV12})));
const DraftInvoiceV12=lazy(()=>import('./admin-sprint12').then(m=>({default:m.DraftInvoiceV12})));
const ShippingLabelV12=lazy(()=>import('./admin-sprint12').then(m=>({default:m.ShippingLabelV12})));
const OnlineStoreV19=lazy(()=>import('./online-store-v19').then(m=>({default:m.OnlineStoreV19})));
const BlogIndexV18=lazy(()=>import('./blog-v18').then(m=>({default:m.BlogIndexV18})));
const BlogPostPageV18=lazy(()=>import('./blog-v18').then(m=>({default:m.BlogPostPageV18})));
const AdminBlogsV18=lazy(()=>import('./blog-v18').then(m=>({default:m.AdminBlogsV18})));
const ContentPagesAdminV23=lazy(()=>import('./content-pages-admin-v23').then(m=>({default:m.ContentPagesAdminV23})));
const DashboardV3=lazy(()=>import('./operations').then(m=>({default:m.DashboardV3})));
const Discounts=lazy(()=>import('./admin-operations-v10').then(m=>({default:m.DiscountsV10})));
const TeamPermissionsV20=lazy(()=>import('./team-v20').then(m=>({default:m.TeamPermissionsV20})));
const InventoryV3=lazy(()=>import('./admin-operations-v10').then(m=>({default:m.InventoryV10})));


function AdminRouteLoading(){return <div className="tf-admin-boot" aria-label="Đang tải trang quản trị" aria-busy="true"><div className="tf-admin-boot-bar"/><div className="tf-admin-boot-shell"><aside><i/><i/><i/><i/><i/></aside><main><header><i/><i/></header><section><i/><i/><div><i/><i/><i/></div></section></main></div></div>}
function RouteLoading(){const adminRoute=typeof window!=='undefined'&&window.location.pathname.startsWith('/admin');if(adminRoute)return <AdminRouteLoading/>;return <div className="route-loading" aria-label="Đang tải trang" aria-busy="true"><div className="route-loading-bar"/><div className="route-loading-brand"><img src="/luxury-timeforge-logo.svg" alt="" aria-hidden="true"/><i/><b>Đang tải Luxury Timeforge</b></div></div>}

export function App(){return <Suspense fallback={<RouteLoading/>}><Routes>
 <Route element={<StoreLayout/>}>
  <Route path="/" element={<Home/>}/><Route path="/collections" element={<CollectionPage/>}/><Route path="/collections/:handle" element={<CollectionPage/>}/><Route path="/products/:handle" element={<ProductPage/>}/><Route path="/search" element={<SearchPage/>}/><Route path="/cart" element={<CartPageV11/>}/><Route path="/checkout" element={<CheckoutPageV11/>}/><Route path="/payment/payos/return" element={<PayOSReturnPageV4927/>}/><Route path="/order-confirmation/:id" element={<OrderConfirmationV11/>}/><Route path="/blogs" element={<BlogIndexV18/>}/><Route path="/blogs/:handle" element={<BlogPostPageV18/>}/><Route path="/pages/:slug" element={<ContentPage/>}/><Route path="/404" element={<NotFound/>}/>
 </Route>
 <Route path="/account/login" element={<CustomerLoginV12/>}/><Route path="/account" element={<CustomerAccountV12/>}/><Route path="/account/orders/:id" element={<CustomerOrderV12/>}/><Route path="/account/orders/:id/return" element={<CustomerReturnV13/>}/><Route path="/track-order" element={<TrackOrderV12/>}/>
 <Route path="/admin/orders/:id/invoice" element={<ProtectedAdmin><InvoiceV12/></ProtectedAdmin>}/><Route path="/admin/orders/:id/shipping-label" element={<ProtectedAdmin><ShippingLabelV12/></ProtectedAdmin>}/><Route path="/admin/draft-orders/:id/invoice" element={<ProtectedAdmin><DraftInvoiceV12/></ProtectedAdmin>}/>
 <Route path="/admin/login" element={<AdminLogin/>}/><Route path="/admin/accept-invite" element={<AcceptAdminInviteV4917/>}/>
 <Route path="/admin" element={<ProtectedAdmin><PermissionGate><AdminLayout/></PermissionGate></ProtectedAdmin>}>
  <Route index element={<DashboardV3/>}/><Route path="orders" element={<OrdersV11/>}/><Route path="orders/:id" element={<OrderDetailV12/>}/><Route path="returns" element={<ReturnsAdminV13/>}/><Route path="draft-orders" element={<DraftOrdersV12/>}/><Route path="draft-orders/new" element={<DraftOrderEditorV12/>}/><Route path="draft-orders/:id" element={<DraftOrderEditorV12/>}/><Route path="products" element={<ProductsV9/>}/><Route path="products/new" element={<ProductEditor/>}/><Route path="products/:id" element={<ProductEditor/>}/><Route path="collections" element={<Collections/>}/><Route path="inventory" element={<InventoryV3/>}/><Route path="customers" element={<CustomersV3/>}/><Route path="customer-segments" element={<CustomerSegmentsV11/>}/><Route path="analytics" element={<AnalyticsV15/>}/><Route path="discounts" element={<Discounts/>}/><Route path="activity" element={<ActivityLog/>}/><Route path="blogs" element={<AdminBlogsV18/>}/><Route path="pages" element={<ContentPagesAdminV23/>}/><Route path="import-export" element={<ImportExport/>}/><Route path="online-store" element={<OnlineStoreV19/>}/><Route path="settings" element={<SettingsPage/>}/><Route path="settings/integrations" element={<IntegrationsV13/>}/><Route path="settings/team" element={<TeamPermissionsV20/>}/>
 </Route>
 <Route path="*" element={<Navigate to="/404"/>}/>
</Routes></Suspense>}
