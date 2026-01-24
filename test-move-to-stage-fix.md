# Testing Move to Stage Fix

## What I Fixed

I've added comprehensive console logging to help debug the "Move to Stage" issue in the recruiter pipeline.

## Changes Made

1. **Added logging to `pipelineService.ts`** - The `moveCandidateToStage` function now logs:
   - Input parameters (candidateId, newStage, performedBy)
   - Database fetch results
   - Update operation results
   - Detailed error information

2. **Added logging to `ApplicantsList.tsx`** - The `handleMoveToPipelineStage` function now logs:
   - Applicant details being processed
   - Pipeline candidate ID
   - Move operation results
   - Error details

## How to Test

1. **Open your browser's Developer Console** (F12 or Right-click → Inspect → Console tab)

2. **Navigate to the Applicants List page**:
   ```
   http://localhost:3000/recruitment/requisition/applicants
   ```

3. **Try to move a candidate to a different stage**:
   - Click the purple arrow button (►) next to any applicant
   - Select a stage from the dropdown menu

4. **Check the console logs** - You should see detailed logs like:
   ```
   [ApplicantsList] handleMoveToPipelineStage called: {...}
   [Pipeline Service] moveCandidateToStage called: {...}
   [Pipeline Service] Fetch current data result: {...}
   [Pipeline Service] Updating candidate stage: {...}
   [Pipeline Service] Update result: {...}
   ```

## Common Issues to Look For

### Issue 1: UUID Type Mismatch
**Symptom**: Error message about UUID format or type casting
**Solution**: The pipeline_candidates table might have been migrated to UUID. Check with:
```sql
-- Run this in your database
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'pipeline_candidates'
  AND column_name IN ('id', 'opportunity_id');
```

### Issue 2: Missing Pipeline Candidate ID
**Symptom**: Console shows `pipeline_candidate_id: null` or `undefined`
**Solution**: The applicant hasn't been added to the pipeline yet. The code should automatically add them, but check if there's an error during the add operation.

### Issue 3: RLS (Row Level Security) Policy
**Symptom**: Error code `42501` or "permission denied"
**Solution**: Check RLS policies on pipeline_candidates table:
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'pipeline_candidates';
```

### Issue 4: Foreign Key Constraint
**Symptom**: Error about foreign key violation
**Solution**: The opportunity_id or student_id might not exist in their respective tables.

## Debug SQL Script

Run the `debug-move-to-stage-issue.sql` file I created to check your database state:

```bash
# If using Supabase CLI
supabase db execute -f debug-move-to-stage-issue.sql

# Or copy and paste the contents into your SQL editor
```

## Next Steps

1. **Test the move to stage functionality** with the console open
2. **Copy the console logs** and share them if the issue persists
3. **Run the debug SQL script** to check database structure
4. **Check for any error messages** in the console

## What to Share if Issue Persists

Please provide:
1. Console logs from the browser (all lines starting with `[ApplicantsList]` or `[Pipeline Service]`)
2. Results from the `debug-move-to-stage-issue.sql` script
3. Any error messages or alerts that appear
4. The specific stage you're trying to move to

This will help identify the exact issue!
