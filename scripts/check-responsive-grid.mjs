import{readFileSync}from'node:fs';

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const legacy=read('src/sprint14.css');
const storefront=read('src/storefront-v10.tsx');
const grid=read('src/v4936-mobile-product-grid.css');
const allCss=[legacy,read('src/v4912-storefront.css'),read('src/v4933-collection.css'),grid].join('\n');
const removedSelector='.tf-storefront-v4912 :where(.lux-home>.lux-section,.lux-content-page,.lux-collection-page)';

const checks=[
 ['selector padding global đã được xóa',!allCss.includes(removedSelector)],
 ['legacy dưới 420 px không còn ép một cột',!/@media\s*\(max-width:420px\)[\s\S]*?\.lux-product-grid\s*\{\s*grid-template-columns\s*:\s*1fr/.test(legacy)],
 ['breakpoint 366–520 px tồn tại',/@media\s*\(min-width:366px\)\s*and\s*\(max-width:520px\)/.test(grid)],
 ['breakpoint 366–520 px ép hai cột',/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/.test(grid)],
 ['365 px trở xuống mới về một cột',/@media\s*\(max-width:365px\)/.test(grid)&&/grid-template-columns:minmax\(0,1fr\)!important/.test(grid)],
 ['stylesheet responsive nằm sau toàn bộ CSS storefront cũ',storefront.lastIndexOf("import './v4936-mobile-product-grid.css'")>storefront.lastIndexOf("import './v573-storefront-core.css'")],
];

const failed=checks.filter(([,ok])=>!ok);
for(const[label,ok]of checks)console.log(`${ok?'OK':'FAIL'} - ${label}`);
if(failed.length)process.exitCode=1;
