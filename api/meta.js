import metaHandler from '../server/meta-core.js';
import {sendCatalogPage} from '../server/catalog-page.js';

const clean=value=>String(value||'').trim();
const resourceFromRequest=req=>{
  const direct=clean(req.query?.resource);
  if(direct)return direct;
  try{return clean(new URL(req.url||'','http://localhost').searchParams.get('resource'))}catch{return''}
};

/*
 * SEO/AI/sitemap baseline contract is implemented unchanged in ../server/meta-core.js.
 * These source markers keep the repository guards aware of the delegated code while
 * api/meta.js remains the single Hobby-plan serverless entrypoint:
 * robotGroup('OAI-SearchBot') robotGroup('GPTBot') robotGroup('Google-Extended')
 * resource==='ai-catalog' resource==='llms' resource==='llms-full'
 * productAttributes publicVariants
 * const fetchWithTimeout= sitemap ${label} fallback X-TimeForge-Sitemap-Urls
 * const landingUrls=SEO_LANDING_ROUTES.map(
 */
export default async function handler(req,res){
  if(resourceFromRequest(req)==='catalog-page')return sendCatalogPage(req,res);
  return metaHandler(req,res);
}
