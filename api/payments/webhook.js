import {findPaymentSessionByOrderCode} from '../../server/firebase-rest.js';
import {getPayOS,savePaymentSession,syncPaymentState} from '../../server/payos.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({message:'Method not allowed'});
  try{
    const data=await getPayOS().webhooks.verify(req.body||{});
    const found=await findPaymentSessionByOrderCode(data.orderCode);
    if(!found)return res.status(200).json({success:true,ignored:true});
    const{session}=found;
    if(Number(data.amount)!==Number(session.amount))return res.status(400).json({message:'Payment amount mismatch'});
    if(session.orderCode&&Number(data.orderCode)!==Number(session.orderCode))return res.status(400).json({message:'Payment code mismatch'});
    if(session.paymentLinkId&&data.paymentLinkId&&String(data.paymentLinkId)!==String(session.paymentLinkId))return res.status(400).json({message:'Payment link mismatch'});
    if(String(data.code)!=='00')return res.status(200).json({success:true,ignored:true});
    const paidAt=data.transactionDateTime||new Date().toISOString();
    const synchronized=await syncPaymentState({orderId:session.orderId,status:'PAID',paymentLinkId:data.paymentLinkId,reference:data.reference,orderCode:data.orderCode,paidAt});
    if(!synchronized.persisted)throw new Error('Order not found for verified webhook');
    await savePaymentSession(session.orderId,{...session,status:'PAID',paymentLinkId:data.paymentLinkId||session.paymentLinkId,reference:data.reference||'',paidAt,updatedAt:new Date().toISOString()});
    return res.status(200).json({success:true});
  }catch(error){
    const message=error instanceof Error?error.message:'Webhook processing failed';
    return res.status(/signature|integrity|webhook/i.test(message)?401:500).json({message});
  }
}
