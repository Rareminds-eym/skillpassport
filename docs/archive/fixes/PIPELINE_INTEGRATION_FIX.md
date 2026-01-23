# Student Application Pipeline Integration Fix

## Problem Summary
Students are applying to jobs through the application page, but:
1. The message says "Your application is under review. You'll be notified once it's added to the recruitment pipeline"
2. The system reports the data is already present, but
3. Students don't appear in the recruiter's pipeline dashboard
4. The application details don't show the pipeline status

## Root Cause
The issue occurs because:
1. The `opportunities` table and `requisitions` table are not linked (missing `requisition_id` column)
2. When students apply via `applied_jobs`, no corresponding `pipeline_candidates` record is created
3. The `StudentPipelineService` tries to match applications to pipeline by `requisition_id` but fails because the link doesn't exist
4. No database trigger exists to automatically add students to the pipeline when they apply

## Solution

### Step 1: Run the Complete Fix Script
Execute the SQL script in your Supabase SQL Editor:
```
database/fix_pipeline_integration_complete.sql
```

This script will:
1. ✅ Add `requisition_id` column to `opportunities` table
2. ✅ Create requisitions for all existing opportunities
3. ✅ Link each opportunity to its requisition
4. ✅ Create the `auto_add_applicant_to_pipeline()` function
5. ✅ Create the trigger that automatically adds applicants to pipeline
6. ✅ Sync all existing applications to the pipeline
7. ✅ Create a helpful view for checking status

### Step 2: Verify the Fix
After running the script, check the results at the bottom. You should see:
- All opportunities now have a `requisition_id`
- All applications are matched to pipeline candidates
- The trigger is active

### Step 3: Test with a New Application
1. Log in as a student
2. Apply to a job opportunity
3. Check that the application appears in:
   - Student's Applications page (should show pipeline stage)
   - Recruiter's Pipeline dashboard (should appear in "Sourced" stage)

## Diagnostic Queries

### Check if the trigger is working:
```sql
-- Run this in Supabase SQL Editor
SELECT * FROM student_applications_with_pipeline 
ORDER BY applied_at DESC 
LIMIT 10;
```

### Check trigger status:
```sql
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_add_to_pipeline';
```

### Check pipeline candidates from applications:
```sql
SELECT 
  pc.candidate_name,
  pc.stage,
  pc.source,
  r.title as job_title,
  pc.added_at
FROM pipeline_candidates pc
LEFT JOIN requisitions r ON pc.requisition_id = r.id
WHERE pc.source = 'direct_application'
ORDER BY pc.added_at DESC
LIMIT 20;
```

## How It Works Now

### Application Flow:
1. **Student applies to job** → `applied_jobs` table gets new record
2. **Trigger fires** → `trigger_auto_add_to_pipeline` executes
3. **Function runs** → `auto_add_applicant_to_pipeline()` checks:
   - Does the opportunity have a `requisition_id`? (Yes, because we linked them)
   - Is the student already in the pipeline for this requisition? (Check duplicates)
4. **Pipeline record created** → New record in `pipeline_candidates` with:
   - `stage: 'sourced'` (starting stage)
   - `source: 'direct_application'` (how they got there)
   - `status: 'active'` (they're active in the pipeline)

### Display Flow:
1. **Student views Applications page** → Calls `StudentPipelineService.getStudentApplicationsWithPipeline()`
2. **Service fetches data** → Joins `applied_jobs` ← `opportunities` ← `pipeline_candidates` by `requisition_id`
3. **UI displays** → Shows pipeline stage, interviews, next actions

### Recruiter View:
1. **Recruiter opens Pipeline** → Queries `pipeline_candidates` table
2. **Sees all applicants** → Including those who applied directly via the student portal
3. **Can move students through stages** → Sourced → Screening → Interview → Offer → Hired

## Files Modified
- `database/fix_pipeline_integration_complete.sql` - Complete fix script
- `database/check_pipeline_trigger_status.sql` - Diagnostic queries

## Files Involved (Reference)
- `src/services/appliedJobsService.js` - Handles job applications
- `src/services/studentPipelineService.js` - Fetches pipeline status for students
- `src/pages/student/Applications.jsx` - Student application view
- Recruiter pipeline pages (displays pipeline_candidates)

## Common Issues After Fix

### Issue: "Already applied" but not showing in pipeline
**Cause:** Opportunity doesn't have a requisition_id
**Fix:** Run the link script in Step 1 again

### Issue: Duplicate entries in pipeline
**Cause:** Trigger fired multiple times or manual additions
**Fix:** 
```sql
-- Remove duplicates, keep the earliest one
DELETE FROM pipeline_candidates pc1
WHERE EXISTS (
  SELECT 1 FROM pipeline_candidates pc2
  WHERE pc2.requisition_id = pc1.requisition_id
    AND pc2.student_id = pc1.student_id
    AND pc2.id < pc1.id
);
```

### Issue: Some old applications not showing
**Cause:** They were applied before the trigger was created
**Fix:** The sync script in Step 1 handles this automatically

## Testing Checklist
- [ ] Run the complete fix script
- [ ] Verify all opportunities have requisition_id
- [ ] Check that trigger exists and is active
- [ ] Test new application as student
- [ ] Check application appears in recruiter pipeline
- [ ] Verify student can see pipeline status in their applications
- [ ] Check application details show pipeline information

## Support
If issues persist:
1. Run the diagnostic script: `database/check_pipeline_trigger_status.sql`
2. Check the Supabase logs for trigger errors
3. Verify RLS policies allow proper access to pipeline_candidates table
