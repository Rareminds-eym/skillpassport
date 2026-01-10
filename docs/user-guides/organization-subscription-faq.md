# Organization Subscription Management - FAQ

## General Questions

### What is organization subscription management?

Organization subscription management allows schools, colleges, and universities to purchase subscriptions in bulk for their educators and students. Admins can manage licenses, assign access, and handle billing from a central dashboard.

### Who can purchase organization subscriptions?

Only organization administrators (school_admin, college_admin, university_admin) can purchase and manage organization subscriptions.

### What's the difference between B2B and B2C subscriptions?

| Aspect | B2B (Organization) | B2C (Individual) |
|--------|-------------------|------------------|
| Purchaser | Organization admin | Individual user |
| Payment | Organization pays | User pays |
| Management | Admin assigns licenses | Self-managed |
| Billing | Centralized invoicing | Individual receipts |
| Discounts | Volume discounts available | Standard pricing |

---

## Pricing and Discounts

### What volume discounts are available?

| Seat Count | Discount |
|------------|----------|
| 1-49 seats | 0% |
| 50-99 seats | 10% |
| 100-499 seats | 20% |
| 500+ seats | 30% |

### How is pricing calculated?

```
Subtotal = Base Price × Seat Count
Discount = Subtotal × Discount Percentage
Tax = (Subtotal - Discount) × 18% GST
Final Amount = Subtotal - Discount + Tax
```

### Can I get a custom quote for large orders?

Yes, contact sales@skillpassport.com for orders over 1,000 seats.

### Are there annual billing discounts?

Yes, annual billing provides an additional 15% discount compared to monthly billing.

---

## License Management

### How many licenses can I purchase?

There's no upper limit. Volume discounts apply automatically for larger purchases.

### Can I assign one license to multiple users?

No, each license is assigned to one user at a time. To give access to another user, you must transfer or unassign the license first.

### What happens to unused licenses?

Unused licenses remain available in your pool until the subscription expires. They don't roll over to the next billing period.

### Can I reduce the number of seats?

Yes, but:
- You must first unassign licenses to free up seats
- Seat reduction takes effect at next renewal
- No refund for current period

### How do I transfer a license between users?

1. Go to Member Assignments
2. Find the current assignee
3. Click Transfer
4. Select the new user
5. Confirm

The transfer is immediate.


---

## Billing and Payments

### What payment methods are accepted?

- Credit/Debit Cards (Visa, Mastercard, RuPay)
- UPI
- Net Banking
- Wallets (Paytm, PhonePe)

All payments are processed securely through Razorpay.

### How do I get an invoice?

1. Go to Billing → Invoice History
2. Find the invoice
3. Click Download PDF

Invoices include GST details for tax purposes.

### Can I get a GST invoice?

Yes, all invoices include:
- GSTIN (if provided)
- HSN/SAC codes
- Tax breakdown (CGST, SGST, or IGST)

### What happens if payment fails?

1. You'll receive an email notification
2. A 7-day grace period begins
3. Retry payment or update payment method
4. After grace period, subscription is suspended

### Can I get a refund?

Refund requests within 7 days of purchase are reviewed on a case-by-case basis. Contact support@skillpassport.com.

---

## Subscription Lifecycle

### When does my subscription start?

Immediately after successful payment.

### What happens when my subscription expires?

1. **7 days before**: Warning notifications sent
2. **On expiration**: 7-day grace period begins
3. **After grace period**: 
   - All licenses are suspended
   - Members lose access to features
   - Data is preserved for 30 days

### How do I renew my subscription?

**Auto-renewal (default):**
- Payment is automatically charged before expiration
- No action needed

**Manual renewal:**
1. Go to Subscriptions
2. Click Renew
3. Complete payment

### Can I cancel my subscription?

Yes:
1. Go to Subscriptions
2. Click Cancel
3. Provide reason
4. Confirm

Cancellation takes effect at end of current period. No refund for remaining time.

---

## Member Access

### How do members get access?

Two ways:
1. **Admin assigns license**: Admin manually assigns from dashboard
2. **Auto-assignment**: New members automatically get licenses based on rules

### What features do members get?

Members get all features included in the subscription plan. View plan details in Subscription Management.

### Can members purchase their own add-ons?

Yes, members can purchase personal add-ons separate from organization subscriptions. These are billed directly to the member.

### What happens when a member leaves the organization?

1. Admin should unassign their license
2. Member loses access to organization features
3. Personal add-ons remain active
4. License returns to pool for reassignment

---

## Invitations

### How long are invitations valid?

7 days from sending. After expiration, resend the invitation.

### Can I resend an invitation?

Yes, click Resend on any pending invitation. This generates a new token.

### What if someone doesn't receive the invitation email?

1. Check spam/junk folder
2. Verify email address is correct
3. Resend the invitation
4. Contact support if issue persists

### Can I cancel an invitation?

Yes, click Cancel on any pending invitation. The invitation link becomes invalid.

---

## Technical Questions

### Which browsers are supported?

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Is mobile access supported?

Yes, the dashboard is fully responsive and works on:
- iOS Safari
- Android Chrome
- Mobile browsers

### Is there an API available?

Yes, see the API documentation for integration options. API access requires authentication.

### How is data secured?

- All data encrypted in transit (TLS 1.3)
- Data encrypted at rest
- Row-level security in database
- Regular security audits
- SOC 2 Type II compliant

---

## Troubleshooting

### "I can't assign licenses"

Check:
- You have admin role
- Seats are available in the pool
- User isn't already assigned

### "Member can't access features"

Check:
- License is assigned and active
- Subscription hasn't expired
- Member is logged in correctly

### "Payment keeps failing"

Try:
- Different payment method
- Check card limits
- Contact your bank
- Try again later

### "Dashboard loads slowly"

Try:
- Refresh the page
- Clear browser cache
- Check internet connection
- Try a different browser

---

## Contact and Support

### How do I contact support?

- **Email**: support@skillpassport.com
- **Help Center**: help.skillpassport.com
- **Live Chat**: Available 9 AM - 6 PM IST

### What information should I include in support requests?

- Organization name
- Admin email
- Subscription ID (if applicable)
- Screenshot of error (if applicable)
- Steps to reproduce the issue

### Is there phone support?

Phone support is available for Enterprise plans. Contact your account manager.
