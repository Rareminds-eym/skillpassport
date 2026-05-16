# Requirements Document: Freemium Tier Implementation

## Introduction

This document specifies the requirements for implementing a Freemium tier subscription model for the SkillPassport platform. The Freemium tier allows users to sign up without payment, access the dashboard immediately with limited features, and upgrade to paid plans when ready. This lowers the barrier to entry while maintaining clear upgrade paths to monetize through compelling paid plan benefits.

## Glossary

- **Freemium_Tier**: A subscription plan with ₹0 cost that provides dashboard access, profile creation, and view-only access to opportunities and courses, but locks all premium features
- **Subscription_System**: The platform component managing user subscription plans, payments, and feature access
- **Payment_Gateway**: Razorpay integration for processing paid subscription transactions
- **Feature_Gate**: Access control mechanism that locks/unlocks features based on subscription status
- **Upgrade_Flow**: The user journey from Freemium tier to a paid subscription plan
- **Dashboard**: The main user interface after login showing available features and subscription status
- **Plan_Hierarchy**: Ordered list of subscription tiers: pay_as_you_go < basic < professional < premium
- **Auto_Subscription**: Automatic creation of a Freemium subscription without payment processing
- **Locked_Feature**: A platform capability unavailable to Freemium users requiring plan upgrade
- **Subscription_Plans_Page**: The interface displaying all available subscription options with pricing
- **Upgrade_Prompt**: UI component shown when users attempt to access locked features

## Requirements

### Requirement 1: Freemium Plan Database Configuration

**User Story:** As a platform administrator, I want a Freemium plan defined in the database, so that users can select a ₹0 subscription option.

#### Acceptance Criteria

1. THE Subscription_System SHALL store a plan with plan_code 'pay_as_you_go' in the subscription_plans table
2. THE Freemium_Tier SHALL have a price value of 0.00
3. THE Freemium_Tier SHALL include features: dashboard_access, profile_creation, marketplace_access, view_pricing, opportunities_access, courses_listing_access
4. THE Freemium_Tier SHALL have business_type 'b2c', entity_type 'all', and role_type 'all'
5. THE Freemium_Tier SHALL have duration 'lifetime'
6. THE Freemium_Tier SHALL have is_active set to true
7. THE Subscription_System SHALL position pay_as_you_go as the lowest tier in the Plan_Hierarchy

### Requirement 2: Freemium Subscription Auto-Creation

**User Story:** As a new user, I want to select the Freemium option and immediately access the dashboard, so that I can explore the platform without payment.

#### Acceptance Criteria

1. WHEN a user selects the Freemium_Tier on the Subscription_Plans_Page, THE Subscription_System SHALL bypass the Payment_Gateway
2. WHEN the Freemium_Tier is selected, THE Subscription_System SHALL create a subscription record with status 'active'
3. WHEN the Auto_Subscription is created, THE Subscription_System SHALL set start_date to the current timestamp
4. WHEN the Auto_Subscription is created, THE Subscription_System SHALL set end_date to null
5. WHEN the Auto_Subscription completes, THE Subscription_System SHALL redirect the user to the Dashboard
6. IF the Auto_Subscription creation fails, THEN THE Subscription_System SHALL display an error message and allow retry

### Requirement 3: Paid Plan Payment Processing

**User Story:** As a new user, I want to select a paid plan and complete payment, so that I can access all premium features immediately.

#### Acceptance Criteria

1. WHEN a user selects a paid plan (basic, professional, or premium), THE Subscription_System SHALL initiate the Payment_Gateway flow
2. WHEN payment is initiated, THE Payment_Gateway SHALL display the Razorpay payment interface
3. WHEN payment succeeds, THE Subscription_System SHALL create an active subscription record
4. WHEN payment succeeds, THE Subscription_System SHALL unlock all features included in the selected plan
5. WHEN payment succeeds, THE Subscription_System SHALL redirect the user to the Dashboard with full access
6. IF payment fails, THEN THE Subscription_System SHALL display an error message and return to the Subscription_Plans_Page

### Requirement 4: Freemium Plan Display

**User Story:** As a new user, I want to see the Freemium option clearly presented alongside paid plans, so that I can make an informed choice.

#### Acceptance Criteria

1. THE Subscription_Plans_Page SHALL display the Freemium_Tier as the first option
2. THE Freemium_Tier card SHALL display "₹0" as the price
3. THE Freemium_Tier card SHALL display the tagline "Start free, upgrade anytime"
4. THE Freemium_Tier card SHALL list included features: Dashboard access, Profile creation, Browse opportunities/jobs, Browse courses, View pricing
5. THE Freemium_Tier card SHALL display a "Start Free" button
6. THE Subscription_Plans_Page SHALL display paid plans (Basic ₹499, Professional ₹749, Premium ₹999) after the Freemium option

### Requirement 5: Feature Access Control for Freemium Users

**User Story:** As a Freemium user, I want to access only the free features, so that the platform enforces subscription boundaries correctly.

#### Acceptance Criteria

1. WHEN a user has a Freemium_Tier subscription, THE Feature_Gate SHALL grant access to dashboard_access
2. WHEN a user has a Freemium_Tier subscription, THE Feature_Gate SHALL grant access to profile_creation
3. WHEN a user has a Freemium_Tier subscription, THE Feature_Gate SHALL grant access to marketplace_access
4. WHEN a user has a Freemium_Tier subscription, THE Feature_Gate SHALL grant access to view_pricing
5. WHEN a user has a Freemium_Tier subscription, THE Feature_Gate SHALL grant access to opportunities_access
6. WHEN a user has a Freemium_Tier subscription, THE Feature_Gate SHALL grant access to courses_listing_access (view only, no enrollment)
7. WHEN a user has a Freemium_Tier subscription, THE Feature_Gate SHALL deny access to all other features (assessments, projects, storage, analytics, portfolio, career_paths, mock_interviews, resume_builder, certificates, course_enrollment)
8. FOR ALL Locked_Features, THE Feature_Gate SHALL return upgradeRequired flag as true when access is denied

### Requirement 6: Dashboard Freemium Banner

**User Story:** As a Freemium user, I want to see a clear indication of my subscription status on the dashboard, so that I understand my current limitations and upgrade options.

#### Acceptance Criteria

1. WHEN a user with Freemium_Tier accesses the Dashboard, THE Dashboard SHALL display a banner at the top
2. THE banner SHALL contain the text "You're on Freemium"
3. THE banner SHALL contain the text "Upgrade to unlock all features"
4. THE banner SHALL display a "View Plans" button
5. WHEN the "View Plans" button is clicked, THE Dashboard SHALL navigate to the Subscription_Plans_Page
6. WHEN a user with a paid subscription accesses the Dashboard, THE Dashboard SHALL NOT display the Freemium banner

### Requirement 7: Locked Feature UI Indication

**User Story:** As a Freemium user, I want to see which features are locked, so that I understand what I need to upgrade to access.

#### Acceptance Criteria

1. WHEN a Locked_Feature is displayed on the Dashboard, THE Dashboard SHALL show a lock icon (🔒) next to the feature name
2. WHEN a Locked_Feature is displayed, THE Dashboard SHALL apply a visual blur or overlay effect
3. WHEN a user hovers over a Locked_Feature, THE Dashboard SHALL display a tooltip indicating "Upgrade required"
4. WHEN a user clicks on a Locked_Feature, THE Dashboard SHALL display an Upgrade_Prompt
5. THE Upgrade_Prompt SHALL list which paid plans include the feature
6. THE Upgrade_Prompt SHALL provide buttons to "View All Plans" or select a specific plan

### Requirement 8: Upgrade Flow from Freemium to Paid Plan

**User Story:** As a Freemium user, I want to upgrade to a paid plan seamlessly, so that I can unlock features without creating a new account.

#### Acceptance Criteria

1. WHEN a Freemium user selects a paid plan from the Subscription_Plans_Page, THE Subscription_System SHALL initiate the Payment_Gateway flow
2. WHEN payment succeeds, THE Subscription_System SHALL update the existing subscription record to the new plan
3. WHEN payment succeeds, THE Subscription_System SHALL set the new plan's start_date to the current timestamp
4. WHEN payment succeeds, THE Subscription_System SHALL unlock all features included in the new plan
5. WHEN the upgrade completes, THE Subscription_System SHALL redirect to the Dashboard with a success message
6. WHEN the upgrade completes, THE Dashboard SHALL remove the Freemium banner
7. IF the upgrade payment fails, THEN THE Subscription_System SHALL maintain the Freemium_Tier subscription and display an error message

### Requirement 9: Plan Hierarchy Configuration

**User Story:** As a system administrator, I want the plan hierarchy properly configured, so that feature access comparisons work correctly.

#### Acceptance Criteria

1. THE Subscription_System SHALL define Plan_Hierarchy as: ['pay_as_you_go', 'basic', 'professional', 'enterprise', 'enterprise_ecosystem']
2. WHEN comparing plan access levels, THE Subscription_System SHALL use the Plan_Hierarchy ordering
3. THE Subscription_System SHALL define PLAN_IDS.PAY_AS_YOU_GO constant as 'pay_as_you_go'
4. THE Subscription_System SHALL include PAY_AS_YOU_GO in all plan-related configuration files
5. THE Subscription_System SHALL ensure pay_as_you_go is recognized as a valid plan_code throughout the codebase

### Requirement 10: Freemium Feature Limits Configuration

**User Story:** As a developer, I want Freemium feature limits clearly defined, so that feature gating logic is consistent across the application.

#### Acceptance Criteria

1. THE Subscription_System SHALL define PAY_AS_YOU_GO_FEATURES configuration object
2. THE PAY_AS_YOU_GO_FEATURES SHALL set dashboard_access to true
3. THE PAY_AS_YOU_GO_FEATURES SHALL set profile_creation to true
4. THE PAY_AS_YOU_GO_FEATURES SHALL set marketplace_access to true
5. THE PAY_AS_YOU_GO_FEATURES SHALL set view_pricing to true
6. THE PAY_AS_YOU_GO_FEATURES SHALL set opportunities_access to true
7. THE PAY_AS_YOU_GO_FEATURES SHALL set courses_listing_access to true
8. THE PAY_AS_YOU_GO_FEATURES SHALL set all other features (assessments, projects, storage, analytics, portfolio, career_paths, mock_interviews, resume_builder, certificates, course_enrollment, priority_support) to false

### Requirement 11: Signup Flow Integration

**User Story:** As a new user, I want the signup process to seamlessly lead me to subscription selection, so that I can choose between Freemium and paid plans immediately.

#### Acceptance Criteria

1. WHEN a user completes the signup form, THE Subscription_System SHALL redirect to the Subscription_Plans_Page
2. THE Subscription_Plans_Page SHALL display the user's role and entity type context
3. THE Subscription_Plans_Page SHALL construct the correct URL path: /subscription/plans/{entityType}/purchase
4. THE Subscription_System SHALL NOT require changes to the existing UnifiedSignup component
5. THE Subscription_System SHALL maintain the existing 2-step signup form flow

### Requirement 12: Payment Gateway Bypass Logic

**User Story:** As a developer, I want clear logic to determine when to bypass payment processing, so that Freemium subscriptions are created correctly without payment.

#### Acceptance Criteria

1. WHEN evaluating a plan selection, THE Subscription_System SHALL check if plan_code equals 'pay_as_you_go'
2. WHEN evaluating a plan selection, THE Subscription_System SHALL check if the plan has an isFree flag set to true
3. IF either condition is true, THEN THE Subscription_System SHALL bypass the Payment_Gateway
4. IF both conditions are false, THEN THE Subscription_System SHALL initiate the Payment_Gateway flow
5. THE Subscription_System SHALL log all payment bypass decisions for audit purposes

### Requirement 13: Freemium API Endpoint

**User Story:** As a frontend developer, I want a dedicated API endpoint for creating Freemium subscriptions, so that I can handle the auto-subscription flow reliably.

#### Acceptance Criteria

1. THE Subscription_System SHALL provide a POST endpoint at /api/subscription/create-freemium
2. WHEN the endpoint receives a request, THE Subscription_System SHALL validate the userId and email parameters
3. WHEN the endpoint receives a valid request, THE Subscription_System SHALL create a subscription record with plan_code 'pay_as_you_go'
4. WHEN the subscription is created, THE Subscription_System SHALL return a 200 status code with subscription details
5. IF the userId is missing or invalid, THEN THE Subscription_System SHALL return a 400 status code with error details
6. IF the subscription creation fails, THEN THE Subscription_System SHALL return a 500 status code with error details
7. THE endpoint SHALL complete within 2000ms under normal conditions

### Requirement 14: Feature Access Check Function

**User Story:** As a developer, I want a reliable function to check feature access, so that I can consistently enforce subscription boundaries throughout the application.

#### Acceptance Criteria

1. THE Subscription_System SHALL provide a checkFeatureAccess function accepting userPlan, feature, userPurchases, and currentUsage parameters
2. WHEN userPlan is 'pay_as_you_go', THE function SHALL evaluate access using PAY_AS_YOU_GO_FEATURES configuration
3. WHEN a feature is set to true in PAY_AS_YOU_GO_FEATURES, THE function SHALL return hasAccess: true
4. WHEN a feature is set to false in PAY_AS_YOU_GO_FEATURES, THE function SHALL return hasAccess: false with upgradeRequired: true
5. WHEN a feature is undefined in PAY_AS_YOU_GO_FEATURES, THE function SHALL return hasAccess: false with upgradeRequired: true
6. THE function SHALL return a FeatureAccessResult object containing hasAccess, reason, upgradeRequired, and addOnAvailable fields
7. FOR ALL feature access checks, THE function SHALL complete within 100ms

### Requirement 15: Subscription State Consistency

**User Story:** As a user, I want my subscription state to remain consistent across all platform pages, so that I don't experience confusing access changes during my session.

#### Acceptance Criteria

1. WHEN a subscription is created or updated, THE Subscription_System SHALL update the user's session state immediately
2. WHEN navigating between pages, THE Dashboard SHALL fetch the current subscription status
3. WHEN a subscription changes, THE Subscription_System SHALL invalidate cached subscription data
4. THE Subscription_System SHALL use a single source of truth for subscription status (subscriptions table)
5. IF a subscription query fails, THEN THE Subscription_System SHALL retry up to 3 times before showing an error
6. THE Subscription_System SHALL refresh subscription data on page load and after any subscription modification

### Requirement 16: Error Handling for Subscription Operations

**User Story:** As a user, I want clear error messages when subscription operations fail, so that I understand what went wrong and how to proceed.

#### Acceptance Criteria

1. IF Auto_Subscription creation fails, THEN THE Subscription_System SHALL display "Failed to create subscription. Please try again."
2. IF Payment_Gateway initialization fails, THEN THE Subscription_System SHALL display "Payment system unavailable. Please try again later."
3. IF payment verification fails, THEN THE Subscription_System SHALL display "Payment verification failed. Contact support if amount was deducted."
4. IF subscription upgrade fails, THEN THE Subscription_System SHALL display "Upgrade failed. Your current plan remains active."
5. IF feature access check fails, THEN THE Feature_Gate SHALL default to denying access and log the error
6. THE Subscription_System SHALL log all errors with sufficient context for debugging (userId, planCode, timestamp, error details)

### Requirement 17: Pricing Display Consistency

**User Story:** As a user, I want to see consistent pricing across all platform pages, so that I can make informed decisions about upgrading.

#### Acceptance Criteria

1. THE Subscription_Plans_Page SHALL display Freemium as "₹0"
2. THE Subscription_Plans_Page SHALL display Basic Plan as "₹499/month"
3. THE Subscription_Plans_Page SHALL display Professional Plan as "₹749/month"
4. THE Subscription_Plans_Page SHALL display Premium Plan as "₹999/month"
5. THE Upgrade_Prompt SHALL display the same pricing as the Subscription_Plans_Page
6. THE Dashboard banner SHALL NOT display pricing, only "Upgrade to unlock all features"
7. FOR ALL pricing displays, THE Subscription_System SHALL format currency as "₹{amount}" or "₹{amount}/month"

### Requirement 18: Subscription Plans Page Upgrade Context

**User Story:** As a Freemium user viewing the plans page to upgrade, I want to see my current plan highlighted, so that I understand which plans are upgrades.

#### Acceptance Criteria

1. WHEN a Freemium user accesses the Subscription_Plans_Page, THE page SHALL highlight the Freemium_Tier card as "Current Plan"
2. WHEN displaying paid plans to a Freemium user, THE page SHALL show "Upgrade" buttons instead of "Select Plan" buttons
3. WHEN a user with a paid plan accesses the Subscription_Plans_Page, THE page SHALL highlight their current plan
4. THE Subscription_Plans_Page SHALL disable the button for the user's current plan
5. THE Subscription_Plans_Page SHALL show "Current Plan" badge on the active subscription card

### Requirement 19: Feature Gate Component Integration

**User Story:** As a developer, I want reusable feature gate components, so that I can easily protect features throughout the application.

#### Acceptance Criteria

1. THE Subscription_System SHALL provide a FeatureGate component accepting feature and fallback props
2. WHEN a user has access to the feature, THE FeatureGate SHALL render its children
3. WHEN a user lacks access to the feature, THE FeatureGate SHALL render the fallback prop or default Upgrade_Prompt
4. THE FeatureGate SHALL use the checkFeatureAccess function internally
5. THE FeatureGate SHALL handle loading states while checking access
6. THE FeatureGate SHALL handle error states gracefully by denying access

### Requirement 20: Analytics and Metrics Tracking

**User Story:** As a product manager, I want to track Freemium user behavior and conversion rates, so that I can measure the success of the Freemium tier.

#### Acceptance Criteria

1. WHEN a user creates a Freemium subscription, THE Subscription_System SHALL log an event "freemium_signup"
2. WHEN a user clicks a Locked_Feature, THE Subscription_System SHALL log an event "feature_lock_interaction" with feature name
3. WHEN a user views the Subscription_Plans_Page from an Upgrade_Prompt, THE Subscription_System SHALL log an event "upgrade_intent"
4. WHEN a Freemium user upgrades to a paid plan, THE Subscription_System SHALL log an event "freemium_conversion" with target plan
5. WHEN a user clicks "View Plans" from the Dashboard banner, THE Subscription_System SHALL log an event "banner_click"
6. THE Subscription_System SHALL include userId, timestamp, and relevant context in all logged events

## Correctness Properties for Property-Based Testing

### Property 1: Subscription State Invariant
**Property:** FOR ALL users with active subscriptions, the subscription record SHALL have a valid plan_code that exists in the subscription_plans table.

**Test Strategy:** Generate random user subscriptions and verify plan_code references exist.

### Property 2: Feature Access Consistency
**Property:** FOR ALL features and plan combinations, checkFeatureAccess(plan, feature) SHALL return the same result when called multiple times with identical inputs.

**Test Strategy:** Generate random plan/feature combinations and verify idempotent access checks.

### Property 3: Plan Hierarchy Ordering
**Property:** FOR ALL plan pairs (planA, planB) where planA is lower in Plan_Hierarchy than planB, a feature available in planA SHALL also be available in planB.

**Test Strategy:** Generate feature sets for each plan and verify monotonic feature inclusion.

### Property 4: Payment Bypass Correctness
**Property:** FOR ALL plan selections, IF plan_code equals 'pay_as_you_go' OR isFree is true, THEN Payment_Gateway SHALL NOT be invoked.

**Test Strategy:** Generate plan selection events and verify payment gateway invocation matches expected bypass logic.

### Property 5: Freemium Feature Lock Completeness
**Property:** FOR ALL features NOT in PAY_AS_YOU_GO_FEATURES or set to false, checkFeatureAccess('pay_as_you_go', feature) SHALL return hasAccess: false with upgradeRequired: true.

**Test Strategy:** Generate all possible feature names and verify Freemium users are denied access to non-free features.

### Property 6: Subscription Creation Atomicity
**Property:** FOR ALL subscription creation attempts, EITHER a valid subscription record exists in the database OR an error is returned to the user (no partial states).

**Test Strategy:** Simulate subscription creation with random failures and verify database consistency.

### Property 7: Upgrade Preserves User Identity
**Property:** FOR ALL upgrade operations from Freemium to paid plan, the userId SHALL remain unchanged and the subscription record SHALL be updated (not duplicated).

**Test Strategy:** Generate upgrade scenarios and verify single subscription per user constraint.

### Property 8: Price Display Consistency
**Property:** FOR ALL locations displaying plan pricing, the price for a given plan_code SHALL be identical.

**Test Strategy:** Extract pricing from all UI components and verify consistency across the application.

### Property 9: Feature Gate Denial Provides Upgrade Path
**Property:** FOR ALL feature access denials where upgradeRequired is true, the response SHALL include information about which plans provide access.

**Test Strategy:** Generate denied access scenarios and verify upgrade information is present.

### Property 10: Session State Synchronization
**Property:** FOR ALL subscription modifications, the user's session state SHALL reflect the new subscription within 5 seconds.

**Test Strategy:** Perform subscription changes and verify session state updates within time bound.
