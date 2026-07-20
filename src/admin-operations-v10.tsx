import {zodResolver} from '@hookform/resolvers/zod';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  Archive,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Filter,
  Mail,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  Truck,
  UserRound,
  X,
} from 'lucide-react';
import {useMemo, useState, type ReactNode} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useCommerce} from './context';
import type {
  Customer,
  NewsletterSubscriber,
  Discount,
  DiscountType,
  FulfillmentStatus,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
} from './types';
import {money, uid} from './utils';
import {AdminEmptyState,AdminResourceIntro} from './admin-ui-v25';

const fmt = (value: string) => new Date(value).toLocaleString('vi-VN', {dateStyle: 'short', timeStyle: 'short'});
const orderStatusLabel: Record<OrderStatus, string> = {open: 'Đang mở', confirmed: 'Đã xác nhận', completed: 'Hoàn tất', cancelled: 'Đã hủy'};
const paymentLabel: Record<PaymentStatus, string> = {pending: 'Chờ thanh toán', paid: 'Đã thanh toán', refunded: 'Đã hoàn tiền', failed: 'Thất bại'};
const fulfillmentLabel: Record<FulfillmentStatus, string> = {unfulfilled: 'Chưa xử lý', processing: 'Đang chuẩn bị', fulfilled: 'Đã giao', returned: 'Hoàn trả'};

function ToneBadge({tone = 'neutral', children}: {tone?: 'success' | 'warning' | 'critical' | 'info' | 'neutral'; children: ReactNode}) {
  return <span className={`v10-badge ${tone}`}>{children}</span>;
}

function IndexHeader({title, description, action}: {title: string; description: string; action?: ReactNode}) {
  return <AdminResourceIntro title={title} description={description} actions={action} />;
}

function IndexSearch({value, onChange, placeholder}: {value: string; onChange: (value: string) => void; placeholder: string}) {
  return <label className="v10-index-search"><Search /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function BulkBar({count, children, clear}: {count: number; children: ReactNode; clear: () => void}) {
  if (!count) return null;
  return <div className="v10-bulk-bar"><span><b>{count}</b> mục đã chọn</span><div>{children}</div><button onClick={clear}><X /></button></div>;
}

function EmptyIndex({icon, title, text}: {icon: ReactNode; title: string; text: string}) {
  return <AdminEmptyState icon={icon} title={title} text={text} />;
}

function TableShell<T>({table, empty}: {table: ReturnType<typeof useReactTable<T>>; empty: ReactNode}) {
  const rows = table.getRowModel().rows;
  return <div className="v10-table-shell"><table><thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}</thead><tbody>{rows.length ? rows.map((row) => <tr key={row.id} className={row.getIsSelected() ? 'is-selected' : ''}>{row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>) : <tr><td colSpan={table.getAllColumns().length}>{empty}</td></tr>}</tbody></table></div>;
}

function SavedViewTabs({items, active, setActive}: {items: {id: string; label: string; count: number}[]; active: string; setActive: (id: string) => void}) {
  return <div className="v10-saved-views">{items.map((item) => <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => setActive(item.id)}>{item.label}<span>{item.count}</span></button>)}</div>;
}

function OrderDrawer({order, close}: {order: Order; close: () => void}) {
  const {updateOrder, cancelOrder} = useCommerce();
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="v10-drawer-shell" onClick={close}><aside className="v10-resource-drawer" onClick={(event) => event.stopPropagation()}><header><div><small>ORDER</small><h2>{order.number}</h2><p>{fmt(order.createdAt)}</p></div><div className="v10-drawer-actions"><button onClick={() => setMenuOpen((value) => !value)}><MoreHorizontal /></button><button onClick={close}><X /></button>{menuOpen && <div className="v10-action-menu"><button onClick={() => updateOrder(order.id, {paymentStatus: 'paid'})}><CircleDollarSign />Đánh dấu đã thanh toán</button><button onClick={() => updateOrder(order.id, {fulfillmentStatus: 'fulfilled', status: 'completed'})}><PackageCheck />Đánh dấu đã giao</button><button className="danger" onClick={() => {cancelOrder(order.id); close();}}><Archive />Hủy đơn và hoàn kho</button></div>}</div></header><div className="v10-drawer-body"><section className="v10-order-status-grid"><label><span>Trạng thái đơn</span><select value={order.status} onChange={(event) => updateOrder(order.id, {status: event.target.value as OrderStatus})}>{Object.entries(orderStatusLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label><span>Thanh toán</span><select value={order.paymentStatus} onChange={(event) => updateOrder(order.id, {paymentStatus: event.target.value as PaymentStatus})}>{Object.entries(paymentLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label><span>Giao hàng</span><select value={order.fulfillmentStatus} onChange={(event) => updateOrder(order.id, {fulfillmentStatus: event.target.value as FulfillmentStatus})}>{Object.entries(fulfillmentLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></section><section className="v10-drawer-card"><h3>Sản phẩm</h3>{order.lines.map((line) => <article className="v10-order-line" key={line.id}><img src={line.image} alt="" /><div><b>{line.title}</b><span>{line.variantTitle || line.sku}</span><small>{line.quantity} × {money(line.unitPrice)}</small></div><strong>{money(line.lineTotal)}</strong></article>)}<dl className="v10-order-totals"><div><dt>Tạm tính</dt><dd>{money(order.subtotal)}</dd></div><div><dt>Giảm giá</dt><dd>–{money(order.discountAmount)}</dd></div><div><dt>Vận chuyển</dt><dd>{money(order.shippingAmount)}</dd></div><div className="total"><dt>Tổng cộng</dt><dd>{money(order.total)}</dd></div></dl></section><section className="v10-drawer-grid"><div className="v10-drawer-card"><h3>Khách hàng</h3><p><b>{order.customerName}</b><br />{order.customerEmail}<br />{order.customerPhone}</p></div><div className="v10-drawer-card"><h3>Địa chỉ giao hàng</h3><p>{order.shippingAddress.address1}{order.shippingAddress.address2 ? `, ${order.shippingAddress.address2}` : ''}<br />{order.shippingAddress.ward}, {order.shippingAddress.district}<br />{order.shippingAddress.city}</p></div></section>{order.note && <section className="v10-drawer-card"><h3>Ghi chú</h3><p>{order.note}</p></section>}</div></aside></div>;
}

export function OrdersV10() {
  const {orders, updateOrder, cancelOrder} = useCommerce();
  const [query, setQuery] = useState('');
  const [view, setView] = useState('all');
  const [payment, setPayment] = useState('all');
  const [fulfillment, setFulfillment] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const filtered = useMemo(() => orders.filter((order) => {
    if (view !== 'all' && order.status !== view) return false;
    if (payment !== 'all' && order.paymentStatus !== payment) return false;
    if (fulfillment !== 'all' && order.fulfillmentStatus !== fulfillment) return false;
    return `${order.number} ${order.customerName} ${order.customerEmail} ${order.customerPhone}`.toLowerCase().includes(query.toLowerCase());
  }), [orders, query, view, payment, fulfillment]);
  const column = createColumnHelper<Order>();
  const columns = useMemo(() => [
    column.display({id: 'select', header: ({table}) => <input type="checkbox" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} />, cell: ({row}) => <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} onClick={(event) => event.stopPropagation()} />}),
    column.accessor('number', {header: 'Đơn hàng', cell: ({row, getValue}) => <button className="v10-resource-link" onClick={() => setSelectedOrder(row.original)}>{getValue()}</button>}),
    column.accessor('createdAt', {header: 'Ngày', cell: ({getValue}) => fmt(getValue())}),
    column.accessor('customerName', {header: 'Khách hàng', cell: ({row, getValue}) => <div className="v10-customer-cell"><span>{getValue().slice(0, 1).toUpperCase()}</span><div><b>{getValue()}</b><small>{row.original.customerEmail}</small></div></div>}),
    column.accessor('total', {header: 'Tổng tiền', cell: ({getValue}) => <b>{money(getValue())}</b>}),
    column.accessor('paymentStatus', {header: 'Thanh toán', cell: ({getValue}) => <ToneBadge tone={getValue() === 'paid' ? 'success' : getValue() === 'failed' ? 'critical' : 'warning'}>{paymentLabel[getValue()]}</ToneBadge>}),
    column.accessor('fulfillmentStatus', {header: 'Giao hàng', cell: ({getValue}) => <ToneBadge tone={getValue() === 'fulfilled' ? 'success' : getValue() === 'processing' ? 'info' : 'neutral'}>{fulfillmentLabel[getValue()]}</ToneBadge>}),
    column.accessor('status', {header: 'Trạng thái', cell: ({getValue}) => <ToneBadge tone={getValue() === 'completed' ? 'success' : getValue() === 'cancelled' ? 'critical' : 'info'}>{orderStatusLabel[getValue()]}</ToneBadge>}),
    column.display({id: 'more', cell: ({row}) => <button className="v10-more-button" onClick={() => setSelectedOrder(row.original)}><MoreHorizontal /></button>}),
  ], [column]);
  const table = useReactTable({data: filtered, columns, state: {rowSelection: selection}, onRowSelectionChange: setSelection, enableRowSelection: true, getCoreRowModel: getCoreRowModel(), getRowId: (row) => row.id});
  const selectedIds = Object.keys(selection).filter((id) => selection[id]);
  const views = [
    {id: 'all', label: 'Tất cả', count: orders.length},
    {id: 'open', label: 'Đang mở', count: orders.filter((item) => item.status === 'open').length},
    {id: 'confirmed', label: 'Đã xác nhận', count: orders.filter((item) => item.status === 'confirmed').length},
    {id: 'completed', label: 'Hoàn tất', count: orders.filter((item) => item.status === 'completed').length},
  ];
  const bulkUpdate = (patch: Partial<Order>) => {selectedIds.forEach((id) => updateOrder(id, patch)); setSelection({});};
  return <div className="v10-index-page v25-resource-page"><IndexHeader title="Đơn hàng" description="Theo dõi thanh toán, xử lý và giao hàng trong cùng một workspace." /><section className="v10-index-card v25-resource-surface"><SavedViewTabs items={views} active={view} setActive={setView} /><div className="v10-index-toolbar"><IndexSearch value={query} onChange={setQuery} placeholder="Tìm mã đơn, tên, email hoặc số điện thoại" /><div className="v10-filter-wrap"><button className={payment !== 'all' || fulfillment !== 'all' ? 'active' : ''} onClick={() => setFiltersOpen((value) => !value)}><SlidersHorizontal />Bộ lọc<ChevronDown /></button>{filtersOpen && <div className="v10-filter-popover"><label><span>Thanh toán</span><select value={payment} onChange={(event) => setPayment(event.target.value)}><option value="all">Tất cả</option>{Object.entries(paymentLabel).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label><label><span>Giao hàng</span><select value={fulfillment} onChange={(event) => setFulfillment(event.target.value)}><option value="all">Tất cả</option>{Object.entries(fulfillmentLabel).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label><button onClick={() => {setPayment('all'); setFulfillment('all');}}>Xóa bộ lọc</button></div>}</div></div><TableShell table={table} empty={<EmptyIndex icon={<PackageCheck />} title="Không có đơn hàng phù hợp" text="Thử thay đổi chế độ xem hoặc xóa bộ lọc hiện tại." />} /></section><BulkBar count={selectedIds.length} clear={() => setSelection({})}><button onClick={() => bulkUpdate({status: 'confirmed'})}><Check />Xác nhận</button><button onClick={() => bulkUpdate({paymentStatus: 'paid'})}><CircleDollarSign />Đã thanh toán</button><button onClick={() => bulkUpdate({fulfillmentStatus: 'fulfilled', status: 'completed'})}><Truck />Đã giao</button><button className="danger" onClick={() => {selectedIds.forEach(cancelOrder); setSelection({});}}><Archive />Hủy đơn</button></BulkBar>{selectedOrder && <OrderDrawer order={orders.find((item) => item.id === selectedOrder.id) || selectedOrder} close={() => setSelectedOrder(null)} />}</div>;
}

function CustomerDrawer({customer, close}: {customer: Customer; close: () => void}) {
  const {orders, saveCustomer} = useCommerce();
  const [note, setNote] = useState('');
  const customerOrders = orders.filter((order) => order.customerId === customer.id);
  return <div className="v10-drawer-shell" onClick={close}><aside className="v10-resource-drawer" onClick={(event) => event.stopPropagation()}><header><div><small>CUSTOMER</small><h2>{customer.name}</h2><p>Khách từ {new Date(customer.createdAt).toLocaleDateString('vi-VN')}</p></div><button onClick={close}><X /></button></header><div className="v10-drawer-body"><section className="v10-customer-metrics"><div><span>Đơn hàng</span><b>{customer.ordersCount}</b></div><div><span>Đã chi</span><b>{money(customer.totalSpent)}</b></div><div><span>Giá trị TB</span><b>{money(customer.totalSpent / Math.max(1, customer.ordersCount))}</b></div></section><section className="v10-drawer-grid"><div className="v10-drawer-card"><h3>Liên hệ</h3><p>{customer.email}<br />{customer.phone}</p><label className="v10-toggle-row"><span>Nhận email marketing</span><input type="checkbox" checked={Boolean(customer.acceptsMarketing)} onChange={(event) => saveCustomer({...customer, acceptsMarketing: event.target.checked})} /></label></div><div className="v10-drawer-card"><h3>Địa chỉ mặc định</h3>{customer.addresses?.[0] ? <p>{customer.addresses[0].address1}<br />{customer.addresses[0].district}, {customer.addresses[0].city}</p> : <p>Chưa có địa chỉ.</p>}</div></section><section className="v10-drawer-card"><h3>Dòng thời gian</h3><div className="v10-timeline">{customerOrders.map((order) => <article key={order.id}><span><PackageCheck /></span><div><b>Đặt đơn {order.number}</b><p>{money(order.total)} · {fmt(order.createdAt)}</p></div></article>)}{(customer.notes || []).map((item) => <article key={item.id}><span><Mail /></span><div><b>Ghi chú nội bộ</b><p>{item.text} · {fmt(item.createdAt)}</p></div></article>)}</div><div className="v10-add-note"><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Thêm ghi chú nội bộ..." /><button disabled={!note.trim()} onClick={() => {saveCustomer({...customer, notes: [{id: uid('note'), createdAt: new Date().toISOString(), text: note}, ...(customer.notes || [])]}); setNote('');}}>Thêm ghi chú</button></div></section></div></aside></div>;
}

export function CustomersV10() {
  const {customers, saveCustomer, newsletterSubscribers, updateNewsletterSubscriber, deleteNewsletterSubscriber} = useCommerce();
  const [query, setQuery] = useState('');
  const [view, setView] = useState('all');
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [selected, setSelected] = useState<Customer | null>(null);
  const filtered = useMemo(() => customers.filter((customer) => {
    if (view === 'newsletter') return false;
    if (view === 'marketing' && !customer.acceptsMarketing) return false;
    if (view === 'repeat' && customer.ordersCount < 2) return false;
    if (view === 'high-value' && customer.totalSpent < 10_000_000) return false;
    return `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(query.toLowerCase());
  }), [customers, query, view]);
  const column = createColumnHelper<Customer>();
  const columns = useMemo(() => [
    column.display({id: 'select', header: ({table}) => <input type="checkbox" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} />, cell: ({row}) => <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} onClick={(event) => event.stopPropagation()} />}),
    column.accessor('name', {header: 'Khách hàng', cell: ({row, getValue}) => <button className="v10-customer-cell v10-customer-button" onClick={() => setSelected(row.original)}><span>{getValue().slice(0, 1).toUpperCase()}</span><div><b>{getValue()}</b><small>{row.original.email}</small></div></button>}),
    column.accessor('phone', {header: 'Số điện thoại'}),
    column.accessor('ordersCount', {header: 'Đơn hàng', cell: ({getValue}) => <b>{getValue()}</b>}),
    column.accessor('totalSpent', {header: 'Đã chi', cell: ({getValue}) => <b>{money(getValue())}</b>}),
    column.display({id: 'aov', header: 'Giá trị TB', cell: ({row}) => money(row.original.totalSpent / Math.max(1, row.original.ordersCount))}),
    column.accessor('acceptsMarketing', {header: 'Marketing', cell: ({getValue}) => <ToneBadge tone={getValue() ? 'success' : 'neutral'}>{getValue() ? 'Đã đăng ký' : 'Chưa đăng ký'}</ToneBadge>}),
    column.display({id: 'more', cell: ({row}) => <button className="v10-more-button" onClick={() => setSelected(row.original)}><MoreHorizontal /></button>}),
  ], [column]);
  const table = useReactTable({data: filtered, columns, state: {rowSelection: selection}, onRowSelectionChange: setSelection, enableRowSelection: true, getCoreRowModel: getCoreRowModel(), getRowId: (row) => row.id});
  const ids = Object.keys(selection).filter((id) => selection[id]);
  const views = [
    {id: 'all', label: 'Tất cả', count: customers.length},
    {id: 'repeat', label: 'Khách quay lại', count: customers.filter((item) => item.ordersCount >= 2).length},
    {id: 'high-value', label: 'Giá trị cao', count: customers.filter((item) => item.totalSpent >= 10_000_000).length},
    {id: 'marketing', label: 'Email marketing', count: customers.filter((item) => item.acceptsMarketing).length},
    {id: 'newsletter', label: 'Người đăng ký email', count: newsletterSubscribers.filter((item) => item.status === 'active').length},
  ];
  const updateMarketing = (value: boolean) => {ids.forEach((id) => {const customer = customers.find((item) => item.id === id); if (customer) saveCustomer({...customer, acceptsMarketing: value});}); setSelection({});};
  const filteredSubscribers = useMemo(() => newsletterSubscribers.filter((item) => item.email.toLowerCase().includes(query.toLowerCase())), [newsletterSubscribers, query]);
  const exportSubscribers = () => {const rows = [['Email','Trạng thái','Nguồn','Ngày đăng ký'], ...filteredSubscribers.map((item) => [item.email, item.status === 'active' ? 'Đang nhận tin' : 'Đã hủy', item.source, new Date(item.createdAt).toLocaleString('vi-VN')])];const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'});const url = URL.createObjectURL(blob);const anchor = document.createElement('a');anchor.href=url;anchor.download=`timeforge-newsletter-${new Date().toISOString().slice(0,10)}.csv`;anchor.click();URL.revokeObjectURL(url);};
  return <div className="v10-index-page v25-resource-page"><IndexHeader title="Khách hàng" description="Tìm hiểu lịch sử mua hàng, giá trị và danh sách đăng ký marketing." /><section className="v10-index-card v25-resource-surface"><SavedViewTabs items={views} active={view} setActive={(next) => {setView(next); setSelection({});}} /><div className="v10-index-toolbar"><IndexSearch value={query} onChange={setQuery} placeholder={view === 'newsletter' ? 'Tìm email đăng ký' : 'Tìm tên, email hoặc số điện thoại'} />{view === 'newsletter' && <button className="v10-secondary-button v34-export-newsletter" onClick={exportSubscribers}><Mail />Xuất CSV</button>}</div>{view === 'newsletter' ? <div className="v34-newsletter-admin"><div className="v34-newsletter-summary"><div><span>Đang nhận tin</span><b>{newsletterSubscribers.filter((item) => item.status === 'active').length}</b></div><div><span>Đã hủy đăng ký</span><b>{newsletterSubscribers.filter((item) => item.status === 'unsubscribed').length}</b></div><div><span>Tổng email</span><b>{newsletterSubscribers.length}</b></div></div><div className="v10-table-shell"><table><thead><tr><th>Email</th><th>Trạng thái</th><th>Nguồn</th><th>Ngày đăng ký</th><th /></tr></thead><tbody>{filteredSubscribers.length ? filteredSubscribers.map((item: NewsletterSubscriber) => <tr key={item.id}><td><div className="v34-subscriber-email"><span><Mail /></span><div><b>{item.email}</b><small>ID {item.id.slice(-8)}</small></div></div></td><td><ToneBadge tone={item.status === 'active' ? 'success' : 'neutral'}>{item.status === 'active' ? 'Đang nhận tin' : 'Đã hủy'}</ToneBadge></td><td><span className="v34-source-pill">{item.source}</span></td><td>{fmt(item.createdAt)}</td><td><div className="v34-subscriber-actions"><button title={item.status === 'active' ? 'Hủy đăng ký' : 'Kích hoạt lại'} onClick={() => updateNewsletterSubscriber(item.id,{status:item.status === 'active' ? 'unsubscribed' : 'active'})}>{item.status === 'active' ? <X /> : <CheckCircle2 />}</button><button className="danger" title="Xóa" onClick={() => {if(confirm(`Xóa ${item.email} khỏi danh sách?`)) deleteNewsletterSubscriber(item.id)}}><Trash2 /></button></div></td></tr>) : <tr><td colSpan={5}><EmptyIndex icon={<Mail />} title="Chưa có email đăng ký" text="Email từ footer, trang chủ và popup sẽ xuất hiện tại đây." /></td></tr>}</tbody></table></div></div> : <TableShell table={table} empty={<EmptyIndex icon={<UserRound />} title="Chưa tìm thấy khách hàng" text="Thử thay đổi từ khóa hoặc chế độ xem." />} />}</section>{view !== 'newsletter' && <BulkBar count={ids.length} clear={() => setSelection({})}><button onClick={() => updateMarketing(true)}><Mail />Thêm marketing</button><button onClick={() => updateMarketing(false)}><X />Gỡ marketing</button></BulkBar>}{selected && <CustomerDrawer customer={customers.find((item) => item.id === selected.id) || selected} close={() => setSelected(null)} />}</div>;
}

export function InventoryV10() {
  const {products, adjustments, adjustInventory} = useCommerce();
  const [query, setQuery] = useState('');
  const [view, setView] = useState('all');
  const [editing, setEditing] = useState<{product: Product; variantId: string; delta: number; note: string} | null>(null);
  const inventoryRows = useMemo(() => products.flatMap((product) => product.variants.length ? product.variants.map((variant) => ({product, variantId: variant.id, title: variant.title, sku: variant.sku || product.sku, inventory: variant.inventory, price: variant.price || product.price})) : [{product, variantId: '', title: 'Mặc định', sku: product.sku, inventory: product.inventory, price: product.price}]), [products]);
  const filtered = inventoryRows.filter((item) => {
    if (view === 'low' && (item.inventory <= 0 || item.inventory > 5)) return false;
    if (view === 'out' && item.inventory > 0) return false;
    if (view === 'available' && item.inventory <= 0) return false;
    return `${item.product.title} ${item.sku} ${item.title}`.toLowerCase().includes(query.toLowerCase());
  });
  const totalUnits = inventoryRows.reduce((sum, item) => sum + item.inventory, 0);
  const totalValue = inventoryRows.reduce((sum, item) => sum + item.inventory * item.price, 0);
  return <div className="v10-index-page v25-resource-page"><IndexHeader title="Tồn kho" description="Theo dõi số lượng theo variant và xử lý sai lệch kiểm kê." /><section className="v10-inventory-metrics"><div><span>Tổng sản phẩm có sẵn</span><b>{totalUnits}</b><small>Đơn vị trong kho</small></div><div><span>Giá trị tồn kho</span><b>{money(totalValue)}</b><small>Theo giá bán hiện tại</small></div><div><span>Sắp hết hàng</span><b>{inventoryRows.filter((item) => item.inventory > 0 && item.inventory <= 5).length}</b><small>Cần theo dõi</small></div><div><span>Hết hàng</span><b>{inventoryRows.filter((item) => item.inventory <= 0).length}</b><small>Không thể bán</small></div></section><section className="v10-index-card v25-resource-surface"><SavedViewTabs items={[{id: 'all', label: 'Tất cả', count: inventoryRows.length}, {id: 'available', label: 'Còn hàng', count: inventoryRows.filter((item) => item.inventory > 0).length}, {id: 'low', label: 'Sắp hết', count: inventoryRows.filter((item) => item.inventory > 0 && item.inventory <= 5).length}, {id: 'out', label: 'Hết hàng', count: inventoryRows.filter((item) => item.inventory <= 0).length}]} active={view} setActive={setView} /><div className="v10-index-toolbar"><IndexSearch value={query} onChange={setQuery} placeholder="Tìm sản phẩm, variant hoặc SKU" /></div><div className="v10-table-shell"><table><thead><tr><th>Sản phẩm</th><th>Variant</th><th>SKU</th><th>Có sẵn</th><th>Giá trị tồn</th><th /></tr></thead><tbody>{filtered.map((item) => <tr key={`${item.product.id}-${item.variantId}`}><td><div className="v10-product-cell"><img src={item.product.images[0]} alt="" /><div><b>{item.product.title}</b><small>{item.product.vendor}</small></div></div></td><td>{item.title}</td><td>{item.sku || '—'}</td><td><div className={`v10-inventory-level ${item.inventory <= 0 ? 'out' : item.inventory <= 5 ? 'low' : ''}`}><i />{item.inventory}</div></td><td>{money(item.inventory * item.price)}</td><td><button className="v10-secondary-button" onClick={() => setEditing({product: item.product, variantId: item.variantId, delta: 0, note: ''})}>Điều chỉnh</button></td></tr>)}</tbody></table></div></section><section className="v10-history-card"><IndexHeader title="Lịch sử điều chỉnh" description="30 thay đổi tồn kho gần nhất." /><div>{adjustments.slice(0, 30).map((item) => <article key={item.id}><span className={item.delta > 0 ? 'positive' : 'negative'}>{item.delta > 0 ? '+' : ''}{item.delta}</span><div><b>{item.productTitle}</b><p>{item.sku || 'Chưa SKU'} · {item.note}</p></div><div><b>{item.before} → {item.after}</b><small>{fmt(item.createdAt)}</small></div></article>)}</div></section>{editing && <div className="v10-modal-shell" onClick={() => setEditing(null)}><form className="v10-modal" onClick={(event) => event.stopPropagation()} onSubmit={(event) => {event.preventDefault(); adjustInventory(editing.product.id, editing.variantId, editing.delta, editing.note); setEditing(null);}}><header><div><small>ADJUST INVENTORY</small><h2>{editing.product.title}</h2></div><button type="button" onClick={() => setEditing(null)}><X /></button></header><label><span>Số lượng thay đổi</span><input autoFocus type="number" value={editing.delta || ''} onChange={(event) => setEditing({...editing, delta: Number(event.target.value)})} placeholder="Ví dụ: 5 hoặc -2" /></label><label><span>Lý do</span><textarea value={editing.note} onChange={(event) => setEditing({...editing, note: event.target.value})} placeholder="Nhập kho, kiểm kê, sửa sai lệch..." /></label><footer><button type="button" onClick={() => setEditing(null)}>Hủy</button><button className="primary" disabled={!editing.delta}>Lưu điều chỉnh</button></footer></form></div>}</div>;
}

const discountSchema = z.object({
  code: z.string().min(2, 'Nhập mã giảm giá'),
  title: z.string().min(2, 'Nhập tên nội bộ'),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
  value: z.coerce.number().min(0),
  minimumSubtotal: z.coerce.number().min(0),
  usageLimit: z.coerce.number().min(0),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  active: z.boolean(),
});
type DiscountFormInput = z.input<typeof discountSchema>;
type DiscountForm = z.output<typeof discountSchema>;

function DiscountModal({discount, close}: {discount: Discount | null; close: () => void}) {
  const {discounts, saveDiscount, deleteDiscount} = useCommerce();
  const existing = discount ? discounts.some((item) => item.id === discount.id) : false;
  const {register, handleSubmit, watch, formState: {errors}} = useForm<DiscountFormInput, unknown, DiscountForm>({resolver: zodResolver(discountSchema), defaultValues: discount ? {...discount, startsAt: discount.startsAt.slice(0, 16), endsAt: discount.endsAt.slice(0, 16)} : {code: '', title: '', type: 'percentage', value: 10, minimumSubtotal: 0, usageLimit: 0, startsAt: new Date().toISOString().slice(0, 16), endsAt: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 16), active: true}});
  const type = watch('type');
  const submit = (values: DiscountForm) => {saveDiscount({id: discount?.id || uid('discount'), code: values.code.trim().toUpperCase(), title: values.title, type: values.type as DiscountType, value: values.value, minimumSubtotal: values.minimumSubtotal, usageLimit: values.usageLimit, usageCount: discount?.usageCount || 0, startsAt: new Date(values.startsAt).toISOString(), endsAt: new Date(values.endsAt).toISOString(), active: values.active, createdAt: discount?.createdAt || new Date().toISOString()}); close();};
  return <div className="v10-modal-shell" onClick={close}><form className="v10-modal v10-discount-modal" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit(submit)}><header><div><small>DISCOUNT</small><h2>{discount?.code || 'Tạo mã giảm giá'}</h2></div><button type="button" onClick={close}><X /></button></header><div className="v10-form-grid"><label><span>Mã giảm giá</span><input {...register('code')} onInput={(event) => {event.currentTarget.value = event.currentTarget.value.toUpperCase().replace(/\s/g, '');}} />{errors.code && <small>{errors.code.message}</small>}</label><label><span>Tên nội bộ</span><input {...register('title')} />{errors.title && <small>{errors.title.message}</small>}</label><label><span>Loại ưu đãi</span><select {...register('type')}><option value="percentage">Phần trăm</option><option value="fixed_amount">Số tiền cố định</option><option value="free_shipping">Miễn phí vận chuyển</option></select></label>{type !== 'free_shipping' && <label><span>Giá trị</span><input type="number" {...register('value')} /></label>}<label><span>Đơn hàng tối thiểu</span><input type="number" {...register('minimumSubtotal')} /></label><label><span>Giới hạn lượt dùng</span><input type="number" {...register('usageLimit')} /></label><label><span>Bắt đầu</span><input type="datetime-local" {...register('startsAt')} /></label><label><span>Kết thúc</span><input type="datetime-local" {...register('endsAt')} /></label></div><label className="v10-toggle-row"><span><b>Kích hoạt mã</b><small>Khách có thể áp dụng mã trong thời gian hiệu lực.</small></span><input type="checkbox" {...register('active')} /></label><footer>{existing && <button type="button" className="danger" onClick={() => {if (discount && confirm('Xóa mã giảm giá này?')) {deleteDiscount(discount.id); close();}}}><Trash2 />Xóa</button>}<span /><button type="button" onClick={close}>Hủy</button><button className="primary">Lưu mã giảm giá</button></footer></form></div>;
}

export function DiscountsV10() {
  const {discounts, saveDiscount} = useCommerce();
  const [query, setQuery] = useState('');
  const [view, setView] = useState('all');
  const [editing, setEditing] = useState<Discount | null | undefined>(undefined);
  const filtered = discounts.filter((item) => {
    if (view === 'active' && !item.active) return false;
    if (view === 'inactive' && item.active) return false;
    if (view === 'expired' && new Date(item.endsAt).getTime() >= Date.now()) return false;
    return `${item.code} ${item.title}`.toLowerCase().includes(query.toLowerCase());
  });
  return <div className="v10-index-page v25-resource-page"><IndexHeader title="Giảm giá" description="Quản lý mã khuyến mãi, điều kiện áp dụng và giới hạn sử dụng." action={<button className="v10-primary-button" onClick={() => setEditing(null)}><Plus />Tạo mã giảm giá</button>} /><section className="v10-index-card v25-resource-surface"><SavedViewTabs items={[{id: 'all', label: 'Tất cả', count: discounts.length}, {id: 'active', label: 'Đang hoạt động', count: discounts.filter((item) => item.active).length}, {id: 'inactive', label: 'Đã tắt', count: discounts.filter((item) => !item.active).length}, {id: 'expired', label: 'Hết hạn', count: discounts.filter((item) => new Date(item.endsAt).getTime() < Date.now()).length}]} active={view} setActive={setView} /><div className="v10-index-toolbar"><IndexSearch value={query} onChange={setQuery} placeholder="Tìm mã hoặc tên ưu đãi" /></div><div className="v10-discount-list">{filtered.map((item) => <article key={item.id}><div className="v10-discount-icon"><Tag /></div><div><button onClick={() => setEditing(item)}>{item.code}</button><p>{item.title}</p><small>{item.type === 'percentage' ? `${item.value}%` : item.type === 'fixed_amount' ? money(item.value) : 'Miễn phí vận chuyển'} · Đơn từ {money(item.minimumSubtotal)}</small></div><div><b>{item.usageCount}{item.usageLimit ? ` / ${item.usageLimit}` : ''}</b><small>Lượt sử dụng</small></div><ToneBadge tone={item.active ? 'success' : 'neutral'}>{item.active ? 'Đang hoạt động' : 'Đã tắt'}</ToneBadge><button className="v10-more-button" onClick={() => setEditing(item)}><MoreHorizontal /></button></article>)}{!filtered.length && <EmptyIndex icon={<Tag />} title="Không có mã giảm giá" text="Tạo mã mới hoặc thay đổi chế độ xem hiện tại." />}</div></section>{editing !== undefined && <DiscountModal discount={editing} close={() => setEditing(undefined)} />}</div>;
}
