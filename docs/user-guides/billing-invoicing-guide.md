# Organization Subscription - Billing and Invoicing Guide

## Overview

This guide covers billing, invoicing, and payment management for organization subscriptions. Learn how to manage payments, download invoices, and understand your billing cycle.

---

## Billing Dashboard

### Accessing the Billing Dashboard

1. Log in as organization admin
2. Go to **Subscription Management**
3. Click **Billing** tab

### Dashboard Components

#### Current Period Summary

Shows your spending for the current billing cycle:
- **Total Cost**: Combined subscription and add-on costs
- **Subscription Costs**: Base subscription charges
- **Add-on Costs**: Additional feature charges
- **Period**: Start and end dates

#### Seat Utilization

Visual breakdown of license usage:
- **Assigned Seats**: Currently in use
- **Available Seats**: Ready to assign
- **Utilization %**: Percentage of seats assigned

#### Upcoming Renewals

List of subscriptions renewing soon:
- Subscription name
- Renewal date
- Estimated cost
- Action buttons (Renew, Modify, Cancel)

---

## Understanding Your Invoice

### Invoice Components

Each invoice includes:

```
┌─────────────────────────────────────────────────────────┐
│ INVOICE                                                 │
│ Invoice #: INV-2024-001234                              │
│ Date: January 15, 2024                                  │
│ Due Date: January 15, 2024 (Paid)                       │
├─────────────────────────────────────────────────────────┤
│ BILL TO:                                                │
│ ABC School                                              │
│ 123 Education Street                                    │
│ Mumbai, Maharashtra 400001                              │
│ GSTIN: 27XXXXX1234X1ZX                                  │
├─────────────────────────────────────────────────────────┤
│ DESCRIPTION              QTY    RATE      AMOUNT        │
│ Professional Plan        100    ₹500      ₹50,000       │
│ (Annual - Educators)                                    │
│ Volume Discount (20%)                     -₹10,000      │
├─────────────────────────────────────────────────────────┤
│ Subtotal                                  ₹40,000       │
│ CGST (9%)                                 ₹3,600        │
│ SGST (9%)                                 ₹3,600        │
│ ─────────────────────────────────────────────────────── │
│ TOTAL                                     ₹47,200       │
├─────────────────────────────────────────────────────────┤
│ Payment Method: Credit Card ending in 4242              │
│ Transaction ID: pay_XXXXXXXXXXXXXX                      │
│ Status: PAID                                            │
└─────────────────────────────────────────────────────────┘
```

### Invoice Fields Explained

| Field | Description |
|-------|-------------|
| Invoice # | Unique invoice identifier |
| Date | Invoice generation date |
| Due Date | Payment due date |
| GSTIN | Your GST registration number |
| Description | Subscription plan and details |
| QTY | Number of seats |
| Rate | Price per seat |
| Amount | Line item total |
| Volume Discount | Discount based on seat count |
| CGST/SGST/IGST | GST components |
| Total | Final payable amount |

---

## Downloading Invoices

### Individual Invoice Download

1. Go to **Billing** → **Invoice History**
2. Find the invoice
3. Click **Download PDF**
4. Save to your device

### Bulk Invoice Download

1. Go to **Invoice History**
2. Select invoices using checkboxes
3. Click **Download Selected**
4. Receive ZIP file with all invoices

### Invoice Formats

- **PDF**: Standard format for records
- **CSV**: For accounting software import (coming soon)


---

## Payment Methods

### Supported Payment Methods

| Method | Description |
|--------|-------------|
| Credit Card | Visa, Mastercard, RuPay, Amex |
| Debit Card | All major banks |
| UPI | Google Pay, PhonePe, Paytm, BHIM |
| Net Banking | 50+ banks supported |
| Wallets | Paytm, PhonePe, Amazon Pay |

### Adding a Payment Method

1. Go to **Billing** → **Payment Methods**
2. Click **Add Payment Method**
3. Select method type
4. Enter details
5. Verify (OTP/3D Secure)
6. Save

### Setting Default Payment Method

1. Go to **Payment Methods**
2. Find the method
3. Click **Set as Default**

The default method is used for auto-renewals.

### Removing a Payment Method

1. Go to **Payment Methods**
2. Find the method
3. Click **Remove**

> **Note**: Cannot remove the only payment method if you have active subscriptions with auto-renew.

---

## Billing Cycles

### Monthly Billing

- Charged on the same date each month
- Example: Purchased Jan 15 → Renews Feb 15, Mar 15, etc.
- If date doesn't exist (e.g., Feb 30), charges on last day of month

### Annual Billing

- Charged once per year
- 15% discount compared to monthly
- Example: Purchased Jan 15, 2024 → Renews Jan 15, 2025

### Prorated Charges

When adding seats mid-cycle:

```
Prorated Cost = (Seat Price × Days Remaining) / Total Days in Period

Example:
- Seat Price: ₹500/month
- Days Remaining: 15
- Total Days: 30
- Prorated Cost: (500 × 15) / 30 = ₹250
```

---

## GST and Tax Information

### GST Registration

To receive GST invoices:
1. Go to **Billing** → **Tax Information**
2. Enter your GSTIN
3. Verify (automatic validation)
4. Save

### GST Rates

| Component | Rate |
|-----------|------|
| CGST | 9% |
| SGST | 9% |
| IGST | 18% |

- **Intra-state**: CGST + SGST (same state as seller)
- **Inter-state**: IGST (different state)

### HSN/SAC Codes

| Service | SAC Code |
|---------|----------|
| Software Subscription | 998314 |
| Cloud Services | 998315 |

---

## Cost Projections

### Viewing Projections

1. Go to **Billing** → **Cost Projection**
2. See estimated monthly cost
3. Breakdown by subscription and add-ons

### Projection Calculation

```
Monthly Projection = 
  Active Subscriptions (monthly equivalent) +
  Active Add-ons (monthly equivalent)
```

### Planning for Growth

Use projections to:
- Budget for upcoming periods
- Plan seat additions
- Evaluate upgrade options

---

## Payment Issues

### Failed Payments

When a payment fails:

1. **Immediate**: Email notification sent
2. **Dashboard**: Alert displayed
3. **Grace Period**: 7 days to resolve
4. **Retry**: Automatic retry after 24 hours

### Resolving Failed Payments

1. Check payment method is valid
2. Ensure sufficient funds/limit
3. Update payment method if needed
4. Manually retry payment

### Grace Period

During the 7-day grace period:
- Subscription remains active
- Members retain access
- Multiple retry attempts made
- After 7 days: Subscription suspended

### Disputed Charges

For billing disputes:
1. Contact support@skillpassport.com
2. Include invoice number
3. Describe the issue
4. Provide supporting documents

Resolution within 5-7 business days.

---

## Refunds

### Refund Policy

- **Within 7 days**: Full refund available
- **After 7 days**: Prorated refund (case-by-case)
- **Cancellation**: No refund for remaining period

### Requesting a Refund

1. Email support@skillpassport.com
2. Include:
   - Invoice number
   - Reason for refund
   - Organization name
3. Wait for review (2-3 business days)
4. Refund processed to original payment method

### Refund Timeline

| Payment Method | Refund Time |
|----------------|-------------|
| Credit Card | 5-7 business days |
| Debit Card | 5-10 business days |
| UPI | 2-3 business days |
| Net Banking | 5-7 business days |

---

## Billing Reports

### Available Reports

| Report | Description |
|--------|-------------|
| Monthly Summary | Costs by month |
| Subscription Detail | Per-subscription breakdown |
| Payment History | All transactions |
| Utilization Report | Seat usage over time |

### Generating Reports

1. Go to **Billing** → **Reports**
2. Select report type
3. Choose date range
4. Click **Generate**
5. Download PDF or CSV

### Scheduled Reports

Set up automatic reports:
1. Go to **Reports** → **Schedule**
2. Select report type
3. Choose frequency (weekly/monthly)
4. Enter email recipients
5. Save schedule

---

## Contact for Billing

### Billing Support

- **Email**: billing@skillpassport.com
- **Phone**: +91-XXXX-XXXXXX (Enterprise only)
- **Hours**: 9 AM - 6 PM IST, Monday-Friday

### Required Information

When contacting billing support, include:
- Organization name
- Admin email
- Invoice number (if applicable)
- Transaction ID (if applicable)
- Description of issue
