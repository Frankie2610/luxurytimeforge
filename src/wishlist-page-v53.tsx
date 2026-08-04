import {ArrowRight, ArrowUpDown, Heart, ShieldCheck, ShoppingBag, Trash2} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {toast} from 'sonner';
import {useCommerce} from './context';
import {SmartImage, productImage} from './image-utils';
import {discount, money} from './utils';
import {useWishlist} from './wishlist';
import './v53-wishlist.css';

type WishlistSort = 'recent' | 'price-asc' | 'price-desc' | 'name';
const WISHLIST_SORT_KEY = 'tf:wishlist:sort:v1';
const wishlistSorts: Array<{value: WishlistSort; label: string}> = [
  {value: 'recent', label: 'Mới lưu gần đây'},
  {value: 'price-asc', label: 'Giá thấp đến cao'},
  {value: 'price-desc', label: 'Giá cao đến thấp'},
  {value: 'name', label: 'Tên A–Z'},
];
const readWishlistSort = (): WishlistSort => {
  if (typeof window === 'undefined') return 'recent';
  try {
    const value = window.localStorage.getItem(WISHLIST_SORT_KEY);
    return wishlistSorts.some((item) => item.value === value) ? value as WishlistSort : 'recent';
  } catch {
    return 'recent';
  }
};

export function WishlistPageV53() {
  const {products, addToCart} = useCommerce();
  const {ids, remove, clear} = useWishlist();
  const [sort, setSort] = useState<WishlistSort>(readWishlistSort);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const wishlistProducts = useMemo(() => ids.flatMap((id) => {
    const product = productById.get(id);
    return product?.status === 'active' && product.published ? [product] : [];
  }), [ids, productById]);
  const visibleProducts = useMemo(() => {
    const next = [...wishlistProducts];
    if (sort === 'price-asc') return next.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') return next.sort((a, b) => b.price - a.price);
    if (sort === 'name') return next.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    return next;
  }, [sort, wishlistProducts]);
  const availableProducts = useMemo(() => wishlistProducts.filter((product) => product.inventory > 0), [wishlistProducts]);

  useEffect(() => {
    try {
      window.localStorage.setItem(WISHLIST_SORT_KEY, sort);
    } catch {
      // Sorting remains available for the current page when storage is blocked.
    }
  }, [sort]);

  const addAllAvailable = () => {
    availableProducts.forEach((product) => addToCart(product.id, product.variants[0]?.id || '', 1));
    toast.success(`Đã thêm ${availableProducts.length} sản phẩm có sẵn vào giỏ hàng`);
  };

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
        <div className="tf55-wishlist-actions">
          <label className="tf55-wishlist-sort">
            <ArrowUpDown aria-hidden="true"/>
            <span>Sắp xếp</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as WishlistSort)} aria-label="Sắp xếp danh sách yêu thích">
              {wishlistSorts.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <button className="tf55-wishlist-add-all" type="button" disabled={!availableProducts.length} onClick={addAllAvailable}><ShoppingBag/>Thêm tất cả có sẵn</button>
          <button className="tf55-wishlist-clear" type="button" onClick={() => {if (window.confirm('Xóa toàn bộ danh sách yêu thích?')) clear();}}><Trash2/>Xóa danh sách</button>
        </div>
      </div>
      <div className="tf55-wishlist-summary" aria-live="polite"><b>{visibleProducts.length}</b> thiết kế · <span>{availableProducts.length} sản phẩm đang có sẵn</span></div>
      <section className="tf53-wishlist-grid" aria-label="Sản phẩm yêu thích">
        {visibleProducts.map((product) => {
          const sale = discount(product.price, product.compareAtPrice);
          return <article className="tf53-wishlist-card" key={product.id}>
            <Link className="tf53-wishlist-media" to={`/products/${product.handle}`}>
              <SmartImage src={productImage(product)} alt={product.title} width={720} height={720} sizes="(max-width: 640px) 132px, (max-width: 1024px) 46vw, 30vw"/>
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
