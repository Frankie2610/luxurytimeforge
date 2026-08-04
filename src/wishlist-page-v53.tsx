import {ArrowRight, Heart, ShieldCheck, ShoppingBag, Trash2} from 'lucide-react';
import {Link} from 'react-router-dom';
import {toast} from 'sonner';
import {useCommerce} from './context';
import {SmartImage, productImage} from './image-utils';
import {discount, money} from './utils';
import {useWishlist} from './wishlist';
import './v53-wishlist.css';

export function WishlistPageV53() {
  const {products, addToCart} = useCommerce();
  const {ids, remove, clear} = useWishlist();
  const wishlistProducts = ids
    .map((id) => products.find((product) => product.id === id))
    .filter((product) => product?.status === 'active' && product.published);

  return <div className="tf53-wishlist-page">
    <header className="tf53-wishlist-hero">
      <div>
        <small>YOUR TIMEFORGE EDIT</small>
        <h1>Danh sách yêu thích</h1>
        <p>Lưu những thiết kế bạn quan tâm để quay lại so sánh và mua sau trên thiết bị này.</p>
      </div>
      <span><Heart fill="currentColor"/><b>{wishlistProducts.length}</b>sản phẩm</span>
    </header>

    {wishlistProducts.length ? <>
      <div className="tf53-wishlist-toolbar">
        <p><ShieldCheck/>Danh sách được lưu riêng trên thiết bị, không cần đăng nhập.</p>
        <button type="button" onClick={() => {if (window.confirm('Xóa toàn bộ danh sách yêu thích?')) clear();}}><Trash2/>Xóa danh sách</button>
      </div>
      <section className="tf53-wishlist-grid" aria-label="Sản phẩm yêu thích">
        {wishlistProducts.map((product) => {
          if (!product) return null;
          const sale = discount(product.price, product.compareAtPrice);
          return <article className="tf53-wishlist-card" key={product.id}>
            <Link className="tf53-wishlist-media" to={`/products/${product.handle}`}>
              <SmartImage src={productImage(product)} alt={product.title} width={760} height={760} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"/>
              {sale > 0 && <span>–{sale}%</span>}
            </Link>
            <div className="tf53-wishlist-copy">
              <small>{product.vendor || 'TIMEFORGE'}</small>
              <Link to={`/products/${product.handle}`}>{product.title}</Link>
              <div><strong>{money(product.price)}</strong>{product.compareAtPrice > product.price && <del>{money(product.compareAtPrice)}</del>}</div>
              <p className={product.inventory > 0 ? 'available' : ''}>{product.inventory > 0 ? `Còn ${product.inventory} sản phẩm` : 'Tạm hết hàng'}</p>
            </div>
            <footer>
              <button type="button" className="remove" onClick={() => remove(product.id)} aria-label={`Xóa ${product.title} khỏi yêu thích`}><Trash2/><span>Xóa</span></button>
              <button type="button" className="add" disabled={product.inventory <= 0} onClick={() => {
                addToCart(product.id, product.variants[0]?.id || '', 1);
                toast.success('Đã thêm sản phẩm vào giỏ hàng');
              }}><ShoppingBag/>{product.inventory > 0 ? 'Thêm vào giỏ' : 'Tạm hết hàng'}</button>
            </footer>
          </article>;
        })}
      </section>
    </> : <section className="tf53-wishlist-empty">
      <span><Heart/></span>
      <small>WISHLIST</small>
      <h2>Chưa có thiết kế nào được lưu</h2>
      <p>Chạm biểu tượng trái tim trên sản phẩm để tạo danh sách tuyển chọn của riêng bạn.</p>
      <Link to="/collections">Khám phá bộ sưu tập<ArrowRight/></Link>
    </section>}
  </div>;
}
