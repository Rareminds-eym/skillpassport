# Organization Subscription Management - Deployment Guide

## Overview

This guide covers the deployment process for the Organization Subscription Management feature, including database migrations, backend services, and frontend deployment.

## Prerequisites

- Node.js 18+ installed
- Access to Supabase project (admin credentials)
- Cloudflare account with Workers enabled
- Razorpay account with API keys
- Git access to repository

## Environment Variables

### Backend (Cloudflare Worker)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your-secret-key
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Environment
ENVIRONMENT=production
```

### Frontend

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PAYMENTS_API_URL=https://payments-api.your-domain.workers.dev
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxx
```

## Deployment Steps

### Phase 1: Database Migration

#### Step 1.1: Backup Existing Data

```bash
# Create backup before migration
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql
```

#### Step 1.2: Run Schema Migrations

Execute migrations in order via Supabase SQL Editor or CLI:

```bash
# Using Supabase CLI
supabase db push

# Or run individual migration files
supabase db execute -f migrations/001_create_organization_subscriptions.sql
supabase db execute -f migrations/002_create_license_pools.sql
supabase db execute -f migrations/003_create_license_assignments.sql
supabase db execute -f migrations/004_create_organization_invitations.sql
supabase db execute -f migrations/005_extend_existing_tables.sql
supabase db execute -f migrations/006_create_indexes.sql
supabase db execute -f migrations/007_create_rls_policies.sql
supabase db execute -f migrations/008_create_functions.sql
```

#### Step 1.3: Verify Migration

```sql
-- Verify new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'organization_subscriptions',
  'license_pools', 
  'license_assignments',
  'organization_invitations'
);

-- Verify indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN (
  'organization_subscriptions',
  'license_pools',
  'license_assignments',
  'organization_invitations'
);

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'organization_subscriptions',
  'license_pools',
  'license_assignments',
  'organization_invitations'
);
```


### Phase 2: Backend Deployment

#### Step 2.1: Configure Cloudflare Worker

```bash
# Navigate to worker directory
cd cloudflare-workers/payments-api

# Install dependencies
npm install

# Configure wrangler.toml
cat > wrangler.toml << EOF
name = "payments-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "production"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "your-kv-namespace-id"
EOF
```

#### Step 2.2: Set Worker Secrets

```bash
# Set secrets via Wrangler CLI
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put RAZORPAY_KEY_ID
wrangler secret put RAZORPAY_KEY_SECRET
wrangler secret put RAZORPAY_WEBHOOK_SECRET
```

#### Step 2.3: Deploy Worker

```bash
# Deploy to production
wrangler deploy --env production

# Verify deployment
curl https://payments-api.your-domain.workers.dev/health
```

#### Step 2.4: Configure Razorpay Webhooks

1. Log into Razorpay Dashboard
2. Navigate to Settings → Webhooks
3. Add webhook URL: `https://payments-api.your-domain.workers.dev/webhooks/razorpay`
4. Select events:
   - `payment.captured`
   - `payment.failed`
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
5. Copy webhook secret and update worker secret

### Phase 3: Frontend Deployment

#### Step 3.1: Build Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Verify build output
ls -la dist/
```

#### Step 3.2: Deploy to Netlify

```bash
# Using Netlify CLI
netlify deploy --prod --dir=dist

# Or via Git push (if connected)
git push origin main
```

#### Step 3.3: Configure Environment Variables in Netlify

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add all `VITE_*` environment variables
3. Trigger redeploy

### Phase 4: Post-Deployment Verification

#### Step 4.1: Health Checks

```bash
# Check API health
curl https://payments-api.your-domain.workers.dev/health

# Check frontend loads
curl -I https://your-app.netlify.app

# Check Supabase connection
curl https://your-project.supabase.co/rest/v1/ \
  -H "apikey: your-anon-key"
```

#### Step 4.2: Smoke Tests

Run the following manual tests:

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Admin Login | Login as school_admin | Dashboard loads |
| View Subscriptions | Navigate to subscription management | Empty state or existing subs shown |
| Calculate Pricing | Select plan, enter 100 seats | 20% discount applied |
| Create Pool | Create test license pool | Pool created successfully |
| Assign License | Assign to test user | User receives entitlements |

#### Step 4.3: Monitor Logs

```bash
# Cloudflare Worker logs
wrangler tail --env production

# Supabase logs
# Check via Supabase Dashboard → Logs
```


## Rollback Procedures

### Database Rollback

```sql
-- If migration fails, rollback in reverse order
DROP TABLE IF EXISTS organization_invitations CASCADE;
DROP TABLE IF EXISTS license_assignments CASCADE;
DROP TABLE IF EXISTS license_pools CASCADE;
DROP TABLE IF EXISTS organization_subscriptions CASCADE;

-- Remove extended columns
ALTER TABLE subscriptions 
  DROP COLUMN IF EXISTS organization_id,
  DROP COLUMN IF EXISTS organization_type,
  DROP COLUMN IF EXISTS purchased_by,
  DROP COLUMN IF EXISTS seat_count,
  DROP COLUMN IF EXISTS is_organization_subscription;

ALTER TABLE user_entitlements
  DROP COLUMN IF EXISTS granted_by_organization,
  DROP COLUMN IF EXISTS organization_subscription_id,
  DROP COLUMN IF EXISTS granted_by;

ALTER TABLE payment_transactions
  DROP COLUMN IF EXISTS organization_id,
  DROP COLUMN IF EXISTS organization_type,
  DROP COLUMN IF EXISTS seat_count,
  DROP COLUMN IF EXISTS is_bulk_purchase;
```

### Worker Rollback

```bash
# Rollback to previous version
wrangler rollback --env production

# Or deploy specific version
wrangler deploy --env production --version <previous-version-id>
```

### Frontend Rollback

```bash
# Netlify - rollback via dashboard
# Or redeploy previous commit
git checkout <previous-commit>
netlify deploy --prod --dir=dist
```

## Monitoring Setup

### Cloudflare Analytics

1. Enable Workers Analytics in Cloudflare Dashboard
2. Set up alerts for:
   - Error rate > 1%
   - P95 latency > 500ms
   - Request rate anomalies

### Supabase Monitoring

1. Enable Database Insights
2. Set up alerts for:
   - Connection pool exhaustion
   - Slow queries (> 1s)
   - RLS policy violations

### Application Monitoring

```javascript
// Add to frontend for error tracking
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: 'production',
  tracesSampleRate: 0.1,
});
```

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] Team notified of deployment window

### During Deployment

- [ ] Database migrations applied
- [ ] Worker deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Smoke tests passing
- [ ] No errors in logs

### Post-Deployment

- [ ] Monitor error rates for 1 hour
- [ ] Verify key user flows work
- [ ] Check payment processing
- [ ] Confirm email notifications working
- [ ] Update deployment documentation

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired JWT | Check token, refresh auth |
| 403 Forbidden | RLS policy blocking | Verify user role and org membership |
| 500 Server Error | Database connection | Check Supabase status, connection string |
| Rate Limited | Too many requests | Wait for retry-after period |
| Payment Failed | Razorpay config | Verify API keys, webhook secret |

### Debug Commands

```bash
# Check worker logs
wrangler tail --env production --format pretty

# Test API endpoint
curl -X POST https://payments-api.your-domain.workers.dev/org-subscriptions/calculate-pricing \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"planId": "uuid", "seatCount": 100}'

# Check database directly
psql -h db.your-project.supabase.co -U postgres -d postgres \
  -c "SELECT * FROM organization_subscriptions LIMIT 5;"
```

## Support Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| DevOps | devops@company.com | Slack #devops |
| Backend | backend@company.com | Slack #backend |
| Database | dba@company.com | Slack #database |
| On-Call | oncall@company.com | PagerDuty |
