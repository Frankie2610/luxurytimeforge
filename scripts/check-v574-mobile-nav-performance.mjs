import {readFileSync} from 'node:fs';

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const layout=read('src/storefront-v10.tsx');
const grid=read('src/v4936-mobile-product-grid.css');
const polish=read('src/v574-storefront-polish.css');

const checks=[
  ['365px is the one-column cutoff',grid.includes('@media (max-width:365px)')&&polish.includes('@media(max-width:365px)')],
  ['366–520px keeps two product columns',grid.includes('@media (min-width:366px) and (max-width:520px)')&&polish.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important')],
  ['under-380 typography is compacted',polish.includes('@media(max-width:379px)')&&polish.includes('.tf-product-info-v4918>a{font-size:10.5px!important}')],
  ['announcement uses a solid red treatment',polish.includes('background:#b4232f!important')&&polish.includes('color:#fff!important')],
  ['desktop main navigation is exactly 13px',polish.includes('#tf-storefront-header .lux-main-nav>a')&&polish.includes('font-size:13px!important')],
  ['journal cards are route- and viewport-deferred',!layout.includes("import {BlogCardsV18} from './blog-home-cards-v18'")&&layout.includes('LazyBlogCardsV18 = lazy')&&layout.includes('IntersectionObserver')&&layout.includes("rootMargin: '480px 0px'")],
  ['deferred journal reserves layout space',polish.includes('.tf574-blog-skeleton')&&polish.includes('min-height:430px')],
  ['responsive owner loads after historical storefront CSS',layout.lastIndexOf("import './v4936-mobile-product-grid.css'")>layout.lastIndexOf("import './v573-storefront-core.css'")&&layout.lastIndexOf("import './v574-storefront-polish.css'")>layout.lastIndexOf("import './v4936-mobile-product-grid.css'")],
];

const failed=checks.filter(([,ok])=>!ok);
checks.forEach(([label,ok])=>console.log(`${ok?'✓':'✗'} ${label}`));
if(failed.length){
  console.error(`\n${failed.length} V0.57.4 check(s) failed.`);
  process.exit(1);
}
console.log('\nV0.57.4 mobile, navigation and performance checks passed.');
