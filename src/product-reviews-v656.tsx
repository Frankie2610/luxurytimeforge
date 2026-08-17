import type {Product, StoreReview} from './types';
import {optimizedImage} from './image-utils';
import './v655-product-reviews.css';

export function ProductReviewsV656({product,reviews,rating}:{product:Product;reviews:StoreReview[];rating:number}){
  if(!reviews.length)return null;
  return <section className="tf655-product-reviews" aria-label={`Đánh giá về ${product.title}`}>
    <header>
      <div><small>ĐÁNH GIÁ SẢN PHẨM</small><h2>Trải nghiệm từ người đã chọn mẫu này.</h2><p>Đánh giá đã xuất bản và được gắn trực tiếp với đúng sản phẩm trong hệ thống TimeForge.</p></div>
      <div className="tf655-rating-summary"><b>{rating.toFixed(1)}</b><span aria-label={`${rating.toFixed(1)} trên 5 sao`}>{Array.from({length:5},(_,index)=><i key={index} className={index<Math.round(rating)?'is-on':''}>★</i>)}</span><small>{reviews.length} đánh giá xác thực</small></div>
    </header>
    <div className="tf655-review-grid">{reviews.slice(0,6).map(item=><article key={item.id}>
      {item.image&&<figure><img src={optimizedImage(item.image,720,540)} alt={`Ảnh review ${product.title} từ ${item.customerName}`} loading="lazy" decoding="async"/></figure>}
      <div><span className="tf655-review-stars" aria-label={`${item.rating}/5 sao`}>{Array.from({length:5},(_,index)=><i key={index} className={index<item.rating?'is-on':''}>★</i>)}</span>{item.title&&<h3>{item.title}</h3>}{item.text&&<p>“{item.text}”</p>}<footer><b>{item.customerName}</b><small>{item.source||'Khách hàng TimeForge'}</small></footer></div>
    </article>)}</div>
  </section>;
}
