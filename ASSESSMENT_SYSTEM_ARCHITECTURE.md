` URL parameter to load specific results

5. **Fallback**: If database fails, localStorage provides backup data

6. **Course Recommendations**: Uses `platformCourses` field (not `courseRecommendations`) from AI results
 Gaps, Courses)
         └── RoadmapSection (Projects, Internships)
```

---

## 📝 KEY POINTS

1. **Data Persistence**: Results are saved to both localStorage (backup) and Supabase database (primary)

2. **AI Analysis**: Uses Cloudflare Workers with OpenRouter AI (xiaomi/mimo-v2-flash:free model)

3. **Grade Levels**: System supports multiple grade levels:
   - `middle` (6-8)
   - `highschool` (9-10)
   - `higher_secondary` (11-12)
   - `after12` (College/UG)

4. **Navigation**: Results page uses `?attemptId=xxx     ├── Check URL for attemptId
   │     ├── Load from database (getAttemptWithResults)
   │     └── Fallback to localStorage
   │
   ├── Calculate enhanced recommendations
   │     │
   │     ├── calculateCourseMatchScores()
   │     └── calculateStreamRecommendations()
   │
   └── Render results components
         │
         ├── ReportHeader
         ├── SummaryCard
         ├── ProfileSection (RIASEC, Aptitude, BigFive)
         ├── CareerSection (Career Fit, Roles, Salaries)
         ├── SkillsSection (Skill question banks
   ├── Call analyzeAssessmentWithGemini()
   │     │
   │     └── POST to analyze-assessment-api
   │           │
   │           └── OpenRouter AI analysis
   │                 │
   │                 └── Returns gemini_results
   │
   ├── Enhance results (adaptive aptitude, courses)
   ├── Save to personal_assessment_results
   └── Navigate to /student/assessment/result?attemptId=xxx

5. VIEWING RESULTS
   │
   ├── AssessmentResult.jsx loads
   ├── useAssessmentResults() hook
   │     │
   │rom personal_assessment_streams
   ├── Student selects stream (e.g., btech_ece)
   ├── Create attempt in personal_assessment_attempts
   └── Load questions (AI-generated or from database)

3. ANSWERING QUESTIONS
   │
   ├── Display section intro
   ├── Show questions one by one
   ├── Save each response to personal_assessment_responses
   ├── Track timing per section
   └── Handle timed sections (auto-advance)

4. ASSESSMENT SUBMISSION (handleSubmit)
   │
   ├── Save answers to localStorage (backup)
   ├── Prepare }

POST /career-assessment/generate-aptitude
  - Input: { stream, gradeLevel, questionCount }
  - Output: { questions: [...] }

POST /career-assessment/generate-knowledge
  - Input: { stream, gradeLevel, questionCount }
  - Output: { questions: [...] }
```

---

## 🔄 COMPLETE FLOW SEQUENCE

```
1. STUDENT STARTS ASSESSMENT
   │
   ├── AssessmentTest.jsx loads
   ├── useAssessment() initializes
   ├── Check for in-progress attempt
   └── Show stream selection

2. STREAM SELECTION
   │
   ├── Fetch streams f Worker | URL | Purpose |
|--------|-----|---------|
| analyze-assessment-api | https://analyze-assessment-api.dark-mode-d021.workers.dev | AI career analysis |
| assessment-api | https://assessment-api.dark-mode-d021.workers.dev | Question generation |
| adaptive-aptitude-api | https://adaptive-aptitude-api.dark-mode-d021.workers.dev | Adaptive testing |

### Endpoints

```
POST /analyze-assessment
  - Input: { assessmentData: { answers, stream, gradeLevel, timings } }
  - Output: { success: true, data: geminiResultsam": "PCMS",
    "streamFit": "High",
    "confidenceScore": 85,
    "alternativeStream": "Commerce with Maths"
  },
  
  // Career Roadmap
  "roadmap": {
    "projects": [{ "title": "...", "purpose": "...", "output": "..." }],
    "internship": { "types": [...], "timeline": "..." },
    "exposure": { "activities": [...], "certifications": [...] }
  },
  
  // Overall Summary
  "overallSummary": "This student shows exceptional analytical aptitude..."
}
```

---

## 🌐 API ENDPOINTS

### Cloudflare Workers

|E Knowledge", "currentLevel": 1, "targetLevel": 3 }],
    "priorityB": [{ "skill": "Leadership" }],
    "recommendedTrack": "Electronics Fundamentals Bootcamp"
  },
  
  // Platform Course Recommendations
  "platformCourses": [
    {
      "course_id": "uuid",
      "code": "CORP126",
      "title": "Cyber Security",
      "skill_type": "technical",
      "relevance_score": 70
    }
  ],
  
  // Stream Recommendation (for after10 students)
  "streamRecommendation": {
    "isAfter10": true,
    "recommendedStrematchScore": 85,
      "roles": {
        "entry": ["Data Analyst", "Business Analyst"],
        "mid": ["Senior Analyst", "Data Scientist"]
      },
      "domains": ["IT Services", "Financial Services"]
    }],
    "specificOptions": {
      "highFit": [{ "name": "Data Analyst", "salary": { "min": 4, "max": 12 } }],
      "mediumFit": [...],
      "exploreLater": [...]
    }
  },
  
  // Skill Gap Analysis
  "skillGap": {
    "currentStrengths": ["Communication", "Teamwork"],
    "priorityA": [{ "skill": "Core ECues
  "workValues": {
    "scores": { "Security": 8, "Autonomy": 7, ... },
    "topThree": [{ "value": "Security", "score": 8 }, ...]
  },
  
  // Employability Skills
  "employability": {
    "skillScores": { "Communication": 8, "Teamwork": 7, ... },
    "overallReadiness": "Medium",
    "strengthAreas": ["Communication"],
    "improvementAreas": ["Leadership"]
  },
  
  // Career Fit Analysis
  "careerFit": {
    "clusters": [{
      "title": "Data Analytics & Business Intelligence",
      "fit": "High",
      "   "abstract": { "correct": 5, "total": 8, "percentage": 62.5 },
      "spatial": { "correct": 4, "total": 6, "percentage": 66.7 },
      "clerical": { "correct": 18, "total": 20, "percentage": 90 }
    },
    "overallScore": 76,
    "topStrengths": ["Clerical", "Numerical"],
    "areasToImprove": ["Abstract"]
  },
  
  // Big Five Personality
  "bigFive": {
    "O": 18, "C": 20, "E": 15, "A": 17, "N": 12,
    "dominantTraits": ["Conscientiousness", "Openness"],
    "workStyleSummary": "..."
  },
  
  // Work Val { "R": 12, "I": 15, "A": 8, "S": 10, "E": 14, "C": 11 },
    "code": "ICE",
    "topThree": ["I", "C", "E"],
    "interpretation": "..."
  },
  
  // Aptitude Test Results
  "aptitude": {
    "scores": {
      "verbal": { "correct": 6, "total": 8, "percentage": 75 },
      "numerical": { "correct": 7, "total": 8, "percentage": 87.5 },
        │         └──▶ assessmentService.getLatestResult()
                 │                   │
                 │                   └──▶ personal_assessment_results table
                 │
                 └── PRIORITY 3: localStorage (fallback)
                           │
                           └──▶ assessment_gemini_results key
```

---

## 📦 DATA STRUCTURES

### gemini_results (JSONB) - Stored in personal_assessment_results

```javascript
{
  // RIASEC Interest Inventory
  "riasec": {
    "scores":2. AssessmentResult.jsx → Data Loading

```
AssessmentResult.jsx
       │
       └──▶ useAssessmentResults() hook
                 │
                 ├── PRIORITY 1: URL ?attemptId=xxx
                 │         │
                 │         └──▶ assessmentService.getAttemptWithResults()
                 │                   │
                 │                   └──▶ personal_assessment_results table
                 │
                 ├── PRIORITY 2: Latest database result
                 │         │
                 │                   └── completeAttempt()
       │
       ├──▶ analyzeAssessmentWithGemini()
       │         │
       │         └──▶ Cloudflare Worker: analyze-assessment-api
       │                   │
       │                   └──▶ OpenRouter AI (xiaomi/mimo-v2-flash:free)
       │
       └──▶ loadCareerAssessmentQuestions()
                 │
                 └──▶ Cloudflare Worker: assessment-api
                           │
                           └──▶ OpenRouter AI (question generation)
```

### alysis worker
    │   └── src/index.ts
    └── assessment-api/             ◀── Question generation worker
        └── src/index.ts
```

---

## 🔗 DETAILED LINKING FLOW

### 1. AssessmentTest.jsx → Services

```
AssessmentTest.jsx
       │
       ├──▶ useAssessment() hook
       │         │
       │         └──▶ assessmentService.js
       │                   │
       │                   ├── createAttempt()
       │                   ├── saveResponse()
       │                   ├── updateAttemptProgress()
      ◀── Adaptive testing logic
│
└── cloudflare-workers/
    ├── analyze-assessment-api/     ◀── AI an
│       │       └── RoadmapSection.jsx
│       │
│       └── utils/
│           ├── courseMatchingEngine.js
│           └── streamMatchingEngine.js
│
├── services/
│   ├── assessmentService.js        ◀── Database CRUD operations
│   ├── geminiAssessmentService.js  ◀── AI analysis (Cloudflare Worker)
│   ├── careerAssessmentAIService.js ◀── AI question generation
│   └── courseRecommendationService.js
│
├── hooks/
│   ├── useAssessment.js            ◀── Assessment state management
│   └── useAdaptiveAptitude.ts     │   └── sections/
│       │       ├── ProfileSection.jsx
│       │       ├── CareerSection.jsx─ calculateStreamRecommendations (util)
│       │   │
│       │   └── COMPONENTS:
│       │       ├── PrintView
│       │       ├── ReportHeader
│       │       ├── ProfileSection
│       │       ├── CareerSection
│       │       ├── SkillsSection
│       │       └── RoadmapSection
│       │
│       ├── hooks/
│       │   └── useAssessmentResults.js  ◀── Data loading logic
│       │
│       ├── components/
│       │   ├── PrintView.jsx
│       │   ├── ReportHeader.jsx
│       │   ├── CareerTrackModal.jsx
│    entWithGemini (service)
│   │   │   ├── loadCareerAssessmentQuestions (service)
│   │   │   └── assessmentService (database operations)
│   │   │
│   │   └── NAVIGATES TO:
│   │       └── /student/assessment/result?attemptId=xxx
│   │
│   └── assessment-result/
│       ├── AssessmentResult.jsx    ◀── Results display page
│       │   │
│       │   ├── IMPORTS:
│       │   │   ├── useAssessmentResults (hook)
│       │   │   ├── calculateCourseMatchScores (util)
│       │   │   └─useAssessment (hook)
│   │   │   ├── useAdaptiveAptitude (hook)
│   │   │   ├── analyzeAssessm─────────┘     │ aptitude_scores (jsonb)      │
                                     │ career_fit (jsonb)           │
                                     │ skill_gap_courses (jsonb)    │
                                     │ grade_level                  │
                                     └──────────────────────────────┘
```

---

## 📁 FILE STRUCTURE & LINKING

```
src/
├── pages/student/
│   ├── AssessmentTest.jsx          ◀── Main assessment taking page
│   │   │
│   │   ├── IMPORTS:
│   │   │   ├── │ responded_at                 │     │ riasec_scores (jsonb)        │
└──────────────────────────────┐
│ personal_assessment_responses│     │ personal_assessment_results  │
├──────────────────────────────┤     ├──────────────────────────────┤
│ id (uuid) PK                 │     │ id (uuid) PK                 │
│ attempt_id (uuid) FK         │     │ attempt_id (uuid) FK         │
│ question_id (uuid) FK        │     │ student_id (uuid) FK         │
│ response_value (jsonb)       │     │ stream_id (varchar)          │
│ is_correct                   │     │ gemini_results (jsonb) ◀──── │ AI Analysis
             │ 1:N
              ▼
┌──────────────────────────────┐     ┌─────────────────────FK         │
│ stream_id (varchar) FK       │     │ stream_id (varchar)          │
│ grade_level                  │     │ question_text                │
│ status                       │     │ options (jsonb)              │
│ current_section_index        │     │ correct_answer               │
│ current_question_index       │     └──────────────────────────────┘
│ section_timings (jsonb)      │
│ started_at                   │
│ completed_at                 │
└──────────────────────────────┘
              │
 dent_id (uuid) FK         │     │ section_id (uuid)                                    └──────────────────────────────┘
              │                                    │
              │                                    │
              ▼                                    ▼
┌──────────────────────────────┐     ┌──────────────────────────────┐
│ personal_assessment_attempts │     │ personal_assessment_questions│
├──────────────────────────────┤     ├──────────────────────────────┤
│ id (uuid) PK                 │     │ id (uuid) PK                 │
│ stu    │     │ time_limit_seconds           │
└──────────────────────────────┘     │ grade_level                  │
  ───────────────────────────┐     ┌──────────────────────────────┐
│ personal_assessment_streams  │     │ personal_assessment_sections │
├──────────────────────────────┤     ├──────────────────────────────┤
│ id (varchar) PK              │     │ id (uuid) PK                 │
│ label                        │     │ name                         │
│ description                  │     │ title                        │
│ grade_level                  │     │ is_timed                     │
│ is_active                ──────────────────────────────────────────────────────────┘

┌───                                       │
                                       ▼
                               ┌───────────────┐
                               │ Cloudflare    │
                               │ Worker API    │
                               └───────────────┘
```

---

## 🗄️ DATABASE SCHEMA

### Tables Used

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE TABLES                                    │
└───────────────────│
                               │    ANALYSIS   │
                               └───────────────┘
   │
                    ▼                  ▼                  ▼
            ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
            │ D1: streams   │  │ D2: attempts  │  │ D3: results   │
            │               │  │ D4: responses │  │               │
            └───────────────┘  └───────────────┘  └───────────────┘
                                       │
                                       ▼
                               ┌───────────────┐
                               │ 4.0 AI               │                  │               UDENT
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
            ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
            │ 1.0 SELECT    │  │ 2.0 TAKE      │  │ 3.0 VIEW      │
            │    STREAM     │  │    ASSESSMENT │  │    RESULTS    │
            └───────────────┘  └───────────────┘  └───────────────┘
             ─────────────┘

                                    ST         ┌──────────────┐           ┌──────────────┐
                   │   SUPABASE   │           │  CLOUDFLARE  │
                   │   DATABASE   │           │   WORKERS    │
                   └──────────────┘           └──────────────┘
```

### Level 1 - Main Processes

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ASSESSMENT SYSTEM DFD                               │
└────────────────────────────────────────────────────────────────────                         ▼
          STEM         │  Results    │          │
     │ STUDENT  │────────────▶│                     │────────────▶│ STUDENT  │
     │          │             │  (AssessmentTest +  │             │          │
     └──────────┘             │   AssessmentResult) │             └──────────┘
                              │                     │
                              └─────────────────────┘
                                       │ │
                          ┌────────────┘ └────────────┐
                          ▼  │      SY                                                              └──────────────┘
```

---

## 📊 DATA FLOW DIAGRAM (DFD)

### Level 0 - Context Diagram

```
                              ┌─────────────────────┐
                              │                     │
     ┌──────────┐             │    ASSESSMENT       │             ┌──────────┐
     │          │  Answers                       │ Navigate to  │
                                                               │ Results Page │
 ──────────┐
                                                               │ Save Results │
                                                               │ (Database)   │
                                                               └──────────────┘
                                                                      │
                                                                      ▼
                                                               ┌──────────────┐
                                                                 │
                                                                      ▼
                                                               ┌────└──────────────┘     └──────────────┘
                                                              │ Create       │     │ Save         │     │ AI Analysis  │
                     │ Attempt      │     │ Responses    │     │ (Cloudflare) │
                     │ (Database)   │     │ (Database)   │     │              │
                     └──────────────┘     ────────┐     ┌──────────────┐
        sessment │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                            │                    │                     │
                            ▼                    ▼                     ▼
                     ┌──────────────┐     ┌──────│   Stream     │     │   Questions  │     │   As───────────┐
│   Student    │────▶│   Select     │────▶│   Answer     │────▶│   Submit     │
│   Login      │     t System consists of two main pages:
1. **AssessmentTest.jsx** - Where students take the assessment
2. **AssessmentResult.jsx** - Where students view their results

---

## 🔄 USER FLOW DIAGRAM (UFD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STUDENT ASSESSMENT FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌───# Assessment System Architecture

## Overview

The Career Assessmen