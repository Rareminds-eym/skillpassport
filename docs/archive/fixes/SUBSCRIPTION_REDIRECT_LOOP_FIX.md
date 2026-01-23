# Subscription Redirect Loop Fix - Industrial Grade Implementation

## Problem Description

### Issue 1: Signup → Subscription Plans Loop
After completing signup, users are redirected to the subscription plans page. However, when they click the "Get Started" button on any plan, they are redirected back to the signup page instead of proceeding to the payment page, creating an infinite loop.

### Issue 2: Payment Success → Dashboard Loop
After successful payment, clicking "Go to Dashboard" redirects users back to the subscription plans page instead of the dashboard.

## Root Cause Analysis

### Issue 1: No Session After Signup
After signup via the worker API, the user account is created but **NO Supabase session is established**:
1. User completes signup → Account created ✅
2. User redirected to subscription plans ✅
3. User clicks "Get Started" → `isAuthenticated` is `false` ❌
4. User redirected back to signup (loop!) ❌

### Issue 2: Cache Not Synchronized
After payment verification, subscription caches are invalidated but not yet refetched:
1. User completes payment → Subscription created ✅
2. `refreshAccess()` called to invalidate cache ✅
3. User clicks "Go to Dashboard" immediately ❌
4. Cache hasn't finished refetching → `hasAccess: false` ❌
5. User redirected to subscription plans (loop!) ❌

## Industrial-Grade Solution

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PaymentSuccess Component                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ useCacheRefresh │  │useNavigationState│  │ State Machine   │ │
│  │                 │  │                 │  │                 │ │
│  │ - Retry logic   │  │ - IDLE          │  │ - PENDING       │ │
│  │ - Exp backoff   │  │ - REFRESHING    │  │ - ACTIVATING    │ │
│  │ - Timeout       │  │ - NAVIGATING    │  │ - ACTIVATED     │ │
│  │ - Error recovery│  │ - ERROR         │  │ - ERROR         │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              SubscriptionProtectedRoute Component                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │usePostPaymentSync│  │  useGuardState  │  │  State Machine  │ │
│  │                 │  │                 │  │                 │ │
│  │ - Detect post-  │  │ - INITIALIZING  │  │ - Predictable   │ │
│  │   payment nav   │  │ - CHECKING_AUTH │  │   transitions   │ │
│  │ - Retry refresh │  │ - CHECKING_ROLE │  │ - Debug logging │ │
│  │ - Safety timeout│  │ - CHECKING_SUB  │  │ - Error states  │ │
│  │ - Error recovery│  │ - POST_PAYMENT  │  │                 │ │
│  └─────────────────┘  │ - ACCESS_GRANTED│  └─────────────────┘ │
│                       │ - ACCESS_DENIED │                       │
│                       │ - ERROR         │                       │
│                       └─────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

#### 1. State Machines
Both components use explicit state machines for predictable behavior:

```javascript
// PaymentSuccess Navigation States
const NAV_STATES = {
  IDLE: 'idle',
  REFRESHING_CACHE: 'refreshing_cache',
  NAVIGATING: 'navigating',
  ERROR: 'error',
};

// SubscriptionProtectedRoute Guard States
const GUARD_STATES = {
  INITIALIZING: 'initializing',
  CHECKING_AUTH: 'checking_auth',
  CHECKING_ROLE: 'checking_role',
  CHECKING_SUBSCRIPTION: 'checking_subscription',
  POST_PAYMENT_SYNC: 'post_payment_sync',
  ACCESS_GRANTED: 'access_granted',
  ACCESS_DENIED: 'access_denied',
  ERROR: 'error',
};
```

#### 2. Retry Logic with Exponential Backoff
```javascript
async function retryWithBackoff(fn, maxRetries, baseDelayMs, onRetry) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        onRetry?.(attempt + 1, delay, error);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}
```

#### 3. Configuration Constants
```javascript
const CONFIG = {
  // PaymentSuccess
  CACHE_REFRESH_MAX_RETRIES: 3,
  CACHE_REFRESH_RETRY_DELAY_MS: 500,
  CACHE_REFRESH_TIMEOUT_MS: 10000,
  NAVIGATION_DELAY_MS: 100,
  
  // SubscriptionProtectedRoute
  POST_PAYMENT_MAX_RETRIES: 3,
  POST_PAYMENT_RETRY_DELAY_MS: 1000,
  POST_PAYMENT_TIMEOUT_MS: 10000,
  SUBSCRIPTION_CHECK_TIMEOUT_MS: 15000,
};
```

#### 4. Debug Logging
Enable debug logging by setting:
- `localStorage.setItem('DEBUG_PAYMENT', 'true')` for PaymentSuccess
- `localStorage.setItem('DEBUG_SUBSCRIPTION', 'true')` for SubscriptionProtectedRoute

Or automatically enabled in development mode.

#### 5. Memory Leak Prevention
```javascript
// Cleanup refs
const mountedRef = useRef(true);
const timeoutRef = useRef(null);

useEffect(() => {
  mountedRef.current = true;
  return () => {
    mountedRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
}, []);

// Safe state updates
if (mountedRef.current) {
  setState(newState);
}
```

#### 6. Graceful Degradation
- If cache refresh fails, navigation still proceeds (subscription is already created)
- If post-payment sync fails, access check continues with current state
- Error states allow access with warning banner rather than blocking

### Flow Diagrams

#### Payment Success → Dashboard Flow
```
User clicks "Go to Dashboard"
         │
         ▼
┌─────────────────────┐
│ NAV_STATE: IDLE     │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Check if cache      │
│ already refreshed   │
└─────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  Yes        No
    │         │
    │         ▼
    │  ┌─────────────────────┐
    │  │ NAV_STATE:          │
    │  │ REFRESHING_CACHE    │
    │  └─────────────────────┘
    │         │
    │         ▼
    │  ┌─────────────────────┐
    │  │ Retry with backoff  │
    │  │ (max 3 attempts)    │
    │  └─────────────────────┘
    │         │
    │    ┌────┴────┐
    │    │         │
    │    ▼         ▼
    │  Success   Failure
    │    │         │
    │    │         ▼
    │    │  ┌─────────────────────┐
    │    │  │ NAV_STATE: ERROR    │
    │    │  │ Show toast, but     │
    │    │  │ still navigate      │
    │    │  └─────────────────────┘
    │    │         │
    └────┴─────────┘
              │
              ▼
┌─────────────────────┐
│ NAV_STATE:          │
│ NAVIGATING          │
└─────────────────────┘
              │
              ▼
┌─────────────────────┐
│ navigate(dashboard, │
│ { fromPayment: true}│
└─────────────────────┘
```

#### SubscriptionProtectedRoute Flow
```
Route accessed with { fromPayment: true }
              │
              ▼
┌─────────────────────────────┐
│ GUARD_STATE: INITIALIZING   │
└─────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│ GUARD_STATE: CHECKING_AUTH  │
│ (wait for auth loading)     │
└─────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│ Auth check passed?          │
└─────────────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
   Yes        No → ACCESS_DENIED → Redirect to login
    │
    ▼
┌─────────────────────────────┐
│ GUARD_STATE: CHECKING_ROLE  │
└─────────────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  Pass      Fail → ACCESS_DENIED → Redirect to plans
    │
    ▼
┌─────────────────────────────┐
│ Subscription required?      │
└─────────────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
   Yes        No → ACCESS_GRANTED → Render children
    │
    ▼
┌─────────────────────────────┐
│ Is post-payment navigation? │
└─────────────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
   Yes        No
    │         │
    ▼         │
┌─────────────────────────────┐
│ GUARD_STATE: POST_PAYMENT_SYNC│
│                             │
│ usePostPaymentSync hook:    │
│ - Trigger refreshAccess()   │
│ - Retry with backoff        │
│ - Safety timeout (10s)      │
└─────────────────────────────┘
    │         │
    ▼         │
┌─────────────────────────────┐
│ Sync complete or timeout    │
└─────────────────────────────┘
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────────────────┐
│ GUARD_STATE:                │
│ CHECKING_SUBSCRIPTION       │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ hasAccess === true?         │
└─────────────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
   Yes        No
    │         │
    ▼         ▼
ACCESS_GRANTED  ACCESS_DENIED
    │              │
    ▼              ▼
Render children  Redirect to plans
```

### Files Modified

#### PaymentSuccess.jsx
- Complete rewrite with industrial-grade patterns
- Custom hooks: `useCacheRefresh`, `useNavigationState`
- State machine for navigation flow
- Retry logic with exponential backoff
- Proper cleanup and memory leak prevention
- Debug logging support
- Graceful error handling

#### SubscriptionProtectedRoute.jsx
- Complete rewrite with industrial-grade patterns
- Custom hooks: `usePostPaymentSync`, `useGuardState`
- State machine for guard flow
- Post-payment detection and synchronization
- Retry logic with exponential backoff
- Safety timeouts to prevent infinite loading
- Debug logging support
- Graceful error handling

### Testing

#### Enable Debug Mode
```javascript
// In browser console
localStorage.setItem('DEBUG_PAYMENT', 'true');
localStorage.setItem('DEBUG_SUBSCRIPTION', 'true');
```

#### Test Scenarios

1. **Happy Path**
   - Complete payment
   - Click "Go to Dashboard"
   - Should see "Preparing..." then "Redirecting..."
   - Should land on dashboard

2. **Slow Network**
   - Complete payment
   - Click "Go to Dashboard" immediately
   - Should see retry attempts in console
   - Should eventually navigate

3. **Cache Refresh Failure**
   - Complete payment
   - Simulate network failure
   - Should show error toast but still navigate
   - Dashboard should trigger its own refresh

4. **Direct URL Access After Payment**
   - Complete payment
   - Manually navigate to dashboard URL
   - SubscriptionProtectedRoute should detect post-payment state
   - Should show loader while syncing
   - Should grant access after sync

### Console Messages

#### Success Flow
```
[PaymentSuccess] Starting cache refresh
[PaymentSuccess] Cache refresh successful
[PaymentSuccess] Starting navigation to dashboard
[PaymentSuccess] Navigating to: /student/dashboard
[SubscriptionGuard] State: post_payment_sync { from: checking_subscription, hasAccess: false }
[SubscriptionGuard] Post-payment sync started
[SubscriptionGuard] Post-payment sync completed successfully
[SubscriptionGuard] State: access_granted { from: post_payment_sync, hasAccess: true }
[SubscriptionGuard] Access granted
```

#### Retry Flow
```
[PaymentSuccess] Starting cache refresh
[PaymentSuccess] Cache refresh retry 1/3 after 500ms
[PaymentSuccess] Cache refresh retry 2/3 after 1000ms
[PaymentSuccess] Cache refresh successful
```

#### Error Recovery Flow
```
[PaymentSuccess] Starting cache refresh
[PaymentSuccess] Cache refresh retry 1/3 after 500ms
[PaymentSuccess] Cache refresh retry 2/3 after 1000ms
[PaymentSuccess] Cache refresh retry 3/3 after 2000ms
[PaymentSuccess] Cache refresh failed
[PaymentSuccess] Navigation error: Error: Cache refresh failed
// Toast: "Cache refresh failed, but your subscription is active."
// Still navigates to dashboard
```


---

## Task 5: Fix Organization Setup Page Redirect Loop

### Problem
After signup, `school_admin` users were getting stuck in a redirect loop:
1. User signs up as `school_admin`
2. Redirected to `/subscription/plans?type=school_admin`
3. `SubscriptionPlans.jsx` tries to redirect to manage page
4. `managePath` calculated incorrectly as `/student/subscription/manage`
5. `/student/*` route rejects `school_admin` role
6. Redirected back to `/subscription/plans?type=student`
7. Loop continues infinitely

### Root Cause
The `getManagePath` and `getManagePathFromType` functions in `SubscriptionPlans.jsx` were returning `/student/subscription/manage` as a default when:
- `type` URL parameter was missing or unknown
- `userRole` from `useAuth()` was `null` or not in the mapping
- Auth was still loading

### Solution Applied

#### 1. Changed default return values to `null`
```javascript
// Before
function getManagePath(userRole) {
  const manageRoutes = { ... };
  return manageRoutes[userRole] || '/student/subscription/manage'; // ❌ Wrong default
}

// After
function getManagePath(userRole) {
  if (!userRole) return null; // ✅ Return null to prevent wrong redirect
  const manageRoutes = { ... };
  return manageRoutes[userRole] || null; // ✅ Return null for unknown roles
}
```

#### 2. Updated `managePath` calculation
```javascript
const managePath = useMemo(() => {
  if (type) {
    return getManagePathFromType(type);
  }
  if (userRole) {
    return getManagePath(userRole);
  }
  // SAFETY: Return null to prevent redirect when type/role unknown
  return null;
}, [type, userRole]);
```

#### 3. Added safety check to redirect condition
```javascript
const shouldRedirect = useMemo(
  () => isAuthenticated && hasActiveOrPausedSubscription && 
        !isUpgradeMode && !isOrganizationMode && 
        managePath !== null, // ✅ Only redirect if we have a valid path
  [isAuthenticated, hasActiveOrPausedSubscription, isUpgradeMode, isOrganizationMode, managePath]
);
```

#### 4. Added safety check to redirect effect
```javascript
useEffect(() => {
  if (isFullyLoaded && shouldRedirect && managePath) { // ✅ Check managePath is truthy
    navigate(`${managePath}${location.search}`, { replace: true });
  }
}, [isFullyLoaded, shouldRedirect, navigate, location.search, managePath]);
```

#### 5. Fixed `handlePlanSelection` to handle null `managePath`
```javascript
if (subscriptionData && subscriptionData.plan === plan.id) {
  // Use managePath if available, otherwise construct fallback
  const targetPath = managePath || getManagePathFromType(type) || 
                     getManagePath(userRole) || `/subscription/plans?type=${studentType}`;
  navigate(targetPath);
  return;
}
```

#### 6. Added comprehensive debug logging
```javascript
const DEBUG = import.meta.env.DEV || localStorage.getItem('DEBUG_SUBSCRIPTION') === 'true';
useEffect(() => {
  if (DEBUG) {
    console.log('[SubscriptionPlans] State:', {
      type,
      pathType,
      searchParamType: searchParams.get('type'),
      userRole,
      isAuthenticated,
      authLoading,
      pathname: location.pathname,
      search: location.search,
    });
  }
}, [type, pathType, searchParams, userRole, isAuthenticated, authLoading, location.pathname, location.search, DEBUG]);
```

### Files Modified
- `src/pages/subscription/SubscriptionPlans.jsx` - Main fix applied

### Testing
1. Enable debug logging: `localStorage.setItem('DEBUG_SUBSCRIPTION', 'true')`
2. Sign up as `school_admin`
3. Verify redirect to `/subscription/plans?type=school_admin`
4. Verify no redirect loop occurs
5. Complete payment
6. Verify redirect to `/school-admin/dashboard`


---

## Complete Fix Summary (All Files)

### Files Fixed

1. **`src/pages/subscription/SubscriptionPlans.jsx`**
   - Changed `getManagePath()` to return `null` for unknown roles
   - Changed `getManagePathFromType()` to return `null` for unknown types
   - Added `managePath !== null` check to `shouldRedirect`
   - Added safety check in redirect effect
   - Fixed `handlePlanSelection` to handle null `managePath`
   - Added debug logging

2. **`src/pages/subscription/PaymentCompletion.jsx`**
   - Changed `getManagePath()` to return `null` for unknown roles
   - Added `managePath` check before redirecting
   - Added `managePath` to useEffect dependency array

3. **`src/pages/subscription/PaymentSuccess.jsx`**
   - Updated `managePath` calculation to return `null` for non-student unknown roles
   - Added safety check on "Manage" button (disabled when `managePath` is null)

4. **`src/components/Subscription/SubscriptionRouteGuard.jsx`**
   - Changed `getManagePath()` to return `null` for unknown roles
   - Added `managePath` check in payment mode redirect
   - Added `managePath` to useEffect dependency array

### Files Verified (No Changes Needed)

- `src/components/Subscription/SubscriptionProtectedRoute.jsx` - Uses URL-based `subscriptionFallbackPath` prop
- `src/pages/subscription/AddOns.jsx` - Uses URL-based `basePath`
- `src/components/Subscription/SubscriptionStatusWidget.jsx` - Uses URL-based `basePath`
- `src/components/Subscription/SubscriptionSettingsSection.jsx` - Uses URL-based `basePath`
- `src/services/Subscriptions/razorpayService.js` - Uses URL-based path detection
- `src/components/ProtectedRoute.jsx` - Redirects to `/` not subscription plans
- `src/routes/AppRoutes.jsx` - Has correct `subscriptionFallbackPath` props

### Key Principle

The fix ensures that when `type` URL parameter is missing AND `userRole` is unknown/null:
- Functions return `null` instead of defaulting to `/student/subscription/manage`
- Redirect logic checks for `null` and skips redirect if path is unknown
- This prevents the redirect loop where non-student users get sent to student routes

### Debug Mode

Enable debug logging to troubleshoot:
```javascript
localStorage.setItem('DEBUG_SUBSCRIPTION', 'true');
localStorage.setItem('DEBUG_PAYMENT', 'true');
```
