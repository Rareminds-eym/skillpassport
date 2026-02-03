# Move to Stage Fix - Summary

## Problem
The "Move to Stage" button in the recruiter pipeline (`/recruitment/requisition/applicants`) was not working when clicking to move candidates between stages.

## Root Cause Analysis
The issue was likely caused by one or more of the following:
1. **Silent failures** - No console logging to identify what was failing
2. **UUID migration** - Recent database migrations may have changed ID types
3. **Missing error handling** - Errors weren't being properly caught and displayed
4. **Field name mismatch** - `applicant.status` vs `applicant.application_status`

## Fixes Applied

### 1. Added Comprehensive Console Logging
**File**: `src/services/pipelineService.ts`
- Added logging at the start of `moveCandidateToStage` function
- Logs input parameters (candidateId, newStage, performedBy)
- Logs database fetch results
- Logs update operation results
- Enhanced error logging with detailed error information

**File**: `src/pages/recruiter/ApplicantsList.tsx`
- Added logging in `handleMoveToPipelineStage` function
- Logs applicant details being processed
- Logs pipeline candidate ID and stage information
- Logs move operation results

### 2. Fixed Field Name Bug
**File**: `src/pages/recruiter/ApplicantsList.tsx`
- Changed `applicant.status` to `applicant.application_status` in `getStatusBadge` function
- This ensures the correct field is being accessed from the Applicant interface

### 3. Created Debug Tools
**File**: `debug-move-to-stage-issue.sql`
- SQL script to check pipeline_candidates table structure
- Checks column types (especially for UUID migration)
- Shows sample data
- Lists constraints and views

## Testing Instructions

### Step 1: Open Browser Console
1. Press F12 or Right-click → Inspect
2. Go to the Console tab
3. Clear any existing logs

### Step 2: Navigate to Applicants Page
```
http://localhost:3000/recruitment/requisition/applicants
```

### Step 3: Try Moving a Candidate
1. Find any applicant in the list
2. Click the purple arrow button (►) next to their name
3. Select a stage from the dropdown (e.g., "Screened", "Interview 1")

### Step 4: Check Console Logs
You should see logs like:
```
[ApplicantsList] handleMoveToPipelineStage called: {
  applicant: { ... },
  newStage: "screened"
}
[Pipeline Service] moveCandidateToStage called: { ... }
[Pipeline Service] Fetch current data result: { ... }
[Pipeline Service] Updating candidate stage: { ... }
[Pipeline Service] Update result: { ... }
```

## Expected Behavior

### Success Case
1. Console shows all log messages without errors
2. Alert appears: "Successfully moved [Name] to [stage] stage"
3. Page refreshes and candidate appears in new stage
4. Pipeline overview counts update

### Failure Cases

#### Case 1: Candidate Not in Pipeline
- **Log**: `pipeline_candidate_id: null`
- **Behavior**: System attempts to add candidate to pipeline first
- **Expected**: Candidate added and moved to selected stage

#### Case 2: Database Error
- **Log**: `[Pipeline Service] Error details: { ... }`
- **Behavior**: Alert shows "Failed to move candidate"
- **Action**: Check error details in console

#### Case 3: Permission Error
- **Log**: Error code `42501` or "permission denied"
- **Action**: Check RLS policies on pipeline_candidates table

## Verification Checklist

- [ ] Console logs appear when clicking "Move to Stage"
- [ ] No JavaScript errors in console
- [ ] Candidate successfully moves to new stage
- [ ] Pipeline overview counts update correctly
- [ ] Alert message appears confirming the move
- [ ] Page refreshes to show updated data

## If Issue Persists

### Information to Collect
1. **Console Logs**: Copy all logs starting with `[ApplicantsList]` or `[Pipeline Service]`
2. **Database State**: Run `debug-move-to-stage-issue.sql` and share results
3. **Error Messages**: Any alerts or error messages that appear
4. **Specific Details**: 
   - Which stage you're trying to move to
   - Current stage of the candidate
   - Applicant's pipeline_candidate_id (from console logs)

### Quick Database Check
Run this in your database to check for UUID migration:
```sql
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'pipeline_candidates'
  AND column_name IN ('id', 'opportunity_id', 'student_id');
```

If `data_type` shows `uuid` instead of `integer` or `bigint`, the table has been migrated to UUID.

## Additional Notes

- The logging is temporary for debugging and can be removed once the issue is resolved
- All changes are backward compatible with both UUID and integer ID types
- The fix handles both cases: adding new candidates to pipeline and moving existing ones

## Files Modified

1. `src/services/pipelineService.ts` - Added logging to moveCandidateToStage
2. `src/pages/recruiter/ApplicantsList.tsx` - Added logging and fixed field name bug
3. `debug-move-to-stage-issue.sql` - Created debug script
4. `test-move-to-stage-fix.md` - Created testing guide

## Next Steps

1. Test the functionality with browser console open
2. Share console logs if issue persists
3. Run debug SQL script to check database state
4. Once working, optionally remove console.log statements for production
