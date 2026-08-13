import {readFileSync} from 'node:fs';

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const checkout=read('src/checkout-v11.tsx');
const layout=read('src/storefront-v10.tsx');
const blog=read('src/blog-v18.tsx');
const app=read('src/App.tsx');
const meta=read('src/meta-ads-v57.tsx');
const coreCss=read('src/v573-storefront-core.css');
const compareCss=read('src/v573-compare-polish.css');
const commerceCss=read('src/v573-commerce-polish.css');

const checks=[
  ['Cart can move an item to Wishlist',checkout.includes('tf573-save-later')&&checkout.includes('addToWishlist([productId])')],
  ['Checkout no longer imports framer-motion',!checkout.includes("from 'framer-motion'")],
  ['Checkout renders one focused header',layout.includes('{!isCheckoutRoute && <LuxuryHeader')&&layout.includes('{!isCheckoutRoute && <StorefrontUtilityDock')],
  ['Checkout logo supports Firebase aspect ratios',commerceCss.includes('.tf4912-checkout-logo>.tf-smart-image')&&commerceCss.includes('object-position:left center')],
  ['Blog reading assistant has progress and TOC',blog.includes('tf573-reading-progress')&&blog.includes('prepareArticleV573')&&blog.includes('Mục lục bài viết')],
  ['Customer Blog excludes Admin form dependencies',!blog.includes('react-hook-form')&&!blog.includes('@hookform/resolvers')&&app.includes("import('./admin-blogs-v18')")],
  ['Catalog Health is collapsed and filterable',meta.includes('tf573-catalog-toggle')&&meta.includes('catalogOpen')&&meta.includes('filteredCatalogIssues')],
  ['Funnel weak-point insight is present',meta.includes('funnelInsight')&&meta.includes('ĐIỂM CẦN ƯU TIÊN')],
  ['Compare uses a warm-neutral image well',compareCss.includes('mix-blend-mode:multiply')&&compareCss.includes('background:#eee9e1')],
  ['Compare dock clears utility buttons on tablet/mobile',coreCss.includes(':has(>.tf57-compare-dock)')&&coreCss.includes('bottom:max(9px,env(safe-area-inset-bottom))')],
];

const failed=checks.filter(([,ok])=>!ok);
checks.forEach(([label,ok])=>console.log(`${ok?'✓':'✗'} ${label}`));
if(failed.length){
  console.error(`\n${failed.length} V0.57.3 check(s) failed.`);
  process.exit(1);
}
console.log('\nV0.57.3 feature and regression checks passed.');
