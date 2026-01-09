# Requirements Document

## Introduction

This document defines the requirements for transforming SkillPassport's subscription model from a traditional tiered plan system to a modular add-on based system. This allows users to select and pay only for the features they need, providing flexibility and cost optimization while enabling the platform to monetize individual features.

## Glossary

- **Add_On**: A discrete, purchasable feature module that can be enabled/disabled independently
- **Base_Plan**: A minimal subscription tier that provides core platform access
- **Feature_Bundle**: A pre-configured group of related add-ons offered at a discounted price
- **Subscription_Manager**: The system component that tracks active subscriptions and add-ons
- **Feature_Gate**: A mechanism that controls access to features based on purchased add-ons
- **Add_On_Catalog**: The complete list of available add-ons with pricing and descriptions
- **User_Entitlements**: The set of features a user has access to based on their purchases

## Requirements

### Requirement 1: Add-On Catalog Management

**User Story:** As a platform administrator, I want to define and manage a catalog of feature add-ons, so that users can browse and purchase individual features.

#### Acceptance Criteria

1. THE Add_On_Catalog SHALL store add-on definitions including id, name, description, price, billing_period, and feature_flags
2. WHEN an administrator creates a new add-on, THE System SHALL validate that the add-on has a unique identifier and valid pricing
3. THE Add_On_Catalog SHALL support categorization of add-ons by user role (student, educator, school_admin, college_admin, university_admin, recruiter)
4. WHEN an add-on is deprecated, THE System SHALL mark it as inactive while preserving access for existing subscribers
5. THE Add_On_Catalog SHALL support both monthly and annual billing periods for each add-on

### Requirement 2: Feature Add-On Definitions

**User Story:** As a product manager, I want to define which platform features are available as add-ons, so that users can customize their experience.

#### Acceptance Criteria

1. THE System SHALL define the following student add-ons: Career_AI_Assistant, Advanced_Assessments, Video_Portfolio, AI_Job_Matching, Course_Certificates, Skills_Analytics
2. THE System SHALL define the following educator add-ons: Educator_AI, Advanced_Analytics, Media_Manager, Mentor_Notes, Course_Analytics
3. THE System SHALL define the following school_admin add-ons: KPI_Dashboard, Curriculum_Builder, Parent_Portal, Fee_Management, Library_Management, Lesson_Plan_Approvals
4. THE System SHALL define the following college_admin add-ons: Department_Management, Placement_Management, Transcript_Generation, Event_Management, Finance_Management, Academic_Calendar
5. THE System SHALL define the following university_admin add-ons: AI_Counselling, OBE_Tracking, Placement_Readiness, College_Registration, Continuous_Assessment
6. THE System SHALL define the following recruiter add-ons: Recruiter_AI, Talent_Pool_Access, Pipeline_Management, Project_Hiring, Verified_Work_Access

### Requirement 3: Base Plan Structure

**User Story:** As a user, I want access to essential platform features through a base plan, so that I can use the platform without purchasing all add-ons.

#### Acceptance Criteria

1. THE Base_Plan SHALL include core authentication and profile management for all user roles
2. THE Base_Plan SHALL include basic messaging functionality between users
3. THE Base_Plan SHALL include access to the digital passport/portfolio viewer (read-only for non-owners)
4. THE Base_Plan SHALL be priced lower than the current Basic tier to encourage add-on purchases
5. WHEN a user subscribes to the Base_Plan, THE System SHALL grant access to core features immediately

### Requirement 4: Add-On Purchase Flow

**User Story:** As a user, I want to purchase individual add-ons, so that I can customize my subscription to my needs.

#### Acceptance Criteria

1. WHEN a user selects an add-on to purchase, THE System SHALL display the add-on price and billing period
2. WHEN a user completes payment for an add-on, THE System SHALL activate the add-on immediately
3. THE System SHALL support purchasing multiple add-ons in a single transaction
4. WHEN a user purchases an add-on, THE System SHALL prorate the charge based on their current billing cycle
5. IF payment fails during add-on purchase, THEN THE System SHALL not activate the add-on and notify the user

### Requirement 5: Feature Bundles

**User Story:** As a user, I want to purchase pre-configured bundles of related features at a discount, so that I can save money on commonly used feature combinations.

#### Acceptance Criteria

1. THE System SHALL offer a "Career Starter" bundle for students including Career_AI_Assistant, AI_Job_Matching, and Skills_Analytics
2. THE System SHALL offer an "Educator Pro" bundle including Educator_AI, Advanced_Analytics, and Course_Analytics
3. THE System SHALL offer an "Institution Complete" bundle for admins including all admin-specific add-ons at 20% discount
4. WHEN a user purchases a bundle, THE System SHALL activate all included add-ons
5. THE System SHALL display bundle savings compared to purchasing add-ons individually

### Requirement 6: Feature Gating

**User Story:** As a platform developer, I want to gate features based on user entitlements, so that only users with purchased add-ons can access premium features.

#### Acceptance Criteria

1. WHEN a user attempts to access a gated feature, THE Feature_Gate SHALL check the user's active add-ons
2. IF a user does not have the required add-on, THEN THE System SHALL display an upgrade prompt with the add-on details
3. THE Feature_Gate SHALL cache entitlement checks for performance (max 5 minute cache)
4. WHEN an add-on expires, THE Feature_Gate SHALL immediately revoke access to the associated features
5. THE System SHALL provide a consistent UI pattern for locked features across all pages

### Requirement 7: Subscription Management

**User Story:** As a user, I want to manage my add-ons and subscriptions from a single dashboard, so that I can easily add, remove, or modify my purchases.

#### Acceptance Criteria

1. THE Subscription_Manager SHALL display all active add-ons with their renewal dates
2. WHEN a user cancels an add-on, THE System SHALL maintain access until the current billing period ends
3. THE Subscription_Manager SHALL allow users to toggle auto-renewal for individual add-ons
4. WHEN a user's payment method fails for renewal, THE System SHALL provide a 7-day grace period before deactivating add-ons
5. THE Subscription_Manager SHALL display total monthly/annual cost across all active add-ons

### Requirement 8: Add-On Pricing Display

**User Story:** As a user, I want to see clear pricing for all available add-ons, so that I can make informed purchasing decisions.

#### Acceptance Criteria

1. THE System SHALL display add-on prices in the user's local currency (default INR)
2. WHEN displaying add-on pricing, THE System SHALL show both monthly and annual options with annual savings highlighted
3. THE System SHALL display a comparison view showing which add-ons are included in each bundle
4. WHEN a user has an active add-on, THE System SHALL indicate this in the catalog view
5. THE System SHALL support promotional pricing and discount codes for add-ons

### Requirement 9: Migration from Existing Plans

**User Story:** As an existing subscriber, I want my current plan features to be preserved during the migration to add-ons, so that I don't lose access to features I've paid for.

#### Acceptance Criteria

1. WHEN migrating existing subscribers, THE System SHALL map their current plan features to equivalent add-ons
2. THE System SHALL grandfather existing subscribers at their current pricing until their subscription renews
3. WHEN an existing subscriber's plan renews, THE System SHALL offer them the choice to continue with equivalent add-ons or switch to the new model
4. THE System SHALL send migration notification emails 30 days before any pricing changes take effect
5. IF an existing subscriber's mapped add-ons cost more than their current plan, THEN THE System SHALL honor the lower price for 12 months

### Requirement 10: Add-On Analytics and Reporting

**User Story:** As a platform administrator, I want to track add-on adoption and revenue, so that I can optimize pricing and feature offerings.

#### Acceptance Criteria

1. THE System SHALL track add-on purchase, activation, and cancellation events
2. THE System SHALL generate reports showing add-on revenue by category and time period
3. THE System SHALL track feature usage for users with active add-ons
4. THE System SHALL identify add-ons with high churn rates for product improvement
5. THE System SHALL provide cohort analysis for add-on adoption patterns
