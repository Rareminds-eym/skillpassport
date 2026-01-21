# UAT Pilot Organization Test Scenarios

## Overview

This document outlines the User Acceptance Testing (UAT) scenarios to be conducted with 2-3 pilot organizations before production deployment of the Organization Subscription Management feature.

## Pilot Organization Selection Criteria

### Recommended Pilot Organizations

1. **Small Organization** (10-50 members): Test basic workflows
2. **Medium Organization** (100-500 members): Test bulk operations
3. **Large Organization** (500+ members): Test scalability and performance

### Selection Checklist

- [ ] Organization has active admin willing to participate
- [ ] Mix of educators and students
- [ ] Existing familiarity with subscription features
- [ ] Availability for 2-week testing period
- [ ] Willingness to provide detailed feedback

---

## Test Scenarios by User Role

### Admin User Scenarios

#### Scenario A1: First-Time Purchase Flow

**Objective**: Validate complete purchase workflow for new organization subscription

**Steps**:

1. Navigate to subscription plans page with `?mode=organization`
2. Select a subscription plan (e.g., Professional)
3. Configure seat count (start with 10 seats)
4. Select member type (educators, students, or both)
5. Review pricing breakdown with volume discounts
6. Complete payment via Razorpay
7. Verify subscription appears in dashboard

**Expected Results**:

- [ ] Volume discounts applied correctly
- [ ] GST calculated at 18%
- [ ] Payment processed successfully
- [ ] Subscription visible in dashboard immediately
- [ ] License pool created automatically

**Acceptance Criteria**:

- Purchase completes in under 2 minutes
- No errors during payment flow
- Correct pricing displayed at each step

---

#### Scenario A2: License Pool Management

**Objective**: Validate license pool creation and configuration

**Steps**:

1. Access License Pool Manager from dashboard
2. Create new pool named "Computer Science Department"
3. Allocate 5 seats to the pool
4. Configure auto-assignment for new members
5. View pool utilization metrics

**Expected Results**:

- [ ] Pool created successfully
- [ ] Seat allocation reflected in dashboard
- [ ] Auto-assignment rules saved
- [ ] Utilization shows 0% initially

**Acceptance Criteria**:

- Pool creation under 5 seconds
- Clear feedback on successful creation
- Accurate seat count display

---

#### Scenario A3: Individual License Assignment

**Objective**: Validate single member license assignment

**Steps**:

1. Navigate to Member Assignments section
2. Search for a specific member by name
3. Select member and click "Assign License"
4. Choose license pool
5. Confirm assignment
6. Verify member now has access

**Expected Results**:

- [ ] Member search returns results quickly
- [ ] Assignment completes successfully
- [ ] Seat count decrements by 1
- [ ] Member receives access immediately

**Acceptance Criteria**:

- Search results in under 1 second
- Assignment completes in under 3 seconds
- Member can access features within 30 seconds

---

#### Scenario A4: Bulk License Assignment

**Objective**: Validate bulk assignment of 50+ licenses

**Steps**:

1. Navigate to Member Assignments
2. Use filters to select members (e.g., all Grade 10 students)
3. Select 50 members using bulk selection
4. Click "Bulk Assign"
5. Confirm assignment
6. Monitor progress

**Expected Results**:

- [ ] Bulk selection works correctly
- [ ] Progress indicator shown during assignment
- [ ] All 50 assignments complete successfully
- [ ] Seat count decrements by 50

**Acceptance Criteria**:

- Bulk assignment of 50 members under 30 seconds
- No partial failures
- Clear success/error reporting

---

#### Scenario A5: License Revocation

**Objective**: Validate license revocation workflow

**Steps**:

1. Find an assigned member
2. Click "Revoke License"
3. Enter revocation reason
4. Confirm revocation
5. Verify member loses access
6. Verify seat returns to pool

**Expected Results**:

- [ ] Revocation requires confirmation
- [ ] Reason is recorded
- [ ] Member access removed immediately
- [ ] Seat count increments by 1

**Acceptance Criteria**:

- Revocation completes in under 5 seconds
- Audit trail shows revocation details
- Member cannot access features after revocation

---

#### Scenario A6: License Transfer

**Objective**: Validate license transfer between members

**Steps**:

1. Select an assigned member
2. Click "Transfer License"
3. Search for destination member
4. Confirm transfer
5. Verify source member loses access
6. Verify destination member gains access

**Expected Results**:

- [ ] Transfer completes atomically
- [ ] Source member access revoked
- [ ] Destination member access granted
- [ ] Seat count unchanged

**Acceptance Criteria**:

- Transfer completes in under 5 seconds
- No gap in access during transfer
- Transfer history recorded

---

#### Scenario A7: Member Invitation with Auto-Assignment

**Objective**: Validate invitation flow with automatic license assignment

**Steps**:

1. Navigate to Invitation Manager
2. Enter new member email
3. Select member type (educator/student)
4. Enable "Auto-assign subscription"
5. Select target license pool
6. Send invitation
7. Have member accept invitation
8. Verify automatic license assignment

**Expected Results**:

- [ ] Invitation email sent successfully
- [ ] Member can accept via link
- [ ] License assigned automatically on acceptance
- [ ] Member has immediate access

**Acceptance Criteria**:

- Invitation email delivered within 1 minute
- Acceptance flow completes in under 30 seconds
- Auto-assignment works without admin intervention

---

#### Scenario A8: Billing Dashboard Review

**Objective**: Validate billing information accuracy

**Steps**:

1. Navigate to Billing Dashboard
2. Review current period costs
3. Check seat utilization metrics
4. View payment history
5. Download an invoice
6. Review upcoming renewals

**Expected Results**:

- [ ] Costs calculated correctly
- [ ] Utilization percentages accurate
- [ ] Payment history complete
- [ ] Invoice downloads as PDF
- [ ] Renewal dates correct

**Acceptance Criteria**:

- Dashboard loads in under 2 seconds
- Invoice PDF generates in under 5 seconds
- All financial data accurate to the rupee

---

#### Scenario A9: Subscription Upgrade

**Objective**: Validate plan upgrade workflow

**Steps**:

1. Select active subscription
2. Click "Upgrade Plan"
3. Choose higher tier plan
4. Review prorated pricing
5. Complete payment
6. Verify new features available

**Expected Results**:

- [ ] Prorated amount calculated correctly
- [ ] Upgrade completes successfully
- [ ] New features available immediately
- [ ] Existing assignments preserved

**Acceptance Criteria**:

- Upgrade completes in under 2 minutes
- No disruption to existing members
- Correct prorated billing

---

#### Scenario A10: Add Additional Seats

**Objective**: Validate seat addition workflow

**Steps**:

1. Select active subscription
2. Click "Add Seats"
3. Enter additional seat count (e.g., 20)
4. Review prorated pricing
5. Complete payment
6. Verify new seats available

**Expected Results**:

- [ ] Prorated amount for remaining period
- [ ] Volume discount recalculated if applicable
- [ ] New seats available immediately
- [ ] Pool allocation can be updated

**Acceptance Criteria**:

- Seat addition under 2 minutes
- Correct prorated calculation
- Immediate availability of new seats

---

### Member User Scenarios

#### Scenario M1: View Organization-Provided Features

**Objective**: Validate member view of organization features

**Steps**:

1. Log in as assigned member
2. Navigate to subscription page
3. View organization-provided features
4. Check "Managed by" badge
5. View expiration date

**Expected Results**:

- [ ] Features clearly listed
- [ ] Organization name displayed
- [ ] "Managed by [Org]" badge visible
- [ ] Expiration date shown

**Acceptance Criteria**:

- Page loads in under 2 seconds
- Clear distinction from personal purchases
- Accurate expiration information

---

#### Scenario M2: Access Organization Feature

**Objective**: Validate feature access works correctly

**Steps**:

1. Log in as assigned member
2. Navigate to a feature (e.g., AI Tutor)
3. Use the feature
4. Verify full functionality

**Expected Results**:

- [ ] Feature accessible without payment prompt
- [ ] Full functionality available
- [ ] No errors or access denied messages

**Acceptance Criteria**:

- Feature loads in under 3 seconds
- Complete functionality available
- Smooth user experience

---

#### Scenario M3: Purchase Personal Add-on

**Objective**: Validate personal add-on purchase alongside org subscription

**Steps**:

1. Log in as assigned member
2. Navigate to available add-ons
3. Select an add-on not in org subscription
4. Complete personal purchase
5. Verify add-on access

**Expected Results**:

- [ ] Add-ons clearly marked as personal purchase
- [ ] Payment processed to member's account
- [ ] Add-on access granted immediately
- [ ] Separate from org-provided features

**Acceptance Criteria**:

- Clear separation of org vs personal
- Personal purchase completes successfully
- No confusion about billing

---

#### Scenario M4: Expiration Warning

**Objective**: Validate expiration warnings display correctly

**Steps**:

1. (Admin) Set subscription to expire in 7 days
2. Log in as assigned member
3. Check for expiration warning
4. Verify warning message content

**Expected Results**:

- [ ] Warning banner displayed
- [ ] Days remaining shown
- [ ] Contact admin suggestion provided
- [ ] Warning severity appropriate (critical for <7 days)

**Acceptance Criteria**:

- Warning visible on dashboard
- Accurate countdown
- Clear call to action

---

## Performance Benchmarks

| Operation            | Target | Maximum |
| -------------------- | ------ | ------- |
| Dashboard Load       | <2s    | 5s      |
| License Assignment   | <3s    | 10s     |
| Bulk Assignment (50) | <30s   | 60s     |
| Invoice Download     | <5s    | 15s     |
| Search Results       | <1s    | 3s      |
| Payment Processing   | <30s   | 60s     |

---

## Feedback Collection Template

### After Each Scenario

```
Scenario: [Name]
Completed: [ ] Yes [ ] No [ ] Partial
Time Taken: _____ minutes
Issues Encountered:
-
-
Suggestions:
-
-
Rating (1-5): ___
```

### Overall Feedback

```
Organization: ________________
Admin Name: ________________
Testing Period: ________________

Overall Experience (1-5): ___

What worked well:
1.
2.
3.

What needs improvement:
1.
2.
3.

Critical Issues:
1.
2.

Feature Requests:
1.
2.

Would you recommend this feature? [ ] Yes [ ] No
```

---

## Issue Tracking

### Issue Template

```
Issue ID: UAT-###
Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
Scenario:
Description:
Steps to Reproduce:
Expected Result:
Actual Result:
Screenshots/Logs:
Assigned To:
Status: [ ] Open [ ] In Progress [ ] Resolved [ ] Won't Fix
```

### Severity Definitions

- **Critical**: Blocks core functionality, data loss, security issue
- **High**: Major feature broken, significant UX issue
- **Medium**: Feature works but with issues, minor UX problems
- **Low**: Cosmetic issues, minor inconveniences

---

## Sign-Off Checklist

### Per Pilot Organization

- [ ] All admin scenarios completed
- [ ] All member scenarios completed
- [ ] Performance benchmarks met
- [ ] Feedback collected
- [ ] Critical issues resolved
- [ ] Admin sign-off obtained

### Overall UAT Sign-Off

- [ ] All pilot organizations completed testing
- [ ] Critical issues resolved
- [ ] High-priority issues addressed or documented
- [ ] Improvement backlog created
- [ ] Stakeholder approval obtained
- [ ] Ready for production deployment
