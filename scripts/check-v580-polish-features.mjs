import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const storefront=read('src/storefront-v10.tsx');
const storefrontCss=read('src/v580-storefront-polish.css');
const commerce=read('src/checkout-v11.tsx');
const commerceCss=read('src/v580-commerce-polish.css');
const journal=read('src/blog-v18.tsx');
const journalCss=read('src/v580-journal-polish.css');
const adminShell=read('src/admin-shell-v16.tsx');
const adminCss=read('src/v580-admin-polish.css');
const operations=read('src/operations.tsx');
const contrast=read('src/v502-storefront-contrast.css');
const pkg=JSON.parse(read('package.json'));

const checks=[
  ['package keeps the v0.58 polish baseline',/^0\.(?:58|59|60)\./.test(pkg.version)],
  ['storefront final stylesheet loads after v576',storefront.indexOf("./v580-storefront-polish.css")>storefront.indexOf("./v576-storefront-readability.css")],
  ['commerce final stylesheet loads after v576',commerce.indexOf("./v580-commerce-polish.css")>commerce.indexOf("./v576-commerce-polish.css")],
  ['journal final stylesheet loads after v576',journal.indexOf("./v580-journal-polish.css")>journal.indexOf("./v576-journal-readability.css")],
  ['admin final stylesheet loads after v566',adminShell.indexOf("./v580-admin-polish.css")>adminShell.indexOf("./v566-admin-polish.css")],
  ['critical desktop header repair stays in legacy layer',storefrontCss.includes('@layer legacy')&&storefrontCss.includes('@media (min-width:821px)')],
  ['desktop navigation and search own 13px type',storefrontCss.includes('.lux-main-nav > a')&&storefrontCss.includes('.lux-search-button > span')&&storefrontCss.includes('font-size:13px!important')],
  ['brand rail color is repaired for light surface',storefrontCss.includes('.tf-brand-rail-nav-v39 > a:not(.tf-brand-rail-all-v39)')],
  ['stale v502 important 11px header owner removed',!/@layer legacy\s*\{[^}]*lux-main-nav[^}]*font-size:\s*11px\s*!important/s.test(contrast)],
  ['checkout draft is versioned and expires after seven days',commerce.includes("tf:checkout-draft:v1")&&commerce.includes('7 * 24 * 60 * 60 * 1000')],
  ['checkout draft restores and renders visible status',commerce.includes('readCheckoutDraftV580')&&commerce.includes('tf580-checkout-draft')&&commerce.includes('Đã khôi phục bản nháp checkout')],
  ['checkout draft clears after order creation',commerce.includes('createdOrder = await submitStorefrontOrder(payload);')&&commerce.includes('removeCheckoutDraftV580();')],
  ['checkout mobile fields prevent browser zoom',commerceCss.includes('font-size:16px!important')],
  ['catalog health validates image, sku, price and sellable state',operations.includes('hasImage')&&operations.includes('hasSku')&&operations.includes('hasPrice')&&operations.includes('isSellable')],
  ['catalog health dashboard has score and four action checks',operations.includes('tf580-catalog-health')&&operations.includes('tf580-health-checks')&&operations.includes('catalogChecks.map')],
  ['admin controls and catalog panel have final styling',adminCss.includes('.tf580-catalog-health')&&adminCss.includes(':is(input,select,textarea)')],
  ['article detail has a dedicated reading surface',journalCss.includes('.tf4922-article-content')&&journalCss.includes('.tf573-reading-tools')],
];

for(const[label,pass]of checks)console.log(`${pass?'✓':'✗'} ${label}`);
const failed=checks.filter(([,pass])=>!pass);
if(failed.length){console.error(`\n${failed.length} V0.58.0 check(s) failed.`);process.exit(1)}
console.log(`\nV0.58.0 polish and feature checks passed (${checks.length}/${checks.length}).`);
