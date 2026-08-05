import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');

const packageJson = JSON.parse(read('package.json'));
const storefront = read('src/storefront-v10.tsx');
const storefrontCss = read('src/v566-storefront-polish.css');
const adminShell = read('src/admin-shell-v16.tsx');
const adminCss = read('src/v566-admin-polish.css');

const footerStart = storefront.indexOf('function LuxuryFooter()');
const footerEnd = storefront.indexOf('function StoreCatalogLoading', footerStart);
const footerSource = storefront.slice(footerStart, footerEnd);

const [major, minor, patch] = String(packageJson.version || '').split('.').map(Number);
const preservesV566 = major > 0 || minor > 56 || (minor === 56 && patch >= 6);

const checks = [
  ['package version preserves the V0.56.6 baseline', preservesV566],
  ['V0.56.6 check command is registered', packageJson.scripts?.['v566:check'] === 'node scripts/check-v566-footer-about-admin.mjs'],
  ['footer keeps the logo mark and suppresses its duplicate name', footerStart >= 0 && footerEnd > footerStart && footerSource.includes('<LuxuryLogo') && footerSource.includes('showName={false}')],
  ['footer keeps the editable resolved store name', footerSource.includes('resolveStoreName(settings.storeName)') && footerSource.includes('tf564-footer-store-name')],
  ['footer name is black, substantially larger and extra bold', storefrontCss.includes('color:#111!important') && storefrontCss.includes('font-size:clamp(27px,2.4vw,33px)!important') && storefrontCss.includes('font-weight:950!important')],
  ['footer offers direct order tracking', footerSource.includes('<Link to="/track-order">Theo dõi đơn hàng</Link>')],
  ['About page includes a trust layer and smaller heading scale', storefront.includes('tf566-about-trust') && storefrontCss.includes('font-size:clamp(38px,5vw,66px)') && storefrontCss.includes('.tf4941-about-story h2')],
  ['About page provides warranty and tracking shortcuts', storefront.includes('tf566-about-footer-links') && storefront.includes('Chính sách bảo hành') && storefront.includes('Theo dõi đơn hàng')],
  ['customer utility dock uses a passive rAF scroll listener', storefront.includes("addEventListener('scroll',update,{passive:true})") && storefront.includes('window.requestAnimationFrame') && storefront.includes('StorefrontUtilityDock')],
  ['customer utility dock respects reduced motion', storefront.includes("matchMedia('(prefers-reduced-motion: reduce)')") && storefrontCss.includes('@media(prefers-reduced-motion:reduce)')],
  ['Admin stores and displays five recently opened pages', adminShell.includes("RECENT_ADMIN_PAGES_KEY='tf:admin-recent-pages:v1'") && adminShell.includes('.slice(0,5)') && adminShell.includes('Trang vừa mở')],
  ['Admin can copy the current page link', adminShell.includes('copyCurrentPage') && adminShell.includes('navigator.clipboard?.writeText') && adminShell.includes('Sao chép link trang hiện tại')],
  ['new storefront and Admin styles load last', storefront.indexOf("'./v566-storefront-polish.css'") > storefront.indexOf("'./v565-storefront-performance.css'") && adminShell.indexOf("'./v566-admin-polish.css'") > adminShell.indexOf("'./v565-admin-performance.css'")],
  ['Admin polish uses sticky table headers and below-fold containment', adminCss.includes('position:sticky') && adminCss.includes('content-visibility:auto') && adminCss.includes('contain-intrinsic-size:360px')],
  ['new CSS remains responsive', storefrontCss.includes('@media(max-width:900px)') && storefrontCss.includes('@media(max-width:680px)') && adminCss.includes('@media(max-width:760px)')],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
console.log(`V0.56.6 footer, About, customer utility and Admin checks passed: ${checks.length}/${checks.length}`);
