import {useCallback,useEffect,useMemo,useState,useSyncExternalStore} from 'react';
import {ArrowRight,Scale,X} from 'lucide-react';
import {Link,useLocation} from 'react-router-dom';
import {useCommerce} from './context';
import {optimizedImage,productImage} from './image-utils';

const KEY='tf.v57.compare-products';
const LIMIT=3;
export type CompareToggleResult='added'|'removed'|'limit';
type CompareValue={ids:string[];includes:(id:string)=>boolean;toggle:(id:string)=>CompareToggleResult;remove:(id:string)=>void;clear:()=>void;replace:(ids:string[])=>void;limit:number};

const sanitize=(value:unknown)=>Array.isArray(value)?[...new Set(value.map(String).map(item=>item.trim()).filter(Boolean))].slice(0,LIMIT):[];
const readIds=()=>{if(typeof window==='undefined')return[];try{return sanitize(JSON.parse(window.localStorage.getItem(KEY)||'[]'))}catch{return[]}};
let currentIds=readIds();
const EMPTY_IDS:string[]=[];
const listeners=new Set<()=>void>();
const snapshot=()=>currentIds;
const serverSnapshot=()=>EMPTY_IDS;
const subscribe=(listener:()=>void)=>{listeners.add(listener);return()=>listeners.delete(listener)};
const commit=(next:string[])=>{
  const normalized=sanitize(next);
  if(normalized.length===currentIds.length&&normalized.every((id,index)=>id===currentIds[index]))return;
  currentIds=normalized;
  try{if(currentIds.length)window.localStorage.setItem(KEY,JSON.stringify(currentIds));else window.localStorage.removeItem(KEY)}catch{/* Comparison remains available for this tab. */}
  listeners.forEach(listener=>listener());
};
const toggleId=(id:string):CompareToggleResult=>{
  if(currentIds.includes(id)){commit(currentIds.filter(item=>item!==id));return'removed'}
  if(currentIds.length>=LIMIT)return'limit';
  commit([...currentIds,id]);return'added';
};
const removeId=(id:string)=>commit(currentIds.filter(item=>item!==id));
const clearIds=()=>commit([]);
const replaceIds=(ids:string[])=>commit(ids);

if(typeof window!=='undefined')window.addEventListener('storage',event=>{
  if(event.key!==KEY)return;
  const next=readIds();
  if(next.length===currentIds.length&&next.every((id,index)=>id===currentIds[index]))return;
  currentIds=next;listeners.forEach(listener=>listener());
});

export function useCompareV57():CompareValue{
  const ids=useSyncExternalStore(subscribe,snapshot,serverSnapshot);
  const includes=useCallback((id:string)=>ids.includes(id),[ids]);
  return useMemo(()=>({ids,includes,toggle:toggleId,remove:removeId,clear:clearIds,replace:replaceIds,limit:LIMIT}),[ids,includes]);
}

export const useCompareItemV57=(id:string)=>{const compare=useCompareV57();return{...compare,selected:Boolean(id&&compare.includes(id))}};

export function CompareDockV57(){
  const{ids,remove,clear,replace}=useCompareV57();
  const{products,isLoading}=useCommerce();
  const location=useLocation();
  const[dismissedKey,setDismissedKey]=useState('');
  const selected=useMemo(()=>ids.map(id=>products.find(product=>product.id===id)).filter((product):product is NonNullable<typeof product>=>Boolean(product)),[ids,products]);
  useEffect(()=>{if(!isLoading&&selected.length!==ids.length)replace(selected.map(product=>product.id))},[ids.length,isLoading,replace,selected]);
  const selectionKey=selected.map(product=>product.id).join('|');
  if(!selected.length||location.pathname==='/compare'||dismissedKey===selectionKey)return null;
  return <aside className="tf57-compare-dock" aria-label="Sản phẩm đang so sánh" aria-live="polite">
    <button type="button" className="tf57-compare-dock-close" onClick={()=>setDismissedKey(selectionKey)} aria-label="Đóng thanh so sánh"><X/></button>
    <div className="tf57-compare-dock-title"><Scale/><span><b>So sánh sản phẩm</b><small>{selected.length}/3 sản phẩm</small></span></div>
    <div className="tf57-compare-dock-items">{selected.map(product=><span key={product.id}><img src={optimizedImage(productImage(product),96,96,'fit')} alt="" width="48" height="48" loading="lazy" decoding="async"/><button type="button" onClick={()=>remove(product.id)} aria-label={`Bỏ ${product.title} khỏi so sánh`}><X/></button></span>)}</div>
    <div className="tf57-compare-dock-actions"><button type="button" onClick={clear}>Xóa</button><Link to="/compare">So sánh ngay<ArrowRight/></Link></div>
  </aside>;
}
