# Organization Subscription Management - Service Architecture

## Overview

This document describes the service layer architecture for the Organization Subscription Management feature. The architecture follows a modular design with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend Layer                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ Admin Dashboard │  │ Member View     │  │ Bulk Purchase Wizard        │  │
│  │ - Subscriptions │  │ - Org Features  │  │ - Plan Selection            │  │
│  │ - License Pools │  │ - Personal Add  │  │ - Seat Configuration        │  │
│  │ - Assignments   │  │ - Expiration    │  │ - Member Selection          │  │
│  │ - Billing       │  │                 │  │ - Payment                   │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────┬───────────────┘  │
└───────────┼────────────────────┼────────────────────────┼───────────────────┘
            │                    │                        │
            ▼                    ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API Gateway Layer                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Cloudflare Worker: payments-api                                      │    │
│  │ - Authentication Middleware                                          │    │
│  │ - Rate Limiting (5/min purchase, 10/min bulk, 100/min standard)     │    │
│  │ - Request Validation                                                 │    │
│  │ - Error Handling                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Service Layer                                     │
│                                                                              │
│  ┌─────────────────────────┐    ┌─────────────────────────┐                 │
│  │ OrganizationSubscription│    │ LicenseManagement       │                 │
│  │ Service                 │    │ Service                 │                 │
│  │ ─────────────────────── │    │ ─────────────────────── │                 │
│  │ • purchaseSubscription  │    │ • createLicensePool     │                 │
│  │ • calculateBulkPricing  │    │ • getLicensePools       │                 │
│  │ • getOrgSubscriptions   │    │ • assignLicense         │                 │
│  │ • updateSeatCount       │    │ • unassignLicense       │                 │
│  │ • cancelSubscription    │    │ • transferLicense       │                 │
│  │ • renewSubscription     │    │ • bulkAssignLicenses    │                 │
│  │ • upgradeSubscription   │    │ • configureAutoAssign   │                 │
│  └───────────┬─────────────┘    └───────────┬─────────────┘                 │
│              │                              │                                │
│  ┌───────────┴─────────────┐    ┌───────────┴─────────────┐                 │
│  │ OrganizationEntitlement │    │ OrganizationBilling     │                 │
│  │ Service                 │    │ Service                 │                 │
│  │ ─────────────────────── │    │ ─────────────────────── │                 │
│  │ • grantEntitlements     │    │ • getBillingDashboard   │                 │
│  │ • revokeEntitlements    │    │ • generateInvoice       │                 │
│  │ • hasOrganizationAccess │    │ • downloadInvoice       │                 │
│  │ • getUserEntitlements   │    │ • projectMonthlyCost    │                 │
│  │ • syncEntitlements      │    │ • calculateSeatCost     │                 │
│  └───────────┬─────────────┘    └───────────┬─────────────┘                 │
│              │                              │                                │
│  ┌───────────┴─────────────────────────────┴─────────────┐                  │
│  │ MemberInvitationService                               │                  │
│  │ ───────────────────────────────────────────────────── │                  │
│  │ • inviteMember          • acceptInvitation            │                  │
│  │ • bulkInviteMembers     • getPendingInvitations       │                  │
│  │ • resendInvitation      • cancelInvitation            │                  │
│  └───────────────────────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Data Access Layer                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Supabase Client                                                      │    │
│  │ - Connection Pooling                                                 │    │
│  │ - Row-Level Security                                                 │    │
│  │ - Real-time Subscriptions                                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           External Services                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │ Razorpay        │    │ Email Service   │    │ PDF Generator   │         │
│  │ - Payments      │    │ - Invitations   │    │ - Invoices      │         │
│  │ - Subscriptions │    │ - Notifications │    │                 │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Service Descriptions


### 1. OrganizationSubscriptionService

**Location:** `src/services/organization/organizationSubscriptionService.ts`

**Responsibilities:**
- Purchase and manage organization subscriptions
- Calculate volume-based pricing with discounts
- Handle subscription lifecycle (create, renew, cancel, upgrade/downgrade)
- Integrate with Razorpay for payment processing

**Key Methods:**

| Method | Description | Input | Output |
|--------|-------------|-------|--------|
| `purchaseSubscription` | Create new org subscription | OrgSubscriptionPurchaseRequest | OrganizationSubscription |
| `calculateBulkPricing` | Calculate pricing with discounts | planId, seatCount | PricingBreakdown |
| `getOrganizationSubscriptions` | Get all subscriptions for org | organizationId, filters | OrganizationSubscription[] |
| `updateSeatCount` | Add/reduce seats | subscriptionId, newCount | OrganizationSubscription |
| `cancelSubscription` | Cancel with reason | subscriptionId, reason | void |
| `renewSubscription` | Renew subscription | subscriptionId, options | OrganizationSubscription |
| `upgradeSubscription` | Upgrade to higher plan | subscriptionId, newPlanId | OrganizationSubscription |
| `downgradeSubscription` | Downgrade to lower plan | subscriptionId, newPlanId | OrganizationSubscription |

**Dependencies:**
- Supabase client for database operations
- Razorpay SDK for payment processing
- LicenseManagementService for pool creation

### 2. LicenseManagementService

**Location:** `src/services/organization/licenseManagementService.ts`

**Responsibilities:**
- Create and manage license pools
- Assign/unassign licenses to members
- Handle bulk operations
- Configure auto-assignment rules
- Track license transfers

**Key Methods:**

| Method | Description | Input | Output |
|--------|-------------|-------|--------|
| `createLicensePool` | Create new pool | CreatePoolRequest | LicensePool |
| `getLicensePools` | Get pools for org | organizationId | LicensePool[] |
| `updatePoolAllocation` | Update seat allocation | poolId, newAllocation | LicensePool |
| `assignLicense` | Assign to single user | poolId, userId, assignedBy | LicenseAssignment |
| `unassignLicense` | Revoke license | assignmentId, reason | void |
| `transferLicense` | Transfer between users | fromUserId, toUserId, transferredBy | LicenseAssignment |
| `bulkAssignLicenses` | Assign to multiple users | poolId, userIds[], assignedBy | BulkAssignResult |
| `configureAutoAssignment` | Set auto-assign rules | poolId, criteria | LicensePool |
| `getAvailableSeats` | Check available seats | organizationId, memberType | number |

**Dependencies:**
- Supabase client for database operations
- OrganizationEntitlementService for granting access

### 3. OrganizationEntitlementService

**Location:** `src/services/organization/organizationEntitlementService.ts`

**Responsibilities:**
- Grant entitlements when licenses are assigned
- Revoke entitlements when licenses are unassigned
- Check organization-provided access
- Sync entitlements with subscription changes
- Separate org-provided vs self-purchased entitlements

**Key Methods:**

| Method | Description | Input | Output |
|--------|-------------|-------|--------|
| `grantEntitlementsFromAssignment` | Grant access from license | LicenseAssignment | UserEntitlement[] |
| `revokeEntitlementsFromAssignment` | Revoke access | assignmentId | void |
| `hasOrganizationAccess` | Check org-provided access | userId, featureKey | boolean |
| `getUserEntitlements` | Get all user entitlements | userId | { orgProvided, selfPurchased } |
| `syncOrganizationEntitlements` | Sync on subscription change | subscriptionId | void |
| `bulkRevokeEntitlements` | Revoke multiple | assignmentIds[] | void |
| `getOrganizationEntitlementStats` | Get stats for org | organizationId | EntitlementStats |

**Dependencies:**
- Supabase client for database operations


### 4. OrganizationBillingService

**Location:** `src/services/organization/organizationBillingService.ts`

**Responsibilities:**
- Provide billing dashboard data
- Generate and download invoices
- Project monthly costs
- Calculate prorated costs for seat additions
- Track payment history

**Key Methods:**

| Method | Description | Input | Output |
|--------|-------------|-------|--------|
| `getBillingDashboard` | Get comprehensive billing data | organizationId | BillingDashboard |
| `generateInvoice` | Create invoice for transaction | transactionId | Invoice |
| `downloadInvoice` | Download invoice PDF | invoiceId | Blob |
| `getInvoiceHistory` | Get past invoices | organizationId, pagination | Invoice[] |
| `projectMonthlyCost` | Estimate monthly cost | organizationId | number |
| `calculateSeatAdditionCost` | Calculate prorated cost | subscriptionId, additionalSeats | CostBreakdown |

**Dependencies:**
- Supabase client for database operations
- PDF generation service for invoices
- External API for invoice downloads

### 5. MemberInvitationService

**Location:** `src/services/organization/memberInvitationService.ts`

**Responsibilities:**
- Send member invitations
- Handle bulk invitations
- Process invitation acceptance
- Auto-assign licenses on acceptance
- Manage invitation lifecycle

**Key Methods:**

| Method | Description | Input | Output |
|--------|-------------|-------|--------|
| `inviteMember` | Send single invitation | InviteMemberRequest | OrganizationInvitation |
| `bulkInviteMembers` | Send multiple invitations | InviteMemberRequest[] | OrganizationInvitation[] |
| `resendInvitation` | Resend expired invitation | invitationId | void |
| `cancelInvitation` | Cancel pending invitation | invitationId | void |
| `acceptInvitation` | Accept with token | token, userId | AcceptResult |
| `getPendingInvitations` | Get pending for org | organizationId | OrganizationInvitation[] |
| `getInvitationByToken` | Lookup by token | token | OrganizationInvitation |

**Dependencies:**
- Supabase client for database operations
- Email service for sending invitations
- LicenseManagementService for auto-assignment

## Data Flow Diagrams

### Purchase Flow

```
┌──────┐    ┌────────────┐    ┌─────────────────┐    ┌─────────┐    ┌──────────┐
│Admin │───▶│CalculatePrice│───▶│ CreateRazorpay │───▶│ Payment │───▶│ Create   │
│      │    │ (discounts)  │    │ Order          │    │ Gateway │    │ Records  │
└──────┘    └────────────┘    └─────────────────┘    └─────────┘    └──────────┘
                                                                          │
                                                                          ▼
                                                                    ┌──────────┐
                                                                    │ Create   │
                                                                    │ License  │
                                                                    │ Pool     │
                                                                    └──────────┘
```

### License Assignment Flow

```
┌──────┐    ┌────────────┐    ┌─────────────────┐    ┌──────────────┐
│Admin │───▶│ Check Seats │───▶│ Create         │───▶│ Grant        │
│      │    │ Available   │    │ Assignment     │    │ Entitlements │
└──────┘    └────────────┘    └─────────────────┘    └──────────────┘
                                      │                      │
                                      ▼                      ▼
                               ┌──────────────┐       ┌──────────────┐
                               │ Update Pool  │       │ Member Gets  │
                               │ Seat Count   │       │ Access       │
                               └──────────────┘       └──────────────┘
```

### Invitation Acceptance Flow

```
┌────────┐    ┌────────────┐    ┌─────────────────┐    ┌──────────────┐
│Invitee │───▶│ Verify     │───▶│ Link to        │───▶│ Auto-Assign  │
│        │    │ Token      │    │ Organization   │    │ License?     │
└────────┘    └────────────┘    └─────────────────┘    └──────────────┘
                                                              │
                                      ┌───────────────────────┴───────────────────────┐
                                      │                                               │
                                      ▼                                               ▼
                               ┌──────────────┐                                ┌──────────────┐
                               │ Yes: Assign  │                                │ No: Manual   │
                               │ License      │                                │ Assignment   │
                               └──────────────┘                                └──────────────┘
```

## Error Handling Strategy

### Error Categories

| Category | HTTP Code | Handling |
|----------|-----------|----------|
| Validation | 400 | Return detailed field errors |
| Authentication | 401 | Redirect to login |
| Authorization | 403 | Show access denied message |
| Not Found | 404 | Show resource not found |
| Conflict | 409 | Show conflict details (e.g., duplicate) |
| Rate Limited | 429 | Show retry-after time |
| Server Error | 500 | Log error, show generic message |

### Retry Strategy

- Payment operations: 3 retries with exponential backoff
- Database operations: 2 retries with 100ms delay
- External API calls: 3 retries with 500ms delay

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: RLS policies enforce organization-level access
3. **Rate Limiting**: Prevents abuse of bulk operations
4. **Input Validation**: All inputs sanitized and validated
5. **Audit Trail**: All operations logged with user context

## Performance Targets

| Operation | Target | Measurement |
|-----------|--------|-------------|
| API Response | < 200ms | P95 latency |
| Dashboard Load | < 2s | Time to interactive |
| Bulk Assignment (100) | < 5s | Total operation time |
| Invoice Generation | < 3s | PDF creation time |
