# Design Document

## Overview

This design addresses a race condition bug in the subscription routing logic where authenticated users with active subscriptions sometimes see the subscription plans page instead of being automatically redirected to the subscription management page. The issue occurs because the React component renders before the subscription data query completes, leading to incorrect page display on initial load that only resolves after a manual refresh when data is cached.

The solution implements proper loading state coordination between authentication and subscription data fetching, along with automatic redirect logic that executes once subscription status is determined. This ensures users always see the correct page based on their subscription status without requiring manual intervention.

## Architecture

### Current Architecture Issues

The current implementation has the following problems:

1. **Incomplete Loading State**: The `SubscriptionPlans` component only waits for `authLoading` to complete before rendering, ignoring `subscriptionLoading` state
2. **No Redirect Logic**: There is no automatic redirect when an authenticated user with active/paused subscription lands on the plans page
3. **Race Condition**: Subscription data fetch is triggered after component mount, but routing decisions are made before data arrives
4. **Cache Dependency**: The bug only manifests on initial load; subsequent visits work because React Query caches the subscription data

### Proposed Architecture

The solution introduces a coordinated loading and redirect system:

```
User Navigation → SubscriptionPlans Component
                        ↓
                  Check Auth State (useAuth)
                        ↓
                  Auth Loading? → Show Loading UI
                        ↓
                  User Authenticated? → Fetch Subscription (useSubscriptionQuery)
                        ↓
                  Subscription Loading? → Show Loading UI
                        ↓
                  Has Active/Paused Subscription? → Redirect to /subscription/manage
                        ↓
                  No Active Subscription → Show Plans Page
```

### Component Flow

1. **Initial Mount**: Component mounts and immediately checks both auth and subscription loading states
2. **Loading Phase**: Display unified loading indicator while either auth or subscription data is loading
3. **Data Ready**: Once both auth and subscription data are available, evaluate redirect conditions
4. **Redirect Execution**: Use React Router's `useNavigate` with `useEffect` to perform redirect when conditions are met
5. **Render Decision**: Only render page content after all loading is complete and redirect logic has executed

## Components and Interfaces

### Modified Components

#### SubscriptionPlans.jsx

**Changes Required:**
- Add combined loading state check for both `authLoading` and `subscriptionLoading`
- Implement `useEffect` hook to handle automatic redirect based on subscription status
- Update loading UI to wait for both auth and subscription data
- Add console logging for debugging routing decisions (development mode only)

**New State Variables:**
```javascript
const shouldRedirect = isAuthenticated && hasActiveOrPausedSubscription;
const isFullyLoaded = !authLoading && !subscriptionLoading;
```

**Redirect Logic:**
```javascript
useEffect(() => {
  if (isFullyLoaded && shouldRedirect) {
    // Log redirect decision
    console.log('[Subscription Routing] Redirecting to manage page', {
      status: subscriptionData?.status,
      hasSubscription: hasActiveOrPausedSubscription
    });
    
    // Perform redirect
    navigate('/subscription/manage', { replace: true });
  }
}, [isFullyLoaded, shouldRedirect, navigate, subscriptionData, hasActiveOrPausedSubscription]);
```

### Hooks Integration

#### useAuth Hook
- Already provides `isAuthenticated`, `user`, `role`, and `loading` (aliased as `authLoading`)
- No changes required

#### useSubscriptionQuery Hook
- Already provides `subscriptionData`, `loading` (aliased as `subscriptionLoading`), and `hasActiveOrPausedSubscription`
- Already implements React Query caching with 2-minute stale time
- No changes required

### React Router Integration

**Navigation Method:**
- Use `navigate('/subscription/manage', { replace: true })` to prevent back button issues
- The `replace: true` option ensures the plans page doesn't appear in browser history when redirected

**URL Parameter Preservation:**
- Preserve query parameters like `?type=student` for analytics tracking
- Extract current query params and append to redirect URL if present

## Data Models

### Subscription Status Model

```typescript
interface SubscriptionData {
  id: string;                    // Subscription ID
  plan: string;                  // Plan identifier (basic, pro, enterprise)
  status: string;                // Subscription status
  startDate: string;             // ISO date string
  endDate: string;               // ISO date string
  features: string[];            // Array of feature descriptions
  autoRenew: boolean;            // Auto-renewal flag
  nextBillingDate: string;       // ISO date string
  paymentStatus: string;         // Payment status
  planName: string;              // Human-readable plan name
  planPrice: number;             // Plan price in currency
  entityType: string | null;     // User entity type
  userTableRole: string | null;  // User role from users table
}
```

### Loading State Model

```typescript
interface LoadingState {
  authLoading: boolean;          // Authentication data loading
  subscriptionLoading: boolean;  // Subscription data loading
  isFullyLoaded: boolean;        // Both auth and subscription loaded
}
```

### Redirect Decision Model

```typescript
interface RedirectDecision {
  shouldRedirect: boolean;       // Whether redirect should occur
  targetUrl: string;             // Destination URL
  reason: string;                // Reason for redirect (for logging)
  preserveParams: boolean;       // Whether to preserve query params
}
```

## Error Handling

### Subscription Fetch Errors

**Scenario**: Subscription data fetch fails due to network error or database issue

**Handling**:
1. Display the plans page (fail-safe behavior)
2. Show error banner at top of page: "Unable to load subscription status. Please refresh the page."
3. Provide retry button that calls `refreshSubscription()` from useSubscriptionQuery
4. Log error details to console in development mode

**Code**:
```javascript
if (subscriptionError && isAuthenticated) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-medium">
            Unable to load subscription status. Please refresh the page.
          </p>
          <button 
            onClick={refreshSubscription}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
        {/* Render plans page content */}
      </div>
    </div>
  );
}
```

### Authentication State Changes

**Scenario**: User logs out or authentication state changes during page view

**Handling**:
1. React Query automatically refetches subscription data when user ID changes
2. Component re-evaluates redirect logic with new auth state
3. If user logs out, subscription data is cleared and plans page displays normally

### Expired Subscription During View

**Scenario**: User's subscription expires while viewing the page

**Handling**:
1. React Query's background refetch will update subscription status
2. Component will re-render with new status
3. No redirect occurs (user stays on current page)
4. Subscription status banner updates to show expired state

### Missing URL Parameters

**Scenario**: User navigates to /subscription/plans without type parameter

**Handling**:
1. Default to 'student' type (existing behavior)
2. Redirect preserves or adds default type parameter
3. No error state needed

## Testing Strategy

### Unit Tests

Unit tests will verify specific behaviors and edge cases:

1. **Loading State Tests**
   - Test that loading indicator shows when authLoading is true
   - Test that loading indicator shows when subscriptionLoading is true
   - Test that content renders only when both are false

2. **Redirect Logic Tests**
   - Test redirect occurs for authenticated user with active subscription
   - Test redirect occurs for authenticated user with paused subscription
   - Test no redirect for authenticated user with expired subscription
   - Test no redirect for authenticated user with cancelled subscription
   - Test no redirect for unauthenticated user

3. **Error Handling Tests**
   - Test error banner displays when subscription fetch fails
   - Test retry button calls refreshSubscription function
   - Test plans page renders despite subscription error

4. **URL Parameter Tests**
   - Test query parameters are preserved during redirect
   - Test default type parameter is used when missing

### Property-Based Tests

Property-based tests will verify universal behaviors across many inputs:

**Testing Framework**: We will use `fast-check` for JavaScript property-based testing, as it integrates well with Jest and provides excellent support for React component testing.

**Configuration**: Each property test will run a minimum of 100 iterations to ensure thorough coverage of the input space.



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties have been identified. These properties will be implemented as property-based tests to verify the system behaves correctly across a wide range of inputs and states.

### Property 1: Active or paused subscriptions trigger redirect

*For any* authenticated user with subscription status of 'active' or 'paused', when the subscription plans page component renders with fully loaded data, the component should trigger a redirect to /subscription/manage.

**Validates: Requirements 1.1, 1.2, 4.1, 4.3**

**Rationale**: This property combines multiple related requirements into a single comprehensive test. Whether a subscription is active or paused, the user should be redirected to the management page since they already have a subscription. This prevents users from seeing irrelevant plan selection options.

### Property 2: Non-active subscriptions do not trigger redirect

*For any* authenticated user with subscription status of 'expired', 'cancelled', 'pending', or null (no subscription), when the subscription plans page component renders with fully loaded data, the component should NOT trigger a redirect and should display the plans page content.

**Validates: Requirements 1.4**

**Rationale**: This is the inverse of Property 1. Users without active or paused subscriptions should be able to view and select plans. This ensures the redirect logic doesn't incorrectly block users who need to purchase or renew subscriptions.

### Property 3: Loading states prevent content rendering

*For any* combination of authentication and subscription loading states where at least one is true, the component should render a loading indicator and should NOT render plan cards or subscription status banners.

**Validates: Requirements 2.1, 2.2, 2.3**

**Rationale**: This property ensures the component doesn't show incorrect or incomplete information while data is being fetched. By testing all combinations of loading states, we verify the component handles the race condition properly.

### Property 4: Loaded state renders content

*For any* component state where both authLoading and subscriptionLoading are false, the component should hide the loading indicator and render either the plans page content or execute redirect logic based on subscription status.

**Validates: Requirements 2.4**

**Rationale**: This property verifies the transition from loading to loaded state works correctly. Once all data is available, the component should make a definitive routing decision and display appropriate content.

### Property 5: Query parameters are preserved during redirect

*For any* set of URL query parameters present when redirect logic executes, the redirect URL should include all original query parameters.

**Validates: Requirements 3.5**

**Rationale**: Query parameters often contain important tracking information for analytics. This property ensures that marketing attribution, A/B test variants, and other tracking data is preserved through the redirect.

### Property 6: Authentication state changes trigger re-evaluation

*For any* component state, when the authentication state changes (user logs in or out), the component should re-evaluate the redirect logic with the new authentication state.

**Validates: Requirements 3.2**

**Rationale**: This property ensures the component reacts correctly to authentication changes. If a user logs in while viewing the plans page and they have an active subscription, the redirect should occur automatically.

### Property 7: Subscription status changes update display

*For any* component state where subscription status changes from one value to another, the component should update the displayed content to reflect the new status without requiring a page refresh.

**Validates: Requirements 3.3**

**Rationale**: This property verifies the component's reactivity to subscription data changes. If subscription data is refetched in the background and the status changes, the UI should update automatically.

### Example Tests

In addition to the property-based tests above, the following example tests will verify specific scenarios:

**Example 1: Unauthenticated user access**
- Given an unauthenticated user
- When they visit /subscription/plans
- Then the plans page should display normally without redirect
- **Validates: Requirements 1.5**

**Example 2: Subscription fetch error handling**
- Given an authenticated user
- When subscription data fetch fails with an error
- Then the component should display an error banner with retry button
- And the plans page content should still be accessible
- **Validates: Requirements 3.1**

**Example 3: Development mode logging on load**
- Given the application is in development mode
- When the subscription plans page loads
- Then console.log should be called with authentication and subscription status
- **Validates: Requirements 5.1**

**Example 4: Redirect logging**
- Given an authenticated user with active subscription
- When redirect logic executes
- Then console.log should be called with redirect reason and target URL
- **Validates: Requirements 5.2**

**Example 5: Error logging**
- Given subscription data fetch fails
- When the error occurs
- Then console.error should be called with error details
- **Validates: Requirements 5.3**

**Example 6: No-redirect logging**
- Given an authenticated user without active subscription
- When the page renders without redirect
- Then console.log should be called with the decision reason
- **Validates: Requirements 5.5**

### Property Test Generators

For property-based testing, we will need the following generators:

**User State Generator**:
```javascript
// Generates random user states with various authentication and subscription combinations
const userStateGen = fc.record({
  isAuthenticated: fc.boolean(),
  user: fc.option(fc.record({
    id: fc.uuid(),
    email: fc.emailAddress(),
    role: fc.constantFrom('student', 'educator', 'admin')
  })),
  subscriptionStatus: fc.option(
    fc.constantFrom('active', 'paused', 'expired', 'cancelled', 'pending')
  ),
  authLoading: fc.boolean(),
  subscriptionLoading: fc.boolean()
});
```

**Query Parameters Generator**:
```javascript
// Generates random URL query parameters
const queryParamsGen = fc.dictionary(
  fc.stringOf(fc.char(), { minLength: 1, maxLength: 20 }),
  fc.stringOf(fc.char(), { minLength: 0, maxLength: 50 })
);
```

**Subscription Data Generator**:
```javascript
// Generates random subscription data objects
const subscriptionDataGen = fc.record({
  id: fc.uuid(),
  plan: fc.constantFrom('basic', 'pro', 'enterprise'),
  status: fc.constantFrom('active', 'paused', 'expired', 'cancelled', 'pending'),
  startDate: fc.date().map(d => d.toISOString()),
  endDate: fc.date().map(d => d.toISOString()),
  features: fc.array(fc.string(), { minLength: 1, maxLength: 10 })
});
```

