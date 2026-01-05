# Industrial-Grade Embedding System

## Overview

This system provides AI-powered job matching using vector embeddings and cosine similarity. It automatically generates and maintains embeddings for students and opportunities using a **fully backend-driven architecture** with database triggers and queue processing.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA CHANGES                                     │
│  (Frontend, API, Admin Panel, Direct SQL - ANY source)                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATABASE TRIGGERS                                   │
│  • students table (INSERT/UPDATE)                                       │
│  • opportunities table (INSERT/UPDATE)                                  │
│  • Related tables: skills, experience, certificates, projects, etc.    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      EMBEDDING_QUEUE TABLE                              │
│  • Deduplication (no duplicate pending items)                           │
│  • Priority-based processing (1-10)                                     │
│  • Retry logic with exponential backoff                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                          (Every 5 minutes)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE CRON WORKER                                │
│  • Processes queue in batches of 20                                     │
│  • Calls OpenAI/Cohere for embedding generation                         │
│  • Updates database with new embeddings                                 │
│  • Handles failures with retry logic                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                                  │
│  • students.embedding (1536-dimensional vector)                         │
│  • opportunities.embedding (1536-dimensional vector)                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Benefits

1. **Never misses updates** - Database triggers catch ALL changes regardless of source
2. **Decoupled** - Frontend doesn't need to know about embeddings
3. **Resilient** - Automatic retries with exponential backoff
4. **Scalable** - Batch processing with controlled throughput
5. **Auditable** - Queue shows pending/completed/failed items

## Components

### 1. Database Layer (Supabase)

**Tables with Embeddings:**
- `students` - 1536-dimensional vector
- `opportunities` - 1536-dimensional vector
- `courses` - 1536-dimensional vector

**Queue System:**
- `embedding_queue` - Async processing queue with priority and retry logic

**Triggers:**
- `trg_student_embedding_queue` - Fires on student INSERT/UPDATE
- `trg_opportunity_embedding_queue` - Fires on opportunity INSERT/UPDATE
- `trg_skills_embedding` - Fires when skills change (queues parent student)
- `trg_experience_embedding` - Fires when experience changes
- `trg_certificates_embedding` - Fires when certificates change
- `trg_projects_embedding` - Fires when projects change
- `trg_trainings_embedding` - Fires when trainings change
- `trg_enrollment_completion_embedding` - Fires when course is completed

**Functions:**
- `queue_embedding_generation(record_id, table_name, operation, priority)` - Add to queue
- `get_embedding_queue_batch(batch_size)` - Get items for processing
- `get_embedding_queue_stats()` - Get queue statistics
- `cleanup_embedding_queue(days_old)` - Clean old completed/failed items

### 2. Embedding API (Cloudflare Worker)

**Endpoints:**
- `POST /embed` - Generate single embedding (legacy)
- `POST /embed/batch` - Generate batch embeddings
- `POST /backfill` - Backfill missing embeddings
- `POST /regenerate` - Regenerate specific embedding
- `POST /process-queue` - Manually trigger queue processing
- `GET /queue-status` - Get queue status
- `GET /stats` - Get embedding statistics

**Cron Schedule:**
- Runs every 5 minutes (`*/5 * * * *`)
- Processes up to 20 items per run

**Model Priority:**
1. OpenAI `text-embedding-3-small` (best quality, $0.02/1M tokens)
2. Cohere `embed-english-v3.0` (good quality, free tier)
3. Local Transformers.js (free, self-hosted)

### 3. Frontend Service (Optional - for manual operations)

**File:** `src/services/embeddingService.js`

**Functions:**
- `generateStudentEmbedding(studentId)` - Manually generate for student
- `generateOpportunityEmbedding(opportunityId)` - Manually generate for opportunity
- `ensureStudentEmbedding(studentId)` - Generate if missing
- `getEmbeddingStats()` - Get statistics
- `processEmbeddingQueue(batchSize)` - Process queue (admin use)
- `backfillMissingEmbeddings(table, limit)` - Backfill missing

> **Note:** Frontend embedding calls are no longer needed for normal operations.
> Database triggers automatically queue embedding regeneration when data changes.

## How Matching Works

### 1. Text Extraction

**Student Profile → Text:**
```
Name: John Doe
Field: Computer Science
Course: B.Tech
University: IIT Delhi
Technical Skills: JavaScript, React, Python, Node.js
Experience: Software Engineer at Google; Intern at Microsoft
Projects: E-commerce Platform, AI Chatbot
Certifications: AWS Solutions Architect, Google Cloud
```

**Opportunity → Text:**
```
Job Title: Senior Frontend Developer
Company: TechCorp
Department: Engineering
Type: Full-time
Experience: 3-5 years
Location: Bangalore
Required Skills: React, TypeScript, Node.js, GraphQL
Requirements: Strong problem-solving; Team collaboration
Description: Build scalable web applications...
```

### 2. Embedding Generation

Text is converted to a 1536-dimensional vector using:
- OpenAI's `text-embedding-3-small` model
- Or Cohere's `embed-english-v3.0`
- Or local Transformers.js

### 3. Similarity Search

```sql
SELECT 
  o.*,
  1 - (o.embedding <=> student.embedding) as similarity
FROM opportunities o
WHERE 1 - (o.embedding <=> student.embedding) > 0.20
ORDER BY similarity DESC
LIMIT 20;
```

The `<=>` operator computes cosine distance. Similarity = 1 - distance.

## Setup Instructions

### 1. Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Embedding Models (at least one required)
OPENAI_API_KEY=sk-...           # Best quality
COHERE_API_KEY=...              # Good free tier
EMBEDDING_SERVICE_URL=https://... # Self-hosted fallback
```

### 2. Deploy Embedding API

```bash
cd cloudflare-workers/embedding-api
wrangler secret put OPENAI_API_KEY
wrangler secret put VITE_SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler deploy
```

### 3. Create KV Namespace (for caching)

```bash
wrangler kv:namespace create EMBEDDING_CACHE
# Update wrangler.toml with the returned ID
```

### 4. Backfill Existing Data

```javascript
import { backfillMissingEmbeddings } from './services/embeddingService';

// Backfill students
await backfillMissingEmbeddings('students', 100);

// Backfill opportunities
await backfillMissingEmbeddings('opportunities', 100);
```

## Automatic Triggers

Database triggers automatically queue embedding generation when:

1. **Student changes:**
   - New student created
   - Profile updated (name, bio, skills, education, etc.)
   - Skills added/updated/deleted
   - Experience added/updated/deleted
   - Certificates added/updated/deleted
   - Projects added/updated/deleted
   - Trainings added/updated/deleted
   - Course completed (enrollment reaches 100%)

2. **Opportunity changes:**
   - New opportunity created
   - Details updated (title, description, skills, requirements, etc.)

3. **Course changes:**
   - New course created
   - Details updated (title, description, skills taught, etc.)

### Priority Levels

| Priority | Description |
|----------|-------------|
| 9 | New opportunity (affects many students) |
| 8 | New student |
| 7 | Opportunity update, Course completion |
| 6 | Related table changes (skills, experience, etc.) |
| 5 | Student profile update |
| 4 | Course update |

## Monitoring

### Check Statistics

```javascript
const stats = await getEmbeddingStats();
console.log(stats);
// {
//   students: { total: 147, withEmbedding: 145, coverage: 98.6% },
//   opportunities: { total: 79, withEmbedding: 79, coverage: 100% }
// }
```

### Process Queue

```javascript
// Process 10 items from queue
const result = await processEmbeddingQueue(10);
console.log(result);
// { processed: 10, succeeded: 9, failed: 1 }
```

## Cost Estimation

### OpenAI text-embedding-3-small
- Cost: $0.02 per 1M tokens
- Average student profile: ~500 tokens
- Average opportunity: ~300 tokens
- 1000 students + 100 opportunities = ~530K tokens = ~$0.01

### Cohere embed-english-v3.0
- Free tier: 100 API calls/minute
- Paid: $0.10 per 1M tokens

### Local Transformers.js
- Free (self-hosted)
- Requires server with ~2GB RAM
- Slower than cloud APIs

## Troubleshooting

### No Matches Returned

1. Check if student has embedding:
```sql
SELECT id, name, embedding IS NOT NULL as has_embedding
FROM students WHERE id = 'student-uuid';
```

2. Check if opportunities have embeddings:
```sql
SELECT COUNT(*), COUNT(embedding) as with_embedding
FROM opportunities;
```

3. Check queue for pending items:
```sql
SELECT * FROM embedding_queue WHERE status = 'pending';
```

### Low Match Quality

1. Ensure student profile has sufficient data (skills, experience, etc.)
2. Check opportunity descriptions are detailed
3. Consider regenerating embeddings with updated data

### API Errors

1. Check API keys are valid
2. Check rate limits
3. Verify Supabase connection
4. Check Cloudflare Worker logs

## Best Practices

1. **Keep profiles updated** - More data = better matches
2. **Use specific skills** - "React.js" better than "JavaScript frameworks"
3. **Include experience details** - Role, company, duration
4. **Add project descriptions** - Technologies used, outcomes
5. **Regular backfills** - Run weekly to catch any missed embeddings
