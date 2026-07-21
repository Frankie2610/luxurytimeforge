# Sprint 49.19 — Storefront CSS rollback hotfix

## Root cause

Sprint 49.17 removed the `legacy.css` import from `blog-v18.tsx`. `storefront-v10.tsx` imported `BlogCardsV18` from that same module, so the storefront had been receiving legacy storefront foundations through an accidental transitive import. Removing it changed the CSS graph for every customer-facing route and caused the layout regression.

## Fix

- `storefront-v10.tsx` now imports `legacy.css` explicitly before the current compatibility and storefront modules.
- Home blog cards were extracted to `blog-home-cards-v18.tsx`.
- Blog route/admin code and `v4917-blogs.css` no longer load into every storefront route.
- Current storefront modules still load after legacy styles, so the 49.15–49.18 targeted overrides keep precedence.
- Product cards remain flat and scoped under `.tf-product-card-v4918`.

This hotfix prioritizes visual stability. The legacy stylesheet cost remains until its required storefront selectors are migrated into a smaller compatibility layer.
