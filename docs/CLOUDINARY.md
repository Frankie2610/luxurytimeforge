# Cloudinary setup

TimeForge stores storefront media on Cloudinary and stores business data on Firebase/localStorage.

## Quick test with unsigned uploads

1. In Cloudinary Console, create an **unsigned upload preset**.
2. Restrict the preset to images, allowed formats (jpg, png, webp, avif), maximum size, and folder when possible.
3. Copy `.env.example` to `.env`.
4. Fill:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
VITE_CLOUDINARY_FOLDER=timeforge
```

Restart `npm run dev` after changing `.env`.

## Production signed uploads

Do not put `api_secret` in Vite or any browser code. Set `VITE_CLOUDINARY_SIGN_ENDPOINT` to a protected backend endpoint. The endpoint should return `timestamp`, `signature`, and `api_key`. The frontend adapter will use those values for signed uploads.

## Folders

- `timeforge/products/<handle>`
- `timeforge/collections/<handle>`
- `timeforge/theme/logo`
- `timeforge/theme/sections`
