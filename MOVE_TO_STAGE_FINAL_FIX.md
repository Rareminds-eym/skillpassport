# Move to Stage - Final Fix

## Root Cause Identified ✅

The error logs show **two critical issues**:

### Issue 1: Missing `profile` Column
```
Error: column students.profile does not exist
```
**Fixed in**: `src/services/appliedJobsService.js`
- Removed the non-existent `profile` column from the SELECT query
- Updated the code to use only existing columns from the students table

### Issue 2: UUID Type Mismatch
```
Error: invalid input syntax for type integer: "0993cdbb-b300-4bb7-ac89-fe51a14426c8"
```
**Root Cause**: The `pipeline_candidates_detailed` view was expecting an integer `opportunity_id`, but the `opportunities` table has been migrated to use UUID.

## Fixes Applied

### 1. Fixed appliedJobsService.js ✅
- Removed `profile` column from students query
- Simplified the student data mapping to use only direct columns
- No more JSONB profile fallback (column doesn't exist)

### 2. Created SQL Fix Script ✅
**File**: `FIX_MOVE_TO_STAGE_COMPLETE.sql`

This script will:
- Drop the old `pipeline_candidates_detailed` view
- Recreate it with proper UUID support
- Verify the fix works with actual UUIDs
- Show sample data

## How to Apply the Fix

### Step 1: Run the SQL Script
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `FIX_MOVE_TO_STAGE_COMPLETE.sql`
4. Click "Run"

You should see output like:
```
✅ View created successfully with X records
✅ Testing view with UUID: 0993cdbb-b300-4bb7-ac89-fe51a14426c8
✅ View works with UUID!
✅ FIX COMPLETED SUCCESSFULLY!
```

### Step 2: Refresh Your Application
1. Go back to your browser
2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
3. Navigate to: http://localhost:3000/recruitment/requisition/applicants

### Step 3: Test Move to Stage
1. Open browser console (F12)
2. Click the purple arrow (►) next to any applicant
3. Select a stage from the dropdown
4. Check console for success logs

## Expected Results

### Before Fix ❌
```
Error fetching pipeline candidates: {
  code: '22P02',
  message: 'invalid input syntax for type integer: "0993cdbb-b300-4bb7-ac89-fe51a14426c8"'
}
```

### After Fix ✅
```
[ApplicantsList] handleMoveToPipelineStage called: {...}
[Pipeline Service] moveCandidateToStage called: {...}
[Pipeline Service] Update result: { data: {...}, error: null }
✅ Successfully moved [Name] to [stage] stage
```

## Files Modified

1. ✅ `src/services/appliedJobsService.js` - Removed profile column
2. ✅ `FIX_MOVE_TO_STAGE_COMPLETE.sql` - SQL fix script
3. ✅ `src/services/pipelineService.ts` - Added logging (already done)
4. ✅ `src/pages/recruiter/ApplicantsList.tsx` - Added logging (already done)

## Verification Checklist

After applying the fix:

- [ ] SQL script runs without errors
- [ ] View shows "✅ FIX COMPLETED SUCCESSFULLY!"
- [ ] Browser console shows no more UUID errors
- [ ] Applicants list loads successfully
- [ ] Pipeline overview shows correct counts
- [ ] Move to Stage button works
- [ ] Candidate successfully moves to new stage
- [ ] Success alert appears
- [ ] Page refreshes with updated data

## If Issues Persist

1. **Check the SQL output** - Make sure all steps completed successfully
2. **Verify column types** - Run this query:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name IN ('pipeline_candidates', 'opportunities')
     AND column_name IN ('id', 'opportunity_id');
   ```
3. **Check browser console** - Look for any remaining errors
4. **Share the logs** - Copy console output and SQL results

## Technical Details

### Why This Happened
Your database underwent a UUID migration where:
- `opportunities.id` changed from `integer` to `uuid`
- `pipeline_candidates.opportunity_id` changed to match
- But the `pipeline_candidates_detailed` VIEW wasn't updated
- The view was still trying to cast UUIDs as integers

### The Solution
The new view properly handles UUID types by:
- Using direct column references (no type casting)
- Letting PostgreSQL handle the UUID joins automatically
- Matching the actual column types in the tables

## Next Steps

1. **Run the SQL script** - This is the critical fix
2. **Test the functionality** - Try moving candidates
3. **Monitor console logs** - Ensure no errors appear
4. **Remove debug logging** - Once confirmed working (optional)

The fix is ready to deploy! 🚀
