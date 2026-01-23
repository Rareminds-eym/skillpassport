# Quick Fix: Move to Stage Not Working

## What I Did
✅ Added detailed console logging to track the issue
✅ Fixed field name bug (`applicant.status` → `applicant.application_status`)
✅ Created debug tools to check database state

## Test Now

1. **Open browser console** (F12)
2. **Go to**: http://localhost:3000/recruitment/requisition/applicants
3. **Click the purple arrow (►)** next to any applicant
4. **Select a stage** from the dropdown
5. **Check console** for detailed logs

## What to Look For

### ✅ Success
- Console shows: `[Pipeline Service] Update result: { data: {...}, error: null }`
- Alert: "Successfully moved [Name] to [stage] stage"
- Candidate moves to new stage

### ❌ Error
- Console shows: `[Pipeline Service] Error details: {...}`
- Check the error message in console
- Share the console logs with me

## Common Issues

| Issue | Console Shows | Fix |
|-------|---------------|-----|
| Not in pipeline | `pipeline_candidate_id: null` | System auto-adds them |
| UUID mismatch | Type error about UUID | Run `debug-move-to-stage-issue.sql` |
| Permission denied | Error code `42501` | Check RLS policies |
| Missing data | `currentData: null` | Candidate doesn't exist |

## Files Changed
- `src/services/pipelineService.ts` - Added logging
- `src/pages/recruiter/ApplicantsList.tsx` - Added logging + fixed bug

## Need Help?
Share these with me:
1. Console logs (all `[ApplicantsList]` and `[Pipeline Service]` lines)
2. Results from `debug-move-to-stage-issue.sql`
3. Any error messages or alerts
