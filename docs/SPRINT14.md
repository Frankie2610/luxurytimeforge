# Sprint 14 — Visual consistency and product conversion pass

## Storefront

### Typography

- Base readable size is 16px.
- Header navigation and logo were increased approximately 30%.
- Headings use consistent 650–700 weight.
- Body copy uses consistent 500 weight and brighter contrast.
- The storefront background is now white rather than cream.

### Product detail page

- Main product media is square and capped at 680px on large screens.
- Product media uses `object-fit: contain`, suitable for square watch images.
- Thumbnails also use contained square media.
- Zoom, previous/next, wishlist and quantity controls share one shape/radius system.
- Add-to-cart uses a deep green primary action.
- Buy-now uses a restrained burgundy luxury accent.
- Delivery estimate timeline is responsive.
- Shopify description HTML is parsed into paragraphs and `li` specification rows.
- The product route resets image/variant state and every storefront route scrolls to the top.

### Responsive

- Desktop product page uses a two-column composition.
- Tablet switches to a stacked square gallery and horizontal thumbnails.
- Mobile keeps 16px readable text, one-column specifications and vertical delivery steps.

## Admin

- Stronger font weights and larger labels across cards, forms, tables and headings.
- Import preview uses a two-column card grid on desktop and one column on smaller screens.
- Each imported product has its own image surface, title, handle and status badge.
- Media upload grid uses auto-fill sizing and larger gaps.
- Import/export settings and actions stack safely on mobile.

## Files changed

- `src/storefront-v10.tsx`
- `src/admin.tsx`
- `src/main.tsx`
- `src/sprint14.css`
- `package.json`
- `package-lock.json`
