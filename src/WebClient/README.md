# WebClient (React + Vite + OIDC)

SPA demo app that authenticates against the sample AuthServer with Authorization Code flow and PKCE.

## Prerequisites

- AuthServer running at `https://localhost:5001`
- Node.js 20+

## Run

1. Copy `.env.example` to `.env` (optional; defaults match local setup).
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173`.

## Auth Flow Routes

- Home: `/`
- Protected page: `/profile`
- Sign-in callback: `/auth/callback`
- Silent renew callback: `/auth/silent-callback`
- Sign-out callback: `/auth/logout-callback`

## Environment Variables

- `VITE_AUTH_AUTHORITY`
- `VITE_AUTH_CLIENT_ID`
- `VITE_AUTH_REDIRECT_URI`
- `VITE_AUTH_SILENT_REDIRECT_URI`
- `VITE_AUTH_POST_LOGOUT_REDIRECT_URI`
- `VITE_AUTH_SCOPE`
