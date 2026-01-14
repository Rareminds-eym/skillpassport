# Curriculum Approval Data Flow - Complete Guide

## Overview
This document explains how college admin curriculum changes are stored in the database and how they flow to the university for approval.

---

## 📊 Database Tables Involved

### 1. **college_curriculums** (Main Table)
Stores all curriculum data with approval workflow columns:

```sql
-- Core curriculum data
id UUID PRIMARY KEY
college_id UUID (references organizations)
university_id UUID (references organizations) -- Auto-set based on affiliation
academic_year VARCHAR
course_id UUID (references college_course_mappings)
department_id UUID
program_id UUID
semester INTEGER

-- Approval workflow columns
status VARCHAR -- 'draft', 'submitted', 'pending_approval', 'approved', 'published', 'rejected'
requested_by UUID (references users) -- College admin who submitted
request_date TIMESTAMP
request_message TEXT -- Optional message from college admin
reviewed_by UUID (references users) -- University admin who reviewed
review_date TIMESTAMP
review_notes TEXT -- Feedback from university admin
published_date TIMESTAMP

-- Pending changes tracking (JSONB columns)
pending_changes JSONB -- Array of pending change requests
change_history JSONB -- Array of approved/rejected changes
has_pending_changes BOOLEAN -- Quick flag for filtering
```

### 2. **college_curriculum_units** (Normalized Units Table)
Stores curriculum units/modules in normalized form:

```sql
id UUID PRIMARY KEY
curriculum_id UUID (references college_curriculums)
name TEXT -- Unit name
code TEXT -- Unit code/number
description TEXT
order_index INTEGER -- Order of unit in curriculum
estimated_duration INTEGER
duration_unit TEXT -- 'hours' or 'weeks'
credits DECIMAL(4,2)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
created_by UUID (references users)
updated_by UUID (references users)
```

### 3. **college_curriculum_outcomes** (Normalized Outcomes Table)
Stores learning outcomes linked to units:

```sql
id UUID PRIMARY KEY
curriculum_id UUID (references college_curriculums)
unit_id UUID (references college_curriculum_units)
outcome TEXT -- Learning outcome description
bloom_level TEXT -- 'Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'
assessment_mappings JSONB -- Array of {assessmentType, weightage}
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
created_by UUID (references users)
updated_by UUID (references users)
```

### 4. **university_colleges** (Affiliation Table)
Links colleges to universities:

```sql
id UUID PRIMARY KEY
university_id UUID (references organizations)
college_id UUID (references organizations)
account_status VARCHAR -- 'active', 'inactive', 'suspended'
```

### 5. **curriculum_approval_dashboard** (View)
Aggregated view for university admins to see all pending approvals:

```sql
-- Combines data from:
- college_curriculums
- college_courses (via college_course_mappings)
- organizations (for college and university names)
- users (for requester and reviewer details)
- departments and programs
```

---

## 🔄 Data Flow: College Admin → University Admin

### **SCENARIO 1: Initial Curriculum Submission**

#### Step 1: College Admin Creates Curriculum
**Location:** `CollegeCurriculumBuilderUI.tsx`

```typescript
// College admin selects context
- Academic Year: "2024-2025"
- Department: "Computer Science"
- Program: "B.Tech CSE"
- Semester: "3"
- Course: "Data Structures"

// Adds units and learning outcomes
- Unit 1: Arrays and Linked Lists
  - Learning Outcome: "Implement array operations"
  - Assessment: "Lab Test (30%)"
```

**Database Action:**
```sql
INSERT INTO college_curriculums (
  college_id,
  university_id, -- Auto-set via trigger
  academic_year,
  course_id,
  department_id,
  program_id,
  semester,
  status, -- Initially 'draft'
  curriculum_data -- JSONB with units and outcomes
) VALUES (...);
```

#### Step 2: College Admin Submits for Approval
**Location:** `CollegeCurriculumBuilderUI.tsx` → `curriculumApprovalService.ts`

```typescript
// Frontend call
await curriculumApprovalService.submitForApproval(
  curriculumId, 
  "Please review this curriculum for approval"
);
```

**Database Function:** `submit_curriculum_for_approval()`

```sql
-- Updates curriculum status
UPDATE college_curriculums 
SET 
  status = 'pending_approval',
  requested_by = auth.uid(), -- Current college admin
  request_date = NOW(),
  request_message = 'Please review this curriculum for approval',
  university_id = (SELECT university_id FROM university_colleges 
                   WHERE college_id = ... AND account_status = 'active')
WHERE id = p_curriculum_id;

-- Creates notification for university admins
INSERT INTO notifications (
  recipient_id, -- All university admins
  title,
  message,
  type,
  metadata
) SELECT ...;
```

**Data Stored:**
```json
{
  "curriculum_id": "uuid-123",
  "status": "pending_approval",
  "requested_by": "college-admin-uuid",
  "request_date": "2024-01-14T10:30:00Z",
  "request_message": "Please review this curriculum for approval",
  "university_id": "university-uuid"
}
```

---

### **SCENARIO 2: Editing Published Curriculum (Pending Changes)**

#### Step 1: College Admin Edits Published Curriculum
**Location:** `CollegeCurriculumBuilderUI.tsx`

```typescript
// College admin edits a unit in published curriculum
- Edit Unit 1: Change "Arrays" to "Advanced Arrays"
- Add new assessment mapping
```

**Database Function:** `add_pending_change()`

```sql
-- Adds change to pending_changes JSONB array
UPDATE college_curriculums
SET 
  pending_changes = pending_changes || jsonb_build_object(
    'id', gen_random_uuid(),
    'change_type', 'unit_edit',
    'entity_id', 'unit-uuid',
    'timestamp', NOW(),
    'requested_by', auth.uid(),
    'requester_name', 'John Doe',
    'request_message', 'Updated unit name for clarity',
    'status', 'pending',
    'data', jsonb_build_object(
      'old_name', 'Arrays and Linked Lists',
      'new_name', 'Advanced Arrays and Linked Lists',
      'old_description', '...',
      'new_description', '...'
    )
  ),
  has_pending_changes = TRUE
WHERE id = p_curriculum_id;
```

**Data Stored in `pending_changes` JSONB:**
```json
[
  {
    "id": "change-uuid-1",
    "change_type": "unit_edit",
    "entity_id": "unit-uuid",
    "timestamp": "2024-01-14T11:00:00Z",
    "requested_by": "college-admin-uuid",
    "requester_name": "John Doe",
    "request_message": "Updated unit name for clarity",
    "status": "pending",
    "data": {
      "old_name": "Arrays and Linked Lists",
      "new_name": "Advanced Arrays and Linked Lists",
      "old_description": "Basic arrays",
      "new_description": "Advanced array operations"
    }
  }
]
```

---

## 🎓 University Admin Approval Process

### Step 1: University Admin Views Pending Approvals
**Location:** `SyllabusApproval.tsx`

```typescript
// Fetches pending approvals
const result = await curriculumApprovalService.getApprovalRequests(
  universityId,
  { status: 'pending_approval' }
);
```

**Database Query:**
```sql
SELECT * FROM curriculum_approval_dashboard
WHERE university_id = 'university-uuid'
AND status = 'pending_approval'
ORDER BY request_date DESC;
```

**Returns:**
```json
[
  {
    "curriculum_id": "uuid-123",
    "academic_year": "2024-2025",
    "course_name": "Data Structures",
    "course_code": "CS301",
    "semester": 3,
    "department_name": "Computer Science",
    "program_name": "B.Tech CSE",
    "college_name": "ABC College",
    "requester_name": "John Doe",
    "requester_email": "john@abc.edu",
    "request_date": "2024-01-14T10:30:00Z",
    "request_message": "Please review this curriculum",
    "request_status": "pending_approval"
  }
]
```

### Step 2: University Admin Reviews and Approves/Rejects
**Location:** `SyllabusApproval.tsx`

```typescript
// Approve
await curriculumApprovalService.approveCurriculum(
  curriculumId,
  "Approved. Good structure."
);

// OR Reject
await curriculumApprovalService.rejectCurriculum(
  curriculumId,
  "Please add more assessment details."
);
```

**Database Function:** `review_curriculum()`

```sql
-- For APPROVAL
UPDATE college_curriculums 
SET 
  status = 'published', -- Auto-publish on approval
  reviewed_by = auth.uid(),
  review_date = NOW(),
  review_notes = 'Approved. Good structure.',
  published_date = NOW()
WHERE id = p_curriculum_id
AND status = 'pending_approval';

-- For REJECTION
UPDATE college_curriculums 
SET 
  status = 'rejected',
  reviewed_by = auth.uid(),
  review_date = NOW(),
  review_notes = 'Please add more assessment details.',
  published_date = NULL
WHERE id = p_curriculum_id
AND status = 'pending_approval';

-- Creates notification for college admin
INSERT INTO notifications (
  recipient_id, -- College admin who submitted
  title,
  message,
  type,
  metadata
) VALUES (...);
```

**Data After Approval:**
```json
{
  "curriculum_id": "uuid-123",
  "status": "published",
  "requested_by": "college-admin-uuid",
  "request_date": "2024-01-14T10:30:00Z",
  "reviewed_by": "university-admin-uuid",
  "review_date": "2024-01-14T14:00:00Z",
  "review_notes": "Approved. Good structure.",
  "published_date": "2024-01-14T14:00:00Z"
}
```

**✨ NEW: Data Applied to Normalized Tables:**

When university admin approves, the curriculum data is automatically applied to normalized tables:

```sql
-- Units are inserted into college_curriculum_units
INSERT INTO college_curriculum_units (
  id, curriculum_id, name, code, description, 
  order_index, estimated_duration, duration_unit, credits
) VALUES (...);

-- Outcomes are inserted into college_curriculum_outcomes
INSERT INTO college_curriculum_outcomes (
  id, curriculum_id, unit_id, outcome, 
  bloom_level, assessment_mappings
) VALUES (...);
```

**Result in Tables:**

```sql
-- college_curriculum_units table
| id          | curriculum_id | name                    | code    | order_index | credits |
|-------------|---------------|-------------------------|---------|-------------|---------|
| unit-uuid-1 | uuid-123      | Arrays and Linked Lists | UNIT-01 | 1           | 3.0     |
| unit-uuid-2 | uuid-123      | Trees and Graphs        | UNIT-02 | 2           | 4.0     |

-- college_curriculum_outcomes table
| id            | curriculum_id | unit_id     | outcome                          | bloom_level |
|---------------|---------------|-------------|----------------------------------|-------------|
| outcome-uuid-1| uuid-123      | unit-uuid-1 | Implement array operations       | Apply       |
| outcome-uuid-2| uuid-123      | unit-uuid-1 | Analyze time complexity          | Analyze     |
```

---

## 🔍 Pending Changes Approval (For Published Curriculums)

### Step 1: University Admin Views Pending Changes
**Location:** `SyllabusApproval.tsx`

```typescript
// Get all pending changes for a curriculum
const result = await supabase.rpc('get_pending_changes', {
  p_curriculum_id: curriculumId
});
```

**Database Function:** `get_pending_changes()`

```sql
SELECT 
  (change_obj->>'id')::UUID as change_id,
  change_obj->>'change_type' as change_type,
  (change_obj->>'entity_id')::UUID as entity_id,
  (change_obj->>'timestamp')::TIMESTAMP as change_timestamp,
  change_obj->>'requester_name' as requester_name,
  change_obj->>'request_message' as request_message,
  change_obj->>'status' as change_status,
  change_obj as change_data
FROM college_curriculums,
     jsonb_array_elements(pending_changes) AS change_obj
WHERE id = p_curriculum_id 
AND change_obj->>'status' = 'pending'
ORDER BY (change_obj->>'timestamp')::TIMESTAMP DESC;
```

### Step 2: University Admin Approves/Rejects Individual Changes

```typescript
// Approve a change
await supabase.rpc('approve_pending_change', {
  p_curriculum_id: curriculumId,
  p_change_id: changeId,
  p_review_notes: 'Approved'
});

// Reject a change
await supabase.rpc('reject_pending_change', {
  p_curriculum_id: curriculumId,
  p_change_id: changeId,
  p_review_notes: 'Please provide more details'
});
```

**Database Function:** `approve_pending_change()`

```sql
-- Removes change from pending_changes array
UPDATE college_curriculums
SET 
  pending_changes = (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(pending_changes) AS elem
    WHERE elem->>'id' != p_change_id::text
  ),
  -- Adds to change_history with approval info
  change_history = change_history || jsonb_build_object(
    'id', p_change_id,
    'change_type', '...',
    'reviewed_by', auth.uid(),
    'reviewer_name', 'University Admin',
    'review_date', NOW(),
    'status', 'approved',
    'review_notes', p_review_notes
  ),
  has_pending_changes = (remaining_count > 0)
WHERE id = p_curriculum_id;
```

**Data After Approval:**
```json
{
  "pending_changes": [], // Empty after approval
  "change_history": [
    {
      "id": "change-uuid-1",
      "change_type": "unit_edit",
      "entity_id": "unit-uuid",
      "timestamp": "2024-01-14T11:00:00Z",
      "requested_by": "college-admin-uuid",
      "requester_name": "John Doe",
      "reviewed_by": "university-admin-uuid",
      "reviewer_name": "Dr. Smith",
      "review_date": "2024-01-14T15:00:00Z",
      "status": "approved",
      "review_notes": "Approved",
      "applied_to_tables": true,
      "data": { ... }
    }
  ],
  "has_pending_changes": false
}
```

**✨ NEW: Change Applied to Normalized Tables:**

When university admin approves a pending change, it's automatically applied to the actual tables:

```sql
-- For 'unit_edit' change type:
UPDATE college_curriculum_units
SET 
  name = 'Advanced Arrays and Linked Lists',
  description = 'Advanced array operations',
  updated_by = 'university-admin-uuid',
  updated_at = NOW()
WHERE id = 'unit-uuid';

-- For 'outcome_add' change type:
INSERT INTO college_curriculum_outcomes (
  id, curriculum_id, unit_id, outcome, 
  bloom_level, assessment_mappings
) VALUES (...);

-- For 'unit_delete' change type:
DELETE FROM college_curriculum_units WHERE id = 'unit-uuid';
-- (Outcomes cascade delete automatically)
```

**Supported Change Types:**

| Change Type | Action | Applied To |
|-------------|--------|------------|
| `unit_add` | Insert new unit | `college_curriculum_units` |
| `unit_edit` | Update existing unit | `college_curriculum_units` |
| `unit_delete` | Delete unit | `college_curriculum_units` |
| `unit_reorder` | Update order_index | `college_curriculum_units` |
| `outcome_add` | Insert new outcome | `college_curriculum_outcomes` |
| `outcome_edit` | Update existing outcome | `college_curriculum_outcomes` |
| `outcome_delete` | Delete outcome | `college_curriculum_outcomes` |
| `bulk_add_units` | Insert multiple units | `college_curriculum_units` |
| `bulk_add_outcomes` | Insert multiple outcomes | `college_curriculum_outcomes` |

---

## 📋 Summary of Data Storage

### **Initial Submission:**
- **Table:** `college_curriculums`
- **Columns:** `status`, `requested_by`, `request_date`, `request_message`, `university_id`
- **Status Flow:** `draft` → `pending_approval` → `published` (or `rejected`)

### **Pending Changes (Published Curriculum):**
- **Table:** `college_curriculums`
- **Column:** `pending_changes` (JSONB array)
- **Each Change Contains:** `id`, `change_type`, `entity_id`, `timestamp`, `requested_by`, `requester_name`, `request_message`, `status`, `data`

### **Approval History:**
- **Table:** `college_curriculums`
- **Column:** `change_history` (JSONB array)
- **Each Entry Contains:** All change data + `reviewed_by`, `reviewer_name`, `review_date`, `status`, `review_notes`

### **University View:**
- **View:** `curriculum_approval_dashboard`
- **Aggregates:** Curriculum + Course + College + University + Requester + Reviewer data
- **Filtered By:** `status = 'pending_approval'` and `university_id`

---

## 🔐 Security & Access Control

### Row Level Security (RLS) Policies:

```sql
-- College admins can view their own curriculum
CREATE POLICY "College admins can view their curriculum" 
ON college_curriculums FOR SELECT 
USING (
  college_id IN (
    SELECT "organizationId" FROM users 
    WHERE id = auth.uid() AND role = 'college_admin'
  )
);

-- University admins can view affiliated college curriculum
CREATE POLICY "University admins can view affiliated college curriculum" 
ON college_curriculums FOR SELECT 
USING (
  university_id IN (
    SELECT "organizationId" FROM users 
    WHERE id = auth.uid() AND role = 'university_admin'
  )
);
```

---

## 🚀 Key Functions Reference

| Function | Purpose | Called By |
|----------|---------|-----------|
| `submit_curriculum_for_approval()` | Submit curriculum for university approval | College Admin |
| `review_curriculum()` | Approve/reject curriculum | University Admin |
| `add_pending_change()` | Add change request to published curriculum | College Admin |
| `get_pending_changes()` | Get all pending changes for a curriculum | University Admin |
| `approve_pending_change()` | Approve individual change | University Admin |
| `reject_pending_change()` | Reject individual change | University Admin |
| `get_all_pending_changes_for_university()` | Get all pending changes across all colleges | University Admin |

---

## 📍 File Locations

### Frontend:
- **College Admin UI:** `src/components/admin/collegeAdmin/CollegeCurriculumBuilderUI.tsx`
- **University Admin UI:** `src/pages/admin/universityAdmin/SyllabusApproval.tsx`
- **Service Layer:** `src/services/curriculumApprovalService.ts`

### Database:
- **Schema Setup:** `add-pending-changes-columns.sql`
- **Approval Workflow:** `curriculum_approval_workflow_complete_implementation.sql`
- **Change Functions:** `curriculum-change-functions-FINAL.sql`

---

## ✅ Testing the Flow

1. **College Admin submits curriculum:**
   ```sql
   SELECT * FROM college_curriculums WHERE id = 'curriculum-id';
   -- Check: status = 'pending_approval', requested_by is set
   ```

2. **University Admin views pending:**
   ```sql
   SELECT * FROM curriculum_approval_dashboard 
   WHERE university_id = 'university-id' 
   AND status = 'pending_approval';
   ```

3. **University Admin approves:**
   ```sql
   SELECT * FROM college_curriculums WHERE id = 'curriculum-id';
   -- Check: status = 'published', reviewed_by is set, published_date is set
   ```

4. **Check pending changes:**
   ```sql
   SELECT pending_changes FROM college_curriculums WHERE id = 'curriculum-id';
   -- Should be JSONB array of pending changes
   ```

---

**Last Updated:** January 14, 2026
