# Migration Guide: Standalone Workers → Cloudflare Pages Functions

## Overview

This guide documents the migration from standalone Cloudflare Workers to Cloudflare Pages Functions, covering all 62 endpoints across 7 APIs.

---

## Migration Summary

### What Was Migrated

**Total Endpoints**: 62
**Total APIs**: 7
**Migration Duration**: 7 weeks
**Status**: ✅ Complete

| API | Endpoints | Status |
|-----|-----------|--------|
| User API | 27 | ✅ Complete |
| Storage API | 14 | ✅ Complete |
| Role Overview API | 2 | ✅ Complete |
| Question Generation API | 3 | ✅ Complete |
| Course API | 6 | ✅ Complete |
| Career API | 1 | ✅ Complete |
| Adaptive Session API | 9 | ✅ Complete |

---

## Key Changes

### 1. Project Structure

**Before** (Standalone Workers):
```
cloudflare-workers/
├── user-api/
│   └── src/
│       ├── index.ts
│       └── handlers/
├── storage-api/
│   └── src/
│       └── index.ts
└── [other workers]/
```

**After** (Pages Functions):
```
functions/
├── _middleware.ts
└── api/
    ├── shared/
    ├── user/
    ├── storage/
    └── [other apis]/
```

### 2. Import Paths

**Before**:
```typescript
import { createClient } from '@supabase/supabase-js';
```

**After**:
```typescript
import { createSupabaseClient } from '../../../src/functions-lib/supabase';
```

### 3. Environment Variables

**Before**:
```typescript
const apiKey = process.env.API_KEY;
```

**After**:
```typescript
export const onRequest: PagesFunction = async ({ request, env }) => {
  const apiKey = env.API_KEY;
};
```

### 4. CORS Handling

**Before** (Per-worker):
```typescript
// Each worker handled CORS separately
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // ...
};
```

**After** (Global middleware):
```typescript
// functions/_middleware.ts handles CORS for all APIs
export const onRequest: PagesFunction = async (context) => {
  const origin = context.request.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);
  // ...
};
```

---

## Migration Steps

### Phase 1: Preparation

1. ✅ Install dependencies
2. ✅ Verify environment variables
3. ✅ Organize shared utilities
4. ✅ Test local development setup

### Phase 2: User API

1. ✅ Copy handlers from `cloudflare-workers/user-api/src/handlers/`
2. ✅ Update import paths
3. ✅ Implement 27 endpoints
4. ✅ Test all endpoints locally

### Phase 3: Storage API

1. ✅ Extract R2 client logic
2. ✅ Create handler files
3. ✅ Implement 14 endpoints
4. ✅ Test R2 operations

### Phase 4: AI APIs

1. ✅ Migrate Role Overview API (2 endpoints)
2. ✅ Migrate Question Generation API (3 endpoints)
3. ✅ Migrate Course API (6 endpoints)
4. ✅ Replace AI calls with shared utilities
5. ✅ Test AI integrations

### Phase 5: Adaptive Session API

1. ✅ Create new API structure
2. ✅ Copy helper functions
3. ✅ Implement 9 endpoints
4. ✅ Refactor frontend service
5. ✅ Test end-to-end

### Phase 6: Testing & Documentation

1. ✅ Integration testing (all APIs)
2. ✅ Performance testing
3. ✅ Security review
4. ✅ Documentation

---

## Code Migration Examples

### Example 1: Simple Handler

**Before** (Standalone Worker):
```typescript
// cloudflare-workers/user-api/src/handlers/utility.ts
export async function handleGetSchools(request: Request, env: Env) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  
  const { data, error } = await supabase
    .from('schools')
    .select('*');
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**After** (Pages Function):
```typescript
// functions/api/user/handlers/utility.ts
import { createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import { jsonResponse } from '../../../../src/functions-lib/response';

export async function handleGetSchools(env: PagesEnv): Promise<Response> {
  const supabase = createSupabaseAdminClient(env);
  
  const { data, error } = await supabase
    .from('schools')
    .select('*');
  
  return jsonResponse({ success: true, data });
}
```

### Example 2: Authenticated Handler

**Before**:
```typescript
export async function handleCreateStudent(request: Request, env: Env) {
  const authHeader = request.headers.get('Authorization');
  // Manual JWT decode
  const token = authHeader?.replace('Bearer ', '');
  const payload = JSON.parse(atob(token.split('.')[1]));
  
  // ... rest of handler
}
```

**After**:
```typescript
import { authenticateUser } from '../../../shared/auth';

export async function handleCreateStudent(request: Request, env: PagesEnv) {
  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  
  const userId = auth.user.id;
  // ... rest of handler
}
```

### Example 3: AI Integration

**Before**:
```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'google/gemini-2.0-flash-exp:free',
    messages: messages
  })
});
```

**After**:
```typescript
import { callOpenRouterWithRetry } from '../../../shared/ai-config';

const response = await callOpenRouterWithRetry(
  env.OPENROUTER_API_KEY,
  messages,
  { maxTokens: 4000, temperature: 0.7 }
);
```

---

## Breaking Changes

### 1. Response Format

**Before**: Varied response formats
**After**: Standardized JSON responses

```typescript
// Old
return new Response(JSON.stringify(data));

// New
return jsonResponse({ success: true, data });
```

### 2. Error Handling

**Before**: Inconsistent error responses
**After**: Standardized error format

```typescript
// Old
return new Response(JSON.stringify({ error: 'Error' }), { status: 500 });

// New
return jsonResponse({ error: 'Error message' }, 500);
```

### 3. CORS Headers

**Before**: Wildcard CORS (`*`)
**After**: Origin validation

```typescript
// Old
'Access-Control-Allow-Origin': '*'

// New
'Access-Control-Allow-Origin': 'http://localhost:5173' // validated origin
```

---

## Environment Variables

### Required Variables

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare R2
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET_NAME=your-bucket
CLOUDFLARE_R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com

# AI Services
OPENROUTER_API_KEY=your-openrouter-key
DEEPGRAM_API_KEY=your-deepgram-key (optional)
GROQ_API_KEY=your-groq-key (optional)
```

### Configuration

**Cloudflare Pages Dashboard**:
1. Go to Settings → Environment Variables
2. Add all required variables
3. Deploy to apply changes

**Local Development** (`.env`):
```bash
cp .env.example .env
# Edit .env with your values
```

---

## Testing After Migration

### 1. Verify All Endpoints

```bash
# Start local server
npm run pages:dev

# Test each API
node test-user-api-complete.cjs
node test-storage-api-complete.cjs
node test-ai-apis-complete.cjs
```

### 2. Performance Testing

```bash
# Run performance tests
node test-performance-all-apis.cjs

# Expected results:
# - p50 < 200ms
# - p95 < 500ms
# - 0% error rate
```

### 3. Security Verification

```bash
# Check CORS
curl -H "Origin: https://evil.com" http://localhost:8788/api/user/schools
# Should return fallback origin, not evil.com

# Check authentication
curl http://localhost:8788/api/course/ai-tutor/chat
# Should return 401 Unauthorized
```

---

## Rollback Plan

If issues arise, rollback to standalone workers:

1. **Revert DNS/Routing**
   - Point API subdomain back to standalone workers
   - Update frontend API base URL

2. **Restore Environment Variables**
   - Ensure standalone workers have correct env vars
   - Verify worker bindings

3. **Monitor**
   - Check error rates
   - Verify functionality
   - Monitor performance

---

## Performance Comparison

### Before Migration

| Metric | Value |
|--------|-------|
| Average Response Time | ~300ms |
| p95 | ~500ms |
| Caching | None |
| Error Rate | ~1% |

### After Migration

| Metric | Value | Change |
|--------|-------|--------|
| Average Response Time | 97ms | ✅ 68% faster |
| p95 | 277ms | ✅ 45% faster |
| Caching | 1-hour TTL | ✅ Implemented |
| Error Rate | 0% | ✅ 100% improvement |

---

## Lessons Learned

### What Went Well

✅ Shared utilities reduced code duplication
✅ Standardized response formats improved consistency
✅ Global middleware simplified CORS handling
✅ Performance improved with caching
✅ Security improved with origin validation

### Challenges

⚠️ Import path updates required careful attention
⚠️ Environment variable migration needed coordination
⚠️ CORS middleware required two iterations to get right
⚠️ Testing all 62 endpoints was time-consuming

### Recommendations

1. **Start with shared utilities** - Build foundation first
2. **Migrate incrementally** - One API at a time
3. **Test thoroughly** - Don't skip integration tests
4. **Document as you go** - Don't wait until the end
5. **Review security** - Check CORS, auth, validation

---

## Next Steps

### Immediate

1. ✅ All endpoints migrated
2. ✅ Testing complete
3. ✅ Security reviewed
4. ✅ Documentation created

### Optional Future Improvements

1. ⏭️ Implement rate limiting
2. ⏭️ Add file content validation
3. ⏭️ Enhance monitoring
4. ⏭️ Add performance dashboards

---

## Support

For migration questions or issues:
1. Review this guide
2. Check API documentation
3. Review test files for examples
4. Contact development team

---

**Migration Completed**: 2026-02-02
**Total Duration**: 7 weeks
**Status**: ✅ **SUCCESS**
