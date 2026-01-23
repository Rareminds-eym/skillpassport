# Migrating opportunities.id from Serial to UUID

## Why Change to UUID?

### Current (Serial/Integer)
- Sequential IDs: 1, 2, 3, 4...
- Predictable
- Smaller storage (4 bytes)
- Auto-incrementing

### UUID Benefits
- Globally unique
- Non-sequential (better security)
- Can generate client-side
- Better for distributed systems
- Standard size (16 bytes)

## Impact Analysis

### ✅ What Will Work
- Import functionality (already uses string IDs)
- All CRUD operations
- Supabase queries
- Frontend components (TypeScript uses `string` for IDs)

### ⚠️ What Needs Updates

1. **Database Foreign Keys**
   - Any table referencing `opportunities.id`
   - Need to migrate those too

2. **Application Code**
   - Already using `string` type ✅
   - Should work without changes

3. **API Endpoints**
   - Check if any hardcode integer parsing
   - Most should work with string IDs

4. **Existing Data**
   - Old integer IDs will be converted to UUIDs
   - Mapping table created for reference

## Migration Options

### Option 1: Safe Migration (Recommended)
**File**: `migrate-opportunities-to-uuid-safe.sql`

**Features**:
- ✅ Creates backup automatically
- ✅ Keeps old ID column temporarily
- ✅ Transaction-based (can rollback)
- ✅ Verification checks
- ✅ Detailed logging

**Steps**:
1. Backup database
2. Run the script
3. Test your application
4. Keep old column for a few days
5. Drop old column after verification

### Option 2: Manual Migration
**File**: `migrate-opportunities-id-to-uuid.sql`

**Features**:
- Step-by-step instructions
- More control
- Can pause between steps
- Good for learning

## Pre-Migration Checklist

- [ ] Backup entire database
- [ ] Test on staging environment first
- [ ] Check all tables that reference opportunities
- [ ] Review application code for integer assumptions
- [ ] Plan downtime window (if needed)
- [ ] Notify team members

## Migration Steps

### 1. Backup
```sql
CREATE TABLE opportunities_backup AS SELECT * FROM opportunities;
```

### 2. Run Migration
```sql
-- Run migrate-opportunities-to-uuid-safe.sql
```

### 3. Verify
```sql
-- Check data type
SELECT data_type 
FROM information_schema.columns
WHERE table_name = 'opportunities' AND column_name = 'id';
-- Should return: uuid

-- Check row count
SELECT COUNT(*) FROM opportunities;
SELECT COUNT(*) FROM opportunities_backup;
-- Should match
```

### 4. Test Application
- Test import functionality
- Test create/edit/delete
- Test viewing requisitions
- Test applications
- Test all features

### 5. Cleanup (After 1-2 weeks)
```sql
ALTER TABLE opportunities DROP COLUMN id_old;
DROP TABLE opportunities_backup_migration;
```

## Code Changes Needed

### Frontend (Minimal)
Your code already uses `string` for IDs, so it should work:

```typescript
interface Opportunity {
  id: string;  // ✅ Already correct!
  // ...
}
```

### Import Component
Already compatible:
```typescript
const { data, error } = await supabase
  .from('opportunities')
  .insert(requisitionData)  // ✅ Will get UUID automatically
  .select()
  .single();
```

### Queries
No changes needed:
```typescript
.eq('id', opportunityId)  // ✅ Works with UUID strings
```

## Rollback Plan

If something goes wrong:

```sql
-- Restore from backup
DROP TABLE opportunities;
ALTER TABLE opportunities_backup RENAME TO opportunities;

-- Recreate constraints and indexes
-- (see original schema)
```

## Testing Checklist

After migration:

- [ ] Import new requisitions (should get UUID)
- [ ] View existing requisitions
- [ ] Edit requisitions
- [ ] Delete requisitions
- [ ] Apply to requisitions
- [ ] View applications
- [ ] Search and filter
- [ ] Check all foreign key relationships

## Common Issues

### Issue: Foreign key violations
**Solution**: Update all referencing tables first

### Issue: Application expects integer
**Solution**: Update code to handle UUID strings

### Issue: Performance concerns
**Solution**: UUIDs are indexed, performance should be similar

## Performance Impact

- **Storage**: +12 bytes per row (16 bytes vs 4 bytes)
- **Index size**: Slightly larger
- **Query speed**: Negligible difference with proper indexes
- **Insert speed**: Slightly faster (no sequence lock)

## Recommendations

### For Production
1. ✅ Use `migrate-opportunities-to-uuid-safe.sql`
2. ✅ Test on staging first
3. ✅ Run during low-traffic period
4. ✅ Keep backup for 1-2 weeks
5. ✅ Monitor application after migration

### For Development
1. Can use either migration script
2. Test thoroughly
3. Verify import functionality
4. Check all CRUD operations

## Alternative: Keep Serial ID

If you don't want to migrate:

### Pros
- No migration needed
- Simpler
- Smaller storage

### Cons
- Sequential IDs (security concern)
- Not globally unique
- Harder to merge databases

## Decision Matrix

| Factor | Serial (Current) | UUID |
|--------|------------------|------|
| Storage | ✅ Smaller | ⚠️ Larger |
| Security | ⚠️ Predictable | ✅ Random |
| Uniqueness | ⚠️ Per-table | ✅ Global |
| Generation | ⚠️ Database-only | ✅ Client/Server |
| Migration | ✅ None needed | ⚠️ Required |
| Modern | ⚠️ Old style | ✅ Modern |

## Conclusion

**Recommendation**: Migrate to UUID if:
- You want better security
- You plan to scale/distribute
- You want modern best practices
- You're okay with one-time migration effort

**Keep Serial if**:
- You have many foreign key relationships
- Storage is critical concern
- You don't want migration risk
- Current system works fine

## Support Files

- `migrate-opportunities-to-uuid-safe.sql` - Automated safe migration
- `migrate-opportunities-id-to-uuid.sql` - Manual step-by-step
- `IMPORT_SUCCESS_SUMMARY.md` - Import feature docs

---

**Note**: The import feature works with both serial and UUID IDs!


## Related Table Migrations

### Pipeline Candidates Table
The `pipeline_candidates` table also needs migration since it references `opportunities.id`.

**Error if not migrated**:
```
invalid input syntax for type integer: "9bc0fdff-789c-4d0a-a808-494ae9706d34"
```

**Migration Guide**: See `PIPELINE_CANDIDATES_UUID_MIGRATION.md`

**Quick Steps**:
```sql
-- 1. Check current state
\i check-pipeline-dependencies.sql

-- 2. Migrate the table
\i migrate-pipeline-candidates-to-uuid.sql

-- 3. Update the view
\i fix-pipeline-candidates-view-uuid.sql
```

### Migration Order

**IMPORTANT**: Follow this exact order to avoid foreign key conflicts:

1. ✅ **opportunities** (id: serial → uuid) - DONE
2. ✅ **applied_jobs** (opportunity_id: integer → uuid) - DONE  
3. ✅ **saved_jobs** (opportunity_id: integer → uuid) - DONE
4. ⚠️ **pipeline_candidates** (opportunity_id: integer → uuid) - **NEEDS MIGRATION NOW**
5. ⚠️ **pipeline_activities** (check if needed)

### Current Status
- Opportunities table: ✅ Migrated to UUID
- Applied jobs: ✅ Migrated to UUID
- Saved jobs: ✅ Migrated to UUID  
- Pipeline candidates: ❌ Still using integer (**CAUSING ERRORS**)
- Pipeline activities: ❓ Needs checking
