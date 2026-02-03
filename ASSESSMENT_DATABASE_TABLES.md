# Assessment System - Complete Database Tables Reference

This document lists ALL database tables used by the assessment test and results system.

## Core Assessment Tables

### 1. **students**
**Purpose**: Stores student profile information
**Used For**: 
- Looking up student ID from user_id
- Getting student grade, program, school/college info
- Determining grade level for assessment

**Key Columns**:
- `id` (UUID) - Primary key, student record ID
- `user_id` (UUID) - Foreign key to auth.users
- `email` (TEXT)
- `name` (TEXT)
- `grade` (TEXT) - Student's current grade
- `grade_start_date` (DATE) - When student started current grade
- `school_class_id` (UUID) - Foreign key to school_classes
- `school_id` (UUID) - Foreign key to schools
- `university_college_id` (UUID) - Foreign key to university_colleges
- `program_id` (UUID) - Foreign key to programs
- `course_name` (TEXT) - Program/course name

**Relationships**:
- Referenced by: `personal_assessment_attempts`, `personal_assessment_results`, `career_assessment_ai_questions`, `adaptive_aptitude_sessions`

---

### 2. **personal_assessment_streams**
**Purpose**: Defines available educational streams/grade levels
**Used For**: Stream selection, filtering questions by stream

**Key Columns**:
- `id` (TEXT) - Primary key (e.g., 'cs', 'bca', 'bba', 'science', 'commerce')
- `name` (TEXT) - Display name
- `description` (TEXT)
- `is_active` (BOOLEAN)

**Relationships**:
- Referenced by: `personal_assessment_attempts`, `personal_assessment_questions`

---

### 3. **personal_assessment_sections**
**Purpose**: Defines assessment sections (RIASEC, Big Five, Aptitude, etc.)
**Used For**: Organizing questions into sections, section metadata

**Key Columns**:
- `id` (UUID) - Primary key
- `name` (TEXT) - Section name (e.g., 'riasec', 'bigfive', 'aptitude')
- `title` (TEXT) - Display title
- `description` (TEXT)
- `grade_level` (TEXT) - Which grade level this section applies to
- `is_stream_specific` (BOOLEAN) - Whether questions vary by stream
- `is_timed` (BOOLEAN) - Whether section has time limit
- `time_limit_seconds` (INTEGER)
- `order_number` (INTEGER) - Display order
- `is_active` (BOOLEAN)

**Relationships**:
- Referenced by: `personal_assessment_questions`, `personal_assessment_response_scales`

---

### 4. **personal_assessment_questions**
**Purpose**: All assessment questions across all sections and grade levels
**Used For**: Loading questions for each section

**Key Columns**:
- `id` (UUID) - Primary key
- `section_id` (UUID) - Foreign key to personal_assessment_sections
- `stream_id` (TEXT) - Foreign key to personal_assessment_streams (NULL for general questions)
- `question_text` (TEXT) - The question
- `question_type` (TEXT) - 'mcq', 'rating', 'sjt', 'text', 'multiselect'
- `subtype` (TEXT) - Category (e.g., 'verbal', 'numerical', 'clerical')
- `options` (JSONB) - Answer options for MCQ
- `correct_answer` (TEXT) - Correct answer for scored questions
- `module_title` (TEXT) - Module/category title
- `order_number` (INTEGER)
- `is_active` (BOOLEAN)

**Relationships**:
- References: `personal_assessment_sections`, `personal_assessment_streams`
- Referenced by: `personal_assessment_responses`

---

### 5. **personal_assessment_response_scales**
**Purpose**: Defines rating scales for different sections/grade levels
**Used For**: Likert scale questions (1-5 rating, etc.)

**Key Columns**:
- `id` (UUID) - Primary key
- `section_id` (UUID) - Foreign key to personal_assessment_sections
- `grade_level` (TEXT)
- `scale_type` (TEXT) - 'likert_5', 'likert_4', etc.
- `scale_values` (JSONB) - Array of scale options

**Relationships**:
- References: `personal_assessment_sections`

---

### 6. **personal_assessment_attempts**
**Purpose**: Tracks each assessment attempt by a student
**Used For**: 
- Creating new assessment sessions
- Saving progress (current section/question)
- Storing timer state
- Resume functionality
- Linking to adaptive sessions

**Key Columns**:
- `id` (UUID) - Primary key
- `student_id` (UUID) - Foreign key to students (NOT auth.users!)
- `stream_id` (TEXT) - Foreign key to personal_assessment_streams
- `grade_level` (TEXT) - 'middle', 'highschool', 'higher_secondary', 'after12', 'college'
- `status` (TEXT) - 'in_progress', 'completed', 'abandoned'
- `started_at` (TIMESTAMP)
- `completed_at` (TIMESTAMP)
- `current_section_index` (INTEGER) - Resume position
- `current_question_index` (INTEGER) - Resume position
- `timer_remaining` (INTEGER) - Seconds remaining for timed sections
- `elapsed_time` (INTEGER) - Seconds elapsed for non-timed sections
- `aptitude_question_timer` (INTEGER) - Per-question timer for aptitude
- `section_timings` (JSONB) - Time spent on each section
- `all_responses` (JSONB) - Stores all answers (RIASEC, BigFive, Values, Employability, etc.)
- `adaptive_aptitude_session_id` (UUID) - Foreign key to adaptive_aptitude_sessions
- `aptitude_scores` (JSONB) - Calculated aptitude scores
- `knowledge_scores` (JSONB) - Calculated knowledge scores

**Relationships**:
- References: `students`, `personal_assessment_streams`, `adaptive_aptitude_sessions`
- Referenced by: `personal_assessment_responses`, `personal_assessment_results`, `career_assessment_ai_questions`

**CRITICAL NOTE**: 
- `student_id` references `students.id` (NOT `auth.users.id`)
- `all_responses` JSONB column stores answers for non-UUID questions (RIASEC, BigFive, etc.)
- Individual MCQ responses are stored in `personal_assessment_responses` table

---

### 7. **personal_assessment_responses**
**Purpose**: Stores individual question responses (for UUID-based questions)
**Used For**: 
- Saving answers to aptitude/knowledge MCQ questions
- Tracking correct/incorrect answers
- Resume functionality

**Key Columns**:
- `id` (UUID) - Primary key
- `attempt_id` (UUID) - Foreign key to personal_assessment_attempts
- `question_id` (UUID) - Foreign key to personal_assessment_questions
- `response_value` (JSONB) - The answer (can be string, number, array, object)
- `is_correct` (BOOLEAN) - Whether answer is correct (for scored questions)
- `responded_at` (TIMESTAMP)

**Relationships**:
- References: `personal_assessment_attempts`, `personal_assessment_questions`

**CRITICAL NOTE**: 
- This table stores responses for database questions with UUIDs
- RIASEC, BigFive, Values, Employability answers are stored in `personal_assessment_attempts.all_responses` JSONB column instead

---

### 8. **personal_assessment_results**
**Purpose**: Stores final assessment results and AI analysis
**Used For**: 
- Displaying assessment results
- Career recommendations
- Skill gap analysis
- Roadmap generation

**Key Columns**:
- `id` (UUID) - Primary key
- `attempt_id` (UUID) - Foreign key to personal_assessment_attempts (UNIQUE)
- `student_id` (UUID) - Foreign key to students
- `grade_level` (TEXT)
- `stream_id` (TEXT)
- `status` (TEXT) - 'completed'
- `riasec_scores` (JSONB) - RIASEC scores { R, I, A, S, E, C }
- `riasec_code` (TEXT) - Top 3 RIASEC code (e.g., 'RIA')
- `aptitude_scores` (JSONB) - Aptitude breakdown by category
- `aptitude_overall` (NUMERIC) - Overall aptitude percentage
- `bigfive_scores` (JSONB) - Big Five personality scores
- `work_values_scores` (JSONB) - Work values scores (comprehensive assessments only)
- `employability_scores` (JSONB) - Employability skill scores (comprehensive assessments only)
- `employability_readiness` (TEXT) - Overall readiness level (comprehensive assessments only)
- `knowledge_score` (NUMERIC) - Knowledge test score (comprehensive assessments only)
- `knowledge_details` (JSONB) - Detailed knowledge breakdown (comprehensive assessments only)
- `career_fit` (JSONB) - Career cluster recommendations
- `skill_gap` (JSONB) - Skill gap analysis
- `skill_gap_courses` (JSONB) - Recommended courses for skill gaps
- `platform_courses` (JSONB) - Platform-specific course recommendations
- `courses_by_type` (JSONB) - Courses organized by type
- `roadmap` (JSONB) - Development roadmap with projects
- `profile_snapshot` (JSONB) - Student profile at time of assessment
- `timing_analysis` (JSONB) - Time spent analysis
- `final_note` (TEXT) - AI-generated final note
- `overall_summary` (TEXT) - AI-generated summary
- `gemini_results` (JSONB) - Complete AI analysis response
- `created_at` (TIMESTAMP)

**Relationships**:
- References: `personal_assessment_attempts` (one-to-one), `students`

**CRITICAL NOTE**: 
- One result per attempt (unique constraint on `attempt_id`)
- All AI analysis fields can be NULL initially (populated on-demand)
- `student_id` references `students.id` (NOT `auth.users.id`)

---

## AI-Generated Questions Tables

### 9. **career_assessment_ai_questions**
**Purpose**: Stores AI-generated questions for aptitude and knowledge sections
**Used For**: 
- Caching AI-generated questions per student/stream
- Resume functionality (load saved questions)
- Avoiding regeneration of questions

**Key Columns**:
- `id` (UUID) - Primary key
- `student_id` (UUID) - Foreign key to students
- `stream_id` (TEXT) - Stream/program ID
- `grade_level` (TEXT)
- `question_type` (TEXT) - 'aptitude' or 'knowledge'
- `questions` (JSONB) - Array of generated questions
- `attempt_id` (UUID) - Foreign key to personal_assessment_attempts (optional)
- `is_active` (BOOLEAN) - Whether questions are still valid
- `generated_at` (TIMESTAMP)

**Relationships**:
- References: `students`, `personal_assessment_attempts`

**CRITICAL NOTE**: 
- Questions are cached per student/stream/question_type
- If student quits and resumes, same questions are loaded
- Questions expire after a certain time or when marked inactive

---

## Adaptive Aptitude Tables

### 10. **adaptive_aptitude_sessions**
**Purpose**: Tracks adaptive aptitude test sessions
**Used For**: 
- Adaptive testing algorithm (adjusts difficulty based on performance)
- Tracking progress through adaptive test
- Resume functionality for adaptive section

**Key Columns**:
- `id` (UUID) - Primary key
- `student_id` (UUID) - Foreign key to students
- `grade_level` (TEXT)
- `status` (TEXT) - 'in_progress', 'completed', 'abandoned'
- `current_phase` (TEXT) - 'calibration', 'assessment', 'complete'
- `current_difficulty` (INTEGER) - Current difficulty level (1-5)
- `questions_answered` (INTEGER) - Number of questions answered
- `current_question_index` (INTEGER) - Current question position
- `estimated_ability` (NUMERIC) - Estimated ability score
- `confidence_level` (NUMERIC) - Confidence in ability estimate
- `started_at` (TIMESTAMP)
- `completed_at` (TIMESTAMP)

**Relationships**:
- References: `students`
- Referenced by: `personal_assessment_attempts`, `adaptive_aptitude_responses`

**CRITICAL NOTE**: 
- Used for middle school and high school adaptive aptitude sections
- Linked to assessment attempt via `personal_assessment_attempts.adaptive_aptitude_session_id`

---

### 11. **adaptive_aptitude_responses**
**Purpose**: Stores individual responses in adaptive aptitude test
**Used For**: 
- Tracking answers in adaptive test
- Calculating ability estimates
- Adjusting difficulty

**Key Columns**:
- `id` (UUID) - Primary key
- `session_id` (UUID) - Foreign key to adaptive_aptitude_sessions
- `question_id` (UUID) - Question identifier
- `question_text` (TEXT) - The question
- `selected_answer` (TEXT) - Student's answer
- `correct_answer` (TEXT) - Correct answer
- `is_correct` (BOOLEAN) - Whether answer is correct
- `difficulty_level` (INTEGER) - Question difficulty (1-5)
- `time_taken_seconds` (INTEGER) - Time to answer
- `sequence_number` (INTEGER) - Order of question in test
- `responded_at` (TIMESTAMP)

**Relationships**:
- References: `adaptive_aptitude_sessions`

---

### 12. **adaptive_aptitude_results**
**Purpose**: Stores final results from completed adaptive aptitude tests
**Used For**: 
- Storing calculated ability scores
- Tracking test completion
- Providing results for assessment analysis

**Key Columns**:
- `id` (UUID) - Primary key
- `session_id` (UUID) - Foreign key to adaptive_aptitude_sessions (UNIQUE)
- `student_id` (UUID) - Foreign key to students
- `grade_level` (TEXT)
- `final_ability_score` (NUMERIC) - Estimated ability score
- `confidence_level` (NUMERIC) - Confidence in estimate
- `tier` (TEXT) - Performance tier (e.g., 'high', 'medium', 'low')
- `questions_answered` (INTEGER) - Total questions answered
- `correct_answers` (INTEGER) - Number of correct answers
- `accuracy_percentage` (NUMERIC) - Overall accuracy
- `category_scores` (JSONB) - Breakdown by aptitude category
- `difficulty_progression` (JSONB) - How difficulty changed over test
- `response_times` (JSONB) - Response time statistics
- `duplicate_questions_detected` (INTEGER) - Number of duplicate questions (quality check)
- `duplicate_question_ids` (JSONB) - List of duplicate question IDs (quality check)
- `created_at` (TIMESTAMP)

**Relationships**:
- References: `adaptive_aptitude_sessions` (one-to-one), `students`

**CRITICAL NOTE**: 
- One result per session (unique constraint on `session_id`)
- Results are generated when test is completed
- Used to enhance overall assessment results for middle/high school students

---

## Supporting Tables

### 13. **school_classes**
**Purpose**: School class information
**Used For**: Getting student's grade from class assignment

**Key Columns**:
- `id` (UUID) - Primary key
- `grade` (TEXT) - Grade level
- `academic_year` (TEXT)

**Relationships**:
- Referenced by: `students`

---

### 13. **programs**
**Purpose**: College/university programs
**Used For**: Getting student's program name for stream matching

**Key Columns**:
- `id` (UUID) - Primary key
- `name` (TEXT) - Program name (e.g., "B.Tech Computer Science")
- `code` (TEXT) - Program code (e.g., "BTECH_CSE")

**Relationships**:
- Referenced by: `students`

---

### 14. **notifications**
**Purpose**: User notifications
**Used For**: Notifying students when assessment is completed

**Key Columns**:
- `id` (UUID) - Primary key
- `recipient_id` (UUID) - Foreign key to students/users
- `type` (TEXT) - 'assessment_completed'
- `title` (TEXT)
- `message` (TEXT)
- `assessment_id` (UUID) - Foreign key to personal_assessment_attempts
- `read` (BOOLEAN)
- `created_at` (TIMESTAMP)

**Relationships**:
- References: `students`, `personal_assessment_attempts`

---

## Table Relationships Summary

```
students (core profile)
  ├─> personal_assessment_attempts (assessment sessions)
  │     ├─> personal_assessment_responses (individual answers)
  │     ├─> personal_assessment_results (final results & AI analysis)
  │     ├─> career_assessment_ai_questions (AI-generated questions)
  │     └─> adaptive_aptitude_sessions (adaptive test sessions)
  │           ├─> adaptive_aptitude_responses (adaptive test answers)
  │           └─> adaptive_aptitude_results (adaptive test final results)
  │
  ├─> school_classes (grade info)
  └─> programs (college program info)

personal_assessment_sections (section definitions)
  ├─> personal_assessment_questions (question bank)
  │     └─> personal_assessment_responses (answers)
  └─> personal_assessment_response_scales (rating scales)

personal_assessment_streams (stream definitions)
  ├─> personal_assessment_attempts
  └─> personal_assessment_questions
```

---

## Critical Data Flow

### Starting Assessment:
1. Look up `students` table to get student record ID
2. Check `personal_assessment_attempts` for in-progress attempt
3. If none, create new attempt in `personal_assessment_attempts`
4. Load sections from `personal_assessment_sections`
5. Load questions from `personal_assessment_questions` OR generate with AI and save to `career_assessment_ai_questions`

### Answering Questions:
1. For RIASEC, BigFive, Values, Employability: Save to `personal_assessment_attempts.all_responses` JSONB
2. For Aptitude/Knowledge MCQs: Save to `personal_assessment_responses`
3. For Adaptive Aptitude: Save to `adaptive_aptitude_responses`
4. Update progress in `personal_assessment_attempts` (current_section_index, current_question_index, timers)

### Completing Assessment:
1. Mark `personal_assessment_attempts.status` = 'completed'
2. Run AI analysis (Gemini)
3. Save results to `personal_assessment_results` with all AI analysis fields
4. Create notification in `notifications`

### Viewing Results:
1. Query `personal_assessment_results` by student_id
2. Display career recommendations, skill gaps, roadmap from JSONB fields

---

## Important Notes

1. **Student ID vs User ID**: 
   - `students.id` is used throughout assessment tables (NOT `auth.users.id`)
   - Always look up student record first before creating attempts

2. **Response Storage**:
   - Non-UUID questions (RIASEC, BigFive, etc.): `personal_assessment_attempts.all_responses` JSONB
   - UUID questions (Aptitude, Knowledge): `personal_assessment_responses` table
   - Adaptive questions: `adaptive_aptitude_responses` table

3. **Grade Level Variations**:
   - Middle/High School: Simplified assessment with adaptive aptitude
   - After 10th/12th/College: Comprehensive assessment with all sections

4. **AI Question Caching**:
   - Questions saved in `career_assessment_ai_questions` per student/stream
   - Prevents regeneration on resume
   - Can be invalidated by setting `is_active` = false

5. **Resume Functionality**:
   - Progress saved in `personal_assessment_attempts` (section/question index, timers)
   - Answers restored from `all_responses` JSONB and `personal_assessment_responses`
   - Adaptive session can be resumed via `adaptive_aptitude_session_id`

---

## Total Tables: 15

**Core Assessment**: 8 tables
**AI Questions**: 1 table  
**Adaptive Aptitude**: 3 tables
**Supporting**: 3 tables
