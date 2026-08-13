import './v4917-admin-invite.css';
import {useEffect,useMemo,useState,type FormEvent} from 'react';
import {ArrowRight,CheckCircle2,KeyRound,Mail,ShieldCheck,TriangleAlert} from 'lucide-react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {adminInvitationPath,adminMemberPath,inviteExpired,normalizeEmail,type AdminInvitationRecord,type AdminMemberRecord} from './admin-access';
import {useAuth} from './auth';
import {firebaseClient,getFirebaseAuth} from './firebase';
import {roleLabels} from './permissions';
import {useCommerce} from './context';
import {resolveStoreLogo,resolveStoreName} from './store-profile';
import {optimizedImage} from './image-utils';

const emailKey='tf:admin-invite-email';

type Stage='checking'|'email'|'sending'|'sent'|'accepting'|'success'|'error';

export function AcceptAdminInviteV4917(){
  const[params]=useSearchParams();
  const navigate=useNavigate();
  const{refreshAccess}=useAuth();
  const{storeProfile}=useCommerce();
  const storeName=resolveStoreName(storeProfile.storeName);
  const inviteId=params.get('invite')||'';
  const[email,setEmail]=useState(()=>sessionStorage.getItem(emailKey)||'');
  const[invite,setInvite]=useState<AdminInvitationRecord|null>(null);
  const[stage,setStage]=useState<Stage>('checking');
  const[message,setMessage]=useState('Đang kiểm tra lời mời quản trị…');

  const currentUrl=useMemo(()=>window.location.href,[]);

  useEffect(()=>{
    let active=true;
    void(async()=>{
      if(!inviteId){if(active){setStage('error');setMessage('Liên kết mời không có mã xác nhận.')}return}
      if(!firebaseClient.enabled){if(active){setStage('error');setMessage('Firebase Realtime Database chưa được cấu hình cho lời mời quản trị.')}return}
      const auth=await getFirebaseAuth();
      const sdk=await import('firebase/auth');
      if(!auth){if(active){setStage('error');setMessage('Firebase Authentication chưa sẵn sàng.')}return}
      if(sdk.isSignInWithEmailLink(auth,currentUrl)){
        const cached=sessionStorage.getItem(emailKey)||'';
        if(cached){setEmail(cached);setStage('accepting');void complete(cached)}
        else{setStage('email');setMessage('Nhập đúng email đã nhận lời mời để xác thực và kích hoạt quyền.')}
        return;
      }
      if(auth.currentUser?.email){setEmail(auth.currentUser.email);setStage('accepting');void complete(auth.currentUser.email);return}
      setStage('email');setMessage('Nhập email được mời. Hệ thống sẽ gửi một liên kết xác thực mới tới email này.');
    })().catch(error=>{if(active){setStage('error');setMessage(error instanceof Error?error.message:'Không thể kiểm tra lời mời.')}});
    return()=>{active=false};
  // complete intentionally uses the current invite query.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[inviteId,currentUrl]);

  const complete=async(candidateEmail:string)=>{
    try{
      setStage('accepting');setMessage('Đang xác thực email và kích hoạt quyền quản trị…');
      const normalized=normalizeEmail(candidateEmail);
      const auth=await getFirebaseAuth();if(!auth)throw new Error('Firebase Authentication chưa sẵn sàng.');
      const sdk=await import('firebase/auth');
      const emailLinkMode=sdk.isSignInWithEmailLink(auth,currentUrl);
      let firebaseUser=auth.currentUser;
      if(emailLinkMode||!firebaseUser||normalizeEmail(firebaseUser.email||'')!==normalized){
        const credential=await sdk.signInWithEmailLink(auth,normalized,currentUrl);
        firebaseUser=credential.user;
      }
      if(!firebaseUser||normalizeEmail(firebaseUser.email||'')!==normalized)throw new Error('Tài khoản xác thực không trùng với lời mời.');
      const record=invite||await firebaseClient.read<AdminInvitationRecord>(adminInvitationPath(inviteId));
      if(!record)throw new Error('Không tìm thấy lời mời.');
      if(normalizeEmail(record.email)!==normalized)throw new Error('Email này không trùng với email được mời.');
      const token=await firebaseUser.getIdTokenResult();
      const provider=String(token.signInProvider||((token.claims.firebase as{sign_in_provider?:unknown}|undefined)?.sign_in_provider)||'');
      if(provider==='google.com'&&record.allowGoogleSignIn!==true)throw new Error('Admin chưa cho phép email này đăng nhập bằng Google. Hãy mở liên kết xác thực email hoặc liên hệ chủ cửa hàng.');
      const retryAccepted=record.status==='accepted'&&record.acceptedBy===firebaseUser.uid;
      if((record.status!=='pending'&&!retryAccepted)||(record.status==='pending'&&inviteExpired(record)))throw new Error('Lời mời đã hết hạn hoặc không còn hiệu lực.');
      setInvite(record);
      const now=new Date().toISOString();
      const member:AdminMemberRecord={uid:firebaseUser.uid,email:normalized,name:record.name||firebaseUser.displayName||normalized.split('@')[0],role:record.role,status:'active',inviteId:record.id,invitedAt:record.createdAt,acceptedAt:record.acceptedAt||now,allowGoogleSignIn:record.allowGoogleSignIn===true,updatedAt:now};
      if(record.status==='pending'){
        const acceptedInvite:AdminInvitationRecord={...record,status:'accepted',acceptedAt:now,acceptedBy:firebaseUser.uid};
        await firebaseClient.write(adminInvitationPath(record.id),acceptedInvite);
      }
      await firebaseClient.write(adminMemberPath(firebaseUser.uid),member);
      sessionStorage.removeItem(emailKey);
      await firebaseUser.getIdToken(true);
      await refreshAccess();
      setStage('success');setMessage('Quyền quản trị đã được kích hoạt.');
      setTimeout(()=>navigate('/admin',{replace:true}),1100);
    }catch(error){setStage('error');setMessage(error instanceof Error?error.message:'Không thể chấp nhận lời mời.')}
  };

  const sendVerification=async(candidateEmail:string)=>{
    try{
      const normalized=normalizeEmail(candidateEmail);
      if(!normalized||!normalized.includes('@'))throw new Error('Nhập email hợp lệ.');
      setStage('sending');setMessage('Đang yêu cầu Firebase gửi email xác thực…');
      const auth=await getFirebaseAuth();if(!auth)throw new Error('Firebase Authentication chưa sẵn sàng.');
      auth.languageCode='vi';
      const sdk=await import('firebase/auth');
      sessionStorage.setItem(emailKey,normalized);
      const cleanUrl=new URL(currentUrl);['apiKey','oobCode','mode','lang'].forEach(key=>cleanUrl.searchParams.delete(key));
      await sdk.sendSignInLinkToEmail(auth,normalized,{url:cleanUrl.toString(),handleCodeInApp:true});
      setStage('sent');setMessage('Firebase đã nhận yêu cầu gửi. Kiểm tra Inbox, Spam và tab Quảng cáo rồi mở liên kết trong email.');
    }catch(error){setStage('error');setMessage(error instanceof Error?error.message:'Không thể gửi email xác thực.')}
  };

  const submit=(event:FormEvent)=>{event.preventDefault();const normalized=normalizeEmail(email);sessionStorage.setItem(emailKey,normalized);void(async()=>{const auth=await getFirebaseAuth();const sdk=await import('firebase/auth');if(auth&&sdk.isSignInWithEmailLink(auth,currentUrl))void complete(normalized);else void sendVerification(normalized)})()};
  return <main className="tf4917-invite-page">
    <section className="tf4917-invite-card">
      <div className="tf4917-invite-brand"><img src={optimizedImage(resolveStoreLogo(storeProfile.logoImage),180,180,'fit')} alt={storeName}/><span>COMMERCE ADMIN</span></div>
      <div className={`tf4917-invite-icon is-${stage}`}>{stage==='success'?<CheckCircle2/>:stage==='error'?<TriangleAlert/>:<ShieldCheck/>}</div>
      <span className="tf4917-invite-kicker">LỜI MỜI QUẢN TRỊ</span>
      <h1>{stage==='success'?'Đã kích hoạt quyền truy cập':stage==='error'?'Không thể hoàn tất lời mời':stage==='sent'?'Kiểm tra email xác thực':`Tham gia ${storeName}`}</h1>
      <p>{message}</p>
      {invite&&stage!=='success'&&stage!=='error'&&<div className="tf4917-invite-summary"><div><Mail/><span><small>Email</small><b>{invite.email}</b></span></div><div><KeyRound/><span><small>Vai trò</small><b>{roleLabels[invite.role]}</b></span></div><div><span className="tf527-invite-google-mark">G</span><span><small>Đăng nhập Google</small><b>{invite.allowGoogleSignIn===true?'Được Admin cho phép':'Không được cho phép'}</b></span></div></div>}
      {stage==='email'&&<form onSubmit={submit}><label>Email nhận lời mời<input autoFocus type="email" required value={email} onChange={event=>setEmail(event.target.value)} placeholder="email@domain.com"/></label><button type="submit">Xác nhận và chấp nhận<ArrowRight/></button></form>}
      {stage==='sending'||stage==='accepting'||stage==='checking'?<div className="tf4917-invite-loading"><i/><span>Vui lòng không đóng trang này.</span></div>:null}
      {stage==='sent'&&<div className="tf4917-invite-actions"><button onClick={()=>void sendVerification(email)}><Mail/>Gửi lại email xác thực</button></div>}
      {stage==='error'&&<div className="tf4917-invite-actions"><button onClick={()=>{setStage('email');setMessage('Nhập đúng email được mời để tiếp tục.')}}><Mail/>Thử lại bằng email khác</button><Link to="/admin/login">Về trang đăng nhập</Link></div>}
      {stage==='success'&&<div className="tf4917-invite-actions"><button onClick={()=>navigate('/admin',{replace:true})}>Mở trang quản trị<ArrowRight/></button></div>}
      <footer>Liên kết chỉ cấp đúng vai trò đã được chủ cửa hàng phê duyệt.</footer>
    </section>
  </main>;
}
