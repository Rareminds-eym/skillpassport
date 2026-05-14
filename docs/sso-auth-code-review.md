# Industrial-Grade Code Review: `sso-auth` ← `dev`

**Repository**: `Rareminds-eym/skillpassport`  
**Base Branch**: `dev`  
**Head Branch**: `sso-auth`  
**Reviewer**: Staff Engineer Review (Automated)  
**Date**: 2026-05-14 (Revision 2 — Deep Dive)  

---

## Diff Summary

| Metric | Value |
|--------|-------|
| Files changed | **1,539** (excl. SQL dumps: 1,875 total) |
| Lines added | **+45,550** |
| Lines removed | **−87,263** |
| Commits | **~60** |

### Key Change Categories

| Category | Scope |
|----------|-------|
| **Auth Migration** | Supabase Auth → SSO (`@rareminds-eym/auth-client` + `auth-core`) |
| **Entity Rename** | `student` → `learner` across 600+ files (routes, types, DB queries, components) |
| **Backend API** | New Pages Functions for payments, learners, OTP, email verification |
| **Frontend Auth** | New `ssoClient`, `apiClient`, rewritten `authStore`, `useAuth` hook |
| **Infrastructure** | Service bindings (`PAYMENT_WORKER`, `SSO_SERVICE`), Zod validation, response utils |
| **Cleanup** | Removed 336 Supabase SQL dump files, legacy auth modules, embedding worker |

---

## 🔴 CRITICAL — Must fix before merge

### C1. Production Secret Committed to Git | [test-db.js:3-4](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/test-db.js#L3-L4)

- **Risk**: The file `test-db.js` contains a **hardcoded Supabase `service_role` key** in plaintext:
  ```js
  const supabase = createClient(
    'https://gdgegctwcubwlhztyyag.supabase.co',
    'eyJhbGciOiJIUzI1NiIs..._N83lrIpRvLcfACsY0Qv6o7QVqIyDzU1wZ1nAnBtkQ'
  );
  ```
  This key **bypasses ALL Row-Level Security** and grants full read/write/delete access to every table. Once pushed to any remote, it is compromised forever (git history).  
  `test-db-out.txt` also leaks query results.

- **Fix**:
  1. **Immediately rotate** the Supabase service_role key in the Supabase dashboard.
  2. Delete both files and add them to `.gitignore`.
  3. Use `git filter-branch` or `BFG Repo Cleaner` to scrub the key from git history.
  4. Add a pre-commit hook or CI check (e.g., `trufflehog`, `gitleaks`) to prevent future secret commits.

---

### C2. SSO JWT Passed to Supabase Client Creates Silent RLS Bypass | [functions/api/shared/auth.ts:55-58](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/api/shared/auth.ts#L55-L58)

- **Risk**: The `authenticateUser()` function creates a user-scoped Supabase client with the **SSO JWT**, but Supabase RLS policies expect **Supabase-issued JWTs** with `auth.uid()`. The custom SSO JWT will not set `auth.uid()` in PostgREST context. RLS policies checking `auth.uid() = user_id` will **silently return empty results**. Any endpoint using this `supabase` client instead of `supabaseAdmin` will appear to work but return incomplete/empty data.

  This is the **worst kind of bug** — it's silent and affects data correctness.

- **Fix**: Remove the user-scoped `supabase` client. All data access should go through `supabaseAdmin` with explicit `WHERE user_id = ?` filters.

---

### C3. Dual Auth Systems — Inconsistent Protection | Multiple files

- **Risk**: Two completely different authentication middlewares coexist:
  
  | System | File | Used By |
  |--------|------|---------|
  | **New** `withAuth` (auth-core) | [functions/lib/auth.ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/lib/auth.ts) | Payment handlers, Learner endpoints |
  | **Legacy** `authenticateUser` | [functions/api/shared/auth.ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/api/shared/auth.ts) | Career, Course APIs |
  
  The **new** system enforces email verification (403 for unverified users). The **legacy** system does not. An attacker with an unverified account can access career AI, course APIs, and learner data endpoints.

- **Fix**: Migrate all endpoints to `withAuth`. Add the email verification check to `authenticateUser()` as a stopgap.

---

### C4. OTP Endpoint Has NO Authentication — SMS Toll Fraud Risk | [functions/api/otp/path.ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/api/otp/[[path]].ts)

- **Risk**: The entire OTP API (`/api/otp/send`, `/api/otp/verify`, `/api/otp/resend`) has **no authentication middleware**. The router uses bare `onRequest` without `withAuth` or `authenticateUser`. There is also **no rate limiting**.

  An attacker can:
  1. **SMS bomb any phone number** by calling `/api/otp/send` in a loop — each call sends an SMS via MessageCentral, costing money.
  2. **Enumerate phone numbers** by observing different response patterns.
  3. **Brute-force OTP verification** — 4-digit OTP has only 10,000 combinations. Without rate limiting or attempt counting, an attacker can verify any phone number.

- **Fix**:
  1. Add rate limiting: max 3 OTP sends per phone per 15 minutes, max 5 verify attempts per verificationId.
  2. Either require authentication (logged-in users only) or add a CAPTCHA for unauthenticated OTP sends.
  3. Increase OTP length to 6 digits minimum.

---

### C5. `cancel-subscription` IDOR — Any User Can Cancel Any Subscription | [functions/api/payments/handlers/cancel-subscription.ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/api/payments/handlers/cancel-subscription.ts)

- **Risk**: The cancel-subscription handler takes a subscription ID from the URL path and sends it directly to Razorpay via RPC **without verifying the subscription belongs to the authenticated user**:
  ```ts
  const worker = getPaymentWorker(env);
  const subscription = await worker.cancelSubscription(subscriptionId);
  ```
  Any authenticated user can cancel any other user's Razorpay subscription by guessing/iterating IDs. This is a **financial impact IDOR**.
  
  Note: `deactivate-subscription.ts` correctly checks `.eq('user_id', user.sub)` — but `cancel-subscription.ts` does not.

- **Fix**: Before calling the RPC, verify subscription ownership:
  ```ts
  const { data: sub } = await supabase.from('subscriptions')
    .select('razorpay_subscription_id')
    .eq('id', subscriptionId)
    .eq('user_id', user.sub)
    .single();
  if (!sub) return apiError(404, 'NOT_FOUND', 'Subscription not found');
  await worker.cancelSubscription(sub.razorpay_subscription_id);
  ```

---

### C6. Wildcard CORS (`Access-Control-Allow-Origin: *`) on Authenticated Endpoints | 7+ files

- **Risk**: Multiple authenticated API endpoints use wildcard CORS:
  
  | File | Impact |
  |------|--------|
  | `functions/api/career/handlers/chat.ts:398` | Career AI chat streaming responses |
  | `functions/api/course/handlers/ai-tutor-chat.ts:305` | AI tutor streaming |
  | `functions/api/course/[[path]].ts:39` | All course endpoints |
  | `functions/api/analyze-assessment/[[path]].ts:20` | Assessment analysis |
  | `functions/api/question-generation/[[path]].ts:46` | Question generation |
  | `functions/api/role-overview/[[path]].ts:32` | Role overviews |
  | `src/functions-lib/cors.ts:44` (legacy export) | Shared CORS module |
  
  Combined with the `Authorization` header, this means **any malicious website** can make authenticated requests to these APIs using the user's token (via XSS or token theft). The `functions/lib/cors.ts` (new module) correctly whitelists origins, but legacy endpoints don't use it.

  Furthermore, `src/functions-lib/cors.ts` has `Access-Control-Allow-Credentials: 'true'` alongside the wildcard `*` in the legacy export — this is explicitly forbidden by the CORS spec and browsers will reject it, but it indicates confusion about the security model.

- **Fix**: Replace all wildcard CORS with the new `getCorsHeaders(request)` from `functions/lib/response.ts`. Delete the legacy `corsHeaders` export.

---

### C7. Role Name Mismatch — New Signups Locked Out of Routes | Multiple files

- **Risk**: There is a **fatal role naming mismatch** between signup and route protection:
  
  | Component | Roles Used |
  |-----------|-----------|
  | **Signup** (`UnifiedSignup.tsx:574`) | `school_student`, `college_student`, `learner` |
  | **Route Guard** (`learnerRoutes.jsx:17`) | `LEARNER_ROLES = ["learner", "school-learner", "college-learner"]` (hyphenated) |
  | **ProtectedRoute** (`ProtectedRoute.jsx:10`) | `school-learner`, `college-learner` (hyphenated) |
  | **Auth Store** (`authStore.ts:103`) | `isLearnerRole` only matches `r === 'learner'` |
  
  A user who signs up as `school_student` will:
  1. Get role `school_student` (underscore) in the JWT
  2. Fail `LEARNER_ROLES.includes('school_student')` → **blocked from `/learner/*` routes**
  3. Fail `isLearnerRole()` → `isLearner` flag is `false`
  4. Be redirected to `/` (home page) by the route guard
  
  **New users cannot access the platform after signing up.**

- **Fix**: Standardize role names across the entire system. Either:
  1. Use underscore everywhere: `school_student` → update `LEARNER_ROLES` and `ProtectedRoute`
  2. Use hyphen everywhere: `school-learner` → update signup and SSO
  3. Map both in the role checkers:
  ```ts
  const isLearnerRole = (roles: string[]): boolean =>
    roles.some((r) => ['learner', 'school_student', 'college_student', 'school-learner', 'college-learner'].includes(r));
  ```

---

## 🟠 HIGH — Should fix before merge

### H1. `learners/by-email.ts` IDOR — Any User Can Fetch Any Learner's Full Profile | [functions/api/learners/by-email.ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/api/learners/by-email.ts)

- **Risk**: The endpoint explicitly comments that it **doesn't block** non-admin users from fetching other users' data:
  ```ts
  // Note: We don't block here because the SSO email might differ from the learner email.
  ```
  This returns the learner's **full profile** including: education, skills, experience, projects, certificates, trainings, and skill passports. Any authenticated user can fetch any other user's complete career data by guessing their email.

- **Fix**: Remove the email-based lookup for non-admin users entirely. Non-admin users should only be able to fetch their own data via `user_id` from the JWT. If SSO email ≠ learner email, fix the data, don't remove the security check.

---

### H2. Payment Handlers Missing Authorization (Partial) | `functions/api/payments/handlers/*`

- **Risk**: While `get-user-payments.ts` and `get-active-subscription.ts` correctly use `user.sub` from the JWT (good!), and `deactivate-subscription.ts` correctly verifies ownership, several other handlers accept user IDs from query params:
  - `get-subscription-payments.ts` — query param
  - `get-user-subscriptions.ts` — query param  
  - `get-user-entitlements.ts` — query param
  
  The authorization model is inconsistent across handlers.

- **Fix**: Audit every handler. Use `context.data.user.sub` as the canonical user identity. Never accept user IDs from query params for data that should be user-scoped.

---

### H3. `ssoClient.ts` — Hard Redirect on Session Expiry | [src/shared/api/ssoClient.ts:19-21](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/src/shared/api/ssoClient.ts#L19-L21)

- **Risk**: `window.location.href = '/login'` destroys all unsaved state (forms, assessments, messages) without warning.

- **Fix**: Show a session-expired modal with a "Log In Again" button instead of a hard redirect.

---

### H4. `getCurrentSession()` Returns Fake Expiry Values | [src/shared/api/authUtils.ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/src/shared/api/authUtils.ts)

- **Risk**: Returns hardcoded `expires_in: 3600` and `expires_at: now + 3600` with no relationship to actual JWT expiry.

- **Fix**: Parse the real `exp` from the JWT using `jose.decodeJwt()`.

---

### H5. `isAuthenticated` Persisted to localStorage Creates Auth Bypass Race | [src/shared/model/authStore.ts:395-403](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/src/shared/model/authStore.ts#L395-L403)

- **Risk**: The store persists `isAuthenticated: true` to localStorage. On page refresh:
  1. Zustand rehydrates `isAuthenticated: true` from storage
  2. `onRehydrateStorage` sets `loading: true` (good)
  3. But before `initialize()` completes, any code checking `isAuthenticated` directly (not behind `loading`) will see `true` for an expired session
  
  The `EmailVerificationGuard` at line 71 renders children during `authLoading` (`if (authLoading) return <>{children}</>`) — this means **unverified users see protected content for a flash** during initialization.

- **Fix**: 
  1. Don't persist `isAuthenticated`. Derive it from `user !== null` after initialization.
  2. Fix `EmailVerificationGuard`: during loading, show a loading spinner, not children.
  ```tsx
  if (authLoading) return <Loader />;
  ```

---

### H6. `login()` Overload via Runtime Type Check Is Fragile | [src/shared/model/authStore.ts:198-212](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/src/shared/model/authStore.ts#L198-L212)

- **Risk**: `login()` accepts `(string, string)` or `(User, Session?)` and differentiates at runtime via `typeof`. Callers can silently get wrong behavior.

- **Fix**: Split into `loginWithCredentials()` and `setAuthenticatedUser()`.

---

### H7. `functions/node_modules` Committed to Git | `functions/node_modules/`

- **Risk**: The `functions/` directory has its own `node_modules/` checked into the repository containing `@supabase`, `@rareminds-eym`, `jose`, `pdf-lib`, etc. This:
  1. Bloats the repository by 10s of MBs
  2. Makes dependency updates invisible (no lockfile diff)
  3. Can contain platform-specific binaries that break across OSes
  4. Creates security risk — vendored deps don't get npm audit alerts

- **Fix**: Add `functions/node_modules/` to `.gitignore`. Use `npm install` in CI. If vendoring is intentional for Cloudflare Pages, use a bundler instead.

---

### H8. `.npmrc` Exposes Auth Token Pattern | [.npmrc:3](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/.npmrc#L3)

- **Risk**: `.npmrc` references `${NPM_TOKEN}` — if this file ends up in a Docker image, the build cache could contain the resolved token.

- **Fix**: Use `.npmrc.ci` for CI and add `.npmrc` to `.dockerignore`.

---

## 🟡 MEDIUM — Fix in follow-up PR

### M1. Email Verification DB Check Mutates Shared Auth Object | [functions/lib/auth.ts:97](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/lib/auth.ts#L97)

- **Risk**: `user.is_email_verified = true` mutates the JWT payload object directly. If `auth-core` caches decoded JWTs, this creates a TOCTOU race.

- **Fix**: Use a local `isEmailVerified` variable, don't mutate the payload.

---

### M2. Signup Role Dropdown Hardcodes Available Roles | `UnifiedSignup.tsx`

- **Risk**: Only 3 roles are `isAvailable`. Business logic hardcoded in UI.
- **Fix**: Drive from config/API.

---

### M3. `student → learner` Rename Incomplete in DB Queries | Tour components, Career context

- **Risk**: Mixed references to `students` and `learners` tables. Runtime errors if schema was renamed without updating all queries.
- **Fix**: Create a migration checklist mapping every reference.

---

### M4. Duplicated "Wait for Loading" Pattern | [src/shared/api/authUtils.ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/src/shared/api/authUtils.ts)

- **Risk**: `getCurrentUser()` and `getCurrentSession()` contain identical 15-line "wait for loading state" blocks.
- **Fix**: Extract into `waitForAuthReady()` helper.

---

### M5. No Request Timeout in `apiClient.ts` | [src/shared/api/apiClient.ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/src/shared/api/apiClient.ts)

- **Risk**: No `AbortController` timeout. Hung backends leave UI spinners forever.
- **Fix**: Add 30s default timeout.

---

### M6. Many Empty `catch {}` Blocks Swallow Errors | 20+ files

- **Risk**: Silent error swallowing across `functions/` makes debugging impossible.
- **Fix**: At minimum log, preferably propagate.

---

### M7. Email Verification DB Check on Every Request | [functions/lib/auth.ts:81-101](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/lib/auth.ts#L81-L101)

- **Risk**: DB round-trip on every request for unverified users (~50-100ms per call).
- **Fix**: Cache in KV with short TTL, or force token refresh after verification.

---

### M8. Payment Responses Missing CORS Headers | `get-subscription.ts` and others

- **Risk**: Several payment handlers construct `new Response(JSON.stringify(...), { headers: { 'Content-Type': 'application/json' } })` without CORS headers. Meanwhile, `get-active-subscription.ts` uses `apiSuccess()` which includes CORS. This means some responses will be blocked by browsers when called cross-origin.

- **Fix**: Use `apiSuccess()`/`apiError()` from `functions/lib/response.ts` consistently in all handlers.

---

### M9. Career API `recommend` Creates Service Client Without Auth Middleware | [functions/api/career/handlers/recommend.ts:98](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/api/career/handlers/recommend.ts#L98)

- **Risk**: The `handleRecommendOpportunities` handler creates a service_role Supabase client inline:
  ```ts
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  ```
  It accepts a `learnerId` from the POST body without verifying the authenticated user owns that learner ID. Any authenticated user can get recommendations for any learner.

- **Fix**: Verify the `learnerId` belongs to the authenticated user before proceeding.

---

## 🟢 LOW — Suggestions & polish

### L1. Debug Files Committed | `test-db.js`, `test-db-out.txt`
- Already covered in C1.

### L2. Inconsistent Error Response Shapes
- New endpoints use `{ success, data, error: { code, message }, meta }`. Legacy use `{ error: "string" }`.

### L3. `useAuth` Hook Is a Thin Wrapper
- Duplicates `useAuthStore` selectors without adding value.

### L4. Compatibility Date `2025-05-09` in wrangler.toml
- Pinning to latest date may pull in untested runtime changes.

### L5. Learner Dashboard Error Message Leaks Internal Details | [functions/api/learners/dashboard.ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/api/learners/dashboard.ts)
- **Risk**: The 404 error response includes the raw `user_id`:
  ```ts
  `No learner record found for user_id "${userId}". Check if learner.user_id matches users.id`
  ```
  This leaks internal database column names and UUIDs to the client.
- **Fix**: Return a generic message: `"Learner profile not found"`.

### L6. `check-subscription-access` Returns 200 on Error | [functions/api/payments/handlers/check-subscription-access.ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/api/payments/handlers/check-subscription-access.ts)
- **Risk**: When a DB error occurs, the handler returns `status: 200` with `success: false` and `hasAccess: false`. This makes monitoring impossible — all responses look successful from an HTTP perspective.
- **Fix**: Return `status: 500` for server errors, `status: 200` only for legitimate "no subscription" results.

---

## 📊 Summary Scorecard

| Dimension        | Score (1–10) | Notes |
|-----------------|:------------:|-------|
| Correctness      | 4 | Silent RLS bypass (C2), role mismatch locks out new users (C7), incomplete rename (M3) |
| Security         | 2 | **Committed secret (C1)**, unauthenticated OTP (C4), cancel-sub IDOR (C5), wildcard CORS (C6), learner-by-email IDOR (H1), no rate limiting |
| Performance      | 6 | DB round-trip per request (M7), no request timeouts (M5), parallel queries in dashboard (good) |
| Architecture     | 5 | Sound SSO design, but dual auth systems (C3), overloaded login() (H6), 3 CORS systems, inconsistent response shapes |
| Observability    | 4 | 20+ swallowed exceptions (M6), info leakage in errors (L5), errors returned as 200s (L6) |
| Maintainability  | 5 | Clean new patterns coexist with legacy cruft, vendored node_modules (H7), role naming chaos (C7) |
| Test Coverage    | 2 | Legacy auth tests deleted, zero new tests for any of: SSO flow, apiClient, authStore, payment handlers, OTP |
| **Overall**      | **3.9** | **Architecture is sound but the branch has multiple critical security vulnerabilities and correctness bugs that will break user flows in production.** |

---

## ✅ What's Done Well

1. **SSO Architecture**: The `auth-client` → `auth-core` → SSO worker separation is excellent. The Cloudflare Service Binding for zero-latency internal auth (`PAYMENT_WORKER`, `SSO_SERVICE`) is production-grade infrastructure.

2. **`withAuth` wrapper** ([functions/lib/auth.ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/lib/auth.ts)): Email verification enforcement with DB fallback, SSO_SERVICE/SSO_DOMAIN dual path, and observability logging is well-designed.

3. **Zod Validation Schemas** ([functions/lib/validation.ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/lib/validation.ts)): Comprehensive input validation with type-safe `validateBody<T>()` helper.

4. **Standardized Response Utilities** ([functions/lib/response.ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/lib/response.ts)): Request IDs, timing, CORS whitelist, safe DB error mapping — this is how all endpoints should work.

5. **Payment handler ownership checks**: `deactivate-subscription.ts` and `get-user-payments.ts` correctly verify `user_id === user.sub` — proving the pattern works. It just needs to be applied everywhere.

6. **`ssoLoginWithRoleCheck()`**: Role-based login with automatic logout on role mismatch prevents privilege confusion.

---

## 📋 Top 10 Actions (Priority Order)

| # | Priority | Action |
|---|----------|--------|
| 1 | 🔴 **NOW** | Rotate Supabase service_role key. Delete `test-db.js`, `test-db-out.txt`. Scrub git history. Add `gitleaks` to CI. |
| 2 | 🔴 **BEFORE MERGE** | Fix role name mismatch (C7) — new signups are completely locked out. Standardize `school_student`/`school-learner`/`learner` naming. |
| 3 | 🔴 **BEFORE MERGE** | Add authentication + rate limiting to OTP endpoint (C4). 4-digit OTP without rate limiting is brute-forceable. |
| 4 | 🔴 **BEFORE MERGE** | Fix `cancel-subscription` IDOR (C5) — verify ownership before Razorpay RPC call. |
| 5 | 🔴 **BEFORE MERGE** | Replace all wildcard `Access-Control-Allow-Origin: *` with origin whitelist (C6). Use `getCorsHeaders()` from `functions/lib/response.ts`. |
| 6 | 🟠 **BEFORE MERGE** | Fix `learners/by-email` IDOR (H1) — restrict non-admin users to their own data only. |
| 7 | 🟠 **BEFORE MERGE** | Fix `EmailVerificationGuard` flash (H5) — show `<Loader />` during `authLoading`, not `{children}`. |
| 8 | 🟠 **THIS WEEK** | Unify all endpoints to `withAuth` middleware. Remove `authenticateUser()`. Fix silent RLS bypass (C2). |
| 9 | 🟠 **THIS WEEK** | Add `functions/node_modules/` to `.gitignore`. Use CI `npm install` instead of vendoring. |
| 10 | 🟡 **NEXT SPRINT** | Write integration tests for SSO login, token refresh, session expiry, email verification, payment flows. Coverage is currently zero. |
