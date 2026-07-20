import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.css')) files.push(full);
  }
}
walk(root);
const selectors = new Map();
let bytes = 0;
let important = 0;
for (const file of files) {
  const css = fs.readFileSync(file, 'utf8');
  bytes += Buffer.byteLength(css);
  important += (css.match(/!important/g) || []).length;
  for (const match of css.matchAll(/([^{}@][^{}]*)\{/g)) {
    const selectorGroup = match[1].replace(/\s+/g, ' ').trim();
    if (!selectorGroup || selectorGroup.length > 300) continue;
    for (const selector of selectorGroup.split(',')) {
      const key = selector.trim();
      if (!key) continue;
      const list = selectors.get(key) || [];
      list.push(path.relative(process.cwd(), file));
      selectors.set(key, list);
    }
  }
}
const duplicates = [...selectors.entries()].filter(([, refs]) => refs.length > 1).sort((a,b) => b[1].length - a[1].length);
const distDir = path.resolve('dist/assets');
const productionCss = fs.existsSync(distDir) ? fs.readdirSync(distDir).filter((name) => name.endsWith('.css')).map((name) => {
  const full = path.join(distDir, name);
  return {name, bytes: fs.statSync(full).size};
}).sort((a,b) => b.bytes-a.bytes) : [];

const report = {
  generatedAt: new Date().toISOString(),
  files: files.length,
  sourceBytes: bytes,
  importantDeclarations: important,
  uniqueSelectors: selectors.size,
  duplicatedSelectors: duplicates.length,
  productionCss,
  productionCssBytes: productionCss.reduce((sum,item)=>sum+item.bytes,0),
  topDuplicates: duplicates.slice(0, 40).map(([selector, refs]) => ({selector, count: refs.length, files: [...new Set(refs)]})),
};
fs.writeFileSync('docs/CSS_AUDIT_V42.json', JSON.stringify(report, null, 2));
console.log(`CSS files: ${report.files}`);
console.log(`Source CSS: ${(bytes/1024).toFixed(1)} KB`);
console.log(`!important: ${important}`);
console.log(`Duplicated selectors: ${duplicates.length}`);
console.log('Report: docs/CSS_AUDIT_V42.json');
