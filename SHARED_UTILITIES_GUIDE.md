# Shared Utilities Guide

## Overview

This guide documents all shared utilities available in the Cloudflare Pages Functions architecture.

---

## Table of Contents

1. [Authentication](#authentication)
2. [AI Integration](#ai-integration)
3. [Supabase Client](#supabase-client)
4. [Response Helpers](#response-helpers)
5. [CORS Utilities](#cors-utilities)

---

## Authentication

**Location**: `functions/api/shared/auth.ts`

### authenticateUser()

Authenticate user from Authorization header with dual method (JWT decode + Supabase fallback).

**Usage**:
```typescript
import { authenticateUser } from '../shared/auth';

const auth = await authenticateUser(request, env);
if (!auth) {
  return jsonResponse({ error: 'Unauthorized' }, 401);
}

// Access user info
const userId = auth.user.id;
const userEmail = auth.user.email;

// Use Supabase clients
const supabase = auth.supabase; // User context
const supabaseAdmin = auth.supabaseAdmin; // Admin context
```

**Returns**:
```typescript
{
  user: { id: string, email?: string },
  supabase: SupabaseClient,
  supabaseAdmin: SupabaseClient
}
```

### sanitizeInput()

Sanitize user input to prevent XSS attacks.

**Usage**:
```typescript
import { sanitizeInput } from '../shared/auth';

const cleanInput = sanitizeInput(userInput);
// Removes HTML tags, angle brackets, trims, limits to 2000 chars
```

### isValidUUID()

Validate UUID format.

**Usage**:
```typescript
import { isValidUUID } from '../shared/auth';

if (!isValidUUID(id)) {
  return jsonResponse({ error: 'Invalid ID format' }, 400);
}
```

---

## AI Integration

**Location**: `functions/api/shared/ai-config.ts`

### callOpenRouterWithRetry()

Call OpenRouter API with automatic retry and model fallback.

**Usage**:
```typescript
import { callOpenRouterWithRetry } from '../shared/ai-config';

const response = await callOpenRouterWithRetry(
  env.OPENROUTER_API_KEY,
  messages,
  {
    maxTokens: 4000,
    temperature: 0.7,
    model: 'google/gemini-2.0-flash-exp:free' // optional
  }
);
```

**Features**:
- Automatic retry on failure
- Model fallback chain
- Error handling
- Timeout management

### callAIWithFallback()

Call AI with Claude → OpenRouter fallback.

**Usage**:
```typescript
import { callAIWithFallback } from '../shared/ai-config';

const response = await callAIWithFallback(
  env,
  messages,
  { maxTokens: 4000 }
);
```

**Fallback Chain**:
1. Claude 3.5 Sonnet (primary)
2. OpenRouter (fallback)

### repairAndParseJSON()

Parse JSON with automatic repair for truncated responses.

**Usage**:
```typescript
import { repairAndParseJSON } from '../shared/ai-config';

const parsed = repairAndParseJSON(aiResponse);
// Handles truncated JSON, missing brackets, etc.
```

### getAPIKeys()

Extract API keys from environment.

**Usage**:
```typescript
import { getAPIKeys } from '../shared/ai-config';

const { openRouter, claude, deepgram, groq } = getAPIKeys(env);
```

---

## Supabase Client

**Location**: `src/functions-lib/supabase.ts`

### createSupabaseClient()

Create Supabase client with user context.

**Usage**:
```typescript
import { createSupabaseClient } from '../../../src/functions-lib/supabase';

const supabase = createSupabaseClient(env);

// Query with user context
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId);
```

### createSupabaseAdminClient()

Create Supabase client with admin privileges.

**Usage**:
```typescript
import { createSupabaseAdminClient } from '../../../src/functions-lib/supabase';

const supabaseAdmin = createSupabaseAdminClient(env);

// Query with admin privileges (bypasses RLS)
const { data, error } = await supabaseAdmin
  .from('table_name')
  .select('*');
```

**⚠️ Warning**: Use admin client carefully - it bypasses Row Level Security!

---

## Response Helpers

**Location**: `src/functions-lib/response.ts`

### jsonResponse()

Create standardized JSON response with CORS headers.

**Usage**:
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

**Parameters**:
- `data`: Response data (any)
- `status`: HTTP status code (default: 200)
- `additionalHeaders`: Optional custom headers

### errorResponse()

Create error response.

**Usage**:
```typescript
import { errorResponse } from '../../../src/functions-lib/response';

return errorResponse('Operation failed', 500);
```

### successResponse()

Create success response.

**Usage**:
```typescript
import { successResponse } from '../../../src/functions-lib/response';

return successResponse({ data: result });
```

### streamResponse()

Create streaming response for Server-Sent Events.

**Usage**:
```typescript
import { streamResponse } from '../../../src/functions-lib/response';

const stream = new ReadableStream({
  async start(controller) {
    controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
    controller.close();
  }
});

return streamResponse(stream);
```

---

## CORS Utilities

**Location**: `src/functions-lib/cors.ts`

### getCorsHeaders()

Get CORS headers with origin validation.

**Usage**:
```typescript
import { getCorsHeaders } from '../../../src/functions-lib/cors';

const origin = request.headers.get('Origin');
const corsHeaders = getCorsHeaders(origin);

return new Response(data, {
  headers: {
    ...corsHeaders,
    'Content-Type': 'application/json'
  }
});
```

**Features**:
- Origin whitelist validation
- Fallback to first allowed origin
- Credentials support

### corsHeaders (Legacy)

Legacy CORS headers with wildcard.

**⚠️ Deprecated**: Use `getCorsHeaders()` instead for better security.

---

## Usage Examples

### Example 1: Authenticated Endpoint

```typescript
import { authenticateUser } from '../shared/auth';
import { createSupabaseClient } from '../../../src/functions-lib/supabase';
import { jsonResponse } from '../../../src/functions-lib/response';

export async function handleGetUserData(request: Request, env: PagesEnv) {
  // Authenticate
  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Query database
  const { data, error } = await auth.supabase
    .from('user_data')
    .select('*')
    .eq('user_id', auth.user.id)
    .single();

  if (error) {
    return jsonResponse({ error: 'Failed to fetch data' }, 500);
  }

  return jsonResponse({ success: true, data });
}
```

### Example 2: AI Integration

```typescript
import { authenticateUser } from '../shared/auth';
import { callOpenRouterWithRetry, repairAndParseJSON } from '../shared/ai-config';
import { jsonResponse } from '../../../src/functions-lib/response';

export async function handleAIGeneration(request: Request, env: PagesEnv) {
  // Authenticate
  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Parse request
  const { prompt } = await request.json();

  // Call AI
  const messages = [{ role: 'user', content: prompt }];
  const response = await callOpenRouterWithRetry(
    env.OPENROUTER_API_KEY,
    messages,
    { maxTokens: 2000 }
  );

  // Parse response
  const parsed = repairAndParseJSON(response);

  return jsonResponse({ success: true, data: parsed });
}
```

### Example 3: File Upload with Validation

```typescript
import { authenticateUser, sanitizeInput } from '../shared/auth';
import { jsonResponse } from '../../../src/functions-lib/response';
import { R2Client } from '../utils/r2-client';

export async function handleFileUpload(request: Request, env: PagesEnv) {
  // Authenticate
  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Parse form data
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const filename = sanitizeInput(formData.get('filename') as string);

  // Validate
  if (!file || file.size > 100 * 1024 * 1024) {
    return jsonResponse({ error: 'Invalid file' }, 400);
  }

  // Upload to R2
  const r2 = new R2Client(env);
  const key = `uploads/${Date.now()}-${filename}`;
  const url = await r2.upload(key, await file.arrayBuffer(), file.type);

  return jsonResponse({ success: true, url, key });
}
```

---

## Best Practices

### 1. Always Authenticate Sensitive Endpoints

```typescript
const auth = await authenticateUser(request, env);
if (!auth) {
  return jsonResponse({ error: 'Unauthorized' }, 401);
}
```

### 2. Sanitize All User Input

```typescript
const cleanInput = sanitizeInput(userInput);
```

### 3. Use Appropriate Supabase Client

```typescript
// User context (respects RLS)
const supabase = auth.supabase;

// Admin context (bypasses RLS) - use carefully!
const supabaseAdmin = auth.supabaseAdmin;
```

### 4. Handle Errors Gracefully

```typescript
try {
  const result = await operation();
  return jsonResponse({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  return jsonResponse({
    error: 'Operation failed',
    details: error instanceof Error ? error.message : 'Unknown error'
  }, 500);
}
```

### 5. Use AI Utilities for Consistency

```typescript
// Good - uses shared utility with retry
const response = await callOpenRouterWithRetry(apiKey, messages);

// Bad - direct fetch without retry
const response = await fetch('https://openrouter.ai/...');
```

---

## Troubleshooting

### Authentication Issues

**Problem**: `authenticateUser()` returns null
**Solutions**:
- Verify Authorization header format: `Bearer <token>`
- Check token is valid and not expired
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

### AI Integration Issues

**Problem**: AI calls failing
**Solutions**:
- Verify `OPENROUTER_API_KEY` is set
- Check API quota/limits
- Review error messages in logs
- Ensure fallback chain is configured

### Supabase Issues

**Problem**: Database queries failing
**Solutions**:
- Verify `SUPABASE_URL` and keys are set
- Check Row Level Security policies
- Use admin client if RLS is blocking
- Review error messages

---

**Last Updated**: 2026-02-02
**Version**: 1.0.0
