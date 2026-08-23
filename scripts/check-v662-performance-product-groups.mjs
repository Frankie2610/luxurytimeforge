import fs from 'node:fs';

const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const storefront=read('src/storefront-v10.tsx');
const groupData=read('src/product-groups.ts');
const groupAdmin=read('src/product-groups-admin-v504.tsx');
const adminShell=read('src/admin-shell-v16.tsx');
const context=read('src/context.tsx');
const images=read('src/image-utils.tsx');

const checks=[
  ['PDP family thumbnail uses matched product image', storefront.includes('const previewImage=product?productImage(product):item.image')],
  ['PDP family thumbnail uses fit transform', storefront.includes("optimizedImage(previewImage,240,240,'fit')")],
  ['Automatic group refreshes image from catalog', groupData.includes("image: product.images[0] || previous?.image || ''")],
  ['Admin group preview resolves catalog product image', groupAdmin.includes('previewImageForItem') && groupAdmin.includes('product?productImage(product):item.image')],
  ['Admin shell no longer eagerly imports full returns workspace', !adminShell.includes("import {useReturns} from './returns-v13'") && adminShell.includes('usePendingReturnCountV661')],
  ['Admin protected datasets hydrate per route', context.includes('const needed=new Set<string>()') && context.includes('location.pathname')],
  ['Image transforms are memoized', images.includes('transformedImageCache') && images.includes('srcSetCache')],
  ['Cloudinary does not double-apply DPR', !images.includes('q_auto:eco,dpr_auto')],
];

const failed=checks.filter(([,ok])=>!ok);
checks.forEach(([name,ok])=>console.log(`${ok?'✓':'✗'} ${name}`));
if(failed.length){process.exitCode=1;console.error(`\n${failed.length} regression check(s) failed.`)}
else console.log('\nV0.66.2 performance + SKU-family preview checks passed.');
