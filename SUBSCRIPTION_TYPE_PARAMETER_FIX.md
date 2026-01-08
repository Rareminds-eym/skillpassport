# Subscription Type Parameter Fix - Complete

## Issue
When navigating to the upgrade plan page from university admin (and potentially other user types), the URL was showing `type=admin` instead of the correct specific type like `type=university_admin`.

Example:
- **Before**: `http://localhost:3000/subscription/plans?type=admin&mode=upgrade`
- **After**: `http://localhost:3000/subscription/plans?type=university_admin&mode=upgrade`

## Root Cause
The issue was caused by using the `role` from the auth context, which returns a generic `admin` value for all admin types (school_admin, college_admin, university_admin) instead of the specific role type.

## Solution
Changed all subscription navigation logic to use **URL-based path detection** instead of relying on the auth context's `role` field. This is more reliable because:
1. The URL path always reflects the current user context (e.g., `/university-admin/*`)
2. It doesn't depend on auth metadata which can be generic
3. It's consistent across all navigation flows

## Files Modified

### 1. `src/components/Subscription/SubscriptionProtectedRoute.jsx`
**Changes:**
- Added `getUserTypeFromPath()` helper function to extract user type from URL path
- Updated `getSubscriptionFallbackUrl()` to use `getUserTypeFromPath(location.pathname)` instead of `role` from auth

**Impact:**
- When users without subscription try to access protected routes, they're redirected with the correct type parameter

### 2. `src/components/Subscription/SubscriptionRouteGuard.jsx`
**Changes:**
- Added `getUserTypeFromPath()` helper function
- Updated the `manage` case to use `getUserTypeFromPath(location.pathname)` instead of `role` from auth

**Impact:**
- When users navigate to manage subscription without proper access, they're redirected with the correct type parameter

### 3. `src/pages/subscription/MySubscription.jsx`
**Changes:**
- Already had `getUserTypeFromUrl()` helper function (added in previous fix)
- `handleUpgradePlan()` already uses `userType` from URL path
- **NEW**: Fixed "No Active Subscription" case to use `userType` from URL path instead of `role` from auth

**Impact:**
- All navigation in MySubscription now uses correct type parameter

### 4. `src/pages/subscription/AddOns.jsx`
**Changes:**
- Added `getUserTypeFromUrl()` helper function
- Added `userType` computed from URL path
- Updated "View Plans" button to use `userType` from URL path instead of `role` from auth

**Impact:**
- Add-ons page navigation now uses correct type parameter

### 5. `src/pages/subscription/PaymentSuccess.jsx`
**Changes:**
- Updated redirect logic to use `planDetails?.studentType` as first priority, then fall back to `role`
- Added `planDetails` to useEffect dependencies

**Impact:**
- Payment success page uses the correct type from payment flow data

### 6. `src/components/Subscription/SubscriptionDashboard.jsx`
**Changes:**
- Already uses `basePath` to determine user type via `typeMap`
- Upgrade navigation already uses correct type mapping

**Status:**
- ✅ Already correct

### 7. `src/components/Subscription/SubscriptionSettingsSection.jsx`
**Changes:**
- Already uses `basePath` to determine user type via `typeMap`
- Navigation already uses correct type mapping

**Status:**
- ✅ Already correct

### 8. `src/components/Subscription/SubscriptionStatusWidget.jsx`
**Status:**
- ✅ Already uses URL-based path detection

### 9. `src/components/Subscription/SubscriptionGate.jsx`
**Status:**
- ✅ Already uses URL-based path detection

### 10. `src/components/Subscription/SubscriptionBanner.jsx`
**Status:**
- ✅ Already uses URL-based path detection

### 11. `src/pages/subscription/PaymentFailure.jsx`
**Status:**
- ✅ Already uses `planDetails?.studentType` as fallback

## Helper Function Pattern

All files now use this consistent pattern:

```javascript
/**
 * Get the user type for subscription plans based on current URL path
 * This is more reliable than using the role from auth context
 */
function getUserTypeFromPath(pathname) {
  if (pathname.startsWith('/student')) return 'student';
  if (pathname.startsWith('/recruitment')) return 'recruiter';
  if (pathname.startsWith('/educator')) return 'educator';
  if (pathname.startsWith('/college-admin')) return 'college_admin';
  if (pathname.startsWith('/school-admin')) return 'school_admin';
  if (pathname.startsWith('/university-admin')) return 'university_admin';
  if (pathname.startsWith('/admin')) return 'admin';
  return 'student'; // fallback
}
```

## Testing Checklist

Test the following scenarios for **all user types** (student, educator, recruiter, school_admin, college_admin, university_admin):

### ✅ Upgrade Plan Navigation
1. Login as user type
2. Navigate to Settings → Manage Subscription
3. Click "Upgrade Plan" button
4. **Verify**: URL shows correct type parameter (e.g., `type=university_admin` for university admin)

### ✅ Manage Subscription Button
1. From subscription plans page
2. Click "Manage Subscription" button on current plan
3. **Verify**: Navigates to correct manage page (e.g., `/university-admin/subscription/manage`)

### ✅ Protected Route Redirect
1. Logout
2. Try to access protected route (e.g., `/university-admin/dashboard`)
3. **Verify**: Redirects to `/subscription/plans?type=university_admin`

### ✅ No Subscription Redirect
1. Login as user without subscription
2. Try to access protected route
3. **Verify**: Redirects to `/subscription/plans?type={correct_type}`

### ✅ Settings Navigation
1. From any page, navigate to Settings
2. Click "Manage Subscription" in settings
3. **Verify**: Navigates to correct manage page
4. Click "Upgrade Plan"
5. **Verify**: URL shows correct type parameter

## User Types Mapping

| User Context Path | Type Parameter | Manage Path |
|------------------|----------------|-------------|
| `/student/*` | `student` | `/student/subscription/manage` |
| `/educator/*` | `educator` | `/educator/subscription/manage` |
| `/recruitment/*` | `recruiter` | `/recruitment/subscription/manage` |
| `/school-admin/*` | `school_admin` | `/school-admin/subscription/manage` |
| `/college-admin/*` | `college_admin` | `/college-admin/subscription/manage` |
| `/university-admin/*` | `university_admin` | `/university-admin/subscription/manage` |
| `/admin/*` | `admin` | `/admin/subscription/manage` |

## Benefits of This Approach

1. **Reliability**: URL path is always accurate and doesn't depend on auth metadata
2. **Consistency**: Same pattern used across all subscription-related components
3. **Maintainability**: Single source of truth (the URL path) for user context
4. **No Auth Dependency**: Works even if auth context has generic role values
5. **Future-proof**: Easy to add new user types by updating the helper function

## Status
✅ **COMPLETE** - All subscription navigation now uses URL-based type detection
