# Cloudflare Workers

This directory contains Cloudflare Workers that replace Supabase Edge Functions for better performance, lower latency, and cost efficiency.

## Workers Overview

| Worker | Endpoints | Description |
|--------|-----------|-------------|
| **assessment-api** | `/generate`, `/evaluate` | AI-powered assessment generation |
| **career-api** | `/chat`, `/recommend-opportunities`, `/generate-embedding` | Career AI chat, job matching |
| **course-api** | `/get-file-url`, `/ai-tutor-*`, `/ai-video-summarizer` | Course-related AI features |
| **email-api** | `/send`, `/send-bulk` | Email sending via Resend |
| **embedding-api** | `/embed`, `/embed/batch`, `/backfill`, `/regenerate`, `/process-queue`, `/stats` | OpenRouter embedding generation with queue |
| **fetch-certificate** | `/fetch`, `/verify` | Certificate fetching and verification |
| **otp-api** | `/send`, `/verify` | OTP via Twilio |
| **payments-api** | `/create-order`, `/verify-payment`, `/webhook`, `/addons/*`, `/entitlements/*` | Razorpay payments & subscriptions |
| **storage-api** | `/upload`, `/presigned`, `/get-url`, `/delete`, `/extract-content` | R2 file storage |
| **streak-api** | `/:studentId`, `/:studentId/complete`, `/reset-daily` | Student streak management |
| **user-api** | `/create-student`, `/create-teacher`, `/reset-password` | User management |



## GitHub Actions Deployment

Workers are automatically deployed via GitHub Actions when changes are pushed to `main`, `production`, or `dev-skillpassport` branches.

### Automatic Deployment
- Push changes to `cloudflare-workers/**` → Deploys only changed workers
- Workflow: `.github/workflows/deploy-workers.yml`

### Manual Deployment
1. Go to Actions → "Deploy Cloudflare Workers"
2. Click "Run workflow"
3. Select specific worker or leave empty for all

### Required GitHub Secrets
Add these secrets in your repository settings:

```
# Cloudflare
CLOUDFLARE_API_TOKEN        # Wrangler API token with Workers permissions
CLOUDFLARE_ACCOUNT_ID       # Your Cloudflare account ID

# Supabase (all workers)
VITE_SUPABASE_URL           # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY   # Service role key

# AI Services
OPENROUTER_API_KEY          # For embedding-api
VITE_OPENROUTER_API_KEY     # For career-api, assessment-api

# Payments
RAZORPAY_KEY_ID             # Razorpay key ID
RAZORPAY_KEY_SECRET         # Razorpay secret
RAZORPAY_WEBHOOK_SECRET     # Webhook verification

# Storage
R2_ACCESS_KEY_ID            # R2 access key
R2_SECRET_ACCESS_KEY        # R2 secret key
R2_BUCKET_NAME              # R2 bucket name

# Email/SMS
RESEND_API_KEY              # For email-api
TWILIO_ACCOUNT_SID          # For otp-api
TWILIO_AUTH_TOKEN           # For otp-api
```

## Quick Start

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
wrangler login
```

### 2. Deploy All Workers
```bash
# From each worker directory
cd cloudflare-workers/course-api && npm install && npm run deploy
cd cloudflare-workers/career-api && npm install && npm run deploy
cd cloudflare-workers/payments-api && npm install && npm run deploy
cd cloudflare-workers/user-api && npm install && npm run deploy
cd cloudflare-workers/storage-api && npm install && npm run deploy
```

### 3. Configure Secrets
Each worker needs these secrets (set via `wrangler secret put`):

```bash
# Common secrets for all workers
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# AI workers (course-api, career-api)
wrangler secret put OPENROUTER_API_KEY

# course-api additional
wrangler secret put DEEPGRAM_API_KEY
wrangler secret put GROQ_API_KEY
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put CLOUDFLARE_R2_ACCESS_KEY_ID
wrangler secret put CLOUDFLARE_R2_SECRET_ACCESS_KEY

# payments-api
wrangler secret put RAZORPAY_KEY_ID
wrangler secret put RAZORPAY_KEY_SECRET
wrangler secret put RAZORPAY_WEBHOOK_SECRET
```

### 4. Update Frontend Environment
Add worker URLs to your `.env`:
```env
VITE_COURSE_API_URL=https://course-api.your-subdomain.workers.dev
VITE_CAREER_API_URL=https://career-api.your-subdomain.workers.dev
VITE_PAYMENTS_API_URL=https://payments-api.your-subdomain.workers.dev
VITE_USER_API_URL=https://user-api.your-subdomain.workers.dev
VITE_STORAGE_API_URL=https://storage-api.your-subdomain.workers.dev
```

## Frontend Services

Each worker has a corresponding frontend service in `src/services/`:

- `courseApiService.js` - Course API calls
- `careerApiService.js` - Career API calls
- `paymentsApiService.js` - Payment API calls
- `userApiService.js` - User management calls
- `storageApiService.js` - File storage calls

All services automatically fall back to Supabase Edge Functions if worker URLs are not configured.

## Architecture

```
Frontend App
     │
     ├── courseApiService.js ──────► course-api Worker
     ├── careerApiService.js ──────► career-api Worker
     ├── paymentsApiService.js ────► payments-api Worker
     ├── userApiService.js ────────► user-api Worker
     └── storageApiService.js ─────► storage-api Worker
                                          │
                                          ▼
                                    Supabase Database
                                    Cloudflare R2
                                    OpenRouter AI
                                    Razorpay
```

## Benefits Over Supabase Edge Functions

1. **Lower Latency** - Cloudflare's global edge network
2. **Better Cold Starts** - Workers start in <5ms vs 500ms+
3. **Cost Efficient** - 100k free requests/day
4. **R2 Integration** - Native R2 bindings for storage
5. **Streaming** - Better SSE support for AI chat
6. **Debugging** - `wrangler tail` for real-time logs

## Development

```bash
# Start local dev server
cd cloudflare-workers/course-api
npm run dev

# View logs
npm run tail
```
