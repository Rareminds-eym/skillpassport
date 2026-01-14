# ✅ Deployment Checklist - Approval to Tables

## Pre-Deployment

- [ ] **Backup Database**
  ```bash
  pg_dump -U your_user -d your_database > backup_$(date +%Y%m%d).sql
  ```

- [ ] **Verify Tables Exist**
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_name IN ('college_curriculum_units', 'college_curriculum_outcomes');
  ```
  Expected: Both tables should exist

- [ ] **Check Current Schema**
  ```sql
  \d college_curriculum_units
  \d college_curriculum_outcomes
  ```
  Verify columns match expected schema

- [ ] **Review Existing Data**
  ```sql
  SELECT COUNT(*) FROM college_curriculum_units;
  SELECT COUNT(*) FROM college_curriculum_outcomes;
  ```
  Note the counts for comparison after deployment

---

## Deployment Steps

### Step 1: Deploy Main Implementation
- [ ] **Run SQL Script**
  ```bash
  psql -U your_user -d your_database -f apply-approved-changes-to-tables.sql
  ```

- [ ] **Check for Errors**
  - Review output for any ERROR messages
  - All functions should be created successfully

### Step 2: Verify Functions Created
- [ ] **Check Functions Exist**
  ```sql
  SELECT proname, pronargs 
  FROM pg_proc 
  WHERE proname IN (
    'apply_change_to_tables',
    'approve_pending_change',
    'migrate_curriculum_jsonb_to_tables'
  );
  ```
  Expected: 3 functions found

### Step 3: Verify Columns Added
- [ ] **Check New Columns**
  ```sql
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'college_curriculum_units' 
  AND column_name IN ('created_by', 'updated_by');
  ```
  Expected: Both columns exist

### Step 4: Verify Triggers
- [ ] **Check Triggers Exist**
  ```sql
  SELECT trigger_name, event_manipulation 
  FROM information_schema.triggers 
  WHERE event_object_table IN (
    'college_curriculum_units', 
    'college_curriculum_outcomes'
  );
  ```
  Expected: updated_at triggers for both tables

---

## Post-Deployment Testing

### Test 1: Add Pending Change
- [ ] **Create Test Change**
  ```sql
  SELECT add_pending_change(
    (SELECT id FROM college_curriculums WHERE status = 'published' LIMIT 1),
    'unit_add',
    gen_random_uuid(),
    jsonb_build_object(
      'name', 'Test Unit - Deployment Check',
      'code', 'TEST-DEPLOY',
      'description', 'Testing deployment',
      'order', 999,
      'credits', 1.0
    ),
    'Deployment test'
  );
  ```

- [ ] **Verify Pending Change Created**
  ```sql
  SELECT 
    jsonb_array_length(pending_changes) as pending_count,
    has_pending_changes
  FROM college_curriculums 
  WHERE has_pending_changes = TRUE
  LIMIT 1;
  ```
  Expected: pending_count > 0, has_pending_changes = true

### Test 2: Approve Change (Manual)
- [ ] **Get Change ID**
  ```sql
  SELECT change_id, change_type, entity_id
  FROM get_pending_changes(
    (SELECT id FROM college_curriculums WHERE has_pending_changes = TRUE LIMIT 1)
  )
  WHERE change_type = 'unit_add'
  LIMIT 1;
  ```

- [ ] **Approve as University Admin**
  ```sql
  -- Run this as a user with university_admin role
  SELECT approve_pending_change(
    'curriculum-id-from-above',
    'change-id-from-above',
    'Deployment test approval'
  );
  ```

### Test 3: Verify Data in Tables
- [ ] **Check Unit Added**
  ```sql
  SELECT * FROM college_curriculum_units 
  WHERE name = 'Test Unit - Deployment Check';
  ```
  Expected: 1 row found

- [ ] **Check Change History**
  ```sql
  SELECT 
    change_obj->>'change_type' as type,
    change_obj->>'status' as status,
    change_obj->>'applied_to_tables' as applied
  FROM college_curriculums,
       jsonb_array_elements(change_history) as change_obj
  WHERE change_obj->>'change_type' = 'unit_add'
  ORDER BY (change_obj->>'review_date')::timestamp DESC
  LIMIT 1;
  ```
  Expected: status = 'approved', applied = 'true'

### Test 4: Test Other Change Types
- [ ] **Test Unit Edit**
  ```sql
  -- Add pending change for edit
  -- Approve
  -- Verify UPDATE in table
  ```

- [ ] **Test Outcome Add**
  ```sql
  -- Add pending change for outcome
  -- Approve
  -- Verify INSERT in college_curriculum_outcomes
  ```

- [ ] **Test Delete**
  ```sql
  -- Add pending change for delete
  -- Approve
  -- Verify DELETE from table
  ```

---

## Data Migration (Optional)

### If You Have Existing JSONB Data

- [ ] **Count Existing JSONB Data**
  ```sql
  SELECT 
    COUNT(*) as total_curriculums,
    SUM(jsonb_array_length(COALESCE(units, '[]'::jsonb))) as total_units,
    SUM(jsonb_array_length(COALESCE(outcomes, '[]'::jsonb))) as total_outcomes
  FROM college_curriculums;
  ```

- [ ] **Run Migration**
  ```sql
  SELECT * FROM migrate_curriculum_jsonb_to_tables();
  ```

- [ ] **Verify Migration Results**
  ```sql
  -- Check counts match
  SELECT COUNT(*) FROM college_curriculum_units;
  SELECT COUNT(*) FROM college_curriculum_outcomes;
  ```

- [ ] **Spot Check Data**
  ```sql
  -- Pick a random curriculum and verify data
  SELECT * FROM college_curriculum_units 
  WHERE curriculum_id = 'random-curriculum-id';
  ```

---

## Rollback Plan (If Needed)

### If Something Goes Wrong

- [ ] **Restore from Backup**
  ```bash
  psql -U your_user -d your_database < backup_YYYYMMDD.sql
  ```

- [ ] **Or Drop New Functions**
  ```sql
  DROP FUNCTION IF EXISTS apply_change_to_tables CASCADE;
  DROP FUNCTION IF EXISTS migrate_curriculum_jsonb_to_tables CASCADE;
  -- Note: This will revert approve_pending_change to old version
  ```

- [ ] **Remove Added Columns (Optional)**
  ```sql
  ALTER TABLE college_curriculum_units DROP COLUMN IF EXISTS created_by;
  ALTER TABLE college_curriculum_units DROP COLUMN IF EXISTS updated_by;
  ALTER TABLE college_curriculum_outcomes DROP COLUMN IF EXISTS created_by;
  ALTER TABLE college_curriculum_outcomes DROP COLUMN IF EXISTS updated_by;
  ```

---

## Production Checklist

### Before Going Live

- [ ] **Test in Staging Environment**
  - All tests pass
  - No errors in logs
  - Performance acceptable

- [ ] **Update Documentation**
  - [ ] Update API documentation
  - [ ] Update developer guide
  - [ ] Update user guide

- [ ] **Notify Team**
  - [ ] Inform developers of new tables
  - [ ] Inform QA of new test scenarios
  - [ ] Inform users of new features

- [ ] **Monitor After Deployment**
  - [ ] Check database logs for errors
  - [ ] Monitor query performance
  - [ ] Watch for foreign key violations
  - [ ] Check approval workflow works end-to-end

### Performance Monitoring

- [ ] **Check Query Performance**
  ```sql
  -- Enable query timing
  \timing on
  
  -- Test common queries
  SELECT * FROM college_curriculum_units WHERE curriculum_id = 'test-id';
  SELECT * FROM college_curriculum_outcomes WHERE unit_id = 'test-id';
  ```

- [ ] **Check Index Usage**
  ```sql
  SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
  FROM pg_stat_user_indexes
  WHERE tablename IN ('college_curriculum_units', 'college_curriculum_outcomes');
  ```

---

## Success Criteria

✅ **Deployment is successful if:**

1. All functions created without errors
2. All tests pass
3. Approved changes appear in tables
4. `applied_to_tables` flag is `true` in change_history
5. No foreign key violations
6. Query performance acceptable
7. No errors in database logs
8. End-to-end workflow works in UI

---

## Troubleshooting

### Common Issues

**Issue:** Function already exists error
```
Solution: Add OR REPLACE to function definitions
```

**Issue:** Column already exists error
```
Solution: Use IF NOT EXISTS in ALTER TABLE statements
```

**Issue:** Permission denied error
```
Solution: Grant permissions on tables and functions
GRANT SELECT, INSERT, UPDATE, DELETE ON college_curriculum_units TO authenticated;
GRANT EXECUTE ON FUNCTION apply_change_to_tables TO authenticated;
```

**Issue:** Foreign key violation
```
Solution: Ensure units are created before outcomes
Check that curriculum_id and unit_id exist
```

---

## Sign-Off

- [ ] **Deployment Completed By:** _________________ Date: _________
- [ ] **Testing Verified By:** _________________ Date: _________
- [ ] **Production Approved By:** _________________ Date: _________

---

## Files Reference

| File | Purpose |
|------|---------|
| `apply-approved-changes-to-tables.sql` | Main implementation |
| `deploy-approval-to-tables.sql` | Deployment script |
| `test-approval-to-tables-workflow.sql` | Test script |
| `APPROVAL_TO_TABLES_IMPLEMENTATION_GUIDE.md` | Detailed guide |
| `APPROVAL_TO_TABLES_SUMMARY.md` | Quick summary |
| `APPROVAL_TO_TABLES_VISUAL_FLOW.md` | Visual diagrams |
| `CURRICULUM_APPROVAL_DATA_FLOW.md` | Complete data flow |

---

**Last Updated:** January 14, 2026
