# GitHub Secrets Setup for Cloudflare Workers Deployment

This guide explains how to set up the required GitHub secrets for automatic Cloudflare Workers deployment.

## Required Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

### Cloudflare Credentials (Required)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `CLOUDFLARE_API_TOKEN` | Wrangler API token | Cloudflare Dashboard → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template |
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID | Cloudflare Dashboard → Workers & Pages → Overview → Account ID (right sidebar) |

### Supabase Credentials (Required for all workers)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Supabase Dashboard → Settings → API → service_role key |

### AI Services

| Secret Name | Used By | Description |
|-------------|---------|-------------|
| `OPENROUTER_API_KEY` | embedding-api | OpenRouter API key for embeddings |
| `OPENROUTER_API_KEY` | career-api, assessment-api | OpenRouter API key for AI features |

### Payment Services

| Secret Name | Used By | Description |
|-------------|---------|-------------|
| `RAZORPAY_KEY_ID` | payments-api | Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | payments-api | Razorpay Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | payments-api | Webhook signature verification |

### Storage Services

| Secret Name | Used By | Description |
|-------------|---------|-------------|
| `R2_ACCESS_KEY_ID` | storage-api | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | storage-api | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | storage-api | R2 bucket name |

### Communication Services

| Secret Name | Used By | Description |
|-------------|---------|-------------|
| `RESEND_API_KEY` | email-api | Resend email API key |
| `TWILIO_ACCOUNT_SID` | otp-api | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | otp-api | Twilio auth token |

## Creating Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click your profile icon → My Profile
3. Go to API Tokens tab
4. Click "Create Token"
5. Use the "Edit Cloudflare Workers" template
6. Set permissions:
   - Account: Workers Scripts: Edit
   - Account: Workers KV Storage: Edit
   - Account: Workers R2 Storage: Edit
   - Zone: Workers Routes: Edit
7. Click "Continue to summary" → "Create Token"
8. Copy the token and add it as `CLOUDFLARE_API_TOKEN` secret

## Workflow Triggers

The workflow runs automatically when:
- Push to `main`, `production`, or `dev-skillpassport` branches
- Changes detected in `cloudflare-workers/**` directory

Manual deployment:
1. Go to Actions → "Deploy Cloudflare Workers"
2. Click "Run workflow"
3. Select branch and specific worker (or "all")

## Worker URLs

After deployment, workers are available at:

| Worker | URL |
|--------|-----|
| assessment-api | https://assessment-api.dark-mode-d021.workers.dev |
| career-api | https://career-api.dark-mode-d021.workers.dev |
| course-api | https://course-api.dark-mode-d021.workers.dev |
| email-api | https://email-api.dark-mode-d021.workers.dev |
| embedding-api | https://embedding-api.dark-mode-d021.workers.dev |
| fetch-certificate | https://fetch-certificate.dark-mode-d021.workers.dev |
| otp-api | https://otp-api.dark-mode-d021.workers.dev |
| payments-api | https://payments-api.dark-mode-d021.workers.dev |
| storage-api | https://storage-api.dark-mode-d021.workers.dev |
| streak-api | https://streak-api.dark-mode-d021.workers.dev |
| user-api | https://user-api.dark-mode-d021.workers.dev |

## Troubleshooting

### Deployment fails with "Authentication error"
- Verify `CLOUDFLARE_API_TOKEN` is correct and not expired
- Ensure token has "Workers Scripts: Edit" permission

### Secrets not being set
- Check if the secret exists in GitHub repository settings
- Secrets are only set if they have a value (empty secrets are skipped)

### Worker not found
- Ensure the worker directory exists in `cloudflare-workers/`
- Check that `wrangler.toml` exists in the worker directory
