import fs from 'node:fs'

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
const exists = (file) => fs.existsSync(new URL(`../${file}`, import.meta.url))
const storefront = read('src/storefront-v10.tsx')
const admin = read('src/admin-shell-v16.tsx')
const storefrontAdditions = read('src/v531-storefront-additions.css')
const adminDashboard = read('src/v531-admin-dashboard.css')
const [major, minor, patch] = JSON.parse(read('package.json')).version.split('.').map(Number)
const preservesV531 = major > 0 || minor > 53 || (minor === 53 && patch >= 1)

const checks = [
  ['package version preserves the 0.53.1 baseline', preservesV531],
  ['wishlist provider wraps the app', read('src/main.tsx').includes('<WishlistProvider><App/>')],
  ['wishlist route remains available', read('src/App.tsx').includes('path="/wishlist"')],
  ['wishlist remains persistent', read('src/wishlist.tsx').includes('tf:wishlist:v1')],
  ['storefront compatibility CSS restored', storefront.startsWith("import './legacy.css';")],
  ['broad storefront override removed', !exists('src/v53-storefront-polish.css') && !storefront.includes('v53-storefront-polish.css')],
  ['broad Admin override removed', !exists('src/v53-admin-polish.css') && !admin.includes('v53-admin-polish.css')],
  ['new storefront CSS is scoped to added controls', storefront.includes("import './v531-storefront-additions.css'") && !storefrontAdditions.includes('.lux-product-grid{') && !storefrontAdditions.includes('.lux-header{')],
  ['new Admin CSS is dashboard-only', admin.includes("import './v531-admin-dashboard.css'") && !adminDashboard.includes('.v16-admin-sidebar') && !adminDashboard.includes('.v16-admin-content')],
  ['added visual CSS stays below 12 KB', Buffer.byteLength(storefrontAdditions) + Buffer.byteLength(adminDashboard) < 12_000],
  ['compact mobile header cannot overflow from wishlist', storefrontAdditions.includes('@media(max-width:600px)') && storefrontAdditions.includes('display:none!important')],
  ['dashboard has tablet and mobile layouts', ['@media(max-width:1180px)', '@media(max-width:900px)', '@media(max-width:680px)', '@media(max-width:430px)'].every((rule) => adminDashboard.includes(rule))],
  ['dashboard protects shrinkable grid children', adminDashboard.includes('min-width:0') && adminDashboard.includes('minmax(0,1fr)')],
  ['Atelier defaults restored', read('src/theme.ts').includes("accent: '#7a3f25'") && read('src/theme.ts').includes("background: '#f7f4ef'")],
  ['operations priority center retained', read('src/operations.tsx').includes('tf53-priority-center')],
  ['reduced-motion handling retained', storefrontAdditions.includes('prefers-reduced-motion') && adminDashboard.includes('prefers-reduced-motion')],
  ['preview-compatible Vite host configuration retained', read('vite.config.ts').includes("allowedHosts:['timeforge.local','terminal.local']")],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
  if (!ok) failed += 1
}

if (failed) process.exit(1)
console.log(`V0.53.1 layout stability checks passed: ${checks.length}/${checks.length}`)
