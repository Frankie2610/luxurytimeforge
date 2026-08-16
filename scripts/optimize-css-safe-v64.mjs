import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const postcss=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/postcss/lib/postcss.js');

const root=path.resolve('src');
const files=[];
const walk=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.name.endsWith('.css'))files.push(full)}};
walk(root);
let removedDeclarations=0,removedRules=0,removedAtRules=0,filesChanged=0,beforeBytes=0,afterBytes=0;

const normalize=(value)=>value.replace(/\s+/g,' ').trim();
const declKey=(decl)=>`${decl.prop.toLowerCase()}\u0000${normalize(decl.value)}\u0000${decl.important?'!':''}`;
const ruleBodyKey=(rule)=>rule.nodes?.filter(n=>n.type==='decl').map(declKey).join('\u0001')||'';

function optimizeContainer(container){
  if(!container.nodes)return;
  // Recurse first so nested media/supports blocks are optimized independently.
  for(const node of [...container.nodes]) if('nodes' in node && node.nodes) optimizeContainer(node);

  // Exact duplicate declarations inside the same rule: keep the last declaration.
  for(const node of container.nodes){
    if(node.type!=='rule'||!node.nodes)continue;
    const seen=new Set();
    for(let i=node.nodes.length-1;i>=0;i--){
      const child=node.nodes[i];
      if(child.type!=='decl')continue;
      const key=declKey(child);
      if(seen.has(key)){child.remove();removedDeclarations++;}else seen.add(key);
    }
  }

  // Exact same selector/property/value repeated in separate rules of the SAME parent
  // (same @media/@supports/layer context): earlier copy is redundant. Never remove
  // a declaration whose value differs, so fallbacks and intentional overrides survive.
  const seenBySelector=new Map();
  for(let i=container.nodes.length-1;i>=0;i--){
    const node=container.nodes[i];
    if(node.type!=='rule'||!node.nodes)continue;
    const selector=normalize(node.selector);
    let seen=seenBySelector.get(selector);
    if(!seen){seen=new Set();seenBySelector.set(selector,seen);}
    for(let j=node.nodes.length-1;j>=0;j--){
      const child=node.nodes[j];
      if(child.type!=='decl')continue;
      const key=declKey(child);
      if(seen.has(key)){child.remove();removedDeclarations++;}else seen.add(key);
    }
    if(!node.nodes.some(n=>n.type==='decl'||n.type==='atrule'||n.type==='rule')){node.remove();removedRules++;}
  }

  // Fully identical rules in the same context: keep the last one.
  const seenRules=new Set();
  for(let i=container.nodes.length-1;i>=0;i--){
    const node=container.nodes[i];
    if(node.type!=='rule')continue;
    const key=`${normalize(node.selector)}\u0000${ruleBodyKey(node)}`;
    if(seenRules.has(key)){node.remove();removedRules++;}else seenRules.add(key);
  }

  // Fully identical at-rules in the same context (e.g. repeated identical @media blocks).
  const seenAt=new Set();
  for(let i=container.nodes.length-1;i>=0;i--){
    const node=container.nodes[i];
    if(node.type!=='atrule'||!node.nodes)continue;
    const key=`${node.name.toLowerCase()}\u0000${normalize(node.params||'')}\u0000${normalize(node.toString())}`;
    if(seenAt.has(key)){node.remove();removedAtRules++;}else seenAt.add(key);
  }
}

for(const file of files){
  const input=fs.readFileSync(file,'utf8');beforeBytes+=Buffer.byteLength(input);
  let rootNode;
  try{rootNode=postcss.parse(input,{from:file});}catch(error){console.error(`Parse failed: ${file}\n${error.message}`);process.exit(1)}
  optimizeContainer(rootNode);
  const output=rootNode.toString();afterBytes+=Buffer.byteLength(output);
  if(output!==input){fs.writeFileSync(file,output);filesChanged++;}
}
const report={files:files.length,filesChanged,beforeBytes,afterBytes,savedBytes:beforeBytes-afterBytes,removedDeclarations,removedRules,removedAtRules,policy:'Same-file/same-parent exact duplicates only; no differing-value winner removal and no cross-file route assumptions.'};
fs.writeFileSync('docs/CSS_SAFE_DEDUPE_V64.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
