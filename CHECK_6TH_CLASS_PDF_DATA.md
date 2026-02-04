# 6th Class Student PDF Data Diagnostic

## Problem Statement

You want to verify whether the data shown in the 6th class student assessment PDF is actually coming from the database tables correctly.

## What I've Created

I've created two diagnostic tools to help you check this:

### 1. SQL Diagnostic Script: `check-6th-class-assessment-data.sql`

This SQL script performs 9 comprehensive checks:

1. **Find 6th grade students** with completed assessments
2. **Check if results exist** for 6th grade students
3. **Get detailed data** for the most recent 6th grade result
4. **Check the structure** of gemini_analysis/gemini_results field
5. **Verify data location** (individual columns vs gemini fields)
6. **Sample the actual data** structure
7. **Check responses** to ensure data was collected
8. **Verify PDF data availability** - all required fields
9. **Summary report** - completion percentages

**How to use:**
```bash
# Run in your Supabase SQL Editor or psql
psql -h your-host -U your-user -d your-db -f check-6th-class-assessment-data.sql
```

### 2. JavaScript Diagnostic Script: `diagnose-6th-class-pdf-data.js`

This Node.js script:
- Fetches a 6th grade student's assessment result from database
- Analyzes the raw database structure
- Applies the transformation (using `assessmentResultTransformer.js`)
- Validates the transformed data
- Shows exactly what the PDF will receive
- Provides a completeness score

**How to use:**
```bash
# Check the most recent 6th grade result
node diagnose-6th-class-pdf-data.js

# Check a specific result by ID
node diagnose-6th-class-pdf-data.js <result-id>
```

## Understanding the Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE STORAGE                          │
│  personal_assessment_results table                           │
│                                                              │
│  Option A: Individual Columns                                │
│  ├─ riasec_scores: {R: 15, I: 18, ...}                      │
│  ├─ top_interests: ["I", "R", "S"]                          │
│  ├─ strengths_scores: {Curiosity: 4.2, ...}                 │
│  └─ career_recommendations: ["Software Engineer", ...]      │
│                                                              │
│  Option B: Nested in gemini_results                          │
│  └─ gemini_results: {                                        │
│       riasec: {scores: {...}, topThree: [...]},             │
│       strengths: {...},                                      │
│       careerFit: {...}                                       │
│     }                                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              TRANSFORMATION LAYER                            │
│  assessmentResultTransformer.js                              │
│                                                              │
│  ✅ Detects data location (columns vs gemini_results)       │
│  ✅ Transforms aptitude structure                            │
│  ✅ Flattens AI analysis                                     │
│  ✅ Enriches career recommendations                          │
│  ✅ Validates completeness                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  PDF COMPONENT                               │
│  PrintViewMiddleHighSchool.jsx                               │
│                                                              │
│  Receives transformed data:                                  │
│  ├─ results.riasec.scores                                   │
│  ├─ results.riasec.topThree                                 │
│  ├─ results.strengths                                        │
│  ├─ results.careerFit.clusters                              │
│  ├─ results.overallSummary                                   │
│  └─ results.skillGap                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    📄 PDF OUTPUT
```

## Common Issues and Solutions

### Issue 1: Data in Wrong Field

**Symptom:** PDF shows "undefined" or empty sections

**Diagnosis:**
```sql
-- Run this query to check where data is stored
SELECT 
    id,
    CASE WHEN riasec_scores IS NOT NULL THEN '✅ Individual columns' ELSE '❌' END as has_columns,
    CASE WHEN gemini_results ? 'riasec' THEN '✅ In gemini_results' ELSE '❌' END as in_gemini_results,
    CASE WHEN gemini_analysis ? 'riasec' THEN '✅ In gemini_analysis' ELSE '❌' END as in_gemini_analysis
FROM personal_assessment_results
WHERE grade_level = 'middle'
ORDER BY created_at DESC
LIMIT 5;
```

**Solution:** The transformer automatically detects and handles both storage formats.

### Issue 2: Missing AI Analysis

**Symptom:** PDF missing career recommendations or AI summary

**Diagnosis:**
```sql
-- Check if AI analysis was generated
SELECT 
    id,
    CASE 
        WHEN gemini_analysis IS NOT NULL OR gemini_results IS NOT NULL THEN '✅ Present'
        ELSE '❌ Missing'
    END as ai_status,
    career_recommendations,
    generated_at
FROM personal_assessment_results
WHERE grade_level = 'middle'
ORDER BY created_at DESC
LIMIT 5;
```

**Solution:** 
- If missing, the AI analysis generation may have failed
- Check backend logs for Gemini API errors
- Can regenerate using `regenerateAnalysis()` function

### Issue 3: Aptitude Data Structure Mismatch

**Symptom:** Aptitude section shows wrong values or errors

**Diagnosis:**
```sql
-- Check aptitude data structure
SELECT 
    id,
    aptitude_scores,
    jsonb_typeof(aptitude_scores) as type,
    jsonb_object_keys(aptitude_scores) as keys
FROM personal_assessment_results
WHERE grade_level = 'middle'
  AND aptitude_scores IS NOT NULL
LIMIT 1;
```

**Solution:** The transformer converts between formats:
- Database: `{Analytical: {ease: 4, enjoyment: 5}}`
- PDF: `{numerical: {percentage: 90, raw: 18}}`

## Validation Checklist

Use this checklist to verify 6th class PDF data:

### ✅ Required Fields (Must Have)
- [ ] `riasec_scores` - Interest scores
- [ ] `top_interests` - Top 3 interests (array with 3 items)
- [ ] `strengths_scores` - Character strengths
- [ ] `top_strengths` - Top strengths (array)

### ⚠️ Important Fields (Should Have)
- [ ] `gemini_analysis` or `gemini_results` - AI analysis
- [ ] `career_recommendations` - Career suggestions (array)
- [ ] `skill_gaps` - Skills to develop (array)

### 📋 Optional Fields (Nice to Have)
- [ ] `learning_styles` - Learning preferences
- [ ] `work_preferences` - Work environment preferences
- [ ] `aptitude_scores` - Aptitude breakdown (for high school)

## Expected Output

When you run the diagnostic, you should see:

### ✅ Good Result (PDF Ready)
```
📋 FINAL SUMMARY
================================================================================

   Result ID: abc-123-def
   Student ID: student-456
   Grade Level: middle
   Data Source: individual_columns
   Validation: ✅ Valid
   Completeness: 85%
   PDF Ready: ✅ Yes

   ✅ PDF GENERATION READY:
      The assessment result has sufficient data for PDF generation.
```

### ❌ Problem Result (Missing Data)
```
📋 FINAL SUMMARY
================================================================================

   Result ID: abc-123-def
   Student ID: student-456
   Grade Level: middle
   Data Source: unknown
   Validation: ❌ Invalid
   Completeness: 45%
   PDF Ready: ❌ No

   ⚠️  ACTION REQUIRED:
      The PDF may not display correctly due to missing data.
      Please check the errors and warnings above.

   ❌ ERRORS:
      - Missing RIASEC scores
      - Missing career recommendations
```

## Quick Troubleshooting

### Problem: "No results found for 6th grade students"

**Check:**
1. Are there any completed assessments?
   ```sql
   SELECT COUNT(*) FROM personal_assessment_attempts 
   WHERE grade_level = 'middle' AND status = 'completed';
   ```

2. Are results being created?
   ```sql
   SELECT COUNT(*) FROM personal_assessment_results 
   WHERE grade_level = 'middle';
   ```

3. Is the trigger working?
   ```sql
   -- Check if trigger exists
   SELECT * FROM pg_trigger WHERE tgname LIKE '%assessment%';
   ```

### Problem: "Data shows in database but not in PDF"

**Check:**
1. Run the JavaScript diagnostic to see transformation
2. Check browser console for errors
3. Verify `useAssessmentResults` hook is using transformer
4. Check if RLS policies are blocking data

### Problem: "PDF shows zeros or 'Unknown Name'"

**Check:**
1. Verify student data exists:
   ```sql
   SELECT s.*, pr.* 
   FROM students s
   INNER JOIN personal_assessment_results pr ON pr.student_id = s.id
   WHERE s.grade = '6'
   LIMIT 1;
   ```

2. Check if student_id matches:
   ```sql
   SELECT 
       pr.student_id as result_student_id,
       pa.student_id as attempt_student_id,
       s.id as actual_student_id
   FROM personal_assessment_results pr
   LEFT JOIN personal_assessment_attempts pa ON pa.id = pr.attempt_id
   LEFT JOIN students s ON s.id = pr.student_id
   WHERE pr.grade_level = 'middle'
   LIMIT 5;
   ```

## Next Steps

1. **Run SQL Diagnostic**
   ```bash
   # Copy the SQL script to Supabase SQL Editor and run it
   ```

2. **Run JavaScript Diagnostic**
   ```bash
   node diagnose-6th-class-pdf-data.js
   ```

3. **Review Results**
   - Check completeness percentage
   - Review any errors or warnings
   - Verify data is in expected format

4. **Fix Issues** (if any)
   - If data is missing: Check result generation logic
   - If data is in wrong format: Transformer should handle it
   - If validation fails: Check specific error messages

5. **Test PDF Generation**
   - Navigate to assessment result page
   - Click "Download PDF" or "Print"
   - Verify all sections display correctly

## Related Files

- **Transformer Service:** `src/services/assessmentResultTransformer.js`
- **Hook:** `src/features/assessment/assessment-result/hooks/useAssessmentResults.js`
- **PDF Component:** `src/features/assessment/assessment-result/components/PrintViewMiddleHighSchool.jsx`
- **Database Schema:** `database/personal_assessment_schema_complete.sql`
- **Data Mapping Doc:** `ASSESSMENT_PDF_DATA_MAPPING.md`
- **Implementation Guide:** `ASSESSMENT_PDF_FIX_IMPLEMENTATION_GUIDE.md`

## Support

If you encounter issues:

1. Check the diagnostic output for specific errors
2. Review `ASSESSMENT_PDF_DATA_MAPPING.md` for data structure details
3. Check browser console for JavaScript errors
4. Review Supabase logs for database errors
5. Verify RLS policies are not blocking data access

---

**Created:** January 28, 2026
**Purpose:** Diagnose 6th class student PDF data issues
**Status:** Ready to use
