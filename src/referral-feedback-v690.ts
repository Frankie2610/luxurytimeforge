import {toast} from 'sonner';

const ATTRIBUTION_KEY='tf:referral-attribution:v1';
const INSTALL_KEY='__tfReferralFeedbackV690Installed';

type ReferralOrder={
  referralCode?:string;
  referralRewardStatus?:string;
  referralDiscountAmount?:number;
  total?:number;
};
type OrderResponse={order?:ReferralOrder};

declare global{interface Window{__tfReferralFeedbackV690Installed?:boolean}}

export function installReferralFeedbackV690(){
  if(typeof window==='undefined'||window[INSTALL_KEY as keyof Window])return;
  window.__tfReferralFeedbackV690Installed=true;
  const originalFetch=window.fetch.bind(window);
  window.fetch=async(...args)=>{
    const response=await originalFetch(...args);
    try{
      const input=args[0];
      const url=typeof input==='string'?input:input instanceof URL?input.toString():input.url;
      if(!/\/api\/orders\/create(?:\?|$)/.test(url))return response;
      const data=await response.clone().json() as OrderResponse;
      const order=data?.order;
      if(order?.referralCode&&order.referralRewardStatus==='blocked'){
        try{localStorage.removeItem(ATTRIBUTION_KEY)}catch{}
        toast.warning('Ưu đãi giới thiệu không áp dụng',{
          description:'Hệ thống không thể áp dụng ưu đãi cho đơn hàng này. Tổng thanh toán đã được tính lại theo giá ban đầu.',
          duration:9000,
        });
      }
    }catch{}
    return response;
  };
}

installReferralFeedbackV690();
