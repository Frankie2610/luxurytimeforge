import {firebaseClient} from './firebase';
import type {IntegrationSettings, Order} from './types';

export const INTEGRATION_KEY='tf.v13.integration-settings';
export const defaultIntegrationSettings:IntegrationSettings={
  payment:{
    cod:true,
    bankTransfer:true,
    online:true,
    onlineProvider:'payos',
    createEndpoint:import.meta.env.VITE_PAYMENT_CREATE_ENDPOINT||'/api/payments/create',
    bankName:'Vietcombank',
    bankAccountName:'TIMEFORGE COMMERCE',
    bankAccountNumber:'',
  },
  shipping:{
    defaultCarrier:'GHN',
    trackingUrlTemplate:'https://tracking.example.com/{trackingNumber}',
    insured:true,
    freeShippingThreshold:5000000,
  },
  customerAccount:{sessionMinutes:30,requireOrderChallenge:true},
};

export function readIntegrationSettings():IntegrationSettings{
  try{
    const raw=localStorage.getItem(INTEGRATION_KEY);
    if(!raw)return structuredClone(defaultIntegrationSettings);
    const parsed=JSON.parse(raw) as Partial<IntegrationSettings>;
    return {
      payment:{...defaultIntegrationSettings.payment,...parsed.payment},
      shipping:{...defaultIntegrationSettings.shipping,...parsed.shipping},
      customerAccount:{...defaultIntegrationSettings.customerAccount,...parsed.customerAccount},
    };
  }catch{return structuredClone(defaultIntegrationSettings)}
}

export async function loadIntegrationSettings(){
  const local=readIntegrationSettings();
  if(!firebaseClient.enabled)return local;
  try{
    const remote=await firebaseClient.read<IntegrationSettings>('timeforge/settings/integrations');
    if(!remote)return local;
    localStorage.setItem(INTEGRATION_KEY,JSON.stringify(remote));
    return remote;
  }catch{return local}
}

export function saveIntegrationSettings(settings:IntegrationSettings){
  localStorage.setItem(INTEGRATION_KEY,JSON.stringify(settings));
  if(firebaseClient.enabled)void firebaseClient.write('timeforge/settings/integrations',settings);
}

export function buildTrackingUrl(template:string,trackingNumber:string){
  if(!trackingNumber)return '';
  return template.replaceAll('{trackingNumber}',encodeURIComponent(trackingNumber));
}

export async function createOnlinePayment(order:Order):Promise<{checkoutUrl:string;paymentLinkId?:string}> {
  const settings=readIntegrationSettings();
  if(!settings.payment.online)throw new Error('Thanh toán online chưa được bật trong Cài đặt tích hợp.');
  const endpoint=settings.payment.createEndpoint||import.meta.env.VITE_PAYMENT_CREATE_ENDPOINT;
  if(!endpoint)throw new Error('Chưa cấu hình payment create endpoint.');
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:order.id,order})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.checkoutUrl)throw new Error(data.message||'Không thể tạo liên kết thanh toán online.');
  return data;
}
