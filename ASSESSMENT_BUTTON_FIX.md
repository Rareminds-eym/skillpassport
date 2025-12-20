# Assessment Button Fix - Internal vs External Courses

## Problem
The Assessment button was showing for all courses in My Learning page, but it should only show for **external courses** (courses added manually by students), not for **internal platform courses** (courses enrolled from the RareMinds platform).

## Solution Applied

### 1. Updated ModernLearningCard.jsx
- Fixed logic to properly detect internal vs external courses
- Assessment button now only shows when `isExternalCourse === true`
- Edit button also only shows for external courses

### 2. Logic for Course Type Detection (CORRECTED)
```javascript
// Internal courses: MUST have BOTH course_id AND source='internal_course'
// External courses: everything else (manual, external_course, or no course_id)
const isInternalCourse = !!(item.course_id && item.source === "internal_course");
const isExternalCourse = !isInternalCourse;
```

**Why the change?**
The database has existing courses with:
- `source: "manual"` (old external courses)
- `source: "external_course"` (external courses)
- `source: "internal_course"` with `course_id` (platform courses)

So we need to check for BOTH fields to identify internal courses.

### 3. How It Works

**Internal Platform Courses:**
- Enrolled via SelectCourseModal
- Have `course_id` field linking to `courses` table
- Have `source: 'internal_course'` in trainings table
- **NO Assessment button** (assessments are built into the course modules)
- **NO Edit button** (managed by the platform)

**External Courses:**
- Added manually via "Add External Course" button
- Have `source: 'manual'`, `source: 'external_course'`, or no source
- May or may not have `course_id` (but if they do, source won't be 'internal_course')
- **SHOW Assessment button** (students need to take platform assessment)
- **SHOW Edit button** (students can edit their own entries)

## Database Structure

### trainings table
When a student enrolls in a platform course, the record includes:
```javascript
{
  student_id: studentId,
  course_id: course.course_id,  // Links to courses table
  title: course.title,
  organization: course.university || 'Internal Platform',
  source: 'internal_course',    // Marks as internal
  // ... other fields
}
```

When a student adds an external course:
```javascript
{
  student_id: studentId,
  course_id: null,               // No link to courses table
  title: 'External Course Name',
  organization: 'External Provider',
  source: null,                  // Or not set
  // ... other fields
}
```

## Testing

1. **Test Internal Course:**
   - Go to My Learning
   - Click "Add Learning"
   - Enroll in a platform course
   - Verify: NO Assessment button shows
   - Verify: NO Edit button shows

2. **Test External Course:**
   - Go to My Learning
   - Click "Add Learning"
   - Click "Add External Course"
   - Add a course manually
   - Verify: Assessment button SHOWS
   - Verify: Edit button SHOWS

## Files Modified
- `src/components/Students/components/ModernLearningCard.jsx`
