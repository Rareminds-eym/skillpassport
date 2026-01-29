# Debug Assessment Data Issue

## Problem
PDF showing all zeros (0.0) for scores except employability.

## Diagnostic Steps

### 1. Check Browser Console

Open browser console (F12) and look for:

```
🔥🔥🔥 useAssessmentResults hook loaded - NEW CODE WITH TRANSFORMER 🔥🔥🔥
🔄 Transforming database results to PDF format...
✅ Transformation complete: {
  hasAptitude: true/false,
  hasCareerFit: true/false,
  hasSkillGap: true/false,
  hasLearningStyles: true/false
}
```

### 2. Check Results Object

In browser console, type:
```javascript
// Get the results from React DevTools or window
console.log('Results:', results);
```

### 3. Check Database Data

The issue might be:
- Data not fetched from database
- Data structure mismatch
- Transformation failing silently

### 4. Quick Fix - Check Data Structure

The transformer expects this structure from database:
```javascript
{
  riasec_scores: { R: 15, I: 18, A: 8, S: 10, E: 7, C: 5 },
  top_interests: ["I", "R", "S"],
  aptitude_scores: {
    Analytical: { ease: 4, enjoyment: 5 },
    Creative: { ease: 3, enjoyment: 4 }
  },
  personality_scores: {
    Openness: 4.1,
    Conscientiousness: 3.7,
    Extraversion: 3.2,
    Agreeableness: 3.9,
    Neuroticism: 2.8
  },
  gemini_analysis: { ... }
}
```

But transforms to:
```javascript
{
  riasec: {
    scores: { R: 15, I: 18, A: 8, S: 10, E: 7, C: 5 },
    topThree: ["I", "R", "S"],
    maxScore: 20
  },
  aptitude: {
    scores: {
      numerical: { percentage: 90, raw: 18 }
    },
    topStrengths: ["Numerical"],
    overallScore: 90
  },
  bigFive: { ... },
  _transformed: true
}
```

### 5. Possible Issues

**Issue 1: Data not being fetched**
- Check if `attemptId` is in URL
- Check if database query is successful
- Check RLS policies

**Issue 2: Transformation not running**
- Check if `setResults` wrapper is being called
- Check if transformation logic is executing
- Check for JavaScript errors

**Issue 3: Data structure mismatch**
- Database might have different field names
- Data might be in wrong format
- Transformation might be failing validation

### 6. Immediate Debug Commands

Run these in browser console:

```javascript
// 1. Check if results exist
console.log('Results:', results);

// 2. Check if transformed
console.log('Is transformed?', results?._transformed);

// 3. Check RIASEC data
console.log('RIASEC:', results?.riasec);

// 4. Check aptitude data
console.log('Aptitude:', results?.aptitude);

// 5. Check if data is in old format
console.log('Old format check:', {
  hasRiasecScores: !!results?.riasec_scores,
  hasAptitudeScores: !!results?.aptitude_scores,
  hasGeminiAnalysis: !!results?.gemini_analysis
});
```

### 7. Check Network Tab

1. Open Network tab in DevTools
2. Filter by "personal_assessment"
3. Look for the API call that fetches results
4. Check the response data structure
5. Verify data is coming from database

### 8. Temporary Workaround

If transformation is failing, you can temporarily bypass it:

In `useAssessmentResults.js`, find the `setResults` function and add logging:

```javascript
const setResults = useCallback((resultsData) => {
  console.log('🔍 setResults called with:', resultsData);
  console.log('🔍 Data keys:', Object.keys(resultsData || {}));
  console.log('🔍 Has riasec_scores?', !!resultsData?.riasec_scores);
  console.log('🔍 Has riasec?', !!resultsData?.riasec);
  
  // Rest of function...
});
```

### 9. Check Assessment Completion

The zeros might indicate:
- Assessment wasn't completed
- Responses weren't saved
- Scoring logic didn't run
- Database doesn't have the data

Check in database:
```sql
SELECT * FROM personal_assessment_results 
WHERE attempt_id = 'your-attempt-id';
```

### 10. Next Steps

Based on console output:

**If you see transformation logs:**
- Transformation is running
- Check what data it's receiving
- Check if transformation is correct

**If you DON'T see transformation logs:**
- Transformation isn't running
- Check if hook is loaded
- Check if setResults is being called

**If data is all zeros in database:**
- Assessment scoring didn't run
- Need to regenerate results
- Click "Retry" button

**If data exists in database but shows zeros in PDF:**
- Transformation issue
- Data structure mismatch
- Need to fix transformation logic

