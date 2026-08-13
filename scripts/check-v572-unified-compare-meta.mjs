import fs from 'node:fs';

const root=new URL('../',import.meta.url);
const read=file=>fs.readFileSync(new URL(file,root),'utf8');
const packageJson=JSON.parse(read('package.json'));
const main=read('src/main.tsx');
const wishlist=read('src/wishlist-page-v53.tsx');
const compareStore=read('src/compare-v57.tsx');
const comparePage=read('src/storefront-tools-v57.tsx');
const storefront=read('src/storefront-v10.tsx');
const commerceEvents=read('src/commerce-events.ts');
const metaAdmin=read('src/meta-ads-v57.tsx');
const wishlistCss=read('src/v560-wishlist-features.css');
const featureCss=read('src/v570-storefront-features.css');
const coreCss=read('src/v572-storefront-core.css');
const toolsCss=read('src/v572-storefront-tools.css');
const metaCss=read('src/v572-meta-admin.css');

const checks=[
  ['package version preserves the V0.57.2 baseline',/^0\.57\.(?:[2-9]|[1-9]\d+)$/.test(packageJson.version)],
  ['V0.57.2 regression command is registered',packageJson.scripts?.['v572:check']==='node scripts/check-v572-unified-compare-meta.mjs'],
  ['Wishlist uses the shared comparison store without local modal state',wishlist.includes('useCompareV57')&&!wishlist.includes('compareIds')&&!wishlist.includes('compareOpen')],
  ['only the shared comparison storage key remains',compareStore.includes("const KEY='tf.v57.compare-products'")&&!wishlist.includes('MAX_COMPARE_ITEMS')],
  ['floating comparison dock can close and stays off the compare route',compareStore.includes('tf57-compare-dock-close')&&compareStore.includes("location.pathname==='/compare'")],
  ['compare page keeps semantic horizontal rows and can filter differences',comparePage.includes('tf571-compare-table')&&comparePage.includes('differencesOnly')&&comparePage.includes('Chỉ hiện điểm khác')],
  ['compare mobile copy and actions have a dedicated compact layout',toolsCss.includes('tf572-compare-copy-mobile')&&toolsCss.includes('@media(max-width:680px)')&&toolsCss.includes('grid-template-columns:none')===false],
  ['PDP mobile controls expose compact labels and a wrapped tray',storefront.includes('tf572-pdp-control-label')&&coreCss.includes('flex-wrap:wrap')&&coreCss.includes('@media(max-width:680px)')],
  ['Admin supports 7, 14, 30 and All time',metaAdmin.includes("[7,14,30,'all']")&&commerceEvents.includes("CommerceEventRange=number|'all'")],
  ['All-time Firebase reads run only through the explicit root branch',commerceEvents.includes('if(allTime)')&&commerceEvents.includes("read<Record<string,Record<string,CommerceEvent>>>('timeforge/analyticsEvents')")],
  ['Event Explorer starts at five rows and progressively reveals more',metaAdmin.includes('useState(5)')&&metaAdmin.includes('visibleEvents')&&metaAdmin.includes('value+20')],
  ['rapid range changes cannot be overwritten by stale analytics reads',metaAdmin.includes('eventRequestRef')&&metaAdmin.includes('requestId!==eventRequestRef.current')],
  ['Admin includes the new conversion funnel',metaAdmin.includes('tf572-conversion-funnel')&&metaAdmin.includes('funnelSteps')&&metaCss.includes('.tf572-conversion-funnel')],
  ['Admin and storefront additions include tablet/mobile boundaries',metaCss.includes('@media(max-width:1120px)')&&metaCss.includes('@media(max-width:720px)')&&toolsCss.includes('@media(max-width:980px)')],
  ['legacy comparison modal and grid CSS were removed',!wishlistCss.includes('tf56-compare-modal')&&!wishlistCss.includes('tf56-compare-dock')&&!featureCss.includes('tf57-compare-grid')],
  ['comparison module is no longer eagerly imported by the app entry',!main.includes("import'./compare-v57'")],
];

let failed=0;
for(const[label,ok]of checks){console.log(`${ok?'PASS':'FAIL'} ${label}`);if(!ok)failed+=1}
if(failed)process.exit(1);
console.log(`V0.57.2 unified comparison, Meta Admin and responsive polish checks passed: ${checks.length}/${checks.length}`);
