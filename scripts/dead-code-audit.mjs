import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const extensions = new Set(['.ts', '.tsx']);
const allFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (extensions.has(path.extname(entry.name)) && !entry.name.endsWith('.d.ts')) allFiles.push(path.resolve(full));
  }
}
walk(root);

const importPattern = /(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm;
const reachable = new Set();
const stack = [path.resolve('src/main.tsx')];

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || null;
}

while (stack.length) {
  const file = stack.pop();
  if (!file || reachable.has(file) || !fs.existsSync(file)) continue;
  reachable.add(file);
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(importPattern)) {
    const resolved = resolveImport(file, match[1] || match[2]);
    if (resolved) stack.push(path.resolve(resolved));
  }
}

const orphaned = allFiles.filter((file) => !reachable.has(file)).map((file) => path.relative(process.cwd(), file));
const report = {generatedAt: new Date().toISOString(), entry: 'src/main.tsx', modules: allFiles.length, reachable: reachable.size, orphaned};
fs.writeFileSync('docs/DEAD_CODE_AUDIT_V41.json', JSON.stringify(report, null, 2));
console.log(`TS/TSX modules: ${report.modules}`);
console.log(`Reachable modules: ${report.reachable}`);
console.log(`Orphaned modules: ${orphaned.length}`);
for (const file of orphaned) console.log(` - ${file}`);
if (orphaned.length) process.exitCode = 1;
