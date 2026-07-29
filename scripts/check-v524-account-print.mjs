import fs from 'node:fs';
const read=(file)=>fs.readFileSync(file,'utf8');
const account=read('src/customer-account-v12.tsx');
const accountCss=read('src/v524-customer-account.css');
const admin=read('src/admin-sprint12.tsx');
const printCss=read('src/v524-print-documents.css');
const checks=[
 ['account route CSS imported',account.includes("import './v524-customer-account.css'")],
 ['Firebase store identity used',account.includes('resolveStoreLogo')&&account.includes('resolveStoreName')],
 ['login layout polished',account.includes('v524-login-layout')&&account.includes('v524-login-card')],
 ['account dashboard polished',account.includes('v524-account-hero')&&account.includes('v524-account-stats')],
 ['tablet breakpoint present',accountCss.includes('@media(max-width:900px)')],
 ['mobile breakpoint present',accountCss.includes('@media(max-width:640px)')],
 ['print CSS imported',admin.includes("import './v524-print-documents.css'")],
 ['SVG barcode component present',admin.includes('function BarcodeGraphic')&&admin.includes('<svg role="img"')],
 ['old fake barcode removed from markup',!admin.includes('className="v12-fake-barcode"')],
 ['invoice uses store profile',admin.includes('StoreDocumentBrand')&&admin.includes('storeProfile')],
 ['shipping label redesigned',admin.includes('v524-shipping-label')&&admin.includes('v524-label-addresses')],
 ['print barcode forced visible',printCss.includes('.v524-barcode svg')&&printCss.includes('visibility:visible!important')],
 ['print page rule present',printCss.includes('@page{size:A4')],
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++}
console.log(`V0.52.4 checks: ${checks.length-failed}/${checks.length} passed`);process.exit(failed?1:0);
