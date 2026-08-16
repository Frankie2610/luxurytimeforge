import{existsSync,readFileSync}from'node:fs';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const data=read('src/content-pages-v23.ts'),admin=read('src/content-pages-admin-v23.tsx'),storefront=read('src/storefront-v10.tsx'),editor=read('src/online-store-v19.tsx'),shell=read('src/admin-shell-v16.tsx'),themeCss=read('src/v50-theme-editor.css'),polish=read('src/v650-storefront-polish.css');
const checks=[
 ['Giới thiệu thuộc danh sách trang quản lý',data.includes("slug:'about'")&&data.includes("value==='about'")],
 ['Bảo hành thuộc nội dung storefront quản lý',data.includes("slug:'warranty'")||storefront.includes("'warranty'")],
 ['Admin mở mặc định tab Giới thiệu',admin.includes("useState<ManagedContentPageSlug>('about')")],
 ['Storefront render nội dung trang đã quản lý',storefront.includes('managedPage.sections.map')],
 ['Theme Editor có frame khởi động trước khi mount',editor.includes('requestAnimationFrame')&&editor.includes('tf-theme-editor-launch-v4941')],
 ['Theme Editor CSS runtime tồn tại',editor.includes("import './v50-theme-editor.css';")&&existsSync(new URL('../src/v50-theme-editor.css',import.meta.url))&&themeCss.includes('.tf-theme-editor-v499')&&themeCss.includes('.v19-workspace')],
 ['Admin shell không bị tháo khi mở editor',!shell.includes('standaloneThemeEditor')],
 ['Warranty V0.65 có title scale mới',polish.includes('font-size:clamp(34px,4vw,48px)!important')],
];
const failed=checks.filter(([,ok])=>!ok);for(const[label,ok]of checks)console.log(`${ok?'OK':'FAIL'} - ${label}`);if(failed.length)process.exitCode=1;
