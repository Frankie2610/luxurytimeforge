import fs from 'node:fs';
const required=['src/member-v69.ts','src/member-admin-v69.tsx','src/v690-member-hub.css','src/v690-member-admin.css','src/customer-account-v12.tsx','src/App.tsx','firebase.rules.template.json'];
const missing=required.filter(file=>!fs.existsSync(file));if(missing.length)throw new Error(`Missing V0.69 files: ${missing.join(', ')}`);
const member=fs.readFileSync('src/member-v69.ts','utf8');
const account=fs.readFileSync('src/customer-account-v12.tsx','utf8');
const admin=fs.readFileSync('src/member-admin-v69.tsx','utf8');
const css=fs.readFileSync('src/v690-member-hub.css','utf8');
const app=fs.readFileSync('src/App.tsx','utf8');
const rules=fs.readFileSync('firebase.rules.template.json','utf8');
const checks=[
 ['four tiers', ['member','silver','gold','platinum'].every(t=>member.includes(`'${t}'`))],
 ['paid-only tier spend', member.includes("order.paymentStatus==='paid'")&&member.includes("order.status!=='cancelled'")],
 ['birthday booster', member.includes('birthdayBoostEnabled')&&member.includes('birthdayMaxOrders')],
 ['tier multipliers', member.includes('creditMultiplier')],
 ['member coupons', account.includes('MEMBER COUPONS')&&member.includes('tierCoupons')],
 ['TimeForge Vault', account.includes('TIMEFORGE VAULT')],
 ['Decision Radar', account.includes('DECISION RADAR')&&account.includes('useWishlist')&&account.includes('useCompareV57')],
 ['Next Piece Engine', account.includes('NEXT PIECE ENGINE')&&account.includes('recommendationScore')],
 ['referral dashboard', account.includes('Referral thành công')&&account.includes('referralReferrerId')],
 ['admin configurability', admin.includes('Ngưỡng chi tiêu')&&admin.includes('Hệ số Forge Credits')&&admin.includes('Coupon codes')],
 ['member route alias', app.includes('path="/member"')],
 ['tablet responsive', css.includes('@media(max-width:820px)')],
 ['mobile responsive', css.includes('@media(max-width:640px)')],
 ['firebase member settings rule', rules.includes('"member"')&&rules.includes('".read": true')],
];
for(const[name,ok]of checks)if(!ok)throw new Error(`V0.69 check failed: ${name}`);
console.log(`V0.69 member hub checks PASS (${checks.length}/${checks.length})`);
