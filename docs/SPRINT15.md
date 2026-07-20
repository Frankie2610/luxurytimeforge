# Sprint 15 implementation

## New libraries used at runtime

| Library | Use |
|---|---|
| Radix Dialog | Product image zoom |
| Radix Accordion | Product service information |
| Radix Tabs | Return/exchange selector and analytics panels |
| Radix Dropdown Menu | Admin bulk-return quick actions |
| CVA | Shared button variants |
| Sonner | Storefront/admin toast notifications |
| Recharts | Revenue, funnel and payment analytics |
| date-fns | 14-day analytics date ranges |

## Customer copy rule

Customer-facing components must not use `mày/tao`. Prefer concise neutral labels and instructional text without unnecessary pronouns.

## New local storage

- `tf.v15.commerce-events`

## New server route

- `POST /api/payments/webhook`

Expected signature header:

```text
x-signature: HMAC_SHA256(raw_request_body, PAYMENT_WEBHOOK_SECRET)
```

Optional server-side Firebase reconciliation requires:

```env
FIREBASE_DATABASE_URL=
FIREBASE_DATABASE_AUTH=
```
