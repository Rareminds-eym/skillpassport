# Learning Courses Implementation Guide

## Overview
This system handles two types of learning:
1. **Internal Platform Courses** - Automatically tracked from `course_enrollments`
2. **External Platform Courses** - Manually added with skill assessment

## Database Flow

### 1. Internal Platform Courses (Automatic)

When a student completes a course on your platform:

```sql
-- Step 1: Course enrollment is marked complete
UPDATE course_enrollments
SET 
  completed_at = NOW(),
  progress = 100,
  status = 'completed',
  skills_acquired = '["React", "TypeScript", "Node.js"]'::jsonb
WHERE student_id = 'student-uuid' AND course_id = 'course-uuid';

-- Step 2: Database trigger automatically creates:
-- a) Training record in trainings table
-- b) Skills records in skills table (one per skill)
```

**Trigger Flow:**
```
course_enrollments (completed) 
  → Trigger: create_skills_from_internal_course()
    → Creates trainings record (source: 'internal_course')
    → Creates skills records (verified: true, approved)
```

### 2. External Platform Courses (Manual)

When a student adds an external course:

```sql
-- Step 1: Student fills form and submits
INSERT INTO external_courses (
  student_id,
  course_name,
  organization,
  completion_date,
  certificate_url,
  skills_acquired
) VALUES (...);

-- Step 2: Database trigger automatically creates:
-- a) Training record in trainings table
-- b) Skills records in skills table
```

**Trigger Flow:**
```
external_courses (inserted) 
  → Trigger: create_skills_from_external_course()
    → Creates trainings record (source: 'external_course')
    → Creates skills records (verified: true, approved)
```

## Assessment Levels

### Certificate Levels Based on Assessment Score

| Score Range | Level | Badge Color |
|------------|-------|-------------|
| 85-100% | Expert | Red |
| 70-84% | Advanced | Purple |
| 50-69% | Intermediate | Blue |
| 0-49% | Beginner | Yellow |

### Assessment Questions

For external courses, generate 5 questions based on skills:

```javascript
const questions = skills.map((skill, idx) => ({
  id: idx + 1,
  skill,
  question: `Rate your proficiency in ${skill}`,
  type: 'scale',
  options: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
}));
```

**Score Calculation:**
- Beginner = 25 points
- Intermediate = 50 points
- Advanced = 75 points
- Expert = 100 points

Average score determines certificate level.

## Frontend Implementation

### Display Learning Records

```javascript
// Fetch learning data
const { learning, loading, error, refresh } = useStudentLearning(studentId);

// Display with progress
learning.map(record => ({
  title: record.course,
  provider: record.provider,
  progress: record.progress, // Auto-calculated from modules
  skills: record.skills, // From skills table
  certificateUrl: record.certificateUrl, // From certificates table
  status: record.status // 'completed' or 'ongoing'
}))
```

### Progress Calculation

Progress is automatically calculated:

```javascript
// If status is 'completed'
progress = 100%

// If status is 'ongoing' and has modules
progress = (completed_modules / total_modules) * 100

// Otherwise
progress = 0%
```

## UI Components

### 1. Learning Page (`/student/my-learning`)

**Features:**
- Stats cards (Total Learning, Completed, In Progress)
- Grid of learning cards with:
  - Course title and provider
  - Status badge (Completed/Ongoing)
  - Certificate level badge (if applicable)
  - Progress bar
  - Skills list
  - Certificate link

### 2. Add Learning Modal

**For External Courses:**
- Course name (required)
- Provider (Coursera, Udemy, etc.)
- Organization
- Start/End dates
- Status (Ongoing/Completed)
- Modules completed/total
- Hours spent
- Certificate URL
- Skills covered (comma-separated)
- Description

**Assessment Flow:**
1. Student fills form
2. If external provider + certificate URL → Show assessment
3. Student rates proficiency in each skill
4. Calculate score and assign level
5. Create records with level

### 3. Learning Cards Display

```jsx
<Card>
  <CardHeader>
    <Title>{course}</Title>
    <Provider>{provider}</Provider>
    <Badges>
      <StatusBadge status={status} />
      <LevelBadge level={certificateLevel} />
    </Badges>
  </CardHeader>
  
  <CardContent>
    <Description>{description}</Description>
    
    <Stats>
      <Modules>{completed}/{total}</Modules>
      <Hours>{hours_spent}h</Hours>
      <DateRange>{start} - {end}</DateRange>
    </Stats>
    
    <ProgressBar value={progress} />
    
    <Skills>
      {skills.map(skill => <Badge>{skill}</Badge>)}
    </Skills>
    
    {certificateUrl && (
      <CertificateLink href={certificateUrl} />
    )}
  </CardContent>
</Card>
```

## API Endpoints

### Add External Course

```javascript
POST /api/external-courses

{
  student_id: "uuid",
  course_name: "Machine Learning Specialization",
  organization: "Coursera",
  start_date: "2024-01-01",
  completion_date: "2024-04-01",
  certificate_url: "https://...",
  skills_acquired: ["Python", "ML", "TensorFlow"],
  assessment_score: 85, // Optional
  certificate_level: "Expert" // Optional
}

// Response: Training and skills auto-created
```

### Mark Internal Course Complete

```javascript
PUT /api/course-enrollments/:id

{
  completed_at: "2024-04-01T10:00:00Z",
  progress: 100,
  status: "completed",
  skills_acquired: ["React", "TypeScript"],
  grade: "A"
}

// Response: Training and skills auto-created
```

## Known Organizations (No Assessment Required)

These platforms are trusted and don't require assessment:
- Coursera
- Udemy
- edX
- LinkedIn Learning
- Pluralsight
- Udacity
- Khan Academy
- FreeCodeCamp
- Codecademy

For unknown organizations, assessment is required.

## Database Tables

### trainings
- Stores all learning records
- `source`: 'internal_course', 'external_course', 'manual'
- `course_id`: Links to internal courses (nullable)

### external_courses
- Stores external course details
- `training_id`: Links to trainings table
- `skills_acquired`: JSONB array

### course_enrollments
- Tracks internal course progress
- `training_id`: Links to trainings table
- `skills_acquired`: JSONB array

### skills
- Individual skill records
- `training_id`: Links to trainings table
- Auto-created by triggers

### certificates
- Certificate records
- `training_id`: Links to trainings table
- `level`: Assessment level (Beginner/Intermediate/Advanced/Expert)

## Migration Status

✅ **Applied:**
- Extended `trainings` table with `course_id` and `source`
- Extended `course_enrollments` with `training_id` and `skills_acquired`
- Created `external_courses` table
- Created triggers for automatic skill creation

⏳ **To Apply:**
Run the migration:
```bash
psql -h your-db-host -U postgres -d your-db < database/migrations/course_training_skills_mapping.sql
```

Or via Supabase dashboard SQL editor.

## Testing Checklist

- [ ] Add external course (Coursera) - no assessment
- [ ] Add external course (unknown provider) - with assessment
- [ ] Complete internal course - auto-creates training
- [ ] View learning page - shows all records
- [ ] Progress bars calculate correctly
- [ ] Skills display from skills table
- [ ] Certificate links work
- [ ] Assessment levels display correctly
- [ ] Edit learning records
- [ ] Filter by status (completed/ongoing)

## Future Enhancements

1. **Bulk Import** - Import multiple courses from CSV
2. **Course Recommendations** - AI-based suggestions
3. **Learning Paths** - Group related courses
4. **Peer Verification** - Let peers verify skills
5. **Skill Endorsements** - LinkedIn-style endorsements
6. **Learning Analytics** - Time spent, completion rates
7. **Certificates Gallery** - Visual certificate showcase
8. **Learning Streaks** - Gamification
9. **Course Reviews** - Rate external courses
10. **Integration APIs** - Auto-sync from Coursera, Udemy APIs
