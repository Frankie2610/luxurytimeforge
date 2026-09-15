import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const [app,shell,ops,css,permissions,pkgText,seo,indexSafety]=await Promise.all([
  read('src/App.tsx'),read('src/admin-shell-v16.tsx'),read('src/product-ops-v681.tsx'),read('src/product-ops-v681.css'),read('src/permissions.ts'),read('package.json'),read('scripts/check-v664-ai-seo.mjs'),read('scripts/check-v665-index-safety.mjs')
]);
const pkg=JSON.parse(pkgText);let failures=0;const must=(ok,msg)=>{if(ok)console.log(`PASS ${msg}`);else{console.error(`FAIL ${msg}`);failures++}};
must(pkg.version==='0.68.1','package version is V0.68.1');
must(app.includes('ProductOpsCenterV681')&&app.includes('path="product-ops"'),'Product Ops route is registered');
must(shell.includes("'/admin/product-ops'")&&shell.includes('Operations & Release'),'Product Ops navigation and page metadata exist');
must(permissions.includes("/admin/product-ops")&&permissions.includes("dashboard.view"),'Product Ops route has an explicit permission rule');
must(ops.includes('BUSINESS IMPACT TRIAGE')&&ops.includes('revenueAtRisk')&&ops.includes("?'P1':'Healthy'"),'business-impact exception triage is present');
must(ops.includes('UAT & QUALITY GATE')&&ops.includes('releaseBlocked')&&ops.includes('rollbackPlan'),'UAT, release blocker and rollback controls are present');
must(ops.includes('AS-IS → TO-BE')&&ops.includes('Process improvement board')&&ops.includes('kpi'),'BPM As-is to To-be improvement board is present');
must(ops.includes('paymentExceptions')&&ops.includes('fulfillmentBacklog')&&ops.includes('referralReview')&&ops.includes('lowStock'),'operational signals derive from real commerce state');
must(css.includes('@media(max-width:1100px)')&&css.includes('@media(max-width:720px)')&&css.includes('@media(max-width:440px)'),'desktop, tablet and mobile responsive rules exist');
must(seo.includes('0\\.68\\.[01]'),'legacy AI/SEO version gate accepts V0.68.1');
must(indexSafety.includes('0\\.68\\.[01]'),'legacy index-safety version gate accepts V0.68.1');
must(String(pkg.scripts?.build||'').includes('check-v681-product-ops.mjs'),'production build runs the V0.68.1 regression check');
if(failures)process.exit(1);console.log(`V0.68.1 Product Ops checks PASS (${12-failures}/12)`);
