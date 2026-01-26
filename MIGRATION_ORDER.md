# Migration Order for All Tables

## Current Status
✅ `opportunities` - Already migrated to UUID
⏳ `pipeline_candidates` - Needs migration (has opportunity_id foreign key)
⏳ `applied_jobs` - Needs migration (has opportunity_id foreign key)

## Migration Order

Since `opportunities` is already UUID, run these in order:

### 1. Migrate pipeline_candidates
**File**: `migrate-pipeline-only-if-opp-is-uuid.sql`

This migrates:
- `pipeline_candidates.id` (serial → UUID)
- `pipeline_candidates.opportunity_id` (integer → UUID)

**Run this first!**

### 2. Migrate applied_jobs
**File**: `migrate-applied-jobs-to-uuid.sql`

This migrates:
- `applied_jobs.id` (serial → UUID)
- `applied_jobs.opportunity_id` (integer → UUID)

**Run this second!**

## Why This Order?

Both `pipeline_candidates` and `applied_jobs` reference `opportunities.id`, but they don't reference each other, so they can be migrated independently after opportunities is done.

## Quick Commands

```sql
-- Step 1: Migrate pipeline_candidates
\i migrate-pipeline-only-if-opp-is-uuid.sql

-- Step 2: Migrate applied_jobs
\i migrate-applied-jobs-to-uuid.sql
```

Or copy-paste each file's contents into Supabase SQL Editor.

## After Migration

All three tables will have:
- UUID primary keys
- UUID foreign keys to opportunities
- Old columns kept for reference (`id_old`, `opportunity_id_old`)
- Backup tables created

## Testing Checklist

After both migrations:

- [ ] Import new requisitions
- [ ] View requisitions
- [ ] Apply to jobs (tests applied_jobs)
- [ ] View applications
- [ ] Add candidates to pipeline (tests pipeline_candidates)
- [ ] Move candidates through stages
- [ ] Check all foreign key relationships work
- [ ] Verify counts match backups

## Cleanup (After 1-2 weeks)

```sql
-- Drop old columns
ALTER TABLE opportunities DROP COLUMN id_old;
ALTER TABLE pipeline_candidates DROP COLUMN id_old, opportunity_id_old;
ALTER TABLE applied_jobs DROP COLUMN id_old, opportunity_id_old;

-- Drop backup tables
DROP TABLE opportunities_backup_migration;
DROP TABLE pipeline_candidates_backup_migration;
DROP TABLE applied_jobs_backup_migration;
```

## Rollback

If something goes wrong with either migration:

```sql
-- Rollback pipeline_candidates
DROP TABLE pipeline_candidates;
ALTER TABLE pipeline_candidates_backup_migration RENAME TO pipeline_candidates;

-- Rollback applied_jobs
DROP TABLE applied_jobs;
ALTER TABLE applied_jobs_backup_migration RENAME TO applied_jobs;

-- Then recreate constraints (see original schema)
```

## Summary

1. ✅ opportunities - Already done
2. ⏳ Run `migrate-pipeline-only-if-opp-is-uuid.sql`
3. ⏳ Run `migrate-applied-jobs-to-uuid.sql`
4. ✅ Test everything
5. ⏳ Keep old columns for 1-2 weeks
6. ⏳ Cleanup after verification

---

**Your import feature will work perfectly after these migrations!** 🚀
