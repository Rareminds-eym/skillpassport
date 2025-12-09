# Courses Show All Fix

## Problem
Both College Admin and School Admin Courses pages needed to show ALL courses from ALL colleges/schools, not just courses from a specific institution.

## Solution

### 1. Service Layer Updates
**File: `src/services/educator/coursesService.ts`**

Added `getAllCourses()` function:
```typescript
export const getAllCourses = async (): Promise<Course[]> => {
  // Fetches all courses without any school_id filter
  const { data: coursesData, error: coursesError } = await supabase
    .from('courses')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  
  return await transformCoursesData(coursesData);
};
```

### 2. Component Updates

**File: `src/pages/admin/collegeAdmin/Courses.tsx`**
- Changed from `getCoursesBySchool()` to `getAllCourses()`
- Still fetches school_id for creating new courses (optional)
- Shows warning if school_id not found but continues to load all courses

**File: `src/pages/admin/schoolAdmin/Courses.tsx`**
- Simplified complex school-based filtering logic
- Changed to use `getAllCourses()` instead of fetching by educator IDs
- Still fetches school_id from `school_educators` table for creating courses
- Passes school_id when creating new courses

## Result
Both College Admin and School Admin now see ALL courses from ALL colleges/schools in the system.
