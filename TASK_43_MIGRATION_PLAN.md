# Task 43: Analyze Assessment API Migration Plan

## Overview

Task 43 involves migrating the `analyze-assessment-api` standalone worker to a Pages Function. This is a **large migration** with significant complexity.

---

## Source Code Analysis

### Source Location
`cloudflare-workers/analyze-assessment-api/src/`

### File Structure
```
analyze-assessment-api/src/
├── index.ts (main entry point)
├── handlers/
│   ├── analyzeHandler.ts (main analysis handler)
│   ├── healthHandler.ts (health check)
│   └── generateProgramCareerPaths.ts (program career paths)
├── prompts/
│   ├── index.ts (prompt builder router)
│   ├── middleSchool.ts (~200 lines)
│   ├── highSchool.ts (~200 lines)
│   ├── higherSecondary.ts (~200 lines)
│   ├── after12.ts (~200 lines)
│   ├── college.ts (~200 lines)
│   └── programCareerPaths.ts (~250 lines)
├── services/
│   └── openRouterService.ts (AI service)
├── types/
│   └── index.ts (TypeScript interfaces)
└── utils/
    ├── auth.ts (authentication)
    ├── cors.ts (CORS headers)
    ├── hash.ts (answer hashing)
    ├── jsonParser.ts (JSON extraction)
    └── rateLimit.ts (rate limiting)
```

**Total Lines:** ~1500+ lines of code

---

## Migration Complexity

### High Complexity Items

1. **Prompt Builders** (~1000 lines total)
   - 5 different grade-level prompts
   - Each 150-250 lines
   - Complex logic for different assessment types
   - Need to be extracted to separate files

2. **Type Definitions** (~150 lines)
   - Multiple interfaces for assessment data
   - RIASEC, aptitude, personality types
   - Need to be migrated or reused

3. **AI Service Integration**
   - Uses OpenRouter with Claude fallback
   - JSON parsing and repair
   - Error handling

4. **Authentication & Rate Limiting**
   - JWT authentication
   - Per-user rate limiting
   - Development mode bypass

---

## Migration Strategy

### Option 1: Full Migration (Recommended for Production)

**Pros:**
- Complete feature parity
- All grade levels supported
- Proper code organization

**Cons:**
- Time-consuming (~2-3 hours)
- Many files to create
- Complex testing required

**Files to Create:**
```
functions/api/analyze-assessment/
├── [[path]].ts ✅ CREATED
├── handlers/
│   └── analyze.ts
├── prompts/
│   ├── index.ts
│   ├── middle-school.ts
│   ├── high-school.ts
│   ├── higher-secondary.ts
│   ├── after12.ts
│   └── college.ts
├── types/
│   └── index.ts
└── utils/
    ├── prompt-builder.ts
    └── scoring.ts
```

### Option 2: Minimal Migration (Quick Implementation)

**Pros:**
- Faster implementation (~30 minutes)
- Core functionality working
- Can enhance later

**Cons:**
- May not support all grade levels initially
- Simplified prompts
- Less comprehensive

**Approach:**
- Create single unified prompt
- Support most common grade level (after12/college)
- Use shared utilities for AI calls
- Add other grade levels incrementally

---

## Key Changes from Original

### 1. Use Shared Utilities ✅
```typescript
// OLD (standalone worker)
import { callOpenRouter } from './services/openRouterService';

// NEW (Pages Function)
import { callAIWithFallback } from '../../shared/ai-config';
```

### 2. Use Shared Authentication ✅
```typescript
// OLD
import { authenticateUser } from './utils/auth';

// NEW
import { authenticateUser } from '../../shared/auth';
```

### 3. Use Shared Rate Limiting ✅
```typescript
// OLD
import { checkRateLimit } from './utils/rateLimit';

// NEW
import { checkRateLimit } from '../../career/utils/rate-limit';
```

### 4. Use Shared JSON Parsing ✅
```typescript
// OLD
import { extractJsonFromResponse } from './utils/jsonParser';

// NEW
import { repairAndParseJSON } from '../../shared/ai-config';
```

---

## Implementation Steps

### Phase 1: Core Structure (30 min)
1. ✅ Create router (`[[path]].ts`)
2. Create main handler (`handlers/analyze.ts`)
3. Create type definitions (`types/index.ts`)
4. Test basic endpoint

### Phase 2: Prompt System (60 min)
5. Create prompt builder utility (`utils/prompt-builder.ts`)
6. Migrate grade-level prompts to `prompts/` directory
7. Implement prompt selection logic
8. Test with sample data

### Phase 3: AI Integration (30 min)
9. Integrate `callAIWithFallback` from shared utilities
10. Implement JSON parsing and repair
11. Add error handling
12. Test AI responses

### Phase 4: Testing & Validation (30 min)
13. Test with real assessment data
14. Verify all grade levels work
15. Check Claude → OpenRouter fallback
16. Performance testing

---

## Current Status

### Completed ✅
- [x] Router created (`functions/api/analyze-assessment/[[path]].ts`)
- [x] Health check endpoint
- [x] CORS handling
- [x] Error handling structure

### Remaining ⏳
- [ ] Main analyze handler
- [ ] Type definitions
- [ ] Prompt builders (5 files)
- [ ] Scoring logic
- [ ] Integration testing

---

## Recommendation

Given the complexity and size of this migration, I recommend:

### Approach A: Continue Full Migration Now
- I'll create all necessary files
- Complete implementation
- Full testing
- **Time:** ~2 hours
- **Result:** Production-ready

### Approach B: Minimal Implementation First
- Create simplified version
- Support one grade level
- Get it working quickly
- Enhance incrementally
- **Time:** ~30 minutes
- **Result:** MVP working

### Approach C: Pause and Resume Later
- Save current progress
- Complete Tasks 44-45 with existing career API
- Return to Task 43 in a separate session
- **Time:** Resume later
- **Result:** Other tasks complete first

---

## Decision Point

**Which approach would you like me to take?**

1. **Full Migration** - Complete everything now (~2 hours)
2. **Minimal MVP** - Get basic version working (~30 min)
3. **Pause & Resume** - Do Tasks 44-45 first, come back to 43

Please let me know your preference, and I'll proceed accordingly!
