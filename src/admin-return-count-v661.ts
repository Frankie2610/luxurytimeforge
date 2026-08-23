import {useEffect,useState} from 'react';
import {firebaseClient} from './firebase';
import {asList} from './data-normalize';
import type {ReturnRequest} from './types';

const RETURN_CACHE_KEY='tf.v13.return-requests';
const pendingCount=(value:unknown)=>asList<ReturnRequest>(value).reduce((count,item)=>count+(item.status==='requested'?1:0),0);
const cachedPendingCount=()=>{try{return pendingCount(JSON.parse(localStorage.getItem(RETURN_CACHE_KEY)||'[]'))}catch{return 0}};

/** Lightweight Admin-shell badge. The full returns workspace (Framer Motion,
 * dialogs, product selectors and its CSS) stays in the /admin/returns route chunk. */
export function usePendingReturnCountV661(){
 const[count,setCount]=useState(cachedPendingCount);
 useEffect(()=>{
  if(!firebaseClient.enabled)return;
  let active=true;
  void firebaseClient.queryByChild<ReturnRequest[]|Record<string,ReturnRequest>>('timeforge/returnRequests','status','requested')
   .then(value=>{if(active)setCount(pendingCount(value))})
   .catch(()=>undefined);
  return()=>{active=false};
 },[]);
 return count;
}
