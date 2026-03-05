# Razorpay API Worker v2.0

Enterprise-grade Cloudflare Worker for Razorpay payment processing. Built with TypeScript, featuring rate limiting, structured logging, and per-website API keys.

## 🚀 Features

- ✅ **TypeScript** - Full type safety and modern tooling
- ✅ **Rate Limiting** - 20 requests/min per endpoint per API key
- ✅ **Structured Logging** - JSON logs with request IDs and metadata
- ✅ **Retry Logic** - Automatic retry with exponential backoff
- ✅ **Request Timeouts** - 10s timeout on all Razorpay API calls
- ✅ **CORS** - Origin validation with whitelist
- ✅ **Health Checks** - Deep health check with Razorpay connectivity test
- ✅ **Per-Website Auth** - Separate API keys per website (backward compatible)
- ✅ **Error Handling** - Comprehensive error codes and messages
- ✅ **Modular Architecture** - Clean separation (routes, middleware, utils)

## 📡 API Endpoints

| Endpoint | Method | Description | Rate Limit |
|----------|--------|-------------|------------|
| `/create-order` | POST | Create Razorpay order | 20/min |
| `/verify-payment` | POST | Verify payment signature | 30/min |
| `/payment/:id` | GET | Get payment details | 50/min |
| `/subscription/:id/cancel` | POST | Cancel subscription | 10/min |
| `/verify-webhook` | POST | Verify webhook signature | 100/min |
| `/health` | GET | Health check | No limit |

## 🔐 Authentication

All requests (except `/health`) require `X-API-Key` header:

```bash
curl -H "X-API-Key: your-secret-api-key-12345" \
  https://razorpay-api.dark-mode-d021.workers.dev/create-order
```

## 🚀 Quick Start

### Local Development

```bash
cd cloudflare-workers/razorpay-api
npm install
npm run dev  # Runs on http://localhost:8787
```

### Test Request

```bash
curl -X POST http://localhost:8787/create-order \
  -H "X-API-Key: your-secret-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{"amount":50000,"currency":"INR"}'
```

### Deploy to Production

```bash
# Set secrets (one-time)
wrangler secret put RAZORPAY_KEY_ID
wrangler secret put RAZORPAY_KEY_SECRET
wrangler secret put SHARED_API_KEY

# Deploy
npm run deploy
```

## ⚙️ Configuration

### Environment Variables

**`.dev.vars` (local development):**
```bash
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=test_secret
SHARED_API_KEY=your-secret-api-key-12345
```

**Production (via `wrangler secret put`):**
- `RAZORPAY_KEY_ID` - Live Razorpay key
- `RAZORPAY_KEY_SECRET` - Live Razorpay secret
- `SHARED_API_KEY` - API key for authentication

### Rate Limits

Edit `src/constants.ts`:
```typescript
export const RATE_LIMIT_MAX_REQUESTS = {
  'create-order': 20,
  'verify-payment': 30,
  'get-payment': 50,
  'cancel-subscription': 10,
  'verify-webhook': 100,
};
```

### CORS Origins

Edit `src/constants.ts`:
```typescript
export const ALLOWED_ORIGINS = [
  'https://skillpassport.com',
  'https://website-b.com',
  'http://localhost:8788',
];
```

## 📊 Structured Logging

All requests generate structured JSON logs:

```json
{
  "level": "info",
  "message": "Request completed",
  "timestamp": "2026-03-05T11:29:44.990Z",
  "requestId": "b27cbd21-93c0-49f9-86da-12053d133054",
  "website": "legacy",
  "meta": {
    "duration": 327,
    "status": 200
  }
}
```

## 🏥 Health Check

```bash
# Basic health check
curl http://localhost:8787/health

# Deep health check (tests Razorpay connectivity)
curl "http://localhost:8787/health?deep=true"
```

Response:
```json
{
  "status": "ok",
  "service": "razorpay-api",
  "version": "2.0.0",
  "environment": "production",
  "uptime": 94128,
  "checks": {
    "razorpay": "ok"
  }
}
```

## 🔌 Usage from Pages Functions

```typescript
const response = await fetch(`${env.RAZORPAY_WORKER_URL}/create-order`, {
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
```

## 🏗️ Project Structure

```
src/
├── index.ts              # Main entry point
├── types.ts              # TypeScript types
├── constants.ts          # Configuration constants
├── middleware/
│   ├── auth.ts          # API key authentication
│   ├── rateLimit.ts     # Rate limiting
│   └── logger.ts        # Structured logging
├── routes/
│   ├── health.ts        # Health check
│   ├── orders.ts        # Order creation
│   └── payments.ts      # Payment operations
└── utils/
    ├── response.ts      # Response helpers
    └── fetch.ts         # Fetch with timeout/retry
```

## 🧪 Testing

```bash
# Type check
npm run type-check

# Test health
curl http://localhost:8787/health

# Test rate limiting (should fail after 20 requests)
for i in {1..25}; do 
  curl -X POST http://localhost:8787/create-order \
    -H "X-API-Key: your-secret-api-key-12345" \
    -H "Content-Type: application/json" \
    -d '{"amount":1000}'
done
```

## 📝 Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid API key |
| `INVALID_INPUT` | Invalid request parameters |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `RAZORPAY_API_ERROR` | Razorpay API error |
| `INTERNAL_ERROR` | Internal server error |
| `NOT_FOUND` | Endpoint not found |
| `TIMEOUT` | Request timeout |

## 🔄 Changelog

### v2.0.0 (March 5, 2026)
- ✅ Migrated to TypeScript
- ✅ Added rate limiting
- ✅ Added structured logging
- ✅ Added per-website API keys
- ✅ Added retry logic with exponential backoff
- ✅ Added request timeouts
- ✅ Added CORS origin validation
- ✅ Modular architecture refactor

### v1.0.0
- Initial JavaScript implementation

---

**Deployed URL:** https://razorpay-api.dark-mode-d021.workers.dev  
**Status:** ✅ Active  
**Version:** 2.0.0
