import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');
const exists = (file) => fs.existsSync(new URL(file, root));

const packageJson = JSON.parse(read('package.json'));
const wishlistPage = read('src/wishlist-page-v53.tsx');
const wishlistStore = read('src/wishlist.tsx');
const wishlistCss = read('src/v53-wishlist.css');
const adminOrders = read('src/admin-sprint11.tsx');
const adminShell = read('src/admin-shell-v16.tsx');
const adminCss = read('src/v550-admin-polish.css');
const storefront = read('src/storefront-v10.tsx');
const storefrontCss = read('src/v550-storefront-polish.css');
const envLocal = read('.env.local');

const checks = [
  ['package version is 0.55.0', packageJson.version === '0.55.0'],
  ['V0.55 regression command is registered', packageJson.scripts?.['v550:check'] === 'node scripts/check-v550-polish-performance.mjs'],
  ['Admin polish stays scoped to the current shell', adminCss.includes('.tf-admin-v499 .v16-admin-content') && !adminCss.includes('\ninput{')],
  ['Admin order toolbar uses collision-safe grid tracks', adminCss.includes('.tf55-orders-toolbar') && adminCss.includes('grid-template-columns:minmax(280px,1fr) minmax(184px,auto) auto auto')],
  ['Admin search reserves icon, input and clear-button tracks', adminCss.includes('grid-template-columns:19px minmax(0,1fr) 30px') && adminCss.includes(':not(:has(.tf55-search-clear))')],
  ['legacy Admin searches no longer rely on absolute icons', adminCss.includes('.v12-admin-toolbar>label') && adminCss.includes('.v13-toolbar>label') && adminCss.includes('.tf4923-discount-toolbar>label') && adminCss.includes('>svg{position:static!important')],
  ['Admin toolbar has tablet and mobile breakpoints', adminCss.includes('@media(max-width:1120px)') && adminCss.includes('@media(max-width:680px)')],
  ['mobile Admin removes expensive backdrop blur', adminCss.includes('backdrop-filter:none!important')],
  ['order search is deferred and URL updates are debounced', adminOrders.includes('useDeferredValue(query)') && adminOrders.includes('window.setTimeout(() => setParams') && adminOrders.includes('}), 180);')],
  ['order search supports keyboard focus and clear', adminOrders.includes("event.key === '/'") && adminOrders.includes("event.key === 'Escape'") && adminOrders.includes('searchRef.current?.focus()')],
  ['filtered orders can be exported as CSV', adminOrders.includes('exportFiltered') && adminOrders.includes('timeforge-orders-') && adminOrders.includes('tf55-export-orders')],
  ['order detail normalizes workflow data at render boundary', adminOrders.includes('useMemo(() => normalizeWorkflowStore(store), [store])') && adminOrders.includes('workflow.events.filter') && adminOrders.includes('workflow.refunds.filter')],
  ['segment membership is memoized', adminOrders.includes('const membersBySegment = useMemo') && adminOrders.includes('membersBySegment.get(segment.id)')],
  ['Wishlist media is centered, contained and square-cornered', wishlistCss.includes('object-fit:contain!important') && wishlistCss.includes('object-position:center!important') && wishlistCss.includes('border-radius:0!important')],
  ['Wishlist mobile type and media layout are compact', wishlistCss.includes('.tf53-wishlist-hero h1{font-size:32px') && wishlistCss.includes('grid-template-columns:124px minmax(0,1fr)') && wishlistCss.includes('.tf53-wishlist-copy>a{font-size:16px')],
  ['Wishlist avoids permanent promoted image layers', !wishlistCss.includes('translateZ(0)')],
  ['Wishlist lookup is map-backed and memoized', wishlistPage.includes('new Map(products.map') && wishlistPage.includes('productById.get(id)')],
  ['Wishlist includes sorting and add-all actions', wishlistPage.includes('WISHLIST_SORT_KEY') && wishlistPage.includes('price-desc') && wishlistPage.includes('addAllAvailable') && wishlistPage.includes('Thêm tất cả có sẵn')],
  ['Wishlist persistence is deferred', wishlistStore.includes('window.setTimeout') && wishlistStore.includes('}, 90)')],
  ['storefront route view only keys on pathname', storefront.includes('className="tf-route-view-v4910" key={location.pathname}') && !storefront.includes('key={`${location.pathname}${location.search}`}')],
  ['storefront pathname scroll reset ignores query-only changes', storefront.includes('}, [location.pathname]);')],
  ['storefront search work is memoized', storefront.includes('const found = useMemo') && storefront.includes('const visibleFound = useMemo') && storefront.includes('const suggested = useMemo')],
  ['Wishlist and Admin chunks prefetch on navigation intent', storefront.includes('prefetchWishlistRoute') && storefront.includes('onPointerEnter={prefetchWishlistRoute}') && adminShell.includes('adminRoutePrefetchers') && adminShell.includes('onPointerEnter={()=>prefetchAdminRoute(to)}')],
  ['mobile storefront contains paint and disables costly effects', storefrontCss.includes('contain:layout paint') && storefrontCss.includes('backdrop-filter:none!important') && storefrontCss.includes('@media(prefers-reduced-motion:reduce)')],
  ['temporary preview overrides are absent', packageJson.scripts.dev === 'vite' && envLocal.includes('VITE_ENABLE_DEMO_LOGIN=false') && !exists('scripts/preview-network-shim.cjs')],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
console.log(`V0.55.0 polish and performance checks passed: ${checks.length}/${checks.length}`);
