import{existsSync,readFileSync}from'node:fs';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const storefront=read('src/storefront-v10.tsx'),grid=read('src/v4936-mobile-product-grid.css'),polish=read('src/v650-storefront-polish.css');
const imports=[...storefront.matchAll(/import\s*['"]\.\/(.+?\.css)['"]/g)].map(m=>m[1]);
const checks=[
 ['mọi stylesheet storefront import đều tồn tại',imports.every(name=>existsSync(new URL(`../src/${name}`,import.meta.url)))],
 ['breakpoint 366–520 px tồn tại',/@media\s*\(min-width:366px\)\s*and\s*\(max-width:520px\)/.test(grid)],
 ['366–520 px giữ hai cột',/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/.test(grid)],
 ['365 px trở xuống mới về một cột',/@media\s*\(max-width:365px\)/.test(grid)&&/grid-template-columns:minmax\(0,1fr\)!important/.test(grid)],
 ['owner grid responsive nằm sau core cũ',storefront.indexOf("import './v4936-mobile-product-grid.css';")>storefront.indexOf("import './v573-storefront-core.css';")],
 ['V0.65.3 không override spacing toàn storefront',!polish.includes(':is(.lux-section')&&!polish.includes('.tf-editorial-content-v39{padding-block')],
 ['storefront pills cũ đã bỏ khỏi markup',!storefront.includes('tf582-storefront-pills')],
];
const failed=checks.filter(([,ok])=>!ok);for(const[label,ok]of checks)console.log(`${ok?'OK':'FAIL'} - ${label}`);if(failed.length)process.exitCode=1;
