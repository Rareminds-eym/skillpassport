# Industrial-Grade Job Matching Cache System

## Overview

The job matching system now implements an industrial-grade caching mechanism that stores AI-computed job matches in the database. This eliminates redundant AI processing on every page load, significantly improving performance and reducing API costs.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                                 │
│  ┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │ useAIJobMatching│───▶│aiJobMatchingService│───▶│  Career API      │   │
│  │     Hook        │    │                  │    │  (Cloudflare)    │   │
│  └─────────────────┘    └──────────────────┘    └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Career API Worker                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  1. Check Cache (get_cached_job_matches)                         │   │
│  │     ├── Cache HIT → Return cached matches immediately            │   │
│  │     └── Cache MISS → Continue to step 2                          │   │
│  │                                                                   │   │
│  │  2. Compute Fresh Matches (match_opportunities_enhanced)         │   │
│  │                                                                   │   │
│  │  3. Save to Cache (save_job_matches_cache)                       │   │
│  │                                                                   │   │
│  │  4. Return Results                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Supabase Database                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  student_job_matches (Cache Table)                               │   │
│  │  ├── student_id (FK → students)                                  │   │
│  │  ├── matches (JSONB - cached recommendations)                    │   │
│  │  ├── student_profile_hash (MD5 hash for invalidation)            │   │
│  │  ├── is_valid (boolean - cache validity flag)                    │   │
│  │  ├── expires_at (24-hour TTL)                                    │   │
│  │  └── computed_at (timestamp of last computation)                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Automatic Invalidation Triggers                                 │   │
│  │  ├── students table changes → invalidate that student's cache    │   │
│  │  ├── course_enrollments changes → invalidate student's cache     │   │
│  │  ├── trainings changes → invalidate student's cache              │   │
│  │  └── opportunities changes → invalidate ALL caches               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Cache Invalidation Rules

The cache is automatically invalidated when:

| Event | Scope | Reason |
|-------|-------|--------|
| Student profile update | Single student | Skills, interests, or other matching-relevant data changed |
| Course enrollment change | Single student | New skills acquired or course progress updated |
| Training record change | Single student | New training completed or status changed |
| Opportunity added/updated/deleted | ALL students | New opportunities available or existing ones changed |
| Cache expires (24 hours) | Single student | Time-based expiration for freshness |
| Force refresh requested | Single student | User explicitly requested fresh computation |

## Database Functions

### `get_cached_job_matches(p_student_id UUID)`
Returns cached matches if valid, otherwise returns `is_cached = false`.

### `save_job_matches_cache(p_student_id UUID, p_matches JSONB, p_algorithm_version VARCHAR)`
Saves computed matches to cache with current profile hash.

### `is_job_matches_cache_valid(p_student_id UUID)`
Checks if cache is valid (not expired, not invalidated, profile hash matches).

### `compute_student_profile_hash(p_student_id UUID)`
Computes MD5 hash of all student data relevant to job matching.

### `cleanup_expired_job_matches_cache()`
Removes old expired cache entries (run periodically).

## Frontend Usage

### Basic Usage (with caching)
```javascript
import { useAIJobMatching } from '../hooks/useAIJobMatching';

function MyComponent({ studentProfile }) {
  const { 
    matchedJobs, 
    loading, 
    error, 
    cacheInfo,
    refreshMatches,
    forceRefreshMatches 
  } = useAIJobMatching(studentProfile);

  // cacheInfo.cached - true if results came from cache
  // cacheInfo.computedAt - when matches were computed
  
  return (
    <div>
      {cacheInfo.cached && (
        <span>Cached results from {cacheInfo.computedAt}</span>
      )}
      {matchedJobs.map(job => (
        <JobCard key={job.job_id} job={job} />
      ))}
      <button onClick={forceRefreshMatches}>
        Refresh Recommendations
      </button>
    </div>
  );
}
```

### Force Refresh
```javascript
import { refreshJobMatches } from '../services/aiJobMatchingService';

// Force bypass cache and recompute
const freshMatches = await refreshJobMatches(studentProfile, opportunities, 3);
```

## API Response Format

### Cache Hit Response
```json
{
  "recommendations": [...],
  "cached": true,
  "computed_at": "2026-01-06T10:30:00Z",
  "count": 3,
  "totalMatches": 15,
  "executionTime": 45,
  "message": "Recommendations retrieved from cache"
}
```

### Cache Miss Response
```json
{
  "recommendations": [...],
  "cached": false,
  "computed_at": "2026-01-06T12:00:00Z",
  "count": 3,
  "totalMatches": 15,
  "executionTime": 1250
}
```

## Performance Benefits

| Scenario | Before (No Cache) | After (With Cache) |
|----------|-------------------|-------------------|
| Page load | ~1-3 seconds | ~50-100ms |
| API calls per page view | 1 AI computation | 0 (cache hit) |
| Database queries | Multiple | 1 (cache lookup) |
| Cost per page view | AI API cost | Near zero |

## Monitoring

Check cache status in the database:
```sql
-- View cache statistics
SELECT 
  COUNT(*) as total_entries,
  COUNT(*) FILTER (WHERE is_valid) as valid_entries,
  COUNT(*) FILTER (WHERE NOT is_valid) as invalid_entries,
  AVG(match_count) as avg_matches
FROM student_job_matches;

-- View recent invalidations
SELECT 
  student_id,
  invalidation_reason,
  updated_at
FROM student_job_matches
WHERE NOT is_valid
ORDER BY updated_at DESC
LIMIT 10;
```

## Cleanup

Run periodically to clean up old cache entries:
```sql
SELECT cleanup_expired_job_matches_cache();
```

This removes:
- Entries expired more than 7 days ago
- Invalid entries older than 1 day
