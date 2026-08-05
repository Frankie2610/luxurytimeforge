import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = new URL('../', import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), 'utf8');
const exists = (file) => fs.existsSync(new URL(file, root));
const toDataUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'timeforge-v540-'));
const localTsc = fileURLToPath(new URL('../node_modules/typescript/bin/tsc', import.meta.url));
const hasLocalTsc = fs.existsSync(localTsc);
const compile = spawnSync(hasLocalTsc ? process.execPath : 'tsc', [
  ...(hasLocalTsc ? [localTsc] : []),
  '--pretty', 'false', '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'bundler',
  '--rootDir', 'src', '--outDir', fixtureDir, 'src/data-normalize.ts', 'src/workflow-normalize.ts',
], {cwd: fileURLToPath(root), encoding: 'utf8'});
if (compile.status !== 0) throw new Error(`Không thể biên dịch workflow fixture:\n${compile.stdout}${compile.stderr}`);
const dataModuleUrl = toDataUrl(fs.readFileSync(path.join(fixtureDir, 'data-normalize.js'), 'utf8'));
const workflowModule = fs.readFileSync(path.join(fixtureDir, 'workflow-normalize.js'), 'utf8').replace("from './data-normalize'", `from '${dataModuleUrl}'`);
const {normalizeWorkflowStore} = await import(toDataUrl(workflowModule));
fs.rmSync(fixtureDir, {recursive: true, force: true});

const legacy = normalizeWorkflowStore({
  events: {first: {id: 'event-1', orderId: 'order-1'}},
  fulfillments: undefined,
});
const complete = normalizeWorkflowStore({
  events: [],
  fulfillments: [],
  refunds: {first: {id: 'refund-1', orderId: 'order-1'}},
  returns: null,
});

const adminOrders = read('src/admin-sprint11.tsx');
const context = read('src/context.tsx');
const shell = read('src/admin-shell-v16.tsx');
const boundary = read('src/admin-route-boundary.tsx');
const recent = read('src/recently-viewed.ts');
const storefront = read('src/storefront-v10.tsx');
const adminCss = read('src/v540-admin-refinement.css');
const storefrontCss = read('src/v540-storefront-refinement.css');
const operations = read('src/operations.tsx');
const packageJson = JSON.parse(read('package.json'));
const [major, minor, patch] = packageJson.version.split('.').map(Number);
const preservesV540 = major > 0 || minor > 54 || (minor === 54 && patch >= 0);

const envLocal = exists('.env.local') ? read('.env.local') : '';
const demoLoginIsDisabled = !envLocal || envLocal.includes('VITE_ENABLE_DEMO_LOGIN=false');

const checks = [
  ['package version preserves the 0.54.0 baseline', preservesV540],
  ['legacy workflow always receives four arrays', ['events','fulfillments','refunds','returns'].every((key) => Array.isArray(legacy[key]))],
  ['Firebase map-shaped workflow values are accepted', legacy.events.length === 1 && complete.refunds.length === 1],
  ['filtering a missing legacy refund list no longer crashes', legacy.refunds.filter((item) => item.orderId === 'order-1').length === 0],
  ['order workflow reads and writes are normalized', adminOrders.includes('normalizeWorkflowStore(remote)') && adminOrders.includes('normalizeWorkflowStore(next)')],
  ['commerce order payloads are normalized centrally', context.includes('firebaseOrders=(value') && context.includes('normalizeOrders(load(') && context.includes('lines=asList<OrderLine>')],
  ['Admin order rows use real links', adminOrders.includes('to={`/admin/orders/${order.id}`}') && adminOrders.includes('aria-label={`Mở đơn hàng ${order.number}`}')],
  ['Admin order filters persist in the URL', adminOrders.includes('useSearchParams()') && adminOrders.includes("params.get('status')") && adminOrders.includes("params.get('payment')")],
  ['dashboard priority cards deep-link to filtered orders', operations.includes("'/admin/orders?status=open'") && operations.includes("'/admin/orders?payment=pending'")],
  ['Admin route recovery boundary is active', shell.includes('<AdminRouteBoundary key={location.pathname}>') && boundary.includes('componentDidCatch')],
  ['command search includes direct order results', read('src/admin-v9.tsx').includes("group:'Đơn hàng'") && read('src/admin-v9.tsx').includes('path:`/admin/orders/${order.id}`')],
  ['recently viewed history is local and bounded', recent.includes('tf.storefront.recently-viewed.v1') && recent.includes('const LIMIT = 8')],
  ['recently viewed UI is rendered on product pages', storefront.includes('tf54-recently-viewed') && storefront.includes('clearRecentlyViewed')],
  ['new visual CSS stays route scoped', !adminCss.includes('\n.v16-admin-content{') && storefrontCss.includes('.tf-storefront-v4912 .tf54-recently-viewed')],
  ['new customer and Admin CSS include mobile rules', adminCss.includes('@media(max-width:680px)') && storefrontCss.includes('@media(max-width:700px)')],
  ['Admin product imagery is lazy decoded', read('src/admin-v9.tsx').includes('loading="lazy" decoding="async"')],
  ['large generated preview directories are ignored by Vite watch', read('vite.config.ts').includes("'**/.sites-runtime/**'")],
  ['temporary preview authentication shim is absent', !exists('scripts/.preview-network-shim.cjs') && demoLoginIsDisabled],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
console.log(`V0.54.0 navigation and reliability checks passed: ${checks.length}/${checks.length}`);
