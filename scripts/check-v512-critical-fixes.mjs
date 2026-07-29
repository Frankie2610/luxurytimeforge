import fs from 'node:fs';

const storefront = fs.readFileSync('src/storefront-v10.tsx', 'utf8');
const storefrontCss = fs.readFileSync('src/v512-storefront-corrections.css', 'utf8');
const adminCss = fs.readFileSync('src/v512-admin-contrast.css', 'utf8');
const adminShell = fs.readFileSync('src/admin-shell-v16.tsx', 'utf8');

const checks = [
  ['filter options use buttons', storefront.includes('className={`tf512-filter-option')],
  ['stock filter uses button', storefront.includes('className={`tf512-stock-option')],
  ['no deferred catalog filtering in drawer', !storefront.includes('useDeferredValue')],
  ['drawer closes before grid filtering', storefront.includes('window.requestAnimationFrame(() => applyFilters(next))')],
  ['facet values normalized', storefront.includes('normalizeCollectionFacetValue')],
  ['facet rendering capped', storefront.includes('MAX_VISIBLE_FILTER_OPTIONS = 80')],
  ['storefront correction imported last', storefront.includes("import './v512-storefront-corrections.css';")],
  ['desktop rule starts when nav is visible', storefrontCss.includes('@media(min-width:821px)')],
  ['desktop header forced to 13px', storefrontCss.includes('font-size:13px!important')],
  ['admin correction imported last', adminShell.includes("import './v512-admin-contrast.css';")],
  ['bulk action contrast defined', adminCss.includes('.v9-bulk-bar>div:last-child>button.danger:hover')],
  ['admin user trigger contrast defined', adminCss.includes('.v16-user-trigger[data-state="open"]')],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
if (failed.length) process.exit(1);
console.log(`V51.2 critical checks passed: ${checks.length}/${checks.length}`);
