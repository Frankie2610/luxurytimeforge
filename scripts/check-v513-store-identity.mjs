import fs from 'node:fs';

const read=(file)=>fs.readFileSync(file,'utf8');
const checks=[];
const check=(label,condition)=>checks.push({label,condition:Boolean(condition)});
const admin=read('src/admin.tsx');
const context=read('src/context.tsx');
const storefront=read('src/storefront-v10.tsx');
const storeCss=read('src/v513-storefront-enhancements.css');
const adminCss=read('src/v513-store-profile.css');
const types=read('src/types.ts');
const rules=JSON.parse(read('firebase.rules.template.json'));
const pkg=JSON.parse(read('package.json'));

check('StoreProfile contains logoImage',/interface StoreProfile\{[^}]*logoImage:string/.test(types));
check('Admin uses device file input',admin.includes('type="file"')&&admin.includes('Chọn ảnh từ thiết bị'));
check('Admin uploads logo to Cloudinary on save',admin.includes('uploadCloudinaryImage(logoFile, "shop/logo")'));
check('Admin uploader uses dedicated classes',admin.includes('tf513-logo-uploader')&&adminCss.includes('.tf513-logo-choose'));
check('Admin uploader does not use inline style',!admin.slice(admin.indexOf('className="tf513-logo-uploader"'),admin.indexOf('</section>',admin.indexOf('className="tf513-logo-uploader"'))).includes('style='));
check('Context reads public store profile',context.includes("firebaseClient.read<StoreProfile>('timeforge/settings/store')"));
check('Context writes profile and both themes atomically',context.includes("'timeforge/settings/store':nextProfile")&&context.includes("'timeforge/themes/draft':nextDraft")&&context.includes("'timeforge/themes/published':nextPublished"));
check('Firebase rule allows public store read',rules.rules.timeforge.settings.store['.read']===true);
check('Firebase rule restricts store write',rules.rules.timeforge.settings.store['.write']==='__STORE_MANAGE_CONDITION__');
check('Header logo uses Firebase-backed logoImage',storefront.includes('settings.logoImage')&&storefront.includes('tf-store-logo-image-v513'));
check('Favicon is updated from logoImage',storefront.includes('link[rel="icon"]')&&storefront.includes('touchHref'));
check('Desktop header has final ID selectors',storeCss.includes('#tf-storefront-header .lux-main-nav>a')&&storeCss.includes('font-size:13px!important'));
check('Desktop header avoids runtime style mutation',!storefront.includes("style.setProperty('font-size', '13px', 'important')"));
check('Requested editorial badges share green treatment',storeCss.includes('.tf-journal-v4912')&&storeCss.includes('.tf-related-v4916')&&storeCss.includes('.tf-search-results-v498')&&storeCss.includes('.v27-search-hero>small'));
check('Payment marks are smaller',storeCss.includes('height:42px')&&storeCss.includes('.tf509-payment-marks'));
check('V51.3 stylesheet is imported last',storefront.indexOf("import './v513-storefront-enhancements.css';")>storefront.indexOf("import './v512-storefront-corrections.css';"));
check('Package keeps V51.3 identity features in later releases',Number(pkg.version.split('.')[1])>=51);

for(const item of checks)console.log(`${item.condition?'PASS':'FAIL'}  ${item.label}`);
const failed=checks.filter(item=>!item.condition);
if(failed.length){console.error(`\n${failed.length} check(s) failed.`);process.exit(1)}
console.log(`\n${checks.length}/${checks.length} V51.3 checks passed.`);
