# Dynamic Assessment - Quick Start

## What Changed?

Your assessment UI now generates questions dynamically based on the course name instead of using hardcoded questions.

## 3 Simple Steps to Use

### 1. Add API Key
Create or update `.env` file:
```env
VITE_OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Get your key from: https://openrouter.ai/keys

### 2. Test It
1. Go to "My Learning" page
2. Click "Assessment" button on any external course
3. Questions will be generated automatically
4. Complete the assessment

### 3. Customize (Optional)
Edit these values in `DynamicAssessment.jsx`:
- Question count: Line 51 (default: 15)
- Passing score: Line 186 (default: 60%)
- Time limit: Add if needed

## How It Works

```
Course: "React Development"
    ↓
AI generates 15 questions about React
    ↓
Student takes assessment
    ↓
Instant results with score
```

## Key Features

✅ **Smart Generation** - Questions match the course content
✅ **Fast** - Cached for 7 days after first generation  
✅ **Beautiful UI** - Modern design with animations
✅ **Instant Feedback** - See results immediately
✅ **Retake Option** - Students can retake anytime

## Example Output

For course "Python Programming":
- 15 questions about Python
- Mix of MCQ and short answer
- Covers fundamentals to advanced topics
- Skill tags for each question
- Real-world scenarios

## Files Modified

1. ✅ `src/services/assessmentGenerationService.js` - NEW
2. ✅ `src/pages/student/DynamicAssessment.jsx` - NEW
3. ✅ `src/components/Students/components/ModernLearningCard.jsx` - UPDATED
4. ✅ `src/routes/AppRoutes.jsx` - UPDATED

## That's It!

Your assessment system is ready. Students can now take course-specific assessments with AI-generated questions.

## Need Help?

Check `DYNAMIC_ASSESSMENT_SETUP.md` for detailed documentation.
