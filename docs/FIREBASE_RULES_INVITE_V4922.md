# Firebase Rules and admin invitations — Sprint 49.22

The console message `Cross-Origin-Opener-Policy ... window.closed` comes from the Google popup lifecycle. It is not the Realtime Database invitation failure.

The blocking error is:

```text
Permission denied
```

This means the active Firebase project does not currently have generated rules that authorize the owner account.

## Required local environment

`.env.local` must contain at least:

```dotenv
VITE_FIREBASE_DATABASE_URL=https://YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT
VITE_OWNER_EMAIL=your-owner-email@example.com
VITE_PUBLIC_SITE_URL=http://localhost:5173
```

The owner email must be the same email used to log into the Admin.

## Generate and deploy rules

Run from the folder containing `package.json` and `.env.local`:

```powershell
corepack.cmd pnpm run firebase:rules:generate
corepack.cmd pnpm run firebase:rules:check
corepack.cmd pnpm run firebase:rules:doctor
corepack.cmd pnpm dlx firebase-tools use
corepack.cmd pnpm run firebase:rules:deploy
```

The Firebase project shown by `firebase-tools use` must match `VITE_FIREBASE_PROJECT_ID`.

After deployment:

1. Sign out of TimeForge Admin.
2. Sign in again with `VITE_OWNER_EMAIL`.
3. Open `/admin/settings/team`.
4. Reload the members list.
5. Send a new invitation.

## Authentication settings

Firebase Console → Authentication → Sign-in method:

- Email/Password: enabled
- Email link (passwordless sign-in): enabled

Firebase Console → Authentication → Settings → Authorized domains:

- `localhost`
- the Vercel domain
- the production custom domain

## Error separation in 49.22

The Team page now reports two different stages:

- **Cannot save invitation to Realtime Database:** rules/project/owner email problem.
- **Invitation saved but email not sent:** Email Link provider, authorized domain, quota or continue URL problem.
