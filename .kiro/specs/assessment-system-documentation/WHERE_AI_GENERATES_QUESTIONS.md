# Where AI Generates Questions - Complete Answer

> **Direct answer to: "Where is this AI generating questions?"**

---

## 🎯 Quick Answer

AI question generation happens in **3 locations** working together:

```
1. FRONTEND (React)
   ↓ calls API, handles caching
   
2. CLOUDFLARE WORKER (Question Generation API)
   ↓ builds prompts, calls AI
   
3. OPENROUTER AI / CLAUDE AI (External)
   ↓ generates actual questions
   
Questions flow back: AI → Worker → Frontend → Database
```

---

## 📍 Complete Flow Breakdown

### 1. Frontend Initiates Request
**Location**: `src/services/careerAssessmentAIService.js`

**When it happens:**
- Student starts assessment (After 10th, After 12th, or College)
- System needs Aptitude questions (50 questions)
- System needs Knowledge questions (20 questions)

**What happens:**
```javascript
// Called from AssessmentTestPage.jsx
const questions = await loadCareerAssessmentQuestions(
  streamId,      // e.g., 'science', 'btech_cse', 'commerce'
  gradeLevel,    // 'after10', 'after12', or 'college'
  studentId,     // For caching
  attemptId      // Current attempt ID
);
```

**Key Functions:**

#### `loadCareerAssessmentQuestions()`
```javascript
export async function loadCareerAssessmentQuestions(streamId, gradeLevel, studentId, attemptId) {
  const questions = { aptitude: null, knowledge: null };

  // Only generate for after10, after12, and college
  if ((gradeLevel === 'after10' || gradeLevel === 'after12' || gradeLevel === 'college') && streamId) {
    // Normalize stream ID (e.g., "Bachelor of Technology in Electronics" → "btech_ece")
    const normalizedStreamId = normalizeStreamId(streamId);
    
    // Generate aptitude questions (50 questions)
    const aiAptitude = await generateAptitudeQuestions(
      normalizedStreamId, 
      50,           // question count
      studentId,    // for caching
      attemptId,    // current attempt
      gradeLevel    // 'after10' uses school subjects, others use aptitude
    );
    
    if (aiAptitude && aiAptitude.length > 0) {
      questions.aptitude = aiAptitude;
    }
    
    // Wait 2 seconds to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate knowledge questions (20 questions)
    const aiKnowledge = await generateStreamKnowledgeQuestions(
      normalizedStreamId,
      20,           // question count
      studentId,    // for caching
      attemptId     // current attempt
    );
    
    if (aiKnowledge && aiKnowledge.length > 0) {
      questions.knowledge = aiKnowledge;
    }
  }

  return questions;
}
```

#### `generateAptitudeQuestions()`
```javascript
export async function generateAptitudeQuestions(streamId, questionCount, studentId, attemptId, gradeLevel) {
  // Check for saved questions first (resume functionality)
  if (studentId) {
    const saved = await getSavedQuestionsForStudent(studentId, streamId, 'aptitude');
    if (saved && saved.length > 0) {
      console.log('✅ Using saved aptitude questions');
      return saved;
    }
  }

  // Call Cloudflare Worker API
  const apiUrl = import.meta.env.VITE_QUESTION_GENERATION_API_URL || 
    'https://question-generation-api.dark-mode-d021.workers.dev';
  
  const response = await fetch(`${apiUrl}/career-assessment/generate-aptitude`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      streamId,
      questionsPerCategory: Math.ceil(questionCount / 5),  // 10 per category for 50 total
      studentId,
      attemptId,
      gradeLevel  // Important: tells API to use school subjects for after10
    })
  });

  const data = await response.json();
  
  // If API didn't save, save from frontend as fallback
  if (data.questions?.length > 0 && studentId && !data.cached) {
    await saveAptitudeQuestions(studentId, streamId, attemptId, data.questions);
  }
  
  return data.questions || [];
}
```

#### `generateStreamKnowledgeQuestions()`
```javascript
export async function generateStreamKnowledgeQuestions(streamId, questionCount, studentId, attemptId) {
  // Normalize stream ID
  const normalizedStreamId = normalizeStreamId(streamId);
  const streamInfo = STREAM_KNOWLEDGE_PROMPTS[normalizedStreamId];
  
  // Check for saved questions first
  if (studentId) {
    const saved = await getSavedQuestionsForStudent(studentId, normalizedStreamId, 'knowledge');
    if (saved) {
      console.log('✅ Using saved knowledge questions');
      return saved;
    }
  }

  // Call Cloudflare Worker API
  const apiUrl = import.meta.env.VITE_QUESTION_GENERATION_API_URL || 
    'https://question-generation-api.dark-mode-d021.workers.dev';
  
  const response = await fetch(`${apiUrl}/career-assessment/generate-knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      streamId: normalizedStreamId,
      streamName: streamInfo.name,
      topics: streamInfo.topics,  // e.g., ['Data Structures', 'Algorithms', ...]
      questionCount,
      studentId,
      attemptId
    })
  });

  const data = await response.json();
  
  // If API didn't save, save from frontend as fallback
  if (data.questions?.length > 0 && studentId && !data.cached) {
    await saveKnowledgeQuestions(studentId, normalizedStreamId, attemptId, data.questions);
  }
  
  return data.questions;
}
```

---

### 2. Cloudflare Worker Receives Request
**Location**: `cloudflare-workers/question-generation-api/`

**Entry Point**: `src/index.ts`
```typescript
// Routes requests to appropriate handlers
if (path === '/career-assessment/generate-aptitude' && request.method === 'POST') {
  return handleAptitudeGeneration(request, env);
}

if (path === '/career-assessment/generate-knowledge' && request.method === 'POST') {
  return handleKnowledgeGeneration(request, env);
}
```

---

### 3. Aptitude Question Generation (Worker)
**Location**: `cloudflare-workers/question-generation-api/src/handlers/career/aptitudeHandler.ts`

```typescript
export async function handleAptitudeGeneration(request: Request, env: Env) {
  const { streamId, studentId, attemptId, gradeLevel } = await request.json();

  // Check cache first
  if (studentId) {
    const cached = await getCareerCachedQuestions(env, studentId, streamId, 'aptitude');
    if (cached) {
      return jsonResponse({ questions: cached, cached: true });
    }
  }

  // Determine question type based on grade level
  const isAfter10 = gradeLevel === 'after10';
  
  // After 10th: School subjects (Mathematics, Science, English, Social Studies, Computer)
  // After 12th/College: Aptitude (Verbal, Numerical, Abstract, Spatial, Clerical)
  
  const categories = getCategories(isAfter10);
  // After 10th: ['mathematics', 'science', 'english', 'social_studies', 'computer']
  // After 12th/College: ['verbal', 'numerical', 'abstract', 'spatial', 'clerical']

  // Generate in 2 batches to avoid token limits
  const batch1Categories = isAfter10 
    ? ['mathematics', 'science', 'english']  // 30 questions
    : ['verbal', 'numerical', 'abstract'];   // 30 questions
  
  const batch2Categories = isAfter10
    ? ['social_studies', 'computer']         // 20 questions
    : ['spatial', 'clerical'];               // 20 questions

  // Generate batch 1
  const batch1 = await generateBatch(1, batch1Categories, isAfter10, streamContext, claudeKey, openRouterKey);
  
  // Wait 3 seconds to avoid rate limiting
  await delay(3000);
  
  // Generate batch 2
  const batch2 = await generateBatch(2, batch2Categories, isAfter10, streamContext, claudeKey, openRouterKey);

  // Combine and format
  const allQuestions = [...batch1, ...batch2].map((q, idx) => ({
    ...q,
    id: generateUUID(),
    originalIndex: idx + 1,
    subtype: q.category,
    subject: q.subject || q.category
  }));

  // Save to cache (database)
  if (studentId) {
    await saveCareerQuestions(env, studentId, streamId, 'aptitude', allQuestions, attemptId);
  }

  return jsonResponse({ questions: allQuestions, generated: true });
}
```

**Batch Generation:**
```typescript
async function generateBatch(batchNum, batchCategories, isAfter10, streamContext, claudeKey, openRouterKey) {
  // Build prompt based on question type
  const prompt = isAfter10
    ? buildSchoolSubjectPrompt(categoriesText, streamContext.name)
    : buildAptitudePrompt(categoriesText, streamContext);

  const systemPrompt = isAfter10 
    ? `You are an expert educational assessment creator for 10th grade students. 
       Generate EXACTLY ${totalQuestions} questions covering school subjects.`
    : `You are an expert psychometric assessment creator. 
       Generate EXACTLY ${totalQuestions} questions.`;

  // Try Claude first, fallback to OpenRouter
  let jsonText: string;
  
  if (claudeKey) {
    try {
      jsonText = await callClaudeAPI(claudeKey, {
        systemPrompt,
        userPrompt: prompt,
        maxTokens: 6000,
        temperature: 0.7 + (batchNum * 0.05)  // Slight variation per batch
      });
    } catch (error) {
      // Fallback to OpenRouter if Claude fails
      jsonText = await callOpenRouterWithRetry(openRouterKey, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]);
    }
  } else {
    jsonText = await callOpenRouterWithRetry(openRouterKey, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]);
  }

  // Parse JSON response
  const result = repairAndParseJSON(jsonText);
  return result.questions || [];
}
```

---

### 4. Knowledge Question Generation (Worker)
**Location**: `cloudflare-workers/question-generation-api/src/handlers/career/knowledgeHandler.ts`

```typescript
export async function handleKnowledgeGeneration(request: Request, env: Env) {
  const { streamId, streamName, topics, questionCount = 20, studentId, attemptId } = await request.json();

  // Check cache first
  if (studentId) {
    const cached = await getCareerCachedQuestions(env, studentId, streamId, 'knowledge');
    if (cached) {
      return jsonResponse({ questions: cached, cached: true });
    }
  }

  // Split topics into two groups for variety
  const halfTopics = Math.ceil(topics.length / 2);
  const topics1 = topics.slice(0, halfTopics);
  const topics2 = topics.slice(halfTopics);

  // Generate two batches of 10 questions each
  const batch1 = await generateKnowledgeBatch(1, 10, topics1, streamName, claudeKey, openRouterKey);
  
  await delay(3000);  // Wait 3 seconds
  
  const batch2 = await generateKnowledgeBatch(2, 10, topics2, streamName, claudeKey, openRouterKey);

  // Combine and format
  const allQuestions = [...batch1, ...batch2].map((q, idx) => ({
    ...q,
    id: generateUUID(),
    originalIndex: idx + 1
  }));

  // Save to cache
  if (studentId) {
    await saveCareerQuestions(env, studentId, streamId, 'knowledge', allQuestions, attemptId);
  }

  return jsonResponse({ questions: allQuestions, generated: true });
}
```

**Batch Generation:**
```typescript
async function generateKnowledgeBatch(batchNum, count, topicSubset, streamName, claudeKey, openRouterKey) {
  const prompt = buildKnowledgePrompt(streamName, topicSubset, count);
  const systemPrompt = `Generate ONLY valid JSON with ${count} questions. No markdown.`;

  // Try Claude first, fallback to OpenRouter
  let jsonText: string;
  
  if (claudeKey) {
    try {
      jsonText = await callClaudeAPI(claudeKey, {
        systemPrompt,
        userPrompt: prompt,
        maxTokens: 3000,
        temperature: 0.7 + (batchNum * 0.05)
      });
    } catch (error) {
      jsonText = await callOpenRouterWithRetry(openRouterKey, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]);
    }
  } else {
    jsonText = await callOpenRouterWithRetry(openRouterKey, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]);
  }

  const result = repairAndParseJSON(jsonText);
  return result.questions || [];
}
```

---

### 5. AI Generates Questions (External APIs)

**Two AI services are used:**

#### A. Claude AI (Primary)
**API**: `https://api.anthropic.com/v1/messages`
**Model**: `claude-3-5-sonnet-20241022`

**Location**: `cloudflare-workers/question-generation-api/src/services/claudeService.ts`

```typescript
export async function callClaudeAPI(apiKey: string, options: ClaudeOptions): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7,
      system: options.systemPrompt,
      messages: [
        { role: 'user', content: options.userPrompt }
      ]
    })
  });

  const data = await response.json();
  return data.content[0].text;  // Returns JSON string with questions
}
```

#### B. OpenRouter AI (Fallback)
**API**: `https://openrouter.ai/api/v1/chat/completions`
**Models**: `google/gemini-2.0-flash-exp:free` (primary), others as fallback

**Location**: `cloudflare-workers/question-generation-api/src/services/openRouterService.ts`

```typescript
export async function callOpenRouterWithRetry(apiKey: string, messages: any[]): Promise<string> {
  const models = [
    'google/gemini-2.0-flash-exp:free',
    'google/gemini-flash-1.5-8b',
    'anthropic/claude-3.5-sonnet'
  ];

  for (const model of models) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;  // Returns JSON string with questions
    } catch (error) {
      console.error(`Model ${model} failed, trying next...`);
    }
  }

  throw new Error('All models failed');
}
```

---

### 6. Questions Saved to Database (Caching)

**Location**: `cloudflare-workers/question-generation-api/src/services/cacheService.ts`

```typescript
export async function saveCareerQuestions(
  env: Env,
  studentId: string,
  streamId: string,
  questionType: 'aptitude' | 'knowledge',
  questions: any[],
  attemptId?: string
) {
  const supabase = getWriteClient(env);
  
  const { error } = await supabase
    .from('career_assessment_ai_questions')
    .upsert({
      student_id: studentId,
      stream_id: streamId,
      question_type: questionType,
      attempt_id: attemptId || null,
      questions: questions,
      generated_at: new Date().toISOString(),
      is_active: true
    }, { 
      onConflict: 'student_id,stream_id,question_type' 
    });

  if (error) {
    console.error('Error saving questions:', error);
  } else {
    console.log(`✅ Saved ${questions.length} ${questionType} questions for student`);
  }
}
```

**Database Table**: `career_assessment_ai_questions`
```sql
CREATE TABLE career_assessment_ai_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id),
  stream_id VARCHAR(20) NOT NULL,
  question_type VARCHAR(20) NOT NULL,  -- 'aptitude' or 'knowledge'
  attempt_id UUID REFERENCES assessment_attempts(id),
  questions JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(student_id, stream_id, question_type)
);
```

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  File: src/services/careerAssessmentAIService.js               │
│                                                                  │
│  1. Student starts assessment                                   │
│  2. loadCareerAssessmentQuestions()                             │
│     • Normalize stream ID                                       │
│     • Check for saved questions (resume)                        │
│  3. generateAptitudeQuestions()                                 │
│     • POST to /career-assessment/generate-aptitude              │
│  4. Wait 2 seconds                                              │
│  5. generateStreamKnowledgeQuestions()                          │
│     • POST to /career-assessment/generate-knowledge             │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP POST
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              CLOUDFLARE WORKER                                   │
│  Location: cloudflare-workers/question-generation-api/          │
│                                                                  │
│  6. handleAptitudeGeneration() or handleKnowledgeGeneration()   │
│     • Check cache (database)                                    │
│     • If cached: return immediately                             │
│  7. Determine question type                                     │
│     • After 10th: School subjects                               │
│     • After 12th/College: Aptitude categories                   │
│  8. Generate in 2 batches                                       │
│     • Batch 1: 30 questions                                     │
│     • Wait 3 seconds                                            │
│     • Batch 2: 20 questions                                     │
│  9. For each batch:                                             │
│     • Build prompt                                              │
│     • Call Claude API (primary)                                 │
│     • If Claude fails: Call OpenRouter API (fallback)           │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS POST
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              CLAUDE AI / OPENROUTER AI (External)                │
│  Claude: https://api.anthropic.com/v1/messages                 │
│  OpenRouter: https://openrouter.ai/api/v1/chat/completions     │
│                                                                  │
│  10. AI Model (Claude 3.5 Sonnet / Gemini 2.0)                 │
│      • Receives prompt with requirements                        │
│      • Generates questions based on:                            │
│        - Stream context (e.g., B.Tech CSE, Commerce, Arts)      │
│        - Question type (aptitude vs knowledge)                  │
│        - Grade level (after10 vs after12/college)               │
│        - Topics/categories                                      │
│      • Returns JSON with questions                              │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ JSON Response
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              CLOUDFLARE WORKER                                   │
│  11. Parse JSON response                                        │
│      • Repair any JSON errors                                   │
│      • Assign UUIDs to questions                                │
│      • Format questions                                         │
│  12. Save to database (cache)                                   │
│      • Table: career_assessment_ai_questions                    │
│      • For resume functionality                                 │
│  13. Return to frontend                                         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ JSON Response
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  14. Receive questions                                          │
│  15. If not cached by worker: Save to database (fallback)       │
│  16. Display questions to student                               │
│      • AssessmentTestPage.jsx renders questions                 │
│      • Student answers questions                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Differences: After 10th vs After 12th/College

### After 10th Students
**Aptitude Questions**: School subjects (50 questions)
- Mathematics (10 questions)
- Science (10 questions)
- English (10 questions)
- Social Studies (10 questions)
- Computer (10 questions)

**Knowledge Questions**: General topics (20 questions)
- Based on stream: 'general' (not stream-specific yet)

### After 12th / College Students
**Aptitude Questions**: Psychometric aptitude (50 questions)
- Verbal Reasoning (10 questions)
- Numerical Ability (10 questions)
- Abstract Reasoning (10 questions)
- Spatial Reasoning (10 questions)
- Clerical Speed (10 questions)

**Knowledge Questions**: Stream-specific (20 questions)
- Based on stream: e.g., B.Tech CSE → Data Structures, Algorithms, OS, etc.
- Based on stream: e.g., Commerce → Accounting, Business Law, Economics, etc.

---

## 📂 File Locations Summary

### Frontend Files
```
src/
├── services/
│   └── careerAssessmentAIService.js    # Main question generation service
├── pages/student/
│   └── AssessmentTest.jsx              # Uses generated questions
```

### Worker Files
```
cloudflare-workers/question-generation-api/
├── src/
│   ├── index.ts                        # Entry point, routes requests
│   ├── handlers/career/
│   │   ├── aptitudeHandler.ts          # Aptitude question generation
│   │   └── knowledgeHandler.ts         # Knowledge question generation
│   ├── services/
│   │   ├── claudeService.ts            # Claude AI integration
│   │   ├── openRouterService.ts        # OpenRouter AI integration
│   │   └── cacheService.ts             # Database caching
│   ├── prompts/career/
│   │   ├── aptitude.ts                 # Aptitude prompts
│   │   ├── schoolSubject.ts            # School subject prompts (after10)
│   │   └── knowledge.ts                # Knowledge prompts
│   └── config/
│       ├── aptitudeCategories.ts       # Category definitions
│       └── streamContexts.ts           # Stream-specific contexts
```

### Database Table
```
career_assessment_ai_questions
- Stores generated questions per student
- Enables resume functionality
- Unique per (student_id, stream_id, question_type)
```

---

## 🎯 Summary

**Where AI generates questions:**

1. **Frontend** (`src/services/careerAssessmentAIService.js`) - Initiates request, handles caching
2. **Cloudflare Worker** (`cloudflare-workers/question-generation-api/`) - Builds prompts, manages AI calls
3. **Claude AI / OpenRouter AI** (External APIs) - Generates actual questions

**Question Types:**
- **Aptitude**: 50 questions (school subjects for after10, psychometric for after12/college)
- **Knowledge**: 20 questions (stream-specific topics)

**Caching:**
- Questions saved to `career_assessment_ai_questions` table
- Enables resume functionality (if student quits and returns)
- Unique per student + stream + question type

**AI Models Used:**
- **Primary**: Claude 3.5 Sonnet (via Anthropic API)
- **Fallback**: Gemini 2.0 Flash (via OpenRouter API)

---

**Last Updated**: January 17, 2026
