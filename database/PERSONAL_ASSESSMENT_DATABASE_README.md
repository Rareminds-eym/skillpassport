# Personal Assessment Database System

## Overview
Complete database schema for multi-grade level career assessments supporting:
- **Middle School (Grades 6-8)** - 20 questions, 3 sections, 15-20 minutes
- **High School (Grades 9-12)** - 32 questions, 4 sections, 30-40 minutes
- **After 12th (College/University)** - Comprehensive assessment, 6 sections, 45-60 minutes

## Database Schema Files

### 1. `personal_assessment_schema_complete.sql`
Main schema file containing all table definitions, indexes, triggers, and RLS policies.

### 2. `personal_assessment_sample_data.sql`
Sample data inserts for Middle School and High School assessments.

---

## Table Structure

### Core Tables

#### 1. **personal_assessment_streams**
Defines grade levels and educational streams.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Stream identifier (e.g., 'middle_school', 'high_school', 'cs', 'bca') |
| name | TEXT | Display name |
| grade_level | TEXT | 'middle', 'highschool', or 'after12' |
| is_active | BOOLEAN | Stream availability |

**Example Records:**
```sql
('middle_school', 'Grades 6-8', 'middle')
('high_school', 'Grades 9-12', 'highschool')
('cs', 'B.Sc Computer Science', 'after12')
```

---

#### 2. **personal_assessment_sections**
Assessment sections for each grade level.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Section identifier |
| name | TEXT | Unique section name |
| title | TEXT | Display title |
| grade_level | TEXT | Target grade level |
| is_stream_specific | BOOLEAN | True for knowledge/aptitude sections |
| is_timed | BOOLEAN | Whether section has time limit |
| time_limit_seconds | INTEGER | Time limit (if timed) |
| order_number | INTEGER | Display order |

**Middle School Sections:**
1. Interest Explorer (RIASEC-style)
2. Strengths & Character (VIA-style)
3. Learning & Work Preferences

**High School Sections:**
1. Interest Explorer (detailed RIASEC)
2. Strengths & Character (teen language)
3. Learning & Work Preferences
4. Aptitude Sampling (mini-tasks)

**After 12th Sections:**
1. Career Interests (RIASEC - 48 items)
2. Big Five Personality
3. Work Values
4. Employability Skills
5. Multi-Aptitude (timed)
6. Stream Knowledge (timed, stream-specific)

---

#### 3. **personal_assessment_questions**
All assessment questions across all sections.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Question identifier |
| section_id | UUID (FK) | References sections table |
| stream_id | TEXT (FK) | NULL for general, specific for knowledge section |
| text | TEXT | Question text |
| question_type | TEXT | 'rating', 'multiselect', 'singleselect', 'mcq', 'text', 'sjt' |
| options | JSONB | Array of options for choice questions |
| max_selections | INTEGER | For multiselect: how many to pick |
| category_mapping | JSONB | RIASEC mapping: {"option": "R", ...} |
| strength_type | TEXT | For strengths questions |
| task_type | TEXT | For aptitude questions |
| correct_answer | TEXT | For MCQ questions |

**Question Type Examples:**

```json
// Rating Question
{
  "text": "I get curious and ask lots of 'why/how' questions.",
  "question_type": "rating",
  "strength_type": "Curiosity"
}

// Multiselect Question
{
  "text": "Which activities would you enjoy most? (pick 2)",
  "question_type": "multiselect",
  "max_selections": 2,
  "options": ["Option 1", "Option 2", "Option 3"],
  "category_mapping": {"Option 1": "R", "Option 2": "A"}
}

// Text Question
{
  "text": "Describe a challenge you overcame.",
  "question_type": "text",
  "placeholder": "Share your experience..."
}
```

---

#### 4. **personal_assessment_attempts**
Tracks individual student assessment attempts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Attempt identifier |
| student_id | TEXT | Student user ID |
| stream_id | TEXT | Selected stream |
| grade_level | TEXT | Assessment grade level |
| status | TEXT | 'in_progress', 'completed', 'abandoned' |
| current_section_index | INTEGER | Progress tracking |
| current_question_index | INTEGER | Progress tracking |
| timer_remaining | INTEGER | Seconds remaining (timed sections) |
| elapsed_time | INTEGER | Total time spent |
| section_timings | JSONB | Array of timing data per section |
| raw_scores | JSONB | Calculated scores |
| analysis_result | JSONB | AI analysis from Gemini |

**Section Timings Format:**
```json
[
  {
    "sectionIndex": 0,
    "startTime": "2025-01-15T10:00:00Z",
    "endTime": "2025-01-15T10:12:30Z",
    "timeSpent": 750
  }
]
```

---

#### 5. **personal_assessment_responses**
Individual question responses.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Response identifier |
| attempt_id | UUID (FK) | References attempts |
| question_id | UUID (FK) | References questions |
| response_value | JSONB | Polymorphic response data |
| is_correct | BOOLEAN | For MCQ questions |
| time_taken | INTEGER | Seconds taken to answer |

**Response Value Examples:**
```json
// Rating: Number
4

// Multiselect: Array
["Option 1", "Option 2"]

// Singleselect: String
"Option 3"

// Text: String
"My detailed response here..."

// SJT: Object
{"best": "Option A", "worst": "Option D"}
```

---

#### 6. **personal_assessment_results**
Processed and analyzed results.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Result identifier |
| attempt_id | UUID (FK) | One-to-one with attempt |
| student_id | TEXT | Student user ID |
| grade_level | TEXT | Assessment grade level |
| riasec_scores | JSONB | RIASEC scores for all levels |
| top_interests | TEXT[] | Top 3 RIASEC codes |
| strengths_scores | JSONB | VIA strengths scores |
| learning_styles | TEXT[] | Preferred learning methods |
| aptitude_scores | JSONB | Aptitude task scores (high school) |
| gemini_analysis | JSONB | Full AI analysis |
| career_recommendations | TEXT[] | Suggested careers |

**RIASEC Scores Format:**
```json
{
  "R": 12,  // Realistic
  "I": 15,  // Investigative
  "A": 8,   // Artistic
  "S": 10,  // Social
  "E": 7,   // Enterprising
  "C": 5    // Conventional
}
```

---

#### 7. **personal_assessment_restrictions**
90-day restriction to prevent frequent retakes.

| Column | Type | Description |
|--------|------|-------------|
| student_id | TEXT | Student user ID |
| grade_level | TEXT | Assessment grade level |
| last_attempt_date | TIMESTAMP | Last completion date |
| next_allowed_date | TIMESTAMP | When can retake (90 days later) |

---

## Data Flow

### 1. Assessment Start
```sql
-- Student selects grade level and stream
-- Check if allowed to take assessment
SELECT can_take_assessment('student_123', 'middle');

-- Create new attempt
INSERT INTO personal_assessment_attempts (student_id, stream_id, grade_level, status)
VALUES ('student_123', 'middle_school', 'middle', 'in_progress');
```

### 2. Load Questions
```sql
-- Get sections for grade level
SELECT * FROM personal_assessment_sections
WHERE grade_level = 'middle' AND is_active = true
ORDER BY order_number;

-- Get questions for each section
SELECT * FROM personal_assessment_questions
WHERE section_id = 'section_uuid' AND is_active = true
ORDER BY order_number;
```

### 3. Save Progress
```sql
-- Save individual response
INSERT INTO personal_assessment_responses (attempt_id, question_id, response_value)
VALUES ('attempt_uuid', 'question_uuid', '4'::jsonb)
ON CONFLICT (attempt_id, question_id) DO UPDATE
SET response_value = EXCLUDED.response_value;

-- Update attempt progress
UPDATE personal_assessment_attempts
SET current_section_index = 1,
    current_question_index = 5,
    elapsed_time = 300
WHERE id = 'attempt_uuid';
```

### 4. Complete Assessment
```sql
-- Mark as completed
UPDATE personal_assessment_attempts
SET status = 'completed',
    completed_at = NOW(),
    raw_scores = '{"R": 12, "I": 15, ...}'::jsonb
WHERE id = 'attempt_uuid';

-- Trigger automatically creates 90-day restriction
-- Insert results
INSERT INTO personal_assessment_results (...)
VALUES (...);
```

---

## Row Level Security (RLS)

### Key Policies

**Students can:**
- ✅ View active streams and sections
- ✅ View active questions
- ✅ Create their own attempts
- ✅ View/update their own attempts
- ✅ Save responses to their attempts
- ✅ View their own results

**Students cannot:**
- ❌ View other students' attempts/responses
- ❌ Modify section/question data
- ❌ Bypass the 90-day restriction

---

## Helper Functions

### `can_take_assessment(student_id, grade_level)`
Checks if student is allowed to take assessment based on 90-day restriction.

```sql
SELECT can_take_assessment('student_123', 'middle');
-- Returns: true/false
```

### Auto-Trigger: `create_assessment_restriction()`
Automatically creates restriction when assessment is completed.

---

## API Integration

The frontend uses `assessmentService.js` which provides:

```javascript
// Fetch sections and questions
await fetchSections()
await fetchQuestionsBySection(sectionId, streamId)

// Create and manage attempts
await createAttempt(studentId, streamId)
await updateAttemptProgress(attemptId, progress)

// Save responses
await saveResponse(attemptId, questionId, responseValue)

// Get results
await getAttemptById(attemptId)
await getStudentResults(studentId)
```

---

## Setup Instructions

### Option A: Fresh Installation (New Database)

#### 1. Run Complete Schema Creation
```bash
psql -d your_database < personal_assessment_schema_complete.sql
```

#### 2. Populate Sample Data
```bash
psql -d your_database < personal_assessment_sample_data.sql
```

#### 3. Verify Installation
```sql
-- Check sections
SELECT grade_level, COUNT(*) FROM personal_assessment_sections GROUP BY grade_level;

-- Check questions
SELECT s.title, COUNT(q.id)
FROM personal_assessment_sections s
LEFT JOIN personal_assessment_questions q ON s.id = q.section_id
GROUP BY s.title;
```

---

### Option B: Existing Database (Migration)

If you already have the "After 12th" assessment system running:

#### 1. Run Migration Script First
```bash
psql -d your_database < personal_assessment_migration.sql
```

**What the migration does:**
- ✅ Adds `grade_level` column to existing tables
- ✅ Creates new tables (streams, restrictions, response_scales)
- ✅ Adds helper functions for 90-day restriction
- ✅ Sets all existing data to 'after12' grade level
- ✅ Safe to run multiple times (idempotent)
- ✅ Does NOT affect existing "After 12th" assessments

#### 2. Populate Sample Data
```bash
psql -d your_database < personal_assessment_sample_data.sql
```

#### 3. Verify Migration
```sql
-- Check all grade levels are present
SELECT grade_level, COUNT(*) as section_count
FROM personal_assessment_sections
GROUP BY grade_level
ORDER BY grade_level;

-- Expected output:
-- after12     | 6
-- highschool  | 4
-- middle      | 3

-- Check streams
SELECT * FROM personal_assessment_streams ORDER BY display_order;

-- Verify existing attempts are preserved
SELECT grade_level, status, COUNT(*)
FROM personal_assessment_attempts
GROUP BY grade_level, status;
```

---

## Grade Level Differences

### Middle School (Grades 6-8)
- **Sections**: 3 (Interest, Strengths, Learning)
- **Questions**: 20 total
- **Duration**: 15-20 minutes
- **Language**: Kid-friendly, simple
- **Focus**: Basic interest exploration and self-awareness

### High School (Grades 9-12)
- **Sections**: 4 (Interest, Strengths, Learning, Aptitude)
- **Questions**: 32 total
- **Duration**: 30-40 minutes
- **Language**: Teen-appropriate, honest
- **Focus**: Detailed interests, strengths, and aptitude sampling

### After 12th (College/University)
- **Sections**: 6 (RIASEC, Big Five, Values, Employability, Aptitude, Knowledge)
- **Questions**: 100+ total
- **Duration**: 45-60 minutes
- **Language**: Professional, comprehensive
- **Focus**: Career readiness, comprehensive profiling

---

## Indexes for Performance

All tables have appropriate indexes on:
- Foreign keys (student_id, attempt_id, section_id, question_id)
- Frequently queried columns (grade_level, status, is_active)
- Timestamp columns for time-based queries

---

## Maintenance

### Add New Questions
```sql
INSERT INTO personal_assessment_questions (
  section_id, text, question_type, options, order_number
)
SELECT id, 'New question text', 'multiselect',
       '["Option 1", "Option 2"]'::jsonb,
       MAX(order_number) + 1
FROM personal_assessment_sections
WHERE name = 'section_name';
```

### Deactivate Old Assessments
```sql
UPDATE personal_assessment_sections
SET is_active = false
WHERE created_at < NOW() - INTERVAL '1 year';
```

---

## Support

For questions or issues with the database schema, refer to:
- Schema file: `personal_assessment_schema_complete.sql`
- Sample data: `personal_assessment_sample_data.sql`
- Frontend service: `src/services/assessmentService.js`
