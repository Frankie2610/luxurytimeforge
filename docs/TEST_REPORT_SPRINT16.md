# Sprint 16 Test Report

## Completed checks

| Check | Result |
|---|---|
| Clean dependency installation | Pass |
| TypeScript project check | Pass |
| Vite production build | Pass |
| Storefront route checks | HTTP 200 |
| Customer Account route checks | HTTP 200 |
| Admin route checks | HTTP 200 |
| Analytics route | HTTP 200 |
| Returns route | HTTP 200 |
| Theme Editor route | HTTP 200 |
| Shipping webhook syntax | Pass |
| Customer OTP endpoint syntax | Pass |
| Shipping webhook without config | HTTP 501 |
| Shipping webhook invalid signature | HTTP 401 |
| OTP endpoint without config | HTTP 501 |
| Customer source scan for `mày/tao` | No matches |
| `npm audit --omit=dev` | Inconclusive — audit gateway was intermittent |

## Routes checked

```text
/
/products/versace-medusa-eclipse-ve5f00126
/cart
/account/login
/admin/login
/admin
/admin/products
/admin/collections
/admin/import-export
/admin/returns
/admin/analytics
/admin/online-store
```

## Build observations

- Admin shell is emitted as a separate lazy chunk.
- Analytics remains a separate route chunk because Recharts is comparatively large.
- Storefront does not eagerly load the Analytics route.
- CSS remains large because historical sprint styles are retained for backward compatibility. Sprint 16 reduces collision risk through namespacing and final containment rules; a later cleanup can remove unused legacy selectors.

## Limitations

### Visual automation

Chromium localhost screenshots were blocked by an organization policy in the execution environment. No claim of pixel-perfect automated visual validation is made.

### Dependency audit

The audit endpoint was inconsistent in the build environment: one run returned `0 vulnerabilities`, while the final clean-archive run returned HTTP 502. No definitive vulnerability claim is made. Dependency installation, type checking and production build completed independently.

### External integrations

OTP delivery, Firebase server writes, payment providers and shipping carriers require real server environment variables and external endpoints. The included tests cover configuration and signature guards, not live third-party delivery.
