import './referral-v68.css';
import {useEffect,useState} from 'react';
import {ArrowRight,Gift,ShieldCheck} from 'lucide-react';
import {Link,useParams} from 'react-router-dom';
import {captureReferral,loadReferralSettings,type ReferralSettings} from './referral-v68';
import {money} from './utils';
export function ReferralLandingV68(){const{code=''}=useParams();const[settings,setSettings]=useState<ReferralSettings|null>(null);useEffect(()=>{void loadReferralSettings().then(value=>{setSettings(value);captureReferral(code,value)})},[code]);const benefit=settings?(settings.friendRewardType==='percentage'?`${settings.friendRewardValue}%`:money(settings.friendRewardValue)):'ưu đãi';return <main className="rf68-landing"><section><div className="rf68-gift"><Gift/></div><small>LUXURY TIMEFORGE · MEMBER REFERRAL</small><h1>Một lời giới thiệu, một ưu đãi dành cho lần mua đầu tiên.</h1><p>Mã <b>{code.toUpperCase()}</b> đã được ghi nhận trên thiết bị này. Khi đơn đáp ứng điều kiện chương trình, ưu đãi <strong>{benefit}</strong> sẽ được tính tự động ở checkout.</p><div className="rf68-landing-actions"><Link to="/collections">Khám phá đồng hồ<ArrowRight/></Link><Link to="/">Về trang chủ</Link></div><aside><ShieldCheck/><span><b>Referral Protection</b><small>TimeForge kiểm tra điều kiện trên server và không công khai dữ liệu của người giới thiệu.</small></span></aside></section></main>}
