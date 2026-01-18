# AI Analysis Architecture - Complete Flow Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Complete Data Flow](#complete-data-flow)
4. [Frontend Processing](#frontend-processing)
5. [Cloudflare Worker Processing](#cloudflare-worker-processing)
6. [OpenRouter AI Processing](#openrouter-ai-processing)
7. [After 10th Stream Recommendation Logic](#after-10th-stream-recommendation-logic)
8. [Response Flow Back to Frontend](#response-flow-back-to-frontend)
9. [File Locations](#file-locations)

---

## Overview

The AI analysis for student career assessments happens in a **3-tier architecture**:

```
Frontend (React) → Cloudflare Worker → OpenRouter AI → Response
```

**Key Points:**
- **Frontend**: Prepares data, calculates scores, handles UI
- **Cloudflare Worker**: Builds prompts, manages AI calls, handles retries
- **OpenRouter AI**: Performs actual analysis using Gemini/Claude models
- **After 10th Special**: Rule-based stream recommendation calculated in frontend, sent as hint to AI

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                               │
│  File: src/services/geminiAssessmentService.js                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1. User submits assessment
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    prepareAssessmentData()                               │
│  • Extracts answers by section (RIASEC, BigFive, etc.)                 │
│  • Calculates aptitude scores (verbal, numerical, etc.)                 │
│  • Calculates knowledge scores                                          │
│  • Formats timing data                                                  │
│  • FOR AFTER 10TH: Calculates rule-based stream recommendation         │
│  •   - Analyzes RIASEC scores                                          │
│  •   - Detects flat profiles (undifferentiated interests)              │
│  •   - Generates stream hint with confidence score                     │
│  • Returns: assessmentData object                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 2. Call Cloudflare Worker
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    callOpenRouterAssessment()                            │
│  • Sends POST to: VITE_ASSESSMENT_API_URL                              │
│  • Default: https://analyze-assessment-api.dark-mode-d021.workers.dev  │
│  • Endpoint: /analyze-assessment                                        │
│  • Payload: { assessmentData }                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 3. Worker receives request
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE WORKER                                   │
│  File: cloudflare-workers/analyze-assessment-api/src/index.ts          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 4. Route to handler
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    handleAnalyzeAssessment()                             │
│  File: src/handlers/analyzeHandler.ts                                  │
│  • Authenticates user (or bypasses in dev mode)                        │
│  • Checks rate limits                                                   │
│  • Validates request body                                               │
│  • Calls: analyzeAssessment(env, assessmentData)                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 5. Call AI service
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    analyzeAssessment()                                   │
│  File: src/services/openRouterService.ts                               │
│  • Builds prompt using: buildAnalysisPrompt(assessmentData)            │
│  • Gets system message: getSystemMessage(gradeLevel)                   │
│  • Tries multiple AI models in order:                                  │
│    1. google/gemini-2.0-flash-exp:free (primary)                       │
│    2. google/gemini-flash-1.5-8b (backup)                              │
│    3. anthropic/claude-3.5-sonnet (premium)                            │
│    4. xiaomi/mimo-v2-flash:free (fallback)                             │
│  • Calls: callOpenRouter(env, model, systemMessage, prompt)            │
│  • Parses JSON response                                                 │
│  • Returns: parsed analysis results                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 6. Build grade-specific prompt
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    buildAnalysisPrompt()                                 │
│  File: src/prompts/index.ts                                            │
│  • Routes based on gradeLevel:                                          │
│    - 'middle' → buildMiddleSchoolPrompt()                              │
│    - 'highschool' / 'higher_secondary' → buildHighSchoolPrompt()       │
│    - 'after12' / 'after10' → buildCollegePrompt()                      │
│  • Generates consistency hash for deterministic results                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 7. For After 10th / After 12th
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    buildCollegePrompt()                                  │
│  File: src/prompts/college.ts                                          │
│  • Includes all assessment data (RIASEC, aptitude, personality, etc.)  │
│  • FOR AFTER 10TH ONLY:                                                │
│    - Includes rule-based stream recommendation hint                    │
│    - Includes flat profile detection warning                           │
│    - Provides detailed stream selection algorithm                      │
│    - Maps RIASEC + aptitude patterns to streams                        │
│    - Requires AI to recommend: PCMB/PCMS/PCM/PCB/Commerce/Arts         │
│    - Requires career clusters to align with recommended stream         │
│  • FOR AFTER 12TH:                                                     │
│    - Stream already selected by student                                │
│    - Focuses on career recommendations within that stream              │
│  • Returns: Complete prompt string (5000+ lines for After 10th)        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 8. Call OpenRouter API
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      OPENROUTER AI API                                   │
│  URL: https://openrouter.ai/api/v1/chat/completions                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 9. AI processes prompt
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    AI Model (Gemini 2.0 / Claude)                       │
│  • Analyzes RIASEC scores                                              │
│  • Analyzes aptitude scores                                            │
│  • Analyzes personality traits (Big Five)                              │
│  • Analyzes work values                                                 │
│  • Analyzes employability skills                                        │
│  • FOR AFTER 10TH:                                                     │
│    - Considers rule-based stream hint from frontend                    │
│    - Matches RIASEC + aptitude pattern to stream                       │
│    - Recommends stream: PCMB/PCMS/PCM/PCB/Commerce/Arts                │
│    - Provides confidence score (75-100%)                               │
│    - Suggests alternative stream                                        │
│    - Aligns career clusters with recommended stream                    │
│  • Generates 3 career clusters (High/Medium/Explore fit)               │
│  • Provides skill gap analysis                                          │
│  • Creates personalized roadmap                                         │
│  • Returns: JSON response with complete analysis                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 10. Response flows back
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Worker: extractJsonFromResponse()                     │
│  • Parses AI response                                                   │
│  • Extracts JSON from markdown if needed                               │
│  • Validates structure                                                  │
│  • Returns to frontend                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 11. Frontend receives response
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Frontend: validateResults()                           │
│  • Validates response structure                                         │
│  • Checks for missing fields                                            │
│  • FOR AFTER 10TH: Validates stream recommendation                     │
│  • Adds course recommendations                                          │
│  • Saves to database                                                    │
│  • Displays results to student                                          │
└─────────────────────────────────────────────────────────────────────────┘

```

---

## Complete Data Flow

### Step-by-Step Breakdown

#### **STEP 1: User Submits Assessment (Frontend)**
**Location**: `src/features/assessment/career-test/hooks/useAssessmentSubmission.ts`

```javascript
// User clicks "Submit Assessment"
const handleSubmit = async () => {
  // Save to localStorage (backup)
  localStorage.setItem('assessment_answers', JSON.stringify(answers));
  localStorage.setItem('assessment_stream', stream);
  localStorage.setItem('assessment_grade_level', gradeLevel);
  
  // Call AI analysis
  const results = await analyzeAssessmentWithGemini(
    answers,
    stream,
    questionBanks,
    sectionTimings,
    gradeLevel
  );
};
```

---

#### **STEP 2: Prepare Assessment Data (Frontend)**
**Location**: `src/services/geminiAssessmentService.js`
**Function**: `prepareAssessmentData()`

```javascript
const prepareAssessmentData = (answers, stream, questionBanks, sectionTimings, gradeLevel) => {
  // Extract answers by section
  const riasecAnswers = extractRiasecAnswers(answers);
  const aptitudeScores = calculateAptitudeScores(answers);
  const bigFiveAnswers = extractBigFiveAnswers(answers);
  const workValuesAnswers = extractWorkValuesAnswers(answers);
  const employabilityAnswers = extractEmployabilityAnswers(answers);
  const knowledgeAnswers = extractKnowledgeAnswers(answers);
  
  // Calculate timing metrics
  const timingData = calculateTimingMetrics(sectionTimings);
  
  // FOR AFTER 10TH ONLY: Calculate rule-based stream recommendation
  let ruleBasedStreamHint = null;
  if (gradeLevel === 'after10') {
    ruleBasedStreamHint = calculateStreamRecommendations(riasecAnswers, aptitudeScores);
  }
  
  return {
    stream,
    gradeLevel,
    riasecAnswers,
    aptitudeScores,
    bigFiveAnswers,
    workValuesAnswers,
    employabilityAnswers,
    knowledgeAnswers,
    sectionTimings: timingData,
    ruleBasedStreamHint  // Only for After 10th
  };
};
```

**What happens here:**
- Extracts all answers from the flat `answers` object
- Groups by section (RIASEC, aptitude, personality, etc.)
- Calculates scores (aptitude correct/total, knowledge correct/total)
- Formats timing data
- **FOR AFTER 10TH**: Calculates rule-based stream recommendation using scoring algorithm

---

#### **STEP 3: Call Cloudflare Worker (Frontend)**
**Location**: `src/services/geminiAssessmentService.js`
**Function**: `callOpenRouterAssessment()`

```javascript
const callOpenRouterAssessment = async (assessmentData) => {
  const apiUrl = import.meta.env.VITE_ASSESSMENT_API_URL || 
                 'https://analyze-assessment-api.dark-mode-d021.workers.dev';
  
  const response = await fetch(`${apiUrl}/analyze-assessment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseToken}`
    },
    body: JSON.stringify({ assessmentData })
  });
  
  const data = await response.json();
  return data.data;  // Returns parsed AI results
};
```

**What happens here:**
- Sends prepared data to Cloudflare Worker
- Includes authentication token
- Worker URL is configurable via environment variable

---

#### **STEP 4: Worker Receives Request**
**Location**: `cloudflare-workers/analyze-assessment-api/src/handlers/analyzeHandler.ts`
**Function**: `handleAnalyzeAssessment()`

```typescript
export async function handleAnalyzeAssessment(request: Request, env: Env) {
  // Authenticate user
  const auth = await authenticateUser(request, env);
  const studentId = auth.user.id;
  
  // Rate limiting
  if (!checkRateLimit(studentId)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429);
  }
  
  // Parse request
  const { assessmentData } = await request.json();
  
  // Analyze with AI
  const results = await analyzeAssessment(env, assessmentData);
  
  return jsonResponse({ success: true, data: results });
}
```

**What happens here:**
- Authenticates the user (or bypasses in dev mode)
- Checks rate limits (prevents abuse)
- Validates request body
- Calls AI analysis service

---

#### **STEP 5: Build Prompt (Worker)**
**Location**: `cloudflare-workers/analyze-assessment-api/src/prompts/college.ts`
**Function**: `buildCollegePrompt()`

This is where the **magic happens** for After 10th students!

```typescript
export function buildCollegePrompt(assessmentData: AssessmentData, answersHash: number): string {
  const isAfter10 = assessmentData.gradeLevel === 'after10';
  const ruleBasedHint = assessmentData.ruleBasedStreamHint;
  
  // Build massive prompt with:
  // 1. All assessment data (RIASEC, aptitude, personality, etc.)
  // 2. Scoring rules and formulas
  // 3. FOR AFTER 10TH: Stream recommendation algorithm
  // 4. FOR AFTER 10TH: Rule-based hint from frontend
  // 5. Expected JSON output structure
  
  const prompt = `
    You are a career counselor analyzing a ${gradeLevel} student.
    
    ${isAfter10 ? `
      ## CRITICAL: AFTER 10TH STREAM RECOMMENDATION
      This student needs guidance on which 11th/12th stream to choose.
      
      ## RULE-BASED RECOMMENDATION (from frontend):
      Recommended Stream: ${ruleBasedHint.stream}
      Confidence: ${ruleBasedHint.confidence}%
      RIASEC Scores: ${JSON.stringify(ruleBasedHint.riasecScores)}
      Alternative: ${ruleBasedHint.alternativeStream}
      
      ${ruleBasedHint.profileAnalysis.isFlatProfile ? `
        ## FLAT PROFILE WARNING
        This student has undifferentiated interests!
        - Max confidence: 70%
        - Present multiple valid stream options
        - Emphasize aptitude scores over interests
      ` : ''}
      
      ## STREAM SELECTION ALGORITHM:
      Available Streams:
      - PCMB (Physics, Chemistry, Maths, Biology) - for Medicine/Healthcare
      - PCMS (Physics, Chemistry, Maths, CS) - for Engineering/Technology
      - PCM (Physics, Chemistry, Maths) - for Core Engineering
      - PCB (Physics, Chemistry, Biology) - for Allied Health
      - Commerce with Maths - for Finance/Accounting
      - Commerce without Maths - for Business/Management
      - Arts with Psychology - for Counseling/HR
      - Arts with Economics - for Civil Services/Policy
      - Arts General - for Law/Media/Creative
      
      ## MATCHING RULES:
      | RIASEC Pattern | Aptitude Pattern | Recommended Stream |
      |----------------|------------------|-------------------|
      | High I + High Numerical + High Abstract | PCMS or PCM |
      | High I + High Numerical + Biology Interest | PCMB or PCB |
      | High E + High C + High Numerical | Commerce with Maths |
      | High A + High S + High Verbal | Arts with Psychology |
      
      ## CAREER CLUSTERS MUST ALIGN WITH STREAM:
      - Cluster 1 & 2: From PRIMARY recommended stream
      - Cluster 3: From ALTERNATIVE stream
    ` : ''}
    
    ## Assessment Data:
    RIASEC: ${JSON.stringify(assessmentData.riasecAnswers)}
    Aptitude: ${JSON.stringify(assessmentData.aptitudeScores)}
    Big Five: ${JSON.stringify(assessmentData.bigFiveAnswers)}
    Work Values: ${JSON.stringify(assessmentData.workValuesAnswers)}
    Employability: ${JSON.stringify(assessmentData.employabilityAnswers)}
    Knowledge: ${JSON.stringify(assessmentData.knowledgeAnswers)}
    
    Return ONLY valid JSON with this structure:
    {
      "riasec": { ... },
      "aptitude": { ... },
      "bigFive": { ... },
      "workValues": { ... },
      "employability": { ... },
      "knowledge": { ... },
      "careerFit": {
        "clusters": [
          { "title": "...", "fit": "High", "matchScore": 85, ... },
          { "title": "...", "fit": "Medium", "matchScore": 75, ... },
          { "title": "...", "fit": "Explore", "matchScore": 65, ... }
        ]
      },
      "streamRecommendation": {
        "isAfter10": ${isAfter10},
        "recommendedStream": "${isAfter10 ? '<REQUIRED>' : 'N/A'}",
        "streamFit": "${isAfter10 ? '<High/Medium>' : 'N/A'}",
        "confidenceScore": "${isAfter10 ? '<75-100>' : 'N/A'}",
        "reasoning": { ... },
        "alternativeStream": "...",
        "careerPathsAfter12": [ ... ]
      },
      ...
    }
  `;
  
  return prompt;
}
```

**What happens here:**
- Builds a comprehensive prompt (5000+ lines for After 10th)
- Includes ALL assessment data
- **FOR AFTER 10TH**: Includes rule-based stream hint from frontend
- **FOR AFTER 10TH**: Provides detailed stream selection algorithm
- **FOR AFTER 10TH**: Requires AI to recommend a specific stream
- Specifies exact JSON output structure

---

#### **STEP 6: Call OpenRouter AI (Worker)**
**Location**: `cloudflare-workers/analyze-assessment-api/src/services/openRouterService.ts`
**Function**: `analyzeAssessment()`

```typescript
export async function analyzeAssessment(env: Env, assessmentData: AssessmentData) {
  const prompt = buildAnalysisPrompt(assessmentData);
  const systemMessage = getSystemMessage(assessmentData.gradeLevel);
  
  // Try multiple AI models in order
  const AI_MODELS = [
    'google/gemini-2.0-flash-exp:free',  // Primary: Gemini 2.0 (free, fast)
    'google/gemini-flash-1.5-8b',        // Backup: Gemini 1.5 8B
    'anthropic/claude-3.5-sonnet',       // Premium: Claude 3.5
    'xiaomi/mimo-v2-flash:free'          // Fallback: Xiaomi free
  ];
  
  for (const model of AI_MODELS) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,  // Low for consistency
          max_tokens: 16000
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        return extractJsonFromResponse(content);
      }
    } catch (error) {
      console.error(`Model ${model} failed:`, error);
      // Try next model
    }
  }
  
  throw new Error('All AI models failed');
}
```

**What happens here:**
- Calls OpenRouter API with the built prompt
- Tries multiple AI models (Gemini 2.0 → Gemini 1.5 → Claude → Xiaomi)
- Uses low temperature (0.1) for consistent results
- Parses JSON response from AI
- Returns structured analysis

---

#### **STEP 7: AI Processes Request (OpenRouter)**
**Location**: External API - `https://openrouter.ai/api/v1/chat/completions`

The AI model (typically Gemini 2.0 Flash) receives the prompt and:

1. **Analyzes RIASEC scores** - Calculates interest patterns
2. **Analyzes aptitude scores** - Identifies cognitive strengths
3. **Analyzes personality traits** - Big Five personality profile
4. **Analyzes work values** - What motivates the student
5. **Analyzes employability skills** - Career readiness

**FOR AFTER 10TH STUDENTS:**
6. **Considers rule-based stream hint** - Frontend's calculated recommendation
7. **Matches RIASEC + aptitude pattern** - Uses algorithm from prompt
8. **Recommends stream** - PCMB/PCMS/PCM/PCB/Commerce/Arts
9. **Provides confidence score** - 75-100% based on pattern clarity
10. **Suggests alternative stream** - Second-best option
11. **Aligns career clusters** - Clusters 1&2 from primary stream, Cluster 3 from alternative

**FOR AFTER 12TH STUDENTS:**
6. **Uses pre-selected stream** - Student already chose stream
7. **Focuses on career recommendations** - Within that stream

**FOR ALL STUDENTS:**
12. **Generates 3 career clusters** - High fit, Medium fit, Explore fit
13. **Provides skill gap analysis** - What to learn
14. **Creates personalized roadmap** - Projects, internships, certifications

Returns JSON response with complete analysis.

---

#### **STEP 8: Response Flows Back (Worker → Frontend)**
**Location**: Worker parses response, Frontend receives it

```typescript
// Worker: Extract JSON from AI response
const results = extractJsonFromResponse(aiResponse);
return jsonResponse({ success: true, data: results });
```

```javascript
// Frontend: Receive and validate
const parsedResults = await callOpenRouterAssessment(assessmentData);

// FOR AFTER 10TH: Validate stream recommendation
if (gradeLevel === 'after10') {
  parsedResults = validateStreamRecommendation(parsedResults);
}

// Add course recommendations
const resultsWithCourses = await addCourseRecommendations(parsedResults);

// Save to database
await saveResultsToDatabase(resultsWithCourses);

// Display to student
navigate('/student/assessment/result');
```

---

## Frontend Processing

### File: `src/services/geminiAssessmentService.js`

**Key Functions:**

#### 1. `analyzeAssessmentWithOpenRouter()` (Main Export)
```javascript
export const analyzeAssessmentWithOpenRouter = async (
  answers, 
  stream, 
  questionBanks, 
  sectionTimings, 
  gradeLevel
) => {
  // 1. Prepare data
  const assessmentData = prepareAssessmentData(
    answers, stream, questionBanks, sectionTimings, gradeLevel
  );
  
  // 2. Call worker
  const parsedResults = await callOpenRouterAssessment(assessmentData);
  
  // 3. Validate (especially for After 10th)
  if (gradeLevel === 'after10') {
    parsedResults = validateStreamRecommendation(parsedResults);
  }
  
  // 4. Add course recommendations
  const resultsWithCourses = await addCourseRecommendations(parsedResults);
  
  return resultsWithCourses;
};
```

#### 2. `prepareAssessmentData()` (Data Preparation)
```javascript
const prepareAssessmentData = (answers, stream, questionBanks, sectionTimings, gradeLevel) => {
  // Extract answers by section
  const riasecAnswers = {};
  const aptitudeAnswers = { verbal: [], numerical: [], abstract: [], spatial: [], clerical: [] };
  const bigFiveAnswers = {};
  const workValuesAnswers = {};
  const employabilityAnswers = { selfRating: {}, sjt: [] };
  const knowledgeAnswers = {};
  
  // Parse all answers
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('riasec_')) {
      // Extract RIASEC answers
    } else if (key.startsWith('aptitude_')) {
      // Extract aptitude answers
    } else if (key.startsWith('bigfive_')) {
      // Extract Big Five answers
    } else if (key.startsWith('values_')) {
      // Extract work values answers
    } else if (key.startsWith('employability_')) {
      // Extract employability answers
    } else if (key.startsWith('knowledge_')) {
      // Extract knowledge answers
    }
  });
  
  // Calculate aptitude scores
  const aptitudeScores = {
    verbal: calculateAptitudeScore(aptitudeAnswers.verbal),
    numerical: calculateAptitudeScore(aptitudeAnswers.numerical),
    abstract: calculateAptitudeScore(aptitudeAnswers.abstract),
    spatial: calculateAptitudeScore(aptitudeAnswers.spatial),
    clerical: calculateAptitudeScore(aptitudeAnswers.clerical)
  };
  
  // Calculate knowledge score
  const knowledgeCorrectCount = Object.values(knowledgeAnswers).filter(a => a.isCorrect).length;
  const knowledgeTotalCount = Object.keys(knowledgeAnswers).length;
  
  // FOR AFTER 10TH: Calculate rule-based stream recommendation
  let ruleBasedStreamHint = null;
  if (gradeLevel === 'after10') {
    // Calculate RIASEC scores
    const riasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    Object.values(riasecAnswers).forEach(answer => {
      // Score each RIASEC type based on responses
    });
    
    // Detect flat profile
    const riasecValues = Object.values(riasecScores);
    const maxRiasec = Math.max(...riasecValues);
    const minRiasec = Math.min(...riasecValues);
    const riasecRange = maxRiasec - minRiasec;
    const avgRiasec = riasecValues.reduce((a, b) => a + b, 0) / riasecValues.length;
    const riasecVariance = riasecValues.reduce((sum, val) => 
      sum + Math.pow(val - avgRiasec, 2), 0) / riasecValues.length;
    const riasecStdDev = Math.sqrt(riasecVariance);
    const isFlatProfile = riasecStdDev < 2 || riasecRange < 4;
    
    // Calculate stream recommendation
    const ruleBasedRecommendation = calculateStreamRecommendations(
      { riasec: { scores: riasecScores } },
      { subjectMarks: [], projects: [], experiences: [] }
    );
    
    // Adjust confidence for flat profiles
    let adjustedConfidence = ruleBasedRecommendation.confidenceScore;
    if (isFlatProfile) {
      adjustedConfidence = Math.min(70, adjustedConfidence);
    }
    
    ruleBasedStreamHint = {
      stream: ruleBasedRecommendation.recommendedStream,
      streamId: ruleBasedRecommendation.allStreamScores[0].streamId,
      confidence: adjustedConfidence,
      matchLevel: isFlatProfile ? 'Medium' : ruleBasedRecommendation.streamFit,
      reasoning: ruleBasedRecommendation.reasoning,
      riasecScores: riasecScores,
      alternativeStream: ruleBasedRecommendation.alternativeStream,
      allScores: ruleBasedRecommendation.allStreamScores.slice(0, 3),
      profileAnalysis: {
        isFlatProfile,
        riasecRange,
        riasecStdDev: riasecStdDev.toFixed(2),
        warning: isFlatProfile ? 'Student has undifferentiated interests' : null
      }
    };
  }
  
  return {
    stream,
    gradeLevel,
    riasecAnswers,
    aptitudeScores,
    bigFiveAnswers,
    workValuesAnswers,
    employabilityAnswers,
    knowledgeAnswers,
    sectionTimings: timingData,
    ruleBasedStreamHint  // Only for After 10th
  };
};
```

#### 3. `callOpenRouterAssessment()` (API Call)
```javascript
const callOpenRouterAssessment = async (assessmentData) => {
  const apiUrl = import.meta.env.VITE_ASSESSMENT_API_URL || 
                 'https://analyze-assessment-api.dark-mode-d021.workers.dev';
  
  const response = await fetch(`${apiUrl}/analyze-assessment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseToken}`
    },
    body: JSON.stringify({ assessmentData })
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data;
};
```

---

## Cloudflare Worker Processing

### Directory: `cloudflare-workers/analyze-assessment-api/`

**Structure:**
```
analyze-assessment-api/
├── src/
│   ├── handlers/
│   │   ├── analyzeHandler.ts       # Main analysis endpoint handler
│   │   ├── healthHandler.ts        # Health check endpoint
│   │   └── generateProgramCareerPaths.ts
│   ├── prompts/
│   │   ├── index.ts                # Prompt router
│   │   ├── college.ts              # After 10th & After 12th prompts
│   │   ├── highSchool.ts           # Grades 9-12 prompts
│   │   └── middleSchool.ts         # Grades 6-8 prompts
│   ├── services/
│   │   └── openRouterService.ts    # OpenRouter API integration
│   ├── utils/
│   │   ├── auth.ts                 # Authentication
│   │   ├── cors.ts                 # CORS handling
│   │   ├── hash.ts                 # Consistency hashing
│   │   ├── jsonParser.ts           # JSON extraction
│   │   └── rateLimit.ts            # Rate limiting
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   └── index.ts                    # Worker entry point
├── wrangler.toml                   # Cloudflare config
└── package.json
```

### Key Files:

#### 1. `src/index.ts` (Entry Point)
```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCorsPreFlight();
    }
    
    // Validate environment
    const envError = validateEnvironment(env);
    if (envError) {
      return jsonResponse({ error: envError }, 500);
    }
    
    // Route requests
    const url = new URL(request.url);
    switch (url.pathname) {
      case '/analyze-assessment':
        return handleAnalyzeAssessment(request, env);
      case '/health':
        return handleHealthCheck();
      default:
        return jsonResponse({ error: 'Not found' }, 404);
    }
  }
};
```

#### 2. `src/handlers/analyzeHandler.ts` (Main Handler)
```typescript
export async function handleAnalyzeAssessment(request: Request, env: Env) {
  // Only allow POST
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  
  // Authentication
  const isDevelopment = env.VITE_SUPABASE_URL?.includes('localhost');
  let studentId: string;
  
  if (isDevelopment) {
    studentId = 'test-student-' + Date.now();
  } else {
    const auth = await authenticateUser(request, env);
    if (!auth) {
      return jsonResponse({ error: 'Authentication required' }, 401);
    }
    studentId = auth.user.id;
  }
  
  // Rate limiting
  if (!checkRateLimit(studentId)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429);
  }
  
  // Parse request
  const { assessmentData } = await request.json();
  
  // Analyze with AI
  const results = await analyzeAssessment(env, assessmentData);
  
  return jsonResponse({ success: true, data: results });
}
```

#### 3. `src/services/openRouterService.ts` (AI Service)
```typescript
const AI_MODELS = [
  'google/gemini-2.0-flash-exp:free',  // Primary
  'google/gemini-flash-1.5-8b',        // Backup
  'anthropic/claude-3.5-sonnet',       // Premium
  'xiaomi/mimo-v2-flash:free'          // Fallback
];

export async function analyzeAssessment(env: Env, assessmentData: AssessmentData) {
  const prompt = buildAnalysisPrompt(assessmentData);
  const systemMessage = getSystemMessage(assessmentData.gradeLevel);
  
  // Try each model until one succeeds
  for (const model of AI_MODELS) {
    try {
      const response = await callOpenRouter(env, model, systemMessage, prompt);
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        return extractJsonFromResponse(content);
      }
    } catch (error) {
      console.error(`Model ${model} failed:`, error);
    }
  }
  
  throw new Error('All AI models failed');
}

async function callOpenRouter(env: Env, model: string, systemMessage: string, userPrompt: string) {
  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': env.VITE_SUPABASE_URL,
      'X-Title': 'SkillPassport Assessment Analyzer'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,  // Low for consistency
      max_tokens: 16000
    })
  });
}
```

#### 4. `src/prompts/index.ts` (Prompt Router)
```typescript
export function buildAnalysisPrompt(assessmentData: AssessmentData): string {
  const gradeLevel = assessmentData.gradeLevel || 'after12';
  
  // Route to appropriate prompt builder
  if (gradeLevel === 'middle') {
    return buildMiddleSchoolPrompt(assessmentData, answersHash);
  }
  
  if (gradeLevel === 'highschool' || gradeLevel === 'higher_secondary') {
    return buildHighSchoolPrompt(assessmentData, answersHash);
  }
  
  // After 10th and After 12th use the same prompt builder
  return buildCollegePrompt(assessmentData, answersHash);
}

export function getSystemMessage(gradeLevel: GradeLevel): string {
  const baseMessage = 'You are an expert career counselor and psychometric analyst.';
  
  const requirements = `
CRITICAL REQUIREMENTS:
1) Always return complete, valid JSON - never truncate.
2) You MUST provide EXACTLY 3 career clusters - this is MANDATORY.
3) Each cluster must have all required fields filled.`;
  
  if (gradeLevel === 'middle') {
    return `${baseMessage} You are speaking to middle school students (grades 6-8). 
            Use encouraging, age-appropriate language.${requirements}`;
  }
  
  if (gradeLevel === 'highschool' || gradeLevel === 'higher_secondary') {
    return `${baseMessage} You are speaking to high school students (grades 9-12). 
            Provide guidance on college majors and career paths.${requirements}`;
  }
  
  return `${baseMessage}${requirements}`;
}
```

---

## OpenRouter AI Processing

### External API: `https://openrouter.ai/api/v1/chat/completions`

**Request Format:**
```json
{
  "model": "google/gemini-2.0-flash-exp:free",
  "messages": [
    {
      "role": "system",
      "content": "You are an expert career counselor..."
    },
    {
      "role": "user",
      "content": "Analyze this assessment data: {...}"
    }
  ],
  "temperature": 0.1,
  "max_tokens": 16000
}
```

**Response Format:**
```json
{
  "choices": [
    {
      "message": {
        "content": "{\n  \"riasec\": {...},\n  \"aptitude\": {...},\n  ...}"
      }
    }
  ]
}
```

**AI Models Used (in order):**
1. **Gemini 2.0 Flash Exp** (Primary) - Free, fast, 1M context window
2. **Gemini 1.5 Flash 8B** (Backup) - Fast and efficient
3. **Claude 3.5 Sonnet** (Premium) - Best quality, paid
4. **Xiaomi Mimo v2 Flash** (Fallback) - Free fallback option

**Configuration:**
- **Temperature**: 0.1 (low for consistent, deterministic results)
- **Max Tokens**: 16,000 (enough for complete response)
- **Timeout**: 60 seconds

---

## After 10th Stream Recommendation Logic

### Overview

After 10th students need guidance on which stream to choose for 11th/12th grade. The system uses a **hybrid approach**:

1. **Frontend calculates rule-based recommendation** (deterministic algorithm)
2. **Sends hint to AI** (via Cloudflare Worker)
3. **AI considers hint + full assessment data** (holistic analysis)
4. **AI makes final recommendation** (with reasoning)

### Why This Hybrid Approach?

**Rule-Based Component (Frontend):**
- ✅ Fast, deterministic, consistent
- ✅ Based on validated psychometric scoring
- ✅ Provides baseline recommendation
- ❌ Cannot consider nuanced patterns
- ❌ Cannot explain reasoning in natural language

**AI Component (Worker + OpenRouter):**
- ✅ Considers full context (all sections)
- ✅ Provides natural language reasoning
- ✅ Can detect complex patterns
- ✅ Generates personalized career paths
- ❌ Can be inconsistent without guidance
- ❌ May hallucinate without constraints

**Hybrid = Best of Both Worlds:**
- Rule-based provides **anchor** (prevents AI drift)
- AI provides **explanation** (natural language reasoning)
- AI can **override** if compelling evidence exists
- Result: Accurate + Explainable + Personalized

---

### Step-by-Step Flow

#### **STEP 1: Frontend Calculates Rule-Based Recommendation**
**Location**: `src/services/geminiAssessmentService.js` → `prepareAssessmentData()`

```javascript
// Only for After 10th students
if (gradeLevel === 'after10') {
  // 1. Calculate RIASEC scores from answers
  const riasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  Object.values(riasecAnswers).forEach(answer => {
    const { answer: value, categoryMapping, type } = answer;
    
    if (type === 'multiselect' && Array.isArray(value)) {
      value.forEach(option => {
        const riasecType = categoryMapping?.[option];
        if (riasecType) riasecScores[riasecType] += 2;
      });
    } else if (type === 'singleselect') {
      const riasecType = categoryMapping?.[value];
      if (riasecType) riasecScores[riasecType] += 2;
    } else if (type === 'rating' && typeof value === 'number') {
      const points = value >= 4 ? (value === 5 ? 2 : 1) : 0;
      // Add to appropriate RIASEC type
    }
  });
  
  // 2. Detect flat profile (undifferentiated interests)
  const riasecValues = Object.values(riasecScores);
  const maxRiasec = Math.max(...riasecValues);
  const minRiasec = Math.min(...riasecValues);
  const riasecRange = maxRiasec - minRiasec;
  const avgRiasec = riasecValues.reduce((a, b) => a + b, 0) / riasecValues.length;
  
  const riasecVariance = riasecValues.reduce((sum, val) => 
    sum + Math.pow(val - avgRiasec, 2), 0) / riasecValues.length;
  const riasecStdDev = Math.sqrt(riasecVariance);
  
  // Flat profile: low standard deviation (all scores within ~3 points)
  const isFlatProfile = riasecStdDev < 2 || riasecRange < 4;
  
  // 3. Calculate stream recommendation using algorithm
  const ruleBasedRecommendation = calculateStreamRecommendations(
    { riasec: { scores: riasecScores } },
    { subjectMarks: [], projects: [], experiences: [] }
  );
  
  // 4. Adjust confidence for flat profiles
  let adjustedConfidence = ruleBasedRecommendation.confidenceScore;
  if (isFlatProfile) {
    // Lower confidence for flat profiles - max 70%
    adjustedConfidence = Math.min(70, adjustedConfidence);
  }
  
  // 5. Create hint object
  ruleBasedStreamHint = {
    stream: ruleBasedRecommendation.recommendedStream,  // e.g., "PCMS"
    streamId: ruleBasedRecommendation.allStreamScores[0].streamId,
    confidence: adjustedConfidence,  // 75-100% (or max 70% for flat)
    matchLevel: isFlatProfile ? 'Medium' : ruleBasedRecommendation.streamFit,
    reasoning: ruleBasedRecommendation.reasoning,
    riasecScores: riasecScores,  // { R: 12, I: 18, A: 8, S: 10, E: 14, C: 16 }
    alternativeStream: ruleBasedRecommendation.alternativeStream,
    allScores: ruleBasedRecommendation.allStreamScores.slice(0, 3),
    profileAnalysis: {
      isFlatProfile,
      riasecRange,
      riasecStdDev: riasecStdDev.toFixed(2),
      warning: isFlatProfile ? 'Student has undifferentiated interests' : null
    }
  };
}
```

**Example Output:**
```json
{
  "stream": "PCMS",
  "streamId": "pcms",
  "confidence": 85,
  "matchLevel": "High",
  "reasoning": "High investigative interest combined with strong numerical and abstract reasoning",
  "riasecScores": { "R": 12, "I": 18, "A": 8, "S": 10, "E": 14, "C": 16 },
  "alternativeStream": "Commerce with Maths",
  "allScores": [
    { "stream": "PCMS", "score": 85, "category": "Science" },
    { "stream": "Commerce with Maths", "score": 78, "category": "Commerce" },
    { "stream": "PCM", "score": 72, "category": "Science" }
  ],
  "profileAnalysis": {
    "isFlatProfile": false,
    "riasecRange": 10,
    "riasecStdDev": "3.74",
    "warning": null
  }
}
```

---

#### **STEP 2: Worker Receives Hint in Prompt**
**Location**: `cloudflare-workers/analyze-assessment-api/src/prompts/college.ts`

The worker builds a prompt that includes the rule-based hint:

```typescript
const after10StreamSection = isAfter10 ? `
## ⚠️ CRITICAL: AFTER 10TH STREAM RECOMMENDATION (MANDATORY) ⚠️

## 🎯 RULE-BASED RECOMMENDATION (STRONGLY CONSIDER THIS):
Our precise scoring algorithm analyzed this student's RIASEC scores and suggests:

**Recommended Stream**: ${ruleBasedHint.stream}
**Confidence**: ${ruleBasedHint.confidence}%
**Match Level**: ${ruleBasedHint.matchLevel}
**RIASEC Scores**: ${JSON.stringify(ruleBasedHint.riasecScores)}
**Alternative**: ${ruleBasedHint.alternativeStream || 'N/A'}

**Top 3 Stream Matches**:
${ruleBasedHint.allScores?.map((s, i) => 
  `${i + 1}. ${s.stream} (${s.score}% match, ${s.category})`
).join('\n')}

${isFlatProfile ? `
## ⚠️ FLAT PROFILE WARNING ⚠️
**This student has an UNDIFFERENTIATED interest profile!**
- RIASEC Score Range: ${profileAnalysis.riasecRange} points
- Standard Deviation: ${profileAnalysis.riasecStdDev}
- Warning: ${profileAnalysis.warning}

**IMPORTANT INSTRUCTIONS FOR FLAT PROFILES:**
1. DO NOT give high confidence (max 70%)
2. MUST present MULTIPLE valid stream options (at least 2-3)
3. Emphasize that the student should explore different fields
4. Recommend considering APTITUDE scores more heavily
5. Suggest talking to counselors, attending career fairs
` : ''}

⚠️ IMPORTANT: This recommendation is based on ACTUAL assessment scores.
You should STRONGLY AGREE with this recommendation unless you have compelling evidence otherwise.
If you recommend a different stream, you MUST provide clear reasoning.
` : '';
```

---

#### **STEP 3: AI Analyzes Full Context**
**Location**: OpenRouter AI (Gemini 2.0 / Claude)

The AI receives:
1. **Rule-based hint** (anchor recommendation)
2. **All RIASEC answers** (raw responses)
3. **All aptitude scores** (verbal, numerical, abstract, spatial, clerical)
4. **Big Five personality** (openness, conscientiousness, extraversion, agreeableness, neuroticism)
5. **Work values** (security, autonomy, creativity, status, impact, financial, leadership, lifestyle)
6. **Employability skills** (communication, teamwork, problem-solving, etc.)
7. **Knowledge test results** (stream-specific questions)
8. **Timing data** (how long on each section)

The AI then:
1. **Calculates RIASEC scores** (verifies frontend calculation)
2. **Identifies top 3 RIASEC types** (e.g., I-E-C)
3. **Analyzes aptitude pattern** (which cognitive strengths)
4. **Matches pattern to stream** (using algorithm in prompt)
5. **Considers rule-based hint** (agrees or provides reasoning for disagreement)
6. **Determines confidence** (75-100%, or max 70% for flat profiles)
7. **Suggests alternative stream** (second-best option)
8. **Generates career clusters** (aligned with recommended stream)

---

#### **STEP 4: AI Returns Recommendation**
**Location**: OpenRouter AI → Worker → Frontend

**Example AI Response:**
```json
{
  "streamRecommendation": {
    "isAfter10": true,
    "recommendedStream": "PCMS (Physics, Chemistry, Maths, Computer Science)",
    "streamFit": "High",
    "confidenceScore": 85,
    "reasoning": {
      "interests": "High Investigative (I=18/20) and Enterprising (E=14/20) interests indicate strong analytical and problem-solving orientation, perfect for technology and engineering fields.",
      "aptitude": "Exceptional numerical (7/8) and abstract reasoning (7/8) scores demonstrate strong logical and computational thinking abilities required for computer science and mathematics.",
      "personality": "High Openness (85%) and Conscientiousness (80%) suggest curiosity for new technologies and disciplined approach to complex problem-solving."
    },
    "scoreBasedAnalysis": {
      "riasecTop3": ["I", "E", "C"],
      "strongAptitudes": ["Numerical", "Abstract", "Verbal"],
      "matchingPattern": "High I + High Numerical + High Abstract = PCMS/PCM"
    },
    "alternativeStream": "Commerce with Maths",
    "alternativeReason": "Your strong numerical skills and enterprising interests also align well with business and finance. Consider this if you're interested in economics, accounting, or business management.",
    "subjectsToFocus": [
      "Mathematics - Build strong foundation in calculus and algebra",
      "Computer Science - Learn programming fundamentals (Python, Java)",
      "Physics - Understand computational physics and electronics"
    ],
    "careerPathsAfter12": [
      "Software Engineer / Developer",
      "Data Scientist / AI Engineer",
      "Computer Systems Architect",
      "Cybersecurity Specialist",
      "Product Manager (Tech)"
    ],
    "entranceExams": [
      "JEE Main & Advanced (for IITs/NITs)",
      "BITSAT (for BITS Pilani)",
      "VITEEE (for VIT)",
      "State Engineering Entrance Exams"
    ],
    "collegeTypes": [
      "IITs (Indian Institutes of Technology)",
      "NITs (National Institutes of Technology)",
      "BITS Pilani",
      "Top Private Engineering Colleges",
      "Dual Degree Programs (BTech + MTech)"
    ]
  },
  "careerFit": {
    "clusters": [
      {
        "title": "Technology & Software Development",
        "fit": "High",
        "matchScore": 88,
        "description": "Your exceptional analytical skills, high investigative interest, and strong numerical/abstract reasoning make you an excellent fit for technology careers. You show natural aptitude for problem-solving and logical thinking.",
        "evidence": {
          "interest": "Investigative (I=90%) - loves analyzing systems and solving complex problems",
          "aptitude": "Numerical (87.5%) and Abstract (87.5%) - strong computational thinking",
          "personality": "High Openness (85%) - curious about new technologies"
        },
        "roles": {
          "entry": ["Junior Software Developer", "Data Analyst", "QA Engineer"],
          "mid": ["Senior Software Engineer", "Data Scientist", "Tech Lead"]
        },
        "domains": ["Software Development", "Data Science", "AI/ML", "Cloud Computing"],
        "whyItFits": "Your RIASEC code (IEC) and aptitude profile perfectly match the requirements for technology careers. The combination of investigative curiosity, analytical skills, and enterprising drive will help you excel in fast-paced tech environments."
      },
      {
        "title": "Engineering & Innovation",
        "fit": "Medium",
        "matchScore": 78,
        "description": "Your strong spatial reasoning and interest in how things work make engineering a solid career path. You have the mathematical foundation and problem-solving skills needed for engineering disciplines.",
        "evidence": {
          "interest": "Realistic (R=60%) - interest in building and creating",
          "aptitude": "Spatial (83%) and Numerical (87.5%) - engineering mindset",
          "personality": "High Conscientiousness (80%) - attention to detail"
        },
        "roles": {
          "entry": ["Junior Engineer", "Design Engineer", "Project Coordinator"],
          "mid": ["Senior Engineer", "Engineering Manager", "Technical Architect"]
        },
        "domains": ["Mechanical Engineering", "Civil Engineering", "Electronics", "Robotics"],
        "whyItFits": "Your aptitude scores and interest in systematic problem-solving align well with engineering. This is a strong alternative if you prefer hands-on work with physical systems over pure software."
      },
      {
        "title": "Business & Finance (Alternative Stream)",
        "fit": "Explore",
        "matchScore": 68,
        "description": "Your enterprising interests and strong numerical skills also open doors to business and finance careers. This is worth exploring if you're interested in the business side of technology.",
        "evidence": {
          "interest": "Enterprising (E=70%) - leadership and business orientation",
          "aptitude": "Numerical (87.5%) and Verbal (75%) - business acumen",
          "personality": "High Extraversion (70%) - people skills for business"
        },
        "roles": {
          "entry": ["Business Analyst", "Financial Analyst", "Management Trainee"],
          "mid": ["Product Manager", "Business Consultant", "Finance Manager"]
        },
        "domains": ["Business Management", "Finance", "Consulting", "Entrepreneurship"],
        "whyItFits": "This represents your alternative stream (Commerce with Maths). Your enterprising interests and numerical skills would serve you well in business, especially in tech-focused business roles like product management."
      }
    ]
  }
}
```

**Key Points:**
- ✅ AI **agreed** with rule-based recommendation (PCMS)
- ✅ Provided **detailed reasoning** based on scores
- ✅ Suggested **alternative stream** (Commerce with Maths)
- ✅ **Career clusters aligned** with streams:
  - Cluster 1 & 2: From PCMS (primary stream)
  - Cluster 3: From Commerce (alternative stream)
- ✅ Provided **actionable guidance** (subjects, exams, colleges)

---

### Stream Matching Algorithm

**Used by both frontend (rule-based) and AI (in prompt):**

| RIASEC Pattern | Aptitude Pattern | Recommended Stream |
|----------------|------------------|-------------------|
| High I + High Numerical + High Abstract | PCMS or PCM |
| High I + High Numerical + Biology Interest | PCMB or PCB |
| High I + High S + Biology Interest | PCB |
| High E + High C + High Numerical | Commerce with Maths |
| High E + High C + High Verbal | Commerce without Maths |
| High A + High S + High Verbal | Arts with Psychology |
| High I + High E + High Verbal | Arts with Economics |
| High A + High Verbal | Arts General |

**Thresholds:**
- "High" RIASEC = >= 60% (12/20 points)
- "High" Aptitude = >= 70% correct

**Confidence Levels:**
- **High Fit (85-100%)**: 3+ indicators align clearly
- **Medium Fit (75-84%)**: 2 indicators align
- **Low Fit (<75%)**: Pattern unclear or conflicting

**Flat Profile Adjustment:**
- If RIASEC standard deviation < 2 OR range < 4 points
- Max confidence = 70%
- Must present multiple valid options
- Emphasize aptitude over interests

---

## Response Flow Back to Frontend

### Step-by-Step

#### **STEP 1: Worker Parses AI Response**
**Location**: `cloudflare-workers/analyze-assessment-api/src/services/openRouterService.ts`

```typescript
// Extract JSON from AI response (may be wrapped in markdown)
const content = data.choices[0].message.content;
const parsedResults = extractJsonFromResponse(content);

// Return to frontend
return jsonResponse({ success: true, data: parsedResults });
```

---

#### **STEP 2: Frontend Receives Response**
**Location**: `src/services/geminiAssessmentService.js`

```javascript
// Receive parsed results from worker
let parsedResults = await callOpenRouterAssessment(assessmentData);

// FOR AFTER 10TH: Validate stream recommendation
if (gradeLevel === 'after10') {
  const { validateStreamRecommendation } = await import('./assessmentService');
  parsedResults = validateStreamRecommendation(parsedResults);
}

// Validate overall structure
const { isValid, missingFields } = validateResults(parsedResults);
if (!isValid) {
  console.warn('⚠️ Response has missing fields:', missingFields);
}

// Add course recommendations
const resultsWithCourses = await addCourseRecommendations(parsedResults);

return resultsWithCourses;
```

---

#### **STEP 3: Validate Stream Recommendation (After 10th Only)**
**Location**: `src/services/assessmentService.js`

```javascript
export const validateStreamRecommendation = (results) => {
  if (!results.streamRecommendation?.isAfter10) {
    return results;
  }
  
  const validStreams = [
    'PCMB', 'PCMS', 'PCM', 'PCB',
    'Commerce with Maths', 'Commerce without Maths',
    'Arts with Psychology', 'Arts with Economics', 'Arts General'
  ];
  
  const recommended = results.streamRecommendation.recommendedStream;
  
  // Check if stream is valid
  const isValid = validStreams.some(stream => 
    recommended.includes(stream)
  );
  
  if (!isValid) {
    console.error('❌ Invalid stream recommendation:', recommended);
    // Fallback to rule-based recommendation
    results.streamRecommendation.recommendedStream = 'PCMS';
    results.streamRecommendation.confidenceScore = 70;
  }
  
  // Validate confidence score
  const confidence = results.streamRecommendation.confidenceScore;
  if (confidence < 75 || confidence > 100) {
    console.warn('⚠️ Confidence score out of range:', confidence);
    results.streamRecommendation.confidenceScore = Math.max(75, Math.min(100, confidence));
  }
  
  return results;
};
```

---

#### **STEP 4: Add Course Recommendations**
**Location**: `src/services/geminiAssessmentService.js`

```javascript
const addCourseRecommendations = async (results) => {
  // Fetch courses from database based on career clusters
  const careerClusters = results.careerFit?.clusters || [];
  const recommendedCourses = [];
  
  for (const cluster of careerClusters) {
    const courses = await fetchCoursesForCluster(cluster.title, cluster.domains);
    recommendedCourses.push(...courses);
  }
  
  // Add to results
  results.recommendedCourses = recommendedCourses.slice(0, 10);
  
  return results;
};
```

---

#### **STEP 5: Save to Database**
**Location**: `src/features/assessment/assessment-result/hooks/useAssessmentResults.js`

```javascript
const saveResultsToDatabase = async (results, attemptId) => {
  const { data, error } = await supabase
    .from('assessment_results')
    .insert({
      attempt_id: attemptId,
      student_id: user.id,
      riasec_scores: results.riasec.scores,
      riasec_code: results.riasec.code,
      aptitude_scores: results.aptitude.scores,
      big_five_scores: results.bigFive,
      work_values: results.workValues.scores,
      employability_scores: results.employability.skillScores,
      career_clusters: results.careerFit.clusters,
      stream_recommendation: results.streamRecommendation,  // For After 10th
      skill_gap_analysis: results.skillGap,
      roadmap: results.roadmap,
      overall_summary: results.overallSummary,
      created_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('❌ Failed to save results:', error);
    throw error;
  }
  
  return data;
};
```

---

#### **STEP 6: Display Results to Student**
**Location**: `src/features/assessment/assessment-result/AssessmentResultPage.jsx`

```jsx
const AssessmentResultPage = () => {
  const { results, loading } = useAssessmentResults();
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="assessment-results">
      {/* Profile Snapshot */}
      <ProfileSnapshot data={results.profileSnapshot} />
      
      {/* FOR AFTER 10TH: Stream Recommendation */}
      {results.streamRecommendation?.isAfter10 && (
        <StreamRecommendationCard 
          recommendation={results.streamRecommendation}
        />
      )}
      
      {/* RIASEC Results */}
      <RiasecCard data={results.riasec} />
      
      {/* Aptitude Results */}
      <AptitudeCard data={results.aptitude} />
      
      {/* Career Fit Clusters */}
      <CareerClustersCard clusters={results.careerFit.clusters} />
      
      {/* Skill Gap Analysis */}
      <SkillGapCard data={results.skillGap} />
      
      {/* Personalized Roadmap */}
      <RoadmapCard data={results.roadmap} />
      
      {/* Recommended Courses */}
      <RecommendedCoursesCard courses={results.recommendedCourses} />
    </div>
  );
};
```

---

## File Locations

### Frontend Files

```
src/
├── services/
│   ├── geminiAssessmentService.js          # Main AI service (prepareData, callWorker)
│   └── assessmentService.js                # Validation, stream matching
├── features/assessment/
│   ├── career-test/
│   │   └── hooks/
│   │       └── useAssessmentSubmission.ts  # Submission handler
│   └── assessment-result/
│       ├── AssessmentResultPage.jsx        # Results display
│       └── hooks/
│           └── useAssessmentResults.js     # Results fetching, saving
└── utils/
    └── streamMatchingEngine.js             # Rule-based stream algorithm
```

### Worker Files

```
cloudflare-workers/analyze-assessment-api/
├── src/
│   ├── index.ts                            # Worker entry point
│   ├── handlers/
│   │   └── analyzeHandler.ts               # Main analysis endpoint
│   ├── services/
│   │   └── openRouterService.ts            # OpenRouter API calls
│   ├── prompts/
│   │   ├── index.ts                        # Prompt router
│   │   ├── college.ts                      # After 10th & After 12th prompts
│   │   ├── highSchool.ts                   # Grades 9-12 prompts
│   │   └── middleSchool.ts                 # Grades 6-8 prompts
│   ├── utils/
│   │   ├── auth.ts                         # Authentication
│   │   ├── cors.ts                         # CORS handling
│   │   ├── hash.ts                         # Consistency hashing
│   │   ├── jsonParser.ts                   # JSON extraction
│   │   └── rateLimit.ts                    # Rate limiting
│   └── types/
│       └── index.ts                        # TypeScript types
├── wrangler.toml                           # Cloudflare config
└── package.json
```

### Database Tables

```sql
-- Assessment attempts
assessment_attempts (
  id, student_id, grade_level, stream, status, started_at, completed_at
)

-- Assessment responses
assessment_responses (
  id, attempt_id, question_id, answer, section, created_at
)

-- Assessment results (AI analysis stored here)
assessment_results (
  id, attempt_id, student_id,
  riasec_scores, riasec_code,
  aptitude_scores, big_five_scores,
  work_values, employability_scores,
  career_clusters, stream_recommendation,  -- For After 10th
  skill_gap_analysis, roadmap,
  overall_summary, created_at
)
```

---

## Summary

### Where AI Analysis Happens

**Answer**: The AI analysis happens in **3 locations**:

1. **Frontend (React)** - `src/services/geminiAssessmentService.js`
   - Prepares assessment data
   - Calculates scores (aptitude, knowledge)
   - **FOR AFTER 10TH**: Calculates rule-based stream recommendation
   - Sends data to Cloudflare Worker

2. **Cloudflare Worker** - `cloudflare-workers/analyze-assessment-api/`
   - Receives assessment data
   - Builds grade-specific prompts
   - **FOR AFTER 10TH**: Includes rule-based hint in prompt
   - Calls OpenRouter AI API
   - Parses and returns results

3. **OpenRouter AI** - External API (`https://openrouter.ai/`)
   - Receives prompt with all assessment data
   - Analyzes using Gemini 2.0 / Claude models
   - **FOR AFTER 10TH**: Considers rule-based hint + full context
   - Generates comprehensive career analysis
   - Returns JSON response

### Key Insight for After 10th

The **stream recommendation** is a **hybrid approach**:
- **Frontend calculates** rule-based recommendation (deterministic)
- **Worker includes** this as a hint in the prompt
- **AI considers** the hint + full assessment data
- **AI makes final decision** with natural language reasoning
- **Result**: Accurate + Explainable + Personalized

This ensures:
- ✅ Consistency (rule-based anchor)
- ✅ Accuracy (validated algorithm)
- ✅ Explainability (AI reasoning)
- ✅ Personalization (considers full context)
- ✅ Flexibility (AI can override if needed)

---

## Environment Variables

### Frontend (.env)
```bash
VITE_ASSESSMENT_API_URL=https://analyze-assessment-api.dark-mode-d021.workers.dev
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Worker (Cloudflare)
```bash
OPENROUTER_API_KEY=sk-or-v1-...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Testing

### Test Frontend Data Preparation
```javascript
// In browser console
const answers = JSON.parse(localStorage.getItem('assessment_answers'));
const stream = localStorage.getItem('assessment_stream');
const gradeLevel = localStorage.getItem('assessment_grade_level');

console.log('Answers:', answers);
console.log('Stream:', stream);
console.log('Grade Level:', gradeLevel);
```

### Test Worker Endpoint
```bash
curl -X POST https://analyze-assessment-api.dark-mode-d021.workers.dev/analyze-assessment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"assessmentData": {...}}'
```

### Test AI Response
```javascript
// Check worker logs in Cloudflare dashboard
// Look for: "[AI] Success with model: google/gemini-2.0-flash-exp:free"
```

---

**END OF DOCUMENTATION**
