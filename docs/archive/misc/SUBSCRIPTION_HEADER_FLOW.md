# Subscription Page Header Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User visits /subscription/plans           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Is user authenticated? │
              └──────────┬──────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼ NO                            ▼ YES
┌────────────────────┐         ┌────────────────────────┐
│  PUBLIC HEADER     │         │ Check subscription     │
│  - Logo            │         │ status                 │
│  - Signup button   │         └──────────┬─────────────┘
│  - Login button    │                    │
└────────────────────┘         ┌──────────┴──────────┐
                               │                     │
                               ▼ NO ACTIVE           ▼ HAS ACTIVE
                    ┌──────────────────────┐  ┌──────────────────────┐
                    │ PURCHASE HEADER      │  │ ROLE-SPECIFIC HEADER │
                    │ - Logo               │  │ - Full navigation    │
                    │ - User email         │  │ - Role-based menu    │
                    │ - Logout button      │  │ - All features       │
                    └──────────────────────┘  └──────────────────────┘
```

## Header Types

### 1. Public Header (Unauthenticated)
```
┌────────────────────────────────────────────────────────┐
│  [Logo]                    [Signup] [Login]            │
└────────────────────────────────────────────────────────┘
```
**When**: User not logged in
**Purpose**: Encourage signup/login

### 2. Purchase Header (Authenticated, No Subscription)
```
┌────────────────────────────────────────────────────────┐
│  [Logo]                    [user@email.com] [Logout]   │
└────────────────────────────────────────────────────────┘
```
**When**: User logged in but no active subscription
**Purpose**: Clean, focused purchase experience

### 3. Role-Specific Header (Authenticated, Has Subscription)
```
┌────────────────────────────────────────────────────────┐
│  [Logo] [Dashboard] [Courses] [Profile] ... [Settings] │
└────────────────────────────────────────────────────────┘
```
**When**: User logged in with active/paused subscription
**Purpose**: Full navigation to all features

## Code Logic

```javascript
// In PublicLayout.jsx
const renderHeader = () => {
  if (isAuthenticated && isSubscriptionPage) {
    // Check subscription status
    if (!hasActiveSubscription) {
      // Show simplified purchase header
      return <SubscriptionPurchaseHeader 
        userEmail={user?.email} 
        hasBanner={hasAnyBanner} 
      />;
    }
    
    // Show role-specific header
    if (userRole === 'student') return <StudentHeader />;
    if (userRole === 'educator') return <EducatorHeader />;
    if (userRole === 'admin') return <AdminHeader />;
    if (userRole === 'recruiter') return <RecruiterHeader />;
  }
  
  // Default: public header
  return <Header hasBanner={hasAnyBanner} />;
};
```

## Subscription Status Check

```javascript
const hasActiveSubscription = subscriptionData && isActiveOrPaused(subscriptionData.status);
```

**Active Subscription** includes:
- `status: 'active'` - Currently active
- `status: 'paused'` - Paused but still has access

**No Active Subscription** includes:
- `status: 'expired'` - Subscription ended
- `status: 'cancelled'` - User cancelled
- `status: null` - Never had subscription
- No subscription data

## User Experience

### Scenario 1: New User
1. Visits `/subscription/plans` → Sees **Public Header**
2. Clicks "Login" → Logs in
3. Redirected back → Sees **Purchase Header** (email + logout)
4. Purchases subscription → Redirected to dashboard
5. Returns to plans page → Sees **Role-Specific Header**

### Scenario 2: Expired Subscription
1. User with expired subscription visits plans page
2. Sees **Purchase Header** (email + logout)
3. Can focus on renewing without distractions
4. After renewal → Sees **Role-Specific Header**

### Scenario 3: Active Subscriber
1. User with active subscription visits plans page
2. Sees **Role-Specific Header** (full navigation)
3. Can easily navigate back to dashboard
4. Can view upgrade options while maintaining context

## Benefits

✅ **Clear visual hierarchy** - Different headers for different states
✅ **Reduced cognitive load** - Purchase header removes distractions
✅ **Consistent experience** - Active users see familiar navigation
✅ **Easy logout** - Users can switch accounts during purchase
✅ **Professional appearance** - Clean, focused design
✅ **Better conversion** - Fewer distractions during purchase flow
