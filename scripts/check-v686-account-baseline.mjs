import fs from 'node:fs';

const app=fs.readFileSync('src/App.tsx','utf8');
const globalCss=fs.readFileSync('src/app.css','utf8');
const account=fs.readFileSync('src/customer-account-v12.tsx','utf8');

const checks=[
 ['account routes import customer-account directly',app.includes("import('./customer-account-v12')")],
 ['account wrapper is not referenced',!app.includes("import('./account-route-v685')")],
 ['global css does not load account responsive override',!globalCss.includes('v682-account-responsive.css')&&!globalCss.includes('v685-account-final.css')],
 ['v524 baseline css is present',account.includes("import './v524-customer-account.css';")],
 ['v582 account polish is present',account.includes("import './v582-customer-polish.css';")],
 ['returns account css is present',account.includes("import './v526-account-returns.css';")],
 ['referral styles remain additive',account.includes("import './referral-v68.css';"))
];
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} — ${name}`);if(!ok)process.exitCode=1;}
if(process.exitCode)throw new Error('V0.68.6 account baseline regression failed');
console.log(`V0.68.6 account baseline checks PASS (${checks.length}/${checks.length})`);
