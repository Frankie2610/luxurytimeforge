# TimeForge V0.68.0 — Referral & Growth Ops

## What changed
- Customer referral links: `/ref/:code`, plus personal link in Customer Account.
- Admin > Referral & Growth with percentage/fixed-amount controls for friend discount and referrer reward.
- Email anti-fraud is optional: Admin can switch `useEmailAntiFraud` on/off; email is never hard-coded as a mandatory criterion.
- Server-side pricing and referral validation in `server/orders.js`. Frontend totals are only estimates.
- Fraud signals: self phone, optional self email, prior buyer history, same address, repeated device/IP, referral velocity.
- IP values are stored only as a salted SHA-256 truncated hash (`REFERRAL_HASH_SALT` recommended in production).
- Reward states: pending / review / qualified / blocked / revoked.
- Growth Ops queue lets Admin qualify or revoke exception cases.
- Responsive Admin, referral landing, and Customer Account surfaces.

## Free-first architecture
No paid fingerprinting or SMS service is required. The default implementation uses first-party device ID, server-side IP hash, order history, address consistency, and optional email verification. Email OTP can reuse the existing account OTP adapter if desired.

## Deployment
1. Generate/deploy Firebase Rules (`npm run firebase:rules:generate`, then deploy).
2. Set `REFERRAL_HASH_SALT` on Vercel for non-reversible IP hashing.
3. Deploy Vercel Functions and frontend together.
4. Configure Referral & Growth from Admin.

## UAT scenarios
1. Existing customer copies referral link from Customer Account.
2. New device opens link and checkout receives referral attribution.
3. Eligible first order receives server-confirmed friend discount.
4. Same referrer phone is blocked.
5. Email matching only affects fraud when Admin enables the email criterion.
6. Repeated device/IP produces review/block according to Admin settings.
7. Admin reviews the Growth Ops queue and qualifies/revokes an exception.
