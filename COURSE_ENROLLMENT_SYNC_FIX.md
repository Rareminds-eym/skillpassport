# Course Enrollment to Learning Sync Fix

## Problem
When students enrolled in internal platform courses (like "BlockChain Basics"), the enrollment was recorded in `course_enrollments` table but NOT in the `trainings` table. This caused enrolled courses to not show up in the "My Learning" section.

## Solution

### 1. Updated Enrollment Handler
Modified `SelectCourseModal.jsx` to create records in BOTH tables when enrolling:
- `course_enrollments` - tracks enrollment status
- `trainings` - shows in "My Learning" section

### 2. Sync Existing Enrollments
Run the SQL script to sync existing enrollments:

```bash
# Using Supabase CLI
supabase db execute < sync-enrollments-to-trainings.sql

# Or run directly in Supabase SQL Editor
```

The script:
- Finds all enrollments without corresponding training records
- Creates training records for them
- Preserves enrollment dates and status
- Marks them as approved so they show immediately

## How It Works Now

### When Student Enrolls in Internal Course:
1. Creates `course_enrollments` record (for tracking)
2. Creates `trainings` record (for My Learning display)
3. Both records linked by student_id and course title
4. Training auto-approved and enabled

### Data Flow:
```
Internal Course Enrollment
    ↓
course_enrollments table (enrollment tracking)
    ↓
trainings table (My Learning display)
    ↓
My Learning page shows the course
```

### External Course Flow:
```
External Course (Coursera, Udemy, etc.)
    ↓
trainings table only
    ↓
Optional assessment for skill verification
    ↓
My Learning page shows the course
```

## Tables Structure

### course_enrollments
- Tracks enrollment in internal platform courses
- Links to `courses` table via `course_id`
- Has progress tracking

### trainings
- Universal learning record table
- Shows ALL learning (internal + external)
- Displayed in "My Learning" section
- Can have associated skills and certificates

## Verification

After the fix, check:
1. Enroll in an internal course → Should appear in My Learning immediately
2. Check both tables have records:
```sql
SELECT * FROM course_enrollments WHERE student_id = 'your-id';
SELECT * FROM trainings WHERE student_id = 'your-id';
```

## UI Changes

### SelectCourseModal
- Shows "Enrolled Courses" section (green background)
- Shows "Available Courses" section
- Enrolled courses display "Enrolled" badge
- Can't re-enroll in already enrolled courses

### My Learning Page
- Shows all trainings (internal + external)
- Displays progress, skills, certificates
- Works with both course types seamlessly
