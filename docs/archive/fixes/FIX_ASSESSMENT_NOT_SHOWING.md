# 🔧 Fix: Assessment Completed But Dashboard Shows "Start Assessment"

## 🐛 Problem

You completed the assessment and the result is in `personal_assessment_results` table, but the dashboard still shows "Start Assessment" button instead of "View Report".

## 🔍 Root Cause

The `useAssessmentRecommendations` hook checks for `status = 'completed'` in the database:

```javascript
// Line 51 in useAssessmentRecommendations.js
if (result.status === 'completed') {
  setHasCompletedAssessment(true);
}
```

Your assessment result likely has `status = NULL` or a different value.

---

## ✅ Quick Fix (SQL)

Run this in Supabase SQL Editor:

```sql
-- Step 1: Check current status
SELECT 
    id,
    student_id,
    stream_id,
    status,
    created_at
FROM personal_assessment_results
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY created_at DESC
LIMIT 1;

-- Step 2: Update status to 'completed'
UPDATE personal_assessment_results
SET 
    status = 'completed',
    updated_at = NOW()
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
  AND (status IS NULL OR status != 'completed');

-- Step 3: Verify the fix
SELECT 
    id,
    student_id,
    stream_id,
    status,
    created_at
FROM personal_assessment_results
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
ORDER BY created_at DESC
LIMIT 1;
```

After running this, **refresh your dashboard** and you should see "View Report" button! ✅

---

## 🔧 Permanent Fix (Code)

To prevent this issue in the future, we need to ensure the status is set when completing the assessment.

### **File: `src/services/assessmentService.js`**

Find the `completeAttempt` function and ensure it sets `status: 'completed'`:

```javascript
export const completeAttempt = async (attemptId, studentId, streamId, gradeLevel, geminiResults, sectionTimings) => {
  // ... existing code ...
  
  const resultData = {
    student_id: studentId,
    stream_id: streamId,
    grade_level: gradeLevel,
    status: 'completed', // ← Make sure this is set!
    // ... rest of the fields ...
  };
  
  const { data, error } = await supabase
    .from('personal_assessment_results')
    .insert(resultData)
    .select()
    .single();
    
  // ... rest of the code ...
};
```

---

## 📊 Database Schema Check

The `personal_assessment_results` table should have a `status` column:

```sql
-- Check if status column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'personal_assessment_results'
  AND column_name = 'status';

-- If it doesn't exist, add it
ALTER TABLE personal_assessment_results
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed';

-- Add check constraint
ALTER TABLE personal_assessment_results
ADD CONSTRAINT IF NOT EXISTS assessment_results_status_check
CHECK (status IN ('completed', 'in_progress', 'abandoned'));
```

---

## 🧪 Test the Fix

1. **Run the SQL update** (Step 2 above)
2. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
3. **Refresh dashboard**
4. **Expected result:**
   - ✅ "View Report" button appears
   - ✅ Assessment recommendations show
   - ✅ No more "Start Assessment" prompt

---

## 🎯 Why This Happened

During the restructuring, the assessment completion flow might not have been updated to set the `status` field properly. The old implementation probably had this, but it got lost during refactoring.

---

## 📝 Quick Checklist

- [ ] Run SQL to update status to 'completed'
- [ ] Refresh dashboard
- [ ] Verify "View Report" button appears
- [ ] Click "View Report" to see your results
- [ ] Check that recommendations show up

---

**Last Updated:** January 13, 2026
**Status:** Ready to Fix
