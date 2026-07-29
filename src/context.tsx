import{createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode}from'react';
import type{Activity,CartLine,CheckoutPayload,Collection,Customer,Discount,DiscountEvaluation,InventoryAdjustment,NewsletterSubscriber,Order,OrderStatus,Product,ProductGroup,StoreProfile,Theme,ThemeState,ThemeVersion}from'./types';
import{seedCollections,seedCustomers}from'./seed-lite';
import{seedActivities,seedAdjustments,seedDiscounts,seedOrders}from'./operations-seed';
import{firebaseClient}from'./firebase';
import{createThemeState,migrateTheme}from'./theme';
import{uid}from'./utils';
import{isThemePreviewV26,readThemePreviewV26,THEME_PREVIEW_KEY_V26,THEME_PREVIEW_UPDATED_V26}from'./theme-preview-v26';
import{canonicalProduct,productFirebasePath,productsFromFirebase,productsToFirebaseRecord}from'./product-data';
import{buildAutomaticProductGroups}from'./product-groups';
import{createStorefrontOrder,readIntegrationSettings}from'./integrations';
import{useAuth}from'./auth';
import{resolvesCollectionProducts}from'./collection-utils';
import{applyStoreProfileToTheme,DEFAULT_STORE_PROFILE,normalizeStoreProfile,storeProfileFromTheme}from'./store-profile';

const K={p:'tf.react.products',c:'tf.react.collections',groups:'tf.react.product-groups',u:'tf.react.customers',cart:'tf.react.cart',theme:'tf.react.theme.v2',themeLegacy:'tf.react.theme',profile:'tf.react.store-profile',headers:'tf.react.headers',orders:'tf.react.orders',discounts:'tf.react.discounts',adjustments:'tf.react.inventory-adjustments',activities:'tf.react.activities',newsletter:'tf.react.newsletter-subscribers'};
const load=<T,>(k:string,f:T)=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r) as T:f}catch{return f}};
const firebaseList=<T,>(value:T[]|Record<string,T>|null)=>Array.isArray(value)?value.filter(Boolean):value?Object.values(value).filter(Boolean):[];
const firebaseOrders=(value:Order[]|Record<string,Order>|null)=>firebaseList(value).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
const loadTheme=()=>{const next=localStorage.getItem(K.theme);if(next){try{return migrateTheme(JSON.parse(next))}catch{}}const legacy=localStorage.getItem(K.themeLegacy);if(legacy){try{return migrateTheme(JSON.parse(legacy))}catch{}}return createThemeState()};
const newsletterKey=(email:string)=>{let hash=2166136261;for(let i=0;i<email.length;i++){hash^=email.charCodeAt(i);hash=Math.imul(hash,16777619)}return`subscriber_${(hash>>>0).toString(36)}`};
const orderNumber=()=>{const d=new Date(),stamp=`${String(d.getFullYear()).slice(-2)}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;return `TF-${stamp}-${Math.floor(1000+Math.random()*9000)}`};
type IdleWindow=Window&{requestIdleCallback?:(callback:IdleRequestCallback,options?:IdleRequestOptions)=>number;cancelIdleCallback?:(handle:number)=>void};
const useIdleLocalStorage=<T,>(key:string,value:T,enabled=true)=>useEffect(()=>{
 if(!enabled)return;
 const idleWindow=window as IdleWindow;
 const persist=()=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
 if(idleWindow.requestIdleCallback){
  const handle=idleWindow.requestIdleCallback(persist,{timeout:1800});
  return()=>idleWindow.cancelIdleCallback?.(handle);
 }
 const timer=window.setTimeout(persist,450);
 return()=>window.clearTimeout(timer);
},[key,value,enabled]);

export type CommerceDataSource='loading'|'firebase'|'local'|'seed'|'error';
type V={
 products:Product[];collections:Collection[];productGroups:ProductGroup[];customers:Customer[];newsletterSubscribers:NewsletterSubscriber[];cart:CartLine[];orders:Order[];discounts:Discount[];adjustments:InventoryAdjustment[];activities:Activity[];
 theme:Theme;draftTheme:Theme;themeState:ThemeState;storeProfile:StoreProfile;headers:string[];firebaseEnabled:boolean;isLoading:boolean;dataSource:CommerceDataSource;dataError:string;
 setHeaders:(h:string[])=>void;saveProduct:(p:Product)=>void;deleteProducts:(ids:string[])=>void;replaceProducts:(p:Product[])=>Promise<void>;mergeProducts:(p:Product[])=>Promise<void>;
 saveCollection:(c:Collection)=>void;deleteCollection:(id:string)=>void;saveProductGroup:(group:ProductGroup)=>void;replaceProductGroups:(groups:ProductGroup[])=>void;deleteProductGroup:(id:string)=>void;saveCustomer:(u:Customer)=>void;
 subscribeNewsletter:(email:string,source?:string)=>'created'|'exists'|'reactivated'|'invalid';updateNewsletterSubscriber:(id:string,patch:Partial<NewsletterSubscriber>)=>void;deleteNewsletterSubscriber:(id:string)=>void;
 saveThemeDraft:(t:Theme)=>void;publishTheme:(t?:Theme,note?:string)=>void;restoreThemeVersion:(id:string)=>void;saveStoreProfile:(profile:Omit<StoreProfile,'updatedAt'>)=>Promise<void>;
 addToCart:(pid:string,vid:string,q?:number)=>void;updateCart:(pid:string,vid:string,q:number)=>void;clearCart:()=>void;
 evaluateDiscount:(code:string,subtotal:number,shipping?:number)=>DiscountEvaluation;saveDiscount:(d:Discount)=>void;deleteDiscount:(id:string)=>void;
 createOrder:(payload:CheckoutPayload)=>Order|null;submitStorefrontOrder:(payload:CheckoutPayload)=>Promise<Order>;createAdminOrder:(order:Order)=>Order|null;updateOrder:(id:string,patch:Partial<Order>)=>void;cancelOrder:(id:string)=>void;
 adjustInventory:(productId:string,variantId:string,delta:number,note:string)=>void;
 reset:()=>void;collectionProducts:(c:Collection)=>Product[]
};
const C=createContext<V|null>(null);

export function CommerceProvider({children}:{children:ReactNode}){
 const{user,loading:authLoading}=useAuth();
 const[products,setProducts]=useState<Product[]>(()=>productsFromFirebase(load<Product[]>(K.p,[])));
 const[collections,setCollections]=useState(()=>load(K.c,seedCollections));
 const[productGroups,setProductGroups]=useState<ProductGroup[]>(()=>load(K.groups,[]));
 const[customers,setCustomers]=useState(()=>load(K.u,seedCustomers));
 const[newsletterSubscribers,setNewsletterSubscribers]=useState<NewsletterSubscriber[]>(()=>load(K.newsletter,[]));
 const[cart,setCart]=useState<CartLine[]>(()=>load(K.cart,[]));
 const[orders,setOrders]=useState<Order[]>(()=>load(K.orders,seedOrders));
 const[discounts,setDiscounts]=useState<Discount[]>(()=>load(K.discounts,seedDiscounts));
 const[adjustments,setAdjustments]=useState<InventoryAdjustment[]>(()=>load(K.adjustments,seedAdjustments));
 const[activities,setActivities]=useState<Activity[]>(()=>load(K.activities,seedActivities));
 const[themeState,setThemeState]=useState<ThemeState>(loadTheme);
 const[storeProfile,setStoreProfile]=useState<StoreProfile>(()=>normalizeStoreProfile(load<StoreProfile>(K.profile,storeProfileFromTheme(themeState.published)),storeProfileFromTheme(themeState.published)));
 const[previewTheme,setPreviewTheme]=useState<Theme|null>(()=>isThemePreviewV26()?readThemePreviewV26():null);
 const[headers,setHeaders]=useState<string[]>(()=>load(K.headers,[]));
 const[isLoading,setIsLoading]=useState(()=>firebaseClient.enabled&&products.length===0);
 const[dataSource,setDataSource]=useState<CommerceDataSource>(()=>firebaseClient.enabled?(products.length?'local':'loading'):'local');
 const[dataError,setDataError]=useState('');

 useIdleLocalStorage(K.p,products,products.length>0);
 useIdleLocalStorage(K.c,collections);
 useIdleLocalStorage(K.groups,productGroups);
 useIdleLocalStorage(K.u,customers);
 useIdleLocalStorage(K.newsletter,newsletterSubscribers);
 useIdleLocalStorage(K.cart,cart);
 useIdleLocalStorage(K.orders,orders);
 useIdleLocalStorage(K.discounts,discounts);
 useIdleLocalStorage(K.adjustments,adjustments);
 useIdleLocalStorage(K.activities,activities);
 useIdleLocalStorage(K.theme,themeState);
 useIdleLocalStorage(K.profile,storeProfile);
 useEffect(()=>{if(!isThemePreviewV26())return;const sync=()=>setPreviewTheme(readThemePreviewV26());const storage=(event:StorageEvent)=>{if(event.key===THEME_PREVIEW_KEY_V26)sync()};window.addEventListener('storage',storage);window.addEventListener(THEME_PREVIEW_UPDATED_V26,sync);return()=>{window.removeEventListener('storage',storage);window.removeEventListener(THEME_PREVIEW_UPDATED_V26,sync)}},[]);
 useIdleLocalStorage(K.headers,headers);

 /* Public storefront uses stale-while-revalidate: a verified local catalog is
    painted immediately. When cache exists, Firebase SDK/network work starts
    during idle time so it cannot compete with the first visible render. */
 useEffect(()=>{
  if(!firebaseClient.enabled){setIsLoading(false);return;}
  let active=true;
  let idleHandle:number|undefined;
  let timerHandle:number|undefined;
  const hasCachedCatalog=products.length>0;
  if(!hasCachedCatalog){setIsLoading(true);setDataSource('loading')}
  else{setIsLoading(false);setDataSource('local')}
  setDataError('');

  const refresh=()=>{
   if(!active)return;
   void firebaseClient.read<Product[]|Record<string,Product>>('timeforge/products').then(value=>{
    if(!active)return;
    const next=productsFromFirebase(value);
    setProducts(next);
    setDataSource('firebase');
    setDataError('');
   }).catch(error=>{
    if(!active)return;
    const message=error instanceof Error?error.message:'Không thể đọc catalog Firebase.';
    if(!hasCachedCatalog){setProducts([]);setDataError(message);setDataSource('error')}
    else console.warn('[TimeForge] Catalog refresh failed; cached products remain visible.',error);
   }).finally(()=>{if(active)setIsLoading(false)});

   void Promise.allSettled([
    firebaseClient.read<Collection[]|Record<string,Collection>>('timeforge/collections'),
    firebaseClient.read<ProductGroup[]|Record<string,ProductGroup>>('timeforge/productGroups'),
    firebaseClient.read<Discount[]|Record<string,Discount>>('timeforge/discounts'),
    firebaseClient.read<Theme>('timeforge/themes/published'),
    firebaseClient.read<StoreProfile>('timeforge/settings/store')
   ]).then(([collectionResult,groupResult,discountResult,publishedResult,profileResult])=>{
    if(!active)return;
    if(collectionResult.status==='fulfilled')setCollections(firebaseList(collectionResult.value));
    if(groupResult.status==='fulfilled')setProductGroups(firebaseList(groupResult.value));
    if(discountResult.status==='fulfilled')setDiscounts(firebaseList(discountResult.value));
    const published=publishedResult.status==='fulfilled'&&publishedResult.value?publishedResult.value:null;
    const firebaseIdentityFallback=published?storeProfileFromTheme(published):DEFAULT_STORE_PROFILE;
    const remoteProfile=profileResult.status==='fulfilled'&&profileResult.value
      ?normalizeStoreProfile(profileResult.value,firebaseIdentityFallback)
      :published?storeProfileFromTheme(published)
      :profileResult.status==='fulfilled'&&publishedResult.status==='fulfilled'?DEFAULT_STORE_PROFILE:null;
    if(remoteProfile)setStoreProfile(remoteProfile);
    if(published||remoteProfile)setThemeState(cur=>{const nextPublished=published||cur.published;const profile=remoteProfile||normalizeStoreProfile(storeProfile,storeProfileFromTheme(nextPublished));return{...cur,published:applyStoreProfileToTheme(nextPublished,profile),draft:applyStoreProfileToTheme(cur.draft,profile)}});
   });
  };

  if(hasCachedCatalog){
   const idleWindow=window as IdleWindow;
   if(idleWindow.requestIdleCallback)idleHandle=idleWindow.requestIdleCallback(refresh,{timeout:1200});
   else timerHandle=window.setTimeout(refresh,350);
  }else refresh();

  return()=>{
   active=false;
   const idleWindow=window as IdleWindow;
   if(idleHandle!==undefined)idleWindow.cancelIdleCallback?.(idleHandle);
   if(timerHandle!==undefined)window.clearTimeout(timerHandle);
  };
 },[]);

 /* Protected datasets wait for Firebase Authentication to restore its session.
    Promise.allSettled keeps one optional/denied path from cancelling every other Admin read. */
 useEffect(()=>{
  if(!firebaseClient.enabled||authLoading||!user||user.access!=='active')return;
  let active=true;
  void Promise.allSettled([
   firebaseClient.read<Customer[]|Record<string,Customer>>('timeforge/customers'),
   firebaseClient.read<Record<string,NewsletterSubscriber>|NewsletterSubscriber[]>('timeforge/newsletterSubscribers'),
   firebaseClient.read<Order[]|Record<string,Order>>('timeforge/orders'),
   firebaseClient.read<InventoryAdjustment[]|Record<string,InventoryAdjustment>>('timeforge/inventoryAdjustments'),
   firebaseClient.read<Activity[]|Record<string,Activity>>('timeforge/activities'),
   firebaseClient.read<Theme>('timeforge/themes/draft'),
   firebaseClient.read<ThemeVersion[]|Record<string,ThemeVersion>>('timeforge/themes/versions')
  ]).then(([customerResult,subscriberResult,orderResult,adjustmentResult,activityResult,draftResult,versionResult])=>{
   if(!active)return;
   if(customerResult.status==='fulfilled')setCustomers(firebaseList(customerResult.value));
   if(subscriberResult.status==='fulfilled')setNewsletterSubscribers(firebaseList(subscriberResult.value));
   if(orderResult.status==='fulfilled'){
    const normalizedOrders=firebaseOrders(orderResult.value);
    setOrders(normalizedOrders);
    if(Array.isArray(orderResult.value)&&firebaseClient.enabled){
     void firebaseClient.write('timeforge/orders',Object.fromEntries(normalizedOrders.map(order=>[order.id,order]))).catch(reportFirebaseError);
    }
   }
   if(adjustmentResult.status==='fulfilled')setAdjustments(firebaseList(adjustmentResult.value));
   if(activityResult.status==='fulfilled')setActivities(firebaseList(activityResult.value));
   if(draftResult.status==='fulfilled'||versionResult.status==='fulfilled')setThemeState(cur=>({...cur,draft:draftResult.status==='fulfilled'&&draftResult.value?draftResult.value:cur.draft,versions:versionResult.status==='fulfilled'?firebaseList(versionResult.value):cur.versions}));
  });
  return()=>{active=false};
 },[authLoading,user?.uid,user?.access]);

 useEffect(()=>{
  if(!firebaseClient.enabled||authLoading||!user||user.access!=='active')return;
  let disposed=false;let unsubscribe:(()=>void)|undefined;
  void firebaseClient.subscribe<Order[]|Record<string,Order>>('timeforge/orders',value=>{if(!disposed)setOrders(firebaseOrders(value))},error=>{if(!disposed)console.warn('[TimeForge] Order realtime subscription failed.',error)}).then(stop=>{if(disposed)stop();else unsubscribe=stop});
  return()=>{disposed=true;unsubscribe?.()};
 },[authLoading,user?.uid,user?.access]);

 const reportFirebaseError=(error:unknown)=>{const message=error instanceof Error?error.message:'Firebase không thể lưu dữ liệu.';console.warn(message);window.dispatchEvent(new CustomEvent('timeforge:toast',{detail:{message,tone:'danger'}}))};
 const sync=<T,>(path:string,v:T)=>{if(firebaseClient.enabled)void firebaseClient.write(path,v).catch(reportFirebaseError)};
 const syncProducts=(list:Product[])=>{if(firebaseClient.enabled)void firebaseClient.write('timeforge/products',productsToFirebaseRecord(list)).catch(reportFirebaseError)};
 const syncOrders=(list:Order[])=>sync('timeforge/orders',Object.fromEntries(list.map(order=>[order.id,order])));
 const log=(entity:Activity['entity'],entityId:string,action:string,detail:string)=>setActivities(cur=>{const n=[{id:uid('activity'),entity,entityId,action,detail,createdAt:new Date().toISOString(),actor:'Admin'},...cur].slice(0,300);sync('timeforge/activities',n);return n});

 const saveProduct=(input:Product)=>setProducts(cur=>{const product=canonicalProduct(input);const previous=cur.find(item=>item.id===input.id||item.sku===product.sku);const exists=Boolean(previous);const next=exists?cur.map(item=>item===previous?product:item):[product,...cur];if(firebaseClient.enabled){void firebaseClient.write(productFirebasePath(product.sku),product).catch(reportFirebaseError);if(previous&&previous.sku!==product.sku)void firebaseClient.remove(productFirebasePath(previous.sku)).catch(()=>{})}log('product',product.id,exists?'Cập nhật sản phẩm':'Tạo sản phẩm',product.title);return next});
 const deleteProducts=(ids:string[])=>setProducts(cur=>{const removed=cur.filter(item=>ids.includes(item.id));const next=cur.filter(item=>!ids.includes(item.id));if(firebaseClient.enabled){const updates=Object.fromEntries(removed.map(product=>[productFirebasePath(product.sku),null]));if(Object.keys(updates).length)void firebaseClient.update(updates).catch(reportFirebaseError)}removed.forEach(product=>log('product',product.id,'Xóa sản phẩm',product.title));return next});
 const replaceProducts=async(list:Product[])=>{const canonical=list.map(canonicalProduct);if(firebaseClient.enabled){const targetSkus=new Set(canonical.map(product=>product.sku));const updates:Record<string,unknown>=Object.fromEntries(canonical.map(product=>[productFirebasePath(product.sku),product]));products.filter(product=>!targetSkus.has(product.sku)).forEach(product=>{updates[productFirebasePath(product.sku)]=null});if(Object.keys(updates).length)await firebaseClient.updateBatches(updates)}const groups=buildAutomaticProductGroups(canonical,productGroups);setProducts(canonical);setProductGroups(groups);sync('timeforge/productGroups',groups);log('product','bulk','Thay toàn bộ catalog',`${canonical.length} sản phẩm · tự động tạo ${groups.filter(group=>group.source==='automatic').length} nhóm SKU`)};
 const mergeProducts=async(incoming:Product[])=>{const canonical=incoming.map(canonicalProduct),next=[...products],updates:Record<string,unknown>={};let updated=0,created=0;canonical.forEach(product=>{const index=next.findIndex(item=>item.sku===product.sku||item.handle===product.handle);if(index>=0){const previous=next[index];next[index]=product;updated++;if(previous.sku!==product.sku)updates[productFirebasePath(previous.sku)]=null}else{next.unshift(product);created++}updates[productFirebasePath(product.sku)]=product});if(firebaseClient.enabled&&Object.keys(updates).length)await firebaseClient.updateBatches(updates);const groups=buildAutomaticProductGroups(next,productGroups);setProducts(next);setProductGroups(groups);sync('timeforge/productGroups',groups);log('product','import','Nhập CSV theo SKU',`${created} mới · ${updated} cập nhật · ${groups.filter(group=>group.source==='automatic').length} nhóm tự động`)};
 const saveCollection=(c:Collection)=>setCollections(cur=>{const exists=cur.some(x=>x.id===c.id),n=exists?cur.map(x=>x.id===c.id?c:x):[c,...cur];sync('timeforge/collections',n);log('collection',c.id,exists?'Cập nhật bộ sưu tập':'Tạo bộ sưu tập',c.title);return n});
 const deleteCollection=(id:string)=>setCollections(cur=>{const found=cur.find(x=>x.id===id),n=cur.filter(x=>x.id!==id);sync('timeforge/collections',n);if(found)log('collection',id,'Xóa bộ sưu tập',found.title);return n});
 const saveProductGroup=(group:ProductGroup)=>setProductGroups(cur=>{const exists=cur.some(item=>item.id===group.id),next=exists?cur.map(item=>item.id===group.id?group:item):[group,...cur];sync('timeforge/productGroups',next);log('collection',group.id,exists?'Cập nhật nhóm BST':'Tạo nhóm BST',`${group.name} · ${group.skuPrefix}`);return next});
 const replaceProductGroups=(groups:ProductGroup[])=>{setProductGroups(groups);sync('timeforge/productGroups',groups);log('collection','product-groups','Nhập nhóm BST',`${groups.length} bộ sưu tập sản phẩm`)};
 const deleteProductGroup=(id:string)=>setProductGroups(cur=>{const found=cur.find(item=>item.id===id),next=cur.filter(item=>item.id!==id);sync('timeforge/productGroups',next);if(found)log('collection',id,'Xóa nhóm BST',found.name);return next});
 const saveCustomer=(u:Customer)=>setCustomers(cur=>{const exists=cur.some(x=>x.id===u.id),n=exists?cur.map(x=>x.id===u.id?u:x):[u,...cur];sync('timeforge/customers',n);log('customer',u.id,exists?'Cập nhật khách hàng':'Tạo khách hàng',u.name);return n});
 const subscribeNewsletter=(rawEmail:string,source='footer')=>{const email=rawEmail.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return'invalid' as const;const existing=newsletterSubscribers.find(item=>item.email===email);const now=new Date().toISOString();if(existing?.status==='active')return'exists' as const;const created:NewsletterSubscriber={id:existing?.id||newsletterKey(email),email,source,status:'active',createdAt:existing?.createdAt||now,updatedAt:now};const next:NewsletterSubscriber[]=existing?newsletterSubscribers.map(item=>item.id===existing.id?created:item):[created,...newsletterSubscribers];setNewsletterSubscribers(next);if(firebaseClient.enabled)void firebaseClient.write(`timeforge/newsletterSubscribers/${created.id}`,created).catch(()=>{});const matching=customers.find(item=>item.email.toLowerCase()===email);if(matching&&!matching.acceptsMarketing){const nextCustomers=customers.map(item=>item.id===matching.id?{...item,acceptsMarketing:true}:item);setCustomers(nextCustomers);sync('timeforge/customers',nextCustomers)}log('customer',existing?.id||email,existing?'Kích hoạt lại email marketing':'Đăng ký email marketing',email);return existing?'reactivated' as const:'created' as const};
 const updateNewsletterSubscriber=(id:string,patch:Partial<NewsletterSubscriber>)=>setNewsletterSubscribers(cur=>{const now=new Date().toISOString();const updated=cur.find(item=>item.id===id);const next=cur.map(item=>item.id===id?{...item,...patch,updatedAt:now}:item);const value=updated?{...updated,...patch,updatedAt:now}:null;if(value&&firebaseClient.enabled)void firebaseClient.write(`timeforge/newsletterSubscribers/${id}`,value).catch(()=>{});return next});
 const deleteNewsletterSubscriber=(id:string)=>setNewsletterSubscribers(cur=>{const found=cur.find(item=>item.id===id);const next=cur.filter(item=>item.id!==id);if(firebaseClient.enabled)void firebaseClient.remove(`timeforge/newsletterSubscribers/${id}`).catch(()=>{});if(found)log('customer',id,'Xóa email marketing',found.email);return next});
 const saveThemeDraft=(theme:Theme)=>setThemeState(cur=>{const n={...cur,draft:structuredClone(theme)};sync('timeforge/themes/draft',n.draft);return n});
 const publishTheme=(theme?:Theme,note='Xuất bản từ Theme Editor')=>setThemeState(cur=>{const next=structuredClone(theme||cur.draft);const version:ThemeVersion={id:uid('theme'),createdAt:new Date().toISOString(),note,theme:structuredClone(cur.published)};const n={draft:structuredClone(next),published:next,publishedAt:new Date().toISOString(),versions:[version,...cur.versions].slice(0,15)};sync('timeforge/themes/draft',n.draft);sync('timeforge/themes/published',n.published);sync('timeforge/themes/versions',n.versions);log('theme',String(next.version),'Xuất bản theme',next.name);return n});
 const restoreThemeVersion=(id:string)=>setThemeState(cur=>{const v=cur.versions.find(x=>x.id===id);if(!v)return cur;const n={...cur,draft:structuredClone(v.theme)};sync('timeforge/themes/draft',n.draft);log('theme',id,'Khôi phục theme thành draft',v.note);return n});
 const saveStoreProfile=async(input:Omit<StoreProfile,'updatedAt'>)=>{
  const nextProfile=normalizeStoreProfile({...input,updatedAt:new Date().toISOString()},storeProfile);
  const nextDraft=applyStoreProfileToTheme(themeState.draft,nextProfile);
  const nextPublished=applyStoreProfileToTheme(themeState.published,nextProfile);
  if(firebaseClient.enabled)await firebaseClient.update({'timeforge/settings/store':nextProfile,'timeforge/themes/draft':nextDraft,'timeforge/themes/published':nextPublished});
  setStoreProfile(nextProfile);
  setThemeState(cur=>({...cur,draft:applyStoreProfileToTheme(cur.draft,nextProfile),published:applyStoreProfileToTheme(cur.published,nextProfile),publishedAt:new Date().toISOString()}));
  log('theme','store-profile','Cập nhật thông tin cửa hàng',nextProfile.storeName);
 };
 const addToCart=(pid:string,vid:string,q=1)=>setCart(cur=>{const product=products.find(x=>x.id===pid);const variant=product?.variants.find(x=>x.id===vid)||product?.variants[0];const available=variant?.inventory??product?.inventory??0;if(!product||available<=0||q<=0)return cur;const resolvedVariantId=variant?.id||vid;const found=cur.find(x=>x.productId===pid&&x.variantId===resolvedVariantId);const nextQuantity=Math.min(available,(found?.quantity||0)+q);return found?cur.map(x=>x===found?{...x,quantity:nextQuantity}:x):[...cur,{productId:pid,variantId:resolvedVariantId,quantity:Math.min(available,q)}]});
 const updateCart=(pid:string,vid:string,q:number)=>setCart(cur=>{if(q<=0)return cur.filter(x=>!(x.productId===pid&&x.variantId===vid));const product=products.find(x=>x.id===pid);const variant=product?.variants.find(x=>x.id===vid)||product?.variants[0];const available=variant?.inventory??product?.inventory??0;if(available<=0)return cur.filter(x=>!(x.productId===pid&&x.variantId===vid));return cur.map(x=>x.productId===pid&&x.variantId===vid?{...x,quantity:Math.min(q,available)}:x)});
 const collectionProducts=useCallback((c:Collection)=>resolvesCollectionProducts(c,products),[products]);

 const evaluateDiscount=(code:string,subtotal:number,shipping=0):DiscountEvaluation=>{const normalized=code.trim().toUpperCase();if(!normalized)return{valid:false,message:'Nhập mã giảm giá.',amount:0,shippingDiscount:0};const d=discounts.find(x=>x.code.toUpperCase()===normalized);if(!d||!d.active)return{valid:false,message:'Mã giảm giá không tồn tại hoặc đã tắt.',amount:0,shippingDiscount:0};const now=Date.now();if(d.startsAt&&new Date(d.startsAt).getTime()>now)return{valid:false,message:'Mã giảm giá chưa bắt đầu.',amount:0,shippingDiscount:0};if(d.endsAt&&new Date(d.endsAt).getTime()<now)return{valid:false,message:'Mã giảm giá đã hết hạn.',amount:0,shippingDiscount:0};if(d.usageLimit>0&&d.usageCount>=d.usageLimit)return{valid:false,message:'Mã giảm giá đã hết lượt sử dụng.',amount:0,shippingDiscount:0};if(subtotal<d.minimumSubtotal)return{valid:false,message:`Đơn hàng chưa đạt mức tối thiểu ${d.minimumSubtotal.toLocaleString('vi-VN')}đ.`,amount:0,shippingDiscount:0};const amount=d.type==='percentage'?Math.min(subtotal,Math.round(subtotal*d.value/100)):d.type==='fixed_amount'?Math.min(subtotal,d.value):0;const shippingDiscount=d.type==='free_shipping'?shipping:0;return{valid:true,message:`Đã áp dụng ${d.code}.`,discount:d,amount,shippingDiscount}};
 const saveDiscount=(d:Discount)=>setDiscounts(cur=>{const exists=cur.some(x=>x.id===d.id),n=exists?cur.map(x=>x.id===d.id?d:x):[d,...cur];sync('timeforge/discounts',n);log('discount',d.id,exists?'Cập nhật mã giảm giá':'Tạo mã giảm giá',d.code);return n});
 const deleteDiscount=(id:string)=>setDiscounts(cur=>{const found=cur.find(x=>x.id===id),n=cur.filter(x=>x.id!==id);sync('timeforge/discounts',n);if(found)log('discount',id,'Xóa mã giảm giá',found.code);return n});

 const createOrder=(payload:CheckoutPayload):Order|null=>{
  if(!cart.length)return null;
  const lines=cart.map(line=>{const p=products.find(x=>x.id===line.productId);if(!p)return null;const v=p.variants.find(x=>x.id===line.variantId)||p.variants[0];const unitPrice=v?.price||p.price;return{id:uid('line'),productId:p.id,variantId:v?.id||line.variantId,title:p.title,variantTitle:v?.title||'Default Title',sku:v?.sku||p.sku,image:p.images[0]||'',quantity:line.quantity,unitPrice,lineTotal:unitPrice*line.quantity}}).filter(Boolean) as Order['lines'];
  if(!lines.length)return null;
  const unavailable=lines.find(line=>{const p=products.find(x=>x.id===line.productId);const v=p?.variants.find(x=>x.id===line.variantId);return(v?.inventory??p?.inventory??0)<line.quantity});
  if(unavailable)throw new Error(`${unavailable.title} không đủ tồn kho.`);
  const subtotal=lines.reduce((s,l)=>s+l.lineTotal,0),shippingThreshold=Math.max(0,readIntegrationSettings().shipping.freeShippingThreshold||1000000),shippingAmount=subtotal>=shippingThreshold?0:50000,ev=payload.discountCode?evaluateDiscount(payload.discountCode,subtotal,shippingAmount):{valid:false,message:'',amount:0,shippingDiscount:0} as DiscountEvaluation;
  const order:Order={id:uid('order'),number:orderNumber(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),customerId:'',customerName:payload.customer.name,customerEmail:payload.customer.email,customerPhone:payload.customer.phone,shippingAddress:payload.shippingAddress,lines,subtotal,discountCode:ev.valid?ev.discount?.code||'':'',discountAmount:ev.amount,shippingAmount:Math.max(0,shippingAmount-ev.shippingDiscount),taxAmount:0,total:subtotal-ev.amount+Math.max(0,shippingAmount-ev.shippingDiscount),currency:'VND',status:'open',paymentStatus:'pending',fulfillmentStatus:'unfulfilled',paymentMethod:payload.paymentMethod,note:payload.note,source:'storefront'};
  const existing=customers.find(c=>(payload.customer.email&&c.email.toLowerCase()===payload.customer.email.toLowerCase())||(payload.customer.phone&&c.phone===payload.customer.phone));
  const customer:Customer=existing?{...existing,name:payload.customer.name,email:payload.customer.email,phone:payload.customer.phone,ordersCount:existing.ordersCount+1,totalSpent:existing.totalSpent+order.total,addresses:[...(existing.addresses||[]),{id:uid('address'),firstName:payload.customer.name.split(' ')[0]||'',lastName:payload.customer.name.split(' ').slice(1).join(' '),phone:payload.customer.phone,address1:payload.shippingAddress.address1,address2:payload.shippingAddress.address2,ward:payload.shippingAddress.ward,district:payload.shippingAddress.district,city:payload.shippingAddress.city,country:payload.shippingAddress.country,postalCode:payload.shippingAddress.postalCode,isDefault:!(existing.addresses?.length)}]}:{id:uid('customer'),name:payload.customer.name,email:payload.customer.email,phone:payload.customer.phone,ordersCount:1,totalSpent:order.total,tags:['Online'],createdAt:new Date().toISOString(),acceptsMarketing:false,addresses:[{id:uid('address'),firstName:payload.customer.name.split(' ')[0]||'',lastName:payload.customer.name.split(' ').slice(1).join(' '),phone:payload.customer.phone,address1:payload.shippingAddress.address1,address2:payload.shippingAddress.address2,ward:payload.shippingAddress.ward,district:payload.shippingAddress.district,city:payload.shippingAddress.city,country:payload.shippingAddress.country,postalCode:payload.shippingAddress.postalCode,isDefault:true}],notes:[]};
  order.customerId=customer.id;
  const nextProducts=products.map(p=>{const orderLines=lines.filter(l=>l.productId===p.id);if(!orderLines.length)return p;let productDelta=0;const variants=p.variants.map(v=>{const line=orderLines.find(l=>l.variantId===v.id);if(!line)return v;productDelta+=line.quantity;return{...v,inventory:Math.max(0,v.inventory-line.quantity)}});return{...p,variants,inventory:Math.max(0,p.inventory-productDelta),updatedAt:new Date().toISOString()}});
  const newAdjustments:InventoryAdjustment[]=lines.map(l=>{const p=products.find(x=>x.id===l.productId)!;const v=p.variants.find(x=>x.id===l.variantId);const before=v?.inventory??p.inventory;return{id:uid('adjustment'),productId:p.id,variantId:l.variantId,sku:l.sku,productTitle:p.title,delta:-l.quantity,before,after:Math.max(0,before-l.quantity),reason:'order',note:`Trừ kho cho ${order.number}`,createdAt:new Date().toISOString(),referenceId:order.id}});
  const nextOrders=[order,...orders],nextCustomers=customers.some(c=>c.id===customer.id)?customers.map(c=>c.id===customer.id?customer:c):[customer,...customers],nextAdjustments=[...newAdjustments,...adjustments].slice(0,1000);
  setProducts(nextProducts);setOrders(nextOrders);setCustomers(nextCustomers);setAdjustments(nextAdjustments);setCart([]);
  syncProducts(nextProducts);syncOrders(nextOrders);sync('timeforge/customers',nextCustomers);sync('timeforge/inventoryAdjustments',nextAdjustments);
  if(ev.valid&&ev.discount){const nextDiscounts=discounts.map(d=>d.id===ev.discount?.id?{...d,usageCount:d.usageCount+1}:d);setDiscounts(nextDiscounts);sync('timeforge/discounts',nextDiscounts)}
  log('order',order.id,'Tạo đơn hàng',`${order.number} · ${order.customerName}`);
  return order;
 };
 const submitStorefrontOrder=async(payload:CheckoutPayload):Promise<Order>=>{
  if(!cart.length)throw new Error('Giỏ hàng đang trống.');
  const requestId=uid('order');
  const order=await createStorefrontOrder(payload,cart,requestId);
  setOrders(cur=>{const next=[order,...cur.filter(item=>item.id!==order.id)];try{localStorage.setItem(K.orders,JSON.stringify(next))}catch{}return next});
  setProducts(cur=>cur.map(product=>{const related=order.lines.filter(line=>line.productId===product.id);if(!related.length)return product;let delta=0;const variants=product.variants.map(variant=>{const line=related.find(item=>item.variantId===variant.id);if(!line)return variant;delta+=line.quantity;return{...variant,inventory:Math.max(0,variant.inventory-line.quantity)}});return{...product,variants,inventory:Math.max(0,product.inventory-(delta||related.reduce((sum,line)=>sum+line.quantity,0))),updatedAt:new Date().toISOString()}}));
  try{localStorage.setItem(K.cart,'[]')}catch{}
  setCart([]);
  return order;
 };
 const createAdminOrder=(input:Order):Order|null=>{
  if(!input.lines.length)return null;
  const unavailable=input.lines.find(line=>{const p=products.find(x=>x.id===line.productId);const v=p?.variants.find(x=>x.id===line.variantId);return(v?.inventory??p?.inventory??0)<line.quantity});
  if(unavailable)throw new Error(`${unavailable.title} không đủ tồn kho.`);
  const existing=customers.find(c=>(input.customerEmail&&c.email.toLowerCase()===input.customerEmail.toLowerCase())||(input.customerPhone&&c.phone===input.customerPhone));
  const customer:Customer=existing?{...existing,name:input.customerName,email:input.customerEmail,phone:input.customerPhone,ordersCount:existing.ordersCount+1,totalSpent:existing.totalSpent+input.total}:{id:uid('customer'),name:input.customerName,email:input.customerEmail,phone:input.customerPhone,ordersCount:1,totalSpent:input.total,tags:['Admin'],createdAt:new Date().toISOString(),acceptsMarketing:false,addresses:[],notes:[]};
  const order:Order={...input,id:input.id||uid('order'),number:input.number||orderNumber(),customerId:customer.id,source:'admin',createdAt:input.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  const nextProducts=products.map(p=>{const orderLines=order.lines.filter(l=>l.productId===p.id);if(!orderLines.length)return p;let productDelta=0;const variants=p.variants.map(v=>{const line=orderLines.find(l=>l.variantId===v.id);if(!line)return v;productDelta+=line.quantity;return{...v,inventory:Math.max(0,v.inventory-line.quantity)}});return{...p,variants,inventory:Math.max(0,p.inventory-productDelta),updatedAt:new Date().toISOString()}});
  const newAdjustments:InventoryAdjustment[]=order.lines.map(l=>{const p=products.find(x=>x.id===l.productId)!;const v=p.variants.find(x=>x.id===l.variantId);const before=v?.inventory??p.inventory;return{id:uid('adjustment'),productId:p.id,variantId:l.variantId,sku:l.sku,productTitle:p.title,delta:-l.quantity,before,after:Math.max(0,before-l.quantity),reason:'order',note:`Trừ kho cho ${order.number}`,createdAt:new Date().toISOString(),referenceId:order.id}});
  const nextOrders=[order,...orders],nextCustomers=customers.some(c=>c.id===customer.id)?customers.map(c=>c.id===customer.id?customer:c):[customer,...customers],nextAdjustments=[...newAdjustments,...adjustments].slice(0,1000);
  setProducts(nextProducts);setOrders(nextOrders);setCustomers(nextCustomers);setAdjustments(nextAdjustments);
  syncProducts(nextProducts);syncOrders(nextOrders);sync('timeforge/customers',nextCustomers);sync('timeforge/inventoryAdjustments',nextAdjustments);
  log('order',order.id,'Tạo đơn từ draft',`${order.number} · ${order.customerName}`);
  return order;
 };
 const updateOrder=(id:string,patch:Partial<Order>)=>setOrders(cur=>{
  const found=cur.find(x=>x.id===id);if(!found)return cur;
  const updated={...found,...patch,updatedAt:new Date().toISOString()};
  const next=cur.map(x=>x.id===id?updated:x);
  if(user?.access==='active'){
   if(firebaseClient.enabled)void firebaseClient.write(`timeforge/orders/${id}`,updated).catch(reportFirebaseError);
   log('order',id,'Cập nhật đơn hàng',`${found.number} · ${Object.keys(patch).join(', ')}`);
  }
  return next;
 });
 const cancelOrder=(id:string)=>{
  const order=orders.find(o=>o.id===id);
  if(!order||order.status==='cancelled')return;
  const now=new Date().toISOString();
  const cancelledOrder={...order,status:'cancelled' as OrderStatus,fulfillmentStatus:'unfulfilled' as const,updatedAt:now};
  const nextProducts=products.map(product=>{
   const lines=order.lines.filter(line=>line.productId===product.id);
   if(!lines.length)return product;
   const quantities=new Map<string,number>();
   lines.forEach(line=>quantities.set(line.variantId,(quantities.get(line.variantId)||0)+line.quantity));
   const restored=lines.reduce((sum,line)=>sum+line.quantity,0);
   return{...product,variants:product.variants.map(variant=>({...variant,inventory:variant.inventory+(quantities.get(variant.id)||0)})),inventory:product.inventory+restored,updatedAt:now};
  });
  const restocks:InventoryAdjustment[]=order.lines.map(line=>{
   const product=products.find(item=>item.id===line.productId)!;
   const variant=product.variants.find(item=>item.id===line.variantId);
   const before=variant?.inventory??product.inventory;
   return{id:uid('adjustment'),productId:product.id,variantId:line.variantId,sku:line.sku,productTitle:product.title,delta:line.quantity,before,after:before+line.quantity,reason:'cancelled_order',note:`Hoàn kho do hủy ${order.number}`,createdAt:now,referenceId:order.id};
  });
  setProducts(nextProducts);
  setOrders(current=>current.map(item=>item.id===id?cancelledOrder:item));
  setAdjustments(current=>[...restocks,...current]);
  if(firebaseClient.enabled&&user?.access==='active'){
   const updates:Record<string,unknown>={[`timeforge/orders/${id}`]:cancelledOrder};
   nextProducts.filter(product=>order.lines.some(line=>line.productId===product.id)).forEach(product=>{updates[productFirebasePath(product.sku)]=product});
   restocks.forEach(adjustment=>{updates[`timeforge/inventoryAdjustments/${adjustment.id}`]=adjustment});
   void firebaseClient.update(updates).catch(reportFirebaseError);
  }
  log('order',id,'Hủy đơn hàng',order.number);
 };
 const adjustInventory=(productId:string,variantId:string,delta:number,note:string)=>{const p=products.find(x=>x.id===productId);if(!p||!delta)return;const v=p.variants.find(x=>x.id===variantId)||p.variants[0],before=v?.inventory??p.inventory,after=Math.max(0,before+delta);const nextProducts=products.map(x=>x.id!==productId?x:{...x,inventory:Math.max(0,x.inventory+delta),variants:x.variants.map(y=>y.id===(v?.id||variantId)?{...y,inventory:after}:y),updatedAt:new Date().toISOString()});const adjustment:InventoryAdjustment={id:uid('adjustment'),productId,variantId:v?.id||variantId,sku:v?.sku||p.sku,productTitle:p.title,delta,before,after,reason:'manual',note:note||'Điều chỉnh thủ công',createdAt:new Date().toISOString(),referenceId:''};const nextAdjustments=[adjustment,...adjustments];setProducts(nextProducts);setAdjustments(nextAdjustments);syncProducts(nextProducts);sync('timeforge/inventoryAdjustments',nextAdjustments);log('inventory',productId,'Điều chỉnh tồn kho',`${p.title}: ${delta>0?'+':''}${delta}`)};

 const reset=()=>{Object.values(K).forEach(k=>localStorage.removeItem(k));const freshTheme=createThemeState();setProducts([]);setCollections(seedCollections);setProductGroups([]);setCustomers(seedCustomers);setNewsletterSubscribers([]);setCart([]);setOrders(seedOrders);setDiscounts(seedDiscounts);setAdjustments(seedAdjustments);setActivities(seedActivities);setThemeState(freshTheme);setStoreProfile(storeProfileFromTheme(freshTheme.published));setHeaders([]);void import('./seed').then(({seed})=>setProducts(seed.products))};
 const activeTheme=previewTheme||applyStoreProfileToTheme(themeState.published,storeProfile);
 const value=useMemo(()=>({products,collections,productGroups,customers,newsletterSubscribers,cart,orders,discounts,adjustments,activities,theme:activeTheme,draftTheme:applyStoreProfileToTheme(themeState.draft,storeProfile),themeState,storeProfile,headers,firebaseEnabled:firebaseClient.enabled,isLoading,dataSource,dataError,setHeaders,saveProduct,deleteProducts,replaceProducts,mergeProducts,saveCollection,deleteCollection,saveProductGroup,replaceProductGroups,deleteProductGroup,saveCustomer,subscribeNewsletter,updateNewsletterSubscriber,deleteNewsletterSubscriber,saveThemeDraft,publishTheme,restoreThemeVersion,saveStoreProfile,addToCart,updateCart,clearCart:()=>setCart([]),evaluateDiscount,saveDiscount,deleteDiscount,createOrder,submitStorefrontOrder,createAdminOrder,updateOrder,cancelOrder,adjustInventory,reset,collectionProducts}),[products,collections,productGroups,customers,newsletterSubscribers,cart,orders,discounts,adjustments,activities,activeTheme,themeState,storeProfile,headers,isLoading,dataSource,dataError,collectionProducts]);
 return <C.Provider value={value}>{children}</C.Provider>
}
export const useCommerce=()=>{const c=useContext(C);if(!c)throw new Error('CommerceProvider missing');return c};
