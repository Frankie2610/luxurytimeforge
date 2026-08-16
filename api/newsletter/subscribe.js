const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const subscriberKey=email=>{let hash=2166136261;for(let i=0;i<email.length;i++){hash^=email.charCodeAt(i);hash=Math.imul(hash,16777619)}return`subscriber_${(hash>>>0).toString(36)}`};
const firebaseBase=()=>String(process.env.FIREBASE_DATABASE_URL||'').replace(/\/$/,'');
const firebaseUrl=path=>{const base=firebaseBase(),auth=process.env.FIREBASE_DATABASE_AUTH;if(!base||!auth)return'';return`${base}/${path}.json?auth=${encodeURIComponent(auth)}`};
async function firebaseRead(path){const url=firebaseUrl(path);if(!url)throw Object.assign(new Error('Newsletter server storage is not configured'),{status:501});const response=await fetch(url,{headers:{'Cache-Control':'no-store'}});if(!response.ok)throw new Error(`Firebase read failed (${response.status})`);return response.json()}
async function firebaseWrite(path,value){const url=firebaseUrl(path);if(!url)throw Object.assign(new Error('Newsletter server storage is not configured'),{status:501});const response=await fetch(url,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});if(!response.ok)throw new Error(`Firebase write failed (${response.status})`)}
async function sendConfirmation(email,source){
  const key=process.env.RESEND_API_KEY,from=process.env.NEWSLETTER_FROM_EMAIL||process.env.RESEND_FROM_EMAIL||process.env.EMAIL_FROM;if(!key||!from)return false;
  const store=process.env.NEWSLETTER_STORE_NAME||'Luxury Timeforge';
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[email],subject:`Đăng ký nhận tin từ ${store}`,html:`<div style="font-family:Arial,sans-serif;line-height:1.65;color:#1e2d24"><h2 style="margin:0 0 12px">Đã đăng ký nhận tin thành công</h2><p>Cảm ơn bạn đã đăng ký nhận cập nhật từ <strong>${store}</strong>.</p><p>Chúng tôi sẽ chỉ gửi những nội dung liên quan đến bộ sưu tập mới, ưu đãi và thông tin hữu ích.</p></div>`,reply_to:process.env.NEWSLETTER_REPLY_TO||undefined})});
  const notify=String(process.env.NEWSLETTER_NOTIFY_EMAIL||'').trim();if(response.ok&&notify)void fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[notify],subject:`Newsletter mới · ${email}`,html:`<p><strong>${email}</strong> vừa đăng ký nhận tin từ nguồn <strong>${String(source||'storefront').replace(/[<>&"']/g,'')}</strong>.</p>`,reply_to:email})}).catch(()=>{});
  return response.ok;
}
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({message:'Method not allowed'});
  const email=String(req.body?.email||'').trim().toLowerCase(),source=String(req.body?.source||'storefront').slice(0,80);
  if(!emailPattern.test(email))return res.status(400).json({result:'invalid',message:'Email chưa đúng định dạng.'});
  try{
    const id=subscriberKey(email),path=`timeforge/newsletterSubscribers/${id}`,existing=await firebaseRead(path),now=new Date().toISOString();
    if(existing?.status==='active')return res.status(200).json({result:'exists',emailSent:false});
    const value={id,email,source,status:'active',createdAt:existing?.createdAt||now,updatedAt:now};
    await firebaseWrite(path,value);
    const emailSent=await sendConfirmation(email,source).catch(()=>false);
    return res.status(200).json({result:existing?'reactivated':'created',emailSent});
  }catch(error){return res.status(error?.status||500).json({message:error instanceof Error?error.message:'Newsletter signup failed'})}
}
