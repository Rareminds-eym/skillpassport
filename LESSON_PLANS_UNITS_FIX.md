# Lesson Plans - Units Not Showing Fix

## Problem
When creating a lesson plan for M.Sc Data Science → Mathematics course, the "Select Unit" dropdown showed "No units available (Create Curriculum)" even though a curriculum with units was already created in Curriculum Builder.

## Root Cause
The `getCurriculumUnits()` function in `lessonPlanService.ts` was only looking for curriculums with status **'published'** or **'draft'**, but the existing curriculum had status **'approved'**.

## Solution Applied ✅

Updated `src/services/college/lessonPlanService.ts` to also check for **'approved'** status curriculums.

### Before:
```typescript
// Only checked: published → draft
let { data: curriculum } = await supabase
  .from('college_curriculums')
  .eq('status', 'published')
  .single();

if (!curriculum) {
  // Try draft
  curriculum = await supabase
    .from('college_curriculums')
    .eq('status', 'draft')
    .single();
}
```

### After:
```typescript
// Now checks: published → approved → draft
let { data: curriculum } = await supabase
  .from('college_curriculums')
  .eq('status', 'published')
  .single();

if (!curriculum) {
  // Try approved
  curriculum = await supabase
    .from('college_curriculums')
    .eq('status', 'approved')
    .single();
}

if (!curriculum) {
  // Try draft
  curriculum = await supabase
    .from('college_curriculums')
    .eq('status', 'draft')
    .single();
}
```

## Existing Curriculum Details

### Curriculum:
- **Program:** M.Sc Data Science
- **Course:** MS001 - Mathematics
- **Academic Year:** 2025-2026
- **Status:** Approved ✅
- **Department:** Department Of Mechanical Engineering

### Units Created:
1. **Introduction of Mathematics** (Code: MS0011)

## How to Test

1. **Refresh the Lesson Plans page** or restart the dev server
2. Go to **Lesson Plans** (`/college-admin/academics/lesson-plans`)
3. Select:
   - **Department:** Department Of Mechanical Engineering
   - **Program:** M.Sc Data Science
   - **Semester:** Semester 1
   - **Course:** MS001 - Mathematics
   - **Academic Year:** 2025-2026
4. The **Select Unit** dropdown should now show:
   - ✅ "Introduction of Mathematics (MS0011)"

## Curriculum Status Workflow

```
Draft → Approved → Published
  ↓        ↓          ↓
  ✅       ✅         ✅
All three statuses should now work in Lesson Plans!
```

## Why This Matters

The curriculum approval workflow is:
1. **Draft** - Curriculum is being created/edited
2. **Approved** - Curriculum is reviewed and approved by admin
3. **Published** - Curriculum is active and available to students

Previously, lesson plans could only be created for **published** or **draft** curriculums. Now, faculty can create lesson plans as soon as the curriculum is **approved**, without waiting for it to be published.

## Additional Notes

### Academic Year Format
Both services use the same format: `YYYY-YYYY` (e.g., `2025-2026`)
- ✅ Consistent across Curriculum Builder and Lesson Plans
- ✅ No format mismatch issues

### Course Tables
- **Curriculum Builder** uses: `curriculum_courses` table
- **Lesson Plans** uses: `college_courses` table
- These are different tables but can reference the same courses

## Next Steps

1. ✅ Fix applied - approved curriculums now work
2. Refresh the page to see units in dropdown
3. Create lesson plans using the curriculum units
4. If still not showing, check:
   - Academic year matches exactly (2025-2026)
   - Course is MS001 - Mathematics
   - Program is M.Sc Data Science
   - Department is Department Of Mechanical Engineering

## Quick Verification Query

```sql
-- Check if curriculum and units exist
SELECT 
  cc.id as curriculum_id,
  cc.status,
  cc.academic_year,
  cu.name as unit_name,
  cu.code as unit_code
FROM college_curriculums cc
JOIN college_curriculum_units cu ON cu.curriculum_id = cc.id
JOIN programs p ON cc.program_id = p.id
WHERE p.name = 'M.Sc Data Science'
  AND cc.academic_year = '2025-2026';
```

Expected Result:
- Curriculum ID: `530fbccd-b750-4e2e-8886-96dc66107935`
- Status: `approved`
- Unit: `Introduction of Mathematics (MS0011)`
