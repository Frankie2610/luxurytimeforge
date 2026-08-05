import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');

const packageJson = JSON.parse(read('package.json'));
const storefront = read('src/storefront-v10.tsx');
const imageUtils = read('src/image-utils.tsx');
const storefrontCss = read('src/v566-storefront-polish.css');
const adminShell = read('src/admin-shell-v16.tsx');
const sprint16 = read('src/sprint16.css');
const checkoutCss = [
  read('src/v502-storefront-contrast.css'),
  read('src/v504-commerce.css'),
  read('src/v504-storefront-final.css'),
  storefrontCss,
].join('\n');

const footerStart = storefront.indexOf('function LuxuryFooter()');
const footerEnd = storefront.indexOf('function StoreCatalogLoading', footerStart);
const footerSource = storefront.slice(footerStart, footerEnd);

const checks = [
  ['package version is 0.56.7', packageJson.version === '0.56.7'],
  ['V0.56.7 check command is registered', packageJson.scripts?.['v567:check'] === 'node scripts/check-v567-footer-performance.mjs'],
  ['footer retains the logo mark without rendering its internal name', footerSource.includes('<LuxuryLogo') && footerSource.includes('showName={false}')],
  ['footer logo loading priority follows header versus below-fold use', storefront.includes("loading={showName ? 'eager' : 'lazy'}") && storefront.includes("fetchPriority={showName ? 'high' : 'low'}")],
  ['footer renders one editable shop-name line', footerSource.includes('tf564-footer-store-name') && footerSource.includes('showStoreDescription')],
  ['duplicated description is suppressed case-insensitively', footerSource.includes("localeCompare(storeName,undefined,{sensitivity:'base'})")],
  ['footer logo and dynamic name use the corrected two-column layout', storefrontCss.includes('grid-template-columns:68px minmax(0,1fr)!important') && storefrontCss.includes('grid-row:1/3!important')],
  ['footer name is black, larger and extra bold', storefrontCss.includes('color:#111!important') && storefrontCss.includes('font-size:clamp(27px,2.4vw,33px)!important') && storefrontCss.includes('font-weight:950!important')],
  ['checkout styling uses explicit route classes instead of broad root :has selectors', storefront.includes("isCheckoutRoute ? 'is-checkout-route'") && !checkoutCss.includes(':has(.tf4912-checkout')],
  ['responsive Cloudinary srcsets are generated centrally', imageUtils.includes('export function optimizedImageSrcSet') && imageUtils.includes("source.includes('/image/upload/')")],
  ['hero, editorial and collection media use responsive sources', storefront.includes('srcSet={optimizedImageSrcSet(heroImage') && storefront.includes('sizes="(max-width: 800px) 100vw, 50vw"') && storefront.includes('tf4933-collection-banner-media')],
  ['product-family lookup is cached by catalog references', storefront.includes('productFamilyIndexCache') && storefront.includes('getProductFamilyIndex(productGroups, products).get(product.id)')],
  ['product-group resolution uses indexed ID and SKU lookup', storefront.includes('const productsById=new Map') && storefront.includes('const productsBySku=new Map')],
  ['Admin replaces body :has with a lifecycle-managed class', adminShell.includes("document.body.classList.add('tf-admin-mounted')") && sprint16.includes('body.tf-admin-mounted') && !sprint16.includes('body:has(.v16-admin-shell)')],
  ['Admin hover prefetch is delayed and cancellable', adminShell.includes('scheduleAdminRoutePrefetch') && adminShell.includes('window.setTimeout') && adminShell.includes('onPointerLeave={cancelAdminRoutePrefetch}')],
  ['avoidable Admin search :has selector is removed', !read('src/v550-admin-polish.css').includes(':not(:has(.tf55-search-clear))')],
  ['deferred storefront media declares dimensions and metadata preload', storefront.includes('preload="metadata"') && storefront.includes('width="1800" height="1000"') && storefront.includes('width="240" height="240" loading="lazy" decoding="async"')],
  ['new footer remains responsive', storefrontCss.includes('grid-template-columns:52px minmax(0,1fr)!important') && storefrontCss.includes('font-size:22px!important')],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
console.log(`V0.56.7 footer correction and performance checks passed: ${checks.length}/${checks.length}`);
