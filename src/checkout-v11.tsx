import {ArrowLeft, ArrowRight, Banknote, Check, CheckCircle2, ChevronDown, Copy, CreditCard, Gift, Heart, Landmark, LockKeyhole, Minus, PackageCheck, Plus, QrCode, ShieldCheck, ShoppingBag, Sparkles, Trash2, Truck, X} from 'lucide-react';
import {useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode} from 'react';
import {Link, Navigate, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {useCartActions, useCartState, useCommerce} from './context';
import {optimizedImage, productImage, SmartImage} from './image-utils';
import {bankTransferDiscount,loadIntegrationSettings,preferredBankAccount,readIntegrationSettings} from './integrations';
import {startPayment} from './payment-adapter';
import type {CheckoutPayload, Order, Product} from './types';
import {money} from './utils';
import {trackCommerceEvent} from './commerce-events';
import {toast} from 'sonner';
import {ThemeSectionV27, isSharedThemeSectionV27} from './theme-section-v27';
import {StorefrontButton as Button} from './storefront-ui-v575';
import {sectionLabels} from './theme';
import {resolveStoreLogo,resolveStoreName} from './store-profile';
import {useWishlist} from './wishlist';
import './v4912-commerce.css';
import './v4915-commerce-fixes.css';
import './v4920-commerce-mobile.css';
import './v4925-commerce.css';
import './v4927-commerce.css';
import './v502-commerce-polish.css';
import './v503-commerce-polish.css';
import './v504-commerce.css';
import './v509-commerce-final.css';
import './v515-order-payment.css';
import './v521-ui-polish.css';
import './v562-cart-performance.css';
import './v573-commerce-polish.css';
import './v575-commerce-polish.css';
import './v576-commerce-polish.css';

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

function useSummary(discountCode = '', paymentMethod: CheckoutPayload['paymentMethod'] = 'cod', integration = readIntegrationSettings()) {
  const {products, evaluateDiscount} = useCommerce();
  const cart = useCartState();
  return useMemo(() => {
    const lines = cart.map((line) => {
      const product = products.find((item) => item.id === line.productId);
      if (!product) return null;
      const variant = product.variants.find((item) => item.id === line.variantId) || product.variants[0];
      const unitPrice = variant?.price || product.price;
      return {line, product, variant, unitPrice, total: unitPrice * line.quantity};
    }).filter(Boolean) as Array<{line: (typeof cart)[number]; product: (typeof products)[number]; variant: (typeof products)[number]['variants'][number] | undefined; unitPrice: number; total: number}>;
    const subtotal = lines.reduce((sum, item) => sum + item.total, 0);
    const threshold = Math.max(0, integration.shipping.freeShippingThreshold || 1000000);
    const shipping = subtotal >= threshold ? 0 : 50000;
    const discount = discountCode ? evaluateDiscount(discountCode, subtotal, shipping) : null;
    const shippingAfterDiscount = Math.max(0, shipping - (discount?.shippingDiscount || 0));
    const paymentDiscount = paymentMethod === 'bank_transfer' ? bankTransferDiscount(integration, subtotal) : {amount: 0, label: ''};
    return {lines, subtotal, shipping, shippingAfterDiscount, discount, paymentDiscount, total: subtotal - (discount?.amount || 0) - paymentDiscount.amount + shippingAfterDiscount};
  }, [cart, products, discountCode, evaluateDiscount, paymentMethod, integration]);
}

function LuxuryCheckoutLogo() {
  const {storeProfile} = useCommerce();
  const storeName=resolveStoreName(storeProfile.storeName);
  return <Link className="tf4912-checkout-logo" to="/"><SmartImage src={resolveStoreLogo(storeProfile.logoImage)} alt={storeName} width={180} height={54} priority /></Link>;
}

function SummaryRows({subtotal, shipping, discount, paymentDiscount, total}: {subtotal: number; shipping: number; discount: ReturnType<typeof useSummary>['discount']; paymentDiscount?: ReturnType<typeof useSummary>['paymentDiscount']; total: number}) {
  return <dl className="tf4927-summary-totals">
    <div><dt>Tạm tính</dt><dd>{money(subtotal)}</dd></div>
    {discount?.valid && <div className="is-discount"><dt>Giảm giá <span>{discount.discount?.code}</span></dt><dd>–{money(discount.amount)}</dd></div>}
    {!!paymentDiscount?.amount && <div className="is-discount"><dt>{paymentDiscount.label || 'Ưu đãi chuyển khoản'}</dt><dd>–{money(paymentDiscount.amount)}</dd></div>}
    <div><dt>Vận chuyển</dt><dd>{shipping <= 0 ? 'Miễn phí' : money(shipping)}</dd></div>
    <div className="is-total"><dt>Tổng cộng <small>VND</small></dt><dd>{money(total)}</dd></div>
  </dl>;
}

function PaymentBenefitsV4927() {
  return <section className="tf4927-payment-benefits" aria-label="Phương thức và bảo mật thanh toán">
    <article><i><Banknote/></i><span><small>COD</small><b>Thanh toán khi nhận</b></span></article>
    <article><i><QrCode/></i><span><small>PAYOS</small><b>Quét QR ngân hàng</b></span></article>
    <article><i><ShieldCheck/></i><span><small>SECURE</small><b>Xác minh an toàn</b></span></article>
  </section>;
}

function PurchaseConfidenceV575({surface}: {surface: 'cart'|'checkout'}) {
  const [open, setOpen] = useState(false);
  const detailsId = `tf575-purchase-details-${surface}`;
  return <section className={`tf575-purchase-confidence is-${surface}`} aria-label="Quyền lợi mua hàng">
    <div className="tf575-purchase-pills">
      <span><ShieldCheck/>Chính hãng</span>
      <span><PackageCheck/>Đóng gói bảo hiểm</span>
      <span><Truck/>Giao hàng 1–4 ngày</span>
    </div>
    <button type="button" className="tf575-purchase-toggle" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen((value) => !value)}>
      <span><b>Quyền lợi khi mua tại TimeForge</b><small>{open ? 'Thu gọn thông tin' : 'Xem bảo hành, giao hàng và hỗ trợ sau mua'}</small></span>
      <ChevronDown className={open ? 'is-open' : ''}/>
    </button>
    {open && <div id={detailsId} className="tf575-purchase-details">
      <article><ShieldCheck/><span><b>Bảo hành rõ ràng</b><small>Áp dụng 2 năm tại Việt Nam hoặc theo bảo hành quốc tế đi kèm sản phẩm.</small></span></article>
      <article><PackageCheck/><span><b>Giao nhận được bảo vệ</b><small>Sản phẩm được đóng gói an toàn và hỗ trợ theo dõi trong quá trình vận chuyển.</small></span></article>
      <article><LockKeyhole/><span><b>Hỗ trợ sau mua</b><small>TimeForge tiếp nhận yêu cầu bảo hành, đổi trả theo điều kiện của từng sản phẩm.</small></span></article>
    </div>}
  </section>;
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
  const {theme} = useCommerce();
  const {updateCart, clearCart} = useCartActions();
  const {addMany: addToWishlist} = useWishlist();
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
  const saveForLater = (productId: string, variantId: string, title: string) => {
    addToWishlist([productId]);
    updateCart(productId, variantId, 0);
    toast.success('Đã lưu để mua sau', {description: title});
  };

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

      <nav className="tf576-cart-steps" aria-label="Tiến trình mua hàng">
        <span className="is-active"><i>01</i><b>Giỏ hàng</b></span>
        <span><i>02</i><b>Thanh toán</b></span>
        <span><i>03</i><b>Xác nhận</b></span>
      </nav>

      {showShippingEstimate && <ShippingProgress subtotal={subtotal}/>} 
      <PurchaseConfidenceV575 surface="cart"/>

      <div className="tf4912-cart-layout">
        <main className="tf4912-cart-main">
          <section className="tf4912-cart-lines" aria-label="Sản phẩm trong giỏ hàng">
            {lines.map(({line, product, variant, unitPrice}, index) => <article key={`${product.id}-${line.variantId}`} className="tf4912-cart-line">
              <Link to={`/products/${product.handle}`} className="tf4912-cart-line-image"><CommerceProductImageV32 product={product} alt={product.title} size={360} priority={index < 2}/></Link>
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
                  <button type="button" className="tf573-save-later" onClick={() => saveForLater(line.productId, line.variantId, product.title)} aria-label={`Lưu ${product.title} để mua sau`}><Heart/><span>Lưu mua sau</span></button>
                  <button type="button" className="tf4912-remove-line" onClick={() => updateCart(line.productId, line.variantId, 0)} aria-label="Xóa sản phẩm"><Trash2/><span>Xóa</span></button>
                </div>
              </div>
              <div className="tf4912-cart-line-price"><b>{money(unitPrice * line.quantity)}</b>{line.quantity > 1 && <small>{money(unitPrice)} / sản phẩm</small>}</div>
            </article>)}
          </section>

          <label className="tf4912-gift-option"><input type="checkbox" checked={gift} onChange={(event) => setGift(event.target.checked)}/><i><Gift/></i><span><b>Đây là một món quà</b><small>{gift ? 'TimeForge sẽ đóng gói tối giản và không đặt giá trong hộp.' : 'Thêm ghi chú quà tặng ở bước thanh toán.'}</small></span></label>

          {showTrust && <section data-theme-section-id={trustSection?.id} data-theme-section-label={trustSection ? sectionLabels[trustSection.type] : 'Cam kết cửa hàng'} className="tf4912-cart-assurance">
            <article><i><ShieldCheck/></i><span><b>Cam kết chính hãng</b><small>Nguồn hàng minh bạch</small></span></article>
            <article><i><PackageCheck/></i><span><b>Đóng gói bảo hiểm</b><small>Bảo vệ khi vận chuyển</small></span></article>
            <article><i><LockKeyhole/></i><span><b>Thanh toán bảo mật</b><small>Dữ liệu được mã hóa</small></span></article>
          </section>}
        </main>

        <aside className="tf4927-order-summary">
          <header className="tf4927-order-summary__header"><small>ĐƠN HÀNG CỦA BẠN</small><h2>Tóm tắt đơn hàng</h2><p>Kiểm tra ưu đãi và tổng tiền trước khi thanh toán.</p></header>
          {showCoupon && <div className="tf4927-coupon"><label htmlFor="cart-discount-code">Mã ưu đãi</label><div><input id="cart-discount-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Nhập mã giảm giá"/><Button type="button" variant="secondary" className="tf4927-coupon-apply" onClick={() => setApplied(code.trim())}>Áp dụng</Button></div>{applied && <p className={discount?.valid ? 'is-success' : 'is-error'}>{discount?.message || 'Mã giảm giá không hợp lệ.'}</p>}</div>}
          <SummaryRows subtotal={subtotal} shipping={shippingAfterDiscount} discount={discount} total={total}/>
          <Link className="tf4927-checkout-cta" to={`/checkout${applied ? `?discount=${encodeURIComponent(applied)}` : ''}`}><span>Tiếp tục thanh toán<small>COD, chuyển khoản hoặc PayOS</small></span><ArrowRight/></Link>
          <div className="tf4927-safe-label"><LockKeyhole/><span>Thanh toán an toàn</span></div>
          <PaymentBenefitsV4927/>
        </aside>
      </div>
    </section>
    {supplement}
  </div>;
}

const initialPayload: CheckoutPayload = {customer: {name: '', email: '', phone: ''}, shippingAddress: {fullName: '', phone: '', email: '', address1: '', address2: '', ward: '', district: '', city: 'TP. Hồ Chí Minh', country: 'Việt Nam', postalCode: ''}, paymentMethod: 'cod', note: '', discountCode: ''};

const vietnamDateStamp = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Ho_Chi_Minh', year: '2-digit', month: '2-digit', day: '2-digit'}).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year || ''}${value.month || ''}${value.day || ''}`;
};
const compactTransferSku = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'ORDER';


function CheckoutSection({number, title, description, children}: {number: string; title: string; description: string; children: ReactNode}) {
  return <section className="tf4912-checkout-section"><header><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div></header>{children}</section>;
}

export function CheckoutPageV11() {
  const {submitStorefrontOrder} = useCommerce();
  const cart = useCartState();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState<CheckoutPayload>({...initialPayload, discountCode: params.get('discount') || ''});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [integration,setIntegration] = useState(readIntegrationSettings);
  useEffect(()=>{let active=true;void loadIntegrationSettings().then(value=>{
    if(!active)return;
    setIntegration(value);
    setPayload(current=>{
      const enabled=current.paymentMethod==='cod'?value.payment.cod:current.paymentMethod==='bank_transfer'?value.payment.bankTransfer:['payos','online'].includes(current.paymentMethod)?value.payment.online:false;
      if(enabled)return current;
      const paymentMethod:CheckoutPayload['paymentMethod']=value.payment.cod?'cod':value.payment.bankTransfer?'bank_transfer':value.payment.online?'payos':'cod';
      return{...current,paymentMethod};
    });
  });return()=>{active=false}},[]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  useEffect(() => {
    if (!summaryOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event: KeyboardEvent) => {if (event.key === 'Escape') setSummaryOpen(false);};
    window.addEventListener('keydown', close);
    return () => {document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', close);};
  }, [summaryOpen]);
  const {lines, subtotal, shippingAfterDiscount, discount, paymentDiscount, total} = useSummary(payload.discountCode,payload.paymentMethod,integration);
  const transferReferencePreview = useMemo(() => {
    const firstSku = lines[0]?.variant?.sku || lines[0]?.product?.sku || 'ORDER';
    return `TF${vietnamDateStamp()}-${compactTransferSku(firstSku)}`;
  }, [lines]);
  const submitLabel = payload.paymentMethod === 'cod'
    ? `Đặt hàng · ${money(total)}`
    : payload.paymentMethod === 'payos'
      ? `Thanh toán qua PayOS · ${money(total)}`
      : `Gửi yêu cầu thanh toán · ${money(total)}`;
  const noPaymentMethod=!integration.payment.cod&&!integration.payment.bankTransfer&&!integration.payment.online;
  const checkoutTracked=useRef(false);
  useEffect(() => {
    if(checkoutTracked.current||!cart.length||total<=0)return;
    checkoutTracked.current=true;
    trackCommerceEvent('checkout_started',{value:total,metadata:{items:cart.reduce((sum,line)=>sum+line.quantity,0)}});
  },[cart,total]);
  if (!cart.length) return <Navigate to="/cart" replace/>;
  const patchAddress = (key: keyof CheckoutPayload['shippingAddress'], value: string) => setPayload((current) => ({...current, shippingAddress: {...current.shippingAddress, [key]: value}, customer: {...current.customer, ...(key === 'fullName' ? {name: value} : key === 'email' ? {email: value} : key === 'phone' ? {phone: value} : {})}}));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const address = payload.shippingAddress;
    if (!address.fullName.trim() || !address.phone.trim() || !address.address1.trim() || !address.district.trim() || !address.city.trim()) {setError('Vui lòng điền họ tên, số điện thoại và địa chỉ giao hàng.'); return;}
    if(noPaymentMethod){setError('Cửa hàng chưa bật phương thức thanh toán. Vui lòng liên hệ TimeForge.');return;}
    setBusy(true);
    let createdOrder:Order|null=null;
    try {
      createdOrder = await submitStorefrontOrder(payload);
      if (['payos','online'].includes(createdOrder.paymentMethod)) {
        const result = await startPayment(createdOrder);
        if (result.status === 'redirect' && result.checkoutUrl) {window.location.assign(result.checkoutUrl); return;}
      }
      trackCommerceEvent('checkout_completed', {orderId: createdOrder.id, value: createdOrder.total,metadata:{contentIds:createdOrder.lines.map(line=>line.productId).filter(Boolean).join(','),items:createdOrder.lines.reduce((sum,line)=>sum+line.quantity,0)}});
      if (createdOrder.paymentMethod === 'bank_transfer') {
        const transferContent = createdOrder.bankTransferContent || createdOrder.number;
        toast.success('Yêu cầu thanh toán đã được gửi', {
          description: `Vui lòng chuyển khoản đúng nội dung “${transferContent}” và chờ nhân viên xác nhận đã nhận tiền.`,
          duration: 6500,
        });
      }
      navigate(`/order-confirmation/${createdOrder.id}`, {replace: true});
    } catch (reason) {
      const message=reason instanceof Error ? reason.message : 'Không thể tạo đơn hàng.';
      if(createdOrder){
        sessionStorage.setItem(`tf.order.notice.${createdOrder.id}`,`Đơn hàng đã được lưu nhưng chưa mở được PayOS: ${message}`);
        navigate(`/order-confirmation/${createdOrder.id}`,{replace:true});
        return;
      }
      setError(message);
    } finally {setBusy(false);}
  };

  const itemCount = lines.reduce((sum, item) => sum + item.line.quantity, 0);

  return <div className="tf4912-checkout-page">
    <button type="button" className="tf4912-mobile-summary-toggle" onClick={() => setSummaryOpen((value) => !value)} aria-expanded={summaryOpen}>
      <span><ShoppingBag/>Tóm tắt đơn hàng</span><b>{money(total)}</b><ChevronDown className={summaryOpen ? 'is-open' : ''}/>
    </button>
    {summaryOpen && <button type="button" className="tf4920-summary-backdrop" aria-label="Đóng tóm tắt đơn hàng" onClick={() => setSummaryOpen(false)}/>} 

    <div className="tf575-checkout-confidence-wrap"><PurchaseConfidenceV575 surface="checkout"/></div>

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
            {integration.payment.online && <label className={payload.paymentMethod === 'payos' ? 'is-active' : ''}><input type="radio" checked={payload.paymentMethod === 'payos'} onChange={() => setPayload({...payload, paymentMethod: 'payos'})}/><i><QrCode/></i><span><b>Quét QR ngân hàng qua PayOS</b><small>Mở cổng PayOS bảo mật và xác nhận tự động sau thanh toán.</small></span><Check/></label>}
          </div>
          {payload.paymentMethod === 'bank_transfer' && (() => {
            const bank = preferredBankAccount(integration);
            if (!bank) return <div className="tf515-checkout-bank is-warning"><Landmark/><div><b>Chưa có tài khoản nhận tiền</b><span>Vui lòng chọn phương thức khác hoặc liên hệ cửa hàng.</span></div></div>;
            const copyText = async (value: string, label: string) => {
              await navigator.clipboard?.writeText(value);
              toast.success(`Đã sao chép ${label}`);
            };
            return <div className="tf515-checkout-bank tf521-checkout-bank-card">
              <div className="tf521-bank-card-icon"><Landmark/></div>
              <div className="tf521-bank-card-body">
                <header><div><small>NGÂN HÀNG NHẬN TIỀN</small><b>{bank.bankName}</b></div>{paymentDiscount.amount > 0 && <em>{paymentDiscount.label}<strong>Giảm {money(paymentDiscount.amount)}</strong></em>}</header>
                <div className="tf521-bank-details">
                  <div><span>Chủ tài khoản</span><strong>{bank.accountName || '—'}</strong></div>
                  <div><span>Số tài khoản</span><strong>{bank.accountNumber || '—'}</strong><button type="button" onClick={() => void copyText(bank.accountNumber || '', 'số tài khoản')} aria-label="Sao chép số tài khoản"><Copy/></button></div>
                </div>
                <div className="tf521-transfer-reference">
                  <div><span>Nội dung chuyển khoản dự kiến</span><strong>{transferReferencePreview}</strong></div>
                  <button type="button" onClick={() => void copyText(transferReferencePreview, 'nội dung chuyển khoản')}><Copy/>Sao chép</button>
                  <p>Sau khi đặt đơn, hệ thống sẽ thêm mã xác nhận cuối để tránh trùng giao dịch. Khách cần nhập đúng nội dung hiển thị ở trang xác nhận đơn hàng.</p>
                </div>
              </div>
            </div>;
          })()}
          {payload.paymentMethod === 'payos' && <div className="tf515-payos-checkout-note"><QrCode/><div><b>Thanh toán QR qua PayOS</b><span>Đơn hàng được lưu trước, sau đó PayOS hiển thị mã QR và tự xác nhận khi giao dịch thành công.</span></div></div>}
          <label className="tf4912-order-note"><span>Ghi chú đơn hàng</span><textarea value={payload.note} onChange={(event) => setPayload({...payload, note: event.target.value})} placeholder="Thời gian liên hệ, lời nhắn quà tặng..."/></label>
        </CheckoutSection>

        {noPaymentMethod&&<div className="tf4912-checkout-error">Cửa hàng chưa bật phương thức thanh toán. Vui lòng liên hệ TimeForge.</div>}
        {error && <div className="tf4912-checkout-error">{error}</div>}
        <Button className="tf4912-mobile-place-order" size="lg" full disabled={busy||noPaymentMethod}>{busy ? 'Đang gửi yêu cầu...' : submitLabel}</Button>
        <p className="tf4912-legal">Khi đặt hàng, thông tin giao hàng được xác nhận và chính sách mua hàng của TimeForge được chấp thuận.</p>
      </main>

      <aside className={`tf4912-checkout-aside ${summaryOpen ? 'is-open' : ''}`} data-summary-open={summaryOpen ? 'true' : 'false'}>
        <section className="tf4912-checkout-summary">
          <header><div><h2>Tóm tắt đơn hàng</h2><p>Kiểm tra sản phẩm trước khi hoàn tất.</p></div><span>{itemCount} sản phẩm</span><button type="button" className="tf4920-summary-close" onClick={() => setSummaryOpen(false)} aria-label="Đóng tóm tắt đơn hàng"><X/></button></header>
          <div className="tf4912-checkout-products">
            {lines.map(({line, product, variant, unitPrice}, index) => <article className="tf573-checkout-product" key={`${product.id}-${line.variantId}`} style={{'--tf573-item-index': index} as React.CSSProperties}>
              <Link to={`/products/${product.handle}`} className="tf4912-checkout-product-image"><CommerceProductImageV32 product={product} alt={product.title} size={260} priority={index < 3}/><span>{line.quantity}</span></Link>
              <div><small>{product.vendor || 'TIMEFORGE'}</small><Link to={`/products/${product.handle}`}>{product.title}</Link>{variant?.title && variant.title !== 'Default Title' && <em>{variant.title}</em>}</div>
              <strong>{money(unitPrice * line.quantity)}</strong>
            </article>)}
          </div>
          <div className="tf4927-coupon"><label htmlFor="checkout-discount-code">Mã giảm giá</label><div><input id="checkout-discount-code" value={payload.discountCode} onChange={(event) => setPayload({...payload, discountCode: event.target.value.toUpperCase()})} placeholder="Nhập mã ưu đãi"/><Button type="button" variant="secondary" className="tf4927-coupon-apply" onClick={() => setPayload({...payload, discountCode: payload.discountCode.trim()})}>Áp dụng</Button></div></div>
          {payload.discountCode && <p className={discount?.valid ? 'tf4912-message is-success' : 'tf4912-message is-error'}>{discount?.message || 'Mã không hợp lệ.'}</p>}
          <SummaryRows subtotal={subtotal} shipping={shippingAfterDiscount} discount={discount} paymentDiscount={paymentDiscount} total={total}/>
          <Button className="tf4912-place-order" size="lg" full disabled={busy||noPaymentMethod}>{busy ? 'Đang gửi yêu cầu...' : submitLabel}</Button>
          <div className="tf4912-checkout-trust"><span><i><LockKeyhole/></i><b>Kết nối bảo mật</b><small>Dữ liệu được mã hóa</small></span><span><i><ShieldCheck/></i><b>Thông tin minh bạch</b><small>Không có phí ẩn</small></span><span><i><PackageCheck/></i><b>Đóng gói an toàn</b><small>Bảo hiểm vận chuyển</small></span></div>
        </section>
      </aside>
    </form>
    <footer className="tf573-checkout-footer"><span><LockKeyhole/>Thanh toán bảo mật · Thông tin được dùng để xử lý đơn hàng</span><nav><Link to="/pages/shipping">Giao hàng</Link><Link to="/pages/returns">Đổi trả</Link><Link to="/pages/privacy">Quyền riêng tư</Link></nav></footer>
  </div>;
}

export function OrderConfirmationV11() {
  const {id = ''} = useParams();
  const {orders} = useCommerce();
  const [notice] = useState(()=>sessionStorage.getItem(`tf.order.notice.${id}`)||'');
  useEffect(()=>{if(id)sessionStorage.removeItem(`tf.order.notice.${id}`)},[id]);
  const order = orders.find((item) => item.id === id);
  if (!order) return <Navigate to="/" replace/>;
  return <div className="s11-confirmation"><header><LuxuryCheckoutLogo/></header><main><div className="s11-confirmation-mark tf573-confirmation-mark"><CheckCircle2/></div><small>ORDER CONFIRMED</small><h1>Đơn hàng đã được ghi nhận.</h1><p>TimeForge sẽ liên hệ để xác nhận trước khi xử lý và giao hàng.</p>{notice&&<div className="tf520-order-notice"><QrCode/><span><b>Đơn hàng đã được lưu an toàn</b><small>{notice}</small></span></div>}<div className="s11-confirmation-number"><span>Mã đơn hàng</span><b>{order.number}</b></div><section><div><h2>Thông tin giao hàng</h2><p><b>{order.customerName}</b><br/>{order.customerPhone}<br/>{order.shippingAddress.address1}{order.shippingAddress.address2 ? `, ${order.shippingAddress.address2}` : ''}<br/>{order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.city}</p></div><div><h2>Thanh toán</h2><p>{order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : ['payos','online'].includes(order.paymentMethod) ? 'PayOS · QR ngân hàng' : 'Chuyển khoản ngân hàng'}<br/><b>{money(order.total)}</b></p>{order.paymentMethod === 'bank_transfer' && <div className="s11-bank-note tf515-bank-confirmation"><Sparkles/><span><b>{order.bankName || 'Ngân hàng chuyển khoản'}</b><br/>Chủ tài khoản: {order.bankAccountName || '—'}<br/>Số tài khoản: <strong>{order.bankAccountNumber || '—'}</strong><br/>Nội dung bắt buộc: <strong>{order.bankTransferContent || order.number}</strong></span></div>}</div></section><div className="s11-confirmation-products">{order.lines.map((line) => <article key={line.id}><SmartImage src={line.image} alt={line.title} width={110} height={110}/><div><b>{line.title}</b><small>{line.variantTitle} · Số lượng {line.quantity}</small></div><strong>{money(line.lineTotal)}</strong></article>)}</div><div className="s11-confirmation-actions"><Link to="/collections">Tiếp tục mua sắm</Link><Link className="primary" to="/pages/contact">Liên hệ TimeForge</Link></div></main></div>;
}
