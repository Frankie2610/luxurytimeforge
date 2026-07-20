# Sprint 27 — Theme Editor Parity and Storefront Contrast System

## Goal

Make `Cửa hàng online → Mở tùy chỉnh` behave like an actual storefront editor rather than a disconnected settings screen, while unifying typography, font weights, spacing, and contrast across the public store.

## Theme Editor

### Storefront-native preview

The preview remains a same-origin iframe opening the actual public route. Draft data is streamed through the V26 preview bridge, while public visitors continue to use the published theme.

### Direct section and block editing

- Every supported storefront section exposes `data-theme-section-id`.
- Editable content exposes `data-theme-block-id`.
- Clicking a section or block in the iframe selects the matching item in the sidebar.
- Selecting an item in the tree highlights and scrolls to the actual storefront element.
- Nested blocks, drag-and-drop, hide/show, duplicate, and delete remain available.

### Section library

The editor has a searchable library and template-specific allowed sections. V27 provides real storefront renderers for:

- Image with text
- Rich text
- Newsletter
- Multicolumn
- Video
- Testimonials
- FAQ
- Logo list
- Gallery
- Countdown banner

These shared sections can render on Home, Product, Collection, Search, Cart, and Page templates where allowed.

### Inspector improvements

- Typed select controls for alignment, background, color scheme, layout, aspect ratio, motion, and content source.
- Range controls for height, overlay, columns, limits, spacing, width, radii, and typography weights.
- Native color controls.
- Cloudinary upload fields for image, poster, and logo settings.
- Product and collection resource pickers remain available for preview context.

### Theme management

- Auto-save draft
- Save and publish
- Undo and redo
- Version history and restore
- Atelier, Midnight, and Minimal presets
- JSON theme export
- JSON theme import with migration through the current V27 schema

## Storefront renderer coverage

### Home

Theme order, visibility, blocks, and settings control all supported sections.

### Product

Product main, trust, recommendations, and allowed shared editorial sections render on the real product route.

### Collection

Collection banner and grid remain dynamic. Banner heading and text blocks are directly selectable. Allowed shared sections render after the grid.

### Search

Search results are now controlled by the Search template:

- visibility
- result columns
- suggestions before a query
- supplemental shared sections

### Cart

Cart main and trust sections expose real theme IDs. Shared rich text, FAQ, and newsletter sections render on both full and empty-cart states.

### Page

The content route keeps its dynamic page content and renders allowed supplemental sections from the Page template.

## Typography and contrast

V27 introduces theme tokens for:

- heading and body fonts
- heading scale
- heading and body weights
- content width
- section spacing
- card and button radius
- motion level
- text on dark surfaces

The storefront uses a fixed typography scale and normalized weights. Legacy hard-coded white backgrounds are overridden with theme surfaces. Any declared dark surface inherits `textOnDark`, including headings, body copy, labels, links, buttons, summaries, and nested cards.

## Main files

- `src/theme.ts`
- `src/types.ts`
- `src/theme-section-v27.tsx`
- `src/theme-preview-bridge-v26.tsx`
- `src/online-store-v19.tsx`
- `src/storefront-v10.tsx`
- `src/checkout-v11.tsx`
- `src/v27-storefront.css`
- `src/v27-theme-editor.css`
