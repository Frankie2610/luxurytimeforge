import fs from 'node:fs';

const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const storefront=read('src/storefront-v10.tsx');
const images=read('src/image-utils.tsx');

const checks=[
  ['SmartImage supports explicit unoptimized source', images.includes('unoptimized = false') && images.includes('const finalSource = unoptimized ? displayedSource : optimizedImage')],
  ['PDP main image requests original catalog URL', storefront.includes('priority unoptimized src={images[imageIndex]}')],
  ['PDP zoom requests original catalog URL', storefront.includes('<img src={images[imageIndex]} alt={product.title} decoding=\"async\" />')],
  ['PDP normal thumbnails remain optimized', storefront.includes('optimizedImage(image, 220, 220)')],
  ['SKU-family preview remains optimized', storefront.includes("optimizedImage(previewImage,240,240,'fit')")],
];

const failed=checks.filter(([,ok])=>!ok);
checks.forEach(([name,ok])=>console.log(`${ok?'✓':'✗'} ${name}`));
if(failed.length){process.exitCode=1;console.error(`\n${failed.length} regression check(s) failed.`)}
else console.log('\nV0.66.3 PDP original-image checks passed.');
