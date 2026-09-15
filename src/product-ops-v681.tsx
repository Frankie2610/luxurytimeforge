import './product-ops-v681.css';
import {useMemo,useState} from 'react';
import {
  Activity,AlertTriangle,ArrowRight,CheckCircle2,ClipboardCheck,Gauge,PackageSearch,
  RefreshCw,Rocket,RotateCcw,ShieldCheck,ShoppingBag,Workflow,
} from 'lucide-react';
import {useCommerce} from './context';

type UatImpact='Critical'|'High'|'Medium';
type UatItem={id:string;area:string;scenario:string;impact:UatImpact;done:boolean};
type ImprovementStatus='planned'|'doing'|'done';
type Improvement={id:string;area:string;asIs:string;toBe:string;kpi:string;status:ImprovementStatus};
type ReleaseControl={owner:string;candidate:string;rollbackPlan:string;stakeholderReady:boolean;supportReady:boolean;analyticsReady:boolean};

const DEFAULT_UAT:UatItem[]=[
  {id:'checkout-referral',area:'Checkout',scenario:'Referral % và fixed amount được server xác minh lại, không tin giá từ browser.',impact:'Critical',done:false},
  {id:'self-referral',area:'Fraud',scenario:'Self-referral / khách cũ / tín hiệu trùng device-IP-address đi đúng policy Admin.',impact:'Critical',done:false},
  {id:'email-toggle',area:'Fraud',scenario:'Tắt email anti-fraud thì email không ảnh hưởng score hoặc eligibility.',impact:'High',done:false},
  {id:'reward-lifecycle',area:'CRM',scenario:'Reward chỉ qualified sau trigger; refund/return có thể revoke.',impact:'High',done:false},
  {id:'release-mobile',area:'UX',scenario:'Admin, referral landing và checkout dùng tốt ở 360px / tablet.',impact:'Medium',done:false},
];

const DEFAULT_IMPROVEMENTS:Improvement[]=[
  {id:'fraud-review',area:'Referral fraud',asIs:'Review thủ công dựa trên từng trường hợp, khó ưu tiên.',toBe:'Fraud score + queue theo business impact, chỉ chuyển case bất thường cho người vận hành.',kpi:'Giảm thời gian review / case',status:'doing'},
  {id:'reward-control',area:'Reward lifecycle',asIs:'Thưởng ngay sau payment dễ bị abuse/refund.',toBe:'Pending → qualified theo trigger → revoke khi refund/return.',kpi:'Reward leakage / referred revenue',status:'doing'},
  {id:'release-process',area:'Release management',asIs:'QA theo từng màn hình, chưa có release gate tập trung.',toBe:'UAT checklist + blocker + rollback/support readiness trước khi release.',kpi:'Regression sau release',status:'planned'},
];

const UAT_KEY='tf.v681.productOps.uat';
const IMPROVEMENT_KEY='tf.v681.productOps.improvements';
const RELEASE_KEY='tf.v681.productOps.release';
const DEFAULT_RELEASE:ReleaseControl={owner:'Product Ops',candidate:'V0.68.1',rollbackPlan:'Revert release commit và giữ referral config hiện tại.',stakeholderReady:false,supportReady:false,analyticsReady:false};

function readJson<T>(key:string,fallback:T):T{
  if(typeof window==='undefined')return fallback;
  try{const value=JSON.parse(window.localStorage.getItem(key)||'null');return value??fallback}catch{return fallback}
}
function saveJson(key:string,value:unknown){try{window.localStorage.setItem(key,JSON.stringify(value))}catch{/* Local persistence is a convenience, not a release blocker. */}}
function ageHours(date:string){return Math.max(0,(Date.now()-new Date(date).getTime())/3600000)}
function money(value:number){return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(value||0)}
function nextImprovementStatus(status:ImprovementStatus):ImprovementStatus{return status==='planned'?'doing':status==='doing'?'done':'planned'}

export function ProductOpsCenterV681(){
  const{orders,products}=useCommerce();
  const[uat,setUat]=useState<UatItem[]>(()=>readJson(UAT_KEY,DEFAULT_UAT));
  const[improvements,setImprovements]=useState<Improvement[]>(()=>readJson(IMPROVEMENT_KEY,DEFAULT_IMPROVEMENTS));
  const[release,setRelease]=useState<ReleaseControl>(()=>readJson(RELEASE_KEY,DEFAULT_RELEASE));

  const ops=useMemo(()=>{
    const paymentExceptions=orders.filter(o=>o.paymentStatus!=='paid'&&ageHours(o.createdAt)>24);
    const fulfillmentBacklog=orders.filter(o=>o.paymentStatus==='paid'&&o.fulfillmentStatus!=='fulfilled'&&ageHours(o.createdAt)>48);
    const referralReview=orders.filter(o=>o.referralRewardStatus==='review'||o.referralRewardStatus==='blocked');
    const lowStock=products.filter(p=>p.trackInventory&&p.inventory<=3);
    const revenueAtRisk=[...paymentExceptions,...fulfillmentBacklog].reduce((sum,o)=>sum+Number(o.total||0),0);
    const queue=[
      {id:'payment',label:'Payment exception >24h',count:paymentExceptions.length,impact:'Revenue',severity:paymentExceptions.length?'P1':'Healthy',hint:'Đơn chưa paid quá SLA 24h',action:'Kiểm tra phương thức thanh toán / liên hệ khách'},
      {id:'fulfillment',label:'Fulfillment backlog >48h',count:fulfillmentBacklog.length,impact:'Customer experience',severity:fulfillmentBacklog.length?'P1':'Healthy',hint:'Đơn đã paid nhưng chưa fulfilled',action:'Ưu tiên kho / vận chuyển theo tuổi đơn'},
      {id:'referral',label:'Referral cần review',count:referralReview.length,impact:'Margin & fraud',severity:referralReview.length?'P2':'Healthy',hint:'Risk score cần người duyệt',action:'Review signal trước khi issue reward'},
      {id:'stock',label:'SKU tồn kho ≤ 3',count:lowStock.length,impact:'Conversion',severity:lowStock.length?'P2':'Healthy',hint:'Nguy cơ out-of-stock',action:'Ưu tiên replenishment / ẩn campaign'},
    ] as const;
    return{paymentExceptions,fulfillmentBacklog,referralReview,lowStock,revenueAtRisk,queue};
  },[orders,products]);

  const done=uat.filter(x=>x.done).length;
  const readiness=Math.round(done/uat.length*100);
  const criticalUatOpen=uat.filter(x=>x.impact==='Critical'&&!x.done).length;
  const highOpsBlockers=ops.queue.filter(x=>x.severity==='P1'&&x.count>0).length;
  const governanceOpen=[release.stakeholderReady,release.supportReady,release.analyticsReady].filter(x=>!x).length;
  const releaseBlocked=criticalUatOpen>0||governanceOpen>0;
  const releaseHealth=releaseBlocked?'BLOCKED':highOpsBlockers?'RISK ACCEPTANCE':'READY';

  const toggleUat=(id:string)=>setUat(current=>{const next=current.map(x=>x.id===id?{...x,done:!x.done}:x);saveJson(UAT_KEY,next);return next});
  const updateRelease=<K extends keyof ReleaseControl,>(key:K,value:ReleaseControl[K])=>setRelease(current=>{const next={...current,[key]:value};saveJson(RELEASE_KEY,next);return next});
  const advanceImprovement=(id:string)=>setImprovements(current=>{const next=current.map(item=>item.id!==id?item:{...item,status:nextImprovementStatus(item.status)});saveJson(IMPROVEMENT_KEY,next);return next});

  return <div className="po681">
    <section className="po681-hero">
      <div className="po681-hero-copy"><span className="po681-kicker">PRODUCT OPERATIONS · BPM / AI TRANSFORMATION</span><h2>Operations & Release Center</h2><p>Biến dữ liệu vận hành thành thứ tự ưu tiên, UAT, release gate và cải tiến quy trình — cùng một nơi để Business, Ops và Product nói chung một ngôn ngữ.</p></div>
      <div className={`po681-decision ${releaseBlocked?'is-blocked':highOpsBlockers?'is-risk':'is-ready'}`}><Rocket/><div><small>Release decision</small><b>{releaseHealth}</b><span>{criticalUatOpen} critical UAT · {governanceOpen} governance blocker</span></div></div>
    </section>

    <section className="po681-kpis">
      <article><ShoppingBag/><div><small>Revenue at risk</small><b>{money(ops.revenueAtRisk)}</b><span>{ops.paymentExceptions.length} payment exception</span></div></article>
      <article><PackageSearch/><div><small>Fulfillment SLA</small><b>{ops.fulfillmentBacklog.length}</b><span>đơn quá 48h</span></div></article>
      <article><ShieldCheck/><div><small>Referral review</small><b>{ops.referralReview.length}</b><span>case fraud / reward</span></div></article>
      <article><Gauge/><div><small>Release readiness</small><b>{readiness}%</b><span>{done}/{uat.length} UAT passed</span></div></article>
    </section>

    <div className="po681-grid">
      <section className="po681-card">
        <header><div><span className="po681-kicker">BUSINESS IMPACT TRIAGE</span><h3>Exception queue</h3></div><RefreshCw/></header>
        <p className="po681-copy">Không xếp issue theo “ai báo trước”, mà theo ảnh hưởng doanh thu, trải nghiệm khách và margin. Queue được tính từ order/product state hiện tại.</p>
        <div className="po681-queue">{ops.queue.map(item=><article key={item.id}>
          <span className={`po681-priority is-${item.severity.toLowerCase()}`}>{item.severity==='Healthy'?<CheckCircle2/>:<AlertTriangle/>}{item.severity}</span>
          <div className="po681-queue-main"><b>{item.label}</b><small>{item.impact} · {item.hint}</small><em>{item.action}</em></div>
          <strong>{item.count}</strong>
        </article>)}</div>
      </section>

      <section className="po681-card">
        <header><div><span className="po681-kicker">UAT & QUALITY GATE</span><h3>Release readiness</h3></div><ClipboardCheck/></header>
        <div className="po681-progress"><i style={{width:`${readiness}%`}}/></div>
        <div className="po681-uat">{uat.map(item=><label key={item.id}>
          <input type="checkbox" checked={item.done} onChange={()=>toggleUat(item.id)}/>
          <span><b>{item.area}<em className={`impact-${item.impact.toLowerCase()}`}>{item.impact}</em></b><small>{item.scenario}</small></span>
        </label>)}</div>
      </section>
    </div>

    <div className="po681-grid po681-grid-bottom">
      <section className="po681-card">
        <header><div><span className="po681-kicker">CHANGE MANAGEMENT</span><h3>Release control</h3></div><RotateCcw/></header>
        <div className="po681-form-grid">
          <label><span>Release candidate</span><input value={release.candidate} onChange={e=>updateRelease('candidate',e.target.value)} placeholder="V0.68.1"/></label>
          <label><span>Owner</span><input value={release.owner} onChange={e=>updateRelease('owner',e.target.value)} placeholder="Product Ops"/></label>
          <label className="po681-full"><span>Rollback plan</span><textarea value={release.rollbackPlan} onChange={e=>updateRelease('rollbackPlan',e.target.value)} rows={3}/></label>
        </div>
        <div className="po681-governance">
          <label><input type="checkbox" checked={release.stakeholderReady} onChange={e=>updateRelease('stakeholderReady',e.target.checked)}/><span><b>Business sign-off</b><small>Stakeholder hiểu thay đổi và impact</small></span></label>
          <label><input type="checkbox" checked={release.supportReady} onChange={e=>updateRelease('supportReady',e.target.checked)}/><span><b>Support readiness</b><small>Runbook / cách xử lý exception đã sẵn sàng</small></span></label>
          <label><input type="checkbox" checked={release.analyticsReady} onChange={e=>updateRelease('analyticsReady',e.target.checked)}/><span><b>Measurement plan</b><small>KPI sau release đã xác định</small></span></label>
        </div>
      </section>

      <section className="po681-card">
        <header><div><span className="po681-kicker">AS-IS → TO-BE</span><h3>Process improvement board</h3></div><Workflow/></header>
        <p className="po681-copy">Mỗi cải tiến phải chỉ ra vấn đề hiện tại, trạng thái mong muốn và KPI đo được — đúng kiểu process discovery → redesign → adoption.</p>
        <div className="po681-improvements">{improvements.map(item=><article key={item.id}>
          <div className="po681-improvement-head"><b>{item.area}</b><button type="button" className={`status-${item.status}`} onClick={()=>advanceImprovement(item.id)}>{item.status==='planned'?'Planned':item.status==='doing'?'In progress':'Measured'}<ArrowRight/></button></div>
          <div className="po681-as-to"><div><small>AS-IS</small><p>{item.asIs}</p></div><ArrowRight/><div><small>TO-BE</small><p>{item.toBe}</p></div></div>
          <footer><Activity/><span>KPI: {item.kpi}</span></footer>
        </article>)}</div>
      </section>
    </div>

    <section className="po681-flow" aria-label="Product Operations lifecycle">
      <div><b>Discover</b><small>Exception & process pain</small></div><ArrowRight/><div><b>Prioritize</b><small>Business impact</small></div><ArrowRight/><div><b>Design</b><small>As-is → To-be</small></div><ArrowRight/><div><b>UAT</b><small>Edge cases & blockers</small></div><ArrowRight/><div><b>Release</b><small>Sign-off & rollback</small></div><ArrowRight/><div><b>Measure</b><small>KPI & adoption</small></div>
    </section>
  </div>
}
