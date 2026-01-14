# Approval to Tables Implementation Guide

## 🎯 Overview

This guide explains how approved curriculum changes are automatically applied to normalized database tables (`college_curriculum_units` and `college_curriculum_outcomes`) when a university admin approves them.

---

## 📊 Architecture

### Before (JSONB Only)
```
College Admin Edits → Stored in pending_changes JSONB
University Admin Approves → Moved to change_history JSONB
❌ Data stays in JSONB, not in actual tables
```

### After (JSONB + Normalized Tables)
```
College Admin Edits → Stored in pending_changes JSONB
University Admin Approves → Moved to change_history JSONB
✅ Data APPLIED to college_curriculum_units and college_curriculum_outcomes tables
```

---

## 🗄️ Database Tables

### 1. college_curriculum_units
Stores curriculum units/modules:

```sql
CREATE TABLE college_curriculum_units (
  id UUID PRIMARY KEY,
  curriculum_id UUID REFERENCES college_curriculums(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  estimated_duration INTEGER,
  duration_unit VARCHAR(10), -- 'hours' or 'weeks'
  credits NUMERIC(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

### 2. college_curriculum_outcomes
Stores learning outcomes:

```sql
CREATE TABLE college_curriculum_outcomes (
  id UUID PRIMARY KEY,
  curriculum_id UUID REFERENCES college_curriculums(id),
  unit_id UUID REFERENCES college_curriculum_units(id),
  outcome_text TEXT NOT NULL,
  bloom_level VARCHAR(20),
  assessment_mappings JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

---

## 🔄 How It Works

### Step 1: College Admin Creates/Edits Curriculum

**Frontend:** `CollegeCurriculumBuilderUI.tsx`

```typescript
// College admin adds a unit
const newUnit = {
  id: 'unit-uuid-1',
  name: 'Advanced Algorithms',
  code: 'UNIT-01',
  description: 'Study of advanced algorithms',
  order: 1,
  estimatedDuration: 10,
  durationUnit: 'hours',
  credits: 3.0
};

// For published curriculum, this creates a pending change
await supabase.rpc('add_pending_change', {
  p_curriculum_id: curriculumId,
  p_change_type: 'unit_add',
  p_entity_id: newUnit.id,
  p_change_data: newUnit,
  p_message: 'Adding new unit on advanced algorithms'
});
```

**Database:** Stored in `pending_changes` JSONB column

```json
{
  "id": "change-uuid-1",
  "change_type": "unit_add",
  "entity_id": "unit-uuid-1",
  "timestamp": "2024-01-14T10:00:00Z",
  "requested_by": "college-admin-uuid",
  "requester_name": "John Doe",
  "request_message": "Adding new unit on advanced algorithms",
  "status": "pending",
  "data": {
    "name": "Advanced Algorithms",
    "code": "UNIT-01",
    "description": "Study of advanced algorithms",
    "order": 1,
    "estimatedDuration": 10,
    "durationUnit": "hours",
    "credits": 3.0
  }
}
```

### Step 2: University Admin Approves

**Frontend:** `SyllabusApproval.tsx`

```typescript
// University admin approves the change
await supabase.rpc('approve_pending_change', {
  p_curriculum_id: curriculumId,
  p_change_id: changeId,
  p_review_notes: 'Approved. Good addition.'
});
```

**Database Function:** `approve_pending_change()`

This function now does TWO things:

1. **Moves change from pending to history** (existing behavior)
2. **✨ NEW: Applies change to actual tables** (new behavior)

```sql
-- Inside approve_pending_change()

-- Extract change details
v_change_type := 'unit_add';
v_entity_id := 'unit-uuid-1';
v_change_data := { "name": "Advanced Algorithms", ... };

-- ✨ NEW: Apply to actual tables
PERFORM apply_change_to_tables(
  p_curriculum_id,
  v_change_type,
  v_entity_id,
  v_change_data,
  v_user_id
);
```

**Helper Function:** `apply_change_to_tables()`

```sql
-- For 'unit_add' change type:
INSERT INTO college_curriculum_units (
  id,
  curriculum_id,
  name,
  code,
  description,
  order_index,
  estimated_duration,
  duration_unit,
  credits,
  created_by,
  updated_by
) VALUES (
  'unit-uuid-1',
  'curriculum-uuid',
  'Advanced Algorithms',
  'UNIT-01',
  'Study of advanced algorithms',
  1,
  10,
  'hours',
  3.0,
  'university-admin-uuid',
  'university-admin-uuid'
);
```

### Step 3: Data Now in Tables

**Query:**
```sql
SELECT * FROM college_curriculum_units 
WHERE curriculum_id = 'curriculum-uuid';
```

**Result:**
```
| id          | curriculum_id | name                | code    | order_index | credits |
|-------------|---------------|---------------------|---------|-------------|---------|
| unit-uuid-1 | curriculum-id | Advanced Algorithms | UNIT-01 | 1           | 3.0     |
```

---

## 🎨 Supported Change Types

| Change Type | Action | Applied To |
|-------------|--------|------------|
| `unit_add` | INSERT new unit | `college_curriculum_units` |
| `unit_edit` | UPDATE existing unit | `college_curriculum_units` |
| `unit_delete` | DELETE unit | `college_curriculum_units` |
| `unit_reorder` | UPDATE order_index | `college_curriculum_units` |
| `outcome_add` | INSERT new outcome | `college_curriculum_outcomes` |
| `outcome_edit` | UPDATE existing outcome | `college_curriculum_outcomes` |
| `outcome_delete` | DELETE outcome | `college_curriculum_outcomes` |
| `bulk_add_units` | INSERT multiple units | `college_curriculum_units` |
| `bulk_add_outcomes` | INSERT multiple outcomes | `college_curriculum_outcomes` |

---

## 📦 Deployment Steps

### 1. Run Deployment Script

```bash
# Option A: Using psql
psql -U your_user -d your_database -f deploy-approval-to-tables.sql

# Option B: Using Supabase SQL Editor
# Copy and paste the contents of apply-approved-changes-to-tables.sql
```

### 2. Verify Deployment

```sql
-- Check if functions exist
SELECT proname FROM pg_proc 
WHERE proname IN ('apply_change_to_tables', 'approve_pending_change', 'migrate_curriculum_jsonb_to_tables');

-- Check if columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'college_curriculum_units' 
AND column_name IN ('created_by', 'updated_by');
```

### 3. Migrate Existing Data (Optional)

If you have existing curriculum data in JSONB format:

```sql
-- Migrate all existing JSONB data to tables
SELECT * FROM migrate_curriculum_jsonb_to_tables();

-- Expected output:
-- curriculum_id | units_migrated | outcomes_migrated | status
-- uuid-1        | 5              | 12                | success
-- uuid-2        | 3              | 8                 | success
```

---

## 🧪 Testing

### Test 1: Add Pending Change

```sql
-- As college admin
SELECT add_pending_change(
  'curriculum-uuid',
  'unit_add',
  gen_random_uuid(),
  jsonb_build_object(
    'name', 'Test Unit',
    'code', 'TEST-01',
    'description', 'Test description',
    'order', 1,
    'credits', 3.0
  ),
  'Testing approval workflow'
);
```

### Test 2: View Pending Changes

```sql
SELECT * FROM get_pending_changes('curriculum-uuid');
```

### Test 3: Approve Change

```sql
-- As university admin
SELECT approve_pending_change(
  'curriculum-uuid',
  'change-uuid',
  'Approved for testing'
);
```

### Test 4: Verify in Tables

```sql
-- Check if unit was added
SELECT * FROM college_curriculum_units 
WHERE curriculum_id = 'curriculum-uuid'
ORDER BY created_at DESC;

-- Check change history
SELECT 
  jsonb_array_length(change_history) as approved_changes,
  jsonb_array_length(pending_changes) as pending_changes
FROM college_curriculums 
WHERE id = 'curriculum-uuid';
```

---

## 🔍 Troubleshooting

### Issue 1: Change Not Applied to Tables

**Symptom:** Change is approved but not in `college_curriculum_units` or `college_curriculum_outcomes`

**Check:**
```sql
-- Check change history for applied_to_tables flag
SELECT 
  change_obj->>'change_type' as type,
  change_obj->>'applied_to_tables' as applied,
  change_obj->>'review_notes' as notes
FROM college_curriculums,
     jsonb_array_elements(change_history) as change_obj
WHERE id = 'curriculum-uuid'
ORDER BY (change_obj->>'review_date')::timestamp DESC;
```

**Solution:**
- Check database logs for errors
- Verify `apply_change_to_tables()` function exists
- Check if user has permissions on tables

### Issue 2: Foreign Key Constraint Error

**Symptom:** Error like "violates foreign key constraint"

**Cause:** Trying to add outcome before unit exists

**Solution:**
- Ensure units are approved before outcomes
- Check that `unit_id` in outcome change matches existing unit

### Issue 3: Duplicate Key Error

**Symptom:** Error like "duplicate key value violates unique constraint"

**Cause:** Trying to insert entity with ID that already exists

**Solution:**
- Check if entity already exists in table
- Use `ON CONFLICT DO NOTHING` or `DO UPDATE`

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `apply-approved-changes-to-tables.sql` | Main implementation |
| `deploy-approval-to-tables.sql` | Deployment script |
| `test-approval-to-tables-workflow.sql` | Test script |
| `CURRICULUM_APPROVAL_DATA_FLOW.md` | Complete data flow documentation |
| `curriculum-change-functions-FINAL.sql` | Pending changes functions |
| `curriculum_approval_workflow_complete_implementation.sql` | Approval workflow |

---

## 🎯 Benefits

### Before
- ❌ Data only in JSONB (hard to query)
- ❌ No referential integrity
- ❌ Difficult to join with other tables
- ❌ No indexes on unit/outcome data

### After
- ✅ Data in normalized tables (easy to query)
- ✅ Foreign key constraints ensure integrity
- ✅ Can join with other tables easily
- ✅ Indexes for fast queries
- ✅ Audit trail with created_by/updated_by
- ✅ Still have JSONB for change tracking

---

## 🚀 Next Steps

1. **Deploy to Production:**
   ```bash
   psql -U prod_user -d prod_db -f deploy-approval-to-tables.sql
   ```

2. **Update Frontend:**
   - Read units from `college_curriculum_units` table
   - Read outcomes from `college_curriculum_outcomes` table
   - Keep JSONB for pending changes display

3. **Monitor:**
   - Check that approved changes appear in tables
   - Monitor `applied_to_tables` flag in change_history
   - Watch for any errors in database logs

4. **Optimize:**
   - Add more indexes if needed
   - Consider materialized views for complex queries
   - Add caching layer if performance issues

---

**Last Updated:** January 14, 2026
