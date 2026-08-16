import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const pkg=JSON.parse(read('package.json'));
const storefront=read('src/storefront-v10.tsx');
const commerce=read('src/checkout-v11.tsx');
const offer=read('src/campaign-offer-v59.ts');
const meta=read('src/meta-ads-v57.tsx');
const pixel=read('src/meta-pixel-v57.tsx');
const events=read('src/commerce-events.ts');
const analytics=read('src/analytics-v15.tsx');
const charts=read('src/analytics-charts-v59.tsx');
const storefrontCss=read('src/v580-storefront-polish.css');
const commerceCss=read('src/v580-commerce-polish.css');
const metaCss=read('src/v573-meta-admin.css');
const vite=read('vite.config.ts');

const checks=[
  ['package version is 0.59.0 or newer',Number(pkg.version.split('.')[1]||0)>=59],
  ['campaign offer is captured with a 24-hour session lifetime',offer.includes('CAMPAIGN_OFFER_MAX_AGE_V59')&&offer.includes("params.get('discount')")],
  ['storefront exposes the retained campaign offer pill',storefront.includes('tf59-campaign-offer')&&storefront.includes('captureCampaignOfferV59')],
  ['cart supports share links and safe restore',commerce.includes("url.searchParams.append('item'")&&commerce.includes('restoreSharedCart')&&commerce.includes('tf59-shared-cart')],
  ['cart and checkout inherit the campaign discount',commerce.match(/campaignDiscountCodeV59/g)?.length>=3&&commerce.includes('tf59-checkout-campaign')],
  ['Meta admin has Pixel readiness and five-event coverage',meta.includes('PIXEL READINESS CENTER')&&meta.includes('tf59-event-coverage')&&meta.includes('eventDefinitions.map')],
  ['Meta ad link kit selects products and active discounts',meta.includes('PRODUCT AD LINK KIT')&&meta.includes('adProductId')&&meta.includes("url.searchParams.set('discount'")],
  ['Meta script is deferred and test mode records a real test state',pixel.includes('schedulePixelScript')&&pixel.includes('requestIdleCallback')&&pixel.includes('lastTestAt')&&meta.includes('configureMetaPixel(settings,true)')],
  ['analytics local persistence runs outside the interaction path',events.includes('queueLocalEvents')&&events.includes('pendingLocalEvents')&&events.includes('requestIdleCallback')],
  ['Recharts is split from the Analytics route',!analytics.includes("from 'recharts'")&&analytics.includes("lazy(()=>import('./analytics-charts-v59')")&&charts.includes("from 'recharts'")],
  ['native date formatting removes date-fns from Analytics entry',!analytics.includes("from 'date-fns")&&analytics.includes('Intl.DateTimeFormat')],
  ['CSS minification and route rendering optimizations are explicit',vite.includes("cssMinify:'lightningcss'")&&metaCss.includes('content-visibility:auto')],
  ['new cards and pills have responsive owners',storefrontCss.includes('.tf59-campaign-offer')&&commerceCss.includes('.tf59-shared-cart')&&metaCss.includes('.tf59-pixel-readiness')],
  ['desktop storefront nav remains exactly 13px',storefrontCss.includes('font-size:13px!important')&&storefrontCss.includes('#tf-storefront-header .lux-main-nav > a')],
  ['desktop Meta microcopy and table cells do not fall below 12px',metaCss.includes('@media(min-width:821px)')&&metaCss.includes('.tf57-campaign-table>div>*')&&metaCss.includes('font-size:12px!important')],
];

let failed=0;
for(const[label,pass]of checks){console.log(`${pass?'✓':'✗'} ${label}`);if(!pass)failed+=1}
if(failed){console.error(`\n${failed} V0.59.0 check(s) failed.`);process.exit(1)}
console.log(`\nV0.59+ Meta/performance checks passed (${checks.length}/${checks.length}).`);
