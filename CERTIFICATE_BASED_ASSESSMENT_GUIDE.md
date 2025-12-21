# Certificate-Based Assessment Guide

## Overview
The assessment system dynamically loads **1-15 questions** based on the certificate or course name, with configurable time limits and passing scores for each certificate.

## Key Features

✅ **Dynamic Question Count**: Each certificate can have 1-15 questions  
✅ **Custom Time Limits**: Different time limits per certificate  
✅ **Passing Score Configuration**: Set minimum passing percentage  
✅ **Difficulty Levels**: Easy, Medium, or Hard  
✅ **Smart Matching**: Automatic certificate name matching  

## How It Works

### 1. Navigation to Assessment
Pass certificate/course information when navigating:

```javascript
navigate('/student/assessment/platform', {
  state: {
    certificateName: 'JavaScript Fundamentals',
    courseId: 'js-101',
    certificateId: 'cert-123'
  }
});
```

### 2. Automatic Configuration
The system automatically:
- Matches certificate name to question set
- Applies configured question count (1-15)
- Sets appropriate time limit
- Defines passing score threshold

### 3. Example Configurations

| Certificate | Questions | Time Limit | Passing Score |
|------------|-----------|------------|---------------|
| JavaScript | 10 | 10 min | 70% |
| React | 12 | 12 min | 75% |
| Green Chemistry | 15 | 15 min | 70% |
| EV Battery | 15 | 15 min | 75% |
| Quick Check | 5 | 5 min | 60% |
| Basic Assessment | 3 | 3 min | 60% |

## Adding New Certificates

### Step 1: Add Configuration
Edit `src/data/assessment/certificateConfig.ts`:

```typescript
export const certificateConfigs: Record<string, CertificateConfig> = {
  'your-certificate': {
    name: 'Your Certificate Name',
    questionCount: 8,        // 1-15 questions
    timeLimit: 480,          // 8 minutes (in seconds)
    passingScore: 70,        // 70% to pass
    difficulty: 'medium'
  },
  // ... other configs
};
```

### Step 2: Add Questions (Optional)
If you have custom questions, create a new file:

```typescript
// src/data/assessment/questions/your-certificate.ts
export const yourCertificateQuestions: Question[] = [
  {
    id: 1,
    text: 'Your question here?',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    type: 'mcq'
  },
  // Add up to 15 questions
];
```

Then register in `index.ts`:
```typescript
import { yourCertificateQuestions } from './your-certificate';

const questionsMap: Record<string, Question[]> = {
  'your-certificate': yourCertificateQuestions,
  // ... other questions
};
```

### Step 3: Test
Navigate with your certificate name:
```javascript
navigate('/student/assessment/platform', {
  state: { certificateName: 'Your Certificate Name' }
});
```

Check console for confirmation:
```
✅ Certificate: "Your Certificate Name"
   Matched: your-certificate
   Total available: 15 questions
   Configured count: 8 questions
   Returning: 8 questions
   Time limit: 8 minutes
   Passing score: 70%
```

## Pre-configured Certificates

### Programming (10-12 questions)
- JavaScript, Python, React, Node.js

### Science (12-15 questions)
- Green Chemistry, Chemistry, Food Analysis, Organic Food

### Engineering (15 questions)
- EV Battery Management

### Data Science (15 questions)
- Data Science, Machine Learning

### Business (10-12 questions)
- Digital Marketing, Project Management

### Design (8-10 questions)
- UI/UX Design, Graphic Design

### Quick Assessments (3-5 questions)
- Quick Skills Check, Basic Assessment

## Smart Matching

The system automatically matches certificate names:

```
"JavaScript Basics" → javascript config (10 questions)
"React Hooks Course" → react config (12 questions)
"Green Chemistry 101" → green-chemistry config (15 questions)
"EV Battery Tech" → ev-battery config (15 questions)
"Quick Python Check" → python config (10 questions)
```

## Question Randomization

When a certificate has more questions than configured:
- System randomly selects the configured number
- Ensures variety across attempts
- Example: 15 available questions, config says 10 → random 10 selected

## Usage Examples

### From Course Completion
```javascript
<Button onClick={() => navigate('/student/assessment/platform', {
  state: {
    certificateName: 'JavaScript Fundamentals',
    courseId: 'js-101'
  }
})}>
  Take Final Assessment (10 questions)
</Button>
```

### Quick Skills Check
```javascript
<Button onClick={() => navigate('/student/assessment/platform', {
  state: {
    certificateName: 'Quick Check',
  }
})}>
  Quick Skills Check (5 questions)
</Button>
```

### External Certificate Verification
```javascript
<Button onClick={() => navigate('/student/assessment/platform', {
  state: {
    certificateName: training.course,
    certificateId: training.id
  }
})}>
  Verify Certificate
</Button>
```

## Console Logs

When assessment loads, you'll see:

```
✅ Certificate: "React Fundamentals"
   Matched: react
   Total available: 15 questions
   Configured count: 12 questions
   Returning: 12 questions
   Time limit: 12 minutes
   Passing score: 75%
   Difficulty: medium

📝 Assessment Configuration:
   Certificate: React Fundamentals
   Questions: 12
   Time Limit: 12 minutes
   Passing Score: 75%
   Difficulty: medium
```

## Files Structure

```
src/
├── data/
│   └── assessment/
│       ├── certificateConfig.ts      # Question counts & settings
│       └── questions/
│           ├── index.ts              # Question loading logic
│           ├── javascript.ts         # JavaScript questions
│           ├── react.ts              # React questions
│           └── ...                   # Other question files
├── pages/
│   └── student/
│       ├── AssessmentStart.jsx       # Shows certificate name
│       └── AssessmentTestPage.tsx    # Loads configured questions
└── services/
    └── certificateAssessmentService.js  # Fallback questions
```

## Best Practices

1. **Question Count**: Use 5-10 for quick checks, 10-15 for comprehensive assessments
2. **Time Limit**: Allow ~1 minute per question
3. **Passing Score**: 60-70% for basic, 75-80% for advanced
4. **Question Quality**: Ensure questions match difficulty level
5. **Testing**: Always test with console logs enabled

## Troubleshooting

**No questions loading?**
- Check certificate name spelling
- Verify config exists in `certificateConfig.ts`
- Check console logs for matching details

**Wrong number of questions?**
- Verify `questionCount` in config
- Check if enough questions exist in question file

**Time limit not working?**
- Ensure `timeLimit` is in seconds
- Check console logs for applied config
