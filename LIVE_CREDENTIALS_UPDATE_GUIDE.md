# Update Worker to Live Razorpay Credentials

**Date**: January 23, 2026  
**Status**: Ready to Update  
**Worker**: payments-api

---

## Overview

Your worker currently has TEST credentials. This guide will help you update to LIVE credentials for production payments while keeping TEST credentials for development.

---

## How It Works

The worker automatically detects the environment:

```typescript
// Production site → LIVE credentials
if (origin.includes('skillpassport.rareminds.in')) {
  keyId = RAZORPAY_KEY_ID;        // LIVE
  keySecret = RAZORPAY_KEY_SECRET; // LIVE
}

// Development site → TEST credentials
else {
  keyId = TEST_RAZORPAY_KEY_ID;        // TEST
  keySecret = TEST_RAZORPAY_KEY_SECRET; // TEST
}
```

**Production domains**:
- ✅ https://skillpassport.rareminds.in
- ❌ https://dev-skillpassport.rareminds.in (uses TEST)

**Development domains**:
- http://localhost:3000
- https://deploy-preview-xxx.netlify.app
- Any other domain

---

## Step 1: Get Live Credentials

### From Razorpay Dashboard

1. **Login**: https://dashboard.razorpay.com/
2. **Switch to Live Mode**: Toggle in top-left corner
3. **Navigate**: Settings → API Keys → Generate Key
4. **Copy**:
   - Key ID: `rzp_live_xxxxxxxxxxxxx`
   - Key Secret: `xxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **Important**: Keep these credentials secure! Never commit to git.

---

## Step 2: Update Cloudflare Secrets

### Navigate to Worker Directory

```bash
cd cloudflare-workers/payments-api
```

### Update LIVE Credentials (Required)

```bash
# Set LIVE Key ID
wrangler secret put RAZORPAY_KEY_ID
# When prompted, paste: rzp_live_xxxxxxxxxxxxx

# Set LIVE Key Secret
wrangler secret put RAZORPAY_KEY_SECRET
# When prompted, paste your live key secret
```

### Keep TEST Credentials (Recommended)

```bash
# Set TEST Key ID
wrangler secret put TEST_RAZORPAY_KEY_ID
# When prompted, paste: rzp_test_xxxxxxxxxxxxx

# Set TEST Key Secret
wrangler secret put TEST_RAZORPAY_KEY_SECRET
# When prompted, paste your test key secret
```

---

## Step 3: Verify Update

### Option A: Using Script

```bash
# From project root
./verify-live-credentials.sh
```

### Option B: Manual Verification

**1. Health Check**:
```bash
curl https://payments-api.dark-mode-d021.workers.dev/health | jq '.'
```

Expected output:
```json
{
  "status": "ok",
  "config": {
    "razorpay_key_id": true,
    "razorpay_key_secret": true
  }
}
```

**2. Test Production Origin**:
```bash
curl -X POST https://payments-api.dark-mode-d021.workers.dev/create-event-order \
  -H "Content-Type: application/json" \
  -H "Origin: https://skillpassport.rareminds.in" \
  -d '{
    "amount": 100,
    "currency": "INR",
    "planName": "Test Order",
    "userEmail": "test@example.com",
    "userName": "Test User",
    "userPhone": "9876543210",
    "campaign": "test",
    "origin": "https://skillpassport.rareminds.in"
  }'
```

Should return order with `key` starting with `rzp_live_`

**3. Check Worker Logs**:
```bash
wrangler tail payments-api
```

Look for:
```
[CREATE-EVENT] Using PRODUCTION credentials
[CREATE-EVENT] Key ID starts with: rzp_live...
```

---

## Step 4: Test Complete Flow

### From Production Site

1. **Navigate**: https://skillpassport.rareminds.in/register?campaign=test
2. **Fill Form**: Name, email, phone
3. **Verify Email**: Complete OTP verification
4. **Complete Payment**: Click "Complete Pre-Registration"
5. **Razorpay Checkout**: Should show LIVE mode
6. **Test Payment**: Use test card (even in live mode for testing)
   - Card: 4111 1111 1111 1111
   - CVV: Any 3 digits
   - Expiry: Any future date

### Verify in Razorpay Dashboard

1. Go to https://dashboard.razorpay.com/
2. Switch to **Live Mode**
3. Check **Payments** section
4. You should see the test payment

---

## Step 5: Monitor

### Watch Worker Logs

```bash
wrangler tail payments-api --format pretty
```

### Check Database

```sql
-- Recent registrations
SELECT 
  email,
  full_name,
  payment_status,
  razorpay_order_id,
  razorpay_payment_id,
  created_at
FROM pre_registrations
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Monitor Razorpay

- **Dashboard**: https://dashboard.razorpay.com/
- **Payments**: Check for incoming payments
- **Orders**: Verify order creation
- **Webhooks**: Monitor webhook deliveries

---

## Rollback Plan

If you need to revert to test credentials:

```bash
cd cloudflare-workers/payments-api

# Revert to test credentials
wrangler secret put RAZORPAY_KEY_ID
# Paste TEST Key ID: rzp_test_xxxxxxxxxxxxx

wrangler secret put RAZORPAY_KEY_SECRET
# Paste TEST Key Secret
```

---

## Security Checklist

- [ ] Live credentials obtained from Razorpay dashboard
- [ ] Credentials NOT committed to git
- [ ] Credentials NOT in .env file
- [ ] Credentials set via `wrangler secret put` only
- [ ] Health check passes
- [ ] Test order created successfully
- [ ] Worker logs show correct credentials being used
- [ ] Razorpay dashboard shows test payment

---

## Troubleshooting

### Issue: "Payment service not configured"

**Cause**: Secrets not set correctly

**Fix**:
```bash
wrangler secret put RAZORPAY_KEY_ID
wrangler secret put RAZORPAY_KEY_SECRET
```

### Issue: "Invalid key_id"

**Cause**: Using test key in live mode or vice versa

**Fix**: Verify you're using the correct credentials:
- Production: `rzp_live_xxx`
- Test: `rzp_test_xxx`

### Issue: Worker still using test credentials

**Cause**: Origin detection not working

**Fix**: Check the `origin` parameter in request:
```javascript
// Frontend should pass:
origin: window.location.origin
```

### Issue: Payment fails with "Authentication failed"

**Cause**: Key secret doesn't match key ID

**Fix**: Re-enter both credentials:
```bash
wrangler secret put RAZORPAY_KEY_ID
wrangler secret put RAZORPAY_KEY_SECRET
```

---

## Environment Variables Summary

### Required for Production

| Secret | Value | Used For |
|--------|-------|----------|
| `RAZORPAY_KEY_ID` | `rzp_live_xxx` | Production payments |
| `RAZORPAY_KEY_SECRET` | Live secret | Production payments |

### Optional for Development

| Secret | Value | Used For |
|--------|-------|----------|
| `TEST_RAZORPAY_KEY_ID` | `rzp_test_xxx` | Development/testing |
| `TEST_RAZORPAY_KEY_SECRET` | Test secret | Development/testing |

### Other Secrets (Already Set)

| Secret | Status |
|--------|--------|
| `SUPABASE_URL` | ✅ Set |
| `SUPABASE_ANON_KEY` | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set |

---

## Post-Update Checklist

- [ ] Live credentials set in Cloudflare
- [ ] Health check passes
- [ ] Test order created from production site
- [ ] Test order created from development site
- [ ] Worker logs show correct credential usage
- [ ] Razorpay dashboard shows payments
- [ ] Database records created correctly
- [ ] Email confirmations sent
- [ ] No errors in worker logs

---

## Support

### If Issues Occur

**Check Worker Logs**:
```bash
wrangler tail payments-api
```

**Check Health**:
```bash
curl https://payments-api.dark-mode-d021.workers.dev/health
```

**Verify Secrets**:
```bash
wrangler secret list
```

**Contact**:
- Razorpay Support: https://razorpay.com/support/
- Developer: Check logs and documentation

---

## Next Steps

After updating to live credentials:

1. **Test thoroughly** on production site
2. **Monitor** first few real payments closely
3. **Set up webhooks** in Razorpay dashboard (if not already done)
4. **Configure alerts** for failed payments
5. **Document** any issues encountered

---

**Status**: Ready to update to live credentials  
**Risk**: Low (can rollback easily)  
**Impact**: Production payments will use live Razorpay account  
**Recommendation**: Update during low-traffic period and monitor closely

