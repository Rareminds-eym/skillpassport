# Assessment Duplicate Questions Fix

## Problems Identified

### 1. **Duplicate Question Generation (Primary Issue)**
The adaptive aptitude assessment was generating duplicate questions repeatedly during the test, causing:
- Multiple retry attempts with the same question text
- Poor user experience with repeated questions
- Exhausted retry logic allowing duplicates through

**Root Causes:**
- AI model not properly respecting exclusion lists
- Weak duplicate detection (only checking exact ID matches, not text similarity)
- Only 1 retry attempt before allowing duplicates
- Insufficient context in AI prompts about what to avoid
- `generateSingleQuestion` missing `excludeQuestionTexts` parameter (critical for retries)

### 2. **Unimplemented Stability Confirmation Endpoint (501 Error)**
The `/api/question-generation/generate/stability` endpoint was returning a hardcoded 501 "Not Implemented" error, even though the handler function was fully implemented.

**Root Cause:**
- Router in `functions/api/question-generation/[[path]].ts` had a hardcoded 501 response instead of calling the actual handler

## Fixes Applied

### Fix 1: Enable Stability Confirmation Endpoint
**File:** `functions/api/question-generation/[[path]].ts`

Changed from:
```typescript
if (path === '/generate/stability' && request.method === 'POST') {
  return jsonResponse(
    {
      error: 'Not implemented',
      message: 'Stability confirmation generation not yet implemented.',
    },
    501
  );
}
```

To:
```typescript
if (path === '/generate/stability' && request.method === 'POST') {
  try {
    const body = await request.json() as any;
    const { gradeLevel, provisionalBand, count, excludeQuestionIds, excludeQuestionTexts } = body;
    const result = await generateStabilityConfirmationQuestions(env, gradeLevel, provisionalBand, count, excludeQuestionIds, excludeQuestionTexts);
    return jsonResponse(result);
  } catch (error: any) {
    console.error('❌ Stability generation error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}
```

### Fix 2: Improved AI Prompt with Better Exclusion Context
**File:** `functions/api/question-generation/handlers/adaptive.ts`

Enhanced the AI prompt to:
- Show up to 20 excluded question texts (instead of 10)
- Format them as a numbered list for clarity
- Add CRITICAL markers to emphasize uniqueness requirements
- Provide truncated previews of excluded questions

```typescript
const excludeTextsArray = Array.from(excludeTexts);
const userPrompt = `Generate EXACTLY ${count} unique aptitude questions.

Requirements:
- Difficulty Level: ${difficulty} (Scale 1-5)
- Subtags to cover: ${subtags.join(', ')}
- Ensure questions are evenly distributed among these subtags.
- CRITICAL: Each question MUST have completely different text from all others.
- CRITICAL: Do NOT generate questions similar to these already used questions:
${excludeTextsArray.length > 0 ? excludeTextsArray.slice(0, 20).map((t, i) => `  ${i + 1}. "${t.substring(0, 100)}..."`).join('\n') : '  (No exclusions)'}

Output ONLY valid JSON array with unique questions.`;
```

### Fix 3: Added Similarity-Based Duplicate Detection
**File:** `functions/api/question-generation/handlers/adaptive.ts`

Added Levenshtein distance calculation to detect similar questions (not just exact matches):

```typescript
function calculateSimilarity(str1: string, str2: string): number {
    // Returns 0-1, where 1 is identical
    // Uses Levenshtein distance algorithm
}

function levenshteinDistance(str1: string, str2: string): number {
    // Calculates edit distance between strings
}
```

Filter AI-generated questions before returning:
```typescript
const filteredQuestions = aiQuestionsRaw.filter((q: any) => {
    const questionText = q.text?.toLowerCase().trim();
    
    for (const excludedText of excludeTexts) {
        const excluded = excludedText.toLowerCase().trim();
        
        // Exact match check
        if (questionText === excluded) {
            console.warn(`⚠️ AI generated duplicate question (exact match)`);
            return false;
        }
        
        // Similarity check (>90% similar = duplicate)
        const similarity = calculateSimilarity(questionText, excluded);
        if (similarity > 0.9) {
            console.warn(`⚠️ AI generated very similar question (${(similarity * 100).toFixed(0)}% match)`);
            return false;
        }
    }
    return true;
});
```

### Fix 4: Increased Retry Attempts
**File:** `src/services/adaptiveAptitudeService.ts`

Changed from 1 retry to 3 retries:
```typescript
const maxRetries = 3; // Increased from 1 to 3
```

Improved retry loop to:
- Continue retrying while duplicates are detected AND retries remain
- Add better logging for each retry attempt
- Only allow duplicates after all 3 retries are exhausted

### Fix 5: Fixed generateSingleQuestion Missing Parameter (CRITICAL)
**Files:** 
- `functions/api/question-generation/handlers/adaptive.ts`
- `functions/api/question-generation/[[path]].ts`

Added missing `excludeQuestionTexts` parameter to `generateSingleQuestion`:

```typescript
export async function generateSingleQuestion(
    env: PagesEnv,
    gradeLevel: GradeLevel,
    phase: string,
    difficulty: DifficultyLevel,
    subtag: Subtag,
    excludeQuestionIds: string[] = [],
    excludeQuestionTexts: string[] = []  // ← ADDED THIS
): Promise<QuestionGenerationResult> {
    const result = await generateQuestionsWithAI(
        env,
        gradeLevel,
        phase,
        [subtag],
        difficulty,
        1,
        new Set(excludeQuestionTexts)  // ← NOW PASSING EXCLUSIONS
    );
    // ...
}
```

This was critical because `generateSingleQuestion` is called during retry attempts, and without passing exclusions, retries would generate the same duplicates.

### Fix 6: Removed Unused Import
**File:** `functions/api/question-generation/handlers/adaptive.ts`

Removed unused `delay` import to clean up code.

## Expected Behavior After Fixes

1. **Stability Confirmation Phase Works**
   - Test will now properly transition to stability confirmation phase
   - No more 501 errors when reaching this phase

2. **Significantly Fewer Duplicate Questions**
   - AI receives better context about what to avoid (20 examples vs 10)
   - Similarity detection catches near-duplicates (>90% similar)
   - 3 retry attempts give more chances to generate unique questions
   - **Retries now properly pass exclusion texts** (was broken before)

3. **Better Logging**
   - Clear indication when duplicates are detected
   - Similarity percentage shown for near-duplicates
   - Retry attempt numbers logged
   - Filtering results logged

4. **Graceful Degradation**
   - After 3 retries, system still allows duplicate to avoid blocking test
   - Failure is logged for monitoring
   - User can complete test even if AI struggles with uniqueness

## Testing Recommendations

1. **Test Stability Phase**
   - Complete a full assessment to reach stability confirmation
   - Verify no 501 errors occur
   - Check that questions are generated properly

2. **Monitor Duplicate Rate**
   - Check console logs for duplicate warnings
   - Count how many retries are needed
   - Verify similarity detection is working
   - **Should see significantly fewer duplicates now that retries work properly**

3. **Check AI Performance**
   - Monitor if AI respects the improved prompts
   - Check if 3 retries are sufficient
   - May need to adjust similarity threshold (currently 0.9)

## Potential Further Improvements

If duplicates still occur frequently:

1. **Increase similarity threshold** from 0.9 to 0.85 for stricter matching
2. **Add question caching** to database to reuse known-good questions
3. **Implement question templates** with variable substitution
4. **Add semantic similarity** using embeddings (more expensive but more accurate)
5. **Increase retry count** to 5 if 3 isn't sufficient
6. **Add question diversity scoring** to prefer more varied questions
7. **Implement exponential backoff** between retries to give AI more time

## Files Modified

1. `functions/api/question-generation/[[path]].ts` - Enabled stability endpoint, added excludeQuestionTexts to single question route
2. `functions/api/question-generation/handlers/adaptive.ts` - Improved AI prompts, added similarity detection, fixed generateSingleQuestion signature, removed unused import
3. `src/services/adaptiveAptitudeService.ts` - Increased retry count and improved retry logic

## Deployment Notes

- No database migrations required
- No environment variable changes needed
- Changes are backward compatible
- Redeploy Cloudflare Pages Functions to apply fixes
- **Critical fix**: Retries will now actually work properly with exclusions
