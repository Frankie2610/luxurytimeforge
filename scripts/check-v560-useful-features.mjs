import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');

const packageJson = JSON.parse(read('package.json'));
const wishlistPage = read('src/wishlist-page-v53.tsx');
const wishlistStore = read('src/wishlist.tsx');
const wishlistCss = read('src/v560-wishlist-features.css');
const adminOrders = read('src/admin-sprint11.tsx');
const adminShell = read('src/admin-shell-v16.tsx');
const adminCss = read('src/v560-admin-features.css');
const [major, minor, patch] = packageJson.version.split('.').map(Number);
const preservesV560 = major > 0 || minor > 56 || (minor === 56 && patch >= 0);

const checks = [
  ['package version preserves the 0.56.0 baseline', preservesV560],
  ['V0.56 regression command is registered', packageJson.scripts?.['v560:check'] === 'node scripts/check-v560-useful-features.mjs'],
  ['Wishlist store supports bounded multi-item import', wishlistStore.includes('addMany: (productIds: string[])') && wishlistStore.includes('normalizeWishlist([...normalizedIds, ...current])')],
  ['Wishlist share links use repeated URL parameters', wishlistPage.includes("searchParams.getAll('wish')") && wishlistPage.includes("url.searchParams.append('wish', id)")],
  ['shared Wishlist imports only active published products', wishlistPage.includes("product?.status === 'active' && product.published") && wishlistPage.includes('addMany(validIds)')],
  ['shared parameters are removed after import', wishlistPage.includes("cleanParams.delete('wish')") && wishlistPage.includes('setSearchParams(cleanParams, {replace: true})')],
  ['comparison selection is bounded to three items', wishlistPage.includes('MAX_COMPARE_ITEMS = 3') && wishlistPage.includes('compareIds.length >= MAX_COMPARE_ITEMS')],
  ['comparison has an accessible responsive dialog', wishlistPage.includes('role="dialog"') && wishlistPage.includes('aria-modal="true"') && wishlistPage.includes('tf56-compare-scroll')],
  ['comparison images remain centered and square', wishlistCss.includes('object-fit:contain!important') && wishlistCss.includes('border-radius:0!important')],
  ['Wishlist feature CSS includes mobile and reduced-motion guards', wishlistCss.includes('@media(max-width:640px)') && wishlistCss.includes('@media(max-width:380px)') && wishlistCss.includes('@media(prefers-reduced-motion:reduce)')],
  ['offscreen Wishlist cards use intrinsic-size containment', wishlistCss.includes('content-visibility:auto') && wishlistCss.includes('contain-intrinsic-size')],
  ['Admin order range is URL-backed', adminOrders.includes("params.get('range')") && adminOrders.includes("setFilter('range', event.target.value)")],
  ['Admin order date ranges cover today, 7 and 30 days', adminOrders.includes("range === 'today'") && adminOrders.includes("range === '7d'") && adminOrders.includes("range === '30d'")],
  ['Admin can copy the current filtered order view', adminOrders.includes('copyFilteredView') && adminOrders.includes('url.searchParams.set') && adminOrders.includes('tf56-copy-order-view')],
  ['Admin density preference persists on-device', adminShell.includes("localStorage.getItem('tf:admin-density')") && adminShell.includes("localStorage.setItem('tf:admin-density',density)")],
  ['Admin compact density is scoped to the current shell', adminShell.includes('is-density-compact') && adminCss.includes('.tf-admin-v499.is-density-compact .v16-admin-content')],
  ['five-part order toolbar has safe desktop and mobile grids', adminCss.includes('grid-template-columns:minmax(240px,1fr)') && adminCss.includes('@media(max-width:1120px)') && adminCss.includes('@media(max-width:680px)')],
  ['legacy order workflow normalization remains active', adminOrders.includes('normalizeWorkflowStore(remote)') && adminOrders.includes('useMemo(() => normalizeWorkflowStore(store), [store])')],
  ['new feature CSS avoids expensive backdrop filters', !wishlistCss.includes('backdrop-filter') && !adminCss.includes('backdrop-filter')],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
console.log(`V0.56.0 useful feature checks passed: ${checks.length}/${checks.length}`);
