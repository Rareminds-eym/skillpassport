# M.Sc Data Science - Semester Not Showing Fix

## Problem
When creating a curriculum for the M.Sc Data Science program in Curriculum Builder, the semester dropdown was empty and showing "Select Semester" with no options.

## Root Cause
The Curriculum Builder's `getSemesters()` function queries the `college_course_mappings` table to find which semesters have courses mapped to the selected program. Since M.Sc Data Science was a newly created program, it had **no course mappings** yet, resulting in no semesters being available.

## Solution Applied ✅

I've added sample course mappings for M.Sc Data Science program across 3 semesters:

### Semester 1 (3 courses):
- CS0125 - testing2
- CS101 - Intro to Programming
- CS102 - Data Structures

### Semester 2 (3 courses):
- CS105 - Testing
- CS201 - Object Oriented Programming
- CS202 - Database Systems

### Semester 3 (1 course):
- EC103 - Electronics Lab

## How to Test
1. Go to **Curriculum Builder** (`/college-admin/academics/curriculum`)
2. Select **Department:** Department of Electrical Engineering (or your department)
3. Select **Program:** M.Sc Data Science
4. The **Semester** dropdown should now show: Semester 1, Semester 2, Semester 3

## How to Add More Courses/Semesters

### Option 1: Using the Course Mapping UI (Recommended)
1. Go to **Departments & Faculty** → **Course Mapping** (`/college-admin/departments/mapping`)
2. Select the M.Sc Data Science program
3. Add courses to each semester (1-4 for a 2-year M.Sc program)
4. Assign faculty, set offering type (Core/Elective), and capacity

### Option 2: Using SQL (Quick Setup)
```sql
-- Add a course to semester 4
INSERT INTO college_course_mappings (
  program_id,
  course_id,
  semester,
  offering_type,
  is_locked,
  current_enrollment
)
VALUES (
  '95e078f6-22a6-46b9-9867-00931ddb7fc0', -- M.Sc Data Science program ID
  '<course_id_from_college_courses>',
  4, -- Semester number
  'core', -- or 'dept_elective' or 'open_elective'
  false,
  0
);
```

## Understanding the Flow

```
1. Create Program (M.Sc Data Science)
   ↓
2. Map Courses to Program Semesters (Course Mapping page)
   ↓
3. Semesters become available in Curriculum Builder
   ↓
4. Select Semester → Select Course → Build Curriculum
```

## Database Tables Involved

### `programs`
- Stores program information (M.Sc Data Science)
- Fields: `id`, `name`, `code`, `department_id`, `degree_level`

### `college_courses`
- Stores available courses
- Fields: `id`, `course_code`, `course_name`, `credits`

### `college_course_mappings`
- **Maps courses to program semesters** (This was missing!)
- Fields: `program_id`, `course_id`, `semester`, `offering_type`
- This table determines which semesters appear in Curriculum Builder

### `college_curriculums`
- Stores the actual curriculum built in Curriculum Builder
- Links to: `program_id`, `course_id`, `semester` (via course mapping)

## Typical M.Sc Program Structure
- **Duration:** 2 years (4 semesters)
- **Semester 1-2:** Core courses + electives
- **Semester 3:** Advanced courses + project work
- **Semester 4:** Dissertation/Thesis + seminars

## Next Steps
1. ✅ Semesters 1-3 are now available for M.Sc Data Science
2. Add more courses to semester 4 using Course Mapping page
3. Add Data Science specific courses (Machine Learning, Big Data, etc.)
4. Assign faculty to each course
5. Start building curriculum in Curriculum Builder

## Quick Reference
- **Course Mapping Page:** `/college-admin/departments/mapping`
- **Curriculum Builder:** `/college-admin/academics/curriculum`
- **Program Management:** `/college-admin/academics/programs`
