# Complete Data Flow & Dependencies - Course Recommendations

## Overview

The course recommendation system uses the **career-api Cloudflare worker** for AI-powered field keywords. This provides better security (API keys not exposed in browser) and centralized secret management.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        STUDENT TAKES ASSESSMENT                  │
│                     (Frontend React Component)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              geminiAssessmentService.js                          │
│  • Analyzes assessment responses                                │
│  • Generates career fit, skill gaps, RIASEC                     │
│  • Calls addCourseRecommendations()                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         addCourseRecommendations() Function                      │
│  • Calls getRecommendedCoursesByType()                          │
│  • Calls getRecommendedCourses() (fallback)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         recommendationService.js                                 │
│  • getRecommendedCourses()                                      │
│  • getRecommendedCoursesByType()                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              profileBuilder.js (NEW - ASYNC)                     │
│  • buildProfileText() - NOW ASYNC                               │
│  • Calls getDomainKeywordsWithCache()                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         fieldDomainService.js (NEW - AI SERVICE)                 │
│  • getDomainKeywordsWithCache() - Check cache                   │
│  • generateDomainKeywords() - Generate if not cached            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │         │
                    ▼         ▼
        ┌──────────────┐  ┌──────────────────┐
        │  LAYER 1:    │  │  LAYER 2:        │
        │  AI Service  │  │  Pattern Match   │
        │  (OpenRouter)│  │  (Fallback)      │
        └──────┬───────┘  └────────┬─────────┘
               │                   │
               ▼                   ▼
    ┌──────────────────────────────────────┐
    │  Domain Keywords Generated           │
    │  (e.g., "Finance, Accounting...")    │
    └──────────────┬───────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │  Profile Text Built                  │
    │  (Student field + keywords + gaps)   │
    └──────────────┬───────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │  embeddingService.js                 │
    │  • generateEmbedding()               │
    │  • Calls career-api worker           │
    └──────────────┬───────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │  CLOUDFLARE WORKER: career-api       │
    │  /generate-embedding endpoint        │
    │  • Calls OpenRouter embedding API    │
    │  • Returns 1536-dim vector           │
    └──────────────┬───────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │  Profile Embedding Generated         │
    │  [0.123, -0.456, 0.789, ...]        │
    └──────────────┬───────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │  courseRepository.js                 │
    │  • fetchCoursesWithEmbeddings()      │
    │  • Queries Supabase courses table    │
    └──────────────┬───────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │  SUPABASE DATABASE                   │
    │  • courses table                     │
    │  • Has pre-generated embeddings      │
    │  • Returns courses with embeddings   │
    └──────────────┬───────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │  vectorUtils.js                      │
    │  • cosineSimilarity()                │
    │  • Compares profile vs course        │
    │  • Calculates similarity scores      │
    └──────────────┬───────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │  Ranked Course Recommendations       │
    │  • Sorted by similarity score        │
    │  • Top 10 courses returned           │
    └──────────────┬───────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │  DISPLAYED TO STUDENT                │
    │  • RecommendedCoursesSection.jsx     │
    │  • Shows relevant courses            │
    └──────────────────────────────────────┘
```

## Dependencies Breakdown

### 1. Frontend Services (Browser)

#### `geminiAssessmentService.js`
**Location:** `src/services/geminiAssessmentService.js`
**Purpose:** Main assessment analysis service
**Dependencies:**
- OpenRouter API (for Gemini AI analysis)
- `courseRecommendationService.js`
**Key Functions:**
- `analyzeAssessment()` - Main entry point
- `addCourseRecommendations()` - Adds course recommendations to results

#### `courseRecommendationService.js` (Deprecated Wrapper)
**Location:** `src/services/courseRecommendationService.js`
**Purpose:** Backward compatibility wrapper
**Dependencies:**
- `src/services/courseRecommendation/*` (new modular structure)
**Status:** Deprecated, redirects to new modules

### 2. Course Recommendation Modules (NEW)

#### `recommendationService.js`
**Location:** `src/services/courseRecommendation/recommendationService.js`
**Purpose:** Main recommendation logic
**Dependencies:**
- `profileBuilder.js` - Builds student profile text
- `embeddingService.js` - Generates embeddings
- `courseRepository.js` - Fetches courses
- `fieldDomainService.js` - **NEW** AI-powered field keywords
- `vectorUtils.js` - Similarity calculations
- Supabase client
**Key Functions:**
- `getRecommendedCourses()` - Get top 10 recommendations
- `getRecommendedCoursesByType()` - Get by technical/soft skills
- `fallbackKeywordMatching()` - Keyword-based fallback

#### `profileBuilder.js` (MODIFIED - NOW ASYNC)
**Location:** `src/services/courseRecommendation/profileBuilder.js`
**Purpose:** Builds student profile text for embedding
**Dependencies:**
- `fieldDomainService.js` - **NEW** AI-powered field keywords
**Key Functions:**
- `buildProfileText()` - **NOW ASYNC** - Builds profile with AI keywords
**Changes:**
- Now calls `getDomainKeywordsWithCache()` for field keywords
- Returns Promise instead of string

#### `fieldDomainService.js` (NEW)
**Location:** `src/services/courseRecommendation/fieldDomainService.js`
**Purpose:** AI-powered field domain keyword generation
**Dependencies:**
- OpenRouter API (direct fetch, no worker)
- Environment variables: `VITE_OPENROUTER_API_KEY`
**Key Functions:**
- `generateDomainKeywords()` - Calls AI to generate keywords
- `getDomainKeywordsWithCache()` - Cached keyword retrieval
- `getFallbackKeywords()` - Pattern matching fallback
**External APIs:**
- `https://openrouter.ai/api/v1/chat/completions`
- Model: `google/gemini-2.0-flash-exp:free`

#### `embeddingService.js`
**Location:** `src/services/courseRecommendation/embeddingService.js`
**Purpose:** Generate embeddings for profile text
**Dependencies:**
- **Cloudflare Worker:** `career-api` (via `VITE_CAREER_API_URL`)
**Key Functions:**
- `generateEmbedding()` - Generates 1536-dim vector
- `generateSkillEmbedding()` - Wraps skill with context
**External APIs:**
- Calls: `${VITE_CAREER_API_URL}/generate-embedding`

#### `courseRepository.js`
**Location:** `src/services/courseRecommendation/courseRepository.js`
**Purpose:** Fetch courses from database
**Dependencies:**
- Supabase client
**Key Functions:**
- `fetchCoursesWithEmbeddings()` - Get all active courses with embeddings
- `fetchCoursesBySkillType()` - Get by technical/soft type
- `fetchBasicCourses()` - Get without embeddings (fallback)

#### `vectorUtils.js`
**Location:** `src/utils/vectorUtils.js`
**Purpose:** Vector similarity calculations
**Dependencies:** None (pure math)
**Key Functions:**
- `cosineSimilarity()` - Calculate similarity between vectors

### 3. Cloudflare Workers Used

#### `career-api` Worker
**Location:** `cloudflare-workers/career-api/`
**Purpose:** Generate embeddings for student profiles
**Endpoints:**
- `POST /generate-embedding` - Generate embedding vector
**Dependencies:**
- OpenRouter API (for OpenAI text-embedding-3-small)
- Supabase (optional, for storing)
**Used By:**
- `embeddingService.js` → `generateEmbedding()`

#### `embedding-api` Worker (NOT USED FOR COURSE RECOMMENDATIONS)
**Location:** `cloudflare-workers/embedding-api/`
**Purpose:** Batch embedding generation for courses/students/opportunities
**Endpoints:**
- `POST /generate` - Single embedding
- `POST /batch` - Batch embeddings
- `GET /backfill` - Backfill missing embeddings
- `GET /regenerate` - Regenerate specific embedding
- `GET /regenerate-all` - Regenerate all embeddings
**Used For:**
- Pre-generating course embeddings (admin task)
- Pre-generating student embeddings (admin task)
- NOT used during course recommendation flow

### 4. External APIs

#### OpenRouter API (Direct - NEW)
**URL:** `https://openrouter.ai/api/v1/chat/completions`
**Purpose:** Generate field domain keywords using AI
**Model:** `google/gemini-2.0-flash-exp:free`
**Called By:**
- `fieldDomainService.js` → `generateDomainKeywords()`
**Authentication:** `VITE_OPENROUTER_API_KEY` environment variable
**Request:**
```json
{
  "model": "google/gemini-2.0-flash-exp:free",
  "messages": [
    {
      "role": "system",
      "content": "You are an education domain expert..."
    },
    {
      "role": "user",
      "content": "Field of Study: \"B.COM\"..."
    }
  ],
  "temperature": 0.3,
  "max_tokens": 150
}
```
**Response:**
```json
{
  "choices": [{
    "message": {
      "content": "Accounting, Finance, Economics, Auditing, Taxation, Business Law, Financial Analysis, Management"
    }
  }]
}
```

#### OpenRouter API (via career-api worker)
**URL:** `https://openrouter.ai/api/v1/embeddings`
**Purpose:** Generate embeddings for profile text
**Model:** `openai/text-embedding-3-small`
**Called By:**
- `career-api` worker → `generateEmbedding()`
**Authentication:** Worker's `OPENROUTER_API_KEY` secret

### 5. Database (Supabase)

#### `courses` Table
**Purpose:** Store all courses with pre-generated embeddings
**Key Columns:**
- `course_id` (UUID) - Primary key
- `title` (TEXT) - Course name
- `description` (TEXT) - Course description
- `category` (TEXT) - Course category
- `skill_type` (TEXT) - 'technical' or 'soft'
- `skills` (TEXT[]) - Array of skills taught
- `embedding` (VECTOR) - 1536-dim embedding vector
- `status` (TEXT) - 'Active' or 'Inactive'
- `deleted_at` (TIMESTAMP) - Soft delete

**Queried By:**
- `courseRepository.js` → `fetchCoursesWithEmbeddings()`

#### `personal_assessment_results` Table
**Purpose:** Store assessment results with recommendations
**Key Columns:**
- `id` (UUID) - Primary key
- `student_id` (UUID) - Foreign key to students
- `stream_id` (TEXT) - Field of study
- `career_fit` (JSONB) - Career clusters
- `skill_gap` (JSONB) - Skill gaps
- `skill_gap_courses` (JSONB) - Recommended courses
- `created_at` (TIMESTAMP)

**Updated By:**
- `geminiAssessmentService.js` after generating recommendations

## Environment Variables Required

### Frontend (.env)
```env
# OpenRouter API (for AI field keywords - NEW)
VITE_OPENROUTER_API_KEY=sk-or-v1-...

# Career API Worker (for embeddings)
VITE_CAREER_API_URL=https://career-api.your-worker.workers.dev

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# App URL (for OpenRouter referer)
VITE_APP_URL=https://your-app-url.com
```

### Cloudflare Workers

#### career-api Worker
```toml
[vars]
VITE_SUPABASE_URL = "https://your-project.supabase.co"

[secrets]
SUPABASE_SERVICE_ROLE_KEY = "eyJ..."
OPENROUTER_API_KEY = "sk-or-v1-..."
```

#### embedding-api Worker (for admin tasks)
```toml
[vars]
VITE_SUPABASE_URL = "https://your-project.supabase.co"

[secrets]
SUPABASE_SERVICE_ROLE_KEY = "eyJ..."
OPENROUTER_API_KEY = "sk-or-v1-..."
```

## Data Flow Steps (Detailed)

### Step 1: Student Takes Assessment
1. Student completes assessment questions
2. Frontend collects responses
3. Calls `geminiAssessmentService.analyzeAssessment()`

### Step 2: Assessment Analysis
1. `geminiAssessmentService` sends responses to OpenRouter (Gemini)
2. AI analyzes and returns:
   - Career fit (clusters, roles)
   - Skill gaps (priorityA, priorityB)
   - RIASEC profile
   - Aptitude scores
3. Calls `addCourseRecommendations()`

### Step 3: Course Recommendation Generation
1. `addCourseRecommendations()` calls `getRecommendedCoursesByType()`
2. `getRecommendedCoursesByType()` calls `buildProfileText()` **[NOW ASYNC]**

### Step 4: Profile Building with AI Keywords (NEW)
1. `buildProfileText()` extracts field: "B.COM"
2. Calls `getDomainKeywordsWithCache("B.COM")`
3. **Cache check:** If cached, return immediately
4. **Cache miss:** Call `generateDomainKeywords("B.COM")`
5. **AI call:** Fetch to OpenRouter API directly from browser
6. **AI response:** "Accounting, Finance, Economics, Auditing, Taxation, Business Law, Financial Analysis, Management"
7. **Fallback:** If AI fails, use pattern matching
8. **Cache:** Store keywords in memory
9. **Return:** Profile text with domain keywords

### Step 5: Embedding Generation
1. Profile text sent to `generateEmbedding()`
2. Calls `career-api` worker `/generate-embedding`
3. Worker calls OpenRouter embedding API
4. Returns 1536-dim vector: `[0.123, -0.456, ...]`

### Step 6: Course Fetching
1. `fetchCoursesWithEmbeddings()` queries Supabase
2. Gets all active courses with embeddings
3. Returns ~200-500 courses

### Step 7: Similarity Calculation
1. For each course, calculate `cosineSimilarity(profileEmbedding, courseEmbedding)`
2. Convert similarity to relevance score (0-100%)
3. Filter courses with similarity >= threshold
4. Sort by similarity (highest first)

### Step 8: Ranking & Filtering
1. Take top 10 courses overall
2. Or take top 5 technical + top 5 soft skills
3. Add metadata (match reasons, skill gaps addressed)

### Step 9: Display
1. Return recommendations to frontend
2. `RecommendedCoursesSection.jsx` displays courses
3. Student sees relevant courses for their field

## Performance Characteristics

### AI Field Keywords (NEW)
- **First call:** ~500ms (AI generation)
- **Cached calls:** <1ms (memory lookup)
- **Fallback:** <1ms (pattern matching)

### Embedding Generation
- **Profile embedding:** ~300-500ms (via career-api worker)
- **Course embeddings:** Pre-generated (0ms during recommendation)

### Database Queries
- **Fetch courses:** ~100-200ms (Supabase query)
- **Similarity calculation:** ~50-100ms (client-side math)

### Total Time
- **With cache:** ~500-800ms
- **Without cache:** ~1000-1500ms

## Monitoring Points

### 1. AI Service Health
```javascript
console.log('[Course Recommendations] ✅ LAYER 1 (AI Service) SUCCESS');
console.log('[Course Recommendations] ⚠️ LAYER 1 (AI Service) FAILED: 401');
```

### 2. Cache Performance
```javascript
console.log('[Course Recommendations] 🚀 CACHE HIT for "B.COM" (instant)');
console.log('[Course Recommendations] 💾 CACHE MISS for "B.COM" - generating...');
```

### 3. Fallback Usage
```javascript
console.log('[Course Recommendations] → Falling back to LAYER 2 (Pattern Matching)');
console.log('[Course Recommendations] ✅ LAYER 2 (Pattern Matching) SUCCESS');
```

## Summary

### Key Points:
1. **NO new Cloudflare workers** for AI field keywords
2. **Direct API call** from browser to OpenRouter
3. **Existing career-api worker** used for embeddings
4. **4-layer fallback system** ensures reliability
5. **Session-level caching** for performance
6. **Detailed logging** for monitoring

### Dependencies:
- ✅ OpenRouter API (direct) - AI field keywords
- ✅ career-api worker - Embedding generation
- ✅ Supabase - Course database
- ✅ Frontend services - Recommendation logic

### No Dependencies On:
- ❌ embedding-api worker (only for admin tasks)
- ❌ New Cloudflare workers
- ❌ Additional infrastructure
