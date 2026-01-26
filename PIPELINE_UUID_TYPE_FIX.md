# Pipeline Service UUID Type Fix

## Problem
After migrating database tables to UUID, the pipeline service was causing errors:
1. **400/409 errors** - When moving candidates or adding to pipeline
2. **Duplicate key violations** - When trying to add candidates already in pipeline

The issue was that the frontend was passing `number` types for IDs, but the database now expects `string` (UUID) types.

## Solution Applied

### 1. Type Compatibility Updates
Updated all pipeline service functions to accept both `string | number` for backward compatibility:

1. **moveCandidateToStage** - Accepts `candidateId: string | number`
2. **addCandidateToPipeline** - Accepts `opportunity_id: string | number`
3. **updateNextAction** - Accepts `candidateId: string | number`
4. **rejectCandidate** - Accepts `candidateId: string | number`
5. **updateCandidateRating** - Accepts `candidateId: string | number`
6. **assignCandidate** - Accepts `candidateId: string | number`
7. **removeCandidateFromPipeline** - Accepts `candidateId: string | number`
8. **bulkMoveCandidates** - Accepts `candidateIds: (string | number)[]`
9. **bulkRejectCandidates** - Accepts `candidateIds: (string | number)[]`

### 2. Internal Conversion
All functions now convert IDs to strings internally:
```typescript
const candidateIdStr = String(candidateId);
const opportunityIdStr = String(pipelineData.opportunity_id);
```

### 3. Improved Duplicate Handling
Enhanced `addCandidateToPipeline` to:
- **Check first** - Query for existing candidate before attempting insert
- **Better error messages** - Return which stage the candidate is already in
- **Reactivate rejected** - If candidate was previously rejected, reactivate them instead of failing
- **Graceful fallback** - Still catches 23505 duplicate key errors as backup

```typescript
// Now returns helpful error:
{
  code: 'DUPLICATE_CANDIDATE',
  message: 'Candidate is already in this pipeline (screened stage)',
  details: { id, stage, status }
}
```

### 4. Type Safety Improvements
1. Fixed `logPipelineActivity` to accept `from_stage?: string | null`
2. Fixed `getAllPipelineCandidatesByStage` grouped type to `Record<string, any[]>`
3. Added null assertion operators for optional filter properties

## Files Modified
- `src/services/pipelineService.ts`

## Features Added
- ✅ Duplicate detection before insert (prevents 409 errors)
- ✅ Automatic reactivation of rejected candidates
- ✅ Clear error messages with stage information
- ✅ Backward compatible with number IDs
- ✅ Forward compatible with UUID strings

## Testing
Test the following operations:
1. ✅ Move candidate between stages in pipeline
2. ✅ Add candidate from talent pool to pipeline
3. ✅ Try adding same candidate twice (should show friendly error)
4. ✅ Reactivate a previously rejected candidate
5. ✅ Bulk move candidates
6. ✅ Reject candidates
7. ✅ Update next actions

## Status
✅ All TypeScript errors resolved
✅ Duplicate handling improved
✅ Better user experience with clear error messages
✅ Ready for production
