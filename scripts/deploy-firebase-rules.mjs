import {access, readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

async function loadEnv(path) {
  try {await access(path);} catch {return {};}
  const text = await readFile(path, 'utf8');
  const values = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const divider = line.indexOf('=');
    if (divider < 1) continue;
    const key = line.slice(0, divider).trim();
    let value = line.slice(divider + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[key] = value;
  }
  return values;
}

const env = {
  ...await loadEnv(resolve('.env')),
  ...await loadEnv(resolve('.env.local')),
  ...process.env,
};
const projectId = String(env.VITE_FIREBASE_PROJECT_ID || '').trim();

if (!projectId) {
  console.error('Không thể deploy Firebase Rules: thiếu VITE_FIREBASE_PROJECT_ID trong .env.local.');
  process.exit(1);
}

const args = ['dlx', 'firebase-tools', 'deploy', '--only', 'database', '--project', projectId];
const npmExecPath = process.env.npm_execpath;
const result = npmExecPath
  ? spawnSync(process.execPath, [npmExecPath, ...args], {stdio: 'inherit', env})
  : spawnSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args, {stdio: 'inherit', env});

if (result.error) {
  console.error(`Không thể chạy Firebase CLI: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
