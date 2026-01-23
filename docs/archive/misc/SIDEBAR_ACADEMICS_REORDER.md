# Sidebar Academics Section Reorder - College Admin

## Changes Applied ✅

Reordered the **Academics** section in the college admin sidebar to follow the logical workflow from course setup to lesson planning.

## New Order

### Academics Section:
1. **Courses** - Manage course catalog
2. **Programs** - Manage academic programs
3. **Program & Sections** - Create sections for programs
4. **Course Mapping** - Map courses to program semesters *(moved from Departments & Faculty)*
5. **Curriculum Builder** - Build curriculum with units and outcomes
6. **Lesson Plans** - Create lesson plans using curriculum
7. **Coverage Tracker** - Track curriculum coverage
8. **Academic Calendar** - Manage academic calendar

## Rationale for Order

This order follows the natural workflow:

```
1. Courses (Define available courses)
   ↓
2. Programs (Create programs like M.Sc Data Science)
   ↓
3. Program & Sections (Create sections for each program-semester)
   ↓
4. Course Mapping (Map which courses are in which semesters)
   ↓
5. Curriculum Builder (Build detailed curriculum with units)
   ↓
6. Lesson Plans (Create lesson plans using curriculum units)
   ↓
7. Coverage Tracker (Track what's been taught)
   ↓
8. Academic Calendar (Schedule academic activities)
```

## What Changed

### Before:
```
Departments & Faculty
├─ Departments
├─ Faculty
└─ Course Mapping ❌ (was here)

Academics
├─ Courses
├─ Curriculum Builder
├─ Programs
├─ Program & Sections
├─ Lesson Plans
├─ Coverage Tracker
└─ Academic Calendar
```

### After:
```
Departments & Faculty
├─ Departments
└─ Faculty

Academics
├─ Courses
├─ Programs
├─ Program & Sections
├─ Course Mapping ✅ (moved here)
├─ Curriculum Builder
├─ Lesson Plans
├─ Coverage Tracker
└─ Academic Calendar
```

## Benefits

1. **Logical Flow** - Follows the academic setup workflow
2. **Better Grouping** - Course Mapping is now with other academic items
3. **Easier Navigation** - Users can follow the natural progression
4. **Clearer Hierarchy** - Department → Program → Course Mapping → Curriculum

## Files Modified

- `src/components/admin/Sidebar.tsx`
  - Reordered Academics section items
  - Moved Course Mapping from Departments & Faculty to Academics

## Testing

Refresh the page and check the sidebar under **Academics**. The order should now be:
1. Courses
2. Programs
3. Program & Sections
4. Course Mapping
5. Curriculum Builder
6. Lesson Plans
7. Coverage Tracker
8. Academic Calendar
