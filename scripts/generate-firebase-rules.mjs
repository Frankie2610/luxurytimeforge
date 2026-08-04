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
const allowedRoles=new Set(['owner','admin','manager','staff','content']);
const ownerEmail=String(env.VITE_OWNER_EMAIL||'').trim().toLowerCase();
if(!ownerEmail){console.error('Không thể tạo Firebase Rules: cần VITE_OWNER_EMAIL trong .env.local để quản lý lời mời và phân quyền.');process.exit(1)}

const configuredRoles=new Map([[ownerEmail,'owner']]);
for(const email of split(env.VITE_ADMIN_EMAILS))if(email!==ownerEmail)configuredRoles.set(email,'admin');
for(const entry of String(env.VITE_ADMIN_ROLE_MAP||'').split(',').map(item=>item.trim()).filter(Boolean)){
  const[email,rawRole]=entry.split(':').map(value=>value.trim().toLowerCase());
  if(!email)continue;
  const role=allowedRoles.has(rawRole)?rawRole:'admin';
  configuredRoles.set(email,email===ownerEmail?'owner':role);
}

const escapeRule=value=>value.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const memberBase=`root.child('timeforge/adminMembers').child(auth.uid)`;
const googleMemberGate=`(auth.token.firebase.sign_in_provider != 'google.com' || ${memberBase}.child('allowGoogleSignIn').val() == true)`;
const envCondition=roles=>{
  const emails=[...configuredRoles.entries()].filter(([,role])=>roles.includes(role)).map(([email])=>{
    const emailRule=`auth.token.email == '${escapeRule(email)}'`;
    return email===ownerEmail?emailRule:`(${emailRule} && ${googleMemberGate})`;
  });
  return emails.length?`(auth.token.email != null && (${emails.join(' || ')}))`:'false';
};
const memberActive=`${memberBase}.child('status').val() == 'active' && ${googleMemberGate}`;

const roleExpr=roles=>roles.map(role=>`${memberBase}.child('role').val() == '${role}'`).join(' || ');
const condition=roles=>`auth != null && (${envCondition(roles)} || (${memberActive} && (${roleExpr(roles)})))`;
const replacements={
  '__ACTIVE_ADMIN_CONDITION__':condition(['owner','admin','manager','staff','content']),
  '__OWNER_CONDITION__':`auth != null && auth.token.email != null && auth.token.email == '${escapeRule(ownerEmail)}'`,
  '__TEAM_MANAGE_CONDITION__':condition(['owner','admin']),
  '__PRODUCTS_CONDITION__':condition(['owner','admin','manager','staff','content']),
  '__PRODUCTS_MANAGE_CONDITION__':condition(['owner','admin','manager']),
  '__ORDERS_CONDITION__':condition(['owner','admin','manager','staff']),
  '__ORDERS_MANAGE_CONDITION__':condition(['owner','admin','manager','staff']),
  '__CUSTOMERS_CONDITION__':condition(['owner','admin','manager']),
  '__CUSTOMERS_MANAGE_CONDITION__':condition(['owner','admin','manager']),
  '__MARKETING_MANAGE_CONDITION__':condition(['owner','admin','manager']),
  '__CONTENT_MANAGE_CONDITION__':condition(['owner','admin','manager','content']),
  '__STORE_MANAGE_CONDITION__':condition(['owner','admin','content']),
  '__SETTINGS_MANAGE_CONDITION__':condition(['owner','admin']),
};
let output=await readFile(resolve('firebase.rules.template.json'),'utf8');
for(const[key,value]of Object.entries(replacements))output=output.replaceAll(key,value);
const unresolved=output.match(/__[A-Z_]+__/g);
if(unresolved){console.error(`Firebase Rules còn placeholder chưa xử lý: ${[...new Set(unresolved)].join(', ')}`);process.exit(1)}
JSON.parse(output);
if(output.includes('auth != null && false')){
  console.error('Firebase Rules vẫn chứa điều kiện deny bootstrap. Kiểm tra lại VITE_OWNER_EMAIL và VITE_ADMIN_ROLE_MAP.');
  process.exit(1);
}
await writeFile(resolve('firebase.rules.json'),output+'\n');
console.log(`Đã tạo firebase.rules.json cho chủ sở hữu ${ownerEmail} và ${Math.max(0,configuredRoles.size-1)} tài khoản bootstrap.`);
console.log('Role trong VITE_ADMIN_ROLE_MAP được áp dụng cả ở giao diện và Firebase Rules.');
console.log('Các thành viên được mời được kiểm tra động tại timeforge/adminMembers/{uid}.');
