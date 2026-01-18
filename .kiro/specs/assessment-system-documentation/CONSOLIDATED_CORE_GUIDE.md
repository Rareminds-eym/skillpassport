# Assessment System - Core Technical Guide

> **Complete reference for the student career assessment system**

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture & Flow](#architecture--flow)
3. [Database Schema](#database-schema)
4. [Key Features](#key-features)
5. [Configuration](#configuration)
6. [Testing & Debugging](#testing--debugging)
7. [Troubleshooting](#troubleshooting)

---

## System Overview

### Purpose
AI-powered career assessment platform that evaluates students across multiple dimensions (interests, personality, aptitudes, values) to provide personalized career guidance.

### Technology Stack
- **Frontend**: React, TypeScript, Framer Motion
- **State Management**: Custom hooks (useAssessmentFlow, useAssessment)
- **Database**: Supabase (PostgreSQL)
- **AI**: Gemini AI (analysis), OpenRouter (question generation)
- **Adaptive Testing**: Custom IRT implementation

### Key Routes
| Route | Component | Purpose |
|-------|-----------|---------|
| `/student/assessment/test` | AssessmentTestPage | Main assessment interface |
| `/student/assessment/result` | AssessmentResult | View results/report |

### File Structure
```
src/
├── features/assessment/
│   ├── career-test/
│   │   ├── AssessmentTestPage.tsx      # Main implementation
│   │   ├── hooks/
│   │   │   ├── useAssessmentFlow.ts    # State machine
│   │   │   ├── useAIQuestions.ts       # AI question loading
│   │   │   ├── useAssessmentSubmission.ts  # Submission logic
│   │   │   └── useStudentGrade.ts      # Student info
│   │   ├── components/
│   │   │   ├── questions/              # Question renderers
│   │   │   ├── screens/                # Full-screen components
│   │   │   └── layout/                 # Layout components
│   │   └── config/
│   │       └── sections.ts             # Section configurations
│   ├── assessment-result/
│   │   ├── AssessmentResult.jsx        # Results display
│   │   └── hooks/
│   │       └── useAssessmentResults.js # Results loading
│   └── constants/
│       └── config.ts                   # All configuration constants
└── hooks/
    ├── useAssessment.js                # Database operations
    └── useAdaptiveAptitude.js          # Adaptive testing logic
```

---

## Architecture & Flow

### Complete Assessment Flow

```
1. START
   ├── Check for in-progress attempt
   ├── Show ResumePromptScreen (if found) OR GradeSelectionScreen
   └── Grade Selection → Category/Stream Selection (after12 only)

2. ASSESSMENT SECTIONS
   ├── Section Intro → Questions → Section Complete
   ├── Real-time saving (every answer + every 30s auto-save)
   └── Repeat for all sections

3. SUBMISSION
   ├── AnalyzingScreen (7 stages, 0-100%)
   ├── AI Analysis (Gemini/OpenRouter)
   ├── Save results to database
   └── Navigate to /student/assessment/result

4. RESULTS
   ├── Load from database (attemptId parameter)
   ├── Display comprehensive report
   └── Course recommendations + career guidance
```

### Grade-Specific Flows

#### After 12th (College Admission)
- **Stream Selection**: Required (Science/Commerce/Arts → Specific programs)
- **Sections**: RIASEC, Big Five, Work Values, Employability, Aptitude, Knowledge
- **AI Analysis**: Stream-specific career recommendations

#### After 10th (11th/12th Stream Selection)
- **Stream Selection**: Auto-set to 'general' (stream-agnostic)
- **Sections**: RIASEC, Big Five, Work Values, Employability, Aptitude (NO knowledge section)
- **AI Analysis**: Recommends best stream (PCMB/PCMS/PCM/PCB/Commerce/Arts)
- **Why No Knowledge**: Students haven't studied stream-specific content yet

#### College/Middle/High School
- **Stream Selection**: Auto-detected from student profile
- **Sections**: Grade-appropriate sections
- **AI Analysis**: Grade-specific recommendations

### State Machine (useAssessmentFlow)

**Screens**:
- `grade_selection` → `category_selection` (after12 only) → `section_intro`
- `section_intro` → `assessment` → `section_complete`
- `section_complete` → `section_intro` (next) OR `analyzing` (last)

**State Variables**:
```typescript
{
  gradeLevel, selectedCategory, studentStream,
  currentScreen, currentSectionIndex, currentQuestionIndex,
  showSectionIntro, showSectionComplete,
  answers, sectionTimings, timeRemaining, elapsedTime,
  isSubmitting, error
}
```

---

## Database Schema

### Core Tables

#### `personal_assessment_attempts`
Tracks each assessment attempt with real-time progress.

```sql
id UUID PRIMARY KEY
student_id UUID REFERENCES students(id)
grade_level TEXT NOT NULL
stream_id TEXT NOT NULL
status TEXT DEFAULT 'in_progress'  -- 'in_progress', 'completed', 'abandoned'
current_section_index INTEGER DEFAULT 0
current_question_index INTEGER DEFAULT 0
timer_remaining INTEGER  -- seconds remaining for timed sections
elapsed_time INTEGER  -- seconds elapsed for current section
section_timings JSONB  -- { "riasec": 120, "bigfive": 180, ... }
all_responses JSONB  -- All answers (non-UUID questions)
adaptive_aptitude_session_id UUID
started_at TIMESTAMP DEFAULT NOW()
completed_at TIMESTAMP
```

**Indexes**: `(student_id, status)`, `(student_id, completed_at)`

#### `personal_assessment_responses`
Individual answers to UUID-based questions (AI-generated).

```sql
id UUID PRIMARY KEY
attempt_id UUID REFERENCES personal_assessment_attempts(id)
question_id UUID REFERENCES personal_assessment_questions(id)
section_id TEXT NOT NULL
response_value JSONB NOT NULL
created_at TIMESTAMP DEFAULT NOW()
```

**Indexes**: `(attempt_id)`, `(question_id)`

#### `personal_assessment_questions`
Cached AI-generated questions.

```sql
id UUID PRIMARY KEY
stream_id TEXT NOT NULL
section_type TEXT NOT NULL  -- 'aptitude', 'knowledge'
subtag TEXT  -- 'numerical', 'logical', 'verbal', 'spatial', 'abstract'
question_text TEXT NOT NULL
options JSONB  -- ["A", "B", "C", "D"]
correct_answer TEXT
difficulty TEXT  -- 'easy', 'medium', 'hard'
created_at TIMESTAMP DEFAULT NOW()
```

**Indexes**: `(stream_id, section_type)`, `(subtag)`

#### `personal_assessment_results`
Final AI analysis results.

```sql
id UUID PRIMARY KEY
attempt_id UUID REFERENCES personal_assessment_attempts(id)
student_id UUID REFERENCES students(id)
grade_level TEXT NOT NULL
stream_id TEXT NOT NULL
riasec_scores JSONB  -- { "R": 4.2, "I": 4.8, ... }
riasec_code TEXT  -- "IAS"
bigfive_scores JSONB  -- { "O": 4.5, "C": 3.8, ... }
work_values JSONB
employability_score DECIMAL(3,1)
aptitude_scores JSONB
recommended_careers JSONB
recommended_courses JSONB
skill_gaps JSONB
ai_analysis TEXT  -- Full AI-generated report
action_plan TEXT
created_at TIMESTAMP DEFAULT NOW()
```

**Indexes**: `(student_id)`, `(attempt_id)`

### Data Flow

**Real-Time Saving** (every answer):
1. Student answers question
2. Answer saved to `personal_assessment_responses` (UUID questions)
3. Answer merged into `all_responses` JSONB (non-UUID questions)
4. Progress updated (`current_section_index`, `current_question_index`)

**Auto-Save** (every 30 seconds):
- Timer state (`timer_remaining`, `elapsed_time`)
- All responses (`all_responses` JSONB)
- Section timings

**Resume Flow**:
1. Check for `status = 'in_progress'` attempt
2. Load all responses from database
3. Restore position (`current_section_index`, `current_question_index`)
4. Restore timer state
5. Continue from exact position

---

## Key Features

### 1. Real-Time Response Saving

**Every answer is saved instantly to the database** - no data loss on browser crash, network interruption, or accidental tab close.

**Implementation**:
```typescript
// AssessmentTestPage.tsx
flow.onAnswer((questionId, answer) => {
  // Save to database immediately
  if (isUUIDQuestion(questionId)) {
    dbSaveResponse(questionId, answer);
  }
  // Update progress with all answers
  dbUpdateProgress({
    sectionIndex, questionIndex,
    allAnswers: { ...answers, [questionId]: answer }
  });
});
```

**Auto-Save Timer** (every 30 seconds):
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    if (currentAttempt) {
      dbUpdateProgress({
        timerRemaining, elapsedTime,
        sectionTimings, allAnswers: answers
      });
    }
  }, 30000);
  return () => clearInterval(interval);
}, [currentAttempt, answers, timerRemaining, elapsedTime]);
```

### 2. Question Navigation Rules

**Next Button Disabled Until Answered** - Students cannot skip questions.

**Validation by Question Type**:
| Type | Validation | Example |
|------|------------|---------|
| Likert Scale | Any option (1-5) | 1, 2, 3, 4, or 5 |
| Multiple Choice | Any option | A, B, C, or D |
| Multiselect | At least one option | ["A", "C"] |
| SJT (Best/Worst) | Both best AND worst | { best: "A", worst: "D" } |
| Text Input | Non-empty string | "My answer" |
| Adaptive Aptitude | Any option | A, B, C, or D |

**Previous Button**: Always enabled (except first question, and disabled for adaptive sections).

### 3. localStorage Removal (COMPLETED)

**Old System**: Dual storage (database + localStorage)
**New System**: Database-only storage

**Why Removed**:
- ❌ Data inconsistency (database had real-time, localStorage had submission-time)
- ❌ Redundant storage
- ❌ Stale data risk
- ❌ Unnecessary complexity

**Changes Made**:
1. Removed localStorage writes from submission
2. Result page requires `attemptId` parameter
3. Regenerate feature uses database
4. AI results cached in database (`gemini_results` JSONB)

### 4. AI Integration

#### Question Generation (OpenRouter)
- **Cache-first**: Check `personal_assessment_questions` table
- **Generate on miss**: Call OpenRouter API
- **Store with metadata**: stream, section, subtag, difficulty
- **Sections**: Aptitude, Knowledge (after12/college only)

#### Result Analysis (Gemini AI)
- **Input**: All answers, scores, timings, stream, grade level
- **Output**: RIASEC code, career recommendations, course recommendations, skill gaps, action plan
- **Storage**: `personal_assessment_results.gemini_results` (JSONB)
- **Stages**: 7-stage progress (Preparing → AI Analyzing → Saving → Complete)

#### After 10th Stream Recommendation
- **Hybrid Logic**: Rule-based + AI analysis
- **Input**: RIASEC scores, aptitude scores, personality traits
- **Output**: Recommended stream (PCMB/PCMS/PCM/PCB/Commerce/Arts)
- **Confidence Score**: High/Medium/Low with reasoning

### 5. Timer System

**4 Timer Types**:

1. **Elapsed Time** (non-timed sections): Counts up from 0
   - Sections: RIASEC, Big Five, Work Values, Employability
   - Storage: `elapsed_time` column

2. **Countdown Timer** (timed sections): Counts down from limit
   - Sections: Knowledge (30 min)
   - Storage: `timer_remaining` column
   - Auto-advance: Yes, when reaches 0

3. **Per-Question Timer** (aptitude): 60s per question
   - Sections: Aptitude (individual phase)
   - Auto-advance: Yes, when reaches 0

4. **Adaptive Timer**: 90s per adaptive question
   - Sections: Adaptive Aptitude
   - Auto-advance: Yes, submits random answer if time expires

### 6. Assessment Restriction

**6-Month Rule**: Students can only take assessment once every 6 months.

**Implementation**:
```sql
SELECT * FROM personal_assessment_results
WHERE student_id = $1
  AND created_at > NOW() - INTERVAL '6 months'
ORDER BY created_at DESC
LIMIT 1
```

**If found**: Show `RestrictionScreen` with:
- Time remaining until next attempt
- Button to view last report
- Explanation of waiting period

### 7. Test Mode (Development Only)

**Enabled on**: localhost, skillpassport.pages.dev
**Disabled on**: skilldevelopment.rareminds.in (production)

**Features**:
- Auto-fill all questions with valid answers
- Jump to any section
- Skip validation
- Fast-forward timers
- View raw state data

**Access**: Press `Ctrl+Shift+T` or add `?testMode=true` to URL

---

## Configuration

### Grade Levels
```typescript
GRADE_LEVELS = {
  MIDDLE: 'middle',           // Grades 6-8
  HIGHSCHOOL: 'highschool',   // Grades 9-10
  HIGHER_SECONDARY: 'higher_secondary', // Grades 11-12
  AFTER_10: 'after10',        // After 10th (Grade 11)
  AFTER_12: 'after12',        // After 12th
  COLLEGE: 'college'          // UG/PG
}
```

### Assessment Sections by Grade

| Grade Level | Sections | Count | Has Knowledge? |
|-------------|----------|-------|----------------|
| Middle School | Interest Explorer, Strengths, Learning Preferences | 3 | No |
| High School | Interest Explorer, Strengths, Learning Preferences, Aptitude Sampling | 4 | No |
| After 10th | RIASEC, Big Five, Work Values, Employability, Aptitude | 5 | **No** (stream-agnostic) |
| After 12th | RIASEC, Big Five, Work Values, Employability, Aptitude, Knowledge | 6 | Yes |
| College | RIASEC, Big Five, Work Values, Employability, Aptitude, Knowledge | 6 | Yes |

### Timers
```typescript
TIMERS = {
  ADAPTIVE_QUESTION_TIME_LIMIT: 90,      // seconds per adaptive question
  APTITUDE_INDIVIDUAL_TIME_LIMIT: 60,    // seconds per aptitude question
  APTITUDE_SHARED_TIME_LIMIT: 900,       // 15 minutes for shared aptitude
  KNOWLEDGE_TIME_LIMIT: 1800,            // 30 minutes for knowledge
  AUTO_SAVE_INTERVAL: 30000,             // 30 seconds
  TIME_WARNING_THRESHOLD: 60,            // Show warning at 60s
  TIME_CRITICAL_THRESHOLD: 10            // Critical warning at 10s
}
```

### Response Scales

**RIASEC (Interests)**: 1=Strongly Dislike, 2=Dislike, 3=Neutral, 4=Like, 5=Strongly Like

**Big Five (Personality)**: 1=Very Inaccurate, 2=Moderately Inaccurate, 3=Neither, 4=Moderately Accurate, 5=Very Accurate

**Work Values**: 1=Not Important, 2=Slightly Important, 3=Moderately Important, 4=Very Important, 5=Extremely Important

**Employability**: 1=Not Like Me, 2=Slightly, 3=Somewhat, 4=Mostly, 5=Very Much Like Me

**High School (4-point)**: 1=Not me, 2=A bit, 3=Mostly, 4=Strongly me

### Environment Behavior

| Feature | localhost | skillpassport.pages.dev | skilldevelopment.rareminds.in |
|---------|-----------|-------------------------|-------------------------------|
| Test Mode | ✅ Enabled | ✅ Enabled | ❌ Disabled |
| All Grade Options | ✅ Visible | ✅ Visible | ❌ Filtered by detected grade |
| Console Logging | ✅ Verbose | ✅ Verbose | ⚠️ Minimal |
| Auto-fill | ✅ Available | ✅ Available | ❌ Not available |

---

## Testing & Debugging

### Test Mode Controls

**Enable**: Press `Ctrl+Shift+T` or add `?testMode=true` to URL

**Features**:
- **Auto-fill**: Fills all questions with valid random answers
- **Jump to Section**: Click section name in progress bar
- **Skip Validation**: Next button always enabled
- **Fast-forward Timers**: Click timer to skip
- **View State**: Console logs all state changes

**Auto-fill Behavior**:
- Creates database attempt on first auto-fill
- Saves all answers to database (real-time)
- Preserves existing answers (merge, not replace)
- Works with resume (auto-fills remaining questions)

### Console Logging

**Key Events Logged**:
- Assessment start/resume
- Section transitions
- Answer submissions
- Timer state changes
- Database operations
- AI API calls
- Errors and warnings

**Example**:
```javascript
console.log('[Assessment] Starting section:', sectionId);
console.log('[Assessment] Answer saved:', { questionId, answer });
console.log('[Assessment] Progress updated:', { sectionIndex, questionIndex });
```

### Common Issues & Solutions

#### Issue: Resume shows wrong question count
**Cause**: Double-counting questions (static + AI)
**Solution**: Fixed in `RESUME_ISSUE_DIAGNOSIS.md` - now counts correctly

#### Issue: Resume shows blank screen
**Cause**: Out-of-bounds section/question index
**Solution**: Fixed in `RESUME_OUT_OF_BOUNDS_FIX.md` - added bounds checking

#### Issue: Result page shows "No results found"
**Cause**: Missing `attemptId` parameter
**Solution**: Always pass `attemptId` when navigating to result page

#### Issue: Test mode submit button doesn't work
**Cause**: Submit button not triggering submission
**Solution**: Fixed in `TEST_MODE_SUBMIT_BUTTON_FIX.md` - now works correctly

#### Issue: Auto-fill doesn't save to database
**Cause**: No attempt created before auto-fill
**Solution**: Fixed in `AUTO_FILL_FIX_SUMMARY.md` - creates attempt first

---

## Troubleshooting

### Debugging Checklist

1. **Check browser console** for errors and warnings
2. **Verify database state** in Supabase dashboard
3. **Check attemptId** in URL parameters
4. **Verify student profile** (grade, program, etc.)
5. **Test in different environments** (localhost vs production)
6. **Use test mode** to isolate issues
7. **Check network tab** for API failures

### Database Queries

**Check in-progress attempts**:
```sql
SELECT * FROM personal_assessment_attempts
WHERE student_id = 'xxx' AND status = 'in_progress'
ORDER BY started_at DESC;
```

**Check responses**:
```sql
SELECT * FROM personal_assessment_responses
WHERE attempt_id = 'xxx'
ORDER BY created_at;
```

**Check results**:
```sql
SELECT * FROM personal_assessment_results
WHERE student_id = 'xxx'
ORDER BY created_at DESC;
```

### Support Resources

- **Complete Guide**: `ASSESSMENT_SYSTEM_COMPLETE_GUIDE.md` (1,467 lines)
- **Quick Reference**: `ASSESSMENT_QUICK_REFERENCE.md` (150 lines)
- **AI Architecture**: `AI_ANALYSIS_ARCHITECTURE.md` (800 lines)
- **Database Schema**: `DATABASE_SCHEMA_COMPLETE.md` (complete definitions)

---

**Last Updated**: January 18, 2026  
**Status**: ✅ Production-Ready  
**Version**: 2.0
