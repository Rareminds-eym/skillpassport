# Cloudflare Pages Environment Variables Configuration

This document provides a comprehensive guide for configuring environment variables in Cloudflare Pages for the consolidated architecture.

## Overview

After migrating 12 APIs to Cloudflare Pages Functions, all environment variables must be configured in the Cloudflare Pages dashboard. This ensures Pages Functions have access to required secrets and configuration.

## Configuration Steps

### 1. Access Cloudflare Pages Dashboard

1. Log in to Cloudflare Dashboard: https://dash.cloudflare.com/
2. Navigate to **Workers & Pages** → **Pages**
3. Select your Pages project (e.g., `skill-passport-portal`)
4. Go to **Settings** → **Environment variables**

### 2. Configure Environment Variables

Add the following environment variables for both **Production** and **Preview** environments:

## Required Environment Variables

### Supabase Configuration

```
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```

**Used by:** All APIs for database access

---

### AI Service API Keys

```
OPENROUTER_API_KEY=<your-openrouter-api-key>
CLAUDE_API_KEY=<your-claude-api-key>
GEMINI_API_KEY=<your-gemini-api-key>
```

**Used by:**
- `assessment-api` - Question generation with Claude/OpenRouter fallback
- `career-api` - Resume parsing, field keywords, embeddings
- `course-api` - AI tutor, video summarizer
- `adaptive-aptitude-api` - Adaptive question generation
- `analyze-assessment-api` - Assessment analysis
- `question-generation-api` - Unified question generation
- `role-overview-api` - Role overviews and course matching

---

### AWS Configuration (for OTP SMS)

```
AWS_ACCESS_KEY_ID=<your-aws-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-access-key>
AWS_REGION=ap-south-1
```

**Used by:** `otp-api` for sending SMS via AWS SNS

---

### Cloudflare R2 Configuration (for Storage)

```
CLOUDFLARE_ACCOUNT_ID=<your-cloudflare-account-id>
CLOUDFLARE_R2_ACCESS_KEY_ID=<your-r2-access-key-id>
CLOUDFLARE_R2_SECRET_ACCESS_KEY=<your-r2-secret-access-key>
CLOUDFLARE_R2_BUCKET_NAME=skill-echosystem
```

**Used by:**
- `storage-api` - File upload/download operations
- `course-api` - Signed URL generation for course files

---

### Razorpay Configuration (for Payments)

**Note:** Razorpay is used by the standalone `payments-api` worker, NOT by Pages Functions. These variables should be configured in `cloudflare-workers/payments-api/wrangler.toml` instead.

For reference only:
```
# Test Mode (for development/staging)
RAZORPAY_KEY_ID=<your-razorpay-test-key-id>
RAZORPAY_KEY_SECRET=<your-razorpay-test-key-secret>

# Live Mode (for production)
RAZORPAY_KEY_ID=<your-razorpay-live-key-id>
RAZORPAY_KEY_SECRET=<your-razorpay-live-key-secret>
```

---

## Environment-Specific Configuration

### Production Environment

Use **LIVE** credentials for production:
- Razorpay: `rzp_live_*` keys (configured in payments-api worker)
- All other services: Use production keys as listed above

### Preview/Development Environment

Use **TEST** credentials for preview deployments:
- Razorpay: `rzp_test_*` keys (configured in payments-api worker)
- All other services: Can use same keys as production (or separate dev keys if available)

---

## Verification Steps

After configuring environment variables:

### 1. Verify Pages Functions Can Access Variables

Deploy a test function to verify environment variable access:

```typescript
// functions/api/test-env.ts
export async function onRequest(context) {
  const { env } = context;
  
  const checks = {
    supabase: !!env.SUPABASE_URL && !!env.SUPABASE_ANON_KEY,
    ai: !!env.OPENROUTER_API_KEY && !!env.CLAUDE_API_KEY && !!env.GEMINI_API_KEY,
    aws: !!env.AWS_ACCESS_KEY_ID && !!env.AWS_SECRET_ACCESS_KEY,
    r2: !!env.CLOUDFLARE_R2_ACCESS_KEY_ID && !!env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  };
  
  return new Response(JSON.stringify(checks, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

Expected response:
```json
{
  "supabase": true,
  "ai": true,
  "aws": true,
  "r2": true
}
```

### 2. Test Each API Endpoint

Test critical endpoints for each API:

```bash
# Assessment API
curl https://your-pages-url.pages.dev/api/assessment/generate

# Career API
curl https://your-pages-url.pages.dev/api/career/generate-embedding

# OTP API
curl -X POST https://your-pages-url.pages.dev/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# Storage API
curl https://your-pages-url.pages.dev/api/storage/health
```

### 3. Monitor Error Logs

Check Cloudflare Pages logs for any environment variable errors:
1. Go to **Workers & Pages** → **Pages** → Your Project
2. Click **Functions** tab
3. Check **Real-time Logs** for errors like:
   - `Missing required environment variable: SUPABASE_URL`
   - `Failed to initialize Supabase client`
   - `AI API key not configured`

---

## Security Best Practices

### 1. Never Commit Secrets to Git

- ✅ Environment variables are configured in Cloudflare Dashboard
- ✅ `.env` file is in `.gitignore`
- ❌ Never commit API keys, secrets, or tokens to version control

### 2. Rotate Secrets Regularly

- Rotate API keys every 90 days
- Update both Cloudflare Pages and standalone workers
- Test thoroughly after rotation

### 3. Use Environment-Specific Secrets

- Production: Use live/production API keys
- Preview/Staging: Use test/sandbox API keys
- Development: Use local `.env` file (never deployed)

### 4. Limit Secret Access

- Only configure secrets that each service needs
- Use service-specific API keys when possible
- Monitor API key usage for anomalies

---

## Troubleshooting

### Issue: "Missing required environment variable"

**Solution:**
1. Verify variable is configured in Cloudflare Pages dashboard
2. Check spelling matches exactly (case-sensitive)
3. Redeploy Pages application after adding variables

### Issue: "Supabase client initialization failed"

**Solution:**
1. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
2. Check URL format: `https://[project-ref].supabase.co`
3. Verify anon key is valid JWT token

### Issue: "AI API rate limit exceeded"

**Solution:**
1. Check API key quotas in provider dashboards
2. Implement rate limiting in API handlers
3. Consider upgrading API plan or adding more providers

### Issue: "AWS SNS authentication failed"

**Solution:**
1. Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct
2. Check IAM user has SNS permissions
3. Verify `AWS_REGION` matches SNS configuration

---

## Migration Checklist

- [ ] Configure all environment variables in Cloudflare Pages dashboard
- [ ] Verify variables are set for both Production and Preview environments
- [ ] Deploy test function to verify variable access
- [ ] Test each API endpoint with real requests
- [ ] Monitor error logs for missing variables
- [ ] Document any environment-specific differences
- [ ] Update team documentation with new configuration process

---

## Related Documentation

- [Cloudflare Pages Environment Variables](https://developers.cloudflare.com/pages/platform/functions/bindings/#environment-variables)
- [Supabase Client Configuration](https://supabase.com/docs/reference/javascript/initializing)
- [AWS SNS Configuration](https://docs.aws.amazon.com/sns/latest/dg/sns-getting-started.html)
- [Cloudflare R2 Configuration](https://developers.cloudflare.com/r2/api/s3/api/)

---

## Next Steps

After configuring environment variables:
1. ✅ Complete Task 16: Configure environment variables
2. ➡️ Proceed to Task 16.1: Write property test for environment variable accessibility
3. ➡️ Proceed to Task 17: Update frontend service files with fallback logic
