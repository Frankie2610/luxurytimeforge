const firebaseBase=()=>String(process.env.FIREBASE_DATABASE_URL||'').replace(/\/$/,'');
const firebaseAuth=()=>String(process.env.FIREBASE_DATABASE_AUTH||'');
const dbUrl=(path,query='')=>{const base=firebaseBase(),auth=firebaseAuth();if(!base||!auth)return'';const suffix=query?`&${query}`:'';return`${base}/${path}.json?auth=${encodeURIComponent(auth)}${suffix}`};
async function dbRead(path,query=''){const url=dbUrl(path,query);if(!url)throw Object.assign(new Error('Firebase server storage is not configured'),{status:501});const response=await fetch(url,{headers:{'Cache-Control':'no-store'}});if(!response.ok)throw new Error(`Firebase read failed (${response.status})`);return response.json()}
async function dbPatch(path,value){const url=dbUrl(path);if(!url)throw Object.assign(new Error('Firebase server storage is not configured'),{status:501});const response=await fetch(url,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});if(!response.ok)throw new Error(`Firebase update failed (${response.status})`)}
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money=value=>`${Math.max(0,Number(value)||0).toLocaleString('vi-VN')} ₫`;
async function sendPriceAlert(alert,product,currentPrice){
  const key=process.env.RESEND_API_KEY,from=process.env.NEWSLETTER_FROM_EMAIL||process.env.RESEND_FROM_EMAIL||process.env.EMAIL_FROM;if(!key||!from)return false;
  const site=String(process.env.PUBLIC_SITE_URL||process.env.VITE_PUBLIC_SITE_URL||'https://luxurytimeforge.vercel.app').replace(/\/$/,'');
  const store=process.env.NEWSLETTER_STORE_NAME||'Luxury TimeForge';
  const href=`${site}/products/${encodeURIComponent(product.handle||alert.productHandle||'')}`;
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[alert.email],subject:`Giá đã giảm · ${product.title||alert.productTitle}`,html:`<div style="font-family:Arial,sans-serif;line-height:1.65;color:#1d2b23;max-width:620px;margin:auto"><p style="font-size:12px;letter-spacing:.12em;color:#8a6a27">${escapeHtml(store).toUpperCase()}</p><h2 style="margin:0 0 12px">Mẫu bạn theo dõi đã chạm mức giá mong muốn</h2><p><strong>${escapeHtml(product.title||alert.productTitle)}</strong> hiện có giá <strong>${money(currentPrice)}</strong>, thấp hơn hoặc bằng mức theo dõi ${money(alert.targetPrice)}.</p><p><a href="${escapeHtml(href)}" style="display:inline-block;padding:11px 18px;background:#173f2a;color:#fff;text-decoration:none;border-radius:6px">Xem sản phẩm</a></p><p style="font-size:12px;color:#68736d">Giá và tồn kho có thể thay đổi theo thời điểm truy cập.</p></div>`,reply_to:process.env.NEWSLETTER_REPLY_TO||undefined})});
  return response.ok;
}
function currentPriceFor(alert,product){const variants=Array.isArray(product?.variants)?product.variants:[];const variant=variants.find(item=>String(item?.id||'')===String(alert.variantId||''));return Number(variant?.price??product?.price??0)||0}
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({message:'Method not allowed'});
  const sku=String(req.body?.sku||'').trim();if(!sku||/[.#$\[\]\/]/.test(sku))return res.status(400).json({message:'SKU không hợp lệ.'});
  try{
    const product=await dbRead(`timeforge/products/${encodeURIComponent(sku)}`);if(!product?.id)return res.status(404).json({message:'Không tìm thấy sản phẩm.'});
    const query=`orderBy=${encodeURIComponent('"productId"')}&equalTo=${encodeURIComponent(JSON.stringify(String(product.id)))}`;
    const alerts=await dbRead('timeforge/priceAlerts',query)||{};let eligible=0,sent=0;
    for(const [id,alert] of Object.entries(alerts)){
      if(!alert||alert.status!=='waiting'||!alert.email)continue;const currentPrice=currentPriceFor(alert,product);if(currentPrice<=0||currentPrice>Number(alert.targetPrice||0))continue;eligible++;
      const delivered=await sendPriceAlert(alert,product,currentPrice).catch(()=>false);if(!delivered)continue;
      const now=new Date().toISOString();await dbPatch(`timeforge/priceAlerts/${encodeURIComponent(id)}`,{status:'notified',notifiedAt:now,notifiedPrice:currentPrice,updatedAt:now});sent++;
    }
    return res.status(200).json({ok:true,eligible,sent,emailConfigured:Boolean(process.env.RESEND_API_KEY&&(process.env.NEWSLETTER_FROM_EMAIL||process.env.RESEND_FROM_EMAIL||process.env.EMAIL_FROM))});
  }catch(error){return res.status(error?.status||500).json({message:error instanceof Error?error.message:'Price alert processing failed'})}
}
