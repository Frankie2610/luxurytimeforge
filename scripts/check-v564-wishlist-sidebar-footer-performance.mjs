import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');

const packageJson = JSON.parse(read('package.json'));
const admin = read('src/admin.tsx');
const adminShell = read('src/admin-shell-v16.tsx');
const adminCss = read('src/v564-admin-polish.css');
const editor = read('src/product-editor-v39.tsx');
const storefront = read('src/storefront-v10.tsx');
const storefrontCss = read('src/v564-storefront-polish.css');
const wishlist = read('src/wishlist-page-v53.tsx');
const wishlistCss = read('src/v564-wishlist-control.css');
const [major, minor, patch] = String(packageJson.version || '').split('.').map(Number);
const preservesV564 = major > 0 || minor > 56 || (minor === 56 && patch >= 4);

const logoStart = storefront.indexOf('const LuxuryLogo = memo');
const logoEnd = storefront.indexOf('function LuxuryHeader', logoStart);
const logoSource = storefront.slice(logoStart, logoEnd);

const checks = [
  ['package version preserves the V0.56.4 baseline', preservesV564],
  ['V0.56.4 regression command is registered', packageJson.scripts?.['v564:check'] === 'node scripts/check-v564-wishlist-sidebar-footer-performance.mjs'],
  ['Wishlist V0.56.4 control loads last', wishlist.indexOf("'./v564-wishlist-control.css'") > wishlist.indexOf("'./v563-wishlist-control.css'")],
  ['Wishlist dropdown is 12px on desktop', wishlistCss.includes('font-size:12px!important')],
  ['Wishlist dropdown is 11px on tablet', wishlistCss.includes('@media(max-width:1024px)') && wishlistCss.includes('select option{font-size:11px!important}')],
  ['Wishlist dropdown is 10px on mobile', wishlistCss.includes('@media(max-width:640px)') && wishlistCss.includes('select option{font-size:10px!important}')],
  ['selected value and native options use one responsive scale', wishlistCss.includes('>select,\n  .tf53-wishlist-page .tf55-wishlist-sort>select option')],
  ['Admin V0.56.4 polish loads last', adminShell.indexOf("'./v564-admin-polish.css'") > adminShell.indexOf("'./v563-admin-scroll-polish.css'")],
  ['Product Detail right column scrolls only on desktop', adminCss.includes('@media(min-width:921px)') && adminCss.includes('overflow-y:auto!important') && adminCss.includes('max-height:calc(100dvh - 102px)!important')],
  ['Product Detail returns to document flow on tablet and mobile', adminCss.includes('@media(max-width:920px)') && adminCss.includes('overflow:visible!important') && adminCss.includes('max-height:none!important')],
  ['Product readiness checklist is available', editor.includes('completionItems') && editor.includes('Mức độ hoàn thiện') && editor.includes('role="progressbar"')],
  ['Footer renders the editable resolved store name', storefront.includes('const storeName=resolveStoreName(settings.storeName)') && storefront.includes('tf564-footer-store-name') && admin.includes('Tên này đồng bộ lên header, footer')],
  ['Footer store name is larger and bold on every screen', storefrontCss.includes('font-size:clamp(16px,1.45vw,18px)!important') && storefrontCss.includes('font-weight:900!important') && storefrontCss.includes('@media(max-width:600px)')],
  ['Header and navigation typography is fixed at 13px', storefrontCss.includes('#tf-storefront-header .lux-main-nav>a') && storefrontCss.includes('font-size:13px!important')],
  ['Product sharing uses native share with clipboard fallback', storefront.includes('navigator.share') && storefront.includes('navigator.clipboard.writeText') && storefront.includes('tf564-pdp-share')],
  ['Store logo no longer subscribes independently to commerce state', logoStart >= 0 && logoEnd > logoStart && !logoSource.includes('useCommerce(')],
  ['fixed overlays avoid expensive page blur', storefrontCss.includes('.lux-search-overlay-v29,.tf510-filter-overlay') && storefrontCss.includes('backdrop-filter:none!important')],
  ['new interactions respect reduced motion', adminCss.includes('@media(prefers-reduced-motion:reduce)') && storefrontCss.includes('@media(prefers-reduced-motion:reduce)')],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
console.log(`V0.56.4 Wishlist, Admin sidebar, footer and performance checks passed: ${checks.length}/${checks.length}`);
