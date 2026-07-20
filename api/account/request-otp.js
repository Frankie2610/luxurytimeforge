import crypto from 'node:crypto';

const b64=value=>Buffer.from(value).toString('base64url');
const sign=(value,secret)=>crypto.createHmac('sha256',secret).update(value).digest('base64url');
async function findCustomer(identifier){
  const base=String(process.env.FIREBASE_DATABASE_URL||'').replace(/\/$/,'');const auth=process.env.FIREBASE_DATABASE_AUTH;
  if(!base||!auth)throw new Error('Firebase server credentials are not configured');
  const response=await fetch(`${base}/timeforge/customers.json?auth=${encodeURIComponent(auth)}`,{headers:{'Cache-Control':'no-store'}});
  if(!response.ok)throw new Error(`Firebase read failed (${response.status})`);
  const raw=await response.json();const customers=Array.isArray(raw)?raw:Object.values(raw||{});const normalized=String(identifier).trim().toLowerCase().replace(/\s+/g,'');
  return customers.find(customer=>String(customer.email||'').toLowerCase()===normalized||String(customer.phone||'').replace(/\s+/g,'')===normalized);
}
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({message:'Method not allowed'});
  const secret=process.env.CUSTOMER_SESSION_SECRET;if(!secret)return res.status(501).json({message:'Customer OTP is not configured'});
  const identifier=String(req.body?.identifier||'').trim();if(!identifier)return res.status(400).json({message:'Missing identifier'});
  try{
    const customer=await findCustomer(identifier);if(!customer)return res.status(404).json({message:'Không tìm thấy hồ sơ khách hàng phù hợp.'});
    const code=String(Math.floor(100000+Math.random()*900000));const expiresAt=Date.now()+10*60*1000;const payload=b64(JSON.stringify({customerId:customer.id,identifier:identifier.toLowerCase(),codeHash:crypto.createHash('sha256').update(`${code}:${secret}`).digest('hex'),expiresAt}));const challenge=`${payload}.${sign(payload,secret)}`;
    const endpoint=process.env.CUSTOMER_OTP_DELIVERY_ENDPOINT;const apiKey=process.env.CUSTOMER_OTP_DELIVERY_API_KEY;
    if(endpoint){const delivery=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(apiKey?{'Authorization':`Bearer ${apiKey}`}:{})},body:JSON.stringify({identifier,code,expiresInMinutes:10,customerName:customer.name})});if(!delivery.ok)throw new Error(`OTP delivery failed (${delivery.status})`);}
    else if(process.env.CUSTOMER_OTP_DEV_MODE!=='true')return res.status(501).json({message:'OTP delivery provider is not configured'});
    return res.status(200).json({challenge,maskedIdentifier:identifier.includes('@')?identifier.replace(/(^.).*(@.*$)/,'$1***$2'):`***${identifier.slice(-4)}`,...(process.env.CUSTOMER_OTP_DEV_MODE==='true'?{devCode:code}:{})});
  }catch(error){return res.status(500).json({message:error instanceof Error?error.message:'OTP request failed'});}
}
