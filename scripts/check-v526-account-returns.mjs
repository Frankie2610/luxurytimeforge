import fs from 'node:fs';
const css=fs.readFileSync(new URL('../src/v526-account-returns.css',import.meta.url),'utf8');
const account=fs.readFileSync(new URL('../src/customer-account-v12.tsx',import.meta.url),'utf8');
const returns=fs.readFileSync(new URL('../src/returns-v13.tsx',import.meta.url),'utf8');
const checks=[
  ['account imports v526 css',account.includes("import './v526-account-returns.css';")],
  ['returns imports v526 css',returns.includes("import './v526-account-returns.css';")],
  ['account thumbs reduced to 46px',css.includes('width:46px!important')&&css.includes('height:46px!important')],
  ['profile typography enlarged',css.includes('.v12-profile-card h2')&&css.includes('font-size:23px')],
  ['address typography enlarged',css.includes('.v12-address-card h3')&&css.includes('font-size:19px')],
  ['order footer buttons have white text',css.includes('color:#fff!important')],
  ['return page brand scope exists',css.includes('/* Customer returns */')&&css.includes('--v526-green:#0b5a42')],
  ['return product image compact',css.includes('width:82px!important')&&css.includes('height:82px!important')],
  ['return CTA green',css.includes('.v13-return-summary .v13-primary')&&css.includes('background:var(--v526-green)')],
  ['mobile return layout present',css.includes('@media(max-width:680px)')&&css.includes('width:58px!important')],
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);
console.log(`V0.52.6 checks passed: ${checks.length}/${checks.length}`);
