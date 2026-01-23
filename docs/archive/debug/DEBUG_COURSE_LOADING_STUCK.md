# Debug: Course Loading Stuck Issue

## Problem
The "Finding best matches..." spinner gets stuck when trying to view courses for a role.

## Root Cause Analysis

### Possible Causes
1. **AI API Call Hanging** - `matchCoursesForRole()` not responding
2. **Missing Platform Courses** - `results.platformCourses` is empty or undefined
3. **Network Timeout** - API call taking too long
4. **API Key Issues** - OpenRouter API key not configured

## Fix Applied

### 1. Added Timeout Protection
**File**: `src/features/assessment/assessment-result/components/CareerTrackModal.jsx`

Added 10-second timeout to prevent indefinite hanging:

```javascript
// Add timeout to prevent hanging
const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('AI matching timeout after 10 seconds')), 10000)
);

const matchResult = await Promise.race([
    matchCoursesForRole(roleName, clusterTitle, coursesForMatching),
    timeoutPromise
]);
```

### 2. Enhanced Logging
Added detailed console logs to track the issue:

```javascript
console.log('[CareerTrackModal] Skipping AI matching:', {
    hasRole: !!selectedRole,
    hasPlatformCourses: !!results?.platformCourses,
    courseCount: results?.platformCourses?.length || 0
});
```

### 3. Fallback System
If AI matching fails or times out, automatically falls back to keyword-based matching:

```javascript
catch (error) {
    console.error('[CareerTrackModal] AI course matching failed:', error);
    // Use fallback - still ensure 4 courses
    const fallbackCourses = ensureFourCourses([], roleName, clusterTitle, results.platformCourses);
    setAiMatchedCourses(fallbackCourses);
}
```

## How to Debug

### Step 1: Check Browser Console
Open browser DevTools (F12) and look for these logs:

**Good Signs** ✅:
```
[CareerTrackModal] Calling AI course matching for: Software Developer
[CareerTrackModal] AI matched 4 courses: [reasoning]
```

**Problem Signs** ❌:
```
[CareerTrackModal] Skipping AI matching: { hasRole: true, hasPlatformCourses: false, courseCount: 0 }
[CareerTrackModal] AI course matching failed: Error: AI matching timeout after 10 seconds
[CareerTrackModal] AI course matching failed: Error: Network request failed
```

### Step 2: Check Platform Courses
In browser console, type:
```javascript
// Check if courses are loaded
console.log('Platform courses:', window.__ASSESSMENT_RESULTS__?.platformCourses);
```

### Step 3: Check API Configuration
Verify environment variables:
```bash
# Check if CAREER_API_URL is set
echo $VITE_CAREER_API_URL

# Should be: https://career-api.dark-mode-d021.workers.dev
```

### Step 4: Test API Directly
```javascript
// Test the career-api worker
fetch('https://career-api.dark-mode-d021.workers.dev/health')
    .then(r => r.json())
    .then(console.log);
```

## Quick Fixes

### Fix 1: If Platform Courses Missing
The issue might be that courses weren't generated. Check the assessment results:

```javascript
// In browser console
const results = window.__ASSESSMENT_RESULTS__;
console.log({
    hasPlatformCourses: !!results?.platformCourses,
    count: results?.platformCourses?.length,
    courses: results?.platformCourses
});
```

If `platformCourses` is empty, regenerate the assessment or manually trigger course generation.

### Fix 2: If API Timeout
The AI matching is taking too long. The timeout will now trigger fallback after 10 seconds.

**What happens**:
1. Wait 10 seconds
2. Timeout error logged
3. Fallback to keyword matching
4. Show 4 courses based on keywords

### Fix 3: Disable AI Matching Temporarily
If AI matching keeps failing, you can temporarily disable it:

```javascript
// In CareerTrackModal.jsx, replace the AI call with immediate fallback:
const fetchAIMatchedCourses = async () => {
    if (!selectedRole || !results?.platformCourses || results.platformCourses.length === 0) {
        setAiMatchedCourses([]);
        return;
    }

    const roleName = getRoleName(selectedRole);
    const clusterTitle = selectedTrack.cluster?.title || '';

    setCourseMatchingLoading(true);
    
    // SKIP AI - go straight to fallback
    const fallbackCourses = ensureFourCourses([], roleName, clusterTitle, results.platformCourses);
    setAiMatchedCourses(fallbackCourses);
    
    setCourseMatchingLoading(false);
};
```

## Testing After Fix

1. **Clear browser cache** and reload
2. Complete an assessment
3. Click a career card
4. Select a role
5. Navigate to Courses page
6. **Check console** for logs
7. **Wait max 10 seconds** - should show courses or fallback

### Expected Behavior
- ✅ Loading spinner shows for 1-10 seconds
- ✅ Either AI-matched courses appear OR fallback courses appear
- ✅ Always shows exactly 4 courses
- ✅ No infinite loading

## Common Issues & Solutions

### Issue 1: "Skipping AI matching: courseCount: 0"
**Problem**: No platform courses available
**Solution**: 
1. Check if assessment generated courses
2. Regenerate assessment results
3. Verify `addCourseRecommendations()` is working

### Issue 2: "AI matching timeout after 10 seconds"
**Problem**: API call too slow or hanging
**Solution**:
1. Check network connection
2. Verify career-api worker is running
3. Check OpenRouter API status
4. Fallback will automatically show courses

### Issue 3: "Network request failed"
**Problem**: Can't reach career-api worker
**Solution**:
1. Check VITE_CAREER_API_URL is set correctly
2. Verify worker is deployed
3. Check CORS settings
4. Fallback will automatically show courses

### Issue 4: Courses shown but not relevant
**Problem**: Fallback is working but AI matching failed
**Solution**:
1. Check OpenRouter API key in worker
2. Verify worker has correct endpoint
3. Check worker logs for errors
4. AI will retry on next role selection

## Monitoring

Add this to track success rate:

```javascript
// In CareerTrackModal.jsx
useEffect(() => {
    if (aiMatchedCourses.length > 0 && !courseMatchingLoading) {
        console.log('✅ Course matching complete:', {
            role: getRoleName(selectedRole),
            coursesShown: aiMatchedCourses.length,
            usedAI: !courseMatchingError
        });
    }
}, [aiMatchedCourses, courseMatchingLoading]);
```

## Next Steps

1. ✅ Timeout protection added (10 seconds)
2. ✅ Enhanced logging added
3. ✅ Fallback system verified
4. ⏳ Test in browser
5. ⏳ Check console logs
6. ⏳ Verify courses appear

## Rollback

If issues persist, temporarily disable AI matching:

```javascript
// Quick disable - always use fallback
const fetchAIMatchedCourses = async () => {
    if (!selectedRole || !results?.platformCourses) {
        setAiMatchedCourses([]);
        return;
    }
    
    setCourseMatchingLoading(true);
    const fallbackCourses = ensureFourCourses([], getRoleName(selectedRole), 
        selectedTrack.cluster?.title || '', results.platformCourses);
    setAiMatchedCourses(fallbackCourses);
    setCourseMatchingLoading(false);
};
```

This ensures courses always show, even if AI is broken.
