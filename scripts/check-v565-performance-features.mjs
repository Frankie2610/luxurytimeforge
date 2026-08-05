import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');

const packageJson = JSON.parse(read('package.json'));
const context = read('src/context.tsx');
const wishlistStore = read('src/wishlist.tsx');
const storefront = read('src/storefront-v10.tsx');
const storefrontCss = read('src/v565-storefront-performance.css');
const adminShell = read('src/admin-shell-v16.tsx');
const adminCss = read('src/v565-admin-performance.css');
const productEditor = read('src/product-editor-v39.tsx');

const [major, minor, patch] = String(packageJson.version || '').split('.').map(Number);
const preservesV565 = major > 0 || minor > 56 || (minor === 56 && patch >= 5);

const checks = [
  ['package version preserves the V0.56.5 baseline', preservesV565],
  ['V0.56.5 regression command is registered', packageJson.scripts?.['v565:check'] === 'node scripts/check-v565-performance-features.mjs'],
  ['published and draft themes are referentially stable across cart updates', context.includes('const activeTheme=useMemo(') && context.includes('const draftTheme=useMemo(') && context.includes('theme:activeTheme,draftTheme,themeState')],
  ['Wishlist uses a React external store instead of broadcasting every card', wishlistStore.includes('useSyncExternalStore') && wishlistStore.includes('export function useWishlistItem') && wishlistStore.includes('wishlistIdSet.has(productId)')],
  ['Wishlist persistence remains deferred and cross-tab aware', wishlistStore.includes('window.setTimeout') && wishlistStore.includes('}, 90)') && wishlistStore.includes("addEventListener('storage'")],
  ['product cards subscribe only to their own Wishlist state', storefront.includes('export const LuxuryProductCard = memo(') && storefront.includes('useWishlistItem(product.id)') && !storefront.includes('const {has, toggle} = useWishlist();')],
  ['storefront no longer imports Framer Motion for three simple reveals', !storefront.includes("from 'framer-motion'") && !storefront.includes('<motion.') && storefront.includes('tf565-enter-up') && storefront.includes('tf565-image-fade')],
  ['replacement animation stays on opacity and transform', storefrontCss.includes('@keyframes tf565-enter-up') && storefrontCss.includes('translate3d') && storefrontCss.includes('@keyframes tf565-image-fade')],
  ['fixed storefront layers no longer blur the page while scrolling', storefrontCss.includes('.lux-header') && storefrontCss.includes('.v28-newsletter-modal-backdrop') && storefrontCss.includes('.v23-privacy-banner') && storefrontCss.includes('backdrop-filter:none!important')],
  ['recent customer searches are device-local, capped and clearable', storefront.includes("const SEARCH_HISTORY_KEY = 'tf:search-history:v1'") && storefront.includes('MAX_RECENT_SEARCHES = 6') && storefront.includes('Tìm gần đây') && storefront.includes('Xóa lịch sử tìm kiếm')],
  ['recent-search chips have dedicated tablet/mobile styling', storefrontCss.includes('.tf565-search-history') && storefrontCss.includes('@media(max-width:700px)') && storefrontCss.includes('overflow-x:auto')],
  ['Admin can copy the current public product link', productEditor.includes('copyPublicLink') && productEditor.includes('navigator.clipboard?.writeText') && productEditor.includes('Sao chép link')],
  ['V0.56.5 storefront and Admin styles load after V0.56.4', storefront.indexOf("'./v565-storefront-performance.css'") > storefront.indexOf("'./v564-storefront-polish.css'") && adminShell.indexOf("'./v565-admin-performance.css'") > adminShell.indexOf("'./v564-admin-polish.css'" )],
  ['Admin overlay and copy-link polish are scoped', adminCss.includes('.tf-admin-v499') && adminCss.includes('.tf565-editor-copy-link') && adminCss.includes('backdrop-filter:none!important')],
  ['new visual motion respects reduced-motion preferences', storefrontCss.includes('@media(prefers-reduced-motion:reduce)') && adminCss.includes('@media(prefers-reduced-motion:reduce)')],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
console.log(`V0.56.5 performance and utility checks passed: ${checks.length}/${checks.length}`);
