# Payment System - Complete Implementation Guide

**Status**: ✅ Production Ready  
**Last Updated**: January 23, 2026

---

## Overview

Complete payment system for event registrations with Razorpay integration, payment history tracking, and secure worker-based architecture.

---

## Architecture

```
┌─────────────┐
│   Frontend  │ (SimpleEventRegistration.jsx)
└──────┬──────┘
       │ API Calls Only (No Direct DB Access)
       ↓
┌─────────────────────────────────────────┐
│   Cloudflare Worker (payments-api)      │
│   - Payment order creation              │
│   - Payment status updates              │
│   - Payment history tracking            │
│   - Razorpay integration                │
└──────┬──────────────────────────────────┘
       │ Service Role Access
       ↓
┌─────────────┐
│  Supabase   │ (pre_registrations table)
└─────────────┘
```

---

## Database Schema

### Table: `pre_registrations`

```sql
CREATE TABLE pre_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  amount INTEGER NOT NULL,
  campaign VARCHAR,
  role_type VARCHAR DEFAULT 'pre_registration',
  
  -- Payment fields
  payment_status payment_status_enum DEFAULT 'pending',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  
  -- Payment history (JSONB array)
  payment_history JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enum for payment status
CREATE TYPE payment_status_enum AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded',
  'cancelled'
);

-- Indexes
CREATE UNIQUE INDEX idx_pre_registrations_email_unique 
ON pre_registrations(LOWER(email));

CREATE INDEX idx_pre_registrations_payment_status 
ON pre_registrations(payment_status);

CREATE INDEX idx_pre_registrations_email_status 
ON pre_registrations(email, payment_status);

CREATE INDEX idx_pre_registrations_payment_history 
ON pre_registrations USING GIN (payment_history);
```

### Payment History Structure

```json
[
  {
    "order_id": "order_xxx",
    "payment_id": "pay_xxx",
    "status": "completed",
    "created_at": "2026-01-23T10:00:00Z",
    "completed_at": "2026-01-23T10:05:00Z",
    "error": null
  }
]
```

---

## API Endpoints

### 1. Create Event Order

**Endpoint**: `POST /create-event-order`

**Request**:
```json
{
  "amount": 25000,
  "currency": "INR",
  "registrationId": "uuid",
  "planName": "Pre-Registration - campaign",
  "userEmail": "user@example.com",
  "userName": "User Name",
  "origin": "http://localhost:3000"
}
```

**Response**:
```json
{
  "success": true,
  "id": "order_xxx",
  "amount": 25000,
  "currency": "INR",
  "key": "rzp_test_xxx"
}
```

**Worker Actions**:
1. Validates registration exists
2. Creates Razorpay order
3. Initializes payment_history with pending attempt
4. Updates razorpay_order_id

---

### 2. Update Event Payment Status

**Endpoint**: `POST /update-event-payment-status`

**Request**:
```json
{
  "registrationId": "uuid",
  "orderId": "order_xxx",
  "paymentId": "pay_xxx",
  "status": "completed",
  "error": null,
  "planName": "Pre-Registration - campaign"
}
```

**Response**:
```json
{
  "success": true,
  "status": "completed",
  "registration_id": "uuid",
  "order_id": "order_xxx"
}
```

**Worker Actions**:
1. Fetches current payment_history
2. Updates specific attempt with status/payment_id/error
3. Updates payment_status if completed
4. Atomic database update

---

## Frontend Implementation

### File: `src/services/paymentsApiService.js`

```javascript
// Create order
export async function createEventOrder({ 
  amount, 
  currency, 
  registrationId, 
  planName, 
  userEmail, 
  userName, 
  origin 
}, token) {
  const response = await fetch(`${getBaseUrl()}/create-event-order`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ 
      amount, currency, registrationId, 
      planName, userEmail, userName, origin 
    }),
  });
  return response.json();
}

// Update payment status
export async function updateEventPaymentStatus({ 
  registrationId, 
  orderId, 
  paymentId, 
  status, 
  error, 
  planName 
}) {
  const response = await fetch(`${getBaseUrl()}/update-event-payment-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      registrationId, orderId, paymentId, 
      status, error, planName 
    }),
  });
  return response.json();
}
```

### File: `src/pages/register/SimpleEventRegistration.jsx`

**Payment Success Handler**:
```javascript
handler: async (response) => {
  try {
    // Update via worker (handles payment history)
    await paymentsApiService.updateEventPaymentStatus({
      registrationId: registration.id,
      orderId: response.razorpay_order_id,
      paymentId: response.razorpay_payment_id,
      status: 'completed',
      planName: `Pre-Registration - ${campaign}`
    });
    
    setSuccess(true);
  } catch (err) {
    console.error('Update error:', err);
  }
}
```

**Payment Failure Handler**:
```javascript
razorpay.on('payment.failed', async (response) => {
  try {
    await paymentsApiService.updateEventPaymentStatus({
      registrationId: registration.id,
      orderId: orderData.id,
      status: 'failed',
      error: response.error?.description,
      planName: `Pre-Registration - ${campaign}`
    });
  } catch (err) {
    console.error('Failed to update:', err);
  }
  
  setPaymentError(response.error?.description);
  setLoading(false);
});
```

---

## Payment Flow

### New Registration

```
1. User fills form → Verifies email → Clicks "Complete Payment"
2. Frontend → Worker: createEventOrder()
   - Worker creates Razorpay order
   - Worker initializes payment_history: [{ order_id, status: "pending" }]
3. Razorpay modal opens → User completes payment
4. Payment Success:
   - Frontend → Worker: updateEventPaymentStatus(status: "completed")
   - Worker updates payment_history: [{ order_id, payment_id, status: "completed" }]
   - Worker sets payment_status: "completed"
5. Success screen shown
```

### Retry Payment

```
1. User with pending registration tries again
2. Frontend checks for existing registration by email
3. If found with status "pending":
   - Reuse existing registration
   - Frontend → Worker: createEventOrder() with existing registrationId
   - Worker appends new attempt to payment_history
4. Payment completes → Worker updates latest attempt
5. Result: One registration with multiple attempts in payment_history
```

---

## Configuration

### Environment Variables

**Frontend** (`.env`):
```bash
# Payments API Worker
VITE_PAYMENTS_API_URL=https://payments-api.dark-mode-d021.workers.dev

# Razorpay (Frontend - Public Key Only)
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```

**Worker** (Cloudflare Secrets):
```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Razorpay Test
TEST_RAZORPAY_KEY_ID=rzp_test_xxx
TEST_RAZORPAY_KEY_SECRET=xxx

# Razorpay Live
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
```

### Set Worker Secrets

```bash
cd cloudflare-workers/payments-api

# Supabase
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# Razorpay Test
wrangler secret put TEST_RAZORPAY_KEY_ID
wrangler secret put TEST_RAZORPAY_KEY_SECRET

# Razorpay Live
wrangler secret put RAZORPAY_KEY_ID
wrangler secret put RAZORPAY_KEY_SECRET
```

---

## Testing

### Test Scenarios

1. **New Registration → Success**
   - Creates registration with pending status
   - Initializes payment_history with one attempt
   - Updates to completed on success

2. **New Registration → Failure**
   - Creates registration with pending status
   - Updates attempt to failed with error message
   - Keeps status as pending for retry

3. **Retry Payment → Success**
   - Reuses existing registration
   - Appends new attempt to payment_history
   - Updates to completed

4. **Multiple Retries**
   - Each retry adds new attempt
   - All attempts preserved in payment_history
   - Latest order_id stored in razorpay_order_id

### Verification Queries

```sql
-- View payment attempts
SELECT 
  email,
  payment_status,
  JSONB_ARRAY_LENGTH(payment_history) as attempts,
  payment_history
FROM pre_registrations
WHERE email = 'test@example.com';

-- Payment success rate
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed,
  ROUND(
    COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) * 100.0 / COUNT(*),
    2
  ) as success_rate
FROM pre_registrations;

-- Average attempts before success
SELECT 
  AVG(JSONB_ARRAY_LENGTH(payment_history)) as avg_attempts
FROM pre_registrations
WHERE payment_status = 'completed';
```

---

## Deployment

### 1. Deploy Worker

```bash
cd cloudflare-workers/payments-api
npm run deploy
```

### 2. Deploy Frontend

```bash
npm run build
# Netlify auto-deploys on push to main
```

### 3. Verify

- Test registration flow
- Check payment history tracking
- Verify retry payments work
- Monitor worker logs

---

## Security Features

✅ **No Direct DB Access**: Frontend can't manipulate payment data  
✅ **Atomic Operations**: Worker ensures consistent updates  
✅ **Server Validation**: All inputs validated before DB updates  
✅ **Complete Audit Trail**: Every payment attempt tracked  
✅ **RLS Policies**: Additional database-level security  

---

## Monitoring

### Daily Checks

```sql
-- Today's registrations
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed
FROM pre_registrations
WHERE created_at >= CURRENT_DATE;
```

### Weekly Analytics

```sql
-- Payment attempts per user
SELECT 
  DATE(created_at) as date,
  COUNT(*) as registrations,
  SUM(JSONB_ARRAY_LENGTH(payment_history)) as total_attempts,
  ROUND(
    SUM(JSONB_ARRAY_LENGTH(payment_history))::numeric / COUNT(*),
    2
  ) as avg_attempts
FROM pre_registrations
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## Troubleshooting

### Payment status not updating

**Check**:
- Worker deployed successfully
- Worker has correct Supabase credentials
- No CORS errors in browser console

**Fix**:
```bash
cd cloudflare-workers/payments-api
npm run deploy
```

### Payment history not tracked

**Check**:
- `payment_history` column exists
- Worker logs show history update

**Fix**:
```sql
ALTER TABLE pre_registrations 
ADD COLUMN payment_history JSONB DEFAULT '[]'::jsonb;
```

### Duplicate registrations

**Check**:
- Unique constraint on email exists

**Fix**:
```sql
CREATE UNIQUE INDEX idx_pre_registrations_email_unique 
ON pre_registrations(LOWER(email));
```

---

## Related Files

- `src/services/paymentsApiService.js` - API client
- `src/pages/register/SimpleEventRegistration.jsx` - Registration form
- `cloudflare-workers/payments-api/src/index.ts` - Worker implementation
- `database/migrations/add_payment_history_to_pre_registrations.sql` - Migration

---

**Status**: ✅ Production Ready  
**Next**: Monitor payment success rates and user feedback
