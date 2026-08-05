import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');

const packageJson = JSON.parse(read('package.json'));
const adminShell = read('src/admin-shell-v16.tsx');
const adminCss = read('src/v563-admin-scroll-polish.css');
const productEditor = read('src/product-editor-v39.tsx');
const onlineStore = read('src/online-store-v18.tsx');
const storefront = read('src/storefront-v10.tsx');
const menuCss = read('src/v563-storefront-menu.css');
const wishlist = read('src/wishlist-page-v53.tsx');
const wishlistCss = read('src/v563-wishlist-control.css');

const checks = [
  ['package version is 0.56.3', packageJson.version === '0.56.3'],
  ['V0.56.3 regression command is registered', packageJson.scripts?.['v563:check'] === 'node scripts/check-v563-scroll-menu-polish.mjs'],
  ['final Admin scroll polish loads after V0.56.0 features', adminShell.indexOf("'./v563-admin-scroll-polish.css'") > adminShell.indexOf("'./v560-admin-features.css'")],
  ['Product Editor route class is applied before paint', productEditor.includes('useLayoutEffect') && productEditor.includes("classList.add('tf-product-editor-route-v4915')")],
  ['Product Editor uses one document scrollbar', adminCss.includes('html.tf-product-editor-route-v4915') && adminCss.includes('body.tf-product-editor-route-v4915') && adminCss.includes('position:static!important') && adminCss.includes('max-height:none!important') && adminCss.includes('overflow:visible!important')],
  ['Online Store overview route is isolated before paint', onlineStore.includes('useLayoutEffect') && onlineStore.includes("tf-online-store-overview-route-v563")],
  ['Online Store previews cannot create visible nested scroll or pointer work', (onlineStore.match(/scrolling="no"/g) || []).length === 2 && adminCss.includes('.tf39-os-preview-stage iframe') && adminCss.includes('pointer-events:none')],
  ['Online Store overview uses document flow instead of page-inside-page scrolling', adminCss.includes('body.tf-online-store-overview-route-v563 .tf39-os-page') && adminCss.includes('height:auto!important') && adminCss.includes('scrollbar-gutter:auto!important')],
  ['Theme Editor secondary panels retain scroll but hide extra rails', adminCss.includes('.v19-tree-scroll,.v19-inspector,.v19-global-settings,.v19-app-embeds') && adminCss.includes('scrollbar-width:none') && adminCss.includes('::-webkit-scrollbar')],
  ['Wishlist V0.56.3 control loads after V0.56.2 refinement', wishlist.indexOf("'./v563-wishlist-control.css'") > wishlist.indexOf("'./v562-wishlist-refinement.css'")],
  ['Wishlist selected value scales 11px, 10.5px and 10px', wishlistCss.includes('font-size:11px!important') && wishlistCss.includes('font-size:10.5px!important') && wishlistCss.includes('font-size:10px!important')],
  ['Wishlist native option sizes remain independently readable', wishlistCss.includes('select option') && wishlistCss.includes('font-size:12px') && wishlistCss.includes('@media(max-width:1024px)') && wishlistCss.includes('@media(max-width:640px)')],
  ['Menu locks root and body before paint', storefront.includes('useLayoutEffect(() =>') && storefront.includes("document.documentElement.style.overflow = 'hidden'") && storefront.includes('scrollbarWidth')],
  ['Menu shell and drawer use the synchronized V0.56.3 classes', storefront.includes('tf563-menu-shell') && storefront.includes('tf563-mobile-menu') && !storefront.includes('lux-mobile-shell tf562-overlay-enter')],
  ['Menu overlay avoids blur and tablet animation delay', menuCss.includes('backdrop-filter:none!important') && menuCss.includes('@media(min-width:641px)') && menuCss.includes('animation:none!important')],
  ['Menu state is accessible and includes order tracking', storefront.includes('aria-expanded={mobileOpen}') && storefront.includes('aria-controls="tf-storefront-navigation-drawer"') && storefront.includes('to="/track-order"')],
  ['Product quick navigation covers the main long-form sections', productEditor.includes('tf563-product-jump') && productEditor.includes('#tf-product-info') && productEditor.includes('#tf-product-media') && productEditor.includes('#tf-product-variants') && productEditor.includes('#tf-product-seo')],
  ['Product save shortcut and unsaved-leave protection are active', productEditor.includes("event.key.toLowerCase() === 's'") && productEditor.includes("addEventListener('beforeunload'") && productEditor.includes('dirtyRef.current')],
  ['Dense editor typography is increased only in scoped surfaces', adminCss.includes('.tf-product-editor-v4915 .tf39-field>span{font-size:12px}') && adminCss.includes('.tf-theme-editor-v499 .v19-field :is(input,select,textarea){font-size:11px}')],
  ['new interaction CSS includes reduced-motion handling', menuCss.includes('@media(prefers-reduced-motion:reduce)') && adminCss.includes('@media(prefers-reduced-motion:reduce)')],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
console.log(`V0.56.3 scroll, menu and polish checks passed: ${checks.length}/${checks.length}`);
