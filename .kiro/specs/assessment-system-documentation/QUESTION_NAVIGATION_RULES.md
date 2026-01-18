# Question Navigation Rules

> **Can students skip questions? NO! The Next button is disabled until answered.**

---

## 🎯 Quick Answer

**Students CANNOT skip questions without answering them.**

The Next/Continue button is **DISABLED** until the current question is answered according to validation rules.

---

## 🚦 Navigation Button States

### Next Button

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Question: What is your favorite activity?      │
│                                                 │
│  ○ Option A                                     │
│  ○ Option B                                     │
│  ○ Option C                                     │
│  ○ Option D                                     │
│                                                 │
│  [Previous]              [    Next    ]  ← GRAY │
│                          (DISABLED)             │
└─────────────────────────────────────────────────┘

After selecting an answer:

┌─────────────────────────────────────────────────┐
│                                                 │
│  Question: What is your favorite activity?      │
│                                                 │
│  ○ Option A                                     │
│  ● Option B  ← SELECTED                         │
│  ○ Option C                                     │
│  ○ Option D                                     │
│                                                 │
│  [Previous]              [    Next    ]  ← BLUE │
│                          (ENABLED)              │
└─────────────────────────────────────────────────┘
```

### Previous Button

**Always enabled** (except on first question):
- ✅ Can go back to review answers
- ✅ Can change previous answers
- ✅ Previous answers are preserved

---

## ✅ Validation Rules by Question Type

### 1. Multiple Choice (MCQ)
**Rule**: Any option selected

```typescript
// Example: RIASEC, Big Five, Work Values
return answer !== undefined && answer !== null;
```

**Visual**:
```
○ Strongly Disagree
○ Disagree
● Neutral          ← Selected = Valid
○ Agree
○ Strongly Agree

Next button: ENABLED ✅
```

---

### 2. Likert Scale (1-5)
**Rule**: Any rating selected

```typescript
// Example: "I enjoy working with my hands"
return answer >= 1 && answer <= 5;
```

**Visual**:
```
1 ○──○──●──○──○ 5
      ↑
   Selected = Valid

Next button: ENABLED ✅
```

---

### 3. SJT (Situational Judgment Test)
**Rule**: BOTH best AND worst must be selected

```typescript
// Example: Employability questions
return answer.best && answer.worst;
```

**Visual**:
```
Scenario: Your team member is struggling...

What would you do?
☑ Best:  A. Offer to help them
☐ Worst: B. Ignore the situation
☐ Worst: C. Report to manager
☐ Worst: D. Do their work for them

Next button: DISABLED ❌ (need to select worst too)

After selecting both:
☑ Best:  A. Offer to help them
☐ Worst: B. Ignore the situation
☑ Worst: C. Report to manager
☐ Worst: D. Do their work for them

Next button: ENABLED ✅
```

---

### 4. Multiselect
**Rule**: Exact number of selections required

```typescript
// Example: "Select 3 skills you want to develop"
return Array.isArray(answer) && answer.length === currentQuestion.maxSelections;
```

**Visual**:
```
Select 3 skills:
☑ Programming
☑ Communication
☐ Leadership
☐ Design
☐ Marketing

Selected: 2/3
Next button: DISABLED ❌

After selecting 3:
☑ Programming
☑ Communication
☑ Leadership
☐ Design
☐ Marketing

Selected: 3/3
Next button: ENABLED ✅
```

---

### 5. Text Input
**Rule**: Minimum 10 characters

```typescript
// Example: "Describe your career goals"
return typeof answer === 'string' && answer.trim().length >= 10;
```

**Visual**:
```
Describe your career goals:
┌─────────────────────────────────────┐
│ I want to                           │
│                                     │
└─────────────────────────────────────┘
Characters: 10/10 minimum
Next button: DISABLED ❌

After typing more:
┌─────────────────────────────────────┐
│ I want to become a software         │
│ engineer and work on AI projects    │
└─────────────────────────────────────┘
Characters: 62/10 minimum
Next button: ENABLED ✅
```

---

### 6. Adaptive Aptitude (MCQ with Timer)
**Rule**: Any option selected

```typescript
// Example: Numerical reasoning questions
return adaptiveAptitudeAnswer !== null;
```

**Visual**:
```
Time: 01:25 remaining

Question: What is 15% of 240?

○ A. 30
○ B. 36
○ C. 40
○ D. 45

Next button: DISABLED ❌

After selecting:
○ A. 30
● B. 36  ← Selected
○ C. 40
○ D. 45

Next button: ENABLED ✅
```

---

## 🔄 Complete Navigation Flow

```
Student views question
         ↓
Next button is DISABLED (gray)
         ↓
Student selects answer
         ↓
Answer validated (type-specific rules)
         ↓
    Valid?
    ┌──┴──┐
   NO    YES
    │     │
    ↓     ↓
 Stay   Next button ENABLED (blue gradient)
         ↓
Student clicks Next
         ↓
Answer saved to database (dbUpdateProgress)
         ↓
Move to next question
         ↓
Next button DISABLED again (for new question)
```

---

## 💾 What Happens When Answer Is Selected

### Immediate Actions:

1. **React State Updated**
   ```typescript
   flow.setAnswer(questionId, answer);
   ```

2. **Validation Check**
   ```typescript
   isCurrentAnswered = validateAnswer(answer, questionType);
   ```

3. **Button State Updated**
   ```typescript
   <Button disabled={!isCurrentAnswered} />
   ```

4. **Database Save Triggered**
   ```typescript
   dbUpdateProgress(sectionIndex, questionIndex, allResponses);
   ```

5. **Visual Feedback**
   - Button changes from gray to blue gradient
   - Hover effect enabled
   - Cursor changes from not-allowed to pointer

---

## 🎨 Visual States

### Disabled State (Not Answered)
```css
background: gray-200
color: gray-500
cursor: not-allowed
opacity: 50%
hover: none
```

**Appearance**:
```
┌──────────────┐
│     Next     │  ← Gray, no hover effect
└──────────────┘
```

### Enabled State (Answered)
```css
background: gradient(indigo-600 → violet-600)
color: white
cursor: pointer
shadow: indigo-500/30
hover: scale(1.02) + shadow-xl
```

**Appearance**:
```
┌──────────────┐
│     Next     │  ← Blue/purple gradient, glowing shadow
└──────────────┘
     ↑ Hover effect
```

---

## 🚫 What Students CANNOT Do

❌ Skip questions without answering
❌ Move forward with incomplete answers
❌ Submit section with unanswered questions
❌ Bypass validation rules

---

## ✅ What Students CAN Do

✅ Go back to previous questions (Previous button)
✅ Change previous answers
✅ Review all questions in section
✅ Take breaks (progress auto-saved)
✅ Resume later (all answers preserved)

---

## 🔍 Code Implementation

### Button Component
**Location**: `src/features/assessment/career-test/components/QuestionNavigation.tsx`

```typescript
<Button
  onClick={onNext}
  disabled={!isAnswered || isSubmitting}  // ← Key validation
  className={`
    ${isAnswered && !isSubmitting
      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'
      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
    }
  `}
>
  {isLastQuestion ? 'Complete Section' : 'Next'}
</Button>
```

### Validation Logic
**Location**: `src/features/assessment/career-test/AssessmentTestPage.tsx`

```typescript
const isCurrentAnswered = useMemo(() => {
  if (currentSection?.isAdaptive) {
    return adaptiveAptitudeAnswer !== null;
  }
  
  const answer = flow.answers[questionId];
  if (!answer) return false;
  
  // Type-specific validation
  if (currentQuestion?.partType === 'sjt') {
    return answer.best && answer.worst;
  }
  if (currentQuestion?.type === 'multiselect') {
    return Array.isArray(answer) && answer.length === currentQuestion.maxSelections;
  }
  if (currentQuestion?.type === 'text') {
    return typeof answer === 'string' && answer.trim().length >= 10;
  }
  
  return true;
}, [currentSection, adaptiveAptitudeAnswer, flow.answers, questionId, currentQuestion]);
```

### Usage in Component
```typescript
<QuestionNavigation
  onPrevious={flow.goToPreviousQuestion}
  onNext={handleNextQuestion}
  canGoPrevious={flow.currentQuestionIndex > 0}
  canGoNext={isCurrentAnswered}
  isAnswered={isCurrentAnswered}  // ← Controls button state
  isLastQuestion={flow.isLastQuestion}
/>
```

---

## 📊 Summary Table

| Action | Allowed? | Condition |
|--------|----------|-----------|
| Click Next without answering | ❌ NO | Button disabled |
| Click Next after answering | ✅ YES | Button enabled |
| Click Previous | ✅ YES | Always (except first question) |
| Change previous answer | ✅ YES | Always |
| Skip entire section | ❌ NO | Must answer all questions |
| Take break mid-section | ✅ YES | Progress auto-saved |
| Resume later | ✅ YES | All answers restored |

---

## 🎯 Design Rationale

### Why Disable Next Button?

1. **Data Quality** - Ensures complete responses for AI analysis
2. **User Intent** - Prevents accidental skips
3. **Clear Feedback** - Visual indication of required action
4. **Complete Results** - AI needs all answers for accurate recommendations

### Why Allow Previous?

1. **Review Capability** - Students can check their answers
2. **Error Correction** - Can fix mistakes
3. **Confidence Building** - Reduces anxiety about wrong answers
4. **Better UX** - Feels less restrictive

---

**Last Updated**: January 17, 2026
**Verified**: By reading actual code implementation
