import type {Product} from './types';
import type {ProductFilterKey,ProductFilterOption} from './product-filter-data';

export type CatalogPageFacets={
  vendors:ProductFilterOption[];
  prices:Array<ProductFilterOption&{label:string}>;
  filters:Record<ProductFilterKey,ProductFilterOption[]>;
};

export type PagedCatalogResponse={
  products:Product[];
  scope:'catalog-page';
  page:number;
  pageSize:number;
  total:number;
  sourceTotal:number;
  totalPages:number;
  facets:CatalogPageFacets;
};

type CacheEntry={value?:PagedCatalogResponse;promise?:Promise<PagedCatalogResponse>;expiresAt:number};
const memoryCache=new Map<string,CacheEntry>();
const CACHE_MS=5*60*1000;
const ALLOWED_QUERY_KEYS=new Set(['brand','price','stock','gender','discount','faceShape','faceSize','bandMaterial','bandColor','caseColor','classification','sort','page']);

const buildCatalogPageUrl=(handle:string|undefined,params:URLSearchParams,pageSize:number)=>{
  const query=new URLSearchParams();
  query.set('resource','catalog-page');
  if(handle)query.set('handle',handle);
  for(const [key,value] of params.entries())if(ALLOWED_QUERY_KEYS.has(key)&&value.trim())query.append(key,value.trim());
  query.set('limit',String(Math.max(24,Math.min(48,Math.round(pageSize)||48))));
  return `/api/meta?${query.toString()}`;
};

export async function fetchCatalogPage(handle:string|undefined,params:URLSearchParams,pageSize=48):Promise<PagedCatalogResponse>{
  const url=buildCatalogPageUrl(handle,params,pageSize);
  const now=Date.now();
  const cached=memoryCache.get(url);
  if(cached?.value&&cached.expiresAt>now)return cached.value;
  if(cached?.promise)return cached.promise;
  const promise=fetch(url,{headers:{Accept:'application/json'}}).then(async response=>{
    const payload=await response.json().catch(()=>null) as PagedCatalogResponse|null;
    if(!response.ok||!payload||!Array.isArray(payload.products))throw new Error((payload as unknown as {message?:string})?.message||`Catalog page returned ${response.status}`);
    const normalized:PagedCatalogResponse={
      ...payload,
      page:Math.max(1,Number(payload.page)||1),
      pageSize:Math.max(1,Number(payload.pageSize)||pageSize),
      total:Math.max(0,Number(payload.total)||0),
      sourceTotal:Math.max(0,Number(payload.sourceTotal)||0),
      totalPages:Math.max(1,Number(payload.totalPages)||1),
      facets:payload.facets||{vendors:[],prices:[],filters:{gender:[],discount:[],faceShape:[],faceSize:[],bandMaterial:[],bandColor:[],caseColor:[],classification:[]}},
    };
    memoryCache.set(url,{value:normalized,expiresAt:Date.now()+CACHE_MS});
    return normalized;
  }).finally(()=>{
    const current=memoryCache.get(url);
    if(current?.promise)memoryCache.set(url,{value:current.value,expiresAt:current.expiresAt});
  });
  memoryCache.set(url,{...cached,promise,expiresAt:cached?.expiresAt||0});
  return promise;
}

// Intentionally no-op: collection pages only request the page the customer opens.
export const prefetchCatalogPage=(_handle:string|undefined,_params:URLSearchParams,_pageSize=48)=>{};
