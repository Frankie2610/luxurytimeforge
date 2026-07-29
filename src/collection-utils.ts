import {readProductFilterValues} from './product-filter-data';
import type {Collection, CollectionConditionField, CollectionConditionOperator, Condition, Product} from './types';
import {discount} from './utils';

const plain=(value:unknown)=>String(value??'').trim().toLocaleLowerCase('vi-VN');
const numberValue=(value:unknown)=>{
  const normalized=String(value??'').replace(/[^\d,.-]/g,'').replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.');
  const parsed=Number(normalized);
  return Number.isFinite(parsed)?parsed:0;
};

const stringValues=(product:Product,field:CollectionConditionField):string[]=>{
  if(field==='vendor')return[product.vendor];
  if(field==='productType')return[product.productType];
  if(field==='tag')return product.tags;
  if(field==='status')return[product.status];
  if(field==='gender')return readProductFilterValues(product,'gender');
  return[];
};

const numericValues=(product:Product,field:CollectionConditionField):number[]=>{
  const variants=product.variants||[];
  if(field==='price')return[product.price,...variants.map(item=>item.price)];
  if(field==='compareAtPrice')return[product.compareAtPrice,...variants.map(item=>item.compareAtPrice)].filter(value=>value>0);
  if(field==='inventory')return variants.length?variants.map(item=>item.inventory):[product.inventory];
  if(field==='discountPercent')return[
    discount(product.price,product.compareAtPrice),
    ...variants.map(item=>discount(item.price,item.compareAtPrice)),
  ];
  return[];
};

const matchText=(values:string[],operator:CollectionConditionOperator,target:string)=>{
  const expected=plain(target);
  const normalized=values.map(plain).filter(Boolean);
  if(operator==='is_set')return normalized.length>0;
  if(operator==='is_not_set')return normalized.length===0;
  if(!expected)return false;
  if(operator==='not_equals')return normalized.every(value=>value!==expected);
  if(operator==='contains')return normalized.some(value=>value.includes(expected));
  if(operator==='not_contains')return normalized.every(value=>!value.includes(expected));
  return normalized.some(value=>value===expected);
};

const matchNumber=(values:number[],operator:CollectionConditionOperator,target:string)=>{
  const usable=values.filter(value=>Number.isFinite(value));
  if(operator==='is_set')return usable.some(value=>value>0);
  if(operator==='is_not_set')return usable.every(value=>value<=0);
  const expected=numberValue(target);
  if(operator==='not_equals')return usable.every(value=>value!==expected);
  if(operator==='greater_than')return usable.some(value=>value>expected);
  if(operator==='less_than')return usable.some(value=>value<expected);
  if(operator==='greater_or_equal')return usable.some(value=>value>=expected);
  if(operator==='less_or_equal')return usable.some(value=>value<=expected);
  return usable.some(value=>value===expected);
};

export const collectionConditionNeedsValue=(condition:Condition)=>condition.operator!=='is_set'&&condition.operator!=='is_not_set';

export const matchesCollectionCondition=(product:Product,condition:Condition)=>{
  if(condition.field==='price'||condition.field==='compareAtPrice'||condition.field==='inventory'||condition.field==='discountPercent'){
    return matchNumber(numericValues(product,condition.field),condition.operator,condition.value);
  }
  return matchText(stringValues(product,condition.field),condition.operator,condition.value);
};

export const resolvesCollectionProducts=(collection:Collection,products:Product[])=>{
  if(collection.type==='manual')return products.filter(product=>collection.productIds.includes(product.id));
  const conditions=collection.conditions||[];
  if(!conditions.length)return[];
  const matchMode=collection.conditionMatch||'all';
  return products.filter(product=>{
    const results=conditions.map(condition=>matchesCollectionCondition(product,condition));
    return matchMode==='any'?results.some(Boolean):results.every(Boolean);
  });
};
