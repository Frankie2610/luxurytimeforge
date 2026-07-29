import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const context=read('src/context.tsx');
const checkout=read('src/checkout-v11.tsx');
const integrations=read('src/integrations-v13.tsx');
const admin=read('src/admin-sprint11.tsx');
const orderServer=read('server/orders.js');
const payosCreate=read('api/payments/create.js');
const payosServer=read('server/payos.js');
const shippingWebhook=read('api/shipping/webhook.js');
const rules=JSON.parse(read('firebase.rules.json'));

assert.match(checkout,/submitStorefrontOrder\(payload\)/,'Checkout must create every order through the server API.');
assert.doesNotMatch(checkout,/createOrder\(payload\)/,'Storefront checkout must not write orders directly from the browser.');
assert.match(context,/firebaseClient\.subscribe<Order\[\]\|Record<string,Order>>\('timeforge\/orders'/,'Admin orders must subscribe in realtime.');
assert.match(context,/timeforge\/orders\/\$\{id\}/,'Admin order updates must write one order path instead of replacing the entire order collection.');
assert.match(integrations,/Thông tin tài khoản ngân hàng chuyển khoản/);
assert.match(integrations,/preferredBankAccountId/);
assert.match(integrations,/bankTransferDiscount/);
assert.match(admin,/Xác nhận đã nhận chuyển khoản/);
assert.match(admin,/Tạo fulfillment/);
assert.match(admin,/Đánh dấu đã giao/);
assert.match(orderServer,/createVerifiedStorefrontOrder/);
assert.match(orderServer,/firebaseMultiPatch/);
assert.match(payosCreate,/qrCode:payment\.qrCode\|\|''/);
assert.match(payosServer,/paymentConfirmationSource:'payos_webhook'/);
assert.match(shippingWebhook,/trackingNumber/);
assert.equal(rules.rules.timeforge.settings.integrations['.read'],true,'Checkout needs public read access to non-secret bank/payment settings.');
assert.notEqual(rules.rules.timeforge.orders['.write'],true,'Guest clients must not have direct order write access.');

process.env.FIREBASE_DATABASE_URL='https://example.firebaseio.com';
process.env.FIREBASE_DATABASE_AUTH='test-secret';
const database={
  'timeforge/orders':{},
  'timeforge/products':{
    sku_watch:{id:'prod_1',sku:'WATCH-1',handle:'watch-1',title:'Watch One',status:'active',published:true,price:1000000,inventory:10,images:['https://example.com/watch.jpg'],variants:[{id:'var_a',title:'Black',sku:'WATCH-1-B',price:1000000,inventory:6},{id:'var_b',title:'Silver',sku:'WATCH-1-S',price:1200000,inventory:4}],createdAt:'2026-01-01',updatedAt:'2026-01-01'}
  },
  'timeforge/discounts':{},
  'timeforge/settings/integrations':{payment:{cod:true,bankTransfer:true,online:true,bankAccounts:[{id:'vcb',bankName:'VCB',accountName:'TIMEFORGE',accountNumber:'123456',enabled:true,priority:1}],preferredBankAccountId:'vcb',bankTransferDiscount:{enabled:true,type:'percentage',value:5,minimumSubtotal:0}},shipping:{freeShippingThreshold:5000000}},
  'timeforge/customers':{}
};
const patches=[];
const pathFromUrl=(url)=>new URL(url).pathname.replace(/^\//,'').replace(/\.json$/,'');
globalThis.fetch=async(url,options={})=>{
  const method=options.method||'GET';
  const path=pathFromUrl(url);
  if(method==='GET')return new Response(JSON.stringify(database[path]??null),{status:200,headers:{'Content-Type':'application/json'}});
  if(method==='PATCH'&&path===''){const body=JSON.parse(options.body);patches.push(body);return new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}})}
  return new Response('{}',{status:200,headers:{'Content-Type':'application/json'}});
};
const {createVerifiedStorefrontOrder}=await import('../server/orders.js');
const basePayload={discountCode:'',customer:{name:'Nguyen Van A',email:'a@example.com',phone:'0900000000'},shippingAddress:{fullName:'Nguyen Van A',phone:'0900000000',email:'a@example.com',address1:'1 Nguyen Hue',address2:'',ward:'Ben Nghe',district:'Quan 1',city:'Ho Chi Minh',country:'Viet Nam',postalCode:''},note:''};
const bank=await createVerifiedStorefrontOrder({payload:{...basePayload,paymentMethod:'bank_transfer'},requestId:'order_bank_12345678',cart:[{productId:'prod_1',variantId:'var_a',quantity:2},{productId:'prod_1',variantId:'var_b',quantity:1}]});
assert.equal(bank.subtotal,3200000);
assert.equal(bank.paymentDiscountAmount,160000);
assert.equal(bank.total,3090000);
assert.equal(bank.bankAccountNumber,'123456');
const bankProduct=patches.at(-1)['timeforge/products/sku_watch'];
assert.equal(bankProduct.inventory,7);
assert.equal(bankProduct.variants[0].inventory,4);
assert.equal(bankProduct.variants[1].inventory,3);
assert.equal(Object.keys(patches.at(-1)).filter(key=>key.startsWith('timeforge/inventoryAdjustments/')).length,2);

const payos=await createVerifiedStorefrontOrder({payload:{...basePayload,paymentMethod:'payos'},requestId:'order_payos_12345678',cart:[{productId:'prod_1',variantId:'var_a',quantity:1}]});
assert.equal(payos.paymentMethod,'payos');
assert.equal(payos.paymentProvider,'payos');
assert.equal(payos.paymentStatus,'pending');

const cod=await createVerifiedStorefrontOrder({payload:{...basePayload,paymentMethod:'cod'},requestId:'order_cod_12345678',cart:[{productId:'prod_1',variantId:'var_a',quantity:1}]});
assert.equal(cod.paymentMethod,'cod');
assert.equal(cod.paymentDiscountAmount,0);

console.log('V0.52.0 order/payment checks passed: server-created COD, bank transfer discount, PayOS, realtime Admin, tracking and secure Firebase rules.');
