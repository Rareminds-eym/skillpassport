# 🚨 URGENT: Pipeline Candidates Table Needs UUID Migration

## Current Error
```
Error fetching pipeline candidates: 
invalid input syntax for type integer: "9bc0fdff-789c-4d0a-a808-494ae9706d34"
```

## Root Cause
The `pipeline_candidates` table still uses `integer` for `opportunity_id`, but:
- ✅ `opportunities` table was migrated to UUID
- ✅ Frontend is now passing UUID strings
- ❌ `pipeline_candidates` expects integers

## Impact
**Broken Features**:
- ❌ Cannot view pipeline candidates
- ❌ Cannot add candidates to pipeline (409 duplicate errors)
- ❌ Cannot move candidates between stages
- ❌ Applicants list page fails to load

## Solution: Run Database Migration

### Quick Fix (3 steps)

1. **Check current state**:
```sql
\i check-pipeline-dependencies.sql
```

2. **Migrate the table**:
```sql
\i migrate-pipeline-candidates-to-uuid.sql
```

3. **Update the view**:
```sql
\i fix-pipeline-candidates-view-uuid.sql
```

### What the Migration Does
- Converts `opportunity_id` from `integer` to `uuid`
- Preserves all existing data
- Updates foreign key constraints
- Fixes the `pipeline_candidates_detailed` view
- Creates backup column (`opportunity_id_old`)

### Verification
After migration, test:
```sql
-- Should return UUID type
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'pipeline_candidates'
  AND column_name = 'opportunity_id';

-- Should work without errors
SELECT * FROM pipeline_candidates_detailed LIMIT 5;
```

## Files to Run (in order)
1. `check-pipeline-dependencies.sql` - Understand current state
2. `migrate-pipeline-candidates-to-uuid.sql` - Main migration
3. `fix-pipeline-candidates-view-uuid.sql` - Fix view

## Documentation
- Full guide: `PIPELINE_CANDIDATES_UUID_MIGRATION.md`
- Overall UUID migration: `UUID_MIGRATION_GUIDE.md`
- Service fixes: `PIPELINE_UUID_TYPE_FIX.md`

## Timeline
- **Priority**: HIGH 🔴
- **Estimated time**: 5 minutes
- **Risk**: Low (has rollback plan)
- **Downtime**: None (migration is non-blocking)

## After Migration
Once complete:
- ✅ Pipeline page will load
- ✅ Can add candidates
- ✅ Can move candidates between stages
- ✅ Applicants list will work
- ✅ No more integer/UUID type errors
