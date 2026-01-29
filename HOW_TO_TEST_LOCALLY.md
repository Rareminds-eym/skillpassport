# 🧪 How to Test Locally - Quick Reference

**Status**: ✅ Ready to test  
**Time Required**: 5-10 minutes  
**Difficulty**: Easy

---

## 🎯 TL;DR - Fastest Way to Test

```bash
# 1. Run the setup test
./test-local-setup.sh

# 2. Copy environment variables (if not done)
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your API keys

# 3. Build the project (if not done)
npm run build

# 4. Start Pages Functions
npm run pages:dev

# 5. In another terminal, test it
curl http://localhost:8788/api/assessment/health
```

**Expected**: `{"status":"ok","service":"assessment-api"}`

---

## 📋 What You Can Test

### 1. Property Tests (Recommended First)
```bash
npm run test:property
```
**Tests**: 205 tests covering all critical functionality  
**Time**: ~14 seconds  
**Status**: ✅ All passing

### 2. Pages Functions Locally
```bash
npm run pages:dev
```
**Tests**: All 12 API endpoints on `http://localhost:8788`  
**Time**: Runs continuously  
**Status**: ✅ Ready

### 3. Full Stack (Frontend + Backend)
```bash
# Terminal 1
npm run pages:dev

# Terminal 2
npm run dev
```
**Tests**: Complete application with local Pages Functions  
**Time**: Runs continuously  
**Status**: ✅ Ready

---

## 🚀 Quick Test Commands

### Test All APIs
```bash
# Assessment API
curl http://localhost:8788/api/assessment/health

# Career API
curl http://localhost:8788/api/career/health

# OTP API
curl http://localhost:8788/api/otp/health

# Streak API
curl http://localhost:8788/api/streak/health

# Course API
curl http://localhost:8788/api/course/health

# Storage API
curl http://localhost:8788/api/storage/health

# User API
curl http://localhost:8788/api/user/health

# Fetch Certificate
curl http://localhost:8788/api/fetch-certificate/health

# Adaptive Aptitude
curl http://localhost:8788/api/adaptive-aptitude/health

# Analyze Assessment
curl http://localhost:8788/api/analyze-assessment/health

# Question Generation
curl http://localhost:8788/api/question-generation/health

# Role Overview
curl http://localhost:8788/api/role-overview/health
```

---

## 🧪 Test Scenarios

### Scenario 1: Test Property Tests Only
**Time**: 14 seconds  
**No setup required**

```bash
npm run test:property
```

### Scenario 2: Test Pages Functions
**Time**: 5 minutes setup + testing  
**Requires**: `.dev.vars` file

```bash
# Setup
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your keys

# Build
npm run build

# Test
npm run pages:dev

# In another terminal
curl http://localhost:8788/api/assessment/health
```

### Scenario 3: Test Full Stack
**Time**: 5 minutes setup + testing  
**Requires**: `.dev.vars` file

```bash
# Terminal 1 - Pages Functions
npm run pages:dev

# Terminal 2 - Frontend
npm run dev

# Open browser
# http://localhost:5173
```

### Scenario 4: Test Direct Pages Functions (No Fallback)
**Time**: 2 minutes  
**Requires**: Scenario 3 running

```bash
# 1. Start both servers (Scenario 3)
# 2. Use the app → All requests go to Pages Functions
# 3. Check browser DevTools Network tab
# 4. Verify all API calls go to /api/* (same origin)
# 5. No fallback logic - direct routing only
```

**Note**: Fallback logic has been removed. All services now use Pages Functions directly.

---

## 📊 What Gets Tested

### Property Tests (npm run test:property)
- ✅ Shared utilities consistency
- ✅ API endpoint parity
- ✅ File-based routing
- ✅ Environment variable handling
- ✅ Frontend routing logic
- ✅ Backward compatibility
- ✅ CORS handling
- ✅ Error handling
- ✅ Service bindings
- ✅ Cron job execution

### Pages Functions (npm run pages:dev)
- ✅ All 12 API endpoints
- ✅ CORS headers
- ✅ Environment variable access
- ✅ Request/response handling
- ✅ Error handling
- ✅ TypeScript compilation

### Full Stack (both servers)
- ✅ Frontend → Pages Functions communication
- ✅ Direct API routing (no fallback)
- ✅ Metrics tracking
- ✅ Authentication flow
- ✅ Real API calls
- ✅ UI integration

---

## 🐛 Common Issues

### Issue: "Wrangler not found"
```bash
npm install -g wrangler
```

### Issue: "Cannot find module"
```bash
npm run build
```

### Issue: "Missing environment variable"
```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your keys
```

### Issue: "Port 8788 already in use"
```bash
lsof -ti:8788 | xargs kill -9
```

---

## 📚 Documentation

- **Quick Start**: `QUICK_START_LOCAL_TESTING.md` (5 min read)
- **Detailed Guide**: `LOCAL_TESTING_GUIDE.md` (15 min read)
- **Setup Test**: `./test-local-setup.sh` (run this first)

---

## ✅ Testing Checklist

Before considering testing complete:

- [ ] Run `./test-local-setup.sh` - all checks pass
- [ ] Run `npm run test:property` - tests pass
- [ ] Run `npm run pages:dev` - server starts
- [ ] Test health endpoints - all respond
- [ ] Test with frontend - app works
- [ ] Check browser DevTools - all requests to /api/*
- [ ] Check browser console - no errors
- [ ] Check Wrangler logs - no errors

---

## 🎯 Success Criteria

**You're ready when**:
- ✅ All property tests pass
- ✅ Pages dev server starts without errors
- ✅ Health endpoints respond with 200 OK
- ✅ Frontend can connect to Pages Functions
- ✅ All API calls go to /api/* (same origin)
- ✅ No console errors

---

## 🚀 Next Steps After Testing

Once local testing is successful:
1. ✅ All tests passing
2. ✅ Pages Functions working locally
3. ✅ Frontend integration working
4. ✅ Fallback behavior verified
5. ➡️ Ready for deployment (when needed)

---

## 💡 Pro Tips

1. **Start with property tests** - They're fast and don't need setup
2. **Use the test script** - `./test-local-setup.sh` checks everything
3. **Test incrementally** - Property tests → Pages Functions → Full stack
4. **Monitor logs** - Wrangler shows detailed request/response logs
5. **Use browser DevTools** - Network tab shows all API calls go to /api/*
6. **No fallback needed** - All services use Pages Functions directly

---

## 📞 Need Help?

1. Run `./test-local-setup.sh` to diagnose issues
2. Check `LOCAL_TESTING_GUIDE.md` for detailed troubleshooting
3. Review error messages in Wrangler logs
4. Check browser console for frontend errors

---

**Created**: January 28, 2026  
**Last Updated**: January 28, 2026  
**Status**: Ready for testing
