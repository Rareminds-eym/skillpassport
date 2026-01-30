# Complete Embedding Flow: Frontend → Backend → Database 🔄

## Overview
This document explains how embeddings work in your SkillPassport system, from the frontend UI to the Cloudflare Workers to the Supabase database.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
│  src/components/Students/components/RecommendedJobs.jsx            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      REACT HOOK (Custom)                            │
│           src/hooks/useAIJobMatching.js                            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                                  │
│        src/services/aiJobMatchingService.js                        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  CLOUDFLARE WORKER (API)                            │
│         cloudflare-workers/career-api/src/index.ts                 │
│         Endpoint: /recommend-opportunities                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  SUPABASE DATABASE                                  │
│  Tables: students, opportunities, student_job_matches              │
│  Functions: match_opportunities_enhanced, get_cached_job_matches   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│              EMBEDDING GENERATION (When Needed)                     │
│    cloudflare-workers/embedding-api/src/index.ts                   │
│    OR career-api internal function                                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    OPENROUTER API                                   │
│         Model: openai/text-embedding-3-small                       │
│         Returns: 1536-dimensional vector                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Flow

### 1. Frontend Component (RecommendedJobs.jsx)

**Location**: `src/components/Students/components/RecommendedJobs.jsx`

**What it does**:
- Displays AI-recommended jobs to students
- Shows loading animation while fetching
- Displays match scores (0-100%)
- Handles cache status display

**Key Code**:
```jsx
const {
  matchedJobs: recommendations,
  loading,
  error,
  cacheInfo = {},
  refreshMatches
} = useAIJobMatching(studentProfile, !isDismissed, 3);
```

**Props**:
- `studentProfile` - Student data (id, name, skills, etc.)
- `!isDismissed` - Whether to fetch recommendations
- `3` - Number of recommendations to show

---

### 2. React Hook (useAIJobMatching.js)

**Location**: `src/hooks/useAIJobMatching.js`

**What it does**:
- Manages state for recommendations (loading, error, data)
- Calls the service layer to fetch matches
- Handles cache information
- Provides refresh functionality

**Key Code**:
```javascript
const matches = await matchJobsWithAI(studentProfile, topN, false);

// Extract cache info
if (matches.length > 0) {
  setCacheInfo({
    cached: matches[0].cached,
    computedAt: matches[0].computed_at
  });
}
```

**Dependencies**:
- Watches `studentProfile.id`, `studentProfile.email`, `studentProfile.department`
- Re-fetches when these change

---

### 3. Service Layer (aiJobMatchingService.js)

**Location**: `src/services/aiJobMatchingService.js`

**What it does**:
- Makes HTTP request to Cloudflare Worker
- Handles authentication (JWT token)
- Transforms API response to frontend format
- Builds match reasons from scoring data

**Key Code**:
```javascript
const response = await fetch(`${API_URL}/recommend-opportunities`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    studentId,
    limit: topN,
    forceRefresh
  })
});
```

**API Endpoint**: `VITE_CAREER_API_URL/recommend-opportunities`

**Request Body**:
```json
{
  "studentId": "uuid",
  "limit": 3,
  "forceRefresh": false
}
```

**Response Format**:
```json
{
  "recommendations": [
    {
      "id": "uuid",
      "title": "Blockchain Developer Intern",
      "company_name": "CryptoVentures Labs",
      "match_percentage": 100,
      "similarity_score": 0.526,
      "skill_match_score": 0.0,
      "final_score": 1.0,
      "match_reasons": {
        "profile_match": true,
        "skill_match": false,
        "experience_appropriate": true
      }
    }
  ],
  "cached": false,
  "computed_at": "2026-01-29T...",
  "count": 3,
  "totalMatches": 10,
  "executionTime": 234
}
```

---

### 4. Cloudflare Worker - Career API (index.ts)

**Location**: `cloudflare-workers/career-api/src/index.ts`

**Endpoint**: `POST /recommend-opportunities`

**What it does**:
1. Validates request (studentId, limit)
2. Checks cache first (24-hour TTL)
3. If cache miss, fetches student embedding
4. Auto-generates embedding if missing
5. Calls database function `match_opportunities_enhanced`
6. Saves results to cache
7. Returns recommendations

**Key Functions**:

#### Cache Check
```typescript
const { data: cacheResult } = await supabase
  .rpc('get_cached_job_matches', { p_student_id: studentId });

if (cacheResult && cacheResult[0].is_cached) {
  // Return cached results
  return jsonResponse({
    recommendations: cached.matches,
    cached: true,
    computed_at: cached.computed_at
  });
}
```

#### Auto-Generate Embedding
```typescript
async function generateStudentEmbeddingInternal(
  supabase: SupabaseClient,
  studentId: string,
  env: Env
): Promise<number[] | null> {
  // 1. Fetch student data
  const { data: student } = await supabase
    .from('students')
    .select('id, name, branch_field, course_name, university')
    .eq('id', studentId)
    .single();

  // 2. Fetch related data (skills, courses, trainings)
  const { data: skills } = await supabase
    .from('skills')
    .select('name, level, type')
    .eq('student_id', studentId)
    .eq('enabled', true);

  // 3. Build text
  const parts = [];
  if (student.name) parts.push(`Name: ${student.name}`);
  if (student.branch_field) parts.push(`Field: ${student.branch_field}`);
  // ... add skills, courses, trainings
  const text = parts.join('\n');

  // 4. Generate embedding via OpenRouter
  const embeddingResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: text.slice(0, 8000)
    })
  });

  const data = await embeddingResponse.json();
  const embedding = data.data[0].embedding; // 1536 numbers

  // 5. Save to database
  await supabase
    .from('students')
    .update({ embedding })
    .eq('id', studentId);

  return embedding;
}
```

#### Call Matching Function
```typescript
const { data: recommendations } = await supabase.rpc('match_opportunities_enhanced', {
  query_embedding: studentEmbedding,
  student_id_param: studentId,
  dismissed_ids: dismissedIds,
  match_threshold: 0.01,
  match_count: 50
});
```

#### Save to Cache
```typescript
await supabase.rpc('save_job_matches_cache', {
  p_student_id: studentId,
  p_matches: recommendations,
  p_algorithm_version: 'v1.0'
});
```

---

### 5. Database Tables

#### students
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  branch_field TEXT,
  course_name TEXT,
  university TEXT,
  embedding vector(1536),  -- ← 1536-dimensional vector
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### opportunities
```sql
CREATE TABLE opportunities (
  id UUID PRIMARY KEY,
  title TEXT,
  company_name TEXT,
  description TEXT,
  skills_required JSONB,
  employment_type TEXT,
  experience_level TEXT,
  embedding vector(1536),  -- ← 1536-dimensional vector
  is_active BOOLEAN,
  status TEXT,
  created_at TIMESTAMPTZ
);
```

#### student_job_matches (Cache Table)
```sql
CREATE TABLE student_job_matches (
  student_id UUID PRIMARY KEY,
  matches JSONB,  -- ← Cached recommendations
  match_count INTEGER,
  algorithm_version TEXT,
  student_profile_hash VARCHAR(64),
  is_valid BOOLEAN,
  computed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### Related Student Tables (Context for Embeddings)
*   **`skills`**: Student skills with proficiency levels.
*   **`projects`**: Student projects with titles, descriptions, and tech stacks.
*   **`certificates`**: Certifications with issuers and descriptions.
*   **`trainings`**: Training programs completed by the student.
*   **`course_enrollments`**: Courses the student is taking or has completed.
*   **`student_course_recommendations`**: Existing RAG system for course recommendations.
*   **`student_skill_badges`**: Gamified skill achievements.
*   **`student_course_progress`**: Detailed learning progress (video watch time, etc.).
*   **`student_reports`**: Generated reports for students.

---

### 6. Database Functions

#### match_opportunities_enhanced()
**Location**: `supabase/migrations/20260129_cap_match_score_at_100.sql`

**What it does**:
- Takes student embedding as input
- Compares with all opportunity embeddings
- Calculates similarity using cosine distance
- Applies boosting logic (quality, course alignment, etc.)
- Caps final score at 1.0 (100%)
- Returns top N matches

**Signature**:
```sql
CREATE OR REPLACE FUNCTION match_opportunities_enhanced(
  query_embedding vector(1536),
  student_id_param UUID,
  dismissed_ids UUID[] DEFAULT '{}',
  match_threshold FLOAT DEFAULT 0.30,
  match_count INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  company_name TEXT,
  employment_type TEXT,
  similarity FLOAT,
  final_score FLOAT,
  ...
)
```

**Key Logic**:
```sql
-- Base similarity (cosine distance)
similarity = 1 - (query_embedding <=> o.embedding)

-- Apply boosting
final_score = LEAST(1.0,  -- Cap at 100%
  similarity * 
  quality_boost *           -- 1.0-1.3x
  employment_type_filter *  -- 0.0-1.3x
  course_alignment_boost *  -- 1.0-1.5x
  profile_completeness *    -- 0.75-1.0x
  experience_level_match    -- 0.8-1.2x
)
```

#### get_cached_job_matches()
**What it does**:
- Checks if cache exists for student
- Validates cache (not expired, profile hasn't changed)
- Returns cached matches if valid

**Signature**:
```sql
CREATE OR REPLACE FUNCTION get_cached_job_matches(
  p_student_id UUID
)
RETURNS TABLE (
  matches JSONB,
  match_count INTEGER,
  computed_at TIMESTAMPTZ,
  is_cached BOOLEAN
)
```

#### save_job_matches_cache()
**What it does**:
- Saves computed matches to cache table
- Sets expiration (24 hours)
- Computes profile hash for change detection

**Signature**:
```sql
CREATE OR REPLACE FUNCTION save_job_matches_cache(
  p_student_id UUID,
  p_matches JSONB,
  p_algorithm_version TEXT
)
RETURNS VOID
```

---

### 7. Embedding API Worker (Optional)

**Location**: `cloudflare-workers/embedding-api/src/index.ts`

**What it does**:
- Dedicated worker for embedding generation
- Supports batch processing
- Handles backfill operations
- Queue-based processing

**Endpoints**:
- `POST /generate` - Generate single embedding
- `POST /batch` - Generate batch of embeddings
- `GET /backfill?table=students&limit=50` - Backfill missing embeddings
- `GET /regenerate?table=students&id=uuid` - Regenerate specific embedding
- `GET /regenerate-all?table=students&limit=10` - Regenerate all embeddings
- `GET /stats` - Get embedding statistics

**Text Builders**:

```typescript
// For Students
function buildStudentText(student: any): string {
  const parts = [];
  if (student.name) parts.push(`Name: ${student.name}`);
  if (student.branch_field) parts.push(`Field: ${student.branch_field}`);
  if (student.skills) parts.push(`Skills: ${student.skills.join(', ')}`);
  // ... add courses, projects, trainings
  return parts.join('\n');
}

// For Opportunities
function buildOpportunityText(opportunity: any): string | null {
  // Requires skills_required and description/requirements
  if (!opportunity.skills_required) return null;
  
  const parts = [];
  parts.push(`Job: ${opportunity.title}`);
  parts.push(`Company: ${opportunity.company_name}`);
  parts.push(`Skills: ${opportunity.skills_required.join(', ')}`);
  parts.push(`Description: ${opportunity.description}`);
  return parts.join('\n');
}
```

---

## Complete Request Flow Example

### User Opens Recommended Jobs

```
1. Frontend Component Renders
   └─> useAIJobMatching hook initializes
       └─> Calls matchJobsWithAI(studentProfile, 3, false)
           └─> Makes POST request to career-api/recommend-opportunities
               
2. Career API Receives Request
   └─> Validates studentId
   └─> Checks cache (get_cached_job_matches)
       
3a. CACHE HIT (Fast Path - 50-100ms)
   └─> Returns cached recommendations
   └─> Response sent to frontend
   └─> UI displays jobs with "Cached" badge
   
3b. CACHE MISS (Slow Path - 500-2000ms)
   └─> Fetches student from database
   └─> Checks if student has embedding
       
4a. Student HAS Embedding
   └─> Skip to step 5
   
4b. Student MISSING Embedding (Auto-Generate)
   └─> Fetch student data (name, branch, course, university)
   └─> Fetch skills from skills table
   └─> Fetch course enrollments from course_enrollments table
   └─> Fetch trainings from trainings table
   └─> Build profile text (668 characters for Sandhya)
   └─> Call OpenRouter API
       └─> POST https://openrouter.ai/api/v1/embeddings
       └─> Model: openai/text-embedding-3-small
       └─> Input: profile text
       └─> Output: [0.023, -0.145, 0.891, ..., 0.234] (1536 numbers)
   └─> Save embedding to students.embedding column
   
5. Call match_opportunities_enhanced()
   └─> Input: student embedding (1536 numbers)
   └─> Compare with all opportunity embeddings
   └─> Calculate similarity: 1 - (student_emb <=> opp_emb)
   └─> Apply boosting logic:
       • Quality boost (1.0-1.3x)
       • Employment type filter (0.0-1.3x)
       • Course alignment boost (1.0-1.5x)
       • Profile completeness (0.75-1.0x)
       • Experience level match (0.8-1.2x)
   └─> Cap final_score at 1.0 (100%)
   └─> Return top 50 matches
   
6. Save to Cache
   └─> Call save_job_matches_cache()
   └─> Store in student_job_matches table
   └─> Set expires_at = NOW() + 24 hours
   
7. Return Response to Frontend
   └─> recommendations: [...]
   └─> cached: false
   └─> computed_at: "2026-01-29T..."
   └─> count: 3
   └─> executionTime: 1234ms
   
8. Frontend Displays Results
   └─> Shows top 3 jobs
   └─> Displays match percentages (77-100%)
   └─> Shows match reasons
   └─> Displays "Updated today" (not cached)
```

---

## Cache Invalidation

Cache is invalidated when:

1. **Student profile changes** (triggers)
   - Skills added/removed
   - Projects added/removed
   - Trainings added/removed
   - Course enrollments change
   - Profile fields updated

2. **Opportunity catalog changes** (triggers)
   - New opportunity added
   - Opportunity updated
   - Opportunity deleted

3. **Manual refresh** (user clicks refresh button)
   - `forceRefresh: true` bypasses cache

4. **Cache expires** (24 hours)
   - `expires_at < NOW()`

**Trigger Example**:
```sql
CREATE TRIGGER invalidate_job_matches_cache
AFTER INSERT OR UPDATE OR DELETE ON skills
FOR EACH ROW
EXECUTE FUNCTION invalidate_job_matches_cache();
```

---

## Performance Optimization

### Vector Indexes
```sql
-- HNSW index for fast similarity search
CREATE INDEX idx_students_embedding 
ON students USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_opportunities_embedding 
ON opportunities USING hnsw (embedding vector_cosine_ops);
```

**Performance**:
- Without index: ~5-10 seconds for 1000 jobs
- With index: ~100-300ms for 1000 jobs ⚡

### Other Indexes
```sql
-- Profile completeness checks
CREATE INDEX idx_skills_student_enabled 
ON skills(student_id) WHERE enabled = true;

CREATE INDEX idx_projects_student 
ON projects(student_id);

CREATE INDEX idx_trainings_student 
ON trainings(student_id);

-- Opportunity filtering
CREATE INDEX idx_opportunities_active_status_deadline 
ON opportunities(is_active, status, deadline) 
WHERE is_active = true AND status = 'open';
```

---

## Environment Variables

### Frontend (.env)
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_CAREER_API_URL=https://career-api.workers.dev
```

### Cloudflare Workers (wrangler.toml)
```toml
[vars]
VITE_SUPABASE_URL = "https://xxx.supabase.co"

[secrets]
SUPABASE_SERVICE_ROLE_KEY = "eyJxxx..."
OPENROUTER_API_KEY = "sk-or-xxx..."
```

---

## Error Handling

### Frontend
```javascript
if (error && !loading && !showAnimation) {
  return (
    <div className="bg-amber-50 border border-amber-200">
      <h3>Unable to Load AI Recommendations</h3>
      <p>We're having trouble connecting to our AI matching service.</p>
      <ul>
        <li>Temporary service unavailability</li>
        <li>Network connectivity issues</li>
        <li>API rate limits</li>
      </ul>
    </div>
  );
}
```

### Backend
```typescript
// Fallback to popular opportunities
if (!recommendations || recommendations.length === 0) {
  return await getPopularFallback(supabase, studentId, limit, startTime, 'no_matches');
}
```

---

## 12. Proposed Architecture: "Proper" RAG Engine (V2) 🚀

To move beyond simple text matching, the next version of this engine should implement **Hierarchical Embeddings** and **Hybrid Search**.

### A. Data Strategy: "Structured Narrative"
Instead of embedding a single text block, we generate specific embeddings for key entities:

1.  **Student Profile Embedding**:
    *   **Source**: Bio + Education + Career Goals.
    *   **Purpose**: High-level alignment with job roles.
2.  **Skill Vector**:
    *   **Source**: Skill Name + Proficiency + Endorsements.
    *   **Purpose**: Matches specific technical requirements (e.g., "Python Expert").
3.  **Project/Certificate Embeddings**:
    *   **Source**: Title + Description + Tech Stack / Issuer.
    *   **Purpose**: Matches "Proof of Work" against job responsibilities.

### B. Enhanced Database Schema
```sql
-- 1. Main Profile Vector
ALTER TABLE students ADD COLUMN profile_embedding vector(1536);

-- 2. Granular Entity Vectors
ALTER TABLE skills ADD COLUMN embedding vector(1536);
ALTER TABLE projects ADD COLUMN embedding vector(1536);
ALTER TABLE certificates ADD COLUMN embedding vector(1536);
```

### C. The "Proper" Search Pipeline
1.  **Hard Filters (SQL)**: `WHERE location = 'Remote' AND salary >= 50000`
2.  **Vector Search (Recall)**: Find top 100 jobs using `profile_embedding`.
3.  **Semantic Re-ranking (Precision)**:
    *   For each candidate job, calculate a **Weighted Score**:
    *   `Score = (0.4 * ProfileMatch) + (0.3 * SkillMatch) + (0.3 * ProjectMatch)`
    *   *Example*: A student with a "Fintech App" project gets a boost for "Fintech Developer" jobs, even if their bio doesn't mention it.

### D. Asynchronous Ingestion
*   **Trigger**: When a student updates their profile/skills.
*   **Action**: Cloudflare Worker Queue processes the update.
*   **Result**: Regenerates ONLY the affected embeddings (e.g., only the new project's embedding), saving API costs and latency.

---

## Summary

**Embedding Flow**:
1. Frontend requests recommendations
2. Backend checks cache (24-hour TTL)
3. If cache miss, fetches student embedding
4. If no embedding, auto-generates via OpenRouter
5. Calls database function to match with opportunities
6. Applies boosting logic and caps at 100%
7. Saves to cache for future requests
8. Returns top N recommendations to frontend

**Key Tables**:
- `students` - Student profiles with embeddings
- `opportunities` - Job postings with embeddings
- `student_job_matches` - Cached recommendations
- `skills`, `projects`,`certificates`, `trainings`, `course_enrollments` - Related data

**Key Functions**:
- `match_opportunities_enhanced()` - Main matching algorithm
- `get_cached_job_matches()` - Cache retrieval
- `save_job_matches_cache()` - Cache storage
- `generateStudentEmbeddingInternal()` - Auto-generate embeddings

**Performance**:
- Cache hit: 50-100ms ⚡
- Cache miss (with embedding): 500-1000ms
- Cache miss (without embedding): 1500-2500ms
- Vector search: 100-300ms (with HNSW index)
