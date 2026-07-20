# Sprint 16 — Admin Layout Resilience, Attribution, OTP, Shipping and Exchanges

## 1. Admin layout system

The Admin workspace now uses `AdminLayoutV16` instead of the legacy shared `.sidebar/.topbar` structure.

### Desktop

- 248px fixed sidebar.
- Sticky 64px topbar.
- Maximum content width of 1460px.
- Route-aware page headings.
- Quick-create and user dropdown menus.
- Global command palette trigger.

### Tablet

At 820–1199px the sidebar becomes a compact icon rail. Text labels are hidden without removing navigation access. Tables and content remain inside their own overflow containers.

### Mobile and tablet portrait

At 819px and below navigation becomes an off-canvas drawer. The content area no longer retains desktop sidebar margins. Drawers become bottom sheets, multi-column editors collapse to one column and table wrappers scroll independently.

### Collision prevention

Sprint 16 adds:

- Namespaced `.v16-*` selectors.
- `min-width: 0` on nested grid and flex content.
- Contained table wrappers.
- Safe media sizing.
- Sticky unsaved bar offset below the new topbar.
- Full-bleed Theme Editor rules.
- Focus-visible and reduced-motion behavior.

## 2. Attribution analytics

`src/commerce-events.ts` now records first-touch attribution for each browser session:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- Facebook and Google click identifiers
- referrer host
- landing page
- device class
- session ID

`src/analytics-v15.tsx` aggregates source data into sessions, checkout starts, completed orders, conversion and revenue. Recharts remains lazy-loaded with the Analytics route.

## 3. Customer OTP adapter

Enable frontend OTP mode with:

```env
VITE_CUSTOMER_OTP_ENABLED=true
```

Server variables:

```env
CUSTOMER_SESSION_SECRET=
CUSTOMER_SESSION_MINUTES=60
CUSTOMER_OTP_DELIVERY_ENDPOINT=
CUSTOMER_OTP_DELIVERY_API_KEY=
CUSTOMER_OTP_DEV_MODE=false
```

`request-otp.js` creates a signed 10-minute challenge. `verify-otp.js` validates the challenge and produces a signed customer session token. Production order data still needs to be exposed through a server endpoint that validates this token; public Firebase order reads are not recommended.

## 4. Shipping webhook

Endpoint:

```text
POST /api/shipping/webhook
```

Signature headers:

```text
x-signature
x-webhook-signature
```

The signature is the hexadecimal HMAC SHA-256 of the raw request body using `SHIPPING_WEBHOOK_SECRET`.

The handler updates:

```text
timeforge/orders
timeforge/orderWorkflows
```

Supported normalized statuses include processing, shipped, delivered, returned and cancelled.

## 5. Exchange order workflow

Customer exchange requests now store replacement product, variant, quantity and estimated price difference. After returned goods are received, Admin can create a linked replacement order.

The workflow:

1. Validate replacement inventory.
2. Calculate returned-item credit.
3. Create a replacement order through the existing Admin order service.
4. Deduct replacement inventory.
5. Link the replacement order to the exchange request.
6. Close the exchange request.

## 6. Responsive validation targets

The CSS was reviewed for:

- Desktop widths above 1200px.
- Tablet landscape from 820px to 1199px.
- Tablet portrait and mobile below 820px.
- Small phones below 560px.

Automated Chromium screenshots were blocked by the execution environment's organization policy for localhost. Validation therefore relies on source review, responsive containment rules, production build and HTTP route checks rather than claiming pixel-level browser approval.
