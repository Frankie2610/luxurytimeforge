import type {StoreProfile, Theme} from './types';

export const DEFAULT_STORE_NAME='Luxury TimeForge';
export const DEFAULT_STORE_LOGO='/luxury-timeforge-logo.svg';
export const DEFAULT_STORE_ICON='/favicon.svg';

const clean=(value:unknown,fallback='')=>{
  const normalized=String(value??'').trim();
  return normalized||String(fallback??'').trim();
};

export const DEFAULT_STORE_PROFILE:StoreProfile={
  storeName:DEFAULT_STORE_NAME,
  storeDescription:'Đồng hồ chính hãng, tuyển chọn kỹ và hậu mãi minh bạch.',
  seoTitle:'',
  seoDescription:'',
  storePhone:'',
  storeEmail:'',
  storeAddress:'',
  taxId:'',
  facebookUrl:'',
  instagramUrl:'',
  tiktokUrl:'',
  recruitmentUrl:'',
  logoImage:'',
  socialShareImage:'',
  updatedAt:'',
};

export const resolveStoreName=(value:unknown)=>{const name=clean(value,DEFAULT_STORE_NAME);return name.toLocaleLowerCase('vi-VN')==='luxury timeforge'?DEFAULT_STORE_NAME:name};
export const resolveCustomStoreLogo=(value:unknown)=>clean(value);
export const resolveStoreLogo=(value:unknown)=>resolveCustomStoreLogo(value)||DEFAULT_STORE_LOGO;
export const resolveStoreIcon=(value:unknown)=>resolveCustomStoreLogo(value)||DEFAULT_STORE_ICON;

export const storeProfileFromTheme=(theme:Theme):StoreProfile=>({
  storeName:resolveStoreName(theme.settings.storeName),
  storeDescription:clean(theme.settings.storeDescription,DEFAULT_STORE_PROFILE.storeDescription),
  seoTitle:'',
  seoDescription:'',
  storePhone:clean(theme.settings.storePhone),
  storeEmail:clean(theme.settings.storeEmail),
  storeAddress:clean(theme.settings.storeAddress),
  taxId:clean(theme.settings.taxId),
  facebookUrl:clean(theme.settings.facebookUrl),
  instagramUrl:clean(theme.settings.instagramUrl),
  tiktokUrl:clean(theme.settings.tiktokUrl),
  recruitmentUrl:clean(theme.settings.recruitmentUrl),
  logoImage:resolveCustomStoreLogo(theme.settings.logoImage),
  socialShareImage:'',
  updatedAt:'',
});

export const normalizeStoreProfile=(value:Partial<StoreProfile>|null|undefined,fallback:StoreProfile=DEFAULT_STORE_PROFILE):StoreProfile=>({
  storeName:value?.storeName==null?resolveStoreName(fallback.storeName):resolveStoreName(value.storeName),
  storeDescription:String(value?.storeDescription??fallback.storeDescription??'').trim(),
  seoTitle:String(value?.seoTitle??fallback.seoTitle??'').trim(),
  seoDescription:String(value?.seoDescription??fallback.seoDescription??'').trim(),
  storePhone:String(value?.storePhone??fallback.storePhone??'').trim(),
  storeEmail:String(value?.storeEmail??fallback.storeEmail??'').trim(),
  storeAddress:String(value?.storeAddress??fallback.storeAddress??'').trim(),
  taxId:String(value?.taxId??fallback.taxId??'').trim(),
  facebookUrl:String(value?.facebookUrl??fallback.facebookUrl??'').trim(),
  instagramUrl:String(value?.instagramUrl??fallback.instagramUrl??'').trim(),
  tiktokUrl:String(value?.tiktokUrl??fallback.tiktokUrl??'').trim(),
  recruitmentUrl:String(value?.recruitmentUrl??fallback.recruitmentUrl??'').trim(),
  logoImage:value?.logoImage==null?resolveCustomStoreLogo(fallback.logoImage):resolveCustomStoreLogo(value.logoImage),
  socialShareImage:value?.socialShareImage==null?resolveCustomStoreLogo(fallback.socialShareImage):resolveCustomStoreLogo(value.socialShareImage),
  updatedAt:String(value?.updatedAt??fallback.updatedAt??'').trim(),
});

export const applyStoreProfileToTheme=(theme:Theme,profile:StoreProfile):Theme=>({
  ...theme,
  settings:{
    ...theme.settings,
    storeName:resolveStoreName(profile.storeName),
    storeDescription:profile.storeDescription,
    storePhone:profile.storePhone,
    storeEmail:profile.storeEmail,
    storeAddress:profile.storeAddress,
    taxId:profile.taxId,
    facebookUrl:profile.facebookUrl,
    instagramUrl:profile.instagramUrl,
    tiktokUrl:profile.tiktokUrl,
    recruitmentUrl:profile.recruitmentUrl,
    logoImage:resolveCustomStoreLogo(profile.logoImage),
  },
});
