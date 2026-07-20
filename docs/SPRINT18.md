# TimeForge Sprint 18

## Storefront

- Product detail information was reorganized into a compact two-column experience.
- Product description and specifications now sit inside the right purchase column.
- Product assurance cards moved below the square image gallery.
- Add-to-cart and buy-now buttons share one compact row on desktop.
- Removed the English `PRODUCT STORY` and `PRODUCT DETAILS` labels.
- Footer contrast and typography were strengthened for dark backgrounds.
- The About page was redesigned as an editorial brand story.
- Collection filter, result count and sorting controls now use individual cards.
- Added featured products and best-selling products to the home page.
- Added TimeForge Journal to the storefront with index and article routes.

## Blog Admin

- Added `/admin/blogs`.
- Create, edit, publish, feature and delete blog posts.
- HTML content editor and Cloudinary URL field.
- LocalStorage fallback and Firebase `timeforge/blogPosts` integration.

## Online Store Admin

- Rebuilt the Online Store overview to follow Shopify's information hierarchy:
  performance strip, current theme preview, desktop/mobile previews, theme status,
  edit action and theme library.
- The theme editor remains the existing functional Template → Section → Block → Settings workflow,
  now wrapped in a cleaner editor shell.

## Responsive

- Product page, story page, collection controls, blog pages and Online Store have dedicated
  desktop, tablet, mobile and small-mobile rules.
- Long text uses wrapping and grid items use minimum-width containment.
