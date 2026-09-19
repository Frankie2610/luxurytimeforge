import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const account=read('src/customer-account-v12.tsx');
const rules=read('firebase.rules.template.json');
const envExample=read('.env.example');
const fomo=read('src/member-fomo-v70.tsx');
const member=read('src/member-v69.ts');
const orderServer=read('server/orders.js');
const integrations=read('src/integrations.ts');
const api=read('api/account/request-otp.js');
assert.match(account,/Guest vẫn checkout và tracking đơn bình thường/);
assert.match(account,/action:'register'/);
assert.match(account,/action:'password-login'/);
assert.match(account,/action:'track-order'/);
assert.match(account,/CLAIM_REQUIRED/);
assert.match(rules,/\"memberAuth\"[\s\S]*?\"\.read\": false[\s\S]*?\"\.write\": false/);
assert.match(rules,/\"memberHolds\"[\s\S]*?\"\.read\": false[\s\S]*?\"\.write\": false/);
assert.match(rules,/\"memberOpportunities\"[\s\S]*?\"\.read\": false[\s\S]*?\"\.write\": false/);
assert.match(envExample,/CUSTOMER_SESSION_SECRET=/);

assert.match(member,/holdMinutes/);
assert.match(member,/opportunityCreditMultiplier/);
assert.match(fomo,/STOCK PRESSURE/);
assert.match(fomo,/PERSONAL HOLD/);
assert.match(fomo,/MEMBER OPPORTUNITY/);
assert.match(fomo,/TIER UNLOCK PURCHASE/);
assert.match(orderServer,/reservedByOthers/);
assert.match(orderServer,/memberOpportunityId/);
assert.match(integrations,/memberSessionToken/);
assert.match(api,/crypto\.scryptSync/);
assert.doesNotMatch(api,/password\s*:/,'API must not store a plaintext password field.');

process.env.FIREBASE_DATABASE_URL='https://example.firebaseio.com';
process.env.FIREBASE_DATABASE_AUTH='test-secret';
process.env.CUSTOMER_SESSION_SECRET='member-secret';
const now=Date.now();
const database={
  'timeforge/orders':{},
  'timeforge/products':{watch:{id:'p1',title:'Watch One',status:'active',published:true,price:1000000,inventory:2,images:[],variants:[{id:'v1',title:'Default',sku:'W1',price:1000000,inventory:2}]}},
  'timeforge/discounts':{},
  'timeforge/settings/integrations':{payment:{cod:true,bankTransfer:false,online:false},shipping:{freeShippingThreshold:5000000}},
  'timeforge/customers':{},
  'timeforge/settings/referral':{enabled:false},
  'timeforge/memberHolds':{h1:{id:'h1',customerId:'memberA',productId:'p1',variantId:'v1',status:'active',expiresAt:now+3600000}},
  'timeforge/memberOpportunities':{o1:{id:'o1',customerId:'memberA',productId:'p1',status:'active',creditMultiplier:2,expiresAt:now+3600000}},
};
const patches=[];
const pathFromUrl=url=>new URL(url).pathname.replace(/^\//,'').replace(/\.json$/,'');
globalThis.fetch=async(url,options={})=>{const method=options.method||'GET';const path=pathFromUrl(url);if(method==='GET')return new Response(JSON.stringify(database[path]??null),{status:200,headers:{'Content-Type':'application/json'}});if(method==='PATCH'&&path===''){const body=JSON.parse(options.body);patches.push(body);return new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}})}return new Response('{}',{status:200,headers:{'Content-Type':'application/json'}})};
const {createVerifiedStorefrontOrder}=await import('../server/orders.js');
const payload={discountCode:'',paymentMethod:'cod',customer:{name:'Guest',email:'g@example.com',phone:'0900000001'},shippingAddress:{fullName:'Guest',phone:'0900000001',email:'g@example.com',address1:'1 Test',address2:'',ward:'Ward',district:'District',city:'HCM',country:'VN',postalCode:''},note:''};
await assert.rejects(()=>createVerifiedStorefrontOrder({payload,requestId:'guest_hold_block_123',cart:[{productId:'p1',variantId:'v1',quantity:2}]}),/chỉ còn 1 chiếc/);
const sign=(value,secret)=>crypto.createHmac('sha256',secret).update(value).digest('base64url');
const sessionPayload=Buffer.from(JSON.stringify({customerId:'memberA',issuedAt:Date.now(),expiresAt:Date.now()+3600000})).toString('base64url');
const token=`${sessionPayload}.${sign(sessionPayload,process.env.CUSTOMER_SESSION_SECRET)}`;
const memberOrder=await createVerifiedStorefrontOrder({payload:{...payload,customer:{...payload.customer,name:'Member A',phone:'0900000002'}},requestId:'member_hold_owner_123',cart:[{productId:'p1',variantId:'v1',quantity:2}],memberSessionToken:token});
assert.equal(memberOrder.memberCreditMultiplier,2);
assert.equal(memberOrder.memberOpportunityId,'o1');
assert.equal(patches.at(-1)['timeforge/memberHolds/h1'],null);
assert.equal(patches.at(-1)['timeforge/memberOpportunities/o1'].status,'used');
console.log('V0.70 Member/FOMO checks PASS (Guest/Member split + real stock hold + opportunity bonus).');
