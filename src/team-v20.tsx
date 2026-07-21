import {useEffect,useMemo,useState} from 'react';
import {Check,Clock3,Copy,KeyRound,Mail,RefreshCw,ShieldCheck,Trash2,UserPlus,UsersRound,XCircle} from 'lucide-react';
import {adminInvitationPath,ADMIN_INVITATIONS_PATH,adminMemberPath,ADMIN_MEMBERS_PATH,inviteExpired,normalizeEmail,type AdminInvitationRecord,type AdminMemberRecord} from './admin-access';
import {useAuth} from './auth';
import {firebaseClient,getFirebaseAuth,isFirebasePermissionError} from './firebase';
import {roleLabels,rolePermissions,type AdminRole} from './permissions';
import {Button} from './ui';

type InviteRole=Exclude<AdminRole,'owner'>;
const day=86_400_000;
const configuredPublicOrigin=String(import.meta.env.VITE_PUBLIC_SITE_URL||'').trim().replace(/\/$/,'');
const configuredAuthLinkDomain=String(import.meta.env.VITE_FIREBASE_AUTH_LINK_DOMAIN||'').trim();
const invitationOrigin=()=>typeof window!=='undefined'&&window.location?.origin?window.location.origin:configuredPublicOrigin;
const invitationUrl=(id:string)=>`${invitationOrigin()}/admin/accept-invite?invite=${encodeURIComponent(id)}`;

function firebaseInviteMessage(error:unknown){
  const code=typeof error==='object'&&error&&'code'in error?String((error as{code?:unknown}).code||''):'';
  const currentHost=new URL(invitationOrigin()).hostname;
  const messages:Record<string,string>={
    'auth/operation-not-allowed':'Firebase Authentication chưa bật Email/Password và Email link. Vào Authentication → Sign-in method để bật hai tùy chọn này.',
    'auth/unauthorized-continue-uri':`Tên miền ${currentHost} chưa nằm trong Authentication → Settings → Authorized domains.`,
    'auth/invalid-continue-uri':'Đường dẫn quay lại của email không hợp lệ. Chỉ dùng URL http/https hợp lệ trong VITE_PUBLIC_SITE_URL.',
    'auth/invalid-email':'Địa chỉ email người được mời không hợp lệ.',
    'auth/too-many-requests':'Firebase đang giới hạn tạm thời do gửi quá nhiều email. Đợi một lúc rồi thử lại.',
    'auth/quota-exceeded':'Đã vượt hạn mức gửi email của Firebase Authentication.',
    'auth/network-request-failed':'Không thể kết nối tới Firebase Authentication. Kiểm tra mạng rồi thử lại.',
    'auth/invalid-api-key':'VITE_FIREBASE_API_KEY không đúng với Firebase project đang sử dụng.',
  };
  if(messages[code])return `${messages[code]}${code?` (${code})`:''}`;
  const raw=error instanceof Error?error.message:'Firebase không gửi được email mời.';
  return `${raw}${code&&!raw.includes(code)?` (${code})`:''}`;
}
const asArray=<T extends {id?:string;uid?:string}>(value:Record<string,T>|T[]|null)=>value?Array.isArray(value)?value.filter(Boolean):Object.entries(value).map(([id,item])=>({...item,id:item.id||id,uid:item.uid||id})):[];
const cleanRecord=<T extends object>(value:T)=>Object.fromEntries(Object.entries(value).filter(([,item])=>item!==undefined)) as T;

function emit(message:string,tone:'success'|'danger'|'info'='success'){window.dispatchEvent(new CustomEvent('timeforge:toast',{detail:{message,tone}}))}
function humanDate(value:string){return new Date(value).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
const isEmailQuotaExceeded=(message:string)=>message.includes('auth/quota-exceeded')||message.toLowerCase().includes('hạn mức');

export function TeamPermissionsV20(){
  const{user}=useAuth();
  const[members,setMembers]=useState<AdminMemberRecord[]>([]);
  const[invites,setInvites]=useState<AdminInvitationRecord[]>([]);
  const[email,setEmail]=useState('');
  const[name,setName]=useState('');
  const[role,setRole]=useState<InviteRole>('admin');
  const[loading,setLoading]=useState(true);
  const[sending,setSending]=useState(false);
  const[error,setError]=useState('');
  const[lastRequested,setLastRequested]=useState<AdminInvitationRecord|null>(null);
  const[deliveryWarning,setDeliveryWarning]=useState<AdminInvitationRecord|null>(null);
  const[rulesBlocked,setRulesBlocked]=useState(false);

  const load=async()=>{
    if(!firebaseClient.enabled){setLoading(false);return}
    setLoading(true);setError('');
    try{
      const[memberMap,inviteMap]=await Promise.all([
        firebaseClient.read<Record<string,AdminMemberRecord>>(ADMIN_MEMBERS_PATH),
        firebaseClient.read<Record<string,AdminInvitationRecord>>(ADMIN_INVITATIONS_PATH),
      ]);
      setRulesBlocked(false);
      setMembers(asArray(memberMap));
      setInvites(asArray(inviteMap).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));
    }catch(reason){setRulesBlocked(isFirebasePermissionError(reason));setError(reason instanceof Error?reason.message:'Không thể tải dữ liệu phân quyền.')}finally{setLoading(false)}
  };

  useEffect(()=>{void load()},[]);

  const sendEmailLink=async(invite:AdminInvitationRecord)=>{
    const auth=await getFirebaseAuth();if(!auth)throw new Error('Firebase Authentication chưa sẵn sàng.');
    auth.languageCode='vi';
    const sdk=await import('firebase/auth');
    const continueUrl=invitationUrl(invite.id);
    try{
      const settings:{url:string;handleCodeInApp:boolean;linkDomain?:string}={url:continueUrl,handleCodeInApp:true,...(configuredAuthLinkDomain?{linkDomain:configuredAuthLinkDomain}:{})};
      await sdk.sendSignInLinkToEmail(auth,invite.email,settings);
      const{deliveryError:_deliveryError,...base}=invite;
      return cleanRecord({...base,deliveryStatus:'sent' as const,lastSentAt:new Date().toISOString(),continueUrl});
    }catch(reason){
      throw new Error(firebaseInviteMessage(reason));
    }
  };

  const invite=async()=>{
    const normalized=normalizeEmail(email);
    if(!normalized||!normalized.includes('@')){setError('Nhập email hợp lệ.');return}
    if(!firebaseClient.enabled){setError('Cần cấu hình Firebase Realtime Database trước khi gửi lời mời.');return}
    if(invites.some(item=>item.email===normalized&&item.status==='pending')){setError('Email này đang có một lời mời chờ chấp nhận.');return}
    if(members.some(item=>item.email===normalized&&item.status==='active')){setError('Email này đã là thành viên đang hoạt động.');return}
    setSending(true);setError('');setLastRequested(null);setDeliveryWarning(null);
    const now=new Date();
    const record:AdminInvitationRecord={
      id:crypto.randomUUID(),email:normalized,name:name.trim()||normalized.split('@')[0],role,status:'pending',
      invitedBy:user?.uid||'',invitedByName:user?.name||'Chủ cửa hàng',createdAt:now.toISOString(),expiresAt:new Date(now.getTime()+7*day).toISOString(),
    };
    try{
      try{
        await firebaseClient.write(adminInvitationPath(record.id),record);
        setRulesBlocked(false);
      }catch(reason){
        setRulesBlocked(isFirebasePermissionError(reason));
        setError(`Không thể lưu lời mời vào Realtime Database. ${reason instanceof Error?reason.message:'Kiểm tra Firebase Rules.'}`);
        return;
      }
      try{
        const delivered=await sendEmailLink(record);
        await firebaseClient.write(adminInvitationPath(record.id),delivered);
        setInvites(current=>[delivered,...current.filter(item=>item.id!==delivered.id)]);setLastRequested(delivered);setEmail('');setName('');setRole('admin');
        emit(`Firebase đã tiếp nhận yêu cầu gửi tới ${record.email}.`);
      }catch(reason){
        const message=reason instanceof Error?reason.message:'Không thể gửi email lời mời.';
        const failed={...record,deliveryStatus:'failed' as const,deliveryError:message,lastSentAt:new Date().toISOString(),continueUrl:invitationUrl(record.id)};
        await firebaseClient.write(adminInvitationPath(record.id),failed).catch(()=>{});
        setInvites(current=>[failed,...current.filter(item=>item.id!==failed.id)]);
        if(isEmailQuotaExceeded(message)){setDeliveryWarning(failed);emit('Lời mời đã lưu. Firebase đang giới hạn quota email; dùng liên kết dự phòng.','info')}
        else setError(`Lời mời đã được lưu nhưng Firebase Authentication chưa gửi được email. ${message}`);
      }
    }finally{setSending(false)}
  };

  const resend=async(inviteRecord:AdminInvitationRecord)=>{
    setError('');setLastRequested(null);setDeliveryWarning(null);
    const now=new Date();
    const next=cleanRecord({...inviteRecord,status:'pending' as const,createdAt:now.toISOString(),expiresAt:new Date(now.getTime()+7*day).toISOString(),acceptedAt:undefined,acceptedBy:undefined,cancelledAt:undefined,deliveryError:undefined});
    try{
      await firebaseClient.write(adminInvitationPath(next.id),next);
      setRulesBlocked(false);
    }catch(reason){
      setRulesBlocked(isFirebasePermissionError(reason));
      setError(`Không thể cập nhật lời mời trong Realtime Database. ${reason instanceof Error?reason.message:'Kiểm tra Firebase Rules.'}`);
      return;
    }
    try{
      const delivered=await sendEmailLink(next);
      await firebaseClient.write(adminInvitationPath(next.id),delivered);
      setInvites(current=>current.map(item=>item.id===next.id?delivered:item));
      setLastRequested(delivered);
      emit(`Firebase đã nhận yêu cầu gửi lại tới ${next.email}. Hãy kiểm tra Inbox, Spam và Quảng cáo.`);
    }catch(reason){
      const message=reason instanceof Error?reason.message:'Không thể gửi lại email lời mời.';
      const failed={...next,deliveryStatus:'failed' as const,deliveryError:message,lastSentAt:new Date().toISOString(),continueUrl:invitationUrl(next.id)};
      await firebaseClient.write(adminInvitationPath(failed.id),failed).catch(()=>{});
      setInvites(current=>current.map(item=>item.id===failed.id?failed:item));
      if(isEmailQuotaExceeded(message)){setDeliveryWarning(failed);emit('Lời mời vẫn còn hiệu lực. Firebase đang giới hạn quota email; dùng liên kết dự phòng.','info')}
      else setError(`Firebase Authentication chưa gửi được email. ${message}`);
    }
  };

  const cancel=async(inviteRecord:AdminInvitationRecord)=>{
    const next={...inviteRecord,status:'cancelled' as const,cancelledAt:new Date().toISOString()};
    try{await firebaseClient.write(adminInvitationPath(next.id),next);setInvites(current=>current.map(item=>item.id===next.id?next:item));emit('Đã thu hồi lời mời.','info')}
    catch(reason){setRulesBlocked(isFirebasePermissionError(reason));setError(reason instanceof Error?reason.message:'Không thể thu hồi lời mời.')}
  };

  const changeRole=async(member:AdminMemberRecord,nextRole:AdminRole)=>{
    const next={...member,role:nextRole,updatedAt:new Date().toISOString()};
    try{await firebaseClient.write(adminMemberPath(member.uid),next);setMembers(current=>current.map(item=>item.uid===member.uid?next:item));emit(`Đã đổi quyền của ${member.email}.`)}
    catch(reason){setRulesBlocked(isFirebasePermissionError(reason));setError(reason instanceof Error?reason.message:'Không thể đổi vai trò.')}
  };

  const suspend=async(member:AdminMemberRecord)=>{
    if(!confirm(`Thu hồi quyền truy cập của ${member.email}?`))return;
    const next={...member,status:'suspended' as const,updatedAt:new Date().toISOString()};
    try{await firebaseClient.write(adminMemberPath(member.uid),next);setMembers(current=>current.map(item=>item.uid===member.uid?next:item));emit('Đã thu hồi quyền truy cập.','info')}
    catch(reason){setRulesBlocked(isFirebasePermissionError(reason));setError(reason instanceof Error?reason.message:'Không thể thu hồi quyền.')}
  };

  const copyInvite=async(inviteRecord:AdminInvitationRecord)=>{await navigator.clipboard.writeText(invitationUrl(inviteRecord.id));emit('Đã sao chép đường dẫn lời mời.','info')};
  const pending=invites.filter(item=>item.status==='pending'&&!inviteExpired(item));
  const activeMembers=members.filter(item=>item.status==='active');
  const counts=useMemo(()=>({active:activeMembers.length+1,pending:pending.length}),[activeMembers.length,pending.length]);

  return <div className="tf4917-team-page">
    <section className="tf4917-team-hero">
      <div><span><ShieldCheck/>TRUY CẬP AN TOÀN</span><h2>Nhân sự và phân quyền</h2><p>Gửi lời mời qua email, chờ người nhận xác thực và chỉ kích hoạt đúng vai trò được phê duyệt.</p></div>
      <div className="tf4917-team-metrics"><article><b>{counts.active}</b><span>Đang hoạt động</span></article><article><b>{counts.pending}</b><span>Chờ chấp nhận</span></article></div>
    </section>

    {!firebaseClient.enabled&&<div className="tf4917-team-alert"><XCircle/><div><b>Chưa kết nối Realtime Database</b><p>Luồng mời cần đủ biến VITE_FIREBASE_* và databaseURL.</p></div></div>}
    {rulesBlocked&&<div className="tf4917-team-alert is-error"><ShieldCheck/><div><b>Firebase Rules chưa cấp quyền quản trị</b><p>Chạy corepack.cmd pnpm run firebase:rules:deploy trong đúng thư mục có .env.local, sau đó đăng xuất và đăng nhập lại.</p></div></div>}
    {error&&<div className="tf4917-team-alert is-error"><XCircle/><div><b>Không thể hoàn tất</b><p>{error}</p></div><button onClick={()=>setError('')} aria-label="Đóng"><XCircle/></button></div>}
    {deliveryWarning&&<div className="tf4917-team-alert"><Clock3/><div><b>Email đang chạm hạn mức Firebase</b><p>Lời mời cho {deliveryWarning.email} đã được lưu và vẫn có hiệu lực. Chờ quota làm mới hoặc nâng gói Firebase; trong lúc đó có thể gửi liên kết dự phòng cho đúng người nhận.</p></div><button onClick={()=>void copyInvite(deliveryWarning)}><Copy/>Sao chép link</button></div>}
    {lastRequested&&<div className="tf4917-team-alert"><Mail/><div><b>Firebase đã tiếp nhận yêu cầu gửi</b><p>Người nhận: {lastRequested.email}. Nếu Gmail chưa có thư sau vài phút, kiểm tra Spam/Quảng cáo và quota Email link của Firebase, hoặc dùng liên kết dự phòng.</p></div><button onClick={()=>void copyInvite(lastRequested)}><Copy/>Sao chép link</button></div>}

    <div className="tf4917-team-layout">
      <section className="tf4917-team-card tf4917-invite-form">
        <header><div className="tf4917-team-card-icon"><UserPlus/></div><div><h3>Mời thành viên mới</h3><p>Email sẽ chứa liên kết xác thực dùng một lần.</p></div></header>
        <div className="tf4917-team-fields">
          <label><span>Họ tên</span><input value={name} onChange={event=>setName(event.target.value)} placeholder="Nguyễn Văn A"/></label>
          <label><span>Email</span><input type="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="email@domain.com"/></label>
          <label><span>Vai trò</span><select value={role} onChange={event=>setRole(event.target.value as InviteRole)}>{Object.entries(roleLabels).filter(([key])=>key!=='owner').map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        </div>
        <div className="tf4917-role-preview"><KeyRound/><div><b>{roleLabels[role]}</b><p>{rolePermissions[role].slice(0,4).map(permission=>permission.replace('.', ' · ')).join(' · ')}</p></div></div>
        <Button disabled={sending||!firebaseClient.enabled||rulesBlocked} onClick={()=>void invite()}>{sending?<RefreshCw className="is-spin"/>:<Mail/>}{sending?'Đang gửi lời mời…':'Gửi lời mời qua email'}</Button>
        <small className="tf4917-invite-note">Email sẽ quay về <b>{new URL(invitationOrigin()).hostname}</b>. Domain này phải có trong Firebase Authentication → Settings → Authorized domains. Gói Spark chỉ có quota Email link rất thấp; nếu thử gửi nhiều lần trong ngày, hãy kiểm tra Usage hoặc dùng nút sao chép link.</small>
      </section>

      <section className="tf4917-team-card tf4917-members-card">
        <header><div className="tf4917-team-card-icon"><UsersRound/></div><div><h3>Thành viên đang hoạt động</h3><p>Vai trò có hiệu lực ngay sau khi lưu.</p></div><button className="tf4917-refresh" onClick={()=>void load()} aria-label="Tải lại"><RefreshCw/></button></header>
        <div className="tf4917-member-list">
          <article className="tf4917-member-row is-owner"><span className="tf4917-avatar">{(user?.name||'O').slice(0,1).toUpperCase()}</span><div><b>{user?.name||'Chủ cửa hàng'}</b><small>{user?.email}</small></div><span className="tf4917-role-pill">Chủ cửa hàng</span><span className="tf4917-state is-active"><Check/>Hoạt động</span></article>
          {loading&&<div className="tf4917-team-loading"><i/><span>Đang tải thành viên…</span></div>}
          {!loading&&activeMembers.map(member=><article className="tf4917-member-row" key={member.uid}><span className="tf4917-avatar">{member.name.slice(0,1).toUpperCase()}</span><div><b>{member.name}</b><small>{member.email}</small></div><select value={member.role} onChange={event=>void changeRole(member,event.target.value as AdminRole)}>{Object.entries(roleLabels).filter(([key])=>key!=='owner').map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><div className="tf4917-member-actions"><span className="tf4917-state is-active"><Check/>Hoạt động</span><button onClick={()=>void suspend(member)} aria-label="Thu hồi quyền"><Trash2/></button></div></article>)}
          {!loading&&!activeMembers.length&&<div className="tf4917-team-empty"><UsersRound/><b>Chưa có thành viên phụ</b><span>Thành viên sẽ xuất hiện sau khi chấp nhận lời mời.</span></div>}
        </div>
      </section>
    </div>

    <section className="tf4917-team-card tf4917-pending-card">
      <header><div className="tf4917-team-card-icon"><Clock3/></div><div><h3>Lời mời</h3><p>Theo dõi trạng thái, gửi lại hoặc thu hồi lời mời.</p></div></header>
      <div className="tf4917-invite-list">
        {invites.map(inviteRecord=>{const expired=inviteRecord.status==='pending'&&inviteExpired(inviteRecord);const status=expired?'expired':inviteRecord.status;return <article key={inviteRecord.id}><div className="tf4917-invite-person"><span className="tf4917-avatar">{inviteRecord.name.slice(0,1).toUpperCase()}</span><div><b>{inviteRecord.name}</b><small>{inviteRecord.email}</small></div></div><div className="tf4917-invite-role"><small>Vai trò</small><b>{roleLabels[inviteRecord.role]}</b></div><div className="tf4917-invite-time"><small>{inviteRecord.deliveryStatus==='failed'?'Email':'Gửi lúc'}</small><b className={inviteRecord.deliveryStatus==='failed'?'is-delivery-error':''}>{inviteRecord.deliveryStatus==='failed'?'Chưa gửi được':humanDate(inviteRecord.lastSentAt||inviteRecord.createdAt)}</b></div><span className={`tf4917-state is-${inviteRecord.deliveryStatus==='failed'?'delivery-failed':status}`}>{inviteRecord.deliveryStatus==='failed'?<XCircle/>:status==='accepted'?<Check/>:status==='cancelled'?<XCircle/>:<Clock3/>}{inviteRecord.deliveryStatus==='failed'?'Lỗi gửi email':status==='pending'?'Chờ chấp nhận':status==='accepted'?'Đã chấp nhận':status==='expired'?'Hết hạn':'Đã thu hồi'}</span><div className="tf4917-invite-actions">{status!=='accepted'&&<button onClick={()=>void resend(inviteRecord)} title="Gửi lại"><RefreshCw/></button>}<button onClick={()=>void copyInvite(inviteRecord)} title="Sao chép link"><Copy/></button>{status==='pending'&&<button className="danger" onClick={()=>void cancel(inviteRecord)} title="Thu hồi"><Trash2/></button>}</div></article>})}
        {!invites.length&&<div className="tf4917-team-empty"><Mail/><b>Chưa gửi lời mời nào</b><span>Lời mời mới sẽ được theo dõi tại đây.</span></div>}
      </div>
    </section>

    <section className="tf4917-permission-matrix"><header><span>MA TRẬN QUYỀN</span><h3>Phạm vi mặc định theo vai trò</h3><p>Quyền giao diện và Firebase Rules được áp dụng theo nhóm công việc.</p></header><div>{(Object.keys(roleLabels) as AdminRole[]).map(roleKey=><article key={roleKey}><h4>{roleLabels[roleKey]}</h4><ul>{rolePermissions[roleKey].map(permission=><li key={permission}><Check/>{permission.replaceAll('.',' · ')}</li>)}</ul></article>)}</div></section>
  </div>;
}
