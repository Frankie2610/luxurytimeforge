import fs from 'node:fs';
import path from 'node:path';

const dist=path.resolve('dist/assets');
const MAX_CHUNK=1_000_000; // 1 MB decimal: budget for any single production CSS asset.
const WARN_TOTAL=2_500_000; // total across lazy routes is informational, not a page-load budget.
if(!fs.existsSync(dist)){
  console.error('[CSS budget] dist/assets does not exist. Run vite build first.');
  process.exit(1);
}
const files=fs.readdirSync(dist).filter(name=>name.endsWith('.css')).map(name=>({name,bytes:fs.statSync(path.join(dist,name)).size})).sort((a,b)=>b.bytes-a.bytes);
const total=files.reduce((sum,item)=>sum+item.bytes,0);
const oversized=files.filter(item=>item.bytes>=MAX_CHUNK);
console.log(`[CSS budget] ${files.length} production CSS assets · total ${(total/1000).toFixed(1)} kB · largest ${files[0]?`${files[0].name} ${(files[0].bytes/1000).toFixed(1)} kB`:'n/a'}`);
if(total>WARN_TOTAL)console.warn(`[CSS budget] warning: total lazy-route CSS ${(total/1000).toFixed(1)} kB > ${(WARN_TOTAL/1000).toFixed(0)} kB. This is not all loaded on one page.`);
if(oversized.length){
  console.error(`[CSS budget] FAIL: each CSS chunk must stay below ${(MAX_CHUNK/1000).toFixed(0)} kB.`);
  for(const item of oversized)console.error(` - ${item.name}: ${(item.bytes/1000).toFixed(1)} kB`);
  process.exit(1);
}
console.log('[CSS budget] PASS: every production CSS chunk is under 1 MB.');
