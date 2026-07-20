# TimeForge Sprint 15 — Test Report

Test date: 2026-07-17
Version: `0.15.0-alpha.1`

## Automated checks

| Check | Result |
|---|---|
| TypeScript `npm run typecheck` | Pass |
| Production build `npm run build` | Pass |
| Vite production preview | Pass |
| Node syntax: payment create/webhook and Cloudinary signing functions | Pass |
| HMAC webhook: valid signature | HTTP-style 200 response |
| HMAC webhook: invalid signature | HTTP-style 401 response |
| Customer-facing `mày/tao` source scan | No matches |
| Package and lockfile version | Both `0.15.0-alpha.1` |
| Route fallback checks | All tested routes returned HTTP 200 |
| Secret scan | No populated secrets found |

## Routes checked

- `/`
- `/collections`
- `/products/versace-medusa-eclipse-ve5f00126`
- `/cart`
- `/checkout`
- `/account/login`
- `/track-order`
- `/admin/login`
- `/admin/products`
- `/admin/returns`
- `/admin/analytics`
- `/admin/online-store`

## Build notes

- Admin Analytics is route-lazy-loaded and contains Recharts/date-fns in its own chunk.
- Storefront, checkout, account, returns and editor modules remain split by route.
- The previous ineffective Auth dynamic-import warning was removed by importing `ProtectedAdmin` from the already-loaded authentication module.

## Dependency audit note

`npm audit --omit=dev` could not complete in the build environment because the configured package audit gateway returned HTTP 502. This report does not claim a successful vulnerability audit. `npm ci`, TypeScript and production build were tested separately from the packaged ZIP.

## Visual validation limitation

Headless Chromium remained unstable in the container because of its process/DBus environment. No claim is made that an automated pixel screenshot comparison passed. Responsive behavior was validated through component structure, final CSS breakpoints, successful production rendering and route-level runtime checks. Manual browser review on the target Windows machine is still recommended.
