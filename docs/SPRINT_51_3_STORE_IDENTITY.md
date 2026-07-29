# Sprint 51.3 — Store identity and final storefront typography

## Admin: Thông tin cửa hàng

- Added a class-based device file picker for the shop logo.
- The selected image is previewed locally; no upload happens while browsing files.
- Clicking **Lưu thông tin** uploads the image to Cloudinary under `timeforge/shop/logo`, receives the Cloudinary `secure_url`, then saves the full store profile object to `timeforge/settings/store`.
- The same profile is applied to `timeforge/themes/draft` and `timeforge/themes/published` in one Firebase multi-path update.
- Existing `logoImage` values remain supported. Removing the logo writes an empty value after save.

Required Vercel variables:

```text
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_UPLOAD_PRESET
VITE_CLOUDINARY_FOLDER=timeforge
```

The upload preset must be an unsigned image preset. Never expose a Cloudinary API secret in Vite/browser code.

## Firebase rules

`timeforge/settings/store` is public read so the storefront can render the logo and general shop information. Write access remains restricted to users with store-management permission.

Deploy the updated rules after deploying the source:

```bash
corepack pnpm run firebase:rules:deploy
```

## Storefront

- Header logo and browser favicon are read from the Firebase-backed `logoImage` field.
- Cloudinary transformations request a small, cacheable logo asset rather than the original upload.
- Header/announcement/brand navigation text is enforced at 13px from 821px upward using final ID selectors and a scoped runtime computed-style safeguard.
- TIMEFORGE JOURNAL, GỢI Ý PHÙ HỢP, SEARCH RESULTS and DISCOVER use the same green badge treatment as THE TIMEFORGE SELECTION.
- Footer payment marks are reduced in size on desktop and mobile.
