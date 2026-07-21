import'./auth.css';
import{useMemo,useState}from'react';
import{ArrowLeft,Eye,EyeOff,KeyRound,LockKeyhole,Mail,ShieldCheck}from'lucide-react';
import{Link,Navigate,useLocation,useNavigate}from'react-router-dom';
import{useAuth}from'./auth';

const RETURN_KEY='tf:admin:return-to';

export function AdminLogin(){
  const{user,firebaseEnabled,accessConfigured,demoEnabled,loginDemo,loginEmail,loginGoogle,resetPassword}=useAuth();
  const navigate=useNavigate();
  const location=useLocation();
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[showPassword,setShowPassword]=useState(false);
  const[error,setError]=useState('');
  const[notice,setNotice]=useState('');
  const[busy,setBusy]=useState<'email'|'google'|'reset'|'demo'|null>(null);
  const returnTo=useMemo(()=>((location.state as{from?:string}|null)?.from||sessionStorage.getItem(RETURN_KEY)||'/admin'),[location.state]);
  if(user?.access==='active')return <Navigate to={returnTo} replace/>;
  const done=()=>{sessionStorage.removeItem(RETURN_KEY);navigate(returnTo,{replace:true})};
  const run=async(type:typeof busy,task:()=>Promise<void>|void,success?:string)=>{setBusy(type);setError('');setNotice('');try{await task();if(success)setNotice(success);else done()}catch(reason){setError(reason instanceof Error?reason.message:'Không thể hoàn tất đăng nhập.')}finally{setBusy(null)}};
  const ready=firebaseEnabled&&accessConfigured;

  return <main className="tf-auth-page">
    <div className="tf-auth-backdrop" aria-hidden="true"/>
    <Link className="tf-auth-store-link" to="/"><ArrowLeft/>Về cửa hàng</Link>
    <section className="tf-auth-card" aria-labelledby="tf-auth-title">
      <header className="tf-auth-brand">
        <img src="/luxury-timeforge-logo.svg" alt="Luxury Timeforge"/>
        <div><b>LUXURY TIMEFORGE</b><span>COMMERCE ADMIN</span></div>
      </header>
      <div className="tf-auth-heading"><span><ShieldCheck/>Khu vực quản trị bảo mật</span><h1 id="tf-auth-title">Đăng nhập Admin</h1><p>Quản lý sản phẩm, đơn hàng, khách hàng và giao diện cửa hàng bằng Firebase Authentication.</p></div>
      {!firebaseEnabled&&<div className="tf-auth-config"><b>Chưa kết nối Firebase Web App</b><span>Điền các biến <code>VITE_FIREBASE_*</code> trong <code>.env.local</code> hoặc Vercel.</span></div>}
      {firebaseEnabled&&!accessConfigured&&<div className="tf-auth-config"><b>Chưa cấu hình danh sách quản trị</b><span>Điền <code>VITE_OWNER_EMAIL</code> hoặc <code>VITE_ADMIN_EMAILS</code>.</span></div>}
      {error&&<div className="tf-auth-message is-error" role="alert">{error}</div>}
      {notice&&<div className="tf-auth-message is-success" role="status">{notice}</div>}
      {ready&&<>
        <button className="tf-auth-google" disabled={Boolean(busy)} onClick={()=>void run('google',loginGoogle)}><span>G</span>{busy==='google'?'Đang kết nối Google…':'Tiếp tục bằng Google'}</button>
        <div className="tf-auth-divider"><span>hoặc đăng nhập bằng email</span></div>
        <form className="tf-auth-form" onSubmit={event=>{event.preventDefault();void run('email',()=>loginEmail(email,password))}}>
          <label><span>Email quản trị</span><div><Mail/><input type="email" autoComplete="email" required value={email} onChange={event=>setEmail(event.target.value)} placeholder="admin@luxurytimeforge.vn"/></div></label>
          <label><span>Mật khẩu</span><div><LockKeyhole/><input type={showPassword?'text':'password'} autoComplete="current-password" required value={password} onChange={event=>setPassword(event.target.value)} placeholder="Nhập mật khẩu"/><button type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'Ẩn mật khẩu':'Hiện mật khẩu'}>{showPassword?<EyeOff/>:<Eye/>}</button></div></label>
          <button className="tf-auth-submit" disabled={Boolean(busy)}>{busy==='email'?'Đang đăng nhập…':'Đăng nhập'}</button>
          <button className="tf-auth-reset" type="button" disabled={Boolean(busy)} onClick={()=>void run('reset',()=>resetPassword(email),'Đã gửi email đặt lại mật khẩu. Kiểm tra hộp thư của bạn.') }><KeyRound/>{busy==='reset'?'Đang gửi…':'Quên mật khẩu?'}</button>
        </form>
      </>}
      {!ready&&demoEnabled&&<button className="tf-auth-submit" disabled={Boolean(busy)} onClick={()=>void run('demo',loginDemo)}>{busy==='demo'?'Đang mở…':'Vào Admin Demo'}</button>}
      <footer><ShieldCheck/><span>Firebase giữ phiên đăng nhập trên thiết bị này. Quyền dữ liệu vẫn được kiểm soát bằng Realtime Database Security Rules.</span></footer>
    </section>
  </main>;
}
