# Sprint 13 test report

## Build checks

- `npm ci --no-audit --no-fund`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `npm audit --omit=dev --audit-level=high`: PASS — 0 vulnerabilities

## Route checks using Vite preview

The following routes returned HTTP 200:

- `/`
- `/collections`
- `/products/versace-medusa-eclipse-ve5f00126`
- `/cart`
- `/checkout`
- `/account/login`
- `/track-order`
- `/admin/login`
- `/admin`
- `/admin/orders`
- `/admin/returns`
- `/admin/settings/integrations`
- `/admin/online-store`

## Functional review

- Return request stores customer-selected quantities and reasons.
- Admin return status update supports optional restock.
- Integration settings persist to LocalStorage and Firebase adapter.
- Fulfillment tracking URL uses the configured template.
- Online payment remains hidden until enabled.
- Nested group blocks persist inside the theme draft and render recursively.
- Customer local session expiration and order challenge compile and route correctly.

## Environment limitation

`/api/payments/create` returns 404 under `vite preview` because Vite does not execute Vercel Functions. The function is included and must be tested with `vercel dev` or a Vercel deployment.
