# 📊 Approval to Tables - Visual Flow Diagram

## Complete Data Flow with Table Application

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COLLEGE ADMIN ACTIONS                                │
└─────────────────────────────────────────────────────────────────────────────┘

    👤 College Admin Creates/Edits Curriculum
    │
    ├─ Adds Unit: "Advanced Algorithms"
    │  • Name: Advanced Algorithms
    │  • Code: UNIT-01
    │  • Credits: 3.0
    │
    ├─ Adds Outcome: "Implement sorting algorithms"
    │  • Unit: Advanced Algorithms
    │  • Bloom Level: Apply
    │  • Assessment: Lab Test (30%)
    │
    ↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE: pending_changes (JSONB)                         │
└─────────────────────────────────────────────────────────────────────────────┘

    college_curriculums.pending_changes = [
      {
        "id": "change-uuid-1",
        "change_type": "unit_add",
        "entity_id": "unit-uuid-1",
        "status": "pending",
        "data": {
          "name": "Advanced Algorithms",
          "code": "UNIT-01",
          "credits": 3.0
        }
      },
      {
        "id": "change-uuid-2",
        "change_type": "outcome_add",
        "entity_id": "outcome-uuid-1",
        "status": "pending",
        "data": {
          "unitId": "unit-uuid-1",
          "outcome": "Implement sorting algorithms",
          "bloomLevel": "Apply"
        }
      }
    ]

    ↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                      UNIVERSITY ADMIN ACTIONS                                │
└─────────────────────────────────────────────────────────────────────────────┘

    👨‍🎓 University Admin Reviews
    │
    ├─ Views in Syllabus Approval Page
    │  • Sees: "Advanced Algorithms" unit pending
    │  • Sees: "Implement sorting algorithms" outcome pending
    │
    ├─ Clicks "Approve" Button
    │
    ↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                   DATABASE FUNCTION: approve_pending_change()                │
└─────────────────────────────────────────────────────────────────────────────┘

    STEP 1: Extract Change Details
    ├─ change_type = "unit_add"
    ├─ entity_id = "unit-uuid-1"
    └─ change_data = { "name": "Advanced Algorithms", ... }

    STEP 2: ✨ NEW - Apply to Tables
    ├─ Calls: apply_change_to_tables()
    │
    ├─ For "unit_add":
    │   INSERT INTO college_curriculum_units (
    │     id, curriculum_id, name, code, credits, ...
    │   ) VALUES (
    │     'unit-uuid-1', 'curriculum-id', 
    │     'Advanced Algorithms', 'UNIT-01', 3.0, ...
    │   );
    │
    └─ For "outcome_add":
        INSERT INTO college_curriculum_outcomes (
          id, curriculum_id, unit_id, outcome_text, ...
        ) VALUES (
          'outcome-uuid-1', 'curriculum-id', 'unit-uuid-1',
          'Implement sorting algorithms', ...
        );

    STEP 3: Move to History
    ├─ Remove from pending_changes
    └─ Add to change_history with:
        • reviewed_by: university-admin-uuid
        • review_date: 2024-01-14T15:00:00Z
        • status: "approved"
        • applied_to_tables: true ✅

    ↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE: FINAL STATE                                     │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────┐
    │ college_curriculums                                                  │
    ├─────────────────────────────────────────────────────────────────────┤
    │ pending_changes: []  ← Empty now                                    │
    │ change_history: [                                                    │
    │   {                                                                  │
    │     "id": "change-uuid-1",                                          │
    │     "change_type": "unit_add",                                      │
    │     "status": "approved",                                           │
    │     "applied_to_tables": true ✅                                    │
    │   },                                                                 │
    │   {                                                                  │
    │     "id": "change-uuid-2",                                          │
    │     "change_type": "outcome_add",                                   │
    │     "status": "approved",                                           │
    │     "applied_to_tables": true ✅                                    │
    │   }                                                                  │
    │ ]                                                                    │
    │ has_pending_changes: false                                          │
    └─────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────┐
    │ college_curriculum_units                                             │
    ├─────────────────────────────────────────────────────────────────────┤
    │ id          | curriculum_id | name                | code    | credits│
    │ unit-uuid-1 | curriculum-id | Advanced Algorithms | UNIT-01 | 3.0   │
    │                                                                       │
    │ ✅ NEW ROW INSERTED                                                  │
    └─────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────┐
    │ college_curriculum_outcomes                                          │
    ├─────────────────────────────────────────────────────────────────────┤
    │ id            | unit_id     | outcome_text                          │
    │ outcome-uuid-1| unit-uuid-1 | Implement sorting algorithms          │
    │                                                                       │
    │ ✅ NEW ROW INSERTED                                                  │
    └─────────────────────────────────────────────────────────────────────┘

    ↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND DISPLAY                                     │
└─────────────────────────────────────────────────────────────────────────────┘

    College Admin Dashboard:
    ✅ "Your changes have been approved and published"
    
    Curriculum View:
    ┌─────────────────────────────────────────────────────────────────┐
    │ Unit 1: Advanced Algorithms (UNIT-01) - 3.0 Credits            │
    │                                                                  │
    │ Learning Outcomes:                                              │
    │ • Implement sorting algorithms (Apply)                          │
    │   Assessment: Lab Test (30%)                                    │
    └─────────────────────────────────────────────────────────────────┘

    Data Source:
    ✅ Read from: college_curriculum_units table
    ✅ Read from: college_curriculum_outcomes table
    ✅ No longer just JSONB!
```

---

## Change Type Examples

### 1. Unit Add
```
pending_changes → approve → college_curriculum_units
                              INSERT new row
```

### 2. Unit Edit
```
pending_changes → approve → college_curriculum_units
                              UPDATE existing row
```

### 3. Unit Delete
```
pending_changes → approve → college_curriculum_units
                              DELETE row
                              ↓
                              college_curriculum_outcomes
                              CASCADE DELETE outcomes
```

### 4. Outcome Add
```
pending_changes → approve → college_curriculum_outcomes
                              INSERT new row
```

### 5. Outcome Edit
```
pending_changes → approve → college_curriculum_outcomes
                              UPDATE existing row
```

---

## Before vs After Comparison

### BEFORE (JSONB Only)
```
┌──────────────────────┐
│ college_curriculums  │
├──────────────────────┤
│ pending_changes JSONB│ ← All data here
│ change_history JSONB │ ← All data here
└──────────────────────┘

❌ Hard to query
❌ No foreign keys
❌ No indexes on data
❌ Can't join easily
```

### AFTER (JSONB + Tables)
```
┌──────────────────────┐      ┌─────────────────────────┐
│ college_curriculums  │      │ college_curriculum_units│
├──────────────────────┤      ├─────────────────────────┤
│ pending_changes JSONB│      │ id                      │
│ change_history JSONB │──────│ curriculum_id (FK)      │
└──────────────────────┘      │ name                    │
                               │ code                    │
       Audit Trail             │ credits                 │
                               └─────────────────────────┘
                                         │
                                         │ FK
                                         ↓
                               ┌──────────────────────────┐
                               │college_curriculum_outcomes│
                               ├──────────────────────────┤
                               │ id                       │
                               │ curriculum_id (FK)       │
                               │ unit_id (FK)             │
                               │ outcome_text             │
                               │ bloom_level              │
                               └──────────────────────────┘

✅ Easy to query
✅ Foreign keys enforce integrity
✅ Indexes for performance
✅ Easy joins with other tables
✅ Still have JSONB for audit trail
```

---

## Query Examples

### Get All Units for a Curriculum
```sql
-- BEFORE: Parse JSONB
SELECT jsonb_array_elements(units) as unit
FROM college_curriculums
WHERE id = 'curriculum-id';

-- AFTER: Simple SELECT
SELECT * FROM college_curriculum_units
WHERE curriculum_id = 'curriculum-id'
ORDER BY order_index;
```

### Get Outcomes with Unit Names
```sql
-- BEFORE: Complex JSONB parsing
-- (Very difficult!)

-- AFTER: Simple JOIN
SELECT 
  u.name as unit_name,
  o.outcome_text,
  o.bloom_level
FROM college_curriculum_outcomes o
JOIN college_curriculum_units u ON u.id = o.unit_id
WHERE o.curriculum_id = 'curriculum-id';
```

### Count Units per Curriculum
```sql
-- BEFORE: JSONB function
SELECT 
  id,
  jsonb_array_length(units) as unit_count
FROM college_curriculums;

-- AFTER: Simple COUNT
SELECT 
  curriculum_id,
  COUNT(*) as unit_count
FROM college_curriculum_units
GROUP BY curriculum_id;
```

---

## 🎯 Key Takeaway

**When university admin clicks "Approve":**

1. ✅ Change moves from `pending_changes` to `change_history` (JSONB)
2. ✅ **NEW:** Change is applied to actual database tables
3. ✅ Data is now queryable, joinable, and indexed
4. ✅ Audit trail preserved in JSONB
5. ✅ Best of both worlds!

---

**Last Updated:** January 14, 2026
