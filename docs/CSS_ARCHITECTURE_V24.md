# CSS Architecture — Sprint 24

Sprint 24 introduces a controlled cascade instead of importing every historical stylesheet directly into the global scope.

## Import order

`src/app.css` is the only stylesheet imported by `main.tsx`.

- Tailwind is loaded first.
- Sprint 1–23 styles are isolated in the `legacy` cascade layer.
- Shared Radix/CVA UI styles are isolated in `design-system`.
- V24 storefront and admin modules are unlayered and scoped under root classes.

This lets new module styles override normal legacy declarations without increasing selector specificity.

## Root namespaces

- `.tf-storefront-v24`
- `.tf-admin-v24`
- `.tf-theme-editor-v24`

## Removed legacy code

The unused original storefront block in `styles.css` was removed. Current storefront routes use `storefront-v10.tsx` and `lux-*` classes.

## Audit

Run:

```bash
npm run css:audit
```

The generated `docs/CSS_AUDIT_V24.json` records source size, duplicate selectors, and `!important` usage. It is intended to guide deletion in later sprints.
