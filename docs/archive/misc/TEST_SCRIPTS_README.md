# Worker Test Scripts

Complete testing suite for the deterministic results fix and embedding service.

---

## 📁 Files

1. **test-worker-complete.js** - Full Node.js/Browser test suite
2. **test-worker-browser.html** - Beautiful browser-based test UI
3. **TEST_SCRIPTS_README.md** - This file

---

## 🌐 Option 1: Browser UI (Recommended)

### Steps:
1. Open `test-worker-browser.html` in your browser
2. The auth token will be auto-detected if you're logged in
3. Click "▶ Run All Tests"
4. Watch the results in real-time

### Features:
- ✅ Beautiful UI with progress bar
- ✅ Auto-detects auth token
- ✅ Color-coded output
- ✅ Individual test buttons
- ✅ Real-time progress updates

### Screenshot:
```
┌─────────────────────────────────────────┐
│  🧪 Worker Test Suite                   │
│  Complete testing for deterministic     │
│  results and embedding fixes            │
├─────────────────────────────────────────┤
│  Configuration                          │
│  Worker URL: https://...                │
│  Expected Version: 126dd3c3...          │
│                                         │
│  [▶ Run All Tests] [🎯 Test Det...]    │
├─────────────────────────────────────────┤
│  Test Progress                          │
│  ████████████████░░░░░░░░░░ 60%        │
│  Testing embedding service...           │
├─────────────────────────────────────────┤
│  Output                                 │
│  [12:34:56] ✓ First call successful    │
│  [12:34:56] → Seed: 1234567890         │
│  [12:34:58] ✓ SEEDS MATCH!             │
└─────────────────────────────────────────┘
```

---

## 💻 Option 2: Node.js Command Line

### Steps:
1. Get your auth token:
   - Open browser dev tools (F12)
   - Go to Application > Local Storage
   - Find `supabase.auth.token`
   - Copy the `access_token` value

2. Run the test:
```bash
node test-worker-complete.js YOUR_AUTH_TOKEN_HERE
```

### Features:
- ✅ Runs in terminal
- ✅ Color-coded output
- ✅ Exit code 0 on success, 1 on failure
- ✅ Perfect for CI/CD

### Example Output:
```
================================================================================
🧪 COMPLETE WORKER TEST SUITE
================================================================================

ℹ Worker URL: https://analyze-assessment-api.dark-mode-d021.workers.dev
ℹ Expected Version: 126dd3c3-5f51-44a1-951a-bcb7729a4e0e
ℹ Expected Response Keys: 15

▶ Test 1: Worker Health Check
✓ Worker is responding

▶ Test 2: Authentication
✓ Authentication successful

▶ Test 3: Deterministic Results (Main Test)
ℹ Making first API call...
✓ First call successful
→ Seed: 1234567890
→ Model: google/gemini-2.0-flash-exp:free
→ Deterministic: true
→ Response keys: 15
ℹ Waiting 2 seconds before second call...
ℹ Making second API call with SAME data...
✓ Second call successful
→ Seed: 1234567890
✓ SEEDS MATCH! Deterministic results working!
✓   Cluster 1: Healthcare & Medicine (85%) - MATCH
✓   Cluster 2: Creative Arts & Design (75%) - MATCH
✓   Cluster 3: Business & Entrepreneurship (65%) - MATCH
✓ CAREER CLUSTERS MATCH! Results are identical!

▶ Test 4: Response Structure
✓   ✓ riasec
✓   ✓ aptitude
✓   ✓ bigFive
✓   ✓ workValues
✓   ✓ employability
✓   ✓ knowledge
✓   ✓ careerFit
✓   ✓ skillGap
✓   ✓ roadmap
✓   ✓ finalNote
✓   ✓ profileSnapshot
✓   ✓ overallSummary
✓   ✓ _metadata (NEW FIELD)
    - seed: 1234567890
    - model: google/gemini-2.0-flash-exp:free
    - deterministic: true
    - timestamp: 2026-01-18T...

▶ Test 5: Embedding Service UUID Fix
ℹ Testing with UUID: 12345678-1234-4abc-8def-123456789abc
✓ Embedding service working correctly
→ Embedding dimension: 1536

▶ Test 6: Cache-Busting Parameter
✓ Cache-busting parameter working
→ Request 1: ?v=1737216000000
→ Request 2: ?v=1737216000100

▶ Test 7: Different Input = Different Seed
→ Seed 1 (original): 1234567890
→ Seed 2 (modified): 9876543210
✓ Different inputs produce different seeds!

================================================================================
📊 TEST RESULTS SUMMARY
================================================================================

✓ PASS - Worker Health Check
✓ PASS - Authentication
✓ PASS - Deterministic Results (MAIN)
✓ PASS - Response Structure
✓ PASS - Embedding Service UUID
✓ PASS - Cache-Busting
✓ PASS - Different Input = Different Seed

Total: 7/7 tests passed
🎉 ALL TESTS PASSED! Worker is working correctly!

================================================================================
```

---

## 🧪 Option 3: Browser Console

### Steps:
1. Open your app in browser
2. Open dev tools (F12)
3. Go to Console tab
4. Paste the entire `test-worker-complete.js` file
5. Run: `runAllTests()`

### Features:
- ✅ No file needed
- ✅ Auto-detects token
- ✅ Runs in current session
- ✅ Quick and easy

---

## 📊 What Each Test Does

### Test 1: Worker Health Check
- Verifies worker is responding
- Checks if worker URL is accessible

### Test 2: Authentication
- Verifies auth token is valid
- Checks if API accepts the token

### Test 3: Deterministic Results (MAIN TEST) ⭐
- Makes two API calls with SAME data
- Verifies SAME seed is generated
- Compares career clusters for identity
- **This is the most important test!**

### Test 4: Response Structure
- Checks all required fields are present
- Verifies `_metadata` field exists (new)
- Validates response format

### Test 5: Embedding Service UUID Fix
- Tests UUID generation
- Verifies embedding API accepts valid UUID
- Checks embedding response format

### Test 6: Cache-Busting
- Verifies cache-busting parameter works
- Tests multiple requests with different timestamps

### Test 7: Different Input = Different Seed
- Makes two API calls with DIFFERENT data
- Verifies DIFFERENT seeds are generated
- Confirms seed is based on input data

---

## ✅ Success Criteria

### All Tests Pass:
```
✓ PASS - Worker Health Check
✓ PASS - Authentication
✓ PASS - Deterministic Results (MAIN)
✓ PASS - Response Structure
✓ PASS - Embedding Service UUID
✓ PASS - Cache-Busting
✓ PASS - Different Input = Different Seed

🎉 ALL TESTS PASSED! Worker is working correctly!
```

### Main Test Passes (Minimum):
```
✓ PASS - Deterministic Results (MAIN)
⚠ Some auxiliary tests failed

⚠ Main test passed but some auxiliary tests failed
```

### Main Test Fails:
```
✗ FAIL - Deterministic Results (MAIN)

❌ MAIN TEST FAILED - Deterministic results not working
⚠ Wait 10-20 more minutes for Cloudflare propagation
```

---

## 🔍 Interpreting Results

### If You See: "Missing _metadata - OLD worker version!"
**Meaning**: Cloudflare is still serving the old worker version  
**Action**: Wait 10-20 more minutes for propagation  
**Why**: Global CDN takes time to update all edge servers

### If You See: "SEEDS MATCH! Deterministic results working!"
**Meaning**: The fix is working correctly! 🎉  
**Action**: Test in your app by clicking "Regenerate" button  
**Expected**: Same results every time

### If You See: "SEEDS DIFFER!"
**Meaning**: Deterministic results not working  
**Action**: Check if `_metadata` field exists  
**Possible Causes**:
- Old worker version still cached
- OpenRouter API not honoring seed parameter
- Browser cache not cleared

### If You See: "Embedding service failed: 400"
**Meaning**: UUID fix not applied or browser cache not cleared  
**Action**: Hard refresh browser (Ctrl+Shift+R)  
**Check**: Verify `generateTempUUID()` in `embeddingService.js`

---

## 🚨 Troubleshooting

### Problem: "No auth token available"
**Solution**:
1. Make sure you're logged in
2. Or manually provide token in input field
3. Or pass token as command line argument

### Problem: "Worker health check failed"
**Solution**:
1. Check internet connection
2. Verify worker URL is correct
3. Check Cloudflare dashboard for worker status

### Problem: "Authentication failed"
**Solution**:
1. Token may be expired - log out and log back in
2. Get fresh token from browser storage
3. Verify token format (should be JWT)

### Problem: Tests pass but app still shows different results
**Solution**:
1. Hard refresh app (Ctrl+Shift+R)
2. Clear browser cache completely
3. Try incognito window
4. Check browser console for errors

---

## 📝 Quick Reference

### Get Auth Token (Browser):
```javascript
// Method 1: From Supabase
const { data: { session } } = await supabase.auth.getSession();
console.log(session.access_token);

// Method 2: From Local Storage
const token = JSON.parse(localStorage.getItem('supabase.auth.token'));
console.log(token.access_token);
```

### Run Tests (Node.js):
```bash
node test-worker-complete.js YOUR_TOKEN
```

### Run Tests (Browser):
```javascript
// Open test-worker-browser.html
// Or paste script in console and run:
runAllTests();
```

### Run Single Test:
```javascript
// Browser only
runSingleTest('deterministicResults');
runSingleTest('embeddingService');
```

---

## 🎯 Expected Timeline

| Time | Status | Action |
|------|--------|--------|
| **Now** | Worker deployed | Run tests (may fail) |
| **+5 min** | Propagating | Wait |
| **+10 min** | Partial propagation | Try tests again |
| **+15 min** | Most regions updated | Tests should pass |
| **+20 min** | Fully propagated | All tests pass |
| **+30 min** | Stable | If still failing, investigate |

---

## 📞 Support

If tests fail after 30 minutes:
1. Check Cloudflare dashboard
2. Verify worker version: 126dd3c3-5f51-44a1-951a-bcb7729a4e0e
3. Try purging Cloudflare cache manually
4. Contact for help with logs from test output

---

## 🎉 Success!

When you see:
```
✓ SEEDS MATCH! Deterministic results working!
✓ Cluster 1: Healthcare & Medicine (85%) - MATCH
✓ Cluster 2: Creative Arts & Design (75%) - MATCH
✓ Cluster 3: Business & Entrepreneurship (65%) - MATCH
✓ CAREER CLUSTERS MATCH! Results are identical!
🎉 ALL TESTS PASSED! Worker is working correctly!
```

**You're done!** The fix is working. Go test in your app! 🚀
