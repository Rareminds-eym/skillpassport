# Courses College Filter Fix

## Problem
The College Admin Courses page was showing all courses from all colleges instead of filtering by the specific college.

## Solution

### 1. Database Migration
Added `school_id` column to the `courses` table:
- Added foreign key reference to `schools(id)`
- Created index for better query performance
- Updated existing courses to set `school_id` from educator's school

```sql
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id);

CREATE INDEX IF NOT EXISTS idx_courses_school_id ON courses(school_id);

UPDATE courses c
SET school_id = se.school_id
FROM school_educators se
WHERE c.educator_id = se.user_id
AND c.school_id IS NULL;
```

### 2. Service Layer Updates
**File: `src/services/educator/coursesService.ts`**

- Added `getCoursesBySchool()` function to fetch courses by school_id
- Extracted transformation logic into `transformCoursesData()` helper
- Updated `createCourse()` to accept and store `school_id`
- Auto-retrieves school_id from `school_educators` table if not provided

### 3. Component Updates
**File: `src/pages/admin/collegeAdmin/Courses.tsx`**

- Added `schoolId` state
- Fetches school_id from `school_educators` table on load
- Uses `getCoursesBySchool()` instead of `getCoursesByEducator()`
- Passes school_id when creating new courses

## Result
College admins now see only courses belonging to their specific college/school.
