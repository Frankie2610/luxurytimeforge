import{access,readFile}from'node:fs/promises';
import{resolve}from'node:path';

async function readEnv(path){
  try{await access(path)}catch{return{}}
  const result={};
  for(const raw of(await readFile(path,'utf8')).split(/\r?\n/)){
    const line=raw.trim();if(!line||line.startsWith('#'))continue;
    const split=line.indexOf('=');if(split<1)continue;
    const key=line.slice(0,split).trim();let value=line.slice(split+1).trim();
    if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
    result[key]=value;
  }
  return result;
}

const env={...await readEnv(resolve('.env')),...await readEnv(resolve('.env.local')),...process.env};
const required=['PAYOS_CLIENT_ID','PAYOS_API_KEY','PAYOS_CHECKSUM_KEY','PUBLIC_SITE_URL','FIREBASE_DATABASE_AUTH'];
const missing=required.filter(key=>!String(env[key]||'').trim());
if(!String(env.FIREBASE_DATABASE_URL||env.VITE_FIREBASE_DATABASE_URL||'').trim())missing.push('FIREBASE_DATABASE_URL (hoặc VITE_FIREBASE_DATABASE_URL)');
if(missing.length){console.error(`PayOS chưa sẵn sàng:\n- thiếu ${missing.join('\n- thiếu ')}`);process.exit(1)}
try{
  const origin=new URL(env.PUBLIC_SITE_URL);
  if(!['https:','http:'].includes(origin.protocol))throw new Error();
  if(origin.pathname!=='/'||origin.search||origin.hash)console.warn('Cảnh báo: PUBLIC_SITE_URL chỉ nên chứa origin, không chứa path/query/hash.');
  if(origin.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(origin.hostname))console.warn('Cảnh báo: domain production nên dùng HTTPS.');
}catch{console.error('PUBLIC_SITE_URL không hợp lệ. Ví dụ: https://timeforge.vn');process.exit(1)}
if(required.some(key=>key.startsWith('PAYOS_')&&Object.keys(env).includes(`VITE_${key}`)))console.warn('Cảnh báo: không dùng VITE_ cho PayOS secret.');
console.log('PayOS server config hợp lệ.');
console.log(`Webhook cần đăng ký: ${String(env.PUBLIC_SITE_URL).replace(/\/$/,'')}/api/payments/webhook`);
console.log('Doctor chỉ kiểm tra cấu hình, không tạo giao dịch và không gọi API PayOS.');
