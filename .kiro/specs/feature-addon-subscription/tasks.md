# Implementation Tasks: Feature Add-On Subscription System

## Phase 1: Database Schema Setup ✅ COMPLETED

### Task 1.1: Extend subscription_plan_features table ✅
- [x] Add new columns for add-on pricing and metadata
- [x] Run migration via Supabase MCP

### Task 1.2: Create user_entitlements table ✅
- [x] Create table for tracking user add-on purchases
- [x] Add indexes for performance
- [x] Enable RLS policies

### Task 1.3: Create bundles and bundle_features tables ✅
- [x] Create bundles table
- [x] Create bundle_features junction table
- [x] Add RLS policies

### Task 1.4: Create addon_discount_codes table ✅
- [x] Create discount codes table
- [x] Add validation constraints

### Task 1.5: Create subscription_migrations table ✅
- [x] Create migration tracking table
- [x] Link to existing subscriptions table

### Task 1.6: Create addon_events table ✅
- [x] Create analytics events table
- [x] Add indexes for reporting queries

---

## Phase 2: Seed Add-On Data ✅ COMPLETED

### Task 2.1: Define student add-ons ✅
- [x] Career AI Assistant: ₹199/month, ₹1990/year
- [x] AI Job Matching: ₹249/month, ₹2490/year
- [x] Advanced Assessments: ₹149/month, ₹1490/year
- [x] Video Portfolio: ₹99/month, ₹990/year
- [x] Skills Analytics: ₹129/month, ₹1290/year

### Task 2.2: Define educator add-ons ✅
- [x] Educator AI: ₹299/month, ₹2990/year
- [x] Advanced Analytics: ₹199/month, ₹1990/year
- [x] Course Analytics: ₹149/month, ₹1490/year
- [x] Mentor Notes: ₹99/month, ₹990/year

### Task 2.3: Define admin add-ons ✅
- [x] KPI Dashboard: ₹499/month, ₹4990/year
- [x] Curriculum Builder: ₹399/month, ₹3990/year
- [x] Fee Management: ₹299/month, ₹2990/year
- [x] SSO: ₹599/month, ₹5990/year
- [x] API & Webhooks: ₹499/month, ₹4990/year
- [x] SCIM: ₹399/month, ₹3990/year

### Task 2.4: Define recruiter add-ons ✅
- [x] Recruiter AI: ₹399/month, ₹3990/year
- [x] Talent Pool Access: ₹299/month, ₹2990/year
- [x] Pipeline Management: ₹249/month, ₹2490/year
- [x] Project Hiring: ₹349/month, ₹3490/year

### Task 2.5: Create default bundles ✅
- [x] Career Starter bundle (students): 20% discount - ₹477/month
- [x] Educator Pro bundle: 20% discount - ₹518/month
- [x] Institution Complete bundle: 25% discount - ₹958/month
- [x] Recruiter Suite bundle: 20% discount - ₹1037/month

---

## Phase 3: Backend Services

### Task 3.1: Create AddOnCatalogService ✅
- [x] Create `src/services/addOnCatalogService.js`
- [x] Implement `getAddOns(filters)` - query subscription_plan_features where is_addon=true
- [x] Implement `getAddOnByFeatureKey(featureKey)`
- [x] Implement `getBundles(role)`
- [x] Implement `calculateBundleSavings(bundleId)`

### Task 3.2: Create EntitlementService ✅
- [x] Create `src/services/entitlementService.js`
- [x] Implement `getUserEntitlements(userId)`
- [x] Implement `hasFeatureAccess(userId, featureKey)` - check plan OR entitlement
- [x] Implement `activateAddOn(userId, featureKey, billingPeriod)`
- [x] Implement `activateBundle(userId, bundleId, billingPeriod)`
- [x] Implement `cancelAddOn(entitlementId)`
- [x] Implement `toggleAutoRenew(entitlementId, autoRenew)`
- [x] Implement `calculateTotalCost(userId)`

### Task 3.3: Extend Payment Service for Add-Ons
- [x] Update `src/services/paymentService.js` (created `src/services/addOnPaymentService.js`)
- [x] Add `createAddOnOrder(request)` - create Razorpay order for add-ons
- [x] Add `processAddOnPayment(orderId)` - create entitlements on success
- [x] Add `calculateProration(userId, featureKey)`
- [x] Add `applyDiscountCode(code, items)`

### Task 3.4: Create MigrationService ✅
- [x] Create `src/services/migrationService.js`
- [x] Implement `getMigrationMapping(planCode)` - map plan features to add-ons
- [x] Implement `migrateUser(userId, preservePricing)`
- [x] Implement `calculatePriceProtection(userId)`
- [x] Implement `scheduleMigrationNotification(userId, date)`

### Task 3.5: Create AddOnAnalyticsService ✅
- [x] Create `src/services/addOnAnalyticsService.js`
- [x] Implement `trackEvent(userId, eventType, featureKey, metadata)`
- [x] Implement `getAddOnRevenue(dateRange, groupBy)`
- [x] Implement `getChurnRate(featureKey, dateRange)`
- [x] Implement `getCohortAnalysis(cohortDate)`

---

## Phase 4: Frontend - Context & Hooks ✅ COMPLETED

### Task 4.1: Extend SubscriptionContext ✅
- [x] Update `src/context/SubscriptionContext.jsx`
- [x] Add `userEntitlements` state
- [x] Add `fetchUserEntitlements()` function
- [x] Add `hasAddOnAccess(featureKey)` function
- [x] Add `purchaseAddOn(featureKey, billingPeriod)` function
- [x] Add `purchaseBundle(bundleId, billingPeriod)` function
- [x] Add `cancelAddOn(entitlementId)` function

### Task 4.2: Create useFeatureGate hook ✅
- [x] Create `src/hooks/useFeatureGate.js`
- [x] Check plan-based access first
- [x] Check add-on entitlement if plan doesn't include
- [x] Return `{ hasAccess, isLoading, accessSource, requiredAddOn, showUpgradePrompt }`
- [x] Implement caching with 5-minute TTL

### Task 4.3: Create useAddOnCatalog hook ✅
- [x] Create `src/hooks/useAddOnCatalog.js`
- [x] Fetch add-ons filtered by user role
- [x] Fetch bundles filtered by user role
- [x] Mark owned add-ons in response

---

## Phase 5: Frontend - Components

### Task 5.1: Create FeatureGate component ✅
- [x] Create `src/components/subscription/FeatureGate.jsx`
- [x] Props: `featureKey`, `children`, `fallback`, `showUpgradePrompt`
- [x] Render children if access granted
- [x] Render fallback or upgrade prompt if access denied
- [x] Consistent locked UI pattern (lock icon, blur effect)

### Task 5.2: Create AddOnMarketplace component ✅
- [x] Create `src/components/subscription/AddOnMarketplace.jsx`
- [x] Display add-ons in grid/list view
- [x] Filter by category and role
- [x] Show monthly/annual pricing toggle
- [x] Indicate owned add-ons
- [x] Add to cart functionality

### Task 5.3: Create AddOnCard component ✅
- [x] Create `src/components/subscription/AddOnCard.jsx`
- [x] Display add-on name, description, price
- [x] Show "Owned" badge if user has entitlement
- [x] "Add to Cart" or "Buy Now" button
- [x] Annual savings highlight

### Task 5.4: Create BundleCard component ✅
- [x] Create `src/components/subscription/BundleCard.jsx`
- [x] Display bundle name, included add-ons
- [x] Show savings compared to individual purchase
- [x] Expandable list of included features

### Task 5.5: Create AddOnCheckout component ✅
- [x] Create `src/components/subscription/AddOnCheckout.jsx`
- [x] Cart summary with selected add-ons/bundles
- [x] Discount code input
- [x] Billing period selection
- [x] Total calculation with discounts
- [x] Razorpay payment integration

### Task 5.6: Create SubscriptionDashboard component ✅
- [x] Create `src/components/subscription/SubscriptionDashboard.jsx`
- [x] Display current plan
- [x] List active add-on entitlements
- [x] Show renewal dates
- [x] Toggle auto-renew per add-on
- [x] Cancel add-on functionality
- [x] Total monthly/annual cost display

### Task 5.7: Create UpgradePrompt component ✅
- [x] Create `src/components/subscription/UpgradePrompt.jsx`
- [x] Modal or inline prompt
- [x] Display required add-on details
- [x] Quick purchase button
- [x] "Learn More" link to marketplace

---

## Phase 6: Frontend - Pages

### Task 6.1: Update SubscriptionPlans page ✅
- [x] Update `src/pages/subscription/SubscriptionPlans.jsx`
- [x] Add "Add-Ons" tab alongside plans
- [x] Show base plan + add-on pricing model
- [x] Link to AddOnMarketplace

### Task 6.2: Create AddOns page ✅
- [x] Create `src/pages/subscription/AddOns.jsx`
- [x] Full-page add-on marketplace
- [x] Category filters
- [x] Search functionality
- [x] Bundle section

### Task 6.3: Update MySubscription page ✅
- [x] Update `src/pages/subscription/MySubscription.jsx`
- [x] Embed SubscriptionDashboard component
- [x] Add tab navigation for subscription vs add-ons
- [x] Payment history
- [x] Invoices download

---

## Phase 7: Feature Gating Implementation

### Task 7.1: Gate Career AI features ✅
- [x] Wrap Career AI components with FeatureGate
- [x] Feature key: `career_ai`
- [x] Show upgrade prompt for non-subscribers

### Task 7.2: Gate Advanced Assessments ✅
- [x] Wrap assessment components with FeatureGate
- [x] Feature key: `advanced_assessments`

### Task 7.3: Gate Educator AI features ✅
- [x] Wrap Educator AI components with FeatureGate
- [x] Feature key: `educator_ai`

### Task 7.4: Gate KPI Dashboard ✅
- [x] Wrap KPI Dashboard with FeatureGate
- [x] Feature key: `kpi_dashboard`

### Task 7.5: Gate Recruiter AI features ✅
- [x] Wrap Recruiter AI components with FeatureGate
- [x] Feature key: `recruiter_ai`

### Task 7.6: Gate SSO/API features ⏸️ (Deferred)
- [ ] Gate SSO configuration pages (pages not yet implemented)
- [ ] Feature key: `sso`
- [ ] Gate API key management (pages not yet implemented)
- [ ] Feature key: `api_webhooks`
- Note: SSO and API configuration pages do not exist in the current codebase. This task is deferred until those features are implemented.

---

## Phase 8: Migration & Testing

### Task 8.1: Create migration script for existing users ✅
- [x] Identify users with active subscriptions
- [x] Map their plan features to equivalent add-ons
- [x] Calculate price protection eligibility
- [x] Generate migration records
- [x] Created `src/scripts/migrateExistingSubscriptions.js`

### Task 8.2: Create migration notification system ✅
- [x] Email template for migration notification
- [x] Schedule notifications 30 days before
- [x] Track notification delivery
- [x] Created `src/services/migrationNotificationService.js`

### Task 8.3: Unit tests for services ✅
- [x] Test AddOnCatalogService
- [x] Test EntitlementService
- [x] Test PaymentService add-on methods
- [x] Test MigrationService
- [x] Created `src/__tests__/services/addOnServices.test.js`

### Task 8.4: Integration tests ✅
- [x] Test end-to-end purchase flow
- [x] Test feature gating
- [x] Test bundle activation
- [x] Test discount code application
- [x] Created `src/__tests__/integration/addOnPurchaseFlow.test.js`

### Task 8.5: Property-based tests ✅
- [x] Implement tests for all 20 correctness properties
- [x] Use fast-check library
- [x] Created `src/__tests__/property/addOnProperties.test.js`

---

## Phase 9: Analytics & Monitoring ✅ COMPLETED

### Task 9.1: Add-on analytics dashboard ✅
- [x] Revenue by add-on chart
- [x] Adoption rate metrics
- [x] Churn rate tracking
- [x] Bundle vs individual purchase ratio
- [x] Created `src/components/admin/AddOnAnalyticsDashboard.jsx`

### Task 9.2: Event tracking integration ✅
- [x] Track add-on views
- [x] Track upgrade prompt displays
- [x] Track purchase funnel
- [x] Track cancellation reasons
- [x] Created `src/hooks/useAddOnTracking.js`

---

## Completion Checklist

- [x] All database migrations applied (Phase 1)
- [x] Add-on data seeded (Phase 2)
- [x] Backend services implemented and tested (Phase 3)
- [x] Frontend components created (Phase 4, 5)
- [x] Frontend pages updated (Phase 6)
- [x] Feature gating applied to premium features (Phase 7 - 5/6 tasks, SSO/API deferred)
- [x] Migration system ready (Phase 8)
- [x] Property-based tests (Phase 8.5)
- [x] Analytics tracking in place (Phase 9)
- [x] Documentation updated
- [x] Routes connected to app (AddOns page at /subscription/add-ons)
- [x] Subscription management added to all user settings pages:
  - [x] Student Settings (`src/pages/student/Settings.jsx`) - Subscription tab
  - [x] Educator Settings (`src/pages/educator/Settings.tsx`) - Subscription tab
  - [x] Recruiter Settings (`src/pages/recruiter/Settings.tsx`) - Subscription section
  - [x] School Admin Settings (`src/pages/admin/schoolAdmin/Settings.tsx`) - Subscription tab
  - [x] College Admin Settings (`src/pages/admin/collegeAdmin/Settings.tsx`) - Subscription tab
