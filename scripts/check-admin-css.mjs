import {readdirSync,readFileSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';

const root=new URL('..',import.meta.url).pathname;
const src=join(root,'src');
const entry='admin-v4938.css';
const ordered=[
  'v499-admin.css',
  'v4917-admin-catalog.css',
  'v4921-admin-operations.css',
  'v4922-admin-customers.css',
  'v4923-admin-content.css',
  'v4925-admin-resources.css',
  'v4915-product-editor.css',
  'v4917-team.css',
  'v499-theme-editor.css',
];

const walk=(dir)=>readdirSync(dir).flatMap(name=>{
  const path=join(dir,name);
  return statSync(path).isDirectory()?walk(path):[path];
});

const errors=[];
const entrySource=readFileSync(join(src,entry),'utf8');
let cursor=-1;
for(const css of ordered){
  const token=`@import "./${css}";`;
  const index=entrySource.indexOf(token);
  if(index<0)errors.push(`${entry} thiếu ${token}`);
  else if(index<cursor)errors.push(`${css} sai thứ tự trong ${entry}`);
  cursor=index;
}

for(const file of walk(src).filter(path=>/\.(?:ts|tsx)$/.test(path))){
  const source=readFileSync(file,'utf8');
  for(const css of ordered){
    const direct=new RegExp(`["']\\./${css.replaceAll('.','\\.')}["']`);
    if(direct.test(source))errors.push(`${relative(root,file)} import trực tiếp ${css}`);
  }
}

const shell=readFileSync(join(src,'admin-shell-v16.tsx'),'utf8');
if(!shell.includes(`import './${entry}'`))errors.push('Admin shell chưa sở hữu CSS entry duy nhất.');

if(errors.length){
  console.error('Admin CSS cascade chưa sạch:');
  errors.forEach(error=>console.error(`- ${error}`));
  process.exit(1);
}

console.log('OK - Admin dùng một CSS entry duy nhất');
console.log('OK - thứ tự stylesheet Admin cố định');
console.log('OK - route lazy không còn import trực tiếp CSS Admin');
