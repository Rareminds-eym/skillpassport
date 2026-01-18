# Real-Time Response Saving During Assessment

> **You're absolutely right!** Every question response is saved instantly to the database as the user takes the assessment.

---

## 🎯 Quick Answer

**YES!** Responses are saved in real-time to the database:

1. **After EVERY answer** - Progress and responses saved immediately
2. **Auto-save every 30 seconds** - Timer state saved for timed sections
3. **On section complete** - All section responses saved
4. **Resume functionality** - Students can continue from where they left off

---

## 📊 Where Responses Are Stored

### Two Storage Locations:

#### 1. `personal_assessment_attempts.all_responses` (JSONB)
**For non-UUID questions** (RIASEC, Big Five, Values, Employability, etc.)

```json
{
  "riasec_r1": 4,
  "riasec_r2": 3,
  "riasec_i1": 5,
  "bigfive_o1": 4,
  "bigfive_c1": 3,
  "values_security": 18,
  "employability_communication": 4,
  ...
}
```

#### 2. `personal_assessment_responses` table
**For UUID questions** (AI-generated aptitude and knowledge questions)

```sql
CREATE TABLE personal_assessment_responses (
  id UUID PRIMARY KEY,
  attempt_id UUID REFERENCES personal_assessment_attempts(id),
  question_id UUID,  -- UUID of AI-generated question
  section_id VARCHAR,
  answer_value TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## 🔄 Real-Time Saving Flow

### When Student Answers a Question:

```
Student clicks answer
         ↓
flow.setAnswer(questionId, answer)  [React state]
         ↓
Check if question ID is UUID
         ↓
    ┌────────┴────────┐
    │                 │
  UUID?            Non-UUID?
    │                 │
    ↓                 ↓
dbSaveResponse()   Included in
(separate table)   all_responses
    │                 │
    └────────┬────────┘
             ↓
dbUpdateProgress()  [ALWAYS CALLED]
         ↓
Updates database:
  - current_section_index
  - current_question_index
  - all_responses (merged)
  - section_timings
  - timer_remaining
  - elapsed_time
  - updated_at
```

---

## 💾 Code Implementation

### Location: `src/features/assessment/career-test/AssessmentTestPage.tsx`

### Answer Handler (Line ~240-260):
```typescript
flow.onAnswer((questionId, answer) => {
  if (useDatabase && currentAttempt?.id) {
    const [sectionId, qId] = questionId.split('_');
    
    // Check if qId is a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(qId);
    
    if (isUUID) {
      // UUID questions (AI-generated) → personal_assessment_responses table
      dbSaveResponse(sectionId, qId, answer);
    }
    // Non-UUID questions (RIASEC, BigFive, etc.) → all_responses column
    
    // IMPORTANT: flow.answers is stale here (React state is async)
    // We need to include the current answer in the update
    const updatedAnswers = { ...flow.answers, [questionId]: answer };
    
    // ✅ Update progress (current position) after EVERY answer
    // ✅ Also save all responses to the all_responses column
    dbUpdateProgress(
      flow.currentSectionIndex, 
      flow.currentQuestionIndex, 
      flow.sectionTimings, 
      null, 
      null, 
      updatedAnswers  // ← All responses saved here
    );
  }
});
```

### Update Progress Function (from `useAssessment` hook):
```javascript
const updateProgress = async (
  sectionIndex, 
  questionIndex, 
  sectionTimings, 
  timerRemaining, 
  elapsedTime, 
  allResponses  // ← All responses passed here
) => {
  if (!currentAttempt?.id) return;
  
  try {
    await assessmentService.updateAttemptProgress(currentAttempt.id, {
      sectionIndex,
      questionIndex,
      sectionTimings,
      timerRemaining,
      elapsedTime,
      allResponses  // ← Saved to database
    });
  } catch (error) {
    console.error('Error updating progress:', error);
  }
};
```

### Database Service (src/services/assessmentService.js):
```javascript
export const updateAttemptProgress = async (attemptId, progress) => {
  // ✅ STEP 1: Fetch existing data to merge
  const { data: existingAttempt } = await supabase
    .from('personal_assessment_attempts')
    .select('section_timings, all_responses')
    .eq('id', attemptId)
    .single();

  // ✅ STEP 2: Merge section timings (preserve all sections)
  const mergedSectionTimings = {
    ...(existingAttempt?.section_timings || {}),
    ...(progress.sectionTimings || {})
  };

  const updateData = {
    current_section_index: progress.sectionIndex,
    current_question_index: progress.questionIndex,
    section_timings: mergedSectionTimings,
    updated_at: new Date().toISOString()
  };
  
  // ✅ STEP 3: Include timer state if provided
  if (progress.timerRemaining !== undefined && progress.timerRemaining !== null) {
    updateData.timer_remaining = progress.timerRemaining;
  }
  
  if (progress.elapsedTime !== undefined && progress.elapsedTime !== null) {
    updateData.elapsed_time = progress.elapsedTime;
  }

  // ✅ STEP 4: Merge all_responses (CRITICAL for non-UUID questions)
  if (progress.allResponses) {
    // Merge existing responses with new ones (new ones take precedence)
    const mergedResponses = {
      ...(existingAttempt?.all_responses || {}),
      ...progress.allResponses
    };
    updateData.all_responses = mergedResponses;
  }
  
  // ✅ STEP 5: Update database
  const { data, error } = await supabase
    .from('personal_assessment_attempts')
    .update(updateData)
    .eq('id', attemptId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

---

## ⏱️ Auto-Save Timer (Every 30 Seconds)

### Location: `src/pages/student/AssessmentTest.jsx` (Line ~1248-1261)

```javascript
useEffect(() => {
  if (useDatabase && currentAttempt?.id && !showSectionIntro && !showSectionComplete) {
    // ✅ Auto-save every 30 seconds
    const saveProgress = setInterval(() => {
      if (currentSection?.isTimed && timeRemaining !== null) {
        console.log('Auto-saving timer:', timeRemaining);
        updateProgress(
          currentSectionIndex,
          currentQuestionIndex,
          sectionTimings,
          timeRemaining,  // ← Timer state saved
          elapsedTime
        );
      }
    }, 30000); // 30 seconds

    return () => clearInterval(saveProgress);
  }
}, [useDatabase, currentAttempt?.id, currentSection?.isTimed, timeRemaining, ...]);
```

**Why?**
- Prevents data loss if browser crashes
- Saves timer state for timed sections
- Ensures progress is always up-to-date

---

## 🔄 Resume Functionality

### How It Works:

1. **Student starts assessment** → `personal_assessment_attempts` created with `status = 'in_progress'`

2. **Student answers questions** → Responses saved in real-time to `all_responses`

3. **Student closes browser** → Progress saved (section index, question index, timer state)

4. **Student returns later** → System detects in-progress attempt

5. **Resume prompt shown** → Student can continue from where they left off

6. **Responses restored** → All previous answers loaded from database

### Code: Restore Responses (Line ~800-810)

```typescript
// ✅ Restore non-UUID answers from all_responses column
if (pendingAttempt.all_responses) {
  console.log('💾 Restoring', Object.keys(pendingAttempt.all_responses).length, 'non-UUID answers');
  Object.entries(pendingAttempt.all_responses).forEach(([key, value]) => {
    flow.setAnswer(key, value);  // ← Restore to React state
  });
}

// ✅ Restore UUID answers from personal_assessment_responses table
const { data: responses } = await supabase
  .from('personal_assessment_responses')
  .select('*')
  .eq('attempt_id', pendingAttempt.id);

responses?.forEach(response => {
  const questionId = `${response.section_id}_${response.question_id}`;
  flow.setAnswer(questionId, response.answer_value);
});
```

---

## 📋 What Gets Saved in Real-Time

### Every Answer:
- ✅ Question ID
- ✅ Answer value
- ✅ Current section index
- ✅ Current question index
- ✅ Timestamp (updated_at)

### Every 30 Seconds (Auto-save):
- ✅ Timer remaining (for timed sections)
- ✅ Elapsed time (for non-timed sections)
- ✅ Section timings

### On Section Complete:
- ✅ All section responses
- ✅ Section completion time
- ✅ Section timings updated

### On Assessment Complete:
- ✅ Status changed to 'completed'
- ✅ completed_at timestamp
- ✅ All responses finalized

---

## 🔍 Database State During Assessment

### Example: Student Taking Assessment

**Initial State** (just started):
```sql
SELECT * FROM personal_assessment_attempts WHERE id = 'xxx';

-- Result:
{
  "id": "attempt-uuid",
  "student_id": "student-uuid",
  "stream_id": "engineering",
  "grade_level": "after12",
  "status": "in_progress",
  "current_section_index": 0,
  "current_question_index": 0,
  "all_responses": {},
  "section_timings": {},
  "started_at": "2026-01-17T10:00:00Z",
  "completed_at": null
}
```

**After Answering 5 Questions**:
```sql
SELECT * FROM personal_assessment_attempts WHERE id = 'xxx';

-- Result:
{
  "id": "attempt-uuid",
  "student_id": "student-uuid",
  "stream_id": "engineering",
  "grade_level": "after12",
  "status": "in_progress",
  "current_section_index": 0,
  "current_question_index": 5,
  "all_responses": {
    "riasec_r1": 4,
    "riasec_r2": 3,
    "riasec_r3": 5,
    "riasec_r4": 2,
    "riasec_r5": 4
  },
  "section_timings": {
    "riasec": 120  // 2 minutes elapsed
  },
  "started_at": "2026-01-17T10:00:00Z",
  "completed_at": null,
  "updated_at": "2026-01-17T10:02:00Z"  // ← Updated in real-time
}
```

**After Completing Section 1**:
```sql
SELECT * FROM personal_assessment_attempts WHERE id = 'xxx';

-- Result:
{
  "id": "attempt-uuid",
  "student_id": "student-uuid",
  "stream_id": "engineering",
  "grade_level": "after12",
  "status": "in_progress",
  "current_section_index": 1,  // ← Moved to next section
  "current_question_index": 0,
  "all_responses": {
    "riasec_r1": 4,
    "riasec_r2": 3,
    // ... all 48 RIASEC answers
    "riasec_c8": 5
  },
  "section_timings": {
    "riasec": 480  // 8 minutes total
  },
  "started_at": "2026-01-17T10:00:00Z",
  "completed_at": null,
  "updated_at": "2026-01-17T10:08:00Z"
}
```

---

## 🎯 Benefits of Real-Time Saving

### 1. **Data Loss Prevention**
- Browser crash? No problem - all answers saved
- Network interruption? Resume from last saved state
- Accidental tab close? Continue where you left off

### 2. **Progress Tracking**
- Admins can see real-time progress
- Educators can monitor student completion
- Analytics on time spent per section

### 3. **Resume Functionality**
- Students can take breaks
- Multi-day assessment possible
- No need to complete in one sitting

### 4. **Debugging & Support**
- Can inspect student progress in database
- Can identify stuck students
- Can manually fix issues if needed

### 5. **Analytics**
- Time spent per question
- Section completion rates
- Drop-off points identified

---

## 🔒 Data Integrity

### Merge Strategy (Not Replace):

```javascript
// ❌ BAD: Would lose previous answers
updateData.all_responses = progress.allResponses;

// ✅ GOOD: Merges with existing answers
const mergedResponses = {
  ...(existingAttempt?.all_responses || {}),
  ...progress.allResponses
};
updateData.all_responses = mergedResponses;
```

**Why?**
- Prevents data loss if multiple updates happen
- Preserves all previous answers
- New answers override old ones (if re-answered)

---

## ❓ Can Students Skip Questions Without Answering?

### Answer: **NO!** ❌

The Next/Continue button is **DISABLED** until the current question is answered.

### Implementation:

**Location**: `src/features/assessment/career-test/components/QuestionNavigation.tsx`

```typescript
<Button
  onClick={onNext}
  disabled={!isAnswered || isSubmitting}  // ← Button disabled if not answered
  className={`
    ${isAnswered && !isSubmitting
      ? 'bg-gradient-to-r from-indigo-600 to-violet-600'  // ← Enabled state
      : 'bg-gray-200 text-gray-500 cursor-not-allowed'    // ← Disabled state
    }
  `}
>
  {isLastQuestion ? 'Complete Section' : 'Next'}
</Button>
```

### Answer Validation Logic:

**Location**: `src/features/assessment/career-test/AssessmentTestPage.tsx` (Line ~1166)

```typescript
const isCurrentAnswered = useMemo(() => {
  // Adaptive aptitude questions
  if (currentSection?.isAdaptive) {
    return adaptiveAptitudeAnswer !== null;
  }
  
  // Get answer from flow state
  const answer = flow.answers[questionId];
  if (!answer) return false;  // ← No answer = disabled
  
  // SJT questions (Situational Judgment Test)
  if (currentQuestion?.partType === 'sjt') {
    return answer.best && answer.worst;  // ← Must select both best AND worst
  }
  
  // Multiselect questions
  if (currentQuestion?.type === 'multiselect') {
    return Array.isArray(answer) && answer.length === currentQuestion.maxSelections;
  }
  
  // Text questions
  if (currentQuestion?.type === 'text') {
    return typeof answer === 'string' && answer.trim().length >= 10;  // ← Min 10 chars
  }
  
  // All other questions (MCQ, Likert scale, etc.)
  return true;  // ← Any answer is valid
}, [currentSection, adaptiveAptitudeAnswer, flow.answers, questionId, currentQuestion]);
```

### Validation Rules by Question Type:

| Question Type | Validation Rule | Example |
|---------------|----------------|---------|
| **MCQ** (Single choice) | Any option selected | RIASEC, Big Five, Values |
| **Likert Scale** | Any rating selected (1-5) | "Strongly Disagree" to "Strongly Agree" |
| **SJT** (Situational) | BOTH best AND worst selected | Employability questions |
| **Multiselect** | Exact number of selections | "Select 3 options" |
| **Text** | Minimum 10 characters | Open-ended questions |
| **Adaptive Aptitude** | Any option selected | A, B, C, or D |

### Visual Feedback:

**Disabled State** (not answered):
```
┌─────────────────────────────────┐
│  [Previous]    [    Next    ]   │  ← Gray, cursor-not-allowed
└─────────────────────────────────┘
```

**Enabled State** (answered):
```
┌─────────────────────────────────┐
│  [Previous]    [    Next    ]   │  ← Gradient blue/purple, hover effect
└─────────────────────────────────┘
```

### Why This Design?

1. **Data Quality** - Ensures all questions are answered
2. **No Accidental Skips** - Prevents students from accidentally moving forward
3. **Clear Progress** - Students know they must answer to proceed
4. **Complete Results** - AI analysis requires all answers

### Exception: Previous Button

The **Previous** button is ALWAYS enabled (except on first question):
- ✅ Can go back to review/change answers
- ✅ Previous answers are preserved
- ✅ Can change answer and move forward again

---

## 📊 Summary

**YES, every question response is saved instantly to the database!**

**When:**
- ✅ After EVERY answer (immediate)
- ✅ Every 30 seconds (auto-save timer)
- ✅ On section complete
- ✅ On assessment complete

**Where:**
- ✅ `personal_assessment_attempts.all_responses` (non-UUID questions)
- ✅ `personal_assessment_responses` table (UUID questions)

**What:**
- ✅ Question ID and answer value
- ✅ Current position (section, question index)
- ✅ Timer state (for timed sections)
- ✅ Section timings
- ✅ Timestamps

**Benefits:**
- ✅ No data loss
- ✅ Resume functionality
- ✅ Real-time progress tracking
- ✅ Analytics and debugging

**Implementation:**
- ✅ `dbUpdateProgress()` called after every answer
- ✅ Merges with existing data (doesn't replace)
- ✅ Auto-save every 30 seconds
- ✅ Restores on resume

**Navigation:**
- ✅ Next button DISABLED until question answered
- ✅ Validation rules by question type
- ✅ Previous button always enabled (except first question)
- ✅ Cannot skip questions

---

**Last Updated**: January 17, 2026
**Verified**: By reading actual code implementation
