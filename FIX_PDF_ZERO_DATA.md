# Fix PDF Showing Zero Data

## Problem
The PDF is showing "0.0" for all scores and "0%" for all percentages, even though the watermarks are working correctly.

## Root Cause Analysis

Based on the code review, there are several possible causes:

### 1. Database Has No Actual Score Data
The `personal_assessment_results` table might have a record but with NULL or empty score fields.

### 2. Data is in Wrong Field
The scores might be stored in `gemini_results` field instead of individual score fields (`riasec_scores`, `aptitude_scores`, etc.).

### 3. Transformation Not Applied
The `transformAssessmentResults()` function might not be receiving the correct data structure.

## Diagnostic Steps

### Step 1: Check Database Data

Run this SQL query to see what's actually in your database:

```sql
-- Check the most recent assessment result
SELECT 
    id,
    student_id,
    grade_level,
    riasec_scores,
    aptitude_scores,
    personality_scores,
    knowledge_score,
    employability_score,
    gemini_analysis,
    gemini_results,  -- This might be where the data is!
    career_recommendations
FROM personal_assessment_results
WHERE student_id = 'YOUR_STUDENT_ID'  -- Replace with actual student ID
ORDER BY created_at DESC
LIMIT 1;
```

### Step 2: Check Browser Console

Open the browser console (F12) and look for these log messages:

```
🔍 setResults called with data:
🔄 Transforming database results to PDF format...
✅ Transformation complete:
```

If you see errors or the transformation isn't happening, that's the issue.

### Step 3: Check Network Tab

In the browser Network tab, check the response from the database query. Look for the `personal_assessment_results` data.

## Solutions

### Solution 1: Data is in `gemini_results` field (Most Likely)

If your data is stored in the `gemini_results` field instead of individual columns, the hook should handle this automatically. But let's verify:

**Check the hook code at line ~370:**

```javascript
// In useAssessmentResults.js
const setResults = useCallback((resultsData) => {
    if (!resultsData) {
        setResultsInternal(null);
        return;
    }

    // Check if data is already transformed
    if (resultsData._transformed) {
        console.log('✅ Results already transformed, using as-is');
        setResultsInternal(resultsData);
        return;
    }

    // Check if this looks like database format
    const isDatabaseFormat = resultsData.gemini_analysis || 
                            resultsData.aptitude_scores || 
                            resultsData.riasec_scores;

    if (isDatabaseFormat) {
        console.log('🔄 Transforming database results to PDF format...');
        try {
            const transformed = transformAssessmentResults(resultsData);
            console.log('✅ Transformation complete:', transformed);
            setResultsInternal(transformed);
        } catch (error) {
            console.error('❌ Transformation failed:', error);
            setResultsInternal(resultsData);
        }
    } else {
        // Already in correct format
        setResultsInternal(resultsData);
    }
}, []);
```

**The issue:** If your data is in `gemini_results` field (not `gemini_analysis`), the transformation won't trigger!

### Solution 2: Fix the Data Detection Logic

Update the `setResults` function to also check for `gemini_results`:

```javascript
// Check if this looks like database format
const isDatabaseFormat = resultsData.gemini_analysis || 
                        resultsData.gemini_results ||  // ✅ ADD THIS LINE
                        resultsData.aptitude_scores || 
                        resultsData.riasec_scores;
```

### Solution 3: Data is Actually Missing

If the database truly has no scores, you need to regenerate the assessment results:

1. Click the "Retry" button on the assessment results page
2. This will regenerate the AI analysis and scores
3. The scores should then appear in the PDF

### Solution 4: Update the Transformer to Handle `gemini_results`

If your data is in `gemini_results` instead of `gemini_analysis`, update the transformer:

```javascript
// In assessmentResultTransformer.js
export const transformAssessmentResults = (dbResults) => {
  if (!dbResults || typeof dbResults !== 'object') {
    return null;
  }

  // ✅ Handle both gemini_analysis and gemini_results
  const geminiData = dbResults.gemini_analysis || dbResults.gemini_results;
  
  // Extract and transform Gemini analysis
  const geminiTransformed = transformGeminiAnalysis(geminiData);
  
  // ... rest of the function
};
```

## Quick Fix Script

Create this file and run it to check and fix your data:

```javascript
// check-and-fix-assessment-data.js
import { supabase } from './src/lib/supabaseClient.js';
import { transformAssessmentResults } from './src/services/assessmentResultTransformer.js';

async function checkAndFixAssessmentData() {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user logged in');
      return;
    }

    // Get latest assessment result
    const { data: result, error } = await supabase
      .from('personal_assessment_results')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching result:', error);
      return;
    }

    console.log('📊 Raw database result:', result);
    console.log('');
    console.log('🔍 Checking data fields:');
    console.log('  - riasec_scores:', result.riasec_scores);
    console.log('  - aptitude_scores:', result.aptitude_scores);
    console.log('  - personality_scores:', result.personality_scores);
    console.log('  - gemini_analysis:', result.gemini_analysis ? 'EXISTS' : 'NULL');
    console.log('  - gemini_results:', result.gemini_results ? 'EXISTS' : 'NULL');
    console.log('');

    // Check which field has the data
    if (result.gemini_results && typeof result.gemini_results === 'object') {
      console.log('✅ Data found in gemini_results field');
      console.log('   Structure:', Object.keys(result.gemini_results));
      
      // Try transformation
      console.log('');
      console.log('🔄 Testing transformation...');
      const transformed = transformAssessmentResults(result);
      console.log('✅ Transformation result:', {
        hasRiasec: !!transformed.riasec,
        hasAptitude: !!transformed.aptitude,
        hasCareerFit: !!transformed.careerFit,
        riasecScores: transformed.riasec?.scores
      });
    } else if (result.gemini_analysis && typeof result.gemini_analysis === 'object') {
      console.log('✅ Data found in gemini_analysis field');
      console.log('   Structure:', Object.keys(result.gemini_analysis));
    } else if (result.riasec_scores) {
      console.log('✅ Data found in individual score fields');
      console.log('   RIASEC scores:', result.riasec_scores);
    } else {
      console.log('❌ NO DATA FOUND - Assessment needs to be regenerated');
      console.log('   Click the "Retry" button on the assessment results page');
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkAndFixAssessmentData();
```

## Implementation Steps

### Step 1: Update useAssessmentResults Hook

Add `gemini_results` to the detection logic:

```javascript
// In src/features/assessment/assessment-result/hooks/useAssessmentResults.js
// Around line 370

const isDatabaseFormat = resultsData.gemini_analysis || 
                        resultsData.gemini_results ||  // ✅ ADD THIS
                        resultsData.aptitude_scores || 
                        resultsData.riasec_scores;
```

### Step 2: Update Transformer

Handle both field names:

```javascript
// In src/services/assessmentResultTransformer.js
// Around line 200

export const transformAssessmentResults = (dbResults) => {
  if (!dbResults || typeof dbResults !== 'object') {
    return null;
  }

  // ✅ Handle both gemini_analysis and gemini_results
  const geminiData = dbResults.gemini_analysis || dbResults.gemini_results;
  
  // Extract and transform Gemini analysis first
  const geminiTransformed = transformGeminiAnalysis(geminiData);
  
  // ... rest of function
};
```

### Step 3: Add Debug Logging

Add more logging to see what's happening:

```javascript
// In useAssessmentResults.js setResults function

console.log('🔍 setResults called with data:', {
  hasData: !!resultsData,
  keys: Object.keys(resultsData || {}),
  _transformed: resultsData._transformed,
  hasGeminiResults: !!resultsData.gemini_results,
  hasGeminiAnalysis: !!resultsData.gemini_analysis,
  hasRiasec: !!resultsData.riasec,
  hasRiasecScores: !!resultsData.riasec_scores,
  // ✅ ADD THIS:
  geminiResultsKeys: resultsData.gemini_results ? Object.keys(resultsData.gemini_results) : null,
  riasecScoresValue: resultsData.riasec_scores
});
```

### Step 4: Test

1. Refresh the assessment results page
2. Open browser console (F12)
3. Look for the debug logs
4. Check if transformation is happening
5. Verify the PDF shows correct data

## Expected Console Output

If working correctly, you should see:

```
🔍 setResults called with data: {
  hasData: true,
  keys: ["id", "student_id", "gemini_results", "riasec_scores", ...],
  hasGeminiResults: true,
  hasRiasecScores: true,
  geminiResultsKeys: ["riasec", "aptitude", "careerFit", ...],
  riasecScoresValue: {R: 15, I: 18, A: 8, S: 10, E: 7, C: 5}
}
🔄 Transforming database results to PDF format...
✅ Transformation complete: {
  hasAptitude: true,
  hasCareerFit: true,
  hasSkillGap: true,
  riasecScores: {R: 15, I: 18, A: 8, S: 10, E: 7, C: 5}
}
```

## If Still Showing Zeros

If after all these fixes the PDF still shows zeros, the issue is that **the database truly has no score data**. In this case:

1. The assessment was completed but scores weren't calculated
2. The AI analysis failed or wasn't run
3. The data was lost or corrupted

**Solution:** Regenerate the assessment:

1. Go to the assessment results page
2. Click the "Retry" or "Regenerate" button
3. Wait for the AI analysis to complete
4. The PDF should now show correct scores

## Prevention

To prevent this in the future:

1. **Add validation during assessment submission** - Ensure scores are calculated before saving
2. **Add error handling** - If AI analysis fails, show clear error message
3. **Add data integrity checks** - Validate that all required fields are present
4. **Add retry logic** - Automatically retry if AI analysis fails

## Summary

The most likely cause is that your data is stored in `gemini_results` field but the code is only checking for `gemini_analysis`. The fix is simple:

1. Update the detection logic to check both fields
2. Update the transformer to handle both fields
3. Add debug logging to verify
4. Test and confirm

If the database truly has no data, use the "Retry" button to regenerate.
