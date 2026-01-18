# Where AI Analysis Happens - Quick Answer

> **Direct answer to: "From where is this analysis happening? Frontend or backend or worker or anywhere else?"**

---

## 🎯 Quick Answer

The AI analysis happens in **3 locations** working together:

```
1. FRONTEND (React)
   ↓ prepares data, calculates scores
   
2. CLOUDFLARE WORKER
   ↓ builds prompts, calls AI API
   
3. OPENROUTER AI (External)
   ↓ performs actual analysis
   
Response flows back: AI → Worker → Frontend
```

---

## 📍 Detailed Breakdown

### 1. Frontend (React) - Data Preparation
**Location**: `src/services/geminiAssessmentService.js`

**What happens here:**
- ✅ Extracts answers from assessment
- ✅ Calculates aptitude scores (verbal, numerical, abstract, spatial, clerical)
- ✅ Calculates knowledge scores (correct/total)
- ✅ Formats timing data
- ✅ **FOR AFTER 10TH**: Calculates rule-based stream recommendation
  - Analyzes RIASEC scores
  - Detects flat profiles (undifferentiated interests)
  - Generates stream hint with confidence score
- ✅ Sends prepared data to Cloudflare Worker

**Key Functions:**
- `prepareAssessmentData()` - Prepares all data
- `callOpenRouterAssessment()` - Calls worker API
- `analyzeAssessmentWithOpenRouter()` - Main export

**Does NOT happen here:**
- ❌ AI prompt building
- ❌ AI API calls
- ❌ Final AI analysis

---

### 2. Cloudflare Worker - Prompt Building & API Management
**Location**: `cloudflare-workers/analyze-assessment-api/`

**What happens here:**
- ✅ Receives assessment data from frontend
- ✅ Authenticates user
- ✅ Checks rate limits
- ✅ Builds grade-specific prompts (5000+ lines for After 10th)
- ✅ **FOR AFTER 10TH**: Includes rule-based stream hint in prompt
- ✅ Calls OpenRouter AI API
- ✅ Tries multiple AI models (Gemini 2.0 → Gemini 1.5 → Claude → Xiaomi)
- ✅ Parses JSON response from AI
- ✅ Returns results to frontend

**Key Files:**
- `src/index.ts` - Worker entry point
- `src/handlers/analyzeHandler.ts` - Main handler
- `src/services/openRouterService.ts` - AI API calls
- `src/prompts/college.ts` - After 10th & After 12th prompts
- `src/prompts/highSchool.ts` - Grades 9-12 prompts
- `src/prompts/middleSchool.ts` - Grades 6-8 prompts

**Does NOT happen here:**
- ❌ Actual AI analysis (that's in OpenRouter)
- ❌ Score calculation (that's in frontend)

---

### 3. OpenRouter AI - Actual Analysis
**Location**: External API - `https://openrouter.ai/api/v1/chat/completions`

**What happens here:**
- ✅ Receives prompt with all assessment data
- ✅ Analyzes RIASEC scores
- ✅ Analyzes aptitude scores
- ✅ Analyzes personality traits (Big Five)
- ✅ Analyzes work values
- ✅ Analyzes employability skills
- ✅ **FOR AFTER 10TH**: 
  - Considers rule-based stream hint from frontend
  - Matches RIASEC + aptitude pattern to stream
  - Recommends stream (PCMB/PCMS/PCM/PCB/Commerce/Arts)
  - Provides confidence score (75-100%)
  - Suggests alternative stream
  - Aligns career clusters with recommended stream
- ✅ Generates 3 career clusters (High/Medium/Explore fit)
- ✅ Provides skill gap analysis
- ✅ Creates personalized roadmap
- ✅ Returns JSON response

**AI Models Used (in order):**
1. `google/gemini-2.0-flash-exp:free` (Primary)
2. `google/gemini-flash-1.5-8b` (Backup)
3. `anthropic/claude-3.5-sonnet` (Premium)
4. `xiaomi/mimo-v2-flash:free` (Fallback)

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  File: src/services/geminiAssessmentService.js              │
│                                                              │
│  1. User submits assessment                                 │
│  2. prepareAssessmentData()                                 │
│     • Extract answers by section                            │
│     • Calculate aptitude scores                             │
│     • Calculate knowledge scores                            │
│     • FOR AFTER 10TH: Calculate rule-based stream hint      │
│  3. callOpenRouterAssessment()                              │
│     • POST to worker API                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP POST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              CLOUDFLARE WORKER                               │
│  Location: cloudflare-workers/analyze-assessment-api/       │
│                                                              │
│  4. handleAnalyzeAssessment()                               │
│     • Authenticate user                                     │
│     • Check rate limits                                     │
│  5. buildAnalysisPrompt()                                   │
│     • Route to grade-specific prompt builder               │
│     • FOR AFTER 10TH: Include rule-based hint in prompt    │
│  6. analyzeAssessment()                                     │
│     • Try multiple AI models                                │
│     • Call OpenRouter API                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS POST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              OPENROUTER AI (External)                        │
│  URL: https://openrouter.ai/api/v1/chat/completions        │
│                                                              │
│  7. AI Model (Gemini 2.0 / Claude)                          │
│     • Analyze all assessment data                           │
│     • FOR AFTER 10TH: Consider rule-based hint              │
│     • Match RIASEC + aptitude pattern to stream             │
│     • Generate career recommendations                       │
│     • Return JSON response                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ JSON Response
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              CLOUDFLARE WORKER                               │
│  8. extractJsonFromResponse()                               │
│     • Parse AI response                                     │
│     • Return to frontend                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ JSON Response
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  9. validateResults()                                       │
│     • Validate response structure                           │
│     • FOR AFTER 10TH: Validate stream recommendation       │
│  10. addCourseRecommendations()                             │
│     • Fetch courses from database                           │
│  11. saveResultsToDatabase()                                │
│     • Save to assessment_results table                      │
│  12. Display results to student                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Insight: Hybrid Approach for After 10th

For After 10th students, the system uses a **hybrid approach**:

1. **Frontend calculates** rule-based stream recommendation (deterministic algorithm)
2. **Worker includes** this as a hint in the AI prompt
3. **AI considers** the hint + full assessment data (holistic analysis)
4. **AI makes final decision** with natural language reasoning

**Why this works:**
- ✅ Rule-based provides **anchor** (prevents AI drift)
- ✅ AI provides **explanation** (natural language reasoning)
- ✅ AI can **override** if compelling evidence exists
- ✅ Result: **Accurate + Explainable + Personalized**

---

## 📂 File Locations Summary

### Frontend Files
```
src/
├── services/
│   ├── geminiAssessmentService.js    # Main AI service
│   └── assessmentService.js          # Validation
├── features/assessment/
│   ├── career-test/hooks/
│   │   └── useAssessmentSubmission.ts
│   └── assessment-result/
│       └── hooks/
│           └── useAssessmentResults.js
```

### Worker Files
```
cloudflare-workers/analyze-assessment-api/
├── src/
│   ├── index.ts                      # Entry point
│   ├── handlers/
│   │   └── analyzeHandler.ts         # Main handler
│   ├── services/
│   │   └── openRouterService.ts      # AI API calls
│   └── prompts/
│       ├── index.ts                  # Prompt router
│       ├── college.ts                # After 10th & 12th
│       ├── highSchool.ts             # Grades 9-12
│       └── middleSchool.ts           # Grades 6-8
```

---

## 🔗 For More Details

See **AI_ANALYSIS_ARCHITECTURE.md** for:
- Complete code examples
- Step-by-step breakdown
- After 10th stream recommendation algorithm
- Prompt building details
- Response validation
- Testing instructions

---

**Last Updated**: January 17, 2026
