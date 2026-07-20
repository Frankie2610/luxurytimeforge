import {AnimatePresence, motion} from 'framer-motion';
import {Check, Search, X} from 'lucide-react';
import {useMemo, useState} from 'react';
import {useCommerce} from './context';
import {SmartImage} from './image-utils';
import type {Collection, Product} from './types';
import {money} from './utils';

type PickerMode = 'products' | 'collections';
export function ResourcePicker({open, mode = 'products', selectedIds, multiple = true, title, onClose, onConfirm}: {
  open: boolean;
  mode?: PickerMode;
  selectedIds: string[];
  multiple?: boolean;
  title?: string;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}) {
  const {products, collections, collectionProducts} = useCommerce();
  const [query, setQuery] = useState('');
  const [vendor, setVendor] = useState('all');
  const [selection, setSelection] = useState<string[]>(selectedIds);
  const resources = mode === 'products' ? products : collections;
  const vendors = useMemo(() => [...new Set(products.map((item) => item.vendor).filter(Boolean))].sort(), [products]);
  const filtered = useMemo(() => resources.filter((resource) => {
    const haystack = mode === 'products'
      ? `${(resource as Product).title} ${(resource as Product).vendor} ${(resource as Product).sku} ${(resource as Product).tags.join(' ')}`
      : `${(resource as Collection).title} ${(resource as Collection).description}`;
    if (query && !haystack.toLowerCase().includes(query.toLowerCase())) return false;
    if (mode === 'products' && vendor !== 'all' && (resource as Product).vendor !== vendor) return false;
    return true;
  }), [resources, query, vendor, mode]);
  const toggle = (id: string) => setSelection((current) => {
    if (!multiple) return [id];
    return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  });
  return <AnimatePresence>{open && <motion.div className="tf-picker-shell" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} onMouseDown={onClose}>
    <motion.section className="tf-resource-picker" initial={{opacity: 0, y: 18, scale: .985}} animate={{opacity: 1, y: 0, scale: 1}} exit={{opacity: 0, y: 12, scale: .99}} onMouseDown={(event) => event.stopPropagation()}>
      <header><div><small>RESOURCE PICKER</small><h2>{title || (mode === 'products' ? 'Chọn sản phẩm' : 'Chọn bộ sưu tập')}</h2></div><button onClick={onClose}><X /></button></header>
      <div className="tf-picker-toolbar"><label><Search /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={mode === 'products' ? 'Tìm tên, SKU hoặc thương hiệu' : 'Tìm bộ sưu tập'} /></label>{mode === 'products' && <select value={vendor} onChange={(event) => setVendor(event.target.value)}><option value="all">Tất cả thương hiệu</option>{vendors.map((item) => <option key={item}>{item}</option>)}</select>}</div>
      <div className="tf-picker-results">{filtered.map((resource) => {
        const product = mode === 'products' ? resource as Product : null;
        const collection = mode === 'collections' ? resource as Collection : null;
        const checked = selection.includes(resource.id);
        const image = product?.images[0] || collection?.image || '';
        return <button type="button" className={checked ? 'is-selected' : ''} key={resource.id} onClick={() => toggle(resource.id)}>
          <span className="tf-picker-check">{checked && <Check />}</span><SmartImage src={image} alt={resource.title} width={112} height={112} />
          <span className="tf-picker-copy"><b>{resource.title}</b>{product ? <><small>{product.vendor || 'Không có thương hiệu'} · {product.sku || 'Chưa SKU'}</small><span>{money(product.price)} · {product.inventory} trong kho</span></> : <><small>{collection?.type === 'automatic' ? 'Bộ sưu tập tự động' : 'Bộ sưu tập thủ công'}</small><span>{collection ? collectionProducts(collection).length : 0} sản phẩm</span></>}</span>
        </button>;
      })}{!filtered.length && <div className="tf-picker-empty"><Search /><h3>Không tìm thấy tài nguyên</h3><p>Thử đổi từ khóa hoặc bộ lọc.</p></div>}</div>
      <footer><span>{selection.length} mục đã chọn</span><div><button onClick={onClose}>Hủy</button><button className="primary" onClick={() => {onConfirm(selection); onClose();}}>Thêm</button></div></footer>
    </motion.section>
  </motion.div>}</AnimatePresence>;
}
