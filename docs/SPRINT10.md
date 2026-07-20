# TimeForge Sprint 10 — Luxury Storefront & Operations Parity

Version: `0.10.0-alpha.1`

## Storefront

- New isolated luxury storefront component layer (`storefront-v10.tsx`).
- Dedicated stylesheet namespace (`sprint10.css`) prevents old sprint selectors from overriding V10 components.
- Editorial homepage with full-bleed hero, assurance strip, staggered collection cards, refined product grid, brand story and journal CTA.
- Product cards support second-image hover, sale/low-stock badges, wishlist state and quick add.
- Collection page adds visual hero, filter drawer, active filter chips, price bands and sort controls.
- Product detail page adds full-frame product imagery, thumbnail gallery, arrows, zoom viewer, selected variant pricing/inventory, refined quantity control, wishlist, service promises, accordions, related products and mobile sticky purchase bar.
- Header/search/mobile menu/cart drawer/footer redesigned for a premium watch storefront.
- Responsive layouts for desktop, tablet and mobile.

## Admin operations

The Products V9 interaction model is now extended to:

- Orders
- Customers
- Inventory
- Discounts

Features include:

- Shopify-style saved-view tabs.
- Search and filter surfaces.
- TanStack Table resource indexes for Orders and Customers.
- Bulk actions.
- Resource drawers.
- Standardized badges, action menus, empty states and modals.
- Inventory overview metrics and adjustment history.
- Discount form validation with React Hook Form and Zod.

## Libraries added

- `@tanstack/react-table`
- `framer-motion`
- `react-hook-form`
- `zod`
- `@hookform/resolvers`
- Exact compatible `motion-dom` and `motion-utils` versions are pinned for the Vite 8 build.

## Compatibility

- Existing Products V9, Collections, Product Editor, Theme Editor, Import/Export, Dashboard, Analytics, Activity Log, Firebase adapter, Authentication and Cloudinary adapter remain available.
- Local storage fallback remains active until Firebase is configured.
