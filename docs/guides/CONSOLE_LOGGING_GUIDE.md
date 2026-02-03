# Console Logging Guide - Course Recommendations

## Overview

The course recommendation system now includes **detailed console logging** to show which fallback layer is being used. This helps with monitoring, debugging, and understanding system behavior.

## Log Format

All logs are prefixed with `[Course Recommendations]` or `[Profile Builder]` for easy filtering.

### Log Symbols:
- ✅ = Success
- ⚠️ = Warning/Fallback activated
- ❌ = Error
- 🚀 = Cache hit (instant)
- 💾 = Cache miss (generating)

## Example Console Outputs

### Scenario 1: AI Service Working (Best Case) ✅

```
[Course Recommendations] 💾 CACHE MISS for "B.COM" - generating keywords...
[Course Recommendations] Generating keywords for field: "B.COM"
[Course Recommendations] ✅ LAYER 1 (AI Service) SUCCESS for "B.COM"
[Course Recommendations] Keywords: Accounting, Finance, Economics, Auditing, Taxation, Business Law, Financial Analysis, Management
```

**What happened:**
- Cache miss (first time seeing this field)
- AI service called
- AI successfully generated keywords
- Keywords are specific and accurate

---

### Scenario 2: AI Service Failed, Pattern Matching Works ⚠️

```
[Course Recommendations] 💾 CACHE MISS for "B.COM" - generating keywords...
[Course Recommendations] Generating keywords for field: "B.COM"
[Course Recommendations] ⚠️ LAYER 1 (AI Service) FAILED for "B.COM": 401
[Course Recommendations] → Falling back to LAYER 2 (Pattern Matching)
[Course Recommendations] ✅ LAYER 2 (Pattern Matching) SUCCESS for "B.COM"
[Course Recommendations] Matched Category: Commerce/Business
[Course Recommendations] Keywords: Finance, Accounting, Business Management, Economics, Financial Analysis, Budgeting, Corporate Finance, Marketing
```

**What happened:**
- AI service failed (401 authentication error)
- System automatically fell back to pattern matching
- Pattern matching found "Commerce/Business" category
- Generated appropriate keywords
- User experience unaffected

---

### Scenario 3: Unknown Field, Generic Keywords Used ⚠️

```
[Course Recommendations] 💾 CACHE MISS for "Xyz Studies" - generating keywords...
[Course Recommendations] Generating keywords for field: "Xyz Studies"
[Course Recommendations] ⚠️ LAYER 1 (AI Service) FAILED for "Xyz Studies": 503
[Course Recommendations] → Falling back to LAYER 2 (Pattern Matching)
[Course Recommendations] ⚠️ LAYER 2 (Pattern Matching) - No match found for "Xyz Studies"
[Course Recommendations] → Using LAYER 3 (Generic Keywords)
[Course Recommendations] Keywords: Professional Skills, Communication, Problem Solving, Critical Thinking, Teamwork, Leadership, Time Management, Adaptability
```

**What happened:**
- AI service failed
- Pattern matching couldn't find a match
- System used generic professional keywords
- User still gets recommendations (general courses)
- Better than showing nothing

---

### Scenario 4: Cache Hit (Fastest) 🚀

```
[Course Recommendations] 🚀 CACHE HIT for "B.COM" (instant)
```

**What happened:**
- Field was already processed before
- Keywords retrieved from cache instantly
- No API call needed
- Optimal performance

---

### Scenario 5: Profile Builder Integration

```
[Profile Builder] Fetching domain keywords for: "B.COM"
[Course Recommendations] 🚀 CACHE HIT for "B.COM" (instant)
[Profile Builder] ✅ Domain keywords added to profile
```

**What happened:**
- Profile builder requested keywords
- Cache hit (instant retrieval)
- Keywords added to student profile
- Profile ready for course matching

---

### Scenario 6: Complete Failure (Extremely Rare) ❌

```
[Profile Builder] Fetching domain keywords for: "B.COM"
[Course Recommendations] 💾 CACHE MISS for "B.COM" - generating keywords...
[Course Recommendations] Generating keywords for field: "B.COM"
[Course Recommendations] ❌ LAYER 1 (AI Service) ERROR for "B.COM": Network timeout
[Course Recommendations] → Falling back to LAYER 2 (Pattern Matching)
[Course Recommendations] ✅ LAYER 2 (Pattern Matching) SUCCESS for "B.COM"
[Course Recommendations] Matched Category: Commerce/Business
[Course Recommendations] Keywords: Finance, Accounting, Business Management...
[Profile Builder] ✅ Domain keywords added to profile
```

**What happened:**
- AI service had network timeout
- Pattern matching succeeded
- Profile builder got keywords
- System continued normally

---

## Monitoring in Production

### What to Watch For:

#### 1. High AI Failure Rate ⚠️
```
[Course Recommendations] ⚠️ LAYER 1 (AI Service) FAILED for "B.COM": 401
[Course Recommendations] ⚠️ LAYER 1 (AI Service) FAILED for "Animation": 401
[Course Recommendations] ⚠️ LAYER 1 (AI Service) FAILED for "Engineering": 401
```

**Action:** Check API key configuration, API service status

#### 2. Frequent Generic Keywords Usage ⚠️
```
[Course Recommendations] → Using LAYER 3 (Generic Keywords)
[Course Recommendations] → Using LAYER 3 (Generic Keywords)
[Course Recommendations] → Using LAYER 3 (Generic Keywords)
```

**Action:** Add new pattern matching rules for these fields

#### 3. Unknown Fields Appearing 📊
```
[Course Recommendations] ⚠️ LAYER 2 (Pattern Matching) - No match found for "Data Science"
[Course Recommendations] ⚠️ LAYER 2 (Pattern Matching) - No match found for "Cyber Security"
```

**Action:** Add these fields to pattern matching categories

#### 4. Good Performance ✅
```
[Course Recommendations] ✅ LAYER 1 (AI Service) SUCCESS for "B.COM"
[Course Recommendations] 🚀 CACHE HIT for "B.COM" (instant)
[Course Recommendations] ✅ LAYER 1 (AI Service) SUCCESS for "Animation"
[Course Recommendations] 🚀 CACHE HIT for "Animation" (instant)
```

**Action:** None needed - system working optimally

---

## Filtering Logs

### In Browser Console:
```javascript
// Show only course recommendation logs
console.log = (function(oldLog) {
  return function(...args) {
    if (args[0]?.includes('[Course Recommendations]') || args[0]?.includes('[Profile Builder]')) {
      oldLog.apply(console, args);
    }
  };
})(console.log);
```

### In Server Logs (Node.js):
```bash
# Filter for course recommendation logs
npm start 2>&1 | grep "Course Recommendations"

# Filter for failures only
npm start 2>&1 | grep "FAILED\|ERROR"

# Filter for cache hits
npm start 2>&1 | grep "CACHE HIT"
```

---

## Log Levels by Environment

### Development:
- ✅ All logs enabled
- Shows detailed fallback chain
- Shows cache hits/misses
- Shows keyword generation

### Production:
- ✅ Warnings and errors only (recommended)
- ⚠️ Fallback activations logged
- ❌ Errors logged
- 🚀 Cache hits silent (optional)

To reduce production logs, wrap debug logs in:
```javascript
if (process.env.NODE_ENV === 'development') {
  console.log('[Course Recommendations] ...');
}
```

---

## Performance Metrics from Logs

### Cache Hit Rate:
```
Total requests: 100
Cache hits: 85 (🚀)
Cache misses: 15 (💾)
Hit rate: 85%
```

### Layer Usage:
```
Layer 1 (AI): 70% ✅
Layer 2 (Pattern): 25% ⚠️
Layer 3 (Generic): 5% ⚠️
```

### Response Times:
```
AI Service: ~500ms
Pattern Matching: <1ms
Cache Hit: <1ms
```

---

## Troubleshooting Guide

### Problem: Too many AI failures
**Logs show:**
```
[Course Recommendations] ⚠️ LAYER 1 (AI Service) FAILED: 401
```
**Solution:** Check `OPENROUTER_API_KEY` environment variable

### Problem: Wrong keywords for a field
**Logs show:**
```
[Course Recommendations] ✅ LAYER 2 (Pattern Matching) SUCCESS
[Course Recommendations] Matched Category: Computer Science/IT
```
**Solution:** Field matched wrong category, update pattern matching rules

### Problem: Too many generic keywords
**Logs show:**
```
[Course Recommendations] → Using LAYER 3 (Generic Keywords)
```
**Solution:** Add pattern matching rule for this field category

### Problem: Cache not working
**Logs show:**
```
[Course Recommendations] 💾 CACHE MISS for "B.COM"
[Course Recommendations] 💾 CACHE MISS for "B.COM"  // Same field again!
```
**Solution:** Check cache implementation, may need to restart service

---

## Summary

The console logging provides:
- ✅ **Visibility** into which fallback layer is used
- ✅ **Debugging** information for failures
- ✅ **Performance** metrics (cache hits, response times)
- ✅ **Monitoring** data for production health
- ✅ **Troubleshooting** guidance for issues

All logs are clearly labeled and use consistent formatting for easy filtering and analysis.
