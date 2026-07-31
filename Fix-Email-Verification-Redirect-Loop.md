Fix Email Verification Redirect Loop
Status: Draft  
Author: AI Assistant  
Date: 2026-06-19  
Priority: Critical  
1. Problem Statement
After a user verifies their email (clicks the verification link), the application redirects them back to the /verify-email page instead of the expected subscriptions page. This occurs despite the email being successfully marked as verified in the database.
2. Root Cause Analysis
2.1 Architecture Overview
┌─────────────────────────────────────────────────────────────────┐
│                         Verification Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  signup ──► /verify-email (no-token) ──► click email link        │
│       ┌──────────────────────────────────────────────┐          │
│       │              VerifyEmail.tsx                   │          │
│       │                                               │          │
│       │  1. POST /auth/verify-email ────► DB updated  │          │
│       │  2. refreshSession() ──────────► new JWT      │          │
│       │  3. Show "✅ Email Verified!"                  │          │
│       │  4. navigate('/subscription/plans')            │          │
│       └──────────────────┬───────────────────────────┘          │
│                          │                                      │
│                          ▼                                      │
│               EmailVerificationGuard                             │
│          ┌──────────────────────────────┐                       │
│          │ user.isEmailVerified?        │                       │
│          │  ├─ YES ─► render page       │                       │
│          │  └─ NO  ─► /verify-email ◄──┼─── BUG IS HERE        │
│          └──────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
2.2 Three Failure Modes
#	Failure Mode	Trigger	Consequence
A	ssoClient.refresh() fails (401 no cookie, network error)	Auth-client calls this.logout() → emits LOGOUT → store.setUser(null)	Store cleared. isAuthenticated = false. User redirected to /login. Works but confusing UX.
B	refresh() succeeds but getMe() fails	Store never updated with isEmailVerified: true. refreshSession() returns false (not checked).	Stale isEmailVerified = false in store → EmailVerificationGuard redirects to /verify-email. → PRIMARY BUG
C	Cross-tab event handler overwrites store after refreshSession() update	Async race in authStore.ts:483-510	Rare — both calls return same data. Usually benign.
2.3 Key Bug Location
File: skillpassport/src/pages/auth/VerifyEmail.tsx, line 30
// BUG: Return value never checked
await useAuthStore.getState().refreshSession();
// ↓ CONTINUES EVEN WHEN refreshSession() RETURNS false
The refreshSession() function (defined in authStore.ts:392-408) returns true on success and false on failure. In failure modes A and B, the VerifyEmail component ignores this return value, shows "✅ Email Verified!", and attempts a redirect. The EmailVerificationGuard (in App.tsx:23-58) then evaluates with the stale state and blocks the navigation.
3. Proposed Solution
3.1 Solution Overview
Four-part fix targeting all three failure modes:
Step	Change	Affects	Failure Modes Fixed
1	Check refreshSession() return in VerifyEmail.tsx	Frontend	A, B
2	Add ?verified=1 success banner in UnifiedLogin.tsx	Frontend	A (UX)
3	Harden cross-tab event handler against race	Frontend	C
4	(Optional) Issue fresh session server-side after verification	Backend	A, B (eliminates need for refresh)
3.2 Step 1 — VerifyEmail.tsx: Handle refresh failure explicitly
File: skillpassport/src/pages/auth/VerifyEmail.tsx
Change 1a: Expand the state type (line 8)
// BEFORE
type VerifyState = 'verifying' | 'success' | 'error' | 'no-token';

// AFTER
type VerifyState = 'verifying' | 'success' | 'success_session_lost' | 'error' | 'no-token';
Change 1b: Check refreshSession() return value and verify store state (lines 29-46)
// BEFORE (lines 29-46)
// Refresh session to get updated user data with is_email_verified = true
await useAuthStore.getState().refreshSession();

// Wait for session to fully propagate to auth store
await new Promise(resolve => setTimeout(resolve, 1000));

// Log user data after refresh for debugging
const refreshedUser = useAuthStore.getState().user;
console.log('[VerifyEmail] User data after refresh:', { ... });

// Set success state
setState('success');

// AFTER
// Refresh session to get updated user data with is_email_verified = true
const refreshOk = await useAuthStore.getState().refreshSession();

const refreshedUser = useAuthStore.getState().user;
const isEmailVerified = refreshedUser?.isEmailVerified === true;

console.log('[VerifyEmail] User data after refresh:', {
  role: refreshedUser?.role,
  roles: refreshedUser?.roles,
  orgId: refreshedUser?.orgId,
  isEmailVerified,
  refreshOk,
  isAuthenticated: useAuthStore.getState().isAuthenticated,
});

if (!refreshOk || !isEmailVerified) {
  console.warn('[VerifyEmail] Session lost or stale after verification', {
    refreshOk,
    isEmailVerified,
    user: refreshedUser,
  });
  setState('success_session_lost');
  return; // Don't proceed to auto-redirect
}

// Set success state
setState('success');
Change 1c: Add success_session_lost render branch after the success block (after line 227)
// BEFORE: (nothing after success block)
// AFTER: Add after line 227

{state === 'success_session_lost' && (
  <div className="bg-white rounded-xl shadow-lg p-8">
    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
    <h2 className="text-2xl font-bold text-gray-900 mb-2">✅ Email Verified!</h2>
    <p className="text-gray-600 mb-4">
      Your email has been successfully verified.
    </p>
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <p className="text-sm text-amber-800">
        <strong>Session expired:</strong> Your session ended during verification.
        Please log in again to continue.
      </p>
    </div>
    <button
      onClick={() => navigate('/login?verified=1', { replace: true })}
      className="w-full py-3 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
    >
      Continue to Login
    </button>
  </div>
)}
Change 1d: Add CheckCircle to the imports if not already present (line 3)
// Already imported at line 3:
import { AlertCircle, CheckCircle, Loader2, Mail } from 'lucide-react';
// CheckCircle is already imported ✓
Automatic redirect: The success_session_lost state should auto-redirect to login after a short delay (2-3 seconds) as a convenience, with the manual button as a fallback.
// Add after setState('success_session_lost') in the effect
useEffect(() => {
  if (state === 'success_session_lost') {
    const timer = setTimeout(() => {
      navigate('/login?verified=1', { replace: true });
    }, 4000);
    return () => clearTimeout(timer);
  }
}, [state, navigate]);
3.3 Step 2 — UnifiedLogin.tsx: Handle ?verified=1 param
File: skillpassport/src/features/auth/ui/UnifiedLogin.tsx
Change 2a: Read the verified param at the top of the component (after line 52)
// AFTER line 52 (invitationToken)
const justVerified = searchParams.get('verified') === '1';
Change 2b: Add green success banner in the render (before the error banner at line 368)
// Add BEFORE the existing error banner (line 368):
{justVerified && (
  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
    <p className="text-sm text-green-800">
      Your email has been verified successfully. Please sign in to continue.
    </p>
  </div>
)}
Add `CheckCircle` and `CheckCircle2` (if needed) to the lucide-react import at line 1. Also add `useEffect` to the React import at line 2 (currently only has `useRef`, `useState`):
```typescript
// BEFORE (line 2):
import { ChangeEvent, FormEvent, useRef, useState } from 'react';

// AFTER:
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
```
Change 2c: Clean the verified param from the URL after mount (prevent stale banner on refresh)
// Add after the existing URL param reads (around line 52):
useEffect(() => {
  if (justVerified) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('verified');
    navigate({ search: params.toString() }, { replace: true });
  }
}, []); // Only on mount
Note: navigate must be added to the dependency array, but we only want to run this once. Use a ref to guard:
const hasCleanedVerifiedRef = useRef(false);
useEffect(() => {
  if (justVerified && !hasCleanedVerifiedRef.current) {
    hasCleanedVerifiedRef.current = true;
    const params = new URLSearchParams(searchParams.toString());
    params.delete('verified');
    navigate({ search: params.toString() }, { replace: true });
  }
}, [justVerified, navigate]);
3.4 Step 3 — authStore.ts: Harden cross-tab event handler race
File: skillpassport/src/shared/model/authStore.ts
Change 3: Add an early-return guard in the cross-tab event handler (at line 492)
// BEFORE (lines 492-508):
} else if (event === 'LOGIN' || event === 'REFRESH') {
  try {
    const me = await ssoClient.getMe();
    const user = mapMeToUser(me);
    useAuthStore.setState({
      user,
      isAuthenticated: true,
      role: user.role ?? null,
      ...computeRoleFlags(me.roles),
    });
    if (event === 'LOGIN' || !tokenRefreshService.isRunning()) {
      startTokenRefresh();
    }
  } catch {
    // Session expired during rehydration — ignore
  }
}

// AFTER:
} else if (event === 'LOGIN' || event === 'REFRESH') {
  // Defensive: skip if store already has up-to-date email verification.
  // Prevents the event handler from overwriting the store with stale data
  // when refreshSession() has already fetched fresh data concurrently.
  const currentState = useAuthStore.getState();
  if (
    event === 'REFRESH' &&
    currentState.isAuthenticated &&
    currentState.user?.isEmailVerified
  ) {
    return; // Already fresh — no need to refetch
  }

  try {
    const me = await ssoClient.getMe();
    const user = mapMeToUser(me);
    useAuthStore.setState({
      user,
      isAuthenticated: true,
      role: user.role ?? null,
      ...computeRoleFlags(me.roles),
    });
    if (event === 'LOGIN' || !tokenRefreshService.isRunning()) {
      startTokenRefresh();
    }
  } catch {
    // Session expired during rehydration — ignore
  }
}
3.5 Step 4 (Optional) — sso-worker verify-email.ts: Issue fresh session
File: sso-worker/src/routes/verify-email.ts
This step eliminates the need for the client to call refreshSession() after verification by issuing a fresh session directly.
Change 4: Add session rotation after marking email as verified (after line 116)
// AFTER line 116 (database.update users is_email_verified = true)

// Issue a fresh session so the client receives a JWT with
// is_email_verified: true without needing an explicit refresh.
// Uses the request's existing refresh-token cookie if present.
const cookieToken = getCookie(req, 'refresh_token');
if (cookieToken) {
  // Build rotation context from request headers
  const rotationCtx: RotationContext = {
    ip: req.headers.get('CF-Connecting-IP'),
    ua: req.headers.get('User-Agent'),
  };

  // Rotate the session — mintAccessToken reads is_email_verified from DB
  const outcome = await rotateRefreshToken(env, ctx, cookieToken, rotationCtx)
    .catch(() => null);

  if (outcome && (outcome.kind === 'rotated' || outcome.kind === 'overlap')) {
    // Build response from scratch (no pre-existing `response` variable)
    const resp = json({ verified: true, access_token: outcome.accessToken });
    setAuthCookies(resp, outcome.accessToken, outcome.refreshToken, env);
    return resp;
  }
}

// Fallback: no session rotation occurred — return normal response without access_token
return json({ verified: true });
Requires imports:
import { getCookie, setAuthCookies } from "../lib/cookies";
import { rotateRefreshToken, type RotationContext } from "../lib/session-rotation";
IMPORTANT: Verify that rotateRefreshToken is safe to call from the verifyEmail handler — it must handle the case where cookieToken is missing, expired, or invalid (it already does — returns invalid, session_expired, etc.), which the .catch(() => null) above handles gracefully.
4. Testing Strategy
4.1 Test Scenarios
#	Scenario	Expected Outcome
T1	Happy path: user has valid session, refreshSession() succeeds	Redirect to subscription page immediately
T2	No session: refreshSession() returns false	Show success_session_lost UI, button to /login?verified=1
T3	Login after ?verified=1: user logs in	Green success banner shown at top of login form
T4	Refresh login page with ?verified=1	Banner appears once, then param is cleaned from URL
T5	Cross-tab REFRESH event during active refreshSession()	Event handler skips getMe() since store is already fresh
T6	Server-side session rotation (Step 4)	Client receives access_token directly without separate refresh
4.2 Unit Tests
- VerifyEmail component: mock refreshSession() to return false, verify success_session_lost state is set, verify navigation to /login?verified=1
- authStore cross-tab handler: mock getMe(), verify handler returns early when isEmailVerified is already true
4.3 Integration Tests
- Full E2E: signup → receive verification email → click link → verify → redirect to subscription → verify subscription page renders
- Edge: open verification link in incognito → verify → see "session lost" → click "Continue to Login" → login form has green banner → login → subscription page
5. Deployment Plan
5.1 Order of Deployments
Phase 1: Deploy Steps 1-3 (Frontend) — Fixes all 3 failure modes
Phase 2: Deploy Step 4 (SSO Worker) — Enhances UX, optional
5.2 Rollback Plan
- Steps 1-2 (VerifyEmail.tsx, UnifiedLogin.tsx): Safe rollback — remove the success_session_lost state and ?verified=1 handling
- Step 3 (authStore.ts): Safe rollback — remove the early-return guard
- Step 4 (verify-email.ts): Requires testing on staging first. If faulty, rollback to remove session rotation call
5.3 Monitoring
After deployment, verify:
- [VerifyEmail] Session refresh failed log does not increase (indicates Step 1 is working)
- [VerifyEmail] Store not updated with isEmailVerified log appears for genuine edge cases (indicates Step 1 protection is active)
- Login success rate with ?verified=1 param matches expected volume
6. Files Modified Summary
File	Change Type	Lines Changed
skillpassport/src/pages/auth/VerifyEmail.tsx	Edit	~30 lines (state type, refresh handling, new render branch)
skillpassport/src/features/auth/ui/UnifiedLogin.tsx	Edit	~25 lines (banner UI, URL param handling, imports)
skillpassport/src/shared/model/authStore.ts	Edit	~8 lines (early-return guard in cross-tab handler)
sso-worker/src/routes/verify-email.ts	Edit (Optional)	~20 lines (session rotation, imports)
Total: 2 packages, 4 files, ~83 lines changed
7. Decision Log
Decision	Rationale
Use success_session_lost state instead of modifying refreshSession() behavior	Minimal blast radius — only affects VerifyEmail component. Other callers of refreshSession() (login, invitation accept) are unaffected.
Add ?verified=1 param instead of auto-login	Auto-login after verification is less secure — a valid verification link becomes equivalent to a password (as noted by Auth0 and the Next.js auth production guide).
Early-return guard in cross-tab handler instead of locking	Simpler, less invasive. The guard only skips when data is already fresh, preventing stale overwrites without blocking legitimate syncs.
Server-side session rotation as optional	The fix works without it (Steps 1-3 handle all failure modes client-side). Server-side rotation is an optimization, not a requirement.