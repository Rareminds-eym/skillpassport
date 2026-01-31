# Assessment Database Tables - Quick Reference

## Complete List of 15 Tables

### Core Assessment Tables (8)
1. ✅ **students** - Student profile information
2. ✅ **personal_assessment_streams** - Available streams/grade levels  
3. ✅ **personal_assessment_sections** - Section definitions (RIASEC, Aptitude, etc.)
4. ✅ **personal_assessment_questions** - Question bank
5. ✅ **personal_assessment_response_scales** - Rating scales for Likert questions
6. ✅ **personal_assessment_attempts** - Assessment sessions & progress tracking
7. ✅ **personal_assessment_responses** - Individual MCQ answers
8. ✅ **personal_assessment_results** - Final results & AI analysis

### AI-Generated Questions (1)
9. ✅ **career_assessment_ai_questions** - Cached AI-generated questions

### Adaptive Aptitude (3)
10. ✅ **adaptive_aptitude_sessions** - Adaptive test sessions
11. ✅ **adaptive_aptitude_responses** - Adaptive test answers
12. ✅ **adaptive_aptitude_results** - Adaptive test final results

### Supporting Tables (3)
13. ✅ **school_classes** - School grade information
14. ✅ **programs** - College/university programs
15. ✅ **notifications** - Assessment completion notifications

---

## Verification Checklist

### Tables Used in Assessment Test Flow
- [x] students - Profile lookup
- [x] school_classes - Grade information
- [x] programs - Program/course information
- [x] personal_assessment_streams - Stream selection
- [x] personal_assessment_sections - Section metadata
- [x] personal_assessment_questions - Question loading
- [x] personal_assessment_response_scales - Rating scales
- [x] personal_assessment_attempts - Session management
- [x] personal_assessment_responses - Answer storage (MCQs)
- [x] career_assessment_ai_questions - AI question caching
- [x] adaptive_aptitude_sessions - Adaptive test sessions
- [x] adaptive_aptitude_responses - Adaptive test answers
- [x] adaptive_aptitude_results - Adaptive test results

### Tables Used in Results Flow
- [x] personal_assessment_results - Final results storage
- [x] personal_assessment_attempts - Linking results to attempts
- [x] adaptive_aptitude_results - Adaptive test results for analysis
- [x] notifications - Completion notifications

### Tables Referenced in Code
- [x] All 15 tables verified in:
  - src/pages/student/AssessmentTest.jsx
  - src/services/assessmentService.js
  - src/hooks/useAssessment.js
  - src/hooks/useAdaptiveAptitude.ts
  - functions/api/adaptive-session/handlers/*.ts
  - scripts/delete-user-assessment-records.js

---

## Key Relationships

```
students (1)
  ├─> personal_assessment_attempts (6)
  │     ├─> personal_assessment_responses (7)
  │     ├─> personal_assessment_results (8)
  │     ├─> career_assessment_ai_questions (9)
  │     └─> adaptive_aptitude_sessions (10)
  │           ├─> adaptive_aptitude_responses (11)
  │           └─> adaptive_aptitude_results (12)
  │
  ├─> school_classes (13)
  ├─> programs (14)
  └─> notifications (15)

personal_assessment_sections (3)
  ├─> personal_assessment_questions (4)
  │     └─> personal_assessment_responses (7)
  └─> personal_assessment_response_scales (5)

personal_assessment_streams (2)
  ├─> personal_assessment_attempts (6)
  └─> personal_assessment_questions (4)
```

---

## Nothing Missed ✅

All database tables used by the assessment system have been identified and documented:
- ✅ Core assessment flow tables
- ✅ AI question generation tables
- ✅ Adaptive aptitude test tables
- ✅ Supporting/reference tables
- ✅ Notification tables

**Total: 15 tables**

See `ASSESSMENT_DATABASE_TABLES.md` for complete details on each table including:
- Purpose and usage
- Key columns
- Relationships
- Critical implementation notes
- Data flow diagrams
