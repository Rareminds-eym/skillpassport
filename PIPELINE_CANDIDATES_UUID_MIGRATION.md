# Pipeline Candidates UUID Migration Guide

## Problem
The `pipeline_candidates` table still uses `integer` for `opportunity_id`, but the `opportunities` table has been migrated to UUID. This causes errors:
```
invalid input syntax for type integer: "9bc0fdff-789c-4d0a-a808-494ae9706d34"
```

## Solution: Migrate pipeline_candidates to UUID

### Step 1: Check Current State
```sql
-- Run this first to understand current state
\i check-pipeline-dependencies.sql
```

### Step 2: Migrate the Table
```sql
-- This will convert opportunity_id from integer to UUID
\i migrate-pipeline-candidates-to-uuid.sql
```

This migration:
1. ✅ Adds new UUID column `opportunity_id_new`
2. ✅ Populates it by matching with `opportunities.id_old`
3. ✅ Renames old column to `opportunity_id_old` (backup)
4. ✅ Renames new column to `opportunity_id`
5. ✅ Updates foreign key constraint
6. ✅ Recreates unique constraint
7. ✅ Creates performance index

### Step 3: Update the View
```sql
-- Fix the pipeline_candidates_detailed view
\i fix-pipeline-candidates-view-uuid.sql
```

This updates the view to:
- Use `opportunities` table instead of `requisitions`
- Join on UUID `opportunity_id`
- Use correct student column names

### Step 4: Verify Migration
```sql
-- Check that everything worked
SELECT 
  'pipeline_candidates' as table_name,
  COUNT(*) as total,
  COUNT(opportunity_id) as with_uuid,
  data_type
FROM pipeline_candidates pc
CROSS JOIN (
  SELECT data_type 
  FROM information_schema.columns 
  WHERE table_name = 'pipeline_candidates' 
    AND column_name = 'opportunity_id'
) dt
GROUP BY data_type;

-- Test the view
SELECT * FROM pipeline_candidates_detailed LIMIT 5;

-- Test inserting with UUID
INSERT INTO pipeline_candidates (
  opportunity_id,
  student_id,
  candidate_name,
  stage,
  status
) VALUES (
  '9bc0fdff-789c-4d0a-a808-494ae9706d34'::uuid,
  'test-student-id',
  'Test Candidate',
  'sourced',
  'active'
);
```

### Step 5: Update Related Tables (if needed)

Check if `pipeline_activities` also needs migration:
```sql
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'pipeline_activities'
  AND column_name LIKE '%opportunity%';
```

## Rollback Plan (if needed)

If something goes wrong:
```sql
-- Restore old column
ALTER TABLE pipeline_candidates 
DROP COLUMN opportunity_id;

ALTER TABLE pipeline_candidates 
RENAME COLUMN opportunity_id_old TO opportunity_id;

-- Restore old constraint
ALTER TABLE pipeline_candidates 
ADD CONSTRAINT pipeline_candidates_opportunity_id_fkey 
FOREIGN KEY (opportunity_id) 
REFERENCES opportunities(id_old);
```

## Expected Results

After migration:
- ✅ `pipeline_candidates.opportunity_id` is UUID type
- ✅ Foreign key points to `opportunities.id` (UUID)
- ✅ View `pipeline_candidates_detailed` works with UUIDs
- ✅ Frontend can pass UUID strings without errors
- ✅ No more "invalid input syntax for type integer" errors

## Testing Checklist

1. [ ] Run check-pipeline-dependencies.sql
2. [ ] Run migrate-pipeline-candidates-to-uuid.sql
3. [ ] Verify no unmatched records
4. [ ] Run fix-pipeline-candidates-view-uuid.sql
5. [ ] Test view query
6. [ ] Test adding candidate with UUID
7. [ ] Test moving candidate between stages
8. [ ] Test frontend pipeline page loads
9. [ ] Test applicants list loads

## Files Created
- `check-pipeline-dependencies.sql` - Check current state
- `migrate-pipeline-candidates-to-uuid.sql` - Main migration
- `fix-pipeline-candidates-view-uuid.sql` - Update view
- `PIPELINE_CANDIDATES_UUID_MIGRATION.md` - This guide
