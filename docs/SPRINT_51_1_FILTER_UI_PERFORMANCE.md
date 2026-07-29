# Luxury Timeforge V51.1 — Filter, UI and performance

## Fixed

- Replaced the collection filter's Radix lifecycle with a persistent React portal.
- Filter choices remain draft-only until **Xem … sản phẩm** is pressed.
- Deferred result-count calculation so checkbox painting is not blocked.
- Added final geometry/visibility overrides to prevent older CSS layers from leaving a blank white drawer.
- Unified the green eyebrow badge across **CURATED WORLDS**, **THE TIMEFORGE SELECTION**, and **ĐƯỢC LỰA CHỌN NHIỀU** on desktop, tablet, and mobile.
- Forced desktop announcement, navigation, search label, logo text, and brand rail text to 13px in the final stylesheet.

## Performance changes

- Restored a normalized local catalog cache instead of deleting it on every refresh.
- Uses stale-while-revalidate: cached products paint immediately and Firebase refreshes later.
- Defers Firebase SDK/network startup to browser idle time when cached data is available.
- Defers large localStorage serialization to browser idle time.
- Loads the full product seed only when Reset is requested instead of including it in initial startup.
- Avoids starting Firebase Auth on public storefront routes.
- Builds the filter index and facet counts in one product pass.
- Memoizes collection/vendor/price/home-derived lists.
- Adds Cloudinary `f_auto`, `q_auto:eco`, DPR and bounded resize transformations.
- Adds early preconnects for Cloudinary and Firebase static assets.

## Checks run

- TypeScript syntax/transpile checks for all modified TS/TSX modules.
- Responsive grid check.
- Managed content page check.
- Firebase Auth session/static behavior check.
- Admin CSS import check.
- CSS audit and dead-code reachability audit.
- ZIP integrity test.

A full dependency build was not executed in the sandbox because the package registry returned HTTP 503 while installing dependencies. Vercel/local CI should run `pnpm install --frozen-lockfile && pnpm run build` normally.
