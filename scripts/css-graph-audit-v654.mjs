import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const src=path.join(root,'src');
const cssFiles=[];const codeFiles=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.name.endsWith('.css'))cssFiles.push(full);else if(/\.(?:ts|tsx|js|jsx)$/.test(entry.name))codeFiles.push(full)}}
walk(src);
const rel=p=>path.relative(src,p).replaceAll('\\','/');
const cssSet=new Set(cssFiles.map(rel));
const entryCss=new Set();
for(const file of codeFiles){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(/import\s*(?:[^'\"]*?from\s*)?['\"]\.\/([^'\"]+\.css)['\"]/g)){const candidate=path.posix.normalize(path.posix.join(path.posix.dirname(rel(file)),m[1]));if(cssSet.has(candidate))entryCss.add(candidate)}}
const nested=new Map();
for(const file of cssFiles){const name=rel(file),text=fs.readFileSync(file,'utf8'),refs=[];for(const m of text.matchAll(/@import\s+(?:url\()?\s*['\"]([^'\"]+\.css)['\"]/g)){const candidate=path.posix.normalize(path.posix.join(path.posix.dirname(name),m[1]));if(cssSet.has(candidate))refs.push(candidate)}nested.set(name,refs)}
const reachable=new Set();const visit=name=>{if(reachable.has(name))return;reachable.add(name);for(const next of nested.get(name)||[])visit(next)};for(const name of entryCss)visit(name);
const unreachable=[...cssSet].filter(name=>!reachable.has(name)).sort();
const bytes=names=>names.reduce((sum,name)=>sum+fs.statSync(path.join(src,name)).size,0);
const selectorRefs=new Map();let important=0,ruleCount=0,exactDuplicateRules=0;const exactSeen=new Map();
const blockRe=/([^{}@][^{}]*)\{([^{}]*)\}/g;
for(const name of reachable){const text=fs.readFileSync(path.join(src,name),'utf8');important+=(text.match(/!important/g)||[]).length;for(const m of text.matchAll(blockRe)){const selector=m[1].replace(/\s+/g,' ').trim(),body=m[2].replace(/\s+/g,' ').trim();if(!selector||selector.length>500)continue;ruleCount++;const key=`${selector}{${body}}`;if(exactSeen.has(key))exactDuplicateRules++;else exactSeen.set(key,name);for(const branch of selector.split(',')){const s=branch.trim();if(!s)continue;const refs=selectorRefs.get(s)||[];refs.push(name);selectorRefs.set(s,refs)}}}
const duplicateSelectors=[...selectorRefs.entries()].filter(([,refs])=>refs.length>1).sort((a,b)=>b[1].length-a[1].length);
const report={version:'0.65.4',generatedAt:new Date().toISOString(),policy:'Reachability traverses TS/TSX/JS imports AND nested CSS @import. Visual CSS is not auto-deleted from selector repetition alone.',files:{all:cssSet.size,reachable:reachable.size,unreachable:unreachable.length},bytes:{all:bytes([...cssSet]),reachable:bytes([...reachable]),unreachable:bytes(unreachable)},entryCss:[...entryCss].sort(),unreachable,ruleCount,importantDeclarations:important,duplicatedSelectors:duplicateSelectors.length,exactDuplicateRules,topRepeatedSelectors:duplicateSelectors.slice(0,50).map(([selector,refs])=>({selector,count:refs.length,files:[...new Set(refs)]}))};
fs.writeFileSync(path.join(root,'docs/CSS_GRAPH_AUDIT_V654.json'),JSON.stringify(report,null,2));
console.log(`CSS graph: ${report.files.reachable}/${report.files.all} reachable files`);
console.log(`Reachable source CSS: ${(report.bytes.reachable/1024).toFixed(1)} KiB`);
console.log(`Unreachable source CSS: ${(report.bytes.unreachable/1024).toFixed(1)} KiB`);
console.log(`Repeated selectors: ${report.duplicatedSelectors}; exact duplicate rules: ${report.exactDuplicateRules}`);
console.log('Report: docs/CSS_GRAPH_AUDIT_V654.json');
