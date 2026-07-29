import {firebaseClient} from './firebase';
import type {BankAccount, CheckoutPayload, IntegrationSettings, Order} from './types';

export const INTEGRATION_KEY='tf.v15.integration-settings';

const defaultBankAccount:BankAccount={
  id:'bank_vcb_default',
  bankName:'Vietcombank',
  accountName:'TIMEFORGE COMMERCE',
  accountNumber:'',
  branch:'',
  note:'',
  enabled:true,
  priority:1,
};

export const defaultIntegrationSettings:IntegrationSettings={
  payment:{
    cod:true,
    bankTransfer:true,
    online:false,
    onlineProvider:'payos',
    createEndpoint:import.meta.env.VITE_PAYMENT_CREATE_ENDPOINT||'/api/payments/create',
    bankName:defaultBankAccount.bankName,
    bankAccountName:defaultBankAccount.accountName,
    bankAccountNumber:defaultBankAccount.accountNumber,
    bankAccounts:[defaultBankAccount],
    preferredBankAccountId:defaultBankAccount.id,
    bankTransferDiscount:{enabled:false,type:'percentage',value:0,minimumSubtotal:0},
  },
  shipping:{
    defaultCarrier:'GHN',
    trackingUrlTemplate:'https://tracking.example.com/{trackingNumber}',
    insured:true,
    freeShippingThreshold:5000000,
  },
  customerAccount:{sessionMinutes:30,requireOrderChallenge:true},
};

function cleanBankAccounts(payment:Partial<IntegrationSettings['payment']>|undefined):BankAccount[]{
  const list=Array.isArray(payment?.bankAccounts)?payment!.bankAccounts:[];
  const migrated=list.length?list:[{
    ...defaultBankAccount,
    bankName:String(payment?.bankName||defaultBankAccount.bankName),
    accountName:String(payment?.bankAccountName||defaultBankAccount.accountName),
    accountNumber:String(payment?.bankAccountNumber||''),
  }];
  return migrated.map((item,index)=>({
    id:String(item.id||`bank_${index+1}`),
    bankName:String(item.bankName||'').trim(),
    accountName:String(item.accountName||'').trim(),
    accountNumber:String(item.accountNumber||'').trim(),
    branch:String(item.branch||'').trim(),
    note:String(item.note||'').trim(),
    enabled:item.enabled!==false,
    priority:Number.isFinite(Number(item.priority))?Number(item.priority):index+1,
  }));
}

export function normalizeIntegrationSettings(input:Partial<IntegrationSettings>|null|undefined):IntegrationSettings{
  const payment={...defaultIntegrationSettings.payment,...(input?.payment||{})};
  const bankAccounts=cleanBankAccounts(input?.payment);
  const preferredCandidate=String(input?.payment?.preferredBankAccountId||'');
  const preferred=bankAccounts.find(item=>item.id===preferredCandidate&&item.enabled)
    ||bankAccounts.filter(item=>item.enabled).sort((a,b)=>a.priority-b.priority)[0]
    ||bankAccounts[0]
    ||defaultBankAccount;
  return {
    payment:{
      ...payment,
      bankName:preferred.bankName,
      bankAccountName:preferred.accountName,
      bankAccountNumber:preferred.accountNumber,
      bankAccounts,
      preferredBankAccountId:preferred.id,
      bankTransferDiscount:{
        ...defaultIntegrationSettings.payment.bankTransferDiscount,
        ...(input?.payment?.bankTransferDiscount||{}),
        value:Math.max(0,Number(input?.payment?.bankTransferDiscount?.value||0)),
        minimumSubtotal:Math.max(0,Number(input?.payment?.bankTransferDiscount?.minimumSubtotal||0)),
      },
    },
    shipping:{...defaultIntegrationSettings.shipping,...(input?.shipping||{})},
    customerAccount:{...defaultIntegrationSettings.customerAccount,...(input?.customerAccount||{})},
  };
}

export function readIntegrationSettings():IntegrationSettings{
  try{
    const raw=localStorage.getItem(INTEGRATION_KEY)||localStorage.getItem('tf.v13.integration-settings');
    return normalizeIntegrationSettings(raw?JSON.parse(raw) as Partial<IntegrationSettings>:null);
  }catch{return structuredClone(defaultIntegrationSettings)}
}

export async function loadIntegrationSettings(){
  const local=readIntegrationSettings();
  if(!firebaseClient.enabled)return local;
  try{
    const remote=await firebaseClient.read<IntegrationSettings>('timeforge/settings/integrations');
    const normalized=normalizeIntegrationSettings(remote||local);
    localStorage.setItem(INTEGRATION_KEY,JSON.stringify(normalized));
    return normalized;
  }catch{return local}
}

export async function saveIntegrationSettings(settings:IntegrationSettings){
  const normalized=normalizeIntegrationSettings(settings);
  localStorage.setItem(INTEGRATION_KEY,JSON.stringify(normalized));
  if(firebaseClient.enabled)await firebaseClient.write('timeforge/settings/integrations',normalized);
  return normalized;
}

export function preferredBankAccount(settings=readIntegrationSettings()){
  return settings.payment.bankAccounts.find(item=>item.id===settings.payment.preferredBankAccountId&&item.enabled)
    ||settings.payment.bankAccounts.filter(item=>item.enabled).sort((a,b)=>a.priority-b.priority)[0]
    ||null;
}

export function bankTransferDiscount(settings:IntegrationSettings,subtotal:number){
  const config=settings.payment.bankTransferDiscount;
  if(!config.enabled||subtotal<Math.max(0,config.minimumSubtotal)||config.value<=0)return{amount:0,label:''};
  const amount=config.type==='percentage'
    ?Math.min(subtotal,Math.round(subtotal*Math.min(100,config.value)/100))
    :Math.min(subtotal,Math.round(config.value));
  const label=config.type==='percentage'?`Ưu đãi chuyển khoản ${config.value}%`:`Ưu đãi chuyển khoản ${amount.toLocaleString('vi-VN')}đ`;
  return{amount,label};
}

export function buildTrackingUrl(template:string,trackingNumber:string){
  if(!trackingNumber)return '';
  return template.replaceAll('{trackingNumber}',encodeURIComponent(trackingNumber));
}

export async function createStorefrontOrder(payload:CheckoutPayload,cart:Array<{productId:string;variantId:string;quantity:number}>,requestId:string):Promise<Order>{
  const response=await fetch('/api/orders/create',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({payload,cart,requestId}),
  });
  const data=await response.json().catch(()=>({})) as {order?:Order;message?:string};
  if(!response.ok||!data.order)throw new Error(data.message||'Không thể ghi nhận đơn hàng.');
  return data.order;
}

export async function createOnlinePayment(order:Order):Promise<{checkoutUrl:string;paymentLinkId?:string;qrCode?:string}> {
  const settings=readIntegrationSettings();
  if(!settings.payment.online)throw new Error('PayOS chưa được bật trong Cài đặt tích hợp.');
  const endpoint=settings.payment.createEndpoint||import.meta.env.VITE_PAYMENT_CREATE_ENDPOINT;
  if(!endpoint)throw new Error('Chưa cấu hình payment create endpoint.');
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:order.id})});
  const data=await response.json().catch(()=>({})) as {checkoutUrl?:string;paymentLinkId?:string;qrCode?:string;message?:string};
  if(!response.ok||!data.checkoutUrl)throw new Error(data.message||'Không thể tạo liên kết thanh toán PayOS.');
  return data as {checkoutUrl:string;paymentLinkId?:string;qrCode?:string};
}
