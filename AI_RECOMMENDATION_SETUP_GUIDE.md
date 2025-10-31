# AI Job Recommendation System - Setup Guide

## Overview

Production-ready AI recommendation system using:
- **OpenRouter** for embeddings (text-embedding-ada-002)
- **Supabase pgvector** for vector similarity search
- **React** + custom hooks for frontend
- **Edge Functions** for serverless compute

---

## Prerequisites

1. **Supabase Project** with PostgreSQL
2. **OpenRouter API Key** from https://openrouter.ai
3. **Node.js** 16+ and npm/yarn

---

## Step 1: Database Setup

### 1.1 Run SQL Migrations

Execute these SQL files in your Supabase SQL Editor in order:

```bash
# 1. Enable pgvector and create tables
database/migrations/001_add_ai_recommendations.sql

# 2. Create vector matching functions
database/migrations/002_match_opportunities_function.sql
```

### 1.2 Verify Installation

```sql
-- Check if pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check tables exist
\dt opportunities
\dt students
\dt opportunity_interactions
\dt recommendation_cache

-- Verify embedding columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'opportunities' AND column_name = 'embedding';
```

---

## Step 2: Configure Environment Variables

### 2.1 Update `.env` file

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter API Key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

### 2.2 Set Supabase Secrets (for Edge Functions)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set OPENROUTER_API_KEY=your_openrouter_api_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Step 3: Deploy Edge Functions

### 3.1 Deploy Embedding Generator

```bash
supabase functions deploy generate-embedding
```

### 3.2 Deploy Recommendation Engine

```bash
supabase functions deploy recommend-opportunities
```

### 3.3 Test Functions

```bash
# Test embedding generation
curl -X POST \
  https://your-project.supabase.co/functions/v1/generate-embedding \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "React Developer with 3 years experience", "table": "students", "id": "uuid-here"}'

# Test recommendations
curl -X POST \
  https://your-project.supabase.co/functions/v1/recommend-opportunities \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"studentId": "uuid-here"}'
```

---

## Step 4: Generate Initial Embeddings

### 4.1 For Opportunities

You can generate embeddings in two ways:

**Option A: Using the service (from browser console)**

```javascript
import AIRecommendationService from './services/aiRecommendationService';

// Generate for all opportunities
await AIRecommendationService.generateAllOpportunityEmbeddings();
```

**Option B: Create a migration script**

Create `scripts/generate-embeddings.js`:

```javascript
import AIRecommendationService from '../src/services/aiRecommendationService.js';

(async () => {
  console.log('🚀 Generating embeddings for all opportunities...');
  const result = await AIRecommendationService.generateAllOpportunityEmbeddings();
  console.log('✅ Done:', result);
})();
```

### 4.2 For Students

Students' embeddings are generated automatically when they:
- Update their profile
- Upload a resume
- Change their preferences

Or manually trigger:

```javascript
await AIRecommendationService.generateStudentEmbedding(studentId);
```

---

## Step 5: Frontend Integration

### 5.1 Use the AI Recommendations Hook

Replace your existing `Opportunities.jsx` logic with:

```jsx
import { useAIRecommendations } from '../hooks/useAIRecommendations';

const Opportunities = () => {
  const {
    recommendations,
    loading,
    error,
    cached,
    fallback,
    trackView,
    trackApply,
    dismissOpportunity,
    refreshRecommendations,
    getMatchReasons
  } = useAIRecommendations({ autoFetch: true });

  // Track when user views an opportunity
  const handleViewOpportunity = (opp) => {
    trackView(opp.id);
    setSelectedOpportunity(opp);
  };

  // Track when user applies
  const handleApply = async (opp) => {
    await trackApply(opp.id);
    // ... rest of apply logic
  };

  return (
    <div>
      {/* Show match score and reasons */}
      {recommendations.map(opp => (
        <div key={opp.id}>
          <h3>{opp.job_title}</h3>
          <p>Match: {Math.round(opp.match_score)}%</p>
          
          {/* Why recommended */}
          <ul>
            {getMatchReasons(opp).map(reason => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          
          <button onClick={() => dismissOpportunity(opp.id)}>
            Not Interested
          </button>
        </div>
      ))}
    </div>
  );
};
```

---

## Step 6: Student Profile Setup

### 6.1 Ensure students table is populated

When a new student signs up, create their profile:

```javascript
import AIRecommendationService from './services/aiRecommendationService';

const onStudentSignup = async (userId, profileData) => {
  await AIRecommendationService.updateStudentProfile(userId, {
    email: profileData.email,
    name: profileData.name,
    skills: ['React', 'JavaScript', 'Node.js'],
    interests: ['Web Development', 'Mobile Apps'],
    experience_level: 'entry',
    preferred_employment_types: ['internship', 'full-time'],
    preferred_locations: ['Remote', 'Bangalore'],
    preferred_mode: 'hybrid',
    bio: profileData.bio,
    resume_text: extractedResumeText
  });
};
```

### 6.2 Update profile when changed

```javascript
// When student updates their profile/preferences
await AIRecommendationService.updateStudentProfile(userId, updatedData);
// This automatically regenerates embeddings and invalidates cache
```

---

## Step 7: Automatic Embedding Generation (Optional)

### 7.1 Create Database Trigger

Auto-generate embeddings when new opportunities are created:

```sql
CREATE OR REPLACE FUNCTION auto_generate_opportunity_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for new opportunities or when key fields change
  IF (TG_OP = 'INSERT' OR 
      OLD.title != NEW.title OR 
      OLD.description != NEW.description OR
      OLD.skills_required != NEW.skills_required) THEN
    
    -- Call edge function via HTTP (requires http extension)
    -- OR use pg_cron to batch process new opportunities
    NULL; -- Implement based on your preference
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_embedding
  AFTER INSERT OR UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_opportunity_embedding();
```

### 7.2 Use pg_cron for Batch Processing

```sql
-- Install pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule embedding generation every hour
SELECT cron.schedule(
  'generate-embeddings',
  '0 * * * *', -- Every hour
  $$
  -- Your logic to process opportunities without embeddings
  $$
);
```

---

## Step 8: Monitoring & Optimization

### 8.1 Monitor Cache Performance

```sql
-- Check cache hit rate
SELECT 
  COUNT(*) as total_requests,
  SUM(CASE WHEN expires_at > NOW() THEN 1 ELSE 0 END) as cache_hits
FROM recommendation_cache;
```

### 8.2 Monitor Vector Search Performance

```sql
-- Check average similarity scores
SELECT 
  AVG(similarity) as avg_similarity,
  MIN(similarity) as min_similarity,
  MAX(similarity) as max_similarity
FROM (
  SELECT (1 - (embedding <=> '[your_test_vector]')) as similarity
  FROM opportunities
  WHERE embedding IS NOT NULL
  LIMIT 100
) as sample;
```

### 8.3 Clean Up Old Cache

```bash
# Add to cron or scheduled task
supabase functions invoke clean-expired-cache
```

```sql
-- Or via SQL
SELECT clean_expired_recommendations();
```

---

## Usage Examples

### Get Recommendations

```javascript
// Auto-fetch on component mount
const { recommendations } = useAIRecommendations();

// Manual fetch
const { fetchRecommendations } = useAIRecommendations({ autoFetch: false });
await fetchRecommendations();

// Force refresh (bypass cache)
await refreshRecommendations();
```

### Track Interactions

```javascript
const { trackView, trackSave, trackApply, dismissOpportunity } = useAIRecommendations();

// Track view
await trackView(opportunityId);

// Track save
await trackSave(opportunityId);

// Track apply
await trackApply(opportunityId);

// Dismiss (won't show again)
await dismissOpportunity(opportunityId);
```

### Show Match Reasons

```javascript
const { getMatchReasons } = useAIRecommendations();

recommendations.map(opp => {
  const reasons = getMatchReasons(opp);
  // ['Strong skill match', 'In your preferred location', 'Recently posted']
});
```

---

## Troubleshooting

### Issue: No recommendations returned

**Check:**
1. Student has profile with embedding
2. Opportunities have embeddings
3. Check similarity threshold (default 0.60)

```sql
-- Check if student has embedding
SELECT id, embedding IS NOT NULL as has_embedding FROM students WHERE id = 'your-uuid';

-- Check opportunities with embeddings
SELECT COUNT(*) FROM opportunities WHERE embedding IS NOT NULL;
```

### Issue: Poor recommendation quality

**Solutions:**
1. Lower similarity threshold in `match_opportunities` function
2. Ensure student profile is detailed (skills, interests, bio)
3. Add more training data (opportunities)
4. Check if embeddings are stale - regenerate

### Issue: Slow performance

**Solutions:**
1. Check vector index: `REINDEX INDEX opportunities_embedding_idx;`
2. Increase cache TTL (currently 6 hours)
3. Reduce `match_count` parameter
4. Use fallback popular opportunities for cold start

---

## API Reference

### Edge Functions

#### `generate-embedding`
```typescript
POST /functions/v1/generate-embedding
Body: {
  text: string;
  table: 'opportunities' | 'students';
  id: string | number;
  type?: string;
}
```

#### `recommend-opportunities`
```typescript
POST /functions/v1/recommend-opportunities
Body: {
  studentId: string;
  forceRefresh?: boolean;
}
```

### React Service

```javascript
import AIRecommendationService from './services/aiRecommendationService';

// Get recommendations
await AIRecommendationService.getRecommendations(studentId, forceRefresh);

// Generate embeddings
await AIRecommendationService.generateOpportunityEmbedding(oppId);
await AIRecommendationService.generateStudentEmbedding(studentId);

// Track interactions
await AIRecommendationService.trackInteraction(studentId, oppId, action);

// Update profile
await AIRecommendationService.updateStudentProfile(studentId, profileData);
```

---

## Next Steps

1. **A/B Testing**: Compare AI recommendations vs traditional filtering
2. **Feedback Loop**: Add thumbs up/down for recommendations
3. **Email Notifications**: Send weekly personalized job alerts
4. **Analytics Dashboard**: Track recommendation CTR and conversion
5. **Advanced Scoring**: Add collaborative filtering based on similar students

---

## Support

For issues or questions:
1. Check Supabase logs: Project Settings → Functions → Logs
2. Check browser console for client-side errors
3. Verify OpenRouter API key and credits
4. Review database indexes and query performance

---

## Cost Estimation

**OpenRouter Pricing:**
- text-embedding-ada-002: ~$0.0001 per 1K tokens
- Average job: ~200 tokens = $0.00002 per embedding
- 1000 opportunities = ~$0.02
- Very cost-effective!

**Supabase:**
- Free tier: 500MB database (enough for 50K+ embeddings)
- Edge Functions: 500K invocations/month free

**Total Monthly Cost (estimated):**
- < $5 for 10K students with 1K opportunities

