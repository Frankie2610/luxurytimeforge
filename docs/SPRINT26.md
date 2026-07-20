# Sprint 26 — Real Storefront Theme Preview

## Goal

Replace the disconnected Theme Editor mock preview with the same React routes and components that customers see on the public storefront.

## Architecture

### Draft preview bridge

- `src/theme-preview-v26.ts` stores the live editor draft in localStorage.
- `src/context.tsx` detects `theme_preview=1` and reads the draft instead of the published theme.
- `src/theme-preview-bridge-v26.tsx` connects the editor and iframe through same-origin `postMessage` events.
- Public routes continue to use the published theme when preview mode is absent.

### Actual storefront iframe

The editor chooses a real route for each template:

- Home → `/`
- Product → `/products/:handle`
- Collection → `/collections/:handle`
- Cart → `/cart`
- Search → `/search?q=...`
- Page → `/pages/about`

The iframe adds `theme_preview=1&tf_editor=1` and therefore receives the current draft.

## Editor capabilities

- Desktop, tablet, and mobile previews.
- 68%, 84%, and 100% zoom.
- Preview reload.
- Product and collection resource picker.
- Click a section in the actual storefront to select it in the sidebar.
- Select a sidebar section to highlight it in the storefront preview.
- Auto-save draft after edits.
- Explicit Save and Publish actions.
- Undo and redo.
- Reorder sections.
- Reorder and nest blocks.
- Add, hide, duplicate, and delete sections or blocks.
- Theme settings, app embeds, overlays, header, and footer controls.

## Storefront renderer coverage

Homepage sections now follow the draft/public theme order and visibility:

- Hero
- Trust strip
- Collection list
- Featured products
- Best sellers
- Image with text
- Rich text
- Newsletter
- Journal posts
- Multicolumn
- Video

Product, collection, cart, search, and page templates use their actual public routes. Product and collection preview resources can be selected inside the editor.

## CSS

- `src/v26-theme-editor.css` styles the real iframe workspace and responsive editor toolbar.
- `src/v26-storefront.css` includes section-selection overlays and styles for new storefront section renderers.
- CSS remains route-lazy through the Online Store and Storefront chunks.
