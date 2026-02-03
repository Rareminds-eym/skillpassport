# Cloudflare Functions - AI Integration

This directory contains Cloudflare Pages Functions with centralized AI configuration.

## Directory Structure

```
functions/api/
├── shared/
│   ├── ai-config.ts           # ⭐ CENTRALIZED AI CONFIGURATION
│   └── AI_CONFIG_GUIDELINES.md # Documentation for AI usage
├── career/
│   └── handlers/               # Career-related AI handlers
├── course/
│   └── handlers/               # Course-related AI handlers
└── question-generation/
    └── handlers/               # Question generation AI handlers
```

## 🚨 IMPORTANT: AI Configuration

**ALL AI functionality MUST use the centralized configuration system.**

👉 **Read this first**: [`AI_CONFIG_GUIDELINES.md`](./shared/AI_CONFIG_GUIDELINES.md)

### Quick Start

When creating or editing ANY function that uses AI:

```typescript
// ✅ CORRECT - Import from centralized config
import { 
  getModelForUseCase,
  callOpenRouterWithRetry,
  getAPIKeys 
} from '../../shared/ai-config';

// ❌ WRONG - Never hardcode models
const model = 'google/gemini-2.0-flash-001'; // DON'T DO THIS
```

### Available Use Cases

- `question_generation` - For generating quiz/assessment questions
- `chat` - For conversational AI features
- `resume_parsing` - For extracting data from resumes
- `keyword_generation` - For generating keywords from text
- `embedding` - For creating vector embeddings
- `adaptive_assessment` - For adaptive testing features

## Key Files

- **`shared/ai-config.ts`** - Centralized AI configuration (models, APIs, utilities)
- **`shared/AI_CONFIG_GUIDELINES.md`** - Complete usage guidelines and examples

## Rules for AI Assistants & Developers

1. ✅ **ALWAYS** use `ai-config.ts` for AI functionality
2. ✅ **ALWAYS** import utilities instead of duplicating them
3. ✅ **ALWAYS** use `getModelForUseCase()` for model selection
4. ❌ **NEVER** hardcode AI model strings in handlers
5. ❌ **NEVER** create duplicate utility functions
6. ❌ **NEVER** define local model arrays like `FREE_MODELS`

## Need Help?

See complete documentation in [`AI_CONFIG_GUIDELINES.md`](./shared/AI_CONFIG_GUIDELINES.md) for:
- Detailed examples
- Common patterns
- How to add new AI features
- Complete API reference
- Best practices

---

**Maintained by**: Rareminds Engineering Team  
**Last Updated**: 2026-01-29
