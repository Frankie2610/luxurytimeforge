import './legacy.css';
import {AnimatePresence, motion} from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Heart,
  Menu,
  Minus,
  PackageCheck,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  UserRound,
  X,
  ZoomIn,
} from 'lucide-react';
import {useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent} from 'react';
import {createPortal} from 'react-dom';
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {useCommerce} from './context';
import type {Collection, Product, ProductGroup, ProductGroupItem, Section, ThemeBlock} from './types';
import {discount, money} from './utils';
import {optimizedImage, productImage, SmartImage} from './image-utils';
import {Accordion, Button, Dialog, DialogContent} from './ui';
import {toast} from 'sonner';
import {captureCommerceAttribution,trackCommerceEvent} from './commerce-events';
import {BlogCardsV18} from './blog-home-cards-v18';
import {readThemeExtrasV23, THEME_EXTRAS_EVENT, type ThemeExtrasV23} from './theme-extras-v23';
import {ThemePreviewBridgeV26} from './theme-preview-bridge-v26';
import {isThemePreviewV26, readThemePreviewExtrasV26, THEME_PREVIEW_UPDATED_V26} from './theme-preview-v26';
import {sectionLabels, blockLabels} from './theme';
import {ThemeSectionV27, isSharedThemeSectionV27} from './theme-section-v27';
import {useManagedContentPages} from './content-pages-v23';
import {findProductByRoute} from './product-data';
import {DEFAULT_STORE_LOGO, resolveCustomStoreLogo, resolveStoreIcon, resolveStoreLogo, resolveStoreName} from './store-profile';
import {useWishlist} from './wishlist';
import {
  BankCardMark,
  FacebookMark,
  InstagramMark,
  MastercardMark,
  MomoMark,
  PayosMark,
  TiktokMark,
  VisaMark,
  ZalopayMark,
} from './brand-icons';
import {
  emptyProductFilterSelection,
  PRODUCT_FILTER_DEFINITIONS,
  readProductFilterValues,
  type ProductFilterKey,
  type ProductFilterOption,
} from './product-filter-data';
import './v4913-storefront-compat.css';
import './v4912-storefront.css';
import './v4918-flat-product-cards.css';
import './v4920-storefront-mobile.css';
import './v4923-storefront.css';
import './v4924-storefront.css';
import './v4925-storefront.css';
import './v4933-collection.css';
import './v4936-mobile-product-grid.css';
import './v50-storefront-polish.css';
import './v502-storefront-contrast.css';
import './v503-storefront-filter.css';
import './v504-storefront-final.css';
import './v508-storefront-final.css';
import './v509-storefront-final.css';
import './v510-storefront-stability.css';
import './v512-storefront-corrections.css';
import './v513-storefront-enhancements.css';
import './v521-ui-polish.css';
import './v522-ui-refinement.css';
import './v523-product-admin-fix.css';
import './v531-storefront-additions.css';

const flattenThemeBlocks = (blocks: ThemeBlock[] = []): ThemeBlock[] => blocks.flatMap((item) => item.type === 'group' ? (item.visible ? flattenThemeBlocks(item.children || []) : []) : item.visible ? [item] : []);
const getBlock = (section: Section | undefined, type: ThemeBlock['type']) =>
  flattenThemeBlocks(section?.blocks || []).find((item) => item.type === type);
const getBlocks = (section: Section | undefined, type: ThemeBlock['type']) =>
  flattenThemeBlocks(section?.blocks || []).filter((item) => item.type === type);
const themeBlockProps = (block?: ThemeBlock) => block ? ({'data-theme-block-id': block.id, 'data-theme-block-label': blockLabels[block.type]}) : {};

function LuxuryLogo() {
  const {theme} = useCommerce();
  const storeName = resolveStoreName(theme.settings.storeName);
  const customLogo = resolveCustomStoreLogo(theme.settings.logoImage);
  const logoSource = customLogo ? optimizedImage(customLogo, 220, 220, 'fit') : DEFAULT_STORE_LOGO;
  return (
    <Link className="lux-logo tf522-store-brand" to="/" aria-label={storeName}>
      <span className={`tf-logo-lockup-v44 tf522-logo-lockup ${customLogo ? 'has-custom-logo' : 'uses-default-logo'}`}>
        <span className="tf522-logo-media" aria-hidden="true">
          <img
            className={customLogo ? 'tf-store-logo-image-v513' : 'tf522-default-store-logo'}
            src={logoSource}
            alt=""
            width="72"
            height="72"
            decoding="async"
          />
        </span>
        <b>{storeName}</b>
      </span>
    </Link>
  );
}

function LuxuryHeader({openCart}: {openCart: () => void}) {
  const {collections, cart, theme, products} = useCommerce();
  const {ids: wishlistIds} = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const count = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const activeCollections = useMemo(() => collections.filter((item) => item.status === 'active').slice(0, 4), [collections]);
  const activeVendors = useMemo(() => [...new Set(products.filter((item) => item.status === 'active' && item.published).map((item) => item.vendor).filter(Boolean))].slice(0, 8), [products]);
  const announcementText = /(miễn phí giao hàng|giảm giá đến 50%)/i.test(theme.settings.announcement)
    ? 'Giảm giá đến 50% · Miễn phí giao hàng cho đơn từ 5.000.000₫'
    : theme.settings.announcement;
  const compactAnnouncementText = /(miễn phí giao hàng|giảm giá đến 50%)/i.test(theme.settings.announcement)
    ? 'Giảm đến 50% · Freeship đơn từ 5 triệu'
    : theme.settings.announcement;
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setMobileOpen(false);
  };
  return (
    <>
      {theme.settings.showAnnouncement && (
        <div id="tf-storefront-announcement" className="lux-announcement">
          <Sparkles />
          <span className="lux-announcement-copy lux-announcement-copy--full">{announcementText}</span>
          <span className="lux-announcement-copy lux-announcement-copy--compact">{compactAnnouncementText}</span>
        </div>
      )}
      <header id="tf-storefront-header" className={`lux-header ${theme.settings.stickyHeader ? 'is-sticky' : ''}`}>
        <div className="lux-header-inner">
          <button className="lux-icon-button lux-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Mở menu">
            <Menu />
          </button>
          <LuxuryLogo />
          <nav className="lux-main-nav" aria-label="Điều hướng chính">
            <NavLink to="/collections">Tất cả đồng hồ</NavLink>
            {activeCollections.map((collection) => (
              <NavLink key={collection.id} to={`/collections/${collection.handle}`}>
                {collection.title}
              </NavLink>
            ))}
            <NavLink to="/pages/about">Câu chuyện</NavLink>
            <NavLink to="/blogs">Tạp chí</NavLink>
          </nav>
          <div className="lux-header-actions">
            <button className="lux-search-button" onClick={() => setSearchOpen(true)}>
              <Search />
              <span>Tìm kiếm</span>
            </button>
            <Link className="lux-icon-button tf53-wishlist-link" to="/wishlist" aria-label={`Danh sách yêu thích, ${wishlistIds.length} sản phẩm`}>
              <Heart fill={wishlistIds.length ? 'currentColor' : 'none'} />
              {wishlistIds.length > 0 && <span>{wishlistIds.length}</span>}
            </Link>
            <Link className="lux-icon-button lux-account-link" to="/account" aria-label="Tài khoản khách hàng">
              <UserRound />
            </Link>
            <button className="lux-icon-button lux-cart-button" onClick={openCart} aria-label="Mở giỏ hàng">
              <ShoppingBag />
              <span>{count}</span>
            </button>
          </div>
        </div>
      </header>
      <section id="tf-storefront-brand-rail" className="tf-brand-rail-v39" aria-label="Thương hiệu nổi bật">
        <div className="tf-brand-rail-inner-v39">
          <div className="tf-brand-rail-heading-v39">
            <small>THƯƠNG HIỆU</small>
            <span>Những tên tuổi nổi bật</span>
          </div>
          <nav className="tf-brand-rail-nav-v39">
            {activeVendors.map((vendor) => <Link key={vendor} to={`/search?q=${encodeURIComponent(vendor)}`}>{vendor}</Link>)}
            <Link className="tf-brand-rail-all-v39" to="/collections"><span>Xem tất cả</span><ArrowRight /></Link>
          </nav>
        </div>
      </section>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="lux-search-dialog-v29" overlayClassName="lux-search-overlay-v29" description="Tìm đồng hồ theo thương hiệu, tên sản phẩm hoặc mã SKU.">
          <form className="lux-search-panel v29-search-panel" onSubmit={submitSearch}>
            <div className="v29-search-heading">
              <small>SEARCH TIMEFORGE</small>
              <h2>Khám phá chiếc đồng hồ phù hợp</h2>
              <p>Tìm nhanh theo thương hiệu, tên thiết kế hoặc mã SKU.</p>
            </div>
            <label className="v29-search-field">
              <Search />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Thương hiệu, tên sản phẩm hoặc SKU" />
              <Button type="submit" size="md">Tìm kiếm</Button>
            </label>
          </form>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="lux-mobile-shell" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} onClick={() => setMobileOpen(false)}>
            <motion.aside
              className="lux-mobile-drawer"
              initial={{x: '-100%'}}
              animate={{x: 0}}
              exit={{x: '-100%'}}
              transition={{type: 'spring', stiffness: 320, damping: 32}}
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <LuxuryLogo />
                <button onClick={() => setMobileOpen(false)} aria-label="Đóng menu"><X /></button>
              </header>
              <form onSubmit={submitSearch}>
                <Search />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm kiếm" />
              </form>
              <nav>
                <Link to="/" onClick={() => setMobileOpen(false)}>Trang chủ</Link>
                <Link to="/collections" onClick={() => setMobileOpen(false)}>Tất cả đồng hồ</Link>
                <Link to="/wishlist" onClick={() => setMobileOpen(false)}>Yêu thích {wishlistIds.length > 0 ? `(${wishlistIds.length})` : ''}</Link>
                {activeCollections.map((collection) => (
                  <Link key={collection.id} to={`/collections/${collection.handle}`} onClick={() => setMobileOpen(false)}>
                    {collection.title}
                  </Link>
                ))}
                <Link to="/pages/warranty" onClick={() => setMobileOpen(false)}>Bảo hành</Link>
                <Link to="/pages/shipping" onClick={() => setMobileOpen(false)}>Giao hàng</Link>
                <Link to="/pages/about" onClick={() => setMobileOpen(false)}>Về TimeForge</Link>
                <Link to="/blogs" onClick={() => setMobileOpen(false)}>Tạp chí TimeForge</Link>
              </nav>
              <div className="lux-mobile-assurance">
                <ShieldCheck />
                <span><b>Cam kết chính hãng</b>Thông tin nguồn hàng minh bạch</span>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function LuxuryCartDrawer({open, close}: {open: boolean; close: () => void}) {
  const {cart, products, updateCart} = useCommerce();
  const items = cart
    .map((line) => ({line, product: products.find((product) => product.id === line.productId)}))
    .filter((item) => item.product);
  const total = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.line.quantity, 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="tf-cart-overlay-v4910" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} onClick={close}>
          <motion.aside
            className="tf-cart-drawer-v4910"
            initial={{x: '100%'}}
            animate={{x: 0}}
            exit={{x: '100%'}}
            transition={{type: 'spring', stiffness: 320, damping: 34}}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="tf-cart-header-v4910">
              <div><h2>Giỏ hàng</h2><span className="tf-cart-count-v4910">{items.length} sản phẩm</span></div>
              <button onClick={close} aria-label="Đóng giỏ hàng"><X /></button>
            </header>
            <div className="tf-cart-body-v4910">
              {!items.length ? (
                <div className="tf-cart-empty-v4910">
                  <ShoppingBag />
                  <h3>Chưa có sản phẩm</h3>
                  <p>Khám phá những thiết kế được TimeForge tuyển chọn.</p>
                  <Link to="/collections" onClick={close}>Khám phá bộ sưu tập</Link>
                </div>
              ) : (
                items.map(({line, product}) => product && (
                  <article className="tf-cart-item-v4910" key={`${product.id}-${line.variantId}`}>
                    <img className="tf-cart-item-image-v4910" src={optimizedImage(productImage(product), 900, 900, 'fit')} alt={product.title} width="900" height="900" decoding="async" />
                    <div className="tf-cart-item-copy-v4910">
                      <small>{product.vendor}</small>
                      <Link to={`/products/${product.handle}`} onClick={close}>{product.title}</Link>
                      <b>{money(product.price)}</b>
                      <div className="tf-cart-line-actions-v4910">
                        <div className="tf-cart-qty-v4910" aria-label="Số lượng sản phẩm">
                          <button onClick={() => updateCart(line.productId, line.variantId, line.quantity - 1)} aria-label="Giảm số lượng"><Minus /></button>
                          <span aria-live="polite">{line.quantity}</span>
                          <button onClick={() => updateCart(line.productId, line.variantId, line.quantity + 1)} aria-label="Tăng số lượng"><Plus /></button>
                        </div>
                        <button className="tf-cart-remove-v4910" onClick={() => updateCart(line.productId, line.variantId, 0)} aria-label="Xóa sản phẩm"><Trash2 /><span>Xóa</span></button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
            {!!items.length && (
              <footer className="tf-cart-footer-v4910">
                <div><span>Tạm tính</span><strong>{money(total)}</strong></div>
                <p>Miễn phí giao hàng tiêu chuẩn. Thuế và ưu đãi được tính ở bước thanh toán.</p>
                <Link className="secondary" to="/cart" onClick={close}>Xem giỏ hàng</Link>
                <Link className="primary" to="/checkout" onClick={close}>Thanh toán an toàn</Link>
              </footer>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NewsletterSignupForm({source, onSuccess, className = ''}: {source: string; onSuccess?: () => void; className?: string}) {
  const {subscribeNewsletter} = useCommerce();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const result = subscribeNewsletter(email, source);
    setSubmitting(false);
    if (result === 'invalid') {toast.error('Email chưa đúng định dạng'); return;}
    if (result === 'exists') {toast.info('Email này đã có trong danh sách nhận tin'); onSuccess?.(); return;}
    toast.success(result === 'reactivated' ? 'Đã kích hoạt lại đăng ký nhận tin' : 'Đăng ký nhận tin thành công');
    setEmail('');
    onSuccess?.();
  };
  return <form className={className} onSubmit={submit} noValidate>
    <label className="tf-newsletter-field-v4910"><span className="sr-only">Địa chỉ email</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Địa chỉ email" autoComplete="email" /></label>
    <button type="submit" disabled={submitting || !email.trim()}><span>{submitting ? 'Đang lưu...' : 'Đăng ký'}</span><ArrowRight /></button>
  </form>;
}

function LuxuryFooter() {
  const {theme}=useCommerce();
  const settings=theme.settings;
  const hasSocial=Boolean(settings.facebookUrl||settings.instagramUrl||settings.tiktokUrl);
  const contactItems=[
    settings.storePhone&&<a key="phone" href={`tel:${settings.storePhone.replace(/\s+/g,'')}`}>{settings.storePhone}</a>,
    settings.storeEmail&&<a key="email" href={`mailto:${settings.storeEmail}`}>{settings.storeEmail}</a>,
    settings.storeAddress&&<span key="address">{settings.storeAddress}</span>,
    settings.taxId&&<span key="tax">MST: {settings.taxId}</span>,
  ].filter(Boolean);
  return (
    <footer className="tf-footer-v4910">
      <section className="tf-footer-services-v4910" aria-label="Cam kết dịch vụ">
        <article><Truck /><span><b>Miễn phí giao hàng</b><small>Giao hàng nhanh trên toàn quốc</small></span></article>
        <article><ShieldCheck /><span><b>100% chính hãng</b><small>Nguồn hàng và chính sách minh bạch</small></span></article>
        <article><PackageCheck /><span><b>Đổi trả rõ ràng</b><small>Hỗ trợ theo điều kiện từng sản phẩm</small></span></article>
        <article><Clock3 /><span><b>Hỗ trợ dài lâu</b><small>Đồng hành trong quá trình sử dụng</small></span></article>
      </section>
      <div className="tf-footer-newsletter-v4910">
        <div className="tf-footer-newsletter-copy-v4910"><small>CẬP NHẬT TỪ TIMEFORGE</small><h2>Đăng ký nhận bản tin</h2><p>Nhận thông tin về bộ sưu tập mới, ưu đãi và cảm hứng phong cách.</p></div>
        <NewsletterSignupForm source="footer" className="tf-footer-signup-v4910" />
      </div>
      <div className="tf-footer-grid-v4910">
        <section className="tf-footer-brand-v4910"><LuxuryLogo /><div className="tf-footer-brand-copy-v4910"><p>{settings.storeDescription}</p>{contactItems.length>0&&<div className="tf509-footer-contact">{contactItems}</div>}<div className="tf-footer-proof-v4910"><ShieldCheck /><span>Bảo mật thanh toán · Hỗ trợ sau bán hàng</span></div></div></section>
        <section><h4>Mua sắm</h4><Link to="/collections">Tất cả đồng hồ</Link><Link to="/search">Tìm kiếm</Link><Link to="/cart">Giỏ hàng</Link></section>
        <section><h4>Dịch vụ</h4><Link to="/pages/warranty">Bảo hành</Link><Link to="/pages/shipping">Giao hàng</Link><Link to="/pages/returns">Đổi trả</Link></section>
        <section><h4>TimeForge</h4><Link to="/pages/about">Câu chuyện</Link><Link to="/blogs">Tạp chí</Link><Link to="/pages/contact">Liên hệ</Link>{settings.recruitmentUrl&&<a href={settings.recruitmentUrl} target="_blank" rel="noreferrer">Tuyển dụng</a>}</section>
      </div>
      <section className={`tf509-footer-channels ${hasSocial?'':'is-payments-only'}`} aria-label="Thanh toán và mạng xã hội">
        <div><b>Hình thức thanh toán</b><span className="tf509-payment-marks"><BankCardMark/><VisaMark/><MastercardMark/><MomoMark/><ZalopayMark/><PayosMark/></span></div>
        {hasSocial&&<div><b>Kết nối với TimeForge</b><span className="tf509-social-marks">{settings.facebookUrl&&<a href={settings.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook"><FacebookMark/></a>}{settings.instagramUrl&&<a href={settings.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram"><InstagramMark/></a>}{settings.tiktokUrl&&<a href={settings.tiktokUrl} target="_blank" rel="noreferrer" aria-label="TikTok"><TiktokMark/></a>}</span></div>}
      </section>
      <div className="tf-footer-bottom-v4910"><span>© 2026 {settings.storeName}</span><span>Authenticity · Craftsmanship · Service</span></div>
    </footer>
  );
}

function StoreCatalogLoading({error=''}:{error?:string}) {
  if(error)return <div className="tf508-catalog-state is-error" role="alert"><img src="/luxury-timeforge-logo.svg" alt="" aria-hidden="true"/><span>Không thể tải danh mục</span><b>Trang không hiển thị dữ liệu cũ để tránh sai sản phẩm.</b><button type="button" onClick={()=>window.location.reload()}>Tải lại trang</button></div>;
  return <div className="tf508-catalog-state" aria-label="Đang tải danh mục sản phẩm" aria-busy="true"><div className="tf508-catalog-progress"/><img src="/luxury-timeforge-logo.svg" alt="" aria-hidden="true"/><span>Luxury Timeforge</span><b>Đang đồng bộ danh mục chính thức…</b><div className="tf508-catalog-skeleton"><i/><i/><i/></div></div>;
}

export function StoreLayoutV10() {
  const [cartOpen, setCartOpen] = useState(false);
  const previewMode = isThemePreviewV26();
  const [extras, setExtras] = useState<ThemeExtrasV23>(() => previewMode ? readThemePreviewExtrasV26(readThemeExtrasV23()) : readThemeExtrasV23());
  const [newsletterDismissed, setNewsletterDismissed] = useState(false);
  const [privacyDismissed, setPrivacyDismissed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {theme,isLoading,dataError,products} = useCommerce();
  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    const previousBehavior = document.documentElement.style.scrollBehavior;
    window.history.scrollRestoration = 'manual';
    document.documentElement.style.scrollBehavior = 'auto';
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({top: 0, left: 0, behavior: 'auto'});
    return () => {
      window.history.scrollRestoration = previousRestoration;
      document.documentElement.style.scrollBehavior = previousBehavior;
    };
  }, [location.pathname, location.search]);
  useEffect(() => {
    captureCommerceAttribution();
    trackCommerceEvent('page_view');
  }, [location.pathname, location.search]);
  useEffect(() => {
    const sync = () => setExtras(previewMode ? readThemePreviewExtrasV26(readThemeExtrasV23()) : readThemeExtrasV23());
    window.addEventListener(THEME_EXTRAS_EVENT, sync);
    window.addEventListener(THEME_PREVIEW_UPDATED_V26, sync);
    window.addEventListener('storage', sync);
    return () => {window.removeEventListener(THEME_EXTRAS_EVENT, sync); window.removeEventListener(THEME_PREVIEW_UPDATED_V26, sync); window.removeEventListener('storage', sync);};
  }, [previewMode]);
  useEffect(() => {
    const storeName = resolveStoreName(theme.settings.storeName);
    const resolvedLogo = resolveStoreLogo(theme.settings.logoImage);
    const resolvedIcon = resolveStoreIcon(theme.settings.logoImage);
    const customLogo = resolveCustomStoreLogo(theme.settings.logoImage);
    document.title = storeName;
    const faviconHref = customLogo ? optimizedImage(customLogo, 96, 96, 'fit') : resolvedIcon;
    const touchHref = customLogo ? optimizedImage(customLogo, 180, 180, 'fit') : resolvedLogo;
    const faviconLinks = [...document.querySelectorAll<HTMLLinkElement>('link[rel="icon"],link[rel="shortcut icon"]')];
    if (!faviconLinks.length) {
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
      faviconLinks.push(favicon);
    }
    faviconLinks.forEach((link) => {link.href = faviconHref;});
    let touchLinks = [...document.querySelectorAll<HTMLLinkElement>('link[rel="apple-touch-icon"]')];
    if (!touchLinks.length) {
      const touchIcon = document.createElement('link');
      touchIcon.rel = 'apple-touch-icon';
      document.head.appendChild(touchIcon);
      touchLinks = [touchIcon];
    }
    touchLinks.forEach((link) => {link.href = touchHref;});
  }, [theme.settings.logoImage, theme.settings.storeName]);
  if(isLoading && products.length === 0)return <StoreCatalogLoading/>;
  if(dataError && products.length === 0)return <StoreCatalogLoading error={dataError}/>;
  const settings = theme.settings;
  const showStandaloneCountdown = extras.showCountdown && !settings.showAnnouncement;
  const requestCart = () => extras.cartDrawer ? setCartOpen(true) : navigate('/cart');
  return (
    <div
      className={`lux-store tf-storefront-v4912 motion-${settings.motion} ${previewMode ? 'tf-storefront-preview-v26' : ''}`}
      style={{
        '--lux-accent': settings.accent,
        '--lux-bg': settings.background,
        '--lux-surface': settings.surface,
        '--lux-text': settings.text,
        '--lux-muted': settings.muted,
        '--lux-on-dark': settings.textOnDark,
        '--lux-radius': `${settings.radius}px`,
        '--lux-card-radius': `${settings.cardRadius}px`,
        '--lux-button-radius': `${settings.buttonRadius}px`,
        '--lux-content': `${settings.contentWidth}px`,
        '--lux-section-space': `${settings.sectionSpacing}px`,
        '--lux-heading-scale': settings.headingScale / 100,
        '--lux-heading-weight': settings.headingWeight,
        '--lux-body-weight': settings.bodyWeight,
        '--lux-heading-font': settings.headingFont,
        '--lux-body-font': settings.bodyFont,
      } as React.CSSProperties}
    >
      {previewMode && <ThemePreviewBridgeV26 />}
      {showStandaloneCountdown && <div className={`v23-store-countdown ${extras.countdownScheme}`}>{extras.countdownText}</div>}
      <LuxuryHeader openCart={requestCart} />
      <main><div className="tf-route-view-v4910" key={`${location.pathname}${location.search}`}><Outlet context={{openCart: requestCart}} /></div></main>
      {(extras.footerVisible || location.pathname === '/checkout') && <LuxuryFooter />}
      {extras.cartDrawer && <LuxuryCartDrawer open={cartOpen} close={() => setCartOpen(false)} />}
      {extras.newsletterPopup && !newsletterDismissed && <div className="v28-newsletter-modal-backdrop" onClick={() => setNewsletterDismissed(true)}><aside className="v23-newsletter-popup" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Đăng ký nhận tin"><button onClick={() => setNewsletterDismissed(true)} aria-label="Đóng"><X/></button><small>TẠP CHÍ TIMEFORGE</small><h2>Nhận tin tuyển chọn mới</h2><p>Cập nhật sản phẩm, bài viết và dịch vụ mới.</p><NewsletterSignupForm source="popup" onSuccess={() => setNewsletterDismissed(true)} className="v34-popup-signup" /></aside></div>}
      {extras.privacyBanner && !privacyDismissed && <aside className="v23-privacy-banner"><div><ShieldCheck/><span><b>Quyền riêng tư</b><small>Dữ liệu được sử dụng để vận hành cửa hàng và xử lý đơn hàng.</small></span></div><button onClick={() => setPrivacyDismissed(true)}>Đồng ý</button></aside>}
    </div>
  );
}

export function LuxuryProductCard({product, priority = false}: {product: Product; priority?: boolean}) {
  const {addToCart, productGroups, products} = useCommerce();
  const {has, toggle} = useWishlist();
  const wished = has(product.id);
  const [secondaryRequested, setSecondaryRequested] = useState(false);
  const sale = discount(product.price, product.compareAtPrice);
  const primary = productImage(product);
  const secondary = productImage(product, 1);
  const family = productGroups.find((group)=>group.status==='active'&&(group.items.some((item)=>item.productId===product.id||item.sku===product.sku)||(group.skuPrefix&&product.sku.toUpperCase().startsWith(group.skuPrefix.toUpperCase()))));
  const familyItems = family ? resolveProductGroupItems(family, products).filter(({product: itemProduct})=>itemProduct?.status==='active'&&itemProduct.published) : [];
  return (
    <article className="tf-product-card-v4918" onPointerEnter={(event) => {if (event.pointerType === 'mouse' || event.pointerType === 'pen') setSecondaryRequested(true);}} onFocus={() => setSecondaryRequested(true)}>
      <div className="tf-product-media-v4918">
        <Link to={`/products/${product.handle}`}>
          <SmartImage className="primary-image" priority={priority} src={primary} alt={product.title} width={720} height={720} sizes="(max-width: 599px) 50vw, (max-width: 1199px) 33vw, 25vw" />
          {secondaryRequested && secondary !== primary && <SmartImage className="secondary-image" src={secondary} alt="" width={720} height={720} sizes="(max-width: 599px) 50vw, (max-width: 1199px) 33vw, 25vw" />}
        </Link>
        <div className="tf-product-badges-v4918">
          {sale > 0 && <span>–{sale}%</span>}
          {product.inventory <= 3 && product.inventory > 0 && <span className="low">Còn {product.inventory}</span>}
        </div>
        <button type="button" className={`tf-product-wish-v4918 ${wished ? 'is-active' : ''}`} onClick={() => {toggle(product.id); toast.success(wished ? 'Đã xóa khỏi danh sách yêu thích' : 'Đã lưu vào danh sách yêu thích');}} aria-label={wished ? 'Xóa khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'} aria-pressed={wished}>
          <Heart fill={wished ? 'currentColor' : 'none'} />
        </button>
        <button className="tf-product-quick-add-v4918" onClick={() => {addToCart(product.id, product.variants[0]?.id || '', 1); trackCommerceEvent('add_to_cart',{productId:product.id,value:product.price}); toast.success('Đã thêm sản phẩm vào giỏ hàng');}} disabled={product.inventory <= 0}>
          <ShoppingBag />{product.inventory > 0 ? 'Thêm nhanh' : 'Tạm hết hàng'}
        </button>
      </div>
      <div className="tf-product-info-v4918">
        <small className="tf-product-brand-v4918">{product.vendor || 'TIMEFORGE'}</small>
        <Link to={`/products/${product.handle}`}>{product.title}</Link>
        {family&&familyItems.length>1&&<ProductFamilyCardSwatches group={family} items={familyItems} current={product}/>}
        <div className={`tf-product-price-v4918 ${product.compareAtPrice > product.price ? 'is-sale' : ''}`}><strong>{money(product.price)}</strong>{product.compareAtPrice > product.price && <del>{money(product.compareAtPrice)}</del>}</div>
      </div>
    </article>
  );
}

function LuxurySectionHeading({eyebrow, title, description, link = '/collections'}: {eyebrow: string; title: string; description?: string; link?: string}) {
  return (
    <div className={`tf-section-heading-v4912 ${description ? 'has-description' : 'no-description'}`}>
      <div className="tf-section-title-v4912"><small>{eyebrow}</small><h2>{title}</h2></div>
      {description && <p className="tf-section-description-v4912">{description}</p>}
      <Link className="tf-section-action-v4912" to={link}><span>Xem tất cả</span><i><ArrowRight /></i></Link>
    </div>
  );
}

export function HomeV10() {
  const {theme, products, collections, orders} = useCommerce();
  const activeProducts = useMemo(() => products.filter((item) => item.status === 'active' && item.published), [products]);
  const activeCollections = useMemo(() => collections.filter((item) => item.status === 'active'), [collections]);
  const bestSellers = useMemo(() => {
    const saleCounts = new Map<string, number>();
    orders.filter((order) => order.status !== 'cancelled').forEach((order) => order.lines.forEach((line) => saleCounts.set(line.productId, (saleCounts.get(line.productId) || 0) + line.quantity)));
    return [...activeProducts].sort((a, b) => (saleCounts.get(b.id) || 0) - (saleCounts.get(a.id) || 0) || b.updatedAt.localeCompare(a.updatedAt));
  }, [activeProducts, orders]);
  const sections = useMemo(() => theme.templates.home.sections.filter((section) => section.visible), [theme.templates.home.sections]);
  const boundary = (section: Section) => ({
    'data-theme-section-id': section.id,
    'data-theme-section-label': sectionLabels[section.type],
  });
  const iconFor = (value: string) => value === 'truck' ? <Truck /> : value === 'clock' ? <Clock3 /> : <ShieldCheck />;

  const renderSection = (section: Section, sectionIndex: number) => {
    if (section.type === 'hero') {
      const heading = getBlock(section, 'heading');
      const text = getBlock(section, 'text');
      const action = getBlock(section, 'button');
      return <section key={section.id} {...boundary(section)} className={`lux-hero align-${section.settings.alignment || 'left'}`} style={{minHeight: Math.round(Number(section.settings.height || 680) * .64)}}>
        <img src={optimizedImage(String(section.settings.image || activeProducts[0]?.images[0] || ''), 1920, 1200)} alt="TimeForge luxury watches" width="1920" height="1200" fetchPriority="high" decoding="async" />
        <div className="lux-hero-shade" style={{opacity: Number(section.settings.overlay || 42) / 100}} />
        <motion.div className="lux-hero-copy" initial={{opacity: 0, y: 30}} animate={{opacity: 1, y: 0}} transition={{duration: .7}}>
          <small {...themeBlockProps(heading)}>{String(heading?.settings.eyebrow || 'THE ART OF TIME')}</small>
          <h1 {...themeBlockProps(heading)}>{String(heading?.settings.text || 'Dấu ấn thời gian, được tuyển chọn.')}</h1>
          <p {...themeBlockProps(text)}>{String(text?.settings.text || 'Khám phá những thiết kế biểu tượng, thông tin minh bạch và dịch vụ hậu mãi dài lâu.')}</p>
          <div className="tf-hero-pills-v4910" aria-label="Cam kết mua sắm">
            <span><ShieldCheck />Chính hãng</span>
            <span><Truck />Miễn phí giao hàng</span>
            <span><PackageCheck />Bảo hiểm vận chuyển</span>
          </div>
          <div className="v33-hero-actions">{action && <Link {...themeBlockProps(action)} className="primary" to={String(action.settings.link || '/collections')}>{String(action.settings.label || 'Khám phá bộ sưu tập')}<ArrowRight /></Link>}<Link className="secondary tf-hero-story-v4912" to="/pages/about">Câu chuyện TimeForge</Link></div>
        </motion.div>
        <div className="lux-hero-index"><span>{String(sectionIndex + 1).padStart(2, '0')}</span><i /><span>TIMEFORGE EDIT</span></div>
      </section>;
    }
    if (section.type === 'trust') {
      const items = getBlocks(section, 'iconText');
      return <section key={section.id} {...boundary(section)} className="lux-assurance-strip">{items.map((item) => <div key={item.id} {...themeBlockProps(item)}>{iconFor(String(item.settings.icon || 'shield'))}<span><b>{String(item.settings.title || 'Cam kết')}</b>{String(item.settings.text || '')}</span></div>)}</section>;
    }
    if (section.type === 'collections') {
      const limit = Number(section.settings.limit || 3);
      return <section key={section.id} {...boundary(section)} className="lux-section lux-collection-edit tf-curated-v4912">
        <LuxurySectionHeading eyebrow={String(section.settings.eyebrow || 'CURATED WORLDS')} title={String(section.settings.title || 'Bộ sưu tập tuyển chọn')} description={String(section.settings.description || 'Mỗi lựa chọn là một cách kể câu chuyện về phong cách, vật liệu và di sản.')} />
        <div className="lux-collection-cards">{activeCollections.slice(0, limit).map((collection, index) => <motion.div key={collection.id} initial={{opacity: 0, y: 24}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: index * .08}}><Link to={`/collections/${collection.handle}`}><img src={optimizedImage(collection.image || activeProducts[index]?.images[0] || '', 1000, 1200)} alt={collection.title} width="1000" height="1200" loading="lazy" decoding="async" /><div><span>{String(index + 1).padStart(2, '0')}</span><small>{collection.description || 'TIMEFORGE COLLECTION'}</small><h3>{collection.title}</h3><b>Khám phá<ArrowRight /></b></div></Link></motion.div>)}</div>
      </section>;
    }
    if (section.type === 'products') {
      let source = activeProducts;
      const handle = String(section.settings.collectionHandle || '');
      if (handle) {const collection = collections.find((item) => item.handle === handle); if (collection) source = collection.productIds.length ? activeProducts.filter((product) => collection.productIds.includes(product.id)) : activeProducts;}
      return <section key={section.id} {...boundary(section)} className="lux-section lux-featured-products tf-selection-v4912">
        <LuxurySectionHeading eyebrow={String(section.settings.eyebrow || 'THE TIMEFORGE SELECTION')} title={String(section.settings.title || 'Thiết kế nổi bật')} description={String(section.settings.description || 'Những sản phẩm cân bằng giữa giá trị sử dụng, thẩm mỹ và dấu ấn thương hiệu.')} />
        <div className={`lux-product-grid v23-columns-${Number(section.settings.columns || 4)}`}>{source.slice(0, Number(section.settings.limit || 8)).map((product, index) => <LuxuryProductCard key={product.id} product={product} priority={sectionIndex < 3 && index < 4} />)}</div>
      </section>;
    }
    if (section.type === 'bestSellers') return <section key={section.id} {...boundary(section)} className="lux-section v18-best-sellers tf-bestsellers-v4910"><LuxurySectionHeading eyebrow={String(section.settings.eyebrow || 'ĐƯỢC LỰA CHỌN NHIỀU')} title={String(section.settings.title || 'Sản phẩm bán chạy')} description={String(section.settings.description || 'Những thiết kế được quan tâm và lựa chọn nhiều trong thời gian gần đây.')} /><div className={`lux-product-grid v23-columns-${Number(section.settings.columns || 4)}`}>{bestSellers.slice(0, Number(section.settings.limit || 8)).map((product) => <LuxuryProductCard key={product.id} product={product} />)}</div></section>;
    if (isSharedThemeSectionV27(section)) return <ThemeSectionV27 key={section.id} section={section}/>;
    if (section.type === 'imageText') {
      const heading = getBlock(section, 'heading'); const text = getBlock(section, 'text'); const action = getBlock(section, 'button');
      return <section key={section.id} {...boundary(section)} className={`tf-editorial-v39 image-${String(section.settings.imagePosition || 'left')}`}><div className="tf-editorial-media-v39"><img src={optimizedImage(String(section.settings.image || activeProducts[4]?.images[0] || activeProducts[0]?.images[0] || ''), 1200, 1500)} alt="TimeForge story" width="1200" height="1500" loading="lazy" decoding="async" /><span>EST. 2026</span></div><div className="tf-editorial-content-v39"><small>{String(heading?.settings.eyebrow || 'OUR POINT OF VIEW')}</small><h2>{String(heading?.settings.text || 'Luxury không chỉ nằm ở mức giá.')}</h2><p>{String(text?.settings.text || 'Đó là sự chính xác trong thông tin, sự tinh tế trong trải nghiệm và trách nhiệm với khách hàng sau khi giao dịch kết thúc.')}</p>{action && <Link to={String(action.settings.link || '/pages/about')}>{String(action.settings.label || 'Đọc câu chuyện TimeForge')}<ArrowRight /></Link>}<div className="tf-editorial-facts-v39"><span><b>100%</b>Thông tin rõ ràng</span><span><b>1–4 ngày</b>Giao hàng dự kiến</span><span><b>Dài lâu</b>Hỗ trợ hậu mãi</span></div></div></section>;
    }
    if (section.type === 'richText') {
      const heading = getBlock(section, 'heading'); const text = getBlock(section, 'text'); const action = getBlock(section, 'button');
      return <section key={section.id} {...boundary(section)} className={`lux-section v26-rich-text align-${String(section.settings.alignment || 'center')} width-${String(section.settings.width || 'narrow')}`}><small>{String(heading?.settings.eyebrow || 'TIMEFORGE')}</small><h2>{String(heading?.settings.text || 'Một tiêu đề giàu cảm hứng')}</h2><p>{String(text?.settings.text || '')}</p>{action && <Link to={String(action.settings.link || '/collections')}>{String(action.settings.label || 'Xem thêm')}<ArrowRight /></Link>}</section>;
    }
    if (section.type === 'newsletter') {
      const heading = getBlock(section, 'heading'); const text = getBlock(section, 'text');
      return <section key={section.id} {...boundary(section)} className={`lux-newsletter v26-newsletter ${section.settings.background === 'dark' ? 'dark' : ''}`}><div><small>{String(heading?.settings.eyebrow || 'TIMEFORGE JOURNAL')}</small><h2>{String(heading?.settings.text || 'Nhận tin tuyển chọn mới')}</h2><p>{String(text?.settings.text || '')}</p></div><NewsletterSignupForm source="homepage" className="v34-home-signup" /></section>;
    }
    if (section.type === 'blogPosts') return <section key={section.id} {...boundary(section)} className="lux-section v18-journal-home tf-journal-v4912"><LuxurySectionHeading eyebrow={String(section.settings.eyebrow || 'TIMEFORGE JOURNAL')} title={String(section.settings.title || 'Câu chuyện về thời gian và phong cách')} description={String(section.settings.description || 'Kiến thức tuyển chọn về đồng hồ, chăm sóc và trải nghiệm sở hữu.')} link="/blogs" /><BlogCardsV18 limit={Number(section.settings.limit || 3)}/></section>;
    if (section.type === 'multicolumn') {
      const items = getBlocks(section, 'iconText');
      return <section key={section.id} {...boundary(section)} className="lux-section v26-multicolumn"><LuxurySectionHeading eyebrow={String(section.settings.eyebrow || 'DỊCH VỤ TIMEFORGE')} title={String(section.settings.title || 'Trải nghiệm được chăm chút')} /><div style={{'--v26-columns': Number(section.settings.columns || 3)} as React.CSSProperties}>{items.map((item) => <article key={item.id}>{iconFor(String(item.settings.icon || 'shield'))}<span><b>{String(item.settings.title || 'Nội dung')}</b><p>{String(item.settings.text || '')}</p></span></article>)}</div></section>;
    }
    if (section.type === 'video') {
      const heading = getBlock(section, 'heading'); const text = getBlock(section, 'text'); const action = getBlock(section, 'button'); const videoUrl = String(section.settings.videoUrl || '');
      return <section key={section.id} {...boundary(section)} className="v26-video-section" style={{minHeight: Number(section.settings.height || 560)}}>{videoUrl ? <video src={videoUrl} poster={String(section.settings.poster || '')} controls muted playsInline/> : <img src={optimizedImage(String(section.settings.poster || ''), 1800, 1000)} alt="TimeForge video"/>}<div><small>{String(heading?.settings.eyebrow || 'TIME IN MOTION')}</small><h2>{String(heading?.settings.text || 'Chuyển động của thời gian')}</h2><p>{String(text?.settings.text || '')}</p>{action && <Link to={String(action.settings.link || '/collections')}>{String(action.settings.label || 'Khám phá')}<ArrowRight/></Link>}</div></section>;
    }
    return null;
  };

  return <div className="lux-home">{sections.map(renderSection)}</div>;
}

const COLLECTION_PRICE_BANDS = [
  {value: 'under20', label: 'Dưới 20 triệu', matches: (price: number) => price < 20_000_000},
  {value: '20to50', label: '20 – 50 triệu', matches: (price: number) => price >= 20_000_000 && price < 50_000_000},
  {value: '50to100', label: '50 – 100 triệu', matches: (price: number) => price >= 50_000_000 && price < 100_000_000},
  {value: 'over100', label: 'Trên 100 triệu', matches: (price: number) => price >= 100_000_000},
];

const COLLECTION_SORT_LABELS: Record<string, string> = {
  featured: 'Nổi bật',
  relevant: 'Phù hợp nhất',
  best: 'Bán chạy nhất',
  name: 'Tên A–Z',
  nameDesc: 'Tên Z–A',
  low: 'Giá thấp đến cao',
  high: 'Giá cao đến thấp',
  old: 'Ngày cũ đến mới',
  new: 'Ngày mới đến cũ',
};

type CollectionFilterState = {
  selectedVendors: string[];
  priceBands: string[];
  selectedFilters: Record<ProductFilterKey, string[]>;
  stockOnly: boolean;
};

type CollectionFilterIndex = Map<string, Record<ProductFilterKey, string[]>>;

const cloneCollectionFilterState = (state: CollectionFilterState): CollectionFilterState => ({
  selectedVendors: [...state.selectedVendors],
  priceBands: [...state.priceBands],
  selectedFilters: Object.fromEntries(
    PRODUCT_FILTER_DEFINITIONS.map((definition) => [definition.id, [...(state.selectedFilters[definition.id] || [])]]),
  ) as Record<ProductFilterKey, string[]>,
  stockOnly: state.stockOnly,
});

const emptyCollectionFilterState = (): CollectionFilterState => ({
  selectedVendors: [],
  priceBands: [],
  selectedFilters: emptyProductFilterSelection(),
  stockOnly: false,
});

type CollectionFilterData = {
  index: CollectionFilterIndex;
  facetOptions: Record<ProductFilterKey, ProductFilterOption[]>;
};

const MAX_VALUES_PER_PRODUCT_FACET = 12;
const MAX_VISIBLE_FILTER_OPTIONS = 80;
const normalizeCollectionFacetValue = (value: unknown) => String(value ?? '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/[\u0000-\u001f\u007f]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 80);

const buildCollectionFilterData = (products: Product[]): CollectionFilterData => {
  const index: CollectionFilterIndex = new Map();
  const counts = new Map<ProductFilterKey, Map<string, number>>(
    PRODUCT_FILTER_DEFINITIONS.map((definition) => [definition.id, new Map<string, number>()]),
  );
  products.forEach((product) => {
    const values = Object.fromEntries(PRODUCT_FILTER_DEFINITIONS.map((definition) => {
      const resolved = [...new Set(readProductFilterValues(product, definition.id)
        .map(normalizeCollectionFacetValue)
        .filter(Boolean))]
        .slice(0, MAX_VALUES_PER_PRODUCT_FACET);
      const facetCounts = counts.get(definition.id)!;
      resolved.forEach((value) => facetCounts.set(value, (facetCounts.get(value) || 0) + 1));
      return [definition.id, resolved];
    })) as Record<ProductFilterKey, string[]>;
    index.set(product.id, values);
  });
  const facetOptions = Object.fromEntries(PRODUCT_FILTER_DEFINITIONS.map((definition) => [
    definition.id,
    [...(counts.get(definition.id) || new Map<string, number>()).entries()]
      .map(([value, count]) => ({value, count}))
      .sort((a, b) => definition.id === 'faceSize'
        ? Number.parseFloat(a.value) - Number.parseFloat(b.value)
        : a.value.localeCompare(b.value, 'vi')),
  ])) as Record<ProductFilterKey, ProductFilterOption[]>;
  return {index, facetOptions};
};

const filterCollectionProducts = (products: Product[], filters: CollectionFilterState, index?: CollectionFilterIndex) => products.filter((item) => {
  if (filters.selectedVendors.length && !filters.selectedVendors.includes(item.vendor)) return false;
  if (filters.stockOnly && item.inventory <= 0) return false;
  if (filters.priceBands.length && !COLLECTION_PRICE_BANDS.some((band) => filters.priceBands.includes(band.value) && band.matches(item.price))) return false;
  return PRODUCT_FILTER_DEFINITIONS.every((definition) => {
    const selected = filters.selectedFilters[definition.id] || [];
    const values = index?.get(item.id)?.[definition.id] || readProductFilterValues(item, definition.id);
    return !selected.length || values.some((value) => selected.includes(value));
  });
});

function CollectionFilterSection({
  id,
  label,
  options,
  selected,
  expanded,
  onToggleExpanded,
  onToggle,
}: {
  id: string;
  label: string;
  options: ProductFilterOption[];
  selected: string[];
  expanded: boolean;
  onToggleExpanded: (id: string) => void;
  onToggle: (value: string) => void;
}) {
  const selectedSet = new Set(selected);
  const selectedOptions = options.filter((option) => selectedSet.has(option.value));
  const remainingSlots = Math.max(0, MAX_VISIBLE_FILTER_OPTIONS - selectedOptions.length);
  const visibleOptions = options.length <= MAX_VISIBLE_FILTER_OPTIONS
    ? options
    : [...selectedOptions, ...options.filter((option) => !selectedSet.has(option.value)).slice(0, remainingSlots)];
  return <section className={`tf503-filter-section ${expanded ? 'is-open' : ''}`} data-filter-section={id}>
    <button type="button" className="tf503-filter-section-head" onClick={() => onToggleExpanded(id)} aria-expanded={expanded} aria-controls={`tf-filter-options-${id}`}>
      <span>{label}{selected.length > 0 && <b>{selected.length}</b>}</span>
      <Plus aria-hidden="true"/>
    </button>
    {expanded && <div className="tf503-filter-options" id={`tf-filter-options-${id}`}>
      {visibleOptions.length ? visibleOptions.map((option) => {
        const isSelected = selected.includes(option.value);
        return <button
          key={`${id}:${option.value}`}
          type="button"
          className={`tf512-filter-option ${isSelected ? 'is-selected' : ''}`}
          role="checkbox"
          aria-checked={isSelected}
          onClick={() => onToggle(option.value)}
        >
          <i aria-hidden="true"><Check/></i>
          <span>{option.value}</span>
          <small>{option.count}</small>
        </button>;
      }) : <p>Chưa có dữ liệu cho hạng mục này.</p>}
      {options.length > visibleOptions.length && <p className="tf512-filter-limit-note">Đang hiển thị {visibleOptions.length}/{options.length} giá trị hợp lệ để bảo đảm bộ lọc hoạt động mượt.</p>}
    </div>}
  </section>;
}

function CollectionFilters({
  open,
  close,
  source,
  filterIndex,
  vendors,
  facetOptions,
  priceOptions,
  appliedFilters,
  applyFilters,
}: {
  open: boolean;
  close: () => void;
  source: Product[];
  filterIndex: CollectionFilterIndex;
  vendors: ProductFilterOption[];
  facetOptions: Record<ProductFilterKey, ProductFilterOption[]>;
  priceOptions: ProductFilterOption[];
  appliedFilters: CollectionFilterState;
  applyFilters: (filters: CollectionFilterState) => void;
}) {
  const [expanded, setExpanded] = useState<string[]>(['vendor', 'gender', 'price']);
  const [draft, setDraft] = useState<CollectionFilterState>(() => cloneCollectionFilterState(appliedFilters));
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Only copy the applied state at the moment the drawer opens. Keeping the
  // draft independent prevents unrelated parent renders from resetting or
  // unmounting the drawer while a checkbox is being changed.
  useEffect(() => {
    if (open) setDraft(cloneCollectionFilterState(appliedFilters));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus({preventScroll: true}));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  const selectedCount = draft.selectedVendors.length
    + draft.priceBands.length
    + PRODUCT_FILTER_DEFINITIONS.reduce((sum, definition) => sum + (draft.selectedFilters[definition.id] || []).length, 0)
    + Number(draft.stockOnly);

  // Do not filter the whole catalog while the drawer is open. Some imported
  // catalogs contain long or inconsistent metafield values; recalculating all
  // facets after every checkbox click can block the browser and leave only the
  // white dialog shell visible. The actual filtering runs once, after closing.
  const appliedResultCount = useMemo(() => {
    try {
      return filterCollectionProducts(source, appliedFilters, filterIndex).length;
    } catch (error) {
      console.warn('[TimeForge] Không thể đọc số sản phẩm hiện tại.', error);
      return source.length;
    }
  }, [source, appliedFilters, filterIndex]);

  const toggleExpanded = (id: string) => setExpanded((current) => current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id]);
  const toggleVendor = (value: string) => setDraft((current) => ({
    ...current,
    selectedVendors: current.selectedVendors.includes(value)
      ? current.selectedVendors.filter((item) => item !== value)
      : [...current.selectedVendors, value],
  }));
  const togglePriceBand = (value: string) => setDraft((current) => ({
    ...current,
    priceBands: current.priceBands.includes(value)
      ? current.priceBands.filter((item) => item !== value)
      : [...current.priceBands, value],
  }));
  const toggleFilter = (key: ProductFilterKey, value: string) => setDraft((current) => {
    const selected = current.selectedFilters[key] || [];
    return {
      ...current,
      selectedFilters: {
        ...current.selectedFilters,
        [key]: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      },
    };
  });
  const applyAndClose = () => {
    const next = cloneCollectionFilterState(draft);
    close();
    // Let the portal unmount and restore scrolling before the product grid does
    // the heavier filtering/rendering work.
    window.requestAnimationFrame(() => applyFilters(next));
  };

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <>
      <div className="tf-dialog-overlay tf4925-filter-overlay tf503-filter-overlay tf510-filter-overlay" onMouseDown={close} aria-hidden="true" />
      <div className="tf-dialog-content tf4925-filter-dialog tf503-filter-dialog tf510-filter-dialog" role="dialog" aria-modal="true" aria-label="Bộ lọc sản phẩm">
        <aside className="tf4925-filter-drawer tf503-filter-drawer">
          <header>
            <span className="tf503-filter-eyebrow">TINH CHỈNH KẾT QUẢ</span>
            <div><h2>Bộ lọc</h2>{selectedCount > 0 && <b>{selectedCount} đã chọn</b>}</div>
            <p><strong>{appliedResultCount}</strong> sản phẩm theo bộ lọc đang áp dụng</p>
          </header>
          <div className="tf4925-filter-scroll tf503-filter-scroll">
            <CollectionFilterSection id="vendor" label="Thương hiệu" options={vendors} selected={draft.selectedVendors} expanded={expanded.includes('vendor')} onToggleExpanded={toggleExpanded} onToggle={toggleVendor}/>
            <CollectionFilterSection id="gender" label="Giới tính" options={facetOptions.gender || []} selected={draft.selectedFilters.gender || []} expanded={expanded.includes('gender')} onToggleExpanded={toggleExpanded} onToggle={(value) => toggleFilter('gender', value)}/>
            <CollectionFilterSection
              id="price"
              label="Giá"
              options={priceOptions}
              selected={draft.priceBands.map((value) => COLLECTION_PRICE_BANDS.find((band) => band.value === value)?.label || value)}
              expanded={expanded.includes('price')}
              onToggleExpanded={toggleExpanded}
              onToggle={(label) => {
                const value = COLLECTION_PRICE_BANDS.find((band) => band.label === label)?.value;
                if (value) togglePriceBand(value);
              }}
            />
            {PRODUCT_FILTER_DEFINITIONS.filter((definition) => definition.id !== 'gender').map((definition) => <CollectionFilterSection
              key={definition.id}
              id={definition.id}
              label={definition.label}
              options={facetOptions[definition.id] || []}
              selected={draft.selectedFilters[definition.id] || []}
              expanded={expanded.includes(definition.id)}
              onToggleExpanded={toggleExpanded}
              onToggle={(value) => toggleFilter(definition.id, value)}
            />)}
            <div className="tf503-stock-section">
              <button
                type="button"
                className={`tf512-stock-option ${draft.stockOnly ? 'is-selected' : ''}`}
                role="checkbox"
                aria-checked={draft.stockOnly}
                onClick={() => setDraft((current) => ({...current, stockOnly: !current.stockOnly}))}
              >
                <i aria-hidden="true"><Check/></i>
                <span><b>Chỉ hiện sản phẩm còn hàng</b><small>Sẵn sàng giao hoặc đặt giữ hàng</small></span>
              </button>
            </div>
          </div>
          <footer>
            <Button type="button" variant="secondary" onClick={() => setDraft(emptyCollectionFilterState())} disabled={!selectedCount}>Xóa tất cả</Button>
            <Button type="button" onClick={applyAndClose}>Áp dụng bộ lọc</Button>
          </footer>
        </aside>
        <button ref={closeButtonRef} type="button" className="tf-dialog-close" onClick={close} aria-label="Đóng bộ lọc"><X/></button>
      </div>
    </>,
    document.body,
  );
}

const compactCollectionPages=(current:number,total:number):(number|'gap')[]=>{
  const pages=[...new Set([1,total,current-1,current,current+1].filter(page=>page>=1&&page<=total))].sort((a,b)=>a-b);
  return pages.flatMap((page,index)=>index&&page-pages[index-1]>1?['gap',page]:[page]);
};

export function CollectionPageV10() {
  const {handle} = useParams();
  const {products, collections, collectionProducts, theme} = useCommerce();
  const collection = collections.find((item) => item.handle === handle);
  const source = useMemo(
    () => (collection ? collectionProducts(collection) : products).filter((item) => item.status === 'active' && item.published),
    [collection, collectionProducts, products],
  );
  const collectionTemplate = theme.templates.collection;
  const bannerSection = collectionTemplate.sections.find((section) => section.type === 'collectionBanner');
  const bannerHeading = getBlock(bannerSection, 'heading');
  const bannerText = getBlock(bannerSection, 'text');
  const gridSection = collectionTemplate.sections.find((section) => section.type === 'collectionGrid');
  const configuredPageSize = Number(gridSection?.settings.pageSize ?? 50);
  const pageSize = Number.isFinite(configuredPageSize) ? Math.max(50, Math.min(100, configuredPageSize)) : 50;
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [stockOnly, setStockOnly] = useState(false);
  const [priceBands, setPriceBands] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<ProductFilterKey, string[]>>(emptyProductFilterSelection);
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterData = useMemo(() => buildCollectionFilterData(source), [source]);
  const filterIndex = filterData.index;
  const appliedFilters = useMemo<CollectionFilterState>(() => ({
    selectedVendors,
    priceBands,
    selectedFilters,
    stockOnly,
  }), [selectedVendors, priceBands, selectedFilters, stockOnly]);
  const facetOptions = filterData.facetOptions;
  const vendors = useMemo(() => {
    const counts = new Map<string, number>();
    source.forEach((item) => {if (item.vendor) counts.set(item.vendor, (counts.get(item.vendor) || 0) + 1);});
    return [...counts.entries()]
      .map(([value, count]) => ({value, count}))
      .sort((a, b) => a.value.localeCompare(b.value, 'vi'));
  }, [source]);
  const priceOptions = useMemo(() => {
    const counts = new Map(COLLECTION_PRICE_BANDS.map((band) => [band.value, 0]));
    source.forEach((item) => {
      const band = COLLECTION_PRICE_BANDS.find((candidate) => candidate.matches(item.price));
      if (band) counts.set(band.value, (counts.get(band.value) || 0) + 1);
    });
    return COLLECTION_PRICE_BANDS.map((band) => ({value: band.label, count: counts.get(band.value) || 0}));
  }, [source]);
  const toggleVendor = (value: string) => setSelectedVendors((current) => current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value]);
  const togglePriceBand = (value: string) => setPriceBands((current) => current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value]);
  const toggleProductFilter = (key: ProductFilterKey, value: string) => setSelectedFilters((current) => ({
    ...current,
    [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
  }));
  const clearFilters = () => {
    setSelectedVendors([]);
    setPriceBands([]);
    setSelectedFilters(emptyProductFilterSelection());
    setStockOnly(false);
  };
  const applyFilters = (next: CollectionFilterState) => {
    setSelectedVendors([...next.selectedVendors]);
    setPriceBands([...next.priceBands]);
    setSelectedFilters(cloneCollectionFilterState(next).selectedFilters);
    setStockOnly(next.stockOnly);
    setPage(1);
  };
  const filtered = useMemo(() => {
    let result = filterCollectionProducts(source, appliedFilters, filterIndex);
    if (sort === 'low') result = [...result].sort((a, b) => a.price - b.price);
    if (sort === 'high') result = [...result].sort((a, b) => b.price - a.price);
    if (sort === 'name') result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'nameDesc') result = [...result].sort((a, b) => b.title.localeCompare(a.title));
    if (sort === 'new') result = [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === 'old') result = [...result].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return result;
  }, [source, appliedFilters, filterIndex, sort]);
  const pageCount=Math.max(1,Math.ceil(filtered.length/pageSize));
  const visible=useMemo(()=>filtered.slice((page-1)*pageSize,page*pageSize),[filtered,page,pageSize]);
  const pageStart=filtered.length?(page-1)*pageSize+1:0;
  const pageEnd=Math.min(page*pageSize,filtered.length);
  const pageItems=useMemo(()=>compactCollectionPages(page,pageCount),[page,pageCount]);
  const activeFilterCount = selectedVendors.length
    + priceBands.length
    + Object.values(selectedFilters).reduce((sum, items) => sum + items.length, 0)
    + Number(stockOnly);
  useEffect(()=>setPage(1),[handle,selectedVendors,stockOnly,priceBands,selectedFilters,sort,pageSize]);
  useEffect(()=>setPage(current=>Math.min(current,pageCount)),[pageCount]);
  const goToPage=(next:number)=>{
    setPage(Math.min(pageCount,Math.max(1,next)));
    requestAnimationFrame(()=>document.querySelector('.lux-collection-results')?.scrollIntoView({behavior:'smooth',block:'start'}));
  };

  return (
    <div className="lux-collection-page">
      {bannerSection?.visible !== false && <section data-theme-section-id={bannerSection?.id} data-theme-section-label={bannerSection ? sectionLabels[bannerSection.type] : 'Banner bộ sưu tập'} className="tf4933-collection-banner" style={{minHeight: Math.round(Number(bannerSection?.settings.height || 360) * .64)}}>
        {bannerSection?.settings.showImage !== false && <img className="tf4933-collection-banner-media" src={optimizedImage(collection?.image || source[0]?.images[0] || '', 1920, 900)} alt={collection?.title || 'TimeForge collection'} width="1920" height="900" fetchPriority="high" decoding="async" />}
        <div className="tf4933-collection-banner-overlay" />
        <div className="tf4933-collection-banner-inner">
          <span className="tf4933-collection-kicker" {...themeBlockProps(bannerHeading)}>{String(bannerHeading?.settings.eyebrow || 'TIMEFORGE COLLECTION')}</span>
          <h1 {...themeBlockProps(bannerHeading)}>{collection?.title || String(bannerHeading?.settings.text || 'Hàng mới về')}</h1>
          <p {...themeBlockProps(bannerText)}>{collection?.description || String(bannerText?.settings.text || 'Những thiết kế mới nhất được TimeForge tuyển chọn.')}</p>
          <div className="tf4933-collection-meta"><span><b>{source.length}</b> thiết kế</span><i /><span>Tuyển chọn chính hãng</span></div>
        </div>
      </section>}
      {gridSection?.visible !== false && <>
      <section data-theme-section-id={gridSection?.id} data-theme-section-label={gridSection ? sectionLabels[gridSection.type] : 'Danh sách sản phẩm'} className="tf4933-collection-toolbar">
        <div className="tf4933-collection-toolbar-main">
          {gridSection?.settings.showFilter !== false && <button className="tf4933-collection-filter" onClick={() => setFiltersOpen(true)}><Filter/><span><small>Tùy chỉnh kết quả</small><b>Bộ lọc{activeFilterCount > 0 && <em>{activeFilterCount}</em>}</b></span></button>}
          {gridSection?.settings.showCount !== false && <div className="tf4933-collection-count" aria-live="polite"><strong>{filtered.length}</strong><span><b>Sản phẩm</b><small>Đang hiển thị {pageStart}–{pageEnd}</small></span></div>}
          {gridSection?.settings.showSort !== false && <label className="tf4933-collection-sort"><span><small>Sắp xếp</small><b>{COLLECTION_SORT_LABELS[sort]}</b></span><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sắp xếp sản phẩm"><option value="featured">Nổi bật</option><option value="relevant">Phù hợp nhất</option><option value="best">Bán chạy nhất</option><option value="name">Tên A–Z</option><option value="nameDesc">Tên Z–A</option><option value="low">Giá thấp đến cao</option><option value="high">Giá cao đến thấp</option><option value="old">Ngày cũ đến mới</option><option value="new">Ngày mới đến cũ</option></select><ChevronDown/></label>}
        </div>
        {activeFilterCount > 0 && <div className="tf4933-active-filters">
          {selectedVendors.map((value) => <span key={`vendor-${value}`}>Thương hiệu: {value}<button onClick={() => toggleVendor(value)} aria-label={`Xóa bộ lọc ${value}`}><X /></button></span>)}
          {priceBands.map((value) => {const label = COLLECTION_PRICE_BANDS.find((band) => band.value === value)?.label || value; return <span key={`price-${value}`}>Giá: {label}<button onClick={() => togglePriceBand(value)} aria-label={`Xóa bộ lọc giá ${label}`}><X /></button></span>;})}
          {PRODUCT_FILTER_DEFINITIONS.flatMap((definition) => selectedFilters[definition.id].map((value) => <span key={`${definition.id}-${value}`}>{definition.label}: {value}<button onClick={() => toggleProductFilter(definition.id, value)} aria-label={`Xóa bộ lọc ${value}`}><X /></button></span>))}
          {stockOnly && <span>Còn hàng<button onClick={() => setStockOnly(false)} aria-label="Xóa bộ lọc còn hàng"><X /></button></span>}
          <button className="tf4933-clear-filters" onClick={clearFilters}>Xóa tất cả</button>
        </div>}
      </section>
      <section className="lux-section lux-collection-results">
        {visible.length ? <div className={`lux-product-grid v23-columns-${Number(gridSection?.settings.columns || 4)}`}>{visible.map((product) => <LuxuryProductCard key={product.id} product={product} />)}</div> : <div className="lux-no-results"><Search /><h2>Chưa tìm thấy sản phẩm phù hợp</h2><p>Thử xóa bớt bộ lọc để xem thêm lựa chọn.</p><button onClick={clearFilters}>Xóa tất cả bộ lọc</button></div>}
        {filtered.length>pageSize&&<nav className="tf4933-pagination" aria-label="Phân trang sản phẩm"><button className="tf4933-page-nav" type="button" disabled={page===1} onClick={()=>goToPage(page-1)}><ChevronLeft/><span>Trang trước</span></button><div className="tf4933-page-numbers">{pageItems.map((item,index)=>item==='gap'?<span className="tf4933-page-gap" key={`gap-${index}`} aria-hidden="true">…</span>:<button type="button" key={item} className={item===page?'is-active':''} aria-current={item===page?'page':undefined} aria-label={`Trang ${item}`} onClick={()=>goToPage(item)}>{item}</button>)}</div><button className="tf4933-page-nav" type="button" disabled={page===pageCount} onClick={()=>goToPage(page+1)}><span>Trang sau</span><ChevronRight/></button></nav>}
      </section>
      {gridSection?.settings.showFilter !== false && <CollectionFilters
        open={filtersOpen}
        close={() => setFiltersOpen(false)}
        source={source}
        filterIndex={filterIndex}
        vendors={vendors}
        facetOptions={facetOptions}
        priceOptions={priceOptions}
        appliedFilters={appliedFilters}
        applyFilters={applyFilters}
      />}
      </>}
      {collectionTemplate.sections.filter((section) => isSharedThemeSectionV27(section)).map((section) => <ThemeSectionV27 key={section.id} section={section}/>)}
    </div>
  );
}

const decodeProductText = (value: string) => value
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();

function productContent(product: Product, sku: string) {
  const html = product.descriptionHtml || '';
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => decodeProductText(match[1]))
    .filter((text) => text && !/^thông số sản phẩm$/i.test(text));
  const specs = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => decodeProductText(match[1]))
    .map((text) => {
      const divider = text.indexOf(':');
      return divider > 0
        ? {label: text.slice(0, divider).trim(), value: text.slice(divider + 1).trim()}
        : {label: 'Chi tiết', value: text};
    })
    .filter((item) => item.value);

  if (!specs.some((item) => /sku/i.test(item.label))) specs.unshift({label: 'Mã SKU', value: sku || '—'});
  if (!specs.some((item) => /thương hiệu/i.test(item.label))) specs.push({label: 'Thương hiệu', value: product.vendor || '—'});

  return {
    paragraphs: paragraphs.length ? paragraphs : [product.descriptionText || 'Thiết kế được TimeForge tuyển chọn với thông tin rõ ràng và trải nghiệm mua sắm minh bạch.'],
    specs,
  };
}

const addCalendarDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const shortDate = (date: Date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

const extendedWarranty=(vendor:string)=>/(versace|ferragamo)/i.test(vendor);

function ProductGalleryPolicies({vendor}: {vendor: string}) {
  const warrantyYears=extendedWarranty(vendor)?4:2;
  const items = [
    {icon: <Sparkles />, title: 'Về thương hiệu', accent: vendor || 'TIMEFORGE', body: `${vendor || 'TimeForge'} được TimeForge tuyển chọn với thông tin sản phẩm, nguồn hàng và chính sách hậu mãi rõ ràng.`},
    {icon: <Check />, title: 'Hình thức thanh toán', body: 'Hỗ trợ chuyển khoản, thanh toán khi nhận hàng và các phương thức linh hoạt theo cấu hình cửa hàng.'},
    {icon: <PackageCheck />, title: 'Chính sách giao hàng', body: 'Đơn hàng được xác nhận, đóng gói an toàn và cập nhật trạng thái trong suốt quá trình vận chuyển.'},
    {icon: <ShieldCheck />, title: 'Bảo hành và đổi trả', body: `${vendor||'Sản phẩm'} được áp dụng bảo hành ${warrantyYears} năm theo chính sách TimeForge và thương hiệu.`},
  ];
  return <section className="tf-pdp491-gallery-accordions" aria-label="Thông tin mua hàng">
    {items.map((item, index) => <details key={item.title}>
      <summary><span className="tf-pdp491-accordion-icon">{item.icon}</span><span className="tf-pdp491-accordion-title">{item.title}{item.accent && <b>{item.accent}</b>}</span><i aria-hidden="true" /></summary>
      <div className="tf-pdp491-accordion-body"><p>{item.body}</p>{index === 1 && <ul><li>Thanh toán khi nhận hàng theo khu vực hỗ trợ.</li><li>Chuyển khoản ngân hàng và xác nhận tự động.</li><li>Hỗ trợ trả góp khi phương thức được kích hoạt.</li></ul>}{index===3&&<ul><li>{extendedWarranty(vendor)?'Versace và Ferragamo: 2 năm quốc tế cộng 2 năm hỗ trợ tại Việt Nam.':'Các thương hiệu còn lại: bảo hành 2 năm tại Việt Nam hoặc theo bảo hành quốc tế đi kèm.'}</li><li>Miễn phí thay pin trong thời hạn bảo hành.</li><li>Dây đeo, phụ kiện và hư hỏng do sử dụng không đúng hướng dẫn không thuộc phạm vi bảo hành.</li></ul>}</div>
    </details>)}
  </section>;
}

function ProductDeliveryEstimate() {
  const today = new Date();
  const dispatchStart = addCalendarDays(today, 1);
  const dispatchEnd = addCalendarDays(today, 2);
  const arrivalStart = addCalendarDays(today, 3);
  const arrivalEnd = addCalendarDays(today, 5);
  return <section className="tf4924-delivery" aria-label="Thời gian giao hàng dự kiến">
    <header><span className="tf4924-delivery-heading-icon"><Clock3 /></span><div><small>THỜI GIAN GIAO HÀNG DỰ KIẾN</small><p>Đặt hàng hôm nay, dự kiến nhận từ <strong>{shortDate(arrivalStart)}</strong> đến <strong>{shortDate(arrivalEnd)}</strong></p></div></header>
    <div className="tf4924-delivery-steps">
      <article><span><ShoppingBag /></span><div><b>{shortDate(today)}</b><small>Đặt hàng</small></div></article>
      <i aria-hidden="true" />
      <article><span><Truck /></span><div><b>{shortDate(dispatchStart)} – {shortDate(dispatchEnd)}</b><small>Giao hàng</small></div></article>
      <i aria-hidden="true" />
      <article><span><MapPin /></span><div><b>{shortDate(arrivalStart)} – {shortDate(arrivalEnd)}</b><small>Nhận hàng</small></div></article>
    </div>
  </section>;
}

type ResolvedGroupItem={item:ProductGroupItem;product?:Product};
const resolveProductGroupItems=(group:ProductGroup,products:Product[]):ResolvedGroupItem[]=>{
  const mapped=group.items.map((item)=>({item,product:products.find((product)=>product.id===item.productId||product.sku.toUpperCase()===item.sku.toUpperCase())}));
  const seen=new Set(mapped.map(({item})=>item.sku.toUpperCase()).filter(Boolean));
  const automatic=products
    .filter((product)=>group.skuPrefix&&product.sku.toUpperCase().startsWith(group.skuPrefix.toUpperCase())&&!seen.has(product.sku.toUpperCase()))
    .map((product,index)=>({product,item:{id:`auto-${product.id}`,productId:product.id,sku:product.sku,name:product.title,color:readProductFilterValues(product,'bandColor')[0]||readProductFilterValues(product,'caseColor')[0]||'',size:readProductFilterValues(product,'faceSize')[0]||'',image:product.images[0]||'',sortOrder:mapped.length+index}}));
  return [...mapped,...automatic].sort((a,b)=>a.item.sortOrder-b.item.sortOrder);
};

const swatchColor=(value:string)=>{
  const normalized=value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
  if(normalized.includes('rose')||normalized.includes('hong'))return'#c99586';
  if(normalized.includes('navy')||normalized.includes('xanh dam'))return'#183756';
  if(normalized.includes('xanh'))return'#527569';
  if(normalized.includes('den'))return'#242424';
  if(normalized.includes('nau'))return'#765443';
  if(normalized.includes('bac')||normalized.includes('silver'))return'#c4c7c8';
  if(normalized.includes('vang'))return'#c9a75d';
  if(normalized.includes('trang'))return'#f5f3ee';
  if(normalized.includes('do'))return'#9f2930';
  return'#a9aaa5';
};

function ProductFamilyCardSwatches({group,items,current}:{group:ProductGroup;items:ResolvedGroupItem[];current:Product}){
  return <div className="tf504-card-swatches" aria-label={`${group.name}: ${items.length} phiên bản`}>
    <span>{items.length} màu</span>
    <div>{items.slice(0,5).map(({item,product})=>{
      const active=product?.id===current.id||item.productId===current.id||item.sku===current.sku;
      return product?<Link key={item.id} className={active?'is-active':''} to={`/products/${product.handle}`} title={item.color||product.title} aria-label={item.color||product.title} style={{'--tf-swatch':swatchColor(item.color)} as React.CSSProperties}/>:null;
    })}{items.length>5&&<small>+{items.length-5}</small>}</div>
  </div>;
}

function ProductFamilySelector({group,products,current}:{group:ProductGroup;products:Product[];current:Product}){
  const items=resolveProductGroupItems(group,products).filter(({product})=>product?.status==='active'&&product.published);
  if(items.length<2)return null;
  const currentItem=items.find(({item,product})=>product?.id===current.id||item.productId===current.id||item.sku===current.sku);
  return <section className="tf504-family-selector" aria-label={`Các phiên bản thuộc ${group.name}`}>
    <header><div><small>MÀU SẮC</small><p><b>Màu sắc:</b> {currentItem?.item.color||current.title}</p></div><span>{items.length} phiên bản</span></header>
    <div>{items.map(({item,product})=>{
      const active=product?.id===current.id||item.productId===current.id||item.sku===current.sku;
      const content=<><span className="tf504-family-image">{(item.image||product?.images[0])?<img src={optimizedImage(item.image||product?.images[0]||'',240,240)} alt="" loading="lazy"/>:<Clock3/>}{active&&<Check/>}</span><span className="tf509-family-copy"><span className="tf509-family-variant"><b>{item.color||product?.title||item.name}</b><small>{item.size||item.sku}</small></span>{product&&<strong>{money(product.price)}</strong>}</span></>;
      return product?<Link key={item.id} className={active?'is-active':''} to={`/products/${product.handle}`} aria-current={active?'page':undefined}>{content}</Link>:<span key={item.id} className="is-unavailable" title="SKU chưa có trong catalog">{content}</span>;
    })}</div>
  </section>;
}

export function ProductPageV10() {
  const {handle} = useParams();
  const {products, productGroups, addToCart, theme, isLoading} = useCommerce();
  const {openCart} = useOutletContext<{openCart: () => void}>();
  const product = findProductByRoute(products, handle);
  const [imageIndex, setImageIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(product?.variants[0]?.id || '');
  const {has, toggle} = useWishlist();

  useEffect(() => {
    setImageIndex(0);
    setQuantity(1);
    setVariantId(product?.variants[0]?.id || '');
  }, [handle, product?.id]);
  useEffect(() => { if (product?.id) trackCommerceEvent('product_view',{productId:product.id,value:product.price}); }, [product?.id]);

  const parsedContent = useMemo(() => product ? productContent(product, product.variants[0]?.sku || product.sku) : {paragraphs: [], specs: []}, [product]);
  if (!product && isLoading) return <div className="route-loading tf-product-route-loading" aria-label="Đang tải đầy đủ dữ liệu sản phẩm" aria-busy="true"><div className="route-loading-bar"/><div className="route-loading-brand"><img src="/luxury-timeforge-logo.svg" alt="" aria-hidden="true"/><i/><b>Đang chuẩn bị sản phẩm</b></div></div>;
  if (!product) return <Navigate to="/404" replace />;
  if (product.status !== 'active' || !product.published) return <Navigate to="/404" replace />;
  const wished = has(product.id);

  const images = product.images.length ? product.images : ['https://placehold.co/1200x1200/f0eee8/25231f?text=TimeForge'];
  const variant = product.variants.find((item) => item.id === variantId) || product.variants[0];
  const price = variant?.price ?? product.price;
  const compareAt = variant?.compareAtPrice ?? product.compareAtPrice;
  const inventory = variant?.inventory ?? product.inventory;
  const productGroup=productGroups.find((group)=>group.status==='active'&&(group.items.some((item)=>item.productId===product.id||item.sku.toUpperCase()===product.sku.toUpperCase())||(group.skuPrefix&&product.sku.toUpperCase().startsWith(group.skuPrefix.toUpperCase()))));
  const warrantyYears=extendedWarranty(product.vendor)?4:2;
  const productTemplate = theme.templates.product;
  const productMain = productTemplate.sections.find((section) => section.type === 'productMain');
  const trustSection = productTemplate.sections.find((section) => section.type === 'trust');
  const recommendationSection = productTemplate.sections.find((section) => section.type === 'productRecommendations');
  const infoBlock = getBlock(productMain, 'productInfo');
  const priceBlock = getBlock(productMain, 'price');
  const variantBlock = getBlock(productMain, 'variantPicker');
  const quantityBlock = getBlock(productMain, 'quantity');
  const buyBlock = getBlock(productMain, 'buyButtons') || ({id:'runtime-buy-buttons',type:'buyButtons',visible:true,settings:{showAddToCart:true,showBuyNow:true,showWishlist:true}} satisfies ThemeBlock);
  const descriptionBlock = getBlocks(productMain, 'accordion').find((item) => item.settings.source === 'description');
  // Product details are a core storefront section. Keep them visible even when
  // an older saved theme no longer contains the optional description block.
  const productDetailsBlock = descriptionBlock || ({
    id: 'runtime-product-details',
    type: 'accordion',
    visible: true,
    settings: {title: 'Mô tả sản phẩm', source: 'description', open: true},
  } satisfies ThemeBlock);
  const showProductMain = productMain?.visible !== false;
  const relatedLimit = Number(recommendationSection?.settings.limit || 4);
  const related = products.filter((item) => item.id !== product.id && item.status === 'active' && item.published && (item.vendor === product.vendor || item.productType === product.productType)).slice(0, relatedLimit);
  const add = () => {addToCart(product.id, variantId, quantity); trackCommerceEvent('add_to_cart',{productId:product.id,value:price*quantity}); toast.success('Đã thêm sản phẩm vào giỏ hàng'); openCart();};
  const buyNow = () => {addToCart(product.id, variantId, quantity); trackCommerceEvent('checkout_started',{productId:product.id,value:price*quantity});};
  const changeImage = (direction: number) => setImageIndex((current) => (current + direction + images.length) % images.length);
  const modelName = product.title.replace(/^Đồng Hồ\s+(?:Nam|Nữ|Unisex)?\s*/i, '').trim() || product.title;

  return (
    <div className="tf-pdp491">
      {productMain?.settings.showBreadcrumb !== false && <nav className="tf-pdp491-breadcrumb" aria-label="Đường dẫn"><Link to="/">Trang chủ</Link><ChevronRight/><Link to="/collections">Đồng hồ</Link><ChevronRight/><span>{product.title}</span></nav>}

      {showProductMain ? <>
        <section data-theme-section-id={productMain?.id} data-theme-section-label={productMain ? sectionLabels[productMain.type] : 'Thông tin sản phẩm'} className={`tf-pdp491-main tf-pdp491-gallery-size-${String(productMain?.settings.gallerySize || 'medium')}`}>
          <div className="tf-pdp491-gallery-column">
            <div className="tf-pdp491-gallery">
              <div className="tf-pdp491-thumbnails" aria-label="Ảnh sản phẩm">{images.map((image, index) => <button key={`${image}-${index}`} className={imageIndex === index ? 'is-active' : ''} onClick={() => setImageIndex(index)} aria-label={`Xem ảnh ${index + 1}`}><img src={optimizedImage(image, 220, 220)} alt={`${product.title} ${index + 1}`} width="220" height="220" loading="lazy" decoding="async" /></button>)}</div>
              <div className="tf-pdp491-photo">
                <motion.div key={images[imageIndex]} initial={{opacity: .55}} animate={{opacity: 1}} transition={{duration:.2}} className="tf-pdp491-image-stage"><SmartImage className="tf-pdp491-smart-image" priority src={images[imageIndex]} alt={product.title} width={1400} height={1400} /></motion.div>
                {images.length > 1 && <div className="tf-pdp491-photo-nav"><button onClick={() => changeImage(-1)} aria-label="Ảnh trước"><ChevronLeft /></button><span>{imageIndex + 1} / {images.length}</span><button onClick={() => changeImage(1)} aria-label="Ảnh tiếp theo"><ChevronRight /></button></div>}
                <button className="tf-pdp491-zoom" onClick={() => setZoom(true)}><ZoomIn /><span>Phóng to</span></button>
              </div>
            </div>
            <div className="tf-pdp491-gallery-under"><ProductGalleryPolicies vendor={product.vendor} /></div>
          </div>

          <aside className={`tf-pdp491-summary ${inventory <= 0 ? 'is-sold-out' : ''} ${productMain?.settings.stickyInfo === false ? 'is-not-sticky' : ''}`}>
            <header className="tf-pdp491-title" {...themeBlockProps(infoBlock)}>
              {infoBlock?.settings.showVendor !== false && <Link to={`/collections?brand=${encodeURIComponent(product.vendor || '')}`}>{product.vendor || 'TIMEFORGE'}</Link>}
              <h1>{product.title}</h1>
              {Boolean(infoBlock?.settings.showSku) && <small>SKU {variant?.sku || product.sku || '—'}</small>}
              <div className="tf-pdp491-title-pills" aria-label="Cam kết sản phẩm"><span><ShieldCheck/>Chính hãng</span><span><PackageCheck/>Bảo hiểm vận chuyển</span><span className={inventory > 0 ? 'available' : 'sold-out'}><i/>{inventory > 0 ? 'Có sẵn' : 'Tạm hết'}</span></div>
            </header>

            {priceBlock && <div className="tf-pdp491-price" {...themeBlockProps(priceBlock)}>
              <strong>{money(price)}</strong>
              {Boolean(priceBlock.settings.showCompare) && compareAt > price && <del>{money(compareAt)}</del>}
              {Boolean(priceBlock.settings.showDiscount) && compareAt > price && <span>–{discount(price, compareAt)}%</span>}
            </div>}

            <div className="tf-pdp491-benefits" aria-label="Quyền lợi mua hàng">
              <div><Truck/><span><b>Miễn phí giao hàng</b><small>Giao hàng toàn quốc, HCM hỗ trợ hỏa tốc</small></span></div>
              <div><Check/><span><b>Thanh toán linh hoạt</b><small>COD, chuyển khoản và trả góp theo cấu hình</small></span></div>
              <div><ShieldCheck/><span><b>Bảo hành {warrantyYears} năm</b><small>Miễn phí thay pin trong thời hạn bảo hành</small></span></div>
            </div>

            {productGroup&&<ProductFamilySelector group={productGroup} products={products} current={product}/>}

            {variantBlock && product.variants.length > 1 && <div className="tf-pdp491-variants" {...themeBlockProps(variantBlock)}><div><b>Phiên bản</b><span>{variant?.title}</span></div><div>{product.variants.map((item) => <button key={item.id} className={variantId === item.id ? 'is-active' : ''} onClick={() => setVariantId(item.id)}>{item.title}</button>)}</div></div>}

            <div className="tf-pdp491-purchase-meta">
              {infoBlock?.settings.showStock !== false && <div className={`tf-pdp491-stock ${inventory > 0 ? 'is-available' : 'is-sold-out'}`}><span><i />{inventory > 0 ? `Chỉ còn ${inventory} sản phẩm` : 'Tạm hết hàng'}</span></div>}
              {(quantityBlock || Boolean(buyBlock?.settings.showWishlist)) && <div className="tf-pdp491-controls">
                {quantityBlock && <div className="tf-pdp491-quantity" {...themeBlockProps(quantityBlock)}><span>Số lượng</span><div><button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={inventory <= 0} aria-label="Giảm số lượng"><Minus /></button><strong>{inventory > 0 ? quantity : 0}</strong><button onClick={() => setQuantity(Math.min(Math.max(inventory, 1), quantity + 1))} disabled={inventory <= 0 || quantity >= inventory} aria-label="Tăng số lượng"><Plus /></button></div></div>}
                {Boolean(buyBlock?.settings.showWishlist) && <button type="button" className={`tf-pdp491-wish ${wished ? 'is-active' : ''}`} onClick={() => {toggle(product.id); toast.success(wished ? 'Đã xóa khỏi danh sách yêu thích' : 'Đã lưu vào danh sách yêu thích');}} aria-label={wished ? 'Xóa khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'} aria-pressed={wished}><Heart fill={wished ? 'currentColor' : 'none'} /></button>}
              </div>}
            </div>

            {buyBlock && (buyBlock.settings.showAddToCart !== false || Boolean(buyBlock.settings.showBuyNow)) && <div className="tf-pdp491-actions" {...themeBlockProps(buyBlock)}>
              {buyBlock.settings.showAddToCart !== false && <button type="button" className="tf-pdp491-add" onClick={add} disabled={inventory <= 0}><ShoppingBag/><span>{inventory > 0 ? 'Thêm giỏ hàng' : 'Tạm hết hàng'}</span><b>{money(price * quantity)}</b></button>}
              {Boolean(buyBlock.settings.showBuyNow) && (inventory > 0 ? <Link className="tf-pdp491-buy" to="/checkout" onClick={buyNow}>Mua ngay</Link> : <button className="tf-pdp491-buy" disabled>Tạm hết hàng</button>)}
            </div>}

            <ProductDeliveryEstimate />

            <section className="tf-pdp491-details" {...themeBlockProps(productDetailsBlock)} aria-label="Mô tả và thông số kỹ thuật">
              <article className="tf-pdp491-description">
                <h2>Mô tả sản phẩm</h2>
                <div>{parsedContent.paragraphs.map((paragraph, index) => {
                  const beginsWithModel = paragraph.toLocaleLowerCase('vi').startsWith(modelName.toLocaleLowerCase('vi'));
                  return <p key={`${paragraph}-${index}`}>{index === 0 ? <><strong>{beginsWithModel ? paragraph.slice(0, modelName.length) : modelName}</strong>{beginsWithModel ? paragraph.slice(modelName.length) : ` ${paragraph}`}</> : paragraph}</p>;
                })}</div>
              </article>
              <article className="tf-pdp491-specs"><h2>Thông số kỹ thuật</h2><ul>{parsedContent.specs.map((item, index) => <li key={`${item.label}-${index}`}><span><strong>{item.label}:</strong> {item.value}</span></li>)}</ul></article>
            </section>
          </aside>
        </section>

        {trustSection?.visible !== false && <section data-theme-section-id={trustSection?.id} data-theme-section-label={trustSection ? sectionLabels[trustSection.type] : 'Cam kết cửa hàng'} className="tf-pdp491-policies" aria-label="Dịch vụ và chính sách TimeForge">
          <header><small>DỊCH VỤ TIMEFORGE</small><h2>Mua sắm an tâm từ lúc đặt hàng đến sau bán hàng</h2></header>
          <div>
            <article><ShieldCheck/><span><small>01</small><h3>Sản phẩm chính hãng</h3><p>Nguồn hàng, thông số và điều kiện bảo hành được trình bày minh bạch.</p></span></article>
            <article><PackageCheck/><span><small>02</small><h3>Giao hàng bảo hiểm</h3><p>Đóng gói cẩn thận, theo dõi đơn hàng và hỗ trợ giao trên toàn quốc.</p></span></article>
            <article><Clock3/><span><small>03</small><h3>Hỗ trợ hậu mãi</h3><p>Tiếp nhận bảo hành, đổi trả và hướng dẫn trong quá trình sử dụng.</p></span></article>
          </div>
        </section>}
      </> : <section className="v23-template-hidden"><h1>Trang sản phẩm đang được ẩn trong Cửa hàng online</h1><p>Mở trình chỉnh sửa theme để bật lại section Thông tin sản phẩm.</p></section>}

      {recommendationSection?.visible !== false && !!related.length && <section data-theme-section-id={recommendationSection?.id} data-theme-section-label={recommendationSection ? sectionLabels[recommendationSection.type] : 'Sản phẩm liên quan'} className="lux-section lux-related tf-related-v4916"><LuxurySectionHeading eyebrow="GỢI Ý PHÙ HỢP" title={String(recommendationSection?.settings.title || 'Sản phẩm liên quan')} /><div className={`lux-product-grid v23-columns-${Number(recommendationSection?.settings.columns || 4)}`}>{related.map((item) => <LuxuryProductCard key={item.id} product={item} />)}</div></section>}
      {productTemplate.sections.filter((section) => isSharedThemeSectionV27(section)).map((section) => <ThemeSectionV27 key={section.id} section={section}/>)}
      <div className="tf-pdp492-mobile-bar" aria-label="Mua sản phẩm nhanh">
        <div className="tf-pdp492-mobile-copy"><small>{product.vendor || 'TIMEFORGE'}</small><b>{money(price)}</b></div>
        <div className="tf-pdp492-mobile-actions">
          <button type="button" className="add" onClick={add} disabled={inventory <= 0}><ShoppingBag /><span>{inventory > 0 ? 'Thêm giỏ hàng' : 'Tạm hết hàng'}</span></button>
          {inventory > 0 && <Link className="buy" to="/checkout" onClick={buyNow}>Mua ngay</Link>}
        </div>
      </div>
      <Dialog open={zoom} onOpenChange={setZoom}><DialogContent className="lux-zoom-dialog" description="Xem ảnh sản phẩm kích thước lớn"><div className="lux-zoom-canvas"><Button variant="icon" className="previous" onClick={() => changeImage(-1)} aria-label="Ảnh trước"><ArrowLeft /></Button><img src={optimizedImage(images[imageIndex], 2000, undefined, 'limit')} alt={product.title} decoding="async" /><Button variant="icon" className="next" onClick={() => changeImage(1)} aria-label="Ảnh tiếp theo"><ArrowRight /></Button><span>{imageIndex + 1} / {images.length}</span></div></DialogContent></Dialog>
    </div>
  );
}

export function SearchPageV10() {
  const {products, theme} = useCommerce();
  const [params, setParams] = useSearchParams();
  const [value, setValue] = useState(params.get('q') || '');
  const query = params.get('q') || '';
  const searchTemplate = theme.templates.search;
  const resultsSection = searchTemplate.sections.find((section) => section.type === 'searchResults');
  const columns = Number(resultsSection?.settings.columns || 4);
  const showSuggestions = resultsSection?.settings.showSuggestions !== false;
  const found = products.filter((product) => `${product.title} ${product.vendor} ${product.sku} ${product.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const [visibleCount, setVisibleCount] = useState(24);
  useEffect(() => setVisibleCount(24), [query]);
  const visibleFound = found.slice(0, visibleCount);
  const suggested = products.filter((product) => product.status === 'active' && product.published).slice(0, 4);
  return <div className="lux-search-page v27-search-template">
    {resultsSection?.visible !== false && <div data-theme-section-id={resultsSection?.id} data-theme-section-label={resultsSection ? sectionLabels[resultsSection.type] : 'Kết quả tìm kiếm'}>
      <section className="v27-search-hero"><small>DISCOVER</small><h1>Tìm kiếm TimeForge</h1><p>Khám phá theo tên sản phẩm, thương hiệu hoặc mã SKU.</p><form onSubmit={(event) => {event.preventDefault(); setParams(value ? {q: value} : {});}}><Search /><input autoFocus value={value} onChange={(event) => setValue(event.target.value)} placeholder="Tên, thương hiệu hoặc SKU" /><button>Tìm kiếm</button></form></section>
      {query ? <section className="lux-section v27-search-results tf-search-results-v498"><LuxurySectionHeading eyebrow="SEARCH RESULTS" title={`${found.length} kết quả cho “${query}”`} />{found.length ? <><div className={`lux-product-grid v23-columns-${columns}`}>{visibleFound.map((product) => <LuxuryProductCard key={product.id} product={product} />)}</div>{visibleCount < found.length && <button className="tf-search-more-v496" type="button" onClick={() => setVisibleCount((count) => count + 24)}>Xem thêm sản phẩm<ArrowRight /></button>}</> : <div className="lux-no-results"><Search/><h2>Chưa tìm thấy thiết kế phù hợp</h2><p>Thử một từ khóa ngắn hơn hoặc khám phá các sản phẩm được tuyển chọn bên dưới.</p></div>}</section> : showSuggestions && <section className="lux-section v27-search-suggestions"><LuxurySectionHeading eyebrow="CURATED FOR YOU" title="Gợi ý để bắt đầu" /><div className={`lux-product-grid v23-columns-${columns}`}>{suggested.map((product) => <LuxuryProductCard key={product.id} product={product} />)}</div></section>}
    </div>}
    {searchTemplate.sections.filter((section) => isSharedThemeSectionV27(section)).map((section) => <ThemeSectionV27 key={section.id} section={section}/>)}
  </div>;
}

const staticContentPages: Record<string, {eyebrow: string; title: string; lead: string; paragraphs: string[]}> = {
  about: {eyebrow: 'CÂU CHUYỆN TIMEFORGE', title: 'TimeForge được xây quanh sự minh bạch.', lead: 'Luxury thật sự là một trải nghiệm nhất quán — từ lúc khám phá sản phẩm đến nhiều năm sau khi sở hữu.', paragraphs: ['TimeForge tuyển chọn đồng hồ theo thiết kế, giá trị sử dụng và sự rõ ràng của nguồn hàng.', 'Hình ảnh trung thực, thông tin rõ ràng và chính sách hậu mãi có trách nhiệm.']},
  warranty: {eyebrow: 'BẢO HÀNH & CHĂM SÓC', title: 'Hỗ trợ sử dụng bền lâu.', lead: 'Điều kiện bảo hành được xác nhận theo từng thương hiệu và nguồn hàng.', paragraphs: ['Thông tin cụ thể được thể hiện trên sản phẩm và xác nhận lại trước khi giao.', 'Đội ngũ TimeForge hỗ trợ tiếp nhận, kiểm tra và hướng dẫn quy trình khi phát sinh nhu cầu.']},
  shipping: {eyebrow: 'GIAO HÀNG', title: 'Đóng gói an toàn, theo dõi minh bạch.', lead: 'Mỗi đơn hàng được xác nhận và bảo vệ trong quá trình vận chuyển.', paragraphs: ['Thời gian dự kiến từ 1–4 ngày tùy khu vực và tình trạng sản phẩm.', 'Thông tin vận chuyển được cập nhật theo từng giai đoạn của đơn hàng.']},
  returns: {eyebrow: 'ĐỔI TRẢ', title: 'Quy trình đổi trả rõ ràng.', lead: 'Yêu cầu được đánh giá theo tình trạng thực tế và chính sách của từng sản phẩm.', paragraphs: ['Vui lòng giữ nguyên hộp, phụ kiện và chứng từ đi kèm.', 'Liên hệ TimeForge sớm để được hướng dẫn trước khi gửi sản phẩm.']},
  contact: {eyebrow: 'LIÊN HỆ', title: 'Trò chuyện cùng TimeForge.', lead: 'Tư vấn sản phẩm, đơn hàng và dịch vụ hậu mãi.', paragraphs: ['Email: hello@timeforge.vn', 'Hotline: 0900 000 000']},
};

export function ContentPageV10() {
  const {slug = 'about'} = useParams();
  const {theme} = useCommerce();
  const {pages:managedPages}=useManagedContentPages();
  const managedPage=managedPages.find(item=>item.slug===slug);
  const page = staticContentPages[slug] || staticContentPages.about;
  const supplemental = theme.templates.page.sections.filter((section) => isSharedThemeSectionV27(section));
  if(!managedPage&&!staticContentPages[slug])return <Navigate to="/404" replace/>;
  if(managedPage&&!managedPage.published)return <Navigate to="/404" replace/>;
  const core = slug === 'about'&&managedPage
    ? <article className="tf4941-about-page">
      <nav className="tf4941-about-breadcrumb" aria-label="Đường dẫn"><Link to="/">Trang chủ</Link><ChevronRight/><span>{managedPage.label}</span></nav>
      <header className="tf4941-about-hero">
        <div><span>{managedPage.eyebrow}</span><h1>{managedPage.title}</h1><p>{managedPage.lead}</p><Link to="/collections">Khám phá bộ sưu tập<ArrowRight/></Link></div>
        <aside aria-hidden="true"><small>EST.</small><b>TF</b><span>2026 · VIETNAM</span><i/></aside>
      </header>
      <section className="tf4941-about-story">
        <aside><small>THE TIMEFORGE STANDARD</small><h2>Mỗi lựa chọn đều bắt đầu từ thông tin rõ ràng.</h2><div><span><b>01</b>Tuyển chọn</span><span><b>02</b>Minh bạch</span><span><b>03</b>Đồng hành</span></div></aside>
        <main>{managedPage.sections.map((section,index)=><article key={section.id}><span>{String(index+1).padStart(2,'0')}</span><div><h2>{section.title}</h2>{section.body.split(/\n+/).filter(Boolean).map(paragraph=><p key={paragraph}>{paragraph}</p>)}</div></article>)}</main>
      </section>
      <footer className="tf4941-about-footer"><div><small>CURATED WITH PURPOSE</small><h2>Khám phá chiếc đồng hồ phù hợp với nhịp sống riêng.</h2></div><Link to="/collections">Xem tất cả sản phẩm<ArrowRight/></Link></footer>
    </article>
    : managedPage?<article className={`tf4923-policy-page tf4923-policy-${managedPage.slug}`}>
      <nav className="tf4923-policy-breadcrumb" aria-label="Đường dẫn"><Link to="/">Trang chủ</Link><ChevronRight/><span>{managedPage.label}</span></nav>
      <header className="tf4923-policy-hero">
        <div className="tf4923-policy-hero-copy"><span>{managedPage.eyebrow}</span><h1>{managedPage.title}</h1><p>{managedPage.lead}</p><div className="tf4923-policy-pills"><span><ShieldCheck/>Thông tin rõ ràng</span><span><PackageCheck/>Quy trình minh bạch</span><span><Clock3/>Hỗ trợ tận tâm</span></div></div>
        <div className="tf4923-policy-mark" aria-hidden="true"><small>TIMEFORGE CARE</small><b>{managedPage.slug==='warranty'?'W':managedPage.slug==='shipping'?'S':'R'}</b><span>{String(managedPage.sections.length).padStart(2,'0')} mục chính sách</span></div>
      </header>
      <div className="tf4923-policy-layout">
        <aside><span>TRUNG TÂM HỖ TRỢ</span><h2>Thông tin cần biết</h2><nav>{managedPages.filter(item=>item.published).map(item=><Link key={item.slug} className={item.slug===managedPage.slug?'is-active':''} to={`/pages/${item.slug}`}>{item.label}<ArrowRight/></Link>)}</nav><div><b>Cần hỗ trợ thêm?</b><p>Liên hệ TimeForge và cung cấp mã đơn hàng để được kiểm tra nhanh hơn.</p><Link to="/pages/contact">Liên hệ TimeForge</Link></div></aside>
        <main className="tf4923-policy-sections">{managedPage.sections.map((section,index)=><section key={section.id}><span>{String(index+1).padStart(2,'0')}</span><div><h2>{section.title}</h2>{section.body.split(/\n+/).filter(Boolean).map(paragraph=><p key={paragraph}>{paragraph}</p>)}</div></section>)}</main>
      </div>
      <footer className="tf4923-policy-footer"><div><small>TIMEFORGE STANDARD</small><h2>Minh bạch trước khi mua, đồng hành sau khi nhận hàng.</h2></div><Link to="/collections">Khám phá sản phẩm<ArrowRight/></Link></footer>
    </article>
    : <article className="tf4923-policy-page tf4923-policy-contact"><header className="tf4923-policy-hero"><div className="tf4923-policy-hero-copy"><span>{page.eyebrow}</span><h1>{page.title}</h1><p>{page.lead}</p></div></header><main className="tf4923-policy-sections">{page.paragraphs.map((paragraph,index)=><section key={paragraph}><span>{String(index+1).padStart(2,'0')}</span><div><p>{paragraph}</p></div></section>)}</main></article>;
  return <div className="v27-content-template">{core}{supplemental.map((section) => <ThemeSectionV27 key={section.id} section={section}/>)}</div>;
}

export function NotFoundV10() {
  return <section className="lux-not-found tf-not-found-v496"><div className="tf-not-found-mark-v496"><img src="/luxury-timeforge-logo.svg" alt="Luxury Timeforge"/><span>404</span></div><small>LOST IN TIME</small><h1>Trang này đã rời khỏi dòng thời gian.</h1><p>Đường dẫn có thể đã thay đổi, hoặc sản phẩm chưa được xuất bản trên cửa hàng.</p><div><Link className="primary" to="/">Về trang chủ<ArrowRight/></Link><Link to="/collections">Khám phá đồng hồ</Link><Link to="/search">Tìm kiếm</Link></div></section>;
}
