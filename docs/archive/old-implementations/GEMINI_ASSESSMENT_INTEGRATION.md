# Gemini AI Assessment Integration

## Overview

The student assessment test at `/student/assessment/test` now integrates Google Gemini AI to analyze assessment results and provide personalized career recommendations.

## How It Works

1. **Student completes assessment** - 5 sections covering:
   - RIASEC Career Interests
   - Big Five Personality Traits
   - Work Values & Motivators
   - Employability Skills
   - Stream-specific Knowledge Test

2. **Gemini AI analyzes responses** - When the student submits:
   - All answers are sent to Gemini AI
   - Gemini calculates scores for each section
   - AI generates personalized career recommendations
   - Results include interpretation and actionable advice

3. **Results displayed** - The result page shows:
   - AI-powered insights section (when Gemini is available)
   - Detailed score breakdowns
   - Personalized career role suggestions
   - Skills to focus on
   - Custom advice based on the student's profile

## Setup

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the generated key

### 2. Configure Environment

Add to your `.env` file:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Test the Integration

1. Navigate to `http://localhost:3000/student/assessment/test`
2. Select your stream
3. Complete all assessment sections
4. Submit and view AI-analyzed results

## Features

### AI-Powered Analysis

- **RIASEC Scoring**: Calculates Holland Code with interpretation
- **Personality Analysis**: Big Five traits with work style summary
- **Work Values**: Identifies top motivators
- **Employability Assessment**: Skill readiness and improvement areas
- **Knowledge Scoring**: Accurate scoring with topic analysis

### Career Recommendations

- Primary and secondary career clusters with match scores
- 5 suggested career roles based on profile
- Skills to focus on for career growth
- Personalized advice tailored to the student

### Fallback Support

If Gemini API is unavailable:
- Local calculation algorithms are used
- All core functionality remains available
- Results are still accurate (without AI insights)

## Files Modified/Created

- `src/services/geminiAssessmentService.js` - New Gemini integration service
- `src/pages/student/AssessmentTest.jsx` - Updated to call Gemini on submit
- `src/pages/student/AssessmentResult.jsx` - Updated to display AI insights

## API Usage

The integration uses `gemini-1.5-flash` model with:
- Temperature: 0.7
- Max tokens: 4096
- Structured JSON output

## Cost Considerations

- Gemini 1.5 Flash has a generous free tier
- Each assessment analysis uses ~2000-3000 tokens
- Monitor usage in Google AI Studio dashboard
