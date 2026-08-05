import {AnimatePresence, motion} from 'framer-motion';
import {
  ArrowLeft, BadgeDollarSign, Box, Check, CheckCircle2, ChevronRight, CircleDollarSign, Download,
  Clock3, Copy, Filter, Mail, MoreHorizontal, PackageCheck, Plus, RefreshCcw, RotateCcw,
  ExternalLink, Landmark, QrCode, Search, Send, ShoppingBag, Tag, Truck, Undo2, UserRoundSearch, Users, X,
} from 'lucide-react';
import {useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {Link, Navigate, useParams, useSearchParams} from 'react-router-dom';
import {useCommerce} from './context';
import {SmartImage} from './image-utils';
import {firebaseClient} from './firebase';
import {ResourcePicker} from './resource-picker';
import {OnlineStore} from './admin';
import {createSection} from './theme';
import type {Customer, Order, OrderLine, PaymentStatus, Product, Section} from './types';
import {money, uid} from './utils';
import {AdminResourceFrame,AdminResourceIntro,AdminResourceSurface} from './admin-ui-v25';
import {buildTrackingUrl,readIntegrationSettings} from './integrations';
import {asList, asStringList} from './data-normalize';
import {emptyWorkflow, normalizeWorkflowStore, type FulfillmentRecord, type RefundRecord, type ReturnRecord, type WorkflowEvent, type WorkflowStore} from './workflow-normalize';
import {download} from './csv';
import './v515-order-payment.css';
import './v521-ui-polish.css';
import './v525-admin-orders.css';

const fmt = (value: string) => new Date(value).toLocaleString('vi-VN', {dateStyle: 'medium', timeStyle: 'short'});
const orderStatus: Record<Order['status'], string> = {open: 'Đang mở', confirmed: 'Đã xác nhận', completed: 'Hoàn tất', cancelled: 'Đã hủy'};
const paymentStatus: Record<Order['paymentStatus'], string> = {pending: 'Chờ thanh toán', paid: 'Đã thanh toán', refunded: 'Đã hoàn tiền', failed: 'Thất bại'};
const fulfillmentStatus: Record<Order['fulfillmentStatus'], string> = {unfulfilled: 'Chưa xử lý', processing: 'Đang chuẩn bị', fulfilled: 'Đã giao', returned: 'Đã hoàn trả'};
const paymentMethodLabel: Record<string,string>={cod:'COD',bank_transfer:'Chuyển khoản',payos:'PayOS',online:'PayOS'};

function Badge({tone = 'neutral', children}: {tone?: 'success' | 'warning' | 'critical' | 'info' | 'neutral'; children: ReactNode}) {
  return <span className={`s11-badge ${tone}`}>{children}</span>;
}
function Modal({title, eyebrow, close, children, footer, wide = false}: {title: string; eyebrow: string; close: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean}) {
  return <motion.div className="s11-modal-shell" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} onMouseDown={close}><motion.section className={`s11-modal ${wide ? 'wide' : ''}`} initial={{y: 18, scale: .985}} animate={{y: 0, scale: 1}} onMouseDown={(event) => event.stopPropagation()}><header><div><small>{eyebrow}</small><h2>{title}</h2></div><button onClick={close}><X /></button></header><div className="s11-modal-body">{children}</div>{footer && <footer>{footer}</footer>}</motion.section></motion.div>;
}

interface RefundLine {lineId: string; quantity: number; amount: number}
const workflowKey = 'tf.s11.order-workflows';
const loadWorkflow = (): WorkflowStore => {try {const raw = localStorage.getItem(workflowKey); return normalizeWorkflowStore(raw ? JSON.parse(raw) : null);} catch {return emptyWorkflow();}};
function useWorkflowStore() {
  const [store, setStore] = useState<WorkflowStore>(loadWorkflow);
  useEffect(() => {if (!firebaseClient.enabled) return; void firebaseClient.read<Partial<WorkflowStore>>('timeforge/orderWorkflows').then((remote) => {if (remote) {const normalized=normalizeWorkflowStore(remote);setStore(normalized);localStorage.setItem(workflowKey, JSON.stringify(normalized));}});}, []);
  const commit = (next: WorkflowStore) => {const normalized=normalizeWorkflowStore(next);setStore(normalized); localStorage.setItem(workflowKey, JSON.stringify(normalized)); if (firebaseClient.enabled) void firebaseClient.write('timeforge/orderWorkflows', normalized);};
  const addEvent = (event: Omit<WorkflowEvent, 'id' | 'createdAt' | 'actor'>) => commit({...store, events: [{...event, id: uid('evt'), createdAt: new Date().toISOString(), actor: 'Admin'}, ...store.events]});
  return {store, commit, addEvent};
}

export function OrdersV11() {
  const {orders, updateOrder, cancelOrder} = useCommerce();
  const [params, setParams] = useSearchParams();
  const urlQuery = params.get('q') || '';
  const [query, setQuery] = useState(urlQuery);
  const deferredQuery = useDeferredValue(query);
  const searchRef = useRef<HTMLInputElement>(null);
  const requestedStatus = params.get('status');
  const requestedPayment = params.get('payment');
  const requestedRange = params.get('range');
  const view: 'all' | Order['status'] = ['open','confirmed','completed','cancelled'].includes(requestedStatus || '') ? requestedStatus as Order['status'] : 'all';
  const payment: 'all' | PaymentStatus = ['pending','paid','refunded','failed'].includes(requestedPayment || '') ? requestedPayment as PaymentStatus : 'all';
  const range: 'all' | 'today' | '7d' | '30d' = ['today','7d','30d'].includes(requestedRange || '') ? requestedRange as 'today' | '7d' | '30d' : 'all';
  const [selected, setSelected] = useState<string[]>([]);
  const setFilter = (key: 'q' | 'status' | 'payment' | 'range', value: string) => setParams((current) => {
    const next = new URLSearchParams(current);
    if (!value || value === 'all') next.delete(key); else next.set(key, value);
    return next;
  }, {replace: true});
  useEffect(() => {setQuery(urlQuery);}, [urlQuery]);
  useEffect(() => {
    if (query === urlQuery) return;
    const timer = window.setTimeout(() => setParams((current) => {
      const next = new URLSearchParams(current);
      if (query.trim()) next.set('q', query.trim()); else next.delete('q');
      return next;
    }, {replace: true}), 180);
    return () => window.clearTimeout(timer);
  }, [query, setParams, urlQuery]);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing = target?.matches('input, textarea, select, [contenteditable="true"]');
      if (event.key === '/' && !isEditing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === 'Escape' && document.activeElement === searchRef.current && query) setQuery('');
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, [query]);
  const filtered = useMemo(() => {
    const now = new Date();
    let cutoff = Number.NEGATIVE_INFINITY;
    if (range === 'today') {
      now.setHours(0, 0, 0, 0);
      cutoff = now.getTime();
    } else if (range === '7d') cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    else if (range === '30d') cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (view !== 'all' && order.status !== view) return false;
      if (payment !== 'all' && order.paymentStatus !== payment) return false;
      if (range !== 'all') {
        const createdAt = new Date(order.createdAt).getTime();
        if (!Number.isFinite(createdAt) || createdAt < cutoff) return false;
      }
      return `${order.number} ${order.customerName} ${order.customerEmail} ${order.customerPhone}`.toLowerCase().includes(normalizedQuery);
    });
  }, [orders, deferredQuery, view, payment, range]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allVisibleSelected = filtered.length > 0 && filtered.every((item) => selectedSet.has(item.id));
  const toggleAll = () => setSelected((current) => {
    const visibleIds = new Set(filtered.map((item) => item.id));
    if (allVisibleSelected) return current.filter((id) => !visibleIds.has(id));
    return [...new Set([...current, ...visibleIds])];
  });
  const bulk = (patch: Partial<Order>) => {selected.forEach((id) => updateOrder(id, patch)); setSelected([]);};
  const metrics = useMemo(() => orders.reduce((result, order) => {
    if (order.paymentStatus === 'paid') result.paid += 1;
    if (order.fulfillmentStatus === 'unfulfilled' || order.fulfillmentStatus === 'processing') result.waiting += 1;
    result.status[order.status] += 1;
    return result;
  }, {paid: 0, waiting: 0, status: {open: 0, confirmed: 0, completed: 0, cancelled: 0}}), [orders]);
  const clearFilters = () => {setQuery(''); setParams({}, {replace: true});};
  const exportFiltered = () => {
    const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = filtered.map((order) => [order.number, order.createdAt, order.customerName, order.customerEmail, order.customerPhone, order.total, order.paymentMethod, paymentStatus[order.paymentStatus], fulfillmentStatus[order.fulfillmentStatus], orderStatus[order.status]].map(escape).join(','));
    download([['Mã đơn','Ngày tạo','Khách hàng','Email','Điện thoại','Tổng tiền','Phương thức','Thanh toán','Giao hàng','Trạng thái'].map(escape).join(','), ...rows].join('\n'), `timeforge-orders-${new Date().toISOString().slice(0, 10)}.csv`);
    window.dispatchEvent(new CustomEvent('timeforge:toast', {detail: {message: `Đã xuất ${filtered.length} đơn hàng`, tone: 'success'}}));
  };
  const copyFilteredView = async () => {
    const url = new URL(window.location.href);
    if (query.trim()) url.searchParams.set('q', query.trim()); else url.searchParams.delete('q');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard is unavailable');
      await navigator.clipboard.writeText(url.toString());
      window.dispatchEvent(new CustomEvent('timeforge:toast', {detail: {message: 'Đã sao chép liên kết chế độ xem đơn hàng', tone: 'success'}}));
    } catch {
      window.dispatchEvent(new CustomEvent('timeforge:toast', {detail: {message: 'Không thể sao chép liên kết trên trình duyệt này', tone: 'danger'}}));
    }
  };
  return <AdminResourceFrame className="s11-page tf4921-orders-page"><section className="tf4921-ops-banner">
    <div className="tf4921-ops-banner-copy"><span><ShoppingBag/>TRUNG TÂM VẬN HÀNH</span><h2>Xử lý đơn hàng theo từng trạng thái</h2><p>Kiểm soát thanh toán, đóng gói, giao hàng, hoàn trả và hoàn tiền trong cùng một luồng.</p></div>
    <div className="tf4921-ops-banner-side"><div className="tf4921-ops-kpis"><article><b>{orders.length}</b><span>Tổng đơn</span></article><article><b>{metrics.paid}</b><span>Đã thanh toán</span></article><article><b>{metrics.waiting}</b><span>Chờ xử lý</span></article></div><Link className="s11-primary tf4921-draft-order" to="/admin/draft-orders/new"><Plus />Tạo đơn nháp</Link></div>
  </section>
    <AdminResourceSurface className="s11-index-card tf4921-ops-surface"><div className="s11-view-tabs">{([['all', 'Tất cả'], ['open', 'Đang mở'], ['confirmed', 'Đã xác nhận'], ['completed', 'Hoàn tất'], ['cancelled', 'Đã hủy']] as const).map(([id, label]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setFilter('status', id)}>{label}<span>{id === 'all' ? orders.length : metrics.status[id]}</span></button>)}</div>
      <div className="s11-toolbar tf55-orders-toolbar"><label className="tf55-admin-search"><Search aria-hidden="true"/><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã đơn, khách hàng, email hoặc số điện thoại" aria-label="Tìm kiếm đơn hàng"/>{query && <button type="button" className="tf55-search-clear" onClick={() => {setQuery(''); searchRef.current?.focus();}} aria-label="Xóa từ khóa tìm kiếm"><X/></button>}</label><select value={payment} onChange={(event) => setFilter('payment', event.target.value)} aria-label="Lọc theo trạng thái thanh toán"><option value="all">Tất cả thanh toán</option>{Object.entries(paymentStatus).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select><select className="tf56-order-range" value={range} onChange={(event) => setFilter('range', event.target.value)} aria-label="Lọc đơn theo thời gian"><option value="all">Mọi thời gian</option><option value="today">Hôm nay</option><option value="7d">7 ngày gần đây</option><option value="30d">30 ngày gần đây</option></select><button type="button" className={view !== 'all' || payment !== 'all' || range !== 'all' || query ? 'is-active' : ''} onClick={clearFilters}><Filter />{view !== 'all' || payment !== 'all' || range !== 'all' || query ? 'Xóa bộ lọc' : 'Bộ lọc'}</button><button type="button" className="tf55-export-orders" disabled={!filtered.length} onClick={exportFiltered}><Download/>Xuất kết quả</button></div>
      <div className="tf55-order-results"><span>Hiển thị <b>{filtered.length}</b> / {orders.length} đơn hàng</span><button className="tf56-copy-order-view" type="button" onClick={() => void copyFilteredView()} title="Sao chép liên kết gồm bộ lọc hiện tại"><Copy/>Sao chép chế độ xem</button><kbd>/</kbd><small>để tìm nhanh</small></div>
      <div className="s11-table-wrap"><table><thead><tr><th><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Chọn tất cả đơn đang hiển thị" /></th><th>Đơn hàng</th><th>Ngày</th><th>Khách hàng</th><th>Tổng tiền</th><th>Phương thức</th><th>Thanh toán</th><th>Giao hàng</th><th>Trạng thái</th><th /></tr></thead><tbody>{filtered.map((order) => <tr key={order.id} className={selectedSet.has(order.id) ? 'selected' : ''}><td><input type="checkbox" checked={selectedSet.has(order.id)} onChange={() => setSelected((current) => current.includes(order.id) ? current.filter((id) => id !== order.id) : [...current, order.id])} aria-label={`Chọn đơn hàng ${order.number}`} /></td><td><Link className="s11-link" to={`/admin/orders/${order.id}`}>{order.number}</Link></td><td>{fmt(order.createdAt)}</td><td><div className="s11-person"><span>{order.customerName.slice(0, 1).toUpperCase()}</span><div><b>{order.customerName}</b><small>{order.customerEmail}</small></div></div></td><td><b>{money(order.total)}</b></td><td><Badge tone={order.paymentMethod==='bank_transfer'?'info':order.paymentMethod==='cod'?'neutral':'success'}>{paymentMethodLabel[order.paymentMethod]||order.paymentMethod}</Badge></td><td><Badge tone={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'failed' ? 'critical' : order.paymentStatus === 'refunded' ? 'info' : 'warning'}>{paymentStatus[order.paymentStatus]}</Badge></td><td><Badge tone={order.fulfillmentStatus === 'fulfilled' ? 'success' : order.fulfillmentStatus === 'processing' ? 'info' : 'neutral'}>{fulfillmentStatus[order.fulfillmentStatus]}</Badge></td><td><Badge tone={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'critical' : 'info'}>{orderStatus[order.status]}</Badge></td><td><Link className="s11-icon-button" to={`/admin/orders/${order.id}`} aria-label={`Mở đơn hàng ${order.number}`}><ChevronRight /></Link></td></tr>)}</tbody></table>{!filtered.length && <div className="s11-empty"><ShoppingBag /><h3>Không có đơn hàng phù hợp</h3><p>Thử thay đổi từ khóa hoặc chế độ xem.</p></div>}</div>
    </AdminResourceSurface>
    <AnimatePresence>{!!selected.length && <motion.div className="s11-bulk" initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: 20, opacity: 0}}><b>{selected.length} đơn đã chọn</b><button onClick={() => bulk({status: 'confirmed'})}><Check />Xác nhận</button><button onClick={() => bulk({paymentStatus: 'paid'})}><CircleDollarSign />Đã thanh toán</button><button onClick={() => bulk({fulfillmentStatus: 'fulfilled', status: 'completed'})}><PackageCheck />Đã giao</button><button className="danger" onClick={() => {selected.forEach(cancelOrder); setSelected([]);}}><Undo2 />Hủy & hoàn kho</button><button onClick={() => setSelected([])}><X /></button></motion.div>}</AnimatePresence>
  </AdminResourceFrame>;
}

function FulfillmentModal({order, close, onDone}: {order: Order; close: () => void; onDone: (record: FulfillmentRecord) => void}) {
  const [lineIds, setLineIds] = useState(order.lines.map((item) => item.id));
  const integration=readIntegrationSettings();
  const [carrier, setCarrier] = useState(integration.shipping.defaultCarrier||'Giao hàng tiêu chuẩn');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notify, setNotify] = useState(true);
  const submit = () => onDone({id: uid('fulfill'), orderId: order.id, lineIds, carrier, trackingNumber, trackingUrl: trackingNumber ? buildTrackingUrl(integration.shipping.trackingUrlTemplate,trackingNumber) : '', status: trackingNumber ? 'shipped' : 'processing', createdAt: new Date().toISOString()});
  return <Modal eyebrow="FULFILLMENT" title="Tạo đợt giao hàng" close={close} wide footer={<><span /><button onClick={close}>Hủy</button><button className="primary" disabled={!lineIds.length} onClick={submit}>Tạo fulfillment</button></>}><div className="s11-line-selector"><h3>Sản phẩm cần xử lý</h3>{order.lines.map((line) => <label key={line.id}><input type="checkbox" checked={lineIds.includes(line.id)} onChange={() => setLineIds((current) => current.includes(line.id) ? current.filter((id) => id !== line.id) : [...current, line.id])} /><SmartImage src={line.image} alt={line.title} width={96} height={96} /><span><b>{line.title}</b><small>{line.variantTitle} · {line.quantity} sản phẩm</small></span></label>)}</div><div className="s11-form-grid"><label><span>Đơn vị vận chuyển</span><input value={carrier} onChange={(event) => setCarrier(event.target.value)} /></label><label><span>Mã vận đơn</span><input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Có thể bổ sung sau" /></label></div><label className="s11-toggle"><input type="checkbox" checked={notify} onChange={(event) => setNotify(event.target.checked)} /><span><b>Gửi thông báo cho khách hàng</b><small>{notify ? 'Khách sẽ nhận cập nhật trạng thái giao hàng.' : 'Không gửi thông báo trong bản demo.'}</small></span></label></Modal>;
}

function RefundModal({order, close, onDone}: {order: Order; close: () => void; onDone: (record: RefundRecord) => void}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('Khách hàng yêu cầu');
  const [restocked, setRestocked] = useState(true);
  const amount = order.lines.reduce((sum, line) => sum + Math.min(line.quantity, quantities[line.id] || 0) * line.unitPrice, 0);
  return <Modal eyebrow="REFUND" title="Hoàn tiền đơn hàng" close={close} wide footer={<><span className="s11-refund-total">Hoàn lại <b>{money(amount)}</b></span><button onClick={close}>Hủy</button><button className="primary" disabled={!amount} onClick={() => onDone({id: uid('refund'), orderId: order.id, lines: order.lines.filter((line) => quantities[line.id]).map((line) => ({lineId: line.id, quantity: quantities[line.id], amount: quantities[line.id] * line.unitPrice})), amount, reason, restocked, createdAt: new Date().toISOString()})}>Hoàn tiền</button></>}><div className="s11-refund-lines"><div className="head"><span>Sản phẩm</span><span>Số lượng hoàn</span><span>Số tiền</span></div>{order.lines.map((line) => <div key={line.id}><span><SmartImage src={line.image} alt={line.title} width={88} height={88} /><span><b>{line.title}</b><small>{line.variantTitle}</small></span></span><input type="number" min="0" max={line.quantity} value={quantities[line.id] || ''} onChange={(event) => setQuantities({...quantities, [line.id]: Math.min(line.quantity, Math.max(0, Number(event.target.value)))})} /><b>{money((quantities[line.id] || 0) * line.unitPrice)}</b></div>)}</div><label><span>Lý do hoàn tiền</span><select value={reason} onChange={(event) => setReason(event.target.value)}><option>Khách hàng yêu cầu</option><option>Sản phẩm lỗi</option><option>Giao sai sản phẩm</option><option>Điều chỉnh đơn hàng</option><option>Lý do khác</option></select></label><label className="s11-toggle"><input type="checkbox" checked={restocked} onChange={(event) => setRestocked(event.target.checked)} /><span><b>Hoàn số lượng về kho</b><small>Các sản phẩm được chọn sẽ được cộng lại tồn kho.</small></span></label></Modal>;
}

function ReturnModal({order, close, onDone}: {order: Order; close: () => void; onDone: (record: ReturnRecord) => void}) {
  const [lineIds, setLineIds] = useState<string[]>([]);
  const [reason, setReason] = useState('Không phù hợp nhu cầu');
  return <Modal eyebrow="RETURN" title="Tạo yêu cầu hoàn trả" close={close} wide footer={<><span /><button onClick={close}>Hủy</button><button className="primary" disabled={!lineIds.length} onClick={() => onDone({id: uid('return'), orderId: order.id, lineIds, reason, status: 'requested', createdAt: new Date().toISOString()})}>Tạo yêu cầu</button></>}><div className="s11-line-selector">{order.lines.map((line) => <label key={line.id}><input type="checkbox" checked={lineIds.includes(line.id)} onChange={() => setLineIds((current) => current.includes(line.id) ? current.filter((id) => id !== line.id) : [...current, line.id])} /><SmartImage src={line.image} alt={line.title} width={96} height={96} /><span><b>{line.title}</b><small>{line.variantTitle} · {line.quantity} sản phẩm</small></span></label>)}</div><label><span>Lý do hoàn trả</span><select value={reason} onChange={(event) => setReason(event.target.value)}><option>Không phù hợp nhu cầu</option><option>Sản phẩm lỗi</option><option>Không đúng mô tả</option><option>Giao sai sản phẩm</option><option>Lý do khác</option></select></label><div className="s11-callout"><RefreshCcw /><div><b>Hoàn trả và hoàn tiền là hai bước riêng</b><p>Tạo yêu cầu trước, sau đó kiểm tra hàng và xử lý hoàn tiền khi sản phẩm được nhận lại.</p></div></div></Modal>;
}

export function OrderDetailV11() {
  const {id = ''} = useParams();
  const {orders, updateOrder, cancelOrder, adjustInventory} = useCommerce();
  const order = orders.find((item) => item.id === id);
  const {store, commit, addEvent} = useWorkflowStore();
  const workflow = useMemo(() => normalizeWorkflowStore(store), [store]);
  const [modal, setModal] = useState<'fulfill' | 'refund' | 'return' | null>(null);
  const [note, setNote] = useState('');
  if (!order) return <Navigate to="/admin/orders" replace />;
  const events = workflow.events.filter((item) => item.orderId === order.id);
  const fulfillments = workflow.fulfillments.filter((item) => item.orderId === order.id);
  const refunds = workflow.refunds.filter((item) => item.orderId === order.id);
  const returns = workflow.returns.filter((item) => item.orderId === order.id);
  const saveFulfillment = (record: FulfillmentRecord) => {const now=new Date().toISOString();commit({...workflow, fulfillments: [record, ...workflow.fulfillments], events: [{id: uid('evt'), orderId: order.id, type: 'fulfillment', title: record.trackingNumber ? 'Đã tạo vận đơn' : 'Đang chuẩn bị hàng', detail: record.trackingNumber ? `${record.carrier} · ${record.trackingNumber}` : record.carrier, createdAt: now, actor: 'Admin'}, ...workflow.events]}); updateOrder(order.id, {status: 'confirmed', fulfillmentStatus: 'processing',shippingCarrier:record.carrier,trackingNumber:record.trackingNumber,trackingUrl:record.trackingUrl,shippedAt:record.trackingNumber?now:order.shippedAt}); setModal(null);};
  const saveRefund = (record: RefundRecord) => {if (record.restocked) record.lines.forEach((item) => {const line = order.lines.find((lineItem) => lineItem.id === item.lineId); if (line) adjustInventory(line.productId, line.variantId, item.quantity, `Hoàn kho từ ${order.number}`);}); const refundedBefore = refunds.reduce((sum, item) => sum + item.amount, 0); updateOrder(order.id, {paymentStatus: refundedBefore + record.amount >= order.total ? 'refunded' : order.paymentStatus, fulfillmentStatus: record.restocked ? 'returned' : order.fulfillmentStatus}); commit({...workflow, refunds: [record, ...workflow.refunds], events: [{id: uid('evt'), orderId: order.id, type: 'refund', title: 'Đã ghi nhận hoàn tiền', detail: `${money(record.amount)} · ${record.reason}${record.restocked ? ' · Đã hoàn kho' : ''}`, createdAt: new Date().toISOString(), actor: 'Admin'}, ...workflow.events]}); setModal(null);};
  const saveReturn = (record: ReturnRecord) => {commit({...workflow, returns: [record, ...workflow.returns], events: [{id: uid('evt'), orderId: order.id, type: 'return', title: 'Đã tạo yêu cầu hoàn trả', detail: record.reason, createdAt: new Date().toISOString(), actor: 'Admin'}, ...workflow.events]}); setModal(null);};
  const addNote = () => {if (!note.trim()) return; addEvent({orderId: order.id, type: 'note', title: 'Đã thêm ghi chú', detail: note.trim()}); setNote('');};
  const confirmBankTransfer=()=>{const now=new Date().toISOString();updateOrder(order.id,{paymentStatus:'paid',status:order.status==='open'?'confirmed':order.status,paidAt:now,bankTransferConfirmedAt:now,paymentConfirmationSource:'admin_bank_transfer'});addEvent({orderId:order.id,type:'payment',title:'Đã xác nhận nhận chuyển khoản',detail:`${money(order.total)} · ${order.bankName||'Ngân hàng'}`})};
  const markDelivered=()=>{const now=new Date().toISOString();updateOrder(order.id,{fulfillmentStatus:'fulfilled',status:'completed',deliveredAt:now});addEvent({orderId:order.id,type:'fulfillment',title:'Đã giao hàng thành công',detail:order.trackingNumber?`${order.shippingCarrier||'Đơn vị vận chuyển'} · ${order.trackingNumber}`:'Đã hoàn tất giao hàng'})};
  return <div className="s11-order-detail"><div className="s11-order-head"><div><Link to="/admin/orders"><ArrowLeft />Đơn hàng</Link><div><h2>{order.number}</h2><Badge tone={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'critical' : 'info'}>{orderStatus[order.status]}</Badge></div><p>{fmt(order.createdAt)} · Từ {order.source === 'storefront' ? 'Cửa hàng online' : 'Admin'}</p></div><div><button onClick={() => navigator.clipboard?.writeText(order.number)}><Copy />Sao chép mã</button><button onClick={() => setModal('return')}><RefreshCcw />Hoàn trả</button><button onClick={() => setModal('refund')}><CircleDollarSign />Hoàn tiền</button><button className="primary" onClick={() => setModal('fulfill')}><PackageCheck />Xử lý giao hàng</button></div></div>
    <div className="s11-order-layout"><main><section className="s11-detail-card"><header><div><PackageCheck /><span><h3>{fulfillmentStatus[order.fulfillmentStatus]}</h3><p>{order.lines.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm</p></span></div>{order.fulfillmentStatus !== 'fulfilled' && <button onClick={() => setModal('fulfill')}>Tạo fulfillment</button>}</header><div className="s11-detail-lines">{order.lines.map((line) => <article key={line.id}><SmartImage src={line.image} alt={line.title} width={120} height={120} /><div><Link to={`/admin/products/${line.productId}`}>{line.title}</Link><span>{line.variantTitle} · SKU {line.sku || '—'}</span><small>{line.quantity} × {money(line.unitPrice)}</small></div><b>{money(line.lineTotal)}</b></article>)}</div>{fulfillments.map((item) => <div className="s11-fulfillment-record" key={item.id}><Truck /><div><b>{item.carrier}</b><span>{item.trackingNumber || 'Chưa có mã vận đơn'}</span></div><Badge tone={item.status === 'delivered' ? 'success' : 'info'}>{item.status === 'shipped' ? 'Đã gửi' : item.status === 'delivered' ? 'Đã giao' : 'Đang chuẩn bị'}</Badge></div>)}{order.trackingNumber&&<div className="tf515-tracking-summary"><Truck/><div><b>{order.shippingCarrier||'Đơn vị vận chuyển'}</b><span>{order.trackingNumber}</span>{order.trackingUrl&&<a href={order.trackingUrl} target="_blank" rel="noreferrer"><ExternalLink/>Theo dõi vận chuyển</a>}</div>{order.fulfillmentStatus!=='fulfilled'?<button onClick={markDelivered}>Đánh dấu đã giao</button>:<Badge tone="success">Đã giao</Badge>}</div>}</section>
      <section className="s11-detail-card tf515-payment-card tf521-admin-payment-card"><header><div><CircleDollarSign /><span><h3>Thanh toán</h3><p>{paymentMethodLabel[order.paymentMethod]||order.paymentMethod} · {paymentStatus[order.paymentStatus]}</p></span></div>{order.paymentStatus==='pending'&&order.paymentMethod==='bank_transfer'&&<button className="tf515-confirm-transfer" onClick={confirmBankTransfer}><CheckCircle2/>Xác nhận đã nhận chuyển khoản</button>}{order.paymentStatus==='pending'&&['payos','online'].includes(order.paymentMethod)&&<Badge tone="warning">Chờ PayOS xác nhận</Badge>}{order.paymentStatus==='pending'&&order.paymentMethod==='cod'&&<button onClick={()=>{const now=new Date().toISOString();updateOrder(order.id,{paymentStatus:'paid',paidAt:now,paymentConfirmationSource:'admin_manual'});addEvent({orderId:order.id,type:'payment',title:'Đã thu tiền COD',detail:money(order.total)})}}>Đã thu COD</button>}</header>
       {order.paymentMethod==='bank_transfer'&&<div className="tf515-order-bank"><Landmark/><div><b>{order.bankName||'Ngân hàng chuyển khoản'}</b><span>Chủ tài khoản: {order.bankAccountName||'—'}</span><span>Số tài khoản: <strong>{order.bankAccountNumber||'—'}</strong></span><span>Nội dung chuyển khoản: <strong>{order.bankTransferContent || order.number}</strong></span></div></div>}
       {['payos','online'].includes(order.paymentMethod)&&<div className="tf515-payos-state"><QrCode/><div><b>PayOS · QR ngân hàng</b><span>{order.paymentStatus==='paid'?'Webhook đã xác nhận giao dịch thành công.':'Hệ thống đang chờ webhook PayOS cập nhật tự động.'}</span>{order.paymentReference&&<small>Mã tham chiếu: {order.paymentReference}</small>}</div></div>}
       {order.paymentStatus==='paid'&&<div className="tf515-paid-confirmation"><CheckCircle2/><span><b>Đã thanh toán</b><small>{order.paidAt?fmt(order.paidAt):'Đã được xác nhận'}{order.paymentConfirmationSource==='admin_bank_transfer'?' · Admin xác nhận chuyển khoản':''}</small></span></div>}
       <dl className="s11-money-list"><div><dt>Tạm tính</dt><dd>{money(order.subtotal)}</dd></div>{!!order.promotionDiscountAmount&&<div><dt>Mã giảm giá {order.discountCode&&`(${order.discountCode})`}</dt><dd>–{money(order.promotionDiscountAmount)}</dd></div>}{!!order.paymentDiscountAmount&&<div><dt>{order.paymentDiscountLabel||'Ưu đãi chuyển khoản'}</dt><dd>–{money(order.paymentDiscountAmount)}</dd></div>}{!order.promotionDiscountAmount&&!order.paymentDiscountAmount&&order.discountAmount>0&&<div><dt>Giảm giá</dt><dd>–{money(order.discountAmount)}</dd></div>}<div><dt>Vận chuyển</dt><dd>{money(order.shippingAmount)}</dd></div><div className="total"><dt>Tổng cộng</dt><dd>{money(order.total)}</dd></div>{refunds.length > 0 && <div className="refund"><dt>Đã hoàn</dt><dd>–{money(refunds.reduce((sum, item) => sum + item.amount, 0))}</dd></div>}</dl></section>
      {!!returns.length && <section className="s11-detail-card"><header><div><RefreshCcw /><span><h3>Hoàn trả</h3><p>{returns.length} yêu cầu</p></span></div></header>{returns.map((item) => <article className="s11-return-record" key={item.id}><div><b>{item.reason}</b><span>{fmt(item.createdAt)} · {item.lineIds.length} sản phẩm</span></div><select value={item.status} onChange={(event) => {const next = workflow.returns.map((record) => record.id === item.id ? {...record, status: event.target.value as ReturnRecord['status']} : record); commit({...workflow, returns: next});}}><option value="requested">Đã yêu cầu</option><option value="approved">Đã duyệt</option><option value="received">Đã nhận hàng</option><option value="closed">Đã đóng</option></select></article>)}</section>}
    </main><aside><section className="s11-detail-card"><h3>Khách hàng</h3><div className="s11-customer-summary"><span>{order.customerName.slice(0, 1).toUpperCase()}</span><div><b>{order.customerName}</b><small>{order.customerEmail}<br />{order.customerPhone}</small></div></div><hr /><h4>Địa chỉ giao hàng</h4><p>{order.shippingAddress.address1}{order.shippingAddress.address2 ? `, ${order.shippingAddress.address2}` : ''}<br />{order.shippingAddress.ward}, {order.shippingAddress.district}<br />{order.shippingAddress.city}, {order.shippingAddress.country}</p></section><section className="s11-detail-card"><h3>Ghi chú đơn hàng</h3><p>{order.note || 'Khách hàng không để lại ghi chú.'}</p></section><section className="s11-timeline-card"><h3>Dòng thời gian</h3><div className="s11-note-box"><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Để lại ghi chú nội bộ..." /><button onClick={addNote}><Send /></button></div><div className="s11-timeline"><article><i /><div><b>Đơn hàng được tạo</b><p>{order.customerName} đặt hàng từ storefront.</p><span>{fmt(order.createdAt)}</span></div></article>{events.map((event) => <article key={event.id}><i className={event.type} /><div><b>{event.title}</b><p>{event.detail}</p><span>{fmt(event.createdAt)} · {event.actor}</span></div></article>)}</div></section><button className="s11-cancel-order" disabled={order.status === 'cancelled'} onClick={() => {if (confirm('Hủy đơn và hoàn lại tồn kho?')) cancelOrder(order.id);}}>Hủy đơn hàng</button></aside></div>
    <AnimatePresence>{modal === 'fulfill' && <FulfillmentModal order={order} close={() => setModal(null)} onDone={saveFulfillment} />}{modal === 'refund' && <RefundModal order={order} close={() => setModal(null)} onDone={saveRefund} />}{modal === 'return' && <ReturnModal order={order} close={() => setModal(null)} onDone={saveReturn} />}</AnimatePresence>
  </div>;
}

interface SegmentCriteria {minimumSpent: number; minimumOrders: number; acceptsMarketing: 'all' | 'yes' | 'no'; tag: string; inactiveDays: number; purchasedProductIds: string[]}
interface CustomerSegment {id: string; name: string; description: string; criteria: SegmentCriteria; createdAt: string}
const segmentKey = 'tf.s11.customer-segments';
const defaultSegments: CustomerSegment[] = [
  {id: 'vip', name: 'Khách hàng giá trị cao', description: 'Đã chi từ 20 triệu đồng.', criteria: {minimumSpent: 20000000, minimumOrders: 0, acceptsMarketing: 'all', tag: '', inactiveDays: 0, purchasedProductIds: []}, createdAt: new Date().toISOString()},
  {id: 'returning', name: 'Khách quay lại', description: 'Có ít nhất 2 đơn hàng.', criteria: {minimumSpent: 0, minimumOrders: 2, acceptsMarketing: 'all', tag: '', inactiveDays: 0, purchasedProductIds: []}, createdAt: new Date().toISOString()},
  {id: 'marketing', name: 'Đã đăng ký email', description: 'Cho phép nhận email marketing.', criteria: {minimumSpent: 0, minimumOrders: 0, acceptsMarketing: 'yes', tag: '', inactiveDays: 0, purchasedProductIds: []}, createdAt: new Date().toISOString()},
  {id: 'at-risk', name: 'Có nguy cơ rời bỏ', description: 'Đã mua hàng nhưng hơn 90 ngày chưa quay lại.', criteria: {minimumSpent: 0, minimumOrders: 1, acceptsMarketing: 'all', tag: '', inactiveDays: 90, purchasedProductIds: []}, createdAt: new Date().toISOString()},
];
const normalizeSegments = (value: unknown) => asList<CustomerSegment>(value).map((segment) => ({...segment, criteria: {...segment.criteria, purchasedProductIds: asStringList(segment.criteria?.purchasedProductIds)}}));
const loadSegments = () => {try {const raw = localStorage.getItem(segmentKey); return raw ? normalizeSegments(JSON.parse(raw)) : defaultSegments;} catch {return defaultSegments;}};
function membersFor(segment: CustomerSegment, customers: Customer[], orders: Order[]) {
  return customers.filter((customer) => {
    const relatedOrders = orders.filter((order) => order.customerId === customer.id || (!!customer.email && order.customerEmail.toLowerCase() === customer.email.toLowerCase()));
    const latest = relatedOrders.map((item) => new Date(item.createdAt).getTime()).sort((a, b) => b - a)[0] || 0;
    if (customer.totalSpent < segment.criteria.minimumSpent) return false;
    if (customer.ordersCount < segment.criteria.minimumOrders) return false;
    if (segment.criteria.acceptsMarketing === 'yes' && !customer.acceptsMarketing) return false;
    if (segment.criteria.acceptsMarketing === 'no' && customer.acceptsMarketing) return false;
    if (segment.criteria.tag && !customer.tags.some((tag) => tag.toLowerCase().includes(segment.criteria.tag.toLowerCase()))) return false;
    if (segment.criteria.inactiveDays && latest && Date.now() - latest < segment.criteria.inactiveDays * 86400000) return false;
    if (segment.criteria.purchasedProductIds.length && !relatedOrders.some((order) => order.lines.some((line) => segment.criteria.purchasedProductIds.includes(line.productId)))) return false;
    return true;
  });
}
function SegmentModal({segment, close, save}: {segment: CustomerSegment | null; close: () => void; save: (segment: CustomerSegment) => void}) {
  const [draft, setDraft] = useState<CustomerSegment>(segment || {
    id: uid('segment'),
    name: '',
    description: '',
    criteria: {minimumSpent: 0, minimumOrders: 0, acceptsMarketing: 'all', tag: '', inactiveDays: 0, purchasedProductIds: []},
    createdAt: new Date().toISOString(),
  });
  const [picker, setPicker] = useState(false);
  const {products} = useCommerce();
  const removeProduct = (id: string) => setDraft((current) => ({
    ...current,
    criteria: {...current.criteria, purchasedProductIds: current.criteria.purchasedProductIds.filter((item) => item !== id)},
  }));
  return <>
    <Modal eyebrow="CUSTOMER SEGMENT" title={segment ? 'Chỉnh sửa phân khúc' : 'Tạo phân khúc'} close={close} wide footer={<><span /><button onClick={close}>Hủy</button><button className="primary" disabled={!draft.name.trim()} onClick={() => save({...draft, name: draft.name.trim()})}>Lưu phân khúc</button></>}>
      <div className="s11-form-grid">
        <label><span>Tên phân khúc</span><input value={draft.name} onChange={(event) => setDraft({...draft, name: event.target.value})} placeholder="Ví dụ: VIP yêu thích Rolex" /></label>
        <label><span>Mô tả</span><input value={draft.description} onChange={(event) => setDraft({...draft, description: event.target.value})} /></label>
        <label><span>Chi tiêu tối thiểu</span><input type="number" value={draft.criteria.minimumSpent || ''} onChange={(event) => setDraft({...draft, criteria: {...draft.criteria, minimumSpent: Number(event.target.value)}})} /></label>
        <label><span>Số đơn tối thiểu</span><input type="number" value={draft.criteria.minimumOrders || ''} onChange={(event) => setDraft({...draft, criteria: {...draft.criteria, minimumOrders: Number(event.target.value)}})} /></label>
        <label><span>Email marketing</span><select value={draft.criteria.acceptsMarketing} onChange={(event) => setDraft({...draft, criteria: {...draft.criteria, acceptsMarketing: event.target.value as SegmentCriteria['acceptsMarketing']}})}><option value="all">Không giới hạn</option><option value="yes">Đã đăng ký</option><option value="no">Chưa đăng ký</option></select></label>
        <label><span>Tag chứa</span><input value={draft.criteria.tag} onChange={(event) => setDraft({...draft, criteria: {...draft.criteria, tag: event.target.value}})} /></label>
        <label><span>Không mua hàng trong</span><div className="s11-input-suffix"><input type="number" value={draft.criteria.inactiveDays || ''} onChange={(event) => setDraft({...draft, criteria: {...draft.criteria, inactiveDays: Number(event.target.value)}})} /><span>ngày</span></div></label>
      </div>
      <div className="s11-resource-condition"><div><b>Đã mua sản phẩm cụ thể</b><p>Dùng Product Resource Picker để tạo phân khúc dựa trên lịch sử mua.</p></div><button type="button" onClick={() => setPicker(true)}><Plus />Chọn sản phẩm</button></div>
      {draft.criteria.purchasedProductIds.length > 0 && <div className="s11-selected-resources">{draft.criteria.purchasedProductIds.map((id) => {
        const product = products.find((item) => item.id === id);
        return product ? <span key={id}><SmartImage src={product.images[0]} alt="" width={48} height={48} />{product.title}<button type="button" onClick={() => removeProduct(id)}><X /></button></span> : null;
      })}</div>}
    </Modal>
    <ResourcePicker open={picker} selectedIds={draft.criteria.purchasedProductIds} onClose={() => setPicker(false)} onConfirm={(ids) => setDraft((current) => ({...current, criteria: {...current.criteria, purchasedProductIds: ids}}))} />
  </>;
}
export function CustomerSegmentsV11() {
  const {customers, orders} = useCommerce();
  const [segments, setSegments] = useState<CustomerSegment[]>(loadSegments);
  useEffect(() => {if (!firebaseClient.enabled) return; void firebaseClient.read<CustomerSegment[]|Record<string,CustomerSegment>>('timeforge/customerSegments').then((remote) => {const normalized=normalizeSegments(remote);if (normalized.length) {setSegments(normalized); localStorage.setItem(segmentKey, JSON.stringify(normalized));}});}, []);
  const [editing, setEditing] = useState<CustomerSegment | null | undefined>(undefined);
  const [selected, setSelected] = useState<CustomerSegment | null>(null);
  const [query, setQuery] = useState('');
  const save = (segment: CustomerSegment) => {const next = segments.some((item) => item.id === segment.id) ? segments.map((item) => item.id === segment.id ? segment : item) : [segment, ...segments]; setSegments(next); localStorage.setItem(segmentKey, JSON.stringify(next)); if (firebaseClient.enabled) void firebaseClient.write('timeforge/customerSegments', next); setEditing(undefined);};
  const normalizedQuery = query.toLowerCase();
  const filtered = useMemo(() => segments.filter((segment) => `${segment.name} ${segment.description}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery, segments]);
  const membersBySegment = useMemo(() => new Map(segments.map((segment) => [segment.id, membersFor(segment, customers, orders)])), [customers, orders, segments]);
  const selectedMembers = selected ? membersBySegment.get(selected.id) || [] : [];
  return <div className="s11-page"><div className="s11-page-head"><div><small>CUSTOMER SEGMENTS</small><h2>Phân khúc khách hàng</h2><p>Tạo nhóm động dựa trên hành vi mua, giá trị khách hàng và mức độ tương tác.</p></div><button className="s11-primary" onClick={() => setEditing(null)}><Plus />Tạo phân khúc</button></div><section className="s11-index-card"><div className="s11-toolbar"><label className="tf55-admin-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm phân khúc" aria-label="Tìm phân khúc khách hàng" />{query && <button type="button" className="tf55-search-clear" onClick={() => setQuery('')} aria-label="Xóa từ khóa tìm kiếm"><X /></button>}</label></div><div className="s11-segment-grid">{filtered.map((segment) => <article key={segment.id}><div className="s11-segment-icon"><UserRoundSearch /></div><div><button onClick={() => setSelected(segment)}>{segment.name}</button><p>{segment.description || 'Phân khúc khách hàng động.'}</p><div><Badge tone="info">{membersBySegment.get(segment.id)?.length || 0} khách hàng</Badge><span>Cập nhật tự động</span></div></div><button className="s11-icon-button" onClick={() => setEditing(segment)}><MoreHorizontal /></button></article>)}</div></section><AnimatePresence>{editing !== undefined && <SegmentModal segment={editing} close={() => setEditing(undefined)} save={save} />}{selected && <motion.div className="s11-drawer-shell" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} onMouseDown={() => setSelected(null)}><aside className="s11-segment-drawer" onMouseDown={(event) => event.stopPropagation()}><header><div><small>SEGMENT</small><h2>{selected.name}</h2><p>{selected.description}</p></div><button onClick={() => setSelected(null)}><X /></button></header><div className="s11-segment-members">{selectedMembers.map((customer) => <article key={customer.id}><span>{customer.name.slice(0, 1).toUpperCase()}</span><div><b>{customer.name}</b><small>{customer.email || customer.phone}</small></div><div><b>{money(customer.totalSpent)}</b><small>{customer.ordersCount} đơn</small></div></article>)}</div></aside></motion.div>}</AnimatePresence></div>;
}

const presetSections: Array<{id: string; name: string; description: string; build: () => Section[]}> = [
  {id: 'editorial', name: 'Luxury Editorial Hero', description: 'Hero lớn, nội dung tối giản và CTA rõ.', build: () => {const hero = createSection('hero'); hero.settings = {...hero.settings, height: 'large', alignment: 'left', overlay: 48}; return [hero];}},
  {id: 'trust', name: 'Trust & Service Strip', description: 'Cam kết chính hãng, giao hàng và hậu mãi.', build: () => [createSection('trust')]},
  {id: 'collection-story', name: 'Collection Story', description: 'Bộ sưu tập nổi bật kết hợp khối kể chuyện.', build: () => [createSection('collections'), createSection('imageText')]},
  {id: 'launch', name: 'Luxury Product Launch', description: 'Hero, featured products và newsletter.', build: () => [createSection('hero'), createSection('products'), createSection('newsletter')]},
];
export function OnlineStoreV11() {
  const {draftTheme, saveThemeDraft} = useCommerce();
  const [open, setOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const apply = (id: string) => {const preset = presetSections.find((item) => item.id === id); if (!preset) return; const next = structuredClone(draftTheme); next.templates.home.sections = [...preset.build(), ...next.templates.home.sections]; saveThemeDraft(next); setRevision((value) => value + 1); setOpen(false); window.dispatchEvent(new CustomEvent('timeforge:toast', {detail: {message: `Đã thêm preset “${preset.name}” vào Trang chủ`, tone: 'success'}}));};
  return <div className="s11-theme-wrapper"><OnlineStore key={revision} /><button className="s11-preset-button" onClick={() => setOpen(true)}><Box />Section presets</button><AnimatePresence>{open && <Modal eyebrow="THEME LIBRARY" title="Section presets" close={() => setOpen(false)} wide><div className="s11-preset-grid">{presetSections.map((preset) => <button key={preset.id} onClick={() => apply(preset.id)}><span><Box /></span><b>{preset.name}</b><p>{preset.description}</p><small>Thêm vào template Trang chủ</small></button>)}</div></Modal>}</AnimatePresence></div>;
}
