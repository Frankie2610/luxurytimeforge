import crypto from 'node:crypto';
export default function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const origin=req.headers.origin||'';const allowed=(process.env.CLOUDINARY_ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
 if(allowed.length&&!allowed.includes(origin))return res.status(403).json({error:'Origin not allowed'});
 const apiSecret=process.env.CLOUDINARY_API_SECRET,apiKey=process.env.CLOUDINARY_API_KEY,cloudName=process.env.CLOUDINARY_CLOUD_NAME;
 if(!apiSecret||!apiKey||!cloudName)return res.status(500).json({error:'Cloudinary server env is missing'});
 const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});const timestamp=Math.floor(Date.now()/1000);const folder=String(body.folder||'timeforge').replace(/[^a-zA-Z0-9_\-/]/g,'');
 const params={folder,timestamp};const toSign=Object.keys(params).sort().map(k=>`${k}=${params[k]}`).join('&');const signature=crypto.createHash('sha1').update(toSign+apiSecret).digest('hex');
 res.setHeader('Cache-Control','no-store');return res.status(200).json({timestamp,signature,api_key:apiKey,cloud_name:cloudName,folder});
}
