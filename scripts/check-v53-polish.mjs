import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const checks = [
  ['package version is 0.53.0', JSON.parse(read('package.json')).version === '0.53.0'],
  ['wishlist provider wraps the app', read('src/main.tsx').includes('<WishlistProvider><App/>')],
  ['wishlist route exists', read('src/App.tsx').includes('path="/wishlist"')],
  ['wishlist persists locally', read('src/wishlist.tsx').includes("tf:wishlist:v1")],
  ['storefront uses shared wishlist state', read('src/storefront-v10.tsx').includes('const {has, toggle} = useWishlist();')],
  ['storefront no longer imports legacy CSS', !read('src/storefront-v10.tsx').includes("import './legacy.css'")],
  ['storefront final visual layer loads last', read('src/storefront-v10.tsx').includes("import './v53-storefront-polish.css'")],
  ['admin final visual layer loads last', read('src/admin-shell-v16.tsx').includes("import './v53-admin-polish.css'")],
  ['operations priority center exists', read('src/operations.tsx').includes('tf53-priority-center')],
  ['responsive storefront rules exist', read('src/v53-storefront-polish.css').includes('@media(max-width:820px)') && read('src/v53-storefront-polish.css').includes('@media(max-width:600px)')],
  ['responsive admin rules exist', read('src/v53-admin-polish.css').includes('@media(max-width:760px)')],
  ['reduced-motion handling exists', read('src/v53-storefront-polish.css').includes('prefers-reduced-motion') && read('src/v53-admin-polish.css').includes('prefers-reduced-motion')],
  ['mobile inputs avoid browser zoom', read('src/v53-admin-polish.css').includes('font-size:16px') && read('src/v53-storefront-polish.css').includes('input{font-size:16px')],
  ['updated mobile browser theme color', read('index.html').includes('content="#1f4930"')],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log(`V0.53 polish checks passed: ${checks.length}/${checks.length}`);
