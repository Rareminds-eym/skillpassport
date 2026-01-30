# Shared Utilities for Cloudflare Pages Functions

This directory contains shared utilities used across all Pages Functions APIs.

## Migration History

### Task 2: Organize Shared Utilities ✅
**Date:** January 30, 2026

**Actions Completed:**
1. ✅ Moved `functions/api/career/utils/auth.ts` to `functions/api/shared/auth.ts`
2. ✅ Updated all 5 career API handlers to use new import path:
   - `chat.ts` - imports `authenticateUser`, `sanitizeInput`
   - `recommend.ts` - imports `isValidUUID`
   - `parse-resume.ts` - imports `authenticateUser`
   - `analyze-assessment.ts` - imports `authenticateUser`
   - `generate-embedding.ts` - imports `authenticateUser`, `isValidUUID`
3. ✅ Removed old duplicate `auth.ts` from `career/utils`
4. ✅ Verified career API still works (0 TypeScript errors)
5. ✅ Documented shared utility usage patterns

**Test Results:** 8/8 tests passed (see `test-career-api-migration.cjs`)

---

## Available Utilities

### 1. AI Configuration (`ai-config.ts`)

Comprehensive AI utilities for OpenRouter and Claude API integration.

**Key Functions:**
- `callOpenRouterWithRetry()` - Automatic retry with model fallback
- `callAIWithFallback()` - Claude → OpenRouter fallback
- `repairAndParseJSON()` - Robust JSON parsing with repair
- `generateUUID()` - UUID generation
- `getAPIKeys()` - Environment variable helper
- `delay()` - Async delay utility

**Usage Example:**
```typescript
import { callOpenRouterWithRetry, repairAndParseJSON, getAPIKeys } from '../../shared/ai-config';

const { openRouter } = getAPIKeys(env);
const response = await callOpenRouterWithRetry(openRouter, messages, {
  maxTokens: 4000,
  temperature: 0.7
});
const parsed = repairAndParseJSON(response);
```

**Model Profiles:**
- Available for all use cases (chat, analysis, generation, etc.)
- Automatic fallback chain
- Comprehensive error handling

### 2. Authentication (`auth.ts`)

Authentication and user utilities for secured endpoints.

**Key Functions:**
- `authenticateUser()` - JWT decode + Supabase fallback
- `sanitizeInput()` - XSS prevention
- `generateConversationTitle()` - Title generation
- `isValidUUID()` - UUID validation

**Usage Example:**
```typescript
import { authenticateUser, sanitizeInput, isValidUUID } from '../../shared/auth';

// Authenticate request
const auth = await authenticateUser(request, env);
if (!auth) {
  return jsonResponse({ error: 'Unauthorized' }, 401);
}

// Use authenticated user
const { user, supabase, supabaseAdmin } = auth;

// Sanitize user input
const cleanInput = sanitizeInput(userMessage);

// Validate UUID
if (!isValidUUID(conversationId)) {
  return jsonResponse({ error: 'Invalid ID' }, 400);
}
```

## Usage Patterns

### Pattern 1: AI API Call with Retry

```typescript
import { callOpenRouterWithRetry, getAPIKeys } from '../../shared/ai-config';

const { openRouter } = getAPIKeys(env);
const response = await callOpenRouterWithRetry(openRouter, [
  { role: 'user', content: prompt }
], {
  maxTokens: 2000,
  temperature: 0.7
});
```

### Pattern 2: Authenticated Endpoint

```typescript
import { authenticateUser } from '../../shared/auth';
import { jsonResponse } from '../../../src/functions-lib/response';

export async function handleProtectedEndpoint(request: Request, env: any) {
  // Authenticate
  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Use authenticated user
  const { user, supabase } = auth;
  
  // Your logic here
}
```

### Pattern 3: AI with JSON Parsing

```typescript
import { callOpenRouterWithRetry, repairAndParseJSON, getAPIKeys } from '../../shared/ai-config';

const { openRouter } = getAPIKeys(env);
const jsonText = await callOpenRouterWithRetry(openRouter, messages);
const data = repairAndParseJSON(jsonText);
```

## Critical Rules

### ❌ DO NOT:
- Rewrite AI calling logic - use `callOpenRouterWithRetry`
- Rewrite JSON parsing - use `repairAndParseJSON`
- Rewrite authentication - use `authenticateUser`
- Create new Supabase client patterns - use `createSupabaseClient` from functions-lib
- Hardcode model names - use MODEL_PROFILES from ai-config
- Implement custom retry logic - it's already in ai-config

### ✅ DO:
- Always use shared utilities for AI calls
- Always use shared auth for protected endpoints
- Always sanitize user input
- Always validate UUIDs before database queries
- Follow existing patterns in implemented APIs (otp, streak, fetch-certificate)

## Import Paths

From any handler in `functions/api/{api-name}/handlers/`:
```typescript
import { /* utilities */ } from '../../shared/ai-config';
import { /* utilities */ } from '../../shared/auth';
```

From any router in `functions/api/{api-name}/`:
```typescript
import { /* utilities */ } from '../shared/ai-config';
import { /* utilities */ } from '../shared/auth';
```

## Environment Variables

All shared utilities expect these environment variables:

**Required for AI:**
- `OPENROUTER_API_KEY` or `VITE_OPENROUTER_API_KEY`
- `CLAUDE_API_KEY` or `VITE_CLAUDE_API_KEY` (optional, for fallback)

**Required for Auth:**
- `SUPABASE_URL` or `VITE_SUPABASE_URL`
- `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Testing

All shared utilities are tested through the APIs that use them. When implementing new endpoints:

1. Use shared utilities as documented
2. Test locally with `wrangler pages dev`
3. Verify authentication works with real JWT tokens
4. Verify AI calls work with real API keys

## Migration Checklist

When migrating a handler from cloudflare-workers:

- [ ] Replace custom AI calls with `callOpenRouterWithRetry`
- [ ] Replace custom JSON parsing with `repairAndParseJSON`
- [ ] Replace custom auth with `authenticateUser`
- [ ] Update import paths to use shared utilities
- [ ] Test locally before deploying

## Support

For questions or issues with shared utilities:
1. Check existing implementations (otp, streak, career, course APIs)
2. Review AI_CONFIG_GUIDELINES.md for AI utility details
3. Test locally with `wrangler pages dev`
