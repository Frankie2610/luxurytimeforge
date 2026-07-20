import {readdir,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';
import {readFile} from 'node:fs/promises';
const dir='dist/assets';
const files=(await readdir(dir)).filter(name=>/\.(css|js)$/.test(name));
const rows=[];
for(const name of files){const path=join(dir,name);const data=await readFile(path);rows.push({name,raw:data.length,gzip:gzipSync(data).length,type:name.endsWith('.css')?'CSS':'JS'});}
rows.sort((a,b)=>b.gzip-a.gzip);
const kb=value=>(value/1024).toFixed(1);
console.table(rows.map(row=>({file:row.name,type:row.type,'raw KB':kb(row.raw),'gzip KB':kb(row.gzip)})));
const totals=rows.reduce((sum,row)=>({raw:sum.raw+row.raw,gzip:sum.gzip+row.gzip}),{raw:0,gzip:0});
console.log(`Total assets: ${kb(totals.raw)} KB raw · ${kb(totals.gzip)} KB gzip`);
