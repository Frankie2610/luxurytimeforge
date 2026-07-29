import type {Order} from './types';
import {createOnlinePayment} from './integrations';

export type PaymentAdapterResult={status:'redirect'|'pending';checkoutUrl?:string;providerReference?:string;qrCode?:string};

export async function startPayment(order:Order):Promise<PaymentAdapterResult>{
  if(!['payos','online'].includes(order.paymentMethod))return{status:'pending'};
  const result=await createOnlinePayment(order);
  return{status:'redirect',checkoutUrl:result.checkoutUrl,providerReference:result.paymentLinkId,qrCode:result.qrCode};
}
