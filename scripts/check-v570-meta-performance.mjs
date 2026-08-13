import fs from 'node:fs';

const root=new URL('../',import.meta.url);
const read=file=>fs.readFileSync(new URL(file,root),'utf8');
const packageJson=JSON.parse(read('package.json'));
const app=read('src/App.tsx');
const main=read('src/main.tsx');
const storefront=read('src/storefront-v10.tsx');
const finder=read('src/storefront-tools-v57.tsx');
const compare=read('src/compare-v57.tsx');
const featureCss=read('src/v570-storefront-features.css');
const controlsCss=read('src/v570-storefront-controls.css');
const metaAdmin=read('src/meta-ads-v57.tsx');
const metaPixel=read('src/meta-pixel-v57.tsx');
const metaCss=read('src/v570-meta-ads.css');
const integrations=read('src/integrations.ts');
const commerceEvents=read('src/commerce-events.ts');
const analyticsApi=read('api/analytics/events.js');
const rules=read('firebase.rules.template.json');
const images=read('src/image-utils.tsx');
const permissions=read('src/permissions.ts');

const checks=[
  ['package remains on the V0.57 release line',/^0\.57\.\d+$/.test(packageJson.version)],
  ['V0.57.0 check command is registered',packageJson.scripts?.['v570:check']==='node scripts/check-v570-meta-performance.mjs'],
  ['customer tools remain route-lazy',app.includes("lazy(()=>import('./storefront-tools-v57')")&&app.includes('path="/compare"')&&app.includes('path="/watch-finder"')],
  ['Meta Admin is route-lazy and permission protected',app.includes("lazy(()=>import('./meta-ads-v57')")&&app.includes('path="marketing/meta"')&&permissions.includes("startsWith('/admin/discounts')||pathname.startsWith('/admin/marketing')")],
  ['marketing configuration has its own least-privilege Firebase path',integrations.includes("timeforge/settings/marketing")&&rules.includes('"marketing"')&&rules.includes('".write": "__MARKETING_MANAGE_CONDITION__"')],
  ['Meta Pixel loads only after an enabled valid configuration',metaPixel.includes('settings.enabled&&validPixelId(settings.pixelId)')&&metaPixel.includes("script.src='https://connect.facebook.net/en_US/fbevents.js'")],
  ['five commerce conversions map to Meta standard events',metaPixel.includes("page_view:'PageView'")&&metaPixel.includes("product_view:'ViewContent'")&&metaPixel.includes("add_to_cart:'AddToCart'")&&metaPixel.includes("checkout_started:'InitiateCheckout'")&&metaPixel.includes("checkout_completed:'Purchase'")],
  ['Meta events carry catalog IDs and browser event IDs',metaPixel.includes('content_ids:ids')&&metaPixel.includes('{eventID:event.id}')],
  ['Admin provides Pixel health, UTM builder, catalog feed and campaign attribution',metaAdmin.includes('EVENT HEALTH')&&metaAdmin.includes('CAMPAIGN URL BUILDER')&&metaAdmin.includes('CATALOG HEALTH')&&metaAdmin.includes('ATTRIBUTION')],
  ['analytics storage is capped, cached and remotely batched',commerceEvents.includes('LOCAL_EVENT_LIMIT=600')&&commerceEvents.includes('cachedEvents')&&commerceEvents.includes('REMOTE_BATCH_LIMIT=12')&&commerceEvents.includes("addEventListener('pagehide'")],
  ['new campaign parameters refresh stale session attribution',commerceEvents.includes('hasCampaignSignal')&&commerceEvents.includes("'fbclid','gclid'")&&commerceEvents.includes('existing&&!hasCampaignSignal')],
  ['public analytics input is minimized and validated server-side',analyticsApi.includes('safeMetadata')&&analyticsApi.includes('60_000')&&analyticsApi.includes('allowedEvents')&&analyticsApi.includes('requestIsSameOrigin')],
  ['browser writes to analytics are denied by Firebase Rules',rules.includes('"analyticsEvents"')&&rules.includes('".write": false')],
  ['Shopify and Cloudinary media both receive responsive variants',images.includes("parsed.searchParams.set('width'")&&images.includes("parsed.hostname === 'cdn.shopify.com'")&&images.includes('optimizedImageSrcSet')],
  ['comparison is device-persistent, capped and external-store based',compare.includes("const KEY='tf.v57.compare-products'")&&compare.includes('const LIMIT=3')&&compare.includes('useSyncExternalStore')],
  ['comparison is available on cards, product detail and a responsive page',storefront.includes('tf57-card-compare')&&storefront.includes('tf57-pdp-compare')&&storefront.includes('<CompareDockV57')&&finder.includes('ComparePageV57')],
  ['watch finder uses four guided inputs and live catalog scoring',finder.includes('finderSteps')&&finder.includes('recipient:')&&finder.includes('budget:')&&finder.includes('style:')&&finder.includes('brand:')&&finder.includes('finderScore')],
  ['new customer tools report intent without blocking UI',finder.includes("trackCommerceEvent('compare_view'")&&finder.includes("trackCommerceEvent('watch_finder_completed'")],
  ['customer and Admin features include tablet/mobile boundaries',featureCss.includes('@media(max-width:980px)')&&featureCss.includes('@media(max-width:680px)')&&controlsCss.includes('@media(max-width:680px)')&&metaCss.includes('@media(max-width:1120px)')&&metaCss.includes('@media(max-width:720px)')],
  ['new feature motion honors reduced-motion preferences',featureCss.includes('@media(prefers-reduced-motion:reduce)')&&controlsCss.includes('@media(prefers-reduced-motion:reduce)')&&metaCss.includes('@media(prefers-reduced-motion:reduce)')],
];

let failed=0;
for(const[label,ok]of checks){console.log(`${ok?'PASS':'FAIL'} ${label}`);if(!ok)failed+=1}
if(failed)process.exit(1);
console.log(`V0.57.0 Meta, performance and responsive feature checks passed: ${checks.length}/${checks.length}`);
