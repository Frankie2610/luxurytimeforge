import{access,readFile}from'node:fs/promises';
import{resolve}from'node:path';

async function loadEnv(path){
  try{await access(path)}catch{return{}}
  const text=await readFile(path,'utf8');
  const out={};
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim();if(!line||line.startsWith('#'))continue;
    const i=line.indexOf('=');if(i<1)continue;
    let value=line.slice(i+1).trim();
    if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
    out[line.slice(0,i).trim()]=value;
  }
  return out;
}

const env={...await loadEnv(resolve('.env')),...await loadEnv(resolve('.env.local')),...process.env};
const owner=String(env.VITE_OWNER_EMAIL||'').trim().toLowerCase();
const project=String(env.VITE_FIREBASE_PROJECT_ID||'').trim();
const databaseUrl=String(env.VITE_FIREBASE_DATABASE_URL||'').trim();
const problems=[];
if(!owner)problems.push('Thiếu VITE_OWNER_EMAIL trong .env.local.');
if(!project)problems.push('Thiếu VITE_FIREBASE_PROJECT_ID trong .env.local.');
if(!databaseUrl)problems.push('Thiếu VITE_FIREBASE_DATABASE_URL trong .env.local.');

let rules='';
try{rules=await readFile(resolve('firebase.rules.json'),'utf8');JSON.parse(rules)}catch{problems.push('firebase.rules.json không tồn tại hoặc JSON không hợp lệ.');}
if(rules){
  if(rules.includes('auth != null && false'))problems.push('firebase.rules.json vẫn là bản deny-by-default.');
  if(owner&&!rules.toLowerCase().includes(owner))problems.push(`Rules chưa chứa email chủ sở hữu ${owner}.`);
  for(const node of ['adminMembers','adminInvitations','themes','customers','orders'])if(!rules.includes(`"${node}"`))problems.push(`Rules thiếu node ${node}.`);
}

try{
  const rc=JSON.parse(await readFile(resolve('.firebaserc'),'utf8'));
  const active=String(rc?.projects?.default||'').trim();
  if(active&&project&&active!==project)problems.push(`.firebaserc đang trỏ tới ${active}, khác VITE_FIREBASE_PROJECT_ID=${project}.`);
}catch{}

if(problems.length){
  console.error('Firebase Rules Doctor phát hiện vấn đề:');
  for(const item of problems)console.error(`- ${item}`);
  console.error('\nChạy theo thứ tự:');
  console.error('1. corepack.cmd pnpm run firebase:rules:generate');
  console.error('2. corepack.cmd pnpm run firebase:rules:check');
  console.error('3. corepack.cmd pnpm dlx firebase-tools use');
  console.error('4. corepack.cmd pnpm run firebase:rules:deploy');
  process.exit(1);
}
console.log(`Firebase Rules Doctor: OK`);
console.log(`- Owner: ${owner}`);
console.log(`- Project: ${project}`);
console.log(`- Database: ${databaseUrl}`);
console.log('- adminMembers/adminInvitations và dữ liệu Admin đã có rule được generate.');
