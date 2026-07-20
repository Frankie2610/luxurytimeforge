# Sprint 22 changes

## Storefront product detail

- Replaced the large assurance/policy grid with a compact Radix UI accordion.
- Combined related information into three dropdowns: authentication/payment, insured shipping, and after-sales/warranty/returns.
- Kept all original customer-facing policy content while reducing visual weight.
- Rebuilt the estimated-delivery component with compact spacing, aligned milestones and a vertical mobile flow.
- Centered the cart icon and `Thêm vào giỏ` label as one visual unit.

## Product media administration

- Removed the `Đặt làm ảnh chính` action.
- The first image in the ordered list is automatically the first storefront image.
- Images are reordered only by drag and drop.
- Switched the sortable grid strategy to `rectSortingStrategy`.
- Restyled the delete control and dragging state.

## Theme editor and storefront linkage

For the active TimeForge theme, Save now performs both operations:

1. Save the theme draft.
2. Publish the same theme to the storefront.

The storefront reads `themeState.published`, so changes to supported theme settings and sections are visible after Save.

## Admin topbar

- Rebalanced search, status, actions and account areas.
- Added truncation and width containment for long names.
- Reduced crowded labels on tablet and mobile.
