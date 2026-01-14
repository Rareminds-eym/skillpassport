# ✅ Approval to Tables - Quick Summary

## What Changed?

**Before:** When university admin approved curriculum changes, data stayed in JSONB columns only.

**After:** When university admin approves, data is automatically applied to normalized tables:
- `college_curriculum_units` - for units/modules
- `college_curriculum_outcomes` - for learning outcomes

---

## 🚀 Quick Start

### 1. Deploy (Run Once)
```bash
psql -U your_user -d your_database -f apply-approved-changes-to-tables.sql
```

### 2. Test
```bash
psql -U your_user -d your_database -f test-approval-to-tables-workflow.sql
```

### 3. Verify
```sql
-- Check if data appears in tables after approval
SELECT * FROM college_curriculum_units WHERE curriculum_id = 'your-id';
SELECT * FROM college_curriculum_outcomes WHERE curriculum_id = 'your-id';
```

---

## 📊 Data Flow

```
1. College Admin Edits
   ↓
   Stored in: college_curriculums.pending_changes (JSONB)

2. University Admin Approves
   ↓
   Moved to: college_curriculums.change_history (JSONB)
   ✨ NEW: Applied to: college_curriculum_units & college_curriculum_outcomes

3. Data Now Available In
   ✓ JSONB (for audit trail)
   ✓ Normalized Tables (for queries, joins, reports)
```

---

## 🎯 Key Functions

| Function | What It Does |
|----------|--------------|
| `add_pending_change()` | College admin adds change request |
| `approve_pending_change()` | University admin approves + **applies to tables** |
| `apply_change_to_tables()` | Helper that inserts/updates/deletes in tables |
| `migrate_curriculum_jsonb_to_tables()` | One-time migration of existing JSONB data |

---

## 📋 Supported Operations

| Change Type | SQL Action | Table |
|-------------|------------|-------|
| `unit_add` | INSERT | college_curriculum_units |
| `unit_edit` | UPDATE | college_curriculum_units |
| `unit_delete` | DELETE | college_curriculum_units |
| `outcome_add` | INSERT | college_curriculum_outcomes |
| `outcome_edit` | UPDATE | college_curriculum_outcomes |
| `outcome_delete` | DELETE | college_curriculum_outcomes |

---

## 🔍 How to Verify It's Working

### After University Admin Approves:

1. **Check change history has applied flag:**
```sql
SELECT 
  change_obj->>'change_type',
  change_obj->>'applied_to_tables',
  change_obj->>'status'
FROM college_curriculums,
     jsonb_array_elements(change_history) as change_obj
WHERE id = 'curriculum-id'
ORDER BY (change_obj->>'review_date')::timestamp DESC
LIMIT 1;
```

Expected: `applied_to_tables = true`

2. **Check data in tables:**
```sql
-- For unit changes
SELECT * FROM college_curriculum_units 
WHERE curriculum_id = 'curriculum-id'
ORDER BY updated_at DESC;

-- For outcome changes
SELECT * FROM college_curriculum_outcomes 
WHERE curriculum_id = 'curriculum-id'
ORDER BY updated_at DESC;
```

Expected: New/updated/deleted records

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `apply-approved-changes-to-tables.sql` | Main implementation (run this) |
| `deploy-approval-to-tables.sql` | Deployment script with verification |
| `test-approval-to-tables-workflow.sql` | Test script |
| `APPROVAL_TO_TABLES_IMPLEMENTATION_GUIDE.md` | Detailed guide |
| `CURRICULUM_APPROVAL_DATA_FLOW.md` | Updated with table info |

---

## ⚡ Quick Test

```sql
-- 1. Add a test change (as college admin)
SELECT add_pending_change(
  (SELECT id FROM college_curriculums WHERE status = 'published' LIMIT 1),
  'unit_add',
  gen_random_uuid(),
  '{"name": "Test Unit", "code": "TEST-01", "description": "Test", "order": 99, "credits": 3.0}'::jsonb,
  'Testing'
);

-- 2. Get the change ID
SELECT change_id FROM get_pending_changes(
  (SELECT id FROM college_curriculums WHERE has_pending_changes = TRUE LIMIT 1)
) LIMIT 1;

-- 3. Approve it (as university admin)
SELECT approve_pending_change(
  (SELECT id FROM college_curriculums WHERE has_pending_changes = TRUE LIMIT 1),
  'change-id-from-step-2',
  'Approved'
);

-- 4. Verify in table
SELECT * FROM college_curriculum_units 
WHERE name = 'Test Unit';
```

---

## 🎉 Benefits

✅ **Normalized Data** - Easy to query and join  
✅ **Referential Integrity** - Foreign keys ensure data consistency  
✅ **Performance** - Indexes for fast queries  
✅ **Audit Trail** - JSONB still tracks all changes  
✅ **Automatic** - No manual data entry needed  

---

## 📞 Need Help?

- See `APPROVAL_TO_TABLES_IMPLEMENTATION_GUIDE.md` for detailed documentation
- See `CURRICULUM_APPROVAL_DATA_FLOW.md` for complete data flow
- Check database logs for errors during approval

---

**Status:** ✅ Ready to Deploy  
**Last Updated:** January 14, 2026
