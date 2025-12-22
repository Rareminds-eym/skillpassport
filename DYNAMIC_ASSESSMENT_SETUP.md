# Dynamic Assessment System - Setup Guide

## Overview
The dynamic assessment system generates course-specific assessments using AI based on the course name. When a student clicks the "Assessment" button on an external course, the system generates 15 questions tailored to that specific course.

## Features
- ✅ AI-powered question generation based on course name
- ✅ Supports multiple question types (MCQ, short answer, scenario-based)
- ✅ Automatic difficulty level detection (Beginner/Intermediate/Advanced)
- ✅ Real-time progress tracking
- ✅ Instant scoring and feedback
- ✅ Question caching for offline access
- ✅ Beautiful, modern UI with animations

## Files Created

### 1. Assessment Generation Service
**File:** `src/services/assessmentGenerationService.js`

This service handles:
- AI-powered question generation using OpenRouter API
- Assessment validation
- Local caching for performance
- Support for multiple AI models (Claude, GPT-4, etc.)

### 2. Dynamic Assessment Page
**File:** `src/pages/student/DynamicAssessment.jsx`

Features:
- Loading state with spinner
- Question navigation (Previous/Next)
- Progress bar
- Timer tracking
- Results screen with score
- Retake functionality

### 3. Updated Components
- **ModernLearningCard.jsx** - Updated to pass course info to assessment
- **AppRoutes.jsx** - Added route for dynamic assessment

## Setup Instructions

### Step 1: Configure API Key

Add your OpenRouter API key to `.env`:

```env
VITE_OPENROUTER_API_KEY=your_api_key_here
```

**Get your API key:**
1. Visit https://openrouter.ai/
2. Sign up or log in
3. Go to Keys section
4. Create a new API key
5. Copy and paste into `.env`

### Step 2: Install Dependencies (if needed)

The system uses existing dependencies. No additional packages required.

### Step 3: Test the System

1. Navigate to "My Learning" page
2. Click on any external course card
3. Click the "Assessment" button
4. The system will generate questions based on the course name
5. Complete the assessment and view results

## How It Works

### 1. User Flow
```
External Course Card → Click "Assessment" → 
Generate Questions (AI) → Display Questions → 
Submit Answers → Show Results
```

### 2. Question Generation
When the assessment button is clicked:
1. Course name and level are passed to the assessment page
2. System checks cache for existing assessment
3. If not cached, calls AI API to generate questions
4. Questions are validated and cached
5. Assessment is displayed to the user

### 3. Assessment Structure
```json
{
  "course": "React Development",
  "level": "Intermediate",
  "total_questions": 15,
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "difficulty": "Intermediate",
      "question": "What is the purpose of useEffect hook?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "skill_tag": "React Hooks"
    }
  ]
}
```

## Customization

### Change Number of Questions
Edit `DynamicAssessment.jsx`:
```javascript
const generated = await generateAssessment(courseName, courseLevel, 20); // Change 15 to 20
```

### Change AI Model
Edit `assessmentGenerationService.js`:
```javascript
model: 'openai/gpt-4', // or 'anthropic/claude-3.5-sonnet'
```

### Adjust Difficulty Levels
Modify the course level detection in `ModernLearningCard.jsx`:
```javascript
level: item.level || 'Beginner', // Change default level
```

### Customize Passing Score
Edit `DynamicAssessment.jsx`:
```javascript
const passed = score >= 70; // Change from 60 to 70
```

## Question Types Supported

### 1. Multiple Choice (MCQ)
- 4 options
- Single correct answer
- Most common type

### 2. Short Answer
- Text input
- Free-form response
- Evaluated by exact match

### 3. Scenario-Based
- Real-world situations
- Multiple choice format
- Tests practical application

## Caching System

Assessments are cached for 7 days to:
- Reduce API costs
- Improve performance
- Enable offline access
- Maintain consistency

**Cache location:** Browser localStorage
**Cache key format:** `assessment_{course_name}`

## Error Handling

The system handles:
- ❌ API failures → Shows error message with retry option
- ❌ Invalid responses → Validates and rejects bad data
- ❌ Network issues → Falls back to cached version
- ❌ Missing API key → Clear error message

## Cost Optimization

To minimize API costs:
1. Questions are cached for 7 days
2. Only external courses trigger generation
3. Validation prevents wasted API calls
4. Efficient prompt design reduces token usage

## Future Enhancements

Potential improvements:
- [ ] Save assessment results to database
- [ ] Track student progress over time
- [ ] Generate certificates for passing scores
- [ ] Add more question types (true/false, matching)
- [ ] Implement adaptive difficulty
- [ ] Add explanation for correct answers
- [ ] Support for multiple languages
- [ ] Integrate with learning analytics

## Troubleshooting

### Issue: "OpenRouter API key not configured"
**Solution:** Add `VITE_OPENROUTER_API_KEY` to your `.env` file

### Issue: Questions not generating
**Solution:** 
1. Check API key is valid
2. Check network connection
3. Check browser console for errors
4. Try clearing cache and regenerating

### Issue: Assessment shows old questions
**Solution:** Clear localStorage cache:
```javascript
localStorage.removeItem('assessment_course_name');
```

### Issue: Slow generation
**Solution:** 
1. Questions are cached after first generation
2. Consider using a faster AI model
3. Reduce question count if needed

## Support

For issues or questions:
1. Check browser console for errors
2. Verify API key configuration
3. Test with a simple course name first
4. Check network tab for API responses

## Summary

The dynamic assessment system provides:
- ✅ Automatic question generation
- ✅ Course-specific content
- ✅ Professional UI/UX
- ✅ Performance optimization
- ✅ Easy customization

Students can now take assessments for any external course they're learning, with questions automatically generated based on the course content!
