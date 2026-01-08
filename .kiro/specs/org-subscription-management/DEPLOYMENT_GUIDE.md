# Deployment Guide: Organization Subscription Management

**Date**: January 8, 2026  
**Status**: Ready for Deployment  
**Estimated Time**: 30-45 minutes

---

## Overview

This guide walks through deploying the complete organization subscription management system, including database migrations, Cloudflare Worker, and frontend integration.

---

## Prerequisites Checklist

Before starting deployment:

- [ ] Supabase project access (admin credentials)
- [ ] Cloudflare account with Workers enabled
- [ ] Wrangler CLI installed (`npm install -g wrangler`)
- [ ] Wrangler authenticated (`wrangler login`)
- [ ] Database backup completed
- [ ] Staging environment available for testing

---

## Phase 1: Database Deployment

### Step 1: Backup Database

```bash
# Create backup before running migrations
pg_dump -h your-supabase-host -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Apply Migrations

Run migrations in this exact order:

```bash
# Navigate to project root
cd /path/to/project

# Apply migrations via Supabase CLI or Dashboard
supabase db push

# Or manually via psql:
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20260108_create_organization_subscriptions.sql
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20260108_create_license_pools.sql
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20260108_create_license_assignments.sql
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20260108_create_organization_invitations.sql
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20260108_extend_subscriptions_table.sql
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20260108_extend_user_entitlements_table.sql
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20260108_extend_payment_transactions_table.sql
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20260108_extend_addon_pending_orders_table.sql
```

### Step 3: Verify Database

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'organization_subscriptions',
  'license_pools',
  'license_assignments',
  'organization_invitations'
);

-- Should return 4 rows

-- Check columns added
SELECT column_name FROM information_schema.columns
WHERE table_name = 'subscriptions'
AND column_name IN ('organization_id', 'seat_count', 'is_organization_subscription');

-- Should return 3 rows

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename LIKE 'organization_%' OR tablename LIKE 'license_%';

-- Should return 20+ indexes

-- Check functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%organization%';

-- Should return 40+ functions
```

### Step 4: Test Database Functions

```sql
-- Test volume discount calculation
SELECT calculate_volume_discount(50);  -- Should return 10
SELECT calculate_volume_discount(100); -- Should return 20
SELECT calculate_volume_discount(500); -- Should return 30

-- Test seat availability
SELECT * FROM get_organization_subscriptions_summary('school-123', 'school');
```

---

## Phase 2: Cloudflare Worker Deployment

### Step 1: Navigate to Worker Directory

```bash
cd cloudflare-workers/payments-api
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Verify Configuration

Check `wrangler.toml`:

```toml
name = "payments-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "production"
STORAGE_API_URL = "https://storage-api.dark-mode-d021.workers.dev"

# Service bindings
[[services]]
binding = "EMAIL_SERVICE"
service = "email-api"

[[services]]
binding = "STORAGE_SERVICE"
service = "storage-api"
```

### Step 4: Set Secrets (if not already set)

```bash
# Required secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put RAZORPAY_KEY_ID
wrangler secret put RAZORPAY_KEY_SECRET

# Optional secrets
wrangler secret put RAZORPAY_WEBHOOK_SECRET
wrangler secret put TEST_RAZORPAY_KEY_ID
wrangler secret put TEST_RAZORPAY_KEY_SECRET
```

### Step 5: Test Locally

```bash
# Start local development server
npm run dev

# In another terminal, test endpoints
curl http://localhost:8787/health

# Should show all organization endpoints in the list
```

### Step 6: Deploy to Production

```bash
# Deploy
wrangler deploy

# Output should show:
# ✨ Successfully published your script to
#    https://payments-api.your-account.workers.dev
```

### Step 7: Verify Deployment

```bash
# Test health endpoint
curl https://payments-api.your-account.workers.dev/health

# Should return JSON with status: "ok" and list of endpoints

# Test with authentication (replace TOKEN)
curl -X POST https://payments-api.your-account.workers.dev/org-subscriptions/calculate-pricing \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId":"premium-plan","seatCount":100}'
```

### Step 8: Monitor Logs

```bash
# Tail worker logs
wrangler tail

# Watch for any errors during initial requests
```

---

## Phase 3: Frontend Integration

### Step 1: Update API Configuration

Create or update `src/config/api.ts`:

```typescript
export const PAYMENTS_API_URL = 
  import.meta.env.VITE_PAYMENTS_API_URL || 
  'https://payments-api.your-account.workers.dev';
```

Add to `.env`:

```bash
VITE_PAYMENTS_API_URL=https://payments-api.your-account.workers.dev
```

### Step 2: Update Organization Services

The services in `src/services/organization/` are already created but need to be updated to use the API instead of direct Supabase calls.

Example update for `organizationSubscriptionService.ts`:

```typescript
import { PAYMENTS_API_URL } from '@/config/api';
import { supabase } from '@/lib/supabaseClient';

// Helper to get auth token
async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return session.access_token;
}

// Update purchaseSubscription to use API
async purchaseSubscription(request: OrgSubscriptionPurchaseRequest) {
  const token = await getAuthToken();
  
  const response = await fetch(
    `${PAYMENTS_API_URL}/org-subscriptions/purchase`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Purchase failed');
  }
  
  const data = await response.json();
  return this.mapToOrganizationSubscription(data.subscription);
}
```

### Step 3: Test Frontend Integration

```bash
# Start development server
npm run dev

# Test in browser:
# 1. Login as organization admin
# 2. Navigate to subscription management
# 3. Try calculating pricing
# 4. Monitor network tab for API calls
```

---

## Phase 4: Testing & Verification

### Functional Testing

#### Test 1: Calculate Pricing

```bash
curl -X POST $API_URL/org-subscriptions/calculate-pricing \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "premium-plan-id",
    "seatCount": 100
  }'

# Expected: 20% discount applied, pricing breakdown returned
```

#### Test 2: Purchase Subscription

```bash
curl -X POST $API_URL/org-subscriptions/purchase \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "school-123",
    "organizationType": "school",
    "planId": "premium-plan-id",
    "seatCount": 100,
    "targetMemberType": "both",
    "billingCycle": "annual",
    "autoRenew": true
  }'

# Expected: Subscription created with 100 seats
```

#### Test 3: Create License Pool

```bash
curl -X POST $API_URL/license-pools \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationSubscriptionId": "sub-uuid",
    "organizationId": "school-123",
    "organizationType": "school",
    "poolName": "CS Department",
    "memberType": "educator",
    "allocatedSeats": 50
  }'

# Expected: Pool created with 50 allocated seats
```

#### Test 4: Assign License

```bash
curl -X POST $API_URL/license-assignments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "poolId": "pool-uuid",
    "userId": "user-456"
  }'

# Expected: License assigned, entitlements granted
```

#### Test 5: Bulk Assign

```bash
curl -X POST $API_URL/license-assignments/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "poolId": "pool-uuid",
    "userIds": ["user-1", "user-2", "user-3"]
  }'

# Expected: Multiple assignments created
```

### Database Verification

```sql
-- Check subscription created
SELECT * FROM organization_subscriptions 
WHERE organization_id = 'school-123';

-- Check pool created
SELECT * FROM license_pools 
WHERE organization_id = 'school-123';

-- Check assignments
SELECT * FROM license_assignments 
WHERE license_pool_id = 'pool-uuid';

-- Check entitlements granted
SELECT * FROM user_entitlements 
WHERE granted_by_organization = true
AND user_id IN ('user-1', 'user-2', 'user-3');
```

---

## Phase 5: Monitoring & Maintenance

### Set Up Monitoring

1. **Cloudflare Dashboard**
   - Monitor request rates
   - Check error rates
   - Watch response times

2. **Database Monitoring**
   - Monitor query performance
   - Check connection pool usage
   - Watch for slow queries

3. **Error Tracking**
   ```bash
   # Tail worker logs
   wrangler tail
   
   # Filter for errors
   wrangler tail --format json | grep -i error
   ```

### Performance Benchmarks

Expected performance:
- API response time: < 200ms (p95)
- Database queries: < 100ms (p95)
- Bulk operations (100 users): < 5s

### Health Checks

Set up automated health checks:

```bash
# Cron job to check health every 5 minutes
*/5 * * * * curl -f https://payments-api.your-account.workers.dev/health || alert
```

---

## Rollback Plan

If issues occur, follow this rollback procedure:

### Rollback Worker

```bash
# List deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback [deployment-id]
```

### Rollback Database

```bash
# Restore from backup
psql -h your-supabase-host -U postgres -d postgres < backup_YYYYMMDD_HHMMSS.sql

# Or drop new tables
DROP TABLE IF EXISTS organization_invitations CASCADE;
DROP TABLE IF EXISTS license_assignments CASCADE;
DROP TABLE IF EXISTS license_pools CASCADE;
DROP TABLE IF EXISTS organization_subscriptions CASCADE;

# Remove added columns
ALTER TABLE subscriptions DROP COLUMN IF EXISTS organization_id;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS organization_type;
-- etc.
```

---

## Post-Deployment Checklist

- [ ] Database migrations applied successfully
- [ ] All tables and indexes created
- [ ] Worker deployed to production
- [ ] Health endpoint returns "ok"
- [ ] All 10 organization endpoints listed
- [ ] Test API calls successful
- [ ] Frontend integration working
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Team notified of deployment
- [ ] Documentation updated
- [ ] Rollback plan tested

---

## Troubleshooting

### Issue: Worker deployment fails

**Solution**:
```bash
# Check wrangler.toml syntax
wrangler validate

# Check for TypeScript errors
npm run build

# Try deploying with verbose logging
wrangler deploy --verbose
```

### Issue: Database migration fails

**Solution**:
```bash
# Check current schema
psql -h host -U postgres -d postgres -c "\dt"

# Check for conflicts
psql -h host -U postgres -d postgres -c "SELECT * FROM pg_tables WHERE tablename LIKE 'organization_%'"

# Run migrations one by one to identify issue
```

### Issue: API returns 401 Unauthorized

**Solution**:
- Verify JWT token is valid
- Check token expiration
- Ensure Authorization header format: `Bearer <token>`
- Verify Supabase secrets are set correctly

### Issue: API returns 500 Internal Server Error

**Solution**:
```bash
# Check worker logs
wrangler tail

# Look for specific error messages
# Common issues:
# - Missing Supabase secrets
# - Database connection issues
# - Invalid SQL queries
```

---

## Success Criteria

Deployment is successful when:

✅ All database migrations applied  
✅ Worker deployed and accessible  
✅ Health endpoint returns 200 OK  
✅ All 10 endpoints functional  
✅ Authentication working  
✅ Database operations successful  
✅ No errors in logs  
✅ Frontend integration working  
✅ Monitoring active  

---

## Next Steps After Deployment

1. **Monitor for 24 hours**
   - Watch error rates
   - Check performance metrics
   - Review user feedback

2. **Gradual Rollout**
   - Start with 1-2 pilot organizations
   - Monitor usage patterns
   - Gather feedback

3. **Iterate**
   - Fix any issues found
   - Optimize performance
   - Add requested features

4. **Documentation**
   - Update user guides
   - Create video tutorials
   - Write FAQ

5. **Training**
   - Train support team
   - Create admin guides
   - Conduct user training sessions

---

## Support Contacts

- **Database Issues**: DBA team
- **Worker Issues**: DevOps team
- **Frontend Issues**: Frontend team
- **User Issues**: Support team

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Verified By**: _____________  
**Status**: _____________

---

**Last Updated**: January 8, 2026  
**Version**: 1.0  
**Status**: Ready for Deployment
