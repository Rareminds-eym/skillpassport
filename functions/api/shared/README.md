# Shared Utilities for Cloudflare Pages Functions

This directory contains shared utilities used across all Pages Functions APIs.

## Migration History

### Task 2: Organize Shared Utilities ✅
**Date:** January 30, 2026

**Actions Completed:**
1. ✅ Moved `functions/api/career/utils/auth.ts` to `functions/api/shared/auth.ts`
2. ✅ Updated all 5 career API handlers to use new import path
3. ✅ Removed old duplicate `auth.ts` from `career/utils`
4. ✅ Verified career API still works (0 TypeScript errors)
5. ✅ Documented shared utility usage patterns

### Task 3: Auth Path Consolidation (May 2026)
**Date:** May 27, 2026

**Actions Completed:**
1. ✅ Moved `authenticateUser`, `sanitizeInput`, `isValidUUID` to `functions/lib/auth.ts` and `functions/lib/validation.ts`
2. ✅ Replaced `function-lib` Supabase pattern with `auth-core` `verifyJWT` (per-request init, no module-level singleton)
3. ✅ Updated all 24 caller files with new import paths
4. ✅ Deleted `functions/api/shared/auth.ts`
5. ✅ Updated original README and import path docs

**Test Results:** 0 TypeScript errors

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

### 2. Authentication (`lib/auth.ts`)

Authentication and user utilities for secured endpoints. Uses `@rareminds-eym/auth-core` for JWT verification.

**Key Functions:**
- `authenticateUser()` - verifyJWT via auth-core (bridge for legacy callers)
- `initAuthFromEnv()` - Per-request auth-core init with SSO_SERVICE binding support
- `withAuth()` - Wraps auth-core's withAuth with email-verification enforcement
- `sanitizeInput()` - XSS prevention (in `lib/validation.ts`)
- `generateConversationTitle()` - Title generation (in `lib/validation.ts`)
- `isValidUUID()` - UUID validation (in `lib/validation.ts`)

**Usage Example:**
```typescript
import { authenticateUser } from '../../lib/auth';
import { sanitizeInput, isValidUUID } from '../../lib/validation';
import { apiError } from '../../lib/response';

// Authenticate request
const auth = await authenticateUser(request, env);
if (!auth) {
  return apiError(401, 'UNAUTHORIZED', 'Unauthorized');
}

// Use authenticated user
const { user, supabase, supabaseAdmin } = auth;

// Sanitize user input
const cleanInput = sanitizeInput(userMessage);

// Validate UUID
if (!isValidUUID(conversationId)) {
  return apiError(400, 'INVALID_ID', 'Invalid ID');
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
import { authenticateUser } from '../../lib/auth';
import { apiError } from '../../lib/response';

export async function handleProtectedEndpoint(request: Request, env: any) {
  // Authenticate
  const auth = await authenticateUser(request, env);
  if (!auth) {
    return apiError(401, 'UNAUTHORIZED', 'Unauthorized');
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
- Create new Supabase client patterns - use `createSupabaseClient` from `lib`
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
import { authenticateUser } from '../../lib/auth';
import { sanitizeInput, isValidUUID } from '../../lib/validation';
```

From any router in `functions/api/{api-name}/`:
```typescript
import { /* utilities */ } from '../shared/ai-config';
import { authenticateUser } from '../lib/auth';
import { sanitizeInput, isValidUUID } from '../lib/validation';
```

## Environment Variables

All shared utilities expect these environment variables:

**Required for AI:**
- `OPENROUTER_API_KEY`

**Required for Auth:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
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
