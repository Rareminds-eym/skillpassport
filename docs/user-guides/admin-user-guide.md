# Organization Subscription Management - Admin User Guide

## Introduction

This guide helps organization administrators (school admins, college admins, university admins) manage subscriptions for their members. You'll learn how to purchase subscriptions, assign licenses, manage billing, and invite new members.

## Getting Started

### Accessing Subscription Management

1. Log in to your admin dashboard
2. Navigate to **Subscription Management** in the sidebar
3. You'll see the Organization Subscription Dashboard

### Dashboard Overview

The dashboard shows:
- **Active Subscriptions**: Your current subscription plans
- **Seat Utilization**: How many licenses are assigned vs available
- **Upcoming Renewals**: Subscriptions expiring soon
- **Quick Actions**: Common tasks like adding seats or assigning licenses

---

## Purchasing Subscriptions

### Step 1: Select a Plan

1. Click **Purchase New Subscription** or navigate to **Subscription Plans**
2. Browse available plans (Basic, Professional, Enterprise)
3. Each plan shows:
   - Features included
   - Base price per seat
   - Volume discount tiers

### Step 2: Configure Seats

1. Enter the number of seats you need
2. Volume discounts are automatically applied:
   - **50-99 seats**: 10% discount
   - **100-499 seats**: 20% discount
   - **500+ seats**: 30% discount
3. Review the pricing breakdown:
   - Subtotal
   - Discount amount
   - GST (18%)
   - Final amount

### Step 3: Select Member Type

Choose who can receive licenses:
- **Educators Only**: For teacher/faculty subscriptions
- **Students Only**: For student subscriptions
- **Both**: Mixed allocation

### Step 4: Complete Payment

1. Review your order summary
2. Enter billing information
3. Complete payment via Razorpay
4. Receive confirmation email with invoice

---

## Managing License Pools

License pools help organize seat allocation by department, grade, or group.

### Creating a License Pool

1. Go to **License Pools** tab
2. Click **Create New Pool**
3. Enter pool details:
   - **Pool Name**: e.g., "Computer Science Department"
   - **Member Type**: Educator or Student
   - **Allocated Seats**: Number of seats for this pool
4. Click **Create Pool**

### Editing Pool Allocation

1. Find the pool in the list
2. Click **Edit**
3. Adjust the allocated seats
4. Click **Save Changes**

> **Note**: You cannot allocate more seats than available in your subscription.

### Auto-Assignment Rules

Set up automatic license assignment for new members:

1. Click **Configure Auto-Assignment** on a pool
2. Enable **Auto-assign to new members**
3. Set criteria (optional):
   - Department
   - Grade level
   - Role
4. Save settings

New members matching the criteria will automatically receive licenses.


---

## Assigning Licenses

### Assigning to Individual Members

1. Go to **Member Assignments** tab
2. Click **Assign License**
3. Search for the member by name or email
4. Select the license pool
5. Click **Assign**

The member will immediately receive access to subscription features.

### Bulk Assignment

For assigning licenses to multiple members at once:

1. Go to **Member Assignments** tab
2. Click **Bulk Assign**
3. Select members using checkboxes or filters:
   - By department
   - By grade
   - By role
4. Choose the target license pool
5. Click **Assign Selected**

> **Limit**: Maximum 100 members per bulk operation.

### Viewing Assignments

The Member Assignments tab shows:
- Member name and email
- Assigned pool
- Assignment date
- Status (Active, Suspended, Revoked)

Use filters to find specific assignments:
- By status
- By pool
- By date range

---

## Unassigning and Transferring Licenses

### Unassigning a License

When a member leaves or no longer needs access:

1. Find the member in **Member Assignments**
2. Click **Unassign** (or the trash icon)
3. Enter a reason (optional)
4. Confirm the action

The seat returns to the pool for reassignment.

### Transferring a License

To move a license from one member to another:

1. Find the current assignee
2. Click **Transfer**
3. Search for the new member
4. Confirm the transfer

The original member loses access immediately, and the new member gains access.

---

## Inviting New Members

### Sending Individual Invitations

1. Go to **Invitations** tab
2. Click **Invite Member**
3. Enter:
   - Email address
   - Member type (Educator/Student)
   - Custom message (optional)
4. Enable **Auto-assign license** if desired
5. Select target pool for auto-assignment
6. Click **Send Invitation**

### Bulk Invitations

1. Click **Bulk Invite**
2. Enter email addresses (one per line) or upload CSV
3. Select member type
4. Configure auto-assignment settings
5. Click **Send All Invitations**

### Managing Pending Invitations

View all pending invitations in the **Invitations** tab:
- **Resend**: Send the invitation email again
- **Cancel**: Revoke the invitation
- **Status**: Pending, Accepted, Expired, Cancelled

Invitations expire after 7 days.

---

## Billing and Invoices

### Billing Dashboard

The **Billing** tab shows:
- **Current Period Costs**: Total spending this billing cycle
- **Cost Breakdown**: Subscriptions vs add-ons
- **Seat Utilization**: Percentage of seats in use
- **Upcoming Renewals**: What's renewing soon

### Viewing Invoices

1. Go to **Billing** → **Invoice History**
2. See all past invoices with:
   - Invoice number
   - Date
   - Amount
   - Status (Paid, Pending)

### Downloading Invoices

1. Find the invoice in the list
2. Click **Download PDF**
3. Invoice includes:
   - Organization details
   - Line items
   - GST breakdown
   - Payment information

### Cost Projections

View projected monthly costs:
1. Go to **Billing** → **Cost Projection**
2. See estimated costs based on current subscriptions
3. Plan budget accordingly


---

## Subscription Management

### Adding More Seats

1. Go to **Subscriptions** tab
2. Find the subscription
3. Click **Add Seats**
4. Enter additional seat count
5. Review prorated cost
6. Complete payment

### Upgrading Your Plan

1. Find the subscription
2. Click **Upgrade**
3. Select the new plan
4. Review pricing changes
5. Confirm upgrade

Upgrades take effect immediately.

### Downgrading Your Plan

1. Find the subscription
2. Click **Downgrade**
3. Select the new plan
4. Review changes

> **Note**: Downgrade takes effect at next renewal. Ensure you have fewer assigned seats than the new plan allows.

### Cancelling a Subscription

1. Find the subscription
2. Click **Cancel**
3. Enter cancellation reason
4. Confirm cancellation

**What happens:**
- Subscription remains active until end date
- No automatic renewal
- Members retain access until expiration
- 7-day grace period after expiration

### Renewing a Subscription

Subscriptions with auto-renew enabled renew automatically. For manual renewal:

1. Find the subscription
2. Click **Renew**
3. Adjust seat count if needed
4. Complete payment

---

## Notifications and Alerts

### Expiration Warnings

You'll receive notifications:
- **30 days before**: Email reminder to admin
- **7 days before**: Dashboard alert + email
- **On expiration**: Final notice

### Low Seat Alerts

When seat utilization exceeds 90%, you'll see a dashboard alert suggesting to add more seats.

### Payment Failures

If a renewal payment fails:
1. Email notification sent
2. Dashboard alert displayed
3. 7-day grace period begins
4. Retry payment or update payment method

---

## Best Practices

### Seat Planning

- Purchase 10-15% more seats than current need for growth
- Review utilization monthly
- Take advantage of volume discounts

### License Management

- Use pools to organize by department/grade
- Enable auto-assignment for streamlined onboarding
- Regularly audit assignments for inactive members

### Billing

- Download invoices monthly for records
- Set calendar reminders for renewals
- Keep payment method up to date

---

## Frequently Asked Questions

**Q: Can I assign one license to multiple members?**
A: No, each license is for one member at a time. Transfer if needed.

**Q: What happens when a member's license expires?**
A: They lose access to subscription features but retain their account.

**Q: Can members purchase their own add-ons?**
A: Yes, members can purchase personal add-ons separate from organization subscriptions.

**Q: How do I get a refund?**
A: Contact support within 7 days of purchase for refund requests.

**Q: Can I change member type after purchase?**
A: No, but you can purchase a separate subscription for the other member type.

---

## Getting Help

- **Email**: support@skillpassport.com
- **Help Center**: help.skillpassport.com
- **Live Chat**: Available in dashboard (9 AM - 6 PM IST)
