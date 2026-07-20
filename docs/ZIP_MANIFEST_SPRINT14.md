# ZIP Manifest — Sprint 14

The distributable ZIP contains the complete React/Vite/TypeScript source, build output and project configuration.

Included:

- `src/`
- `api/`
- `public/`
- `dist/`
- `docs/`
- `package.json`
- `package-lock.json`
- Vite and TypeScript configuration
- Vercel configuration
- Firebase rules example
- `.env.example`
- Windows start scripts

Intentionally excluded:

- `node_modules/`
- real `.env`
- Firebase private keys
- Cloudinary API secret
- payment provider secret

The ZIP should be extracted before running `pnpm.cmd install` or `npm.cmd ci`.
