import crypto from 'node:crypto';
const sign=(value,secret)=>crypto.createHmac('sha256',secret).update(value).digest('base64url');
const safe=(a,b)=>{const left=Buffer.from(String(a||''));const right=Buffer.from(String(b||''));return left.length===right.length&&crypto.timingSafeEqual(left,right)};
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({message:'Method not allowed'});
  const secret=process.env.CUSTOMER_SESSION_SECRET;if(!secret)return res.status(501).json({message:'Customer OTP is not configured'});
  const challenge=String(req.body?.challenge||'');const code=String(req.body?.code||'').trim();const [payload,signature]=challenge.split('.');if(!payload||!signature||!code)return res.status(400).json({message:'Invalid verification request'});
  if(!safe(signature,sign(payload,secret)))return res.status(401).json({message:'Invalid challenge'});
  try{const data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));if(Number(data.expiresAt)<Date.now())return res.status(401).json({message:'Mã xác thực đã hết hạn'});const codeHash=crypto.createHash('sha256').update(`${code}:${secret}`).digest('hex');if(!safe(codeHash,data.codeHash))return res.status(401).json({message:'Mã xác thực không đúng'});const sessionPayload=Buffer.from(JSON.stringify({customerId:data.customerId,issuedAt:Date.now(),expiresAt:Date.now()+Number(process.env.CUSTOMER_SESSION_MINUTES||60)*60000})).toString('base64url');const token=`${sessionPayload}.${sign(sessionPayload,secret)}`;return res.status(200).json({customerId:data.customerId,token,expiresAt:JSON.parse(Buffer.from(sessionPayload,'base64url').toString('utf8')).expiresAt});}catch{return res.status(400).json({message:'Invalid challenge payload'});}
}
