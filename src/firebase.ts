import{firebaseSafeValue}from'./firebase-value';
export{firebaseSafeValue,isFirebaseSafeObjectKey}from'./firebase-value';

const config={
  apiKey:import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseAppEnabled=Boolean(config.apiKey&&config.authDomain&&config.projectId&&config.appId);
export const firebaseEnabled=Boolean(firebaseAppEnabled&&config.databaseURL);

let appPromise:Promise<import('firebase/app').FirebaseApp>|null=null;
let dbPromise:Promise<import('firebase/database').Database|null>|null=null;
let authPromise:Promise<import('firebase/auth').Auth|null>|null=null;

export type FirebaseClientError=Error&{code?:string;firebasePath?:string;firebaseOperation?:string};

function firebaseOperationError(error:unknown,operation:string,path:string):FirebaseClientError{
  const candidate=error as{code?:string;message?:string};
  const sourceCode=String(candidate?.code||'');
  const normalizedCode=sourceCode.toLowerCase();
  const message=String(candidate?.message||'');
  const denied=normalizedCode.includes('permission-denied')||message.toLowerCase().includes('permission_denied')||message.toLowerCase().includes('permission denied');
  const next=new Error(denied
    ?`Firebase từ chối quyền ${operation} tại ${path}. Rules của project hiện tại chưa cấp quyền cho tài khoản này. Chạy "corepack.cmd pnpm run firebase:rules:deploy" trong đúng source có .env.local.`
    :message||`Không thể ${operation} dữ liệu Firebase tại ${path}.`) as FirebaseClientError;
  next.name='FirebaseClientError';
  next.code=denied?'database/permission-denied':sourceCode||'database/unknown';
  next.firebasePath=path;
  next.firebaseOperation=operation;
  return next;
}

export function isFirebasePermissionError(error:unknown){
  const candidate=error as{code?:string;message?:string};
  return String(candidate?.code||'').toLowerCase().includes('permission-denied')||String(candidate?.message||'').toLowerCase().includes('permission');
}

export async function getFirebaseApp(){
  if(!firebaseAppEnabled)return null;
  if(!appPromise){
    appPromise=import('firebase/app').then(app=>app.getApps().length?app.getApp():app.initializeApp(config));
  }
  return appPromise;
}

export async function getFirebaseAuth(){
  if(!firebaseAppEnabled)return null;
  if(!authPromise){
    authPromise=Promise.all([getFirebaseApp(),import('firebase/auth')]).then(async([app,auth])=>{
      if(!app)return null;
      const instance=auth.getAuth(app);
      await auth.setPersistence(instance,auth.browserLocalPersistence);
      await instance.authStateReady();
      return instance;
    });
  }
  return authPromise;
}

async function db(){
  if(!firebaseEnabled)return null;
  if(!dbPromise){
    dbPromise=Promise.all([getFirebaseApp(),import('firebase/database')]).then(([app,database])=>app?database.getDatabase(app):null);
  }
  return dbPromise;
}

async function updateFirebasePaths(values:Record<string,unknown>,operationPath='timeforge'){
  const database=await db();if(!database)return;
  try{
    const sdk=await import('firebase/database');
    const safe=Object.fromEntries(Object.entries(values)
      .filter(([,value])=>value!==undefined)
      .map(([path,value])=>[path,firebaseSafeValue(value)]));
    await sdk.update(sdk.ref(database),safe);
  }catch(error){throw firebaseOperationError(error,'cập nhật nhiều đường dẫn',operationPath)}
}

export const firebaseClient={
  enabled:firebaseEnabled,
  async subscribe<T>(path:string,onValue:(value:T|null)=>void,onError?:(error:FirebaseClientError)=>void){
    const database=await db();if(!database)return()=>{};
    const sdk=await import('firebase/database');
    const reference=sdk.ref(database,path);
    const unsubscribe=sdk.onValue(reference,(snapshot)=>onValue(snapshot.exists()?snapshot.val() as T:null),(error)=>onError?.(firebaseOperationError(error,'theo dõi',path)));
    return unsubscribe;
  },
  async read<T>(path:string){
    const database=await db();if(!database)return null;
    try{
      const sdk=await import('firebase/database');
      const snapshot=await sdk.get(sdk.ref(database,path));
      return snapshot.exists()?snapshot.val() as T:null;
    }catch(error){throw firebaseOperationError(error,'đọc',path)}
  },
  async write<T>(path:string,value:T){
    const database=await db();if(!database)return;
    try{
      const sdk=await import('firebase/database');
      const safe=firebaseSafeValue(value);
      if(safe===undefined)throw new Error(`Không thể ghi giá trị undefined tại ${path}.`);
      await sdk.set(sdk.ref(database,path),safe);
    }catch(error){throw firebaseOperationError(error,'ghi',path)}
  },
  async update(values:Record<string,unknown>){
    await updateFirebasePaths(values);
  },
  async updateBatches(values:Record<string,unknown>,batchSize=100){
    const entries=Object.entries(values).filter(([,value])=>value!==undefined);
    const size=Math.max(1,Math.floor(batchSize));
    const total=Math.ceil(entries.length/size);
    for(let index=0;index<entries.length;index+=size){
      const batch=entries.slice(index,index+size);
      const first=batch[0]?.[0]||'timeforge';
      const last=batch.at(-1)?.[0]||first;
      await updateFirebasePaths(Object.fromEntries(batch),`timeforge · lô ${Math.floor(index/size)+1}/${total} · ${first} → ${last}`);
    }
  },
  async remove(path:string){
    const database=await db();if(!database)return;
    try{
      const sdk=await import('firebase/database');
      await sdk.remove(sdk.ref(database,path));
    }catch(error){throw firebaseOperationError(error,'xóa',path)}
  },
};
