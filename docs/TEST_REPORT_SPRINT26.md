# Sprint 26 Test Report

## Automated checks

- Dependency install: pass
- TypeScript: pass
- Production build: pass
- Vite chunk generation: pass
- Runtime route checks: pass (`/`, `/collections`, product detail, `/cart`, Admin login, Online Store, Theme Editor)
- CSS audit: pass
- Theme Editor CSS emitted as lazy route chunk: pass
- Storefront CSS emitted as lazy route chunk: pass

## Build output notes

- Online Store CSS: about 10.8 KB
- Storefront CSS: about 27.5 KB
- Online Store JavaScript: about 40.5 KB
- Storefront JavaScript: about 50.3 KB

## Functional source checks

- Draft preview localStorage bridge: present
- Same-origin iframe route preview: present
- Section click-to-select: present
- Sidebar-to-preview highlight: present
- Product resource picker: present
- Collection resource picker: present
- Desktop/tablet/mobile controls: present
- Zoom and reload controls: present
- Save, publish, undo, redo: present
- Nested block drag-and-drop: preserved
- Public storefront defaults to published theme: verified in context logic

## Limitations

Automated Chromium screenshot testing was not treated as proof because prior container sessions were unreliable for localhost browser rendering. The release is verified through clean installation, TypeScript, production build, route checks, and source-level integration checks.
