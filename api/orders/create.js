import {createVerifiedStorefrontOrder} from '../../server/orders.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({message:'Method not allowed'});
  try{
    const order=await createVerifiedStorefrontOrder(req.body||{});
    return res.status(201).json({order});
  }catch(error){
    const message=error instanceof Error?error.message:'Không thể tạo đơn hàng.';
    const config=/Firebase server credentials/i.test(message);
    return res.status(config?501:400).json({message:config?'Firebase phía server chưa được cấu hình.':message});
  }
}
