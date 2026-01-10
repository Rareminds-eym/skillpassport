# Requirements Document: Organization-Level Subscription Management

## Introduction

This document defines the requirements for enabling organization administrators (school_admin, college_admin, university_admin) to purchase and manage subscription plans and add-ons on behalf of their organization members (educators and students). This transforms the subscription model from individual B2C purchases to organization-managed B2B subscriptions with centralized billing and member entitlement management.

## Glossary

- **Organization**: A school, college, or university entity with an admin who manages subscriptions
- **Organization_Admin**: School admin, college admin, or university admin who purchases subscriptions
- **Organization_Member**: Educators and students who belong to an organization
- **Organization_Subscription**: A subscription purchased by an admin for their organization
- **Member_Entitlement**: Feature access granted to organization members through org subscriptions
- **Seat_License**: A purchased subscription slot that can be assigned to a member
- **Bulk_Purchase**: Purchasing multiple subscription seats or add-ons at once
- **License_Pool**: Collection of available subscription seats for an organization
- **Member_Assignment**: The act of assigning a subscription seat to a specific member

## Requirements

### Requirement 1: Organization Subscription Purchase

**User Story:** As an organization admin, I want to purchase subscription plans for my organization, so that I can provide platform access to my educators and students.

#### Acceptance Criteria

1. WHEN an organization admin views subscription plans, THE System SHALL display organization-level pricing with seat-based options
2. WHEN an admin purchases a plan, THE System SHALL allow specifying the number of seats (minimum 1, maximum based on plan limits)
3. THE System SHALL calculate total cost as (seat_count × plan_price) with volume discounts for bulk purchases
4. WHEN an admin completes payment, THE System SHALL create an organization_subscription record linked to their organization
5. THE System SHALL create a license_pool with the purchased number of seats for the organization

### Requirement 2: Member License Assignment

**User Story:** As an organization admin, I want to assign subscription seats to my educators and students, so that they can access premium features.

#### Acceptance Criteria

1. WHEN an admin views their license pool, THE System SHALL display available seats, assigned seats, and member assignments
2. WHEN an admin assigns a seat to a member, THE System SHALL verify the member belongs to their organization
3. WHEN a seat is assigned, THE System SHALL create user_entitlements for the member based on the plan features
4. THE System SHALL prevent assigning more seats than available in the license pool
5. WHEN an admin unassigns a seat, THE System SHALL revoke the member's entitlements and return the seat to the pool

### Requirement 3: Bulk Add-On Purchase for Members

**User Story:** As an organization admin, I want to purchase add-ons in bulk for specific member groups, so that I can provide specialized features to educators or students.

#### Acceptance Criteria

1. WHEN an admin purchases an add-on, THE System SHALL allow specifying target member type (educators, students, or specific individuals)
2. WHEN an admin purchases an add-on for a group, THE System SHALL calculate cost as (member_count × addon_price)
3. THE System SHALL create add-on entitlements for all specified members upon successful payment
4. WHEN new members join the organization, THE System SHALL optionally auto-assign group add-ons based on admin settings
5. THE System SHALL track add-on assignments separately from base plan assignments

### Requirement 4: Organization Billing Dashboard

**User Story:** As an organization admin, I want to view all subscription costs and usage, so that I can manage my organization's budget effectively.

#### Acceptance Criteria

1. THE System SHALL display total monthly/annual subscription costs for the organization
2. THE System SHALL show seat utilization metrics (used seats / total seats) for each plan
3. THE System SHALL display add-on costs broken down by member type and feature
4. THE System SHALL provide payment history with downloadable invoices
5. THE System SHALL show upcoming renewal dates and projected costs

### Requirement 5: Member Self-Service View

**User Story:** As an organization member (educator/student), I want to see which features I have access to through my organization, so that I understand my subscription benefits.

#### Acceptance Criteria

1. WHEN a member views their subscription status, THE System SHALL indicate features provided by their organization
2. THE System SHALL distinguish between organization-provided and self-purchased features
3. THE System SHALL display the organization admin contact for subscription-related questions
4. WHEN a member's organization subscription expires, THE System SHALL notify them 7 days in advance
5. THE System SHALL allow members to purchase individual add-ons not provided by their organization

### Requirement 6: Multi-Tier Organization Support

**User Story:** As a university admin, I want to manage subscriptions for multiple colleges under my university, so that I can provide centralized subscription management.

#### Acceptance Criteria

1. WHEN a university admin purchases subscriptions, THE System SHALL allow distributing seats across colleges
2. THE System SHALL support hierarchical license pools (university → college → members)
3. WHEN a college admin views their pool, THE System SHALL show seats allocated by the university admin
4. THE System SHALL allow university admins to reallocate seats between colleges
5. THE System SHALL aggregate billing at the university level while showing college-level usage

### Requirement 7: Seat Transfer and Reallocation

**User Story:** As an organization admin, I want to transfer subscription seats between members, so that I can optimize seat usage when members leave or join.

#### Acceptance Criteria

1. WHEN an admin removes a member's seat assignment, THE System SHALL immediately return the seat to the available pool
2. WHEN a member leaves the organization, THE System SHALL automatically unassign their seat after 30 days
3. THE System SHALL allow admins to manually transfer a seat from one member to another
4. WHEN a seat is transferred, THE System SHALL preserve the remaining subscription period
5. THE System SHALL track seat transfer history for audit purposes

### Requirement 8: Volume Discounts and Pricing Tiers

**User Story:** As an organization admin, I want to receive volume discounts for bulk purchases, so that I can reduce costs when buying for many members.

#### Acceptance Criteria

1. THE System SHALL apply tiered pricing: 10% off for 50+ seats, 20% off for 100+ seats, 30% off for 500+ seats
2. WHEN an admin adds more seats to an existing subscription, THE System SHALL recalculate pricing based on total seats
3. THE System SHALL display potential savings when admins increase seat counts
4. WHEN volume discount thresholds are crossed, THE System SHALL apply the discount to all seats, not just additional ones
5. THE System SHALL support custom enterprise pricing for organizations with 1000+ seats

### Requirement 9: Organization Subscription Renewal

**User Story:** As an organization admin, I want to manage subscription renewals for my organization, so that I can ensure continuous service for my members.

#### Acceptance Criteria

1. THE System SHALL send renewal reminders to admins 30, 15, and 7 days before expiration
2. WHEN an organization subscription expires, THE System SHALL provide a 7-day grace period before revoking member access
3. THE System SHALL allow admins to modify seat counts during renewal
4. WHEN auto-renewal is enabled, THE System SHALL automatically renew with the current seat count
5. THE System SHALL notify all affected members when an organization subscription is not renewed

### Requirement 10: Member Invitation and Onboarding

**User Story:** As an organization admin, I want to invite members to join and automatically assign them subscriptions, so that onboarding is seamless.

#### Acceptance Criteria

1. WHEN an admin invites a member, THE System SHALL send an invitation email with registration link
2. WHEN an invited member registers, THE System SHALL automatically assign them to the organization
3. THE System SHALL optionally auto-assign a subscription seat to new members if seats are available
4. WHEN a member accepts an invitation, THE System SHALL grant them entitlements based on admin-defined defaults
5. THE System SHALL track invitation status (pending, accepted, expired) for admin visibility

### Requirement 11: Payment and Invoicing

**User Story:** As an organization admin, I want to receive proper invoices for all subscription purchases, so that I can process payments through my organization's accounting system.

#### Acceptance Criteria

1. WHEN an admin completes a purchase, THE System SHALL generate a detailed invoice with organization details
2. THE System SHALL support multiple payment methods (Razorpay, bank transfer, purchase orders)
3. THE System SHALL allow admins to add GST/tax information for compliant invoicing
4. WHEN payment is successful, THE System SHALL email the invoice to the admin and organization billing contact
5. THE System SHALL maintain a downloadable invoice history for all transactions

### Requirement 12: Usage Analytics and Reporting

**User Story:** As an organization admin, I want to see how my members are using their subscriptions, so that I can make informed decisions about renewals and add-ons.

#### Acceptance Criteria

1. THE System SHALL display member login frequency and feature usage statistics
2. THE System SHALL show which features are most/least used by organization members
3. THE System SHALL identify members with low engagement for potential seat reallocation
4. THE System SHALL provide exportable reports in CSV/PDF format
5. THE System SHALL show ROI metrics (cost per active user, feature adoption rates)

### Requirement 13: Role-Based Subscription Management

**User Story:** As an organization admin, I want to assign different subscription levels to different member types, so that educators and students can have appropriate feature access.

#### Acceptance Criteria

1. WHEN an admin purchases subscriptions, THE System SHALL allow specifying separate plans for educators and students
2. THE System SHALL maintain separate license pools for each member type
3. WHEN assigning seats, THE System SHALL only allow assigning educator plans to educators and student plans to students
4. THE System SHALL display separate utilization metrics for educator and student subscriptions
5. THE System SHALL support mixed purchases (e.g., 10 educator seats + 100 student seats)

### Requirement 14: Subscription Upgrade and Downgrade

**User Story:** As an organization admin, I want to upgrade or downgrade my organization's subscription plan, so that I can adjust to changing needs.

#### Acceptance Criteria

1. WHEN an admin upgrades a plan, THE System SHALL apply the upgrade to all assigned members immediately
2. WHEN an admin downgrades, THE System SHALL schedule the downgrade for the next billing cycle
3. THE System SHALL calculate proration credits/charges for mid-cycle plan changes
4. WHEN a plan change affects seat limits, THE System SHALL notify the admin if current assignments exceed new limits
5. THE System SHALL preserve add-on purchases during plan changes

### Requirement 15: Emergency Access Revocation

**User Story:** As an organization admin, I want to immediately revoke a member's subscription access, so that I can respond to security incidents or policy violations.

#### Acceptance Criteria

1. WHEN an admin revokes a member's access, THE System SHALL immediately deactivate all their entitlements
2. THE System SHALL return the revoked seat to the available pool
3. THE System SHALL log the revocation with reason and timestamp for audit trails
4. WHEN access is revoked, THE System SHALL notify the affected member via email
5. THE System SHALL allow admins to restore access within 30 days without consuming a new seat

