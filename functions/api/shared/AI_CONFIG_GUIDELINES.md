# AI Configuration Guidelines

**IMPORTANT**: All AI functionality in this codebase MUST use the centralized AI configuration system defined in [`ai-config.ts`](./ai-config.ts).

## 🚫 DO NOT Do This

**NEVER hardcode AI models directly in handlers:**

```typescript
// ❌ WRONG - DO NOT DO THIS
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  body: JSON.stringify({
    model: 'google/gemini-2.0-flash-001',  // ❌ Hardcoded model
    messages: messages
  })
});
```

**NEVER define duplicate utility functions:**

```typescript
// ❌ WRONG - DO NOT DO THIS
function repairAndParseJSON(text: string) { /* ... */ }  // ❌ Duplicate utility
function delay(ms: number) { /* ... */ }  // ❌ Duplicate utility
const FREE_MODELS = ['model1', 'model2'];  // ❌ Duplicate model list
```

## ✅ DO This Instead

### 1. Import from Centralized Config

```typescript
import { 
  getModelForUseCase,
  callOpenRouterWithRetry,
  callAIWithFallback,
  repairAndParseJSON,
  getAPIKeys,
  delay,
  generateUUID,
  AI_MODELS
} from '../../shared/ai-config';
```

### 2. Use Helper Functions for AI Calls

**For simple model selection:**

```typescript
import { getModelForUseCase } from '../../shared/ai-config';

// Use predefined use cases
const model = getModelForUseCase('chat');
const model = getModelForUseCase('resume_parsing');
const model = getModelForUseCase('embedding');
```

**For API calls with automatic retry and fallback:**

```typescript
import { callOpenRouterWithRetry, getAPIKeys } from '../../shared/ai-config';

const { openRouter: openRouterKey } = getAPIKeys(env);

const response = await callOpenRouterWithRetry(
  openRouterKey,
  [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ],
  {
    maxRetries: 3,
    maxTokens: 2000,
    temperature: 0.7
  }
);
```

**For AI calls with Claude fallback:**

```typescript
import { callAIWithFallback } from '../../shared/ai-config';

const response = await callAIWithFallback(
  env,
  [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ],
  {
    useCase: 'question_generation',
    preferClaude: true,
    systemPrompt: systemPrompt
  }
);
```

## 📝 Adding New AI Functionality

### Step 1: Check if a Use Case Exists

Review the `MODEL_PROFILES` in `ai-config.ts` to see if your use case already exists:
- `question_generation`
- `chat`
- `resume_parsing`
- `keyword_generation`
- `embedding`
- `adaptive_assessment`

### Step 2: Add New Use Case (if needed)

If your use case doesn't exist, add it to `ai-config.ts`:

```typescript
export const MODEL_PROFILES: Record<ModelUseCase, ModelProfile> = {
  // ... existing use cases ...
  
  your_new_use_case: {
    primary: AI_MODELS.GEMINI_2_FLASH,  // Choose appropriate model
    fallbacks: [AI_MODELS.LLAMA_3_8B, AI_MODELS.GEMINI_PRO],
    maxTokens: 2000,
    temperature: 0.7,
  },
};
```

And update the `ModelUseCase` type:

```typescript
export type ModelUseCase = 
  | 'question_generation'
  | 'chat'
  | 'your_new_use_case';  // Add your new use case
```

### Step 3: Use the Centralized Config

In your handler, always import and use the centralized functions:

```typescript
import { getModelForUseCase, callOpenRouterWithRetry } from '../../shared/ai-config';

// Use the model from your use case
const model = getModelForUseCase('your_new_use_case');
```

## 🔧 Common Patterns

### Pattern 1: Simple OpenRouter Call

```typescript
import { callOpenRouterWithRetry, getAPIKeys } from '../../shared/ai-config';

const { openRouter: openRouterKey } = getAPIKeys(env);
const response = await callOpenRouterWithRetry(openRouterKey, messages);
```

### Pattern 2: Claude with OpenRouter Fallback

```typescript
import { callAIWithFallback } from '../../shared/ai-config';

const response = await callAIWithFallback(env, messages, {
  useCase: 'question_generation',
  preferClaude: true
});
```

### Pattern 3: Custom Model Selection

```typescript
import { callOpenRouterWithRetry, AI_MODELS, getAPIKeys } from '../../shared/ai-config';

const { openRouter: openRouterKey } = getAPIKeys(env);

// Specify custom model list for special cases
const response = await callOpenRouterWithRetry(
  openRouterKey,
  messages,
  {
    models: [AI_MODELS.GPT_4O_MINI, AI_MODELS.CLAUDE_HAIKU],
    maxRetries: 3
  }
);
```

### Pattern 4: JSON Parsing

```typescript
import { repairAndParseJSON } from '../../shared/ai-config';

const aiResponseText = await callOpenRouterWithRetry(/* ... */);
const parsedData = repairAndParseJSON(aiResponseText);
```

## 📋 Checklist for New AI Features

When creating or editing handlers that use AI:

- [ ] Import from `../../shared/ai-config.ts` instead of defining utilities
- [ ] Use `getModelForUseCase()` or `callOpenRouterWithRetry()` instead of hardcoding models
- [ ] Use `getAPIKeys(env)` instead of manually accessing env variables
- [ ] Use `repairAndParseJSON()` for parsing AI responses
- [ ] Use `delay()` and `generateUUID()` from centralized config
- [ ] Check if your use case exists in `MODEL_PROFILES`, add it if needed
- [ ] Do NOT create duplicate utility functions
- [ ] Do NOT hardcode model strings

## 🎯 Available Models

All available models are defined in `AI_MODELS`:

```typescript
AI_MODELS.GEMINI_2_FLASH          // google/gemini-2.0-flash-001
AI_MODELS.GEMINI_FLASH_EXP        // google/gemini-2.0-flash-exp:free
AI_MODELS.LLAMA_3_8B              // meta-llama/llama-3-8b-instruct:free
AI_MODELS.LLAMA_3_2_3B            // meta-llama/llama-3.2-3b-instruct:free
AI_MODELS.GEMINI_PRO              // google/gemini-pro
AI_MODELS.GPT_4O_MINI             // openai/gpt-4o-mini
AI_MODELS.CLAUDE_HAIKU            // claude-3-haiku-20240307
AI_MODELS.CLAUDE_SONNET           // anthropic/claude-3.5-sonnet
AI_MODELS.EMBEDDING_SMALL         // openai/text-embedding-3-small
// ... more models in ai-config.ts
```

## 🔍 Example Handler Structure

Here's a complete example of a properly structured AI handler:

```typescript
import { jsonResponse } from '../../../../src/functions-lib/response';
import { authenticateUser } from '../utils/auth';
import { 
  callOpenRouterWithRetry, 
  repairAndParseJSON,
  getAPIKeys,
  getModelForUseCase 
} from '../../shared/ai-config';

export async function handleMyAIFeature(
  request: Request, 
  env: Record<string, string>
): Promise<Response> {
  // Authentication
  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  // Get API keys
  const { openRouter: openRouterKey } = getAPIKeys(env);
  
  if (!openRouterKey) {
    return jsonResponse({ error: 'API key not configured' }, 500);
  }

  // Build your prompt
  const messages = [
    { role: 'system', content: 'Your system prompt' },
    { role: 'user', content: 'User message' }
  ];

  // Call AI with centralized config
  const aiResponse = await callOpenRouterWithRetry(
    openRouterKey,
    messages,
    {
      maxRetries: 3,
      maxTokens: 2000,
      temperature: 0.7
    }
  );

  // Parse response
  const parsedData = repairAndParseJSON(aiResponse);

  return jsonResponse({ success: true, data: parsedData });
}
```

## 📚 Further Reading

- See existing handlers in `functions/api/career/handlers/` for examples
- See `functions/api/question-generation/handlers/` for more complex examples
- Review `ai-config.ts` for all available utilities and configurations

## ⚠️ Critical Rules

1. **NEVER hardcode AI model strings** - Always use `AI_MODELS` constants or `getModelForUseCase()`
2. **NEVER duplicate utility functions** - Import from `ai-config.ts`
3. **ALWAYS use centralized retry logic** - Use `callOpenRouterWithRetry()` or `callAIWithFallback()`
4. **ALWAYS use `getAPIKeys(env)`** - Don't access env variables directly
5. **ALWAYS check existing use cases** before adding new ones

---

**Remember**: The goal is to maintain a **single source of truth** for all AI configuration. This makes the codebase easier to maintain, test, and evolve.
