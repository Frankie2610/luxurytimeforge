# Sprint 51.4 — Store identity fallback

- Firebase remains the source of truth for `timeforge/settings/store` and the published theme.
- Missing objects, missing fields, and blank strings now fall back to `Luxury Timeforge`.
- A missing custom Cloudinary logo falls back to `/luxury-timeforge-logo.svg` in the header/Admin preview and `/favicon.svg` for the browser favicon; Apple Touch Icon keeps the current logo asset.
- Removing a custom logo resets browser icons immediately instead of leaving the previous Cloudinary image cached in the DOM.
- The static fallback is display-only; it is not written to Firebase as a fake Cloudinary URL.
