# Signup Flow Fix Plan — 2026-06-06

## Background

Deep architecture investigation of the SkillPassport signup flow across 4 services (frontend, auth-client SDK, Cloudflare Pages Functions, SSO worker, email worker). **31 files analyzed**. **23 findings** discovered across the original code review and deep architecture check.

## Priority Legend

| Priority | Color | Definition |
|----------|-------|------------|
| 🔴 Critical | Red | Production data leak, security bypass, or completely broken feature |
| 🟡 High | Yellow | Security hardening, broken UX, or significant architectural flaw |
| 🔵 Medium | Blue | Reliability, observability, or maintainability |
| 🟢 Low | Green | Polish, type hygiene, or nice-to-have |

---

## 🔴 CRITICAL (5)

### C1. `ssoFetch` function signature broken — membership writes always make GET requests

**Files**: `skillpassport/functions/lib/sso-client.ts:172-177`, `:183-197`, `:202-216`, `:220-234`

**Problem**: `ssoFetch` signature is `(env, request: Request)` — only accepts 2 parameters. Three callers pass 5 parameters:
```typescript
ssoFetch(env, urlString, methodString, bodyString, isFormData)
```
Args 3-5 are silently discarded. These functions always make **GET requests with no body**:
- `ssoCreateMembership` — should POST `/api/memberships/create`
- `ssoAssignMembershipRole` — should PUT `/api/memberships/assign-role`
- `ssoUpdateMembershipStatus` — should PATCH `/api/memberships/update-status`

**Fix**: Either (a) change `ssoFetch` to accept `RequestInit` + URL, or (b) switch to RPC method calls on the service binding.

**Risk if unfixed**: Invitation acceptance / role assignment / status updates are completely broken — they make GET requests that do nothing.

**Depends on**: None.

---

### C2. Password sent in welcome email body — ALL legacy handlers

**Files**:
- `skillpassport/functions/api/user/handlers/recruiter.ts:150-157`
- `skillpassport/functions/api/user/handlers/recruiter.ts:299-306`
- `skillpassport/functions/api/user/handlers/school.ts:151-158`
- `skillpassport/functions/api/user/handlers/school.ts:303-309`
- `skillpassport/functions/api/user/handlers/college.ts:152-159`
- `skillpassport/functions/api/user/handlers/college.ts:309-315`
- `skillpassport/functions/api/user/handlers/events.ts:107`
- `skillpassport/functions/api/user/handlers/university.ts:140`
- `skillpassport/functions/api/user/handlers/university.ts:279`

**Problem**: `sendWelcomeEmail(env, baseUrl, email, name, role)` is called with arguments shifted:
```typescript
// Current (WRONG):
sendWelcomeEmail(env, body.email, body.email, body.password, body.role)
//                                 ^^^^^^^^^^^^  ^^^^^^^^^^^^^
//                                 baseUrl=email  name=password
```
- Password appears in email body: `"Hello [the-password]"`
- Login link becomes `user@email.com/login` (broken, baseUrl received the email string)

Only `skillpassport/functions/api/user/handlers/unified.ts:193` is correct.

**Fix**: Reorder arguments in ALL call sites to match the correct signature:
```typescript
sendWelcomeEmail(env, env.FRONTEND_URL || baseUrl, body.email, body.fullName || body.name, role)
```

**Risk if unfixed**: Every legacy signup sends the user's password in plaintext via email. Stored in email logs, transit logs, SMTP servers, recipient inboxes.

**Depends on**: None (trivial fix, high impact).

---

### C3. `INTERNAL_API_KEY` hardcoded in wrangler.toml `[vars]`

**File**: `skillpassport/wrangler.toml` (around line 85)

**Problem**: `INTERNAL_API_KEY = "dev-test1232312"` is in `[vars]` — a plaintext non-secret section. This key is used to authenticate with the email worker. Anyone with repo access or `wrangler whoami` can read it.

**Fix**:
1. `wrangler secret put INTERNAL_API_KEY` (enter the value interactively)
2. Remove from `[vars]` in wrangler.toml
3. Update `.dev.vars` with the same key for local dev

**Risk if unfixed**: Credential leak — the key for email worker auth is in a plaintext config file.

**Depends on**: None.

---

### C4. `CAREER_AI_RATE_LIMITER` KV namespace missing from wrangler.toml

**Files**:
- `skillpassport/functions/api/career/utils/rate-limit.ts`
- `skillpassport/wrangler.toml`

**Problem**: Code references `env.CAREER_AI_RATE_LIMITER` as a `KVNamespace`. No `[[kv_namespaces]]` binding exists in wrangler.toml. First invocation will throw `TypeError: env.CAREER_AI_RATE_LIMITER is undefined`.

**Fix**: Either (a) add the KV namespace binding to wrangler.toml, or (b) remove the rate-limit usage and use in-memory rate limiting instead.

**Risk if unfixed**: Runtime crash on first career AI endpoint hit.

**Depends on**: None.

---

### C5. FDW migration writes to SSO-Worker DB — violates read-only architecture

**Files**:
- `migrations/20260529000001_create_sso_membership_function.sql`
- `migrations/20260530000002_update_sso_signup_member_via_fdw.sql`
- `migrations/20260526000013_sso-memberships.sql`

**Problem**: These migrations use `dblink_exec()` to run DDL/DDM on the SSO-Worker database from a SkillPassport migration:
- `dblink_exec` runs `DROP FUNCTION IF EXISTS signup_member(...)` then `CREATE OR REPLACE FUNCTION signup_member(...)` on the SSO database
- `dblink_exec` creates `audit_logs` table on the SSO database
- FDW `create_sso_membership()` writes `INSERT/UPDATE` directly to SSO tables

This violates:
1. Steering standard: SSO data writes must go through service binding only
2. Two-phase commit atomicity: if migration fails partway, SSO DB is corrupted

**Fix**: Remove `dblink_exec` DDL from migrations. Replace FDW writes (`sso_memberships` INSERT/UPDATE) with `sso-client.ts` RPC calls through the service binding.

**Requires approval**: Yes — this is a legacy migration pattern change.

**Risk if unfixed**: Silent data inconsistency, broken FDW permissions on DB rotation, failed migrations corrupting SSO DB.

**Depends on**: C1 (ssoFetch fix) — because sso-client.ts needs to work before FDW writes can be replaced.

---

## 🟡 HIGH (6)

### H1. `AcceptInvite.tsx` password minimum 8 instead of 10

**File**: `skillpassport/src/pages/auth/AcceptInvite.tsx:26,117`

**Problem**: JS validation at line 26 checks `password.length < 8`. SSO worker's `validate.ts:4` requires `PASSWORD_MIN = 10`. Also HTML `minLength={8}` at line 117.

**Fix**: Change both to 10. Add helper text: "At least 10 characters".

**Risk**: Users can set 8-9 char passwords via this form, which SSO will reject. Silent failure.

**Depends on**: None.

---

### H2. `signupValidation.js` password min 8 + `formatOtp` slice 6

**File**: `skillpassport/src/features/subscription/lib/signupValidation.js:80,139`

**Problem**:
- Line 80: `formData.password.length < 8` — must be `< 10`
- Line 139: `formatOtp` slices `value.slice(0, 6)` — OTPs are 4 digits (from MessageCentral)

**Fix**: Password → `< 10`. OTP → `value.slice(0, OTP_DIGIT_LENGTH)` with `const OTP_DIGIT_LENGTH = 4`.

**Risk**: 8-9 char passwords fail silently. OTP verification broken for correct 4-digit OTPs.

**Depends on**: None.

---

### H3. `userId` injection in `handleUnifiedSignup`

**File**: `skillpassport/functions/api/user/handlers/unified.ts:43-45`

**Problem**: `body.userId` is trusted from the request body with no verification against the authenticated JWT. An attacker could supply any `userId` to create a profile for a different user.

**Fix**: Add JWT sub validation — extract `data.user.sub` from `context.data` (set by `withAuth`), compare against `body.userId`, return 403 `{ error: "userId mismatch" }` if different.

**Risk**: Privilege escalation — attacker could create profiles for other users.

**Depends on**: None.

---

### H4. `ALLOWED_APP_URLS` wildcard `*.pages.dev`

**File**: `sso-worker/wrangler.toml:20`

**Problem**: `ALLOWED_APP_URLS` includes `*.pages.dev`. Anyone with a Cloudflare Pages deployment at any `*.pages.dev` domain can set this as their redirect URL and receive OAuth tokens.

**Fix**: Remove `*.pages.dev`. Add explicit URLs:
```
http://localhost:3000,http://localhost:5173,https://skillpassport.rareminds.in,https://staging.rareminds.in
```

**Risk**: OAuth redirect URI poisoning — attacker registers a `malicious.pages.dev` site and intercepts auth tokens.

**Depends on**: None.

---

### H5. Legacy handlers (`school.ts`, `college.ts`, `recruiter.ts`, `university.ts`) bypass SSO

**Files**:
- `skillpassport/functions/api/user/handlers/school.ts`
- `skillpassport/functions/api/user/handlers/college.ts`
- `skillpassport/functions/api/user/handlers/recruiter.ts`
- `skillpassport/functions/api/user/handlers/university.ts`
- `skillpassport/functions/api/user/handlers/events.ts`

**Problem**: These use `supabaseAdmin.auth.admin.createUser()` directly — bypassing the SSO worker entirely. Different auth path:
- No JWT session created
- No audit trail in SSO tables
- Different password validation (min 6 vs min 10)
- Different email templates
- No `withAuth` middleware (routed in `[[path]].ts` without auth)

**Fix**: Two options:
- **Option A (migrate)**: Rewrite to call SSO worker (like `unified.ts`), adding `withAuth` middleware and proper session creation
- **Option B (deprecate)**: Remove legacy handlers and force all signups through the new `UnifiedSignup` flow

**Requires approval**: Yes — legacy code removal/refactor.

**Depends on**: C1 (ssoFetch fix).

---

### H6. `SignupRecruiter.jsx` OTP check broken for 4-digit OTPs

**File**: `skillpassport/src/pages/auth/components/SignIn/recruitment/SignupRecruiter.jsx:68`

**Problem**: `formData.otp.length !== 6` — OTPs are 4 digits from MessageCentral. Condition is always true, causing a silent `return` without calling the verification API.

**Fix**: Change to `formData.otp.length !== OTP_DIGIT_LENGTH` with shared constant (4).

**Risk**: OTP verification never succeeds for this legacy flow.

**Depends on**: H5 (whether this legacy code is kept or removed).

---

## 🔵 MEDIUM (7)

### M1. `get_jwt_claims` race condition

**File**: `sso-worker/src/routes/signup.ts:111`

**Problem**: After `signup_user()` creates the user, `get_jwt_claims()` may return empty roles/products arrays if the DB hasn't finished replicating (FDW delay, async triggers).

**Fix**: Add up to 3 retries with 200ms backoff if returned arrays are empty. Or restructure to return claims atomically from the `signup_user` function.

**Depends on**: None.

---

### M2. No email resend path after signup

**File**: `skillpassport/functions/api/user/handlers/unified.ts:191-195`

**Problem**: After successful signup + profile creation, if `email_sent === false`, there's no retry path. User has an account but never receives the confirmation email.

**Fix**: Store pending verification in KV with 24h TTL. Add `/auth/verify-resend-unauthenticated` endpoint keyed by email hash + OTP-like token.

**Depends on**: KV binding setup.

---

### M3. No idempotency key for profile creation

**File**: `skillpassport/functions/api/user/handlers/unified.ts`

**Problem**: If network retry causes duplicate profile creation requests, the handler may create duplicate profiles or throw integrity errors.

**Fix**: Accept optional `Idempotency-Key` header. Use `KV.set(key, status, {nx: true, expirationTtl: 86400})` to deduplicate.

**Depends on**: KV binding setup.

---

### M4. Three different names for same email auth secret

**Files**:
- `sso-worker/wrangler.toml` → `EMAIL_API_KEY`
- `skillpassport/wrangler.toml` → `INTERNAL_API_KEY`
- `email-worker/wrangler.toml` → `API_KEY`

**Problem**: Three different env var names must all contain the same shared secret for inter-service email authorization. If any is out of sync, email sending fails with 401.

**Fix**: Consolidate to one name across all 3 services. Standardize on `EMAIL_API_KEY`.

**Depends on**: None.

---

### M5. Missing env vars in wrangler.toml

**Files**: `sso-worker/wrangler.toml`, `skillpassport/wrangler.toml`, `email-worker/wrangler.toml`

**Problem**: These env vars are used in code but NOT declared in their respective wrangler.toml:
- `JWT_PUBLIC_KEY_PREVIOUS`, `JWT_KID_PREVIOUS` — JWKS key rotation (sso-worker)
- `APP_URL` — sso-worker/src/lib/email.ts
- `ADMIN_EMAIL`, `FROM_EMAIL`, `FROM_NAME` — email templates
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — email-worker
- `CRON_SECRET` — scheduled task auth (sso-worker)
- `DEEPGRAM_API_KEY`, `GROQ_API_KEY` — assessment feature
- `CLOUDFLARE_ACCOUNT_ID` — R2/Workers AI
- `VITE_STORAGE_API_URL`, `VITE_ASSESSMENT_URL`, `VITE_EXTERNAL_API_KEY` — frontend env vars

**Fix**: Add all missing env vars to appropriate wrangler.toml `[vars]` sections. Mark secrets explicitly.

**Depends on**: None.

---

### M6. `PASSWORD_MIN` hardcoded in multiple files

**File**: `sso-worker/src/lib/validate.ts:4`

**Problem**: `const PASSWORD_MIN = 10` is hardcoded. If this ever needs to change, it must be updated everywhere — `AcceptInvite.tsx`, `signupValidation.js`, `validate.ts`, etc.

**Fix**: Extract to `sso-worker/src/lib/constants.ts`, re-export, and import in validation logic. Share via npm package if frontend also needs it.

**Depends on**: None.

---

### M7. Delete-account rate limit too aggressive

**File**: `sso-worker/src/routes/delete-account.ts:23`

**Problem**: Rate limiter allows 3 requests per 60s. If a legitimate signup rollback triggers account deletion (e.g., failed profile creation), it may be blocked after 3 attempts.

**Fix**: Increase to 5/60s.

**Depends on**: None.

---

## 🟢 LOW (4)

### L1. Stale `worker-configuration.d.ts`

**File**: `skillpassport/worker-configuration.d.ts`

**Problem**: Generated types include vars no longer used:
- `SUPABASE_JWT_SECRET` — removed from .dev.vars (SSO handles JWT now)
- `SUPABASE_SERVICE_ROLE_KEY` — removed from .dev.vars
- `RAZORPAY_SERVICE_SECRET`, `RAZORPAY_KEY_ID` — payment-worker only

**Fix**: Regenerate with `npx wrangler types --include-runtime`.

**Depends on**: M5 (env vars should be stable before regenerating types).

---

### L2. `email.ts` hardcodes `baseUrl` as `''` in some calls

**File**: `skillpassport/functions/api/user/utils/email.ts`

**Problem**: If `baseUrl` parameter is falsy, the login link URL becomes `undefined/login` or `/login`.

**Fix**: Always use `env.FRONTEND_URL` as fallback: `const url = baseUrl || env.FRONTEND_URL`.

**Depends on**: None.

---

### L3. Missing `recruitment_admin` route in `roleBasedRouter.ts`

**File**: `skillpassport/src/shared/routing/roleBasedRouter.ts`

**Problem**: Role `recruitment_admin` has no explicit route mapping. Falls through to default route instead of `/recruitment/admin/dashboard`.

**Fix**: Add `recruitment_admin: '/recruitment/admin/dashboard'` mapping.

**Depends on**: None.

---

### L4. `scheduled` handler return type mismatch

**File**: `sso-worker/src/index.ts:12`

**Problem**: `export async function scheduled(...)` returns `void` but Cloudflare's `ScheduledController` expects a specific response shape.

**Fix**: Return `void` explicitly or add `Promise<void>` return type annotation.

**Depends on**: None.

---

## Execution Order

### Phase 1 — Critical (ship these first, highest impact)
1. **C2** — Password-in-email (trivial arg reorder, high security impact, no deps)
2. **C1** — ssoFetch signature fix (unblocks membership writes + C5)
3. **C3** — Move INTERNAL_API_KEY to secret (5 min fix)
4. **C4** — Add KV binding or remove rate-limit usage
5. **C5** — FDW write replacement (depends on C1)

### Phase 2 — High (security hardening + broken UX)
6. **H1** — AcceptInvite password min
7. **H2** — signupValidation password min + OTP slice
8. **H3** — JWT sub validation
9. **H4** — Remove *.pages.dev from ALLOWED_APP_URLS
10. **H5** — Legacy handlers SSO migration (requires approval)
11. **H6** — SignupRecruiter OTP fix (depends on H5 decision)

### Phase 3 — Medium (reliability + maintainability)
12. **M4** — Consolidate email secret names
13. **M6** — Extract PASSWORD_MIN to shared constant
14. **M5** — Add missing env vars
15. **M1** — get_jwt_claims retry
16. **M7** — Rate limit increase
17. **M2** — Email resend KV path
18. **M3** — Idempotency key

### Phase 4 — Low (polish)
19. **L2** — email.ts baseUrl fallback
20. **L1** — Regenerate types (after M5)
21. **L3** — recruitment_admin route
22. **L4** — scheduled handler return type
