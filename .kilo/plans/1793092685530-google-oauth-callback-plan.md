# Plan: Fix Google OAuth callback — `/auth/callback` receives no `code`

## Context

Google login currently fails: after the OAuth flow, `/auth/callback` redirects to
`/login?error=Kode+otorisasi+tidak+diterima` because `requestUrl.searchParams.get("code")`
returns null.

The route handler and logging are already in place (`src/app/auth/callback/route.ts`).
The `console.log("[auth/callback] incoming" ...)` diagnostic line was added but its
output was not pasted, so the branch is not yet confirmed.

## Goal

Identify the exact failure branch and fix it without touching unrelated code.

## Confirmed facts (do not change)

- No `proxy.ts` exists anywhere in the repo. Next 16 uses `src/middleware.ts`.
- `src/middleware.ts` matcher excludes only static assets; it does not intercept
  `/auth/callback` (the `isCallbackRoute` early-return already added in
  `src/lib/supabase/middleware.ts:59`).
- Middleware does not strip query params.
- `redirectTo` in `src/app/actions/google-auth.ts:26` is `${APP_URL}/auth/callback`.
- `APP_URL` resolves to `http://localhost:3000` from `.env.local:25`.
- `createClient` in the callback uses `@supabase/ssr` `createServerClient` (PKCE flow).
- `tsc --noEmit` passes.

## Three branches to plan

### Branch A — `error` param is present (provider rejected before redirect)

Symptoms: `[auth/callback] incoming` shows `error` set (e.g. `redirect_uri_mismatch`,
`access_denied`, `invalid_request`), `hasCode: false`.

Cause: Google/Supabase rejected the request because the redirect URI configured in
Google Cloud Console or Supabase Dashboard does not match the `redirectTo` value.

Required Google Cloud redirect URI (must be exact):
`https://wdjkbjwdpqaoqikkflpc.supabase.co/auth/v1/callback`

Required Supabase Dashboard "Allowed Redirect URLs":
`http://localhost:3000/auth/callback`

Fix: correct the URI in both dashboards. No code change.

### Branch B — `error` null, `hasCode: false`, no params at all

Symptoms: `[auth/callback] incoming` shows `error: null`, `hasCode: false`,
`next: null`, empty `cookieNames`.

Cause: the browser arrived at `/auth/callback` with an empty query string, meaning
something stripped the params before the route handler ran.

Likely culprits (investigate in order):
1. Stale dev server — restart `npm run dev` so the new logging + route are live.
2. `redirectTo` origin mismatch — if the dev server is not on port 3000,
   `APP_URL` is wrong. Verify the actual port.
3. A redirect chain that drops params (e.g. trailing-slash normalization, a
   redirect from `/auth/callback` to `/auth/callback/`).

Fix: align port/origin, restart dev server. No code change unless a redirect chain
is found.

### Branch C — `hasCode: true`, failure moves to `exchangeCodeForSession`

Symptoms: `[auth/callback] incoming` shows `hasCode: true`, then
`[auth/callback] exchangeCodeForSession result` shows `exchangeError` set.

Cause: PKCE code verifier mismatch, expired code, or session cookie issues.

Likely culprits:
1. The `pkce` cookie set during `signInWithOAuth` was not present when
   `exchangeCodeForSession` ran — check `cookieNames` in the incoming log.
2. Code expired or used twice.
3. `createServerClient` in the callback not persisting cookies correctly.

Fix: ensure the OAuth cookies survive the redirect back to `/auth/callback`;
otherwise investigate the middleware cookie handling.

## Implementation tasks (only if a code change is needed)

1. Read the full `[auth/callback] incoming` log line after a fresh dev-server restart.
2. Classify into A, B, or C.
3. If A: update Google Cloud + Supabase redirect URIs (external, no code).
4. If B: verify dev server port matches `NEXT_PUBLIC_APP_URL`; restart dev server.
5. If C: inspect `cookieNames` and the `exchangeCodeForSession` error payload;
   only then make a minimal code change to `route.ts` or `server.ts`.

## Validation

- Run one Google login attempt from `/login`.
- Confirm the `[auth/callback] incoming` log line shows the real params.
- Confirm the subsequent log line (exchange or success) and the final redirect target.
- `tsc --noEmit` must still pass after any code change.

## Out of scope

- Changes to unrelated files, redesign, or the other member's refactor.