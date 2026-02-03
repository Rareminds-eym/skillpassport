# Local Testing Guide - Cloudflare Consolidation

This guide explains how to test the Cloudflare consolidation implementation locally before deploying.

---

## 🎯 Overview

You can test the implementation in three ways:
1. **Unit/Property Tests** - Test individual components (already passing)
2. **Local Pages Functions** - Test Pages Functions with Wrangler
3. **Full Stack Testing** - Test frontend + Pages Functions together

---

## 1️⃣ Unit & Property Tests (Recommended First)

### Run All Property Tests
```bash
# Run all property tests
npm test -- --run src/__tests__/property/

# Run specific property test
npm test -- --run src/__tests__/property/api-endpoint-parity.property.test.ts
```

### Expected Output
```
Test Files:  12 passed (12)
Tests:       205 passed (205)
Duration:    ~14 seconds
```

### What This Tests
- ✅ Shared utilities consistency
- ✅ API endpoint parity
- ✅ File-based routing
- ✅ Environment variable handling
- ✅ Frontend routing logic
- ✅ Migration fallback behavior
- ✅ Backward compatibility

---

## 2️⃣ Local Pages Functions Testing

### Prerequisites
```bash
# Install Wrangler CLI (if not already installed)
npm install -g wrangler

# Or use npx
npx wrangler --version
```

### Step 1: Set Up Environment Variables

Create a `.dev.vars` file in your project root:

```bash
# .dev.vars (for local Pages Functions testing)
SUPABASE_URL=https://dpooleduinyyzxgrcwko.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI Service Keys
OPENROUTER_API_KEY=your_openrouter_key_here
CLAUDE_API_KEY=your_claude_key_here
GEMINI_API_KEY=your_gemini_key_here

# AWS (for OTP)
AWS_ACCESS_KEY_ID=your_aws_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_here
AWS_REGION=ap-south-1

# Cloudflare R2 (for Storage)
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_key_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_here
CLOUDFLARE_R2_BUCKET_NAME=skill-echosystem
```

**Note**: Add `.dev.vars` to `.gitignore` to avoid committing secrets!

### Step 2: Start Pages Dev Server

```bash
# Start Wrangler Pages dev server
npx wrangler pages dev dist --compatibility-date=2024-01-01 --port=8788

# Or if you have a script in package.json
npm run pages:dev
```

This will:
- Start a local server at `http://localhost:8788`
- Serve your Pages Functions at `/api/*`
- Load environment variables from `.dev.vars`

### Step 3: Test Individual API Endpoints

Open a new terminal and test endpoints:

```bash
# Test Assessment API
curl http://localhost:8788/api/assessment/health

# Test Career API
curl http://localhost:8788/api/career/health

# Test OTP API (POST request)
curl -X POST http://localhost:8788/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# Test Streak API
curl http://localhost:8788/api/streak/health

# Test with authentication
curl http://localhost:8788/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Expected Responses

**Health Check (200 OK)**:
```json
{
  "status": "ok",
  "service": "assessment-api"
}
```

**Missing Environment Variable (500)**:
```json
{
  "error": "Missing required environment variable: SUPABASE_URL"
}
```

**CORS Headers**:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 3️⃣ Full Stack Testing (Frontend + Pages Functions)

### Step 1: Update Environment Variables

Update your `.env` file to point to local Pages Functions:

```bash
# .env
VITE_PAGES_URL=http://localhost:8788

# Fallback URLs (Original Workers - for testing fallback)
VITE_CAREER_API_URL=https://career-api-dev.dark-mode-d021.workers.dev
VITE_STREAK_API_URL=https://streak-api-dev.dark-mode-d021.workers.dev
VITE_OTP_API_URL=https://otp-api-dev.dark-mode-d021.workers.dev
VITE_COURSE_API_URL=https://course-api-dev.dark-mode-d021.workers.dev
VITE_STORAGE_API_URL=https://storage-api-dev.dark-mode-d021.workers.dev
VITE_USER_API_URL=https://user-api-dev.dark-mode-d021.workers.dev
VITE_ASSESSMENT_API_URL=https://assessment-api-dev.dark-mode-d021.workers.dev
```

### Step 2: Start Both Servers

**Terminal 1 - Pages Functions**:
```bash
npx wrangler pages dev dist --port=8788
```

**Terminal 2 - Frontend Dev Server**:
```bash
npm run dev
```

### Step 3: Test in Browser

1. Open `http://localhost:5173` (or your Vite dev server port)
2. Open browser DevTools → Console
3. Check for API calls in Network tab
4. Look for fallback logs:

```javascript
// In browser console, check fallback metrics
import { globalMetrics } from './src/utils/apiFallback';
console.log(globalMetrics.getTotalMetrics());
```

Expected output:
```javascript
{
  totalRequests: 10,
  primarySuccesses: 10,  // Pages Functions working
  primaryFailures: 0,
  fallbackSuccesses: 0,
  fallbackFailures: 0,
  averageResponseTime: 150
}
```

---

## 4️⃣ Testing Fallback Behavior

### Test Primary Success
1. Start Pages dev server: `npx wrangler pages dev dist --port=8788`
2. Start frontend: `npm run dev`
3. Make API calls → Should use Pages Functions (port 8788)

### Test Fallback
1. **Stop** Pages dev server (Ctrl+C)
2. Keep frontend running
3. Make API calls → Should automatically fall back to Original Workers
4. Check console for fallback logs:
   ```
   [API Fallback] ⚠️ Primary endpoint failed, trying fallback
   [API Fallback] ✅ Fallback endpoint success
   ```

### Test Timeout
1. Add artificial delay to a Pages Function:
   ```typescript
   // In any [[path]].ts file
   await new Promise(resolve => setTimeout(resolve, 15000)); // 15 seconds
   ```
2. Make API call → Should timeout after 10 seconds and fall back

---

## 5️⃣ Testing Specific APIs

### Assessment API
```bash
# Generate assessment
curl -X POST http://localhost:8788/api/assessment/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "subject": "Mathematics",
    "difficulty": "medium",
    "questionCount": 5
  }'
```

### Career API
```bash
# Get career recommendations
curl -X POST http://localhost:8788/api/career/recommend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "skills": ["JavaScript", "React", "Node.js"],
    "interests": ["web development"]
  }'
```

### OTP API
```bash
# Send OTP
curl -X POST http://localhost:8788/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210"
  }'

# Verify OTP
curl -X POST http://localhost:8788/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "otp": "123456"
  }'
```

### Streak API
```bash
# Get user streak
curl http://localhost:8788/api/streak/user/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update streak
curl -X POST http://localhost:8788/api/streak/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "USER_ID",
    "action": "complete_lesson"
  }'
```

---

## 6️⃣ Testing Standalone Workers (Optional)

If you want to test the standalone workers locally:

### Payments API
```bash
cd cloudflare-workers/payments-api
npx wrangler dev --port=8789
```

### Email API
```bash
cd cloudflare-workers/email-api
npx wrangler dev --port=8790
```

### Embedding API
```bash
cd cloudflare-workers/embedding-api
npx wrangler dev --port=8791
```

---

## 7️⃣ Debugging Tips

### Check Wrangler Logs
```bash
# Wrangler shows detailed logs in the terminal
# Look for:
# - Request paths
# - Response status codes
# - Error messages
# - Environment variable access
```

### Enable Verbose Logging
```bash
# Run with debug flag
npx wrangler pages dev dist --port=8788 --log-level=debug
```

### Check Browser Console
```javascript
// Monitor fallback metrics
setInterval(() => {
  console.log('Fallback Metrics:', globalMetrics.getTotalMetrics());
}, 5000);
```

### Test CORS
```bash
# Test CORS preflight
curl -X OPTIONS http://localhost:8788/api/assessment/generate \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Expected headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 8️⃣ Common Issues & Solutions

### Issue: "Cannot find module 'src/functions-lib'"

**Solution**: Wrangler needs to resolve TypeScript paths. Create `tsconfig.json` in root:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Issue: "Missing environment variable"

**Solution**: Ensure `.dev.vars` file exists and contains all required variables.

### Issue: "CORS error in browser"

**Solution**: Check that `functions/_middleware.ts` is being loaded. Verify CORS headers in Network tab.

### Issue: "Fallback always triggered"

**Solution**: 
1. Verify Pages dev server is running on port 8788
2. Check `VITE_PAGES_URL` in `.env`
3. Look for errors in Wrangler terminal

### Issue: "Port already in use"

**Solution**:
```bash
# Kill process on port 8788
lsof -ti:8788 | xargs kill -9

# Or use different port
npx wrangler pages dev dist --port=8789
```

---

## 9️⃣ Testing Checklist

Before considering testing complete:

- [ ] All 205 property tests passing
- [ ] Pages dev server starts without errors
- [ ] All API endpoints respond (at least health checks)
- [ ] CORS headers present in responses
- [ ] Environment variables accessible
- [ ] Frontend can call Pages Functions
- [ ] Fallback works when Pages Functions unavailable
- [ ] No TypeScript errors
- [ ] Browser console shows no errors
- [ ] Fallback metrics tracking works

---

## 🔟 Performance Testing

### Test Response Times
```bash
# Use curl with timing
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8788/api/assessment/health

# Create curl-format.txt:
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
```

### Load Testing (Optional)
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Run load test
ab -n 1000 -c 10 http://localhost:8788/api/assessment/health
```

---

## 📊 Expected Results

### Successful Local Testing
- ✅ All property tests pass
- ✅ Pages Functions respond on port 8788
- ✅ Frontend connects to Pages Functions
- ✅ Fallback works when needed
- ✅ CORS headers present
- ✅ Environment variables accessible
- ✅ No console errors
- ✅ Response times < 2 seconds

### Metrics to Monitor
- Primary success rate: Should be ~100% when Pages dev running
- Fallback success rate: Should be ~100% when Pages dev stopped
- Average response time: Should be < 2000ms
- Error rate: Should be 0% for valid requests

---

## 🚀 Next Steps After Local Testing

Once local testing is successful:
1. ✅ All tests passing locally
2. ➡️ Ready for staging deployment (when needed)
3. ➡️ Can proceed with production deployment (when needed)

---

## 📚 Additional Resources

- [Wrangler Pages Dev Docs](https://developers.cloudflare.com/pages/platform/functions/local-development/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)
- [Testing Cloudflare Workers](https://developers.cloudflare.com/workers/testing/)

---

**Created**: January 28, 2026  
**Status**: Ready for local testing  
**Prerequisites**: Node.js, npm, Wrangler CLI
