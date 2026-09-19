import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import('file:///tmp/timeforge-qa/node_modules/playwright/index.mjs');
const base='http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
await mkdir('qa-screenshots',{recursive:true});
const failures=[];
const sizes=[360,390,768,1024,1440];
const sampleOrder={
 id:'qa-order',number:'TF-QA-2026',createdAt:'2026-09-16T10:00:00.000Z',
 status:'confirmed',paymentStatus:'pending',fulfillmentStatus:'processing',paymentMethod:'COD',
 customerName:'Khách hàng mẫu',total:13221000,trackingNumber:'',shippingCarrier:'',
 lines:[
  {id:'qa-1',title:'Đồng hồ nữ Bellini',sku:'GW0022L3',quantity:1,unitPrice:3339000,lineTotal:3339000,image:'/favicon.svg',variantTitle:'Default Title'},
  {id:'qa-2',title:'Đồng hồ nữ Edition Three Small',sku:'AOFH22507',quantity:1,unitPrice:4941000,lineTotal:4941000,image:'/favicon.svg',variantTitle:'Default Title'},
  {id:'qa-3',title:'Đồng hồ nữ Edition Three Small',sku:'AOFH22508',quantity:1,unitPrice:4941000,lineTotal:4941000,image:'/favicon.svg',variantTitle:'Default Title'}
 ]};
function assert(ok,message){if(!ok)failures.push(message)}
async function overflow(page,where,width){
 const data=await page.evaluate(()=>({
  viewport:document.documentElement.clientWidth,
  document:document.documentElement.scrollWidth,
  body:document.body.scrollWidth
 }));
 assert(data.document<=data.viewport+3,where+' '+width+'px: horizontal overflow '+JSON.stringify(data));
}
function luminance(rgb){
 const values=(rgb.match(/[\d.]+/g)||[]).slice(0,3).map(Number).map(n=>{
  const s=n/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;
 });return .2126*values[0]+.7152*values[1]+.0722*values[2];
}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
for(const width of sizes){
 const context=await browser.newContext({viewport:{width,height:880},deviceScaleFactor:1});
 const page=await context.newPage();
 const crashes=[];page.on('pageerror',err=>crashes.push(err.message));
 await context.addInitScript(()=>{
  const cust={id:'qa-member',name:'Khách hàng mẫu',email:'qa@example.com',phone:'0900000000',birthDate:'1990-09-02',acceptsMarketing:false,addresses:[],membership:{status:'active'}};
  localStorage.setItem('tf.v12.customer-session',JSON.stringify({customerId:cust.id,signedInAt:new Date().toISOString(),expiresAt:new Date(Date.now()+3600000).toISOString()}));
  localStorage.setItem('tf.v70.member-customer',JSON.stringify(cust));
 });
 await page.goto(base+'/member',{waitUntil:'domcontentloaded'});
 try{await page.locator('.tf704-member-toolbar').waitFor({timeout:15000})}catch{failures.push('member '+width+'px: page did not load '+await page.title());await context.close();continue}
 await page.locator('#the-le-thanh-vien summary').click();
 await page.screenshot({path:'qa-screenshots/member-'+width+'.png',fullPage:true});
 await overflow(page,'member',width);
 const styles=await page.locator('#the-le-thanh-vien summary').evaluate(el=>{
   const b=el.querySelector('b');return{bg:getComputedStyle(el).backgroundColor,fg:getComputedStyle(b).color,weight:getComputedStyle(b).fontWeight};
 });
 assert(contrast(styles.fg,styles.bg)>=4.5,'member '+width+'px: low rule heading contrast '+JSON.stringify(styles));
 assert(Number(styles.weight)%100===0,'member '+width+'px: nonstandard font weight '+styles.weight);
 const heroParagraph=await page.locator('.tf690-member-hero .v524-account-hero-copy>p').evaluate(el=>({color:getComputedStyle(el).color,text:el.textContent?.trim()}));
 assert(contrast(heroParagraph.color,'rgb(255, 255, 255)')>=4.5,'member '+width+'px: welcome copy has low contrast on pale background '+JSON.stringify(heroParagraph));

 const buttons=await page.evaluate(()=>{const a=document.querySelector('.v524-account-shop-link'),b=document.querySelector('.v524-account-logout');if(!a||!b)return null;const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return{x:[x.left,x.right],y:[y.left,y.right],overlap:x.right>y.left+1}});
 assert(buttons&&!buttons.overlap,'member '+width+'px: nav actions overlap '+JSON.stringify(buttons));
 await page.locator('.tf708-notification-trigger').click();
 await page.locator('#tf708-notification-dialog').waitFor({timeout:4000});
 const locked=await page.evaluate(()=>({body:document.body.style.position,root:document.documentElement.style.overflow}));
 assert(locked.body==='fixed'&&locked.root==='hidden','member '+width+'px: background not scroll locked '+JSON.stringify(locked));
 await page.screenshot({path:'qa-screenshots/notification-'+width+'.png'});
 await page.locator('.tf708-notification-close').click();
 const unlocked=await page.evaluate(()=>({body:document.body.style.position,root:document.documentElement.style.overflow}));
 assert(unlocked.body!=='fixed'&&unlocked.root!=='hidden','member '+width+'px: scroll not restored '+JSON.stringify(unlocked));
 assert(crashes.length===0,'member '+width+'px: JS errors '+crashes.join(' | '));
 await context.close();

 const auth=await browser.newContext({viewport:{width,height:880}});
 const login=await auth.newPage();const authErrors=[];login.on('pageerror',err=>authErrors.push(err.message));
 await login.goto(base+'/member/login',{waitUntil:'domcontentloaded'});
 try{await login.locator('.tf700-auth-card').waitFor({timeout:15000})}catch{failures.push('login '+width+'px: card missing');await auth.close();continue}
 await login.getByRole('button',{name:'Đăng ký thành viên'}).click();
 await login.screenshot({path:'qa-screenshots/login-register-'+width+'.png',fullPage:true});
 await overflow(login,'register',width);
 const terms=await login.evaluate(()=>{const label=document.querySelector('.tf700-auth-card .tf700-terms'),card=document.querySelector('.tf700-auth-card');if(!label||!card)return null;const a=label.getBoundingClientRect(),b=card.getBoundingClientRect();return{left:a.left,right:a.right,card:[b.left,b.right]}});assert(terms&&terms.left>=terms.card[0]-1&&terms.right<=terms.card[1]+1,'register '+width+'px: consent escapes card '+JSON.stringify(terms));
 assert(authErrors.length===0,'register '+width+'px: JS errors '+authErrors.join(' | '));
 await auth.close();

 const trackContext=await browser.newContext({viewport:{width,height:880}});
 const track=await trackContext.newPage();const trackErrors=[];track.on('pageerror',err=>trackErrors.push(err.message));
 await track.route('**/api/account/request-otp',async route=>{
  let req={};try{req=route.request().postDataJSON()}catch{}
  if(req.action==='track-order')await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({order:sampleOrder})});
  else await route.continue();
 });
 await track.goto(base+'/track-order',{waitUntil:'domcontentloaded'});
 await track.locator('.tf706-track-form input').first().fill('TF-QA-2026');
 await track.locator('.tf706-track-form input').last().fill('0900000000');
 await track.getByRole('button',{name:'Xem tình trạng đơn hàng'}).click();
 try{await track.locator('.tf707-watch-card').first().waitFor({timeout:9000})}catch{failures.push('track '+width+'px: order cards missing');await trackContext.close();continue}
 const count=await track.locator('.tf707-watch-card').count();assert(count===3,'track '+width+'px: expected 3 independent watch cards, got '+count);
 await track.screenshot({path:'qa-screenshots/track-order-'+width+'.png',fullPage:true});
 await overflow(track,'track',width);
 assert(trackErrors.length===0,'track '+width+'px: JS errors '+trackErrors.join(' | '));
 await trackContext.close();
}
await browser.close();
const report={pages:['member','member/login','track-order'],widths:sizes,screenshots:17,failed:failures.length,failures};
await writeFile('qa-screenshots/report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exit(1);
