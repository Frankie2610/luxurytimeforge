import {useEffect,useState} from 'react';
import {firebaseClient} from './firebase';

export type ManagedContentPageSlug='about'|'warranty'|'shipping'|'returns';

export interface ManagedContentSection{
  id:string;
  title:string;
  body:string;
}

export interface ManagedContentPage{
  slug:ManagedContentPageSlug;
  label:string;
  eyebrow:string;
  title:string;
  lead:string;
  published:boolean;
  sections:ManagedContentSection[];
  updatedAt:string;
}

const CONTENT_PAGES_KEY='tf.v4923.content-pages';
export const CONTENT_PAGES_UPDATED='timeforge:content-pages-updated';
const now=new Date().toISOString();

export const defaultManagedContentPages:ManagedContentPage[]=[
  {
    slug:'about',
    label:'Giới thiệu',
    eyebrow:'CÂU CHUYỆN TIMEFORGE',
    title:'TimeForge được xây quanh sự minh bạch.',
    lead:'Luxury thật sự là một trải nghiệm nhất quán — từ lúc khám phá sản phẩm đến nhiều năm sau khi sở hữu.',
    published:true,
    updatedAt:now,
    sections:[
      {id:'about-curation',title:'Tuyển chọn có chủ đích',body:'TimeForge tuyển chọn đồng hồ theo thiết kế, chất lượng sử dụng và giá trị lâu dài. Mỗi sản phẩm được trình bày với thông tin cần thiết để quyết định mua hàng rõ ràng hơn.'},
      {id:'about-transparency',title:'Thông tin minh bạch',body:'Hình ảnh, thông số, nguồn hàng và chính sách được trình bày nhất quán. Những điểm cần lưu ý được trao đổi trước khi hoàn tất giao dịch.'},
      {id:'about-aftercare',title:'Đồng hành sau bán hàng',body:'Giá trị của một chiếc đồng hồ được tiếp nối bằng trải nghiệm rõ ràng trước, trong và sau khi sở hữu. TimeForge hỗ trợ bảo hành, chăm sóc và các nhu cầu phát sinh trong quá trình sử dụng.'},
    ],
  },
  {
    slug:'warranty',
    label:'Bảo hành',
    eyebrow:'BẢO HÀNH & CHĂM SÓC',
    title:'Hỗ trợ sử dụng bền lâu.',
    lead:'Thông tin bảo hành được trình bày rõ theo từng thương hiệu và xác nhận cùng đơn hàng.',
    published:true,
    updatedAt:now,
    sections:[
      {id:'warranty-coverage',title:'Phạm vi bảo hành',body:'Thời hạn và phạm vi áp dụng được xác định theo chính sách của từng thương hiệu, nguồn hàng và thông tin trên sản phẩm.'},
      {id:'warranty-process',title:'Quy trình tiếp nhận',body:'Liên hệ TimeForge và cung cấp mã đơn hàng. Đội ngũ sẽ kiểm tra thông tin, hướng dẫn đóng gói và xác nhận nơi tiếp nhận phù hợp.'},
      {id:'warranty-note',title:'Lưu ý khi sử dụng',body:'Các hao mòn tự nhiên, dây đeo, va đập, vào nước vượt mức công bố hoặc sử dụng không đúng hướng dẫn có thể nằm ngoài phạm vi bảo hành.'},
    ],
  },
  {
    slug:'shipping',
    label:'Giao hàng',
    eyebrow:'GIAO HÀNG AN TOÀN',
    title:'Đóng gói chỉn chu, theo dõi minh bạch.',
    lead:'Mỗi đơn hàng được xác nhận, bảo vệ và cập nhật trạng thái trong suốt quá trình vận chuyển.',
    published:true,
    updatedAt:now,
    sections:[
      {id:'shipping-scope',title:'Phạm vi giao hàng',body:'TimeForge hỗ trợ giao hàng trên toàn quốc. Một số khu vực có thể cần thêm thời gian xử lý tùy theo đơn vị vận chuyển.'},
      {id:'shipping-time',title:'Thời gian dự kiến',body:'Đơn hàng thường được giao trong 1–4 ngày làm việc sau khi xác nhận. Thời gian thực tế có thể thay đổi theo khu vực và tình trạng sản phẩm.'},
      {id:'shipping-check',title:'Kiểm tra khi nhận hàng',body:'Vui lòng kiểm tra tình trạng kiện hàng và quay lại quá trình mở hộp. Liên hệ TimeForge sớm nếu phát hiện dấu hiệu bất thường.'},
    ],
  },
  {
    slug:'returns',
    label:'Đổi trả',
    eyebrow:'ĐỔI TRẢ MINH BẠCH',
    title:'Quy trình rõ ràng cho từng yêu cầu.',
    lead:'Yêu cầu đổi trả được đánh giá dựa trên tình trạng sản phẩm, thời điểm tiếp nhận và điều kiện đã công bố.',
    published:true,
    updatedAt:now,
    sections:[
      {id:'returns-window',title:'Thời gian yêu cầu',body:'Liên hệ TimeForge ngay sau khi nhận hàng để được ghi nhận và hướng dẫn. Thời hạn cụ thể được xác nhận theo từng sản phẩm.'},
      {id:'returns-condition',title:'Điều kiện sản phẩm',body:'Sản phẩm cần giữ nguyên tình trạng, hộp, phụ kiện, tem và chứng từ đi kèm; không có dấu hiệu sử dụng hoặc tác động ngoài phạm vi kiểm tra thông thường.'},
      {id:'returns-process',title:'Các bước xử lý',body:'Cung cấp mã đơn, hình ảnh hoặc video tình trạng sản phẩm. TimeForge sẽ kiểm tra, xác nhận phương án và hướng dẫn gửi hàng khi đủ điều kiện.'},
    ],
  },
];

const isSlug=(value:unknown):value is ManagedContentPageSlug=>value==='about'||value==='warranty'||value==='shipping'||value==='returns';

function normalizePage(value:Partial<ManagedContentPage>,fallback:ManagedContentPage):ManagedContentPage{
  const sections=Array.isArray(value.sections)?value.sections.filter(Boolean).map((section,index)=>({
    id:String(section?.id||`${fallback.slug}-${index+1}`),
    title:String(section?.title||`Nội dung ${index+1}`),
    body:String(section?.body||''),
  })):fallback.sections;
  return{
    ...fallback,
    ...value,
    slug:isSlug(value.slug)?value.slug:fallback.slug,
    label:String(value.label||fallback.label),
    eyebrow:String(value.eyebrow||fallback.eyebrow),
    title:String(value.title||fallback.title),
    lead:String(value.lead||fallback.lead),
    published:value.published!==false,
    sections:sections.length?sections:fallback.sections,
    updatedAt:String(value.updatedAt||fallback.updatedAt),
  };
}

export function normalizeManagedContentPages(value:unknown):ManagedContentPage[]{
  const incoming=Array.isArray(value)
    ?value
    :value&&typeof value==='object'
      ?Object.values(value as Record<string,ManagedContentPage>)
      :[];
  return defaultManagedContentPages.map(fallback=>{
    const match=incoming.find(item=>item&&isSlug(item.slug)&&item.slug===fallback.slug);
    return normalizePage(match||{},fallback);
  });
}

export function readManagedContentPages(){
  try{return normalizeManagedContentPages(JSON.parse(localStorage.getItem(CONTENT_PAGES_KEY)||'null'))}
  catch{return structuredClone(defaultManagedContentPages)}
}

export function useManagedContentPages(){
  const[pages,setPages]=useState<ManagedContentPage[]>(readManagedContentPages);

  useEffect(()=>{
    if(!firebaseClient.enabled)return;
    let active=true;
    void firebaseClient.read<Record<string,ManagedContentPage>|ManagedContentPage[]>('timeforge/contentPages')
      .then(remote=>{if(!active||!remote)return;const next=normalizeManagedContentPages(remote);setPages(next);localStorage.setItem(CONTENT_PAGES_KEY,JSON.stringify(next))})
      .catch(()=>{});
    return()=>{active=false};
  },[]);

  useEffect(()=>{
    const sync=()=>setPages(readManagedContentPages());
    window.addEventListener(CONTENT_PAGES_UPDATED,sync);
    return()=>window.removeEventListener(CONTENT_PAGES_UPDATED,sync);
  },[]);

  const savePage=async(page:ManagedContentPage)=>{
    const fallback=defaultManagedContentPages.find(item=>item.slug===page.slug)||defaultManagedContentPages[0];
    const normalized=normalizePage({...page,updatedAt:new Date().toISOString()},fallback);
    const next=pages.map(item=>item.slug===normalized.slug?normalized:item);
    if(firebaseClient.enabled)await firebaseClient.write(`timeforge/contentPages/${normalized.slug}`,normalized);
    setPages(next);
    localStorage.setItem(CONTENT_PAGES_KEY,JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(CONTENT_PAGES_UPDATED,{detail:normalized}));
  };

  return{pages,savePage};
}
