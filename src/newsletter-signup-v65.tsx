import {useState,type ButtonHTMLAttributes,type FormEvent} from 'react';
import {ArrowRight,CheckCircle2,LoaderCircle,Mail,TriangleAlert} from 'lucide-react';
import {useNewsletterActions} from './context';

type Status='idle'|'success'|'info'|'error';
type NewsletterResult='created'|'exists'|'reactivated'|'invalid';
type ThemeButtonProps=ButtonHTMLAttributes<HTMLButtonElement>&{'data-theme-block-id'?:string;'data-theme-block-label'?:string};
type Props={source:string;className?:string;actionLabel?:string;onSuccess?:()=>void;buttonProps?:ThemeButtonProps};

async function serverSubscribe(email:string,source:string):Promise<{result:NewsletterResult;emailSent?:boolean}|null>{
  try{
    const response=await fetch('/api/newsletter/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,source})});
    const type=response.headers.get('content-type')||'';
    if(!type.includes('application/json'))return null;
    const payload=await response.json() as {result?:NewsletterResult;message?:string;emailSent?:boolean};
    if(response.status===404||response.status===501)return null;
    if(!response.ok)throw new Error(payload.message||'Không thể đăng ký nhận tin.');
    if(!payload.result)throw new Error('Phản hồi đăng ký không hợp lệ.');
    return{result:payload.result,emailSent:payload.emailSent};
  }catch(error){
    if(error instanceof TypeError)return null;
    throw error;
  }
}

export function NewsletterSignupV65({source,className='',actionLabel='Đăng ký',onSuccess,buttonProps}:Props){
  const{subscribeNewsletter}=useNewsletterActions();
  const[email,setEmail]=useState('');
  const[busy,setBusy]=useState(false);
  const[status,setStatus]=useState<Status>('idle');
  const[message,setMessage]=useState('');
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(busy)return;
    const normalized=email.trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)){setStatus('error');setMessage('Email chưa đúng định dạng.');return}
    setBusy(true);setStatus('idle');setMessage('');
    try{
      const server=await serverSubscribe(normalized,source);
      const result=server?.result??await subscribeNewsletter(normalized,source);
      if(result==='invalid'){setStatus('error');setMessage('Email chưa đúng định dạng.');return}
      if(result==='exists'){setStatus('info');setMessage('Email này đã có trong danh sách nhận tin.');onSuccess?.();return}
      const sent=server?.emailSent===true;
      setStatus('success');
      setMessage(result==='reactivated'?'Đã kích hoạt lại đăng ký nhận tin.':sent?'Đăng ký thành công. Email xác nhận đã được gửi.':'Đăng ký nhận tin thành công.');
      setEmail('');onSuccess?.();
    }catch(error){
      setStatus('error');setMessage(error instanceof Error?error.message:'Chưa thể đăng ký. Vui lòng thử lại.');
    }finally{setBusy(false)}
  };
  return <div className={`tf65-newsletter-wrap ${className}`.trim()}>
    <form className="tf65-newsletter-form" onSubmit={submit} noValidate>
      <label className="tf-newsletter-field-v4910"><Mail aria-hidden="true"/><span className="sr-only">Địa chỉ email</span><input type="email" required value={email} onChange={event=>{setEmail(event.target.value);if(status!=='idle'){setStatus('idle');setMessage('')}}} placeholder="Địa chỉ email" autoComplete="email" aria-invalid={status==='error'||undefined}/></label>
      <button {...buttonProps} type="submit" disabled={busy||!email.trim()}><span>{busy?'Đang gửi...':actionLabel}</span>{busy?<LoaderCircle className="tf65-newsletter-spinner"/>:<ArrowRight/>}</button>
    </form>
    <div className={`tf65-newsletter-status is-${status}`} aria-live="polite">{status!=='idle'&&<>{status==='success'?<CheckCircle2/>:status==='error'?<TriangleAlert/>:<Mail/>}<span>{message}</span></>}</div>
  </div>;
}
