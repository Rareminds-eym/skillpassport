# AI Config Usage Guide

## Quick Reference for Using Shared AI Configuration

This guide shows you how to properly use the shared AI configuration in `functions/api/shared/ai-config.ts` when implementing new API handlers.

---

## ✅ DO: Use Shared Utilities

### 1. Import from Shared Config
```typescript
import { 
  AI_MODELS,              // Model definitions
  getAPIKeys,             // API key retrieval
  API_CONFIG,             // Endpoint & header config
  MODEL_PROFILES,         // Use case-specific model chains
  callOpenRouterWithRetry,// API calls with retry
  repairAndParseJSON,     // JSON parsing with repair
  generateUUID            // UUID generation
} from '../../shared/ai-config';
```

### 2. Get API Keys
```typescript
// ✅ CORRECT
const { openRouter, claude } = getAPIKeys(env);
if (!openRouter) {
  throw new Error('OpenRouter API key not configured');
}
```

### 3. Use Model Constants
```typescript
// ✅ CORRECT
const models = [
  AI_MODELS.CLAUDE_SONNET,
  AI_MODELS.GEMINI_2_FLASH,
  AI_MODELS.GEMINI_PRO
];
```

### 4. Use API Config
```typescript
// ✅ CORRECT
const response = await fetch(API_CONFIG.OPENROUTER.endpoint, {
  method: 'POST',
  headers: {
    ...API_CONFIG.OPENROUTER.headers,
    'Authorization': `Bearer ${openRouter}`,
  },
  body: JSON.stringify(requestBody)
});
```

### 5. Use callOpenRouterWithRetry
```typescript
// ✅ CORRECT - Automatic retry and fallback
const content = await callOpenRouterWithRetry(openRouter, messages, {
  models: [AI_MODELS.GEMINI_2_FLASH, AI_MODELS.GEMINI_PRO],
  maxTokens: 4000,
  temperature: 0.7,
  maxRetries: 3
});
```

### 6. Parse JSON Responses
```typescript
// ✅ CORRECT - Handles malformed JSON
const result = repairAndParseJSON(content);
```

---

## ❌ DON'T: Hardcode Configuration

### 1. Don't Hardcode API Keys
```typescript
// ❌ WRONG
const openRouterKey = env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY;

// ✅ CORRECT
const { openRouter } = getAPIKeys(env);
```

### 2. Don't Hardcode Model Names
```typescript
// ❌ WRONG
const model = 'anthropic/claude-3.5-sonnet';

// ✅ CORRECT
const model = AI_MODELS.CLAUDE_SONNET;
```

### 3. Don't Hardcode Endpoints
```typescript
// ❌ WRONG
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  // ...
});

// ✅ CORRECT
const response = await fetch(API_CONFIG.OPENROUTER.endpoint, {
  // ...
});
```

### 4. Don't Hardcode Headers
```typescript
// ❌ WRONG
headers: {
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://skillpassport.pages.dev',
  'X-Title': 'SkillPassport Assessment',
  'Authorization': `Bearer ${key}`,
}

// ✅ CORRECT
headers: {
  ...API_CONFIG.OPENROUTER.headers,
  'Authorization': `Bearer ${openRouter}`,
}
```

### 5. Don't Implement Custom Retry Logic
```typescript
// ❌ WRONG - Custom retry logic
for (let i = 0; i < 3; i++) {
  try {
    const response = await fetch(url, options);
    // ...
  } catch (error) {
    if (i === 2) throw error;
  }
}

// ✅ CORRECT - Use shared retry
const content = await callOpenRouterWithRetry(openRouter, messages, options);
```

---

## Common Patterns

### Pattern 1: Simple AI Call with Retry
```typescript
import { getAPIKeys, callOpenRouterWithRetry, repairAndParseJSON } from '../../shared/ai-config';

export async function handleMyEndpoint(request: Request, env: any) {
  const { openRouter } = getAPIKeys(env);
  if (!openRouter) {
    return jsonResponse({ error: 'AI service not configured' }, 500);
  }

  const messages = [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'Hello!' }
  ];

  const content = await callOpenRouterWithRetry(openRouter, messages, {
    maxTokens: 2000,
    temperature: 0.7
  });

  const result = repairAndParseJSON(content);
  return jsonResponse(result);
}
```

### Pattern 2: Custom Model Chain
```typescript
import { AI_MODELS, getAPIKeys, callOpenRouterWithRetry } from '../../shared/ai-config';

const CUSTOM_MODELS = [
  AI_MODELS.CLAUDE_SONNET,  // Try Claude first
  AI_MODELS.GEMINI_2_FLASH, // Fallback to Gemini
  AI_MODELS.GEMINI_PRO      // Final fallback
];

const content = await callOpenRouterWithRetry(openRouter, messages, {
  models: CUSTOM_MODELS,
  maxTokens: 4000,
  temperature: 0.1
});
```

### Pattern 3: Streaming Response
```typescript
import { AI_MODELS, API_CONFIG, getAPIKeys } from '../../shared/ai-config';

const { openRouter } = getAPIKeys(env);

const response = await fetch(API_CONFIG.OPENROUTER.endpoint, {
  method: 'POST',
  headers: {
    ...API_CONFIG.OPENROUTER.headers,
    'Authorization': `Bearer ${openRouter}`,
  },
  body: JSON.stringify({
    model: AI_MODELS.GEMINI_2_FLASH,
    messages: messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 2000
  })
});

// Handle streaming response...
```

### Pattern 4: Use Case-Specific Models
```typescript
import { MODEL_PROFILES, getAPIKeys, callOpenRouterWithRetry } from '../../shared/ai-config';

const profile = MODEL_PROFILES['chat']; // or 'question_generation', 'resume_parsing', etc.
const models = [profile.primary, ...profile.fallbacks];

const content = await callOpenRouterWithRetry(openRouter, messages, {
  models: models,
  maxTokens: profile.maxTokens,
  temperature: profile.temperature
});
```

---

## Available Model Use Cases

```typescript
type ModelUseCase =
  | 'question_generation'  // For generating assessment questions
  | 'chat'                 // For conversational AI
  | 'resume_parsing'       // For parsing resumes
  | 'keyword_generation'   // For generating keywords
  | 'embedding'            // For embeddings
  | 'adaptive_assessment'; // For adaptive assessments
```

---

## Available Models

```typescript
AI_MODELS.GEMINI_2_FLASH      // Primary free model
AI_MODELS.GEMINI_FLASH_EXP    // Experimental Gemini
AI_MODELS.LLAMA_3_8B          // Llama 3 8B
AI_MODELS.LLAMA_3_2_3B        // Llama 3.2 3B
AI_MODELS.GEMINI_PRO          // Gemini Pro
AI_MODELS.GEMINI_FLASH_1_5_8B // Gemini Flash 1.5
AI_MODELS.XIAOMI_MIMO         // Xiaomi Mimo
AI_MODELS.GPT_4O_MINI         // GPT-4o Mini (paid)
AI_MODELS.CLAUDE_HAIKU        // Claude Haiku (paid)
AI_MODELS.CLAUDE_SONNET       // Claude Sonnet (paid)
AI_MODELS.EMBEDDING_SMALL     // Embedding model
```

---

## Helper Functions

### getAPIKeys(env)
Returns API keys from environment:
```typescript
const { openRouter, claude } = getAPIKeys(env);
```

### callOpenRouterWithRetry(key, messages, options)
Calls OpenRouter with automatic retry and model fallback:
```typescript
const content = await callOpenRouterWithRetry(openRouter, messages, {
  models?: string[],      // Models to try (default: Gemini chain)
  maxRetries?: number,    // Max retries per model (default: 3)
  maxTokens?: number,     // Max tokens (default: 4000)
  temperature?: number    // Temperature (default: 0.7)
});
```

### repairAndParseJSON(text)
Parses JSON with automatic repair for common issues:
```typescript
const result = repairAndParseJSON(content);
```

### generateUUID()
Generates a UUID v4:
```typescript
const id = generateUUID();
```

### delay(ms)
Delays execution:
```typescript
await delay(1000); // Wait 1 second
```

---

## Examples from Existing Code

### Example 1: Analyze Assessment Handler
```typescript
// functions/api/analyze-assessment/handlers/analyze.ts
import { 
  repairAndParseJSON, 
  AI_MODELS, 
  getAPIKeys,
  API_CONFIG
} from '../../shared/ai-config';

const ASSESSMENT_MODELS = [
  AI_MODELS.CLAUDE_SONNET,
  AI_MODELS.GEMINI_2_FLASH,
  AI_MODELS.GEMINI_PRO,
  AI_MODELS.XIAOMI_MIMO
];

const { openRouter } = getAPIKeys(env);

const response = await fetch(API_CONFIG.OPENROUTER.endpoint, {
  method: 'POST',
  headers: {
    ...API_CONFIG.OPENROUTER.headers,
    'Authorization': `Bearer ${openRouter}`,
  },
  body: JSON.stringify(requestBody)
});

const result = repairAndParseJSON(content);
```

### Example 2: Career Chat Handler
```typescript
// functions/api/career/handlers/chat.ts
import { 
  getModelForUseCase, 
  API_CONFIG, 
  MODEL_PROFILES, 
  getAPIKeys 
} from '../../shared/ai-config';

const { openRouter: openRouterKey } = getAPIKeys(env);

const chatProfile = MODEL_PROFILES['chat'];
const modelsToTry = [chatProfile.primary, ...chatProfile.fallbacks];

for (const model of modelsToTry) {
  const response = await fetch(API_CONFIG.OPENROUTER.endpoint, {
    method: 'POST',
    headers: {
      ...API_CONFIG.OPENROUTER.headers,
      'Authorization': `Bearer ${openRouterKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: aiMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  if (response.ok) break;
}
```

### Example 3: Question Generation Handler
```typescript
// functions/api/question-generation/handlers/course-assessment.ts
import {
  callOpenRouterWithRetry,
  repairAndParseJSON,
  generateUUID,
  getAPIKeys
} from '../../shared/ai-config';

const { openRouter: openRouterKey } = getAPIKeys(env);

const jsonText = await callOpenRouterWithRetry(openRouterKey, [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: prompt }
], {
  maxTokens: 4000,
  temperature: 0.7
});

const parsed = repairAndParseJSON(jsonText);
```

---

## Summary

✅ **Always use shared utilities from `ai-config.ts`**
✅ **Never hardcode API keys, endpoints, or model names**
✅ **Use `callOpenRouterWithRetry` for automatic retry and fallback**
✅ **Use `repairAndParseJSON` for robust JSON parsing**
✅ **Use `MODEL_PROFILES` for use case-specific configurations**

This ensures consistency, maintainability, and type safety across all AI APIs.
