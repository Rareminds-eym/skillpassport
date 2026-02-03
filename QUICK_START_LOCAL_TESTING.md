# 🚀 Quick Start - Local Testing

Get up and running with local testing in 5 minutes!

---

## ✅ Prerequisites Check

```bash
# Check Node.js (should be v18+)
node --version

# Check npm
npm --version

# Check Wrangler (should be installed)
wrangler --version
```

If Wrangler is not installed:
```bash
npm install -g wrangler
```

---

## 🎯 Quick Start (3 Steps)

### Step 1: Set Up Environment Variables

```bash
# Copy the example file
cp .dev.vars.example .dev.vars

# Edit .dev.vars and add your actual API keys
nano .dev.vars  # or use your preferred editor
```

**Minimum required for basic testing**:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### Step 2: Build the Project

```bash
# Build the frontend
npm run build
```

This creates the `dist/` folder that Wrangler will serve.

### Step 3: Start Pages Dev Server

```bash
# Start Wrangler Pages dev server
npm run pages:dev
```

You should see:
```
⛅️ wrangler 3.x.x
-------------------
[wrangler:inf] Ready on http://localhost:8788
```

---

## 🧪 Test It Works

Open a new terminal and run:

```bash
# Test a simple endpoint
curl http://localhost:8788/api/assessment/health

# Expected response:
# {"status":"ok","service":"assessment-api"}
```

If you see the response, **it's working!** 🎉

---

## 🔍 Test More Endpoints

```bash
# Test Career API
curl http://localhost:8788/api/career/health

# Test Streak API
curl http://localhost:8788/api/streak/health

# Test OTP API
curl http://localhost:8788/api/otp/health

# Test with POST request
curl -X POST http://localhost:8788/api/assessment/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"subject":"Math","difficulty":"easy","count":5}'
```

---

## 🌐 Test with Frontend

### Terminal 1 - Pages Functions
```bash
npm run pages:dev
```

### Terminal 2 - Frontend Dev Server
```bash
npm run dev
```

Now open `http://localhost:5173` in your browser and use the app normally. All API calls will go to your local Pages Functions!

---

## 🧪 Run Property Tests

```bash
# Run all property tests
npm run test:property

# Expected output:
# Test Files:  12 passed (12)
# Tests:       205 passed (205)
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module"
**Solution**: Make sure you ran `npm run build` first.

### Issue: "Missing environment variable"
**Solution**: Check that `.dev.vars` exists and contains the required variables.

### Issue: "Port 8788 already in use"
**Solution**: 
```bash
# Kill the process
lsof -ti:8788 | xargs kill -9

# Or use a different port
wrangler pages dev dist --port=8789
```

### Issue: "CORS error"
**Solution**: The middleware should handle CORS automatically. Check that `functions/_middleware.ts` exists.

---

## 📊 Check Fallback Behavior

### Test 1: Primary Success
1. Keep Pages dev server running
2. Start frontend: `npm run dev`
3. Use the app → Should use local Pages Functions

### Test 2: Fallback
1. **Stop** Pages dev server (Ctrl+C)
2. Keep frontend running
3. Use the app → Should fall back to Original Workers
4. Check browser console for fallback logs

---

## 🎯 What to Test

- [ ] Pages dev server starts without errors
- [ ] Health check endpoints respond
- [ ] Frontend can connect to Pages Functions
- [ ] CORS headers are present
- [ ] Fallback works when Pages Functions stopped
- [ ] All 205 property tests pass
- [ ] No console errors in browser

---

## 📚 Next Steps

Once local testing works:
- ✅ Read `LOCAL_TESTING_GUIDE.md` for detailed testing
- ✅ Test individual API endpoints
- ✅ Test with real data
- ✅ Monitor fallback metrics
- ✅ Check performance

---

## 🆘 Need Help?

See the full guide: `LOCAL_TESTING_GUIDE.md`

---

**Quick Commands Reference**:
```bash
# Build
npm run build

# Test Pages Functions
npm run pages:dev

# Test Frontend
npm run dev

# Run Property Tests
npm run test:property

# Build and start Pages Functions
npm run pages:build
```

---

**Created**: January 28, 2026  
**Time to Complete**: ~5 minutes  
**Difficulty**: Easy
