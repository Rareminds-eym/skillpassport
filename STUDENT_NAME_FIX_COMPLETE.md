# Student Name Display Fix - Complete

## Problem
Student names were showing as "Unknown" in the pipeline because the code was joining on the wrong column.

## Root Cause
- `pipeline_candidates.student_id` references `students.id`
- But the code was joining on `students.user_id`
- This caused the join to fail, resulting in no student data

## Fixes Applied

### 1. SQL View Fix ✅
**File**: `fix-student-name-display.sql`

Changed the join in `pipeline_candidates_detailed` view:
```sql
-- BEFORE (Wrong)
LEFT JOIN students s ON pc.student_id = s.user_id

-- AFTER (Correct)
LEFT JOIN students s ON pc.student_id = s.id
```

### 2. TypeScript Service Fix ✅
**File**: `src/services/pipelineService.ts`

Fixed in TWO functions:

#### Function 1: `getPipelineCandidatesByStage`
```typescript
// BEFORE (Wrong)
.in('user_id', studentIds)
studentsMap.set(student.user_id, {...})

// AFTER (Correct)
.in('id', studentIds)
studentsMap.set(student.id, {...})
```

#### Function 2: `getPipelineCandidatesWithFilters`
```typescript
// BEFORE (Wrong)
.in('user_id', studentIds)
studentsMap.set(student.user_id, {...})

// AFTER (Correct)
.in('id', studentIds)
studentsMap.set(student.id, {...})
```

## How to Apply

### Step 1: Run SQL Fix
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste: **`fix-student-name-display.sql`**
3. Click **Run**
4. Look for: `✅ Student name display fixed!`

### Step 2: Refresh Browser
1. Hard refresh: **Ctrl+Shift+R** (or **Cmd+Shift+R**)
2. Go to applicants page
3. Student names should now display correctly

## Expected Result

### Before Fix ❌
```
Candidate: Unknown
Email: N/A
```

### After Fix ✅
```
Candidate: John Doe
Email: john.doe@example.com
```

## Verification

Check that the view returns student data:
```sql
SELECT 
  id,
  student_id,
  candidate_name,
  student_name,
  student_email
FROM pipeline_candidates_detailed
LIMIT 5;
```

You should see:
- `student_name` populated with actual names
- `student_email` populated with actual emails
- No more "Unknown" values

## Files Modified
1. ✅ `fix-student-name-display.sql` - SQL view fix
2. ✅ `src/services/pipelineService.ts` - Fixed both functions

## Summary
The issue was a simple join mismatch. The `pipeline_candidates.student_id` column stores `students.id`, not `students.user_id`. Both the SQL view and TypeScript service have been updated to use the correct column.

🎉 Student names should now display correctly!
