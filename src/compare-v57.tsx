import {createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import {ArrowRight,Scale,X} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useCommerce} from './context';
import {optimizedImage,productImage} from './image-utils';

const KEY='tf.v57.compare-products';
const LIMIT=3;
export type CompareToggleResult='added'|'removed'|'limit';
type CompareValue={ids:string[];includes:(id:string)=>boolean;toggle:(id:string)=>CompareToggleResult;remove:(id:string)=>void;clear:()=>void;limit:number};
const CompareContext=createContext<CompareValue|null>(null);
const readIds=()=>{try{const value=JSON.parse(window.localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value.map(String).filter(Boolean).slice(0,LIMIT):[]}catch{return[]}};

export function CompareProviderV57({children}:{children:ReactNode}){
  const[ids,setIds]=useState<string[]>(readIds);
  const{isLoading,products}=useCommerce();
  useEffect(()=>{try{if(ids.length)window.localStorage.setItem(KEY,JSON.stringify(ids));else window.localStorage.removeItem(KEY)}catch{/* Comparison remains available for this session. */}},[ids]);
  useEffect(()=>{if(isLoading)return;const valid=new Set(products.map(product=>product.id));setIds(current=>{const next=current.filter(id=>valid.has(id));return next.length===current.length?current:next})},[isLoading,products]);
  useEffect(()=>{const sync=(event:StorageEvent)=>{if(event.key===KEY)setIds(readIds())};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync)},[]);
  const includes=useCallback((id:string)=>ids.includes(id),[ids]);
  const toggle=useCallback((id:string):CompareToggleResult=>{
    if(ids.includes(id)){setIds(current=>current.filter(item=>item!==id));return'removed'}
    if(ids.length>=LIMIT)return'limit';
    setIds(current=>[...current,id]);return'added';
  },[ids]);
  const remove=useCallback((id:string)=>setIds(current=>current.filter(item=>item!==id)),[]);
  const clear=useCallback(()=>setIds([]),[]);
  const value=useMemo(()=>({ids,includes,toggle,remove,clear,limit:LIMIT}),[clear,ids,includes,remove,toggle]);
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export const useCompareV57=()=>{const value=useContext(CompareContext);if(!value)throw new Error('CompareProviderV57 missing');return value};
export const useCompareItemV57=(id:string)=>{const compare=useCompareV57();return{...compare,selected:Boolean(id&&compare.includes(id))}};

export function CompareDockV57(){
  const{ids,remove,clear}=useCompareV57();
  const{products}=useCommerce();
  const selected=useMemo(()=>ids.map(id=>products.find(product=>product.id===id)).filter((product):product is NonNullable<typeof product>=>Boolean(product)),[ids,products]);
  if(!selected.length)return null;
  return <aside className="tf57-compare-dock" aria-label="Sản phẩm đang so sánh">
    <div className="tf57-compare-dock-title"><Scale/><span><b>So sánh sản phẩm</b><small>{selected.length}/3 sản phẩm</small></span></div>
    <div className="tf57-compare-dock-items">{selected.map(product=><span key={product.id}><img src={optimizedImage(productImage(product),96,96,'fit')} alt="" width="48" height="48"/><button type="button" onClick={()=>remove(product.id)} aria-label={`Bỏ ${product.title} khỏi so sánh`}><X/></button></span>)}</div>
    <div className="tf57-compare-dock-actions"><button type="button" onClick={clear}>Xóa</button><Link to="/compare">So sánh ngay<ArrowRight/></Link></div>
  </aside>;
}
