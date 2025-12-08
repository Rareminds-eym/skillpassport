## Setup Guide - Using Existing Schema

Your database already has `school_educators`, `school_classes`, and related tables. I've created SQL scripts that integrate with your existing schema instead of creating duplicate tables.

---

## Quick Setup Steps

### Step 1: Run Integration SQL

Open Supabase SQL Editor and run these in order:

**1. Integration Schema (adds columns and new tables):**
```sql
-- Copy and paste entire content from:
-- supabase/migrations/teacher_management_existing_schema.sql
-- Click "Run"
```

This will:
- ✅ Add `role`, `teacher_id`, `subject_expertise` columns to `school_educators`
- ✅ Create `timetables`, `timetable_slots`, `lesson_plans`, `teacher_journal` tables
- ✅ Create all functions and triggers
- ✅ Link everything to your existing `school_educators` and `school_classes`

**2. Mock Data:**
```sql
-- Copy and paste entire content from:
-- supabase/migrations/mock_data_existing_schema.sql
-- Click "Run"
```

This will:
- ✅ Update existing educators with roles
- ✅ Create timetable slots linked to `school_educators`
- ✅ Create lesson plans
- ✅ Calculate workload
- ✅ Detect conflicts

---

## What's Different from Original Schema

### Uses Your Existing Tables:
- ✅ `school_educators` (instead of creating new `teachers` table)
- ✅ `school_classes` (for class information)
- ✅ `school_educator_class_assignments` (for class assignments)

### New Tables Created:
- `timetables` - Academic timetables
- `timetable_slots` - Time slots (links to `school_educators` and `school_classes`)
- `lesson_plans` - Lesson plans (links to `school_educators`)
- `teacher_journal` - Teacher reflections
- `teacher_workload` - Workload tracking
- `timetable_conflicts` - Conflict detection

### Columns Added to `school_educators`:
- `role` - school_admin, principal, it_admin, class_teacher, subject_teacher
- `teacher_id` - Auto-generated (e.g., SPR-T-0001)
- `onboarding_status` - pending, active, etc.
- `subject_expertise` - JSONB array
- `degree_certificate_url` - Document URL
- `id_proof_url` - Document URL
- `experience_letters_url` - Array of URLs

---

## Component Updates Needed

Update your components to use `school_educators` instead of `teachers`:

### 1. TeacherList.tsx
```typescript
// Change from:
.from("teachers")

// To:
.from("school_educators")
```

### 2. TeacherOnboarding.tsx
```typescript
// Change from:
.from("teachers")

// To:
.from("school_educators")
```

### 3. MyTimetable.tsx
```typescript
// Change from:
.from("teachers")

// To:
.from("school_educators")
```

### 4. LessonPlanCreate.tsx
```typescript
// Change from:
const { data: teacherData } = await supabase
  .from("teachers")
  .select("id")
  .eq("email", userData?.user?.email)
  .single();

// To:
const { data: teacherData } = await supabase
  .from("school_educators")
  .select("id")
  .eq("email", userData?.user?.email)
  .single();
```

### 5. LessonPlanApprovals.tsx
```typescript
// Change from:
.from("lesson_plans")
.select(`
  *,
  teachers!inner(first_name, last_name)
`)

// To:
.from("lesson_plans")
.select(`
  *,
  school_educators!inner(user_id)
`)
// Then get name from auth.users
```

---

## Testing

### 1. Set User in localStorage

```javascript
// For a teacher
localStorage.setItem('user', JSON.stringify({
  email: 'robert.smith@springfield.edu',
  role: 'subject_teacher'
}));
localStorage.setItem('userEmail', 'robert.smith@springfield.edu');
location.reload();
```

### 2. Test Routes

- `/educator/my-timetable` - View timetable
- `/educator/lesson-plans` - View lesson plans
- `/educator/lesson-plans/create` - Create lesson plan
- `/school-admin/lesson-plans/approvals` - Approve plans (as admin)

---

## Verification Queries

### Check Educators with Roles
```sql
SELECT 
  teacher_id,
  email,
  role,
  onboarding_status
FROM school_educators
WHERE role IS NOT NULL;
```

### Check Timetable Slots
```sql
SELECT 
  se.teacher_id,
  se.email,
  COUNT(ts.id) as periods
FROM school_educators se
LEFT JOIN timetable_slots ts ON se.id = ts.educator_id
GROUP BY se.id, se.teacher_id, se.email;
```

### Check Lesson Plans
```sql
SELECT 
  lp.title,
  lp.status,
  se.email as teacher_email
FROM lesson_plans lp
JOIN school_educators se ON lp.educator_id = se.id;
```

---

## Summary

✅ **Integrates with your existing schema**  
✅ **Uses `school_educators` instead of creating new `teachers` table**  
✅ **Links to `school_classes` for class information**  
✅ **All features work the same way**  
✅ **Just need to update component queries**  

**Files to run:**
1. `supabase/migrations/teacher_management_existing_schema.sql`
2. `supabase/migrations/mock_data_existing_schema.sql`

**Components to update:**
- Change all `.from("teachers")` to `.from("school_educators")`
- Update field names if needed (first_name/last_name might be in user_metadata)

Ready to test! 🚀
