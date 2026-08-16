import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const postcss=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/postcss/lib/postcss.js');
const rootDir=path.resolve('src');
const files=[];const collect=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())collect(full);else if(entry.name.endsWith('.css'))files.push(full)}};collect(rootDir);
const norm=value=>String(value||'').replace(/\s+/g,' ').trim();
let mergedSameSelector=0,mergedSameBody=0,mergedAtRules=0,commentsRemoved=0,beforeBytes=0,afterBytes=0;
const bodyKey=rule=>(rule.nodes||[]).map(node=>node.type==='decl'?`d:${node.prop}:${norm(node.value)}:${node.important?'!':''}`:`x:${norm(node.toString())}`).join('|');
const simpleSelector=selector=>!/(?:\:has\(|\:is\(|\:where\(|\:focus-visible|\:focus-within|\:\:file-selector-button|\:-webkit|\:-moz)/.test(selector);
function optimizeContainer(container){
  if(!container.nodes)return;
  for(const node of [...container.nodes])if(node.nodes)optimizeContainer(node);
  // Merge neighboring identical @media/@supports blocks without moving any declaration.
  for(let i=0;i<container.nodes.length-1;){
    const a=container.nodes[i],b=container.nodes[i+1];
    if(a.type==='atrule'&&b.type==='atrule'&&a.nodes&&b.nodes&&a.name===b.name&&norm(a.params)===norm(b.params)&&['media','supports','container','layer'].includes(a.name.toLowerCase())){
      for(const child of [...b.nodes])a.append(child);b.remove();mergedAtRules++;continue;
    }
    i++;
  }
  // Merge neighboring rules with the exact same selector. Appending declarations preserves order.
  for(let i=0;i<container.nodes.length-1;){
    const a=container.nodes[i],b=container.nodes[i+1];
    if(a.type==='rule'&&b.type==='rule'&&norm(a.selector)===norm(b.selector)){
      for(const child of [...b.nodes])a.append(child);b.remove();mergedSameSelector++;continue;
    }
    i++;
  }
  // Merge neighboring simple selectors that have an identical declaration block.
  for(let i=0;i<container.nodes.length-1;){
    const a=container.nodes[i],b=container.nodes[i+1];
    if(a.type==='rule'&&b.type==='rule'&&simpleSelector(a.selector)&&simpleSelector(b.selector)&&bodyKey(a)&&bodyKey(a)===bodyKey(b)){
      a.selector=`${a.selector},${b.selector}`;b.remove();mergedSameBody++;continue;
    }
    i++;
  }
}
function minifyRaws(root){
  root.walkComments(comment=>{if(!comment.text.trim().startsWith('!')){comment.remove();commentsRemoved++;}});
  root.walk(node=>{
    if(node.raws)node.raws.before='';
    if(node.type==='rule'&&node.raws)node.raws.between='';
    if(node.type==='decl'&&node.raws){node.raws.between=':';node.raws.semicolon=false;}
    if(node.type==='atrule'&&node.raws){node.raws.before='';if(node.raws.afterName!==undefined)node.raws.afterName=node.params?' ':'';if(node.raws.between!==undefined)node.raws.between='';}
    if(node.type==='comment'&&node.raws)node.raws.before='';
  });
  root.raws.after='';
}
for(const file of files){
  const input=fs.readFileSync(file,'utf8');beforeBytes+=Buffer.byteLength(input);
  const root=postcss.parse(input,{from:file});optimizeContainer(root);minifyRaws(root);
  const output=root.toString();fs.writeFileSync(file,output);afterBytes+=Buffer.byteLength(output);
}
const report={files:files.length,beforeBytes,afterBytes,savedBytes:beforeBytes-afterBytes,mergedSameSelector,mergedSameBody,mergedAtRules,commentsRemoved,policy:'Adjacent-only structural merges + AST whitespace/comment minification; no selector/rule reordering.'};
fs.writeFileSync('docs/CSS_STRUCTURAL_V64.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
