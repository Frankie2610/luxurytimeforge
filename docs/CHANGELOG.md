# Changelog

## 0.56.6 — Footer identity, compact About and faster Admin navigation

- Removed the duplicated footer logo/name lockup so the editable shop name appears only once.
- Increased the footer store name to a 24–30px desktop scale with 950 weight and black text, while retaining responsive sizing.
- Added direct order-tracking access in the footer and a lightweight customer utility dock with order tracking and back-to-top actions.
- Reduced About-page title scales, tightened spacing, added a three-part trust layer and linked warranty/order-tracking shortcuts.
- Added a device-local five-page Admin history menu and one-click copying of the current Admin URL.
- Refined Admin topbar, page headers, cards, active navigation and sticky table headers.
- Added targeted below-fold paint containment without adding blur, heavy animation or new runtime dependencies.
- Added V0.56.6 regression checks and preserved V0.56.4–V0.56.5 checks.

## 0.56.5 — Isolated storefront rendering and practical shortcuts

- Stabilized the published and draft theme objects so cart quantity changes no longer invalidate the main commerce context or re-render unrelated storefront routes.
- Moved Wishlist state to a small external store with item-level subscriptions; changing one heart now updates that product card instead of every visible card.
- Memoized repeated product cards and removed the storefront's static Framer Motion import, replacing three simple reveals with short opacity/transform CSS animations.
- Disabled expensive live background blur on the sticky header, newsletter/privacy layers and mobile purchase bars while preserving their visual contrast.
- Added device-local recent-search chips with duplicate removal, a six-term cap and a clear-history action on responsive customer search.
- Added one-click copying of the public product URL in Product Editor, including a browser fallback and compact tablet/mobile styling.
- Added V0.56.5 regression coverage for render isolation, bundle guards, responsive utilities, reduced motion and scoped Admin polish.

## 0.56.4 — Responsive Wishlist typography and focused product editing

- Set the Wishlist sort value and its native options to 12px on desktop, 11px on tablet and 10px on mobile, using the same UI sans-serif stack so the default value no longer appears oversized.
- Restored an intentional, thin vertical scrollbar for the Product Detail right column on desktop while retaining one normal document scrollbar on tablet and mobile.
- Added a live Product Readiness checklist with quick links for product content, media, price, inventory, organization, SEO and storefront filters.
- Increased and strengthened the dynamic footer store name; the value continues to be edited from Admin and is synchronized with the header, invoices and shipping labels.
- Fixed the storefront header/navigation text at 13px and added native product sharing with a clipboard fallback.
- Removed redundant commerce-context subscriptions from repeated logo instances and disabled expensive blur repainting on fixed search/filter overlays.
- Added V0.56.4 regression coverage for all responsive sizes, Admin scroll boundaries, editable identity, utility features and performance guards.

## 0.56.3 — Admin scroll cleanup and synchronized storefront menu

- Changed Product Detail and the Online Store overview to use one document-level vertical scrollbar instead of nested page/panel scrollbars.
- Disabled scrolling inside the two non-interactive Online Store preview iframes and removed their pointer work.
- Kept Theme Editor panels independently scrollable while hiding secondary scrollbar rails so only the main preview rail remains visible.
- Synchronized storefront Menu locking and paint before the first frame, removed the expensive overlay blur, and disabled the drawer entrance delay on tablet/narrow desktop.
- Reduced the Wishlist selected sort value to 11px desktop, 10.5px tablet and 10px mobile while retaining readable native option sizes.
- Increased dense Product Editor and Theme Editor typography without broad global overrides.
- Added Product Editor quick-jump links, `Ctrl/⌘ + S`, an unsaved-leave warning, expanded Menu accessibility state and a Track Order link.
- Added V0.56.3 regression coverage for route scrolling, preview isolation, responsive Wishlist typography, menu synchronization and the new utility features.

## 0.56.2 — Wishlist controls and cart/menu performance

- Set the Wishlist sort select to exactly 12px on desktop, 11px on tablet and 10px on mobile, with a custom chevron, cleaner spacing and a visible keyboard focus state.
- Refined the Wishlist hero hierarchy and tightened its mobile heading, description and product-count panel.
- Added a final high-specificity media boundary that removes padding from the Wishlist image wrapper and product image while retaining square full-bleed cropping.
- Split cart state and stable cart actions from the main commerce context so quantity changes no longer broadcast a re-render across the storefront catalog.
- Replaced the mobile menu and cart drawer spring wrappers with short compositor-only opacity/transform animations and removed their expensive backdrop blur.
- Memoized cart product lookup and totals, reduced drawer image requests from 900px to 320px, and enabled lazy low-priority decoding.
- Removed per-line Framer layout measurement from the cart route and centered cart media/copy/actions at desktop, tablet and mobile sizes.
- Added V0.56.2 regression checks covering exact responsive typography, full-bleed media, isolated cart state and low-cost drawer animation.

## 0.56.1 — Legacy data recovery and Wishlist media correction

- Added central product normalization for old or imported records missing `images`, `tags`, `variants`, `options` or `metafields`, including Firebase map-shaped fields and single-string media/tag values.
- Kept products with historical Firebase-incompatible SKUs readable and editable while retaining explicit validation before saving.
- Added collection normalization so old `productIds` and `conditions` values cannot crash collection membership checks.
- Migrated draft, published and historical themes into complete render-safe templates, sections and block arrays before Admin state receives them.
- Added route-level safety guards to Product Editor, Online Store overview and Theme Editor history for malformed legacy records.
- Rebuilt Wishlist media as square, full-bleed, center-cropped imagery without the nested-card appearance.
- Changed mobile Wishlist cards to a compact two-column grid, reduced the main heading to 26px (24px on narrow phones), and tightened product typography/actions.
- Retained lazy image delivery and offscreen card containment while avoiding new blur-heavy effects.
- Added executable legacy product/theme/collection fixtures plus direct-route, responsive, bundle and production-build regression coverage.

## 0.56.0 — Shared Wishlist, comparison and reusable Admin views

- Added shareable Wishlist links that import valid, published products into the recipient's device-local list without replacing existing saved items.
- Added a responsive comparison flow for up to three Wishlist products, including price, brand, type, availability and SKU.
- Added today, 7-day and 30-day filters to Admin orders and persisted each range in the URL.
- Added one-click copying of the current order search/filter view for reopening or sharing the exact result set.
- Added a device-persisted compact/comfortable Admin table density switch in the account menu.
- Kept new visual rules isolated in V0.56 stylesheets, with tablet/mobile breakpoints, reduced-motion handling and square centered product media.
- Added offscreen Wishlist-card rendering containment and avoided new blur-heavy effects to reduce scrolling and overlay jank.
- Added V0.56 regression coverage while retaining V0.55 and V0.54 navigation/data-normalization checks.

## 0.55.0 — Admin forms, Wishlist and interaction performance

- Rebuilt the Admin order search/filter toolbar with collision-safe grid tracks, consistent control sizing and focused tablet/mobile layouts.
- Extended the same search-input treatment to products, customers, inventory, discounts, returns and draft orders without adding broad global overrides.
- Added debounced URL-backed order search, `/` focus shortcut, Escape-to-clear, filtered result counts and CSV export.
- Added a second normalization boundary inside order detail so malformed legacy workflow records cannot trigger `undefined.filter` during direct navigation.
- Rebuilt Wishlist cards around centered, square, non-rounded `object-fit: contain` media with a compact mobile list layout and smaller responsive typography.
- Added persistent Wishlist sorting, “add all available” and clear-list actions.
- Memoized Wishlist/product/search/segment lookups, deferred Wishlist persistence, prefetched high-intent routes and stopped query-string changes from remounting the storefront route view.
- Reduced mobile blur, hover transforms and unnecessary promoted image layers; added reduced-motion and paint-containment safeguards.
- Added V0.55 regression checks covering layout boundaries, useful actions, legacy-data safety and performance guards.

## 0.54.0 — Navigation reliability and scoped polish

- Fixed the Admin order-detail crash caused by legacy workflow records missing `events`, `fulfillments`, `refunds` or `returns` arrays.
- Normalized array- and Firebase-map-shaped data for orders, workflows, returns, draft orders, customer segments, product views and blog posts.
- Replaced order-row navigation buttons with real links and persisted search, status and payment filters in the Admin URL.
- Added direct filtered links from the Admin Priority Center and searchable order results in the command palette.
- Added an Admin route recovery boundary so one malformed resource cannot blank the entire management interface.
- Added a device-local “Sản phẩm bạn vừa xem” section with a clear-history action on product pages.
- Deferred large order/product searches, lazy-decoded Admin thumbnails and excluded generated preview directories from Vite file watching.
- Kept all new visual rules scoped to the Admin recovery/orders/dashboard surfaces and the new recently-viewed storefront section.
- Added V0.54 runtime fixtures and regression checks for legacy workflow data and internal navigation.

## 0.53.1 — Layout stability correction

- Removed the two broad V0.53 visual override stylesheets that were competing with established storefront and Admin breakpoints.
- Restored the proven storefront compatibility layer and the original Atelier theme defaults.
- Replaced 37.7 KB of global visual overrides with 9.9 KB of narrowly scoped CSS for the wishlist control and the new Admin dashboard only.
- Kept the persistent wishlist, `/wishlist` page, Operations Pulse, Priority Center and quick actions.
- Added explicit shrink protection and isolated responsive rules for the new dashboard at desktop, tablet, mobile and narrow-mobile widths.
- Hid the extra wishlist icon from the compact mobile header while retaining it in the mobile navigation drawer.
- Added a layout-stability regression suite that prevents the removed global override files from returning.

## 0.53.0 — Storefront, Admin and performance polish

- Introduced a warmer deep-forest/ivory visual system with clearer type scale, spacing, cards, navigation, forms and focus states across customer and Admin screens.
- Added a persistent wishlist shared by the header, product cards, product detail and the new responsive `/wishlist` page.
- Reworked the Admin overview into an Operations Pulse with seven-day revenue context, priority alerts and practical quick actions.
- Added final responsive layers for desktop, tablet and mobile, including touch-friendly controls, 16px mobile form fields, adaptable product grids and scroll-safe Admin tables.
- Removed the storefront's static dependency on the 45.61 KiB gzip legacy stylesheet and removed runtime DOM font-size mutation from the customer header.
- Added offscreen rendering containment, reduced-motion handling and a production-manifest guard that prevents legacy CSS from returning to the storefront's static graph.
- Added V0.53 regression checks while retaining all V0.52.1–V0.52.7 verification suites.

## 0.51.3 — Store identity and header correction

- Added device-based shop logo upload in Admin with preview, validation and class-based responsive styling.
- Uploads the selected image to Cloudinary only when **Lưu thông tin** is pressed.
- Saves `secure_url` with the full public shop profile at `timeforge/settings/store` and synchronizes draft/published theme identity.
- Reads the Firebase-backed logo in the storefront header and updates favicon/apple-touch icon.
- Overrides historical 10–11px header rules with final ID selectors plus a runtime `13px !important` safeguard from 821px upward.
- Reuses the green TimeForge Selection badge treatment for Journal, Related, Search Results and Discover labels.
- Reduces payment-logo dimensions and keeps new uploader styling isolated from the initial storefront bundle.

## 0.31.0-alpha.1 — Sprint 31

- Storefront typography đậm, rõ và đồng đều hơn.
- Tăng khoảng thở toàn bộ buy panel trang sản phẩm.
- Làm lại heading Selection/Best Sellers/Journal/Related.
- Khôi phục ảnh checkout bằng product image resolver và fallback nội bộ.
- Khóa Add to cart và Buy now khi hết hàng.
- Giới hạn cart quantity theo tồn kho variant.

## 0.30.0-alpha.1 — Sprint 30

- Reworked Product Detail delivery, description and specifications to follow the supplied editorial reference.
- Removed bordered/table-like specification rows and replaced them with an animated bullet list.
- Added stronger reading margins and a narrower description measure.
- Removed `YOUR ORDER` from checkout.
- Enlarged checkout product imagery, added product links and clarified quantity/vendor/title/price hierarchy.
- Redesigned the checkout discount-code field and retained the Radix/CVA button system.
- Kept the pnpm/Corepack Windows launcher fallback introduced in V29 alpha.3.

## 0.15.0-alpha.1

- Enforced neutral, professional customer-facing copy with no `mày/tao` language.
- Added a shared React component system built on Radix UI, CVA, clsx and tailwind-merge.
- Migrated product zoom, product information accordion, request-type tabs and return actions to shared accessible components.
- Added Sonner toast feedback across storefront and admin actions.
- Added return and exchange requests plus Shopify-style bulk processing in Admin.
- Added Recharts commerce analytics for revenue, checkout funnel, payment methods and return/exchange rate.
- Added storefront commerce-event tracking for product, cart and checkout milestones.
- Added direct nested child-block editing in Theme Editor.
- Added an HMAC-verified payment webhook with optional server-side Firebase reconciliation.
- Brightened storefront surfaces, strengthened typography and enforced a 16px minimum for customer-facing text.
- Improved responsive media, dialogs, tables, bulk bars and nested-block inspector behavior.
- Removed the ineffective dynamic import warning for the shared authentication module.

## 0.11.0-alpha.1

- Replaced the Sprint 10 cart and checkout with luxury V11 pages.
- Added dedicated order detail pages.
- Added fulfillment, return, partial/full refund, restock and timeline workflows.
- Added Customer Segments with dynamic member calculation.
- Added a reusable Product/Collection Resource Picker.
- Added Theme Editor section presets.
- Added Firebase synchronization for order workflows and customer segments.
- Added Cloudinary delivery transformations, image dimensions, lazy loading and skeleton placeholders.
- Added new responsive CSS for admin and storefront workflows.

## 0.16.0-alpha.1

- Replaced the legacy Admin shell with a namespaced, responsive Shopify-inspired layout.
- Added desktop sidebar, tablet icon rail and mobile off-canvas navigation.
- Added route-aware headings, quick create, command search, status chips and pending counts.
- Added CSS containment for cards, tables, forms, drawers, Theme Editor and media grids.
- Added first-touch UTM/referrer attribution and source conversion Analytics.
- Added server OTP request/verify adapters and signed customer-session tokens.
- Added HMAC-verified shipping webhook with fulfillment and timeline updates.
- Completed replacement-product selection and real exchange-order creation.

## 0.27.0-alpha.1 — Sprint 27

- Added direct block selection in the real storefront Theme Editor preview.
- Added searchable section library and new shared storefront section renderers.
- Connected shared sections to Product, Collection, Search, Cart, and Page templates.
- Added Cloudinary inspector uploads, theme presets, history restore, and JSON import/export.
- Added typography, spacing, radius, motion, and dark-surface contrast tokens.
- Reworked Search and Cart as real customizable theme templates.
- Replaced remaining fixed storefront light surfaces with theme-aware colors.
