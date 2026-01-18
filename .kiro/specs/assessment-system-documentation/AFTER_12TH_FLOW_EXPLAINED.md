# After 12th Assessment Flow - Complete Explanation

> **How the assessment works for students who have completed 12th grade**

## 🎯 Overview

After 12th students go through a **category-based assessment** where they first select their field of interest (Science/Commerce/Arts), then take a comprehensive assessment with AI-generated questions tailored to their chosen stream.

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: User visits /student/assessment/test                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: System checks for in-progress attempt                  │
│  • Queries: personal_assessment_attempts table                   │
│  • Condition: status = 'in_progress' AND student_id = user       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    │  Found attempt?   │
                    └─────────┬─────────┘
                    YES ↓     ↓ NO
                        ↓     ↓
        ┌───────────────┘     └───────────────┐
        ↓                                     ↓
┌──────────────────┐              ┌──────────────────┐
│ ResumePrompt     │              │ GradeSelection   │
│ Screen           │              │ Screen           │
│ • Stream: Science│              │ • Middle School  │
│ • Progress: 45%  │              │ • High School    │
│ • 47 questions   │              │ • After 10th     │
│ • Resume/Fresh   │              │ ▶ After 12th ◀   │
└──────────────────┘              │ • College        │
                                  └──────────────────┘
                                           ↓
                              User selects "After 12th"
                                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: CategorySelectionScreen (UNIQUE TO AFTER 12TH)         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   SCIENCE    │  │   COMMERCE   │  │     ARTS     │          │
│  │ Engineering, │  │  Business,   │  │ Literature,  │          │
│  │ Medical,     │  │  Finance,    │  │ Social Sci,  │          │
│  │ Pure Sciences│  │  Accounting  │  │ Design       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  User clicks one → Sets category (e.g., "science")              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Category = "science"
                    Stream = "science" (used directly)
                              ↓

┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: System builds sections for After 12th + Science        │
│  • RIASEC (Interests) - 48 questions                            │
│  • Big Five (Personality) - 50 questions                         │
│  • Work Values - 21 questions                                    │
│  • Employability Skills - 20 questions                           │
│  • Aptitude (AI-generated, Science-specific) - 15 questions      │
│  • Adaptive Aptitude (IRT-based) - ~21 questions                 │
│  Total: ~175 questions                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: Section Intro Screen (First Section: RIASEC)           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  🌹 RIASEC - Career Interests                              │ │
│  │                                                            │ │
│  │  Discover your Holland Code by rating activities          │ │
│  │  you enjoy. This helps identify career types that         │ │
│  │  match your interests.                                     │ │
│  │                                                            │ │
│  │  📊 48 Questions | ⏱️ No time limit                        │ │
│  │                                                            │ │
│  │  [Start Section] ←── User clicks here                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ⚠️ IMPORTANT: Database attempt created on first click!         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Creates DB record:
                    • grade_level: 'after12'
                    • stream_id: 'science'
                    • status: 'in_progress'
                    • current_section_index: 0
                    • current_question_index: 0
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: Question Loop (Example: RIASEC Question 1)             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  QUESTION 1 / 48                                           │ │
│  │                                                            │ │
│  │  How much do you like this activity?                       │ │
│  │  "Build things with your hands"                            │ │
│  │                                                            │ │
│  │  ○ Strongly Dislike                                        │ │
│  │  ○ Dislike                                                 │ │
│  │  ● Neutral          ←── User selects                       │ │
│  │  ○ Like                                                    │ │
│  │  ○ Strongly Like                                           │ │
│  │                                                            │ │
│  │  [Previous]  [Next] ←── Enabled after selection            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ✅ Answer saved to DB immediately:                             │
│  • Table: personal_assessment_attempts                          │
│  • Column: all_responses (JSONB)                                │
│  • Key: "riasec_q1"                                             │
│  • Value: 3                                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Repeat for all 48 RIASEC questions
                              ↓

┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: Section Complete Screen                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ✅ RIASEC Section Complete!                               │ │
│  │                                                            │ │
│  │  Great job! You completed this section in 3 minutes.       │ │
│  │                                                            │ │
│  │  Next: Big Five - Personality Assessment                   │ │
│  │                                                            │ │
│  │  [Continue to Next Section]                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  💾 Section timing saved: { "riasec": 180 }                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        Repeat Steps 5-7 for remaining sections:
        • Big Five (50 questions)
        • Work Values (21 questions)
        • Employability (20 questions)
        • Aptitude (15 AI-generated questions)
        • Adaptive Aptitude (~21 questions)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 8: AI-Generated Aptitude Section (Science-Specific)       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  🤖 AI-POWERED                                             │ │
│  │  Aptitude Assessment                                        │ │
│  │                                                            │ │
│  │  Questions tailored to Science stream                      │ │
│  │  • Numerical reasoning                                     │ │
│  │  • Logical reasoning                                       │ │
│  │  • Spatial reasoning                                       │ │
│  │                                                            │ │
│  │  📊 15 Questions | ⏱️ 60 seconds per question              │ │
│  │                                                            │ │
│  │  [Start Section]                                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  🔍 Questions loaded from:                                      │
│  • Cache: personal_assessment_questions table                   │
│  • Filter: stream_id = 'science', section_type = 'aptitude'    │
│  • If not cached: Generate via OpenRouter API                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 9: Adaptive Aptitude Section (IRT-Based)                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  🎯 Adaptive Aptitude Test                                 │ │
│  │                                                            │ │
│  │  Difficulty adjusts based on your performance              │ │
│  │  • Starts at medium difficulty                             │ │
│  │  • Gets harder if you answer correctly                     │ │
│  │  • Gets easier if you answer incorrectly                   │ │
│  │                                                            │ │
│  │  📊 ~21 Questions | ⏱️ 90 seconds per question             │ │
│  │                                                            │ │
│  │  [Start Section]                                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  🧠 Uses Item Response Theory (IRT):                            │
│  • Creates adaptive_aptitude_sessions record                    │
│  • Tracks ability estimate in real-time                        │
│  • Adjusts difficulty dynamically                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓

┌─────────────────────────────────────────────────────────────────┐
│  STEP 10: Final Section Complete - Ready to Submit              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ✅ All Sections Complete!                                 │ │
│  │                                                            │ │
│  │  Congratulations! You've completed all 6 sections.         │ │
│  │  Total time: 28 minutes                                    │ │
│  │                                                            │ │
│  │  Your responses will now be analyzed by our AI to          │ │
│  │  generate personalized career recommendations.             │ │
│  │                                                            │ │
│  │  [Submit Assessment] ←── User clicks                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 11: AnalyzingScreen - Multi-Stage Progress                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  🧠 Analyzing Your Assessment                              │ │
│  │                                                            │ │
│  │  [████████████████░░░░] 70%                                │ │
│  │                                                            │ │
│  │  🎯 AI Analysis in Progress                                │ │
│  │  Our AI is analyzing your interests, personality,          │ │
│  │  and aptitudes...                                          │ │
│  │                                                            │ │
│  │  Stages:                                                   │ │
│  │  ✅ Preparing (0-10%)                                      │ │
│  │  ✅ Sending to AI (10-20%)                                 │ │
│  │  🔄 Analyzing (20-70%) ← Current                           │ │
│  │  ⏳ Processing Results (70-85%)                            │ │
│  │  ⏳ Finding Courses (85-95%)                               │ │
│  │  ⏳ Saving Report (95-100%)                                │ │
│  │                                                            │ │
│  │  💡 Fun Fact: 85% of jobs in 2030 haven't been            │ │
│  │     invented yet!                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 12: AI Analysis via Gemini                                │
│  • Collects all answers from database                           │
│  • Calculates RIASEC scores (R, I, A, S, E, C)                  │
│  • Calculates Big Five scores (O, C, E, A, N)                   │
│  • Calculates Work Values scores                                │
│  • Calculates Employability score                               │
│  • Analyzes aptitude performance                                │
│  • Sends to Gemini AI for comprehensive analysis                │
│  • Receives career recommendations, courses, action plan         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 13: Save Results to Database                              │
│  Table: personal_assessment_results                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ riasec_scores: { R: 3.2, I: 4.8, A: 2.1, S: 3.5, ... }    │ │
│  │ riasec_code: "IAS"                                         │ │
│  │ bigfive_scores: { O: 4.5, C: 3.8, E: 4.2, ... }           │ │
│  │ work_values: { achievement: 4.5, ... }                     │ │
│  │ employability_score: 4.2                                   │ │
│  │ aptitude_scores: { numerical: 75, logical: 82, ... }      │ │
│  │ recommended_careers: [                                     │ │
│  │   { name: "Software Engineer", fit_score: 92, ... },      │ │
│  │   { name: "Data Scientist", fit_score: 88, ... },         │ │
│  │   ...                                                      │ │
│  │ ]                                                          │ │
│  │ recommended_courses: [ ... ]                               │ │
│  │ skill_gaps: ["Communication", "Leadership"]                │ │
│  │ action_plan: "1. Focus on...\n2. Develop..."              │ │
│  │ ai_analysis: "Full detailed analysis text..."             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 14: Navigate to Results Page                              │
│  Route: /student/assessment/result                              │
│  • Displays comprehensive career report                         │
│  • Shows RIASEC profile with radar chart                        │
│  • Shows Big Five personality insights                          │
│  • Lists top 5-10 recommended careers                           │
│  • Suggests relevant courses                                    │
│  • Provides personalized action plan                            │
│  • Shows skill gaps to work on                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Differences for After 12th

### 1. **Category Selection (Unique)**
After 12th is the ONLY grade level that shows the category selection screen:
- Science
- Commerce  
- Arts/Humanities

Other grades skip this step entirely.

### 2. **Stream Usage**
- **After 12th**: Category becomes the stream (e.g., "science")
- **After 10th**: Uses "general" stream (AI recommends best stream later)
- **College**: Uses actual program (e.g., "B.Tech CS/IT" → normalized to "cs")
- **Middle/High School**: Uses grade-specific stream ("middle_school", "high_school")

### 3. **AI Question Generation**
After 12th students get **stream-specific AI questions**:
- Science students: Numerical, logical, spatial reasoning
- Commerce students: Numerical, verbal, data interpretation
- Arts students: Verbal, abstract, creative reasoning

### 4. **Comprehensive Assessment**
After 12th includes ALL 6 sections:
1. RIASEC (48 questions)
2. Big Five (50 questions)
3. Work Values (21 questions)
4. Employability (20 questions)
5. Aptitude - AI-generated (15 questions)
6. Adaptive Aptitude - IRT-based (~21 questions)

**Total: ~175 questions | Average time: 25-35 minutes**

---

## 💾 Database Records Created

### 1. Assessment Attempt
```sql
INSERT INTO personal_assessment_attempts (
  student_id,
  grade_level,
  stream_id,
  status,
  current_section_index,
  current_question_index,
  all_responses,
  section_timings
) VALUES (
  'uuid-student-123',
  'after12',
  'science',
  'in_progress',
  0,
  0,
  '{}',
  '{}'
);
```

### 2. AI-Generated Questions (if not cached)
```sql
INSERT INTO personal_assessment_questions (
  stream_id,
  section_type,
  subtag,
  question_text,
  options,
  correct_answer,
  difficulty
) VALUES (
  'science',
  'aptitude',
  'numerical',
  'What is 2 + 2?',
  '["2", "3", "4", "5"]',
  '4',
  'easy'
);
```

### 3. Adaptive Aptitude Session
```sql
INSERT INTO adaptive_aptitude_sessions (
  student_id,
  grade_level,
  status,
  current_phase,
  current_difficulty,
  ability_estimate,
  questions_answered
) VALUES (
  'uuid-student-123',
  'after12',
  'active',
  'warmup',
  0.50,
  NULL,
  0
);
```

### 4. Final Results
```sql
INSERT INTO personal_assessment_results (
  attempt_id,
  student_id,
  grade_level,
  stream_id,
  riasec_scores,
  riasec_code,
  bigfive_scores,
  work_values,
  employability_score,
  aptitude_scores,
  recommended_careers,
  recommended_courses,
  skill_gaps,
  action_plan,
  ai_analysis
) VALUES (
  'uuid-attempt-456',
  'uuid-student-123',
  'after12',
  'science',
  '{"R": 3.2, "I": 4.8, ...}',
  'IAS',
  '{"O": 4.5, "C": 3.8, ...}',
  '{"achievement": 4.5, ...}',
  4.2,
  '{"numerical": 75, ...}',
  '[{"name": "Software Engineer", ...}]',
  '[{"title": "Data Structures", ...}]',
  '["Communication", "Leadership"]',
  '1. Focus on...',
  'Full AI analysis...'
);
```

---

## 🎯 What Makes After 12th Special

1. **Career-Focused**: Designed for students making college/career decisions
2. **Stream-Specific**: Questions tailored to chosen field
3. **Comprehensive**: Most detailed assessment (6 sections)
4. **AI-Powered**: Both question generation AND result analysis
5. **Adaptive**: Difficulty adjusts based on performance
6. **Actionable**: Provides specific career paths and courses

---

## 🔄 Resume Capability

If a student closes the browser mid-assessment:

1. **All progress is saved** (answers, position, timings)
2. **Next visit shows ResumePromptScreen**
3. **Can resume from exact position** or start fresh
4. **Timer state restored** (if in timed section)
5. **Adaptive session restored** (if in adaptive section)

---

## ⏱️ Timers for After 12th

| Section | Timer Type | Duration |
|---------|-----------|----------|
| RIASEC | Elapsed | No limit |
| Big Five | Elapsed | No limit |
| Work Values | Elapsed | No limit |
| Employability | Elapsed | No limit |
| Aptitude | Per-question | 60s each |
| Adaptive Aptitude | Per-question | 90s each |

**Auto-save**: Every 10 seconds throughout

---

## 🚫 Restrictions

- **6-month waiting period** between attempts
- **Cannot skip questions** - must answer to proceed
- **Cannot go back** in adaptive sections
- **Auto-submit** if timer expires (aptitude sections)

---

## 📊 Expected Results

After completing the assessment, students receive:

1. **RIASEC Code** (e.g., "IAS" - Investigative, Artistic, Social)
2. **Top 5-10 Career Matches** with fit scores
3. **Personality Profile** (Big Five traits)
4. **Work Values Alignment**
5. **Employability Score** (0-5 scale)
6. **Aptitude Strengths** (numerical, logical, verbal, spatial, abstract)
7. **Recommended Courses** with relevance scores
8. **Skill Gaps** to work on
9. **Personalized Action Plan**

---

**This is the most comprehensive assessment in the system, designed specifically for students at a critical career decision point!** 🎓
