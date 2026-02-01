# Cloudflare Pages Functions - Developer Guide

## Overview

This guide provides comprehensive documentation for the Cloudflare Pages Functions implementation, covering all 62 endpoints across 7 APIs.

---

## Project Structure

```
functions/
├── _middleware.ts              # Global CORS middleware
├── api/
│   ├── shared/                 # Shared utilities
│   │   ├── auth.ts            # Authentication utilities
│   │   └── ai-config.ts       # AI integration utilities
│   ├── user/                   # User API (27 endpoints)
│   │   ├── [[path]].ts        # Router
│   │   ├── handlers/          # Request handlers
│   │   └── utils/             # Utilities
│   ├── storage/                # Storage API (14 endpoints)
│   │   ├── [[path]].ts        # Router
│   │   ├── handlers/          # Request handlers
│   │   └── utils/             # R2 client
│   ├── role-overview/          # Role Overview API (2 endpoints)
│   ├── question-generation/    # Question Generation API (3 endpoints)
│   ├── course/                 # Course API (6 endpoints)
│   ├── career/                 # Career API (1 endpoint)
│   └── adaptive-session/       # Adaptive Session API (9 endpoints)
└── src/
    └── functions-lib/          # Core libraries
        ├── supabase.ts        # Supabase client
        ├── cors.ts            # CORS utilities
        └── response.ts        # Response helpers
```

---

## APIs Overview

### 1. User API (27 endpoints)
**Base Path**: `/api/user`

**Purpose**: User signup, validation, and management

**Endpoints**:
- Institution lists (4): schools, colleges, universities, companies
- Code validation (4): check school/college/university/company codes
- Email validation (1): check email availability
- Signup (12): school/college/university/recruiter signups
- Authenticated operations (6): create users, update documents

### 2. Storage API (14 endpoints)
**Base Path**: `/api/storage`

**Purpose**: File storage and retrieval using Cloudflare R2

**Endpoints**:
- Upload/Delete (2): file upload and deletion
- Presigned URLs (4): generate and confirm presigned URLs
- Document access (2): proxy and signed URLs
- Specialized (6): payment receipts, certificates, PDF extraction, file listing

### 3. Role Overview API (2 endpoints)
**Base Path**: `/api/role-overview`

**Purpose**: AI-generated career role overviews

**Endpoints**:
- Generate role overview (1)
- Match courses to role (1)

### 4. Question Generation API (3 endpoints)
**Base Path**: `/api/question-generation`

**Purpose**: AI-generated assessment questions

**Endpoints**:
- Career aptitude questions (1)
- Career knowledge questions (1)
- Course assessment questions (1)

### 5. Course API (6 endpoints)
**Base Path**: `/api/course`

**Purpose**: Course-related operations and AI tutor

**Endpoints**:
- AI tutor suggestions (1)
- AI tutor chat (1)
- AI tutor feedback (1)
- AI tutor progress (2): GET and POST
- Video summarizer (1)

### 6. Career API (1 endpoint)
**Base Path**: `/api/career`

**Purpose**: Career assessment and recommendations

**Endpoints**:
- Analyze assessment (1)

### 7. Adaptive Session API (9 endpoints)
**Base Path**: `/api/adaptive-session`

**Purpose**: Adaptive aptitude testing

**Endpoints**:
- Initialize test (1)
- Get next question (1)
- Submit answer (1)
- Complete test (1)
- Get results (2): by session and by student
- Resume test (1)
- Find in-progress (1)
- Abandon session (1)

---

## Shared Utilities

### Authentication (`functions/api/shared/auth.ts`)

```typescript
import { authenticateUser } from '../shared/auth';

// In your handler
const auth = await authenticateUser(request, env);
if (!auth) {
  return jsonResponse({ error: 'Unauthorized' }, 401);
}

// Use authenticated user
const userId = auth.user.id;
const supabase = auth.supabase;
```

### AI Integration (`functions/api/shared/ai-config.ts`)

```typescript
import { callOpenRouterWithRetry, repairAndParseJSON } from '../shared/ai-config';

// Call AI with automatic retry
const response = await callOpenRouterWithRetry(apiKey, messages, {
  maxTokens: 4000,
  temperature: 0.7
});

// Parse and repair JSON
const parsed = repairAndParseJSON(response);
```

### Supabase Client (`src/functions-lib/supabase.ts`)

```typescript
import { createSupabaseClient } from '../../../src/functions-lib/supabase';

// Create client
const supabase = createSupabaseClient(env);

// Query database
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', userId);
```

### Response Helpers (`src/functions-lib/response.ts`)

```typescript
import { jsonResponse } from '../../../src/functions-lib/response';

// Success response
return jsonResponse({ success: true, data: result });

// Error response
return jsonResponse({ error: 'Error message' }, 400);

// With custom headers
return jsonResponse(data, 200, {
  'Cache-Control': 'public, max-age=3600',
  'X-Custom-Header': 'value'
});
```

---

## Local Development

### Setup

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run pages:dev
```

### Testing

```bash
# Test endpoint
curl http://localhost:8788/api/user/schools

# Test with authentication
curl -H "Authorization: Bearer <token>" \
     http://localhost:8788/api/course/ai-tutor/chat

# Test file upload
curl -X POST http://localhost:8788/api/storage/upload \
     -F "file=@test.pdf" \
     -F "filename=test.pdf"
```

---

## Deployment

### Environment Variables

Required environment variables:
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-key
CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name
CLOUDFLARE_R2_ENDPOINT=your-r2-endpoint
OPENROUTER_API_KEY=your-openrouter-key
```

### Deploy to Cloudflare Pages

```bash
# Build project
npm run build

# Deploy via Wrangler
npx wrangler pages deploy dist

# Or deploy via Git integration
git push origin main
# Cloudflare Pages will auto-deploy
```

---

## Best Practices

### 1. Error Handling

```typescript
try {
  // Your code
  const result = await someOperation();
  return jsonResponse({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  return jsonResponse({
    error: 'Operation failed',
    details: error instanceof Error ? error.message : 'Unknown error'
  }, 500);
}
```

### 2. Input Validation

```typescript
import { sanitizeInput, isValidUUID } from '../shared/auth';

// Sanitize user input
const cleanInput = sanitizeInput(userInput);

// Validate UUID
if (!isValidUUID(id)) {
  return jsonResponse({ error: 'Invalid ID format' }, 400);
}
```

### 3. Authentication

```typescript
// Always authenticate sensitive endpoints
const auth = await authenticateUser(request, env);
if (!auth) {
  return jsonResponse({ error: 'Unauthorized' }, 401);
}

// Verify ownership
if (resource.userId !== auth.user.id) {
  return jsonResponse({ error: 'Forbidden' }, 403);
}
```

### 4. Caching

```typescript
// Cache frequently accessed data
const cacheKey = 'schools';
const cached = getCached(cacheKey);

if (cached) {
  return jsonResponse(cached, 200, {
    'Cache-Control': 'public, max-age=3600',
    'X-Cache': 'HIT'
  });
}

// Fetch and cache
const data = await fetchData();
setCache(cacheKey, data);

return jsonResponse(data, 200, {
  'Cache-Control': 'public, max-age=3600',
  'X-Cache': 'MISS'
});
```

---

## Troubleshooting

### Common Issues

**1. CORS Errors**
- Ensure origin is in `ALLOWED_ORIGINS` in `src/functions-lib/cors.ts`
- Check middleware is using `getCorsHeaders()`

**2. Authentication Failures**
- Verify JWT token is valid
- Check `SUPABASE_SERVICE_ROLE_KEY` is set
- Ensure Authorization header format: `Bearer <token>`

**3. File Upload Failures**
- Check file size < 100MB
- Verify file type is in whitelist
- Ensure R2 credentials are correct

**4. AI API Errors**
- Verify `OPENROUTER_API_KEY` is set
- Check API quota/limits
- Review fallback chain configuration

---

## Performance Optimization

### Current Performance
- Average response time: 97ms
- p50: 24ms
- p95: 277ms
- Cache hit rate: 100% (after warmup)

### Optimization Tips

1. **Enable Caching**
   - Cache frequently accessed data
   - Use appropriate TTL values
   - Add Cache-Control headers

2. **Optimize Database Queries**
   - Select only needed fields
   - Use indexes
   - Implement pagination

3. **Minimize AI Calls**
   - Cache AI responses
   - Use fallback data when appropriate
   - Implement request deduplication

---

## Security

### Implemented Security Measures

✅ JWT-based authentication
✅ Origin validation (CORS)
✅ Input sanitization
✅ SQL injection prevention
✅ File upload validation
✅ Environment variable usage
✅ Error message sanitization

### Security Recommendations

⚠️ Implement rate limiting
⚠️ Add file content validation
⚠️ Implement token expiration check
⚠️ Add security monitoring

See [Security Review](./TASK_80_SECURITY_REVIEW.md) for details.

---

## Testing

### Unit Tests

```bash
# Run unit tests
npm test

# Run specific test file
npm test -- handlers/upload.test.ts
```

### Integration Tests

```bash
# Test User API
node test-user-api-complete.cjs

# Test Storage API
node test-storage-api-complete.cjs

# Test AI APIs
node test-ai-apis-complete.cjs
```

### Performance Tests

```bash
# Run performance tests
node test-performance-all-apis.cjs
```

---

## Migration Guide

### From Standalone Workers to Pages Functions

**Key Changes**:
1. Import paths updated
2. Environment variables accessed via `env` parameter
3. CORS handled by middleware
4. Shared utilities consolidated

**Example Migration**:

```typescript
// Before (Standalone Worker)
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// After (Pages Function)
import { createSupabaseClient } from '../../../src/functions-lib/supabase';
const supabase = createSupabaseClient(env);
```

---

## Support and Resources

- **API Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Security Review**: [TASK_80_SECURITY_REVIEW.md](./TASK_80_SECURITY_REVIEW.md)
- **Performance Report**: [TASK_79_FINAL_PERFORMANCE_REPORT.md](./TASK_79_FINAL_PERFORMANCE_REPORT.md)
- **Testing Guides**: See `TASK_76_USER_API_TESTING.md`, `TASK_77_STORAGE_API_TESTING.md`, `TASK_78_AI_APIS_TESTING.md`

---

**Last Updated**: 2026-02-02
**Version**: 1.0.0
