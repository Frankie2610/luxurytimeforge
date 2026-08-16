import{existsSync,readFileSync}from'node:fs';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const shell=read('src/admin-shell-v16.tsx'),baseline=read('src/v620-admin-polish.css'),feature=read('src/v650-admin-polish.css'),bridge=read('src/admin-v4938.css');
const imports=[...shell.matchAll(/import\s*['"]\.\/(.+?\.css)['"]/g)].map(m=>m[1]);
const bridgeImports=[...bridge.matchAll(/@import\s+["']\.\/(.+?\.css)["']/g)].map(m=>m[1]);
const checks=[
 ['mọi stylesheet Admin import đều tồn tại',imports.every(name=>existsSync(new URL(`../src/${name}`,import.meta.url)))],
 ['Admin legacy owner đã phục hồi',imports.includes('legacy.css')&&imports.includes('admin-v4938.css')],
 ['mọi CSS con của admin-v4938 tồn tại',bridgeImports.every(name=>existsSync(new URL(`../src/${name}`,import.meta.url)))],
 ['V0.64 giữ owner chiều rộng an toàn',baseline.includes('width:min(1320px,calc(100% - 40px))')&&baseline.includes('min-width:0')],
 ['input/select/textarea có foreground và focus rõ',baseline.includes('color:var(--tf62-admin-text)')&&baseline.includes('caret-color:var(--tf62-admin-primary)')],
 ['file input có owner riêng',baseline.includes('input[type="file"]::file-selector-button')&&baseline.includes('border-style:dashed')],
 ['mobile input chống auto zoom',/@media \(max-width:640px\)[\s\S]*font-size:16px!important/.test(baseline)],
 ['V0.65 Admin CSS chỉ còn style feature SEO',feature.includes('.tf65-settings-seo')&&!feature.includes('.v16-admin-sidebar')&&!feature.includes('.v16-admin-page')],
];
const failed=checks.filter(([,ok])=>!ok);for(const[label,ok]of checks)console.log(`${ok?'OK':'FAIL'} - ${label}`);if(failed.length)process.exitCode=1;
