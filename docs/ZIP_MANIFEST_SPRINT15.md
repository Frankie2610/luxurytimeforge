# TimeForge Sprint 15 — ZIP Manifest

The archive contains the complete source required to install, develop and build the project.

Final package: **144 files**, approximately **867 KB compressed** and **3.2 MB extracted without dependencies**.

Included:

- React and TypeScript source in `src/`
- Shared Radix/CVA UI kit in `src/ui/`
- Vercel serverless functions in `api/`
- Shopify CSV sample in `public/`
- Production build in `dist/`
- `package.json` and `package-lock.json`
- Vite, TypeScript, Firebase and Vercel configuration
- Windows start scripts
- Documentation and test reports

Intentionally excluded:

- `node_modules/`
- `.env`
- Local logs and screenshots
- Firebase private credentials
- Cloudinary API secret
- Payment-provider and webhook secrets

After extraction:

```powershell
pnpm.cmd install
pnpm.cmd run dev
```

`npm.cmd ci` is also supported when npm on the machine is healthy.
