# Fix Zero Scores Issue - Action Plan

## Problem Identified
The PDF is showing 0 scores because **the data in your database actually has 0 values**. This is not a PDF generation issue - it's a score calculation issue that happened when the assessment was completed.

## Root Cause
Looking at the code flow:
1. Student completes assessment → responses saved to `personal_assessment_responses`
2. Assessment completion triggers score calculation
3. Scores are calculated and saved to `personal_assessment_results`
4. **IF score calculation fails or returns zeros, those zeros get saved**
5. PDF generation reads from database and correctly shows the zeros

## Immediate Diagnostic Steps

### Step 1: Check what's actually in the database
```sql
-- Run this to see the actual data
SELECT 
  id,
  student_id,
  grade_level,
  riasec_scores,
  strengths_scores,
  aptitude_scores,
  personality_scores,
  knowledge_score,
  employability_score,
  generated_at
FROM personal_assessment_results
WHERE student_id = 'YOUR_STUDENT_ID'  -- Replace with actual student ID
ORDER BY generated_at DESC
LIMIT 1;
```

### Step 2: Check if responses exist
```sql
-- Check if the student actually answered questions
SELECT 
  COUNT(*) as total_responses,
  COUNT(DISTINCT question_id) as unique_questions
FROM personal_assessment_responses r
JOIN personal_assessment_attempts a ON r.attempt_id = a.id
WHERE a.student_id = 'YOUR_STUDENT_ID'  -- Replace with actual student ID
  AND a.status = 'completed'
ORDER BY a.completed_at DESC
LIMIT 1;
```

### Step 3: Sample the responses
```sql
-- See what the responses look like
SELECT 
  r.response_value,
  q.text as question_text,
  q.question_type,
  s.name as section_name
FROM personal_assessment_responses r
JOIN personal_assessment_questions q ON r.question_id = q.id
JOIN personal_assessment_sections s ON q.section_id = s.id
JOIN personal_assessment_attempts a ON r.attempt_id = a.id
WHERE a.student_id = 'YOUR_STUDENT_ID'  -- Replace with actual student ID
  AND a.status = 'completed'
ORDER BY a.completed_at DESC, s.order_number, q.order_number
LIMIT 20;
```

## Possible Causes

### Cause 1: Score Calculation Never Ran
- The assessment was marked complete but scores were never calculated
- **Fix**: Re-run score calculation for this attempt

### Cause 2: Score Calculation Failed Silently
- Calculation ran but encountered errors and saved zeros as fallback
- **Fix**: Check logs, fix the calculation logic, re-run

### Cause 3: Question Bank Mismatch
- Responses were saved with question IDs that don't match the question bank
- **Fix**: Verify question IDs match between responses and questions table

### Cause 4: Response Format Issue
- Responses are in wrong format (e.g., stored as string instead of number)
- **Fix**: Transform response format and re-calculate

## Solutions

### Solution 1: Recalculate Scores for Existing Attempt
Create a script to:
1. Fetch the attempt and all responses
2. Re-run the score calculation logic
3. Update the `personal_assessment_results` table

### Solution 2: Regenerate Assessment Result
If responses are valid:
1. Delete the bad result
2. Trigger result generation again
3. This will re-calculate everything from scratch

### Solution 3: Manual Score Entry (Last Resort)
If automated calculation fails:
1. Manually calculate scores from responses
2. Update database directly
3. Regenerate PDF

## Next Steps

1. **Run the diagnostic queries above** to see what's in the database
2. **Share the results** so I can see:
   - What the riasec_scores, aptitude_scores, etc. look like
   - If responses exist and what format they're in
   - If question IDs match
3. **I'll create a fix script** based on what we find

## Quick Test
To verify the PDF generation is working correctly, try this:
```sql
-- Temporarily update one result with test data
UPDATE personal_assessment_results
SET 
  riasec_scores = '{"R": 15, "I": 12, "A": 8, "S": 10, "E": 7, "C": 5}'::jsonb,
  aptitude_scores = '{"verbal": {"correct": 8, "total": 10}, "numerical": {"correct": 7, "total": 10}}'::jsonb,
  knowledge_score = 15,
  knowledge_percentage = 75,
  employability_score = 80
WHERE id = 'YOUR_RESULT_ID';  -- Replace with actual result ID
```

Then regenerate the PDF. If it shows the correct scores, we know:
- ✅ PDF generation is working
- ❌ Score calculation is the problem

---

**The transformer service is working fine. The issue is upstream in the score calculation.**
