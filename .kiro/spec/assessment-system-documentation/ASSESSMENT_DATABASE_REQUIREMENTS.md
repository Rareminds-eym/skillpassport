# Assessment Database Requirements - Complete Guide

## Overview

This document explains exactly what data needs to be stored in which tables and columns for the assessment report page to work properly.

## Database Tables & Flow

### 1. **`personal_assessment_attempts`** (Attempt Tracking)

**Purpose**: Tracks the assessment attempt, progress, and stores all raw answers.

**Required Data on Submission**:

| Column | Type | Required | Description | When Set |
|--------|------|----------|-------------|----------|
| `id` | UUID | ✅ Yes | Unique attempt ID | On attempt creation |
| `student_id` | UUID | ✅ Yes | Student's ID from `students` table | On attempt creation |
| `stream_id` | VARCHAR | ✅ Yes | Stream (e.g., "science", "commerce", "bca") | On attempt creation |
| `grade_level` | TEXT | ✅ Yes | Grade level ("middle", "highschool", "after10", "after12", "college") | On attempt creation |
| `status` | VARCHAR | ✅ Yes | "completed" (set on submission) | On submission |
| `started_at` | TIMESTAMP | ✅ Yes | When assessment started | On attempt creation |
| `completed_at` | TIMESTAMP | ✅ Yes | When assessment completed | On submission |
| `section_timings` | JSONB | ✅ Yes | Time spent on each section | On submission |
| `all_responses` | JSONB | ✅ Yes | All answers (RIASEC, BigFive, etc.) | During assessment |
| `current_section_index` | INTEGER | No | Last section index | During assessment |
| `current_question_index` | INTEGER | No | Last question index | During assessment |
| `timer_remaining` | INTEGER | No | Remaining time for timed sections | During assessment |
| `elapsed_time` | INTEGER | No | Total elapsed time | During assessment |
| `aptitude_scores` | JSONB | No | Aptitude scores (if calculated) | During assessment |
| `knowledge_scores` | JSONB | No | Knowledge scores (if calculated) | During assessment |

**Example `all_responses` Structure**:
```json
{
  "riasec_r1": 4,
  "riasec_r2": 3,
  "riasec_i1": 5,
  "bigfive_o1": 4,
  "bigfive_o2": 3,
  "values_v1": 5,
  "employability_e1": 4,
  "aptitude_apt_1": "B",
  "knowledge_k_1": "A"
}
```

**Example `section_timings` Structure**:
```json
{
  "riasec": 132,
  "bigfive": 56,
  "values": 39,
  "employability": 59,
  "aptitude": 169,
  "knowledge": 36
}
```

---

### 2. **`personal_assessment_results`** (Results & AI Analysis)

**Purpose**: Stores the assessment results and AI-generated analysis.

#### Phase 1: On Submission (Minimal Record)

**What `completeAttemptWithoutAI()` saves**:

| Column | Type | Value on Submission | Description |
|--------|------|---------------------|-------------|
| `id` | UUID | Auto-generated | Unique result ID |
| `attempt_id` | UUID | ✅ Set | Links to attempt |
| `student_id` | UUID | ✅ Set | Student's ID |
| `stream_id` | VARCHAR | ✅ Set | Stream ID |
| `grade_level` | TEXT | ✅ Set | Grade level |
| `status` | ENUM | "completed" | Result status |
| `created_at` | TIMESTAMP | Auto | Creation time |
| `updated_at` | TIMESTAMP | Auto | Update time |
| **ALL AI FIELDS** | Various | **NULL** | Set later by auto-retry |

**AI Fields (Initially NULL)**:
- `riasec_scores` - JSONB
- `riasec_code` - VARCHAR
- `aptitude_scores` - JSONB
- `aptitude_overall` - NUMERIC
- `bigfive_scores` - JSONB
- `work_values_scores` - JSONB
- `employability_scores` - JSONB
- `employability_readiness` - VARCHAR
- `knowledge_score` - NUMERIC
- `knowledge_details` - JSONB
- `career_fit` - JSONB
- `skill_gap` - JSONB
- `skill_gap_courses` - JSONB
- `roadmap` - JSONB
- `profile_snapshot` - JSONB
- `timing_analysis` - JSONB
- `final_note` - JSONB
- `overall_summary` - TEXT
- `gemini_results` - JSONB (contains all AI analysis)

#### Phase 2: After Auto-Retry (AI Analysis Generated)

**What `handleRetry()` populates**:

All the NULL fields above are populated with AI-generated data.

**Example `gemini_results` Structure** (Complete AI Analysis):
```json
{
  "riasec": {
    "scores": {
      "R": 85,
      "I": 75,
      "A": 60,
      "S": 45,
      "E": 30,
      "C": 25
    },
    "topThree": ["R", "I", "A"],
    "code": "RIA",
    "descriptions": {...}
  },
  "bigFive": {
    "O": 75,
    "C": 68,
    "E": 55,
    "A": 72,
    "N": 42
  },
  "workValues": {
    "scores": {...},
    "topThree": [...]
  },
  "employability": {
    "skillScores": {...},
    "overallReadiness": "Developing",
    "strengthAreas": [...],
    "improvementAreas": [...]
  },
  "aptitude": {
    "scores": {...},
    "overallScore": 72
  },
  "knowledge": {
    "score": 68,
    "dominantArea": "Technology"
  },
  "careerFit": {
    "clusters": [
      {
        "name": "Software Engineering & Development",
        "matchScore": 85,
        "roles": [...],
        "reasoning": "..."
      }
    ]
  },
  "skillGap": {
    "priorityA": [...],
    "priorityB": [...],
    "priorityC": [...]
  },
  "roadmap": {
    "projects": [...],
    "courses": [...],
    "timeline": "..."
  },
  "profileSnapshot": {...},
  "timingAnalysis": {...},
  "finalNote": {...},
  "overallSummary": "..."
}
```

---

### 3. **`personal_assessment_responses`** (Individual Responses)

**Purpose**: Stores individual responses for UUID-based questions (optional, mainly for aptitude/knowledge).

**Required Data**:

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | ✅ Yes | Unique response ID |
| `attempt_id` | UUID | ✅ Yes | Links to attempt |
| `question_id` | UUID | ✅ Yes | Question UUID |
| `response_value` | JSONB | ✅ Yes | Answer value |
| `is_correct` | BOOLEAN | No | If answer is correct |
| `responded_at` | TIMESTAMP | ✅ Yes | When answered |

**Note**: This table is mainly for aptitude and knowledge questions that have UUIDs. RIASEC, BigFive, Values, and Employability questions use string IDs and are stored in `all_responses` JSONB column in the attempts table.

---

### 4. **`students`** (Student Profile)

**Purpose**: Provides student profile data for AI context and report display.

**Required Data for Report**:

| Column | Type | Required | Description | Used For |
|--------|------|----------|-------------|----------|
| `id` | UUID | ✅ Yes | Student record ID | Linking |
| `user_id` | UUID | ✅ Yes | Auth user ID | Authentication |
| `name` | VARCHAR | ✅ Yes | Student name | Report header |
| `grade` | VARCHAR | ✅ Yes | Current grade (e.g., "PG Year 1", "UG Year 1", "Grade 10") | AI context, display |
| `course_name` | VARCHAR | ⚠️ Important | Program name (e.g., "MCA", "BCA", "MBA") | AI context for recommendations |
| `branch_field` | VARCHAR | ⚠️ Important | Branch/field (e.g., "Computer Science") | AI context |
| `college_school_name` | VARCHAR | No | Institution name | Report display |
| `college_id` | UUID | No | College ID | Institution lookup |
| `school_id` | UUID | No | School ID | Institution lookup |
| `semester` | INTEGER | No | Current semester | Display |
| `grade_start_date` | DATE | No | When started current grade | Calculate months in grade |

**Why `course_name` and `branch_field` are Important**:
- Used to build `studentContext` for AI analysis
- Determines degree level (PG/UG/Diploma)
- Influences career recommendations (e.g., MCA → Software Engineering roles)
- Without this, AI generates generic recommendations

---

## Complete Data Flow

### Step 1: Assessment Submission

```
User clicks "Submit Assessment"
  ↓
Frontend calls: completeAttemptWithoutAI(attemptId, studentId, streamId, gradeLevel, sectionTimings)
  ↓
Database Updates:
  1. personal_assessment_attempts:
     - status = "completed"
     - completed_at = now()
     - section_timings = {...}
  
  2. personal_assessment_results:
     - Creates minimal record
     - attempt_id, student_id, stream_id, grade_level = set
     - ALL AI fields = NULL
     - gemini_results = NULL
  ↓
Navigate to: /student/assessment/result?attemptId=[uuid]
```

### Step 2: Result Page Load & Auto-Retry

```
Result page loads
  ↓
useAssessmentResults hook runs
  ↓
loadResults() executes
  ↓
Fetches from database:
  1. personal_assessment_attempts (by attemptId)
  2. personal_assessment_results (by attempt_id)
  3. students (by student_id) ← For profile data
  ↓
Checks: result.gemini_results === null?
  ↓
YES → Triggers auto-retry
  ↓
handleRetry() executes:
  1. Fetches all_responses from attempt
  2. Fetches student profile (grade, course_name, branch_field)
  3. Builds studentContext:
     {
       rawGrade: "PG Year 1",
       programName: "MCA",
       degreeLevel: "postgraduate"
     }
  4. Calls AI analysis with context
  5. Receives complete AI analysis
  6. Updates personal_assessment_results:
      - gemini_results = {complete AI analysis}
      - riasec_scores = {...}
      - riasec_code = "RIA"
      - aptitude_scores = {...}
      - bigfive_scores = {...}
      - work_values_scores = {...}
      - employability_scores = {...}
      - knowledge_score = 68
      - career_fit = {...}
      - skill_gap = {...}
      - roadmap = {...}
      - ... all other AI fields
  ↓
Results display with all sections populated ✅
```

---

## Critical Data Requirements

### For Report Page to Work:

#### ✅ MUST HAVE (Report won't load without these):

1. **`personal_assessment_attempts`**:
   - `id` (attemptId in URL)
   - `student_id`
   - `stream_id`
   - `grade_level`
   - `status` = "completed"
   - `all_responses` (with all answers)
   - `section_timings`

2. **`personal_assessment_results`**:
   - `id`
   - `attempt_id` (links to attempt)
   - `student_id`
   - `stream_id`
   - `grade_level`
   - `gemini_results` (after auto-retry)

3. **`students`**:
   - `id`
   - `user_id`
   - `name`
   - `grade`

#### ⚠️ IMPORTANT (Report works but with limitations):

4. **`students`** (for AI context):
   - `course_name` - Without this, AI can't generate program-specific recommendations
   - `branch_field` - Without this, AI can't determine field alignment
   - `grade_start_date` - Without this, can't calculate months in grade

#### 📊 OPTIONAL (Enhances report):

5. **`students`** (for display):
   - `college_school_name`
   - `college_id` / `school_id`
   - `semester`

---

## What Happens If Data Is Missing?

### Missing `all_responses`:
- ❌ Auto-retry fails
- ❌ AI analysis can't be generated
- ❌ Report shows error

### Missing `section_timings`:
- ⚠️ Timing analysis section empty
- ✅ Rest of report works

### Missing `course_name` or `branch_field`:
- ⚠️ AI generates generic recommendations
- ⚠️ Degree level might not be detected correctly
- ✅ Report displays but recommendations are less relevant

### Missing `gemini_results`:
- ⏳ Auto-retry triggers
- ⏳ AI analysis generates (5-10 seconds)
- ✅ Report displays after generation

---

## Database Schema Summary

### Tables Used:
1. ✅ `personal_assessment_attempts` - Attempt tracking & raw answers
2. ✅ `personal_assessment_results` - Results & AI analysis
3. ✅ `personal_assessment_responses` - Individual responses (optional)
4. ✅ `students` - Student profile data

### Total Columns Used: ~50+

### Critical Columns: ~15
- Attempt: id, student_id, stream_id, grade_level, status, all_responses, section_timings
- Results: id, attempt_id, student_id, gemini_results
- Students: id, user_id, name, grade, course_name

---

## Verification Checklist

Before report page can work, verify:

- [ ] Attempt record exists with `status = "completed"`
- [ ] Attempt has `all_responses` JSONB with all answers
- [ ] Attempt has `section_timings` JSONB
- [ ] Result record exists linked to attempt
- [ ] Result has `student_id`, `stream_id`, `grade_level`
- [ ] Student record exists with `name` and `grade`
- [ ] Student has `course_name` (for program-specific recommendations)
- [ ] Auto-retry will populate `gemini_results` automatically

---

## SQL Query to Check Data

```sql
-- Check if all required data exists for an attempt
SELECT 
    a.id as attempt_id,
    a.status as attempt_status,
    a.all_responses IS NOT NULL as has_answers,
    jsonb_object_keys(a.all_responses) as answer_count,
    a.section_timings IS NOT NULL as has_timings,
    r.id as result_id,
    r.gemini_results IS NOT NULL as has_ai_analysis,
    s.name as student_name,
    s.grade as student_grade,
    s.course_name as student_program
FROM personal_assessment_attempts a
LEFT JOIN personal_assessment_results r ON r.attempt_id = a.id
LEFT JOIN students s ON s.id = a.student_id
WHERE a.id = '[attempt-id]';
```

---

## Summary

**Minimum Data for Report to Work**:
1. ✅ Completed attempt with answers and timings
2. ✅ Result record (can be minimal initially)
3. ✅ Student profile with name and grade
4. ⏳ AI analysis (generated automatically by auto-retry)

**For Best Results**:
- Include `course_name` and `branch_field` in student profile
- Ensure all answers are saved in `all_responses`
- Include section timings for timing analysis

**The auto-retry system handles AI generation automatically**, so you only need to ensure the basic data is saved on submission!

---

**Date**: January 18, 2026
**Status**: Complete
**Based on**: Actual codebase analysis
