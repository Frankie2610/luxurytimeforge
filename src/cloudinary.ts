export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();
const signedEndpoint = import.meta.env.VITE_CLOUDINARY_SIGN_ENDPOINT?.trim();
const defaultFolder = import.meta.env.VITE_CLOUDINARY_FOLDER?.trim() || 'timeforge';

export const cloudinaryEnabled = Boolean(cloudName && (uploadPreset || signedEndpoint));

async function getSignedParams(folder: string) {
  if (!signedEndpoint) return null;
  const response = await fetch(signedEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder }),
  });
  if (!response.ok) throw new Error('Không lấy được chữ ký upload Cloudinary.');
  return response.json() as Promise<Record<string, string | number>>;
}

export async function uploadCloudinaryImage(
  file: File,
  options: { folder?: string; onProgress?: (percent: number) => void } = {},
): Promise<CloudinaryUploadResult> {
  if (!cloudName) throw new Error('Thiếu VITE_CLOUDINARY_CLOUD_NAME trong .env.');
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} không phải file hình ảnh.`);
  if (file.size > 15 * 1024 * 1024) throw new Error(`${file.name} vượt quá 15MB.`);

  const folder = options.folder || defaultFolder;
  const signed = await getSignedParams(folder);
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);

  if (signed) {
    Object.entries(signed).forEach(([key, value]) => form.append(key, String(value)));
  } else if (uploadPreset) {
    form.append('upload_preset', uploadPreset);
  } else {
    throw new Error('Thiếu upload preset hoặc signed endpoint Cloudinary.');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) options.onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () => reject(new Error('Không thể kết nối Cloudinary.'));
    xhr.onload = () => {
      let payload: Record<string, unknown> = {};
      try { payload = JSON.parse(xhr.responseText) as Record<string, unknown>; } catch { /* noop */ }
      if (xhr.status < 200 || xhr.status >= 300) {
        const message = (payload.error as { message?: string } | undefined)?.message;
        reject(new Error(message || 'Cloudinary từ chối upload.'));
        return;
      }
      resolve({
        url: String(payload.url || ''),
        secureUrl: String(payload.secure_url || ''),
        publicId: String(payload.public_id || ''),
        width: Number(payload.width || 0),
        height: Number(payload.height || 0),
        format: String(payload.format || ''),
        bytes: Number(payload.bytes || 0),
      });
    };
    xhr.send(form);
  });
}

export async function uploadCloudinaryImages(
  files: File[],
  options: { folder?: string; onFileProgress?: (name: string, percent: number) => void } = {},
) {
  const uploaded: CloudinaryUploadResult[] = [];
  for (const file of files) {
    uploaded.push(await uploadCloudinaryImage(file, {
      folder: options.folder,
      onProgress: percent => options.onFileProgress?.(file.name, percent),
    }));
  }
  return uploaded;
}
