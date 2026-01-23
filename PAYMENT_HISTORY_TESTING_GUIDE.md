# Payment History Testing Guide

## Quick Test Steps

### Test 1: New Registration → Payment Success ✅

1. **Navigate to registration page**
   ```
   http://localhost:3000/register?campaign=test
   ```

2. **Fill form**
   - Name: Test User
   - Email: test@example.com
   - Phone: 9876543210

3. **Verify email**
   - Click "Verify" button
   - Enter OTP from email
   - Confirm email verified badge appears

4. **Complete payment**
   - Check consent checkbox
   - Click "Complete Pre-Registration"
   - Complete Razorpay payment

5. **Verify in database**
   ```sql
   SELECT 
     email,
     payment_status,
     razorpay_order_id,
     razorpay_payment_id,
     payment_history
   FROM pre_registrations
   WHERE email = 'test@example.com';
   ```

   **Expected Result**:
   ```json
   {
     "email": "test@example.com",
     "payment_status": "completed",
     "razorpay_order_id": "order_xxx",
     "razorpay_payment_id": "pay_xxx",
     "payment_history": [
       {
         "order_id": "order_xxx",
         "payment_id": "pay_xxx",
         "status": "completed",
         "created_at": "2026-01-23T10:00:00Z",
         "completed_at": "2026-01-23T10:05:00Z",
         "error": null
       }
     ]
   }
   ```

---

### Test 2: New Registration → Payment Failure ❌

1. **Fill form with new email**
   - Email: test-fail@example.com

2. **Start payment**
   - Click "Complete Pre-Registration"
   - **Cancel payment** in Razorpay modal

3. **Verify in database**
   ```sql
   SELECT 
     email,
     payment_status,
     payment_history
   FROM pre_registrations
   WHERE email = 'test-fail@example.com';
   ```

   **Expected Result**:
   ```json
   {
     "email": "test-fail@example.com",
     "payment_status": "pending",
     "payment_history": [
       {
         "order_id": "order_xxx",
         "payment_id": null,
         "status": "failed",
         "created_at": "2026-01-23T10:00:00Z",
         "completed_at": "2026-01-23T10:01:00Z",
         "error": "Payment cancelled by user"
       }
     ]
   }
   ```

---

### Test 3: Retry Payment → Success ✅

1. **Use same email from Test 2**
   - Email: test-fail@example.com

2. **Complete payment this time**
   - Click "Complete Pre-Registration"
   - Complete Razorpay payment successfully

3. **Verify in database**
   ```sql
   SELECT 
     email,
     payment_status,
     JSONB_ARRAY_LENGTH(payment_history) as attempt_count,
     payment_history
   FROM pre_registrations
   WHERE email = 'test-fail@example.com';
   ```

   **Expected Result**:
   ```json
   {
     "email": "test-fail@example.com",
     "payment_status": "completed",
     "attempt_count": 2,
     "payment_history": [
       {
         "order_id": "order_xxx",
         "payment_id": null,
         "status": "failed",
         "created_at": "2026-01-23T10:00:00Z",
         "completed_at": "2026-01-23T10:01:00Z",
         "error": "Payment cancelled by user"
       },
       {
         "order_id": "order_yyy",
         "payment_id": "pay_yyy",
         "status": "completed",
         "created_at": "2026-01-23T10:10:00Z",
         "completed_at": "2026-01-23T10:15:00Z",
         "error": null
       }
     ]
   }
   ```

---

### Test 4: Multiple Retries ♻️

1. **Use same email**
   - Email: test-retry@example.com

2. **Fail payment 3 times**
   - Attempt 1: Cancel payment
   - Attempt 2: Cancel payment
   - Attempt 3: Cancel payment

3. **Complete payment on 4th attempt**

4. **Verify in database**
   ```sql
   SELECT 
     email,
     payment_status,
     JSONB_ARRAY_LENGTH(payment_history) as attempt_count,
     payment_history
   FROM pre_registrations
   WHERE email = 'test-retry@example.com';
   ```

   **Expected Result**:
   ```json
   {
     "email": "test-retry@example.com",
     "payment_status": "completed",
     "attempt_count": 4,
     "payment_history": [
       { "status": "failed", "error": "Payment cancelled by user" },
       { "status": "failed", "error": "Payment cancelled by user" },
       { "status": "failed", "error": "Payment cancelled by user" },
       { "status": "completed", "payment_id": "pay_xxx" }
     ]
   }
   ```

---

## Verification Queries

### Check All Registrations
```sql
SELECT 
  email,
  full_name,
  payment_status,
  JSONB_ARRAY_LENGTH(COALESCE(payment_history, '[]'::jsonb)) as attempts,
  created_at
FROM pre_registrations
ORDER BY created_at DESC
LIMIT 20;
```

### Check Failed Attempts
```sql
SELECT 
  email,
  payment_status,
  payment_history
FROM pre_registrations
WHERE payment_history @> '[{"status": "failed"}]'::jsonb
ORDER BY created_at DESC;
```

### Check Multiple Attempts
```sql
SELECT 
  email,
  payment_status,
  JSONB_ARRAY_LENGTH(payment_history) as attempts
FROM pre_registrations
WHERE JSONB_ARRAY_LENGTH(payment_history) > 1
ORDER BY attempts DESC;
```

### Payment Success Rate
```sql
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed,
  ROUND(
    COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) * 100.0 / COUNT(*),
    2
  ) as success_rate
FROM pre_registrations;
```

### Average Attempts Before Success
```sql
SELECT 
  AVG(JSONB_ARRAY_LENGTH(payment_history)) as avg_attempts
FROM pre_registrations
WHERE payment_status = 'completed';
```

---

## Browser Console Checks

### Check Worker Calls

Open browser console and look for:

```
[PAYMENT] Creating order via worker...
[PAYMENT] Order created: order_xxx
[PAYMENT] Payment success, updating via worker...
[PAYMENT] Payment status updated successfully
```

### Check for Errors

Look for any errors related to:
- `updateEventPaymentStatus`
- `Failed to update payment status`
- `Worker endpoint error`

---

## Expected Behavior

### ✅ Success Indicators

1. **No direct Supabase updates** from frontend
2. **All updates go through worker** endpoints
3. **Payment history tracked** for every attempt
4. **Retry payments work** without creating duplicates
5. **Complete audit trail** in payment_history
6. **No console errors** during payment flow

### ❌ Failure Indicators

1. Direct Supabase `.update()` calls in console
2. Missing payment_history entries
3. Duplicate registrations for same email
4. Payment status not updating
5. Worker endpoint errors (401, 404, 500)

---

## Troubleshooting

### Issue: Payment status not updating

**Check**:
1. Worker endpoint is deployed
2. Worker logs show request received
3. No CORS errors in console
4. Registration ID is correct

**Fix**:
```bash
cd cloudflare-workers/payments-api
npm run deploy
```

### Issue: Payment history not tracked

**Check**:
1. `payment_history` column exists in database
2. Worker has correct Supabase credentials
3. Worker logs show history update

**Fix**:
```sql
-- Verify column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pre_registrations' 
AND column_name = 'payment_history';

-- Add if missing
ALTER TABLE pre_registrations 
ADD COLUMN payment_history JSONB DEFAULT '[]'::jsonb;
```

### Issue: Duplicate registrations

**Check**:
1. Unique constraint on email exists
2. Frontend checks for existing registration

**Fix**:
```sql
-- Add unique constraint
CREATE UNIQUE INDEX idx_pre_registrations_email_unique 
ON pre_registrations(LOWER(email));
```

---

## Production Testing

### Before Deploying

- [ ] All tests pass locally
- [ ] No console errors
- [ ] Payment history tracked correctly
- [ ] Retry payments work
- [ ] Worker deployed successfully

### After Deploying

- [ ] Test with real Razorpay account
- [ ] Verify emails sent correctly
- [ ] Check payment success rate
- [ ] Monitor worker logs
- [ ] Verify database updates

---

## Monitoring

### Daily Checks

```sql
-- Today's registrations
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed,
  ROUND(
    COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) * 100.0 / COUNT(*),
    2
  ) as success_rate
FROM pre_registrations
WHERE created_at >= CURRENT_DATE;
```

### Weekly Analytics

```sql
-- Weekly payment attempts
SELECT 
  DATE(created_at) as date,
  COUNT(*) as registrations,
  SUM(JSONB_ARRAY_LENGTH(payment_history)) as total_attempts,
  ROUND(
    SUM(JSONB_ARRAY_LENGTH(payment_history))::numeric / COUNT(*),
    2
  ) as avg_attempts_per_user
FROM pre_registrations
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

**Status**: Ready for Testing

**Next**: Run all test scenarios and verify results
