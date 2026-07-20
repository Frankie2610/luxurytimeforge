# Admin Authentication & Security

## Firebase Authentication
Enable Email/Password and/or Google in Firebase Authentication. Configure the Firebase Vite variables, then list authorized emails in `VITE_ADMIN_EMAILS`. The email in `VITE_OWNER_EMAIL` receives the `owner` role; other authorized emails receive `admin`.

When Firebase is not configured, the login screen exposes a local demo session only. This mode is for development and does not provide server-side security.

## Route protection
All `/admin/*` routes are wrapped in `ProtectedAdmin`. Unauthenticated users are redirected to `/admin/login` and returned to their original route after login.

## Cloudinary signed upload
`api/cloudinary/sign.js` is a Vercel serverless function. Set server-only `CLOUDINARY_API_SECRET`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_CLOUD_NAME` in Vercel. Never expose the secret through a `VITE_*` variable.

Use `CLOUDINARY_ALLOWED_ORIGINS` to restrict which storefront/admin domains can request a signature.
