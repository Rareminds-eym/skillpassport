# Examination Course Setup Guide

## ✅ Course Table Connected

The Examination Management module now uses the **curriculum_courses** table for managing subjects/courses.

## Database Structure

### curriculum_courses Table
This table stores all subjects/courses offered by the college:

```sql
- id (UUID) - Primary key
- college_id (UUID) - Reference to colleges
- department_id (UUID) - Reference to departments
- program_id (UUID) - Reference to programs
- course_code (VARCHAR) - e.g., "CS101", "MA201"
- course_name (VARCHAR) - e.g., "Data Structures", "Mathematics I"
- course_type (VARCHAR) - Theory, Practical, Lab, Project, Elective, Core
- semester (INTEGER) - 1 to 12
- credits (NUMERIC) - Credit hours
- contact_hours (INTEGER) - Weekly contact hours
- syllabus (TEXT) - Course syllabus
- learning_outcomes (JSONB) - Learning outcomes array
- prerequisites (JSONB) - Prerequisite courses
- is_active (BOOLEAN) - Active status
```

## How to Add Courses

### Option 1: Via SQL (Bulk Import)

```sql
INSERT INTO curriculum_courses (
    college_id,
    department_id,
    program_id,
    course_code,
    course_name,
    course_type,
    semester,
    credits,
    contact_hours,
    is_active
) VALUES 
    (
        'your-college-id',
        'your-department-id',
        'your-program-id',
        'CS101',
        'Introduction to Programming',
        'Theory',
        1,
        4,
        4,
        true
    ),
    (
        'your-college-id',
        'your-department-id',
        'your-program-id',
        'CS102',
        'Programming Lab',
        'Lab',
        1,
        2,
        4,
        true
    );
```

### Option 2: Via Supabase Dashboard

1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Select `curriculum_courses` table
4. Click "Insert row"
5. Fill in the course details
6. Save

### Option 3: Create a Course Management UI (Recommended)

You can create a Course Management page in your college admin dashboard to manage courses easily.

## Sample Course Data

Here are some sample courses already added:

| Code | Name | Type | Semester | Credits |
|------|------|------|----------|---------|
| CS101 | Introduction to Programming | Theory | 1 | 4 |
| CS102 | Programming Lab | Lab | 1 | 2 |
| MA101 | Engineering Mathematics I | Theory | 1 | 4 |
| CS201 | Data Structures | Theory | 2 | 4 |
| CS202 | Data Structures Lab | Lab | 2 | 2 |

## Integration with Assessments

When creating an assessment:
1. Select Department
2. Select Program
3. Select Semester
4. **Select Course** - This dropdown now shows courses from `curriculum_courses` table
5. The course dropdown is filtered by:
   - Active courses only (`is_active = true`)
   - Sorted by semester and course name

## Course Dropdown Display Format

The course dropdown shows:
```
[Course Code] - [Course Name]
Example: CS101 - Introduction to Programming
```

## Next Steps

### 1. Add Your College Courses

Add all courses for your college programs using one of the methods above.

### 2. Organize by Semester

Make sure to set the correct semester for each course so they appear in the right context.

### 3. Set Course Types

Use appropriate course types:
- **Theory** - Lecture-based courses
- **Practical** - Hands-on practical courses
- **Lab** - Laboratory sessions
- **Project** - Project-based courses
- **Elective** - Optional elective courses
- **Core** - Mandatory core courses

### 4. Link to Departments & Programs

Associate each course with:
- College ID
- Department ID (optional but recommended)
- Program ID (optional but recommended)

This helps in filtering courses when creating assessments.

## Benefits

✅ **Centralized Course Management** - All courses in one place
✅ **Reusable** - Same course can be used across multiple assessments
✅ **Organized** - Courses organized by department, program, and semester
✅ **Flexible** - Easy to add, edit, or deactivate courses
✅ **Consistent** - Ensures consistent course codes and names

## Troubleshooting

### No courses showing in dropdown?

1. Check if courses exist in `curriculum_courses` table
2. Verify `is_active = true` for the courses
3. Check if `college_id` matches your current college

### Course not appearing for specific semester?

1. Verify the `semester` field is set correctly
2. Check if the course is active

### Need to update course details?

```sql
UPDATE curriculum_courses 
SET 
    course_name = 'Updated Name',
    credits = 4,
    updated_at = now()
WHERE course_code = 'CS101';
```

---

**Status:** ✅ Connected and Ready
**Last Updated:** December 12, 2024
