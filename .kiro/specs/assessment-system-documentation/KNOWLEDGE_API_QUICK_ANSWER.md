# Quick Answer: Why is Knowledge API Called?

## Your Question
> "why is it calling knowledge api? for which sections"

---

## Short Answer

The **Knowledge API is called for the "Stream Knowledge" section** in assessments for:
- ✅ **Higher Secondary (Grades 11-12)** - Students who have chosen their stream
- ✅ **After 12th** - Students who have chosen their stream
- ✅ **College (UG/PG)** - Students in specific programs

It's **NOT called** for:
- ❌ Middle School (Grades 6-8)
- ❌ High School (Grades 9-10)
- ❌ **After 10th** - Uses stream-agnostic assessment (AI recommends stream based on results)

---

## Why It's Called During Resume

When you saw the knowledge API being called, it was because the student was **resuming an in-progress assessment**.

The system needs to fetch the **exact same questions** the student was answering before, so:
1. Their saved answers match the correct questions
2. Progress is preserved
3. Assessment integrity is maintained

---

## What You Saw in Console

These messages are **SUCCESS logs** (not errors):
```
🔄 Restoring session timings
💾 Using saved aptitude
📡 Fetching AI knowledge questions for retry...
✅ Loaded 15 knowledge questions from database
```

The emoji prefixes (🔄, 💾, 📡, ✅) indicate **informational logs**, not errors.

---

## Technical Details

### Knowledge Section Configuration
- **Section ID**: `knowledge`
- **Title**: "Stream Knowledge"
- **Description**: "Test your understanding of core concepts in your field"
- **Time Limit**: 30 minutes
- **Question Type**: AI-generated, stream-specific (Science/Commerce/Arts/etc.)

### When API is Called

#### 1. Initial Assessment (First Time)
- Student selects grade level and stream
- Cloudflare Worker generates questions using AI
- Questions saved to `personal_assessment_questions` table
- Questions displayed to student

#### 2. Resume Assessment (Subsequent Times)
- System detects in-progress attempt
- Loads saved responses from database
- Extracts question IDs from saved answers
- Calls `fetchAIKnowledgeQuestions(userId, questionIds)`
- Database returns exact same questions by ID
- Questions restored in assessment UI

### Code Location
**File**: `src/features/assessment/assessment-result/hooks/useAssessmentResults.js`

```javascript
// Line ~858
if (knowledgeAnswerKeys.length > 0) {
  console.log('📡 Fetching AI knowledge questions for retry...');
  const aiKnowledgeQuestions = await fetchAIKnowledgeQuestions(user.id, knowledgeAnswerKeys);
  
  if (aiKnowledgeQuestions.length > 0) {
    questionBanks.streamKnowledgeQuestions = { [stream]: aiKnowledgeQuestions };
  }
}
```

---

## Summary Table

| Grade Level | Has Knowledge Section? | API Called? | When? |
|-------------|------------------------|-------------|-------|
| Middle (6-8) | ❌ No | ❌ No | Never |
| High School (9-10) | ❌ No | ❌ No | Never |
| After 10th | ❌ No | ❌ No | Never (stream-agnostic) |
| Higher Secondary (11-12) | ✅ Yes | ✅ Yes | Initial + Resume |
| After 12th | ✅ Yes | ✅ Yes | Initial + Resume |
| College (UG/PG) | ✅ Yes | ✅ Yes | Initial + Resume |

**Important**: After 10th students use a **stream-agnostic assessment** where the AI recommends the best stream based on their interests and aptitudes, rather than testing knowledge of a specific stream.

---

## Related Documentation

For complete details, see:
- **[KNOWLEDGE_API_USAGE.md](./KNOWLEDGE_API_USAGE.md)** - Full explanation with code examples
- **[WHERE_AI_GENERATES_QUESTIONS.md](./WHERE_AI_GENERATES_QUESTIONS.md)** - Complete AI question generation flow
- **[REAL_TIME_RESPONSE_SAVING.md](./REAL_TIME_RESPONSE_SAVING.md)** - How answers are saved for resume
