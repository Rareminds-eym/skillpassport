# Clerical Questions Display Fix

## Problem
In the assessment test at `/student/assessment/test`, clerical speed & accuracy questions were showing "Compare the two strings below:" but the actual strings to compare were not visible.

## Root Cause
The AI prompt for generating clerical questions was not explicit enough about including the actual strings in the question text. The AI was generating questions with generic text like "Compare the two strings below:" without embedding the actual strings to compare.

## Solution

### 1. Updated AI Prompt (`functions/api/question-generation/prompts.ts`)

**Added explicit instructions for clerical questions:**
```
6. For Clerical Speed & Accuracy: Generate string comparison questions using {{STREAM_NAME}}-specific codes/IDs like "{{CLERICAL_EXAMPLE}}"
   - CRITICAL: The question text MUST include BOTH strings to compare, formatted like this:
     "Compare these two strings:\n\nString 1: ENG-789-SYS\nString 2: ENG-789-SYS\n\nAre they the same or different?"
   - DO NOT just say "Compare the two strings below:" without showing the actual strings
   - Each clerical question must show two complete strings that are either identical or have subtle differences
```

**Added example clerical question in the output format:**
```json
{
  "id": 2,
  "category": "clerical",
  "type": "mcq",
  "difficulty": "easy",
  "question": "Compare these two strings:\n\nString 1: ENG-789-SYS\nString 2: ENG-789-SYS\n\nAre they the same or different?",
  "options": ["Same", "Different"],
  "correct_answer": "Same",
  "skill_tag": "clerical_speed",
  "estimated_time": 30
}
```

### 2. Updated Frontend Display (`src/pages/student/AssessmentTest.jsx`)

**Added `whitespace-pre-line` class to preserve newlines:**
```jsx
<h3 className="text-2xl md:text-3xl font-medium text-gray-800 leading-snug whitespace-pre-line">
    {currentQuestion?.text}
</h3>
```

This ensures that the `\n` newline characters in the question text are properly rendered, so the strings appear on separate lines for easy comparison.

## Expected Result

Clerical questions will now display like this:

```
Compare these two strings:

String 1: ENG-789-SYS
String 2: ENG-789-SYS

Are they the same or different?

Options:
○ Same
○ Different
```

## Testing

1. Start a new assessment or continue an existing one
2. Navigate to the Aptitude section
3. When you reach clerical questions (typically questions 41-60 in the aptitude section)
4. Verify that two strings are clearly visible for comparison
5. Verify that the strings use stream-specific codes (e.g., "ENG-789-SYS" for engineering, "MED-345-RX" for medical, etc.)

## Notes

- This fix applies to newly generated questions
- Existing saved questions in the database may still have the old format
- If you encounter old-format questions, you can:
  - Delete the saved questions from `career_assessment_ai_questions` table for that student
  - The system will regenerate questions with the new format
  - OR wait for the cache to expire (questions are cached per student/stream)

## Files Modified

1. `functions/api/question-generation/prompts.ts` - Updated APTITUDE_PROMPT with explicit clerical question instructions
2. `src/pages/student/AssessmentTest.jsx` - Added `whitespace-pre-line` class to question text display
3. `CLERICAL_QUESTIONS_FIX.md` - This documentation file
