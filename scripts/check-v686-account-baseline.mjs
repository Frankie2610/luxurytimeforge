import fs from 'node:fs';

const app=fs.readFileSync('src/App.tsx','utf8');
const globalCss=fs.readFileSync('src/app.css','utf8');
const account=fs.readFileSync('src/customer-account-v12.tsx','utf8');

const checks=[
 ['account routes import customer-account directly',app.includes("import('./customer-account-v12')")&&!app.includes("import('./account-route-v685')")],
 ['global css does not load account responsive override',!globalCss.includes('v682-account-responsive.css')&&!globalCss.includes('v685-account-final.css')],
 ['stable account baseline css remains first',account.startsWith("import './v524-customer-account.css';\nimport './v525-customer-order-detail.css';\nimport './v582-customer-polish.css';\nimport './v526-account-returns.css';"))],
 ['referral styles remain additive',account.includes("import './referral-v68.css';"))
];
for(const [name,ok] of checks){if(!ok)throw new Error(`V0.68.6 account baseline check failed: ${name}`)}
console.log(`V0.68.6 account baseline checks PASS (${checks.length}/${checks.length})`);
