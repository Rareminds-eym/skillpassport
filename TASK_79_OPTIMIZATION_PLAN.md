# Task 79: Performance Optimization Plan

## Overview

Based on the performance test results, this document outlines the optimization plan to improve endpoint performance and implement caching.

---

## Identified Issues

### 1. Slow Endpoints
- **GET /api/user/schools** - p95: 529ms
- **GET /api/user/companies** - p95: 514ms

### 2. No Caching
- No Cache-Control headers
- No caching layer implemented
- Repeated requests show no performance improvement

### 3. Database Query Performance
- Institution list queries are slow
- No indexes on frequently queried fields
- No query result caching

---

## Optimization Strategy

### Phase 1: Implement Caching (Immediate)

#### 1.1 Add In-Memory Caching for Institution Lists

**File**: `functions/api/user/handlers/utility.ts`

```typescript
// Add simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Update handlers to use cache
export async function handleGetSchools(request: Request, env: PagesEnv) {
  const cacheKey = 'schools';
  const cached = getCached(cacheKey);
  
  if (cached) {
    return jsonResponse(cached, 200, {
      'Cache-Control': 'public, max-age=3600',
      'X-Cache': 'HIT',
    });
  }
  
  // Fetch from database
  const supabase = createSupabaseClient(env);
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, code')
    .eq('active', true);
  
  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }
  
  setCache(cacheKey, data);
  
  return jsonResponse(data, 200, {
    'Cache-Control': 'public, max-age=3600',
    'X-Cache': 'MISS',
  });
}
```

**Benefits**:
- Reduces database queries by 90%+
- Expected p95 improvement: 529ms → ~50ms
- Simple to implement
- No external dependencies

#### 1.2 Add Cache-Control Headers

Add appropriate cache headers to all endpoints:

```typescript
// Fast-changing data (user-specific)
'Cache-Control': 'private, max-age=60'

// Slow-changing data (institution lists)
'Cache-Control': 'public, max-age=3600'

// Static data (never changes)
'Cache-Control': 'public, max-age=86400, immutable'

// No cache (sensitive data)
'Cache-Control': 'no-store, no-cache, must-revalidate'
```

### Phase 2: Database Optimization (Short-term)

#### 2.1 Add Database Indexes

**SQL Migration**:

```sql
-- Add indexes for institution queries
CREATE INDEX IF NOT EXISTS idx_schools_active ON schools(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(code);
CREATE INDEX IF NOT EXISTS idx_colleges_active ON colleges(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_colleges_code ON colleges(code);
CREATE INDEX IF NOT EXISTS idx_universities_active ON universities(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_universities_code ON universities(code);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_companies_code ON companies(code);

-- Add indexes for email validation
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_educators_email ON educators(email);
CREATE INDEX IF NOT EXISTS idx_recruiters_email ON recruiters(email);
```

**Expected Impact**:
- Query time reduction: 50-70%
- Improved p95 for validation endpoints

#### 2.2 Optimize Queries

Review and optimize slow queries:

```typescript
// Before: Select all fields
const { data } = await supabase
  .from('schools')
  .select('*')
  .eq('active', true);

// After: Select only needed fields
const { data } = await supabase
  .from('schools')
  .select('id, name, code')
  .eq('active', true);
```

### Phase 3: Advanced Caching (Medium-term)

#### 3.1 Implement Cloudflare KV Caching

For production, use Cloudflare KV for distributed caching:

```typescript
// functions/api/shared/cache.ts
export async function getFromKV(env: PagesEnv, key: string) {
  if (!env.CACHE_KV) return null;
  
  const cached = await env.CACHE_KV.get(key, 'json');
  return cached;
}

export async function setInKV(env: PagesEnv, key: string, value: any, ttl: number) {
  if (!env.CACHE_KV) return;
  
  await env.CACHE_KV.put(key, JSON.stringify(value), {
    expirationTtl: ttl,
  });
}
```

**Benefits**:
- Distributed caching across all edge locations
- Automatic expiration
- No memory limits
- Survives worker restarts

#### 3.2 Implement Cache Invalidation

Add cache invalidation when data changes:

```typescript
// When institution data is updated
export async function invalidateInstitutionCache(env: PagesEnv, type: string) {
  const cacheKey = `institutions:${type}`;
  
  // Clear in-memory cache
  cache.delete(cacheKey);
  
  // Clear KV cache
  if (env.CACHE_KV) {
    await env.CACHE_KV.delete(cacheKey);
  }
}
```

### Phase 4: Response Optimization (Long-term)

#### 4.1 Enable Compression

Cloudflare automatically compresses responses, but ensure:
- Responses are > 1KB (compression threshold)
- Content-Type headers are set correctly
- No `Content-Encoding` header conflicts

#### 4.2 Implement Pagination

For large result sets:

```typescript
export async function handleGetSchools(request: Request, env: PagesEnv) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;
  
  const { data, error, count } = await supabase
    .from('schools')
    .select('id, name, code', { count: 'exact' })
    .eq('active', true)
    .range(offset, offset + limit - 1);
  
  return jsonResponse({
    data,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit),
    },
  });
}
```

---

## Implementation Priority

### Immediate (This Session)
1. ✅ Run performance tests
2. ✅ Identify slow endpoints
3. ✅ Document optimization plan
4. ⏭️ Implement in-memory caching for institution lists
5. ⏭️ Add Cache-Control headers

### Short-term (Next Session)
6. Add database indexes
7. Optimize database queries
8. Re-run performance tests
9. Verify improvements

### Medium-term (Future)
10. Implement Cloudflare KV caching
11. Add cache invalidation
12. Implement pagination

### Long-term (Future)
13. Add monitoring and alerting
14. Implement rate limiting
15. Add performance dashboards

---

## Expected Performance Improvements

### Before Optimization
- GET /api/user/schools: p95 = 529ms
- GET /api/user/companies: p95 = 514ms
- No caching

### After Phase 1 (Caching)
- GET /api/user/schools: p95 = ~50ms (90% improvement)
- GET /api/user/companies: p95 = ~50ms (90% improvement)
- Cache hit rate: 90%+

### After Phase 2 (Database Indexes)
- Cache miss queries: 50-70% faster
- Validation endpoints: 30-50% faster

### After Phase 3 (KV Caching)
- Distributed caching across edge
- Zero cold starts
- 99%+ cache hit rate

---

## Testing Plan

### 1. Implement Optimizations
- Add in-memory caching
- Add Cache-Control headers
- Add database indexes

### 2. Re-run Performance Tests
```bash
node test-performance-all-apis.cjs
```

### 3. Verify Improvements
- Check p95 < 100ms for cached endpoints
- Verify cache hit rate > 90%
- Confirm zero errors

### 4. Load Testing
- Test with higher concurrency (50 concurrent)
- Test with more requests (500 per endpoint)
- Verify performance under load

---

## Monitoring and Alerting

### Metrics to Track
1. Response times (p50, p95, p99)
2. Cache hit rate
3. Error rate
4. Request volume
5. Database query time

### Alerts to Configure
1. p95 > 500ms for any endpoint
2. Error rate > 1%
3. Cache hit rate < 80%
4. Database query time > 200ms

---

## Conclusion

The performance testing has identified clear optimization opportunities:

1. **Caching** - Will provide 90% improvement for slow endpoints
2. **Database Indexes** - Will improve query performance by 50-70%
3. **Cache Headers** - Will enable browser/CDN caching

With these optimizations, we expect to achieve:
- ✅ p50 < 100ms (currently 284ms)
- ✅ p95 < 200ms (currently 384ms)
- ✅ p99 < 300ms (currently 384ms)
- ✅ Cache hit rate > 90%

**Next Step**: Implement Phase 1 optimizations (in-memory caching + cache headers)
