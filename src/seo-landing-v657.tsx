import {Link,Navigate,useLocation} from 'react-router-dom';
import {ArrowRight,Search} from 'lucide-react';
import {useMemo} from 'react';
import {useStorefrontData} from './context';
import {LuxuryProductCard} from './storefront-v10';
import {SEO_LANDING_PAGES,getSeoLandingByPath,matchSeoLandingProduct} from './seo-discovery-v657';
import './v657-seo-landing.css';

export function SeoLandingPageV657(){
  const location=useLocation();
  const{products}=useStorefrontData();
  const landing=getSeoLandingByPath(location.pathname);
  const matched=useMemo(()=>landing?products.filter(product=>matchSeoLandingProduct(landing,product)).slice(0,48):[],[landing,products]);
  if(!landing)return <Navigate to="/404" replace/>;
  return <main className="tf657-seo-page">
    <section className="tf657-seo-hero">
      <div><small>{landing.eyebrow}</small><h1>{landing.title}</h1><p>{landing.intro}</p></div>
    </section>
    <nav className="tf657-seo-nav" aria-label="Mua đồng hồ theo nhu cầu">
      <span>Mua theo nhu cầu</span>
      <div>{SEO_LANDING_PAGES.map(item=><Link key={item.path} to={item.path} aria-current={item.path===landing.path?'page':undefined}>{item.title}<ArrowRight/></Link>)}</div>
    </nav>
    <section className="tf657-seo-products" aria-label={landing.title}>
      <header><div><small>GỢI Ý TỪ CATALOG</small><h2>{matched.length} mẫu phù hợp</h2></div><Link to="/collections">Xem toàn bộ đồng hồ<ArrowRight/></Link></header>
      {matched.length?<div className="lux-product-grid v23-columns-4">{matched.map(product=><LuxuryProductCard key={product.id} product={product}/>)}</div>:<div className="tf657-seo-empty"><Search/><h2>Chưa có sản phẩm phù hợp</h2><p>Catalog hiện chưa có mẫu khớp tiêu chí này. Bạn có thể xem toàn bộ sản phẩm hoặc dùng Watch Finder.</p><div><Link to="/collections">Xem tất cả</Link><Link to="/watch-finder">Tư vấn chọn đồng hồ</Link></div></div>}
    </section>
    <section className="tf657-seo-copy"><h2>Chọn đồng hồ online dễ hơn</h2><p>{landing.description} Các sản phẩm trong danh sách được lấy trực tiếp từ catalog đang xuất bản, vì vậy giá và tình trạng hàng trên trang này đồng bộ với trang sản phẩm.</p><div><Link to="/pages/warranty">Chính sách bảo hành</Link><Link to="/pages/shipping">Giao hàng</Link><Link to="/pages/returns">Đổi trả</Link></div></section>
  </main>;
}
