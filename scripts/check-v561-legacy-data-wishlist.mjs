import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');
const toDataUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'timeforge-v561-'));
const compile = spawnSync(process.execPath, [
  fileURLToPath(new URL('../node_modules/typescript/bin/tsc', import.meta.url)),
  '--ignoreConfig', '--pretty', 'false', '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'bundler',
  '--rootDir', 'src', '--outDir', fixtureDir,
  'src/data-normalize.ts', 'src/utils.ts', 'src/product-data.ts', 'src/product-filter-data.ts', 'src/collection-utils.ts', 'src/theme.ts',
], {cwd: fileURLToPath(root), encoding: 'utf8'});
if (compile.status !== 0) throw new Error(`Không thể biên dịch legacy-data fixture:\n${compile.stdout}${compile.stderr}`);

const dataModuleUrl = toDataUrl(fs.readFileSync(path.join(fixtureDir, 'data-normalize.js'), 'utf8'));
const utilsModuleUrl = toDataUrl(fs.readFileSync(path.join(fixtureDir, 'utils.js'), 'utf8'));
const wireSharedModules = (source) => source
  .replace("from './data-normalize'", `from '${dataModuleUrl}'`)
  .replace("from './utils'", `from '${utilsModuleUrl}'`);
const productModuleUrl = toDataUrl(wireSharedModules(fs.readFileSync(path.join(fixtureDir, 'product-data.js'), 'utf8')));
const filterModuleUrl = toDataUrl(fs.readFileSync(path.join(fixtureDir, 'product-filter-data.js'), 'utf8')
  .replace("from './utils'", `from '${utilsModuleUrl}'`));
const collectionModuleUrl = toDataUrl(wireSharedModules(fs.readFileSync(path.join(fixtureDir, 'collection-utils.js'), 'utf8'))
  .replace("from './product-filter-data'", `from '${filterModuleUrl}'`));
const themeModuleUrl = toDataUrl(wireSharedModules(fs.readFileSync(path.join(fixtureDir, 'theme.js'), 'utf8')));

const [{productsFromFirebase}, {normalizeCollectionRecord}, {migrateTheme, normalizeTheme, normalizeThemeVersions}] = await Promise.all([
  import(productModuleUrl),
  import(collectionModuleUrl),
  import(themeModuleUrl),
]);
fs.rmSync(fixtureDir, {recursive: true, force: true});

const [legacyProduct] = productsFromFirebase([{
  id: 'legacy/unsafe.sku',
  sku: 'legacy/unsafe.sku',
  title: 'Legacy product',
  tags: 'archive, featured',
  images: 'https://cdn.example.com/legacy-product.jpg',
  variants: null,
  options: undefined,
  metafields: {old: {namespace: 'custom', key: 'era', value: 'legacy'}},
  price: '1250000',
  inventory: '2',
}]);
const legacyCollection = normalizeCollectionRecord({id: 'old-collection', title: 'Old collection', productIds: 'one,two', conditions: null});
const oldSectionMap = {
  lead: {id: 'lead', type: 'hero', visible: true, settings: {height: 420}, blocks: null},
};
const legacyThemeState = migrateTheme({
  draft: {name: 'Old draft', settings: null, templates: {home: {name: 'Home', sections: oldSectionMap}}},
  published: {name: 'Old published', settings: {}, templates: {home: {sections: oldSectionMap}}},
  versions: null,
});
const partialTheme = normalizeTheme({name: 'Partial modern theme', templates: {home: {sections: []}}});
const normalizedVersions = normalizeThemeVersions({old: {id: 'old', createdAt: '', note: '', theme: {templates: {}}}});
const templateKeys = ['home', 'product', 'collection', 'search', 'cart', 'page'];
const themeIsRenderSafe = (theme) => templateKeys.every((key) => Array.isArray(theme.templates?.[key]?.sections)
  && theme.templates[key].sections.length > 0
  && theme.templates[key].sections.every((section) => Array.isArray(section.blocks)));

const packageJson = JSON.parse(read('package.json'));
const [major, minor, patch] = packageJson.version.split('.').map(Number);
const preservesV561 = major > 0 || minor > 56 || (minor === 56 && patch >= 1);
const context = read('src/context.tsx');
const productEditor = read('src/product-editor-v39.tsx');
const onlineStore = read('src/online-store-v18.tsx');
const themeEditor = read('src/online-store-v19.tsx');
const wishlistPage = read('src/wishlist-page-v53.tsx');
const wishlistCss = read('src/v561-wishlist-hotfix.css');

const checks = [
  ['package version preserves the 0.56.1 baseline', preservesV561],
  ['V0.56.1 regression command is registered', packageJson.scripts?.['v561:check'] === 'node scripts/check-v561-legacy-data-wishlist.mjs'],
  ['legacy product arrays are safe to filter and map', ['images', 'tags', 'variants', 'options', 'metafields'].every((key) => Array.isArray(legacyProduct[key]))],
  ['legacy product keeps a usable default variant', legacyProduct.variants.length === 1 && legacyProduct.variants.map((variant) => variant.inventory).length === 1],
  ['legacy string media and tags survive normalization', legacyProduct.images[0]?.includes('legacy-product.jpg') && legacyProduct.tags.filter(Boolean).length === 2],
  ['invalid old SKU stays readable until explicit save validation', legacyProduct.id === 'legacy/unsafe.sku' && legacyProduct.title === 'Legacy product'],
  ['legacy collections always expose productIds and conditions arrays', legacyCollection.productIds.filter(Boolean).length === 2 && legacyCollection.conditions.filter(Boolean).length === 0],
  ['legacy draft and published themes have every renderable template', themeIsRenderSafe(legacyThemeState.draft) && themeIsRenderSafe(legacyThemeState.published)],
  ['partial modern themes receive missing templates and sections', themeIsRenderSafe(partialTheme)],
  ['legacy theme versions become a safe array of normalized themes', normalizedVersions.length === 1 && themeIsRenderSafe(normalizedVersions[0].theme)],
  ['Firebase products, collections and themes normalize centrally', context.includes('productsFromFirebase(value)') && context.includes('normalizeCollections(collectionResult.value)') && context.includes('normalizeTheme(publishedResult.value)') && context.includes('normalizeThemeVersions(versionResult.value)')],
  ['product editor has a second legacy record boundary', productEditor.includes('normalizeProductRecord(source, source.id)') && productEditor.includes('(collection.productIds || []).includes(product.id)')],
  ['Online Store and Theme Editor guard legacy version arrays', onlineStore.includes('const versions=themeState.versions || []') && themeEditor.includes('const themeVersions = themeState.versions || []')],
  ['Wishlist hotfix loads after earlier feature styles', wishlistPage.indexOf("'./v561-wishlist-hotfix.css'") > wishlistPage.indexOf("'./v560-wishlist-features.css'")],
  ['Wishlist product media is square, full-bleed and center-cropped', wishlistCss.includes('aspect-ratio:1') && wishlistCss.includes('padding:0!important') && wishlistCss.includes('object-fit:cover!important') && wishlistCss.includes('object-position:center!important')],
  ['mobile Wishlist uses two safe columns and a smaller title', wishlistCss.includes('grid-template-columns:repeat(2,minmax(0,1fr))') && wishlistCss.includes('.tf53-wishlist-hero h1{font-size:26px')],
  ['mobile Wishlist resets the former horizontal-card grid positions', wishlistCss.includes('grid-row:auto') && wishlistCss.includes('grid-column:auto') && wishlistCss.includes('min-height:0!important')],
  ['Wishlist cards retain offscreen rendering containment', wishlistCss.includes('content-visibility:auto') && wishlistCss.includes('contain-intrinsic-size:auto 286px')],
  ['hotfix styles avoid blur-heavy rendering effects', !wishlistCss.includes('backdrop-filter') && !wishlistCss.includes('filter:blur')],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log(`V0.56.1 legacy-data and Wishlist checks passed: ${checks.length}/${checks.length}`);
