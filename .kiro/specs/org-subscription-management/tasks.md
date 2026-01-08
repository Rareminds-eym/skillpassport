# Implementation Tasks: Organization-Level Subscription Management

## Overview

This task list breaks down the implementation of organization-level subscription management into discrete, actionable steps. Tasks are organized by phase and include database setup, backend services, frontend UI, testing, and deployment.

## Phase 1: Database Schema Setup ✅ COMPLETE

- [x] 1. Create new database tables
  - [x] 1.1 Create `organization_subscriptions` table with all columns and constraints
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 1.2 Create `license_pools` table with seat allocation tracking
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 1.3 Create `license_assignments` table with status tracking
    - _Requirements: 2.1, 2.2, 2.5, 7.1, 7.2, 7.3_
  - [x] 1.4 Create `organization_invitations` table with token management
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 2. Extend existing tables
  - [x] 2.1 Add organization columns to `subscriptions` table
    - Add `organization_id`, `organization_type`, `purchased_by`, `seat_count`, `is_organization_subscription`
    - _Requirements: 1.1, 1.5_
  - [x] 2.2 Add organization tracking to `user_entitlements` table
    - Add `granted_by_organization`, `organization_subscription_id`, `granted_by`
    - _Requirements: 2.1, 2.2, 2.5_
  - [x] 2.3 Add organization fields to `payment_transactions` table
    - Add `organization_id`, `organization_type`, `seat_count`, `is_bulk_purchase`
    - _Requirements: 11.1, 11.2, 11.3_
  - [x] 2.4 Add bulk order fields to `addon_pending_orders` table
    - Add `organization_id`, `target_member_type`, `target_member_ids`, `is_bulk_order`
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Create database indexes
  - [x] 3.1 Create indexes on `organization_subscriptions` (org_id, status, end_date, purchased_by)
  - [x] 3.2 Create indexes on `license_pools` (org_subscription_id, org_id, member_type)
  - [x] 3.3 Create indexes on `license_assignments` (user_id, pool_id, status, org_sub_id)
  - [x] 3.4 Create indexes on `organization_invitations` (org_id, email, token, status)
  - [x] 3.5 Create indexes on extended columns in existing tables

- [x] 4. Set up Row-Level Security (RLS) policies
  - [x] 4.1 Create RLS policies for `organization_subscriptions` (admin-only access)
  - [x] 4.2 Create RLS policies for `license_pools` (admin-only access)
  - [x] 4.3 Create RLS policies for `license_assignments` (admin + assigned user access)
  - [x] 4.4 Create RLS policies for `organization_invitations` (admin-only access)

- [x] 5. Create database functions
  - [x] 5.1 Create helper functions for organization queries
  - [x] 5.2 Create seat availability validation functions
  - [x] 5.3 Create auto-assignment trigger functions
  - [x] 5.4 Create entitlement sync trigger functions

- [x] 6. Checkpoint - Database setup complete ✅
  - All tables created with proper constraints
  - All indexes created for optimal performance
  - RLS policies implemented and tested
  - Helper functions and triggers in place
  - Ready for backend service implementation

## Phase 2: Backend Services Implementation

- [x] 7. Implement OrganizationSubscriptionService ✅
  - [x] 7.1 Create service class with dependency injection
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 7.2 Implement `purchaseSubscription()` method
    - Calculate pricing with volume discounts
    - Create organization_subscription record
    - Integrate with Razorpay
    - _Requirements: 1.1, 1.2, 1.3, 8.1, 8.2, 8.3_
  - [x] 7.3 Implement `calculateBulkPricing()` method
    - Apply volume discount tiers
    - Calculate tax and final amount
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 7.4 Implement `getOrganizationSubscriptions()` method
    - _Requirements: 4.1, 4.2_
  - [x] 7.5 Implement `updateSeatCount()` method
    - Handle seat additions/reductions
    - Calculate prorated charges
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  - [x] 7.6 Implement `cancelSubscription()` method
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [x] 7.7 Implement `renewSubscription()` method
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [x] 7.8 Implement `upgradeSubscription()` and `downgradeSubscription()` methods
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 8. Implement LicenseManagementService ✅
  - [x] 8.1 Create service class with pool management methods
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 8.2 Implement `createLicensePool()` method
    - _Requirements: 2.1, 13.1, 13.2, 13.3_
  - [x] 8.3 Implement `getLicensePools()` method
    - _Requirements: 2.1, 4.1, 4.2_
  - [x] 8.4 Implement `assignLicense()` method
    - Check seat availability
    - Create license_assignment record
    - Trigger entitlement creation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 8.5 Implement `unassignLicense()` method
    - Revoke entitlements
    - Return seat to pool
    - _Requirements: 2.5, 7.1, 7.2, 15.1, 15.2, 15.3_
  - [x] 8.6 Implement `transferLicense()` method
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 8.7 Implement `bulkAssignLicenses()` method
    - Handle concurrent assignments
    - Batch entitlement creation
    - _Requirements: 2.1, 2.2, 3.1, 3.2_
  - [x] 8.8 Implement `configureAutoAssignment()` method
    - _Requirements: 2.4, 10.3, 10.4_
  - [x] 8.9 Implement `processAutoAssignments()` method (stub)
    - _Requirements: 2.4, 10.3, 10.4_

- [x] 9. Implement OrganizationEntitlementService ✅
  - [x] 9.1 Create service class for entitlement management
    - _Requirements: 2.1, 2.2, 2.5, 5.1, 5.2_
  - [x] 9.2 Implement `grantEntitlementsFromAssignment()` method
    - Create user_entitlements records
    - Mark as organization-provided
    - _Requirements: 2.2, 5.1, 5.2_
  - [x] 9.3 Implement `revokeEntitlementsFromAssignment()` method
    - Deactivate entitlements
    - _Requirements: 2.5, 15.1, 15.2_
  - [x] 9.4 Implement `hasOrganizationAccess()` method
    - Check organization-provided access
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 9.5 Implement `getUserEntitlements()` method
    - Separate org-provided vs self-purchased
    - _Requirements: 5.1, 5.2, 5.5_
  - [x] 9.6 Implement `syncOrganizationEntitlements()` method
    - Sync when subscription changes
    - _Requirements: 14.1, 14.5_

- [ ] 10. Implement OrganizationBillingService
  - [ ] 10.1 Create service class for billing operations
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 11.1, 11.2, 11.3, 11.4, 11.5_
  - [ ] 10.2 Implement `getBillingDashboard()` method
    - Aggregate subscription costs
    - Calculate seat utilization
    - Show upcoming renewals
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ] 10.3 Implement `generateInvoice()` method
    - Create detailed invoice with GST
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  - [ ] 10.4 Implement `downloadInvoice()` method
    - Generate PDF invoice
    - _Requirements: 11.4, 11.5_
  - [ ] 10.5 Implement `projectMonthlyCost()` method
    - _Requirements: 4.5_
  - [ ] 10.6 Implement `calculateSeatAdditionCost()` method
    - Calculate prorated costs
    - _Requirements: 14.3_

- [ ] 11. Implement MemberInvitationService
  - [ ] 11.1 Create service class for invitation management
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [ ] 11.2 Implement `inviteMember()` method
    - Create invitation record
    - Generate secure token
    - Send invitation email
    - _Requirements: 10.1, 10.2, 10.3_
  - [ ] 11.3 Implement `bulkInviteMembers()` method
    - Handle batch invitations
    - _Requirements: 10.1, 10.2_
  - [ ] 11.4 Implement `acceptInvitation()` method
    - Verify token
    - Link user to organization
    - Auto-assign license if configured
    - _Requirements: 10.3, 10.4, 10.5_
  - [ ] 11.5 Implement `getPendingInvitations()` method
    - _Requirements: 10.5_

- [ ] 12. Create API endpoints
  - [ ] 12.1 Create `/api/org-subscriptions` endpoints (POST, GET, PUT, DELETE)
  - [ ] 12.2 Create `/api/license-pools` endpoints (POST, GET, PUT, DELETE)
  - [ ] 12.3 Create `/api/license-assignments` endpoints (POST, GET, PUT, DELETE)
  - [ ] 12.4 Create `/api/org-billing` endpoints (GET)
  - [ ] 12.5 Create `/api/org-invitations` endpoints (POST, GET, PUT, DELETE)
  - [ ] 12.6 Add authentication and authorization middleware
  - [ ] 12.7 Add rate limiting for bulk operations
  - [ ] 12.8 Add request validation and error handling

- [ ] 13. Checkpoint - Backend services complete
  - Test all service methods with unit tests
  - Verify API endpoints with integration tests
  - Test error handling and edge cases
  - Review code for security vulnerabilities

## Phase 3: Frontend UI Implementation

- [ ] 14. Extend SubscriptionPlans page for organization mode
  - [ ] 14.1 Add organization purchase mode detection
    - Check for `?mode=organization` query parameter
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ] 14.2 Create `SeatSelector` component
    - Input for seat count
    - Show volume discount tiers
    - Real-time price calculation
    - _Requirements: 1.2, 8.1, 8.2, 8.3_
  - [ ] 14.3 Create `MemberTypeSelector` component
    - Radio buttons for educator/student/both
    - _Requirements: 1.3, 13.1, 13.2, 13.3_
  - [ ] 14.4 Create `PricingBreakdown` component
    - Show base price, discount, tax, final amount
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [ ] 14.5 Modify `PlanCard` component for organization display
    - Show per-seat pricing
    - Display volume discount badges
    - _Requirements: 1.1, 1.2, 8.1_

- [ ] 15. Create OrganizationSubscriptionDashboard
  - [ ] 15.1 Create main dashboard layout component
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ] 15.2 Create `SubscriptionOverview` component
    - Display active subscriptions
    - Show seat utilization with progress bars
    - Quick action buttons
    - _Requirements: 4.1, 4.2_
  - [ ] 15.3 Create `LicensePoolManager` component
    - List all license pools
    - Create/edit pool interface
    - Seat allocation controls
    - _Requirements: 2.1, 2.3, 13.1, 13.2_
  - [ ] 15.4 Create `MemberAssignments` component
    - Searchable member list
    - Bulk selection checkboxes
    - Assign/unassign actions
    - Assignment history view
    - _Requirements: 2.1, 2.2, 2.5, 7.1, 7.3_
  - [ ] 15.5 Create `BillingDashboard` component
    - Cost breakdown charts
    - Payment history table
    - Downloadable invoices
    - Upcoming renewals
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 11.4, 11.5_
  - [ ] 15.6 Create `InvitationManager` component
    - Send invitation form
    - Pending invitations list
    - Resend/cancel actions
    - _Requirements: 10.1, 10.2, 10.5_

- [ ] 16. Create BulkPurchaseWizard
  - [ ] 16.1 Create wizard container with step navigation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [ ] 16.2 Create Step 1: Plan selection
    - Display available plans
    - Member type selection
    - _Requirements: 1.1, 1.3, 13.1_
  - [ ] 16.3 Create Step 2: Seat configuration
    - Seat count input
    - Volume discount display
    - Pricing breakdown
    - _Requirements: 1.2, 8.1, 8.2, 8.3_
  - [ ] 16.4 Create Step 3: Member selection
    - Option 1: Auto-assign to all
    - Option 2: Select specific members
    - Option 3: Create pool for later
    - _Requirements: 2.1, 2.4, 10.3_
  - [ ] 16.5 Create Step 4: Review and payment
    - Summary of purchase
    - Billing information form
    - Razorpay integration
    - _Requirements: 1.4, 1.5, 11.1, 11.2, 11.3_

- [ ] 17. Update MemberSubscriptionView
  - [ ] 17.1 Create `OrganizationProvidedFeatures` component
    - List features from organization
    - Show organization name and admin contact
    - Display expiration date
    - "Managed by" badge
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ] 17.2 Create `PersonalAddOns` component
    - List self-purchased add-ons
    - Available add-ons to purchase
    - Clear separation from org features
    - _Requirements: 5.1, 5.2, 5.5_
  - [ ] 17.3 Add expiration warnings
    - Show countdown for expiring subscriptions
    - _Requirements: 5.4, 9.4_

- [ ] 18. Implement responsive design
  - [ ] 18.1 Test all components on mobile devices (320px-768px)
  - [ ] 18.2 Test all components on tablets (768px-1024px)
  - [ ] 18.3 Test all components on desktop (1024px+)
  - [ ] 18.4 Ensure touch-friendly interactions
  - [ ] 18.5 Optimize for performance on mobile networks

- [ ] 19. Add loading states and error handling
  - [ ] 19.1 Add skeleton loaders for all data-fetching components
  - [ ] 19.2 Add error boundaries for graceful error handling
  - [ ] 19.3 Add toast notifications for success/error messages
  - [ ] 19.4 Add retry mechanisms for failed API calls

- [ ] 20. Checkpoint - Frontend UI complete
  - Test all user flows end-to-end
  - Verify responsive design on all devices
  - Check accessibility compliance (WCAG 2.1 AA)
  - Review UI/UX with stakeholders

## Phase 4: Testing & Quality Assurance

- [ ] 21. Write unit tests for backend services
  - [ ] 21.1 Test OrganizationSubscriptionService methods
  - [ ] 21.2 Test LicenseManagementService methods
  - [ ] 21.3 Test OrganizationEntitlementService methods
  - [ ] 21.4 Test OrganizationBillingService methods
  - [ ] 21.5 Test MemberInvitationService methods
  - [ ] 21.6 Test volume discount calculations
  - [ ] 21.7 Test seat allocation logic
  - [ ] 21.8 Test access control checks
  - [ ] 21.9 Achieve 80%+ code coverage

- [ ] 22. Write integration tests
  - [ ] 22.1 Test complete purchase flow (plan selection → payment → assignment)
  - [ ] 22.2 Test license assignment workflow
  - [ ] 22.3 Test member invitation and acceptance flow
  - [ ] 22.4 Test subscription renewal process
  - [ ] 22.5 Test bulk operations (assign/unassign 100+ members)
  - [ ] 22.6 Test upgrade/downgrade flows
  - [ ] 22.7 Test payment webhook handling

- [ ] 23. Perform load testing
  - [ ] 23.1 Test 1000+ concurrent seat assignments
  - [ ] 23.2 Test bulk invitation of 10,000 members
  - [ ] 23.3 Test dashboard loading with 100+ subscriptions
  - [ ] 23.4 Test payment processing under load
  - [ ] 23.5 Identify and fix performance bottlenecks

- [ ] 24. Conduct security testing
  - [ ] 24.1 Test authorization checks (admin-only operations)
  - [ ] 24.2 Test cross-organization access prevention
  - [ ] 24.3 Test SQL injection prevention
  - [ ] 24.4 Test XSS prevention in invitation messages
  - [ ] 24.5 Test rate limiting on bulk operations
  - [ ] 24.6 Conduct penetration testing
  - [ ] 24.7 Review and fix security vulnerabilities

- [ ] 25. User acceptance testing (UAT)
  - [ ] 25.1 Create test scenarios for admin users
  - [ ] 25.2 Create test scenarios for member users
  - [ ] 25.3 Conduct UAT with 2-3 pilot organizations
  - [ ] 25.4 Gather feedback and create improvement backlog
  - [ ] 25.5 Fix critical issues identified in UAT

- [ ] 26. Checkpoint - Testing complete
  - All tests passing
  - Performance meets targets (<200ms API, <2s dashboard load)
  - Security audit passed
  - UAT feedback incorporated

## Phase 5: Documentation & Deployment

- [ ] 27. Create technical documentation
  - [ ] 27.1 Write API documentation (OpenAPI/Swagger)
  - [ ] 27.2 Write database schema documentation
  - [ ] 27.3 Write service architecture documentation
  - [ ] 27.4 Create deployment guide
  - [ ] 27.5 Create troubleshooting guide

- [ ] 28. Create user documentation
  - [ ] 28.1 Write admin user guide (purchase, assign, manage)
  - [ ] 28.2 Write member user guide (view features, purchase add-ons)
  - [ ] 28.3 Create video tutorials for common tasks
  - [ ] 28.4 Create FAQ document
  - [ ] 28.5 Create billing and invoicing guide

- [ ] 29. Set up monitoring and alerting
  - [ ] 29.1 Configure application performance monitoring (APM)
  - [ ] 29.2 Set up error tracking (Sentry/Rollbar)
  - [ ] 29.3 Create dashboards for key metrics
  - [ ] 29.4 Configure alerts for critical issues
  - [ ] 29.5 Set up log aggregation and analysis

- [ ] 30. Deploy to staging environment
  - [ ] 30.1 Run database migrations on staging
  - [ ] 30.2 Deploy backend services to staging
  - [ ] 30.3 Deploy frontend to staging
  - [ ] 30.4 Verify all features work in staging
  - [ ] 30.5 Conduct smoke tests

- [ ] 31. Pilot launch with selected organizations
  - [ ] 31.1 Select 2-3 pilot organizations
  - [ ] 31.2 Provide training to pilot admins
  - [ ] 31.3 Monitor pilot usage closely
  - [ ] 31.4 Gather feedback from pilot users
  - [ ] 31.5 Make adjustments based on feedback

- [ ] 32. Production deployment
  - [ ] 32.1 Create deployment checklist
  - [ ] 32.2 Schedule maintenance window
  - [ ] 32.3 Run database migrations on production
  - [ ] 32.4 Deploy backend services to production
  - [ ] 32.5 Deploy frontend to production
  - [ ] 32.6 Verify all features work in production
  - [ ] 32.7 Monitor system health for 24 hours
  - [ ] 32.8 Announce feature availability to all organizations

- [ ] 33. Post-launch activities
  - [ ] 33.1 Monitor key metrics (adoption, utilization, revenue)
  - [ ] 33.2 Provide customer support for onboarding
  - [ ] 33.3 Collect user feedback
  - [ ] 33.4 Create improvement backlog
  - [ ] 33.5 Plan Phase 2 enhancements

- [ ] 34. Final checkpoint - Production launch complete
  - Feature live in production
  - Monitoring and alerting active
  - Documentation published
  - Support team trained
  - Success metrics tracking started

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Estimated timeline: 8 weeks with 2-3 developers
- Critical path: Database → Backend → Frontend → Testing → Deployment

