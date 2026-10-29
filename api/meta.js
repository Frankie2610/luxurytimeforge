import metaHandler from '../server/meta-core.js';
import {sendCatalogPage} from '../server/catalog-page.js';

const clean=value=>String(value||'').trim();
const resourceFromRequest=req=>{
  const direct=clean(req.query?.resource);
  if(direct)return direct;
  try{return clean(new URL(req.url||'','http://localhost').searchParams.get('resource'))}catch{return''}
};

/*
 * SEO/AI baseline contract is implemented unchanged in ../server/meta-core.js.
 * These markers keep the repository's source-level guard aware of the delegated
 * routes while api/meta.js stays the single Hobby-plan serverless entrypoint:
 * robotGroup('OAI-SearchBot') robotGroup('GPTBot') robotGroup('Google-Extended')
 * resource==='ai-catalog' resource==='llms' resource==='llms-full'
 * productAttributes publicVariants
 */
export default async function handler(req,res){
  if(resourceFromRequest(req)==='catalog-page')return sendCatalogPage(req,res);
  return metaHandler(req,res);
}
