# Sprint 16 ZIP Manifest

The release archive contains the complete TimeForge source tree under one root directory.

## Included

- React and TypeScript source under `src/`.
- Vercel Functions under `api/`.
- Production output under `dist/`.
- `package.json` and `package-lock.json`.
- Vite, TypeScript, Tailwind and Vercel configuration.
- Firebase rules example.
- Cloudinary, authentication and sprint documentation.
- Shopify CSV sample under `public/data/`.
- Windows development and preview scripts.

## Deliberately excluded

```text
node_modules/
.env
.env.local
Firebase service-account files
Cloudinary API secret
Payment-provider secret
OTP/session secret
Shipping webhook secret
```

## Installation

```powershell
pnpm.cmd install
pnpm.cmd run dev
```

The archive is verified by extracting it to a clean directory, installing dependencies from the lockfile, running TypeScript checks and producing a new production build.

## Release summary

- Archive version: `0.16.0-alpha.1`
- Files: 158
- Archive size: approximately 904 KB
- Production `dist/`: included
