# 📊 Assessment System Architecture

A comprehensive career assessment system with 5 sections that analyzes student interests, personality, values, aptitude, and stream-specific knowledge to provide personalized career recommendations.

---

## 🎯 5 Assessment Sections Overview

| #   | Section       | Purpose                | Questions | Model             |
| --- | ------------- | ---------------------- | --------- | ----------------- |
| 1   | **Interest**  | Career interests       | 48        | Holland's RIASEC  |
| 2   | **Strengths** | Personality traits     | 30        | Big Five (OCEAN)  |
| 3   | **Learning**  | Work preferences       | 24        | Work Values       |
| 4   | **Aptitude**  | Skills & employability | 31        | Self-rating + SJT |
| 5   | **Adaptive**  | Stream knowledge       | 10-30     | AI-generated MCQs |

---

## 📁 File Structure

```
src/features/assessment/
├── career-test/                          # Assessment Taking
│   ├── AssessmentTestPage.tsx            # Main assessment page
│   ├── hooks/
│   │   ├── useAssessmentState.ts         # State management
│   │   └── useAIQuestions.ts             # AI question loading
│   └── components/
│       └── screens/
│           └── AnalyzingScreen.tsx       # Loading screen during AI analysis
│
├── assessment-result/                    # Results Display
│   ├── AssessmentResult.jsx              # Main results page
│   ├── hooks/
│   │   └── useAssessmentResults.js       # Loads results from DB
│   └── utils/
│       ├── courseMatchingEngine.js       # Course recommendations (after12)
│       └── streamMatchingEngine.js       # Stream recommendations (after10)
│
├── data/
│   └── questions/                        # Question Banks
│       ├── index.ts                      # Main exports
│       ├── riasecQuestions.ts            # Interest (48 questions)
│       ├── bigFiveQuestions.ts           # Strengths (30 questions)
│       ├── workValuesQuestions.ts        # Learning (24 questions)
│       ├── employabilityQuestions.ts     # Aptitude (31 questions)
│       ├── streamKnowledgeQuestions.ts   # Adaptive (per stream)
│       └── scoringUtils.ts               # Scoring utilities
│
└── ASSESSMENT_ARCHITECTURE.md            # This file

cloudflare-workers/analyze-assessment-api/  # AI Analysis Worker
├── src/
│   ├── index.ts                          # Entry point
│   ├── handlers/
│   │   └── analyzeHandler.ts             # /analyze-assessment endpoint
│   ├── services/
│   │   └── openRouterService.ts          # OpenRouter AI calls
│   ├── prompts/
│   │   ├── index.ts                      # Prompt router
│   │   ├── middleSchool.ts               # Grades 6-8 prompt
│   │   ├── highSchool.ts                 # Grades 9-12 prompt
│   │   └── college.ts                    # After 10th/12th prompt
│   └── utils/
│       └── jsonParser.ts                 # AI response parser
└── wrangler.toml                         # Cloudflare config

src/services/
├── assessmentService.js                  # CRUD for attempts/results
├── geminiAssessmentService.js            # Calls Cloudflare Worker
└── courseRecommendationService.js        # Course recommendations
```

---

## 🗄️ Database Tables (Supabase)

### `personal_assessment_attempts`

Tracks each assessment attempt.

| Column                   | Type    | Description                                  |
| ------------------------ | ------- | -------------------------------------------- |
| `id`                     | UUID    | Primary key                                  |
| `student_id`             | UUID    | FK to students                               |
| `stream_id`              | VARCHAR | Selected stream (cs, bca, bba, etc.)         |
| `grade_level`            | TEXT    | 'middle', 'highschool', 'after10', 'after12' |
| `status`                 | VARCHAR | 'in_progress', 'completed', 'abandoned'      |
| `section_timings`        | JSONB   | Time spent per section                       |
| `current_section_index`  | INT     | Progress tracking                            |
| `current_question_index` | INT     | Progress tracking                            |

### `personal_assessment_results`

Stores AI analysis results.

| Column                 | Type    | Description                      |
| ---------------------- | ------- | -------------------------------- |
| `id`                   | UUID    | Primary key                      |
| `attempt_id`           | UUID    | FK to attempts                   |
| `student_id`           | UUID    | FK to students                   |
| `riasec_scores`        | JSONB   | `{R:0, I:0, A:0, S:0, E:0, C:0}` |
| `riasec_code`          | VARCHAR | Top 2-3 types, e.g., "IR", "ASE" |
| `bigfive_scores`       | JSONB   | `{O:0, C:0, E:0, A:0, N:0}`      |
| `work_values_scores`   | JSONB   | Work values analysis             |
| `aptitude_scores`      | JSONB   | Aptitude breakdown               |
| `employability_scores` | JSONB   | Soft skills scores               |
| `knowledge_score`      | NUMERIC | Stream knowledge percentage      |
| `career_fit`           | JSONB   | Career cluster recommendations   |
| `skill_gap`            | JSONB   | Skills to develop                |
| `roadmap`              | JSONB   | Development plan                 |
| `gemini_results`       | JSONB   | **Full AI response**             |

### `personal_assessment_responses`

Individual question responses.

| Column           | Type    | Description       |
| ---------------- | ------- | ----------------- |
| `attempt_id`     | UUID    | FK to attempts    |
| `question_id`    | UUID    | FK to questions   |
| `response_value` | JSONB   | Student's answer  |
| `is_correct`     | BOOLEAN | For MCQ questions |

### `personal_assessment_sections`

Section definitions by grade level.

### `personal_assessment_streams`

Available streams (cs, bca, bba, dm, animation).

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  1. STUDENT STARTS ASSESSMENT                                           │
│     └── Creates attempt in: personal_assessment_attempts                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  2. STUDENT ANSWERS 5 SECTIONS                                          │
│     ├── Interest (RIASEC)      → 48 questions                          │
│     ├── Strengths (Big Five)   → 30 questions                          │
│     ├── Learning (Work Values) → 24 questions                          │
│     ├── Aptitude (Employability) → 31 questions                        │
│     └── Adaptive (Stream)      → 10-30 questions                       │
│                                                                         │
│     Each answer saved to: personal_assessment_responses                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  3. CALL CLOUDFLARE WORKER                                              │
│     └── geminiAssessmentService.js → POST /analyze-assessment           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  4. AI ANALYSIS (Cloudflare Worker)                                     │
│     ├── analyzeHandler.ts → Receives request                           │
│     ├── prompts/*.ts → Builds prompt for grade level                   │
│     ├── openRouterService.ts → Calls OpenRouter (xiaomi/mimo-v2-flash) │
│     └── jsonParser.ts → Parses AI response                             │
│                                                                         │
│     AI Returns:                                                         │
│     ├── riasec: { code, scores, interpretation }                       │
│     ├── bigFive: { dominantTraits, scores }                            │
│     ├── workValues: { topThree, scores }                               │
│     ├── employability: { strengthAreas, skillScores }                  │
│     ├── careerFit: { clusters: [...] }                                 │
│     ├── streamRecommendation: { recommendedStream, reasoning }         │
│     ├── skillGap: { priorityA, priorityB }                             │
│     └── roadmap: { projects, milestones }                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  5. SAVE RESULTS                                                        │
│     └── assessmentService.js → completeAttempt()                       │
│     └── Saves to: personal_assessment_results                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  6. DISPLAY RESULTS                                                     │
│     └── AssessmentResult.jsx                                           │
│         ├── RIASEC Chart                                               │
│         ├── Big Five Traits                                            │
│         ├── Career Clusters                                            │
│         ├── Stream Recommendation (after10)                            │
│         ├── Course Recommendations (after12)                           │
│         └── Skill Gap & Roadmap                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Section Details

### 1️⃣ Interest (RIASEC)

**File:** `data/questions/riasecQuestions.ts`

**Holland's RIASEC Model:**

- **R** - Realistic: Hands-on, tools, practical
- **I** - Investigative: Analysis, science, logic
- **A** - Artistic: Creative, ideas, expression
- **S** - Social: Helping, teaching, teamwork
- **E** - Enterprising: Leading, persuading, risk-taking
- **C** - Conventional: Order, systems, detail

**Sample Question:**

```typescript
{ id: 'r1', type: 'R', text: 'Repair a broken appliance or device.' }
```

**Response Scale:** 1-5 (Strongly Disagree to Strongly Agree)

---

### 2️⃣ Strengths (Big Five)

**File:** `data/questions/bigFiveQuestions.ts`

**OCEAN Model:**

- **O** - Openness: Curiosity, creativity
- **C** - Conscientiousness: Organization, discipline
- **E** - Extraversion: Sociability, energy
- **A** - Agreeableness: Cooperation, empathy
- **N** - Neuroticism: Emotional stability

**Sample Question:**

```typescript
{ id: 'o1', type: 'O', text: 'I enjoy exploring new ideas.' }
```

---

### 3️⃣ Learning (Work Values)

**File:** `data/questions/workValuesQuestions.ts`

**8 Value Types:**

- Security/Stability
- Autonomy/Independence
- Creativity/Innovation
- Status/Recognition
- Impact/Service
- Financial Reward
- Leadership/Influence
- Lifestyle/Balance

**Sample Question:**

```typescript
{ id: 'sec1', type: 'Security', text: 'A predictable job with steady income.' }
```

---

### 4️⃣ Aptitude (Employability)

**File:** `data/questions/employabilityQuestions.ts`

**Part A: Self-Rating (25 questions)**

- Communication (3)
- Teamwork (3)
- Problem Solving (3)
- Adaptability (3)
- Leadership (3)
- Digital Fluency (3)
- Professionalism (3)
- Career Readiness (4)

**Part B: Situational Judgement Test (6 scenarios)**

```typescript
{
  id: 'sjt1',
  scenario: 'Team member not contributing',
  text: 'Your teammate misses tasks repeatedly. You:',
  options: [...],
  best: 'b',
  worst: 'd'
}
```

---

### 5️⃣ Adaptive (Stream Knowledge)

**File:** `data/questions/streamKnowledgeQuestions.ts`

**Available Streams:**
| Stream | ID | Questions |
|--------|-----|-----------|
| B.Sc Computer Science | `cs` | 30 |
| BCA General | `bca` | 10 |
| BBA General | `bba` | 10 |
| Digital Marketing | `dm` | 10 |
| Animation | `animation` | 10 |

**Sample Question:**

```typescript
{
  id: 'cs1',
  text: 'What does CPU stand for?',
  options: ['Central Processing Unit', 'Computer Personal Unit', ...],
  correct: 'Central Processing Unit'
}
```

---

## ☁️ Cloudflare Worker API

**Endpoint:** `POST /analyze-assessment`

**URL:** `https://analyze-assessment-api.dark-mode-d021.workers.dev/analyze-assessment`

### Prompt Routing by Grade Level

The Cloudflare Worker routes to different prompts based on `gradeLevel`:

```typescript
// From prompts/index.ts

export function buildPrompt(assessmentData: AssessmentData): string {
  const { gradeLevel } = assessmentData;

  switch (gradeLevel) {
    case 'middle':
      return buildMiddleSchoolPrompt(assessmentData); // Grades 6-8

    case 'highschool':
    case 'higher_secondary':
      return buildHighSchoolPrompt(assessmentData); // Grades 9-12

    case 'after10':
      return buildCollegePrompt(assessmentData); // isAfter10 = true

    case 'after12':
    case 'college':
      return buildCollegePrompt(assessmentData); // isAfter10 = false

    default:
      return buildCollegePrompt(assessmentData);
  }
}
```

### Prompt Files

| File              | Grade Levels              | Key Output                    |
| ----------------- | ------------------------- | ----------------------------- |
| `middleSchool.ts` | 6-8                       | Career exploration, interests |
| `highSchool.ts`   | 9-12                      | Career guidance, aptitude     |
| `college.ts`      | after10, after12, college | Stream/Course recommendations |

### After 10th vs After 12th

The `college.ts` prompt handles both with an `isAfter10` flag:

```typescript
// From college.ts

const isAfter10 = gradeLevel === 'after10';

if (isAfter10) {
  // MANDATORY: Stream recommendation (Science/Commerce/Arts)
  // Output: recommendedStream, streamReasoning
} else {
  // Course/Degree recommendations
  // Output: courseRecommendations, careerPaths
}
```

**Request:**

```json
{
  "assessmentData": {
    "stream": "cs",
    "gradeLevel": "after12",
    "riasecAnswers": {...},
    "bigFiveAnswers": {...},
    "workValuesAnswers": {...},
    "employabilityAnswers": {...},
    "knowledgeAnswers": {...},
    "sectionTimings": {...}
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "riasec": { "code": "IR", "scores": {...}, "interpretation": "..." },
    "bigFive": { "dominantTraits": [...], "scores": {...} },
    "workValues": { "topThree": [...], "scores": {...} },
    "employability": { "strengthAreas": [...], "skillScores": {...} },
    "careerFit": { "clusters": [...] },
    "streamRecommendation": { "recommendedStream": "PCMS", ... },
    "skillGap": { "priorityA": [...], "priorityB": [...] },
    "roadmap": { "projects": [...], "milestones": [...] }
  }
}
```

---

## 🎓 Grade Levels

| Grade Level         | Sections                      | Output                                                 |
| ------------------- | ----------------------------- | ------------------------------------------------------ |
| `middle` (6-8)      | Interest, Strengths, Learning | Career exploration                                     |
| `highschool` (9-10) | All 5 sections                | Career guidance                                        |
| `after10`           | All 5 sections                | **Stream recommendation** (PCMS, PCMB, Commerce, Arts) |
| `after12`           | All 5 sections                | **Course/Degree recommendations**                      |

---

## 🔍 Grade Level Detection Flow

### How Grade Level is Determined

The system uses a **user-selected** grade level, not auto-detected from the database. Here's the complete flow:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  1. STUDENT DATA (students table)                                       │
│     ├── grade: "Grade 10" (stored in DB)                               │
│     ├── school_class_id → school_classes.grade: "10"                   │
│     └── academic_year: "2024-2025"                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  2. GRADE DETECTION (useStudentGrade.ts)                                │
│     ├── Fetches student.grade from DB                                  │
│     ├── Calls getGradeLevelFromGrade("Grade 10")                       │
│     └── Returns detectedGradeLevel: "highschool" (grades 9-10)         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  3. GRADE SELECTION SCREEN (GradeSelectionScreen.jsx)                   │
│     ├── Shows options based on detectedGradeLevel                      │
│     ├── For Grade 10 student with 6+ months:                           │
│     │   ├── Shows "Grades 9-10" option                                 │
│     │   └── Shows "After 10th" option ← USER CAN SELECT THIS           │
│     └── User clicks "After 10th" → onGradeSelect("after10")            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  4. ASSESSMENT CREATION (AssessmentTestPage.tsx)                        │
│     ├── handleGradeSelect("after10") called                            │
│     ├── flow.setGradeLevel("after10")                                  │
│     ├── flow.setStudentStream("general") ← auto-set for after10        │
│     └── dbStartAssessment("general", "after10")                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  5. DATABASE STORAGE (personal_assessment_attempts)                     │
│     ├── grade_level: "after10" ← USER-SELECTED, not auto-detected      │
│     └── stream_id: "general"                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  6. AI PROMPT ROUTING (prompts/index.ts)                                │
│     ├── gradeLevel === "after10" → buildCollegePrompt(isAfter10=true)  │
│     └── Stream recommendation is MANDATORY for after10                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Files in Grade Level Flow

| File                                  | Purpose                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `constants/config.ts`                 | Defines GRADE_RANGES: middle(6-8), highschool(9-10), higher_secondary(11-12) |
| `utils/gradeUtils.ts`                 | `getGradeLevelFromGrade()` - converts "Grade 10" → "highschool"              |
| `hooks/useStudentGrade.ts`            | Fetches student grade from DB, calculates `detectedGradeLevel`               |
| `components/GradeSelectionScreen.jsx` | Shows grade options, handles user selection                                  |
| `AssessmentTestPage.tsx`              | `handleGradeSelect()` - creates attempt with user-selected grade             |
| `services/assessmentService.js`       | `createAttempt()` - saves grade_level to DB                                  |

### Grade Level Visibility Rules

The `GradeSelectionScreen` shows different options based on:

```javascript
// From GradeSelectionScreen.jsx

// Extract numeric grade from various formats (e.g., "Grade 10", "10th", "10")
const extractNumericGrade = (grade) => {
  if (!grade) return null;
  const gradeStr = String(grade).toLowerCase().trim();
  const match = gradeStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

// In shouldShowOption():
const numericGrade = extractNumericGrade(studentGrade);
const isGrade10 = numericGrade === 10;
const isGrade12 = numericGrade === 12;
const hasBeenInGrade6Months = monthsInGrade !== null && monthsInGrade >= 6;

case 'highschool':
  // Show for grades 9-10, but NOT for grade 10 students with 6+ months
  if (isGrade10 && hasBeenInGrade6Months) return false;
  return detectedGradeLevel === 'highschool';

case 'after10':
  // Show for grade 10 students with 6+ months
  return detectedGradeLevel === 'highschool' && isGrade10 && hasBeenInGrade6Months;
```

### `grade_start_date` Field

The `students.grade_start_date` field determines assessment eligibility:

| Field              | Type | Description                                   |
| ------------------ | ---- | --------------------------------------------- |
| `grade_start_date` | DATE | Date when student started their current grade |

**Calculation:**

```typescript
// From gradeUtils.ts - calculateMonthsInGrade()
const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
```

**Fallback:** If `grade_start_date` is null, the system estimates from `school_classes.academic_year`:

```typescript
// e.g., "2024-2025" → June 2024 (assumed start)
const estimatedStartDate = `${startYear}-06-01`;
```

### Example: Grade 10 Student

| Student Data           | Value          |
| ---------------------- | -------------- |
| `students.grade`       | "Grade 10"     |
| `school_classes.grade` | "10"           |
| `academic_year`        | "2024-2025"    |
| `monthsInGrade`        | 7 (calculated) |

**Detected Grade Level:** `highschool` (from GRADE_RANGES)

**Options Shown:**

- ❌ "Grades 9-10" (hidden because 6+ months in grade 10)
- ✅ "After 10th" (shown because grade 10 + 6+ months)

**User Selects:** "After 10th"

**Stored in DB:** `grade_level: "after10"` (user's choice, not auto-detected)

### Why This Design?

1. **User Agency:** Students can choose the assessment that best fits their situation
2. **Transition Period:** Grade 10 students nearing completion can take "After 10th" assessment
3. **Stream Recommendation:** "After 10th" assessment provides stream recommendations (Science/Commerce/Arts)
4. **Flexibility:** Same student data can result in different assessments based on user choice

---

## 🔧 Environment Variables

### Frontend (.env)

```
VITE_ASSESSMENT_API_URL=https://analyze-assessment-api.dark-mode-d021.workers.dev
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Cloudflare Worker (wrangler.toml / secrets)

```
OPENROUTER_API_KEY=your-openrouter-key
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 📊 AI Model

**Provider:** OpenRouter  
**Model:** `xiaomi/mimo-v2-flash:free`  
**Temperature:** 0.1 (deterministic)  
**Max Tokens:** 8000

---

## 🚀 Quick Start

1. **Take Assessment:** Navigate to `/student/assessment/test`
2. **Complete 5 Sections:** ~30-45 minutes
3. **View Results:** Automatically redirected to `/student/assessment/result`

---

## 📚 Related Documentation

- [ASSESSMENT_FLOW_DIAGRAM.md](../../ASSESSMENT_FLOW_DIAGRAM.md)
- [ASSESSMENT_DATABASE_SETUP.md](../../ASSESSMENT_DATABASE_SETUP.md)
- [GEMINI_ASSESSMENT_INTEGRATION.md](../../GEMINI_ASSESSMENT_INTEGRATION.md)
