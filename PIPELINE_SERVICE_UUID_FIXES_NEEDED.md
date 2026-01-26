# Pipeline Service UUID Fixes Needed

## Issues Found

The `pipelineService.ts` file has multiple issues after UUID migration:

### 1. Type Definitions
All `opportunityId: number` should be `opportunityId: string`

**Lines to fix:**
- Line 47: `getOpportunityById(opportunityId: number)`
- Line 89: `getPipelineCandidates(opportunityId?: number)`
- Line 115: `getPipelineCandidatesByStage(opportunityId: number, stage: string)`
- Line 200: `getPipelineCandidatesWithFilters(opportunityId: number, ...)`
- Line 425: `getAllPipelineCandidatesByStage(opportunityId: number)`
- Line 451: `addCandidateToPipeline({ opportunity_id: number, ...})`
- Line 717: `getPipelineStatistics(opportunityId: number)`

### 2. Student ID Lookup Issue
Line 548: Looking up student with `user_id` but should use `id`

```typescript
// WRONG (line 548)
.eq('user_id', pipelineData.student_id)

// SHOULD BE
.eq('id', pipelineData.student_id)
```

### 3. Applied Jobs Sync Issue
Lines 577-580: Syncing with applied_jobs using wrong student_id

```typescript
// The student_id in pipelineData is already students.id
// So the sync should work, but needs verification
```

## Quick Fix

Run this find-and-replace in `pipelineService.ts`:

1. Replace `opportunityId: number` with `opportunityId: string`
2. Replace `opportunity_id: number` with `opportunity_id: string`
3. Replace `candidateId: number` with `candidateId: string`
4. Fix line 548: `.eq('user_id', pipelineData.student_id)` → `.eq('id', pipelineData.student_id)`

## Testing After Fix

1. Try moving a candidate to a different stage
2. Try adding a candidate to pipeline
3. Check if applied_jobs table syncs correctly
4. Verify all pipeline operations work

## Related Files

- `src/services/pipelineService.ts` - Main file to fix
- `src/pages/recruiter/Pipelines.tsx` - May need updates
- `src/pages/recruiter/ApplicantsList.tsx` - Already fixed ✅
