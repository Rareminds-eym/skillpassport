# Shared Email API - Environment Variables Checklist

Complete checklist of all required environment variables for `shared-email-api` local development.

---

## 📋 Required Variables in `.dev.vars`

Create this file: `cloudflare-workers/shared-email-api/.dev.vars`

### ✅ **1. API_KEY** (REQUIRED)
```ini
API_KEY=your_secret_api_key_here
```

**Purpose:** Authentication key for API requests  
**Used by:** `src/middleware/auth.ts`  
**Example:** `API_KEY=dev_secret_key_12345`  
**Notes:** 
- Can be any string you choose
- Must match the key used by clients calling this API
- Keep it secret, never commit to git

---

### ✅ **2. AWS_ACCESS_KEY_ID** (REQUIRED)
```ini
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
```

**Purpose:** AWS IAM access key for SES  
**Used by:** `src/providers/SESProvider.ts`  
**Example:** `AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX`  
**Notes:**
- Must have SES send permissions
- Get from AWS IAM Console
- **CRITICAL:** Without this, emails will fail

---

### ✅ **3. AWS_SECRET_ACCESS_KEY** (REQUIRED)
```ini
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
```

**Purpose:** AWS IAM secret key for SES  
**Used by:** `src/providers/SESProvider.ts`  
**Example:** `AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here`  
**Notes:**
- Paired with AWS_ACCESS_KEY_ID
- Keep secret, never commit to git
- **CRITICAL:** Without this, emails will fail

---

### ✅ **4. AWS_REGION** (REQUIRED)
```ini
AWS_REGION=ap-south-1
```

**Purpose:** AWS region where SES is configured  
**Used by:** `src/providers/SESProvider.ts`  
**Example:** `AWS_REGION=ap-south-1` (Mumbai)  
**Notes:**
- Must match the region where your SES is set up
- Common values: `us-east-1`, `ap-south-1`, `eu-west-1`
- **Already set in wrangler.toml** but can be overridden in .dev.vars

---

### ✅ **5. DEFAULT_FROM_EMAIL** (REQUIRED)
```ini
DEFAULT_FROM_EMAIL=no-reply@rareminds.in
```

**Purpose:** Default sender email address  
**Used by:** `src/config/config.ts`  
**Example:** `DEFAULT_FROM_EMAIL=no-reply@rareminds.in`  
**Notes:**
- **MUST be verified in AWS SES**
- If not verified, all emails will fail with "Email address not verified"
- Can be overridden per-request in API calls

**How to verify in AWS SES:**
1. Go to AWS SES Console
2. Click "Verified identities"
3. Click "Create identity"
4. Choose "Email address"
5. Enter `no-reply@rareminds.in`
6. Click verification link in email

---

### ✅ **6. DEFAULT_FROM_NAME** (REQUIRED)
```ini
DEFAULT_FROM_NAME=Rareminds Skill Passport
```

**Purpose:** Default sender display name  
**Used by:** `src/config/config.ts`  
**Example:** `DEFAULT_FROM_NAME=Rareminds Skill Passport`  
**Notes:**
- Shows as "Rareminds Skill Passport <no-reply@rareminds.in>"
- Can be overridden per-request in API calls

---

## 🔧 Auto-Configured Variables

These are set in `wrangler.toml` and don't need to be in `.dev.vars`:

### ⚙️ **ENVIRONMENT**
```toml
# In wrangler.toml
vars = { ENVIRONMENT = "development" }
```

**Purpose:** Environment identifier  
**Values:** `development`, `staging`, `production`  
**Used by:** CORS validation (blocks localhost in production)  
**Notes:** Automatically set by wrangler based on which environment you're running

---

### ⚙️ **RATE_LIMIT_KV**
```toml
# In wrangler.toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
```

**Purpose:** KV namespace for rate limiting  
**Used by:** `src/middleware/rateLimit.ts`  
**Notes:** Automatically bound by wrangler, no manual setup needed for local dev

---

### ⚙️ **RATE_LIMITER_MINUTE**
```toml
# In wrangler.toml
[[ratelimits]]
name = "RATE_LIMITER_MINUTE"
```

**Purpose:** Per-minute rate limiter  
**Used by:** `src/middleware/rateLimit.ts`  
**Notes:** Automatically bound by wrangler

---

## 🚫 NOT Required (Hardcoded in Code)

These are hardcoded in `src/constants.ts` and don't need environment variables:

- **ALLOWED_ORIGINS** - Hardcoded list of allowed CORS origins
- **RATE_LIMITS** - Rate limit thresholds (60/min, 1000/hour, 10000/day)
- **VALIDATION** - Max recipients, subject length, HTML size
- **VERSION** - API version number

---

## 📝 Complete `.dev.vars` Template

Copy this template to `cloudflare-workers/shared-email-api/.dev.vars`:

```ini
# ============================================
# Shared Email API - Local Development Config
# ============================================

# API Authentication
API_KEY=dev_secret_key_12345

# AWS SES Credentials (get from AWS IAM Console)
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=ap-south-1

# Default Email Sender (MUST be verified in AWS SES)
DEFAULT_FROM_EMAIL=no-reply@rareminds.in
DEFAULT_FROM_NAME=Rareminds Skill Passport
```

---

## ✅ Verification Checklist

Before running `npm run dev`, verify:

- [ ] `.dev.vars` file exists in `cloudflare-workers/shared-email-api/`
- [ ] All 6 required variables are set
- [ ] `API_KEY` is a strong secret (not "test" or "123")
- [ ] AWS credentials are valid (test with `aws sts get-caller-identity`)
- [ ] `DEFAULT_FROM_EMAIL` is verified in AWS SES
- [ ] `AWS_REGION` matches your SES region
- [ ] `.dev.vars` is in `.gitignore` (never commit secrets!)

---

## 🧪 Test Your Configuration

### 1. Start the worker
```bash
cd cloudflare-workers/shared-email-api
npm run dev
```

### 2. Test health endpoint
```bash
curl http://localhost:8787/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-09T...",
  "version": "1.0.0"
}
```

### 3. Test email sending
```bash
curl -X POST http://localhost:8787/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev_secret_key_12345" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello World</h1>"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "messageId": "...",
  "recipient": ["test@example.com"],
  "timestamp": "..."
}
```

---

## 🚨 Common Errors & Solutions

### Error: "Missing required environment variable: AWS_ACCESS_KEY_ID"
**Solution:** Add `AWS_ACCESS_KEY_ID` to `.dev.vars`

### Error: "Missing API key"
**Solution:** Add `X-API-Key` header to your request

### Error: "Invalid API key"
**Solution:** Make sure the `X-API-Key` header matches `API_KEY` in `.dev.vars`

### Error: "Email address not verified"
**Solution:** Verify `DEFAULT_FROM_EMAIL` in AWS SES Console

### Error: "The security token included in the request is invalid"
**Solution:** AWS credentials are wrong or expired. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

### Error: "CORS error" in browser
**Solution:** Your frontend origin is not in the hardcoded `ALLOWED_ORIGINS` list in `src/constants.ts`. Add it there and restart the worker.

---

## 🔐 Security Notes

1. **Never commit `.dev.vars`** - It's in `.gitignore` by default
2. **Use different API keys** for dev/staging/production
3. **Rotate AWS credentials** regularly
4. **Use IAM roles** with minimal SES permissions
5. **Monitor AWS SES** for unusual activity

---

## 📚 Related Files

- **Environment types:** `src/types.ts` (Env interface)
- **Config loader:** `src/config/config.ts`
- **Auth middleware:** `src/middleware/auth.ts`
- **CORS config:** `src/constants.ts`
- **Wrangler config:** `wrangler.toml`

---

## 🎯 Summary

**Minimum required in `.dev.vars`:**
1. ✅ API_KEY
2. ✅ AWS_ACCESS_KEY_ID
3. ✅ AWS_SECRET_ACCESS_KEY
4. ✅ AWS_REGION
5. ✅ DEFAULT_FROM_EMAIL (must be verified in SES)
6. ✅ DEFAULT_FROM_NAME

**Total: 6 variables**

Everything else is auto-configured by wrangler or hardcoded in the source code.
