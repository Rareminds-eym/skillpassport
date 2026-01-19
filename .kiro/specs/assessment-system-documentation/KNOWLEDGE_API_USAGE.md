# Knowledge API Usage - Which Sections Use It?

## Overview

The **Knowledge API** is used to generate AI-powered, stream-specific knowledge questions for certain grade levels. This document explains which sections use it and why.

---

## Which Grade Levels Use Knowledge API?

Based on `src/features/assessment/career-test/config/sections.ts`:

### ✅ Grade Levels WITH Knowledge Section

1. **Higher Secondary (Grades 11-12)** - `higher_secondary`
2. **After 12th** - `after12`
3. **College (UG/PG)** - `college`

These grade levels use the **COMPREHENSIVE_SECTIONS** configuration which includes:
- RIASEC (Career Interests)
- Big Five Personality
- Work Values
- Employability Skills
- **Aptitude** (AI-generated)
- **Knowledge** (AI-generated, stream-specific) ← **USES KNOWLEDGE API**

**Note**: Although the code currently includes `after10` in `COMPREHENSIVE_SECTIONS`, **after10 students do NOT need the knowledge section** in practice. They use a stream-agnostic assessment where the AI recommends the best stream based on their results.

### ❌ Grade Levels WITHOUT Knowledge Section

1. **Middle School (Grades 6-8)** - `middle`
   - Uses: Interest Explorer, Strengths & Character, Learning Preferences, Adaptive Aptitude
   - NO knowledge section

2. **High School (Grades 9-10)** - `highschool`
   - Uses: Interest Explorer, Strengths & Character, Learning Preferences, Aptitude Sampling, Adaptive Aptitude
   - NO knowledge section

3. **After 10th** - `after10`
   - Uses: RIASEC, Big Five, Values, Employability, Aptitude (AI-generated)
   - NO knowledge section (uses stream-agnostic assessment with AI stream recommendation)

---

## Knowledge Section Configuration

From `COMPREHENSIVE_SECTIONS`:

```javascript
{
  id: 'knowledge',
  title: 'Stream Knowledge',
  description: "Test your understanding of core concepts in your field.",
  color: "blue",
  isTimed: true,
  timeLimit: 30 * 60, // 30 minutes
  instruction: "Choose the best answer for each question."
}
```

**Key Properties:**
- **Stream-specific**: Questions are generated based on student's stream (Science/Commerce/Arts/Engineering/etc.)
- **Timed**: 30-minute time limit
- **AI-generated**: Questions come from Cloudflare Worker API, not hardcoded

---

## Why Knowledge API is Called During Resume

When a student **resumes an assessment**, the system needs to restore the exact same questions they were answering before. Here's why:

### Problem Without API Call
If we don't fetch the questions again:
- ❌ Student sees different questions than before
- ❌ Their saved answers don't match the new questions
- ❌ Progress is lost
- ❌ Assessment integrity is compromised

### Solution: Fetch Questions on Resume
The `fetchAIKnowledgeQuestions()` function:
1. Takes the student's **answer keys** (question IDs from saved responses)
2. Queries the database to find the **exact same questions** they were answering
3. Restores the questions in the **same order**
4. Matches saved answers to the correct questions

### Code Location
**File**: `src/features/assessment/assessment-result/hooks/useAssessmentResults.js`

```javascript
// When retrying/resuming, fetch the exact questions student was answering
if (knowledgeAnswerKeys.length > 0) {
  console.log('📡 Fetching AI knowledge questions for retry...');
  const aiKnowledgeQuestions = await fetchAIKnowledgeQuestions(user.id, knowledgeAnswerKeys);
  
  if (aiKnowledgeQuestions.length > 0) {
    questionBanks.streamKnowledgeQuestions = { [stream]: aiKnowledgeQuestions };
  }
}
```

---

## How Knowledge Questions Are Generated

### Initial Generation (First Time)
**File**: `src/features/assessment/career-test/hooks/useAIQuestions.ts`

1. Student selects their grade level and stream
2. `useAIQuestions` hook detects they need AI questions
3. Calls Cloudflare Worker API: `/api/generate-assessment-questions`
4. Worker generates questions using AI based on:
   - Grade level
   - Stream (Science/Commerce/Arts/etc.)
   - Difficulty level
5. Questions are saved to database: `personal_assessment_questions` table
6. Questions are linked to the student's attempt

### Resume/Retry (Subsequent Times)
**File**: `src/features/assessment/assessment-result/hooks/useAssessmentResults.js`

1. System detects student has in-progress attempt
2. Loads saved responses from database
3. Extracts question IDs from saved answers
4. Calls `fetchAIKnowledgeQuestions(userId, questionIds)`
5. Database returns the **exact same questions** by ID
6. Questions are restored in the assessment UI

---

## Database Tables Involved

### 1. `personal_assessment_questions`
Stores AI-generated questions:
```sql
- id (UUID)
- student_id (references students table)
- section_id (e.g., 'knowledge', 'aptitude')
- question_text
- options (JSONB array)
- correct_answer
- difficulty_level
- stream_id
- created_at
```

### 2. `personal_assessment_responses`
Stores student answers to AI questions:
```sql
- id (UUID)
- attempt_id (references personal_assessment_attempts)
- question_id (references personal_assessment_questions)
- section_id
- answer_value (student's selected answer)
- is_correct (boolean)
- time_spent (seconds)
- created_at
```

### 3. `personal_assessment_attempts`
Stores overall attempt state:
```sql
- id (UUID)
- student_id
- grade_level
- stream_id
- status ('in_progress', 'completed', 'abandoned')
- all_responses (JSONB - includes non-UUID questions like RIASEC)
- current_section_index
- current_question_index
- elapsed_time
- timer_remaining
- section_timings (JSONB)
```

---

## Console Messages You'll See

When knowledge API is called, you'll see these logs:

### During Resume:
```
🔄 Restoring session timings
💾 Using saved aptitude
📡 Fetching AI knowledge questions for retry...
✅ Loaded 15 knowledge questions from database
```

### During Initial Generation:
```
🤖 Generating AI questions for grade: after12, stream: science
📡 Calling Cloudflare Worker API...
✅ Generated 15 aptitude questions
✅ Generated 15 knowledge questions
💾 Saved questions to database
```

---

## Summary

| Grade Level | Has Knowledge Section? | Uses Knowledge API? | Stream-Specific? |
|-------------|------------------------|---------------------|------------------|
| Middle (6-8) | ❌ No | ❌ No | N/A |
| High School (9-10) | ❌ No | ❌ No | N/A |
| After 10th | ❌ No | ❌ No | Stream-agnostic (AI recommends stream) |
| Higher Secondary (11-12) | ✅ Yes | ✅ Yes | ✅ Yes |
| After 12th | ✅ Yes | ✅ Yes | ✅ Yes |
| College (UG/PG) | ✅ Yes | ✅ Yes | ✅ Yes |

**Key Takeaway**: Knowledge API is ONLY used for students who have **already chosen their stream** (higher secondary, after 12th, and college). After 10th students use a stream-agnostic assessment where the AI recommends the best stream based on their interests and aptitudes.

---

## Related Documentation

- [WHERE_AI_GENERATES_QUESTIONS.md](./WHERE_AI_GENERATES_QUESTIONS.md) - Complete AI question generation flow
- [WHERE_RESULTS_ARE_STORED.md](./WHERE_RESULTS_ARE_STORED.md) - Database storage details
- [REAL_TIME_RESPONSE_SAVING.md](./REAL_TIME_RESPONSE_SAVING.md) - How answers are saved in real-time
- [DATABASE_SCHEMA_COMPLETE.md](./DATABASE_SCHEMA_COMPLETE.md) - Complete database schema
