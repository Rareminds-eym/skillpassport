# Implementation Tasks: Freemium Tier Implementation

## Phase 1: Database Setup

- [x] 1. Create Freemium Plan Database Entry
  - [x] 1.1 Create Supabase migration file for Freemium plan
  - [x] 1.2 Insert pay_as_you_go plan with price 0.00 and lifetime duration
  - [x] 1.3 Configure free features array (dashboard_access, profile_creation, marketplace_access, view_pricing, opportunities_access, courses_listing_access)
  - [x] 1.4 Set business_type to 'b2c', entity_type to 'all', role_type to 'all'
  - [x] 1.5 Verify plan exists in database with correct configuration

- [x] 2. Create Database Indexes
  - [x] 2.1 Create index on subscription_plans(plan_code) where is_active = true
  - [x] 2.2 Create index on subscription_plans(business_type, entity_type, role_type) where is_active = true
  - [x] 2.3 Create index on subscriptions(user_id) where status = 'active'
  - [x] 2.4 Create index on subscriptions(plan_id)
  - [x] 2.5 Create index on subscriptions(status, start_date, end_date)

## Phase 2: Backend Configuration

- [x] 3. Update Plan Configuration Constants
  - [x] 3.1 Add PAY_AS_YOU_GO constant to PLAN_IDS in src/shared/config/subscriptionPlans.js
  - [x] 3.2 Add 'pay_as_you_go' as first element in PLAN_HIERARCHY array
  - [x] 3.3 Create PAY_AS_YOU_GO_FEATURES configuration object with free features set to true
  - [x] 3.4 Set all locked features to false in PAY_AS_YOU_GO_FEATURES

- [x] 4. Implement Feature Gating Logic
  - [x] 4.1 Update checkFeatureAccess function in src/features/subscription/lib/featureGating.ts
  - [x] 4.2 Add checkFreemiumAccess helper function
  - [x] 4.3 Implement feature access check using PAY_AS_YOU_GO_FEATURES configuration
  - [x] 4.4 Return hasAccess: true for free features, false with upgradeRequired for locked features
  - [x] 4.5 Include availableInPlans array in denial responses

- [x] 5. Create Freemium Subscription API Endpoint
  - [x] 5.1 Create functions/api/subscription/create-freemium.ts Cloudflare Worker
  - [x] 5.2 Implement request validation (userId, email)
  - [x] 5.3 Query pay_as_you_go plan from subscription_plans table
  - [x] 5.4 Create subscription record with status 'active', start_date now, end_date null
  - [x] 5.5 Return subscription details with 200 status on success
  - [x] 5.6 Implement error handling with appropriate status codes (400, 404, 500)

## Phase 3: Frontend - Subscription Plans Page

- [x] 6. Update SubscriptionPlans Component
  - [x] 6.1 Update src/features/subscription/ui/individual/SubscriptionPlans.jsx
  - [x] 6.2 Add Freemium plan to plans array (fetch from DB or add fallback)
  - [x] 6.3 Create Freemium plan card with ₹0 price, "Start free, upgrade anytime" tagline
  - [x] 6.4 Display free features list in Freemium card
  - [x] 6.5 Add "Start Free" button to Freemium card
  - [x] 6.6 Position Freemium card as first option before paid plans

- [x] 7. Implement Payment Bypass Logic
  - [x] 7.1 Update handleSelectPlan function in SubscriptionPlans.jsx
  - [x] 7.2 Check if plan_code equals 'pay_as_you_go' or isFree is true
  - [x] 7.3 Call /api/subscription/create-freemium endpoint for Freemium plans
  - [x] 7.4 Redirect to dashboard on successful Freemium subscription creation
  - [x] 7.5 Maintain existing Razorpay flow for paid plans
  - [x] 7.6 Display error toast on Freemium subscription creation failure

- [x] 8. Add Current Plan Highlighting
  - [x] 8.1 Highlight user's current plan card with "Current Plan" badge
  - [x] 8.2 Disable button for current plan
  - [x] 8.3 Show "Upgrade" button text for Freemium users viewing paid plans
  - [x] 8.4 Show "Select Plan" button text for non-current plans

## Phase 4: Frontend - Dashboard

- [ ] 9. Create Dashboard Freemium Banner
  - [x] 9.1 Update src/features/dashboard/ui/Dashboard.jsx
  - [x] 9.2 Query user subscription data using useSubscriptionQuery hook
  - [x] 9.3 Check if planCode equals 'pay_as_you_go'
  - [x] 9.4 Display banner with "You're on Freemium" and "Upgrade to unlock all features" text
  - [x] 9.5 Add "View Plans" button that navigates to subscription plans page
  - [x] 9.6 Hide banner for users with paid subscriptions
  - [x] 9.7 Style banner with gradient background and prominent positioning

## Phase 5: Frontend - Feature Lock Components

- [-] 10. Create FeatureLockOverlay Component
  - [x] 10.1 Create src/features/subscription/ui/shared/FeatureLockOverlay.tsx
  - [x] 10.2 Accept feature, featureName, and children props
  - [x] 10.3 Call checkFeatureAccess to determine access
  - [x] 10.4 Render children if hasAccess is true
  - [x] 10.5 Render blurred content with lock overlay if hasAccess is false
  - [x] 10.6 Display lock icon, feature name, and upgrade message in overlay
  - [x] 10.7 Show availableInPlans information
  - [x] 10.8 Add "View All Plans" and "Go Back" buttons

- [x] 11. Create UpgradePrompt Component
  - [x] 11.1 Create src/features/subscription/ui/shared/UpgradePrompt.tsx
  - [x] 11.2 Accept featureName, availablePlans, and onClose props
  - [x] 11.3 Display modal with feature name and upgrade message
  - [x] 11.4 Show plan cards with pricing and "Includes {featureName}" indicator
  - [x] 11.5 Highlight recommended plan
  - [x] 11.6 Add "Select Plan" buttons that navigate to subscription plans page
  - [x] 11.7 Add "View All Plans" button
  - [x] 11.8 Implement close functionality

- [ ] 12. Create FeatureGate Component
  - [x] 12.1 Create src/features/subscription/ui/shared/FeatureGate.tsx
  - [x] 12.2 Accept feature and fallback props
  - [x] 12.3 Use checkFeatureAccess internally
  - [x] 12.4 Render children if user has access
  - [x] 12.5 Render fallback or default UpgradePrompt if access denied
  - [x] 12.6 Handle loading states
  - [x] 12.7 Handle error states by denying access

## Phase 6: Upgrade Flow

- [x] 13. Implement Freemium to Paid Upgrade
  - [x] 13.1 Update subscription upgrade logic to handle Freemium users
  - [x] 13.2 Initiate Razorpay payment flow when Freemium user selects paid plan
  - [x] 13.3 Update existing subscription record (not create new) on successful payment
  - [x] 13.4 Set new plan_id and start_date on upgrade
  - [x] 13.5 Unlock features included in new plan
  - [x] 13.6 Redirect to dashboard with success message
  - [x] 13.7 Maintain Freemium subscription on payment failure

- [x] 14. Update Subscription State Management
  - [x] 14.1 Invalidate subscription cache on subscription create/update
  - [x] 14.2 Update user session state immediately after subscription changes
  - [x] 14.3 Implement retry logic (up to 3 times) for subscription query failures
  - [x] 14.4 Refresh subscription data on page load
  - [x] 14.5 Ensure single source of truth from subscriptions table

## Phase 7: Error Handling

- [x] 15. Implement Subscription Error Handling
  - [x] 15.1 Display "Failed to create subscription. Please try again." for Freemium creation failures
  - [x] 15.2 Display "Payment system unavailable. Please try again later." for payment gateway failures
  - [x] 15.3 Display "Payment verification failed. Contact support if amount was deducted." for verification failures
  - [x] 15.4 Display "Upgrade failed. Your current plan remains active." for upgrade failures
  - [x] 15.5 Log all errors with userId, planCode, timestamp, and error details
  - [x] 15.6 Implement error logging with ErrorLog interface structure

- [x] 16. Implement Feature Access Error Handling
  - [x] 16.1 Default to denying access on feature check failures
  - [x] 16.2 Log errors with userId, feature, planCode, and timestamp
  - [x] 16.3 Display "Unable to verify access. Please refresh the page." for component errors
  - [x] 16.4 Implement graceful degradation for feature gate errors

## Phase 8: Performance Optimization

- [x] 17. Implement Caching Strategy
  - [x] 17.1 Add subscription data caching with key `subscription:${userId}` and 5-minute TTL
  - [x] 17.2 Add plan data caching with key `plans:${businessType}:${entityType}:${roleType}` and 1-hour TTL
  - [x] 17.3 Add feature access caching with key `feature:${userId}:${feature}` and 1-minute TTL
  - [x] 17.4 Implement cache invalidation on subscription changes
  - [x] 17.5 Use Redis for cache storage

- [x] 18. Optimize Frontend Performance
  - [x] 18.1 Implement lazy loading for FeatureLockOverlay component
  - [x] 18.2 Implement lazy loading for UpgradePrompt component
  - [x] 18.3 Add useMemo for plan filtering logic
  - [x] 18.4 Add useMemo for feature access checks
  - [x] 18.5 Implement optimistic UI updates for subscription creation

## Phase 9: Security Implementation

- [x] 19. Implement Authentication and Authorization
  - [x] 19.1 Add JWT token verification to /api/subscription/create-freemium endpoint
  - [x] 19.2 Validate userId matches authenticated user
  - [x] 19.3 Implement server-side validation for all subscription operations
  - [x] 19.4 Verify plan exists and is_active before creating subscription
  - [x] 19.5 Implement server-side feature gating for protected resources

- [x] 20. Implement Input Validation
  - [x] 20.1 Validate userId is UUID format
  - [x] 20.2 Validate email is valid email format
  - [x] 20.3 Validate planCode exists in subscription_plans table
  - [x] 20.4 Sanitize all inputs to prevent injection attacks
  - [x] 20.5 Implement validateCreateFreemiumRequest function

- [x] 21. Implement Rate Limiting
  - [x] 21.1 Add rate limiting to /api/subscription/create-freemium (5 requests/minute/user)
  - [x] 21.2 Add rate limiting to /api/subscription/upgrade (10 requests/minute/user)
  - [x] 21.3 Add rate limiting to feature access checks (100 requests/minute/user)
  - [x] 21.4 Use Redis for rate limiting implementation
  - [x] 21.5 Return 429 status with Retry-After header when rate limit exceeded

- [x] 22. Implement Audit Logging
  - [x] 22.1 Log subscription creation events (Freemium and paid)
  - [x] 22.2 Log subscription upgrade events
  - [x] 22.3 Log payment bypass decisions
  - [x] 22.4 Log feature access denials
  - [x] 22.5 Implement AuditLog interface with timestamp, userId, action, resource, result, metadata
  - [x] 22.6 Set retention policy: 90 days hot storage, 1 year cold storage
