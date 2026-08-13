import {readFileSync} from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const storefront = read('src/storefront-v10.tsx');
const checkout = read('src/checkout-v11.tsx');
const compare = read('src/storefront-tools-v57.tsx');
const wishlist = read('src/wishlist-page-v53.tsx');
const journal = read('src/blog-v18.tsx');
const storefrontCss = read('src/v576-storefront-readability.css');
const commerceCss = read('src/v576-commerce-polish.css');
const compareCss = read('src/v576-compare-polish.css');

const checks = [
  ['storefront readability is final in the core cascade', storefront.includes("import './v576-storefront-readability.css';")],
  ['commerce polish is final in checkout cascade', checkout.includes("import './v576-commerce-polish.css';")],
  ['compare polish is final in the compare route', compare.includes("import './v576-compare-polish.css';")],
  ['wishlist has route-local readability', wishlist.includes("import './v576-wishlist-readability.css';")],
  ['journal has route-local readability', journal.includes("import './v576-journal-readability.css';")],
  ['cart exposes a semantic three-step journey', checkout.includes('className="tf576-cart-steps"') && checkout.includes('aria-label="Tiến trình mua hàng"')],
  ['compare explains the horizontal table with useful pills', compare.includes('className="tf576-compare-pills"') && compare.includes('Cùng một hàng')],
  ['366–520 product grid remains two columns', storefrontCss.includes('@media(min-width:681px)') && read('src/v575-storefront-polish.css').includes('@media(min-width:366px) and (max-width:520px)')],
  ['mobile brand rail owns its full card width', storefrontCss.includes('.tf-brand-rail-inner-v39') && storefrontCss.includes('width:calc(100% - 20px)!important') && storefrontCss.includes('overflow-x:auto!important')],
  ['mobile checkout action stays in document flow', commerceCss.includes('position:static!important') && commerceCss.includes('.tf4912-mobile-place-order')],
  ['checkout inputs have visible focus treatment', commerceCss.includes('.tf4912-fields input:focus') && commerceCss.includes('0 0 0 4px')],
  ['comparison count classes are static so production CSS keeps them', compare.includes("'count-3'") && compare.includes("'count-2'") && compare.includes("'count-1'")],
  ['comparison preserves a three-product horizontal table', compareCss.includes('.tf571-compare-table.count-3{min-width:820px}')],
  ['comparison mobile text floor is readable', compareCss.includes('font-size:11.5px;line-height:1.5')],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
if (failed.length) {
  console.error(`\n${failed.length} V0.57.6 check(s) failed.`);
  process.exit(1);
}
console.log(`\nV0.57.6 storefront polish checks passed (${checks.length}/${checks.length}).`);
