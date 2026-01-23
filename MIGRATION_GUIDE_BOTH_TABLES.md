# Migration Guide: Both Tables to UUID

## Overview

You need to migrate TWO tables because they're related:
- `opportunities` (parent table)
- `pipeline_candidates` (child table with foreign key to opportunities)

## Files Available

### Option 1: Combined Migration (Recommended) ⭐
**File**: `migrate-both-tables-to-uuid.sql`

Migrates both tables together in one transaction:
- ✅ Handles foreign key relationships automatically
- ✅ Single transaction (all or nothing)
- ✅ Creates backups for both tables
- ✅ Keeps old columns for reference
- ✅ Comprehensive verification

### Option 2: Individual Migrations
**Files**: 
- `migrate-opportunities-to-uuid-safe.sql`
- `migrate-pipeline-candidates-to-uuid.sql`

Run separately (more complex):
- ⚠️ Must run opportunities first
- ⚠️ Then update pipeline_candidates foreign key
- ⚠️ More steps, more risk

## Recommendation

**Use `migrate-both-tables-to-uuid.sql`** - it's safer and easier!

## What the Combined Migration Does

### 1. Opportunities Table
- Adds `id_new` (UUID) column
- Keeps `id_old` (integer) for reference
- Swaps columns
- Creates new primary key

### 2. Pipeline_Candidates Table
- Adds `id_new` (UUID) column
- Adds `opportunity_id_new` (UUID) column
- Maps old opportunity IDs to new UUIDs
- Keeps old columns for reference
- Updates foreign key to use UUID

### 3. Data Preservation
- ✅ All data preserved
- ✅ Backups created
- ✅ Old columns kept
- ✅ Can rollback

## Before Running

1. **Backup your database** (full backup)
2. **Test on staging** if you have one
3. **Plan downtime** (5-10 minutes)
4. **Notify team** about the migration

## How to Run

### Step 1: Open Supabase SQL Editor

### Step 2: Copy and paste `migrate-both-tables-to-uuid.sql`

### Step 3: Review the script

### Step 4: Run it!

### Step 5: Check the output
Look for:
```
✅ Opportunities backup created
✅ Pipeline_candidates backup created
✅ Columns swapped
✅ New constraints created
✅ Verification passed
✅ MIGRATION COMPLETE!
```

### Step 6: Test your application
- Import requisitions
- View requisitions
- Check pipeline candidates
- Test all CRUD operations

## After Migration

### Data Structure

**opportunities table:**
| id (uuid) | id_old (int) | title | ... |
|-----------|--------------|-------|-----|
| a1b2c3... | 1 | Developer | ... |
| d4e5f6... | 2 | Designer | ... |

**pipeline_candidates table:**
| id (uuid) | id_old (int) | opportunity_id (uuid) | opportunity_id_old (int) | ... |
|-----------|--------------|----------------------|-------------------------|-----|
| x1y2z3... | 1 | a1b2c3... | 1 | ... |
| w4v5u6... | 2 | d4e5f6... | 2 | ... |

### Cleanup (After 1-2 weeks)

Once you've verified everything works:

```sql
-- Drop old columns
ALTER TABLE opportunities DROP COLUMN id_old;
ALTER TABLE pipeline_candidates DROP COLUMN id_old;
ALTER TABLE pipeline_candidates DROP COLUMN opportunity_id_old;

-- Drop backup tables
DROP TABLE opportunities_backup_migration;
DROP TABLE pipeline_candidates_backup_migration;
```

## Rollback Plan

If something goes wrong:

```sql
ROLLBACK;  -- If still in transaction
```

Or restore from backup:

```sql
-- Restore opportunities
DROP TABLE opportunities;
ALTER TABLE opportunities_backup_migration RENAME TO opportunities;

-- Restore pipeline_candidates
DROP TABLE pipeline_candidates;
ALTER TABLE pipeline_candidates_backup_migration RENAME TO pipeline_candidates;

-- Recreate constraints (see original schema)
```

## Testing Checklist

After migration:

- [ ] Import new requisitions (should get UUID)
- [ ] View existing requisitions
- [ ] Edit requisitions
- [ ] Delete requisitions
- [ ] View pipeline candidates
- [ ] Add candidates to pipeline
- [ ] Move candidates between stages
- [ ] Check foreign key relationships
- [ ] Verify all counts match backups

## Common Issues

### Issue: Foreign key violation
**Cause**: Mapping didn't work correctly
**Solution**: Check opportunities_id_mapping table

### Issue: Row count mismatch
**Cause**: Data loss during migration
**Solution**: ROLLBACK and investigate

### Issue: Application errors
**Cause**: Code expects integer IDs
**Solution**: Your code already uses `string` for IDs ✅

## Impact on Import Feature

✅ **No changes needed!** Your import component already uses:
```typescript
interface Opportunity {
  id: string;  // Works with UUID!
}
```

The import will work perfectly with UUIDs.

## Summary

1. **Run**: `migrate-both-tables-to-uuid.sql`
2. **Verify**: Check output messages
3. **Test**: Try all features
4. **Wait**: Keep old columns for 1-2 weeks
5. **Cleanup**: Drop old columns after verification

---

**Your data is safe!** The migration preserves everything and creates backups. 🛡️
