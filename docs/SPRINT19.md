# Sprint 19 — Online Store Theme Editor parity

## Goal

Replace the older Customize implementation with a Shopify-style editor based on the two reference screenshots supplied for the project.

## New editor architecture

`OnlineStoreV19` keeps the Sprint 18 Online Store overview and activates `ThemeEditorV19` when `?view=editor` is present.

The editor uses:

- React state for the working theme draft.
- dnd-kit for section and nested block sorting.
- Radix dropdown menus through the shared UI system.
- Sonner for save/publish feedback.
- The real TimeForge section renderer for the center preview.

## Toolbar

The toolbar contains:

- Return to Online Store overview.
- Sections panel.
- Theme settings panel.
- App embeds panel.
- Active theme identity.
- Searchable template picker.
- Sidebar toggle.
- Desktop/mobile preview switch.
- Undo/redo.
- More actions.
- Save.

## Template picker

The searchable picker follows the reference hierarchy and exposes supported TimeForge templates:

- Home page
- Products
- Collections
- Cart
- Pages
- Search

Unsupported future template categories remain visible but disabled to preserve the expected information architecture.

## Sidebar groups

### Header group

- Countdown promotion
- Announcement bar
- Header

### Template

Contains the real sections in the active theme template. Sections expose their nested blocks.

### Overlay group

- Cart drawer
- Newsletter popup
- Privacy banner

### Footer group

- Footer

## Live preview selection

Every real template section is wrapped in a selectable preview boundary. Hovering or selecting displays a blue boundary and section label. Clicking the preview selects the matching section in the sidebar and opens its settings.

## Nested drag and drop

Blocks may be:

- Reordered at the root level.
- Dragged into a group.
- Reordered within a group.
- Moved between root and nested locations.

Groups are regular `ThemeBlock` records with `children`, so data remains compatible with the recursive storefront renderer.

## Responsive behavior

- Above 1100px: 370px editor sidebar and large preview.
- 821–1100px: 330px sidebar and reduced preview spacing.
- 820px and below: off-canvas sidebar with backdrop.
- 520px and below: compact toolbar and full-width mobile preview.

## Compatibility

- Sprint 18 Online Store overview remains unchanged.
- Existing theme drafts and published versions remain compatible.
- Existing flat blocks remain compatible.
- Existing nested groups continue to render recursively.
