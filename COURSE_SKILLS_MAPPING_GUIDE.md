# Course to Skills Mapping Guide

## Overview
This system automatically maps completed courses (both internal and external) to student skills and trainings using database triggers.

## Database Structure

### Modified Tables
1. **trainings** - Added `course_id` and `source` columns
2. **course_enrollments** - Added `training_id`, `skills_acquired`, `certificate_url`, `grade`
3. **external_courses** - New table for external course tracking (Coursera, Udemy, etc.)

### Automatic Flow
```
Internal Course: course_enrollments (completed) → trainings → skills (auto-created)
External Course: external_courses (completed) → trainings → skills (auto-created)
```

## Usage Examples

### 1. Student Completes Internal Course

When a student completes an internal course, just update the enrollment:

```sql
-- Mark course as completed with skills
UPDATE course_enrollments
SET 
  completed_at = NOW(),
  progress = 100,
  status = 'completed',
  grade = 'A',
  skills_acquired = '["React", "TypeScript", "Node.js"]'::jsonb
WHERE student_id = 'student-uuid' 
  AND course_id = 'course-uuid';

-- Training record and skills are AUTOMATICALLY created by trigger!
```

### 2. Student Adds External Course (Coursera, Udemy, etc.)

```sql
-- Insert external course completion
INSERT INTO external_courses (
  student_id,
  course_name,
  organization,
  start_date,
  completion_date,
  certificate_url,
  skills_acquired
) VALUES (
  'student-uuid',
  'Machine Learning Specialization',
  'Coursera',
  '2024-01-01',
  '2024-04-01',
  'https://coursera.org/certificate/xyz',
  '["Python", "Machine Learning", "TensorFlow"]'::jsonb
);

-- Training record and skills are AUTOMATICALLY created by trigger!
```

### 3. Query Student Skills from Courses

```sql
-- Get all skills acquired from courses
SELECT 
  s.name as skill_name,
  s.level,
  s.verified,
  t.title as training_title,
  t.organization,
  t.source,
  t.start_date,
  t.end_date
FROM skills s
JOIN trainings t ON s.training_id = t.id
WHERE s.student_id = 'student-uuid'
  AND t.source IN ('internal_course', 'external_course')
ORDER BY t.end_date DESC;
```

### 4. Get Course Completion Summary

```sql
-- Internal courses completed
SELECT 
  ce.course_title,
  ce.completed_at,
  ce.grade,
  ce.skills_acquired,
  t.id as training_id
FROM course_enrollments ce
LEFT JOIN trainings t ON ce.training_id = t.id
WHERE ce.student_id = 'student-uuid'
  AND ce.completed_at IS NOT NULL;

-- External courses completed
SELECT 
  ec.course_name,
  ec.organization,
  ec.completion_date,
  ec.certificate_url,
  ec.skills_acquired,
  t.id as training_id
FROM external_courses ec
LEFT JOIN trainings t ON ec.training_id = t.id
WHERE ec.student_id = 'student-uuid';
```

### 5. Get All Training Sources

```sql
-- Summary by source
SELECT 
  source,
  COUNT(*) as total_trainings,
  COUNT(DISTINCT student_id) as unique_students
FROM trainings
WHERE status = 'completed'
GROUP BY source;
```

## Frontend Integration

### Add External Course Form

```typescript
interface ExternalCourseForm {
  courseName: string;
  organization: string; // Coursera, Udemy, LinkedIn Learning, etc.
  courseUrl?: string;
  startDate: Date;
  completionDate: Date;
  certificateUrl?: string;
  grade?: string;
  skillsAcquired: string[]; // Array of skill names
}

// API call
async function addExternalCourse(studentId: string, data: ExternalCourseForm) {
  const { data: course, error } = await supabase
    .from('external_courses')
    .insert({
      student_id: studentId,
      course_name: data.courseName,
      organization: data.organization,
      course_url: data.courseUrl,
      start_date: data.startDate,
      completion_date: data.completionDate,
      certificate_url: data.certificateUrl,
      grade: data.grade,
      skills_acquired: data.skillsAcquired
    })
    .select()
    .single();
  
  // Skills are automatically created!
  return course;
}
```

### Mark Internal Course Complete

```typescript
async function completeCourse(
  studentId: string, 
  courseId: string, 
  skillsAcquired: string[],
  grade?: string
) {
  const { data, error } = await supabase
    .from('course_enrollments')
    .update({
      completed_at: new Date().toISOString(),
      progress: 100,
      status: 'completed',
      grade: grade,
      skills_acquired: skillsAcquired
    })
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .select()
    .single();
  
  // Training and skills are automatically created!
  return data;
}
```

### Display Student Skills by Source

```typescript
async function getStudentSkillsBySource(studentId: string) {
  const { data, error } = await supabase
    .from('skills')
    .select(`
      *,
      trainings (
        title,
        organization,
        source,
        start_date,
        end_date,
        course_id
      )
    `)
    .eq('student_id', studentId)
    .not('training_id', 'is', null);
  
  // Group by source
  const grouped = data?.reduce((acc, skill) => {
    const source = skill.trainings?.source || 'manual';
    if (!acc[source]) acc[source] = [];
    acc[source].push(skill);
    return acc;
  }, {} as Record<string, any[]>);
  
  return grouped;
}
```

## Benefits

1. **Automatic Skill Creation** - Skills are auto-created when courses are completed via database triggers
2. **Unified Tracking** - Both internal and external courses in one system
3. **Verified Skills** - Course-based skills are auto-verified and approved
4. **Audit Trail** - Complete history of skill acquisition through trainings table
5. **Flexible** - Supports any course source (internal, Coursera, Udemy, certifications, MOOCs)
6. **No Duplicate Code** - Uses existing tables (course_enrollments, trainings, skills)

## Apply Migration

```bash
# Using Supabase CLI
supabase db push

# Or apply directly via SQL editor in Supabase dashboard
# Copy contents of database/migrations/course_training_skills_mapping.sql
```

## Supported External Course Providers

- Coursera
- Udemy
- LinkedIn Learning
- edX
- Khan Academy
- Pluralsight
- Codecademy
- FreeCodeCamp
- Any other online learning platform

## Notes

- Skills are created with `level: 3` (intermediate) by default
- Skills are auto-verified (`verified: true`) and auto-approved (`approval_status: 'approved'`)
- The `skills_acquired` field is a JSONB array of skill names: `["React", "TypeScript"]`
- Triggers only fire when `completed_at` or `completion_date` is set
- Training records are created automatically - no manual intervention needed
