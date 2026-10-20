/**
 * Firebase Realtime Database REST optimistic transactions for checkout.
 *
 * A conditional PUT ("if-match" ETag) is atomic at ONE product path.
 * Multi-item checkout is therefore a saga: debit SKUs in stable order, commit
 * the order, and compensate earlier debits if a later step fails.
 *
 * A durable idempotency claim blocks duplicate concurrent submissions.
 * Interrupted claims are intentionally NOT retried automatically: a server
 * may have committed a debit immediately before disconnecting. An operator
 * must reconcile checkoutRequests and products before releasing such claims.
 */
import {firebaseRead,firebaseWrite} from './firebase-rest.js';

const url=(path)=>{
  const base=String(process.env.FIREBASE_DATABASE_URL||process.env.VITE_FIREBASE_DATABASE_URL||'').replace(/\/$/,'');
  const auth=String(process.env.FIREBASE_DATABASE_AUTH||'');
  if(!base||!auth)throw new Error('Firebase server credentials are not configured');
  return `${base}/${path}.json?auth=${encodeURIComponent(auth)}`;
};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const makeError=(message,statusCode=409)=>{
  const error=new Error(message);
  error.statusCode=statusCode;
  return error;
};
const amount=value=>Number.isSafeInteger(Number(value))?Number(value):0;
const withEtag=async(path)=>{
  const response=await fetch(url(path),{headers:{'Cache-Control':'no-store','X-Firebase-ETag':'true'}});
  if(!response.ok)throw makeError(`Firebase inventory read failed (${response.status})`,503);
  const etag=response.headers.get('etag');
  if(!etag)throw makeError('Firebase inventory ETag unavailable; refusing unsafe stock write.',503);
  return {etag,value:await response.json()};
};
const conditionalPut=async(path,etag,value)=>{
  let response;
  try{
    response=await fetch(url(path),{method:'PUT',headers:{'Content-Type':'application/json','if-match':etag},body:JSON.stringify(value)});
  }catch(cause){
    // The conditional PUT may have succeeded before the transport failed.
    // Never automatically credit stock back or retry the same debit.
    const error=makeError('Không xác định được kết quả cập nhật tồn kho. Cần đối soát đơn hàng.',503);
    error.inventoryOutcomeUnknown=true;
    error.cause=cause;
    throw error;
  }
  if(response.status===412)return false;
  if(!response.ok)throw makeError(`Firebase conditional inventory write failed (${response.status})`,503);
  return true;
};

/** Claims the stable checkout id, or returns false when another request owns it. */
export async function claimCheckout(id){
  const claim={id,status:'processing',createdAt:new Date().toISOString()};
  // null_etag is the RTDB REST special value meaning "write only if absent".
  return conditionalPut(`timeforge/checkoutRequests/${id}`,'null_etag',claim);
}
export async function finishCheckoutClaim(id,status,detail=''){
  return firebaseWrite(`timeforge/checkoutRequests/${id}`,{
    id,status,updatedAt:new Date().toISOString(),detail:String(detail).slice(0,240)
  });
}
export async function readCheckoutOrder(id){
  return firebaseRead(`timeforge/orders/${id}`);
}

/**
 * CAS-debit one product, including all requested variants.
 * Caller must pass previously server-priced order lines, never client prices.
 */
export async function debitCheckoutProduct(productKey,lines,{retries=8}={}){
  const path=`timeforge/products/${productKey}`;
  const quantities=new Map();
  for(const line of lines){
    const id=String(line.variantId||'');
    quantities.set(id,(quantities.get(id)||0)+amount(line.quantity));
  }
  const total=lines.reduce((sum,line)=>sum+amount(line.quantity),0);
  if(!total||lines.some(line=>amount(line.quantity)<1))throw makeError('Giỏ hàng không hợp lệ.',400);
  for(let attempt=0;attempt<retries;attempt++){
    const {etag,value:original}=await withEtag(path);
    if(!original||original.status!=='active'||original.published===false)throw makeError('Một sản phẩm không còn được bán.');
    if(amount(original.inventory)<total)throw makeError(`Sản phẩm "${String(original.title||productKey).slice(0,90)}" không đủ tồn kho.`);
    const variants=Array.isArray(original.variants)?original.variants:[];
    const currentByVariant=new Map();
    for(const line of lines){
      const selected=variants.find(item=>String(item.id)===String(line.variantId));
      if(variants.length&&!selected)throw makeError('Phiên bản sản phẩm đã thay đổi. Vui lòng tải lại giỏ hàng.');
      const price=Number(selected?.price??original.price);
      if(price!==Number(line.unitPrice))throw makeError('Giá sản phẩm vừa thay đổi. Vui lòng tải lại giỏ hàng.');
      const before=amount(selected?.inventory??original.inventory);
      const wanted=quantities.get(String(line.variantId))||0;
      if(before<wanted)throw makeError(`Sản phẩm "${String(original.title||productKey).slice(0,90)}" chỉ còn ${before} chiếc.`);
      currentByVariant.set(String(line.variantId),before);
    }
    const next={...original,inventory:amount(original.inventory)-total,updatedAt:new Date().toISOString()};
    if(variants.length){
      next.variants=variants.map(variant=>({
        ...variant,inventory:amount(variant.inventory)-(quantities.get(String(variant.id))||0)
      }));
    }
    if(await conditionalPut(path,etag,next)){
      return {productKey,lines:lines.map(line=>({...line,before:currentByVariant.get(String(line.variantId))??amount(original.inventory)}))};
    }
    await sleep(25*(attempt+1));
  }
  throw makeError('Tồn kho vừa được cập nhật bởi đơn khác. Vui lòng thử lại.');
}

/** Compensate a known completed CAS debit without erasing another checkout. */
export async function restoreCheckoutProduct(debit,{retries=12}={}){
  const path=`timeforge/products/${debit.productKey}`;
  const quantities=new Map();
  for(const line of debit.lines){
    quantities.set(String(line.variantId),(quantities.get(String(line.variantId))||0)+amount(line.quantity));
  }
  const total=debit.lines.reduce((sum,line)=>sum+amount(line.quantity),0);
  for(let attempt=0;attempt<retries;attempt++){
    const {etag,value:original}=await withEtag(path);
    if(!original)throw makeError('Không thể hoàn kho vì sản phẩm đã bị xóa.',503);
    const variants=Array.isArray(original.variants)?original.variants:[];
    const next={...original,inventory:amount(original.inventory)+total,updatedAt:new Date().toISOString()};
    if(variants.length)next.variants=variants.map(variant=>({
      ...variant,inventory:amount(variant.inventory)+(quantities.get(String(variant.id))||0)
    }));
    if(await conditionalPut(path,etag,next))return;
    await sleep(25*(attempt+1));
  }
  throw makeError('Không thể hoàn kho tự động; cần kiểm tra thủ công.',503);
}
