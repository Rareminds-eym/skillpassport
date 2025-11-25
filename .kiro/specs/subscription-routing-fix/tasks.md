# Implementation Plan

- [ ] 1. Set up testing infrastructure
  - Install fast-check library for property-based testing
  - Configure Jest to work with fast-check
  - Create test utilities for mocking React Router navigation
  - Create test utilities for mocking useAuth and useSubscriptionQuery hooks
  - _Requirements: All testing requirements_

- [x] 2. Implement combined loading state logic
  - Add `isFullyLoaded` computed state that checks both `authLoading` and `subscriptionLoading`
  - Update loading indicator condition to check `isFullyLoaded` instead of just `authLoading`
  - Ensure loading UI displays while either auth or subscription data is loading
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 2.1 Write property test for loading state behavior
  - **Property 3: Loading states prevent content rendering**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 3. Implement automatic redirect logic
  - Add `shouldRedirect` computed state based on authentication and subscription status
  - Create useEffect hook that triggers redirect when `isFullyLoaded` and `shouldRedirect` are both true
  - Use `navigate('/subscription/manage', { replace: true })` for redirect
  - Add development mode console logging for redirect decisions
  - _Requirements: 1.1, 1.2, 5.2_

- [ ]* 3.1 Write property test for active/paused subscription redirect
  - **Property 1: Active or paused subscriptions trigger redirect**
  - **Validates: Requirements 1.1, 1.2, 4.1, 4.3**

- [ ]* 3.2 Write property test for non-active subscription behavior
  - **Property 2: Non-active subscriptions do not trigger redirect**
  - **Validates: Requirements 1.4**

- [ ]* 3.3 Write example test for unauthenticated user access
  - Verify unauthenticated users can access plans page without redirect
  - **Validates: Requirements 1.5**

- [x] 4. Implement query parameter preservation
  - Extract current URL query parameters using `useLocation` or `useSearchParams`
  - Append query parameters to redirect URL
  - Ensure parameters are properly encoded
  - _Requirements: 3.5_

- [ ]* 4.1 Write property test for query parameter preservation
  - **Property 5: Query parameters are preserved during redirect**
  - **Validates: Requirements 3.5**

- [ ] 5. Implement error handling for subscription fetch failures
  - Add error state check after loading completes
  - Display error banner with retry button when subscription fetch fails
  - Ensure plans page content is still accessible despite error
  - Add console error logging for subscription fetch failures
  - _Requirements: 3.1, 5.3_

- [ ]* 5.1 Write example test for subscription fetch error handling
  - Verify error banner displays with retry button
  - Verify plans page content is accessible
  - **Validates: Requirements 3.1**

- [ ]* 5.2 Write example test for error logging
  - Verify console.error is called with error details
  - **Validates: Requirements 5.3**

- [ ] 6. Implement development mode logging
  - Add console logging for authentication and subscription status on page load
  - Add console logging for redirect decisions with reason and target URL
  - Add console logging for no-redirect decisions with reason
  - Ensure logging only occurs in development mode (check process.env.NODE_ENV)
  - _Requirements: 5.1, 5.2, 5.5_

- [ ]* 6.1 Write example test for development mode logging
  - Verify console.log is called with auth and subscription status
  - **Validates: Requirements 5.1**

- [ ]* 6.2 Write example test for redirect logging
  - Verify console.log is called with redirect reason and URL
  - **Validates: Requirements 5.2**

- [ ]* 6.3 Write example test for no-redirect logging
  - Verify console.log is called with decision reason
  - **Validates: Requirements 5.5**

- [ ] 7. Implement reactivity to state changes
  - Ensure useEffect dependencies include all relevant state variables
  - Verify component re-evaluates redirect logic when auth state changes
  - Verify component updates display when subscription status changes
  - _Requirements: 3.2, 3.3_

- [ ]* 7.1 Write property test for authentication state change reactivity
  - **Property 6: Authentication state changes trigger re-evaluation**
  - **Validates: Requirements 3.2**

- [ ]* 7.2 Write property test for subscription status change reactivity
  - **Property 7: Subscription status changes update display**
  - **Validates: Requirements 3.3**

- [ ] 8. Update loading UI component
  - Ensure loading indicator is visually consistent with existing design
  - Add appropriate loading message text
  - Ensure loading UI is accessible (proper ARIA labels)
  - _Requirements: 2.1_

- [ ]* 8.1 Write property test for loaded state content rendering
  - **Property 4: Loaded state renders content**
  - **Validates: Requirements 2.4**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Manual testing and verification
  - Test with authenticated user with active subscription
  - Test with authenticated user with paused subscription
  - Test with authenticated user with expired subscription
  - Test with authenticated user with no subscription
  - Test with unauthenticated user
  - Test error scenarios (network failures, etc.)
  - Verify no page flicker or content flash during redirect
  - Verify query parameters are preserved
  - Test on different browsers (Chrome, Firefox, Safari)
  - Test on mobile devices
  - _Requirements: All requirements_
