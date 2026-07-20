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

export const firebaseClient={
  enabled:firebaseEnabled,
  async read<T>(path:string){
    const database=await db();if(!database)return null;
    const sdk=await import('firebase/database');
    const snapshot=await sdk.get(sdk.ref(database,path));
    return snapshot.exists()?snapshot.val() as T:null;
  },
  async write<T>(path:string,value:T){
    const database=await db();if(!database)return;
    const sdk=await import('firebase/database');
    await sdk.set(sdk.ref(database,path),value);
  },
  async update(values:Record<string,unknown>){
    const database=await db();if(!database)return;
    const sdk=await import('firebase/database');
    await sdk.update(sdk.ref(database),values);
  },
  async remove(path:string){
    const database=await db();if(!database)return;
    const sdk=await import('firebase/database');
    await sdk.remove(sdk.ref(database,path));
  },
};
