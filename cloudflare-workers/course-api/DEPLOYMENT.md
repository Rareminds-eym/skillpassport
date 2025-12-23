# Course API Worker Deployment Guide

## Quick Start

```bash
cd cloudflare-workers/course-api
npm install
```

## Set Secrets

```bash
# Supabase credentials
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# AI API key
wrangler secret put OPENROUTER_API_KEY

# Optional: For video transcription
wrangler secret put DEEPGRAM_API_KEY

# R2 credentials (same as used for upload-to-r2)
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put CLOUDFLARE_R2_ACCESS_KEY_ID
wrangler secret put CLOUDFLARE_R2_SECRET_ACCESS_KEY
wrangler secret put CLOUDFLARE_R2_BUCKET_NAME
```

## Deploy

```bash
npm run deploy
```

## Configure Frontend

Add to your `.env`:

```env
VITE_COURSE_API_URL=https://course-api.<your-subdomain>.workers.dev
```

## Endpoints Migrated

| Supabase Edge Function | Worker Endpoint |
|------------------------|-----------------|
| `get-file-url` | `/get-file-url` |
| `ai-tutor-suggestions` | `/ai-tutor-suggestions` |
| `ai-tutor-chat` | `/ai-tutor-chat` |
| `ai-tutor-feedback` | `/ai-tutor-feedback` |
| `ai-tutor-progress` | `/ai-tutor-progress` |
| `ai-video-summarizer` | `/ai-video-summarizer` |

## Fallback Behavior

If `VITE_COURSE_API_URL` is not set, the frontend automatically falls back to Supabase Edge Functions. This allows gradual migration.
