import {getPayOS,mapPayOSStatus,readPaymentSession,safeOrderId,savePaymentSession,syncPaymentState,tokenMatches} from '../../server/payos.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  if(req.method!=='GET')return res.status(405).json({message:'Method not allowed'});
  try{
    const orderId=safeOrderId(req.query?.orderId);
    const session=await readPaymentSession(orderId);
    if(!session||!tokenMatches(req.query?.token,session.returnToken))return res.status(404).json({message:'Không tìm thấy phiên thanh toán.'});
    const payment=await getPayOS().paymentRequests.get(Number(session.orderCode));
    const paymentStatus=mapPayOSStatus(payment.status);
    await savePaymentSession(orderId,{...session,status:payment.status,paymentLinkId:payment.id||session.paymentLinkId,updatedAt:new Date().toISOString()});
    if(paymentStatus!=='pending'||payment.status==='CANCELLED')await syncPaymentState({orderId,status:payment.status,paymentLinkId:payment.id,reference:payment.transactions?.[0]?.reference,orderCode:payment.orderCode,paidAt:payment.transactions?.[0]?.transactionDateTime});
    return res.status(200).json({orderId,orderNumber:session.orderNumber,orderCode:session.orderCode,amount:session.amount,status:payment.status,paymentStatus});
  }catch(error){
    const message=error instanceof Error?error.message:'Không thể xác minh thanh toán.';
    return res.status(/Invalid order|phiên thanh toán/i.test(message)?400:502).json({message});
  }
}
