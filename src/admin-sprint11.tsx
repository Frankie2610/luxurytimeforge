import {AnimatePresence, motion} from 'framer-motion';
import {
  ArrowLeft, BadgeDollarSign, Box, Check, CheckCircle2, ChevronRight, CircleDollarSign,
  Clock3, Copy, Filter, Mail, MoreHorizontal, PackageCheck, Plus, RefreshCcw, RotateCcw,
  Search, Send, ShoppingBag, Tag, Truck, Undo2, UserRoundSearch, Users, X,
} from 'lucide-react';
import {useEffect, useMemo, useState, type ReactNode} from 'react';
import {Link, Navigate, useNavigate, useParams} from 'react-router-dom';
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

const fmt = (value: string) => new Date(value).toLocaleString('vi-VN', {dateStyle: 'medium', timeStyle: 'short'});
const orderStatus: Record<Order['status'], string> = {open: 'Đang mở', confirmed: 'Đã xác nhận', completed: 'Hoàn tất', cancelled: 'Đã hủy'};
const paymentStatus: Record<Order['paymentStatus'], string> = {pending: 'Chờ thanh toán', paid: 'Đã thanh toán', refunded: 'Đã hoàn tiền', failed: 'Thất bại'};
const fulfillmentStatus: Record<Order['fulfillmentStatus'], string> = {unfulfilled: 'Chưa xử lý', processing: 'Đang chuẩn bị', fulfilled: 'Đã giao', returned: 'Đã hoàn trả'};

function Badge({tone = 'neutral', children}: {tone?: 'success' | 'warning' | 'critical' | 'info' | 'neutral'; children: ReactNode}) {
  return <span className={`s11-badge ${tone}`}>{children}</span>;
}
function Modal({title, eyebrow, close, children, footer, wide = false}: {title: string; eyebrow: string; close: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean}) {
  return <motion.div className="s11-modal-shell" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} onMouseDown={close}><motion.section className={`s11-modal ${wide ? 'wide' : ''}`} initial={{y: 18, scale: .985}} animate={{y: 0, scale: 1}} onMouseDown={(event) => event.stopPropagation()}><header><div><small>{eyebrow}</small><h2>{title}</h2></div><button onClick={close}><X /></button></header><div className="s11-modal-body">{children}</div>{footer && <footer>{footer}</footer>}</motion.section></motion.div>;
}

interface WorkflowEvent {id: string; orderId: string; type: 'note' | 'payment' | 'fulfillment' | 'return' | 'refund' | 'status'; title: string; detail: string; createdAt: string; actor: string}
interface FulfillmentRecord {id: string; orderId: string; lineIds: string[]; carrier: string; trackingNumber: string; trackingUrl: string; status: 'processing' | 'shipped' | 'delivered'; createdAt: string}
interface RefundLine {lineId: string; quantity: number; amount: number}
interface RefundRecord {id: string; orderId: string; lines: RefundLine[]; amount: number; reason: string; restocked: boolean; createdAt: string}
interface ReturnRecord {id: string; orderId: string; lineIds: string[]; reason: string; status: 'requested' | 'approved' | 'received' | 'closed'; createdAt: string}
interface WorkflowStore {events: WorkflowEvent[]; fulfillments: FulfillmentRecord[]; refunds: RefundRecord[]; returns: ReturnRecord[]}
const workflowKey = 'tf.s11.order-workflows';
const loadWorkflow = (): WorkflowStore => {try {const raw = localStorage.getItem(workflowKey); return raw ? JSON.parse(raw) : {events: [], fulfillments: [], refunds: [], returns: []};} catch {return {events: [], fulfillments: [], refunds: [], returns: []};}};
function useWorkflowStore() {
  const [store, setStore] = useState<WorkflowStore>(loadWorkflow);
  useEffect(() => {if (!firebaseClient.enabled) return; void firebaseClient.read<WorkflowStore>('timeforge/orderWorkflows').then((remote) => {if (remote) {setStore(remote); localStorage.setItem(workflowKey, JSON.stringify(remote));}});}, []);
  const commit = (next: WorkflowStore) => {setStore(next); localStorage.setItem(workflowKey, JSON.stringify(next)); if (firebaseClient.enabled) void firebaseClient.write('timeforge/orderWorkflows', next);};
  const addEvent = (event: Omit<WorkflowEvent, 'id' | 'createdAt' | 'actor'>) => commit({...store, events: [{...event, id: uid('evt'), createdAt: new Date().toISOString(), actor: 'Admin'}, ...store.events]});
  return {store, commit, addEvent};
}

export function OrdersV11() {
  const {orders, updateOrder, cancelOrder} = useCommerce();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'all' | Order['status']>('all');
  const [payment, setPayment] = useState<'all' | PaymentStatus>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const filtered = useMemo(() => orders.filter((order) => {
    if (view !== 'all' && order.status !== view) return false;
    if (payment !== 'all' && order.paymentStatus !== payment) return false;
    return `${order.number} ${order.customerName} ${order.customerEmail} ${order.customerPhone}`.toLowerCase().includes(query.toLowerCase());
  }), [orders, query, view, payment]);
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map((item) => item.id));
  const bulk = (patch: Partial<Order>) => {selected.forEach((id) => updateOrder(id, patch)); setSelected([]);};
  const paidOrders=orders.filter((item)=>item.paymentStatus==='paid').length;
  const waitingFulfillment=orders.filter((item)=>item.fulfillmentStatus==='unfulfilled'||item.fulfillmentStatus==='processing').length;
  return <AdminResourceFrame className="s11-page tf4921-orders-page"><section className="tf4921-ops-banner">
    <div className="tf4921-ops-banner-copy"><span><ShoppingBag/>TRUNG TÂM VẬN HÀNH</span><h2>Xử lý đơn hàng theo từng trạng thái</h2><p>Kiểm soát thanh toán, đóng gói, giao hàng, hoàn trả và hoàn tiền trong cùng một luồng.</p></div>
    <div className="tf4921-ops-banner-side"><div className="tf4921-ops-kpis"><article><b>{orders.length}</b><span>Tổng đơn</span></article><article><b>{paidOrders}</b><span>Đã thanh toán</span></article><article><b>{waitingFulfillment}</b><span>Chờ xử lý</span></article></div><Link className="s11-primary tf4921-draft-order" to="/admin/draft-orders/new"><Plus />Tạo đơn nháp</Link></div>
  </section>
    <AdminResourceSurface className="s11-index-card tf4921-ops-surface"><div className="s11-view-tabs">{([['all', 'Tất cả'], ['open', 'Đang mở'], ['confirmed', 'Đã xác nhận'], ['completed', 'Hoàn tất'], ['cancelled', 'Đã hủy']] as const).map(([id, label]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>{label}<span>{id === 'all' ? orders.length : orders.filter((item) => item.status === id).length}</span></button>)}</div>
      <div className="s11-toolbar"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã đơn, khách hàng, email hoặc số điện thoại" /></label><select value={payment} onChange={(event) => setPayment(event.target.value as typeof payment)}><option value="all">Tất cả thanh toán</option>{Object.entries(paymentStatus).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select><button><Filter />Bộ lọc</button></div>
      <div className="s11-table-wrap"><table><thead><tr><th><input type="checkbox" checked={!!filtered.length && selected.length === filtered.length} onChange={toggleAll} /></th><th>Đơn hàng</th><th>Ngày</th><th>Khách hàng</th><th>Tổng tiền</th><th>Thanh toán</th><th>Giao hàng</th><th>Trạng thái</th><th /></tr></thead><tbody>{filtered.map((order) => <tr key={order.id} className={selected.includes(order.id) ? 'selected' : ''}><td><input type="checkbox" checked={selected.includes(order.id)} onChange={() => setSelected((current) => current.includes(order.id) ? current.filter((id) => id !== order.id) : [...current, order.id])} /></td><td><button className="s11-link" onClick={() => navigate(`/admin/orders/${order.id}`)}>{order.number}</button></td><td>{fmt(order.createdAt)}</td><td><div className="s11-person"><span>{order.customerName.slice(0, 1).toUpperCase()}</span><div><b>{order.customerName}</b><small>{order.customerEmail}</small></div></div></td><td><b>{money(order.total)}</b></td><td><Badge tone={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'failed' ? 'critical' : order.paymentStatus === 'refunded' ? 'info' : 'warning'}>{paymentStatus[order.paymentStatus]}</Badge></td><td><Badge tone={order.fulfillmentStatus === 'fulfilled' ? 'success' : order.fulfillmentStatus === 'processing' ? 'info' : 'neutral'}>{fulfillmentStatus[order.fulfillmentStatus]}</Badge></td><td><Badge tone={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'critical' : 'info'}>{orderStatus[order.status]}</Badge></td><td><button className="s11-icon-button" onClick={() => navigate(`/admin/orders/${order.id}`)}><ChevronRight /></button></td></tr>)}</tbody></table>{!filtered.length && <div className="s11-empty"><ShoppingBag /><h3>Không có đơn hàng phù hợp</h3><p>Thử thay đổi từ khóa hoặc chế độ xem.</p></div>}</div>
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
  const [modal, setModal] = useState<'fulfill' | 'refund' | 'return' | null>(null);
  const [note, setNote] = useState('');
  if (!order) return <Navigate to="/admin/orders" replace />;
  const events = store.events.filter((item) => item.orderId === order.id);
  const fulfillments = store.fulfillments.filter((item) => item.orderId === order.id);
  const refunds = store.refunds.filter((item) => item.orderId === order.id);
  const returns = store.returns.filter((item) => item.orderId === order.id);
  const saveFulfillment = (record: FulfillmentRecord) => {commit({...store, fulfillments: [record, ...store.fulfillments], events: [{id: uid('evt'), orderId: order.id, type: 'fulfillment', title: record.trackingNumber ? 'Đã tạo vận đơn' : 'Đang chuẩn bị hàng', detail: record.trackingNumber ? `${record.carrier} · ${record.trackingNumber}` : record.carrier, createdAt: new Date().toISOString(), actor: 'Admin'}, ...store.events]}); updateOrder(order.id, {status: 'confirmed', fulfillmentStatus: record.status === 'shipped' ? 'processing' : 'processing'}); setModal(null);};
  const saveRefund = (record: RefundRecord) => {if (record.restocked) record.lines.forEach((item) => {const line = order.lines.find((lineItem) => lineItem.id === item.lineId); if (line) adjustInventory(line.productId, line.variantId, item.quantity, `Hoàn kho từ ${order.number}`);}); const refundedBefore = refunds.reduce((sum, item) => sum + item.amount, 0); updateOrder(order.id, {paymentStatus: refundedBefore + record.amount >= order.total ? 'refunded' : order.paymentStatus, fulfillmentStatus: record.restocked ? 'returned' : order.fulfillmentStatus}); commit({...store, refunds: [record, ...store.refunds], events: [{id: uid('evt'), orderId: order.id, type: 'refund', title: 'Đã ghi nhận hoàn tiền', detail: `${money(record.amount)} · ${record.reason}${record.restocked ? ' · Đã hoàn kho' : ''}`, createdAt: new Date().toISOString(), actor: 'Admin'}, ...store.events]}); setModal(null);};
  const saveReturn = (record: ReturnRecord) => {commit({...store, returns: [record, ...store.returns], events: [{id: uid('evt'), orderId: order.id, type: 'return', title: 'Đã tạo yêu cầu hoàn trả', detail: record.reason, createdAt: new Date().toISOString(), actor: 'Admin'}, ...store.events]}); setModal(null);};
  const addNote = () => {if (!note.trim()) return; addEvent({orderId: order.id, type: 'note', title: 'Đã thêm ghi chú', detail: note.trim()}); setNote('');};
  return <div className="s11-order-detail"><div className="s11-order-head"><div><Link to="/admin/orders"><ArrowLeft />Đơn hàng</Link><div><h2>{order.number}</h2><Badge tone={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'critical' : 'info'}>{orderStatus[order.status]}</Badge></div><p>{fmt(order.createdAt)} · Từ {order.source === 'storefront' ? 'Cửa hàng online' : 'Admin'}</p></div><div><button onClick={() => navigator.clipboard?.writeText(order.number)}><Copy />Sao chép mã</button><button onClick={() => setModal('return')}><RefreshCcw />Hoàn trả</button><button onClick={() => setModal('refund')}><CircleDollarSign />Hoàn tiền</button><button className="primary" onClick={() => setModal('fulfill')}><PackageCheck />Xử lý giao hàng</button></div></div>
    <div className="s11-order-layout"><main><section className="s11-detail-card"><header><div><PackageCheck /><span><h3>{fulfillmentStatus[order.fulfillmentStatus]}</h3><p>{order.lines.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm</p></span></div>{order.fulfillmentStatus !== 'fulfilled' && <button onClick={() => setModal('fulfill')}>Tạo fulfillment</button>}</header><div className="s11-detail-lines">{order.lines.map((line) => <article key={line.id}><SmartImage src={line.image} alt={line.title} width={120} height={120} /><div><Link to={`/admin/products/${line.productId}`}>{line.title}</Link><span>{line.variantTitle} · SKU {line.sku || '—'}</span><small>{line.quantity} × {money(line.unitPrice)}</small></div><b>{money(line.lineTotal)}</b></article>)}</div>{fulfillments.map((item) => <div className="s11-fulfillment-record" key={item.id}><Truck /><div><b>{item.carrier}</b><span>{item.trackingNumber || 'Chưa có mã vận đơn'}</span></div><Badge tone={item.status === 'delivered' ? 'success' : 'info'}>{item.status === 'shipped' ? 'Đã gửi' : item.status === 'delivered' ? 'Đã giao' : 'Đang chuẩn bị'}</Badge></div>)}</section>
      <section className="s11-detail-card"><header><div><CircleDollarSign /><span><h3>Thanh toán</h3><p>{paymentStatus[order.paymentStatus]}</p></span></div>{order.paymentStatus === 'pending' && <button onClick={() => {updateOrder(order.id, {paymentStatus: 'paid'}); addEvent({orderId: order.id, type: 'payment', title: 'Đã đánh dấu thanh toán', detail: money(order.total)});}}>Thu tiền</button>}</header><dl className="s11-money-list"><div><dt>Tạm tính</dt><dd>{money(order.subtotal)}</dd></div><div><dt>Giảm giá {order.discountCode && `(${order.discountCode})`}</dt><dd>–{money(order.discountAmount)}</dd></div><div><dt>Vận chuyển</dt><dd>{money(order.shippingAmount)}</dd></div><div className="total"><dt>Tổng cộng</dt><dd>{money(order.total)}</dd></div>{refunds.length > 0 && <div className="refund"><dt>Đã hoàn</dt><dd>–{money(refunds.reduce((sum, item) => sum + item.amount, 0))}</dd></div>}</dl></section>
      {!!returns.length && <section className="s11-detail-card"><header><div><RefreshCcw /><span><h3>Hoàn trả</h3><p>{returns.length} yêu cầu</p></span></div></header>{returns.map((item) => <article className="s11-return-record" key={item.id}><div><b>{item.reason}</b><span>{fmt(item.createdAt)} · {item.lineIds.length} sản phẩm</span></div><select value={item.status} onChange={(event) => {const next = store.returns.map((record) => record.id === item.id ? {...record, status: event.target.value as ReturnRecord['status']} : record); commit({...store, returns: next});}}><option value="requested">Đã yêu cầu</option><option value="approved">Đã duyệt</option><option value="received">Đã nhận hàng</option><option value="closed">Đã đóng</option></select></article>)}</section>}
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
const loadSegments = () => {try {const raw = localStorage.getItem(segmentKey); return raw ? JSON.parse(raw) as CustomerSegment[] : defaultSegments;} catch {return defaultSegments;}};
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
  useEffect(() => {if (!firebaseClient.enabled) return; void firebaseClient.read<CustomerSegment[]>('timeforge/customerSegments').then((remote) => {if (remote?.length) {setSegments(remote); localStorage.setItem(segmentKey, JSON.stringify(remote));}});}, []);
  const [editing, setEditing] = useState<CustomerSegment | null | undefined>(undefined);
  const [selected, setSelected] = useState<CustomerSegment | null>(null);
  const [query, setQuery] = useState('');
  const save = (segment: CustomerSegment) => {const next = segments.some((item) => item.id === segment.id) ? segments.map((item) => item.id === segment.id ? segment : item) : [segment, ...segments]; setSegments(next); localStorage.setItem(segmentKey, JSON.stringify(next)); if (firebaseClient.enabled) void firebaseClient.write('timeforge/customerSegments', next); setEditing(undefined);};
  const filtered = segments.filter((segment) => `${segment.name} ${segment.description}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="s11-page"><div className="s11-page-head"><div><small>CUSTOMER SEGMENTS</small><h2>Phân khúc khách hàng</h2><p>Tạo nhóm động dựa trên hành vi mua, giá trị khách hàng và mức độ tương tác.</p></div><button className="s11-primary" onClick={() => setEditing(null)}><Plus />Tạo phân khúc</button></div><section className="s11-index-card"><div className="s11-toolbar"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm phân khúc" /></label></div><div className="s11-segment-grid">{filtered.map((segment) => {const members = membersFor(segment, customers, orders); return <article key={segment.id}><div className="s11-segment-icon"><UserRoundSearch /></div><div><button onClick={() => setSelected(segment)}>{segment.name}</button><p>{segment.description || 'Phân khúc khách hàng động.'}</p><div><Badge tone="info">{members.length} khách hàng</Badge><span>Cập nhật tự động</span></div></div><button className="s11-icon-button" onClick={() => setEditing(segment)}><MoreHorizontal /></button></article>;})}</div></section><AnimatePresence>{editing !== undefined && <SegmentModal segment={editing} close={() => setEditing(undefined)} save={save} />}{selected && <motion.div className="s11-drawer-shell" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} onMouseDown={() => setSelected(null)}><aside className="s11-segment-drawer" onMouseDown={(event) => event.stopPropagation()}><header><div><small>SEGMENT</small><h2>{selected.name}</h2><p>{selected.description}</p></div><button onClick={() => setSelected(null)}><X /></button></header><div className="s11-segment-members">{membersFor(selected, customers, orders).map((customer) => <article key={customer.id}><span>{customer.name.slice(0, 1).toUpperCase()}</span><div><b>{customer.name}</b><small>{customer.email || customer.phone}</small></div><div><b>{money(customer.totalSpent)}</b><small>{customer.ordersCount} đơn</small></div></article>)}</div></aside></motion.div>}</AnimatePresence></div>;
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
