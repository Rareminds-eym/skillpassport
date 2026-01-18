# Quick Test Guide

## 🚀 Fastest Way to Test

### 1. Open Browser UI
```
Open file: test-worker-browser.html
```

### 2. Click Button
```
Click: "▶ Run All Tests"
```

### 3. Wait for Results
```
Look for: "🎉 ALL TESTS PASSED!"
```

---

## ✅ Success = This Output

```
✓ First call successful
→ Seed: 1234567890
→ Response keys: 15

✓ Second call successful  
→ Seed: 1234567890

✓ SEEDS MATCH! Deterministic results working!
✓ Cluster 1: Healthcare & Medicine (85%) - MATCH
✓ Cluster 2: Creative Arts & Design (75%) - MATCH

🎉 ALL TESTS PASSED!
```

---

## ❌ Failure = This Output

```
⚠ Missing _metadata - OLD worker version!
⚠ Wait 10-20 more minutes for Cloudflare propagation

📊 Response keys: (14) ['profileSnapshot', ...]
❌ MAIN TEST FAILED
```

**Action**: Wait 15-20 minutes, then test again

---

## ⏰ When to Test

| Time | Action |
|------|--------|
| Now | Test (may fail) |
| +15 min | Test again (should pass) |
| +30 min | If still failing, investigate |

---

## 🎯 What Success Means

✅ Regenerate button will produce identical results  
✅ Seed value visible in console  
✅ No more embedding errors  
✅ Course recommendations work  

---

## 📁 Files to Use

**Best**: `test-worker-browser.html` (beautiful UI)  
**Alternative**: `test-worker-complete.js` (Node.js)  
**Docs**: `TEST_SCRIPTS_README.md` (full guide)

---

## 🆘 If Tests Fail After 30 Minutes

1. Hard refresh: `Ctrl + Shift + R`
2. Try incognito window
3. Check Cloudflare dashboard
4. Purge cache manually
5. Contact for help

---

**TL;DR**: Open `test-worker-browser.html` → Click "Run All Tests" → Wait for "ALL TESTS PASSED"
