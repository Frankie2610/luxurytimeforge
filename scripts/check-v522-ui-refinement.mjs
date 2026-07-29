import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const storefront = read('src/storefront-v10.tsx');
const blog = read('src/blog-v18.tsx');
const admin = read('src/admin-shell-v16.tsx');
const css = read('src/v522-ui-refinement.css');
const pkg = JSON.parse(read('package.json'));

const checks = [
  ['package keeps V0.52.2 refinements in later releases', Number(pkg.version.split('.')[1]) > 52 || (Number(pkg.version.split('.')[1]) === 52 && Number(pkg.version.split('.')[2]) >= 2)],
  ['storefront imports final CSS', storefront.includes("import './v522-ui-refinement.css';")],
  ['blog imports final CSS', blog.includes("import './v522-ui-refinement.css';")],
  ['admin imports final CSS', admin.includes("import './v522-ui-refinement.css';")],
  ['logo and name always share lockup', storefront.includes('tf522-logo-lockup') && storefront.includes('<b>{storeName}</b>')],
  ['desktop name is white 26px', css.includes('color: #fff !important;') && css.includes('font-size: 26px !important;')],
  ['hero reduced to 64 percent', storefront.includes("height || 680) * .64") && storefront.includes("height || 360) * .64")],
  ['brand rail left column widened', css.includes('grid-template-columns: 245px minmax(0,1fr) !important;')],
  ['client stories top spacing reduced', css.includes('.v27-testimonials') && css.includes('padding-top: clamp(28px, 3.8vw, 54px) !important;')],
  ['PDP bottom spacing reduced', css.includes('padding-bottom: clamp(28px, 3.2vw, 46px) !important;')],
  ['PDP policy margin halved', css.includes('margin-top: clamp(27px, 3vw, 41px) !important;')],
  ['article body increased', css.includes('font-size: 19px !important;')],
  ['article aside labels are 12px', css.includes('.tf4922-article-body > aside > span') && css.includes('font-size: 12px !important;')],
  ['article banner constrained', css.includes('width: min(100%, 1080px);') && css.includes('aspect-ratio: 16 / 8.4 !important;')],
  ['admin topbar uses full row', css.includes('grid-template-columns: auto minmax(320px, 1fr) auto !important;')],
  ['admin buttons polished', css.includes('.tf-button--primary,.v10-primary-button') && css.includes('.tf-button--secondary,.v10-secondary-button')],
  ['offscreen rendering optimized', css.includes('content-visibility: auto;') && css.includes('contain-intrinsic-size: auto 720px;')],
  ['duplicate journal image not priority', !blog.includes('width={1400} height={900} priority')],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log(`V0.52.2 checks passed: ${checks.length}/${checks.length}`);
