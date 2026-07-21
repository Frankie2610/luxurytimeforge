import {
  AppWindow, ArrowLeft, Check, ChevronDown, ChevronRight, Copy, Eye, EyeOff,
  GripVertical, History, Home, Image as ImageIcon, Laptop, LayoutPanelLeft,
  LayoutTemplate, Menu, Monitor, MoreHorizontal, Palette, PanelLeftClose,
  PanelLeftOpen, Plus, Redo2, Search, Settings2, ShoppingBag, Smartphone,
  Sparkles, Tag, Trash2, Undo2, X, RefreshCw, Maximize2,
  Images, MessageSquareQuote, CircleHelp, Timer, Type, Paintbrush, Layers3, Download, FileUp,
} from 'lucide-react';
import {
  DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {toast} from 'sonner';
import {useCommerce} from './context';
import {OnlineStoreV18} from './online-store-v18';
import {
  allowedBlocks, allowedSections, blockLabels, createSection, migrateTheme, sectionLabels,
  templateLabels,
} from './theme';
import type {
  BlockType, Section, SectionType, TemplateKey, Theme, ThemeBlock,
} from './types';
import {readThemeExtrasV23, saveThemeExtrasV23, type ThemeExtrasV23} from './theme-extras-v23';
import {ResourcePicker} from './resource-picker';
import {writeThemePreviewExtrasV26, writeThemePreviewV26} from './theme-preview-v26';
import './v499-theme-editor.css';
import {uid} from './utils';
import {
  Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from './ui';

type EditorMode = 'sections' | 'settings' | 'apps';
type Device = 'desktop' | 'tablet' | 'mobile';
type VirtualNode = 'countdown' | 'announcement' | 'header' | 'cartDrawer' | 'newsletterPopup' | 'privacyBanner' | 'footer';
type Selection = {kind: 'virtual'; id: VirtualNode} | {kind: 'section'; sectionId: string} | {kind: 'block'; sectionId: string; blockId: string};
type EditorExtras = ThemeExtrasV23;
const readExtras = readThemeExtrasV23;
const clone = <T,>(value: T): T => structuredClone(value);
const labelSetting = (key: string) => ({
  image: 'Hình ảnh', height: 'Chiều cao', overlay: 'Độ phủ nền', alignment: 'Căn nội dung',
  title: 'Tiêu đề', text: 'Nội dung', eyebrow: 'Nhãn nhỏ', label: 'Nhãn nút', link: 'Đường dẫn',
  style: 'Kiểu hiển thị', columns: 'Số cột', limit: 'Số lượng', layout: 'Bố cục',
  imagePosition: 'Vị trí hình ảnh', background: 'Màu nền', gallerySize: 'Kích thước thư viện ảnh',
  stickyInfo: 'Cố định thông tin mua', thumbnailPosition: 'Vị trí ảnh nhỏ', showBreadcrumb: 'Hiện đường dẫn',
  showVendor: 'Hiện thương hiệu', showSku: 'Hiện SKU', showStock: 'Hiện tồn kho', showCompare: 'Hiện giá so sánh',
  showDiscount: 'Hiện phần trăm giảm', showAddToCart: 'Hiện nút thêm vào giỏ', showBuyNow: 'Hiện nút mua ngay', showWishlist: 'Hiện yêu thích',
  source: 'Nguồn nội dung', open: 'Mở mặc định', showImage: 'Hiện hình ảnh', showFilter: 'Hiện bộ lọc',
  showSort: 'Hiện sắp xếp', showCount: 'Hiện số lượng', pageSize: 'Sản phẩm mỗi trang', width: 'Độ rộng',
  icon: 'Biểu tượng', collectionHandle: 'Bộ sưu tập', showSuggestions: 'Hiện gợi ý',
  showCoupon: 'Hiện mã giảm giá', showShippingEstimate: 'Ước tính vận chuyển', showTrust: 'Hiện cam kết',
  description: 'Mô tả', colorScheme: 'Phối màu chữ', videoUrl: 'URL video', poster: 'Ảnh bìa video', endDate: 'Thời điểm kết thúc', aspect: 'Tỷ lệ hình ảnh', alt: 'Mô tả hình ảnh',
  textOnDark: 'Chữ trên nền tối', cardRadius: 'Bo góc card', buttonRadius: 'Bo góc nút', sectionSpacing: 'Khoảng cách section', headingScale: 'Tỷ lệ tiêu đề', headingWeight: 'Độ đậm tiêu đề', bodyWeight: 'Độ đậm nội dung', motion: 'Hiệu ứng chuyển động',
}[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()));

const sectionIcon = (type: SectionType) => {
  if (type === 'hero' || type === 'collectionBanner' || type === 'imageText') return <ImageIcon/>;
  if (type === 'gallery') return <Images/>;
  if (type === 'testimonials') return <MessageSquareQuote/>;
  if (type === 'faq') return <CircleHelp/>;
  if (type === 'countdownBanner') return <Timer/>;
  if (type === 'products' || type === 'productRecommendations' || type === 'collectionGrid') return <ShoppingBag/>;
  if (type === 'collections' || type === 'logoList') return <LayoutTemplate/>;
  if (type === 'newsletter') return <Sparkles/>;
  return <LayoutPanelLeft/>;
};
const blockIcon = (type: BlockType) => type === 'image' ? <ImageIcon/> : type === 'button' ? <Tag/> : type === 'group' ? <LayoutTemplate/> : <LayoutPanelLeft/>;
const sectionDescriptions: Partial<Record<SectionType, string>> = {
  hero: 'Banner lớn với ảnh, tiêu đề và nút hành động.', trust: 'Các cam kết chính của cửa hàng.', collections: 'Hiển thị những bộ sưu tập nổi bật.',
  products: 'Lưới sản phẩm theo bộ sưu tập.', bestSellers: 'Sản phẩm bán chạy dựa trên đơn hàng.', blogPosts: 'Bài viết mới trong TimeForge Journal.',
  imageText: 'Ảnh lớn đi cùng nội dung biên tập.', richText: 'Khối chữ ngắn cho giới thiệu hoặc thông báo.', newsletter: 'Form đăng ký nhận tin.',
  multicolumn: 'Nội dung dịch vụ theo nhiều cột.', video: 'Video hoặc ảnh bìa có nội dung phủ.', testimonials: 'Đánh giá và trải nghiệm khách hàng.',
  faq: 'Danh sách câu hỏi có thể mở rộng.', logoList: 'Tên thương hiệu hoặc đối tác.', gallery: 'Thư viện ảnh theo lưới.', countdownBanner: 'Banner ưu đãi có đồng hồ đếm ngược.',
  productMain: 'Thông tin, giá, biến thể và nút mua.', productRecommendations: 'Sản phẩm gợi ý liên quan.', collectionBanner: 'Banner đầu trang bộ sưu tập.',
  collectionGrid: 'Bộ lọc và danh sách sản phẩm.', searchResults: 'Kết quả tìm kiếm.', cartMain: 'Nội dung giỏ hàng.', pageContent: 'Nội dung chính của trang.',
};
const sectionCategory = (type: SectionType) => ['products','bestSellers','productRecommendations','collectionGrid','collections'].includes(type) ? 'Sản phẩm' : ['hero','imageText','video','gallery','collectionBanner'].includes(type) ? 'Hình ảnh' : ['testimonials','faq','logoList','multicolumn','trust'].includes(type) ? 'Nội dung' : 'Tiện ích';

function regenerateBlockIds(block: ThemeBlock): ThemeBlock {
  const next={...clone(block),id:uid('b')};
  return block.children?{...next,children:block.children.map(regenerateBlockIds)}:next;
}
function findBlock(items: ThemeBlock[], id: string): ThemeBlock | undefined {
  for (const item of items) {if (item.id === id) return item; const nested = findBlock(item.children || [], id); if (nested) return nested;}
}
function patchBlockTree(items: ThemeBlock[], id: string, patch: Partial<ThemeBlock>): ThemeBlock[] {
  return items.map((item) => item.id === id ? {...item, ...patch} : item.children?.length ? {...item, children: patchBlockTree(item.children, id, patch)} : item);
}
function removeBlockTree(items: ThemeBlock[], id: string): {items: ThemeBlock[]; removed?: ThemeBlock} {
  let removed: ThemeBlock | undefined;
  const next = items.filter((item) => {if (item.id === id) {removed = item; return false;} return true;}).map((item) => {
    if (!item.children?.length) return item;
    const result = removeBlockTree(item.children, id);
    if (result.removed) removed = result.removed;
    return {...item, children: result.items};
  });
  return {items: next, removed};
}
function blockLocation(items: ThemeBlock[], id: string, parentId: string | null = null): {parentId: string | null; index: number; block: ThemeBlock} | undefined {
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (item.id === id) return {parentId, index, block: item};
    const nested = blockLocation(item.children || [], id, item.id);
    if (nested) return nested;
  }
}
function insertBlock(items: ThemeBlock[], parentId: string | null, index: number, block: ThemeBlock): ThemeBlock[] {
  if (!parentId) {const next = [...items]; next.splice(Math.max(0, Math.min(index, next.length)), 0, block); return next;}
  return items.map((item) => item.id === parentId ? {...item, children: insertBlock(item.children || [], null, index, block)} : item.children?.length ? {...item, children: insertBlock(item.children, parentId, index, block)} : item);
}
function moveBlock(items: ThemeBlock[], activeId: string, overId: string): ThemeBlock[] {
  const active = blockLocation(items, activeId); const over = blockLocation(items, overId);
  if (!active || !over || activeId === overId) return items;
  const removed = removeBlockTree(items, activeId); if (!removed.removed) return items;
  let parentId = over.block.type === 'group' ? over.block.id : over.parentId;
  let index = over.block.type === 'group' ? (over.block.children?.length || 0) : over.index;
  if (active.parentId === parentId && active.index < index) index -= 1;
  return insertBlock(removed.items, parentId, index, removed.removed);
}

function SettingField({name, label, value, onChange}: {name: string; label?: string; value: string | number | boolean; onChange: (value: string | number | boolean) => void}) {
  const fieldLabel = label || labelSetting(name);
  const selectOptions: Partial<Record<string, Array<[string, string]>>> = {
    alignment: [['left', 'Trái'], ['center', 'Giữa'], ['right', 'Phải']],
    colorScheme: [['light', 'Chữ tối'], ['dark', 'Chữ sáng']],
    background: [['transparent', 'Trong suốt'], ['light', 'Sáng'], ['dark', 'Tối']],
    imagePosition: [['left', 'Hình bên trái'], ['right', 'Hình bên phải']],
    width: [['narrow', 'Hẹp'], ['medium', 'Vừa'], ['wide', 'Rộng']],
    gallerySize: [['small', 'Nhỏ'], ['medium', 'Vừa'], ['large', 'Lớn']],
    thumbnailPosition: [['left', 'Bên trái'], ['bottom', 'Bên dưới']],
    style: [['primary', 'Chính'], ['secondary', 'Phụ'], ['link', 'Liên kết'], ['buttons', 'Dạng nút']],
    layout: [['cards', 'Card'], ['editorial', 'Biên tập'], ['stack', 'Xếp dọc']],
    source: [['description', 'Mô tả'], ['shipping', 'Giao hàng'], ['warranty', 'Bảo hành']],
    icon: [['shield', 'Khiên'], ['truck', 'Xe giao hàng'], ['clock', 'Đồng hồ'], ['quote', 'Trích dẫn']],
    aspect: [['portrait', 'Dọc'], ['square', 'Vuông'], ['landscape', 'Ngang']],
    motion: [['none', 'Không chuyển động'], ['subtle', 'Nhẹ nhàng'], ['expressive', 'Nổi bật']],
  };
  const rangeConfig: Partial<Record<string, {min: number; max: number; step: number; suffix?: string}>> = {
    height: {min: 280, max: 900, step: 10, suffix: 'px'}, overlay: {min: 0, max: 90, step: 1, suffix: '%'},
    columns: {min: 1, max: 6, step: 1}, limit: {min: 1, max: 24, step: 1}, pageSize: {min: 50, max: 100, step: 10},
    radius: {min: 0, max: 36, step: 1, suffix: 'px'}, cardRadius: {min: 0, max: 36, step: 1, suffix: 'px'},
    buttonRadius: {min: 0, max: 999, step: 1, suffix: 'px'}, contentWidth: {min: 960, max: 1680, step: 20, suffix: 'px'},
    sectionSpacing: {min: 32, max: 140, step: 4, suffix: 'px'}, headingScale: {min: 80, max: 125, step: 1, suffix: '%'},
    headingWeight: {min: 400, max: 700, step: 100}, bodyWeight: {min: 300, max: 600, step: 100},
  };
  const imageField = ['image', 'poster', 'logoImage'].includes(name);
  if (typeof value === 'boolean') return <label className="v19-switch"><span>{fieldLabel}</span><button type="button" role="switch" aria-checked={value} className={value ? 'on' : ''} onClick={() => onChange(!value)}><i/></button></label>;
  if (typeof value === 'number') {
    const config = rangeConfig[name];
    if (config) return <label className="v19-field v27-range-field"><span>{fieldLabel}<b>{value}{config.suffix || ''}</b></span><input type="range" min={config.min} max={config.max} step={config.step} value={value} onChange={event => onChange(Number(event.target.value))}/><div className="v19-number"><input type="number" min={config.min} max={config.max} step={config.step} value={value} onChange={event => onChange(Number(event.target.value))}/></div></label>;
    return <label className="v19-field"><span>{fieldLabel}</span><div className="v19-number"><input type="number" value={value} onChange={event => onChange(Number(event.target.value))}/></div></label>;
  }
  if (selectOptions[name]) return <label className="v19-field"><span>{fieldLabel}</span><select value={value} onChange={event => onChange(event.target.value)}>{selectOptions[name]!.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
  if (name === 'endDate') return <label className="v19-field"><span>{fieldLabel}</span><input type="datetime-local" value={value} onChange={event => onChange(event.target.value)}/></label>;
  const long = value.length > 70 || ['text', 'description'].includes(name);
  if (name.toLowerCase().includes('color') || /^#[0-9a-f]{6}$/i.test(value)) return <label className="v19-field"><span>{fieldLabel}</span><div className="v19-color"><input type="color" value={value} onChange={event => onChange(event.target.value)}/><input value={value} onChange={event => onChange(event.target.value)}/></div></label>;
  if (imageField) return <label className="v19-field v27-media-field"><span>{fieldLabel}</span>{value && <img src={value} alt="Xem trước ảnh CDN" loading="lazy" decoding="async"/>}<div><input type="url" inputMode="url" value={value} onChange={event => onChange(event.target.value)} placeholder="https://cdn.example.com/image.webp"/><small>Dán URL HTTPS từ CDN của cửa hàng.</small></div></label>;
  return <label className="v19-field"><span>{fieldLabel}</span>{long ? <textarea rows={4} value={value} onChange={event => onChange(event.target.value)}/> : <input value={value} onChange={event => onChange(event.target.value)}/>}</label>;
}

function SortableSectionRow({section, expanded, selected, onExpand, onSelect, onToggle, onDuplicate, onDelete, children}: {
  section: Section; expanded: boolean; selected: boolean; onExpand: () => void; onSelect: () => void;
  onToggle: () => void; onDuplicate: () => void; onDelete: () => void; children: ReactNode;
}) {
  const sortable = useSortable({id: section.id});
  const style = {transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition} as CSSProperties;
  return <div ref={sortable.setNodeRef} style={style} className={`v19-tree-section ${selected ? 'selected' : ''} ${section.visible ? '' : 'hidden-item'}`}>
    <div className="v19-tree-row" onClick={onSelect}>
      <button type="button" className="v19-grip" {...sortable.attributes} {...sortable.listeners} aria-label="Kéo section"><GripVertical/></button>
      <button type="button" className="v19-expand" onClick={(event) => {event.stopPropagation(); onExpand();}}><ChevronRight className={expanded ? 'open' : ''}/></button>
      <span className="v19-row-icon">{sectionIcon(section.type)}</span><strong>{sectionLabels[section.type]}</strong>
      <button type="button" className="v19-eye" onClick={(event) => {event.stopPropagation(); onToggle();}} aria-label={section.visible ? 'Ẩn section' : 'Hiện section'}>{section.visible ? <Eye/> : <EyeOff/>}</button>
      <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="v19-more" onClick={(event) => event.stopPropagation()}><MoreHorizontal/></button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={onDuplicate}><Copy/>Nhân bản section</DropdownMenuItem><DropdownMenuItem onSelect={onToggle}>{section.visible ? <EyeOff/> : <Eye/>}{section.visible ? 'Ẩn section' : 'Hiện section'}</DropdownMenuItem><DropdownMenuSeparator/><DropdownMenuItem className="danger" onSelect={onDelete}><Trash2/>Xóa section</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
    </div>{expanded && children}
  </div>;
}

function SortableBlockRow({block, selectedId, onSelect, onToggle, onDuplicate, onDelete, depth = 0}: {
  block: ThemeBlock; selectedId: string; onSelect: (id: string) => void; onToggle: (id: string) => void;
  onDuplicate: (id: string) => void; onDelete: (id: string) => void; depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const sortable = useSortable({id: block.id});
  const style = {transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition, '--depth': depth} as CSSProperties;
  const children = block.children || [];
  return <div ref={sortable.setNodeRef} style={style} className={`v19-block-node ${block.id === selectedId ? 'selected' : ''} ${block.visible ? '' : 'hidden-item'}`}>
    <div className="v19-block-row" onClick={() => onSelect(block.id)}>
      <button type="button" className="v19-grip" {...sortable.attributes} {...sortable.listeners}><GripVertical/></button>
      {block.type === 'group' ? <button type="button" className="v19-expand" onClick={(event) => {event.stopPropagation(); setExpanded((value) => !value);}}><ChevronRight className={expanded ? 'open' : ''}/></button> : <span className="v19-indent"/>}
      <span className="v19-row-icon">{blockIcon(block.type)}</span><strong>{String(block.settings.title || block.settings.text || block.settings.label || blockLabels[block.type])}</strong>
      <button type="button" className="v19-eye" onClick={(event) => {event.stopPropagation(); onToggle(block.id);}}>{block.visible ? <Eye/> : <EyeOff/>}</button>
      <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="v19-more" onClick={(event) => event.stopPropagation()}><MoreHorizontal/></button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={() => onDuplicate(block.id)}><Copy/>Nhân bản block</DropdownMenuItem><DropdownMenuItem onSelect={() => onToggle(block.id)}>{block.visible ? <EyeOff/> : <Eye/>}{block.visible ? 'Ẩn block' : 'Hiện block'}</DropdownMenuItem><DropdownMenuSeparator/><DropdownMenuItem className="danger" onSelect={() => onDelete(block.id)}><Trash2/>Xóa block</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
    </div>
    {block.type === 'group' && expanded && <SortableContext items={children.map((item) => item.id)} strategy={verticalListSortingStrategy}><div className="v19-block-children">{children.map((child) => <SortableBlockRow key={child.id} block={child} selectedId={selectedId} onSelect={onSelect} onToggle={onToggle} onDuplicate={onDuplicate} onDelete={onDelete} depth={depth + 1}/>)}</div></SortableContext>}
  </div>;
}

function VirtualRow({icon, label, selected, visible = true, onSelect, onToggle}: {icon: ReactNode; label: string; selected: boolean; visible?: boolean; onSelect: () => void; onToggle?: () => void}) {
  return <button type="button" className={`v19-virtual-row ${selected ? 'selected' : ''} ${visible ? '' : 'hidden-item'}`} onClick={onSelect}><span>{icon}</span><strong>{label}</strong>{onToggle && <i onClick={(event) => {event.stopPropagation(); onToggle();}}>{visible ? <Eye/> : <EyeOff/>}</i>}</button>;
}

function TemplatePicker({open, close, selected, onSelect}: {open: boolean; close: () => void; selected: TemplateKey; onSelect: (key: TemplateKey) => void}) {
  const [query, setQuery] = useState('');
  const items: Array<{key?: TemplateKey; label: string; icon: ReactNode; disabled?: boolean; separator?: boolean}> = [
    {key: 'home', label: 'Trang chủ', icon: <Home/>},
    {key: 'product', label: 'Sản phẩm', icon: <Tag/>},
    {key: 'collection', label: 'Bộ sưu tập', icon: <Tag/>},
    {label: 'Danh sách bộ sưu tập', icon: <LayoutTemplate/>, disabled: true},
    {label: 'Thẻ quà tặng', icon: <ShoppingBag/>, disabled: true, separator: true},
    {key: 'cart', label: 'Giỏ hàng', icon: <ShoppingBag/>},
    {label: 'Thanh toán và tài khoản khách', icon: <ShoppingBag/>, disabled: true, separator: true},
    {key: 'page', label: 'Trang nội dung', icon: <LayoutPanelLeft/>},
    {label: 'Blog', icon: <LayoutPanelLeft/>, disabled: true},
    {label: 'Bài viết', icon: <LayoutPanelLeft/>, disabled: true},
    {key: 'search', label: 'Tìm kiếm', icon: <Search/>, separator: true},
    {label: 'Trang mật khẩu', icon: <Settings2/>, disabled: true},
  ];
  const filtered = items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {if (!open) setQuery('');}, [open]);
  if (!open) return null;
  return <><button type="button" className="v19-picker-backdrop" aria-label="Đóng danh sách template" onClick={close}/><section className="v19-template-picker" role="dialog" aria-label="Chọn template">
    <label><Search/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm trong cửa hàng online"/><button type="button" onClick={close}><X/></button></label>
    <div>{filtered.map((item, index) => <div key={`${item.label}-${index}`} className={item.separator ? 'with-separator' : ''}><button type="button" disabled={item.disabled} className={item.key === selected ? 'active' : ''} onClick={() => {if (item.key) {onSelect(item.key); close();}}}><span>{item.icon}</span><strong>{item.label}</strong>{item.key === selected ? <Check/> : item.key ? <ChevronRight/> : null}</button></div>)}</div>
  </section></>;
}

function PreviewCanvas({src, device, zoom, iframeRef, onReload, onLoad}: {src: string; device: Device; zoom: number; iframeRef: React.RefObject<HTMLIFrameElement | null>; onReload: () => void; onLoad: () => void}) {
  return <div className={`v26-real-preview device-${device}`} style={{'--v26-preview-zoom': zoom / 100} as CSSProperties}>
    <div className="v26-preview-frame">
      <iframe ref={iframeRef} title="Xem trước storefront thật" src={src} onLoad={onLoad} />
    </div>
    <button type="button" className="v26-preview-reload" onClick={onReload} aria-label="Tải lại bản xem trước"><RefreshCw/></button>
  </div>;
}

function VirtualInspector({id, theme, patchTheme, extras, patchExtras}: {id: VirtualNode; theme: Theme; patchTheme: (theme: Theme) => void; extras: EditorExtras; patchExtras: (patch: Partial<EditorExtras>) => void}) {
  if (id === 'countdown') return <><InspectorHeader eyebrow="HEADER GROUP" title="Đếm ngược ưu đãi"/><div className="v19-inspector-fields"><SettingField name="Hiển thị" value={extras.showCountdown} onChange={(value) => patchExtras({showCountdown: Boolean(value)})}/><SettingField name="Nội dung" value={extras.countdownText} onChange={(value) => patchExtras({countdownText: String(value)})}/><label className="v19-field"><span>Phối màu</span><div className="v19-schemes">{(['light', 'dark', 'green', 'red'] as const).map((scheme) => <button type="button" key={scheme} className={`${scheme} ${extras.countdownScheme === scheme ? 'active' : ''}`} onClick={() => patchExtras({countdownScheme: scheme})}>Aa</button>)}</div></label></div></>;
  if (id === 'announcement') return <><InspectorHeader eyebrow="HEADER GROUP" title="Thanh thông báo"/><div className="v19-inspector-fields"><SettingField name="Hiển thị" value={theme.settings.showAnnouncement} onChange={(value) => patchTheme({...theme, settings: {...theme.settings, showAnnouncement: Boolean(value)}})}/><SettingField name="Nội dung" value={theme.settings.announcement} onChange={(value) => patchTheme({...theme, settings: {...theme.settings, announcement: String(value)}})}/></div></>;
  if (id === 'header') return <><InspectorHeader eyebrow="HEADER GROUP" title="Header"/><div className="v19-inspector-fields"><SettingField name="Logo chữ" value={theme.settings.logoText} onChange={(value) => patchTheme({...theme, settings: {...theme.settings, logoText: String(value)}})}/><SettingField name="Logo hình" value={theme.settings.logoImage} onChange={(value) => patchTheme({...theme, settings: {...theme.settings, logoImage: String(value)}})}/><SettingField name="Cố định khi cuộn" value={theme.settings.stickyHeader} onChange={(value) => patchTheme({...theme, settings: {...theme.settings, stickyHeader: Boolean(value)}})}/></div></>;
  if (id === 'footer') return <><InspectorHeader eyebrow="FOOTER GROUP" title="Footer"/><div className="v19-inspector-fields"><SettingField name="Hiển thị" value={extras.footerVisible} onChange={(value) => patchExtras({footerVisible: Boolean(value)})}/><p className="v19-note">Nội dung footer đang lấy từ nhận diện cửa hàng và navigation hiện tại.</p></div></>;
  const key = id === 'cartDrawer' ? 'cartDrawer' : id === 'newsletterPopup' ? 'newsletterPopup' : 'privacyBanner';
  const title = id === 'cartDrawer' ? 'Giỏ hàng dạng trượt' : id === 'newsletterPopup' ? 'Popup nhận tin' : 'Banner quyền riêng tư';
  return <><InspectorHeader eyebrow="OVERLAY GROUP" title={title}/><div className="v19-inspector-fields"><SettingField name="Hiển thị" value={extras[key]} onChange={(value) => patchExtras({[key]: Boolean(value)})}/><p className="v19-note">Cài đặt overlay được lưu cùng cấu hình trình chỉnh sửa V19.</p></div></>;
}

function InspectorHeader({eyebrow, title, actions}: {eyebrow: string; title: string; actions?: ReactNode}) {return <header className="v19-inspector-head"><div><small>{eyebrow}</small><h3>{title}</h3></div>{actions}</header>;}
function SelectionActionsV41({visible, kind, onToggle, onDuplicate, onDelete}: {visible: boolean; kind: 'section' | 'block'; onToggle: () => void; onDuplicate: () => void; onDelete: () => void}) {return <div className="v41-selection-actions"><button type="button" onClick={onToggle}>{visible ? <EyeOff/> : <Eye/>}<span>{visible ? `Ẩn ${kind}` : `Hiện ${kind}`}</span></button><button type="button" onClick={onDuplicate}><Copy/><span>Nhân bản</span></button><button type="button" className="danger" onClick={onDelete}><Trash2/><span>Xóa</span></button></div>;}

function ThemeEditorV19({close}: {close: () => void}) {
  const {draftTheme, themeState, products, collections, saveThemeDraft, publishTheme, restoreThemeVersion} = useCommerce();
  const [theme, setTheme] = useState<Theme>(() => clone(draftTheme));
  const [baseline, setBaseline] = useState<Theme>(() => clone(draftTheme));
  const [template, setTemplate] = useState<TemplateKey>('product');
  const [mode, setMode] = useState<EditorMode>('sections');
  const [device, setDevice] = useState<Device>('desktop');
  const [zoom, setZoom] = useState(84);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);
  const [previewProductId, setPreviewProductId] = useState(products[0]?.id || '');
  const [previewCollectionId, setPreviewCollectionId] = useState(collections[0]?.id || '');
  const [iframeVersion, setIframeVersion] = useState(0);
  const [selection, setSelection] = useState<Selection>(() => ({kind: 'section', sectionId: draftTheme.templates.product.sections[0]?.id || ''}));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<Theme[]>([]);
  const [future, setFuture] = useState<Theme[]>([]);
  const [picker, setPicker] = useState(false);
  const [sectionLibraryOpen, setSectionLibraryOpen] = useState(false);
  const [sectionQuery, setSectionQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [extras, setExtras] = useState<EditorExtras>(readExtras);
  const [baselineExtras, setBaselineExtras] = useState<EditorExtras>(readExtras);
  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const themeImportRef = useRef<HTMLInputElement>(null);
  const saveDraftRef = useRef(saveThemeDraft);
  const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 6}}));
  const current = theme.templates[template];
  const selectedSection = selection.kind === 'virtual' ? undefined : current.sections.find((section) => section.id === selection.sectionId);
  const selectedBlock = selection.kind === 'block' && selectedSection ? findBlock(selectedSection.blocks, selection.blockId) : undefined;
  const dirty = JSON.stringify(theme) !== JSON.stringify(baseline) || JSON.stringify(extras) !== JSON.stringify(baselineExtras);
  const sampleProduct = products.find((item) => item.id === previewProductId) || products[0];
  const sampleCollection = collections.find((item) => item.id === previewCollectionId) || collections[0];
  const storefrontPath = template === 'product' && sampleProduct ? `/products/${sampleProduct.handle}` : template === 'collection' ? (sampleCollection ? `/collections/${sampleCollection.handle}` : '/collections') : template === 'cart' ? '/cart' : template === 'search' ? '/search?q=versace' : template === 'page' ? '/pages/about' : '/';
  const previewSrc = `${storefrontPath}${storefrontPath.includes('?') ? '&' : '?'}theme_preview=1&tf_editor=1&iframe=${iframeVersion}`;
  const librarySections = allowedSections[template].filter((type) => `${sectionLabels[type]} ${sectionDescriptions[type] || ''}`.toLowerCase().includes(sectionQuery.toLowerCase()));

  const commit = (next: Theme) => {setHistory((items) => [...items, clone(theme)].slice(-50)); setFuture([]); setTheme(next);};
  const patchExtras = (patch: Partial<EditorExtras>) => {const next = {...extras, ...patch}; setExtras(next);};
  const setSections = (sections: Section[]) => commit({...theme, templates: {...theme.templates, [template]: {...current, sections}}});
  const patchSection = (sectionId: string, patch: Partial<Section>) => setSections(current.sections.map((section) => section.id === sectionId ? {...section, ...patch} : section));
  const patchBlock = (sectionId: string, blockId: string, patch: Partial<ThemeBlock>) => {const section = current.sections.find((item) => item.id === sectionId); if (!section) return; patchSection(sectionId, {blocks: patchBlockTree(section.blocks, blockId, patch)});};
  const switchTemplate = (key: TemplateKey) => {setTemplate(key); const first = theme.templates[key].sections[0]; setSelection(first ? {kind: 'section', sectionId: first.id} : {kind: 'virtual', id: 'header'});};
  const undo = () => {const previous = history.at(-1); if (!previous) return; setFuture((items) => [clone(theme), ...items]); setHistory((items) => items.slice(0, -1)); setTheme(previous);};
  const redo = () => {const next = future[0]; if (!next) return; setHistory((items) => [...items, clone(theme)]); setFuture((items) => items.slice(1)); setTheme(next);};
  const save = () => {saveThemeDraft(theme); publishTheme(theme); saveThemeExtrasV23(extras); setBaseline(clone(theme)); setBaselineExtras(clone(extras)); toast.success('Đã lưu và cập nhật cửa hàng');};
  const publish = () => {saveThemeDraft(theme); publishTheme(theme); saveThemeExtrasV23(extras); setBaseline(clone(theme)); setBaselineExtras(clone(extras)); toast.success('Đã xuất bản theme');};
  const applyPreset = (preset: 'atelier' | 'midnight' | 'minimal') => {
    const palettes = {
      atelier: {name: 'Luxury Timeforge Atelier', accent: '#7a3f25', background: '#f7f4ef', surface: '#ffffff', text: '#171513', muted: '#746f69', textOnDark: '#f8f5ef', cardRadius: 18, buttonRadius: 999, headingWeight: 600, bodyWeight: 400, motion: 'subtle' as const},
      midnight: {name: 'TimeForge Midnight', accent: '#c49a62', background: '#0f1411', surface: '#18201b', text: '#f5f1e8', muted: '#a9b2aa', textOnDark: '#ffffff', cardRadius: 14, buttonRadius: 8, headingWeight: 600, bodyWeight: 400, motion: 'expressive' as const},
      minimal: {name: 'TimeForge Minimal', accent: '#254b36', background: '#ffffff', surface: '#ffffff', text: '#171a18', muted: '#6b716d', textOnDark: '#ffffff', cardRadius: 6, buttonRadius: 6, headingWeight: 500, bodyWeight: 400, motion: 'none' as const},
    };
    const palette = palettes[preset];
    commit({...theme, name: palette.name, settings: {...theme.settings, ...palette}});
    toast.success(`Đã áp dụng preset ${palette.name}`);
  };
  const exportTheme = () => {
    const payload = JSON.stringify({format: 'timeforge-theme', exportedAt: new Date().toISOString(), theme}, null, 2);
    const url = URL.createObjectURL(new Blob([payload], {type: 'application/json'}));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${theme.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'timeforge-theme'}-v${theme.version}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất file theme JSON');
  };
  const importTheme = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const wrapped = parsed && typeof parsed === 'object' && 'theme' in parsed ? (parsed as {theme: unknown}).theme : parsed;
      if (!wrapped || typeof wrapped !== 'object' || !('templates' in wrapped) || !('settings' in wrapped)) throw new Error('File không chứa cấu trúc theme TimeForge hợp lệ.');
      const candidate = wrapped as Theme;
      const normalized = migrateTheme({draft: candidate, published: candidate, publishedAt: new Date().toISOString(), versions: []}).draft;
      commit(normalized);
      setTemplate('home');
      setSelection({kind: 'section', sectionId: normalized.templates.home.sections[0]?.id || ''});
      toast.success('Đã nhập theme thành bản nháp');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể đọc file theme');
    }
  };
  const addSection = (type: SectionType) => {const next = createSection(type); setSections([...current.sections, next]); setSelection({kind: 'section', sectionId: next.id}); setExpanded((items) => ({...items, [next.id]: true})); setSectionLibraryOpen(false); setSectionQuery('');};
  const addBlock = (type: BlockType) => {if (!selectedSection) return; const next: ThemeBlock = {id: uid('b'), type, visible: true, settings: type === 'heading' ? {eyebrow: '', text: 'Tiêu đề mới'} : type === 'text' ? {text: 'Nội dung mới'} : type === 'button' ? {label: 'Xem thêm', link: '/collections', style: 'primary'} : type === 'group' ? {title: 'Nhóm nội dung', layout: 'stack'} : type === 'iconText' ? {icon: 'shield', title: 'Cam kết', text: 'Nội dung cam kết'} : type === 'accordion' ? {title: 'Câu hỏi', text: 'Nội dung trả lời', source: 'description', open: false} : type === 'image' ? {image: '', alt: 'Hình ảnh TimeForge'} : {}, ...(type === 'group' ? {children: []} : {})}; patchSection(selectedSection.id, {blocks: [...selectedSection.blocks, next]}); setSelection({kind: 'block', sectionId: selectedSection.id, blockId: next.id});};
  const duplicateSection = (section: Section) => {const copy = clone(section); copy.id = uid('s'); copy.blocks = copy.blocks.map(regenerateBlockIds); const list = [...current.sections]; const index = list.findIndex((item) => item.id === section.id); list.splice(index + 1, 0, copy); setSections(list); setSelection({kind: 'section', sectionId: copy.id});};
  const deleteSection = (section: Section) => {if (current.sections.length <= 1) {toast.error('Template cần ít nhất một section'); return;} const next = current.sections.filter((item) => item.id !== section.id); setSections(next); setSelection({kind: 'section', sectionId: next[0].id});};
  const duplicateBlock = (sectionId: string, blockId: string) => {const section = current.sections.find((item) => item.id === sectionId); if (!section) return; const original = findBlock(section.blocks, blockId); const location = blockLocation(section.blocks, blockId); if (!original || !location) return; const copy = regenerateBlockIds(original); const next = insertBlock(section.blocks, location.parentId, location.index + 1, copy); patchSection(sectionId, {blocks: next}); setSelection({kind: 'block', sectionId, blockId: copy.id});};
  const deleteBlock = (sectionId: string, blockId: string) => {const section = current.sections.find((item) => item.id === sectionId); if (!section) return; patchSection(sectionId, {blocks: removeBlockTree(section.blocks, blockId).items}); setSelection({kind: 'section', sectionId});};
  const sectionDrag = ({active, over}: DragEndEvent) => {if (!over || active.id === over.id) return; const from = current.sections.findIndex((item) => item.id === active.id); const to = current.sections.findIndex((item) => item.id === over.id); if (from >= 0 && to >= 0) setSections(arrayMove(current.sections, from, to));};
  const blockDrag = (sectionId: string, {active, over}: DragEndEvent) => {if (!over || active.id === over.id) return; const section = current.sections.find((item) => item.id === sectionId); if (!section) return; patchSection(sectionId, {blocks: moveBlock(section.blocks, String(active.id), String(over.id))});};

  useEffect(() => {writeThemePreviewV26(theme); writeThemePreviewExtrasV26(extras);}, [theme, extras]);
  useEffect(() => {saveDraftRef.current = saveThemeDraft;}, [saveThemeDraft]);
  useEffect(() => {if (!dirty) return; const timer = window.setTimeout(() => saveDraftRef.current(theme), 900); return () => window.clearTimeout(timer);}, [theme, dirty]);
  useEffect(() => {document.body.classList.add('tf-theme-editor-open-v4924'); return () => document.body.classList.remove('tf-theme-editor-open-v4924');}, []);
  useEffect(() => {const message = (event: MessageEvent) => {if (event.origin !== window.location.origin || !['timeforge:preview-section-selected','timeforge:preview-block-selected'].includes(String(event.data?.type || ''))) return; const sectionId = String(event.data.sectionId || ''); const blockId = String(event.data.blockId || ''); const section = theme.templates[template].sections.find((item) => item.id === sectionId); if (!section) return; const block = blockId ? findBlock(section.blocks, blockId) : undefined; setSelection(block ? {kind: 'block', sectionId, blockId} : {kind: 'section', sectionId}); setExpanded((items) => ({...items, [sectionId]: true})); setSidebarOpen(true); setMode('sections');}; window.addEventListener('message', message); return () => window.removeEventListener('message', message);}, [theme, template]);
  useEffect(() => {const sectionId = selection.kind === 'virtual' ? '' : selection.sectionId; const blockId = selection.kind === 'block' ? selection.blockId : ''; iframeRef.current?.contentWindow?.postMessage({type: 'timeforge:editor-selection', sectionId, blockId, scroll: false}, window.location.origin);}, [selection, previewSrc]);

  useEffect(() => {const key = (event: KeyboardEvent) => {if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {event.preventDefault(); save();} if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {event.preventDefault(); event.shiftKey ? redo() : undo();}}; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);});

  return <div className="tf-theme-editor-v499">
    <header className="v19-topbar">
      <div className="v19-top-left"><button type="button" onClick={close} aria-label="Quay lại"><ArrowLeft/></button><button type="button" className={mode === 'sections' ? 'active' : ''} onClick={() => {setMode('sections'); setSidebarOpen(true);}}><LayoutPanelLeft/></button><button type="button" className={mode === 'settings' ? 'active' : ''} onClick={() => {setMode('settings'); setSidebarOpen(true);}}><Settings2/></button><button type="button" className={mode === 'apps' ? 'active' : ''} onClick={() => {setMode('apps'); setSidebarOpen(true);}}><AppWindow/></button></div>
      <div className="v19-theme-identity"><span><LayoutTemplate/></span><b>{theme.name}</b><em>Đang hoạt động</em></div>
      <button type="button" className="v19-template-trigger" onClick={() => setPicker((value) => !value)}><Tag/><span>{templateLabels[template]}</span><ChevronDown/></button>
      <div className="v19-top-actions v26-top-actions">
        <button type="button" className="v19-selection-tool" onClick={() => setSidebarOpen((value) => !value)}>{sidebarOpen ? <PanelLeftClose/> : <PanelLeftOpen/>}</button>
        <div className="v26-device-switch" role="group" aria-label="Chế độ xem trước">
          <button type="button" className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')} aria-label="Máy tính"><Monitor/></button>
          <button type="button" className={device === 'tablet' ? 'active' : ''} onClick={() => setDevice('tablet')} aria-label="Máy tính bảng"><Laptop/></button>
          <button type="button" className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')} aria-label="Điện thoại"><Smartphone/></button>
        </div>
        <label className="v26-zoom-control" title="Thu phóng bản xem trước"><Maximize2/><select value={zoom} onChange={(event) => setZoom(Number(event.target.value))}><option value="68">68%</option><option value="84">84%</option><option value="100">100%</option></select></label>
        <button type="button" disabled={!history.length} onClick={undo}><Undo2/></button>
        <button type="button" disabled={!future.length} onClick={redo}><Redo2/></button>
        <DropdownMenu><DropdownMenuTrigger asChild><button type="button"><MoreHorizontal/></button></DropdownMenuTrigger><DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setIframeVersion((value) => value + 1)}><RefreshCw/>Tải lại storefront thật</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => saveThemeDraft(theme)}><Check/>Chỉ lưu bản nháp</DropdownMenuItem>
          <DropdownMenuItem onSelect={publish}><Sparkles/>Xuất bản theme</DropdownMenuItem>
          <DropdownMenuSeparator/>
          <DropdownMenuItem onSelect={exportTheme}><Download/>Xuất file theme</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => themeImportRef.current?.click()}><FileUp/>Nhập file theme</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => {void navigator.clipboard?.writeText(JSON.stringify(theme, null, 2)); toast.success('Đã sao chép JSON theme');}}><Copy/>Sao chép JSON theme</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => {restoreThemeVersion(themeState.versions[0]?.id || ''); if (themeState.versions[0]) {setTheme(clone(themeState.versions[0].theme)); setBaseline(clone(themeState.versions[0].theme));}}}><History/>Khôi phục bản gần nhất</DropdownMenuItem>
        </DropdownMenuContent></DropdownMenu>
        <Button size="sm" disabled={!dirty} onClick={save}>{dirty ? 'Lưu' : 'Đã lưu'}</Button>
      </div>
    </header>
    <input ref={themeImportRef} hidden type="file" accept="application/json,.json" onChange={event => {void importTheme(event.target.files?.[0]); event.currentTarget.value = '';}}/>
    <TemplatePicker open={picker} close={() => setPicker(false)} selected={template} onSelect={switchTemplate}/>
    <div className={`v19-workspace ${sidebarOpen ? '' : 'sidebar-closed'}`}>
      <aside className={`v19-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {mode === 'sections' && <>
          <section className="v19-sidebar-tree">
            <header className="v19-template-head"><div><h2>{templateLabels[template]}</h2><small>{dirty ? 'Có thay đổi chưa lưu' : 'Đã đồng bộ với cửa hàng'}</small></div><button type="button" onClick={() => setPicker(true)}><ChevronDown/></button></header><div className="v23-storefront-link-state"><Check/><span><b>Liên kết storefront đang hoạt động</b><small>Section, block và cài đặt được áp dụng vào đúng template sau khi bấm Lưu.</small></span></div>
            {template === 'product' && sampleProduct && <button type="button" className="v19-preview-resource v26-preview-resource" onClick={() => setProductPickerOpen(true)}><span><ShoppingBag/></span><div><small>SẢN PHẨM XEM TRƯỚC</small><b>{sampleProduct.title}</b></div><ChevronRight/></button>}
            {template === 'collection' && sampleCollection && <button type="button" className="v19-preview-resource v26-preview-resource" onClick={() => setCollectionPickerOpen(true)}><span><LayoutTemplate/></span><div><small>BỘ SƯU TẬP XEM TRƯỚC</small><b>{sampleCollection.title}</b></div><ChevronRight/></button>}
            <div className="v19-tree-scroll">
              <section className="v19-tree-group"><h3>Header group</h3><VirtualRow icon={<Sparkles/>} label="Đếm ngược ưu đãi" selected={selection.kind === 'virtual' && selection.id === 'countdown'} visible={extras.showCountdown} onSelect={() => setSelection({kind: 'virtual', id: 'countdown'})} onToggle={() => patchExtras({showCountdown: !extras.showCountdown})}/><VirtualRow icon={<LayoutPanelLeft/>} label="Thanh thông báo" selected={selection.kind === 'virtual' && selection.id === 'announcement'} visible={theme.settings.showAnnouncement} onSelect={() => setSelection({kind: 'virtual', id: 'announcement'})} onToggle={() => commit({...theme, settings: {...theme.settings, showAnnouncement: !theme.settings.showAnnouncement}})}/><VirtualRow icon={<Menu/>} label="Header" selected={selection.kind === 'virtual' && selection.id === 'header'} onSelect={() => setSelection({kind: 'virtual', id: 'header'})}/></section>
              <section className="v19-tree-group template-group"><h3>Template</h3><DndContext sensors={sensors} onDragEnd={sectionDrag}><SortableContext items={current.sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>{current.sections.map((section) => <SortableSectionRow key={section.id} section={section} expanded={expanded[section.id] ?? true} selected={selection.kind !== 'virtual' && selection.sectionId === section.id && selection.kind === 'section'} onExpand={() => setExpanded((items) => ({...items, [section.id]: !(items[section.id] ?? true)}))} onSelect={() => setSelection({kind: 'section', sectionId: section.id})} onToggle={() => patchSection(section.id, {visible: !section.visible})} onDuplicate={() => duplicateSection(section)} onDelete={() => deleteSection(section)}><DndContext sensors={sensors} onDragEnd={(event) => blockDrag(section.id, event)}><SortableContext items={section.blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}><div className="v19-block-list">{section.blocks.map((block) => <SortableBlockRow key={block.id} block={block} selectedId={selection.kind === 'block' ? selection.blockId : ''} onSelect={(blockId) => setSelection({kind: 'block', sectionId: section.id, blockId})} onToggle={(blockId) => {const item = findBlock(section.blocks, blockId); if (item) patchBlock(section.id, blockId, {visible: !item.visible});}} onDuplicate={(blockId) => duplicateBlock(section.id, blockId)} onDelete={(blockId) => deleteBlock(section.id, blockId)}/>)}</div></SortableContext></DndContext></SortableSectionRow>)}</SortableContext></DndContext><div className="v19-add-section"><button type="button" onClick={() => setSectionLibraryOpen(true)}><Plus/>Thêm section</button></div></section>
              <section className="v19-tree-group"><h3>Overlay group</h3><VirtualRow icon={<ShoppingBag/>} label="Giỏ hàng dạng trượt" selected={selection.kind === 'virtual' && selection.id === 'cartDrawer'} visible={extras.cartDrawer} onSelect={() => setSelection({kind: 'virtual', id: 'cartDrawer'})} onToggle={() => patchExtras({cartDrawer: !extras.cartDrawer})}/><VirtualRow icon={<Sparkles/>} label="Popup nhận tin" selected={selection.kind === 'virtual' && selection.id === 'newsletterPopup'} visible={extras.newsletterPopup} onSelect={() => setSelection({kind: 'virtual', id: 'newsletterPopup'})} onToggle={() => patchExtras({newsletterPopup: !extras.newsletterPopup})}/><VirtualRow icon={<LayoutPanelLeft/>} label="Banner quyền riêng tư" selected={selection.kind === 'virtual' && selection.id === 'privacyBanner'} visible={extras.privacyBanner} onSelect={() => setSelection({kind: 'virtual', id: 'privacyBanner'})} onToggle={() => patchExtras({privacyBanner: !extras.privacyBanner})}/></section>
              <section className="v19-tree-group"><h3>Footer group</h3><VirtualRow icon={<LayoutPanelLeft/>} label="Footer" selected={selection.kind === 'virtual' && selection.id === 'footer'} visible={extras.footerVisible} onSelect={() => setSelection({kind: 'virtual', id: 'footer'})} onToggle={() => patchExtras({footerVisible: !extras.footerVisible})}/></section>
            </div>
          </section>
          <section className="v19-inspector">
            {selection.kind === 'virtual' && <VirtualInspector id={selection.id} theme={theme} patchTheme={commit} extras={extras} patchExtras={patchExtras}/>} 
            {selection.kind === 'section' && selectedSection && <><InspectorHeader eyebrow="SECTION" title={sectionLabels[selectedSection.type]}/><SelectionActionsV41 visible={selectedSection.visible} kind="section" onToggle={() => patchSection(selectedSection.id, {visible: !selectedSection.visible})} onDuplicate={() => duplicateSection(selectedSection)} onDelete={() => deleteSection(selectedSection)}/><div className="v19-inspector-fields">{Object.entries(selectedSection.settings).map(([name, value]) => <SettingField key={name} name={name} value={value} onChange={(next) => patchSection(selectedSection.id, {settings: {...selectedSection.settings, [name]: next}})}/>)}</div>{allowedBlocks[selectedSection.type]?.length ? <div className="v19-add-block"><b>Blocks</b><DropdownMenu><DropdownMenuTrigger asChild><button type="button"><Plus/>Thêm block</button></DropdownMenuTrigger><DropdownMenuContent align="start">{[...(allowedBlocks[selectedSection.type] || []), 'group' as BlockType].map((type) => <DropdownMenuItem key={type} onSelect={() => addBlock(type)}>{blockIcon(type)}{blockLabels[type]}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></div> : null}</>}
            {selection.kind === 'block' && selectedSection && selectedBlock && <><InspectorHeader eyebrow={selectedBlock.type === 'group' ? 'NESTED GROUP' : 'BLOCK'} title={blockLabels[selectedBlock.type]}/><SelectionActionsV41 visible={selectedBlock.visible} kind="block" onToggle={() => patchBlock(selectedSection.id, selectedBlock.id, {visible: !selectedBlock.visible})} onDuplicate={() => duplicateBlock(selectedSection.id, selectedBlock.id)} onDelete={() => deleteBlock(selectedSection.id, selectedBlock.id)}/>{selectedBlock.type === 'buyButtons' && <div className="v41-selection-help"><ShoppingBag/><span><b>Tùy chỉnh từng nút mua</b><small>Có thể ẩn riêng nút Thêm vào giỏ hoặc Mua ngay bên dưới. Ẩn block sẽ tắt cả cụm.</small></span></div>}<div className="v19-inspector-fields">{Object.entries(selectedBlock.settings).map(([name, value]) => <SettingField key={name} name={name} value={value} onChange={(next) => patchBlock(selectedSection.id, selectedBlock.id, {settings: {...selectedBlock.settings, [name]: next}})}/>)}</div>{selectedBlock.type === 'group' && <div className="v19-note">Kéo block khác thả vào hàng nhóm để tạo cấu trúc lồng nhau. Block con có thể tiếp tục kéo và sắp xếp trong cây.</div>}</>}
          </section>
        </>}
        {mode === 'settings' && <section className="v19-global-settings v27-global-settings">
          <InspectorHeader eyebrow="THEME SETTINGS" title="Thiết kế toàn cửa hàng"/>
          <div className="v27-preset-wrap"><div className="v27-settings-title"><Palette/><span><b>Preset giao diện</b><small>Áp dụng nhanh màu sắc, độ bo và chuyển động.</small></span></div><div className="v27-preset-grid"><button type="button" onClick={() => applyPreset('atelier')}><i className="atelier"/><b>Atelier</b><small>Ấm và biên tập</small></button><button type="button" onClick={() => applyPreset('midnight')}><i className="midnight"/><b>Midnight</b><small>Tối và sang trọng</small></button><button type="button" onClick={() => applyPreset('minimal')}><i className="minimal"/><b>Minimal</b><small>Sạch và hiện đại</small></button></div></div>
          <div className="v27-settings-group"><div className="v27-settings-title"><Layers3/><span><b>Nhận diện</b><small>Tên theme, cửa hàng và logo.</small></span></div><div className="v19-inspector-fields"><SettingField name="themeName" label="Tên theme" value={theme.name} onChange={value => commit({...theme, name: String(value)})}/><SettingField name="storeName" label="Tên cửa hàng" value={theme.settings.storeName} onChange={value => commit({...theme, settings: {...theme.settings, storeName: String(value)}})}/><SettingField name="logoText" label="Logo chữ" value={theme.settings.logoText} onChange={value => commit({...theme, settings: {...theme.settings, logoText: String(value)}})}/><SettingField name="logoImage" label="Logo hình" value={theme.settings.logoImage} onChange={value => commit({...theme, settings: {...theme.settings, logoImage: String(value)}})}/><SettingField name="announcement" label="Thanh thông báo" value={theme.settings.announcement} onChange={value => commit({...theme, settings: {...theme.settings, announcement: String(value)}})}/></div></div>
          <div className="v27-settings-group"><div className="v27-settings-title"><Paintbrush/><span><b>Màu sắc và tương phản</b><small>Nền tối tự động sử dụng màu chữ sáng.</small></span></div><div className="v19-inspector-fields"><SettingField name="accent" label="Màu nhấn" value={theme.settings.accent} onChange={value => commit({...theme, settings: {...theme.settings, accent: String(value)}})}/><SettingField name="background" label="Nền trang" value={theme.settings.background} onChange={value => commit({...theme, settings: {...theme.settings, background: String(value)}})}/><SettingField name="surface" label="Nền card" value={theme.settings.surface} onChange={value => commit({...theme, settings: {...theme.settings, surface: String(value)}})}/><SettingField name="text" label="Màu chữ chính" value={theme.settings.text} onChange={value => commit({...theme, settings: {...theme.settings, text: String(value)}})}/><SettingField name="muted" label="Màu chữ phụ" value={theme.settings.muted} onChange={value => commit({...theme, settings: {...theme.settings, muted: String(value)}})}/><SettingField name="textOnDark" value={theme.settings.textOnDark} onChange={value => commit({...theme, settings: {...theme.settings, textOnDark: String(value)}})}/></div></div>
          <div className="v27-settings-group"><div className="v27-settings-title"><Type/><span><b>Typography</b><small>Chuẩn hóa font và độ đậm toàn storefront.</small></span></div><div className="v19-inspector-fields"><SettingField name="headingFont" label="Font tiêu đề" value={theme.settings.headingFont} onChange={value => commit({...theme, settings: {...theme.settings, headingFont: String(value)}})}/><SettingField name="bodyFont" label="Font nội dung" value={theme.settings.bodyFont} onChange={value => commit({...theme, settings: {...theme.settings, bodyFont: String(value)}})}/><SettingField name="headingScale" value={theme.settings.headingScale} onChange={value => commit({...theme, settings: {...theme.settings, headingScale: Number(value)}})}/><SettingField name="headingWeight" value={theme.settings.headingWeight} onChange={value => commit({...theme, settings: {...theme.settings, headingWeight: Number(value)}})}/><SettingField name="bodyWeight" value={theme.settings.bodyWeight} onChange={value => commit({...theme, settings: {...theme.settings, bodyWeight: Number(value)}})}/></div></div>
          <div className="v27-settings-group"><div className="v27-settings-title"><LayoutTemplate/><span><b>Bố cục và thành phần</b><small>Chiều rộng, khoảng cách và độ bo nhất quán.</small></span></div><div className="v19-inspector-fields"><SettingField name="contentWidth" value={theme.settings.contentWidth} onChange={value => commit({...theme, settings: {...theme.settings, contentWidth: Number(value)}})}/><SettingField name="sectionSpacing" value={theme.settings.sectionSpacing} onChange={value => commit({...theme, settings: {...theme.settings, sectionSpacing: Number(value)}})}/><SettingField name="radius" label="Bo góc chung" value={theme.settings.radius} onChange={value => commit({...theme, settings: {...theme.settings, radius: Number(value)}})}/><SettingField name="cardRadius" value={theme.settings.cardRadius} onChange={value => commit({...theme, settings: {...theme.settings, cardRadius: Number(value)}})}/><SettingField name="buttonRadius" value={theme.settings.buttonRadius} onChange={value => commit({...theme, settings: {...theme.settings, buttonRadius: Number(value)}})}/><SettingField name="motion" value={theme.settings.motion} onChange={value => commit({...theme, settings: {...theme.settings, motion: value as Theme['settings']['motion']}})}/></div></div>
        </section>}
        {mode === 'apps' && <section className="v19-app-embeds v27-app-panel"><InspectorHeader eyebrow="VERSIONS & APP EMBEDS" title="Lịch sử và tiện ích"/><div className="v27-theme-transfer"><div className="v27-settings-title"><Download/><span><b>Sao lưu theme</b><small>Xuất hoặc nhập toàn bộ template, section, block và cài đặt.</small></span></div><div><button type="button" onClick={exportTheme}><Download/>Xuất theme</button><button type="button" onClick={() => themeImportRef.current?.click()}><FileUp/>Nhập theme</button></div></div><div className="v27-history-card"><div className="v27-settings-title"><History/><span><b>Lịch sử phiên bản</b><small>Khôi phục một bản đã xuất bản thành bản nháp.</small></span></div>{themeState.versions.length ? <div className="v27-version-list">{themeState.versions.slice(0, 8).map(version => <article key={version.id}><span><b>{version.note}</b><small>{new Date(version.createdAt).toLocaleString('vi-VN')}</small></span><button type="button" onClick={() => {restoreThemeVersion(version.id); setTheme(clone(version.theme)); toast.success('Đã khôi phục phiên bản thành bản nháp');}}>Khôi phục</button></article>)}</div> : <p className="v19-note">Chưa có phiên bản cũ. Mỗi lần xuất bản, hệ thống sẽ lưu lại theme trước đó.</p>}</div><article><span><Sparkles/></span><div><b>Chat hỗ trợ</b><p>Hiển thị widget tư vấn ở góc storefront.</p></div><button type="button" role="switch" aria-checked="true" className="on"><i/></button></article><article><span><ShoppingBag/></span><div><b>Quick add</b><p>Thêm nhanh sản phẩm từ lưới.</p></div><button type="button" role="switch" aria-checked="true" className="on"><i/></button></article></section>}
      </aside>
      <main className="v19-preview-stage v26-preview-stage" ref={previewRef}><div className="v19-preview-toolbar v26-preview-toolbar"><span>{device === 'desktop' ? <Monitor/> : device === 'tablet' ? <Laptop/> : <Smartphone/>}{device === 'desktop' ? 'Storefront thật · Máy tính' : device === 'tablet' ? 'Storefront thật · Máy tính bảng' : 'Storefront thật · Điện thoại'}</span><div><em>Bản nháp tự lưu</em><Link to={storefrontPath} target="_blank"><Eye/>Mở trang công khai</Link></div></div><PreviewCanvas src={previewSrc} device={device} zoom={zoom} iframeRef={iframeRef} onReload={() => setIframeVersion((value) => value + 1)} onLoad={() => {const sectionId = selection.kind === 'virtual' ? '' : selection.sectionId; const blockId = selection.kind === 'block' ? selection.blockId : ''; iframeRef.current?.contentWindow?.postMessage({type: 'timeforge:editor-selection', sectionId, blockId, scroll: false}, window.location.origin);}}/></main>
    </div>
    {sectionLibraryOpen && <div className="v27-section-library-backdrop" onMouseDown={() => setSectionLibraryOpen(false)}><section className="v27-section-library" onMouseDown={event => event.stopPropagation()}><header><div><small>SECTION LIBRARY</small><h2>Thêm section vào {templateLabels[template]}</h2><p>Section được thêm sẽ dùng renderer storefront thật và có thể kéo thả trong cây.</p></div><button type="button" onClick={() => setSectionLibraryOpen(false)}><X/></button></header><label className="v27-library-search"><Search/><input autoFocus value={sectionQuery} onChange={event => setSectionQuery(event.target.value)} placeholder="Tìm banner, sản phẩm, FAQ, đánh giá..."/></label><div className="v27-library-grid">{librarySections.map(type => <button type="button" key={type} onClick={() => addSection(type)}><span>{sectionIcon(type)}</span><div><small>{sectionCategory(type)}</small><b>{sectionLabels[type]}</b><p>{sectionDescriptions[type]}</p></div><Plus/></button>)}{!librarySections.length && <div className="v27-library-empty"><Search/><b>Không tìm thấy section</b><p>Thử từ khóa khác.</p></div>}</div></section></div>}
    <ResourcePicker open={productPickerOpen} mode="products" selectedIds={sampleProduct ? [sampleProduct.id] : []} multiple={false} title="Chọn sản phẩm xem trước" onClose={() => setProductPickerOpen(false)} onConfirm={(ids) => {if (ids[0]) setPreviewProductId(ids[0]);}}/>
    <ResourcePicker open={collectionPickerOpen} mode="collections" selectedIds={sampleCollection ? [sampleCollection.id] : []} multiple={false} title="Chọn bộ sưu tập xem trước" onClose={() => setCollectionPickerOpen(false)} onConfirm={(ids) => {if (ids[0]) setPreviewCollectionId(ids[0]);}}/>
  </div>;
}

export function OnlineStoreV19() {
  const [params, setParams] = useSearchParams();
  const editor = params.get('view') === 'editor';
  if (!editor) return <OnlineStoreV18/>;
  return <ThemeEditorV19 close={() => setParams({})}/>;
}
