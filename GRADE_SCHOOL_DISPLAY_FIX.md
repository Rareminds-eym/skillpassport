# Grade and School Display Fix ✅

## Problem
The "Grade" and "School" fields were showing "—" (empty dashes) on the assessment results page header, even though the student has this information in the database.

## Root Cause
The `year` field was missing from the database query in the `fetchStudentInfo` function. The query was selecting `grade` and `semester` but not `year`, which is used as a fallback for college students who don't have a grade value.

## Solution

### Updated Database Query
Added the `year` field to the student data query in `useAssessmentResults.js`:

**File**: `src/features/assessment/assessment-result/hooks/useAssessmentResults.js`

```javascript
// BEFORE (Missing 'year' field):
let { data: studentData, error: fetchError } = await supabase
    .from('students')
    .select(`
        id, 
        name,
        enrollment_number,
        admission_number,
        roll_number,
        grade,
        semester,  // ❌ Missing 'year'
        college_id, 
        school_id,
        school_class_id,
        branch_field,
        course_name,
        college_school_name,
        grade_start_date
    `)
    .eq('user_id', user.id)
    .maybeSingle();

// AFTER (Added 'year' field):
let { data: studentData, error: fetchError } = await supabase
    .from('students')
    .select(`
        id, 
        name,
        enrollment_number,
        admission_number,
        roll_number,
        grade,
        year,      // ✅ Added 'year'
        semester,
        college_id, 
        school_id,
        school_class_id,
        branch_field,
        course_name,
        college_school_name,
        grade_start_date
    `)
    .eq('user_id', user.id)
    .maybeSingle();
```

## How It Works

### Grade Display Logic:
The code has a fallback hierarchy for displaying the grade:

1. **Priority 1**: `students.grade` (e.g., "11", "12", "9th")
2. **Priority 2**: `school_classes.grade` (from school_classes table)
3. **Priority 3** (College Students): 
   - If `year` exists: Display as "Year 1", "Year 2", etc.
   - If `semester` exists: Display as "Semester 1", "Semester 2", etc.
   - Otherwise: Display "—"

```javascript
// Get grade - prioritize students.grade, then school_classes.grade as fallback
let studentGrade = studentData.grade || studentData.school_classes?.grade;

// If no grade and student is in college, try year or semester
if (!studentGrade || studentGrade === '—') {
    if (studentData.college_id) {
        if (studentData.year) {
            studentGrade = `Year ${studentData.year}`;  // ✅ Now works!
        } else if (studentData.semester) {
            studentGrade = `Semester ${studentData.semester}`;
        } else {
            studentGrade = '—';
        }
    } else {
        studentGrade = '—';
    }
}
```

### School Display Logic:
The code has a fallback hierarchy for displaying the school/college name:

1. **Priority 1**: `students.college_school_name` (direct column)
2. **Priority 2**: `organizations.name` (via school_id or college_id relationship)
3. **Fallback**: "—"

```javascript
// Get institution name - prioritize direct column, then relationships
let institutionName = '—';
let schoolName = '—';

// Priority 1: Use college_school_name from students table (direct column)
if (studentData.college_school_name && studentData.college_school_name !== '—') {
    institutionName = toTitleCase(studentData.college_school_name);
    schoolName = toTitleCase(studentData.college_school_name);
}
// Priority 2: Fallback to organizations table relationships
else {
    institutionName = studentData.schools?.name || studentData.colleges?.name || '—';
    schoolName = studentData.schools?.name || '—';
}
```

## Expected Behavior After Fix

### For School Students (Grades 6-12):
- **Grade**: Shows actual grade from `students.grade` or `school_classes.grade`
- **School**: Shows school name from `college_school_name` or `organizations.name`

### For College Students:
- **Grade/Course**: Shows "Year X" or "Semester X" or course name
- **College**: Shows college name from `college_school_name` or `organizations.name`

## Testing

### Before Fix:
- ❌ Grade shows "—"
- ❌ School shows "—"
- ❌ Missing student information in report header

### After Fix:
- ✅ Grade shows correct value (e.g., "11", "Year 2", "Semester 4")
- ✅ School/College shows correct institution name
- ✅ Complete student information in report header

## Database Fields Used

### students table:
- `grade` - Student's grade/class (e.g., "11", "12", "9th")
- `year` - College year (1, 2, 3, 4) - **NOW INCLUDED**
- `semester` - College semester (1-8)
- `college_school_name` - Direct institution name
- `school_id` - Foreign key to organizations table
- `college_id` - Foreign key to organizations table
- `school_class_id` - Foreign key to school_classes table

### school_classes table:
- `grade` - Class grade (fallback if students.grade is empty)

### organizations table:
- `name` - Institution name (school or college)

## Related Components

### ReportHeader Component
**File**: `src/features/assessment/assessment-result/components/ReportHeader.jsx`

This component displays the student information and uses the data from `studentInfo`:
- `studentInfo.grade` - Displays in "Grade" or "Course" field
- `studentInfo.school` or `studentInfo.college` - Displays in "School" or "College" field

The component automatically adjusts labels based on grade level:
- Middle/High School: Shows "Grade" and "School"
- College: Shows "Course" and "College"

---

**Fix Date**: January 18, 2026
**Issue**: Grade and School not displaying on results page
**Status**: ✅ Fixed
**Branch**: `fix/Assigment-Evaluation`
