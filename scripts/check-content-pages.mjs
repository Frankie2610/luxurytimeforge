import{readFileSync}from'node:fs';

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const data=read('src/content-pages-v23.ts');
const admin=read('src/content-pages-admin-v23.tsx');
const storefront=read('src/storefront-v10.tsx');
const editor=read('src/online-store-v19.tsx');
const shell=read('src/admin-shell-v16.tsx');
const themeCss=read('src/v499-theme-editor.css');

const checks=[
  ['Giới thiệu thuộc danh sách trang quản lý',data.includes("slug:'about'")&&data.includes("value==='about'")],
  ['Admin mở mặc định tab Giới thiệu',admin.includes("useState<ManagedContentPageSlug>('about')")],
  ['Storefront render nội dung Giới thiệu đã quản lý',storefront.includes("slug === 'about'&&managedPage")&&storefront.includes('managedPage.sections.map')],
  ['Theme Editor có frame khởi động trước khi mount',editor.includes('requestAnimationFrame')&&editor.includes('tf-theme-editor-launch-v4941')],
  ['Admin shell không bị tháo khi mở editor',!shell.includes('standaloneThemeEditor')],
  ['Theme Editor phủ cố định trên Admin shell',themeCss.includes('position:fixed;z-index:500;inset:0')],
];

const failed=checks.filter(([,ok])=>!ok);
for(const[label,ok]of checks)console.log(`${ok?'OK':'FAIL'} - ${label}`);
if(failed.length)process.exitCode=1;
