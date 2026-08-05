import {
  ArrowRight,
  ArrowUpDown,
  Check,
  GitCompareArrows,
  Heart,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import {useEffect, useMemo, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {toast} from 'sonner';
import {useCartActions, useCommerce} from './context';
import {SmartImage, productImage} from './image-utils';
import {discount, money} from './utils';
import {useWishlist} from './wishlist';
import './v53-wishlist.css';
import './v560-wishlist-features.css';
import './v561-wishlist-hotfix.css';
import './v562-wishlist-refinement.css';
import './v563-wishlist-control.css';

type WishlistSort = 'recent' | 'price-asc' | 'price-desc' | 'name';
const WISHLIST_SORT_KEY = 'tf:wishlist:sort:v1';
const MAX_SHARED_ITEMS = 24;
const MAX_COMPARE_ITEMS = 3;
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

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Clipboard is unavailable');
}

export function WishlistPageV53() {
  const {products} = useCommerce();
  const {addToCart} = useCartActions();
  const {ids, addMany, remove, clear} = useWishlist();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sort, setSort] = useState<WishlistSort>(readWishlistSort);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const importedSharedRef = useRef('');
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const wishlistProducts = useMemo(() => ids.flatMap((id) => {
    const product = productById.get(id);
    return product?.status === 'active' && product.published ? [product] : [];
  }), [ids, productById]);
  const wishlistIdSet = useMemo(() => new Set(wishlistProducts.map((product) => product.id)), [wishlistProducts]);
  const visibleProducts = useMemo(() => {
    const next = [...wishlistProducts];
    if (sort === 'price-asc') return next.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') return next.sort((a, b) => b.price - a.price);
    if (sort === 'name') return next.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    return next;
  }, [sort, wishlistProducts]);
  const availableProducts = useMemo(() => wishlistProducts.filter((product) => product.inventory > 0), [wishlistProducts]);
  const compareProducts = useMemo(() => compareIds.flatMap((id) => {
    const product = productById.get(id);
    return product ? [product] : [];
  }), [compareIds, productById]);
  const sharedWishlistIds = searchParams.getAll('wish').slice(0, MAX_SHARED_ITEMS);
  const sharedWishlistKey = sharedWishlistIds.join('\u001f');

  useEffect(() => {
    try {
      window.localStorage.setItem(WISHLIST_SORT_KEY, sort);
    } catch {
      // Sorting remains available for the current page when storage is blocked.
    }
  }, [sort]);

  useEffect(() => {
    if (!sharedWishlistKey || !products.length || importedSharedRef.current === sharedWishlistKey) return;
    importedSharedRef.current = sharedWishlistKey;
    const validIds = [...new Set(sharedWishlistIds)].filter((id) => {
      const product = productById.get(id);
      return product?.status === 'active' && product.published;
    });
    const addedCount = validIds.filter((id) => !ids.includes(id)).length;
    if (validIds.length) addMany(validIds);

    const cleanParams = new URLSearchParams(searchParams);
    cleanParams.delete('wish');
    setSearchParams(cleanParams, {replace: true});
    if (addedCount) toast.success(`Đã nhập ${addedCount} sản phẩm vào danh sách yêu thích`);
    else if (validIds.length) toast.info('Các sản phẩm được chia sẻ đã có trong danh sách');
    else toast.info('Liên kết chia sẻ không còn sản phẩm khả dụng');
  }, [addMany, ids, productById, products.length, searchParams, setSearchParams, sharedWishlistIds, sharedWishlistKey]);

  useEffect(() => {
    setCompareIds((current) => {
      const next = current.filter((id) => wishlistIdSet.has(id));
      return next.length === current.length ? current : next;
    });
  }, [wishlistIdSet]);

  useEffect(() => {
    if (!compareOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCompareOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [compareOpen]);

  useEffect(() => {
    if (compareOpen && compareProducts.length < 2) setCompareOpen(false);
  }, [compareOpen, compareProducts.length]);

  const addAllAvailable = () => {
    availableProducts.forEach((product) => addToCart(product.id, product.variants[0]?.id || '', 1));
    toast.success(`Đã thêm ${availableProducts.length} sản phẩm có sẵn vào giỏ hàng`);
  };

  const shareWishlist = async () => {
    const sharedIds = wishlistProducts.slice(0, MAX_SHARED_ITEMS).map((product) => product.id);
    if (!sharedIds.length) return;
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    sharedIds.forEach((id) => url.searchParams.append('wish', id));
    try {
      if (navigator.share && window.matchMedia('(max-width: 760px)').matches) {
        await navigator.share({title: 'Danh sách yêu thích TIMEFORGE', text: 'Xem các thiết kế mình đã tuyển chọn.', url: url.toString()});
      } else {
        await copyText(url.toString());
        toast.success('Đã sao chép liên kết danh sách yêu thích');
      }
      if (wishlistProducts.length > MAX_SHARED_ITEMS) toast.info(`Liên kết gồm ${MAX_SHARED_ITEMS} sản phẩm đầu tiên`);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('Chưa thể chia sẻ danh sách. Hãy thử lại.');
    }
  };

  const toggleCompare = (productId: string) => {
    if (compareIds.includes(productId)) {
      setCompareIds((current) => current.filter((id) => id !== productId));
      return;
    }
    if (compareIds.length >= MAX_COMPARE_ITEMS) {
      toast.info('Bạn có thể so sánh tối đa 3 sản phẩm');
      return;
    }
    setCompareIds((current) => [...current, productId]);
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
          <button className="tf56-share-wishlist" type="button" onClick={shareWishlist}><Share2/>Chia sẻ</button>
          <button className="tf55-wishlist-add-all" type="button" disabled={!availableProducts.length} onClick={addAllAvailable}><ShoppingBag/>Thêm tất cả có sẵn</button>
          <button className="tf55-wishlist-clear" type="button" onClick={() => {if (window.confirm('Xóa toàn bộ danh sách yêu thích?')) clear();}}><Trash2/>Xóa danh sách</button>
        </div>
      </div>
      <div className="tf55-wishlist-summary" aria-live="polite"><b>{visibleProducts.length}</b> thiết kế · <span>{availableProducts.length} sản phẩm đang có sẵn</span></div>
      <section className="tf53-wishlist-grid" aria-label="Sản phẩm yêu thích">
        {visibleProducts.map((product) => {
          const sale = discount(product.price, product.compareAtPrice);
          const selectedForCompare = compareIds.includes(product.id);
          return <article className={`tf53-wishlist-card ${selectedForCompare ? 'is-selected-for-compare' : ''}`} key={product.id}>
            <div className="tf53-wishlist-media-wrap">
              <Link className="tf53-wishlist-media" to={`/products/${product.handle}`}>
                <SmartImage src={productImage(product)} alt={product.title} width={720} height={720} sizes="(max-width: 640px) calc(50vw - 18px), (max-width: 1024px) 46vw, 30vw"/>
                {sale > 0 && <span>–{sale}%</span>}
              </Link>
              <button
                className={`tf56-compare-toggle ${selectedForCompare ? 'is-active' : ''}`}
                type="button"
                aria-pressed={selectedForCompare}
                aria-label={`${selectedForCompare ? 'Bỏ' : 'Chọn'} ${product.title} để so sánh`}
                onClick={() => toggleCompare(product.id)}
              >{selectedForCompare ? <Check/> : <GitCompareArrows/>}<span>{selectedForCompare ? 'Đã chọn' : 'So sánh'}</span></button>
            </div>
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

    {compareProducts.length > 0 && <aside className="tf56-compare-dock" aria-live="polite" aria-label="Sản phẩm đang chọn để so sánh">
      <div className="tf56-compare-dock-copy">
        <span><GitCompareArrows/></span>
        <div><b>So sánh sản phẩm</b><small>Đã chọn {compareProducts.length}/{MAX_COMPARE_ITEMS}</small></div>
      </div>
      <div className="tf56-compare-thumbs" aria-hidden="true">
        {compareProducts.map((product) => <SmartImage key={product.id} src={productImage(product)} alt="" width={54} height={54}/>) }
      </div>
      <div className="tf56-compare-dock-actions">
        <button className="clear" type="button" onClick={() => setCompareIds([])}><X/>Bỏ chọn</button>
        <button className="compare" type="button" disabled={compareProducts.length < 2} onClick={() => setCompareOpen(true)}>So sánh ngay<ArrowRight/></button>
      </div>
    </aside>}

    {compareOpen && compareProducts.length >= 2 && <div className="tf56-compare-shell" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setCompareOpen(false);
    }}>
      <section className="tf56-compare-modal" role="dialog" aria-modal="true" aria-labelledby="tf56-compare-title">
        <header>
          <div><small>PRODUCT COMPARE</small><h2 id="tf56-compare-title">So sánh thiết kế</h2></div>
          <button type="button" onClick={() => setCompareOpen(false)} aria-label="Đóng bảng so sánh"><X/></button>
        </header>
        <div className="tf56-compare-scroll">
          <table>
            <caption>So sánh thông tin của các sản phẩm đã chọn</caption>
            <thead>
              <tr><th scope="col">Tiêu chí</th>{compareProducts.map((product) => <th scope="col" key={product.id}>{product.title}</th>)}</tr>
            </thead>
            <tbody>
              <tr className="product-media-row"><th scope="row">Sản phẩm</th>{compareProducts.map((product) => <td key={product.id}><SmartImage src={productImage(product)} alt={product.title} width={320} height={320}/></td>)}</tr>
              <tr><th scope="row">Giá</th>{compareProducts.map((product) => <td key={product.id}><strong>{money(product.price)}</strong>{product.compareAtPrice > product.price && <del>{money(product.compareAtPrice)}</del>}</td>)}</tr>
              <tr><th scope="row">Thương hiệu</th>{compareProducts.map((product) => <td key={product.id}>{product.vendor || 'TIMEFORGE'}</td>)}</tr>
              <tr><th scope="row">Loại sản phẩm</th>{compareProducts.map((product) => <td key={product.id}>{product.productType || product.category || '—'}</td>)}</tr>
              <tr><th scope="row">Tình trạng</th>{compareProducts.map((product) => <td key={product.id}><span className={product.inventory > 0 ? 'available' : 'unavailable'}>{product.inventory > 0 ? `Còn ${product.inventory} sản phẩm` : 'Tạm hết hàng'}</span></td>)}</tr>
              <tr><th scope="row">SKU</th>{compareProducts.map((product) => <td key={product.id}>{product.sku || '—'}</td>)}</tr>
              <tr className="product-action-row"><th scope="row">Chi tiết</th>{compareProducts.map((product) => <td key={product.id}><Link to={`/products/${product.handle}`} onClick={() => setCompareOpen(false)}>Xem sản phẩm<ArrowRight/></Link></td>)}</tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>}
  </div>;
}
