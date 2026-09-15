import fs from 'node:fs';
const files=['src/referral-v68.ts','src/referral-admin-v68.tsx','src/referral-landing-v68.tsx','src/referral-v68.css','server/orders.js','src/checkout-v11.tsx','src/customer-account-v12.tsx'];
const missing=files.filter(file=>!fs.existsSync(file));
if(missing.length)throw new Error(`Missing V0.68 files: ${missing.join(', ')}`);
const admin=fs.readFileSync('src/referral-admin-v68.tsx','utf8');const server=fs.readFileSync('server/orders.js','utf8');const app=fs.readFileSync('src/App.tsx','utf8');
const checks=[['email toggle',admin.includes('useEmailAntiFraud')],['fixed amount',admin.includes('fixed_amount')],['growth queue',admin.includes('GROWTH OPS QUEUE')],['server evaluator',server.includes('evaluateReferral')],['IP hashing',server.includes('hashReferralIp')],['ref route',app.includes('/ref/:code')],['admin route',app.includes('path="referrals"')]];
for(const [name,ok] of checks){if(!ok)throw new Error(`V0.68 check failed: ${name}`)}
console.log(`V0.68 referral growth checks PASS (${checks.length}/${checks.length})`);
