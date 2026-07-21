const FIREBASE_INVALID_OBJECT_KEY=/[.#$/[\]]/;

export function isFirebaseSafeObjectKey(key:string){
  return key.length>0&&!FIREBASE_INVALID_OBJECT_KEY.test(key);
}

/**
 * Realtime Database rejects undefined values and object keys containing
 * `.`, `#`, `$`, `/`, `[` or `]`. Keep array positions stable while dropping
 * only unsafe object properties, such as raw Shopify CSV headers.
 */
export function firebaseSafeValue(value:unknown,inArray=false):unknown{
  if(value===undefined)return inArray?null:undefined;
  if(value===null||typeof value==='string'||typeof value==='boolean')return value;
  if(typeof value==='number')return Number.isFinite(value)?value:null;
  if(value instanceof Date)return value.toISOString();
  if(Array.isArray(value))return value.map(item=>firebaseSafeValue(item,true));
  if(typeof value==='object'){
    return Object.fromEntries(Object.entries(value as Record<string,unknown>)
      .filter(([key,item])=>item!==undefined&&isFirebaseSafeObjectKey(key))
      .map(([key,item])=>[key,firebaseSafeValue(item,false)]));
  }
  return String(value);
}
