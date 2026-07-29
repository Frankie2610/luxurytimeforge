import{createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode}from'react';
import{Navigate,useLocation}from'react-router-dom';
import{firebaseAppEnabled,firebaseClient,getFirebaseAuth,isFirebasePermissionError}from'./firebase';
import{adminMemberPath,activeMember,type AdminMemberRecord}from'./admin-access';
import{hasPermission,type Permission,type AdminRole}from'./permissions';

type Role=AdminRole;
export type AdminSessionUser={uid:string;email:string;name:string;photoURL?:string;role:Role;access:'active'|'pending'};
type AuthValue={
  user:AdminSessionUser|null;
  loading:boolean;
  firebaseEnabled:boolean;
  accessConfigured:boolean;
  demoEnabled:boolean;
  can:(permission:Permission)=>boolean;
  loginDemo:()=>void;
  loginEmail:(email:string,password:string)=>Promise<void>;
  loginGoogle:()=>Promise<void>;
  resetPassword:(email:string)=>Promise<void>;
  refreshAccess:()=>Promise<AdminSessionUser|null>;
  logout:()=>Promise<void>;
};

const C=createContext<AuthValue|null>(null);
const DEMO_KEY='tf.react.admin-demo-session';
const FIREBASE_SESSION_KEY='tf:admin:firebase-session';
const RETURN_KEY='tf:admin:return-to';
const AUTH_RETRY_DELAYS=[450,1200,2500];
const demoEnabled=String(import.meta.env.VITE_ENABLE_DEMO_LOGIN||'').toLowerCase()==='true';
const splitEmails=(value:unknown)=>String(value||'').split(',').map(item=>item.trim().toLowerCase()).filter(Boolean);
const ownerEmail=String(import.meta.env.VITE_OWNER_EMAIL||'').trim().toLowerCase();
const configuredAdmins=splitEmails(import.meta.env.VITE_ADMIN_EMAILS);
const roleMap=String(import.meta.env.VITE_ADMIN_ROLE_MAP||'').split(',').map((entry:string)=>entry.trim()).filter(Boolean).reduce((acc:Record<string,Role>,entry:string)=>{
  const[email,role]=entry.split(':').map(value=>value.trim().toLowerCase());
  if(email&&['owner','admin','manager','staff','content'].includes(role))acc[email]=role as Role;
  return acc;
},{});
const allowedEmails=new Set([ownerEmail,...configuredAdmins,...Object.keys(roleMap)].filter(Boolean));
const accessConfigured=allowedEmails.size>0;
const roleForConfiguredEmail=(email:string):Role=>{const key=email.toLowerCase();if(key===ownerEmail)return'owner';return roleMap[key]||'admin'};
const configuredEmail=(email?:string|null)=>Boolean(email&&allowedEmails.has(email.toLowerCase()));
const inviteRoute=()=>typeof window!=='undefined'&&window.location.pathname.startsWith('/admin/accept-invite');
export const embeddedThemePreview=()=>{
  if(typeof window==='undefined')return false;
  try{
    const params=new URLSearchParams(window.location.search);
    return window.self!==window.top&&params.get('theme_preview')==='1'&&params.get('tf_editor')==='1';
  }catch{return false}
};
const validRole=(role:unknown):role is Role=>['owner','admin','manager','staff','content'].includes(String(role));
const readFirebaseSession=():AdminSessionUser|null=>{
  if(typeof window==='undefined')return null;
  try{
    const value=JSON.parse(sessionStorage.getItem(FIREBASE_SESSION_KEY)||'null') as Partial<AdminSessionUser>|null;
    return value&&typeof value.uid==='string'&&typeof value.email==='string'&&typeof value.name==='string'&&value.access==='active'&&validRole(value.role)?value as AdminSessionUser:null;
  }catch{return null}
};
const writeFirebaseSession=(value:AdminSessionUser|null)=>{
  if(typeof window==='undefined')return;
  if(value?.access==='active')sessionStorage.setItem(FIREBASE_SESSION_KEY,JSON.stringify(value));
  else sessionStorage.removeItem(FIREBASE_SESSION_KEY);
};

function authMessage(error:unknown){
  const code=typeof error==='object'&&error&&'code'in error?String((error as{code?:unknown}).code||''):'';
  const messages:Record<string,string>={
    'auth/invalid-credential':'Email hoặc mật khẩu chưa đúng.',
    'auth/user-disabled':'Tài khoản này đã bị vô hiệu hóa.',
    'auth/too-many-requests':'Có quá nhiều lần thử. Vui lòng đợi một lúc rồi thử lại.',
    'auth/network-request-failed':'Không thể kết nối Firebase. Kiểm tra mạng rồi thử lại.',
    'auth/popup-closed-by-user':'Cửa sổ đăng nhập Google đã được đóng.',
    'auth/popup-blocked':'Trình duyệt đang chặn cửa sổ đăng nhập Google.',
    'auth/unauthorized-domain':'Tên miền hiện tại chưa được thêm vào Firebase Authentication → Authorized domains.',
    'auth/invalid-email':'Địa chỉ email không hợp lệ.',
    'auth/user-not-found':'Không tìm thấy tài khoản quản trị này.',
    'auth/invalid-action-code':'Liên kết mời không hợp lệ hoặc đã được sử dụng.',
    'auth/expired-action-code':'Liên kết mời đã hết hạn.',
  };
  if(messages[code])return messages[code];
  return error instanceof Error?error.message:'Không thể hoàn tất xác thực.';
}

export function AuthProvider({children}:{children:ReactNode}){
  const location=useLocation();
  const previewFrame=embeddedThemePreview();
  const authRequired=location.pathname.startsWith('/admin');
  const[user,setUser]=useState<AdminSessionUser|null>(()=>{if(previewFrame||!authRequired)return null;if(demoEnabled){try{const demo=JSON.parse(sessionStorage.getItem(DEMO_KEY)||'null');if(demo)return demo}catch{}}return readFirebaseSession()});
  const[loading,setLoading]=useState(firebaseAppEnabled&&!previewFrame&&authRequired);

  const resolveFirebaseUser=useCallback(async(firebaseUser:{uid:string;email?:string|null;displayName?:string|null;photoURL?:string|null},allowPending=false):Promise<AdminSessionUser|null>=>{
    const email=(firebaseUser.email||'').trim().toLowerCase();
    if(configuredEmail(email))return{uid:firebaseUser.uid,email,name:firebaseUser.displayName||email.split('@')[0]||'Admin',photoURL:firebaseUser.photoURL||undefined,role:roleForConfiguredEmail(email),access:'active'};
    if(firebaseClient.enabled){
      try{
        const record=await firebaseClient.read<AdminMemberRecord>(adminMemberPath(firebaseUser.uid));
        if(activeMember(record)&&record.email.toLowerCase()===email)return{uid:firebaseUser.uid,email,name:record.name||firebaseUser.displayName||email.split('@')[0]||'Admin',photoURL:firebaseUser.photoURL||undefined,role:record.role,access:'active'};
      }catch(error){
        /* A stale rules deployment must not create an unhandled promise in the auth observer.
           The invite page may continue in pending mode and show its own actionable error. */
        if(!isFirebasePermissionError(error)||!allowPending)throw error;
      }
    }
    if(allowPending&&email)return{uid:firebaseUser.uid,email,name:firebaseUser.displayName||email.split('@')[0]||'Thành viên được mời',photoURL:firebaseUser.photoURL||undefined,role:'staff',access:'pending'};
    return null;
  },[]);

  const refreshAccess=useCallback(async()=>{
    if(!firebaseAppEnabled)return null;
    const auth=await getFirebaseAuth();
    if(!auth?.currentUser){writeFirebaseSession(null);setUser(null);return null}
    const next=await resolveFirebaseUser(auth.currentUser,inviteRoute());
    writeFirebaseSession(next);
    setUser(next);
    return next;
  },[resolveFirebaseUser]);

  useEffect(()=>{
    /* The same-origin storefront iframe inside Theme Editor never needs Admin auth.
       Starting another observer there can propagate a background sign-out back to
       the parent window because Firebase persistence is shared by the origin. */
    if(previewFrame||!firebaseAppEnabled||!authRequired){setLoading(false);return}
    setLoading(true)
    let active=true;
    let revision=0;
    let unsubscribe=()=>{};
    const timers=new Set<ReturnType<typeof setTimeout>>();
    void(async()=>{
      const auth=await getFirebaseAuth();
      if(!auth){if(active)setLoading(false);return}
      const sdk=await import('firebase/auth');
      const resolveObserved=async(firebaseUser:NonNullable<typeof auth.currentUser>,token:number,attempt=0):Promise<void>=>{
        if(!active||token!==revision)return;
        try{
          const next=await resolveFirebaseUser(firebaseUser,inviteRoute());
          if(!active||token!==revision)return;
          if(!next&&!inviteRoute()){
            writeFirebaseSession(null);
            setUser(null);
            setLoading(false);
            return;
          }
          writeFirebaseSession(next);
          setUser(next);
          setLoading(false);
        }catch(error){
          if(!active||token!==revision)return;
          if(attempt<AUTH_RETRY_DELAYS.length){
            const timer=setTimeout(()=>{timers.delete(timer);void resolveObserved(firebaseUser,token,attempt+1)},AUTH_RETRY_DELAYS[attempt]);
            timers.add(timer);
            return;
          }
          const cached=readFirebaseSession();
          const email=(firebaseUser.email||'').trim().toLowerCase();
          if(cached&&cached.uid===firebaseUser.uid&&cached.email.toLowerCase()===email){
            setUser(cached);
          }else{
            setUser(null);
          }
          setLoading(false);
          console.warn('[TimeForge] Không thể làm mới quyền Admin; Firebase vẫn giữ phiên đăng nhập để thử lại.',error);
        }
      };
      const nextUnsubscribe=sdk.onAuthStateChanged(auth,firebaseUser=>{
        const token=++revision;
        if(!active)return;
        if(!firebaseUser){writeFirebaseSession(null);setUser(null);setLoading(false);return}
        void resolveObserved(firebaseUser,token);
      });
      if(!active)nextUnsubscribe();
      else unsubscribe=nextUnsubscribe;
    })().catch(()=>{if(active)setLoading(false)});
    return()=>{active=false;revision++;timers.forEach(timer=>clearTimeout(timer));timers.clear();unsubscribe()};
  },[previewFrame,resolveFirebaseUser,authRequired]);

  const assertReady=()=>{
    if(!firebaseAppEnabled)throw new Error('Firebase Authentication chưa được cấu hình.');
    if(!accessConfigured&&!firebaseClient.enabled)throw new Error('Chưa cấu hình chủ sở hữu hoặc Firebase Realtime Database.');
  };

  const loginDemo=()=>{
    if(!demoEnabled)throw new Error('Đăng nhập demo đang bị tắt.');
    const next:AdminSessionUser={uid:'demo-owner',email:'owner@timeforge.local',name:'Luxury Timeforge Owner',role:'owner',access:'active'};
    writeFirebaseSession(null);setUser(next);sessionStorage.setItem(DEMO_KEY,JSON.stringify(next));
  };

  const verifyCredential=async(firebaseUser:{uid:string;email?:string|null;displayName?:string|null;photoURL?:string|null})=>{
    const next=await resolveFirebaseUser(firebaseUser,false);
    if(next){writeFirebaseSession(next);setUser(next);return}
    const auth=await getFirebaseAuth();
    if(auth){const sdk=await import('firebase/auth');await sdk.signOut(auth)}
    throw new Error('Email này chưa được cấp quyền hoặc lời mời chưa được chấp nhận.');
  };

  const loginEmail=async(email:string,password:string)=>{
    assertReady();
    try{
      const auth=await getFirebaseAuth();if(!auth)throw new Error('Firebase Authentication chưa sẵn sàng.');
      const sdk=await import('firebase/auth');
      const credential=await sdk.signInWithEmailAndPassword(auth,email.trim(),password);
      await verifyCredential(credential.user);
    }catch(error){throw new Error(authMessage(error))}
  };

  const loginGoogle=async()=>{
    assertReady();
    try{
      const auth=await getFirebaseAuth();if(!auth)throw new Error('Firebase Authentication chưa sẵn sàng.');
      const sdk=await import('firebase/auth');
      const provider=new sdk.GoogleAuthProvider();
      provider.setCustomParameters({prompt:'select_account'});
      try{
        const credential=await sdk.signInWithPopup(auth,provider);
        await verifyCredential(credential.user);
      }catch(error){
        const code=typeof error==='object'&&error&&'code'in error?String((error as{code?:unknown}).code||''):'';
        if(code==='auth/popup-blocked'){
          await sdk.signInWithRedirect(auth,provider);
          return;
        }
        throw error;
      }
    }catch(error){throw new Error(authMessage(error))}
  };

  const resetPassword=async(email:string)=>{
    assertReady();
    if(!email.trim())throw new Error('Nhập email quản trị trước khi đặt lại mật khẩu.');
    try{
      const auth=await getFirebaseAuth();if(!auth)throw new Error('Firebase Authentication chưa sẵn sàng.');
      const sdk=await import('firebase/auth');
      await sdk.sendPasswordResetEmail(auth,email.trim());
    }catch(error){throw new Error(authMessage(error))}
  };

  const logout=async()=>{
    sessionStorage.removeItem(DEMO_KEY);
    writeFirebaseSession(null);
    if(firebaseAppEnabled){const auth=await getFirebaseAuth();if(auth){const sdk=await import('firebase/auth');await sdk.signOut(auth)}}
    setUser(null);
  };

  const can=(permission:Permission)=>Boolean(user?.access==='active'&&hasPermission(user.role,permission));
  const value=useMemo(()=>({user,loading,firebaseEnabled:firebaseAppEnabled,accessConfigured,demoEnabled,can,loginDemo,loginEmail,loginGoogle,resetPassword,refreshAccess,logout}),[user,loading,refreshAccess]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export const useAuth=()=>{const value=useContext(C);if(!value)throw new Error('AuthProvider missing');return value};

export function ProtectedAdmin({children}:{children:ReactNode}){
  const{user,loading}=useAuth();
  const location=useLocation();
  if(loading)return <div className="tf-admin-boot tf-admin-boot-auth" aria-label="Đang xác thực phiên quản trị" aria-busy="true"><div className="tf-admin-boot-bar"/><div className="tf-admin-boot-shell"><aside><i/><i/><i/><i/><i/></aside><main><header><i/><i/></header><section><i/><i/><div><i/><i/><i/></div></section></main></div></div>;
  if(user?.access==='active')return <>{children}</>;
  const returnTo=`${location.pathname}${location.search}${location.hash}`;
  sessionStorage.setItem(RETURN_KEY,returnTo);
  return <Navigate to="/admin/login" replace state={{from:returnTo}}/>;
}
