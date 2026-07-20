import {motion} from 'framer-motion';
import {ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, CreditCard, Gift, LockKeyhole, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Sparkles, Trash2, Truck} from 'lucide-react';
import {useEffect, useMemo, useState, type FormEvent, type ReactNode} from 'react';
import {Link, Navigate, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {useCommerce} from './context';
import {optimizedImage, productImage, SmartImage} from './image-utils';
import {readIntegrationSettings} from './integrations';
import {startPayment} from './payment-adapter';
import type {CheckoutPayload, Product} from './types';
import {money} from './utils';
import {trackCommerceEvent} from './commerce-events';
import {ThemeSectionV27, isSharedThemeSectionV27} from './theme-section-v27';
import {Button} from './ui';
import {sectionLabels} from './theme';
import './v4912-commerce.css';

const productImageFallbackV32 = productImage({images: []});
function CommerceProductImageV32({product, alt, size = 220, priority = false}: {product: Product; alt: string; size?: number; priority?: boolean}) {
  const source = optimizedImage(productImage(product), size, size, 'fit');
  return <img
    className="tf4912-product-image"
    src={source}
    alt={alt}
    width={size}
    height={size}
    loading={priority ? 'eager' : 'lazy'}
    fetchPriority={priority ? 'high' : 'auto'}
    decoding="async"
    onError={(event) => {
      if (event.currentTarget.dataset.fallbackApplied === 'true') return;
      event.currentTarget.dataset.fallbackApplied = 'true';
      event.currentTarget.src = productImageFallbackV32;
    }}
  />;
}

function useSummary(discountCode = '') {
  const {cart, products, evaluateDiscount} = useCommerce();
  return useMemo(() => {
    const lines = cart.map((line) => {
      const product = products.find((item) => item.id === line.productId);
      if (!product) return null;
      const variant = product.variants.find((item) => item.id === line.variantId) || product.variants[0];
      const unitPrice = variant?.price || product.price;
      return {line, product, variant, unitPrice, total: unitPrice * line.quantity};
    }).filter(Boolean) as Array<{line: (typeof cart)[number]; product: (typeof products)[number]; variant: (typeof products)[number]['variants'][number] | undefined; unitPrice: number; total: number}>;
    const subtotal = lines.reduce((sum, item) => sum + item.total, 0);
    const integration = readIntegrationSettings();
    const threshold = Math.max(0, integration.shipping.freeShippingThreshold || 1000000);
    const shipping = subtotal >= threshold ? 0 : 50000;
    const discount = discountCode ? evaluateDiscount(discountCode, subtotal, shipping) : null;
    const shippingAfterDiscount = Math.max(0, shipping - (discount?.shippingDiscount || 0));
    return {lines, subtotal, shipping, shippingAfterDiscount, discount, total: subtotal - (discount?.amount || 0) + shippingAfterDiscount};
  }, [cart, products, discountCode, evaluateDiscount]);
}

function LuxuryCheckoutLogo() {
  const {theme} = useCommerce();
  return <Link className="tf4912-checkout-logo" to="/">{theme.settings.logoImage ? <SmartImage src={theme.settings.logoImage} alt={theme.settings.storeName} width={180} height={54} priority /> : <><img src="/luxury-timeforge-logo.svg" alt="" aria-hidden="true"/><b>{theme.settings.logoText || 'TIMEFORGE'}</b></>}</Link>;
}

function SummaryRows({subtotal, shipping, discount, total}: {subtotal: number; shipping: number; discount: ReturnType<typeof useSummary>['discount']; total: number}) {
  return <dl className="tf4912-totals">
    <div><dt>Tạm tính</dt><dd>{money(subtotal)}</dd></div>
    {discount?.valid && <div className="is-discount"><dt>Giảm giá <span>{discount.discount?.code}</span></dt><dd>–{money(discount.amount)}</dd></div>}
    <div><dt>Vận chuyển</dt><dd>{shipping <= 0 ? 'Miễn phí' : money(shipping)}</dd></div>
    <div className="is-total"><dt>Tổng cộng <small>VND</small></dt><dd>{money(total)}</dd></div>
  </dl>;
}

function ShippingProgress({subtotal}: {subtotal: number}) {
  const target = Math.max(1, readIntegrationSettings().shipping.freeShippingThreshold || 1000000);
  const remaining = Math.max(0, target - subtotal);
  const progress = Math.min(100, subtotal / target * 100);
  return <section className="tf4912-shipping-progress" aria-label="Tiến độ miễn phí giao hàng">
    <div>{remaining > 0 ? <><Truck/><span>Mua thêm <b>{money(remaining)}</b> để được miễn phí giao hàng</span></> : <><CheckCircle2/><span>Đơn hàng được <b>miễn phí giao hàng</b></span></>}</div>
    <i><span style={{width: `${progress}%`}}/></i>
  </section>;
}

export function CartPageV11() {
  const {updateCart, clearCart, theme} = useCommerce();
  useEffect(() => {trackCommerceEvent('cart_view');}, []);
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('discount') || '');
  const [applied, setApplied] = useState(params.get('discount') || '');
  const [gift, setGift] = useState(false);
  const cartTemplate = theme.templates.cart;
  const cartMain = cartTemplate.sections.find((section) => section.type === 'cartMain');
  const trustSection = cartTemplate.sections.find((section) => section.type === 'trust');
  const supplemental = cartTemplate.sections.filter((section) => isSharedThemeSectionV27(section));
  const showCoupon = cartMain?.settings.showCoupon !== false;
  const showShippingEstimate = cartMain?.settings.showShippingEstimate !== false;
  const showTrust = cartMain?.settings.showTrust !== false && trustSection?.visible !== false;
  const {lines, subtotal, shippingAfterDiscount, discount, total} = useSummary(applied);
  const quantity = lines.reduce((sum, item) => sum + item.line.quantity, 0);
  const supplement = supplemental.map((section) => <ThemeSectionV27 key={section.id} section={section}/>);

  if (!lines.length) return <div className="tf4912-cart-route">
    <section data-theme-section-id={cartMain?.id} data-theme-section-label={cartMain ? sectionLabels[cartMain.type] : 'Giỏ hàng'} className="tf4912-empty-cart">
      <div className="tf4912-empty-cart-icon"><ShoppingBag/></div>
      <small>GIỎ HÀNG</small>
      <h1>Giỏ hàng đang trống.</h1>
      <p>Khám phá những thiết kế được TimeForge tuyển chọn cho từng dấu ấn cá nhân.</p>
      <Link to="/collections">Khám phá bộ sưu tập <ArrowRight/></Link>
    </section>
    {supplement}
  </div>;

  if (cartMain?.visible === false) return <div className="tf4912-cart-route"><section className="tf4912-cart-hidden"><h1>Giỏ hàng đang được ẩn trong Cửa hàng online</h1><p>Bật lại section Giỏ hàng trong template để hiển thị nội dung.</p></section>{supplement}</div>;

  return <div className="tf4912-cart-route">
    <section data-theme-section-id={cartMain?.id} data-theme-section-label={cartMain ? sectionLabels[cartMain.type] : 'Giỏ hàng'} className="tf4912-cart-page">
      <header className="tf4912-cart-header">
        <div><h1>Giỏ hàng</h1><span>{quantity} sản phẩm đã chọn</span></div>
        <Button variant="destructive" size="sm" onClick={clearCart}><Trash2/>Xóa giỏ hàng</Button>
      </header>

      {showShippingEstimate && <ShippingProgress subtotal={subtotal}/>} 

      <div className="tf4912-cart-layout">
        <main className="tf4912-cart-main">
          <section className="tf4912-cart-lines" aria-label="Sản phẩm trong giỏ hàng">
            {lines.map(({line, product, variant, unitPrice}) => <motion.article layout key={`${product.id}-${line.variantId}`} className="tf4912-cart-line">
              <Link to={`/products/${product.handle}`} className="tf4912-cart-line-image"><CommerceProductImageV32 product={product} alt={product.title} size={360} priority/></Link>
              <div className="tf4912-cart-line-copy">
                <small>{product.vendor || 'TIMEFORGE'}</small>
                <Link to={`/products/${product.handle}`}>{product.title}</Link>
                <span>{variant?.title && variant.title !== 'Default Title' ? variant.title : 'Phiên bản tiêu chuẩn'} · SKU {variant?.sku || product.sku || '—'}</span>
                <div className="tf4912-cart-line-actions">
                  <div className="tf4912-quantity" aria-label="Số lượng">
                    <button type="button" onClick={() => updateCart(line.productId, line.variantId, line.quantity - 1)} aria-label="Giảm số lượng"><Minus/></button>
                    <b>{line.quantity}</b>
                    <button type="button" onClick={() => updateCart(line.productId, line.variantId, line.quantity + 1)} aria-label="Tăng số lượng"><Plus/></button>
                  </div>
                  <button type="button" className="tf4912-remove-line" onClick={() => updateCart(line.productId, line.variantId, 0)} aria-label="Xóa sản phẩm"><Trash2/><span>Xóa</span></button>
                </div>
              </div>
              <div className="tf4912-cart-line-price"><b>{money(unitPrice * line.quantity)}</b>{line.quantity > 1 && <small>{money(unitPrice)} / sản phẩm</small>}</div>
            </motion.article>)}
          </section>

          <label className="tf4912-gift-option"><input type="checkbox" checked={gift} onChange={(event) => setGift(event.target.checked)}/><i><Gift/></i><span><b>Đây là một món quà</b><small>{gift ? 'TimeForge sẽ đóng gói tối giản và không đặt giá trong hộp.' : 'Thêm ghi chú quà tặng ở bước thanh toán.'}</small></span></label>

          {showTrust && <section data-theme-section-id={trustSection?.id} data-theme-section-label={trustSection ? sectionLabels[trustSection.type] : 'Cam kết cửa hàng'} className="tf4912-cart-assurance">
            <article><i><ShieldCheck/></i><span><b>Cam kết chính hãng</b><small>Nguồn hàng minh bạch</small></span></article>
            <article><i><PackageCheck/></i><span><b>Đóng gói bảo hiểm</b><small>Bảo vệ khi vận chuyển</small></span></article>
            <article><i><LockKeyhole/></i><span><b>Thanh toán bảo mật</b><small>Dữ liệu được mã hóa</small></span></article>
          </section>}
        </main>

        <aside className="tf4912-cart-summary">
          <header><h2>Tóm tắt đơn hàng</h2><p>Kiểm tra ưu đãi và tổng tiền trước khi thanh toán.</p></header>
          {showCoupon && <div className="tf4912-coupon"><label htmlFor="cart-discount-code">Mã ưu đãi</label><div><input id="cart-discount-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Nhập mã giảm giá"/><Button type="button" variant="secondary" onClick={() => setApplied(code.trim())}>Áp dụng</Button></div>{applied && <p className={discount?.valid ? 'is-success' : 'is-error'}>{discount?.message || 'Mã giảm giá không hợp lệ.'}</p>}</div>}
          <SummaryRows subtotal={subtotal} shipping={shippingAfterDiscount} discount={discount} total={total}/>
          <Link className="tf4912-checkout-cta" to={`/checkout${applied ? `?discount=${encodeURIComponent(applied)}` : ''}`}>Thanh toán an toàn <ArrowRight/></Link>
          <div className="tf4912-cart-payment-pills"><span><b>COD</b>Nhận hàng</span><span><b>BANK</b>Chuyển khoản</span><span><b>SECURE</b>Bảo mật</span></div>
        </aside>
      </div>
    </section>
    {supplement}
  </div>;
}

const initialPayload: CheckoutPayload = {customer: {name: '', email: '', phone: ''}, shippingAddress: {fullName: '', phone: '', email: '', address1: '', address2: '', ward: '', district: '', city: 'TP. Hồ Chí Minh', country: 'Việt Nam', postalCode: ''}, paymentMethod: 'cod', note: '', discountCode: ''};

function CheckoutSection({number, title, description, children}: {number: string; title: string; description: string; children: ReactNode}) {
  return <section className="tf4912-checkout-section"><header><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div></header>{children}</section>;
}

export function CheckoutPageV11() {
  const {cart, createOrder} = useCommerce();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState<CheckoutPayload>({...initialPayload, discountCode: params.get('discount') || ''});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const integration = readIntegrationSettings();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const {lines, subtotal, shippingAfterDiscount, discount, total} = useSummary(payload.discountCode);
  useEffect(() => {trackCommerceEvent('checkout_started', {value: total});}, []);
  if (!cart.length) return <Navigate to="/cart" replace/>;
  const patchAddress = (key: keyof CheckoutPayload['shippingAddress'], value: string) => setPayload((current) => ({...current, shippingAddress: {...current.shippingAddress, [key]: value}, customer: {...current.customer, ...(key === 'fullName' ? {name: value} : key === 'email' ? {email: value} : key === 'phone' ? {phone: value} : {})}}));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const address = payload.shippingAddress;
    if (!address.fullName.trim() || !address.phone.trim() || !address.address1.trim() || !address.district.trim() || !address.city.trim()) {setError('Vui lòng điền họ tên, số điện thoại và địa chỉ giao hàng.'); return;}
    setBusy(true);
    try {
      const order = createOrder(payload);
      if (!order) throw new Error('Không thể tạo đơn hàng.');
      trackCommerceEvent('checkout_completed', {orderId: order.id, value: order.total});
      if (order.paymentMethod === 'online') {
        const result = await startPayment(order);
        if (result.status === 'redirect' && result.checkoutUrl) {window.location.assign(result.checkoutUrl); return;}
      }
      navigate(`/order-confirmation/${order.id}`, {replace: true});
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tạo đơn hàng.');
    } finally {setBusy(false);}
  };

  const itemCount = lines.reduce((sum, item) => sum + item.line.quantity, 0);

  return <div className="tf4912-checkout-page">
    <header className="tf4912-checkout-header">
      <LuxuryCheckoutLogo/>
      <nav aria-label="Tiến trình thanh toán"><span className="is-active"><i>1</i>Thông tin</span><b/><span><i>2</i>Xác nhận</span></nav>
      <Link to="/cart" className="tf4912-checkout-cart-link"><ShoppingBag/><span>{itemCount}</span></Link>
    </header>

    <button type="button" className="tf4912-mobile-summary-toggle" onClick={() => setSummaryOpen((value) => !value)} aria-expanded={summaryOpen}>
      <span><ShoppingBag/>Tóm tắt đơn hàng</span><b>{money(total)}</b><ChevronDown className={summaryOpen ? 'is-open' : ''}/>
    </button>

    <form className="tf4912-checkout-layout" onSubmit={submit}>
      <main className="tf4912-checkout-main">
        <Link className="tf4912-back-link" to="/cart"><ArrowLeft/>Quay lại giỏ hàng</Link>

        <CheckoutSection number="01" title="Thông tin liên hệ" description="Dùng để xác nhận và cập nhật trạng thái đơn hàng.">
          <div className="tf4912-fields">
            <label className="is-full"><span>Họ và tên</span><input autoComplete="name" value={payload.shippingAddress.fullName} onChange={(event) => patchAddress('fullName', event.target.value)} placeholder="Nguyễn Văn A"/></label>
            <label><span>Email <em>Không bắt buộc</em></span><input type="email" autoComplete="email" value={payload.shippingAddress.email} onChange={(event) => patchAddress('email', event.target.value)} placeholder="email@example.com"/></label>
            <label><span>Số điện thoại</span><input autoComplete="tel" value={payload.shippingAddress.phone} onChange={(event) => patchAddress('phone', event.target.value)} placeholder="0900 000 000"/></label>
          </div>
        </CheckoutSection>

        <CheckoutSection number="02" title="Địa chỉ giao hàng" description="Nhập đầy đủ để hạn chế chậm trễ trong quá trình giao.">
          <div className="tf4912-fields">
            <label className="is-full"><span>Địa chỉ</span><input autoComplete="street-address" value={payload.shippingAddress.address1} onChange={(event) => patchAddress('address1', event.target.value)} placeholder="Số nhà, tên đường"/></label>
            <label className="is-full"><span>Căn hộ, tòa nhà <em>Không bắt buộc</em></span><input value={payload.shippingAddress.address2} onChange={(event) => patchAddress('address2', event.target.value)} placeholder="Tầng, căn hộ, hướng dẫn thêm"/></label>
            <label><span>Phường/Xã</span><input value={payload.shippingAddress.ward} onChange={(event) => patchAddress('ward', event.target.value)} placeholder="Phường/Xã"/></label>
            <label><span>Quận/Huyện</span><input value={payload.shippingAddress.district} onChange={(event) => patchAddress('district', event.target.value)} placeholder="Quận/Huyện"/></label>
            <label><span>Tỉnh/Thành phố</span><input value={payload.shippingAddress.city} onChange={(event) => patchAddress('city', event.target.value)} placeholder="Tỉnh/Thành phố"/></label>
            <label><span>Mã bưu chính <em>Không bắt buộc</em></span><input value={payload.shippingAddress.postalCode} onChange={(event) => patchAddress('postalCode', event.target.value)} placeholder="700000"/></label>
          </div>
          <div className="tf4912-delivery-method"><i><Truck/></i><span><b>Giao hàng tiêu chuẩn có bảo hiểm</b><small>Dự kiến 1–4 ngày làm việc</small></span><strong>{shippingAfterDiscount ? money(shippingAfterDiscount) : 'Miễn phí'}</strong></div>
        </CheckoutSection>

        <CheckoutSection number="03" title="Thanh toán" description="Chọn phương thức phù hợp. Không có khoản phí ẩn.">
          <div className="tf4912-payment-options">
            {integration.payment.cod && <label className={payload.paymentMethod === 'cod' ? 'is-active' : ''}><input type="radio" checked={payload.paymentMethod === 'cod'} onChange={() => setPayload({...payload, paymentMethod: 'cod'})}/><i><Truck/></i><span><b>Thanh toán khi nhận hàng</b><small>Xác nhận đơn trước khi giao.</small></span><Check/></label>}
            {integration.payment.bankTransfer && <label className={payload.paymentMethod === 'bank_transfer' ? 'is-active' : ''}><input type="radio" checked={payload.paymentMethod === 'bank_transfer'} onChange={() => setPayload({...payload, paymentMethod: 'bank_transfer'})}/><i><CreditCard/></i><span><b>Chuyển khoản ngân hàng</b><small>Thông tin chuyển khoản hiển thị sau khi đặt đơn.</small></span><Check/></label>}
            {integration.payment.online && <label className={payload.paymentMethod === 'online' ? 'is-active' : ''}><input type="radio" checked={payload.paymentMethod === 'online'} onChange={() => setPayload({...payload, paymentMethod: 'online'})}/><i><LockKeyhole/></i><span><b>Thanh toán online</b><small>Chuyển sang cổng thanh toán bảo mật sau khi tạo đơn.</small></span><Check/></label>}
          </div>
          <label className="tf4912-order-note"><span>Ghi chú đơn hàng</span><textarea value={payload.note} onChange={(event) => setPayload({...payload, note: event.target.value})} placeholder="Thời gian liên hệ, lời nhắn quà tặng..."/></label>
        </CheckoutSection>

        {error && <div className="tf4912-checkout-error">{error}</div>}
        <Button className="tf4912-mobile-place-order" size="lg" full disabled={busy}>{busy ? 'Đang tạo đơn hàng...' : `Đặt hàng · ${money(total)}`}</Button>
        <p className="tf4912-legal">Khi đặt hàng, thông tin giao hàng được xác nhận và chính sách mua hàng của TimeForge được chấp thuận.</p>
      </main>

      <aside className={`tf4912-checkout-aside ${summaryOpen ? 'is-open' : ''}`}>
        <section className="tf4912-checkout-summary">
          <header><div><h2>Tóm tắt đơn hàng</h2><p>Kiểm tra sản phẩm trước khi hoàn tất.</p></div><span>{itemCount} sản phẩm</span></header>
          <div className="tf4912-checkout-products">
            {lines.map(({line, product, variant, unitPrice}, index) => <motion.article key={`${product.id}-${line.variantId}`} initial={{opacity: 0, y: 8}} animate={{opacity: 1, y: 0}} transition={{duration: .22, delay: index * .025}}>
              <Link to={`/products/${product.handle}`} className="tf4912-checkout-product-image"><CommerceProductImageV32 product={product} alt={product.title} size={260} priority={index < 3}/><span>{line.quantity}</span></Link>
              <div><small>{product.vendor || 'TIMEFORGE'}</small><Link to={`/products/${product.handle}`}>{product.title}</Link>{variant?.title && variant.title !== 'Default Title' && <em>{variant.title}</em>}</div>
              <strong>{money(unitPrice * line.quantity)}</strong>
            </motion.article>)}
          </div>
          <div className="tf4912-summary-coupon"><label htmlFor="checkout-discount-code">Mã giảm giá</label><div><input id="checkout-discount-code" value={payload.discountCode} onChange={(event) => setPayload({...payload, discountCode: event.target.value.toUpperCase()})} placeholder="Nhập mã ưu đãi"/><Button type="button" variant="secondary" onClick={() => setPayload({...payload, discountCode: payload.discountCode.trim()})}>Áp dụng</Button></div></div>
          {payload.discountCode && <p className={discount?.valid ? 'tf4912-message is-success' : 'tf4912-message is-error'}>{discount?.message || 'Mã không hợp lệ.'}</p>}
          <SummaryRows subtotal={subtotal} shipping={shippingAfterDiscount} discount={discount} total={total}/>
          <Button className="tf4912-place-order" size="lg" full disabled={busy}>{busy ? 'Đang tạo đơn hàng...' : `Đặt hàng · ${money(total)}`}</Button>
          <div className="tf4912-checkout-trust"><span><i><LockKeyhole/></i><b>Kết nối bảo mật</b><small>Dữ liệu được mã hóa</small></span><span><i><ShieldCheck/></i><b>Thông tin minh bạch</b><small>Không có phí ẩn</small></span><span><i><PackageCheck/></i><b>Đóng gói an toàn</b><small>Bảo hiểm vận chuyển</small></span></div>
        </section>
      </aside>
    </form>
  </div>;
}

export function OrderConfirmationV11() {
  const {id = ''} = useParams();
  const {orders} = useCommerce();
  const order = orders.find((item) => item.id === id);
  if (!order) return <Navigate to="/" replace/>;
  return <div className="s11-confirmation"><header><LuxuryCheckoutLogo/></header><main><motion.div className="s11-confirmation-mark" initial={{scale: .7, opacity: 0}} animate={{scale: 1, opacity: 1}}><CheckCircle2/></motion.div><small>ORDER CONFIRMED</small><h1>Đơn hàng đã được ghi nhận.</h1><p>TimeForge sẽ liên hệ để xác nhận trước khi xử lý và giao hàng.</p><div className="s11-confirmation-number"><span>Mã đơn hàng</span><b>{order.number}</b></div><section><div><h2>Thông tin giao hàng</h2><p><b>{order.customerName}</b><br/>{order.customerPhone}<br/>{order.shippingAddress.address1}{order.shippingAddress.address2 ? `, ${order.shippingAddress.address2}` : ''}<br/>{order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.city}</p></div><div><h2>Thanh toán</h2><p>{order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : order.paymentMethod === 'online' ? 'Thanh toán online' : 'Chuyển khoản ngân hàng'}<br/><b>{money(order.total)}</b></p>{order.paymentMethod === 'bank_transfer' && <div className="s11-bank-note"><Sparkles/><span>Thông tin chuyển khoản sẽ được gửi khi đơn hàng được xác nhận.</span></div>}</div></section><div className="s11-confirmation-products">{order.lines.map((line) => <article key={line.id}><SmartImage src={line.image} alt={line.title} width={110} height={110}/><div><b>{line.title}</b><small>{line.variantTitle} · Số lượng {line.quantity}</small></div><strong>{money(line.lineTotal)}</strong></article>)}</div><div className="s11-confirmation-actions"><Link to="/collections">Tiếp tục mua sắm</Link><Link className="primary" to="/pages/contact">Liên hệ TimeForge</Link></div></main></div>;
}
