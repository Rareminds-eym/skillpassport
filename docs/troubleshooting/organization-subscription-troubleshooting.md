# Organization Subscription Management - Troubleshooting Guide

## Overview

This guide helps diagnose and resolve common issues with the Organization Subscription Management feature.

## Quick Diagnostic Checklist

Before diving into specific issues, verify these basics:

- [ ] User is authenticated (valid JWT token)
- [ ] User has correct role (school_admin, college_admin, university_admin)
- [ ] User belongs to the organization they're trying to access
- [ ] API endpoint is correct and accessible
- [ ] Network connectivity is working

## Common Issues and Solutions

### 1. Authentication Issues

#### Issue: 401 Unauthorized Error

**Symptoms:**
- API returns `{"error": "Unauthorized"}`
- User redirected to login page unexpectedly

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Expired JWT token | Refresh the token or re-login |
| Missing Authorization header | Ensure `Authorization: Bearer <token>` is sent |
| Invalid token format | Check token is properly formatted |
| Supabase session expired | Call `supabase.auth.refreshSession()` |

**Debug Steps:**
```javascript
// Check if token exists and is valid
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('Token expires:', new Date(session?.expires_at * 1000));

// Refresh if needed
if (!session || session.expires_at * 1000 < Date.now()) {
  await supabase.auth.refreshSession();
}
```

### 2. Authorization Issues

#### Issue: 403 Forbidden Error

**Symptoms:**
- API returns `{"error": "Forbidden"}` or `{"error": "Access denied"}`
- User can login but cannot access subscription management

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| User not an admin | Verify user role in database |
| User not in organization | Check school_id/college_id assignment |
| RLS policy blocking | Review RLS policies |
| Wrong organization_id | Verify organization_id matches user's org |

**Debug Steps:**
```sql
-- Check user's role and organization
SELECT id, email, role, school_id, college_id 
FROM users 
WHERE id = 'user-uuid';

-- Check if user can access organization subscriptions
SELECT * FROM organization_subscriptions 
WHERE organization_id = 'org-uuid';
```


### 3. Subscription Purchase Issues

#### Issue: Payment Fails to Process

**Symptoms:**
- Razorpay modal closes without completing
- Payment shows as pending indefinitely
- Error: "Payment verification failed"

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Invalid Razorpay keys | Verify RAZORPAY_KEY_ID and SECRET |
| Webhook not configured | Set up webhook in Razorpay dashboard |
| Webhook secret mismatch | Update RAZORPAY_WEBHOOK_SECRET |
| Network timeout | Retry payment |

**Debug Steps:**
```bash
# Check webhook is receiving events
wrangler tail --env production | grep "razorpay"

# Verify Razorpay configuration
curl -u rzp_key_id:rzp_key_secret \
  https://api.razorpay.com/v1/orders

# Check payment status in Razorpay dashboard
```

#### Issue: Subscription Created but No License Pool

**Symptoms:**
- Subscription shows in dashboard
- No license pools available
- Cannot assign licenses

**Solution:**
```sql
-- Check if pool was created
SELECT * FROM license_pools 
WHERE organization_subscription_id = 'sub-uuid';

-- Manually create pool if missing
INSERT INTO license_pools (
  organization_subscription_id,
  organization_id,
  organization_type,
  member_type,
  allocated_seats,
  pool_name
) VALUES (
  'sub-uuid',
  'org-uuid',
  'school',
  'educator',
  100,
  'Default Pool'
);
```

### 4. License Assignment Issues

#### Issue: "No Available Seats" Error

**Symptoms:**
- Cannot assign license to user
- Error: "No available seats in pool"

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| All seats assigned | Purchase more seats or unassign existing |
| Pool allocation exhausted | Reallocate seats between pools |
| Stale seat count | Refresh pool data |

**Debug Steps:**
```sql
-- Check pool seat counts
SELECT 
  id,
  pool_name,
  allocated_seats,
  assigned_seats,
  available_seats
FROM license_pools 
WHERE organization_id = 'org-uuid';

-- Check for orphaned assignments
SELECT la.* 
FROM license_assignments la
LEFT JOIN license_pools lp ON la.license_pool_id = lp.id
WHERE lp.id IS NULL;

-- Recalculate assigned seats
UPDATE license_pools lp
SET assigned_seats = (
  SELECT COUNT(*) 
  FROM license_assignments la 
  WHERE la.license_pool_id = lp.id 
  AND la.status = 'active'
);
```

#### Issue: User Already Has Active Assignment

**Symptoms:**
- Error: "User already has an active license"
- Cannot assign second license to same user

**Solution:**
```sql
-- Check existing assignments
SELECT * FROM license_assignments 
WHERE user_id = 'user-uuid' 
AND status = 'active';

-- If duplicate, revoke one
UPDATE license_assignments 
SET status = 'revoked', 
    revoked_at = NOW(),
    revocation_reason = 'Duplicate assignment cleanup'
WHERE id = 'assignment-uuid';
```

### 5. Entitlement Issues

#### Issue: User Has License but No Access

**Symptoms:**
- License shows as assigned
- User cannot access features
- `hasOrganizationAccess` returns false

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Entitlements not created | Trigger entitlement sync |
| Entitlements inactive | Activate entitlements |
| Wrong feature keys | Verify feature key mapping |

**Debug Steps:**
```sql
-- Check user entitlements
SELECT * FROM user_entitlements 
WHERE user_id = 'user-uuid'
AND granted_by_organization = true;

-- Check license assignment
SELECT la.*, os.subscription_plan_id
FROM license_assignments la
JOIN organization_subscriptions os ON la.organization_subscription_id = os.id
WHERE la.user_id = 'user-uuid'
AND la.status = 'active';

-- Manually grant entitlements if missing
INSERT INTO user_entitlements (
  user_id,
  feature_key,
  granted_by_organization,
  organization_subscription_id,
  is_active
) VALUES (
  'user-uuid',
  'feature-key',
  true,
  'sub-uuid',
  true
);
```


### 6. Billing Dashboard Issues

#### Issue: Dashboard Shows Incorrect Data

**Symptoms:**
- Seat utilization percentage wrong
- Cost calculations incorrect
- Missing subscriptions

**Debug Steps:**
```sql
-- Verify subscription data
SELECT 
  os.id,
  os.total_seats,
  os.assigned_seats,
  os.final_amount,
  COUNT(la.id) as actual_assignments
FROM organization_subscriptions os
LEFT JOIN license_assignments la ON la.organization_subscription_id = os.id AND la.status = 'active'
WHERE os.organization_id = 'org-uuid'
GROUP BY os.id;

-- Check for data inconsistencies
SELECT os.id, os.assigned_seats, COUNT(la.id) as actual
FROM organization_subscriptions os
LEFT JOIN license_assignments la ON la.organization_subscription_id = os.id AND la.status = 'active'
GROUP BY os.id, os.assigned_seats
HAVING os.assigned_seats != COUNT(la.id);
```

#### Issue: Invoice Download Fails

**Symptoms:**
- 404 or 500 error when downloading invoice
- Empty PDF generated

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Invoice not found | Verify invoice ID exists |
| PDF service unavailable | Check external service status |
| Missing transaction data | Verify payment_transactions record |

### 7. Invitation Issues

#### Issue: Invitation Email Not Received

**Symptoms:**
- User reports no email received
- Invitation shows as "pending" in system

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Email in spam folder | Check spam/junk folder |
| Invalid email address | Verify email format |
| Email service down | Check email service status |
| Rate limited | Wait and retry |

**Debug Steps:**
```sql
-- Check invitation record
SELECT * FROM organization_invitations 
WHERE email = 'user@example.com'
ORDER BY created_at DESC;

-- Check invitation status
SELECT 
  email,
  status,
  created_at,
  expires_at,
  CASE WHEN expires_at < NOW() THEN 'EXPIRED' ELSE 'VALID' END as token_status
FROM organization_invitations
WHERE organization_id = 'org-uuid';
```

#### Issue: "Invalid or Expired Token" on Accept

**Symptoms:**
- User clicks invitation link
- Error: "Invalid or expired invitation token"

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Token expired (>7 days) | Resend invitation |
| Token already used | Check if already accepted |
| Token tampered | Resend invitation |
| Wrong token in URL | Verify link is correct |

### 8. Performance Issues

#### Issue: Dashboard Loads Slowly

**Symptoms:**
- Dashboard takes >5 seconds to load
- Timeout errors

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Too many subscriptions | Implement pagination |
| Missing indexes | Add database indexes |
| N+1 queries | Optimize with joins |
| Large payload | Implement data filtering |

**Debug Steps:**
```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM organization_subscriptions 
WHERE organization_id = 'org-uuid';

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
WHERE tablename IN ('organization_subscriptions', 'license_pools', 'license_assignments');
```

#### Issue: Bulk Operations Timeout

**Symptoms:**
- Bulk assign fails for large batches
- 504 Gateway Timeout

**Solution:**
- Reduce batch size to 50-100 users
- Use background job for very large operations
- Implement progress tracking

## Error Code Reference

| Code | Message | Meaning | Action |
|------|---------|---------|--------|
| ORG_001 | Invalid organization | Org ID not found | Verify organization exists |
| ORG_002 | Not authorized | User not admin | Check user role |
| SUB_001 | Subscription not found | Invalid sub ID | Verify subscription ID |
| SUB_002 | Subscription expired | Past end_date | Renew subscription |
| LIC_001 | No available seats | Pool exhausted | Add seats or unassign |
| LIC_002 | User already assigned | Duplicate assignment | Check existing assignments |
| PAY_001 | Payment failed | Razorpay error | Check payment details |
| PAY_002 | Webhook verification failed | Invalid signature | Check webhook secret |
| INV_001 | Invalid token | Token not found | Resend invitation |
| INV_002 | Token expired | Past expiry | Resend invitation |

## Log Analysis

### Finding Relevant Logs

```bash
# Cloudflare Worker logs
wrangler tail --env production --format pretty

# Filter by error
wrangler tail --env production | grep -i "error"

# Filter by endpoint
wrangler tail --env production | grep "org-subscriptions"
```

### Common Log Patterns

```
# Successful request
[INFO] POST /org-subscriptions/purchase - 201 - 234ms

# Authentication failure
[WARN] POST /org-subscriptions/purchase - 401 - Missing authorization header

# Database error
[ERROR] POST /license-assignments - 500 - Database connection failed

# Rate limited
[WARN] POST /license-assignments/bulk - 429 - Rate limit exceeded
```

## Escalation Path

1. **Level 1 - Self-Service**: Use this troubleshooting guide
2. **Level 2 - Support Team**: Contact support@company.com
3. **Level 3 - Engineering**: Escalate via Slack #backend-support
4. **Level 4 - On-Call**: Page via PagerDuty for critical issues

## Useful SQL Queries

```sql
-- Organization subscription summary
SELECT 
  os.organization_id,
  os.organization_type,
  COUNT(*) as subscription_count,
  SUM(os.total_seats) as total_seats,
  SUM(os.assigned_seats) as assigned_seats,
  SUM(os.final_amount) as total_revenue
FROM organization_subscriptions os
WHERE os.status = 'active'
GROUP BY os.organization_id, os.organization_type;

-- License utilization by organization
SELECT 
  os.organization_id,
  ROUND(SUM(os.assigned_seats)::numeric / NULLIF(SUM(os.total_seats), 0) * 100, 2) as utilization_pct
FROM organization_subscriptions os
WHERE os.status = 'active'
GROUP BY os.organization_id;

-- Recent assignment activity
SELECT 
  la.assigned_at,
  la.user_id,
  la.status,
  lp.pool_name,
  os.organization_id
FROM license_assignments la
JOIN license_pools lp ON la.license_pool_id = lp.id
JOIN organization_subscriptions os ON la.organization_subscription_id = os.id
ORDER BY la.assigned_at DESC
LIMIT 50;
```
