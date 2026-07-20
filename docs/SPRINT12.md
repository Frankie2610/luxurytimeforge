# Sprint 12 — Customer Accounts, Draft Orders and UI refinement

## Customer Account

The customer-facing account flow is isolated from Admin and from the main storefront shell. It supports order history, order detail, shipment status, addresses and reorder. Public order lookup requires the order number and the matching email or phone.

## Draft Orders

Draft orders are stored under `tf.v12.draft-orders` in local mode and `timeforge/draftOrders` in Firebase mode. The editor supports product/customer selection, custom unit prices, quantities, discounts, shipping, notes and conversion into a regular admin order.

Converting a draft order:

1. Validates inventory.
2. Creates an admin-source order.
3. Deducts product/variant inventory.
4. Creates inventory adjustment records.
5. Updates the selected customer totals.
6. Marks the draft as completed.

## Documents

- Order invoice: `/admin/orders/:id/invoice`
- Shipping label: `/admin/orders/:id/shipping-label`
- Draft invoice: `/admin/draft-orders/:id/invoice`

The document routes are protected by Admin Authentication and use print-specific CSS.

## Theme Editor

Sprint 12 adds a nested block grouping helper. It stores block group metadata separately so existing theme JSON and the existing storefront renderer remain backward compatible.

## Accessibility and responsive behavior

- Keyboard focus indicators.
- Customer-page skip link.
- Reduced-motion media query.
- Tablet two-column layouts collapse before mobile.
- Mobile editors and account pages become single-column.
- Wide admin tables remain horizontally scrollable rather than crushing columns.
- Modals become bottom sheets on narrow screens.
