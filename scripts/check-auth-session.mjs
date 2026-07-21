import{readFileSync}from'node:fs';

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const auth=read('src/auth.tsx');
const editor=read('src/online-store-v19.tsx');
const commerce=read('src/commerce-events.ts');
const observer=auth.slice(auth.indexOf('useEffect(()=>{'),auth.indexOf('const assertReady'));

const checks=[
  ['iframe Theme Editor được nhận diện',auth.includes("window.self!==window.top&&params.get('theme_preview')==='1'&&params.get('tf_editor')==='1'")],
  ['iframe không khởi động trạng thái auth loading',auth.includes('useState(firebaseAppEnabled&&!previewFrame)')],
  ['iframe không đăng ký Firebase auth observer',auth.includes('if(previewFrame||!firebaseAppEnabled){setLoading(false);return}')],
  ['observer nền không tự signOut',!observer.includes('signOut(auth)')],
  ['preview URL luôn có cờ cô lập auth',editor.includes("theme_preview=1&tf_editor=1")],
  ['iframe editor không ghi analytics giả',commerce.includes('if(isThemeEditorCommercePreview())return undefined;')],
];

const failed=checks.filter(([,ok])=>!ok);
for(const[label,ok]of checks)console.log(`${ok?'OK':'FAIL'} - ${label}`);
if(failed.length)process.exitCode=1;
