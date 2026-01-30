# Cloudflare Workers - Standalone Workers Only

This directory contains the 3 standalone Cloudflare Workers that require special features (cron jobs, stable webhook URLs, or service bindings).

## ✅ Architecture After Consolidation

**12 APIs** have been migrated to **Cloudflare Pages Functions** (see `functions/api/` directory).

**3 Standalone Workers** remain here for special requirements:

| Worker | Purpose | Special Features |
|--------|---------|------------------|
| **payments-api** | Razorpay payments & subscriptions | Stable webhook URL, cron for entitlements, service bindings |
| **email-api** | Email sending via Resend | Cron for scheduled countdown emails |
| **embedding-api** | OpenRouter embedding generation | Cron for queue processing every 5 minutes |

## 📦 Migrated to Pages Functions

The following APIs are now in `functions/api/`:

- ✅ assessment-api → `functions/api/assessment/`
- ✅ career-api → `functions/api/career/`
- ✅ course-api → `functions/api/course/`
- ✅ fetch-certificate → `functions/api/fetch-certificate/`
- ✅ otp-api → `functions/api/otp/`
- ✅ storage-api → `functions/api/storage/`
- ✅ streak-api → `functions/api/streak/`
- ✅ user-api → `functions/api/user/`
- ✅ adaptive-aptitude-api → `functions/api/adaptive-aptitude/`
- ✅ analyze-assessment-api → `functions/api/analyze-assessment/`
- ✅ question-generation-api → `functions/api/question-generation/`
- ✅ role-overview-api → `functions/api/role-overview/`

## 🚀 Standalone Workers

### 1. payments-api

**Why Standalone:**
- Razorpay webhook URL must remain stable
- Cron job for entitlement lifecycle (daily at 6:00 AM UTC)
- Service bindings to email-api and storage-api

**Endpoints:**
- `/create-order` - Create Razorpay order
- `/verify-payment` - Verify payment signature
- `/webhook` - Razorpay webhook handler
- `/addons/*` - Addon management
- `/entitlements/*` - Entitlement management

**Deploy:**
```bash
cd cloudflare-workers/payments-api
npm install
npm run deploy
```

### 2. email-api

**Why Standalone:**
- Cron job for scheduled countdown emails (daily at 6:50 AM UTC)

**Endpoints:**
- `/send` - Send single email
- `/send-bulk` - Send bulk emails

**Deploy:**
```bash
cd cloudflare-workers/email-api
npm install
npm run deploy
```

### 3. embedding-api

**Why Standalone:**
- Cron job for queue processing (every 5 minutes)

**Endpoints:**
- `/embed` - Generate single embedding
- `/embed/batch` - Batch embedding generation
- `/process-queue` - Process embedding queue
- `/backfill` - Backfill embeddings
- `/regenerate` - Regenerate embeddings
- `/stats` - Queue statistics

**Deploy:**
```bash
cd cloudflare-workers/embedding-api
npm install
npm run deploy
```

## 🔧 Configuration

### Required Secrets

Each worker needs secrets configured via `wrangler secret put`:

**payments-api:**
```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put RAZORPAY_KEY_ID
wrangler secret put RAZORPAY_KEY_SECRET
wrangler secret put RAZORPAY_WEBHOOK_SECRET
```

**email-api:**
```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put RESEND_API_KEY
```

**embedding-api:**
```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put OPENROUTER_API_KEY
```

### Service Bindings

The `payments-api` uses service bindings to communicate with other workers:

```toml
# In payments-api/wrangler.toml
[[services]]
binding = "EMAIL_API"
service = "email-api"

[[services]]
binding = "STORAGE_API"
service = "storage-api"
```

## 📊 New Architecture

```
Cloudflare Pages
├── Frontend Application
└── Pages Functions (12 APIs)
    ├── assessment, career, course, fetch-certificate
    ├── otp, storage, streak, user
    └── adaptive-aptitude, analyze-assessment, 
        question-generation, role-overview

Standalone Workers (3)
├── payments-api (webhook + cron + service bindings)
├── email-api (cron)
└── embedding-api (cron)
```

## 🧪 Local Development

### Test Standalone Workers

```bash
# Start local dev server
cd cloudflare-workers/payments-api
npm run dev

# View logs
npm run tail
```

### Test Pages Functions

```bash
# From project root
npm run pages:dev
```

## 📚 Documentation

- **Pages Functions**: See `functions/README.md`
- **Shared Utilities**: See `src/functions-lib/`
- **Frontend Services**: See `src/services/`
- **Migration Guide**: See `FRONTEND_SERVICE_MIGRATION_GUIDE.md`

## 🎯 Benefits of Consolidation

1. **Simplified Deployment** - 12 APIs deploy together with frontend
2. **Shared Code** - Common utilities in `src/functions-lib/`
3. **Better DX** - File-based routing, easier testing
4. **Reduced Costs** - Fewer worker deployments
5. **Easier Maintenance** - Single codebase for most APIs

## 🔄 Migration Status

- ✅ All 12 APIs migrated to Pages Functions
- ✅ Frontend services updated with fallback logic
- ✅ Shared utilities implemented
- ✅ Property tests passing (205/205)
- ✅ Local cleanup complete

---

**Last Updated**: January 28, 2026  
**Status**: Consolidation complete (local)  
**Remaining Workers**: 3 standalone workers
