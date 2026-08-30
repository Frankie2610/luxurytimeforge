import fs from 'node:fs';
const pre=fs.readFileSync(new URL('./prerender-seo.mjs',import.meta.url),'utf8');
const main=fs.readFileSync(new URL('../src/main.tsx',import.meta.url),'utf8');
let failures=0;const must=(ok,msg)=>{if(!ok){console.error('FAIL:',msg);failures++}else console.log('PASS:',msg)};
must(pre.includes("classList.add('tf-js')")&&pre.includes("classList.remove('tf-js')"),'early JS flag hides visible SEO fallback with timeout recovery');
must(pre.includes('tf-prerender-boot')&&pre.includes('.tf-js .tf-prerender{display:none}')&&pre.includes('.tf-js .tf-prerender-boot'),'JS browsers see boot loader instead of raw SEO text');
must(pre.includes('data-seo-prerender=\"v0.66.6\"'),'raw crawlable prerender content remains in HTML');
must(main.includes('function BootReady()')&&main.includes("classList.add('tf-app-mounted')"),'React marks successful mount so timeout fallback is not triggered');
if(failures)process.exit(1);console.log('V0.66.6 prerender flash checks passed.');
