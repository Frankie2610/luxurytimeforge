# ZIP Manifest — Sprint 49.23

- Base: Sprint 49.22 alpha 1.
- Version: `0.49.23-alpha.1`.
- New managed policy-page data/editor: `src/content-pages-v23.ts`, `src/content-pages-admin-v23.tsx`.
- New isolated admin styling: `src/v4923-admin-content.css`.
- New storefront policy styling: `src/v4923-storefront.css`.
- Updated Journal, discounts, admin navigation/permissions and Firebase Rules template.
- Added recursive Firebase payload sanitizer and removed explicit undefined `children` from theme blocks.
- Hardened admin invitation messaging and plain-link verification flow.
- `.env.local`, `node_modules`, `dist` and private Firebase credentials are excluded from the ZIP.
