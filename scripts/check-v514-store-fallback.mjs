import fs from 'node:fs';

const read=(file)=>fs.readFileSync(file,'utf8');
const checks=[];
const check=(label,condition)=>checks.push({label,condition:Boolean(condition)});
const profile=read('src/store-profile.ts');
const context=read('src/context.tsx');
const storefront=read('src/storefront-v10.tsx');
const admin=read('src/admin.tsx');
const pkg=JSON.parse(read('package.json'));

check('Exact fallback store name exists',profile.includes("DEFAULT_STORE_NAME='Luxury TimeForge'"));
check('Current static logo is the fallback',profile.includes("DEFAULT_STORE_LOGO='/luxury-timeforge-logo.svg'"));
check('Current favicon is the fallback icon',profile.includes("DEFAULT_STORE_ICON='/favicon.svg'"));
check('Blank Firebase name falls back but blank logo remains removable',profile.includes('storeName:value?.storeName==null?resolveStoreName(fallback.storeName):resolveStoreName(value.storeName)')&&profile.includes('logoImage:value?.logoImage==null?resolveCustomStoreLogo(fallback.logoImage):resolveCustomStoreLogo(value.logoImage)'));
check('Firebase profile uses published/default fallback instead of stale local identity',context.includes('firebaseIdentityFallback=published?storeProfileFromTheme(published):DEFAULT_STORE_PROFILE'));
check('Missing Firebase profile and theme reset identity to defaults',context.includes("profileResult.status==='fulfilled'&&publishedResult.status==='fulfilled'?DEFAULT_STORE_PROFILE:null"));
check('Header uses exact resolved Firebase/default name',storefront.includes('const storeName = resolveStoreName(theme.settings.storeName)'));
check('Header uses current logo when custom Firebase logo is absent',storefront.includes('const logoSource = customLogo ?')&&storefront.includes(': DEFAULT_STORE_LOGO'));
check('Browser icons reset to current defaults after custom logo is removed',storefront.includes('const resolvedIcon = resolveStoreIcon(theme.settings.logoImage)')&&storefront.includes('const resolvedLogo = resolveStoreLogo(theme.settings.logoImage)')&&!storefront.includes('if (!logo) return;'));
check('Admin logo preview shows fallback without storing it as custom URL',admin.includes('storeProfile.logoImage || DEFAULT_STORE_LOGO')&&admin.includes('profile.logoImage || DEFAULT_STORE_LOGO'));
check('Package keeps V51.4 fallback in later releases',Number(pkg.version.split('.')[1])>=51);

for(const item of checks)console.log(`${item.condition?'PASS':'FAIL'}  ${item.label}`);
const failed=checks.filter(item=>!item.condition);
if(failed.length){console.error(`\n${failed.length} check(s) failed.`);process.exit(1)}
console.log(`\n${checks.length}/${checks.length} V51.4 checks passed.`);
