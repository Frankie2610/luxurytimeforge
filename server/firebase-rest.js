const firebaseConfig=()=>{
  const base=String(process.env.FIREBASE_DATABASE_URL||process.env.VITE_FIREBASE_DATABASE_URL||'').replace(/\/$/,'');
  const auth=String(process.env.FIREBASE_DATABASE_AUTH||'');
  if(!base||!auth)throw new Error('Firebase server credentials are not configured');
  return{base,auth};
};

const firebaseUrl=(path)=>{
  const{base,auth}=firebaseConfig();
  return`${base}/${path}.json?auth=${encodeURIComponent(auth)}`;
};

export async function firebaseAppendUnique(path,value,key='id'){
  for(let attempt=0;attempt<4;attempt+=1){
    const response=await fetch(firebaseUrl(path),{headers:{'Cache-Control':'no-store','X-Firebase-ETag':'true'}});
    if(!response.ok)throw new Error(`Firebase read failed (${response.status})`);
    const raw=await response.json();
    const list=Array.isArray(raw)?raw.filter(Boolean):Object.values(raw||{}).filter(Boolean);
    const existing=list.find(item=>item?.[key]===value?.[key]);
    if(existing)return existing;
    const write=await fetch(firebaseUrl(path),{method:'PUT',headers:{'Content-Type':'application/json','if-match':response.headers.get('etag')||'*'},body:JSON.stringify([...list,value])});
    if(write.ok)return value;
    if(write.status!==412)throw new Error(`Firebase write failed (${write.status})`);
  }
  throw new Error('Firebase order write conflict');
}

export async function firebaseRead(path){
  const response=await fetch(firebaseUrl(path),{headers:{'Cache-Control':'no-store'}});
  if(!response.ok)throw new Error(`Firebase read failed (${response.status})`);
  return response.json();
}

export async function firebaseWrite(path,value){
  const response=await fetch(firebaseUrl(path),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
  if(!response.ok)throw new Error(`Firebase write failed (${response.status})`);
  return response.json().catch(()=>value);
}


export async function firebaseMultiPatch(values){
  const response=await fetch(firebaseUrl(''),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});
  if(!response.ok)throw new Error(`Firebase multi-path patch failed (${response.status})`);
  return response.json().catch(()=>values);
}

export async function firebasePatch(path,value){
  const response=await fetch(firebaseUrl(path),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
  if(!response.ok)throw new Error(`Firebase patch failed (${response.status})`);
  return response.json().catch(()=>value);
}

export function firebaseEntries(raw){
  if(Array.isArray(raw))return raw.map((value,index)=>[String(index),value]).filter(([,value])=>Boolean(value));
  return Object.entries(raw||{}).filter(([,value])=>Boolean(value));
}

export async function findOrder(reference,{retries=0}={}){
  const waits=[0,180,420,850,1500];
  for(let attempt=0;attempt<=Math.min(retries,waits.length-1);attempt+=1){
    if(waits[attempt])await new Promise(resolve=>setTimeout(resolve,waits[attempt]));
    const entries=firebaseEntries(await firebaseRead('timeforge/orders'));
    const found=entries.find(([,order])=>order?.id===reference||order?.number===reference);
    if(found)return{key:found[0],order:found[1]};
  }
  return null;
}

export async function findPaymentSessionByOrderCode(orderCode){
  const entries=firebaseEntries(await firebaseRead('timeforge/paymentSessions'));
  const found=entries.find(([,session])=>Number(session?.orderCode)===Number(orderCode));
  return found?{key:found[0],session:found[1]}:null;
}
