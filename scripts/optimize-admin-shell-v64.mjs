import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const postcss=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/postcss/lib/postcss.js');

// Only stylesheets loaded unconditionally by AdminLayoutV16 are included here.
// Shared storefront/admin CSS and lazy route CSS are intentionally excluded.
const files=[
  'v499-admin.css','v4917-admin-catalog.css','v4921-admin-operations.css','v4922-admin-customers.css','v4923-admin-content.css','v4925-admin-resources.css','v4915-product-editor.css','v4917-team.css','v499-theme-editor.css',
  'v50-admin-polish.css','v504-admin-final.css','v508-admin-final.css','v509-admin-final.css','v512-admin-contrast.css',
  'v531-admin-dashboard.css','v540-admin-refinement.css','v550-admin-polish.css','v560-admin-features.css','v563-admin-scroll-polish.css','v564-admin-polish.css','v565-admin-performance.css','v566-admin-polish.css','v580-admin-polish.css','v582-admin-ui-polish.css','v620-admin-polish.css',
];
const riskyProps=new Set(['display','background','background-image','font-family','src','appearance','-webkit-appearance','backdrop-filter','-webkit-backdrop-filter','clip-path','mask','filter','animation','transition']);
const riskyValue=/(?:var|env|color-mix|image-set)\(/;
const norm=value=>String(value||'').replace(/\s+/g,' ').trim();
const roots=new Map(files.map(file=>[file,postcss.parse(fs.readFileSync(`src/${file}`,'utf8'),{from:`src/${file}`})]));
const declarations=[];
for(let fileIndex=0;fileIndex<files.length;fileIndex++){
  const file=files[fileIndex],root=roots.get(file);
  const walk=(container,context=[])=>{
    for(const node of container.nodes||[]){
      if(node.type==='atrule'&&node.nodes)walk(node,[...context,`${node.name.toLowerCase()}:${norm(node.params)}`]);
      else if(node.type==='rule')for(const decl of node.nodes||[])if(decl.type==='decl')declarations.push({file,fileIndex,decl,selector:norm(node.selector),context:context.join('|'),prop:decl.prop.toLowerCase(),value:norm(decl.value),important:Boolean(decl.important)});
    }
  };
  walk(root);
}
const seen=new Map();
let removedDeclarations=0,removedRules=0;
const byFile={};
for(let i=declarations.length-1;i>=0;i--){
  const item=declarations[i];
  const key=[item.context,item.selector,item.prop,item.important?'!':''].join('\u0000');
  const later=seen.get(key);
  const safeProp=!riskyProps.has(item.prop)&&!item.prop.startsWith('-')&&!item.prop.startsWith('--');
  const safeValues=!riskyValue.test(item.value)&&!(later&&riskyValue.test(later.value));
  if(later&&safeProp&&safeValues){
    item.decl.remove();removedDeclarations++;byFile[item.file]=(byFile[item.file]||0)+1;
  }else if(!later){seen.set(key,{value:item.value,file:item.file});}
}
for(const [file,root] of roots){
  root.walkRules(rule=>{if(!rule.nodes?.some(node=>node.type==='decl'||node.type==='atrule'||node.type==='rule')){rule.remove();removedRules++;}});
  fs.writeFileSync(`src/${file}`,root.toString());
}
const report={files,removedDeclarations,removedRules,byFile,policy:'Only unconditional Admin shell CSS; same exact selector + at-rule context + property + importance. Lazy route/shared CSS excluded; fallback-prone properties/values preserved.'};
fs.writeFileSync('docs/CSS_ADMIN_DEDUPE_V64.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({removedDeclarations,removedRules,byFile},null,2));
