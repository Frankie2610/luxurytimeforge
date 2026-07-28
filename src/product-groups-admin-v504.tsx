import {useMemo, useState, type ChangeEvent, type DragEvent} from 'react';
import Papa from 'papaparse';
import {CheckCircle2, Download, FileSpreadsheet, ImageOff, Layers3, Pencil, Plus, RotateCw, Save, Trash2, UploadCloud, X} from 'lucide-react';
import {toast} from 'sonner';
import {useCommerce} from './context';
import {readProductFilterValues} from './product-filter-data';
import {buildAutomaticProductGroups} from './product-groups';
import type {Product, ProductGroup, ProductGroupItem} from './types';
import {slugify, uid} from './utils';
import './v504-product-groups-admin.css';

type ImportRow=Record<string, unknown>;

const plain=(value:unknown)=>String(value??'').trim();
const normalized=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,'');
const valueOf=(row:ImportRow,aliases:string[])=>{
  const accepted=new Set(aliases.map(normalized));
  const entry=Object.entries(row).find(([key])=>accepted.has(normalized(key)));
  return plain(entry?.[1]);
};
const rowFields={
  name:['Tên BST','Ten BST','Bộ sưu tập','Collection Name','Collection'],
  prefix:['Tiền tố SKU','SKU Prefix','Prefix','Số SKU'],
  sku:['SKU sản phẩm','Product SKU','SKU','Mã SKU'],
  productName:['Tên sản phẩm','Product Name','Sản phẩm'],
  color:['Màu sắc','Màu','Color','Colour'],
  size:['Kích thước','Size'],
  image:['Hình ảnh','Image','Image URL','Ảnh'],
};
const itemFromProduct=(product:Product,index:number):ProductGroupItem=>({
  id:uid('group-item'),
  productId:product.id,
  sku:product.sku,
  name:product.title,
  color:readProductFilterValues(product,'bandColor')[0]||readProductFilterValues(product,'caseColor')[0]||'',
  size:readProductFilterValues(product,'faceSize')[0]||'',
  image:product.images[0]||'',
  sortOrder:index,
});
const itemFromRow=(row:ImportRow,product:Product|undefined,index:number):ProductGroupItem=>({
  id:uid('group-item'),
  productId:product?.id||'',
  sku:valueOf(row,rowFields.sku)||product?.sku||'',
  name:valueOf(row,rowFields.productName)||product?.title||'Sản phẩm chưa đối chiếu',
  color:valueOf(row,rowFields.color)||(product?readProductFilterValues(product,'bandColor')[0]||readProductFilterValues(product,'caseColor')[0]:'')||'',
  size:valueOf(row,rowFields.size)||(product?readProductFilterValues(product,'faceSize')[0]:'')||'',
  image:valueOf(row,rowFields.image)||product?.images[0]||'',
  sortOrder:index,
});

const buildGroups=(rows:ImportRow[],products:Product[],existing:ProductGroup[])=>{
  const buckets=new Map<string,{name:string;prefix:string;rows:ImportRow[]}>();
  rows.forEach((row)=>{
    const name=valueOf(row,rowFields.name);
    const prefix=valueOf(row,rowFields.prefix).toUpperCase();
    if(!prefix)return;
    const key=`${normalized(name||prefix)}::${prefix}`;
    const bucket=buckets.get(key)||{name:name||prefix,prefix,rows:[]};
    bucket.rows.push(row);
    buckets.set(key,bucket);
  });
  return [...buckets.values()].map((bucket):ProductGroup=>{
    const previous=existing.find((group)=>group.skuPrefix.toUpperCase()===bucket.prefix);
    const explicit=bucket.rows.map((row,index)=>{
      const sku=valueOf(row,rowFields.sku);
      const match=products.find((product)=>product.sku.toUpperCase()===sku.toUpperCase());
      return itemFromRow(row,match,index);
    }).filter((item)=>item.sku);
    const seen=new Set(explicit.map((item)=>item.sku.toUpperCase()));
    const automatic=products
      .filter((product)=>product.sku.toUpperCase().startsWith(bucket.prefix)&&!seen.has(product.sku.toUpperCase()))
      .map((product,index)=>itemFromProduct(product,explicit.length+index));
    const now=new Date().toISOString();
    return {
      id:previous?.id||`group-${slugify(bucket.name)}-${slugify(bucket.prefix)}`,
      name:bucket.name,
      skuPrefix:bucket.prefix,
      description:previous?.description||'Các phiên bản cùng dòng được nhóm tự động theo tiền tố SKU.',
      status:previous?.status||'active',
      source:'manual',
      manualOverride:true,
      items:[...explicit,...automatic],
      createdAt:previous?.createdAt||now,
      updatedAt:now,
    };
  });
};

const downloadTemplate=()=>{
  const csv=Papa.unparse([{
    'Tên BST':'Discoverer One',
    'Tiền tố SKU':'AOSY25',
    'SKU sản phẩm':'AOSY25021',
    'Tên sản phẩm':'Discoverer One Blue',
    'Màu sắc':'Xanh navy',
    'Kích thước':'40 mm',
    'Hình ảnh':'https://example.com/watch.jpg',
  }]);
  const url=URL.createObjectURL(new Blob([`\uFEFF${csv}`],{type:'text/csv;charset=utf-8'}));
  const anchor=document.createElement('a');
  anchor.href=url;anchor.download='timeforge-mau-nhom-bst.csv';anchor.click();
  URL.revokeObjectURL(url);
};

export function ProductGroupsAdminV504(){
  const{products,productGroups,replaceProductGroups,saveProductGroup,deleteProductGroup}=useCommerce();
  const[preview,setPreview]=useState<ProductGroup[]>([]);
  const[fileName,setFileName]=useState('');
  const[dragging,setDragging]=useState(false);
  const[manualName,setManualName]=useState('');
  const[manualPrefix,setManualPrefix]=useState('');
  const[editing,setEditing]=useState<ProductGroup|null>(null);
  const catalogProducts=useMemo(()=>products.filter((product)=>product.sku),[products]);

  const inspect=async(file:File|null)=>{
    if(!file)return;
    try{
      const text=await file.text();
      const rows=file.name.toLowerCase().endsWith('.json')
        ? (JSON.parse(text) as ImportRow[])
        : Papa.parse<ImportRow>(text,{header:true,skipEmptyLines:true}).data;
      if(!Array.isArray(rows))throw new Error('File phải chứa danh sách dòng dữ liệu.');
      const groups=buildGroups(rows,catalogProducts,productGroups);
      if(!groups.length)throw new Error('Không tìm thấy cột “Tiền tố SKU” hợp lệ.');
      setPreview(groups);setFileName(file.name);
      toast.success(`Đã đọc ${groups.length} nhóm BST.`);
    }catch(reason){
      toast.error(reason instanceof Error?reason.message:'Không thể đọc file.');
      setPreview([]);setFileName('');
    }
  };
  const choose=(event:ChangeEvent<HTMLInputElement>)=>void inspect(event.target.files?.[0]||null);
  const drop=(event:DragEvent<HTMLLabelElement>)=>{event.preventDefault();setDragging(false);void inspect(event.dataTransfer.files?.[0]||null)};
  const createFromCatalog=()=>{
    const prefix=manualPrefix.trim().toUpperCase();
    if(!manualName.trim()||!prefix){toast.error('Nhập tên BST và tiền tố SKU.');return}
    const rows=catalogProducts.filter((product)=>product.sku.toUpperCase().startsWith(prefix)).map((product)=>({
      'Tên BST':manualName.trim(),'Tiền tố SKU':prefix,'SKU sản phẩm':product.sku,
    }));
    if(!rows.length){toast.error('Không có sản phẩm nào khớp tiền tố SKU này.');return}
    setPreview(buildGroups(rows,catalogProducts,productGroups));setFileName('Tạo từ catalog');
  };
  const save=()=>{
    if(!preview.length)return;
    const incomingPrefixes=new Set(preview.map((group)=>group.skuPrefix.toUpperCase()));
    replaceProductGroups([...preview,...productGroups.filter((group)=>!incomingPrefixes.has(group.skuPrefix.toUpperCase()))]);
    setPreview([]);setFileName('');
    toast.success('Đã lưu nhóm BST và cập nhật storefront.');
  };
  const regenerate=()=>{
    const groups=buildAutomaticProductGroups(catalogProducts,productGroups);
    replaceProductGroups(groups);
    toast.success(`Đã quét catalog và cập nhật ${groups.filter((group)=>group.source==='automatic').length} nhóm SKU tự động.`);
  };
  const saveEditing=()=>{
    if(!editing)return;
    const prefix=editing.skuPrefix.trim().toUpperCase();
    if(!editing.name.trim()||!prefix){toast.error('Tên BST và tiền tố SKU không được để trống.');return}
    saveProductGroup({...editing,name:editing.name.trim(),skuPrefix:prefix,manualOverride:true,updatedAt:new Date().toISOString()});
    setEditing(null);
    toast.success('Đã lưu phần chỉnh thủ công.');
  };

  return <div className="tf504-groups-admin">
    <section className="tf504-group-intro">
      <div><span><Layers3/></span><div><small>NHÓM SẢN PHẨM THEO SKU</small><h2>Tự động tạo nhóm ngay khi nhập catalog</h2><p>Hệ thống áp dụng độ dài tiền tố riêng theo thương hiệu, chỉ tạo nhóm có từ hai sản phẩm và tự lấy hình đầu, màu dây, kích thước. Trang này dùng để rà soát và sửa các trường hợp ngoại lệ.</p></div></div>
      <div className="tf504-group-intro-actions"><button type="button" onClick={regenerate}><RotateCw/>Quét lại catalog</button><button type="button" onClick={downloadTemplate}><Download/>File mapping tùy chọn</button></div>
    </section>

    {editing&&<GroupEditor group={editing} products={catalogProducts} onChange={setEditing} onCancel={()=>setEditing(null)} onSave={saveEditing}/>}

    <div className="tf504-group-workspace">
      <section className="tf504-group-import">
        <header><div><small>TÙY CHỌN NÂNG CAO</small><h3>Nhập mapping để ghi đè</h3><p>Không cần bước này khi nhập sản phẩm. Chỉ dùng CSV/JSON nếu muốn đặt tên, màu, size hoặc hình riêng.</p></div><FileSpreadsheet/></header>
        <label className={dragging?'is-dragging':''} onDragEnter={()=>setDragging(true)} onDragLeave={()=>setDragging(false)} onDragOver={(event)=>event.preventDefault()} onDrop={drop}>
          <input type="file" accept=".csv,.json,text/csv,application/json" onChange={choose}/>
          <UploadCloud/><b>{fileName||'Thả file vào đây hoặc bấm để chọn'}</b><span>CSV / JSON · nên dùng UTF-8 để giữ đúng tiếng Việt</span>
        </label>
        <div className="tf504-group-or"><span>hoặc thêm nhóm ngoại lệ</span></div>
        <div className="tf504-group-manual">
          <label><span>Tên bộ sưu tập</span><input value={manualName} onChange={(event)=>setManualName(event.target.value)} placeholder="Ví dụ: Discoverer One"/></label>
          <label><span>Tiền tố SKU</span><input value={manualPrefix} onChange={(event)=>setManualPrefix(event.target.value.toUpperCase())} placeholder="Ví dụ: AOSY25"/></label>
          <button type="button" onClick={createFromCatalog}><Plus/>Tạo nhóm</button>
        </div>
      </section>

      <aside className="tf504-group-guide">
        <small>LOGIC TỰ ĐỘNG</small><h3>Độ dài tiền tố SKU</h3>
        <dl><div><dt>4 ký tự</dt><dd>Versace, Ferragamo</dd></div><div><dt>5 ký tự</dt><dd>Mặc định, Philipp Plein, Versus by Versace</dd></div><div><dt>6–7 ký tự</dt><dd>Missoni, Guess · Ted Baker</dd></div><div><dt>8–10 ký tự</dt><dd>Adidas, Locman · Furla</dd></div></dl>
      </aside>
    </div>

    {preview.length>0&&<section className="tf504-group-preview">
      <header><div><small>BƯỚC 02 · XEM TRƯỚC</small><h3>{preview.length} bộ sưu tập sẵn sàng</h3></div><button type="button" onClick={save}><CheckCircle2/>Lưu và hiển thị</button></header>
      <div>{preview.map((group)=><GroupCard key={group.id} group={group} products={products}/>)}</div>
    </section>}

    <section className="tf504-group-saved">
      <header><div><small>ĐANG SỬ DỤNG</small><h3>Nhóm BST đã lưu</h3><p>{productGroups.length} nhóm · {productGroups.filter((group)=>group.source==='automatic').length} nhóm được tạo tự động.</p></div><button type="button" className="tf504-regenerate" onClick={regenerate}><RotateCw/>Đồng bộ lại</button></header>
      {productGroups.length?<div>{productGroups.map((group)=><GroupCard key={group.id} group={group} products={products} onEdit={()=>setEditing(structuredClone(group))} onDelete={()=>{if(window.confirm(`Xóa nhóm “${group.name}”?`))deleteProductGroup(group.id)}}/>)}</div>:<div className="tf504-group-empty"><Layers3/><b>Chưa có nhóm BST đủ hai sản phẩm</b><span>Nhập catalog sản phẩm hoặc bấm “Quét lại catalog” để hệ thống nhóm SKU.</span></div>}
    </section>
  </div>;
}

function GroupEditor({group,products,onChange,onCancel,onSave}:{group:ProductGroup;products:Product[];onChange:(group:ProductGroup)=>void;onCancel:()=>void;onSave:()=>void}){
  const[sku,setSku]=useState('');
  const patchItem=(id:string,patch:Partial<ProductGroupItem>)=>onChange({...group,items:group.items.map((item)=>item.id===id?{...item,...patch}:item)});
  const addSku=()=>{
    const product=products.find((item)=>item.sku.toUpperCase()===sku.trim().toUpperCase());
    if(!product){toast.error('Không tìm thấy SKU này trong catalog.');return}
    if(group.items.some((item)=>item.productId===product.id||item.sku.toUpperCase()===product.sku.toUpperCase())){toast.info('SKU đã có trong nhóm.');return}
    onChange({...group,items:[...group.items,itemFromProduct(product,group.items.length)]});
    setSku('');
  };
  return <section className="tf504-group-editor">
    <header><div><small>CHỈNH THỦ CÔNG</small><h3>{group.name}</h3><p>Thay đổi ở đây được giữ lại khi hệ thống quét lại catalog.</p></div><button type="button" onClick={onCancel} aria-label="Đóng"><X/></button></header>
    <div className="tf504-group-editor-meta">
      <label><span>Tên bộ sưu tập</span><input value={group.name} onChange={(event)=>onChange({...group,name:event.target.value})}/></label>
      <label><span>Tiền tố SKU</span><input value={group.skuPrefix} onChange={(event)=>onChange({...group,skuPrefix:event.target.value.toUpperCase()})}/></label>
      <label><span>Trạng thái</span><select value={group.status} onChange={(event)=>onChange({...group,status:event.target.value as ProductGroup['status']})}><option value="active">Đang hiển thị</option><option value="draft">Bản nháp</option></select></label>
    </div>
    <div className="tf504-group-editor-items">{group.items.map((item)=><article key={item.id}>
      {item.image?<img src={item.image} alt=""/>:<span className="tf504-group-no-image"><ImageOff/></span>}
      <div><b>{item.name}</b><small>{item.sku}</small></div>
      <label><span>Màu sắc</span><input value={item.color} onChange={(event)=>patchItem(item.id,{color:event.target.value})} placeholder="Ví dụ: Đen"/></label>
      <label><span>Kích thước</span><input value={item.size} onChange={(event)=>patchItem(item.id,{size:event.target.value})} placeholder="Ví dụ: 40 mm"/></label>
      <button type="button" onClick={()=>onChange({...group,items:group.items.filter((candidate)=>candidate.id!==item.id)})} aria-label={`Bỏ ${item.sku}`}><Trash2/></button>
    </article>)}</div>
    <div className="tf504-group-editor-add"><label><span>Thêm sản phẩm bằng SKU</span><input value={sku} onChange={(event)=>setSku(event.target.value.toUpperCase())} placeholder="Nhập SKU chính xác"/></label><button type="button" onClick={addSku}><Plus/>Thêm vào nhóm</button></div>
    <footer><button type="button" onClick={onCancel}>Hủy</button><button type="button" onClick={onSave}><Save/>Lưu chỉnh sửa</button></footer>
  </section>;
}

function GroupCard({group,products,onEdit,onDelete}:{group:ProductGroup;products:Product[];onEdit?:()=>void;onDelete?:()=>void}){
  const matched=group.items.filter((item)=>item.productId&&products.some((product)=>product.id===item.productId)).length;
  return <article className="tf504-group-card">
    <header><div><small>{group.source==='automatic'?'TỰ ĐỘNG':'THỦ CÔNG'} · SKU BẮT ĐẦU BẰNG <b>{group.skuPrefix}</b></small><h4>{group.name}</h4><span>{group.items.length} phiên bản · {matched} đã đối chiếu catalog{group.manualOverride?' · đã chỉnh':''}</span></div>{(onEdit||onDelete)&&<div className="tf504-group-card-actions">{onEdit&&<button type="button" onClick={onEdit} aria-label={`Sửa ${group.name}`}><Pencil/></button>}{onDelete&&<button type="button" className="danger" onClick={onDelete} aria-label={`Xóa ${group.name}`}><Trash2/></button>}</div>}</header>
    <div className="tf504-group-items">{group.items.slice(0,8).map((item)=><div key={item.id}>
      {item.image?<img src={item.image} alt=""/>:<span className="tf504-group-no-image"><ImageOff/></span>}
      <span><b>{item.name}</b><small>{item.sku}</small><em>{[item.color,item.size].filter(Boolean).join(' · ')||'Chưa có màu / kích thước'}</em></span>
    </div>)}</div>
    {group.items.length>8&&<p>+ {group.items.length-8} phiên bản khác</p>}
  </article>;
}

export default ProductGroupsAdminV504;
