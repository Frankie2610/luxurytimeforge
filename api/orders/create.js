import {createVerifiedStorefrontOrder} from '../../server/orders.js';
import {offerConfirmationPreflight} from '../../server/referral-preflight.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({message:'Method not allowed'});
  try{
    const requestContext={ip:String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'').split(',')[0].trim(),userAgent:String(req.headers['user-agent']||'')};
    const preflight=await offerConfirmationPreflight({payload:req.body?.payload,cart:req.body?.cart,requestContext});
    if(preflight.required&&!req.body?.confirmOriginalPrice){
      return res.status(409).json({
        confirmationRequired:true,
        reason:preflight.reason||'Ưu đãi không thể áp dụng cho đơn hàng này.',
        stripDiscount:preflight.stripDiscount,
        stripReferral:preflight.stripReferral,
        message:'Ưu đãi không thể áp dụng. Vui lòng xác nhận nếu bạn muốn tiếp tục thanh toán theo giá ban đầu.',
      });
    }
    const payload={...(req.body?.payload||{})};
    if(preflight.required&&req.body?.confirmOriginalPrice){
      if(preflight.stripDiscount)payload.discountCode='';
      if(preflight.stripReferral){payload.referralCode='';payload.referralDeviceId='';payload.referralEmailVerified=false;}
    }
    const order=await createVerifiedStorefrontOrder({...req.body,payload,requestContext});
    return res.status(201).json({order});
  }catch(error){
    const message=error instanceof Error?error.message:'Không thể tạo đơn hàng.';
    const config=/Firebase server credentials/i.test(message);
    return res.status(config?501:400).json({message:config?'Firebase phía server chưa được cấu hình.':message});
  }
}
