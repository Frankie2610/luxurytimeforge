import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const checks=[];
const expect=(ok,label)=>{checks.push({ok:Boolean(ok),label});if(!ok)process.exitCode=1};

const storefront=read('src/storefront-v10.tsx');
expect(storefront.includes('useSearchParams()'),'Collection filters read/write URLSearchParams');
expect(storefront.includes("next.append('brand',value)")&&storefront.includes("next.append('price',value)"),'Brand and price filters are serialized to URL');
expect(storefront.includes("PRODUCT_FILTER_DEFINITIONS.forEach(definition=>(filters.selectedFilters[definition.id]||[]).forEach(value=>next.append(definition.id,value)))"),'Product facets are serialized to URL');
expect(storefront.includes("next.set('stock','1')")&&storefront.includes("next.set('sort',sort)")&&storefront.includes("next.set('page',String(page))"),'Stock, sort and pagination are serialized');
expect(storefront.includes('navigator.clipboard.writeText(window.location.href)'),'Filtered URL has a copy action');
expect(storefront.includes('if(page<=pageCount)return;'),'Pagination clamps and repairs invalid page query values');

const index=read('index.html');
expect(index.includes('og:image')&&index.includes('social-cover.jpg'),'Static Open Graph cover exists for non-JS social crawlers');
expect(index.includes('og:image:width')&&index.includes('1200')&&index.includes('og:image:height')&&index.includes('630'),'Open Graph cover dimensions are declared');
expect(index.includes('twitter:card')&&index.includes('summary_large_image'),'Large social card metadata is present');
expect(fs.existsSync(path.join(root,'public/social-cover.jpg')),'Social share image file exists');
expect(fs.statSync(path.join(root,'public/social-cover.jpg')).size<250_000,'Social share image is lightweight (<250 KB)');
expect(fs.existsSync(path.join(root,'public/robots.txt'))&&fs.existsSync(path.join(root,'public/sitemap.xml')),'robots.txt and sitemap.xml exist');

const seo=read('src/seo-head-v60.tsx');
expect(seo.includes("'@type':'Product'")&&seo.includes("'@type':'Organization'"),'Structured data covers Product and Organization');
expect(seo.includes("setLink('canonical'")&&seo.includes("noindex, nofollow"),'Dynamic canonical and noindex rules are present');

const app=read('src/App.tsx');
const shell=read('src/admin-shell-v16.tsx');
const context=read('src/context.tsx');
const reviewAdmin=read('src/reviews-admin-v60.tsx');
const theme=read('src/theme-section-v27.tsx');
const rules=read('firebase.rules.json');
expect(app.includes('path="reviews"')&&shell.includes("'/admin/reviews'"),'Review manager is routed and exposed in admin navigation');
expect(context.includes('reviews:StoreReview[]')&&context.includes('saveReview')&&context.includes('deleteReview'),'Commerce context persists review CRUD');
expect(context.includes("queryByChild<StoreReview[]|Record<string,StoreReview>>('timeforge/reviews','status','published')"),'Public storefront requests published reviews only');
expect(reviewAdmin.includes("uploadCloudinaryImage(file,'reviews')")&&reviewAdmin.includes('Bản nháp')&&reviewAdmin.includes('Nổi bật'),'Review manager supports image upload, draft/publish, and featured state');
expect(theme.includes('managedReviews')&&/item\.status\s*===\s*'published'/.test(theme),'Storefront testimonial section uses published managed reviews');
const rulesTemplate=read('firebase.rules.template.json');
expect(rules.includes('\"reviews\"')&&rulesTemplate.includes("query.orderByChild == 'status'")&&rulesTemplate.includes('__CONTENT_MANAGE_CONDITION__'),'Firebase rules keep drafts admin-only while allowing published review queries');

const css=read('src/v581-storefront-polish.css');
expect(css.includes('content-visibility:auto')&&css.includes('contain-intrinsic-size'),'Offscreen product/testimonial cards use paint containment');

for(const item of checks)console.log(`${item.ok?'PASS':'FAIL'}  ${item.label}`);
const passed=checks.filter(item=>item.ok).length;
console.log(`\nV0.60 checks: ${passed}/${checks.length} passed.`);
if(process.exitCode)throw new Error('V0.60 static checks failed.');
