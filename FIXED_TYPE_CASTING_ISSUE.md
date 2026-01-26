# Type Casting Issue - FIXED ✅

## The Problem
Error when running migration:
```
operator does not exist: integer = uuid
WHERE o.id_old = pc.opportunity_id
```

This happened because:
- `opportunities.id_old` is UUID type (or text)
- `pipeline_candidates.opportunity_id` is integer type
- PostgreSQL can't directly compare these types

## The Solution
Use text casting to compare values regardless of their actual types:
```sql
WHERE o.id_old::text = pc.opportunity_id::text
```

This works because:
- ✅ Both values get converted to text first
- ✅ Text comparison works for any type
- ✅ Matches "123" with "123" regardless of original type

## Files Updated
All migration files now use the text casting approach:
- ✅ `migrate-pipeline-complete.sql` - Main migration (FIXED)
- ✅ `migrate-pipeline-candidates-to-uuid.sql` - Standalone (FIXED)
- ✅ `migrate-pipeline-simple-fix.sql` - Simple version (NEW)

## Which File to Run

### Option 1: Complete Migration (Recommended)
```sql
migrate-pipeline-complete.sql
```
- Does everything in one go
- Includes backup, migration, view update, verification
- Now uses text casting (FIXED)

### Option 2: Simple Fix
```sql
migrate-pipeline-simple-fix.sql
```
- Minimal version
- Same result, less verbose
- Good if you want to see exactly what's happening

### Option 3: Diagnostic First
If you want to understand your data first:
```sql
-- 1. Run diagnostic
diagnose-type-mismatch.sql

-- 2. Then run migration
migrate-pipeline-complete.sql
```

## What Changed
**Before (BROKEN)**:
```sql
WHERE o.id_old = pc.opportunity_id  -- ❌ Type mismatch
```

**After (FIXED)**:
```sql
WHERE o.id_old::text = pc.opportunity_id::text  -- ✅ Works!
```

## Ready to Run
The migration is now fixed and ready to run. Choose one of the files above and execute it in Supabase SQL Editor.

## Verification
After running, you should see:
```
✅ Backup created: X records
✅ All records matched successfully
✅ Migration complete!
```

No more type casting errors! 🎉
