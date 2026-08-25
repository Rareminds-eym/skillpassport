# ADR-043: Google OAuth via Custom Authorization-Code Flow in the SSO Authority Layer

**Status:** Accepted
**Date:** 2026-08-25
**Deciders:** Gokul (product owner), ox-alpha (implementation)
**Supersedes:** n/a

## Context

SkillPassport needed "Sign up / Log in with Google". The identity system is NOT
Supabase Auth: users live in plain Postgres tables owned by `sso-worker`
(PostgREST + service-role), with RS256 access tokens, refresh-token family
rotation, and an event-driven sync pipeline replicating identity into the app
database. Supabase's built-in Google provider is therefore inapplicable.

Additional constraints discovered during design:

- The sso-gateway route guard (`/api/auth/*`) rejects top-level navigations and
  URLs with query strings — inherently incompatible with OAuth redirects.
- `users.password_hash` is NOT NULL; `oauth_accounts` table already existed,
  unused, with a `(provider, provider_user_id)` unique constraint.
- Post-refactor, browser auth traffic flows through the RPC **authority layer**
  (`rpc/contracts.ts` → `rpc/authority.ts`) returning correlated discriminated
  outcomes — not raw token payloads.

## Decision

1. **Custom OAuth 2.0 Authorization Code flow**, confidential client:
   - Start endpoint issues an HMAC-signed, single-use state cookie
     (`__Host-rm-oauth-state`, Lax) carrying a bound `nonce`; consent URL uses
     `scope=openid email profile` + `prompt=select_account`.
   - Callback validates state (signature/TTL/cookie-param equality), exchanges
     the code server-side, and sources the profile from the **`id_token`
     claims** returned directly by Google's token endpoint over TLS —
     validating `exp`/`iss`/`aud`/`nonce` and failing closed. `/userinfo` is a
     logged fallback only. This removes one upstream round-trip per login
     (OIDC BCP / Microsoft guidance).
   - Tokens never transit any URL; the refresh credential is emitted as the
     byte-identical gateway cookie (`__Host-rm-refresh`, Secure, HttpOnly,
     Strict) so the existing session bootstrap works unchanged.
2. **Worker integration via the authority layer**: new
   `OAuthAuthenticateRpcInput/Outcome` contracts + `issueOAuthAuthenticate`
   adapter delegating to `routes/oauth.ts::performOAuthLogin`, exposed as the
   thin `SsoWorker.oauthAuthenticate` RPC.
3. **Linking policy** (approved): auto-link identities when Google reports
   `email_verified=true` (also clearing the local verification gate);
   reject unverified emails. New identities provision **learner-only**
   accounts via direct inserts with an unguessable placeholder password hash
   (no migration), and their membership attaches to the **seeded platform
   organization** (`PLATFORM_ORG_ID`, "SkillPassport Platform") — no per-user
   temp orgs. This also removes any schema-version dependency on the
   `signup_user` RPC's nullable-org-name handling.
4. **Client hardening** (2025–26 SPA guidance): single-flight `getMe`,
   per-endpoint request budgets opening a circuit on runaway loops
   (`AuthRequestBudgetError`), StrictMode-safe single-flight bootstrap on
   `/auth/callback` with a park-failsafe, role resolution that strips the
   signup-artifact `owner` role (`resolveRouteRole`), and a React Query
   `useIdentity()` hook as the canonical identity consumer.

## Consequences

- Zero DB migrations across both projects; `oauth_accounts` finally used.
- Login latency reduced ~120ms vs userinfo variant; new-user path −2 DB RTTs.
- Any future identity-fetch storm fails loud once instead of silently hammering
  the backend.
- Deferred (tracked): PKCE (low value for confidential clients),
  `UNIQUE(user_id, provider)` index, LTE endpoints (RPC already shared),
  store-wide `pickPrimaryRole` ranking fix, full React Query consumer
  migration.

## Alternatives considered

| Alternative | Why rejected |
|---|---|
| Supabase Auth Google provider | Identity system does not use Supabase Auth |
| Route OAuth through sso-gateway | Guard forbids navigations/query strings by design |
| Auto-link without email_verified check | Account-takeover vector |
| Require password re-entry to link | UX cost for no added assurance beyond provider-verified email |

## Compliance

RFC 9700 (OAuth 2.0 Security BCP): memory-only tokens, hardened cookies, CSRF-
bound state ✓ · OWASP Session Management ✓ · steering `01-security-compliance`
(auth packages only, no hardcoded secrets — credentials live in Pages secrets)
✓
