# Razorpay API Worker

Centralized Cloudflare Worker for Razorpay payment processing. This worker is designed to be shared across multiple websites using the same Razorpay account.

## 🎯 Purpose

This worker acts as a **single source of truth** for all Razorpay API operations. Instead of each website managing Razorpay credentials separately, they all call this shared worker.

**Benefits:**
- ✅ Centralized credential management
- ✅ Reusable across multiple websites (A, B, C)
- ✅ Single deployment for all Razorpay operations
- ✅ Easier to update and maintain
- ✅ Better security (credentials in one place)

## 🏗️ Architecture

```
Website A (Pages Functions) ──┐
Website B (Pages Functions) ──┼──> Razorpay Worker ──> Razorpay API
Website C (Pages Functions) ──┘
```

**What the worker does:**
- Creates Razorpay orders
- Verifies payment signatures
- Fetches payment details
- Cancels subscriptions
- Verifies webhook signatures

**What the worker does NOT do:**
- Database operations (handled by Pages Functions)
- User authentication (handled by Pages Functions)
- Email sending (handled by Pages Functions)
- Business logic (handled by Pages Functions)

## 📡 API Endpoints

### `POST /create-order`
Creates a new Razorpay order.

**Request:**
```json
{
  "amount": 50000,
  "currency": "INR",
  "receipt": "rcpt_123",
  "notes": {
    "user_id": "abc123",
    "plan_name": "Premium"
  }
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_xyz",
    "amount": 50000,
    "currency": "INR",
    "status": "created"
  },
  "key_id": "rzp_live_xxx"
}
```

### `POST /verify-payment`
Verifies Razorpay payment signature.

**Request:**
```json
{
  "razorpay_order_id": "order_xyz",
  "razorpay_payment_id": "pay_abc",
  "razorpay_signature": "signature_hash"
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "message": "Payment signature verified"
}
```

### `GET /payment/:id`
Fetches payment details from Razorpay.

**Example:** `GET /payment/pay_abc123`

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "pay_abc123",
    "status": "captured",
    "method": "card",
    "amount": 50000
  }
}
```

### `POST /subscription/:id/cancel`
Cancels a Razorpay subscription.

**Example:** `POST /subscription/sub_xyz123/cancel`

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_xyz123",
    "status": "cancelled"
  }
}
```

### `POST /verify-webhook`
Verifies Razorpay webhook signature.

**Headers:**
- `x-razorpay-signature`: Webhook signature from Razorpay

**Body:** Raw webhook payload

**Response:**
```json
{
  "success": true,
  "verified": true,
  "payload": {
    "event": "payment.captured",
    ...
  }
}
```

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "razorpay-api",
  "version": "1.0.0",
  "endpoints": [...]
}
```

## 🔐 Authentication

All requests require an API key in the header:

```bash
curl -H "X-API-Key: your-secret-api-key-12345" \
  https://razorpay-api.dark-mode-d021.workers.dev/create-order
```

## 🚀 Deployment

### Local Development

```bash
cd cloudflare-workers/razorpay-api
npm install
npm run dev  # Runs on http://localhost:8787
```

### Production Deployment

1. **Set production secret:**
```bash
wrangler secret put RAZORPAY_KEY_SECRET
# Enter: your_production_secret
```

2. **Deploy:**
```bash
wrangler deploy
```

3. **Deployed URL:**
```
https://razorpay-api.dark-mode-d021.workers.dev
```

## ⚙️ Configuration

### `wrangler.toml`

```toml
name = "razorpay-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

# Production (default)
[vars]
RAZORPAY_KEY_ID = "rzp_live_xxx"
SHARED_API_KEY = "your-secret-api-key-12345"
ENVIRONMENT = "production"

# Test environment
[env.test]
vars = { 
  RAZORPAY_KEY_ID = "rzp_test_xxx",
  ENVIRONMENT = "development"
}
```

### `.dev.vars` (Local only)

```bash
RAZORPAY_KEY_SECRET=your_test_secret
```

**Important:** `.dev.vars` is only for local development. Production secrets are set via `wrangler secret put`.

## 🔌 Usage from Pages Functions

### Environment Variables

**Local development (`.dev.vars`):**
```bash
RAZORPAY_WORKER_URL=http://localhost:8787
RAZORPAY_WORKER_API_KEY=your-secret-api-key-12345
```

**Production (Cloudflare Pages dashboard):**
```bash
RAZORPAY_WORKER_URL=https://razorpay-api.dark-mode-d021.workers.dev
RAZORPAY_WORKER_API_KEY=your-secret-api-key-12345
```

### Code Example

```javascript
// In functions/api/payments/handlers/payments.ts

const razorpayWorkerUrl = env.RAZORPAY_WORKER_URL || 'http://localhost:8787';

const response = await fetch(`${razorpayWorkerUrl}/create-order`, {
  method: 'POST',
  headers: {
    'X-API-Key': env.RAZORPAY_WORKER_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 50000,
    currency: 'INR',
    receipt: 'rcpt_123',
    notes: { user_id: 'abc123' }
  })
});

const result = await response.json();
// result.order.id, result.key_id
```

## 🌍 Multi-Website Usage

This worker can be shared across multiple websites:

**Website A:**
```bash
RAZORPAY_WORKER_URL=https://razorpay-api.dark-mode-d021.workers.dev
RAZORPAY_WORKER_API_KEY=your-secret-api-key-12345
```

**Website B:**
```bash
RAZORPAY_WORKER_URL=https://razorpay-api.dark-mode-d021.workers.dev
RAZORPAY_WORKER_API_KEY=your-secret-api-key-12345
```

All websites call the same worker with the same API key. The worker handles all Razorpay operations, while each website handles its own business logic (database, emails, etc.).

## 🔄 Development vs Production

### Local Development
- Worker runs on `http://localhost:8787`
- Uses test Razorpay keys (`rzp_test_...`)
- Secret from `.dev.vars`

### Production
- Worker deployed to Cloudflare
- Uses live Razorpay keys (`rzp_live_...`)
- Secret from `wrangler secret put`

**How Pages Functions know which to use:**
- Local: `.dev.vars` has `RAZORPAY_WORKER_URL=http://localhost:8787`
- Production: Cloudflare Pages env vars have `RAZORPAY_WORKER_URL=https://razorpay-api...`

## 📝 Key Concepts for Junior Developers

### Why a separate worker?

Instead of putting Razorpay code in each website:
```
❌ Website A → Razorpay API (credentials in A)
❌ Website B → Razorpay API (credentials in B)
❌ Website C → Razorpay API (credentials in C)
```

We use a shared worker:
```
✅ Website A ──┐
✅ Website B ──┼──> Razorpay Worker → Razorpay API
✅ Website C ──┘
```

### What are secrets?

Secrets are sensitive values (like API keys) that should never be in code:
- ❌ Don't put in `wrangler.toml` (committed to git)
- ✅ Use `wrangler secret put` (encrypted in Cloudflare)
- ✅ Use `.dev.vars` for local (not committed to git)

### Environment detection

The worker doesn't detect environment automatically. It uses whatever keys are configured:
- Local: Test keys from `wrangler.toml` default + `.dev.vars`
- Production: Live keys from `wrangler.toml` default + `wrangler secret`

## 🧪 Testing

```bash
# Health check
curl https://razorpay-api.dark-mode-d021.workers.dev/health

# Create order (requires API key)
curl -X POST https://razorpay-api.dark-mode-d021.workers.dev/create-order \
  -H "X-API-Key: your-secret-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{"amount":50000,"currency":"INR"}'
```

## 📚 Related Documentation

- **Razorpay Docs:** https://razorpay.com/docs/

---

**Deployed URL:** https://razorpay-api.dark-mode-d021.workers.dev  
**Status:** ✅ Active (Production)  
**Last Updated:** March 5, 2026
