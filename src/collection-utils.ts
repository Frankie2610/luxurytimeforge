import {readProductFilterValues} from './product-filter-data';
import type {Collection, CollectionConditionField, CollectionConditionOperator, Condition, Product} from './types';
import {asList, asStringList} from './data-normalize';
import {discount, slugify} from './utils';

const conditionFields:CollectionConditionField[]=['vendor','productType','tag','status','price','compareAtPrice','inventory','gender','discountPercent'];
const conditionOperators:CollectionConditionOperator[]=['equals','not_equals','contains','not_contains','greater_than','less_than','greater_or_equal','less_or_equal','is_set','is_not_set'];
const record=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
const stringIds=(value:unknown)=>typeof value==='string'?value.split(',').map(item=>item.trim()).filter(Boolean):asStringList(value);

export const normalizeCollectionRecord=(value:unknown,index=0):Collection=>{
  const source=record(value) as Partial<Collection>;
  const title=String(source.title||'Bộ sưu tập chưa đặt tên').trim();
  const id=String(source.id||source.handle||`collection-${index+1}`).trim();
  const handle=slugify(source.handle||title||id)||`collection-${index+1}`;
  const conditions=asList<unknown>(source.conditions).map((item)=>{
    const condition=record(item) as Partial<Condition>;
    const field=conditionFields.includes(condition.field as CollectionConditionField)?condition.field as CollectionConditionField:'vendor';
    const operator=conditionOperators.includes(condition.operator as CollectionConditionOperator)?condition.operator as CollectionConditionOperator:'equals';
    return{field,operator,value:String(condition.value??'')};
  });
  return{
    ...source,
    id,
    handle,
    title,
    description:String(source.description??''),
    type:source.type==='automatic'?'automatic':'manual',
    status:source.status==='draft'?'draft':'active',
    image:String(source.image??''),
    productIds:stringIds(source.productIds),
    conditions,
    conditionMatch:source.conditionMatch==='any'?'any':'all',
  };
};

export const normalizeCollections=(value:unknown)=>asList<unknown>(value).map(normalizeCollectionRecord).filter((item)=>item.id);

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
  const normalized=normalizeCollectionRecord(collection);
  if(normalized.type==='manual')return products.filter(product=>normalized.productIds.includes(product.id));
  const conditions=normalized.conditions;
  if(!conditions.length)return[];
  const matchMode=normalized.conditionMatch||'all';
  return products.filter(product=>{
    const results=conditions.map(condition=>matchesCollectionCondition(product,condition));
    return matchMode==='any'?results.some(Boolean):results.every(Boolean);
  });
};
