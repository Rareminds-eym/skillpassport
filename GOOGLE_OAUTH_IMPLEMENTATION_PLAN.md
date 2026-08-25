
---

## Follow-up Debt Ledger (post-implementation)

Tracked during the 2026-08-25 hardening pass:

1. **React Query identity migration** — `useIdentity()` hook shipped
   (`src/features/auth/hooks/useIdentity.ts`, canonical consumer API with
   dedup/staleTime). Remaining direct `ssoClient.getMe()` call sites
   (invitation flows, authStore bootstrap internals) should migrate to the
   hook incrementally; new code MUST use it.
2. **`pickPrimaryRole` owner-vs-learner ranking** — `owner` outranks `learner`
   store-wide; `resolveRouteRole()` (roleBasedRouter) now strips the signup-
   artifact `owner` for routing. Consider fixing the ranking at the store
   level once all consumers are audited.
3. **PKCE + `UNIQUE(user_id, provider)` hardening index** — deferred by design
   (see §6 Deferred).

---

## As-Built Addendum (2026-08-25 — post-pull reconciliation & hardening pass)

Deviations from the original plan, all improvements:

| Area | As-built |
|---|---|
| Worker RPC | `oauthAuthenticate` lives in the **authority layer** (`rpc/contracts.ts` + `issueOAuthAuthenticate`) per upstream's post-refactor architecture; camelCase wire contract with `correlationId` |
| Profile source | **`id_token` claims** from Google's token response (validated `exp/iss/aud/nonce`, nonce bound into the HMAC state) replacing the `/userinfo` call — −1 upstream RTT; userinfo retained as logged fallback |
| Worker DB path | verified-update ∥ link-insert parallelized; redundant user re-fetch removed (−2 RTTs new-user path) |
| Client hardening | single-flight `getMe`, per-endpoint request budgets w/ circuit breaker (`AuthRequestBudgetError`), StrictMode-safe bootstrap join on `/auth/callback`, park-failsafe hard exit |
| Role routing | `resolveRouteRole()` strips the signup-artifact `owner` when `learner` is present (Google learners were being routed to recruitment) |
| Hygiene | shared `functions/lib/app-origins.ts`; `Cache-Control: no-store` on all OAuth redirects; ADR-043 records the decision |

Verification at close: sso-worker contract/authority/oauth suites 25/25 ·
skillpassport functions oauth 13/13 + resolveRouteRole 6/6 + client-hardening
4/4 · tsc clean on all touched files · production build ✅.

### Addendum 2 (2026-08-25): platform-org provisioning
Google learners no longer create temp orgs via `signup_user`. Provisioning is
direct inserts — user → membership on `PLATFORM_ORG_ID` ("SkillPassport
Platform") → learner role in `membership_roles` → oauth link — making the flow
schema-drift-proof (local stacks missing later migrations work identically).
Sync events: `user.created` + `membership.created` only.

### Addendum 3 (2026-08-25): sync-webhook security gate + audit corrections

**Security fix (P0):** `/sync/*` (5 routes) and `/api/sync/check-user` accepted
unauthenticated service-role mutations. Gate added at the shared choke point
(`functions/lib/sync-auth.ts` → `handleSyncRequest` + `check-user`):
Bearer-vs-`INTERNAL_WEBHOOK_SECRET`, constant-time comparison mirroring the
LTE gateway `safeEqual` pattern, **fail-closed 500 when the server-side secret
is unset**, 401 on mismatch. Caller updated:
`sso-worker/src/lib/skillpassport-check.ts` now sends the header.
Reference implementation: `api/internal/lte/v1/auth.ts`.

**Deploy precondition:** set `INTERNAL_WEBHOOK_SECRET` on Pages production AND
preview before shipping — the gate fails closed by design.

**False-positive/assurance corrections (audit of prior claims):**
1. "Missing consumer `SYNC_API_SECRET` contributed to empty app-DB replica" —
   overstated: the receiver ignored secrets entirely pre-gate, so it could not
   have been a delivery-failure cause; required only for the new gate.
2. "Sync pipeline is production-proven" — downgraded to *"routes deployed;
   end-to-end delivery verified locally only."*
3. Consumer service-key mismatch ("→401"): previously speculative, now
   empirically confirmed (401 reproduced; payloads differ in exp).

**Local sync topology (required):** Miniflare queues do not deliver across
separate `wrangler dev` processes. Run sso-worker + auth-sync-consumer in one
instance via `cd sso-worker && npm run dev:stack`, then `npm start` for pages.
See `auth-sync-consumer/.dev.vars.example` for required consumer vars.
