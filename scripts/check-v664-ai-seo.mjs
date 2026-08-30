import {readFile,access} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const read=rel=>readFile(path.join(root,rel),'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(`[V0.66.x AI/SEO] ${message}`)};
const pkg=JSON.parse(await read('package.json'));
const index=await read('index.html');
const meta=await read('api/meta.js');
const vercel=JSON.parse(await read('vercel.json'));
const seo=await read('src/seo-head-v60.tsx');
const store=await read('src/store-profile.ts');
const envExample=await read('.env.example');
const prerender=await read('scripts/prerender-seo.mjs');

must(/^0\.66\.(?:4|5|6)$/.test(pkg.version),'package version must be a compatible 0.66.4/0.66.5/0.66.6 release');
must(String(pkg.scripts?.build||'').includes('prerender-seo.mjs'),'build must run SEO prerender');
must(index.includes('rel="canonical"'),'index must include canonical fallback');
must(index.includes('/llms.txt')&&index.includes('/ai-catalog.json'),'index must advertise AI-readable resources');
must(index.includes('tf60-structured-data')&&index.includes('OnlineStore'),'index must include server-readable structured data');
must(index.includes('tf-prerender'),'index must contain crawlable HTML fallback');
must(meta.includes("robotGroup('OAI-SearchBot')"),'robots must explicitly allow OAI-SearchBot');
must(meta.includes("robotGroup('GPTBot')"),'robots must explicitly allow GPTBot');
must(meta.includes("robotGroup('Google-Extended')"),'robots must explicitly allow Google-Extended');
must(meta.includes("resource==='ai-catalog'"),'AI catalog endpoint must exist');
must(meta.includes("resource==='llms'"),'llms.txt endpoint must exist');
must(meta.includes("resource==='llms-full'"),'llms-full.txt endpoint must exist');
must(meta.includes('productAttributes')&&meta.includes('publicVariants'),'AI catalog must expose useful public product attributes and variants');
must(prerender.includes("orderBy:'\"status\"'")&&prerender.includes("equalTo:'\"published\"'"),'prerender must read public reviews through the allowed published-status query');
must(prerender.includes('resolveCollectionProducts'),'automatic collections must be resolved during prerender');
must(seo.includes("'@type':['OnlineStore','Organization']"),'client structured data must identify OnlineStore');
must(seo.includes("alternateName:'Luxury TimeForge Vietnam'"),'entity alternate name must be disambiguated');
must(!seo.includes("alternateName:'TimeForge'"),'generic TimeForge alternate name must not remain');
must(seo.includes("'@type':'BlogPosting'"),'blog pages need BlogPosting schema');
must(seo.includes("'@type':'OfferShippingDetails'"),'product offers need shipping details');
must(seo.includes('additionalProperty:productAdditionalProperties'),'product schema must expose public watch attributes');
must(store.includes("DEFAULT_STORE_NAME='Luxury TimeForge'"),'brand casing must be canonical');
must(envExample.includes('VITE_PUBLIC_SITE_URL=https://luxurytimeforge.vercel.app'),'production URL must be the env example default');
must(/data-seo-prerender=\"v0\.66\.[456]\"/.test(prerender),'prerender script must emit crawlable route content');
const rewrites=JSON.stringify(vercel.rewrites||[]);must(rewrites.includes('/llms.txt')&&rewrites.includes('/ai-catalog.json'),'Vercel must route AI resources');
const headers=JSON.stringify(vercel.headers||[]);must(headers.includes('X-Robots-Tag')&&headers.includes('noindex, nofollow'),'private routes must send X-Robots-Tag');
try{
  await access(path.join(root,'dist','index.html'));
  const built=await read('dist/index.html');must(built.includes('tf-prerender'),'built homepage must contain crawlable fallback');
  for(const rel of ['collections/index.html','watch-finder/index.html','blogs/index.html','pages/about/index.html','pages/warranty/index.html','pages/shipping/index.html','pages/returns/index.html']){
    await access(path.join(root,'dist',rel));
    const html=await read(`dist/${rel}`);must(/data-seo-prerender=\"v0\.66\.[456]\"/.test(html),`${rel} must be prerendered`);
  }
}catch(error){
  if(error?.code!=='ENOENT')throw error;
  console.warn('[V0.66.x AI/SEO] dist/ not present; source-level checks only.');
}
console.log('[V0.66.x AI/SEO] checks passed.');
