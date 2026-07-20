import type{Activity,Discount,InventoryAdjustment,Order}from'./types';

const now=new Date().toISOString();
export const seedDiscounts:Discount[]=[
 {id:'discount-welcome10',code:'WELCOME10',title:'Giảm 10% cho đơn đầu tiên',type:'percentage',value:10,minimumSubtotal:1000000,usageLimit:100,usageCount:0,startsAt:'2026-01-01T00:00:00.000Z',endsAt:'2027-12-31T23:59:59.000Z',active:true,createdAt:now},
 {id:'discount-freeship',code:'FREESHIP',title:'Miễn phí vận chuyển',type:'free_shipping',value:0,minimumSubtotal:500000,usageLimit:0,usageCount:0,startsAt:'2026-01-01T00:00:00.000Z',endsAt:'2027-12-31T23:59:59.000Z',active:true,createdAt:now}
];
export const seedOrders:Order[]=[];
export const seedAdjustments:InventoryAdjustment[]=[];
export const seedActivities:Activity[]=[{id:'activity-system-ready',entity:'system',entityId:'timeforge',action:'Khởi tạo Sprint 3',detail:'Orders, checkout, discounts, inventory log và analytics đã sẵn sàng.',createdAt:now,actor:'System'}];
