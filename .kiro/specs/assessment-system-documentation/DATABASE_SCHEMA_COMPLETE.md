# Complete Assessment System Database Schema

> **Direct database schema documentation from Supabase**

---

## 📊 All Assessment-Related Tables

### 1. `personal_assessment_results` ⭐ MAIN RESULTS TABLE
**Purpose**: Stores final analyzed results and AI-generated insights for career assessments

**Complete Schema** (from database):
```
Column Name                  | Type          | Nullable | Default
----------------------------|---------------|----------|------------------
id                          | uuid          | NO       | gen_random_uuid()
attempt_id                  | uuid          | NO       | -
student_id                  | uuid          | NO       | -
stream_id                   | varchar       | NO       | -
grade_level                 | text          | NO       | 'after12'
status                      | enum          | YES      | 'pending'

-- RIASEC (Interest Assessment)
riasec_scores               | jsonb         | YES      | null
riasec_code                 | varchar       | YES      | null

-- Aptitude (Cognitive Abilities)
aptitude_scores             | jsonb         | YES      | null
aptitude_overall            | numeric       | YES      | null

-- Personality (Big Five)
bigfive_scores              | jsonb         | YES      | null

-- Work Values
work_values_scores          | jsonb         | YES      | null

-- Employability
employability_scores        | jsonb         | YES      | null
employability_readiness     | varchar       | YES      | null

-- Knowledge Test
knowledge_score             | numeric       | YES      | null
knowledge_details           | jsonb         | YES      | null

-- AI-Generated Insights 🤖
career_fit                  | jsonb         | YES      | null
skill_gap                   | jsonb         | YES      | null
skill_gap_courses           | jsonb         | YES      | null
roadmap                     | jsonb         | YES      | null
profile_snapshot            | jsonb         | YES      | null
timing_analysis             | jsonb         | YES      | null
final_note                  | jsonb         | YES      | null
overall_summary             | text          | YES      | null
gemini_results              | jsonb         | YES      | null

-- Metadata
created_at                  | timestamptz   | YES      | now()
updated_at                  | timestamptz   | YES      | now()
```

**Key Points**:
- ✅ Stores ALL AI-generated analysis
- ✅ Includes scores, recommendations, career clusters, skill gaps, roadmap
- ✅ `gemini_results` contains the COMPLETE AI response
- ✅ Results persist forever (not deleted on retake)

---

### 2. `personal_assessment_attempts`
**Purpose**: Tracks assessment progress and stores student responses

**Complete Schema** (from database):
```
Column Name                     | Type          | Nullable | Default
-------------------------------|---------------|----------|------------------
id                             | uuid          | NO       | gen_random_uuid()
student_id                     | uuid          | NO       | -
stream_id                      | varchar       | NO       | -
grade_level                    | text          | NO       | 'after12'
status                         | varchar       | YES      | 'in_progress'

-- Progress Tracking
current_section_index          | integer       | YES      | 0
current_question_index         | integer       | YES      | 0
timer_remaining                | integer       | YES      | null
elapsed_time                   | integer       | YES      | 0

-- Response Data
all_responses                  | jsonb         | YES      | '{}'
aptitude_scores                | jsonb         | YES      | null
knowledge_scores               | jsonb         | YES      | null

-- Adaptive Assessment
adaptive_aptitude_session_id   | uuid          | YES      | null

-- Timing
section_timings                | jsonb         | YES      | '{}'
started_at                     | timestamptz   | YES      | now()
completed_at                   | timestamptz   | YES      | null
created_at                     | timestamptz   | YES      | now()
updated_at                     | timestamptz   | YES      | now()
```

**Key Points**:
- ✅ Tracks real-time assessment progress
- ✅ Stores all student responses in `all_responses`
- ✅ Supports resume functionality (saves progress)
- ✅ Links to results via `attempt_id`

---

### 3. `career_assessment_ai_questions`
**Purpose**: Stores AI-generated questions for personalized assessments

**Complete Schema** (from database):
```
Column Name      | Type          | Nullable | Default
----------------|---------------|----------|------------------
id              | uuid          | NO       | gen_random_uuid()
stream_id       | varchar       | NO       | -
question_type   | varchar       | NO       | -
category        | varchar       | YES      | null
questions       | jsonb         | NO       | -
student_id      | uuid          | YES      | null
attempt_id      | uuid          | YES      | null
is_active       | boolean       | YES      | true
generated_at    | timestamptz   | YES      | now()
created_at      | timestamptz   | YES      | now()
updated_at      | timestamptz   | YES      | now()
```

**Key Points**:
- ✅ Stores AI-generated questions (from OpenRouter/Claude)
- ✅ Can be personalized per student (`student_id`)
- ✅ Linked to specific attempt (`attempt_id`)
- ✅ Questions stored as JSONB array

**Example `questions` JSONB**:
```json
[
  {
    "id": "q1",
    "text": "What is your favorite activity?",
    "options": ["A", "B", "C", "D"],
    "type": "riasec",
    "category": "Realistic"
  }
]
```

---

### 4. `adaptive_aptitude_questions_cache`
**Purpose**: Caches adaptive aptitude questions for reuse

**Complete Schema** (from database):
```
Column Name      | Type          | Nullable | Default
----------------|---------------|----------|------------------
id              | uuid          | NO       | gen_random_uuid()
question_id     | text          | NO       | -
text            | text          | NO       | -
options         | jsonb         | NO       | -
correct_answer  | char          | NO       | -
difficulty      | smallint      | NO       | -
subtag          | enum          | NO       | -
grade_level     | enum          | NO       | -
phase           | enum          | NO       | -
explanation     | text          | YES      | null
usage_count     | integer       | NO       | 0
is_active       | boolean       | NO       | true
created_at      | timestamptz   | NO       | now()
last_used_at    | timestamptz   | YES      | null
```

**Key Points**:
- ✅ Pre-generated aptitude questions
- ✅ Difficulty levels (1-5)
- ✅ Tracks usage count
- ✅ Supports adaptive testing (difficulty adjustment)

**Example `options` JSONB**:
```json
{
  "A": "Option A text",
  "B": "Option B text",
  "C": "Option C text",
  "D": "Option D text"
}
```

---

### 5. `external_assessment_attempts`
**Purpose**: Tracks external course/certificate assessments

**Complete Schema** (from database):
```
Column Name              | Type          | Nullable | Default
------------------------|---------------|----------|------------------
id                      | uuid          | NO       | uuid_generate_v4()
student_id              | uuid          | NO       | -
course_name             | text          | NO       | -
course_id               | uuid          | YES      | null
assessment_level        | text          | NO       | -
status                  | text          | YES      | 'in_progress'

-- Questions & Answers
total_questions         | integer       | NO       | 15
questions               | jsonb         | NO       | -
student_answers         | jsonb         | NO       | -
current_question_index  | integer       | YES      | 0

-- Scoring
score                   | integer       | YES      | null
correct_answers         | integer       | YES      | null
difficulty_breakdown    | jsonb         | YES      | null

-- Timing
time_taken              | integer       | YES      | null
time_remaining          | integer       | YES      | 900
started_at              | timestamptz   | NO       | now()
completed_at            | timestamptz   | YES      | now()
last_activity_at        | timestamptz   | YES      | now()
created_at              | timestamptz   | YES      | now()
updated_at              | timestamptz   | YES      | now()
```

**Key Points**:
- ✅ Separate from career assessments
- ✅ Used for external course certifications
- ✅ 15 questions per assessment
- ✅ 15-minute time limit (900 seconds)

---

### 6. `generated_external_assessment`
**Purpose**: Stores pre-generated external assessment questions

**Complete Schema** (from database):
```
Column Name         | Type          | Nullable | Default
-------------------|---------------|----------|------------------
id                 | uuid          | NO       | uuid_generate_v4()
certificate_name   | text          | NO       | -
course_id          | uuid          | YES      | null
assessment_level   | text          | NO       | 'Intermediate'
total_questions    | integer       | NO       | 15
questions          | jsonb         | NO       | -
version            | integer       | YES      | 1
generated_at       | timestamptz   | NO       | now()
generated_by       | text          | YES      | null
```

**Key Points**:
- ✅ Pre-generated questions for external courses
- ✅ Versioned (can have multiple versions)
- ✅ Tracks which AI model generated questions

---

### 7. `embedding_cache`
**Purpose**: Caches text embeddings for AI matching

**Complete Schema** (from database):
```
Column Name      | Type          | Nullable | Default
----------------|---------------|----------|------------------
id              | uuid          | NO       | gen_random_uuid()
text_hash       | text          | NO       | -
cache_type      | text          | NO       | -
embedding       | vector        | NO       | -
text_preview    | text          | YES      | null
created_at      | timestamptz   | NO       | now()
```

**Key Points**:
- ✅ Caches embeddings to avoid regeneration
- ✅ Uses vector type (pgvector extension)
- ✅ Improves performance for AI matching

---

### 8. `assessment_types` (Institutional Assessments)
**Purpose**: Defines assessment types for schools/colleges

**Complete Schema** (from database):
```
Column Name         | Type          | Nullable | Default
-------------------|---------------|----------|------------------
id                 | uuid          | NO       | gen_random_uuid()
name               | varchar       | NO       | -
description        | text          | YES      | null
is_active          | boolean       | YES      | true
institution_id     | uuid          | YES      | null
institution_type   | varchar       | YES      | null
created_at         | timestamp     | YES      | now()
updated_at         | timestamp     | YES      | now()
```

**Key Points**:
- ✅ Different from career assessments
- ✅ Used for institutional exams (midterm, final, etc.)
- ✅ Institution-specific

---

### 9. `assessments` (Institutional Assessments)
**Purpose**: Stores institutional assessment details

**Complete Schema** (from database):
```
Column Name              | Type          | Nullable | Default
------------------------|---------------|----------|------------------
id                      | uuid          | NO       | uuid_generate_v4()
assessment_code         | text          | NO       | -
type                    | text          | NO       | -
academic_year           | text          | NO       | -
department_id           | uuid          | YES      | null
program_id              | uuid          | YES      | null
semester                | integer       | NO       | -
course_id               | uuid          | YES      | null
course_name             | text          | NO       | -
course_code             | text          | NO       | -
duration_minutes        | integer       | NO       | 180
total_marks             | numeric       | NO       | 100
pass_marks              | numeric       | NO       | 40
weightage               | numeric       | YES      | null
instructions            | text          | YES      | null
syllabus_coverage       | jsonb         | YES      | '[]'
question_paper_pattern  | jsonb         | YES      | null
status                  | text          | YES      | 'draft'
is_published            | boolean       | YES      | false
is_locked               | boolean       | YES      | false
created_by              | uuid          | YES      | null
approved_by             | uuid          | YES      | null
faculty_id              | uuid          | YES      | null
college_id              | uuid          | YES      | null
school_id               | uuid          | YES      | null
teacher_id              | uuid          | YES      | null
start_date              | date          | YES      | null
end_date                | date          | YES      | null
target_classes          | jsonb         | YES      | null
created_at              | timestamptz   | YES      | now()
updated_at              | timestamptz   | YES      | now()
approved_at             | timestamptz   | YES      | null
```

**Key Points**:
- ✅ Different from career assessments
- ✅ Used for institutional exams (midterm, final, etc.)
- ✅ Supports approval workflow
- ✅ Institution-specific (school/college)

---

## 🔄 Complete Data Flow

### Career Assessment Flow
```
1. Student starts assessment
   ↓
   personal_assessment_attempts (status: 'in_progress')
   
2. Questions loaded
   ↓
   career_assessment_ai_questions (if AI-generated)
   adaptive_aptitude_questions_cache (if adaptive)
   
3. Student answers questions
   ↓
   all_responses stored in attempts table
   
4. Student completes assessment
   ↓
   personal_assessment_attempts (status: 'completed')
   
5. AI analysis triggered
   ↓
   Cloudflare Worker → OpenRouter/Claude
   
6. AI generates insights
   ↓
   personal_assessment_results created
   - riasec_scores
   - aptitude_scores
   - career_fit
   - skill_gap
   - roadmap
   - gemini_results (COMPLETE AI RESPONSE)
   
7. Results displayed to student
   ↓
   AssessmentResultPage.jsx
```

### External Course Assessment Flow
```
1. Student enrolls in external course
   ↓
   Assessment required
   
2. Questions loaded
   ↓
   generated_external_assessment (pre-generated)
   
3. Assessment attempt created
   ↓
   external_assessment_attempts (status: 'in_progress')
   
4. Student answers questions
   ↓
   student_answers stored in attempts table
   
5. Student completes assessment
   ↓
   external_assessment_attempts (status: 'completed')
   - score calculated
   - correct_answers counted
   
6. Results displayed
   ↓
   Course completion page
```

---

## 📊 Table Relationships

```
students
   ↓
   ├─→ personal_assessment_attempts
   │      ↓
   │      └─→ personal_assessment_results
   │             ↓
   │             └─→ career_assessment_ai_questions (optional)
   │
   └─→ external_assessment_attempts
          ↓
          └─→ generated_external_assessment

adaptive_aptitude_questions_cache (standalone, reusable)
embedding_cache (standalone, reusable)
```

---

## 🔍 Key Differences

### Career Assessments vs External Assessments

| Feature | Career Assessment | External Assessment |
|---------|------------------|-------------------|
| **Purpose** | Career guidance | Course certification |
| **Tables** | `personal_assessment_*` | `external_assessment_*` |
| **AI Analysis** | ✅ Yes (full analysis) | ❌ No (just scoring) |
| **Questions** | Dynamic/Adaptive | Pre-generated |
| **Duration** | 30-45 minutes | 15 minutes |
| **Sections** | 5-7 sections | 1 section |
| **Results** | Career clusters, roadmap, skill gaps | Score, correct answers |

---

## 💡 Summary

**Total Assessment Tables**: 9

**Main Tables**:
1. `personal_assessment_results` - Career assessment results (AI analysis)
2. `personal_assessment_attempts` - Career assessment progress
3. `career_assessment_ai_questions` - AI-generated questions
4. `adaptive_aptitude_questions_cache` - Cached aptitude questions
5. `external_assessment_attempts` - External course assessments
6. `generated_external_assessment` - Pre-generated external questions
7. `embedding_cache` - AI embeddings cache
8. `assessment_types` - Institutional assessment types
9. `assessments` - Institutional assessments

**Key Insights**:
- ✅ AI analysis results ARE stored in database
- ✅ Complete AI response stored in `gemini_results` field
- ✅ Results persist forever (not deleted on retake)
- ✅ Separate tables for career vs external assessments
- ✅ Supports adaptive testing with question cache
- ✅ Tracks progress for resume functionality

---

**Last Updated**: January 17, 2026
**Source**: Direct query from Supabase database
