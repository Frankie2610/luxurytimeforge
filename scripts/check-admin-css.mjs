import{existsSync,readFileSync}from'node:fs';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const shell=read('src/admin-shell-v16.tsx'),finalCss=read('src/v650-admin-polish.css');
const imports=[...shell.matchAll(/import\s*['\"]\.\/(.+?\.css)['\"]/g)].map(m=>m[1]);
const checks=[
 ['mọi stylesheet Admin import đều tồn tại',imports.every(name=>existsSync(new URL(`../src/${name}`,import.meta.url)))],
 ['V0.65 là owner CSS cuối của Admin',imports.at(-1)==='v650-admin-polish.css'],
 ['Admin giữ owner chiều rộng an toàn',finalCss.includes('width:min(1320px,calc(100% - 40px))')&&finalCss.includes('min-width:0')],
 ['input/select/textarea có foreground rõ',finalCss.includes('-webkit-text-fill-color:#1f2c24!important')&&finalCss.includes('caret-color:var(--tf65-admin-green)!important')],
 ['file input có owner riêng',finalCss.includes('input[type=file]::file-selector-button')&&finalCss.includes('border:1px dashed #bdccc2!important')],
 ['mobile input chống auto zoom',/@media \(max-width:760px\)[\s\S]*font-size:16px!important/.test(finalCss)],
 ['sidebar dùng palette sáng V0.65',finalCss.includes('background:linear-gradient(180deg,#fbfdfb,#eef4ef)!important')],
];
const failed=checks.filter(([,ok])=>!ok);for(const[label,ok]of checks)console.log(`${ok?'OK':'FAIL'} - ${label}`);if(failed.length)process.exitCode=1;
