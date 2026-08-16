export interface CloudinaryUploadResult{url:string;publicId:string;width:number;height:number}

type CloudinaryResponse={secure_url?:string;url?:string;public_id?:string;width?:number;height?:number;error?:{message?:string}};

const cloudName=String(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME||'').trim();
const uploadPreset=String(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET||'').trim();
const baseFolder=String(import.meta.env.VITE_CLOUDINARY_FOLDER||'timeforge').trim().replace(/^\/+|\/+$/g,'');

export const cloudinaryUploadConfigured=Boolean(cloudName&&uploadPreset);
export const isCloudinaryImageUrl=(value:string)=>!value.trim()||/^https:\/\/res\.cloudinary\.com\//i.test(value.trim());

export async function uploadCloudinaryImage(file:File,subfolder='shop'):Promise<CloudinaryUploadResult>{
  if(!cloudinaryUploadConfigured)throw new Error('Cloudinary chưa được cấu hình. Cần VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET trên Vercel.');
  if(!file.type.startsWith('image/'))throw new Error('Chỉ chấp nhận file hình ảnh.');
  if(file.size>8*1024*1024)throw new Error('Ảnh phải nhỏ hơn 8 MB.');

  const data=new FormData();
  data.append('file',file);
  data.append('upload_preset',uploadPreset);
  if(baseFolder)data.append('folder',`${baseFolder}/${subfolder}`);
  data.append('context',`source=timeforge-admin|asset=${String(subfolder||'image').replace(/[^a-z0-9_-]/gi,'-')}`);

  const response=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,{method:'POST',body:data});
  const payload=await response.json() as CloudinaryResponse;
  if(!response.ok||payload.error)throw new Error(payload.error?.message||'Không thể tải ảnh lên Cloudinary.');
  const url=String(payload.secure_url||payload.url||'');
  if(!url)throw new Error('Cloudinary không trả về đường dẫn ảnh.');
  return{url,publicId:String(payload.public_id||''),width:Number(payload.width||0),height:Number(payload.height||0)};
}
