# Loading Screen Flicker Fix ✅

**Date**: January 18, 2026  
**Status**: ✅ Fixed

---

## 🐛 The Problem

When submitting assessment, the loading screen would:
1. Show "Generating Your Report" ✅
2. Disappear (blank screen) ❌
3. Show "Generating Your Report" again ✅
4. Finally show results ✅

**Root Cause**: Setting `loading` to `false` when triggering auto-retry, causing the loading screen to disappear briefly.

---

## ✅ The Fix

Keep `loading` state as `true` when setting the auto-retry flag.

### Before (Flickering):
```javascript
// Set flag to trigger auto-retry
setAutoRetry(true);
setLoading(false);  // ❌ This causes blank screen!
return;
```

### After (Smooth):
```javascript
// Set flag to trigger auto-retry
// Keep loading=true so user sees "Generating Your Report" screen
setAutoRetry(true);
// Don't set loading to false - keep showing loading screen
return;
```

---

## 🎯 User Experience

### Before:
1. Submit assessment ✅
2. See "Generating Your Report" ✅
3. **Blank screen appears** ❌
4. See "Generating Your Report" again ✅
5. See results ✅

### After:
1. Submit assessment ✅
2. See "Generating Your Report" ✅
3. **Continuous loading (no flicker)** ✅
4. See results ✅

---

## 📊 Technical Details

**File**: `src/features/assessment/assessment-result/hooks/useAssessmentResults.js`

**Change**: Removed `setLoading(false)` when setting auto-retry flag

**Why it works**:
- `loading` starts as `true` when component mounts
- When auto-retry is triggered, `loading` stays `true`
- User sees continuous "Generating Your Report" screen
- When AI analysis completes, `handleRetry()` sets `loading` to `false`
- Smooth transition to results page

---

## ✅ Summary

**Problem**: Blank screen flicker during auto-generation  
**Cause**: Setting loading to false prematurely  
**Fix**: Keep loading true until AI analysis completes  
**Result**: Smooth, continuous loading screen

---

**Status**: ✅ Fixed  
**Test**: Complete assessment - should see smooth loading without flicker!
