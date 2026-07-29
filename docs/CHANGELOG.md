# Changelog

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
