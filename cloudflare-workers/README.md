# Cloudflare Workers

This directory contains Cloudflare Workers that replace Supabase Edge Functions for better performance, lower latency, and cost efficiency.

## Workers Overview

| Worker | Endpoints | Description |
|--------|-----------|-------------|
| **course-api** | `/get-file-url`, `/ai-tutor-*`, `/ai-video-summarizer` | Course-related AI features |
| **career-api** | `/chat`, `/recommend-opportunities`, `/generate-embedding` | Career AI chat, job matching, embedding generation |
| **payments-api** | `/create-order`, `/create-event-order`, `/verify-payment`, `/webhook`, `/cancel-subscription`, `/deactivate-subscription`, `/expire-subscriptions` | Razorpay payment processing |
| **user-api** | `/create-student`, `/create-teacher`, `/create-event-user`, `/send-interview-reminder`, `/reset-password` | User management |
| **storage-api** | `/upload`, `/delete`, `/extract-content` | R2 file storage |


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
