# Sprint 27 Test Report

## Automated checks

- TypeScript project check: pass
- Production Vite build: pass
- npm production audit: 0 vulnerabilities
- CSS audit generation: pass
- Development route checks: HTTP 200
  - `/`
  - `/collections`
  - `/products/versace-medusa-eclipse-ve5f00126`
  - `/search?q=versace`
  - `/cart`
  - `/pages/about`
  - `/blogs`
  - `/admin/login`
  - `/admin/online-store?view=editor`

## Production chunks

- Storefront CSS: about 49.5 KB, 8.7 KB gzip
- Online Store CSS: about 22.1 KB, 4.5 KB gzip
- Storefront JavaScript: about 52.9 KB, 13.9 KB gzip
- Online Store JavaScript: about 57.6 KB, 15.9 KB gzip
- Shared V27 section renderer: about 9.9 KB, 2.8 KB gzip

## Functional source checks

- Real iframe route preview: present
- Live draft bridge: present
- Section click-to-select: present
- Block click-to-select: present
- Sidebar-to-preview section/block highlight: present
- Searchable section library: present
- Template-specific section restrictions: present
- Shared renderer coverage across templates: present
- Cloudinary inspector upload: present
- Product and collection resource picker: present
- Theme presets: present
- Theme version restore: present
- Theme import/export: present
- Dark-surface contrast contract: present
- Theme-based typography, spacing, radius, and motion: present

## CSS audit snapshot

- CSS files: 27
- Source CSS: about 527.2 KB
- `!important` declarations: 1,214
- Duplicate selector entries: 1,411

The remaining count is primarily legacy CSS retained for backward compatibility. V27 isolates new behavior in route-scoped styles and overrides legacy fixed colors with theme tokens. Removing old files is intentionally deferred to avoid regressions in older Admin and storefront components.

## Browser visual testing note

The build is verified through TypeScript, Vite production compilation, HTTP route checks, source-level integration checks, and a clean-install ZIP validation. Automated browser screenshots are not treated as pixel-perfect proof in this environment.
