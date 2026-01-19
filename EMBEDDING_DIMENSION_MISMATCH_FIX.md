# 🔴 CRITICAL ISSUE FOUND: Embedding Dimension Mismatch

## Problem

**Course embeddings**: 768 dimensions (old model)  
**Role embeddings**: 1536 dimensions (new model)

When dimensions don't match, cosine similarity returns **0.0000** for ALL courses, making all courses appear equally relevant (50% score).

## Root Cause

Your courses were embedded using an older model (probably `text-embedding-ada-002` which produces 768 dimensions), but the RAG system is generating role embeddings using `text-embedding-3-small` which produces 1536 dimensions.

The cosine similarity function returns 0 when vector dimensions don't match:

```javascript
if (vecA.length !== vecB.length) {
  return 0;  // All courses get 0 similarity!
}
```

## Solution

**Regenerate all course embeddings** using the same model as role embeddings.

### Option 1: Regenerate Course Embeddings (RECOMMENDED)

Run this command to regenerate embeddings for all courses:

```bash
cd cloudflare-workers/embedding-api
npm run regenerate-embeddings
```

Or manually:

```bash
node regenerate-embeddings.js
```

### Option 2: Quick Fix - Use Smaller Role Embeddings

Temporarily change the role embedding model to match course embeddings (768 dimensions):

1. Open `cloudflare-workers/career-api/src/index.ts`
2. Find the embedding generation code
3. Change model from `text-embedding-3-small` to `text-embedding-ada-002`

**Note**: This is NOT recommended as the newer model is better quality.

## Verification

After regenerating embeddings, you should see:

```
[RAG] Embedding stats: {dimensions: 1536, ...}
[RAG] First course embedding stats: {dimensions: 1536, ...}  ← MUST MATCH!
[RAG] Top 10 by similarity: 
1. Financial Accounting (sim: 0.8234, score: 95%)  ← NON-ZERO!
2. Excel for Finance (sim: 0.7891, score: 92%)
...
```

## How to Regenerate Embeddings

### Check Current Embeddings

```sql
SELECT 
  title,
  array_length(embedding, 1) as dimensions
FROM courses
WHERE embedding IS NOT NULL
LIMIT 10;
```

Expected: All should be **1536** dimensions

### Regenerate Script

Create `regenerate-course-embeddings.js`:

```javascript
import { supabase } from './src/lib/supabaseClient.js';

const CAREER_API_URL = 'https://career-api.dark-mode-d021.workers.dev';

async function regenerateEmbeddings() {
  // Fetch all courses
  const { data: courses, error } = await supabase
    .from('courses')
    .select('course_id, title, description, skills')
    .eq('status', 'Active')
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching courses:', error);
    return;
  }

  console.log(`Regenerating embeddings for ${courses.length} courses...`);

  for (const course of courses) {
    const text = `${course.title}. ${course.description || ''}. Skills: ${(course.skills || []).join(', ')}`;
    
    try {
      // Generate new embedding
      const response = await fetch(`${CAREER_API_URL}/generate-embedding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const { embedding } = await response.json();

      // Update course
      await supabase
        .from('courses')
        .update({ embedding })
        .eq('course_id', course.course_id);

      console.log(`✅ ${course.title} (${embedding.length} dimensions)`);
    } catch (err) {
      console.error(`❌ ${course.title}:`, err.message);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('Done!');
}

regenerateEmbeddings();
```

Run:
```bash
node regenerate-course-embeddings.js
```

## Expected Timeline

- **149 courses** × 100ms delay = ~15 seconds
- Plus API time = **~30-60 seconds total**

## After Regeneration

1. Hard refresh browser (Ctrl+Shift+R)
2. Click different job roles
3. Verify courses are now different and relevant
4. Check console shows non-zero similarity scores

---

**Status**: 🔴 CRITICAL - Must regenerate embeddings  
**Impact**: ALL course recommendations are broken  
**Fix Time**: ~1 minute to regenerate  
**Priority**: IMMEDIATE
