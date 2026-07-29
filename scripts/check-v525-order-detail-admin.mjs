import fs from 'node:fs';
const files={
  account:fs.readFileSync('src/v525-customer-order-detail.css','utf8'),
  admin:fs.readFileSync('src/v525-admin-orders.css','utf8'),
  print:fs.readFileSync('src/v525-print-logo.css','utf8'),
  accountTsx:fs.readFileSync('src/customer-account-v12.tsx','utf8'),
  adminTsx:fs.readFileSync('src/admin-sprint11.tsx','utf8'),
  printTsx:fs.readFileSync('src/admin-sprint12.tsx','utf8'),
};
const checks=[
  ['customer order stylesheet imported',files.accountTsx.includes("./v525-customer-order-detail.css")],
  ['admin order stylesheet imported',files.adminTsx.includes("./v525-admin-orders.css")],
  ['print logo stylesheet imported',files.printTsx.includes("./v525-print-logo.css")],
  ['order title enlarged',files.account.includes('font-size:48px')],
  ['reorder button green by default',files.account.includes('header .v12-primary')&&files.account.includes('background:#0b5a42')],
  ['product image reduced',files.account.includes('width:78px;height:78px')],
  ['customer logo made white',files.account.includes('filter:brightness(0) invert(1)')],
  ['fulfillment button green',files.admin.includes('.s11-order-head button.primary')&&files.admin.includes('background:#0b5a42!important')],
  ['admin order index polished',files.admin.includes('.tf4921-orders-page .s11-table-wrap')],
  ['print logo made white',files.print.includes('filter:brightness(0) invert(1)')],
  ['mobile order detail responsive',files.account.includes('@media(max-width:720px)')],
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);
console.log(`V0.52.5 checks passed: ${checks.length}/${checks.length}`);
