# Certificate-Based Assessment Guide

## Overview
The assessment system now dynamically loads questions based on the certificate or course name, allowing different assessments for different certifications.

## How It Works

### 1. Navigation to Assessment
When navigating to the assessment, pass the certificate/course information:

```javascript
navigate('/student/assessment/platform', {
  state: {
    certificateName: 'JavaScript Fundamentals',
    courseId: 'js-101',
    certificateId: 'cert-123'
  }
});
```

### 2. Assessment Start Page
The `AssessmentStart.jsx` page now:
- Displays the certificate name in the header
- Passes certificate data to the test page
- Shows personalized welcome message

### 3. Dynamic Question Loading
The `AssessmentTestPage.tsx` loads questions based on:
1. **Certificate Name** (primary) - Matches certificate name to question sets
2. **Course ID** (fallback) - Uses course ID if certificate name doesn't match
3. **Default** (last resort) - Loads default questions if no match found

### 4. Question Matching Logic
The system matches certificate names to question sets:

```typescript
// Examples of automatic matching:
'Green Chemistry' → green-chemistry questions
'EV Battery Management' → ev-battery questions
'Food Analysis' → food-analysis questions
'Organic Food Production' → organic-food questions
```

## Adding New Certificate Questions

### Option 1: Add to Existing Question Files
Add questions to `src/data/assessment/questions/`:

```typescript
// src/data/assessment/questions/react-basics.ts
export const reactBasicsQuestions: Question[] = [
  {
    id: 1,
    text: 'What is React?',
    options: ['Library', 'Framework', 'Language', 'Database'],
    correctAnswer: 'Library',
    type: 'mcq'
  }
];
```

Then register in `index.ts`:
```typescript
import { reactBasicsQuestions } from './react-basics';

const questionsMap: Record<string, Question[]> = {
  'react-basics': reactBasicsQuestions,
  // ... other questions
};
```

### Option 2: Use Database (Recommended for Production)
Store questions in the `assessment_questions` table:

```sql
INSERT INTO assessment_questions (
  course_name,
  certificate_name,
  question_text,
  options,
  correct_answer,
  question_type,
  difficulty,
  enabled
) VALUES (
  'JavaScript Fundamentals',
  'JavaScript Developer Certificate',
  'What is a closure in JavaScript?',
  ARRAY['A function inside another function', 'A loop', 'A variable', 'An object'],
  'A function inside another function',
  'mcq',
  'medium',
  true
);
```

### Option 3: Use Fallback Service
The `certificateAssessmentService.js` provides fallback questions for common topics:
- JavaScript/Programming
- Python
- React
- Data Science
- Generic questions

## Usage Examples

### From Course Player
```javascript
// When student completes a course
<Button onClick={() => navigate('/student/assessment/platform', {
  state: {
    certificateName: course.title,
    courseId: course.id
  }
})}>
  Take Assessment
</Button>
```

### From Learning Page
```javascript
// When student wants to verify external certificate
<Button onClick={() => navigate('/student/assessment/platform', {
  state: {
    certificateName: training.course,
    certificateId: training.id
  }
})}>
  Verify Skills
</Button>
```

### From Dashboard
```javascript
// General assessment
<Button onClick={() => navigate('/student/assessment/platform')}>
  Start Assessment
</Button>
```

## Question Format

Each question should follow this structure:

```typescript
interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  type?: 'mcq' | 'true-false' | 'short-answer';
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  points?: number;
  timeLimit?: number;
  explanation?: string;
}
```

## Testing

To test with different certificates:

1. Navigate with certificate name:
```javascript
navigate('/student/assessment/platform', {
  state: { certificateName: 'Green Chemistry' }
});
```

2. Check console logs:
```
Loading questions for certificate: Green Chemistry, matched: green-chemistry, found 15 questions
```

3. Verify correct questions are displayed

## Files Modified

- `src/pages/student/AssessmentStart.jsx` - Added certificate name display
- `src/pages/student/AssessmentTestPage.tsx` - Added certificate-based loading
- `src/data/assessment/questions/index.ts` - Enhanced matching logic
- `src/services/certificateAssessmentService.js` - New fallback service

## Next Steps

1. **Add more question sets** for different certificates
2. **Implement database integration** for dynamic question management
3. **Add question difficulty levels** for adaptive testing
4. **Create admin interface** for managing questions
5. **Add analytics** to track which certificates need more questions
