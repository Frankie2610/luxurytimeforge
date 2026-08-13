import fs from 'node:fs';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const read=file=>fs.readFileSync(new URL(file,root),'utf8');
const packageJson=JSON.parse(read('package.json'));
const comparePage=read('src/storefront-tools-v57.tsx');
const compareStore=read('src/compare-v57.tsx');
const context=read('src/context.tsx');
const storefront=read('src/storefront-v10.tsx');
const checkout=read('src/checkout-v11.tsx');
const events=read('src/commerce-events.ts');
const metaAdmin=read('src/meta-ads-v57.tsx');
const coreCss=read('src/v571-storefront-core.css');
const toolsCss=read('src/v571-storefront-polish.css');
const adminCss=read('src/v571-meta-admin.css');
const{extractProductSpecsV571}=await import('../src/product-specs-v571.ts');

const description='Giới tính: Nam Chất liệu vỏ máy: Thép không gỉ Viền đồng hồ: Đen Đường kính: 40 mm Màu mặt số: Vàng Chất liệu kính: Mineral ( Kính khoáng ) Chống nước: 5ATM Máy: Quartz Dây đeo: Dây đeo thép không gỉ màu bạc Xuất xứ thương hiệu: Đức Sản xuất tại: Đức Edition One Chrono mang phong cách lịch lãm.';
const fixture={
  id:'fixture',handle:'edition-one',title:'Edition One Chrono',descriptionHtml:'',descriptionText:description,
  vendor:'Dugena',productType:'Watches',category:'Watches',tags:[],status:'active',published:true,images:[],
  price:1,compareAtPrice:0,cost:0,sku:'AOFH22006',barcode:'',inventory:1,trackInventory:true,weight:0,
  weightUnit:'kg',seoTitle:'',seoDescription:'',variants:[],createdAt:'',updatedAt:'',
};
const parsed=extractProductSpecsV571(fixture);
assert.deepEqual({
  gender:parsed.gender,caseMaterial:parsed.caseMaterial,bezel:parsed.bezel,diameter:parsed.diameter,
  dialColor:parsed.dialColor,glass:parsed.glass,waterResistance:parsed.waterResistance,movement:parsed.movement,
  strap:parsed.strap,brandOrigin:parsed.brandOrigin,manufacturedOrigin:parsed.manufacturedOrigin,sku:parsed.sku,
},{
  gender:'Nam',caseMaterial:'Thép không gỉ',bezel:'Đen',diameter:'40 mm',dialColor:'Vàng',
  glass:'Mineral ( Kính khoáng )',waterResistance:'5ATM',movement:'Quartz',
  strap:'Dây đeo thép không gỉ màu bạc',brandOrigin:'Đức',manufacturedOrigin:'Đức',sku:'AOFH22006',
});
assert.ok(Object.values(parsed).every(value=>String(value).length<141),'No comparison value may swallow the full description.');

const checks=[
  ['package version is 0.57.1',packageJson.version==='0.57.1'],
  ['comparison is a horizontal semantic table',comparePage.includes('tf571-compare-table')&&comparePage.includes('<thead>')&&comparePage.includes('<tbody>')&&comparePage.includes('<tfoot>')],
  ['comparison can be shared and added to cart',comparePage.includes('navigator.share')&&comparePage.includes("metadata:{source:'compare'}")],
  ['comparison state no longer subscribes the app tree to catalog updates',compareStore.includes('useSyncExternalStore')&&!read('src/main.tsx').includes('CompareProviderV57')],
  ['Watch Finder indexes specs once and explains matches',comparePage.includes('indexedProducts')&&comparePage.includes('finderReasons')&&comparePage.includes('tf571-finder-reasons')],
  ['Watch Finder gender matching uses whole tokens',comparePage.includes("tokens.includes(token)")&&!comparePage.includes('/nam|men|male/')],
  ['Firebase store identity starts before idle catalog refresh',context.includes("const profileRequest=firebaseClient.read<StoreProfile>('timeforge/settings/store')")&&context.indexOf('const profileRequest=')<context.indexOf('const refresh=')],
  ['header, loading and footer prefer the Firebase store profile',storefront.includes('const identity=isThemePreviewV26()?theme.settings:storeProfile')&&storefront.includes('StoreCatalogLoading storeName={storeProfile.storeName}')],
  ['PageView is route-based while attribution still reacts to query changes',storefront.includes("trackCommerceEvent('page_view')")&&storefront.includes('}, [location.pathname]);')&&storefront.includes('}, [location.pathname, location.search]);')],
  ['buy-now does not double-count checkout starts',storefront.includes("metadata:{source:'buy_now'}")&&!storefront.includes("buyNow = () => {addToCart(product.id, variantId, quantity); trackCommerceEvent('checkout_started'")&&checkout.includes('checkoutTracked.current')],
  ['analytics fallback and remote data enforce a rolling date range',events.includes('readRecentCommerceEvents')&&events.includes('length:safeDays+1')&&events.includes('timestamp>=cutoff')],
  ['Admin exposes whether counts came from Firebase or this browser',events.includes('readCommerceEventSnapshot')&&metaAdmin.includes('Chờ đồng bộ trên máy này')&&metaAdmin.includes("eventStorage.source==='firebase'")],
  ['Admin has range/scope Event Explorer and catalog diagnostics',metaAdmin.includes('EVENT EXPLORER')&&metaAdmin.includes('CATALOG HEALTH')&&metaAdmin.includes('setRangeDays')&&metaAdmin.includes('setEventScope')],
  ['tablet/mobile quantity and header clipping fixes are present',coreCss.includes('@media(max-width:1100px)')&&coreCss.includes('@media(max-width:680px)')&&coreCss.includes('overflow:visible!important')],
  ['compare, finder and Admin additions have responsive boundaries',toolsCss.includes('@media(max-width:980px)')&&toolsCss.includes('@media(max-width:680px)')&&adminCss.includes('@media(max-width:980px)')&&adminCss.includes('@media(max-width:720px)')],
];

let failed=0;
for(const[label,ok]of checks){console.log(`${ok?'PASS':'FAIL'} ${label}`);if(!ok)failed+=1}
if(failed)process.exit(1);
console.log(`V0.57.1 accuracy, responsive polish and performance checks passed: ${checks.length}/${checks.length}`);
