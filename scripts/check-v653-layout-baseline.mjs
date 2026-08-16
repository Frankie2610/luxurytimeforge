import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd();
const v64='/mnt/data/v64cmp/LuxuryTimeForge-v0.64.0';
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
let passed=0,failed=0;const ok=(name,value)=>{if(value){console.log('✓',name);passed++}else{console.error('✗',name);failed++}};
const app=read('src/app.css'),sf=read('src/storefront-v10.tsx'),ad=read('src/admin-shell-v16.tsx'),sf65=read('src/v650-storefront-polish.css'),ad65=read('src/v650-admin-polish.css'),assist=read('src/v630-purchase-assist.css');
ok('app.css restores Tailwind + UI + base + tokens',app.includes('@import "tailwindcss"')&&app.includes('@import "./ui/ui.css" layer(design-system)')&&app.includes('@import "./base.css"')&&app.includes('@import "./v24-tokens.css"'));
ok('storefront restores legacy.css',sf.startsWith("import './legacy.css';"));
ok('admin restores legacy.css + admin-v4938.css',ad.includes("import './legacy.css';")&&ad.includes("import './admin-v4938.css';"));
// Every V64 CSS file must exist; all are byte-identical except the isolated tf63 installment component.
const oldCss=fs.readdirSync(path.join(v64,'src')).filter(x=>x.endsWith('.css'));const missing=[],mismatch=[];
for(const name of oldCss){const cur=path.join(root,'src',name),old=path.join(v64,'src',name);if(!fs.existsSync(cur))missing.push(name);else if(name!=='v630-purchase-assist.css'&&hash(cur)!==hash(old))mismatch.push(name)}
ok('all V0.64 CSS files restored',missing.length===0);ok('all V0.64 CSS content restored byte-for-byte',mismatch.length===0);if(missing.length)console.error(' missing:',missing.join(', '));if(mismatch.length)console.error(' mismatch:',mismatch.join(', '));
// Resolve nested CSS @imports; this is the graph V65 cleanup previously missed.
const cssImportMissing=[];for(const name of fs.readdirSync(path.join(root,'src')).filter(x=>x.endsWith('.css'))){const text=read(path.join('src',name));for(const m of text.matchAll(/@import\s+(?:url\()?\s*["']([^"']+\.css)["']/g)){const target=path.resolve(path.join(root,'src'),m[1]);if(!fs.existsSync(target))cssImportMissing.push(`${name} -> ${m[1]}`)}}
ok('nested CSS @import graph has zero missing files',cssImportMissing.length===0);if(cssImportMissing.length)console.error(cssImportMissing.join('\n'));
ok('V65 storefront polish is component-scoped',!sf65.includes(':is(.lux-section')&&!sf65.includes('.tf-editorial-content-v39{padding-block'));
ok('V65 admin polish is feature-scoped',ad65.includes('.tf65-settings-seo')&&!ad65.includes('.v16-admin-sidebar')&&!ad65.includes('.v16-admin-page'));
ok('premium installment stylesheet stays tf63-scoped',!assist.split('}').some(rule=>rule.includes('{')&&!rule.trim().startsWith('@')&&!rule.slice(0,rule.indexOf('{')).includes('.tf63-')));
ok('new customer tools preserved',sf.includes('LazyProductDecisionToolsV65'));ok('functional newsletter preserved',sf.includes('NewsletterSignupV65'));ok('old storefront pills remain removed',!sf.includes('tf582-storefront-pills'));
console.log(`\nV0.65.3 layout-baseline checks: ${passed} passed, ${failed} failed`);if(failed)process.exit(1);
