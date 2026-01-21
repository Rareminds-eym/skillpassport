# Deployment Guide

## Overview

Your CI/CD pipeline supports **three environments**: Production, Development, and Preview.

## Environments

### 🚀 Production
- **URL:** https://skillpassport.rareminds.in
- **Branch:** `production`
- **Workers:** `*.dark-mode-d021.workers.dev`
- **Quality Checks:** Commented out (can be enabled)
- **Use:** Live production site

### 🧪 Development
- **URL:** https://dev.skillpassport.pages.dev
- **Branch:** `dev`
- **Workers:** `*-dev.dark-mode-d021.workers.dev`
- **Quality Checks:** Enabled (linting, type check, tests)
- **Use:** Testing and QA environment

### 🔍 Preview
- **URL:** Dynamic (e.g., `pr-123.skillpassport.pages.dev`)
- **Trigger:** Pull requests to `production` or `dev`
- **Use:** Review changes before merging

## Workflows

### 1. Production (`pages.yml` & `deploy-workers.yml`)
- **Trigger:** Push to `production` branch
- **Quality Checks:** Commented out
- **Deploys to:** skillpassport.rareminds.in + production workers

### 2. Development (`deploy-dev.yml` & `deploy-dev-workers.yml`)
- **Trigger:** Push to `dev` branch
- **Quality Checks:** Enabled (blocks on failure)
- **Deploys to:** dev.skillpassport.pages.dev + dev workers

### 3. Preview (Both workflows)
- **Trigger:** Pull requests
- **Quality Checks:** Based on target branch
- **Deploys to:** Dynamic preview URL

## Deployment Flow

### Standard Development Flow
```
1. Create feature branch from dev
   └─ git checkout -b feature/new-feature dev

2. Make changes and push
   └─ git push origin feature/new-feature

3. Open PR to dev
   └─ Gets Preview URL
   └─ Quality checks run
   └─ Review & test

4. Merge to dev
   └─ Deploys to dev.skillpassport.pages.dev
   └─ Workers deploy to *-dev.workers.dev
   └─ QA testing

5. When ready for production, open PR from dev to production
   └─ Gets Production Preview URL
   └─ Final review

6. Merge to production
   └─ Deploys to skillpassport.rareminds.in
   └─ Workers deploy to *.workers.dev
   └─ Live in production
```

### Hotfix Flow
```
1. Create hotfix branch from production
   └─ git checkout -b hotfix/critical-fix production

2. Make fix and push
   └─ git push origin hotfix/critical-fix

3. Open PR to production
   └─ Gets Preview URL
   └─ Quick review

4. Merge to production
   └─ Immediate production deployment

5. Backport to dev
   └─ git checkout dev
   └─ git cherry-pick <commit-hash>
   └─ git push
```

## All URLs

### Production
- **Frontend:** https://skillpassport.rareminds.in
- **Workers:**
  - https://assessment-api.dark-mode-d021.workers.dev
  - https://career-api.dark-mode-d021.workers.dev
  - https://course-api.dark-mode-d021.workers.dev
  - https://email-api.dark-mode-d021.workers.dev
  - https://embedding-api.dark-mode-d021.workers.dev
  - https://fetch-certificate.dark-mode-d021.workers.dev
  - https://otp-api.dark-mode-d021.workers.dev
  - https://payments-api.dark-mode-d021.workers.dev
  - https://storage-api.dark-mode-d021.workers.dev
  - https://streak-api.dark-mode-d021.workers.dev
  - https://user-api.dark-mode-d021.workers.dev

### Development
- **Frontend:** https://dev.skillpassport.pages.dev
- **Workers:**
  - https://assessment-api-dev.dark-mode-d021.workers.dev
  - https://career-api-dev.dark-mode-d021.workers.dev
  - https://course-api-dev.dark-mode-d021.workers.dev
  - https://email-api-dev.dark-mode-d021.workers.dev
  - https://embedding-api-dev.dark-mode-d021.workers.dev
  - https://fetch-certificate-dev.dark-mode-d021.workers.dev
  - https://otp-api-dev.dark-mode-d021.workers.dev
  - https://payments-api-dev.dark-mode-d021.workers.dev
  - https://storage-api-dev.dark-mode-d021.workers.dev
  - https://streak-api-dev.dark-mode-d021.workers.dev
  - https://user-api-dev.dark-mode-d021.workers.dev

## Quality Gates

### Development (dev branch)
- ✅ Linting (blocks deployment)
- ✅ Type checking (blocks deployment)
- ✅ Tests (blocks deployment)
- ⚠️ Security audit (warns only)

### Production (production branch)
- ⏸️ Quality checks commented out (can be enabled)
- 🚀 Fast deployment for hotfixes

## Manual Deployment

### Deploy Specific Worker
1. Go to Actions tab in GitHub
2. Select workflow:
   - "Deploy Cloudflare Workers" (production)
   - "Deploy Development Workers" (development)
3. Click "Run workflow"
4. Choose specific worker or "all"
5. Click "Run workflow"

## Build Artifacts

- **Production:** `dist-{sha}` (7 days retention)
- **Development:** `dist-dev-{sha}` (7 days retention)
- Used for debugging and rollback

## Enable Production Quality Checks

Uncomment these sections in `.github/workflows/pages.yml`:

```yaml
- name: Run Linting
  run: npm run lint
  continue-on-error: false

- name: Run Type Check
  run: npm run typecheck
  continue-on-error: false

- name: Run Tests
  run: npm run test -- --run
  continue-on-error: false
```

## Troubleshooting

### Development deployment failing
```bash
# Check quality checks in GitHub Actions
# Fix linting: npm run lint
# Fix types: npm run typecheck
# Fix tests: npm run test
```

### Production deployment needed urgently
```bash
# Quality checks are commented out for fast hotfixes
# Deploy directly to production branch
# Backport to main after deployment
```

### Worker not responding
```bash
# Check worker logs
wrangler tail {worker-name}        # Production
wrangler tail {worker-name}-dev    # Development
```

## Best Practices

1. **Develop on dev** - All development happens on dev branch
2. **Test in development** - Verify in dev environment before production
3. **Use PRs** - Always create PRs for review and preview
4. **Production is stable** - Only merge tested code from dev
5. **Hotfixes** - Use production branch for urgent fixes, backport to dev

## GitHub Secrets Required

### Frontend & Workers
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_OPENAI_API_KEY`
- `VITE_OPENROUTER_API_KEY`
- `VITE_CLAUDE_API_KEY`
- `VITE_GEMINI_API_KEY`
- `VITE_API_URL`
- `VITE_COURSE_API_URL`
- `VITE_CAREER_API_URL`
- `VITE_PAYMENTS_API_URL`
- `VITE_USER_API_URL`
- `VITE_STORAGE_API_URL`
- `VITE_RAZORPAY_KEY_ID`
- `VITE_RAZORPAY_LIVE_KEY_ID`
- `VITE_RAZORPAY_TEST_KEY_ID`
- `VITE_CLOUDFLARE_CERTIFICATE_WORKER_URL`

### Cloudflare
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### Worker-Specific
- `OPENROUTER_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `RESEND_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`

## Summary

✅ **Three-environment setup:**
- Production (production branch) - Fast deployment
- Development (dev branch) - Quality-checked
- Preview (pull requests) - Review before merge

✅ **Automated deployments:**
- Frontend to Cloudflare Pages
- Workers to Cloudflare Workers
- Separate dev and prod worker instances

✅ **Quality gates:**
- Development: Strict (linting, types, tests)
- Production: Optional (commented out for speed)

✅ **Build artifacts:**
- 7-day retention
- Easy rollback

Your pipeline supports both rapid development and stable production! 🚀
