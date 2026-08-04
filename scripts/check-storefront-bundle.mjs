import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const manifestPath = new URL('../dist/.vite/manifest.json', import.meta.url)

if (!fs.existsSync(manifestPath)) {
  console.error('Missing dist/.vite/manifest.json. Run `vite build --manifest` first.')
  process.exit(1)
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const entryKey = Object.keys(manifest).find((key) => key.endsWith('src/storefront-v10.tsx'))

if (!entryKey) {
  console.error('Storefront entry is missing from the Vite manifest.')
  process.exit(1)
}

const visited = new Set()
const cssFiles = new Set()

function collect(key) {
  if (visited.has(key)) return
  visited.add(key)

  const chunk = manifest[key]
  if (!chunk) return

  for (const cssFile of chunk.css ?? []) cssFiles.add(cssFile)
  // Dynamic imports are separate route/user-action chunks and are not part of
  // the storefront's initial static dependency graph.
  for (const child of chunk.imports ?? []) {
    collect(child)
  }
}

collect(entryKey)

const reachableCss = [...cssFiles].sort()
const legacyCss = reachableCss.filter((file) => file.includes('legacy'))

if (legacyCss.length > 0) {
  console.error(`FAIL storefront still reaches legacy CSS: ${legacyCss.join(', ')}`)
  process.exit(1)
}

const distDirectory = path.dirname(path.dirname(manifestPath.pathname))
const gzipBytes = reachableCss.reduce((total, file) => {
  const source = fs.readFileSync(path.join(distDirectory, file))
  return total + gzipSync(source).byteLength
}, 0)

console.log(`PASS storefront static graph contains ${visited.size} chunks without legacy CSS.`)
console.log(`Reachable CSS: ${reachableCss.join(', ')}`)
console.log(`Storefront route CSS: ${(gzipBytes / 1024).toFixed(2)} KiB gzip`)
