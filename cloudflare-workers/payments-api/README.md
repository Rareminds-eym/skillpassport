# Payments API Cloudflare Worker

Handles Razorpay payment processing for Skill Passport platform.

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/create-order` | POST | Create Razorpay order for subscriptions |
| `/create-event-order` | POST | Create order for event registrations |
| `/verify-payment` | POST | Verify payment signature |
| `/webhook` | POST | Handle Razorpay webhooks |
| `/cancel-subscription` | POST | Cancel Razorpay subscription |
| `/deactivate-subscription` | POST | Deactivate subscription in database |
| `/expire-subscriptions` | POST | Expire old subscriptions (cron job) |
| `/health` | GET | Health check endpoint |

## Environment Variables

### Required

| Variable | Description | Usage |
|----------|-------------|-------|
| `VITE_SUPABASE_URL` | Supabase project URL | Database operations |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | User-scoped queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Admin operations |
| `VITE_RAZORPAY_KEY_ID` | Razorpay key ID | Create and verify orders |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | Signature verification |

### Optional

| Variable | Description | Default | Usage |
|----------|-------------|---------|-------|
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature secret | None | Verify incoming webhooks |
| `TEST_RAZORPAY_KEY_ID` | Test mode key ID | Falls back to main key | Testing/development |
| `TEST_RAZORPAY_KEY_SECRET` | Test mode secret | Falls back to main secret | Testing/development |

## Setup Instructions

### 1. Install Dependencies
```bash
cd cloudflare-workers/payments-api
npm install
```

### 2. Configure Secrets
```bash
# Required secrets
wrangler secret put VITE_SUPABASE_URL
wrangler secret put VITE_SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put VITE_RAZORPAY_KEY_ID
wrangler secret put RAZORPAY_KEY_SECRET

# Optional secrets
wrangler secret put RAZORPAY_WEBHOOK_SECRET
wrangler secret put TEST_RAZORPAY_KEY_ID
wrangler secret put TEST_RAZORPAY_KEY_SECRET
```

### 3. Deploy
```bash
npm run deploy
```

### 4. Update Frontend Environment
```env
VITE_PAYMENTS_API_URL=https://payments-api.your-subdomain.workers.dev
```

## Features

### Create Order (`/create-order`)
- Creates Razorpay order for subscriptions
- **Validated amounts**: ₹1, ₹499, ₹999, ₹1999 (in paise: 100, 49900, 99900, 199900)
- **Max amount**: ₹10,000 (1000000 paise)
- **Rate limiting**: 5 orders per minute per user
- Saves order to `razorpay_orders` table
- Supports INR currency only

### Create Event Order (`/create-event-order`)
- Creates orders for event registrations (no auth required)
- **Max amount**: ₹1 crore (₹10,000,000)
- **Test mode limit**: ₹50,000
- Auto-detects production vs test mode based on origin
- Email validation
- Updates `event_registrations` table

### Verify Payment (`/verify-payment`)
- Verifies HMAC-SHA256 signature
- Idempotent (prevents double processing)
- Fetches payment details from Razorpay
- Validates payment amount and status
- Updates order status
- Returns payment method

### Webhook Handler (`/webhook`)
- Verifies webhook signature
- Handles events:
  - `payment.captured` - Payment successful
  - `payment.failed` - Payment failed
  - `subscription.cancelled` - Subscription cancelled
  - `subscription.paused` - Subscription paused
  - `subscription.resumed` - Subscription resumed
  - `subscription.charged` - Recurring payment

### Cancel Subscription (`/cancel-subscription`)
- Cancels subscription in Razorpay
- Updates database status
- Supports cancel_at_cycle_end option
- Handles already-cancelled subscriptions gracefully

### Deactivate Subscription (`/deactivate-subscription`)
- Deactivates subscription in database only
- Requires user authentication
- Validates ownership
- Supports cancellation reasons
- Idempotent

### Expire Subscriptions (`/expire-subscriptions`)
- Cron job to expire old subscriptions
- Calls `expire_old_subscriptions()` database function
- Returns count of expired subscriptions

## Security Features

- **HMAC-SHA256** signature verification
- **Rate limiting** on order creation
- **Amount validation** against whitelist
- **Email validation** (RFC compliant)
- **Webhook signature** verification
- **Idempotency** checks
- **User ownership** validation

## Production vs Test Mode

The worker automatically detects production mode based on origin:

### Production Mode
- Origin contains: `skillpassport.rareminds.in`
- Uses: `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`
- No amount limits

### Test Mode
- All other origins
- Uses: `TEST_RAZORPAY_KEY_ID` / `TEST_RAZORPAY_KEY_SECRET` (falls back to production keys)
- Amount capped at ₹50,000

## Valid Plan Amounts

| Plan | Amount (INR) | Amount (Paise) |
|------|--------------|----------------|
| Free Trial | ₹1 | 100 |
| Basic | ₹499 | 49900 |
| Pro | ₹999 | 99900 |
| Enterprise | ₹1999 | 199900 |

## Development

```bash
# Start local dev server
npm run dev

# View real-time logs
npm run tail

# Test webhook locally
curl -X POST http://localhost:8787/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: your-signature" \
  -d '{"event": "payment.captured", "payload": {...}}'
```

## Response Format

### Create Order
```json
{
  "success": true,
  "id": "order_...",
  "amount": 49900,
  "currency": "INR",
  "receipt": "rcpt_..."
}
```

### Verify Payment
```json
{
  "success": true,
  "verified": true,
  "message": "Payment verified successfully",
  "payment_id": "pay_...",
  "order_id": "order_...",
  "user_id": "...",
  "payment_method": "card",
  "amount": 49900
}
```

## Database Tables Used

- `razorpay_orders` - Order records
- `payment_transactions` - Payment records
- `subscriptions` - Subscription status
- `event_registrations` - Event payment tracking

## Notes

- All amounts are in **paise** (₹1 = 100 paise)
- Webhooks require `RAZORPAY_WEBHOOK_SECRET`
- Signature verification uses HMAC-SHA256
- Orders expire after 24 hours if unpaid
- Test credentials allow testing without real payments
