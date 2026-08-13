import {readFileSync} from 'node:fs';

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const layout=read('src/storefront-v10.tsx');
const checkout=read('src/checkout-v11.tsx');
const contrast=read('src/v502-storefront-contrast.css');
const storefront=read('src/v575-storefront-polish.css');
const commerce=read('src/v575-commerce-polish.css');
const journal=read('src/v575-journal-polish.css');
const lightweightUi=read('src/storefront-ui-v575.tsx');
const blog=read('src/blog-v18.tsx');

const checks=[
  ['Checkout uses the exact global storefront header',layout.includes('<LuxuryHeader openCart={requestCart} />')&&!layout.includes('{!isCheckoutRoute && <LuxuryHeader')&&!checkout.includes('tf4912-checkout-header')],
  ['Checkout header is not hidden by the old CSS route rule',!contrast.includes('is-checkout-route > :is(.lux-announcement,.lux-header,.tf-brand-rail-v39)')],
  ['Checkout cart action navigates instead of opening an unavailable drawer',layout.includes("isCheckoutRoute ? navigate('/cart')")],
  ['Desktop navigation has a final exact 13px owner',storefront.includes('#tf-storefront-header nav.lux-main-nav>a')&&storefront.includes('font-size:13px!important')],
  ['366–520px has an authoritative two-card grid',storefront.includes('@media(min-width:366px) and (max-width:520px)')&&storefront.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important')],
  ['One-card product grid begins at 365px',storefront.includes('@media(max-width:365px)')&&storefront.includes('grid-template-columns:minmax(0,1fr)!important')],
  ['About mobile hero is width-safe and CTA is full width',storefront.includes('.tf4941-about-hero h1')&&storefront.includes('overflow-wrap:anywhere')&&storefront.includes('.tf4941-about-hero>div>a')&&storefront.includes('width:100%')],
  ['Customer purchase-confidence feature is available in cart and checkout',checkout.includes('<PurchaseConfidenceV575 surface="cart"/>')&&checkout.includes('<PurchaseConfidenceV575 surface="checkout"/>')&&checkout.includes('aria-expanded={open}')],
  ['Cart and checkout receive pills, cards and polished actions',commerce.includes('.tf575-purchase-pills')&&commerce.includes('.tf575-purchase-details')&&commerce.includes('.tf4927-checkout-cta')],
  ['Desktop article utility copy is never below 12px',journal.includes('@media(min-width:761px)')&&journal.includes('font-size:12px!important')&&blog.includes("import './v575-journal-polish.css'")],
  ['Static storefront no longer imports the shared heavy UI barrel',!layout.includes("from './ui'")&&!checkout.includes("from './ui'")&&layout.includes("from './storefront-ui-v575'")],
  ['Lightweight dialog retains Escape, focus trap and scroll lock',lightweightUi.includes("event.key==='Escape'")&&lightweightUi.includes("event.key!=='Tab'")&&lightweightUi.includes("document.body.style.overflow='hidden'")],
];

const failed=checks.filter(([,ok])=>!ok);
checks.forEach(([label,ok])=>console.log(`${ok?'✓':'✗'} ${label}`));
if(failed.length){
  console.error(`\n${failed.length} V0.57.5 check(s) failed.`);
  process.exit(1);
}
console.log('\nV0.57.5 storefront reliability and polish checks passed.');
