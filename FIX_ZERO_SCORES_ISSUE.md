# Fix Zero Scores Issue in Assessment PDF

## Problem

The PDF is generating correctly with good watermarks, but **all scores are showing as 0**:
- RIASEC scores: 0.0 / 5
- Aptitude scores: 0.0 / 8  
- Knowledge scores: 0 / 1
- All percentages: 0%

## Root Cause

The issue is **NOT** with the PDF generation or transformation logic. The problem is that the **database has 0 values stored** in the `personal_assessment_results` table.

This means one of the following happened:

1. **Responses were not saved** - Student completed assessment but answers weren't recorded
2. **Scoring logic failed** - Responses were saved but score calculation returned zeros
3. **AI analysis failed** - Gemini API didn't generate proper scores
4. **Result generation incomplete** - Result record was created but scores weren't populated

## Diagnostic Steps

### Step 1: Check Database for This Student

Run the diagnostic SQL script:

```bash
# Open Supabase SQL Editor and run:
```

```sql
-- File: debug-zero-scores.sql (already created)
```

This will show you:
- If the result record exists
- What scores are actually stored
- If responses were recorded
- If AI analysis was generated

### Step 2: Check What You'll Find

**Scenario A: No responses recorded**
```sql
response_count: 0
```
**Fix:** Student needs to retake the assessment

**Scenario B: Responses exist but scores are 0**
```sql
response_count: 50+
riasec_scores: {"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0}
```
**Fix:** Re-run score calculation

**Scenario C: Scores exist but AI analysis failed**
```sql
riasec_scores: {"R": 15, "I": 18, ...}  -- Good scores
gemini_analysis: null  -- Missing AI analysis
```
**Fix:** Regenerate AI analysis

**Scenario D: Everything is 0**
```sql
riasec_scores: {"R": 0, "I": 0, ...}
strengths_scores: {}
aptitude_scores: null
gemini_analysis: null
```
**Fix:** Complete result regeneration needed

## Solutions

### Solution 1: Regenerate Result from Existing Responses

If responses exist but scores are wrong, regenerate the result:

```javascript
// In browser console on the assessment result page:
// Click the "Retry" button in the UI

// OR manually trigger:
const attemptId = 'YOUR_ATTEMPT_ID'; // Get from URL or database

// This will:
// 1. Fetch all responses
// 2. Recalculate scores
// 3. Call Gemini API for AI analysis
// 4. Update the result record
```

### Solution 2: Manual Score Calculation (If Retry Fails)

Create a script to manually calculate scores:

```javascript
// File: recalculate-assessment-scores.js

import { supabase } from './src/lib/supabaseClient.js';

async function recalculateScores(attemptId) {
  console.log('🔄 Recalculating scores for attempt:', attemptId);
  
  // 1. Fetch all responses
  const { data: responses, error: responseError } = await supabase
    .from('personal_assessment_responses')
    .select(`
      *,
      personal_assessment_questions(*)
    `)
    .eq('attempt_id', attemptId);
  
  if (responseError || !responses || responses.length === 0) {
    console.error('❌ No responses found:', responseError);
    return;
  }
  
  console.log(`✅ Found ${responses.length} responses`);
  
  // 2. Calculate RIASEC scores
  const riasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const riasecCounts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  
  responses.forEach(response => {
    const question = response.personal_assessment_questions;
    if (question.question_type === 'riasec' && question.riasec_code) {
      const code = question.riasec_code;
      const value = parseInt(response.answer_value) || 0;
      riasecScores[code] += value;
      riasecCounts[code]++;
    }
  });
  
  // Get top 3 interests
  const topInterests = Object.entries(riasecScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([code]) => code);
  
  console.log('📊 RIASEC Scores:', riasecScores);
  console.log('🏆 Top Interests:', topInterests);
  
  // 3. Calculate strengths scores
  const strengthsScores = {};
  const strengthsCounts = {};
  
  responses.forEach(response => {
    const question = response.personal_assessment_questions;
    if (question.question_type === 'strengths' && question.strength_category) {
      const category = question.strength_category;
      const value = parseInt(response.answer_value) || 0;
      
      if (!strengthsScores[category]) {
        strengthsScores[category] = 0;
        strengthsCounts[category] = 0;
      }
      
      strengthsScores[category] += value;
      strengthsCounts[category]++;
    }
  });
  
  // Average the scores
  Object.keys(strengthsScores).forEach(category => {
    strengthsScores[category] = strengthsScores[category] / strengthsCounts[category];
  });
  
  // Get top 3 strengths
  const topStrengths = Object.entries(strengthsScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);
  
  console.log('💪 Strengths Scores:', strengthsScores);
  console.log('🏆 Top Strengths:', topStrengths);
  
  // 4. Update the result record
  const { data: result, error: updateError } = await supabase
    .from('personal_assessment_results')
    .update({
      riasec_scores: riasecScores,
      top_interests: topInterests,
      strengths_scores: strengthsScores,
      top_strengths: topStrengths,
      updated_at: new Date().toISOString()
    })
    .eq('attempt_id', attemptId)
    .select()
    .single();
  
  if (updateError) {
    console.error('❌ Failed to update result:', updateError);
    return;
  }
  
  console.log('✅ Result updated successfully!');
  console.log('🔄 Now regenerate AI analysis using the Retry button in the UI');
  
  return result;
}

// Usage:
// recalculateScores('YOUR_ATTEMPT_ID');
```

### Solution 3: Check Score Calculation Logic

The issue might be in the score calculation service. Check:

```javascript
// File: src/services/assessmentService.js

// Look for the calculateScores function
// Verify it's:
// 1. Fetching responses correctly
// 2. Matching questions correctly
// 3. Summing scores correctly
// 4. Handling null/undefined values

// Common issues:
// - Wrong question type filter
// - Incorrect RIASEC code mapping
// - Division by zero
// - Null answer values not handled
```

### Solution 4: Check AI Analysis Generation

If scores are correct but AI analysis is missing:

```javascript
// Check: src/services/geminiAssessmentService.js

// Verify:
// 1. API key is valid
// 2. Request format is correct
// 3. Response parsing works
// 4. Error handling doesn't silently fail

// Test manually:
const testAIGeneration = async () => {
  const mockScores = {
    riasec: { R: 15, I: 18, A: 8, S: 10, E: 7, C: 5 },
    strengths: { Curiosity: 4.2, Creativity: 4.0 },
    gradeLevel: 'after12'
  };
  
  const result = await analyzeAssessmentWithGemini(mockScores);
  console.log('AI Analysis:', result);
};
```

## Quick Fix for This Specific Student

Since the PDF shows the student name "Lilikesh Vilvanathan" and registration "SCH-GS512":

### Option A: Use the Retry Button (Easiest)

1. Open the assessment result page in browser
2. Click the **"Retry"** or **"Regenerate Analysis"** button
3. Wait for the process to complete (may take 30-60 seconds)
4. Refresh the page
5. Generate PDF again

### Option B: Manual Database Fix (If Retry Doesn't Work)

1. Run the diagnostic SQL to get the `attempt_id`
2. Check if responses exist
3. If responses exist, run the recalculation script
4. If no responses, student must retake assessment

### Option C: Check if This is a Test/Demo Result

If this is a test result with no actual responses:

```sql
-- Create a sample result for testing
UPDATE personal_assessment_results
SET 
    riasec_scores = '{"R": 15, "I": 18, "A": 8, "S": 10, "E": 7, "C": 5}'::jsonb,
    top_interests = ARRAY['I', 'R', 'S'],
    strengths_scores = '{"Curiosity": 4.2, "Creativity": 4.0, "Perseverance": 3.8}'::jsonb,
    top_strengths = ARRAY['Curiosity', 'Creativity', 'Perseverance'],
    personality_scores = '{"Openness": 4.1, "Conscientiousness": 3.7, "Extraversion": 3.2, "Agreeableness": 3.9, "Neuroticism": 2.8}'::jsonb,
    knowledge_score = 42,
    knowledge_percentage = 84.0,
    employability_score = 4.5
WHERE student_id IN (
    SELECT id FROM students 
    WHERE enrollmentNumber = 'SCH-GS512'
)
AND riasec_scores->>'R' = '0';  -- Only update if currently 0
```

## Prevention

To prevent this issue in the future:

### 1. Add Validation Before Saving Results

```javascript
// In result generation service
const validateScoresBeforeSaving = (scores) => {
  // Check if all scores are 0
  const allZero = Object.values(scores.riasec || {}).every(v => v === 0);
  
  if (allZero) {
    throw new Error('Invalid scores: All values are 0. Check response data.');
  }
  
  return true;
};
```

### 2. Add Retry Logic for AI Analysis

```javascript
// Retry up to 3 times if AI analysis fails
const generateAIAnalysisWithRetry = async (scores, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await analyzeAssessmentWithGemini(scores);
      if (result && result.overallSummary) {
        return result;
      }
    } catch (error) {
      console.error(`AI analysis attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
    }
  }
};
```

### 3. Add Monitoring

```javascript
// Log when scores are suspiciously low
const monitorScoreQuality = (scores) => {
  const riasecTotal = Object.values(scores.riasec || {}).reduce((a, b) => a + b, 0);
  
  if (riasecTotal < 10) {
    console.warn('⚠️ Suspiciously low RIASEC scores:', scores.riasec);
    // Send alert to monitoring service
  }
};
```

## Next Steps

1. **Immediate:** Run `debug-zero-scores.sql` to diagnose the issue
2. **Short-term:** Use Retry button or manual recalculation
3. **Long-term:** Add validation and monitoring to prevent future occurrences

## Summary

The watermarks are fixed and look great! The zero scores issue is a **data problem**, not a PDF problem. The most likely cause is:

- Responses weren't saved properly during assessment
- Score calculation failed silently
- AI analysis generation failed

**Recommended action:** Click the "Retry" button on the assessment result page to regenerate the analysis from scratch.
