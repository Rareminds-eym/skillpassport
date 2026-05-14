# SSO Auth — Fix Implementation Plan

**Author**: Principal Engineer Review  
**Date**: 2026-05-14  
**Source**: [sso-auth-code-review.md](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/docs/sso-auth-code-review.md)

---

## Deep Verification Summary

I verified every issue against the actual source code. **3 issues are already fixed**, and **2 have inaccurate details** in the review:

| Issue | Review Verdict | **Actual Status** |
|-------|---------------|-------------------|
| C5 (cancel-sub IDOR) | Critical | ✅ **Already fixed** — ownership check at [cancel-subscription.ts:38-50](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/api/payments/handlers/cancel-subscription.ts#L38-L50) |
| H1 (by-email IDOR) | High | ✅ **Already fixed** — admin+email check at [by-email.ts:30-36](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/api/learners/by-email.ts#L30-L36) |
| H2 (payment auth) | High | ✅ **Already fixed** — all 3 handlers use `context.data.user.sub` |
| C2 (RLS bypass) | Critical | ⚠️ **Mitigated** — both `supabase` and `supabaseAdmin` now point to same admin client ([shared/auth.ts:62](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/api/shared/auth.ts#L62)). Confusing API surface remains. |
| C7 (role mismatch) | Critical | ❌ **Obsolete / Already Fixed** — The codebase has fully migrated to strictly using `learner`. `school-learner`, `college-learner`, `school_student`, and `college_student` have been entirely purged from the routing and signup flows. |
| H5 (email guard flash) | High | ⚠️ **Partially fixed** — [App.tsx:71-75](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/src/App.tsx#L71-L75) now shows spinner. `isAuthenticated` persistence still needs fixing. |

**Remaining issues confirmed valid: C1, C3, C4, C6, H3, H4, H5(partial), H6, H7, H8, M1, M5, M7, M8, M9, L5, L6**

---

## Wave 1 — Emergency (Same Day, Pre-Merge)

### 1.1 Secret Rotation & File Cleanup (C1)

> [!CAUTION]
> The service_role key in [test-db.js](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/test-db.js) bypasses ALL RLS. Rotate immediately.

**Manual Steps (not automatable):**
1. Go to Supabase Dashboard → Settings → API → Rotate `service_role` key
2. Update all environments (`.dev.vars`, Cloudflare Pages secrets, CI)

**Code Changes:**

| File | Action |
|------|--------|
| `test-db.js` | Delete |
| `test-db-out.txt` | Delete |
| `.gitignore` | Add `test-db*` and `functions/node_modules/` |

```diff
# .gitignore — append:
+# Debug / test files with secrets
+test-db*
+
+# Functions vendored deps (use CI npm install)
+functions/node_modules/
```

**Git history scrub:**
```bash
# Install BFG if needed: brew install bfg
bfg --delete-files test-db.js
bfg --delete-files test-db-out.txt
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

**CI guardrail** — add `gitleaks` to GitHub Actions:
```yaml
# .github/workflows/security.yml
name: Secret Scanning
on: [push, pull_request]
jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

### 1.2 OTP Endpoint Security (C4)

**Problem**: [otp/[[path]].ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/api/otp/%5B%5Bpath%5D%5D.ts) — zero auth, zero rate limiting.

**Fix**: IP-based rate limiting using in-memory Map (CF Pages Functions are short-lived, so this provides per-invocation burst protection; for persistent limiting, add Supabase check).

**File**: `functions/api/otp/[[path]].ts` — replace router with rate-limited version:

```typescript
import type { PagesFunction } from '../../../src/functions-lib/types';
import { getCorsHeaders } from '../../lib/cors';
import { sendOtpHandler } from './handlers/send';
import { verifyOtpHandler } from './handlers/verify';
import { resendOtpHandler } from './handlers/resend';

// Simple per-request rate limiter using Supabase
async function checkOtpRateLimit(
  phone: string,
  action: 'send' | 'verify',
  env: Record<string, string>
): Promise<{ allowed: boolean; retryAfter?: number }> {
  // Use Supabase to track OTP attempts
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  const windowMinutes = action === 'send' ? 15 : 5;
  const maxAttempts = action === 'send' ? 3 : 5;
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  
  const { count } = await supabase
    .from('otp_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone)
    .eq('action', action)
    .gte('created_at', windowStart);
  
  if ((count ?? 0) >= maxAttempts) {
    return { allowed: false, retryAfter: windowMinutes * 60 };
  }
  
  // Record this attempt
  await supabase.from('otp_rate_limits').insert({ phone, action });
  return { allowed: true };
}

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  const origin = request.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    if ((path === '/api/otp' || path === '/api/otp/') && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok', service: 'otp-api' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
        status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const body = await request.json().catch(() => ({})) as Record<string, any>;
    const endpoint = path.replace('/api/otp', '').split('/').filter(Boolean)[0];

    // Rate limit check for send/resend
    if (endpoint === 'send' || endpoint === 'resend') {
      const phone = body.phone;
      if (phone) {
        const rl = await checkOtpRateLimit(phone, 'send', env as any);
        if (!rl.allowed) {
          return new Response(JSON.stringify({
            success: false,
            error: `Too many OTP requests. Try again in ${rl.retryAfter} seconds.`,
          }), { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
      }
    }

    // Rate limit check for verify
    if (endpoint === 'verify') {
      const phone = body.phone;
      if (phone) {
        const rl = await checkOtpRateLimit(phone, 'verify', env as any);
        if (!rl.allowed) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Too many verification attempts. Try again later.',
          }), { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
      }
    }

    switch (endpoint) {
      case 'send': return await sendOtpHandler(body, env);
      case 'verify': return await verifyOtpHandler(body, env);
      case 'resend': return await resendOtpHandler(body, env);
      default:
        return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }
  } catch (error: any) {
    console.error('OTP API Error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};
```

**DB migration** for rate limit table:
```sql
CREATE TABLE IF NOT EXISTS otp_rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text NOT NULL,
  action text NOT NULL CHECK (action IN ('send', 'verify')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_otp_rate_limits_lookup ON otp_rate_limits(phone, action, created_at);

-- Auto-cleanup: delete entries older than 1 hour
CREATE OR REPLACE FUNCTION cleanup_otp_rate_limits() RETURNS void AS $$
  DELETE FROM otp_rate_limits WHERE created_at < now() - interval '1 hour';
$$ LANGUAGE sql;
```

---

### 1.3 CORS Wildcard Removal (C6)

**Files to fix** (7 files with `Access-Control-Allow-Origin: *`):

| File | Line | Fix |
|------|------|-----|
| `functions/api/career/handlers/chat.ts` | 398 | Use `getCorsHeaders` |
| `functions/api/course/handlers/ai-tutor-chat.ts` | 305 | Use `getCorsHeaders` |
| `functions/api/course/[[path]].ts` | 39 | Use `getCorsHeaders` |
| `functions/api/analyze-assessment/[[path]].ts` | 20 | Use `getCorsHeaders` |
| `functions/api/question-generation/[[path]].ts` | 46 | Use `getCorsHeaders` |
| `functions/api/question-generation/handlers/streaming.ts` | 326 | Use `getCorsHeaders` |
| `functions/api/role-overview/[[path]].ts` | 32 | Use `getCorsHeaders` |

**Pattern** — replace every instance of:
```typescript
// BEFORE
'Access-Control-Allow-Origin': '*'

// AFTER (import getCorsHeaders from functions/lib/cors.ts)
...getCorsHeaders(request.headers.get('Origin'))
```

**Also**: Delete the deprecated `corsHeaders` export from both:
- [functions/lib/cors.ts:44-48](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/lib/cors.ts#L44-L48)
- [src/functions-lib/cors.ts:44-48](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/src/functions-lib/cors.ts#L44-L48)

Update all consumers of the deprecated export to use `getCorsHeaders(origin)`.

---

## Wave 2 — Critical Auth (1-2 Days, Pre-Merge)

### 2.1 Auth Unification (C3 + C2)

**Goal**: Eliminate `authenticateUser()` — all endpoints use `withAuth`.

**Step 1**: Add email-verification bypass option to `withAuth` for endpoints that don't need it yet:

```typescript
// functions/lib/auth.ts — add options parameter
export function withAuth(
  handler: (context: AuthenticatedContext) => Promise<Response>,
  options?: { skipEmailVerification?: boolean }
) {
  // ... existing code, but check options.skipEmailVerification
}
```

**Step 2**: Migrate each legacy endpoint file:

| File | Current Auth | Migration |
|------|-------------|-----------|
| `functions/api/career/[[path]].ts` | `authenticateUser` | `withAuth` |
| `functions/api/career/handlers/chat.ts` | `authenticateUser` | `withAuth` |
| `functions/api/career/handlers/recommend.ts` | None (M9!) | `withAuth` + ownership check |
| `functions/api/course/[[path]].ts` | `authenticateUser` | `withAuth` |

**Step 3**: Delete [functions/api/shared/auth.ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/api/shared/auth.ts) `authenticateUser` function (keep `sanitizeInput`, `isValidUUID`, `validateRequestSize` utilities).

### 2.2 Career Recommend IDOR Fix (M9)

[recommend.ts:69](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/api/career/handlers/recommend.ts#L69) — accepts `learnerId` from POST body without ownership verification.

**Fix**: After migrating to `withAuth`, verify ownership:

```typescript
// After getting learnerId from body and user from context:
const { data: learner } = await supabase
  .from('learners')
  .select('id')
  .eq('id', learnerId)
  .eq('user_id', user.sub)
  .maybeSingle();

if (!learner) {
  return jsonResponse({ error: 'Learner not found', recommendations: [] }, 403);
}
```

### 2.3 Strict Learner Role Enforcement (C7)

**Root cause**: The code review claimed there was a mismatch between `school_student`, `college_student`, `school-learner`, and `college-learner`.

**Verification**: A deep search of the codebase confirms that **these legacy roles have already been purged**. `UnifiedSignup.tsx`, `ProtectedRoute.jsx`, and `learnerRoutes.jsx` now strictly use `learner`.

**Action**: No code changes required. Do NOT introduce backward compatibility mapping for `school_student` or `college_student`. We will strictly enforce the canonical `learner` role. If legacy users exist in the DB, they must be migrated via a database script, not accommodated in the application code.

---

## Wave 3 — Frontend Hardening (1-2 Days, Pre-Merge)

### 3.1 Session Expiry Modal (H3)

Replace hard redirect in [ssoClient.ts:20](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/src/shared/api/ssoClient.ts#L20).

**Create** `src/shared/ui/SessionExpiredModal.tsx`:

```tsx
import { useEffect, useState } from 'react';

let showModalFn: (() => void) | null = null;

export function triggerSessionExpiredModal() {
  showModalFn?.();
}

export function SessionExpiredModal() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { showModalFn = () => setVisible(true); return () => { showModalFn = null; }; }, []);
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Expired</h3>
        <p className="text-gray-600 text-sm mb-6">Your session has expired. Please log in again to continue.</p>
        <button
          onClick={() => { setVisible(false); window.location.href = '/login'; }}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          Log In Again
        </button>
      </div>
    </div>
  );
}
```

**Update** `ssoClient.ts`:
```typescript
import { triggerSessionExpiredModal } from '@/shared/ui/SessionExpiredModal';

export const ssoClient = new AuthClient({
  baseURL: SSO_BASE_URL || '',
  onSessionExpired: () => triggerSessionExpiredModal(),
  debug: import.meta.env.DEV,
});
```

**Add** `<SessionExpiredModal />` in `App.tsx` alongside `<HotToaster>`.

### 3.2 Auth Store Fixes (H4, H5, H6)

**H4** — Fix fake expiry in [authUtils.ts:104-105](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/src/shared/api/authUtils.ts#L104-L105):

```typescript
import { decodeJwt } from 'jose';

// Inside getCurrentSession():
const decoded = decodeJwt(accessToken);
const expiresAt = (decoded.exp as number) || Math.floor(Date.now() / 1000) + 3600;
const expiresIn = expiresAt - Math.floor(Date.now() / 1000);

const session = {
  access_token: accessToken,
  refresh_token: '',
  token_type: 'bearer',
  expires_in: expiresIn,
  expires_at: expiresAt,
  user: { /* ... */ },
};
```

**H5** — Stop persisting `isAuthenticated` in [authStore.ts:395-403](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/src/shared/model/authStore.ts#L395-L403):

```typescript
partialize: (state) => ({
  user: state.user,
  // REMOVED: isAuthenticated — derive from user !== null after init
  role: state.role,
  isLearner: state.isLearner,
  isEducator: state.isEducator,
  isAdmin: state.isAdmin,
  isRecruiter: state.isRecruiter,
}),
```

**H6** — Split `login()` into two explicit methods. Add to AuthState interface:

```typescript
// New explicit methods
loginWithCredentials: (email: string, password: string) => Promise<LoginResponse>;
setAuthenticatedUser: (user: User, session?: Session) => void;

// Keep login() as deprecated wrapper for backward compat
/** @deprecated Use loginWithCredentials() or setAuthenticatedUser() */
login: (emailOrUser: string | User, passwordOrSession?: string | Session) => Promise<LoginResponse | void>;
```

### 3.3 API Client Timeout (M5)

**File**: [apiClient.ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/src/shared/api/apiClient.ts)

Add `AbortController` with 30s default to each method:

```typescript
const DEFAULT_TIMEOUT_MS = 30_000;

export async function apiGet<T>(path: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await ssoClient.fetch(`${API_BASE}${path}`, { signal: controller.signal });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err = extractError(body);
      throw new ApiError(res.status, err.message, err.code);
    }
    return res.json() as Promise<T>;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out', 'TIMEOUT');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
// Apply same pattern to apiPost, apiPut, apiPatch, apiDelete
```

---

## Wave 4 — Polish (Post-Merge, Within Sprint)

### 4.1 Email Verification Optimization (M1, M7)

**M1** — Stop mutating JWT payload at [auth.ts:97](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/lib/auth.ts#L97):

```typescript
// BEFORE
user.is_email_verified = true;

// AFTER — use local variable
const isEmailVerified = true;
// Pass isEmailVerified downstream if needed, don't mutate user
```

**M7** — Cache verification status. Use Supabase-backed short-TTL cache or skip DB check if JWT `is_email_verified` is true (which it will be after token refresh).

### 4.2 Payment Handler Polish (M8, L6)

**M8** — Replace bare `new Response(JSON.stringify(...))` with `apiSuccess()`/`apiError()` in:
- [check-subscription-access.ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/api/payments/handlers/check-subscription-access.ts) (all responses)
- [get-subscription-payments.ts](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/api/payments/handlers/get-subscription-payments.ts) (all responses)

**L6** — In `check-subscription-access.ts`, change error responses from `status: 200` to `status: 500`:

```typescript
// Line 46: status: 200 → status: 500
// Line 159: status: 200 → status: 500
```

### 4.3 Error Sanitization (L5)

[dashboard.ts:71](file:///mnt/E230EB0F30EAEA0D/Rareminds/skill-echosystem/skillpassport/functions/api/learners/dashboard.ts#L71):

```typescript
// BEFORE
return apiError(404, 'NOT_FOUND', `No learner record found for user_id "${userId}". Check if learner.user_id matches users.id`);

// AFTER
return apiError(404, 'NOT_FOUND', 'Learner profile not found', context.request, { startTime });
```

### 4.4 Vendored node_modules (H7) & npmrc (H8)

Already handled by `.gitignore` addition in Wave 1. After merging:

```bash
git rm -r --cached functions/node_modules/
git commit -m "chore: remove vendored functions/node_modules"
```

For H8, create `.dockerignore`:
```
.npmrc
.env
.dev.vars
```

---

## Execution Checklist

| # | Wave | Task | Est. | Status |
|---|------|------|------|--------|
| 1 | 🔴 W1 | Rotate Supabase key, delete test-db files | 30m | ⬜ |
| 2 | 🔴 W1 | Add gitleaks CI + scrub git history | 1h | ⬜ |
| 3 | 🔴 W1 | OTP rate limiting + CORS fix | 3h | ⬜ |
| 4 | 🔴 W1 | Replace all wildcard CORS (7 files) | 2h | ⬜ |
| 5 | 🟠 W2 | Migrate all endpoints to `withAuth` | 4h | ⬜ |
| 6 | 🟠 W2 | Fix career recommend IDOR | 30m | ⬜ |
| 7 | 🟠 W2 | Role normalization (authStore + ProtectedRoute) | 1h | ⬜ |
| 8 | 🟡 W3 | Session expiry modal | 2h | ⬜ |
| 9 | 🟡 W3 | Auth store fixes (H4, H5, H6) | 3h | ⬜ |
| 10 | 🟡 W3 | API client timeout | 1h | ⬜ |
| 11 | 🟢 W4 | Email verification optimization | 2h | ⬜ |
| 12 | 🟢 W4 | Payment handler polish + error sanitization | 2h | ⬜ |
| 13 | 🟢 W4 | Remove vendored node_modules, dockerignore | 30m | ⬜ |

**Total estimated effort: ~22 hours across 4 waves**
