import{readFile,writeFile,access}from'node:fs/promises';
import{resolve}from'node:path';

async function loadEnvFile(path){
  try{await access(path)}catch{return{}}
  const text=await readFile(path,'utf8');
  const result={};
  for(const rawLine of text.split(/\r?\n/)){
    const line=rawLine.trim();
    if(!line||line.startsWith('#'))continue;
    const index=line.indexOf('=');
    if(index<1)continue;
    const key=line.slice(0,index).trim();
    let value=line.slice(index+1).trim();
    if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
    result[key]=value;
  }
  return result;
}
const local=await loadEnvFile(resolve('.env.local'));
const fallback=await loadEnvFile(resolve('.env'));
const env={...fallback,...local,...process.env};
const split=value=>String(value||'').split(',').map(item=>item.trim().toLowerCase()).filter(Boolean);
const roleEmails=String(env.VITE_ADMIN_ROLE_MAP||'').split(',').map(item=>item.split(':')[0]?.trim().toLowerCase()).filter(Boolean);
const emails=[String(env.VITE_OWNER_EMAIL||'').trim().toLowerCase(),...split(env.VITE_ADMIN_EMAILS),...roleEmails].filter(Boolean);
const unique=[...new Set(emails)];
if(!unique.length){
  console.error('Không thể tạo Firebase Rules: cần VITE_OWNER_EMAIL hoặc VITE_ADMIN_EMAILS trong .env.local.');
  process.exit(1);
}
const escapeRule=value=>value.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const emailCondition=unique.map(email=>`auth.token.email == '${escapeRule(email)}'`).join(' || ');
const condition=`auth != null && auth.token.email != null && (${emailCondition})`;
const template=await readFile(resolve('firebase.rules.template.json'),'utf8');
const output=template.replaceAll('__ADMIN_CONDITION__',condition);
JSON.parse(output);
await writeFile(resolve('firebase.rules.json'),output+'\n');
console.log(`Đã tạo firebase.rules.json cho ${unique.length} email quản trị:`);
for(const email of unique)console.log(`- ${email}`);
