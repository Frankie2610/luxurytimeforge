# Luxury Timeforge Sprint 49.22

## Journal rebuilt

The customer Journal no longer imports the 49.17/49.20/49.21 storefront styles. It now uses one isolated file and namespace:

- `src/v4922-journal.css`
- `.tf4922-journal-*`
- `.tf4922-article-*`

The rebuild includes:

- a category rail that remains inside the mobile viewport and scrolls horizontally;
- compact horizontal article cards on small screens;
- explicit text/background contrast for the index, feature story, article body and related stories;
- responsive desktop, tablet and mobile layouts;
- deletion of the superseded Journal CSS files.

## Admin Customers rebuilt

`/admin/customers` now has:

- a compact relationship overview;
- four useful KPIs;
- a contained saved-view rail;
- a search field whose icon/text cannot overlap;
- responsive newsletter and table layouts;
- a dedicated scoped stylesheet: `src/v4922-admin-customers.css`.

## Firebase invite hardening

- Permission failures no longer create unhandled promises in the Auth observer.
- The Team page distinguishes a Realtime Database Rules failure from an Authentication email failure.
- It no longer claims an invitation was saved when the initial database write was denied.
- Admin data writes report actionable permission errors instead of leaving an unhandled promise.
- Added `firebase:rules:doctor`.
- `firebase:rules:deploy` now generates, checks and deploys the database rules in one command.
