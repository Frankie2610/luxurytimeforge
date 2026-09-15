import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const [app,referral,ops,css,pkgText,seo,indexSafety]=await Promise.all([
  read('src/App.tsx'),read('src/referral-admin-v68.tsx'),read('src/product-ops-v681.tsx'),read('src/product-ops-v681.css'),read('package.json'),read('scripts/check-v664-ai-seo.mjs'),read('scripts/check-v665-index-safety.mjs')
]);
const pkg=JSON.parse(pkgText);let failures=0;const must=(ok,msg)=>{if(ok)console.log(`PASS ${msg}`);else{console.error(`FAIL ${msg}`);failures++}};
must(/^0\.68\.\d+$/.test(pkg.version),'package stays on a V0.68.x release');
must(app.includes('ProductOpsCenterV681')&&app.includes('path="product-ops"'),'Product Ops route is registered');
must(referral.includes('/admin/product-ops')&&referral.includes('Operations & Release Center'),'Referral & Growth exposes a Product Ops entry point');
must(ops.includes('BUSINESS IMPACT TRIAGE')&&ops.includes('revenueAtRisk')&&ops.includes("?'P1':'Healthy'"),'business-impact exception triage is present');
must(ops.includes('UAT & QUALITY GATE')&&ops.includes('releaseBlocked')&&ops.includes('rollbackPlan'),'UAT, release blocker and rollback controls are present');
must(ops.includes('AS-IS → TO-BE')&&ops.includes('Process improvement board')&&ops.includes('kpi'),'BPM As-is to To-be improvement board is present');
must(ops.includes('paymentExceptions')&&ops.includes('fulfillmentBacklog')&&ops.includes('referralReview')&&ops.includes('lowStock'),'operational signals derive from real commerce state');
must(css.includes('@media(max-width:1100px)')&&css.includes('@media(max-width:720px)')&&css.includes('@media(max-width:440px)'),'desktop, tablet and mobile responsive rules exist');
must(seo.includes('0\\.68\\.\\d+'),'legacy AI/SEO version gate accepts V0.68.x');
must(indexSafety.includes('0\\.68\\.\\d+'),'legacy index-safety version gate accepts V0.68.x');
if(failures)process.exit(1);console.log(`V0.68.x Product Ops checks PASS (${10-failures}/10)`);