import {useEffect,useMemo,useState} from 'react';
import {ArrowRight,CheckCircle2,PackageCheck,ShoppingBag,Tag} from 'lucide-react';
import {Link} from 'react-router-dom';
import {toast} from 'sonner';
import {useCartActions} from './context';
import {productImage,SmartImage} from './image-utils';
import {extractProductSpecsV571} from './product-specs-v571';
import {StorefrontDialog,StorefrontDialogContent} from './storefront-ui-v575';
import type {Product} from './types';
import {discount,money} from './utils';
import './v620-storefront-quickview.css';

const specRows=[
  ['Giới tính','gender'],
  ['Đường kính','diameter'],
  ['Mặt kính','glass'],
  ['Chống nước','waterResistance'],
  ['Dây đeo','strap'],
  ['Bảo hành','warranty'],
] as const;

export function QuickViewV62({product,onClose}:{product:Product;onClose:()=>void}){
  const{addToCart}=useCartActions();
  const[imageIndex,setImageIndex]=useState(0);
  const specs=useMemo(()=>extractProductSpecsV571(product),[product]);
  const images=useMemo(()=>product.images.length?product.images.slice(0,5):[productImage(product)],[product]);
  const variant=product.variants.find(item=>item.inventory>0)||product.variants[0];
  const price=variant?.price||product.price;
  const compareAt=variant?.compareAtPrice||product.compareAtPrice;
  const sale=discount(price,compareAt);
  useEffect(()=>setImageIndex(0),[product.id]);
  const add=()=>{
    if(product.inventory<=0||!variant){toast.error('Sản phẩm đang tạm hết hàng');return}
    addToCart(product.id,variant.id,1);
    toast.success(`Đã thêm ${product.title} vào giỏ hàng`);
  };
  return <StorefrontDialog open onOpenChange={open=>{if(!open)onClose()}}>
    <StorefrontDialogContent className="tf62-quickview" overlayClassName="tf62-quickview-overlay" title="Xem nhanh sản phẩm" description="Kiểm tra nhanh thiết kế, giá và thông số chính mà không rời danh sách.">
      <div className="tf62-qv-grid">
        <section className="tf62-qv-gallery" aria-label="Ảnh sản phẩm">
          <div className="tf62-qv-main-image">
            <SmartImage src={images[imageIndex]||productImage(product)} alt={product.title} width={760} height={760} sizes="(max-width: 720px) 92vw, 44vw" priority/>
            <div className="tf62-qv-badges">{sale>0&&<span><Tag/>Giảm {sale}%</span>}<span className={product.inventory>0?'is-stock':'is-out'}><PackageCheck/>{product.inventory>0?`Còn hàng${product.inventory<=3?` · ${product.inventory} chiếc`:''}`:'Tạm hết hàng'}</span></div>
          </div>
          {images.length>1&&<div className="tf62-qv-thumbs">{images.map((image,index)=><button key={`${image}-${index}`} type="button" className={index===imageIndex?'is-active':''} onClick={()=>setImageIndex(index)} aria-label={`Xem ảnh ${index+1}`}><SmartImage src={image} alt="" width={150} height={150}/></button>)}</div>}
        </section>
        <section className="tf62-qv-copy">
          <header><small>{product.vendor||'TIMEFORGE'} · {product.sku||variant?.sku||'WATCH'}</small><h2>{product.title}</h2><div className={`tf62-qv-price ${compareAt>price?'is-sale':''}`}><strong>{money(price)}</strong>{compareAt>price&&<del>{money(compareAt)}</del>}</div></header>
          <p className="tf62-qv-description">{product.descriptionText||'Thiết kế được tuyển chọn với thông tin sản phẩm rõ ràng và chính sách hậu mãi từ TimeForge.'}</p>
          <dl className="tf62-qv-specs">{specRows.map(([label,key])=>specs[key]?<div key={key}><dt>{label}</dt><dd>{specs[key]}</dd></div>:null)}</dl>
          <div className="tf62-qv-assurance"><span><CheckCircle2/>Thông tin rõ ràng</span><span><PackageCheck/>Đóng gói cẩn thận</span></div>
          <div className="tf62-qv-actions"><button type="button" className="tf62-qv-add" onClick={add} disabled={product.inventory<=0||!variant}><ShoppingBag/>{product.inventory>0?'Thêm vào giỏ':'Tạm hết hàng'}</button><Link to={`/products/${product.handle}`} onClick={onClose}>Xem chi tiết<ArrowRight/></Link></div>
        </section>
      </div>
    </StorefrontDialogContent>
  </StorefrontDialog>;
}
