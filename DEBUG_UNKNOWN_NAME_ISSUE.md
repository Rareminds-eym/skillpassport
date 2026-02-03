# Debug "Unknown" Name Issue

## Current Status
- ✅ Move to Stage is working
- ❌ Student names still showing as "Unknown" / "N/A"

## Root Cause Investigation

The issue is that there are TWO different data flows:

### Flow 1: Applied Jobs → Applicants List
```
applied_jobs.student_id → students.user_id (or students.id?)
↓
AppliedJobsService.getAllApplicants()
↓
ApplicantsList component
```

### Flow 2: Pipeline Candidates
```
pipeline_candidates.student_id → students.id
↓
pipelineService.getPipelineCandidatesByStage()
↓
Pipeline view
```

## Diagnostic Steps

### Step 1: Check Browser Console
1. Open browser console (F12)
2. Refresh the applicants page
3. Look for log: `[ApplicantsList] Fetched applicants data:`
4. Check the `sample` object - does it have `student` data?

### Step 2: Run SQL Diagnostic
Run this in Supabase SQL Editor: **`check-applied-jobs-student-id.sql`**

This will tell you:
- What `applied_jobs.student_id` actually contains
- Whether it matches `students.user_id` or `students.id`
- What the foreign key constraints are

### Step 3: Check Database Data
Run: **`check-student-data-now.sql`**

This will show:
- If students table has data
- If the joins are working
- If names are populated

## Expected Console Output

### If Working Correctly:
```javascript
{
  count: 1,
  sample: {
    id: "...",
    student_id: "...",
    student: {
      name: "John Doe",  // ✅ Should have actual name
      email: "john@example.com"
    }
  }
}
```

### If Broken:
```javascript
{
  count: 1,
  sample: {
    id: "...",
    student_id: "...",
    student: null  // ❌ No student data
  }
}
```

## Possible Issues

### Issue 1: applied_jobs.student_id references wrong column
**Symptom**: Console shows `student: null`
**Fix**: Update `appliedJobsService.js` to use correct column

### Issue 2: No data in students table
**Symptom**: SQL query returns empty results
**Fix**: Check if students table is populated

### Issue 3: Foreign key mismatch
**Symptom**: SQL shows no matching records
**Fix**: Update foreign key constraints

## Next Steps

1. **Check browser console** - Share the log output
2. **Run SQL diagnostics** - Share the results
3. **Based on results**, I'll provide the exact fix

## Files to Check
- `src/services/appliedJobsService.js` - Line ~410
- `src/pages/recruiter/ApplicantsList.tsx` - Line ~135
- Database: `applied_jobs` and `students` tables

---

**Please share:**
1. Browser console output for `[ApplicantsList] Fetched applicants data:`
2. Results from `check-applied-jobs-student-id.sql`
3. Results from `check-student-data-now.sql`
