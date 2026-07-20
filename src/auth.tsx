import{createContext,useContext,useEffect,useMemo,useState,type ReactNode}from'react';
import{Navigate,useLocation}from'react-router-dom';
import{firebaseAppEnabled,getFirebaseAuth}from'./firebase';
import{hasPermission,type Permission,type AdminRole}from'./permissions';

type Role=AdminRole;
type User={uid:string;email:string;name:string;photoURL?:string;role:Role};
type AuthValue={
  user:User|null;
  loading:boolean;
  firebaseEnabled:boolean;
  accessConfigured:boolean;
  demoEnabled:boolean;
  can:(permission:Permission)=>boolean;
  loginDemo:()=>void;
  loginEmail:(email:string,password:string)=>Promise<void>;
  loginGoogle:()=>Promise<void>;
  resetPassword:(email:string)=>Promise<void>;
  logout:()=>Promise<void>;
};

const C=createContext<AuthValue|null>(null);
const DEMO_KEY='tf.react.admin-demo-session';
const RETURN_KEY='tf:admin:return-to';
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
const roleFor=(email:string):Role=>{const key=email.toLowerCase();if(key===ownerEmail)return'owner';return roleMap[key]||'admin'};
const normalize=(user:{uid:string;email?:string|null;displayName?:string|null;photoURL?:string|null}):User=>({uid:user.uid,email:user.email||'',name:user.displayName||user.email?.split('@')[0]||'Admin',photoURL:user.photoURL||undefined,role:roleFor(user.email||'')});
const allowed=(email?:string|null)=>Boolean(email&&allowedEmails.has(email.toLowerCase()));

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
  };
  if(messages[code])return messages[code];
  return error instanceof Error?error.message:'Không thể hoàn tất xác thực.';
}

export function AuthProvider({children}:{children:ReactNode}){
  const[user,setUser]=useState<User|null>(()=>{if(!demoEnabled)return null;try{return JSON.parse(sessionStorage.getItem(DEMO_KEY)||'null')}catch{return null}});
  const[loading,setLoading]=useState(firebaseAppEnabled);

  useEffect(()=>{
    if(!firebaseAppEnabled){setLoading(false);return}
    let active=true;
    let unsubscribe=()=>{};
    void(async()=>{
      const auth=await getFirebaseAuth();
      if(!auth){if(active)setLoading(false);return}
      const sdk=await import('firebase/auth');
      unsubscribe=sdk.onAuthStateChanged(auth,async firebaseUser=>{
        if(!active)return;
        if(!firebaseUser){setUser(null);setLoading(false);return}
        if(!accessConfigured||!allowed(firebaseUser.email)){
          await sdk.signOut(auth);
          setUser(null);
          setLoading(false);
          return;
        }
        setUser(normalize(firebaseUser));
        setLoading(false);
      });
    })().catch(()=>{if(active)setLoading(false)});
    return()=>{active=false;unsubscribe()};
  },[]);

  const assertReady=()=>{
    if(!firebaseAppEnabled)throw new Error('Firebase Authentication chưa được cấu hình.');
    if(!accessConfigured)throw new Error('Chưa cấu hình VITE_OWNER_EMAIL hoặc VITE_ADMIN_EMAILS.');
  };

  const loginDemo=()=>{
    if(!demoEnabled)throw new Error('Đăng nhập demo đang bị tắt.');
    const next:User={uid:'demo-owner',email:'owner@timeforge.local',name:'Luxury Timeforge Owner',role:'owner'};
    setUser(next);sessionStorage.setItem(DEMO_KEY,JSON.stringify(next));
  };

  const loginEmail=async(email:string,password:string)=>{
    assertReady();
    try{
      const auth=await getFirebaseAuth();if(!auth)throw new Error('Firebase Authentication chưa sẵn sàng.');
      const sdk=await import('firebase/auth');
      const credential=await sdk.signInWithEmailAndPassword(auth,email.trim(),password);
      if(!allowed(credential.user.email)){await sdk.signOut(auth);throw new Error('Email này không có quyền truy cập Admin.');}
    }catch(error){throw new Error(authMessage(error))}
  };

  const loginGoogle=async()=>{
    assertReady();
    try{
      const auth=await getFirebaseAuth();if(!auth)throw new Error('Firebase Authentication chưa sẵn sàng.');
      const sdk=await import('firebase/auth');
      const provider=new sdk.GoogleAuthProvider();
      provider.setCustomParameters({prompt:'select_account'});
      const credential=await sdk.signInWithPopup(auth,provider);
      if(!allowed(credential.user.email)){await sdk.signOut(auth);throw new Error('Tài khoản Google này không có quyền truy cập Admin.');}
    }catch(error){throw new Error(authMessage(error))}
  };

  const resetPassword=async(email:string)=>{
    assertReady();
    if(!email.trim())throw new Error('Nhập email quản trị trước khi đặt lại mật khẩu.');
    if(!allowed(email.trim()))throw new Error('Email này không nằm trong danh sách quản trị.');
    try{
      const auth=await getFirebaseAuth();if(!auth)throw new Error('Firebase Authentication chưa sẵn sàng.');
      const sdk=await import('firebase/auth');
      await sdk.sendPasswordResetEmail(auth,email.trim());
    }catch(error){throw new Error(authMessage(error))}
  };

  const logout=async()=>{
    sessionStorage.removeItem(DEMO_KEY);
    if(firebaseAppEnabled){const auth=await getFirebaseAuth();if(auth){const sdk=await import('firebase/auth');await sdk.signOut(auth)}}
    setUser(null);
  };

  const can=(permission:Permission)=>hasPermission(user?.role,permission);
  const value=useMemo(()=>({user,loading,firebaseEnabled:firebaseAppEnabled,accessConfigured,demoEnabled,can,loginDemo,loginEmail,loginGoogle,resetPassword,logout}),[user,loading]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export const useAuth=()=>{const value=useContext(C);if(!value)throw new Error('AuthProvider missing');return value};

export function ProtectedAdmin({children}:{children:ReactNode}){
  const{user,loading}=useAuth();
  const location=useLocation();
  if(loading)return <div className="tf-auth-check"><img src="/luxury-timeforge-logo.svg" alt=""/><span/><b>Đang xác thực phiên quản trị</b></div>;
  if(user)return <>{children}</>;
  const returnTo=`${location.pathname}${location.search}${location.hash}`;
  sessionStorage.setItem(RETURN_KEY,returnTo);
  return <Navigate to="/admin/login" replace state={{from:returnTo}}/>;
}
