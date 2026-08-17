import {readProductFilterValues} from './product-filter-data';
import type {Product} from './types';

export type SeoLandingKind='gender'|'price'|'sale';
export interface SeoLandingDefinition{path:string;title:string;description:string;eyebrow:string;intro:string;kind:SeoLandingKind;value:string|number}

export const SEO_LANDING_PAGES:SeoLandingDefinition[]=[
  {path:'/dong-ho-nam',title:'Đồng hồ nam chính hãng',description:'Khám phá đồng hồ nam chính hãng với thiết kế dễ đeo, thông tin rõ ràng, giá minh bạch và hỗ trợ hậu mãi từ Luxury Timeforge.',eyebrow:'DÀNH CHO NAM',intro:'Chọn nhanh những mẫu đồng hồ nam phù hợp phong cách hằng ngày, công sở hoặc làm quà tặng.',kind:'gender',value:'Nam'},
  {path:'/dong-ho-nu',title:'Đồng hồ nữ chính hãng',description:'Khám phá đồng hồ nữ chính hãng với nhiều kiểu dáng, kích thước và mức giá, kèm chính sách bảo hành và giao hàng rõ ràng.',eyebrow:'DÀNH CHO NỮ',intro:'Những thiết kế nữ tính, thanh lịch hoặc cá tính được tuyển chọn để dễ so sánh và chọn mua online.',kind:'gender',value:'Nữ'},
  {path:'/dong-ho-duoi-5-trieu',title:'Đồng hồ dưới 5 triệu',description:'Tìm đồng hồ chính hãng dưới 5 triệu đồng tại Luxury Timeforge, dễ lọc theo thương hiệu, kiểu dáng và tình trạng còn hàng.',eyebrow:'NGÂN SÁCH DỄ CHỌN',intro:'Danh sách sản phẩm có giá hiện tại không quá 5 triệu đồng, phù hợp khi cần khoanh vùng ngân sách nhanh.',kind:'price',value:5000000},
  {path:'/dong-ho-sale',title:'Đồng hồ đang giảm giá',description:'Xem các mẫu đồng hồ đang giảm giá tại Luxury Timeforge với giá hiện tại, giá so sánh và tình trạng hàng được cập nhật rõ ràng.',eyebrow:'GIÁ TỐT ĐANG CÓ',intro:'Tổng hợp những mẫu đang có giá bán thấp hơn giá so sánh để dễ kiểm tra deal đang áp dụng.',kind:'sale',value:'sale'},
];

export const getSeoLandingByPath=(path:string)=>SEO_LANDING_PAGES.find(item=>item.path===path);

export const matchSeoLandingProduct=(landing:SeoLandingDefinition,product:Product)=>{
  if(product.status!=='active'||product.published===false)return false;
  if(landing.kind==='price')return Number(product.price)>0&&Number(product.price)<=Number(landing.value);
  if(landing.kind==='sale')return Number(product.compareAtPrice)>Number(product.price)&&Number(product.price)>0;
  if(landing.kind==='gender')return readProductFilterValues(product,'gender').some(value=>value.toLocaleLowerCase('vi-VN')===String(landing.value).toLocaleLowerCase('vi-VN'));
  return false;
};
