import fs from 'node:fs';
const read=(path)=>fs.readFileSync(path,'utf8');
const storefront=read('src/storefront-v10.tsx');
const admin=read('src/admin-shell-v16.tsx');
const css=read('src/v523-product-admin-fix.css');
const tests=[
  ['storefront imports V523 CSS',storefront.includes("import './v523-product-admin-fix.css';")],
  ['admin imports V523 CSS',admin.includes("import './v523-product-admin-fix.css';")],
  ['runtime product details fallback exists',storefront.includes("id: 'runtime-product-details'")],
  ['description is unconditional',storefront.includes('<section className="tf-pdp491-details"')&&!storefront.includes('{descriptionBlock && <section className="tf-pdp491-details"')],
  ['technical specifications heading restored',storefront.includes('<h2>Thông số kỹ thuật</h2>')],
  ['related footer spacing reduced',css.includes('.tf-related-v4916')&&css.includes('padding-bottom: clamp(16px, 2vw, 28px) !important')],
  ['admin account trigger is white',css.includes('.v16-user-trigger')&&css.includes('background: #fff !important')],
  ['admin page header polished',css.includes('.v16-page-header')&&css.includes('linear-gradient(135deg, #fff 0%, #f7faf8 100%)')],
];
let failed=0;
for(const [label,ok] of tests){console.log(`${ok?'PASS':'FAIL'} ${label}`);if(!ok)failed++;}
if(failed)process.exit(1);
console.log(`V0.52.3 checks passed: ${tests.length}/${tests.length}`);
