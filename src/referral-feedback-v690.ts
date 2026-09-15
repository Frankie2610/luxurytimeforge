const ATTRIBUTION_KEY='tf:referral-attribution:v1';

type ConfirmationResponse={
  confirmationRequired?:boolean;
  reason?:string;
  message?:string;
  stripDiscount?:boolean;
  stripReferral?:boolean;
};

declare global{interface Window{__tfReferralFeedbackV690Installed?:boolean}}

function cancelledResponse(){
  return new Response(JSON.stringify({message:'Bạn đã dừng thanh toán vì ưu đãi không thể áp dụng. Đơn hàng chưa được tạo.'}),{
    status:409,
    headers:{'Content-Type':'application/json','Cache-Control':'no-store'},
  });
}

export function installReferralFeedbackV690(){
  if(typeof window==='undefined'||window.__tfReferralFeedbackV690Installed)return;
  window.__tfReferralFeedbackV690Installed=true;
  const originalFetch=window.fetch.bind(window);
  window.fetch=async(...args)=>{
    const response=await originalFetch(...args);
    try{
      const input=args[0];
      const url=typeof input==='string'?input:input instanceof URL?input.toString():input.url;
      if(!/\/api\/orders\/create(?:\?|$)/.test(url))return response;
      const data=await response.clone().json() as ConfirmationResponse;
      if(response.status!==409||!data.confirmationRequired)return response;
      const reason=String(data.reason||'Ưu đãi không thể áp dụng cho đơn hàng này.').trim();
      const proceed=window.confirm(`${reason}\n\nBạn có muốn tiếp tục thanh toán với giá ban đầu không?`);
      if(!proceed)return cancelledResponse();
      const init=args[1];
      if(!init||typeof init.body!=='string')return response;
      const body=JSON.parse(init.body) as Record<string,unknown>;
      body.confirmOriginalPrice=true;
      if(data.stripReferral){try{localStorage.removeItem(ATTRIBUTION_KEY)}catch{}}
      return originalFetch(input,{...init,body:JSON.stringify(body)});
    }catch{
      return response;
    }
  };
}

installReferralFeedbackV690();
