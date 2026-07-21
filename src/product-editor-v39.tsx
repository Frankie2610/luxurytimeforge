import {useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {
  AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowLeft, ArrowUp, Bold, Check,
  Code2, Eye, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Minus,
  Plus, Quote, Redo2, RemoveFormatting, Save, Strikethrough, Trash2, Underline,
  Undo2, X,
} from 'lucide-react';
import {toast} from 'sonner';
import {useCommerce} from './context';
import type {Metafield, Product, ProductOption, Variant} from './types';
import {money, slugify, strip, uid} from './utils';
import {isFirebaseSafeSku, normalizeSku} from './product-data';

const blankProduct = (): Product => {
  const now = new Date().toISOString();
  return {
    id: uid('p'), handle: '', title: '', descriptionHtml: '', descriptionText: '', vendor: '',
    productType: '', category: '', tags: [], status: 'draft', published: false, images: [],
    price: 0, compareAtPrice: 0, cost: 0, sku: '', barcode: '', inventory: 0,
    trackInventory: true, weight: 0, weightUnit: 'g', seoTitle: '', seoDescription: '',
    options: [], metafields: [], variants: [{id: uid('v'), title: 'Default Title', sku: '', price: 0, compareAtPrice: 0, inventory: 0}],
    createdAt: now, updatedAt: now,
  };
};

function Field({label, hint, children}: {label: string; hint?: string; children: ReactNode}) {
  return <label className="tf39-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
function Panel({title, description, action, children, className = ''}: {title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string}) {
  return <section className={`tf39-editor-panel ${className}`}><header><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</header><div className="tf39-panel-body">{children}</div></section>;
}
function ToolbarButton({title, active = false, onMouseDown, children}: {title: string; active?: boolean; onMouseDown: (event: React.MouseEvent<HTMLButtonElement>) => void; children: ReactNode}) {
  return <button type="button" title={title} aria-label={title} className={active ? 'is-active' : ''} onMouseDown={onMouseDown}>{children}</button>;
}

export function ProductEditorV39() {
  const {id} = useParams();
  const navigate = useNavigate();
  const {products, collections, saveProduct} = useCommerce();
  const source = products.find((item) => item.id === id);
  const [product, setProduct] = useState<Product>(() => source ? structuredClone({...source, options: source.options || [], metafields: source.metafields || []}) : blankProduct());
  const [mode, setMode] = useState<'visual' | 'html' | 'preview'>('visual');
  const [tagInput, setTagInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const snapshotRef = useRef('');

  useEffect(() => {
    const next = source ? structuredClone({...source, options: source.options || [], metafields: source.metafields || []}) : blankProduct();
    setProduct(next);
    snapshotRef.current = JSON.stringify(next);
  }, [id, source?.id]);
  useEffect(() => {
    if (mode === 'visual' && editorRef.current && editorRef.current.innerHTML !== product.descriptionHtml) editorRef.current.innerHTML = product.descriptionHtml || '<p><br></p>';
  }, [mode, product.id]);
  useEffect(() => {
    document.body.classList.add('tf-product-editor-route-v4915');
    document.documentElement.classList.add('tf-product-editor-route-v4915');
    return () => {
      document.body.classList.remove('tf-product-editor-route-v4915');
      document.documentElement.classList.remove('tf-product-editor-route-v4915');
    };
  }, []);

  const dirty = JSON.stringify(product) !== snapshotRef.current;
  const isNew = !source;
  const profit = Math.max(0, product.price - product.cost);
  const margin = product.price > 0 ? Math.round((profit / product.price) * 100) : 0;
  const collectionNames = useMemo(() => collections.filter((collection) => collection.productIds.includes(product.id)).map((collection) => collection.title), [collections, product.id]);

  const patch = <K extends keyof Product>(key: K, value: Product[K]) => setProduct((current) => ({...current, [key]: value, updatedAt: new Date().toISOString()}));
  const patchPrimaryVariant = (value: Partial<Variant>) => setProduct((current) => ({
    ...current,
    variants: current.variants.map((variant, index) => index === 0 ? {...variant, ...value} : variant),
    updatedAt: new Date().toISOString(),
  }));
  const updateDescription = (html: string) => setProduct((current) => {
    const text = strip(html);
    return {...current, descriptionHtml: html, descriptionText: text, seoDescription: current.seoDescription || text.slice(0, 155), updatedAt: new Date().toISOString()};
  });
  const command = (name: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(name, false, value);
    updateDescription(editorRef.current?.innerHTML || '');
  };
  const save = () => {
    if (!product.title.trim()) {toast.error('Cần nhập tên sản phẩm'); return;}
    const first = product.variants[0] || {id: uid('v'), title: 'Default Title', sku: product.sku, price: product.price, compareAtPrice: product.compareAtPrice, inventory: product.inventory};
    const sku = normalizeSku(first.sku || product.sku);
    if (!sku) {toast.error('Cần nhập mã SKU trước khi lưu'); return;}
    if (!isFirebaseSafeSku(sku)) {toast.error('SKU không được chứa . # $ [ ] /'); return;}
    const next: Product = {
      ...product,
      id: sku,
      handle: product.handle || slugify(`${product.vendor}-${product.title}-${sku}`),
      descriptionText: strip(product.descriptionHtml),
      sku,
      price: first.price ?? product.price,
      compareAtPrice: first.compareAtPrice ?? product.compareAtPrice,
      inventory: product.variants.reduce((sum, variant) => sum + Number(variant.inventory || 0), 0),
      variants: product.variants.map((variant, index) => ({...variant, id: index === 0 ? sku : (variant.sku || `${sku}-${index + 1}`), sku: variant.sku || (index === 0 ? sku : `${sku}-${index + 1}`)})),
      published: product.status === 'active',
      seoTitle: product.seoTitle || `${product.title} | TimeForge`,
      seoDescription: product.seoDescription || strip(product.descriptionHtml).slice(0, 155),
      updatedAt: new Date().toISOString(),
    };
    saveProduct(next);
    setProduct(next);
    snapshotRef.current = JSON.stringify(next);
    toast.success(isNew ? 'Đã tạo sản phẩm' : 'Đã lưu sản phẩm');
    if (isNew) navigate(`/admin/products/${next.id}`, {replace: true});
  };
  const addImageUrls = () => {
    const urls = imageUrl.split(/[\n,]+/).map((value) => value.trim()).filter(Boolean);
    if (!urls.length) return;
    const invalid = urls.find((value) => {try {const parsed = new URL(value); return !['http:', 'https:'].includes(parsed.protocol);} catch {return true;}});
    if (invalid) {toast.error(`URL ảnh CDN không hợp lệ: ${invalid}`); return;}
    patch('images', [...new Set([...product.images, ...urls])]);
    setImageUrl('');
    toast.success(`Đã thêm ${urls.length} URL ảnh CDN`);
  };
  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= product.images.length) return;
    const next = [...product.images];
    [next[index], next[target]] = [next[target], next[index]];
    patch('images', next);
  };
  const addOption = () => patch('options', [...(product.options || []), {id: uid('o'), name: 'Tùy chọn', values: ['Giá trị']}]);
  const updateOption = (optionId: string, next: Partial<ProductOption>) => patch('options', (product.options || []).map((option) => option.id === optionId ? {...option, ...next} : option));
  const addMetafield = () => patch('metafields', [...(product.metafields || []), {id: uid('m'), namespace: 'custom', key: '', value: '', type: 'single_line_text_field'}]);
  const updateMetafield = (metafieldId: string, next: Partial<Metafield>) => patch('metafields', (product.metafields || []).map((metafield) => metafield.id === metafieldId ? {...metafield, ...next} : metafield));

  return <div className="tf-product-editor-v39 tf-product-editor-v4915">
    <header className="tf39-editor-header">
      <div className="tf39-editor-heading">
        <Link to="/admin/products" aria-label="Quay lại danh sách sản phẩm"><ArrowLeft /></Link>
        <div><small>{isNew ? 'SẢN PHẨM MỚI' : 'CHỈNH SỬA SẢN PHẨM'}</small><h1>{product.title || (isNew ? 'Tạo mới sản phẩm' : 'Sản phẩm chưa đặt tên')}</h1><p>{isNew ? 'Tạo sản phẩm theo cấu trúc quản trị Shopify.' : `Cập nhật lần cuối ${new Date(product.updatedAt).toLocaleString('vi-VN')}`}</p></div>
      </div>
      <div className="tf39-editor-header-actions">
        {product.handle && <Link className="tf39-editor-preview-link" to={`/products/${product.handle}`} target="_blank"><Eye />Xem trên cửa hàng</Link>}
        <button className="tf39-editor-save" type="button" onClick={save}><Save />Lưu</button>
      </div>
    </header>

    {dirty && <div className="tf39-unsaved-bar"><span><i /><b>Chưa lưu thay đổi</b><small>Nội dung mới chỉ hiển thị sau khi bấm Lưu.</small></span><div><button type="button" onClick={() => {const next = source ? structuredClone({...source, options: source.options || [], metafields: source.metafields || []}) : blankProduct(); setProduct(next); snapshotRef.current = JSON.stringify(next);}}>Bỏ thay đổi</button><button type="button" onClick={save}><Check />Lưu</button></div></div>}

    <div className="tf39-editor-layout">
      <main className="tf39-editor-main">
        <Panel title="Thông tin sản phẩm" description="Tên và nội dung khách hàng nhìn thấy trên storefront.">
          <div className="tf39-field-stack">
            <Field label="Tên sản phẩm"><input value={product.title} onChange={(event) => {const value = event.target.value; setProduct((current) => ({...current, title: value, handle: current.handle || slugify(value), seoTitle: current.seoTitle || (value ? `${value} | TimeForge` : ''), updatedAt: new Date().toISOString()}));}} placeholder="Ví dụ: Đồng Hồ Nữ Medusa Infinite" /></Field>
            <Field label="Mô tả sản phẩm" hint="Có thể chỉnh trực quan, HTML hoặc xem trước kết quả.">
              <div className="tf39-description-editor">
                <nav className="tf39-description-tabs" aria-label="Chế độ soạn thảo">
                  <button type="button" className={mode === 'visual' ? 'is-active' : ''} onClick={() => setMode('visual')}>Trình soạn thảo</button>
                  <button type="button" className={mode === 'html' ? 'is-active' : ''} onClick={() => setMode('html')}><Code2 />HTML</button>
                  <button type="button" className={mode === 'preview' ? 'is-active' : ''} onClick={() => setMode('preview')}><Eye />Xem trước</button>
                </nav>
                {mode === 'visual' && <>
                  <div className="tf39-rich-toolbar">
                    <select title="Kiểu đoạn" defaultValue="p" onChange={(event) => command('formatBlock', `<${event.target.value}>`)}><option value="p">Đoạn văn</option><option value="h2">Tiêu đề 2</option><option value="h3">Tiêu đề 3</option><option value="blockquote">Trích dẫn</option></select>
                    <span />
                    <ToolbarButton title="In đậm" onMouseDown={(event) => {event.preventDefault(); command('bold');}}><Bold /></ToolbarButton>
                    <ToolbarButton title="In nghiêng" onMouseDown={(event) => {event.preventDefault(); command('italic');}}><Italic /></ToolbarButton>
                    <ToolbarButton title="Gạch chân" onMouseDown={(event) => {event.preventDefault(); command('underline');}}><Underline /></ToolbarButton>
                    <ToolbarButton title="Gạch ngang" onMouseDown={(event) => {event.preventDefault(); command('strikeThrough');}}><Strikethrough /></ToolbarButton>
                    <span />
                    <ToolbarButton title="Danh sách bullet" onMouseDown={(event) => {event.preventDefault(); command('insertUnorderedList');}}><List /></ToolbarButton>
                    <ToolbarButton title="Danh sách đánh số" onMouseDown={(event) => {event.preventDefault(); command('insertOrderedList');}}><ListOrdered /></ToolbarButton>
                    <ToolbarButton title="Trích dẫn" onMouseDown={(event) => {event.preventDefault(); command('formatBlock', '<blockquote>');}}><Quote /></ToolbarButton>
                    <ToolbarButton title="Đường phân cách" onMouseDown={(event) => {event.preventDefault(); command('insertHorizontalRule');}}><Minus /></ToolbarButton>
                    <span />
                    <ToolbarButton title="Căn trái" onMouseDown={(event) => {event.preventDefault(); command('justifyLeft');}}><AlignLeft /></ToolbarButton>
                    <ToolbarButton title="Căn giữa" onMouseDown={(event) => {event.preventDefault(); command('justifyCenter');}}><AlignCenter /></ToolbarButton>
                    <ToolbarButton title="Căn phải" onMouseDown={(event) => {event.preventDefault(); command('justifyRight');}}><AlignRight /></ToolbarButton>
                    <span />
                    <ToolbarButton title="Chèn liên kết" onMouseDown={(event) => {event.preventDefault(); const url = window.prompt('Nhập URL liên kết'); if (url) command('createLink', url);}}><Link2 /></ToolbarButton>
                    <ToolbarButton title="Xóa định dạng" onMouseDown={(event) => {event.preventDefault(); command('removeFormat');}}><RemoveFormatting /></ToolbarButton>
                    <ToolbarButton title="Hoàn tác" onMouseDown={(event) => {event.preventDefault(); command('undo');}}><Undo2 /></ToolbarButton>
                    <ToolbarButton title="Làm lại" onMouseDown={(event) => {event.preventDefault(); command('redo');}}><Redo2 /></ToolbarButton>
                  </div>
                  <div ref={editorRef} className="tf39-rich-canvas" contentEditable suppressContentEditableWarning onInput={(event) => updateDescription(event.currentTarget.innerHTML)} />
                </>}
                {mode === 'html' && <div className="tf39-html-mode"><div className="tf39-html-head"><span><Code2 />Mã HTML sản phẩm</span><small>HTML được hiển thị trực tiếp trên trang chi tiết.</small></div><textarea spellCheck={false} value={product.descriptionHtml} onChange={(event) => updateDescription(event.target.value)} placeholder={'<p>Mô tả sản phẩm...</p>\n<h2>Thông số sản phẩm</h2>\n<ul><li>Mã SKU: ...</li></ul>'} /></div>}
                {mode === 'preview' && <article className="tf39-description-preview" dangerouslySetInnerHTML={{__html: product.descriptionHtml || '<p>Chưa có nội dung mô tả.</p>'}} />}
              </div>
            </Field>
          </div>
        </Panel>

        <Panel title="Ảnh sản phẩm" description="Dùng URL CDN. Ảnh đầu tiên là ảnh đại diện và có thể sắp xếp bằng nút lên/xuống." action={<span className="tf39-cdn-badge"><ImagePlus />URL CDN</span>}>
          <div className="tf39-media-url"><textarea rows={2} value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Dán một hoặc nhiều URL CDN, cách nhau bằng dấu phẩy hoặc xuống dòng" /><button type="button" disabled={!imageUrl.trim()} onClick={addImageUrls}>Thêm ảnh</button></div>
          {product.images.length ? <div className="tf39-media-grid">{product.images.map((image, index) => <article key={`${image}-${index}`}><img src={image} alt="" loading="lazy" decoding="async" /><span>{index === 0 ? 'Ảnh đại diện' : `Ảnh ${index + 1}`}</span><div><button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0}><ArrowUp /></button><button type="button" onClick={() => moveImage(index, 1)} disabled={index === product.images.length - 1}><ArrowDown /></button><button type="button" onClick={() => patch('images', product.images.filter((_, imageIndex) => imageIndex !== index))}><Trash2 /></button></div></article>)}</div> : <div className="tf39-dropzone tf39-cdn-empty"><ImagePlus /><b>Chưa có ảnh CDN</b><span>Dán URL phía trên để thêm ảnh sản phẩm.</span></div>}
        </Panel>

        <Panel title="Giá" description="Giá bán, giá so sánh và biên lợi nhuận dự kiến.">
          <div className="tf39-form-grid three"><Field label="Giá bán"><input type="number" value={product.price} onChange={(event) => {const value = Number(event.target.value); patch('price', value); patchPrimaryVariant({price: value});}} /></Field><Field label="Giá so sánh"><input type="number" value={product.compareAtPrice} onChange={(event) => {const value = Number(event.target.value); patch('compareAtPrice', value); patchPrimaryVariant({compareAtPrice: value});}} /></Field><Field label="Giá vốn"><input type="number" value={product.cost} onChange={(event) => patch('cost', Number(event.target.value))} /></Field></div>
          <div className="tf39-price-summary"><span><small>Lợi nhuận</small><b>{money(profit)}</b></span><span><small>Biên lợi nhuận</small><b>{margin}%</b></span></div>
        </Panel>

        <Panel title="Kho hàng" description="Theo dõi SKU, barcode và số lượng có thể bán.">
          <div className="tf39-form-grid three"><Field label="SKU"><input value={product.sku} onChange={(event) => {patch('sku', event.target.value); patchPrimaryVariant({sku: event.target.value});}} /></Field><Field label="Barcode"><input value={product.barcode} onChange={(event) => patch('barcode', event.target.value)} /></Field><Field label="Số lượng"><input type="number" value={product.inventory} onChange={(event) => {const value = Number(event.target.value); patch('inventory', value); patchPrimaryVariant({inventory: value});}} /></Field></div>
          <label className="tf39-check-row"><input type="checkbox" checked={product.trackInventory} onChange={(event) => patch('trackInventory', event.target.checked)} /><span><b>Theo dõi số lượng</b><small>Tự động cập nhật tồn kho khi có đơn hàng.</small></span></label>
        </Panel>

        <Panel title="Tùy chọn và phiên bản" description="Tạo lựa chọn như màu sắc, kích thước và quản lý từng phiên bản." action={<button className="tf39-secondary-action" type="button" onClick={addOption}><Plus />Thêm tùy chọn</button>}>
          <div className="tf39-options-list">{(product.options || []).map((option) => <article key={option.id}><input value={option.name} onChange={(event) => updateOption(option.id, {name: event.target.value})} /><input value={option.values.join(', ')} onChange={(event) => updateOption(option.id, {values: event.target.value.split(',').map((value) => value.trim()).filter(Boolean)})} placeholder="Giá trị, cách nhau bằng dấu phẩy" /><button type="button" onClick={() => patch('options', (product.options || []).filter((item) => item.id !== option.id))}><Trash2 /></button></article>)}{!(product.options || []).length && <p className="tf39-empty-inline">Chưa có tùy chọn.</p>}</div>
          <div className="tf39-variant-list"><div className="tf39-variant-head"><span>Tên phiên bản</span><span>SKU</span><span>Giá</span><span>Tồn</span><span /></div>{product.variants.map((variant) => <div className="tf39-variant-row" key={variant.id}><input value={variant.title} onChange={(event) => patch('variants', product.variants.map((item) => item.id === variant.id ? {...item, title: event.target.value} : item))} /><input value={variant.sku} onChange={(event) => patch('variants', product.variants.map((item) => item.id === variant.id ? {...item, sku: event.target.value} : item))} /><input type="number" value={variant.price} onChange={(event) => patch('variants', product.variants.map((item) => item.id === variant.id ? {...item, price: Number(event.target.value)} : item))} /><input type="number" value={variant.inventory} onChange={(event) => patch('variants', product.variants.map((item) => item.id === variant.id ? {...item, inventory: Number(event.target.value)} : item))} /><button type="button" disabled={product.variants.length === 1} onClick={() => patch('variants', product.variants.filter((item) => item.id !== variant.id))}><Trash2 /></button></div>)}</div>
          <button className="tf39-add-variant" type="button" onClick={() => patch('variants', [...product.variants, {id: uid('v'), title: `Variant ${product.variants.length + 1}`, sku: '', price: product.price, compareAtPrice: product.compareAtPrice, inventory: 0}])}><Plus />Thêm phiên bản</button>
        </Panel>

        <Panel title="Hiển thị trên công cụ tìm kiếm" description="Xem trước cách sản phẩm xuất hiện trên kết quả tìm kiếm.">
          <div className="tf39-seo-preview"><b>{product.seoTitle || product.title || 'Tên sản phẩm'}</b><span>timeforge.vn/products/{product.handle || 'duong-dan-san-pham'}</span><p>{product.seoDescription || 'Mô tả SEO sẽ hiển thị tại đây.'}</p></div>
          <div className="tf39-field-stack"><Field label={`Tiêu đề trang · ${product.seoTitle.length}/70`}><input value={product.seoTitle} onChange={(event) => patch('seoTitle', event.target.value)} /></Field><Field label={`Mô tả meta · ${product.seoDescription.length}/160`}><textarea rows={3} value={product.seoDescription} onChange={(event) => patch('seoDescription', event.target.value)} /></Field><Field label="URL handle"><div className="tf39-handle"><span>products/</span><input value={product.handle} onChange={(event) => patch('handle', slugify(event.target.value))} /></div></Field></div>
        </Panel>
      </main>

      <aside className="tf39-editor-side">
        <Panel title="Trạng thái"><Field label="Trạng thái sản phẩm"><select value={product.status} onChange={(event) => patch('status', event.target.value as Product['status'])}><option value="active">Đang hoạt động</option><option value="draft">Bản nháp</option><option value="archived">Lưu trữ</option></select></Field><div className={`tf39-status-note is-${product.status}`}><i /><span><b>{product.status === 'active' ? 'Hiển thị trên cửa hàng' : product.status === 'draft' ? 'Chưa công khai' : 'Đã lưu trữ'}</b><small>Thay đổi có hiệu lực sau khi lưu.</small></span></div></Panel>
        <Panel title="Tổ chức sản phẩm"><div className="tf39-field-stack"><Field label="Danh mục"><input value={product.category} onChange={(event) => patch('category', event.target.value)} /></Field><Field label="Loại sản phẩm"><input value={product.productType} onChange={(event) => patch('productType', event.target.value)} /></Field><Field label="Nhà cung cấp / thương hiệu"><input value={product.vendor} onChange={(event) => patch('vendor', event.target.value)} /></Field><Field label="Tags"><div className="tf39-tag-input"><div>{product.tags.map((tag) => <button type="button" key={tag} onClick={() => patch('tags', product.tags.filter((item) => item !== tag))}>{tag}<X /></button>)}</div><input value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => {if ((event.key === 'Enter' || event.key === ',') && tagInput.trim()) {event.preventDefault(); patch('tags', [...new Set([...product.tags, tagInput.trim()])]); setTagInput('');}}} placeholder="Nhập tag và Enter" /></div></Field><Field label="Bộ sưu tập"><div className="tf39-collection-list">{collectionNames.length ? collectionNames.map((name) => <span key={name}>{name}</span>) : <small>Gán từ trang Bộ sưu tập.</small>}</div></Field></div></Panel>
        <Panel title="Vận chuyển"><div className="tf39-form-grid two"><Field label="Khối lượng"><input type="number" value={product.weight} onChange={(event) => patch('weight', Number(event.target.value))} /></Field><Field label="Đơn vị"><select value={product.weightUnit} onChange={(event) => patch('weightUnit', event.target.value)}><option value="g">g</option><option value="kg">kg</option></select></Field></div></Panel>
        <Panel title="Metafields" description="Dữ liệu mở rộng theo namespace.key." action={<button className="tf39-icon-action" type="button" onClick={addMetafield}><Plus /></button>}><div className="tf39-metafields">{(product.metafields || []).map((metafield) => <article key={metafield.id}><input value={metafield.namespace} onChange={(event) => updateMetafield(metafield.id, {namespace: event.target.value})} placeholder="namespace" /><input value={metafield.key} onChange={(event) => updateMetafield(metafield.id, {key: event.target.value})} placeholder="key" /><textarea rows={2} value={metafield.value} onChange={(event) => updateMetafield(metafield.id, {value: event.target.value})} placeholder="Giá trị" /><button type="button" onClick={() => patch('metafields', (product.metafields || []).filter((item) => item.id !== metafield.id))}><Trash2 /></button></article>)}{!(product.metafields || []).length && <p className="tf39-empty-inline">Chưa có metafield.</p>}</div></Panel>
      </aside>
    </div>
  </div>;
}
