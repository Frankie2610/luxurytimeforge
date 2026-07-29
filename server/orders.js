import crypto from 'node:crypto';
import {firebaseEntries,firebaseMultiPatch,firebaseRead,findOrder} from './firebase-rest.js';

const cleanText=(value,max=160)=>String(value||'').trim().slice(0,max);
const safeInteger=(value)=>Number.isSafeInteger(Number(value))?Number(value):0;
const vietnamStamp=()=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'2-digit',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const values=Object.fromEntries(parts.map(part=>[part.type,part.value]));return`${values.year||''}${values.month||''}${values.day||''}`};
const orderNumber=()=>`TF-${vietnamStamp()}-${crypto.randomInt(1000,10000)}`;
const bankTransferContent=(lines,number)=>{const raw=cleanText(lines?.[0]?.sku,100).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12)||'ORDER';const suffix=String(number||'').replace(/\D/g,'').slice(-4)||String(crypto.randomInt(1000,10000));return`TF${vietnamStamp()}-${raw}-${suffix}`};
const safeRequestId=(value)=>{const input=cleanText(value,120);return/^[A-Za-z0-9_-]{8,120}$/.test(input)?input:`order_${crypto.randomUUID().replaceAll('-','')}`};
const uid=(prefix)=>`${prefix}_${crypto.randomUUID().replaceAll('-','')}`;

function normalizePaymentMethod(value){
  const method=String(value||'cod');
  if(method==='online')return'payos';
  if(['cod','bank_transfer','payos'].includes(method))return method;
  throw new Error('Phương thức thanh toán không hợp lệ.');
}

function normalizeIntegrations(raw){
  const sourcePayment=raw?.payment||{};
  const payment={...sourcePayment,cod:sourcePayment.cod!==false,bankTransfer:sourcePayment.bankTransfer!==false,online:sourcePayment.online===true};
  const legacy={id:'bank_legacy',bankName:cleanText(payment.bankName,120),accountName:cleanText(payment.bankAccountName,160),accountNumber:cleanText(payment.bankAccountNumber,80),branch:'',note:'',enabled:true,priority:1};
  const accounts=(Array.isArray(payment.bankAccounts)&&payment.bankAccounts.length?payment.bankAccounts:[legacy]).map((item,index)=>({
    id:cleanText(item?.id,100)||`bank_${index+1}`,
    bankName:cleanText(item?.bankName,120),
    accountName:cleanText(item?.accountName,160),
    accountNumber:cleanText(item?.accountNumber,80),
    branch:cleanText(item?.branch,160),
    note:cleanText(item?.note,240),
    enabled:item?.enabled!==false,
    priority:Number.isFinite(Number(item?.priority))?Number(item.priority):index+1,
  }));
  const preferred=accounts.find(item=>item.id===payment.preferredBankAccountId&&item.enabled)||accounts.filter(item=>item.enabled).sort((a,b)=>a.priority-b.priority)[0]||null;
  const transferDiscount={enabled:Boolean(payment.bankTransferDiscount?.enabled),type:payment.bankTransferDiscount?.type==='fixed_amount'?'fixed_amount':'percentage',value:Math.max(0,Number(payment.bankTransferDiscount?.value||0)),minimumSubtotal:Math.max(0,Number(payment.bankTransferDiscount?.minimumSubtotal||0))};
  return{payment:{...payment,bankAccounts:accounts,preferredBankAccountId:preferred?.id||'',bankTransferDiscount:transferDiscount},shipping:{freeShippingThreshold:Math.max(0,Number(raw?.shipping?.freeShippingThreshold||5000000))},preferred};
}

function evaluatePromo(discountEntries,code,subtotal,shipping){
  const normalized=cleanText(code,48).toUpperCase();
  if(!normalized)return{key:'',code:'',amount:0,shippingDiscount:0,discount:null};
  const found=discountEntries.find(([,item])=>String(item?.code||'').toUpperCase()===normalized&&item?.active);
  if(!found)return{key:'',code:'',amount:0,shippingDiscount:0,discount:null};
  const[key,discount]=found;const now=Date.now();
  if(discount.startsAt&&new Date(discount.startsAt).getTime()>now)return{key:'',code:'',amount:0,shippingDiscount:0,discount:null};
  if(discount.endsAt&&new Date(discount.endsAt).getTime()<now)return{key:'',code:'',amount:0,shippingDiscount:0,discount:null};
  if(Number(discount.usageLimit)>0&&Number(discount.usageCount)>=Number(discount.usageLimit))return{key:'',code:'',amount:0,shippingDiscount:0,discount:null};
  if(subtotal<Number(discount.minimumSubtotal||0))return{key:'',code:'',amount:0,shippingDiscount:0,discount:null};
  const value=Math.max(0,Number(discount.value||0));
  const amount=discount.type==='percentage'?Math.min(subtotal,Math.round(subtotal*value/100)):discount.type==='fixed_amount'?Math.min(subtotal,Math.round(value)):0;
  return{key,code:cleanText(discount.code,48),amount,shippingDiscount:discount.type==='free_shipping'?shipping:0,discount};
}

function evaluateTransferDiscount(settings,method,subtotal){
  const config=settings.payment.bankTransferDiscount;
  if(method!=='bank_transfer'||!config.enabled||subtotal<config.minimumSubtotal||config.value<=0)return{amount:0,label:''};
  const amount=config.type==='percentage'?Math.min(subtotal,Math.round(subtotal*Math.min(100,config.value)/100)):Math.min(subtotal,Math.round(config.value));
  return{amount,label:config.type==='percentage'?`Ưu đãi chuyển khoản ${config.value}%`:`Ưu đãi chuyển khoản ${amount.toLocaleString('vi-VN')}đ`};
}

function customerFromOrder(customerEntries,payload,total){
  const email=cleanText(payload.customer?.email,160).toLowerCase();
  const phone=cleanText(payload.customer?.phone,30);
  const existing=customerEntries.find(([,item])=>(email&&String(item?.email||'').toLowerCase()===email)||(phone&&String(item?.phone||'')===phone));
  const now=new Date().toISOString();
  const address=payload.shippingAddress||{};
  const addressItem={id:uid('address'),firstName:cleanText(payload.customer?.name,120).split(' ')[0]||'',lastName:cleanText(payload.customer?.name,120).split(' ').slice(1).join(' '),phone,address1:cleanText(address.address1,180),address2:cleanText(address.address2,180),ward:cleanText(address.ward,100),district:cleanText(address.district,100),city:cleanText(address.city,100),country:cleanText(address.country||'Việt Nam',80),postalCode:cleanText(address.postalCode,20),isDefault:!existing?.[1]?.addresses?.length};
  if(existing){const[key,item]=existing;return{key,customer:{...item,name:cleanText(payload.customer?.name,120),email,phone,ordersCount:Number(item.ordersCount||0)+1,totalSpent:Number(item.totalSpent||0)+total,addresses:[...(Array.isArray(item.addresses)?item.addresses:[]),addressItem]}}}
  const id=uid('customer');return{key:id,customer:{id,name:cleanText(payload.customer?.name,120),email,phone,ordersCount:1,totalSpent:total,tags:['Online'],createdAt:now,acceptsMarketing:false,addresses:[addressItem],notes:[]}};
}

export async function createVerifiedStorefrontOrder({payload,cart,requestId}){
  if(!payload||!Array.isArray(cart)||!cart.length||cart.length>50)throw new Error('Giỏ hàng không hợp lệ.');
  const id=safeRequestId(requestId);
  const existing=await findOrder(id).catch(()=>null);
  if(existing)return existing.order;
  const method=normalizePaymentMethod(payload.paymentMethod);
  const[catalogRaw,discountRaw,integrationRaw,customersRaw]=await Promise.all([
    firebaseRead('timeforge/products'),
    firebaseRead('timeforge/discounts').catch(()=>({})),
    firebaseRead('timeforge/settings/integrations').catch(()=>({})),
    firebaseRead('timeforge/customers').catch(()=>({})),
  ]);
  const productEntries=firebaseEntries(catalogRaw);
  const discountEntries=firebaseEntries(discountRaw);
  const settings=normalizeIntegrations(integrationRaw||{});
  if(method==='cod'&&!settings.payment.cod)throw new Error('Thanh toán khi nhận hàng hiện đang tạm tắt.');
  if(method==='bank_transfer'&&!settings.payment.bankTransfer)throw new Error('Chuyển khoản ngân hàng hiện đang tạm tắt.');
  if(method==='payos'&&!settings.payment.online)throw new Error('Thanh toán PayOS hiện đang tạm tắt.');
  const mergedCart=[...cart.reduce((groups,line)=>{
    const productId=cleanText(line?.productId,120);
    const variantId=cleanText(line?.variantId,120);
    const quantity=safeInteger(line?.quantity);
    if(!productId||quantity<1||quantity>99)throw new Error('Số lượng sản phẩm không hợp lệ.');
    const key=`${productId}::${variantId}`;
    const previous=groups.get(key);
    const mergedQuantity=(previous?.quantity||0)+quantity;
    if(mergedQuantity>99)throw new Error('Số lượng sản phẩm không hợp lệ.');
    groups.set(key,{productId,variantId,quantity:mergedQuantity});
    return groups;
  },new Map()).values()];
  const lines=mergedCart.map((line,index)=>{
    const found=productEntries.find(([,product])=>product?.id===line.productId);
    if(!found)throw new Error('Sản phẩm không còn tồn tại.');
    const[,product]=found;
    if(product.status!=='active'||product.published===false)throw new Error(`${cleanText(product.title,80)} chưa sẵn sàng để bán.`);
    const variants=Array.isArray(product.variants)?product.variants:[];
    const variant=variants.find(item=>item?.id===line.variantId)||variants[0];
    const inventory=Number(variant?.inventory??product.inventory??0);
    if(inventory<line.quantity)throw new Error(`${cleanText(product.title,80)} không đủ tồn kho.`);
    const unitPrice=Number(variant?.price??product.price);
    if(!Number.isSafeInteger(unitPrice)||unitPrice<=0)throw new Error('Giá sản phẩm không hợp lệ.');
    return{id:`line_${index+1}_${id.slice(-8)}`,productKey:found[0],productId:product.id,variantId:variant?.id||line.variantId,title:cleanText(product.title,160),variantTitle:cleanText(variant?.title||'Default Title',100),sku:cleanText(variant?.sku||product.sku,100),image:cleanText(product.images?.[0],800),quantity:line.quantity,unitPrice,lineTotal:unitPrice*line.quantity};
  });
  const subtotal=lines.reduce((sum,line)=>sum+line.lineTotal,0);
  const baseShipping=subtotal>=settings.shipping.freeShippingThreshold?0:50000;
  const promo=evaluatePromo(discountEntries,payload.discountCode,subtotal,baseShipping);
  const paymentDiscount=evaluateTransferDiscount(settings,method,subtotal);
  const shippingAmount=Math.max(0,baseShipping-promo.shippingDiscount);
  const discountAmount=Math.min(subtotal,promo.amount+paymentDiscount.amount);
  const total=subtotal-discountAmount+shippingAmount;
  const address=payload.shippingAddress||{};
  if(!cleanText(payload.customer?.name,120)||!cleanText(payload.customer?.phone,30)||!cleanText(address.address1,180)||!cleanText(address.district,100)||!cleanText(address.city,100))throw new Error('Thiếu thông tin giao hàng bắt buộc.');
  if(method==='bank_transfer'&&!settings.preferred?.accountNumber)throw new Error('Cửa hàng chưa cấu hình số tài khoản nhận chuyển khoản.');
  const now=new Date().toISOString();
  const customerResult=customerFromOrder(firebaseEntries(customersRaw),payload,total);
  const number=orderNumber();
  const transferContent=method==='bank_transfer'?bankTransferContent(lines,number):'';
  const order={
    id,number,createdAt:now,updatedAt:now,customerId:customerResult.customer.id,customerName:cleanText(payload.customer.name,120),customerEmail:cleanText(payload.customer.email,160),customerPhone:cleanText(payload.customer.phone,30),
    shippingAddress:{fullName:cleanText(address.fullName||payload.customer.name,120),phone:cleanText(address.phone||payload.customer.phone,30),email:cleanText(address.email||payload.customer.email,160),address1:cleanText(address.address1,180),address2:cleanText(address.address2,180),ward:cleanText(address.ward,100),district:cleanText(address.district,100),city:cleanText(address.city,100),country:cleanText(address.country||'Việt Nam',80),postalCode:cleanText(address.postalCode,20)},
    lines:lines.map(({productKey,...line})=>line),subtotal,discountCode:promo.code,discountAmount,promotionDiscountAmount:promo.amount,paymentDiscountAmount:paymentDiscount.amount,paymentDiscountLabel:paymentDiscount.label,shippingAmount,taxAmount:0,total,currency:'VND',status:'open',paymentStatus:'pending',fulfillmentStatus:'unfulfilled',paymentMethod:method,paymentProvider:method==='payos'?'payos':undefined,
    ...(method==='bank_transfer'&&settings.preferred?{bankAccountId:settings.preferred.id,bankName:settings.preferred.bankName,bankAccountName:settings.preferred.accountName,bankAccountNumber:settings.preferred.accountNumber,bankTransferContent:transferContent}:{}),
    note:cleanText(payload.note,1000),source:'storefront',
  };
  const updates={};
  updates[`timeforge/orders/${id}`]=order;
  updates[`timeforge/customers/${customerResult.key}`]=customerResult.customer;
  const linesByProduct=new Map();
  for(const line of lines){
    const grouped=linesByProduct.get(line.productKey)||[];
    grouped.push(line);
    linesByProduct.set(line.productKey,grouped);
  }
  for(const[productKey,productLines]of linesByProduct){
    const found=productEntries.find(([key])=>key===productKey);
    if(!found)continue;
    const original=found[1];
    const product=structuredClone(original);
    const quantitiesByVariant=new Map(productLines.map(line=>[line.variantId,line.quantity]));
    const totalQuantity=productLines.reduce((sum,line)=>sum+line.quantity,0);
    product.variants=(Array.isArray(product.variants)?product.variants:[]).map(variant=>{
      const quantity=quantitiesByVariant.get(variant.id)||0;
      return quantity?{...variant,inventory:Math.max(0,Number(variant.inventory||0)-quantity)}:variant;
    });
    product.inventory=Math.max(0,Number(product.inventory||0)-totalQuantity);
    product.updatedAt=now;
    updates[`timeforge/products/${productKey}`]=product;
    for(const line of productLines){
      const before=Number(original.variants?.find(item=>item.id===line.variantId)?.inventory??original.inventory??0);
      const adjustmentId=uid('adjustment');
      updates[`timeforge/inventoryAdjustments/${adjustmentId}`]={id:adjustmentId,productId:line.productId,variantId:line.variantId,sku:line.sku,productTitle:line.title,delta:-line.quantity,before,after:Math.max(0,before-line.quantity),reason:'order',note:`Trừ kho cho ${order.number}`,createdAt:now,referenceId:id};
    }
  }
  if(promo.discount&&promo.key)updates[`timeforge/discounts/${promo.key}`]={...promo.discount,usageCount:Number(promo.discount.usageCount||0)+1};
  await firebaseMultiPatch(updates);
  return order;
}
