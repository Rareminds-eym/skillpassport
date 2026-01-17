# Subscription Plans Page - Role-Based Navbar Implementation

## Summary
Updated the PublicLayout to conditionally render different headers based on authentication status and subscription status:
1. **Unauthenticated users**: Public header with signup/login
2. **Authenticated without active subscription**: Simplified header with logo, email, and logout
3. **Authenticated with active subscription**: Role-specific header (Student/Educator/Admin/Recruiter)

## Changes Made

### 1. Created SubscriptionPurchaseHeader Component
New file: `src/components/Subscription/SubscriptionPurchaseHeader.jsx`
- Simplified header for users in the subscription purchase flow
- Shows only:
  - Logo (left side, clickable to home)
  - User email badge
  - Logout button
- Clean, minimal design to keep focus on subscription purchase
- Responsive: email shown below header on mobile

### 2. Updated PublicLayout.jsx
Modified `src/layouts/PublicLayout.jsx` to:
- Import `useSubscriptionQuery` hook to check subscription status
- Import `isActiveOrPaused` utility to validate subscription
- Import `SubscriptionPurchaseHeader` component
- Added subscription status check in `renderHeader()` function
- Three-tier header rendering logic:
  1. **No active subscription** → `SubscriptionPurchaseHeader` (simplified)
  2. **Active subscription** → Role-specific header (full navigation)
  3. **Not authenticated** → Public header (signup/login)

### 3. Header Rendering Logic
The `renderHeader()` function now checks:
```jsx
if (isAuthenticated && isSubscriptionPage) {
  if (!hasActiveSubscription) {
    // Show simplified purchase header
    return <SubscriptionPurchaseHeader />;
  }
  
  if (userRole) {
    // Show role-specific header based on role
  }
}

// Default: show public header
return <Header />;
```

## Behavior

### For Authenticated Users WITHOUT Active Subscription
- **Simplified header** with:
  - Logo (left)
  - User email
  - Logout button
- No navigation menu items
- Clean focus on subscription purchase
- Prevents confusion during purchase flow

### For Authenticated Users WITH Active Subscription
- **Full role-specific header** (same as their dashboard)
- Complete navigation menu
- Easy access to all portal features

### For Unauthenticated Users
- **Public header** with signup/login buttons
- Standard marketing header

## Technical Details

### SubscriptionPurchaseHeader Component
```jsx
<SubscriptionPurchaseHeader 
  userEmail={user?.email} 
  hasBanner={hasAnyBanner} 
/>
```

Features:
- Logout functionality with toast notifications
- Responsive design (email badge moves below on mobile)
- Consistent styling with other headers
- Sticky positioning with banner support

### Subscription Status Check
```jsx
const hasActiveSubscription = subscriptionData && isActiveOrPaused(subscriptionData.status);
```

Checks for:
- `active` status
- `paused` status (still has access)
- Valid subscription data

## Files Modified
- `src/layouts/PublicLayout.jsx` - Added subscription-aware header rendering
- `src/components/Subscription/SubscriptionPurchaseHeader.jsx` - New simplified header component

## Files Created
- `src/components/Subscription/SubscriptionPurchaseHeader.jsx`

## Testing Recommendations
1. **Unauthenticated user** → should see public header with signup/login
2. **Authenticated without subscription** → should see simplified header (logo, email, logout only)
3. **Authenticated with active subscription** → should see full role-specific header
4. **Authenticated with paused subscription** → should see full role-specific header
5. **Authenticated with expired subscription** → should see simplified header
6. **Logout button** → should logout and redirect to login page
7. **Logo click** → should navigate to home page
8. **Mobile responsiveness** → email should display properly on small screens

## Benefits
- **Cleaner purchase flow**: Users without subscription see minimal distractions
- **Consistent experience**: Users with subscription see familiar navigation
- **Better UX**: Clear visual distinction between purchase mode and normal mode
- **Reduced confusion**: No navigation items that require subscription to access
- **Easy logout**: Users can easily logout if they want to switch accounts
- **Professional appearance**: Clean, focused design during purchase process
