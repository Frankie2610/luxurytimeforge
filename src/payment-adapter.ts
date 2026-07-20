import type {Order} from './types';
import {createOnlinePayment} from './integrations';

export type PaymentAdapterResult={status:'redirect'|'pending';checkoutUrl?:string;providerReference?:string};

export async function startPayment(order:Order):Promise<PaymentAdapterResult>{
  if(order.paymentMethod!=='online')return{status:'pending'};
  const result=await createOnlinePayment(order);
  return{status:'redirect',checkoutUrl:result.checkoutUrl,providerReference:result.paymentLinkId};
}
