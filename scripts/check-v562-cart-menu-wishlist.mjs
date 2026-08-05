import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');

const packageJson = JSON.parse(read('package.json'));
const context = read('src/context.tsx');
const storefront = read('src/storefront-v10.tsx');
const storefrontCss = read('src/v562-storefront-interactions.css');
const checkout = read('src/checkout-v11.tsx');
const cartCss = read('src/v562-cart-performance.css');
const wishlist = read('src/wishlist-page-v53.tsx');
const wishlistCss = read('src/v562-wishlist-refinement.css');
const [major, minor, patch] = packageJson.version.split('.').map(Number);
const preservesV562 = major > 0 || minor > 56 || (minor === 56 && patch >= 2);

const checks = [
  ['package version preserves the 0.56.2 baseline', preservesV562],
  ['V0.56.2 regression command is registered', packageJson.scripts?.['v562:check'] === 'node scripts/check-v562-cart-menu-wishlist.mjs'],
  ['Wishlist refinement loads after the legacy media hotfix', wishlist.indexOf("'./v562-wishlist-refinement.css'") > wishlist.indexOf("'./v561-wishlist-hotfix.css'")],
  ['Wishlist sort is exactly 12px desktop', wishlistCss.includes('font-size:12px!important') && wishlistCss.includes('select option{font-size:12px')],
  ['Wishlist sort scales to 11px tablet and 10px mobile', wishlistCss.includes('font-size:11px!important') && wishlistCss.includes('font-size:10px!important') && wishlistCss.includes('@media(max-width:1024px)') && wishlistCss.includes('@media(max-width:640px)')],
  ['Wishlist select has a native-reset, custom chevron and focus ring', wishlistCss.includes('appearance:none') && wishlistCss.includes('.tf55-wishlist-sort::after') && wishlistCss.includes('.tf55-wishlist-sort:focus-within')],
  ['Wishlist product media removes wrapper and image padding', wishlistCss.includes('.tf53-wishlist-media>.tf-smart-image>img') && wishlistCss.includes('padding:0!important') && wishlistCss.includes('object-fit:cover!important')],
  ['Wishlist responsive image hint follows the two-column mobile grid', wishlist.includes('(max-width: 640px) calc(50vw - 18px)')],
  ['cart state and stable cart actions use dedicated contexts', context.includes('const CartStateC=createContext<CartLine[]|null>(null)') && context.includes('const CartActionsC=createContext<CartActions|null>(null)') && context.includes('export const useCartState') && context.includes('export const useCartActions')],
  ['main commerce context no longer publishes cart state', !context.match(/const value=useMemo\(\(\)=>\(\{[^}]*\bcart\b/)],
  ['storefront cart consumers use the isolated hooks', storefront.includes('const cart = useCartState()') && storefront.includes('const {updateCart} = useCartActions()') && storefront.includes('const {addToCart} = useCartActions()')],
  ['cart and mobile drawers avoid spring/layout animation work', !storefront.includes("transition={{type: 'spring'") && (storefront.includes('tf562-mobile-menu-enter') || storefront.includes('tf563-mobile-menu')) && storefront.includes('tf562-cart-drawer-enter')],
  ['drawer effects stay on opacity and transform without blur', storefrontCss.includes('@keyframes tf562-overlay-in') && storefrontCss.includes('translate3d') && storefrontCss.includes('backdrop-filter:none!important') && !storefrontCss.includes('blur(')],
  ['drawer images are right-sized and lazy decoded', storefront.includes("optimizedImage(productImage(product), 320, 320, 'fit')") && storefront.includes('loading="lazy" fetchPriority="low" decoding="async"')],
  ['drawer product lookup and totals are memoized', storefront.includes('const productById = useMemo(() => new Map') && storefront.includes('const total = useMemo(() => items.reduce')],
  ['cart page removed per-line Framer layout measurement', !checkout.includes('<motion.article layout') && checkout.includes('<article key={`${product.id}-${line.variantId}`} className="tf4912-cart-line">')],
  ['cart rows and media are centered and paint-contained', cartCss.includes('align-items:center!important') && cartCss.includes('place-items:center!important') && cartCss.includes('contain:layout paint style')],
  ['new interaction styles include reduced-motion guards', storefrontCss.includes('@media(prefers-reduced-motion:reduce)') && cartCss.includes('@media(prefers-reduced-motion:reduce)') && wishlistCss.includes('@media(prefers-reduced-motion:reduce)')],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log(`V0.56.2 cart, menu and Wishlist checks passed: ${checks.length}/${checks.length}`);
