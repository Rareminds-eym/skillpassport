# Payment Verification 401 Error Fix

## Problem Analysis

The payment verification was failing with a 401 Unauthorized error and causing an infinite loop of verification attempts.

### Root Causes Identified

1. **401 Unauthorized Error**: 
   - The Edge Function `/verify-payment` requires a valid user JWT token for authentication
   - The client was attempting to use the anon key as a fallback when no session existed
   - The Edge Function's `supabase.auth.getUser()` call fails with anon key because it's not a user JWT
   - This caused the 401 error

2. **Infinite Loop**:
   - The `usePaymentVerification` hook had `verify` function in the useEffect dependency array
   - The `verify` function depended on `status` state
   - When verification ran, it changed `status`, which recreated `verify`, triggering useEffect again
   - Added `status === 'idle'` check to prevent re-running after initial verification

## Solution Implemented

### 1. Payment Verification Service (`src/services/Subscriptions/paymentVerificationService.js`)

**Changed**: Removed anon key fallback and added proper session validation

```javascript
// Before (INCORRECT):
const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

// After (CORRECT):
if (!session?.access_token) {
  return {
    success: false,
    verified: false,
    error: 'Authentication required. Please log in to verify payment.',
    errorCode: 'NO_SESSION'
  };
}
const token = session.access_token;
```

**Why**: The Edge Function requires user authentication to verify the order belongs to the requesting user. Using anon key would bypass this security check.

### 2. Payment Verification Hook (`src/hooks/Subscription/usePaymentVerification.js`)

**Changed**: Added session retry mechanism for post-redirect scenarios

```javascript
/**
 * Wait for session to be available with retry logic
 * This handles the case where user is redirected from Razorpay
 * and the session needs time to be restored from localStorage
 */
const waitForSession = async (maxRetries = 3, delayMs = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return session;
    }
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return null;
};
```

**Why**: After Razorpay redirects back to the app, the Supabase session needs a moment to be restored from localStorage. The retry mechanism (3 attempts with 1-second delays) gives the session time to load.

**Changed**: Added status check to prevent infinite loop

```javascript
// Before:
if (autoVerify && paymentId && orderId && signature && !hasVerified.current) {

// After:
if (autoVerify && paymentId && orderId && signature && !hasVerified.current && status === 'idle') {
```

### 3. Payment Success Page (`src/pages/subscription/PaymentSuccess.jsx`)

**Added**: Delayed redirect to login if no session detected (gives time for session to load)

```javascript
useEffect(() => {
  if (verificationError?.code === 'NO_SESSION') {
    // Give a moment for auth to load before redirecting
    const timer = setTimeout(() => {
      if (!user) {
        const currentUrl = window.location.href;
        navigate(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`, { replace: true });
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }
}, [verificationError, user, navigate]);
```

**Why**: Adds a 2-second grace period before redirecting to login, allowing the session restoration to complete.

## Security Considerations

### Why Not Use Anon Key?

The Edge Function (`supabase/functions/verify-payment/index.ts`) performs critical security checks:

1. **User Authentication** (line 86-92): Verifies the request comes from an authenticated user
2. **Order Ownership** (line 157): Ensures the order belongs to the authenticated user
3. **Payment Signature** (line 165-180): Verifies the Razorpay signature is valid
4. **Amount Verification** (line 223-237): Ensures payment amount matches order amount
5. **Idempotency** (line 119-135): Prevents duplicate payment processing

Using the anon key would bypass user authentication, allowing anyone to verify any payment, which is a security vulnerability.

## Expected Behavior After Fix

1. **User is authenticated (normal flow)**: 
   - Payment verification proceeds immediately
   - No delays or retries needed

2. **User session is loading (post-redirect scenario)**:
   - Verification waits up to 3 seconds for session to be restored
   - Shows "Verifying your payment..." loading state
   - Once session is available, verification proceeds
   - This handles the Razorpay redirect case gracefully

3. **User is not authenticated (error case)**: 
   - After 3 retry attempts, verification returns `NO_SESSION` error
   - System waits 2 more seconds for auth to load
   - If still no user, redirects to login page with return URL
   - After login, user returns to payment success page
   - Verification proceeds with valid session

4. **No infinite loop**: Verification only runs once on page load when status is 'idle'

## Payment Flow Timeline

```
User completes payment on Razorpay
    ↓
Razorpay redirects to /payment/success?payment_id=xxx&...
    ↓
PaymentSuccess page loads
    ↓
usePaymentVerification hook initializes
    ↓
Attempts to get session (Retry 1) → Wait 1s
    ↓
Attempts to get session (Retry 2) → Wait 1s  
    ↓
Attempts to get session (Retry 3) → Session found! ✅
    ↓
Calls Edge Function with valid JWT token
    ↓
Edge Function verifies payment
    ↓
Subscription activated
```

## Testing Checklist

### Automated Test
Run the session test script:
```bash
node test-payment-verification-session.js
```

### Manual Testing

- [ ] **Happy Path**: Complete payment flow from signup → payment → success
  - User should see "Verifying your payment..." for 1-3 seconds
  - Verification should succeed without errors
  - No 401 errors in console
  - Subscription activated successfully

- [ ] **Post-Redirect Scenario**: Refresh payment success page after payment
  - Session should be restored within 3 seconds
  - Verification should proceed automatically
  - No infinite loop of requests

- [ ] **No Session**: Open payment success URL in incognito/logged out
  - Should show "Verifying..." for ~5 seconds
  - Should redirect to login with return URL
  - After login, should return and complete verification

- [ ] **Console Logs**: Check browser console for:
  - ✅ "Session found on attempt X" messages
  - ✅ "Verification completed in Xms" messages
  - ❌ No 401 Unauthorized errors
  - ❌ No infinite loop of requests

## Files Modified

1. `src/services/Subscriptions/paymentVerificationService.js`
2. `src/hooks/Subscription/usePaymentVerification.js`
3. `src/pages/subscription/PaymentSuccess.jsx`

## Edge Function Configuration

The Edge Function requires these environment variables:
- `RAZORPAY_KEY_SECRET` or `TEST_RAZORPAY_KEY_SECRET`
- `RAZORPAY_KEY_ID` or `TEST_RAZORPAY_KEY_ID`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Ensure these are properly configured in your Supabase project settings.
