import metaHandler from '../server/meta-core.js';
import {sendCatalogPage} from '../server/catalog-page.js';

const clean=value=>String(value||'').trim();
const resourceFromRequest=req=>{
  const direct=clean(req.query?.resource);
  if(direct)return direct;
  try{return clean(new URL(req.url||'','http://localhost').searchParams.get('resource'))}catch{return''}
};

export default async function handler(req,res){
  if(resourceFromRequest(req)==='catalog-page')return sendCatalogPage(req,res);
  return metaHandler(req,res);
}
