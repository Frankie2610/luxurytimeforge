# Customer account baseline comparison

Uploaded v0.67.0 source resolves to commit `1d98ca261664678d95749869f8de5e076d040165`.

The original account component and core account CSS pipeline are the reference for layout stability:
- `src/customer-account-v12.tsx`
- `src/v524-customer-account.css`
- `src/v525-customer-order-detail.css`
- `src/v582-customer-polish.css`
- `src/v526-account-returns.css`

The current regression is not caused by those baseline layout files. It was introduced by later global account selectors in `src/v681-ui-polish.css`, loaded through `src/app.css`, which apply `!important` rules to `.v12-account-page` controls and can override the route-local account styles.

Fix direction: remove account-specific selectors from the global V0.68.1 polish layer and let the original account styles own `/account*`; keep storefront/cart/print polish intact.
