import{readFile}from'node:fs/promises';
import{resolve}from'node:path';

const path=resolve('firebase.rules.json');
const text=await readFile(path,'utf8');
JSON.parse(text);
const problems=[];
if(/__[A-Z_]+__/.test(text))problems.push('còn placeholder chưa được thay thế');
if(text.includes('auth != null && false'))problems.push('vẫn là bản deny-by-default chưa generate theo email chủ sở hữu');
for(const required of ['adminMembers','adminInvitations','products','orders','collections','themes','blogPosts','contentPages']){
  if(!text.includes(`"${required}"`))problems.push(`thiếu node ${required}`);
}
if(problems.length){
  console.error('Firebase Rules chưa sẵn sàng deploy:');
  for(const problem of problems)console.error(`- ${problem}`);
  console.error('Chạy: corepack.cmd pnpm run firebase:rules:generate');
  process.exit(1);
}
console.log('Firebase Rules hợp lệ: có phân quyền sản phẩm, đơn hàng, theme, nội dung và luồng lời mời quản trị viên.');
