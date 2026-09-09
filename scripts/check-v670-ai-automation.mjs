import fs from 'node:fs';
const files={
  finder:'src/storefront-tools-v57.tsx',
  context:'src/context.tsx',
  meta:'api/meta.js',
  processor:'api/price-alerts/process.js',
  warranty:'server/warranty-automation.js',
  payos:'server/payos.js',
  css:'src/v670-ai-automation.css',
  vercel:'vercel.json',
  env:'.env.example',
};
for(const file of Object.values(files))if(!fs.existsSync(file))throw new Error(`Missing ${file}`);
const text=Object.fromEntries(Object.entries(files).map(([key,file])=>[key,fs.readFileSync(file,'utf8')]));
const checks=[
  ['AI Watch Advisor UI',text.finder.includes('AI WATCH ADVISOR')&&text.finder.includes('/api/meta?resource=watch-advisor')],
  ['Gemini structured intent',text.meta.includes("resource==='watch-advisor'")&&text.meta.includes('responseMimeType')&&text.meta.includes('gemini-2.5-flash-lite')],
  ['AI local fallback',text.finder.includes('Smart fallback')&&text.finder.includes('localAiIntent')],
  ['Realtime inventory ranking',text.finder.includes('product.inventory>0')||text.finder.includes('(product.inventory??0)>0')],
  ['Immediate price + stock triggers',text.context.includes("mode:'stock'")&&text.context.includes('/api/price-alerts/process')],
  ['Back-in-stock email automation',text.processor.includes('Đã có hàng lại')&&text.processor.includes("status:'notified'")&&text.processor.includes("mode==='stock'")],
  ['Daily stock alert cron',text.vercel.includes('/api/price-alerts/process')&&text.vercel.includes('0 2 * * *')],
  ['Paid order warranty automation',text.payos.includes('syncWarrantyForPaidOrder')&&text.warranty.includes('pending_activation')&&text.processor.includes("mode==='warranty'")],
  ['Warranty activation email',text.warranty.includes('WARRANTY_ACTIVATION_URL')&&text.warranty.includes('Kích hoạt bảo hành')],
  ['Environment documentation',text.env.includes('GEMINI_API_KEY=')&&text.env.includes('WARRANTY_ACTIVATION_URL=')],
  ['Responsive AI UI',text.css.includes('@media(max-width:640px)')&&text.css.includes('tf670-ai-results')],
];
const failed=checks.filter(([,ok])=>!ok);
for(const[name,ok]of checks)console.log(`${ok?'PASS':'FAIL'} · ${name}`);
if(failed.length)process.exit(1);
console.log(`V0.67.0 AI/Automation checks passed (${checks.length}/${checks.length}).`);
